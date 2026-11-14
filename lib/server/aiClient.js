// Unified AI provider call with tier-mapped models, prompt caching, truncation-aware
// continuation, automatic provider failover, and token/cost telemetry.

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { resolveModel, TIER_LIMITS } from '@/lib/providers';

const CONTINUE_PROMPT =
  'Continue from EXACTLY where you stopped. ' +
  'No preamble, no recap, no summary, no markdown fence wrappers. ' +
  'Resume the very next character and finish the remaining files in the exact same === FILE === / === END === format.';

// Per-1M-token USD pricing for cost transparency. Approximate; update as providers change rates.
// [inputPerMTok, cachedInputPerMTok, outputPerMTok]
const PRICING = {
  'gemini-2.5-flash-lite':       [0.10,  0.025, 0.40],
  'gemini-2.5-flash':            [0.30,  0.075, 2.50],
  'gemini-2.5-pro':              [1.25,  0.31,  10.00],
  'claude-haiku-4-5-20251001':   [1.00,  0.10,  5.00],
  'claude-opus-4-7':             [15.00, 1.50,  75.00],
  'gpt-4o-mini':                 [0.15,  0.075, 0.60],
  'gpt-4o':                      [2.50,  1.25,  10.00],
  'hybrid-orchestrator':         [2.50,  1.25,  12.00],
};

function estimateCostUsd(model, inputTokens = 0, cachedTokens = 0, outputTokens = 0) {
  const p = PRICING[model];
  if (!p) return null;
  const [inP, cachedP, outP] = p;
  const billedInput = Math.max(0, inputTokens - cachedTokens);
  const cost = (billedInput * inP + cachedTokens * cachedP + outputTokens * outP) / 1_000_000;
  return Math.round(cost * 100000) / 100000; // 5dp USD
}

// Failover order: if primary errors with a transient/server-side issue, try these next.
// Always pick the OTHER providers' cheapest tier as fallback to keep cost in check.
const FAILOVER_CHAIN = {
  gemini: ['claude', 'openai'],
  claude: ['gemini', 'openai'],
  openai: ['gemini', 'claude'],
  hybrid: ['gemini', 'openai'],
};

function isRetryableProviderError(err) {
  const status = err?.status || err?.response?.status;
  if (status === 429 || (status >= 500 && status < 600)) return true;
  // network / DNS / abort
  if (err?.code === 'ECONNRESET' || err?.code === 'ETIMEDOUT' || err?.code === 'ENOTFOUND') return true;
  if (/fetch failed|network|timeout|ECONNREFUSED/i.test(err?.message || '')) return true;
  return false;
}

export function pickKeyFor(provider) {
  if (provider === 'gemini') return process.env.GEMINI_API_KEY;
  if (provider === 'claude') return process.env.ANTHROPIC_API_KEY;
  if (provider === 'openai') return process.env.OPENAI_API_KEY;
  return null;
}

let _openai = null;
let _anthropic = null;

function getOpenAI(key) {
  if (!_openai || _openai.apiKey !== key) {
    _openai = new OpenAI({ apiKey: key });
  }
  return _openai;
}

function getAnthropic(key) {
  if (!_anthropic || _anthropic.apiKey !== key) {
    _anthropic = new Anthropic({ apiKey: key });
  }
  return _anthropic;
}

