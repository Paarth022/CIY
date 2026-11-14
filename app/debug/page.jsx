'use client';
import { useState, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CodeViewer from '@/components/CodeViewer';
import GenerationMeta from '@/components/GenerationMeta';
import AuthGate from '@/components/AuthGate';
import UpgradeModal from '@/components/UpgradeModal';
import ZipUploader from '@/components/ZipUploader';
import { AI_PROVIDERS, getDefaultProvider } from '@/lib/providers';
import { useAuth, getAvailableCredits, getToken, applyServerState, addHistoryEntry, addFullHistoryEntry } from '@/lib/auth';
import { toast } from 'sonner';
import {
  Bug, Terminal, Cpu, ShieldCheck, Zap, Gem,
  AlertTriangle, CheckCircle2, Package, Sparkles,
} from 'lucide-react';

const VERSIONS = ['1.21.4', '1.21', '1.20.6', '1.20.4', '1.20.1', '1.19.4'];

const EXAMPLE_BROKEN = `package com.example.myplugin;

import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;

public class MyPlugin extends JavaPlugin {
    @Override
    public void onEnable() {
        // forgot saveDefaultConfig()
        getLogger().info("Plugin enabled!");
    }

    @Override
    public boolean onCommand(CommandSender sender, Command cmd, String label, String[] args) {
        // NullPointerException — sender not cast to Player before calling player methods
        Player player = (Player) sender;
        player.sendMessage("Your health: " + player.getHealth());
        return true;
    }
}`;

const EXAMPLE_ERROR = `[ERROR] A critical error has occurred while executing onCommand
java.lang.ClassCastException: class org.bukkit.craftbukkit.command.ConsoleCommandSender 
  cannot be cast to class org.bukkit.entity.Player
  at com.example.myplugin.MyPlugin.onCommand(MyPlugin.java:18)`;

function DebugForm() {
  const { user, usage, refresh } = useAuth();
  const [brokenCode, setBrokenCode]         = useState('');
  const [errorLog, setErrorLog]             = useState('');
  const [version, setVersion]               = useState('1.21.4');
  const [selectedProvider, setProvider]     = useState(getDefaultProvider().id);
  const [isDebugging, setIsDebugging]       = useState(false);
  const [result, setResult]                 = useState(null);
  const [meta, setMeta]                     = useState(null);
  const [upgradeOpen, setUpgradeOpen]       = useState(false);
  const [uploadedFiles, setUploadedFiles]   = useState(null);

  const creditsLeft = usage ? getAvailableCredits('normal', usage) : 0;
  const hasCredits  = creditsLeft > 0;

  const fillExample = () => {
    setBrokenCode(EXAMPLE_BROKEN);
    setErrorLog(EXAMPLE_ERROR);
    toast.success('Example loaded! Hit Fix Plugin to see it in action.');
  };

  const handleDebug = async () => {
    if (!brokenCode.trim()) {
      toast.error('Paste your broken plugin code first.');
      return;
    }
    if (!hasCredits) {
      setUpgradeOpen(true);
      return;
    }
    const token = getToken();
    if (!token) { toast.error('Session expired. Please sign in again.'); return; }

    setIsDebugging(true);
    setResult(null);
    setMeta(null);
    try {
      const res = await fetch('/api/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brokenCode, errorLog, version, provider: selectedProvider, token, files: uploadedFiles || undefined }),
      });
      const data = await res.json();
      if (res.status === 402 || data?.code === 'no_credits') { setUpgradeOpen(true); return; }
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Debug failed.');

      setResult(data.data);
      setMeta(data.meta || null);
      applyServerState({ token: data.token, usage: data.usage });
      addHistoryEntry('normal', data.data?.pluginName || 'FixedPlugin');
      addFullHistoryEntry({
        feature:    'debug',
        tier:       'normal',
        pluginName: data.data?.pluginName,
        prompt:     `[debug] ${(errorLog || '').slice(0, 500)}`,
        files:      data.data?.files,
        meta:       data.meta,
      });
      refresh();
      toast.success('Plugin debugged successfully!');
    } catch (err) {
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <>
      <div className="max-w-[1600px] w-full mx-auto px-4 py-6 flex-grow">

        {/* HEADER */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono tracking-[0.2em] uppercase mb-3">
            <Bug className="w-3 h-3" />
            Plugin Debugger
          </div>
          <h1 className="font-pixel text-[18px] md:text-[24px] leading-[1.5] mb-3">
            <span className="text-white">Fix your</span><br />
            <span className="text-red-400" style={{ textShadow: '0 0 20px rgba(239,68,68,0.5)' }}>broken plugin</span>
            <span className="text-white">.</span>
          </h1>
          <p className="text-white/50 max-w-xl leading-relaxed">
            Paste your broken Java code and error log. The AI identifies the root cause, fixes every issue, and returns production-ready code.
          </p>
        </div>

        {/* CREDITS BAR */}
        {usage && (
          <div className="mb-6 mc-slot rounded-xl p-3 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 font-mono text-xs">
              <Gem className="w-3.5 h-3.5 text-primary" />
              <span className="text-white/50">Normal credits:</span>
              <span className="text-primary font-black">{creditsLeft === Infinity ? '∞' : creditsLeft}</span>
              <span className="text-white/30">· costs 1 per debug</span>
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

            {/* BROKEN CODE INPUT */}
            <div className="mc-slot rounded-2xl p-5 relative overflow-hidden scanlines">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-red-400" />
                  <span className="font-pixel text-[9px] tracking-[0.2em] text-red-400">BROKEN_CODE</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-white/30">{brokenCode.length}/30000</span>
                  <button
                    onClick={fillExample}
                    className="text-[10px] font-mono text-primary/60 hover:text-primary border border-primary/20 hover:border-primary/50 px-2 py-0.5 rounded transition-colors"
                  >
                    Load Example
                  </button>
                </div>
              </div>
              <textarea
                value={brokenCode}
                onChange={e => setBrokenCode(e.target.value)}
                disabled={isDebugging}
                maxLength={30000}
                placeholder={`Paste your broken Java code here...\n\nExample: your plugin's main class, listeners, commands — anything that's broken`}
                className="w-full min-h-[240px] bg-black/60 border border-white/8 outline-none rounded-xl p-4 text-white placeholder-white/20 resize-none transition-all duration-300 focus:border-red-400/50 focus:shadow-[0_0_22px_rgba(239,68,68,0.15)] disabled:opacity-50 font-mono text-sm leading-relaxed"
              />
            </div>

            {/* ERROR LOG INPUT */}
            <div className="mc-slot rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-pixel text-[9px] tracking-[0.2em] text-amber-400">ERROR_LOG</span>
                <span className="font-mono text-[10px] text-white/30 ml-auto">optional</span>
              </div>
              <textarea
                value={errorLog}
                onChange={e => setErrorLog(e.target.value)}
                disabled={isDebugging}
                maxLength={5000}
                placeholder={`Paste your server console error here...\n\n[ERROR] java.lang.NullPointerException\n  at com.example.MyPlugin.onCommand(MyPlugin.java:42)`}
                className="w-full min-h-[120px] bg-black/60 border border-white/8 outline-none rounded-xl p-4 text-white placeholder-white/20 resize-none transition-all duration-300 focus:border-amber-400/50 focus:shadow-[0_0_22px_rgba(245,158,11,0.15)] disabled:opacity-50 font-mono text-xs leading-relaxed"
              />
              <p className="mt-2 text-[10px] text-white/30 font-mono">
                Providing the error log helps AI pinpoint the exact issue faster.
              </p>
            </div>

            {/* OPTIONAL FULL PROJECT ZIP */}
            <div className="mc-slot rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-3.5 h-3.5 text-red-400" />
                <span className="font-pixel text-[9px] tracking-[0.2em] text-red-400">FULL_PROJECT</span>
                <span className="font-mono text-[10px] text-white/30 ml-auto">optional</span>
              </div>
              <p className="text-[10px] text-white/45 font-mono mb-3 leading-relaxed">
                Upload the whole plugin source as a <span className="text-red-400">.zip</span> so the AI sees every class, listener, and config — not just the broken snippet.
              </p>
              <ZipUploader
                accentColor="red"
                label="Upload Full Plugin ZIP"
                onFilesExtracted={setUploadedFiles}
                onClear={() => setUploadedFiles(null)}
              />
            </div>

            {/* VERSION + PROVIDER */}
            <div className="mc-slot rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                <span className="font-pixel text-[9px] tracking-[0.2em] text-primary">DEBUG_CONFIG</span>
              </div>

              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-2">Target MC Version</label>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {VERSIONS.map(v => (
                  <button
                    key={v}
                    disabled={isDebugging}
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

              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-2">AI Engine</label>
              <div className="grid grid-cols-3 gap-2">
                {AI_PROVIDERS.map(prov => (
                  <button
                    key={prov.id}
                    disabled={isDebugging}
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
            </div>

            {/* FIX BUTTON */}
            <button
              onClick={handleDebug}
              disabled={isDebugging || !brokenCode.trim()}
              className={`mc-btn w-full font-black text-base py-5 rounded-xl transition-all flex justify-center items-center gap-3 uppercase tracking-widest ${
                hasCredits
                  ? 'bg-red-500 hover:bg-red-600 disabled:bg-red-900/40 disabled:cursor-not-allowed text-white shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_40px_rgba(239,68,68,0.5)]'
                  : 'bg-amber-400/90 hover:bg-amber-400 text-black'
              }`}
            >
              {isDebugging ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing & Fixing...
                </>
              ) : (
                <>
                  <Bug className="w-5 h-5" />
                  Fix Plugin
                  <Sparkles className="w-5 h-5" />
                </>
              )}
            </button>

            {/* INFO */}
            <div className="mc-slot rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2 font-pixel text-[9px] tracking-[0.2em] text-primary/80">
                <ShieldCheck className="w-3 h-3" /> WHAT IT FIXES
              </div>
              <ul className="space-y-1.5 text-xs text-white/55 leading-relaxed">
                <li className="flex gap-2"><span className="text-red-400/60">▸</span> NullPointerExceptions and ClassCastExceptions</li>
                <li className="flex gap-2"><span className="text-red-400/60">▸</span> Deprecated API usage and method signatures</li>
                <li className="flex gap-2"><span className="text-red-400/60">▸</span> Missing permission checks and event handlers</li>
                <li className="flex gap-2"><span className="text-red-400/60">▸</span> Blocking main thread operations</li>
                <li className="flex gap-2"><span className="text-red-400/60">▸</span> plugin.yml and pom.xml misconfigurations</li>
              </ul>
            </div>
          </div>

          {/* RIGHT — OUTPUT */}
          <div className="min-h-[700px]">
            {meta && <GenerationMeta meta={meta} />}
            {result ? (
              <CodeViewer
                isGenerating={isDebugging}
                files={result.files}
                pluginName={result.pluginName}
                providerName={AI_PROVIDERS.find(p => p.id === selectedProvider)?.name}
                headerLabel="FIXED"
                headerColor="text-emerald-400"
                headerIcon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[600px] mc-slot rounded-2xl p-8 text-center relative overflow-hidden group scanlines">
                <div className="absolute inset-0 pixel-grid opacity-50 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.05)_0%,transparent_70%)]" />
                <div className="relative z-10 max-w-sm">
                  <div className="w-24 h-24 mc-slot mx-auto rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                       style={{ filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.2))' }}>
                    <span className="text-5xl">🐛</span>
                  </div>
                  <div className="font-pixel text-[10px] tracking-[0.25em] text-red-400/70 mb-3">DEBUGGER · READY</div>
                  <h3 className="text-xl font-black text-white mb-3 uppercase tracking-wider">
                    Paste broken code<br />to get it fixed
                  </h3>
                  <p className="text-white/45 text-sm leading-relaxed mb-4">
                    The AI will diagnose every issue and return the fully fixed plugin in seconds.
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

export default function DebugPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-x-hidden">
      <div className="fixed inset-0 pixel-grid opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(239,68,68,0.06),transparent)] pointer-events-none" />

      <Navbar />
      <main className="flex-grow pt-24 flex flex-col relative z-10">
        <AuthGate>
          <Suspense fallback={
            <div className="p-8 text-center text-white/50 flex items-center justify-center gap-3">
              <div className="loader" style={{ width: 24, height: 24, borderWidth: 2 }} />
              Loading debugger...
            </div>
          }>
            <DebugForm />
          </Suspense>
        </AuthGate>
      </main>
      <Footer />
    </div>
  );
}
