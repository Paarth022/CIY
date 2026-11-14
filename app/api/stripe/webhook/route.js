// Stripe webhook. Works standalone — the /claim endpoint handles the first
// upgrade the moment the user lands back on /pricing/success. This endpoint is
// for side-effects: logging, fraud audit, and (once a user DB exists) applying
// recurring subscription refills and cancellations.
//
// Events wired:
//   checkout.session.completed   → audit log
//   invoice.payment_succeeded    → refill plan credits (requires DB; logs for now)
//   customer.subscription.deleted → cancel plan (requires DB; logs for now)
import { getStripe, getWebhookSecret } from '@/lib/server/stripe';
import { captureServerError, captureMessage } from '@/lib/server/sentry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const stripe = getStripe();
  const secret = getWebhookSecret();
  if (!stripe || !secret) {
    return new Response('Stripe not configured', { status: 503 });
  }
  const sig = req.headers.get('stripe-signature');
  if (!sig) return new Response('Missing signature', { status: 400 });

  const raw = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    captureServerError(e, { where: 'stripe:webhook:verify' });
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object;
        captureMessage('stripe.checkout.completed', 'info', {
          uid:    s.metadata?.uid,
          kind:   s.metadata?.kind,
          planId: s.metadata?.planId,
          passId: s.metadata?.passId,
          amount: s.amount_total,
        });
        break;
      }
      case 'invoice.payment_succeeded': {
        const inv = event.data.object;
        // Recurring renewal. Without a user DB we can't refill credits for the
        // user's device-side token automatically. Fires once /lib/supabase/ is
        // wired — until then it's logged as an audit event.
        captureMessage('stripe.invoice.paid', 'info', {
          customer: inv.customer,
          subscription: inv.subscription,
          amount: inv.amount_paid,
        });
        break;
      }
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        captureMessage(`stripe.${event.type}`, 'info', {
          customer: sub.customer,
          subscription: sub.id,
          status: sub.status,
          uid: sub.metadata?.uid,
          planId: sub.metadata?.planId,
        });
        break;
      }
      default:
        // Ignored — no action for this event type.
        break;
    }
  } catch (e) {
    captureServerError(e, { where: 'stripe:webhook:handle', type: event.type });
    return new Response('Handler error', { status: 500 });
  }

  return new Response('ok', { status: 200 });
}
