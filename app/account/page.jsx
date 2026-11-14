'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthGate from '@/components/AuthGate';
import { useAuth, logOut, getAvailableCredits } from '@/lib/auth';
import { getPlanById, TIERS } from '@/lib/plans';
import {
  Pickaxe, LogOut, Package, Gift, ChevronRight, Zap,
  Gem, User, Calendar, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

function AccountContent() {
  const router = useRouter();
  const { user, usage } = useAuth();

  if (!user || !usage) return null;

  const plan = getPlanById(usage.planId || 'free');

  const handleLogout = () => {
    logOut();
    toast.success('Logged out. Come back soon!');
    router.push('/');
  };

  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono tracking-[0.2em] uppercase mb-3">
            <User className="w-3 h-3" />
            Crafter Profile
          </div>
          <h1 className="font-pixel text-[18px] md:text-[22px] leading-[1.5]">
            <span className="text-white">Welcome,</span>{' '}
            <span className="text-primary glow-green">{user.name}</span>
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="mc-btn inline-flex items-center gap-2 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-white/70 hover:text-red-400 px-4 py-2.5 rounded-md font-black uppercase tracking-wider text-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log out
        </button>
      </div>

      {/* TOP GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5 mb-8">
        {/* PROFILE */}
        <div className="mc-slot rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 mc-slot rounded-lg flex items-center justify-center text-3xl"
                 style={{ filter: 'drop-shadow(0 0 12px rgba(34,197,94,0.3))' }}>
              🎮
            </div>
            <div>
              <div className="font-black text-white text-lg leading-tight">{user.name}</div>
              <div className="font-mono text-xs text-white/40">{user.email}</div>
            </div>
          </div>
          <div className="space-y-2 text-xs font-mono pt-5 border-t border-white/5">
            <Row k="crafter_id" v={<span className="text-white/70">{user.id}</span>} />
            <Row k="joined"     v={<span className="text-white/70 flex items-center gap-1"><Calendar className="w-3 h-3" />{joined}</span>} />
            <Row k="plugins_crafted" v={<span className="text-primary">{(usage.history || []).length}</span>} />
          </div>
        </div>

        {/* PLAN CARD */}
        <div className={`rounded-2xl border-2 ${plan.rarity} bg-[#0b0b0b] p-6 relative overflow-hidden`}>
          <div className="absolute top-3 right-3 text-[8px] font-pixel tracking-[0.25em] text-white/40">
            ★ ACTIVE PLAN
          </div>
          <div className={`font-pixel text-[10px] tracking-[0.25em] mb-2 ${plan.glow}`}>{plan.name.toUpperCase()}</div>
          <p className="text-white/40 text-xs uppercase tracking-wider font-bold mb-4">{plan.tagline}</p>

          <div className="flex items-baseline gap-1 mb-6">
            <span className={`text-3xl font-black text-white ${plan.glow}`}>${plan.price}</span>
            {plan.interval && <span className="text-white/40 text-sm font-mono">/{plan.interval}</span>}
          </div>

          <Link
            href="/pricing"
            className="mc-btn inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black px-5 py-2.5 rounded-md font-black uppercase tracking-widest text-xs"
          >
            <Zap className="w-3.5 h-3.5" />
            {plan.id === 'master' ? 'Manage Plan' : 'Upgrade'}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* CREDITS BREAKDOWN */}
      <div className="mc-slot rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Gem className="w-3.5 h-3.5 text-primary" />
          <span className="font-pixel text-[10px] tracking-[0.25em] text-primary">CREDIT_INVENTORY</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['advanced', 'medium', 'normal'].map(tier => {
            const t = TIERS[tier];
            const available = getAvailableCredits(tier, usage);
            const planCap   = usage.credits?.[tier] ?? 0;
            const usedPlan  = usage.used?.[tier] ?? 0;
            const passLeft  = (usage.passes || []).reduce((s, p) => s + (p.remaining?.[tier] || 0), 0);
            const unlimited = planCap === -1;

            return (
              <div key={tier} className={`rounded-xl border-2 ${t.badge} bg-[#0a0a0a] p-5`}>
                <div className={`font-pixel text-[9px] tracking-[0.25em] mb-3 ${t.color}`}>
                  ★ {t.label.toUpperCase()}
                </div>
                <div className={`text-4xl font-black text-white mb-1 ${t.glow}`}>
                  {unlimited ? '∞' : available}
                </div>
                <div className="text-[11px] text-white/40 uppercase tracking-wider font-bold mb-4">
                  credits available
                </div>

                <div className="space-y-1.5 text-[11px] font-mono pt-3 border-t border-white/5">
                  <div className="flex justify-between">
                    <span className="text-white/40">plan</span>
                    <span className="text-white/70">
                      {unlimited ? '∞' : `${Math.max(0, planCap - usedPlan)}/${planCap}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">packs</span>
                    <span className="text-amber-400/80">+{passLeft}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-5 border-t border-white/5 flex flex-col sm:flex-row gap-3 justify-between items-center text-xs">
          <p className="text-white/40">Need more credits? Buy one-time packs — they never expire.</p>
          <div className="flex gap-2">
            <Link href="/pricing" className="mc-btn inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-md font-black uppercase tracking-wider">
              <Zap className="w-3 h-3" />
              Upgrade
            </Link>
            <Link href="/pricing#packs" className="mc-btn inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-black px-4 py-2 rounded-md font-black uppercase tracking-wider">
              <Package className="w-3 h-3" />
              Buy Pack
            </Link>
          </div>
        </div>
      </div>

      {/* PASSES */}
      {(usage.passes || []).length > 0 && (
        <div className="mc-slot rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-5">
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-pixel text-[10px] tracking-[0.25em] text-amber-400">OWNED_PACKS</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {usage.passes.map((p, i) => {
              const passName = p.passId.replace('pass-', '');
              const total = Object.values(p.remaining || {}).reduce((a, b) => a + b, 0);
              return (
                <div key={i} className="bg-black/60 border border-white/8 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white capitalize">{passName} Pack</div>
                    <div className="text-[10px] text-white/40 font-mono">
                      purchased {new Date(p.purchasedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-primary text-lg">{total}</div>
                    <div className="text-[9px] text-white/40 uppercase tracking-wider">left</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RECENT CRAFTS */}
      <div className="mc-slot rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Pickaxe className="w-3.5 h-3.5 text-primary" />
          <span className="font-pixel text-[10px] tracking-[0.25em] text-primary">CRAFT_HISTORY</span>
        </div>
        {(usage.history || []).length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3 opacity-40">🔨</div>
            <p className="text-white/40 text-sm mb-4">No plugins crafted yet.</p>
            <Link
              href="/create"
              className="mc-btn inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black px-5 py-2.5 rounded-md font-black uppercase tracking-wider text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Craft your first plugin
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5 font-mono text-sm">
            {usage.history.slice(0, 10).map((h, i) => {
              const t = TIERS[h.tier];
              return (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/[0.03] transition-colors">
                  <span className="text-white/30 text-[10px] w-8">#{(usage.history.length - i).toString().padStart(3, '0')}</span>
                  <span className={`text-[9px] font-pixel tracking-wider px-2 py-0.5 rounded ${t.color} border border-current/30`}>
                    {t.label.toUpperCase()}
                  </span>
                  <span className="text-white/70 truncate flex-1">{h.pluginName || 'Untitled plugin'}</span>
                  <span className="text-white/30 text-[10px]">{new Date(h.at).toLocaleDateString()}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/40">{k}</span>
      <span className="flex-1 h-px border-t border-dashed border-white/10 translate-y-1" />
      <span>{v}</span>
    </div>
  );
}

export default function AccountPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-x-hidden">
      <div className="fixed inset-0 pixel-grid opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(34,197,94,0.08),transparent)] pointer-events-none" />
      <Navbar />
      <main className="flex-grow pt-24 pb-16 relative z-10">
        <AuthGate>
          <AccountContent />
        </AuthGate>
      </main>
      <Footer />
    </div>
  );
}
