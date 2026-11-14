'use client';
import Link from 'next/link';
import { Download, Package, Star, GitFork } from 'lucide-react';

function getRarity(downloads = 0) {
  if (downloads >= 3000) return { cls: 'rarity-legendary', label: 'LEGENDARY', glow: 'glow-gold',   chip: 'text-amber-400'  };
  if (downloads >= 2000) return { cls: 'rarity-epic',      label: 'EPIC',      glow: 'glow-purple', chip: 'text-violet-400' };
  if (downloads >= 1000) return { cls: 'rarity-rare',      label: 'RARE',      glow: 'glow-blue',   chip: 'text-blue-400'   };
  return { cls: 'rarity-common', label: 'COMMON', glow: '', chip: 'text-white/60' };
}

const BLOCK_EMOJI = ['⚔️', '🎁', '🛡️', '🪙', '👁️', '✨', '⚡', '🧿', '💎', '🏹', '🗡️', '🔮'];

// Generate initials avatar colour from author name
function authorColor(name = '') {
  const colors = ['bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-amber-600', 'bg-pink-600', 'bg-cyan-600'];
  const idx = (name.charCodeAt(0) || 0) % colors.length;
  return colors[idx];
}

export default function PluginCard({ plugin }) {
  const rarity = getRarity(plugin.downloads);
  const emoji  = BLOCK_EMOJI[Number(plugin.id) % BLOCK_EMOJI.length] || '📦';
  const initials = (plugin.author || 'CIY').slice(0, 2).toUpperCase();
  const avatarBg = authorColor(plugin.author || '');

  const remixUrl = `/create?prompt=${encodeURIComponent(`Remix and improve "${plugin.name}" — ${plugin.description}`)}`;

  return (
    <Link
      href={`/explore/${plugin.id}`}
      className={`group card-lift h-full bg-[#0b0b0b] border-2 ${rarity.cls} rounded-2xl p-6 flex flex-col relative overflow-hidden transition-all duration-300 block`}
    >
      {/* rarity badge */}
      <div className={`absolute top-3 right-3 text-[8px] font-pixel tracking-[0.25em] ${rarity.chip} opacity-70 group-hover:opacity-100 transition-opacity`}>
        ★{rarity.label}
      </div>

      {/* icon + meta */}
      <div className="flex items-start gap-4 mb-5">
        <div className="shrink-0 w-14 h-14 mc-slot rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300"
             style={{ filter: 'drop-shadow(0 0 10px rgba(34,197,94,0.2))' }}>
          {emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`font-black text-white text-lg leading-tight group-hover:text-primary transition-colors ${rarity.glow}`}>
            {plugin.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 font-mono text-[10px]">
            <span className="text-white/30">v{plugin.version}</span>
            <span className="text-white/15">·</span>
            <span className="text-primary/60">bukkit/paper</span>
          </div>
        </div>
      </div>

      {/* description */}
      <p className="text-white/55 text-sm mb-5 leading-relaxed line-clamp-2 flex-grow">
        {plugin.description}
      </p>

      {/* tags */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {plugin.tags.map(tag => (
          <span key={tag} className="bg-primary/8 text-primary/80 border border-primary/15 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold">
            {tag}
          </span>
        ))}
      </div>

      {/* footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
        <div className="flex items-center gap-3 text-xs">
          {/* Author avatar */}
          <div className={`w-6 h-6 rounded-md ${avatarBg} flex items-center justify-center text-[9px] font-black text-white shrink-0`}>
            {initials}
          </div>
          <div className="flex items-center gap-1 text-white/40">
            <Download size={11} />
            <span className="font-mono">{plugin.downloads.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={9} className="text-amber-400 fill-amber-400" />
            ))}
          </div>
        </div>

        {/* Remix button — stops propagation so clicking it goes to /create, not /explore/[id] */}
        <button
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = remixUrl;
          }}
          className="inline-flex items-center gap-1 text-primary font-bold text-xs uppercase tracking-wider hover:gap-2 transition-all mc-btn"
        >
          <GitFork size={11} />
          Remix
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </button>
      </div>

      {/* sheen on hover */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </div>
    </Link>
  );
}
