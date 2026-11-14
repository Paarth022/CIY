'use client';
import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PluginCard from '@/components/PluginCard';
import { EXPLORE_PLUGINS } from '@/lib/examplePlugins';
import { CATEGORIES } from '@/lib/categories';
import {
  Search, Pickaxe, Boxes, X, ChevronRight,
  TrendingUp, Star, Zap, Flame, GitFork,
} from 'lucide-react';
import Link from 'next/link';

const SORT_OPTIONS = [
  { id: 'popular',   label: 'Most Popular', icon: Star      },
  { id: 'newest',    label: 'Newest',       icon: Zap       },
  { id: 'downloads', label: 'Downloads',    icon: TrendingUp },
];

const FEATURED = EXPLORE_PLUGINS.filter(p => p.featured).slice(0, 3);

function FeaturedCard({ plugin, rank }) {
  const emoji  = ['⚔️', '🎁', '🛡️', '🪙', '👁️', '✨', '⚡', '🧿', '💎', '🏹', '🗡️', '🔮'][Number(plugin.id) % 12];
  const colors = [
    { border: 'border-amber-500/40',  bg: 'rgba(245,158,11,0.08)',  accent: '#f59e0b', tag: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    { border: 'border-violet-500/40', bg: 'rgba(168,85,247,0.08)', accent: '#a855f7', tag: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
    { border: 'border-blue-500/40',   bg: 'rgba(59,130,246,0.08)', accent: '#3b82f6', tag: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  ];
  const c = colors[rank % 3];
  const remixUrl = `/create?prompt=${encodeURIComponent(`Remix and improve "${plugin.name}" — ${plugin.description}`)}`;

  return (
    <div className={`relative rounded-2xl border-2 ${c.border} overflow-hidden group card-lift`}
         style={{ background: `linear-gradient(135deg, ${c.bg}, #050505 70%)` }}>
      <div className="absolute inset-0 pixel-grid opacity-30 pointer-events-none" />
      {/* Trending badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-pixel tracking-[0.15em]"
           style={{ background: `${c.bg}`, border: `1px solid ${c.accent}40`, color: c.accent }}>
        <Flame className="w-2.5 h-2.5" /> TRENDING
      </div>

      <Link href={`/explore/${plugin.id}`} className="block p-6 relative z-10">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 mc-slot rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 shrink-0"
               style={{ filter: `drop-shadow(0 0 12px ${c.accent}60)` }}>
            {emoji}
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-white text-xl leading-tight mb-1 group-hover:text-primary transition-colors"
                style={{ textShadow: `0 0 20px ${c.accent}40` }}>
              {plugin.name}
            </h3>
            <div className="font-mono text-[10px] text-white/40">
              {plugin.downloads.toLocaleString()} downloads · Paper {plugin.version}
            </div>
          </div>
        </div>
        <p className="text-white/60 text-sm leading-relaxed mb-4 line-clamp-2">{plugin.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {plugin.tags.slice(0, 3).map(tag => (
            <span key={tag} className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border font-bold ${c.tag}`}>
              {tag}
            </span>
          ))}
        </div>
      </Link>

      <div className="border-t border-white/5 px-6 py-3 flex items-center justify-between relative z-10">
        <span className="text-[10px] font-mono text-white/30">★ FEATURED</span>
        <button
          onClick={() => window.location.href = remixUrl}
          className="mc-btn inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md transition-colors"
          style={{ background: `${c.accent}20`, color: c.accent, border: `1px solid ${c.accent}40` }}
        >
          <GitFork className="w-3 h-3" /> Remix
        </button>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery]       = useState('');
  const [sortBy, setSortBy]                 = useState('popular');
  const [plugins, setPlugins]               = useState(EXPLORE_PLUGINS);
  const [loading, setLoading]               = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/plugins?category=${activeCategory}&q=${encodeURIComponent(searchQuery)}&sortBy=${sortBy}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (data?.success && data?.plugins) {
          setPlugins(data.plugins);
        }
      } catch (err) {
        console.error('[explore] Failed to load dynamic plugins:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeCategory, searchQuery, sortBy]);

  const filteredPlugins = useMemo(() => {
    return plugins;
  }, [plugins]);

  const totalDownloads = useMemo(() => {
    return plugins.reduce((s, p) => s + (p.downloads || 0), 0);
  }, [plugins]);

  const showFeatured   = !searchQuery && activeCategory === 'all';

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-x-hidden">
      <div className="fixed inset-0 pixel-grid opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(34,197,94,0.08),transparent)] pointer-events-none" />

      <Navbar />

      <main className="flex-grow pt-28 pb-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4">

          {/* ── HERO ── */}
          <div className="scanlines rounded-3xl border-2 border-primary/20 p-8 md:p-12 mb-10 relative overflow-hidden"
               style={{
                 background:
                   'radial-gradient(ellipse 60% 60% at 50% 40%, rgba(34,197,94,0.08), transparent 70%),' +
                   'linear-gradient(180deg, #0a0a0a, #050505)',
               }}>
            <div className="absolute inset-0 pixel-grid opacity-50 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono tracking-[0.2em] uppercase mb-4">
                  <Boxes className="w-3 h-3" />
                  Plugin Library
                </div>
                <h1 className="font-pixel text-[22px] md:text-[30px] leading-[1.4] mb-4">
                  <span className="text-white">Explore</span> <span className="enchant-text">crafted</span><br />
                  <span className="text-primary glow-green">plugins.</span>
                </h1>
                <p className="text-white/50 max-w-md leading-relaxed">
                  Real plugins forged by the Craft It Yourself community. Click any plugin to view code, or remix it with AI.
                </p>
              </div>

              <Link
                href="/create"
                className="mc-btn inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black px-6 py-3 rounded-md font-black uppercase tracking-wider text-sm whitespace-nowrap shrink-0"
              >
                <Pickaxe className="w-4 h-4" />
                Craft Your Own
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* stats */}
            <div className="relative z-10 mt-8 pt-6 border-t border-white/5 grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <div className="font-pixel text-[18px] text-primary glow-green">{plugins.length}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold mt-1">Plugins</div>
              </div>
              <div>
                <div className="font-pixel text-[18px] text-primary glow-green">{totalDownloads.toLocaleString()}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold mt-1">Downloads</div>
              </div>
              <div>
                <div className="font-pixel text-[18px] text-primary glow-green">{CATEGORIES.length - 1}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold mt-1">Categories</div>
              </div>
            </div>
          </div>

          {/* ── FEATURED / TRENDING ── */}
          {showFeatured && FEATURED.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="font-pixel text-[11px] tracking-[0.2em] text-amber-400">TRENDING_THIS_WEEK</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {FEATURED.map((plugin, i) => (
                  <FeaturedCard key={plugin.id} plugin={plugin} rank={i} />
                ))}
              </div>
            </div>
          )}

          {/* ── SEARCH + SORT ── */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 mb-6">
            <div className="relative mc-slot rounded-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search plugins by name, keyword, or tag..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-white pl-11 pr-10 py-3.5 rounded-xl outline-none transition-colors placeholder:text-white/25 font-mono text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-primary hover:bg-white/5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex gap-1.5 mc-slot rounded-xl p-1">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={`mc-btn flex items-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-black uppercase tracking-wider transition-colors ${
                    sortBy === opt.id ? 'bg-primary text-black' : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <opt.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── CATEGORY CHIPS ── */}
          <div className="flex overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0 gap-2 pb-2 mb-10">
            {CATEGORIES.map(category => {
              const active = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`mc-btn shrink-0 px-4 py-2 rounded-md text-xs font-black uppercase tracking-wider transition-colors ${
                    active
                      ? 'bg-primary text-black border border-primary'
                      : 'bg-white/5 text-white/55 border border-white/10 hover:border-primary/40 hover:text-white'
                  }`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>

          {/* ── ALL PLUGINS LABEL ── */}
          {showFeatured && (
            <div className="flex items-center gap-3 mb-5">
              <span className="font-pixel text-[11px] tracking-[0.2em] text-primary/70">ALL_PLUGINS</span>
              <div className="flex-1 h-px bg-white/5" />
              <span className="font-mono text-[10px] text-white/30">{filteredPlugins.length} results</span>
            </div>
          )}

          {/* ── RESULTS BAR (when filtering) ── */}
          {!showFeatured && (
            <div className="flex items-center justify-between mb-6 font-mono text-[11px]">
              <div className="flex items-center gap-2 text-white/40">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span>
                  <span className="text-primary font-bold">{filteredPlugins.length}</span> result{filteredPlugins.length !== 1 ? 's' : ''}
                  {activeCategory !== 'all' && <span className="text-white/30"> · in {activeCategory}</span>}
                </span>
              </div>
              {(searchQuery || activeCategory !== 'all') && (
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
            </div>
          )}

          {/* ── PLUGIN GRID ── */}
          {filteredPlugins.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPlugins.map(plugin => (
                <PluginCard key={plugin.id} plugin={plugin} />
              ))}
            </div>
          ) : (
            <div className="mc-slot rounded-2xl py-20 text-center">
              <div className="text-6xl mb-4 opacity-40">📭</div>
              <h3 className="font-pixel text-[14px] text-white/70 mb-2">NO PLUGINS FOUND</h3>
              <p className="text-white/40 text-sm mb-6 max-w-sm mx-auto">
                Nothing matches those filters. Try adjusting your search or craft your own.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                  className="mc-btn inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-md font-black uppercase tracking-wider text-xs"
                >
                  Clear Filters
                </button>
                <Link
                  href="/create"
                  className="mc-btn inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black px-5 py-2.5 rounded-md font-black uppercase tracking-wider text-xs"
                >
                  <Pickaxe className="w-3.5 h-3.5" />
                  Craft Your Own
                </Link>
              </div>
            </div>
          )}

          {/* ── BOTTOM CTA ── */}
          {filteredPlugins.length > 0 && (
            <div className="mt-16 relative rounded-2xl border-2 border-primary/20 p-8 md:p-10 text-center overflow-hidden scanlines"
                 style={{
                   background:
                     'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(34,197,94,0.1), transparent 70%),' +
                     'linear-gradient(180deg, #0a0a0a, #050505)',
                 }}>
              <div className="absolute inset-0 pixel-grid opacity-50 pointer-events-none" />
              <div className="relative z-10">
                <div className="font-pixel text-[9px] text-primary tracking-[0.25em] mb-3">[CRAFTING_UNLOCKED]</div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
                  Don't see what you need?
                </h3>
                <p className="text-white/50 mb-6 max-w-md mx-auto">
                  Craft a fully custom plugin in seconds — just describe it.
                </p>
                <Link
                  href="/create"
                  className="mc-btn inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black px-6 py-3 rounded-md font-black uppercase tracking-wider text-sm"
                >
                  <Pickaxe className="w-4 h-4" />
                  Start Crafting
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
