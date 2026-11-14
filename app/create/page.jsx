'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CodeViewer from '@/components/CodeViewer';
import GenerationMeta from '@/components/GenerationMeta';
import { sseFetchPost } from '@/lib/sseClient';
import AuthGate from '@/components/AuthGate';
import UpgradeModal from '@/components/UpgradeModal';
import ZipUploader from '@/components/ZipUploader';
import { AI_PROVIDERS, getDefaultProvider } from '@/lib/providers';
import { QUICK_PROMPTS } from '@/lib/examplePlugins';
import { COMPLEXITY_TO_TIER, TIERS } from '@/lib/plans';
import { useAuth, getAvailableCredits, getToken, applyServerState, addHistoryEntry, addFullHistoryEntry } from '@/lib/auth';
import {
  Sparkles, Settings2, Pickaxe, Cpu, Zap,
  Terminal, Gem, Lock, Package, ShieldCheck,
  RotateCcw, Bug, RefreshCw,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

function CreateForm() {
  const searchParams = useSearchParams();
  const initPrompt = searchParams.get('prompt') || '';
  const { user, usage, refresh } = useAuth();

  const [prompt, setPrompt]                     = useState(initPrompt);
  const [version, setVersion]                   = useState('1.21.4');
  const [complexity, setComplexity]             = useState('Simple');
  const [selectedProvider, setSelectedProvider] = useState(getDefaultProvider().id);
  const [isGenerating, setIsGenerating]         = useState(false);
  const [generatedData, setGeneratedData]       = useState(null);
  const [generationMeta, setGenerationMeta]     = useState(null);
  const [streamingText, setStreamingText]       = useState('');
  const [uploadedFiles, setUploadedFiles]       = useState(null);

  // Upgrade modal state
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeCtx, setUpgradeCtx]   = useState({ tier: 'normal', reason: 'no-credits' });

  // One-off migration: scrub legacy BYOK keys left in localStorage.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem('ciy-api-keys'); } catch {}
    }
  }, []);

  const selectedTier = COMPLEXITY_TO_TIER[complexity] || 'normal';
  const creditsLeft  = usage ? getAvailableCredits(selectedTier, usage) : 0;
  const hasCredits   = creditsLeft > 0;

  const handleComplexityChange = (tierKey, locked) => {
    if (locked) {
      const tier = COMPLEXITY_TO_TIER[tierKey];
      setUpgradeCtx({ tier, reason: 'locked' });
      setUpgradeOpen(true);
      return;
    }
    setComplexity(tierKey);
  };

  const handleProviderSelect = (provId) => {
    const prov = AI_PROVIDERS.find(p => p.id === provId);
    if (prov?.premiumOnly) {
      const userPlan = usage?.planId || 'free';
      const isPremium = userPlan === 'crafter' || userPlan === 'master';
      if (!isPremium) {
        setUpgradeCtx({ tier: 'crafter', reason: 'locked' });
        setUpgradeOpen(true);
        toast.info('⚡ CIY OmniAgent is a premium-only feature. Upgrading unlocks it instantly!');
        return;
      }
    }
    setSelectedProvider(provId);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe the plugin you want to craft.');
      return;
    }
    if (!hasCredits) {
      setUpgradeCtx({ tier: selectedTier, reason: 'no-credits' });
      setUpgradeOpen(true);
      return;
    }
    const token = getToken();
    if (!token) {
      toast.error('Your session has expired. Please sign in again.');
      return;
    }

    setIsGenerating(true);
    setGeneratedData(null);
    setGenerationMeta(null);
    setStreamingText('');

    let buffered = '';
    let outOfCredits = false;
    let errorMsg = null;
    let finalPayload = null;

    try {
      await sseFetchPost('/api/generate/stream', {
        description: prompt,
        version,
        complexity,
        provider: selectedProvider,
        token,
        files: uploadedFiles || undefined,
      }, {
        onEvent: (event, data) => {
          if (event === 'chunk') {
            buffered += data.text || '';
            setStreamingText(buffered);
          } else if (event === 'done') {
            finalPayload = data;
          } else if (event === 'error') {
            if (data?.code === 'no_credits' || data?.status === 402) {
              outOfCredits = true;
            } else {
              errorMsg = data?.error || 'Generation failed.';
            }
          }
        },
      });

      if (outOfCredits) {
        setUpgradeCtx({ tier: selectedTier, reason: 'no-credits' });
        setUpgradeOpen(true);
        return;
      }
      if (errorMsg) throw new Error(errorMsg);
      if (!finalPayload) throw new Error('Stream closed without a final payload.');

      setGeneratedData(finalPayload.data);
      setGenerationMeta(finalPayload.meta || null);
      
      // Auto-save generated plugin to Supabase Database
      const genToken = finalPayload.token;
      if (genToken && finalPayload.data) {
        fetch('/api/plugins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: finalPayload.data.pluginName || 'Untitled',
            description: prompt,
            complexity: complexity || 'Medium',
            version: version || '1.21.4',
            tags: [complexity === 'Advanced' ? 'System' : complexity === 'Medium' ? 'Core' : 'Utility'],
            files: finalPayload.data.files,
            token: genToken
          })
        }).catch(err => console.error('[create] DB auto-save failed:', err));
      }

      applyServerState({ token: finalPayload.token, usage: finalPayload.usage });
      addHistoryEntry(selectedTier, finalPayload.data?.pluginName || 'Untitled');
      addFullHistoryEntry({
        feature:    'create',
        tier:       selectedTier,
        pluginName: finalPayload.data?.pluginName,
        prompt,
        files:      finalPayload.data?.files,
        meta:       finalPayload.meta,
      });
      refresh();
      toast.success('Plugin crafted successfully!');
    } catch (err) {
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setIsGenerating(false);
      setStreamingText('');
    }
  };

  // Build the three tier buttons — some locked depending on entitlements
  const COMPLEXITY_TIERS = [
    { id: 'Simple',   label: 'Normal',   tierKey: 'normal',   rarity: 'rarity-common',    desc: 'Single class' },
    { id: 'Medium',   label: 'Medium',   tierKey: 'medium',   rarity: 'rarity-rare',      desc: 'Clean arch' },
    { id: 'Advanced', label: 'Advanced', tierKey: 'advanced', rarity: 'rarity-legendary', desc: 'Full system' },
  ].map(t => {
    const avail = usage ? getAvailableCredits(t.tierKey, usage) : 0;
    return { ...t, available: avail, locked: avail === 0 };
  });

  return (
    <>
      <div className="max-w-[1600px] w-full mx-auto px-4 py-6 flex-grow">

        {/* ── HEADER ── */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono tracking-[0.2em] uppercase mb-3">
              <Pickaxe className="w-3 h-3" />
              Crafting Station
            </div>
            <h1 className="font-pixel text-[18px] md:text-[22px] leading-[1.5]">
              <span className="text-white">Build your</span><br />
              <span className="enchant-text">Minecraft plugin</span>
              <span className="text-primary glow-green">.</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-white/40">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-primary">AI CORE ONLINE</span>
            </span>
            <span className="text-white/15">|</span>
            <span>{user?.name || 'crafter'}</span>
          </div>
        </div>

        {/* ── CREDITS BAR ── */}
        {usage && (
          <div className="mb-6 mc-slot rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Gem className="w-3.5 h-3.5 text-primary" />
                <span className="font-pixel text-[9px] tracking-[0.2em] text-primary/80">INVENTORY</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {['advanced', 'medium', 'normal'].map(tier => {
                  const t = TIERS[tier];
                  const n = getAvailableCredits(tier, usage);
                  return (
                    <div key={tier} className="flex items-center gap-1.5 font-mono text-xs">
                      <span className={`${t.color} font-bold uppercase tracking-wider text-[10px]`}>
                        {t.label}
                      </span>
                      <span className="text-white/70">{n === Infinity ? '∞' : n}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/pricing#packs" className="mc-btn inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] px-3 py-1.5 rounded-md font-black uppercase tracking-wider">
                <Package className="w-3 h-3" />
                Buy Pack
              </Link>
              <Link href="/pricing" className="mc-btn inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-black text-[10px] px-3 py-1.5 rounded-md font-black uppercase tracking-wider">
                <Zap className="w-3 h-3" />
                Upgrade
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">

          {/* ══════════════════════
              LEFT — CRAFTING INPUT
          ══════════════════════ */}
          <div className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">

            {/* PROMPT SLOT */}
            <div className="mc-slot rounded-2xl p-5 scanlines relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-primary" />
                  <span className="font-pixel text-[9px] tracking-[0.2em] text-primary">RECIPE_INPUT</span>
                </div>
                <span className="font-mono text-[10px] text-white/30">{prompt.length}/2000</span>
              </div>

              <textarea
                id="prompt-textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
                maxLength={2000}
                placeholder={`Describe your plugin...\n\nExample: Create a /heal command that heals the player to full health, with a 30s cooldown and permission 'ciy.heal'. Make all messages configurable in config.yml`}
                className="w-full min-h-[200px] md:min-h-[220px] bg-black/60 border border-white/8 outline-none rounded-xl p-4 text-white placeholder-white/25 resize-none transition-all duration-300 focus:border-primary/50 focus:shadow-[0_0_22px_rgba(34,197,94,0.18)] disabled:opacity-50 font-mono text-sm leading-relaxed"
              />

              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2 text-[10px] font-pixel tracking-[0.2em] text-primary/70">
                  <Sparkles className="w-3 h-3" /> QUICK_CRAFTS
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((qPrompt, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(qPrompt)}
                      disabled={isGenerating}
                      className="mc-btn text-[11px] bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-primary/10 text-white/60 hover:text-primary px-3 py-1.5 rounded-md transition-colors"
                    >
                      {qPrompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* OPTIONAL ZIP CONTEXT */}
            <div className="mc-slot rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-3.5 h-3.5 text-primary" />
                <span className="font-pixel text-[9px] tracking-[0.2em] text-primary">EXISTING_PROJECT</span>
                <span className="font-mono text-[10px] text-white/30 ml-auto">optional</span>
              </div>
              <p className="text-[10px] text-white/45 font-mono mb-3 leading-relaxed">
                Upload your current plugin as a <span className="text-primary">.zip</span> so the AI can extend it instead of starting from scratch.
              </p>
              <ZipUploader
                accentColor="primary"
                label="Upload Existing Plugin ZIP"
                onFilesExtracted={setUploadedFiles}
                onClear={() => setUploadedFiles(null)}
              />
            </div>

            {/* VERSION + COMPLEXITY */}
            <div className="mc-slot rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="w-3.5 h-3.5 text-primary" />
                <span className="font-pixel text-[9px] tracking-[0.2em] text-primary">BUILD_CONFIG</span>
              </div>

              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-2">Minecraft Version</label>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {['1.21.4','1.21','1.20.6','1.20.4','1.20.1','1.19.4'].map((v) => (
                  <button
                    key={v}
                    disabled={isGenerating}
                    onClick={() => setVersion(v)}
                    className={`mc-btn text-[11px] font-mono font-bold px-3 py-1.5 rounded-md border transition-colors ${
                      version === v
                        ? 'bg-primary text-black border-primary shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                        : 'bg-black/40 text-white/50 border-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Complexity tiers with lock state */}
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-2 flex items-center justify-between">
                <span>Rarity Tier</span>
                <Link href="/pricing" className="text-primary/60 hover:text-primary font-mono text-[9px] normal-case tracking-normal">
                  unlock all →
                </Link>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {COMPLEXITY_TIERS.map(tier => {
                  const active = complexity === tier.id;
                  return (
                    <button
                      key={tier.id}
                      disabled={isGenerating}
                      onClick={() => handleComplexityChange(tier.id, tier.locked && !active)}
                      className={`card-lift text-left px-3 py-3 rounded-lg border-2 transition-all bg-[#0a0a0a] ${tier.rarity} relative overflow-hidden ${
                        active ? 'ring-2 ring-primary/60 scale-[1.02]' : tier.locked ? 'opacity-50' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {tier.locked && !active && (
                        <div className="absolute top-1.5 right-1.5">
                          <Lock className="w-3 h-3 text-white/50" />
                        </div>
                      )}
                      <div className="font-pixel text-[8px] tracking-[0.2em] text-white/80 mb-1">★ {tier.label.toUpperCase()}</div>
                      <div className="font-mono text-[10px] text-white/50">{tier.desc}</div>
                      <div className={`font-mono text-[9px] mt-1 ${tier.locked ? 'text-white/30' : 'text-primary/70'}`}>
                        {tier.available === Infinity ? '∞ credits' : `${tier.available} credit${tier.available !== 1 ? 's' : ''}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI PROVIDER */}
            <div className="mc-slot rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                <span className="font-pixel text-[9px] tracking-[0.2em] text-primary">AI_ENGINE</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {AI_PROVIDERS.map(prov => {
                  const isSelected = selectedProvider === prov.id;
                  const isPremiumUser = user?.plan === 'crafter' || user?.plan === 'master';
                  const showLock = prov.premiumOnly && !isPremiumUser;
                  return (
                    <button
                      key={prov.id}
                      disabled={isGenerating}
                      onClick={() => handleProviderSelect(prov.id)}
                      className={`mc-btn py-2.5 px-2 rounded-md text-[10px] font-black uppercase tracking-wider border transition-colors flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-primary text-black border-primary shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                          : prov.premiumOnly
                            ? 'bg-amber-400/10 text-amber-400/80 border-amber-400/20 hover:text-amber-400 hover:border-amber-400/40 hover:bg-amber-400/20'
                            : 'bg-black/40 text-white/50 border-white/10 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <span>{prov.name.replace('Google ','').replace('Anthropic ','').replace('OpenAI ','').replace('⚡ ','')}</span>
                      {showLock && (
                        <Lock className="w-2.5 h-2.5 text-amber-400" />
                      )}
                      {prov.premiumOnly && !isSelected && !showLock && (
                        <span className="text-[8px] bg-amber-400/25 px-1 py-0.5 rounded text-amber-400 border border-amber-400/30">PRO</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mb-3 p-3 bg-black/40 rounded-xl border border-white/5 text-[10px] text-white/40 leading-relaxed font-mono select-none">
                {AI_PROVIDERS.find(p => p.id === selectedProvider)?.description}
              </div>

              <p className="text-[10px] text-white/40 flex items-center gap-1.5 select-none">
                <ShieldCheck className="w-3 h-3 text-primary" />
                Powered by CIY credits — no API keys needed.
              </p>
            </div>

            {/* CRAFT BUTTON */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className={`mc-btn w-full font-black text-base py-5 rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_40px_rgba(34,197,94,0.5)] transition-all flex justify-center items-center gap-3 uppercase tracking-widest ${
                hasCredits
                  ? 'bg-primary hover:bg-primary-hover disabled:bg-primary/20 disabled:cursor-not-allowed text-black'
                  : 'bg-amber-400/90 hover:bg-amber-400 text-black'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Crafting...
                </>
              ) : hasCredits ? (
                <>
                  <Pickaxe className="w-5 h-5" />
                  Craft Plugin
                  <Zap className="w-5 h-5" />
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Upgrade to Craft
                  <Zap className="w-5 h-5" />
                </>
              )}
            </button>

            {/* REGENERATE BUTTON — only shown after a generation */}
            {generatedData && !isGenerating && (
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || !hasCredits}
                className="mc-btn w-full font-black text-sm py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 text-white/70 hover:text-primary transition-all flex justify-center items-center gap-2 uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4" />
                Regenerate
              </button>
            )}

            {/* REFINE — feed the previous output back as ZIP context for incremental changes */}
            {generatedData && !isGenerating && (
              <button
                onClick={() => {
                  if (generatedData?.files) {
                    setUploadedFiles(generatedData.files);
                    setPrompt('');
                    toast.success('Previous plugin loaded as context. Describe what to change.');
                    const el = document.getElementById('prompt-textarea');
                    if (el) el.focus();
                  }
                }}
                className="mc-btn w-full font-black text-sm py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 transition-all flex justify-center items-center gap-2 uppercase tracking-widest"
              >
                <Sparkles className="w-4 h-4" />
                Refine / Add More
              </button>
            )}

            {/* TIPS + TOOLS */}
            <div className="mc-slot rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2 font-pixel text-[9px] tracking-[0.2em] text-amber-400/80">
                <Gem className="w-3 h-3" /> CRAFTER_TIPS
              </div>
              <ul className="space-y-1.5 text-xs text-white/55 leading-relaxed mb-4">
                <li className="flex gap-2"><span className="text-primary/60">▸</span> Be specific about commands &amp; permissions</li>
                <li className="flex gap-2"><span className="text-primary/60">▸</span> Mention if database storage is needed</li>
                <li className="flex gap-2"><span className="text-primary/60">▸</span> List every feature you want included</li>
                <li className="flex gap-2"><span className="text-primary/60">▸</span> Include config options explicitly</li>
              </ul>
              <div className="border-t border-white/5 pt-3 grid grid-cols-2 gap-2">
                <Link
                  href="/debug"
                  className="mc-btn flex items-center gap-1.5 justify-center px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  <Bug className="w-3 h-3" /> Debug
                </Link>
                <Link
                  href="/update"
                  className="mc-btn flex items-center gap-1.5 justify-center px-3 py-2 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Update
                </Link>
              </div>
            </div>
          </div>

          {/* ══════════════════════
              RIGHT — OUTPUT
          ══════════════════════ */}
          <div className="min-h-[700px]">
            {generationMeta && <GenerationMeta meta={generationMeta} />}
            <CodeViewer
              isGenerating={isGenerating}
              streamingText={streamingText}
              files={generatedData?.files}
              pluginName={generatedData?.pluginName}
              providerName={AI_PROVIDERS.find(p => p.id === selectedProvider)?.name}
            />
          </div>
        </div>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        tier={upgradeCtx.tier}
        reason={upgradeCtx.reason}
      />
    </>
  );
}

export default function CreatePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-x-hidden">
      <div className="fixed inset-0 pixel-grid opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(34,197,94,0.08),transparent)] pointer-events-none" />

      <Navbar />
      <main className="flex-grow pt-24 flex flex-col relative z-10">
        <AuthGate>
          <Suspense fallback={
            <div className="p-8 text-center text-white/50 flex items-center justify-center gap-3">
              <div className="loader" style={{ width: 24, height: 24, borderWidth: 2 }} />
              Loading crafting station...
            </div>
          }>
            <CreateForm />
          </Suspense>
        </AuthGate>
      </main>
      <Footer />
    </div>
  );
}
