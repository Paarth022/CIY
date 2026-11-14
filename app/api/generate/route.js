import { getGenerationPrompt, formatZipContext } from '@/lib/masterPrompts';
import { AI_PROVIDERS, ALLOWED_VERSIONS, ALLOWED_COMPLEXITY } from '@/lib/providers';
import { sanitizeZipFiles } from '@/lib/server/zipSanitizer';
import { callAI, pickKeyFor } from '@/lib/server/aiClient';
import { limit } from '@/lib/server/rateLimit';
import { applyIPGuard } from '@/lib/server/routeGuard';
import { captureServerError } from '@/lib/server/sentry';
import {
  verifyToken, signToken, spendCredit, availableCredits,
  toClientUsage, COMPLEXITY_TO_TIER,
} from '@/lib/server/session';
import { applyWatermarks } from '@/lib/server/watermarker';
import { parseGeneratedCode } from '@/lib/server/parseGeneratedCode';

// ── Request limits ──
const MAX_DESCRIPTION_LEN = 5000;   // client caps at 2000; server guards.
const ALLOWED_VERSIONS_SET = new Set(ALLOWED_VERSIONS);
const ALLOWED_COMPLEXITY_SET = new Set(ALLOWED_COMPLEXITY);

export async function POST(req) {
  try {
    const guard = await applyIPGuard(req, 'generate:ip', { max: 3, windowMs: 60_000 });
    if (guard) return guard;

    let body;
    try { body = await req.json(); }
    catch { return Response.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 }); }
    if (!body || typeof body !== 'object') {
      return Response.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
    }

    const { description, version, complexity, provider, token, files: zipFiles } = body;

    if (typeof description !== 'string' || typeof provider !== 'string' || typeof token !== 'string') {
      return Response.json({ success: false, error: 'Missing or invalid required fields.' }, { status: 400 });
    }
    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      return Response.json({ success: false, error: 'Description is required.' }, { status: 400 });
    }
    if (trimmedDesc.length > MAX_DESCRIPTION_LEN) {
      return Response.json({ success: false, error: 'Description is too long.' }, { status: 400 });
    }

    // Verify the signed session token — authoritative source of credits.
    let payload;
    try { payload = verifyToken(token); }
    catch {
      return Response.json(
        { success: false, error: 'Your session expired — please sign in again.', code: 'session_expired' },
        { status: 401 }
      );
    }

    // Per-user rate limits (stacked on per-IP) — stops session-token sharing.
    const userMin  = await limit('generate:uid:min',  payload.uid, { windowMs: 60_000,    max: 5  });
    if (!userMin.ok)  return Response.json({ success: false, error: 'Slow down — 5 generations per minute max.' }, { status: 429 });
    const userHour = await limit('generate:uid:hour', payload.uid, { windowMs: 3_600_000, max: 60 });
    if (!userHour.ok) return Response.json({ success: false, error: 'Hourly generation limit reached.' }, { status: 429 });

    const safeVersion    = ALLOWED_VERSIONS_SET.has(version)      ? version    : '1.21.4';
    const safeComplexity = ALLOWED_COMPLEXITY_SET.has(complexity) ? complexity : 'Medium';
    const tier           = COMPLEXITY_TO_TIER[safeComplexity] || 'normal';

    if (availableCredits(payload, tier) <= 0) {
      return Response.json(
        { success: false, error: `No ${tier} credits remaining. Upgrade your plan or buy a pack.`, code: 'no_credits' },
        { status: 402 }
      );
    }

    const provConfig = AI_PROVIDERS.find(p => p.id === provider);
    if (!provConfig) {
      return Response.json({ success: false, error: 'Invalid AI provider selected.' }, { status: 400 });
    }

    const key = pickKeyFor(provider);
    if (!key) {
      return Response.json(
        { success: false, error: 'This AI provider is not available right now. Try another.' },
        { status: 503 }
      );
    }

    let cleanZip = null;
    try {
      cleanZip = sanitizeZipFiles(zipFiles);
    } catch (err) {
      if (err.message && err.message.startsWith('INVALID_ZIP:')) {
        return Response.json({ success: false, error: err.message.replace('INVALID_ZIP: ', '') }, { status: 400 });
      }
    }
    const zipContext  = cleanZip ? formatZipContext(cleanZip) : '';
    const { cached: systemCached, dynamic: systemDynamic } =
      getGenerationPrompt(safeVersion, safeComplexity, trimmedDesc, zipContext);

    const aiResult = await callAI({
      provider,
      providerKey:  key,
      tier,
      systemCached,
      systemDynamic,
      userMessage:  'Generate the requested plugin.',
    });
    const generatedText = aiResult.text;

    let { files, pluginName } = parseGeneratedCode(generatedText || '');

    if (Object.keys(files).length === 0) {
      // No credit spent if the model fails to produce usable output.
      return Response.json(
        { success: false, error: 'AI did not generate files in the expected format. Please try again.' },
        { status: 502 }
      );
    }

    // Apply watermarks for non-Master plan users
    files = applyWatermarks(files, payload.plan);

    // Spend exactly one credit for the tier used, re-sign, and return.
    const nextPayload = spendCredit(payload, tier);
    const newToken    = signToken(nextPayload);

    return Response.json({
      success: true,
      data:    { files, pluginName },
      token:   newToken,
      usage:   toClientUsage(nextPayload),
      meta: {
        provider:    aiResult.provider,
        model:       aiResult.model,
        rounds:      aiResult.rounds,
        truncated:   aiResult.truncated,
      },
    });

  } catch (error) {
    captureServerError(error, { where: 'generate:post' });
    // Return a generic error — don't leak provider-specific status codes.
    return Response.json(
      { success: false, error: 'Generation failed. Please try again.' },
      { status: 500 }
    );
  }
}
