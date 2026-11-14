// Creates a Stripe Checkout Session for a plan subscription or a one-time pass.
// Stateless: metadata on the session carries the user id + what they're buying,
// and the /api/stripe/claim endpoint verifies + applies the upgrade on return.
import { verifyToken } from '@/lib/server/session';
import { getStripe, priceForPlan, priceForPass, knownPlan, knownPass } from '@/lib/server/stripe';
import { captureServerError } from '@/lib/server/sentry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function siteUrl(req) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  const host = req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  return host ? `${proto}://${host}` : 'https://craftityourself.gg';
}

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ success: false, error: 'Invalid JSON.' }, { status: 400 }); }

  const { token, planId, passId } = body || {};
  if (typeof token !== 'string') {
    return Response.json({ success: false, error: 'Sign in first.' }, { status: 401 });
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
    return Response.json(
      { success: false, error: 'Payments are not configured on this deployment.', code: 'payments_disabled' },
      { status: 503 }
    );
  }

  let mode, price, kind, id;
  if (typeof planId === 'string') {
    if (!knownPlan(planId)) return Response.json({ success: false, error: 'Unknown plan.' }, { status: 400 });
    price = priceForPlan(planId);
    if (!price) return Response.json({ success: false, error: 'Plan price not configured.', code: 'price_missing' }, { status: 500 });
    mode = 'subscription';
    kind = 'plan';
    id   = planId;
  } else if (typeof passId === 'string') {
    if (!knownPass(passId)) return Response.json({ success: false, error: 'Unknown pack.' }, { status: 400 });
    price = priceForPass(passId);
    if (!price) return Response.json({ success: false, error: 'Pack price not configured.', code: 'price_missing' }, { status: 500 });
    mode = 'payment';
    kind = 'pass';
    id   = passId;
  } else {
    return Response.json({ success: false, error: 'Nothing to purchase.' }, { status: 400 });
  }

  const base = siteUrl(req);

  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price, quantity: 1 }],
      client_reference_id: payload.uid,
      metadata: {
        uid:  payload.uid,
        kind,
        [kind === 'plan' ? 'planId' : 'passId']: id,
      },
      // Subscription-mode sessions must also stamp subscription.metadata so the
      // recurring invoices can identify the user.
      subscription_data: mode === 'subscription' ? {
        metadata: { uid: payload.uid, planId: id },
      } : undefined,
      success_url: `${base}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${base}/pricing?cancelled=1`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      automatic_tax: { enabled: false },
    });
    return Response.json({ success: true, url: session.url });
  } catch (e) {
    captureServerError(e, { where: 'stripe:checkout', kind, id });
    return Response.json({ success: false, error: e?.message || 'Could not start checkout.' }, { status: 500 });
  }
}
