// Claim a Stripe-paid checkout session and apply the upgrade to the caller's
// session token. Stateless — we verify the session with Stripe each time.
// Replay protection: we keep an in-memory set of claimed session ids (TTL 2h).
// For multi-instance deployments, move this to Redis.
import { verifyToken, signToken, applyPlan, applyPass, toClientUsage } from '@/lib/server/session';
import { getStripe } from '@/lib/server/stripe';
import { captureServerError } from '@/lib/server/sentry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CLAIM_TTL_MS = 2 * 60 * 60 * 1000; // 2h
const claimed = new Map(); // stripeSessionId -> { at }

function gcClaims() {
  const cutoff = Date.now() - CLAIM_TTL_MS;
  if (claimed.size < 2000) return;
  for (const [k, v] of claimed) if (v.at < cutoff) claimed.delete(k);
}

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ success: false, error: 'Invalid JSON.' }, { status: 400 }); }

  const { token, stripeSessionId } = body || {};
  if (typeof token !== 'string' || typeof stripeSessionId !== 'string') {
    return Response.json({ success: false, error: 'Missing parameters.' }, { status: 400 });
  }
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(stripeSessionId)) {
    return Response.json({ success: false, error: 'Invalid session id.' }, { status: 400 });
  }

  let payload;
  try { payload = verifyToken(token); }
  catch {
    return Response.json(
      { success: false, error: 'Your session expired — please sign in again.', code: 'session_expired' },
      { status: 401 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return Response.json({ success: false, error: 'Payments are not configured.' }, { status: 503 });
  }

  gcClaims();
  if (claimed.has(stripeSessionId)) {
    return Response.json({ success: false, error: 'This order was already claimed.', code: 'already_claimed' }, { status: 409 });
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(stripeSessionId);
  } catch (e) {
    captureServerError(e, { where: 'stripe:claim:retrieve' });
    return Response.json({ success: false, error: 'Could not verify the order with Stripe.' }, { status: 500 });
  }

  if (!session) {
    return Response.json({ success: false, error: 'Order not found.' }, { status: 404 });
  }
  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    return Response.json({ success: false, error: 'Payment has not completed yet.', code: 'not_paid' }, { status: 402 });
  }
  if (session.metadata?.uid !== payload.uid) {
    return Response.json({ success: false, error: 'Order does not belong to this account.' }, { status: 403 });
  }

  const kind   = session.metadata?.kind;
  const planId = session.metadata?.planId;
  const passId = session.metadata?.passId;

  let next;
  try {
    if (kind === 'plan' && planId)      next = applyPlan(payload, planId);
    else if (kind === 'pass' && passId) next = applyPass(payload, passId);
    else {
      return Response.json({ success: false, error: 'Order metadata missing.' }, { status: 500 });
    }
  } catch (e) {
    captureServerError(e, { where: 'stripe:claim:apply' });
    return Response.json({ success: false, error: e?.message || 'Could not apply upgrade.' }, { status: 500 });
  }

  claimed.set(stripeSessionId, { at: Date.now() });

  return Response.json({
    success: true,
    token:   signToken(next),
    usage:   toClientUsage(next),
    applied: { kind, planId, passId },
  });
}
