// Server-only. The token below is the authoritative record of a user's plan
// and remaining credits. Signed with HMAC-SHA256 + CIY_SESSION_SECRET so a
// client can decode (for display) but cannot forge or tamper with credits.

import crypto from 'node:crypto';
import { getPlanById, getPassById } from '@/lib/plans';

const VERSION      = 1;
const MAX_AGE_SECS = 60 * 60 * 24 * 7;         // 7 days
const TIERS        = ['normal', 'medium', 'advanced'];

export const COMPLEXITY_TO_TIER = { Simple: 'normal', Medium: 'medium', Advanced: 'advanced' };

function getSecret() {
  const s = process.env.CIY_SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error('CIY_SESSION_SECRET is missing or < 32 chars. Set it in .env.local.');
  }
  return s;
}

const enc = (buf) => Buffer.from(buf).toString('base64url');
const dec = (s)   => Buffer.from(String(s), 'base64url');

export function signToken(payload) {
  const body = enc(JSON.stringify(payload));
  const mac  = crypto.createHmac('sha256', getSecret()).update(body).digest();
  return `${body}.${enc(mac)}`;
}

export function verifyToken(token) {
  if (typeof token !== 'string' || token.length === 0 || token.length > 4096) {
    throw new Error('invalid token');
  }
  const dot = token.indexOf('.');
  if (dot <= 0 || dot === token.length - 1) throw new Error('invalid token');
  const body = token.slice(0, dot);
  const mac  = token.slice(dot + 1);

  const expected = crypto.createHmac('sha256', getSecret()).update(body).digest();
  const got      = dec(mac);
  if (expected.length !== got.length || !crypto.timingSafeEqual(expected, got)) {
    throw new Error('invalid token signature');
  }

  let payload;
  try { payload = JSON.parse(dec(body).toString('utf8')); }
  catch { throw new Error('invalid token payload'); }

  if (!payload || typeof payload !== 'object') throw new Error('invalid token payload');
  if (payload.ver !== VERSION)                 throw new Error('invalid token version');

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.iat !== 'number' || payload.iat > now + 60 || now - payload.iat > MAX_AGE_SECS) {
    throw new Error('token expired');
  }
  return payload;
}

export function newUserId() {
  return 'u_' + crypto.randomBytes(8).toString('hex');
}

export function freshPayload(uid = newUserId()) {
  const plan = getPlanById('free');
  return {
    ver: VERSION,
    uid,
    plan: plan.id,
    ps:   new Date().toISOString(),
    cr:   { ...plan.credits },
    us:   { normal: 0, medium: 0, advanced: 0 },
    pk:   [],
    iat:  Math.floor(Date.now() / 1000),
  };
}

export function applyPlan(payload, planId) {
  const plan = getPlanById(planId);
  if (!plan || plan.id !== planId) throw new Error('unknown plan');
  return {
    ...payload,
    plan: plan.id,
    ps:   new Date().toISOString(),
    cr:   { ...plan.credits },
    us:   { normal: 0, medium: 0, advanced: 0 },
    pk:   payload.pk || [],
    iat:  Math.floor(Date.now() / 1000),
  };
}

export function applyPass(payload, passId) {
  const pass = getPassById(passId);
  if (!pass || pass.id !== passId) throw new Error('unknown pass');
  return {
    ...payload,
    pk: [
      ...(payload.pk || []),
      { id: pass.id, rem: { ...pass.credits }, at: new Date().toISOString() },
    ],
    iat: Math.floor(Date.now() / 1000),
  };
}

export function availableCredits(payload, tier) {
  if (!TIERS.includes(tier)) return 0;
  const cap  = payload.cr?.[tier] ?? 0;
  const used = payload.us?.[tier] ?? 0;
  const planLeft = cap === -1 ? Infinity : Math.max(0, cap - used);
  const packLeft = (payload.pk || []).reduce((s, p) => s + (p.rem?.[tier] || 0), 0);
  return planLeft === Infinity ? Infinity : planLeft + packLeft;
}

export function spendCredit(payload, tier) {
  if (!TIERS.includes(tier)) throw new Error('invalid tier');
  const cap  = payload.cr?.[tier] ?? 0;
  const used = payload.us?.[tier] ?? 0;

  if (cap === -1) {
    return { ...payload, us: { ...payload.us, [tier]: used + 1 }, iat: Math.floor(Date.now() / 1000) };
  }
  if (used < cap) {
    return { ...payload, us: { ...payload.us, [tier]: used + 1 }, iat: Math.floor(Date.now() / 1000) };
  }
  const packs = payload.pk || [];
  const idx = packs.findIndex(p => (p.rem?.[tier] || 0) > 0);
  if (idx < 0) throw new Error('no credits');
  const nextPacks = packs.map((p, i) => i === idx
    ? { ...p, rem: { ...p.rem, [tier]: (p.rem[tier] || 0) - 1 } }
    : p);
  return { ...payload, pk: nextPacks, iat: Math.floor(Date.now() / 1000) };
}

// Shape a signed payload into the client's existing "ciy-usage" record so the
// UI can keep reading the same fields without knowing about tokens.
export function toClientUsage(payload) {
  return {
    planId:        payload.plan,
    planStartedAt: payload.ps,
    credits:       { ...payload.cr },
    used:          { ...payload.us },
    passes:        (payload.pk || []).map(p => ({
      passId:      p.id,
      purchasedAt: p.at,
      remaining:   { ...p.rem },
    })),
  };
}
