'use client';
import { useState, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CodeViewer from '@/components/CodeViewer';
import GenerationMeta from '@/components/GenerationMeta';
import DiffViewer from '@/components/DiffViewer';
import AuthGate from '@/components/AuthGate';
import UpgradeModal from '@/components/UpgradeModal';
import ZipUploader from '@/components/ZipUploader';
import { AI_PROVIDERS, getDefaultProvider } from '@/lib/providers';
import { useAuth, getAvailableCredits, getToken, applyServerState, addHistoryEntry, addFullHistoryEntry } from '@/lib/auth';
import { toast } from 'sonner';
import {
  RefreshCw, Terminal, Cpu, ShieldCheck, Zap, Gem,
  ArrowRight, Sparkles, Package,
} from 'lucide-react';

const VERSIONS = ['1.21.4', '1.21', '1.20.6', '1.20.4', '1.20.1', '1.19.4'];

const EXAMPLE_CODE = `package com.example.oldplugin;

import org.bukkit.ChatColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;

public class OldPlugin extends JavaPlugin {

    @Override
    public void onEnable() {
        getLogger().info(ChatColor.GREEN + "OldPlugin enabled!");
    }

    @Override
    public boolean onCommand(CommandSender sender, Command cmd, String label, String[] args) {
        if (!(sender instanceof Player)) {
            sender.sendMessage(ChatColor.RED + "Only players can use this!");
            return true;
        }
        Player player = (Player) sender;
        player.sendMessage(ChatColor.GOLD + "Hello " + player.getName() + "!");
        player.setHealth(player.getMaxHealth());
        return true;
    }
}`;

function UpdateForm() {
  const { user, usage, refresh } = useAuth();
  const [code, setCode]                     = useState('');
  const [fromVersion, setFromVersion]       = useState('1.20.1');
  const [toVersion, setToVersion]           = useState('1.21.4');
  const [selectedProvider, setProvider]     = useState(getDefaultProvider().id);
  const [isUpdating, setIsUpdating]         = useState(false);
  const [result, setResult]                 = useState(null);
  const [meta, setMeta]                     = useState(null);
  const [viewMode, setViewMode]             = useState('code'); // 'code' | 'diff'
  const [upgradeOpen, setUpgradeOpen]       = useState(false);
  const [uploadedFiles, setUploadedFiles]   = useState(null);

  const creditsLeft = usage ? getAvailableCredits('normal', usage) : 0;
  const hasCredits  = creditsLeft > 0;

  const fillExample = () => {
    setCode(EXAMPLE_CODE);
    toast.success('Example loaded! Set your target version and hit Update Plugin.');
  };

  const handleUpdate = async () => {
    if (!code.trim()) {
      toast.error('Please paste your plugin code to update.');
      return;
    }
    if (fromVersion === toVersion) {
      toast.error('From and To versions must be different.');
      return;
    }
    if (!hasCredits) {
      setUpgradeOpen(true);
      return;
    }
    const token = getToken();
    if (!token) { toast.error('Session expired. Please sign in again.'); return; }

    setIsUpdating(true);
    setResult(null);
    setMeta(null);
    setViewMode('code');
    try {
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, fromVersion, toVersion, provider: selectedProvider, token, files: uploadedFiles || undefined }),
      });
      const data = await res.json();
      if (res.status === 402 || data?.code === 'no_credits') { setUpgradeOpen(true); return; }
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Update failed.');

      setResult(data.data);
      setMeta(data.meta || null);
      applyServerState({ token: data.token, usage: data.usage });
      addHistoryEntry('normal', data.data?.pluginName || 'UpdatedPlugin');
      addFullHistoryEntry({
        feature:    'update',
        tier:       'normal',
        pluginName: data.data?.pluginName,
        prompt:     `[update] ${fromVersion} → ${toVersion}`,
        files:      data.data?.files,
        meta:       data.meta,
      });
      refresh();
      toast.success(`Plugin updated to ${toVersion} successfully!`);
    } catch (err) {
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="max-w-[1600px] w-full mx-auto px-4 py-6 flex-grow">

        {/* HEADER */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono tracking-[0.2em] uppercase mb-3">
            <RefreshCw className="w-3 h-3" />
            Plugin Updater
          </div>
          <h1 className="font-pixel text-[18px] md:text-[24px] leading-[1.5] mb-3">
            <span className="text-white">Migrate to</span><br />
            <span className="text-blue-400" style={{ textShadow: '0 0 20px rgba(59,130,246,0.5)' }}>latest Minecraft</span>
            <span className="text-white">.</span>
          </h1>
          <p className="text-white/50 max-w-xl leading-relaxed">
            Paste your old plugin code. The AI rewrites deprecated API calls, fixes breaking changes, and returns a fully updated plugin for your target version.
          </p>
        </div>

        {/* CREDITS BAR */}
        {usage && (
          <div className="mb-6 mc-slot rounded-xl p-3 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 font-mono text-xs">
              <Gem className="w-3.5 h-3.5 text-primary" />
              <span className="text-white/50">Normal credits:</span>
              <span className="text-primary font-black">{creditsLeft === Infinity ? '∞' : creditsLeft}</span>
              <span className="text-white/30">· costs 1 per update</span>
            </div>
            {!hasCredits && (
              <button onClick={() => setUpgradeOpen(true)} className="mc-btn text-[10px] bg-amber-400/90 hover:bg-amber-400 text-black px-3 py-1.5 rounded-md font-black uppercase tracking-wider">
                <Zap className="w-3 h-3 inline mr-1" /> Get Credits
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-6">

          {/* LEFT — INPUT */}
          <div className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">

            {/* VERSION SELECTOR */}
            <div className="mc-slot rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-pixel text-[9px] tracking-[0.2em] text-blue-400">VERSION_MIGRATION</span>
              </div>

              <div className="flex items-center gap-4 mb-5">
                {/* FROM */}
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-2">From</label>
                  <div className="flex flex-wrap gap-1.5">
                    {VERSIONS.map(v => (
                      <button
                        key={v}
                        disabled={isUpdating}
                        onClick={() => setFromVersion(v)}
                        className={`mc-btn text-[11px] font-mono font-bold px-2.5 py-1.5 rounded-md border transition-colors ${
                          fromVersion === v
                            ? 'bg-white/20 text-white border-white/40'
                            : 'bg-black/40 text-white/40 border-white/10 hover:border-white/20 hover:text-white'
                        } ${v === toVersion ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ARROW */}
                <div className="flex flex-col items-center gap-1 pt-4">
                  <ArrowRight className="w-6 h-6 text-primary" />
                </div>

                {/* TO */}
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-2">To</label>
                  <div className="flex flex-wrap gap-1.5">
                    {VERSIONS.map(v => (
                      <button
                        key={v}
                        disabled={isUpdating}
                        onClick={() => setToVersion(v)}
                        className={`mc-btn text-[11px] font-mono font-bold px-2.5 py-1.5 rounded-md border transition-colors ${
                          toVersion === v
                            ? 'bg-primary text-black border-primary shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                            : 'bg-black/40 text-white/40 border-white/10 hover:border-white/20 hover:text-white'
                        } ${v === fromVersion ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Version diff badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/15 font-mono text-[11px]">
                <span className="text-white/40">{fromVersion}</span>
                <ArrowRight className="w-3 h-3 text-blue-400" />
                <span className="text-blue-400 font-bold">{toVersion}</span>
                <span className="text-white/30 ml-auto">migration</span>
              </div>
            </div>

            {/* CODE INPUT */}
            <div className="mc-slot rounded-2xl p-5 relative overflow-hidden scanlines">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-pixel text-[9px] tracking-[0.2em] text-blue-400">PLUGIN_CODE</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-white/30">{code.length}/30000</span>
                  <button
                    onClick={fillExample}
                    className="text-[10px] font-mono text-primary/60 hover:text-primary border border-primary/20 hover:border-primary/50 px-2 py-0.5 rounded transition-colors"
                  >
                    Load Example
                  </button>
                </div>
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                disabled={isUpdating}
                maxLength={30000}
                placeholder={`Paste your outdated plugin Java code here...\n\nYou can paste a single class or multiple files — the AI will handle the migration`}
                className="w-full min-h-[300px] bg-black/60 border border-white/8 outline-none rounded-xl p-4 text-white placeholder-white/20 resize-none transition-all duration-300 focus:border-blue-400/50 focus:shadow-[0_0_22px_rgba(59,130,246,0.15)] disabled:opacity-50 font-mono text-sm leading-relaxed"
              />
            </div>

            {/* OPTIONAL FULL PROJECT ZIP */}
            <div className="mc-slot rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-pixel text-[9px] tracking-[0.2em] text-blue-400">FULL_PROJECT</span>
                <span className="font-mono text-[10px] text-white/30 ml-auto">optional</span>
              </div>
              <p className="text-[10px] text-white/45 font-mono mb-3 leading-relaxed">
                Upload the whole plugin source as a <span className="text-blue-400">.zip</span> so the AI migrates every file consistently — pom.xml, plugin.yml, listeners, configs.
              </p>
              <ZipUploader
                accentColor="blue"
                label="Upload Full Plugin ZIP"
                onFilesExtracted={setUploadedFiles}
                onClear={() => setUploadedFiles(null)}
              />
            </div>

            {/* AI PROVIDER */}
            <div className="mc-slot rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                <span className="font-pixel text-[9px] tracking-[0.2em] text-primary">AI_ENGINE</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {AI_PROVIDERS.map(prov => (
                  <button
                    key={prov.id}
                    disabled={isUpdating}
                    onClick={() => setProvider(prov.id)}
                    className={`mc-btn py-2.5 px-2 rounded-md text-[11px] font-black uppercase tracking-wider border transition-colors ${
                      selectedProvider === prov.id
                        ? 'bg-primary text-black border-primary'
                        : 'bg-black/40 text-white/50 border-white/10 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {prov.name.replace('Google ', '').replace('Anthropic ', '').replace('OpenAI ', '')}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-white/40 flex items-center gap-1.5 mt-3">
                <ShieldCheck className="w-3 h-3 text-primary" />
                Powered by CIY credits — no API keys needed.
              </p>
            </div>

            {/* UPDATE BUTTON */}
            <button
              onClick={handleUpdate}
              disabled={isUpdating || !code.trim() || fromVersion === toVersion}
              className={`mc-btn w-full font-black text-base py-5 rounded-xl transition-all flex justify-center items-center gap-3 uppercase tracking-widest ${
                hasCredits
                  ? 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-900/40 disabled:cursor-not-allowed text-white shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]'
                  : 'bg-amber-400/90 hover:bg-amber-400 text-black'
              }`}
            >
              {isUpdating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Update Plugin
                  <Sparkles className="w-5 h-5" />
                </>
              )}
            </button>

            {/* WHAT IT UPDATES */}
            <div className="mc-slot rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2 font-pixel text-[9px] tracking-[0.2em] text-primary/80">
                <ShieldCheck className="w-3 h-3" /> WHAT GETS MIGRATED
              </div>
              <ul className="space-y-1.5 text-xs text-white/55 leading-relaxed">
                <li className="flex gap-2"><span className="text-blue-400/60">▸</span> Deprecated ChatColor → Adventure API Components</li>
                <li className="flex gap-2"><span className="text-blue-400/60">▸</span> Old event handler signatures → new Paper events</li>
                <li className="flex gap-2"><span className="text-blue-400/60">▸</span> pom.xml dependency version upgrades</li>
                <li className="flex gap-2"><span className="text-blue-400/60">▸</span> Legacy NBT → Persistent Data Container (PDC)</li>
                <li className="flex gap-2"><span className="text-blue-400/60">▸</span> Blocking calls → async patterns</li>
              </ul>
            </div>
          </div>

          {/* RIGHT — OUTPUT */}
          <div className="min-h-[700px]">
            {result ? (
              <div className="h-full flex flex-col gap-4">
                {/* Migration badge */}
                <div className="mc-slot rounded-xl p-3 flex items-center gap-3 font-mono text-sm">
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                  <span className="text-white/50">Migrated:</span>
                  <span className="text-white/40">{result.fromVersion}</span>
                  <ArrowRight className="w-3 h-3 text-blue-400" />
                  <span className="text-blue-400 font-bold">{result.toVersion}</span>
                  <div className="ml-auto flex items-center gap-1 p-0.5 rounded-lg bg-black/30 border border-white/5">
                    <button
                      onClick={() => setViewMode('code')}
                      className={`px-3 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest transition-colors ${
                        viewMode === 'code'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      Code
                    </button>
                    <button
                      onClick={() => setViewMode('diff')}
                      disabled={!result.originalCode}
                      className={`px-3 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest transition-colors ${
                        viewMode === 'diff'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'text-white/40 hover:text-white/70 disabled:opacity-40 disabled:cursor-not-allowed'
                      }`}
                    >
                      Diff
                    </button>
                  </div>
                </div>
                {meta && <GenerationMeta meta={meta} />}
                {viewMode === 'diff' ? (
                  <DiffViewer
                    originalCode={result.originalCode}
                    files={result.files}
                    fromVersion={result.fromVersion}
                    toVersion={result.toVersion}
                  />
                ) : (
                  <CodeViewer
                    isGenerating={isUpdating}
                    files={result.files}
                    pluginName={result.pluginName}
                    providerName={AI_PROVIDERS.find(p => p.id === selectedProvider)?.name}
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[600px] mc-slot rounded-2xl p-8 text-center relative overflow-hidden group scanlines">
                <div className="absolute inset-0 pixel-grid opacity-50 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]" />
                <div className="relative z-10 max-w-sm">
                  <div className="w-24 h-24 mc-slot mx-auto rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                       style={{ filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.2))' }}>
                    <span className="text-5xl">🔄</span>
                  </div>
                  <div className="font-pixel text-[10px] tracking-[0.25em] text-blue-400/70 mb-3">UPDATER · READY</div>
                  <h3 className="text-xl font-black text-white mb-3 uppercase tracking-wider">
                    Paste old code<br />get new code
                  </h3>
                  <p className="text-white/45 text-sm leading-relaxed mb-4">
                    The AI handles all breaking API changes and deprecated method replacements automatically.
                  </p>
                  <button
                    onClick={fillExample}
                    className="mc-btn inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-primary/5 text-white/60 hover:text-primary px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    <Package className="w-3.5 h-3.5" /> Load Example
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        tier="normal"
        reason="no-credits"
      />
    </>
  );
}

export default function UpdatePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-x-hidden">
      <div className="fixed inset-0 pixel-grid opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(59,130,246,0.06),transparent)] pointer-events-none" />

      <Navbar />
      <main className="flex-grow pt-24 flex flex-col relative z-10">
        <AuthGate>
          <Suspense fallback={
            <div className="p-8 text-center text-white/50 flex items-center justify-center gap-3">
              <div className="loader" style={{ width: 24, height: 24, borderWidth: 2 }} />
              Loading updater...
            </div>
          }>
            <UpdateForm />
          </Suspense>
        </AuthGate>
      </main>
      <Footer />
    </div>
  );
}