// Single attempt against ONE provider (with internal continuation loop).
// Returns { text, rounds, truncated, model, usage, costUsd } or throws.
async function attemptProvider({ provider, providerKey, tier, systemCached, systemDynamic, userMessage }) {
  const model   = resolveModel(provider, tier);
  const limits  = TIER_LIMITS[tier] || TIER_LIMITS.normal;
  const maxTok  = limits.maxTokens;
  const maxCont = limits.maxContinuations;

  if (!model)       throw new Error(`No model configured for provider=${provider} tier=${tier}`);
  if (!providerKey) throw new Error(`Missing API key for provider=${provider}`);

  const fullSystem = [systemCached, systemDynamic].filter(Boolean).join('\n\n');

  let combined   = '';
  let rounds     = 0;
  let truncated  = false;
  let priorTurns = [];

  // Aggregate token usage across continuation rounds.
  const usage = { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0 };

  for (let round = 0; round <= maxCont; round++) {
    rounds++;
    const isContinuation = round > 0;
    const turnUserMsg    = isContinuation ? CONTINUE_PROMPT : userMessage;

    let chunk = '';
    let hitLimit = false;

    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(providerKey);
      const gModel = genAI.getGenerativeModel({
        model,
        systemInstruction: fullSystem,
        generationConfig: { maxOutputTokens: maxTok },
      });
      let result;
      if (isContinuation) {
        const chat = gModel.startChat({
          history: priorTurns.map(t => ({
            role: t.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: t.content }],
          })),
        });
        result = await chat.sendMessage(turnUserMsg);
      } else {
        result = await gModel.generateContent(turnUserMsg);
      }
      chunk    = result.response.text() || '';
      hitLimit = result.response.candidates?.[0]?.finishReason === 'MAX_TOKENS';

      const um = result.response.usageMetadata || {};
      usage.inputTokens       += um.promptTokenCount       || 0;
      usage.cachedInputTokens += um.cachedContentTokenCount || 0;
      usage.outputTokens      += um.candidatesTokenCount    || 0;

    } else if (provider === 'claude') {
      const anthropic = getAnthropic(providerKey);
      const systemBlocks = [];
      if (systemCached)  systemBlocks.push({ type: 'text', text: systemCached, cache_control: { type: 'ephemeral' } });
      if (systemDynamic) systemBlocks.push({ type: 'text', text: systemDynamic });
      const messages = isContinuation
        ? [...priorTurns, { role: 'user', content: turnUserMsg }]
        : [{ role: 'user', content: turnUserMsg }];
      const response = await anthropic.messages.create({
        model,
        max_tokens: maxTok,
        system: systemBlocks.length ? systemBlocks : fullSystem,
        messages,
      });
      chunk    = response.content?.[0]?.text || '';
      hitLimit = response.stop_reason === 'max_tokens';

      const u = response.usage || {};
      usage.inputTokens       += u.input_tokens                  || 0;
      usage.cachedInputTokens += u.cache_read_input_tokens       || 0;
      usage.outputTokens      += u.output_tokens                 || 0;

    } else if (provider === 'openai') {
      const openai = getOpenAI(providerKey);
      const messages = isContinuation
        ? [{ role: 'system', content: fullSystem }, ...priorTurns, { role: 'user', content: turnUserMsg }]
        : [{ role: 'system', content: fullSystem }, { role: 'user', content: turnUserMsg }];
      const response = await openai.chat.completions.create({
        model,
        max_tokens: maxTok,
        messages,
      });
      chunk    = response.choices?.[0]?.message?.content || '';
      hitLimit = response.choices?.[0]?.finish_reason === 'length';

      const u = response.usage || {};
      usage.inputTokens       += u.prompt_tokens                                  || 0;
      usage.cachedInputTokens += u.prompt_tokens_details?.cached_tokens           || 0;
      usage.outputTokens      += u.completion_tokens                              || 0;
    } else if (provider === 'hybrid') {
      const claudeKey = pickKeyFor('claude');
      const geminiKey = pickKeyFor('gemini');
      const openaiKey = pickKeyFor('openai');
      if (!claudeKey || !geminiKey || !openaiKey) {
        throw new Error('API keys for Claude, Gemini, and OpenAI (ChatGPT) are required to run the CIY Hybrid OmniAgent.');
      }

      // Phase 1: Claude (Architect) Plan
      const anthropic = getAnthropic(claudeKey);
      const planModel = tier === 'advanced' ? 'claude-opus-4-7' : 'claude-haiku-4-5-20251001';
      const planResponse = await anthropic.messages.create({
        model: planModel,
        max_tokens: 1500,
        system: "You are the CIY Senior Architect. Your task is to draft a comprehensive, step-by-step technical architecture plan for the requested Paper Minecraft plugin. List the package structure, files, managers, database layout, and listeners. Be extremely structured and brief. Write purely architectural plans.",
        messages: [{ role: 'user', content: turnUserMsg }]
      });
      const blueprint = planResponse.content?.[0]?.text || '';
      usage.inputTokens  += planResponse.usage?.input_tokens || 0;
      usage.outputTokens += planResponse.usage?.output_tokens || 0;

      // Phase 2: ChatGPT (Quality Auditor) Refinement
      const openai = getOpenAI(openaiKey);
      const auditModel = tier === 'advanced' ? 'gpt-4o' : 'gpt-4o-mini';
      const auditResponse = await openai.chat.completions.create({
        model: auditModel,
        max_tokens: 1500,
        messages: [
          { role: 'system', content: 'You are the CIY Senior Quality Auditor. Review the Minecraft plugin architecture plan drafted by the Architect (Claude). Refine it by adding strict thread safety recommendations (async task schedules), null-safety assertions (preventing NPEs on ItemMeta/CommandSender), and optimizing event handling priorities. Output the updated final architecture plan.' },
          { role: 'user', content: `[ARCHITECT PLAN]:\n${blueprint}` }
        ]
      });
      const auditedBlueprint = auditResponse.choices?.[0]?.message?.content || blueprint;
      usage.inputTokens  += auditResponse.usage?.prompt_tokens || 0;
      usage.outputTokens += auditResponse.usage?.completion_tokens || 0;

      // Phase 3: Gemini (Builder) writes code
      const genAI = new GoogleGenerativeAI(geminiKey);
      const writeModel = tier === 'advanced' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
      const gModel = genAI.getGenerativeModel({
        model: writeModel,
        systemInstruction: fullSystem + `\n\n[AUDITED SENIOR ARCHITECT BLUEPRINT]:\n${auditedBlueprint}\n\nStrictly implement all requested structures and classes listed in the architect blueprint above using our file output standard.`,
        generationConfig: { maxOutputTokens: maxTok },
      });
      const result = await gModel.generateContent(turnUserMsg);
      const codeText = result.response.text() || '';
      hitLimit = result.response.candidates?.[0]?.finishReason === 'MAX_TOKENS';

      const um = result.response.usageMetadata || {};
      usage.inputTokens       += um.promptTokenCount       || 0;
      usage.cachedInputTokens += um.cachedContentTokenCount || 0;
      usage.outputTokens      += um.candidatesTokenCount    || 0;

      chunk = `=== OMNIAGENT_PLAN.md ===\n${auditedBlueprint}\n=== END ===\n\n` + codeText;
    } else {
      throw new Error(`Unknown provider: ${provider}`);
    }

    combined += chunk;

    if (!hitLimit) { truncated = false; break; }
    if (round === maxCont) { truncated = true; break; }
    priorTurns = [
      ...priorTurns,
      { role: 'user',      content: turnUserMsg },
      { role: 'assistant', content: chunk },
    ];
  }

  const costUsd = estimateCostUsd(model, usage.inputTokens, usage.cachedInputTokens, usage.outputTokens);

  return { text: combined, rounds, truncated, model, usage, costUsd };
}

