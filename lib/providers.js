export const AI_PROVIDERS = [
  {
    id: "gemini",
    name: "Google Gemini",
    model: "gemini-2.5-pro",       // flagship — Advanced tier actually uses this
    description: "Flash for Simple, Pro for Advanced",
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    model: "claude-opus-4-7",      // flagship — Advanced tier
    description: "Haiku for Simple, Opus 4.7 for Advanced",
  },
  {
    id: "openai",
    name: "OpenAI ChatGPT",
    model: "gpt-4o",               // flagship — Advanced tier
    description: "4o-mini for Simple, 4o for Advanced",
  },
  {
    id: "hybrid",
    name: "⚡ CIY OmniAgent (Hybrid Engine)",
    model: "hybrid-orchestrator",
    description: "Multi-Agent: Claude Architect drafts blueprints, Gemini Pro writes code.",
    premiumOnly: true
  }
];

// Tier → concrete model ID per provider family.
// Simple/Medium use cheap models to fit the monthly budget; Advanced unlocks flagship.
export const MODEL_BY_TIER = {
  gemini: {
    normal:   'gemini-2.5-flash-lite',
    medium:   'gemini-2.5-flash',
    advanced: 'gemini-2.5-pro',
  },
  claude: {
    normal:   'claude-haiku-4-5-20251001',
    medium:   'claude-haiku-4-5-20251001',
    advanced: 'claude-opus-4-7',
  },
  openai: {
    normal:   'gpt-4o-mini',
    medium:   'gpt-4o-mini',
    advanced: 'gpt-4o',
  },
  hybrid: {
    normal:   'hybrid-orchestrator',
    medium:   'hybrid-orchestrator',
    advanced: 'hybrid-orchestrator',
  },
};

export function resolveModel(providerId, tier = 'normal') {
  return MODEL_BY_TIER[providerId]?.[tier] || MODEL_BY_TIER[providerId]?.normal || null;
}

// Per-tier generation limits. Simple stays cheap, Advanced unlocks continuation.
export const TIER_LIMITS = {
  normal:   { maxTokens: 4_000,  maxContinuations: 0 },
  medium:   { maxTokens: 8_000,  maxContinuations: 1 },
  advanced: { maxTokens: 16_000, maxContinuations: 3 },
};

export const getDefaultProvider = () => AI_PROVIDERS[0];

export const ALLOWED_VERSIONS = ['1.21.4', '1.21', '1.20.6', '1.20.4', '1.20.1', '1.19.4'];
export const ALLOWED_COMPLEXITY = ['Simple', 'Medium', 'Advanced'];

