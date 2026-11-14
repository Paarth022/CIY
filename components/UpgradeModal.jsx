'use client';
import Link from 'next/link';
import { X, Pickaxe, Lock, MoveRight, Zap } from 'lucide-react';
import { TIERS } from '@/lib/plans';

// Shown when the user tries to craft a tier they can't afford.
export default function UpgradeModal({ open, onClose, tier = 'normal', reason = 'no-credits' }) {
  if (!open) return null;

  const t = TIERS[tier] || TIERS.normal;
  const isLocked = reason === 'locked';
  const title = isLocked ? `${t.label} tier is locked` : `Out of ${t.label} credits`;
  const sub   = isLocked
    ? `This tier isn't included in your current plan. Upgrade or grab a one-time ${t.label} Pack to unlock it.`
    : `You've used all your ${t.label} credits. Top up with a one-time pack or upgrade your plan.`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-[fadeInUp_0.2s_ease-out_forwards]">
      <div
        className={`relative w-full max-w-lg rounded-2xl border-2 ${t.badge} bg-[#0a0a0a] p-8 scanlines`}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-md bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="absolute inset-0 pixel-grid-fine opacity-30 pointer-events-none rounded-2xl" />

        <div className="relative z-10 text-center">
          <div className="w-16 h-16 mx-auto mc-slot rounded-xl flex items-center justify-center mb-5">
            {isLocked ? <Lock className="w-7 h-7 text-primary" /> : <Zap className="w-7 h-7 text-primary" />}
          </div>

          <div className={`font-pixel text-[9px] tracking-[0.25em] mb-3 ${t.color}`}>
            ★ {t.label.toUpperCase()} TIER
          </div>
          <h3 className={`text-2xl font-black text-white mb-3 ${t.glow}`}>{title}</h3>
          <p className="text-white/50 text-sm mb-7 leading-relaxed max-w-sm mx-auto">{sub}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/pricing"
              className="mc-btn inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-black px-6 py-3 rounded-md font-black uppercase tracking-wider text-xs"
            >
              <Pickaxe className="w-4 h-4" />
              Upgrade plan
              <MoveRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/pricing#packs`}
              className="mc-btn inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-md font-black uppercase tracking-wider text-xs"
            >
              Buy one-time pack
            </Link>
          </div>

          <button
            onClick={onClose}
            className="mt-5 text-[11px] text-white/40 hover:text-white uppercase tracking-widest font-mono"
          >
            Continue browsing
          </button>
        </div>
      </div>
    </div>
  );
}