// Public entry. Tries the requested provider; on transient failure, walks the failover chain
// (other providers' NORMAL tier — cheapest fallback that still produces valid output).
//
// Returns:
//   { text, rounds, truncated, model, usage, costUsd, provider, failover }
//   - provider: which provider actually produced the output
//   - failover: array of { provider, model, error } for any failed attempts before success
export async function callAI({
  provider,
  providerKey,
  tier = 'normal',
  systemCached = '',
  systemDynamic = '',
  userMessage,
}) {
  const failover = [];

  // Attempt 1 — requested provider at requested tier.
  try {
    const result = await attemptProvider({
      provider, providerKey, tier, systemCached, systemDynamic, userMessage,
    });
    return { ...result, provider, failover };
  } catch (err) {
    if (!isRetryableProviderError(err)) throw err;
    failover.push({
      provider,
      model: resolveModel(provider, tier),
      error: err?.message?.slice(0, 200) || 'unknown',
    });
  }

  // Failover chain — always at 'normal' tier (cheapest model per provider).
  for (const fbProvider of FAILOVER_CHAIN[provider] || []) {
    const fbKey = pickKeyFor(fbProvider);
    if (!fbKey) continue; // missing API key → skip this provider
    try {
      const result = await attemptProvider({
        provider:      fbProvider,
        providerKey:   fbKey,
        tier:          'normal',
        systemCached,
        systemDynamic,
        userMessage,
      });
      return { ...result, provider: fbProvider, failover };
    } catch (err) {
      failover.push({
        provider: fbProvider,
        model:    resolveModel(fbProvider, 'normal'),
        error:    err?.message?.slice(0, 200) || 'unknown',
      });
      if (!isRetryableProviderError(err)) break; // hard error on fallback — give up
    }
  }

  // All providers exhausted.
  const lastErr = new Error('All AI providers failed. Please try again in a moment.');
  lastErr.status = 503;
  lastErr.failover = failover;
  throw lastErr;
}

