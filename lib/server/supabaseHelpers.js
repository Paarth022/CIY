import 'server-only';
import { getAdminSupabase } from '@/lib/supabase/server';
import { captureServerError } from '@/lib/server/sentry';

// Idempotent claim: inserts the Stripe session ID with a unique constraint.
// Returns { fresh: true } on first insert, { fresh: false } on duplicate,
// or { fresh: null } if Supabase isn't configured (caller can fall back).
export async function claimStripeSession({ stripeSessionId, userId, kind, planId, passId, amountTotal }) {
  const db = getAdminSupabase();
  if (!db) return { fresh: null };
  const { error } = await db.from('stripe_claims').insert({
    stripe_session_id: stripeSessionId,
    user_id:           userId,
    kind,
    plan_id:           planId || null,
    pass_id:           passId || null,
    amount_total:      amountTotal ?? null,
  });
  if (!error) return { fresh: true };
  // 23505 = unique_violation
  if (error.code === '23505') return { fresh: false };
  captureServerError(error, { where: 'supabase:claimStripeSession' });
  return { fresh: null };
}

// Similar pattern for webhook events.
export async function markStripeEventSeen(eventId, type) {
  const db = getAdminSupabase();
  if (!db) return { fresh: null };
  const { error } = await db.from('stripe_events').insert({ stripe_event_id: eventId, type });
  if (!error) return { fresh: true };
  if (error.code === '23505') return { fresh: false };
  captureServerError(error, { where: 'supabase:markStripeEventSeen' });
  return { fresh: null };
}

export async function markStripeEventProcessed(eventId) {
  const db = getAdminSupabase();
  if (!db) return;
  await db.from('stripe_events').update({ processed_at: new Date().toISOString() }).eq('stripe_event_id', eventId);
}

export async function writeAudit({ userId, action, resource, oldValue, newValue, ip, userAgent }) {
  const db = getAdminSupabase();
  if (!db) return;
  try {
    await db.from('audit_logs').insert({
      user_id:    userId || null,
      action,
      resource:   resource || null,
      old_value:  oldValue ?? null,
      new_value:  newValue ?? null,
      ip:         ip ? String(ip).slice(0, 64) : null,
      user_agent: userAgent ? String(userAgent).slice(0, 256) : null,
    });
  } catch (e) {
    captureServerError(e, { where: 'supabase:writeAudit' });
  }
}

export async function incrementCounter(id, by = 1) {
  const db = getAdminSupabase();
  if (!db) return;
  try {
    // Supabase doesn't expose postgres RPC directly for simple UPDATE ... SET x = x+1
    // without a custom function. Read-modify-write is fine for our low-QPS counters.
    const { data } = await db.from('counters').select('value').eq('id', id).maybeSingle();
    const next = (Number(data?.value) || 0) + by;
    await db.from('counters').upsert({ id, value: next });
  } catch (e) {
    captureServerError(e, { where: 'supabase:incrementCounter', id });
  }
}

// Stripe plan → credits mapping. Called by webhook on invoice.payment_succeeded
// and by claim endpoint post-checkout.
export async function applyPlanToDb({ userId, planId, credits }) {
  const db = getAdminSupabase();
  if (!db) return { ok: false, reason: 'no_db' };
  const now = new Date().toISOString();
  const { error: profileErr } = await db
    .from('profiles')
    .update({ plan_id: planId, plan_started_at: now, updated_at: now })
    .eq('id', userId);
  if (profileErr) {
    captureServerError(profileErr, { where: 'supabase:applyPlanToDb:profile' });
    return { ok: false, reason: 'profile_update_failed' };
  }
  const { error: creditsErr } = await db.from('credits').upsert({
    user_id:       userId,
    normal:        credits.normal ?? 0,
    medium:        credits.medium ?? 0,
    advanced:      credits.advanced ?? 0,
    normal_used:   0,
    medium_used:   0,
    advanced_used: 0,
    updated_at:    now,
  });
  if (creditsErr) {
    captureServerError(creditsErr, { where: 'supabase:applyPlanToDb:credits' });
    return { ok: false, reason: 'credits_upsert_failed' };
  }
  return { ok: true };
}

export async function downgradeToFree({ userId }) {
  return applyPlanToDb({ userId, planId: 'free', credits: { normal: 0, medium: 0, advanced: 0 } });
}

export async function appendPass({ userId, passId, credits }) {
  const db = getAdminSupabase();
  if (!db) return { ok: false };
  const { error } = await db.from('passes').insert({
    user_id:      userId,
    pass_id:      passId,
    normal_rem:   credits.normal   ?? 0,
    medium_rem:   credits.medium   ?? 0,
    advanced_rem: credits.advanced ?? 0,
  });
  if (error) {
    captureServerError(error, { where: 'supabase:appendPass' });
    return { ok: false };
  }
  return { ok: true };
}

// Maps Stripe Price IDs back to plan/pass ids so we can cross-verify
// checkout sessions — never trust metadata alone.
export function planIdFromPriceId(priceId) {
  const map = {
    [process.env.STRIPE_PRICE_STARTER]: 'starter',
    [process.env.STRIPE_PRICE_CRAFTER]: 'crafter',
    [process.env.STRIPE_PRICE_MASTER]:  'master',
  };
  return priceId ? map[priceId] || null : null;
}
export function passIdFromPriceId(priceId) {
  const map = {
    [process.env.STRIPE_PRICE_PASS_NORMAL]:   'pass-normal',
    [process.env.STRIPE_PRICE_PASS_MEDIUM]:   'pass-medium',
    [process.env.STRIPE_PRICE_PASS_ADVANCED]: 'pass-advanced',
  };
  return priceId ? map[priceId] || null : null;
}
