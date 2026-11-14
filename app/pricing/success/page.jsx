'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth, getToken, applyServerState } from '@/lib/auth';
import { track } from '@/lib/analytics';
import { CheckCircle2, Pickaxe, AlertTriangle, Loader2 } from 'lucide-react';

function PaymentSuccessContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const { user } = useAuth();
  const [state, setState] = useState({ phase: 'loading', error: '', applied: null });

  useEffect(() => {
    const stripeSessionId = sp.get('session_id');
    if (!stripeSessionId) {
      setState({ phase: 'error', error: 'Missing session id.', applied: null });
      return;
    }
    let cancelled = false;

    (async () => {
      const token = getToken();
      if (!token) {
        setState({ phase: 'error', error: 'Please sign in again to claim your order.', applied: null });
        return;
      }
      try {
        const res = await fetch('/api/stripe/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, stripeSessionId }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (!res.ok || !data?.success) {
          if (data?.code === 'already_claimed') {
            setState({ phase: 'done', error: '', applied: null });
            return;
          }
          throw new Error(data?.error || 'Could not apply the upgrade.');
        }

        applyServerState({ token: data.token, usage: data.usage });
        track('purchase_applied', { kind: data.applied?.kind, planId: data.applied?.planId, passId: data.applied?.passId });
        setState({ phase: 'done', error: '', applied: data.applied });
      } catch (e) {
        if (cancelled) return;
        setState({ phase: 'error', error: e.message || 'Could not apply the upgrade.', applied: null });
      }
    })();

    return () => { cancelled = true; };
  }, [sp]);

  return (
    <div className="flex flex-col min-h-screen bg-background relative">
      <div className="fixed inset-0 pixel-grid opacity-40 pointer-events-none" />
      <Navbar />
      <main className="flex-grow pt-28 pb-20 relative z-10">
        <div className="max-w-xl mx-auto px-4">
          <div className="mc-slot rounded-2xl p-10 text-center">
            {state.phase === 'loading' && (
              <>
                <Loader2 className="w-10 h-10 text-primary mx-auto mb-5 animate-spin" />
                <h1 className="text-2xl font-black text-white mb-2">Finalising your order...</h1>
                <p className="text-white/50">Applying credits to your account.</p>
              </>
            )}

            {state.phase === 'done' && (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-9 h-9 text-primary" />
                </div>
                <div className="font-pixel text-[10px] tracking-[0.25em] text-primary/70 mb-3">[ ORDER_COMPLETE ]</div>
                <h1 className="text-3xl font-black text-white mb-3">You&apos;re in.</h1>
                <p className="text-white/50 mb-8 leading-relaxed">
                  {state.applied?.kind === 'plan'
                    ? `Your ${state.applied?.planId} plan is active and credits are topped up.`
                    : state.applied?.kind === 'pass'
                    ? `Pack added to your inventory — credits never expire.`
                    : 'Your previous purchase is already applied.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/create" className="mc-btn inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black px-6 py-3 rounded-md font-black uppercase tracking-wider text-xs">
                    <Pickaxe className="w-4 h-4" /> Start Crafting
                  </Link>
                  <Link href="/account" className="mc-btn inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-md font-black uppercase tracking-wider text-xs">
                    View Account
                  </Link>
                </div>
              </>
            )}

            {state.phase === 'error' && (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto mb-5">
                  <AlertTriangle className="w-9 h-9 text-amber-400" />
                </div>
                <h1 className="text-2xl font-black text-white mb-3">Hold on — we need to check that order.</h1>
                <p className="text-white/60 mb-6">{state.error}</p>
                <p className="text-white/40 text-xs mb-6">If Stripe took the payment but the upgrade didn&apos;t apply, email billing@craftityourself.gg with your account email and we&apos;ll fix it within the day.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => router.refresh()}
                    className="mc-btn inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black px-6 py-3 rounded-md font-black uppercase tracking-wider text-xs"
                  >
                    Retry
                  </button>
                  <Link href="/contact?topic=billing" className="mc-btn inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-md font-black uppercase tracking-wider text-xs">
                    Contact Billing
                  </Link>
                </div>
              </>
            )}

            {!user && state.phase !== 'loading' && (
              <div className="mt-6 text-[11px] text-white/30">
                Not signed in? <Link href="/login" className="text-primary hover:underline">Sign in</Link> on the same device used for checkout.
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-background relative">
        <div className="fixed inset-0 pixel-grid opacity-40 pointer-events-none" />
        <Navbar />
        <main className="flex-grow pt-28 pb-20 relative z-10">
          <div className="max-w-xl mx-auto px-4">
            <div className="mc-slot rounded-2xl p-10 text-center">
              <Loader2 className="w-10 h-10 text-primary mx-auto mb-5 animate-spin" />
              <h1 className="text-2xl font-black text-white mb-2 font-pixel">Loading billing session...</h1>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