// ─────────────────────────────────────────────────────────────────────────────
// STREAMING VARIANT
// ─────────────────────────────────────────────────────────────────────────────
// callAIStream is an async generator that yields token chunks as they arrive,
// then returns the full aggregated result via the generator's .return value.
// Usage:
//   const gen = callAIStream({...});
//   for await (const chunk of gen) { /* forward chunk.text */ }
//   const final = gen.return();  // NOTE: the generator returns metadata at the end
//
// Because for-await consumes the return value internally, this helper uses a
// sentinel: it yields { done: false, text } chunks and a single final
// { done: true, meta } yield before the generator completes. Consumers should
// break on done:true and use the meta payload.
//
// Continuation is disabled in streaming mode — streaming is meant for the
// one-shot happy path; if the response truncates the client can regenerate.
// Failover IS still applied on the initial connect attempt (once we've started
// yielding chunks, switching providers mid-stream is not possible).
export async function* callAIStream({
  provider,
  providerKey,
  tier = 'normal',
  systemCached = '',
  systemDynamic = '',
  userMessage,
}) {
  const failover = [];

  // Pick a provider (with failover chain for the initial connect).
  const candidates = [
    { p: provider,                    key: providerKey,        tier },
    ...FAILOVER_CHAIN[provider].map(p => ({ p, key: pickKeyFor(p), tier: 'normal' })),
  ].filter(c => !!c.key);

  let lastError;
  for (const cand of candidates) {
    try {
      yield* streamOneProvider({
        provider:     cand.p,
        providerKey:  cand.key,
        tier:         cand.tier,
        systemCached,
        systemDynamic,
        userMessage,
        failover,
      });
      return;
    } catch (err) {
      lastError = err;
      failover.push({
        provider: cand.p,
        model:    resolveModel(cand.p, cand.tier),
        error:    err?.message?.slice(0, 200) || 'unknown',
      });
      if (!isRetryableProviderError(err)) break;
    }
  }

  const final = new Error('All AI providers failed to start streaming.');
  final.status  = 503;
  final.failover = failover;
  if (lastError?.message) final.cause = lastError.message;
  throw final;
}

