// ══════════════════════════════════════════════════════════
// PLANS, PASSES & ENTITLEMENTS
// Tiers: normal (simple), medium, advanced
// ══════════════════════════════════════════════════════════

export const TIERS = {
  normal:   { id: 'normal',   label: 'Normal',   color: 'text-emerald-400', badge: 'rarity-common',    glow: 'glow-green'  },
  medium:   { id: 'medium',   label: 'Medium',   color: 'text-blue-400',    badge: 'rarity-rare',      glow: 'glow-blue'   },
  advanced: { id: 'advanced', label: 'Advanced', color: 'text-amber-400',   badge: 'rarity-legendary', glow: 'glow-gold'   },
};

// Maps the "complexity" picker on /create → a tier
export const COMPLEXITY_TO_TIER = {
  Simple:   'normal',
  Medium:   'medium',
  Advanced: 'advanced',
};

// ── MONTHLY SUBSCRIPTION PLANS ──
export const PLANS = [
  {
    id: 'free',
    name: 'Free Trial',
    tagline: 'Try it out',
    price: 0,
    interval: null,
    rarity: 'rarity-common',
    glow: 'glow-green',
    badge: null,
    credits: { normal: 1, medium: 0, advanced: 0 },
    features: [
      '1 Normal plugin (one-time)',
      'All AI providers unlocked',
      'Full ZIP download',
      'No credit card needed',
    ],
    locked: ['Medium tier', 'Advanced tier', 'Priority queue'],
    cta: 'Start Free',
  },
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For hobbyists',
    price: 9,
    interval: 'mo',
    rarity: 'rarity-rare',
    glow: 'glow-blue',
    badge: null,
    credits: { normal: 10, medium: 0, advanced: 0 },
    features: [
      '10 Normal plugins / month',
      'All AI providers',
      'Full ZIP download',
      'Cancel anytime',
    ],
    locked: ['Medium tier', 'Advanced tier'],
    cta: 'Get Starter',
  },
  {
    id: 'crafter',
    name: 'Crafter',
    tagline: 'Most popular',
    price: 19,
    interval: 'mo',
    rarity: 'rarity-epic',
    glow: 'glow-purple',
    badge: 'POPULAR',
    credits: { normal: 15, medium: 5, advanced: 0 },
    features: [
      '5 Medium plugins / month',
      '15 Normal plugins / month',
      'Priority AI queue',
      'Advanced prompt library',
    ],
    locked: ['Advanced tier'],
    cta: 'Get Crafter',
  },
  {
    id: 'master',
    name: 'Master',
    tagline: 'Unlimited power',
    price: 39,
    interval: 'mo',
    rarity: 'rarity-legendary',
    glow: 'glow-gold',
    badge: 'BEST VALUE',
    credits: { normal: -1, medium: 10, advanced: 3 }, // -1 = unlimited
    features: [
      '3 Advanced plugins / month',
      '10 Medium plugins / month',
      'Unlimited Normal plugins',
      'Priority AI queue',
      'Early access to new features',
      'Discord VIP role',
    ],
    locked: [],
    cta: 'Get Master',
  },
];

// ── ONE-TIME PASSES ──
// Purchased credits that never expire. Stack with plan credits.
export const PASSES = [
  {
    id: 'pass-normal',
    name: 'Normal Pack',
    tagline: 'Pay once, craft 5',
    price: 5,
    rarity: 'rarity-common',
    glow: 'glow-green',
    tier: 'normal',
    credits: { normal: 5, medium: 0, advanced: 0 },
    features: ['5 Normal plugin credits', 'Never expires', 'Stack with any plan'],
    cta: 'Buy Normal Pack',
  },
  {
    id: 'pass-medium',
    name: 'Medium Pack',
    tagline: 'For real projects',
    price: 12,
    rarity: 'rarity-rare',
    glow: 'glow-blue',
    tier: 'medium',
    credits: { normal: 0, medium: 3, advanced: 0 },
    features: ['3 Medium plugin credits', 'Never expires', 'Stack with any plan'],
    cta: 'Buy Medium Pack',
  },
  {
    id: 'pass-advanced',
    name: 'Advanced Pack',
    tagline: 'Maximum craftsmanship',
    price: 20,
    rarity: 'rarity-legendary',
    glow: 'glow-gold',
    tier: 'advanced',
    credits: { normal: 0, medium: 0, advanced: 2 },
    features: ['2 Advanced plugin credits', 'Never expires', 'Stack with any plan'],
    cta: 'Buy Advanced Pack',
  },
];

export const getPlanById = (id) => PLANS.find(p => p.id === id) || PLANS[0];
export const getPassById = (id) => PASSES.find(p => p.id === id);
