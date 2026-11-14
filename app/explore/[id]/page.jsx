'use client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { EXPLORE_PLUGINS } from '@/lib/examplePlugins';
import {
  Download, Tag, ArrowLeft, GitFork, Package,
  Star, ChevronRight, Copy, CheckCircle2, ExternalLink,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { toast } from 'sonner';

const BLOCK_EMOJI = ['⚔️', '🎁', '🛡️', '🪙', '👁️', '✨', '⚡', '🧿', '💎', '🏹', '🗡️', '🔮'];

function getRarity(downloads = 0) {
  if (downloads >= 3000) return { cls: 'rarity-legendary', label: 'LEGENDARY', color: 'text-amber-400', glow: 'glow-gold', accent: 'rgba(245,158,11,0.15)' };
  if (downloads >= 2000) return { cls: 'rarity-epic',      label: 'EPIC',      color: 'text-violet-400', glow: 'glow-purple', accent: 'rgba(168,85,247,0.15)' };
  if (downloads >= 1000) return { cls: 'rarity-rare',      label: 'RARE',      color: 'text-blue-400',   glow: 'glow-blue',   accent: 'rgba(59,130,246,0.15)' };
  return { cls: 'rarity-common', label: 'COMMON', color: 'text-emerald-400', glow: 'glow-green', accent: 'rgba(34,197,94,0.1)' };
}

function getLanguage(path) {
  if (!path) return 'plaintext';
  if (path.endsWith('.java'))              return 'java';
  if (path.endsWith('.yml') || path.endsWith('.yaml')) return 'yaml';
  if (path.endsWith('.xml'))              return 'xml';
  if (path.endsWith('.md'))               return 'markdown';
  return 'plaintext';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function highlight(content, path) {
  try {
    return hljs.highlight(content ?? '', { language: getLanguage(path), ignoreIllegals: true }).value;
  } catch {
    return escapeHtml(content ?? '');
  }
}

function CodeBlock({ files }) {
  const [activeTab, setActiveTab] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (files && Object.keys(files).length > 0 && !activeTab) {
      setActiveTab(Object.keys(files)[0]);
    }
  }, [files, activeTab]);

  if (!files || Object.keys(files).length === 0) return null;

  const content = files[activeTab] || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border-2 rarity-legendary bg-[#080808] overflow-hidden scanlines">
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-white/8 bg-black/50 hide-scrollbar">
        {Object.keys(files).map((path) => (
          <button
            key={path}
            onClick={() => setActiveTab(path)}
            className={`px-4 py-3 text-xs font-mono whitespace-nowrap border-b-2 transition-colors font-bold ${
              activeTab === path
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {path.split('/').pop()}
          </button>
        ))}
      </div>
      {/* Code */}
      <div className="relative group">
        <button
          onClick={handleCopy}
          className="absolute right-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-surface/80 backdrop-blur border border-border rounded text-white/70 hover:text-white"
        >
          {copied
            ? <CheckCircle2 size={15} className="text-primary" />
            : <Copy size={15} />}
        </button>
        <div className="overflow-auto p-4 max-h-[500px] custom-scrollbar">
          <pre className="m-0 text-sm font-mono leading-relaxed">
            <code dangerouslySetInnerHTML={{ __html: highlight(content, activeTab) }} />
          </pre>
        </div>
      </div>
    </div>
  );
}

export default function PluginDetailPage({ params }) {
  const id = params?.id;
  const plugin = EXPLORE_PLUGINS.find(p => p.id === id);
  if (!plugin) notFound();

  const rarity = getRarity(plugin.downloads);
  const emoji  = BLOCK_EMOJI[Number(plugin.id) % BLOCK_EMOJI.length] || '📦';
  const related = EXPLORE_PLUGINS.filter(p => p.id !== plugin.id && p.tags.some(t => plugin.tags.includes(t))).slice(0, 3);

  const remixUrl = `/create?prompt=${encodeURIComponent(`Remix and improve "${plugin.name}" — ${plugin.description}. Add more features and make it more configurable.`)}`;

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-x-hidden">
      <div className="fixed inset-0 pixel-grid opacity-30 pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none"
           style={{ background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${rarity.accent}, transparent)` }} />
      <Navbar />

      <main className="flex-grow pt-28 pb-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4">

          {/* BREADCRUMB */}
          <div className="flex items-center gap-2 font-mono text-xs text-white/30 mb-8">
            <Link href="/explore" className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Explore
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className={rarity.color}>{plugin.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

            {/* LEFT MAIN */}
            <div className="space-y-6">

              {/* HERO CARD */}
              <div className={`relative rounded-3xl border-2 ${rarity.cls} bg-[#0a0a0a] p-8 overflow-hidden scanlines`}>
                <div className="absolute inset-0 pixel-grid opacity-40 pointer-events-none" />
                <div className="absolute top-4 right-4 font-pixel text-[8px] tracking-[0.25em] opacity-60" style={{ color: rarity.accent.replace('0.15', '1') }}>
                  ★{rarity.label}
                </div>

                <div className="relative z-10 flex items-start gap-6">
                  <div className="shrink-0 w-20 h-20 mc-slot rounded-2xl flex items-center justify-center text-4xl"
                       style={{ filter: `drop-shadow(0 0 16px ${rarity.accent.replace('0.15', '0.5')})` }}>
                    {emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className={`text-3xl md:text-4xl font-black text-white mb-2 ${rarity.glow}`}>
                      {plugin.name}
                    </h1>
                    <div className="flex items-center gap-3 font-mono text-[11px] text-white/40 mb-4 flex-wrap">
                      <span>by <span className="text-primary/80">{plugin.author}</span></span>
                      <span className="text-white/15">·</span>
                      <span>Paper {plugin.version}</span>
                      <span className="text-white/15">·</span>
                      <span className="capitalize">{plugin.complexity} complexity</span>
                    </div>
                    <p className="text-white/65 leading-relaxed text-lg mb-6">{plugin.description}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {plugin.tags.map(tag => (
                        <Link
                          key={tag}
                          href={`/explore?category=${tag.toLowerCase()}`}
                          className="inline-flex items-center gap-1.5 bg-primary/8 text-primary/80 border border-primary/15 text-xs uppercase tracking-wider px-3 py-1 rounded-full font-bold hover:bg-primary/15 transition-colors"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </Link>
                      ))}
                    </div>

                    {/* Action row */}
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={remixUrl}
                        className="mc-btn inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black px-6 py-3 rounded-md font-black uppercase tracking-wider text-sm"
                      >
                        <GitFork className="w-4 h-4" />
                        Remix with AI
                      </Link>
                      <Link
                        href="/create"
                        className="mc-btn inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white px-6 py-3 rounded-md font-black uppercase tracking-wider text-sm"
                      >
                        <Package className="w-4 h-4" />
                        Craft Similar
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* CODE VIEWER */}
              {plugin.files && Object.keys(plugin.files).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-pixel text-[9px] tracking-[0.2em] text-primary">SOURCE_CODE</span>
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="font-mono text-[10px] text-white/30">{Object.keys(plugin.files).length} files</span>
                  </div>
                  <CodeBlock files={plugin.files} />
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="space-y-5">

              {/* STATS */}
              <div className="mc-slot rounded-2xl p-5">
                <div className="font-pixel text-[9px] tracking-[0.2em] text-primary mb-4">PLUGIN_STATS</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-sm">
                    <span className="text-white/50 flex items-center gap-2">
                      <Download className="w-3.5 h-3.5" /> Downloads
                    </span>
                    <span className="text-primary font-black">{plugin.downloads.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-sm">
                    <span className="text-white/50">MC Version</span>
                    <span className="text-white font-bold">{plugin.version}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-sm">
                    <span className="text-white/50">Complexity</span>
                    <span className={`font-bold capitalize ${plugin.complexity === 'Advanced' ? 'text-amber-400' : plugin.complexity === 'Medium' ? 'text-blue-400' : 'text-emerald-400'}`}>
                      {plugin.complexity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-sm">
                    <span className="text-white/50">Rarity</span>
                    <span className={`font-bold ${rarity.color}`}>★ {rarity.label}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-sm">
                    <span className="text-white/50">Rating</span>
                    <span className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                      ))}
                    </span>
                  </div>
                </div>
              </div>

              {/* REMIX CTA */}
              <div className={`rounded-2xl border-2 ${rarity.cls} p-5 relative overflow-hidden scanlines`}
                   style={{ background: `linear-gradient(135deg, #0a0a0a, #050505)` }}>
                <div className="absolute inset-0 pixel-grid opacity-30 pointer-events-none" />
                <div className="relative z-10">
                  <div className="font-pixel text-[9px] tracking-[0.2em] text-primary mb-2">REMIX_THIS</div>
                  <p className="text-white/60 text-sm mb-4 leading-relaxed">
                    Like this plugin? Customize it with AI — add features, change mechanics, or make it your own.
                  </p>
                  <Link
                    href={remixUrl}
                    className="mc-btn flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-black px-4 py-2.5 rounded-md font-black uppercase tracking-wider text-xs w-full"
                  >
                    <GitFork className="w-3.5 h-3.5" />
                    Remix with AI
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* RELATED */}
              {related.length > 0 && (
                <div className="mc-slot rounded-2xl p-5">
                  <div className="font-pixel text-[9px] tracking-[0.2em] text-primary mb-4">RELATED_PLUGINS</div>
                  <div className="space-y-3">
                    {related.map(rel => {
                      const relRarity = getRarity(rel.downloads);
                      const relEmoji  = BLOCK_EMOJI[Number(rel.id) % BLOCK_EMOJI.length] || '📦';
                      return (
                        <Link
                          key={rel.id}
                          href={`/explore/${rel.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                        >
                          <div className="w-9 h-9 mc-slot rounded-md flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                            {relEmoji}
                          </div>
                          <div className="min-w-0">
                            <div className={`font-bold text-sm text-white truncate group-hover:text-primary transition-colors ${relRarity.glow}`}>
                              {rel.name}
                            </div>
                            <div className="font-mono text-[10px] text-white/30">
                              {rel.downloads.toLocaleString()} downloads
                            </div>
                          </div>
                          <ChevronRight className="w-3 h-3 text-white/30 group-hover:text-primary transition-colors shrink-0 ml-auto" />
                        </Link>
                      );
                    })}
                  </div>
                  <Link
                    href="/explore"
                    className="mt-3 block text-center text-[11px] font-bold uppercase tracking-wider text-primary/60 hover:text-primary transition-colors"
                  >
                    View all plugins →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