async function* streamOneProvider({
  provider, providerKey, tier, systemCached, systemDynamic, userMessage, failover,
}) {
  const model  = resolveModel(provider, tier);
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.normal;
  const maxTok = limits.maxTokens;
  const fullSystem = [systemCached, systemDynamic].filter(Boolean).join('\n\n');

  let combined  = '';
  const usage   = { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0 };
  let truncated = false;

  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(providerKey);
    const gModel = genAI.getGenerativeModel({
      model,
      systemInstruction: fullSystem,
      generationConfig: { maxOutputTokens: maxTok },
    });
    const result = await gModel.generateContentStream(userMessage);
    for await (const chunk of result.stream) {
      const text = chunk.text?.() || '';
      if (text) { combined += text; yield { done: false, text }; }
    }
    const agg = await result.response;
    truncated = agg.candidates?.[0]?.finishReason === 'MAX_TOKENS';
    const um = agg.usageMetadata || {};
    usage.inputTokens       = um.promptTokenCount        || 0;
    usage.cachedInputTokens = um.cachedContentTokenCount || 0;
    usage.outputTokens      = um.candidatesTokenCount    || 0;

  } else if (provider === 'claude') {
    const anthropic = getAnthropic(providerKey);
    const systemBlocks = [];
    if (systemCached)  systemBlocks.push({ type: 'text', text: systemCached, cache_control: { type: 'ephemeral' } });
    if (systemDynamic) systemBlocks.push({ type: 'text', text: systemDynamic });
    const stream = await anthropic.messages.stream({
      model,
      max_tokens: maxTok,
      system: systemBlocks.length ? systemBlocks : fullSystem,
      messages: [{ role: 'user', content: userMessage }],
    });
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        const t = event.delta.text || '';
        if (t) { combined += t; yield { done: false, text: t }; }
      }
    }
    const final = await stream.finalMessage();
    truncated = final.stop_reason === 'max_tokens';
    const u = final.usage || {};
    usage.inputTokens       = u.input_tokens            || 0;
    usage.cachedInputTokens = u.cache_read_input_tokens || 0;
    usage.outputTokens      = u.output_tokens           || 0;

  } else if (provider === 'openai') {
    const openai = getOpenAI(providerKey);
    const stream = await openai.chat.completions.create({
      model,
      max_tokens: maxTok,
      stream: true,
      stream_options: { include_usage: true },
      messages: [
        { role: 'system', content: fullSystem },
        { role: 'user',   content: userMessage },
      ],
    });
    let finishReason;
    for await (const part of stream) {
      const choice = part.choices?.[0];
      const t = choice?.delta?.content || '';
      if (t) { combined += t; yield { done: false, text: t }; }
      if (choice?.finish_reason) finishReason = choice.finish_reason;
      if (part.usage) {
        usage.inputTokens       = part.usage.prompt_tokens                                || 0;
        usage.cachedInputTokens = part.usage.prompt_tokens_details?.cached_tokens         || 0;
        usage.outputTokens      = part.usage.completion_tokens                            || 0;
      }
    }
    truncated = finishReason === 'length';
  } else if (provider === 'hybrid') {
    const claudeKey = pickKeyFor('claude');
    const geminiKey = pickKeyFor('gemini');
    const openaiKey = pickKeyFor('openai');
    if (!claudeKey || !geminiKey || !openaiKey) {
      throw new Error('API keys for Claude, Gemini, and OpenAI (ChatGPT) are required to run the CIY Hybrid OmniAgent.');
    }

    // Yield initial info chunk
    yield { done: false, text: "=== OMNIAGENT_PLAN.md ===\n[CIY OMNIAGENT] Initializing Phase 1: Claude is drafting architecture blueprints...\n" };

    // Phase 1: Claude plans
    const anthropic = getAnthropic(claudeKey);
    const planModel = tier === 'advanced' ? 'claude-opus-4-7' : 'claude-haiku-4-5-20251001';
    const planResponse = await anthropic.messages.create({
      model: planModel,
      max_tokens: 1500,
      system: "You are the CIY Senior Architect. Your task is to draft a comprehensive, step-by-step technical architecture plan for the requested Paper Minecraft plugin. List the package structure, files, managers, database layout, and listeners. Be extremely structured and brief. Write purely architectural plans.",
      messages: [{ role: 'user', content: userMessage }]
    });
    const blueprint = planResponse.content?.[0]?.text || '';
    usage.inputTokens  += planResponse.usage?.input_tokens || 0;
    usage.outputTokens += planResponse.usage?.output_tokens || 0;

    // Yield intermediate status and notify user about Phase 2 audit starting
    yield { 
      done: false, 
      text: `\r=== OMNIAGENT_PLAN.md ===\n${blueprint}\n=== END ===\n\n` +
            `[CIY OMNIAGENT] Initializing Phase 2: ChatGPT is auditing & refining blueprints...\n`
    };

    // Phase 2: ChatGPT audits plans
    const openai = getOpenAI(openaiKey);
    const auditModel = tier === 'advanced' ? 'gpt-4o' : 'gpt-4o-mini';
    const auditResponse = await openai.chat.completions.create({
      model: auditModel,
      max_tokens: 1500,
      messages: [
        { role: 'system', content: 'You are the CIY Senior Quality Auditor. Review the Minecraft plugin architecture plan drafted by the Architect (Claude). Refine it by adding strict thread safety recommendations (async task schedules), null-safety assertions (preventing NPEs on ItemMeta/CommandSender), and optimizing event handling priorities. Output the updated final architecture plan.' },
        { role: 'user', content: `[ARCHITECT PLAN]:\n${blueprint}` }
      ]
    });
    const auditedBlueprint = auditResponse.choices?.[0]?.message?.content || blueprint;
    usage.inputTokens  += auditResponse.usage?.prompt_tokens || 0;
    usage.outputTokens += auditResponse.usage?.completion_tokens || 0;

    // Yield final audited blueprint and notify user about Phase 3 compile starting
    yield { 
      done: false, 
      text: `\r=== OMNIAGENT_PLAN.md ===\n${auditedBlueprint}\n=== END ===\n\n` +
            `[CIY OMNIAGENT] Initializing Phase 3: Gemini Pro is compiling Java resources...\n`
    };

    // Phase 3: Gemini streams code
    const genAI = new GoogleGenerativeAI(geminiKey);
    const writeModel = tier === 'advanced' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    const gModel = genAI.getGenerativeModel({
      model: writeModel,
      systemInstruction: fullSystem + `\n\n[AUDITED SENIOR ARCHITECT BLUEPRINT]:\n${auditedBlueprint}\n\nStrictly implement all requested structures and classes listed in the architect blueprint above using our file output standard.`,
      generationConfig: { maxOutputTokens: maxTok },
    });
    const result = await gModel.generateContentStream(userMessage);
    for await (const chunk of result.stream) {
      const text = chunk.text?.() || '';
      if (text) { combined += text; yield { done: false, text }; }
    }
    const agg = await result.response;
    truncated = agg.candidates?.[0]?.finishReason === 'MAX_TOKENS';
    const um = agg.usageMetadata || {};
    usage.inputTokens       += um.promptTokenCount        || 0;
    usage.cachedInputTokens += um.cachedContentTokenCount || 0;
    usage.outputTokens      += um.candidatesTokenCount    || 0;
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }

  const costUsd = estimateCostUsd(model, usage.inputTokens, usage.cachedInputTokens, usage.outputTokens);

  yield {
    done: true,
    meta: {
      text: combined,
      provider, model,
      rounds: 1,
      truncated,
      usage,
      costUsd,
      failover,
    },
  };
}
