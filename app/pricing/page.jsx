'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PLANS, PASSES, TIERS } from '@/lib/plans';
import { useAuth, applyPlan, applyPass, getToken } from '@/lib/auth';
import { track } from '@/lib/analytics';
import {
  Check, Pickaxe, Sparkles, Zap, Gift,
  Gem, ChevronRight, Shield, Lock,
} from 'lucide-react';
import { toast } from 'sonner';

async function startStripeCheckout({ planId, passId }) {
  const token = getToken();
  if (!token) throw new Error('Sign in first.');
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, planId, passId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.success) {
    const err = new Error(data?.error || 'Could not start checkout.');
    err.code = data?.code;
    throw err;
  }
  return data.url;
}

export default function PricingPage() {
  const router = useRouter();
  const { user, usage } = useAuth();
  const [busyId, setBusyId] = useState(null);

  const currentPlanId = usage?.planId || 'free';

  const handleChoosePlan = async (plan) => {
    if (!user) {
      router.push(`/signup?next=/pricing`);
      return;
    }
    if (plan.id === 'free') {
      toast.info('You already have the free trial.');
      return;
    }
    setBusyId(plan.id);
    try {
      track('checkout_start', { kind: 'plan', planId: plan.id, price: plan.price });
      const url = await startStripeCheckout({ planId: plan.id });
      window.location.href = url;
    } catch (err) {
      // Dev-mode fallback: if Stripe isn't configured, use the legacy instant path.
      if (err.code === 'payments_disabled') {
        try {
          await applyPlan(plan.id);
          toast.success(`✨ ${plan.name} activated (dev mode). Credits refilled.`);
          router.push('/create');
        } catch (inner) {
          toast.error(inner.message || 'Upgrade failed.');
        }
      } else {
        toast.error(err.message || 'Upgrade failed.');
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleBuyPass = async (pass) => {
    if (!user) {
      router.push(`/signup?next=/pricing`);
      return;
    }
    setBusyId(pass.id);
    try {
      track('checkout_start', { kind: 'pass', passId: pass.id, price: pass.price });
      const url = await startStripeCheckout({ passId: pass.id });
      window.location.href = url;
    } catch (err) {
      if (err.code === 'payments_disabled') {
        try {
          await applyPass(pass);
          toast.success(`📦 ${pass.name} added (dev mode).`);
        } catch (inner) {
          toast.error(inner.message || 'Purchase failed.');
        }
      } else {
        toast.error(err.message || 'Purchase failed.');
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-x-hidden">
      <div className="fixed inset-0 pixel-grid opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(34,197,94,0.08),transparent)] pointer-events-none" />

      <Navbar />

      <main className="flex-grow pt-28 pb-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4">

          {/* HEADER */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono tracking-[0.2em] uppercase mb-5">
              <Gem className="w-3 h-3" />
              Pricing
            </div>
            <h1 className="font-pixel text-[22px] md:text-[34px] leading-[1.5] mb-4">
              <span className="text-white">Pick your</span><br />
              <span className="enchant-text">crafter tier.</span>
            </h1>
            <p className="text-white/50 max-w-xl mx-auto leading-relaxed">
              Try 1 plugin free. Subscribe for more, or grab one-time packs that never expire.
              Cancel anytime.
            </p>
          </div>

          {/* ── PLANS ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
            {PLANS.map(plan => {
              const isCurrent = currentPlanId === plan.id;
              const isBusy    = busyId === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 ${plan.rarity} bg-[#0b0b0b] p-6 flex flex-col card-lift transition-all ${
                    plan.badge ? 'lg:-translate-y-2' : ''
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-black text-[9px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-4">
                    <div className={`font-pixel text-[9px] tracking-[0.25em] mb-2 ${plan.glow}`}>
                      ★ {plan.name.toUpperCase()}
                    </div>
                    <p className="text-white/40 text-xs uppercase tracking-wider font-bold">{plan.tagline}</p>
                  </div>

                  <div className="flex items-baseline gap-1 mb-5">
                    <span className={`text-4xl font-black text-white ${plan.glow}`}>
                      ${plan.price}
                    </span>
                    {plan.interval && <span className="text-white/40 text-sm font-mono">/{plan.interval}</span>}
                  </div>

                  {/* credit breakdown */}
                  <div className="mc-slot rounded-lg p-3 mb-5 space-y-1.5 text-xs font-mono">
                    <CreditRow tier="advanced" count={plan.credits.advanced} />
                    <CreditRow tier="medium"   count={plan.credits.medium} />
                    <CreditRow tier="normal"   count={plan.credits.normal} />
                  </div>

                  {/* features */}
                  <ul className="space-y-2 mb-5 flex-grow">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-white/70 text-xs leading-relaxed">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" strokeWidth={3} />
                        {f}
                      </li>
                    ))}
                    {plan.locked.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-white/25 text-xs leading-relaxed line-through">
                        <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleChoosePlan(plan)}
                    disabled={isCurrent || isBusy}
                    className={`mc-btn w-full py-3 rounded-md font-black uppercase tracking-widest text-xs transition-colors ${
                      isCurrent
                        ? 'bg-white/5 text-white/40 cursor-default'
                        : plan.badge
                          ? 'bg-primary hover:bg-primary-hover text-black'
                          : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                    }`}
                  >
                    {isBusy ? 'Activating...' : isCurrent ? '✓ Current Plan' : plan.cta}
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── ONE-TIME PASSES ── */}
          <div id="packs" className="mb-20 scroll-mt-24">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono tracking-[0.2em] uppercase mb-4">
                <Gift className="w-3 h-3" />
                One-time Packs
              </div>
              <h2 className="font-pixel text-[18px] md:text-[26px] leading-[1.5] mb-3">
                <span className="text-white">No subscription?</span><br />
                <span className="text-amber-400 glow-gold">Buy credits outright.</span>
              </h2>
              <p className="text-white/50 max-w-md mx-auto">Never expire. Stack with any plan. Pay once, craft at your pace.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {PASSES.map(pass => {
                const isBusy = busyId === pass.id;
                return (
                  <div
                    key={pass.id}
                    className={`rarity-${pass.rarity.replace('rarity-', '')} rounded-2xl border-2 ${pass.rarity} bg-[#0b0b0b] p-6 flex flex-col card-lift group relative overflow-hidden`}
                  >
                    <div className="absolute top-3 right-3 text-[8px] font-pixel tracking-[0.25em] text-white/40 group-hover:text-white/80">
                      ★ PACK
                    </div>
                    <div className="mb-4">
                      <div className={`font-pixel text-[10px] tracking-[0.25em] mb-2 ${pass.glow}`}>{pass.name.toUpperCase()}</div>
                      <p className="text-white/40 text-xs uppercase tracking-wider font-bold">{pass.tagline}</p>
                    </div>

                    <div className="flex items-baseline gap-1 mb-5">
                      <span className={`text-3xl font-black text-white ${pass.glow}`}>${pass.price}</span>
                      <span className="text-white/40 text-xs font-mono">one-time</span>
                    </div>

                    <ul className="space-y-2 mb-5 flex-grow text-xs">
                      {pass.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-white/70">
                          <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" strokeWidth={3} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleBuyPass(pass)}
                      disabled={isBusy}
                      className="mc-btn w-full py-3 rounded-md font-black uppercase tracking-widest text-xs bg-white/10 hover:bg-white/15 text-white border border-white/10"
                    >
                      {isBusy ? 'Adding...' : pass.cta}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── FAQ / TRUST ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
            {[
              { icon: Shield, title: 'No API keys needed', desc: 'Your plan includes AI access — we handle provider keys, you just describe the plugin.' },
              { icon: Zap,    title: 'Instant activation', desc: 'Plans and packs apply the second you purchase.' },
              { icon: Sparkles, title: 'Cancel anytime',   desc: 'No contracts. Pause or cancel your plan in one click.' },
            ].map((b, i) => (
              <div key={i} className="mc-slot rounded-2xl p-6">
                <b.icon className="w-5 h-5 text-primary mb-3" />
                <h3 className="font-black text-white mb-1.5">{b.title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* ── BOTTOM CTA ── */}
          <div className="relative rounded-2xl border-2 border-primary/20 p-8 md:p-10 text-center overflow-hidden scanlines"
               style={{
                 background:
                   'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(34,197,94,0.1), transparent 70%),' +
                   'linear-gradient(180deg, #0a0a0a, #050505)',
               }}>
            <div className="absolute inset-0 pixel-grid opacity-50 pointer-events-none" />
            <div className="relative z-10">
              <div className="font-pixel text-[9px] text-primary tracking-[0.25em] mb-3">[FIRST_TIME_CRAFTER]</div>
              <h3 className="text-2xl md:text-4xl font-black text-white mb-3 tracking-tight">
                Haven't tried it yet?
              </h3>
              <p className="text-white/50 mb-6 max-w-md mx-auto">
                Sign up free and craft 1 Normal plugin — no card required.
              </p>
              <Link
                href="/signup"
                className="mc-btn inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black px-6 py-3 rounded-md font-black uppercase tracking-wider text-sm"
              >
                <Pickaxe className="w-4 h-4" />
                Claim Free Plugin
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function CreditRow({ tier, count }) {
  const t = TIERS[tier];
  const display = count === -1 ? '∞ Unlimited' : count === 0 ? 'not included' : `${count} ${t.label}`;
  const dim = count === 0;
  return (
    <div className={`flex items-center justify-between ${dim ? 'opacity-40' : ''}`}>
      <span className={`${t.color} font-bold uppercase tracking-wider text-[10px]`}>{t.label}</span>
      <span className={`${dim ? 'text-white/30' : 'text-white/80'} font-mono`}>{display}</span>
    </div>
  );
}
