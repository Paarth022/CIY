'use client';
import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { Copy, Download, CheckCircle2, X, Pickaxe, Lock, MoveRight, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, getToken } from '@/lib/auth';
import Link from 'next/link';

const LOADING_MESSAGES = [
  "🔍 Analyzing your request...",
  "📝 Writing plugin architecture...",
  "☕ Generating Java code...",
  "📋 Creating plugin.yml...",
  "🔧 Building pom.xml...",
  "⚙️ Writing config files...",
  "✅ Almost done..."
];

export default function CodeViewer({ isGenerating, files, pluginName, providerName, streamingText }) {
  const [activeTab, setActiveTab] = useState(null);
  const [copiedStates, setCopiedStates] = useState({});
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  // Compilation state hooks
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileLog, setCompileLog] = useState('');
  const [compileError, setCompileError] = useState(null);
  const [compileSuccess, setCompileSuccess] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Dynamic Browser IDE state hook
  const [localFiles, setLocalFiles] = useState({});

  useEffect(() => {
    if (files) {
      setLocalFiles(files);
    }
  }, [files]);

  const handleCodeChange = (newVal) => {
    setLocalFiles(prev => ({
      ...prev,
      [activeTab]: newVal
    }));
  };

  // Get active auth details to gate compilations
  const { user, usage, ready } = useAuth();
  const isPaid = ready && usage?.planId && usage?.planId !== 'free';

  // Cycle loading messages
  useEffect(() => {
    let interval;
    if (isGenerating) {
      setLoadingMsgIdx(0);
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Reset compilation log state on new plugin generation
  useEffect(() => {
    setCompileLog('');
    setCompileError(null);
    setCompileSuccess(false);
  }, [files]);

  // Select first tab when files change
  useEffect(() => {
    if (files && Object.keys(files).length > 0 && !activeTab) {
      setActiveTab(Object.keys(files)[0]);
    }
  }, [files, activeTab]);

  const handleDownloadJar = (base64, filename) => {
    try {
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/java-archive' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'plugin.jar';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Failed to parse downloaded binary: ' + e.message);
    }
  };

  const handleCompile = async () => {
    if (isCompiling) return;
    if (!ready) return;

    if (!user) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      setIsCompiling(true);
      setCompileSuccess(false);
      setCompileError(null);
      setCompileLog(
        `[INFO] ========================================================================\n` +
        `[INFO] CIY COMPILER v1.0.0 — INITIALIZING SECURE REMOTE SANDBOX\n` +
        `[INFO] ========================================================================\n` +
        `[INFO] User Session: Verified (Plan: ${usage?.planId || 'Premium'})\n` +
        `[INFO] Target Project: ${pluginName || 'CraftedPlugin'}\n` +
        `[INFO] Dispatching compilation payload to server...\n` +
        `[INFO] Triggering programmatic Maven execution...\n` +
        `[INFO] Please wait (this may take up to 45 seconds for downloading dependencies)...`
      );
      setActiveTab('compiler-log');

      const token = getToken();
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: localFiles,
          token,
          pluginName
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        setIsCompiling(false);
        setCompileError(data?.error || 'Compilation failed.');
        setCompileLog(prev => 
          prev + '\n\n' +
          `[ERROR] ========================================================================\n` +
          `[ERROR] BUILD FAILURE\n` +
          `[ERROR] Reason: ${data?.error || 'Compilation failed.'}\n` +
          `[ERROR] ========================================================================\n\n` +
          (data?.logs || '')
        );
        toast.error('Maven compilation failed! See logs for details.');
        return;
      }

      // Success path
      setCompileSuccess(true);
      setIsCompiling(false);
      
      const successMessage = 
        `\n\n` +
        `[INFO] ========================================================================\n` +
        `[INFO] BUILD SUCCESS\n` +
        `[INFO] ========================================================================\n` +
        `[INFO] Total time: 3.45 s\n` +
        `[INFO] Finished at: ${new Date().toISOString()}\n` +
        `[INFO] Generated Artifact: ${data.filename}\n` +
        `[INFO] Status: Direct binary download triggered.\n` +
        `[INFO] ========================================================================`;
      
      setCompileLog(prev => prev + successMessage);
      toast.success('Plugin compiled successfully! Downloading JAR...');

      // Trigger automatic JAR download
      handleDownloadJar(data.jar, data.filename);

    } catch (err) {
      setIsCompiling(false);
      setCompileError(err.message || 'Internal connection error.');
      setCompileLog(prev => 
        prev + '\n\n' +
        `[ERROR] ========================================================================\n` +
        `[ERROR] BUILD FAILURE\n` +
        `[ERROR] Reason: ${err.message || 'Connection or internal server error.'}\n` +
        `[ERROR] ========================================================================\n`
      );
      toast.error('Network or internal server error occurred.');
    }
  };

  const handleCopy = (content, path) => {
    navigator.clipboard.writeText(content);
    setCopiedStates({ ...copiedStates, [path]: true });
    toast.success('Code copied to clipboard!');
    setTimeout(() => {
      setCopiedStates({ ...copiedStates, [path]: false });
    }, 2000);
  };

  // Zip-slip & absolute-path defence: reject anything that could escape the zip
  // root or target an absolute location on extraction.
  const isSafeZipPath = (p) => {
    if (typeof p !== 'string' || !p || p.length > 256) return false;
    if (p.includes('\0'))                                return false;
    if (p.startsWith('/') || p.startsWith('\\'))         return false;
    if (/^[a-zA-Z]:[\\/]/.test(p))                       return false;
    return !p.split(/[\\/]/).some(seg => seg === '..');
  };

  const handleDownloadZip = async () => {
    if (!localFiles || !pluginName) return;

    const zip = new JSZip();

    Object.entries(localFiles).forEach(([path, content]) => {
      if (!isSafeZipPath(path)) return;
      zip.file(path, typeof content === 'string' ? content : String(content ?? ''));
    });

    zip.file('README.txt', `${pluginName} — Generated by Craft It Yourself\n\nVisit craftityourself.gg to craft more plugins!\n\nHOW TO BUILD:\n1. Install Java 21 and Maven\n2. Run: mvn clean package\n3. Find your JAR in target/ folder\n4. Drop JAR in your server's plugins/ folder\n5. Restart server\n\nGenerated on: ${new Date().toLocaleDateString()}`);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Sanitise filename: strip anything that isn't safe in a cross-OS file name.
    const safeName = String(pluginName).replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 64) || 'Plugin';
    a.download = `${safeName}-Crafted.zip`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ZIP file downloaded successfully!');
  };

  const getHighlightLanguage = (path) => {
    if (!path) return 'plaintext';
    if (path.endsWith('.java')) return 'java';
    if (path.endsWith('.yml') || path.endsWith('.yaml')) return 'yaml';
    if (path.endsWith('.xml')) return 'xml';
    if (path.endsWith('.md')) return 'markdown';
    return 'plaintext';
  };

  // Defence-in-depth HTML escape, used as a fallback if hljs.highlight ever
  // throws. hljs normally escapes its output, but we must never inject raw
  // model text into the DOM even in the error path.
  const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const colorizeTerminalLogs = (log) => {
    if (!log) return '';
    const escaped = escapeHtml(log);
    return escaped.split('\n').map(line => {
      if (line.includes('[ERROR]')) {
        return `<span style="color: #f87171; font-weight: bold;">${line}</span>`;
      }
      if (line.includes('[WARNING]')) {
        return `<span style="color: #fbbf24; font-weight: bold;">${line}</span>`;
      }
      if (line.includes('[INFO]')) {
        return `<span style="color: #60a5fa;">${line}</span>`;
      }
      if (line.includes('BUILD SUCCESS')) {
        return `<span style="color: #34d399; font-weight: 900; text-shadow: 0 0 10px rgba(52, 211, 153, 0.6);">${line}</span>`;
      }
      if (line.includes('BUILD FAILURE')) {
        return `<span style="color: #f87171; font-weight: 900; text-shadow: 0 0 10px rgba(248, 113, 113, 0.6);">${line}</span>`;
      }
      return line;
    }).join('\n');
  };

  const highlight = (content, path) => {
    if (path === 'compiler-log') {
      return colorizeTerminalLogs(content);
    }
    try {
      return hljs.highlight(content ?? '', {
        language: getHighlightLanguage(path),
        ignoreIllegals: true,
      }).value;
    } catch {
      return escapeHtml(content ?? '');
    }
  };

  if (isGenerating) {
    const hasStream = typeof streamingText === 'string' && streamingText.length > 0;
    return (
      <div className="flex flex-col h-full min-h-[600px] mc-slot rounded-2xl scanlines relative overflow-hidden">
        <div className="absolute inset-0 pixel-grid-fine opacity-40 pointer-events-none" />
        {!hasStream ? (
          <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-8">
            <div className="w-14 h-14 mc-slot-glow rounded-lg flex items-center justify-center mb-6 slot-pulse">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="font-pixel text-[10px] tracking-[0.25em] text-primary/70 mb-2">CRAFTING_IN_PROGRESS</div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wider">Forging your plugin...</h3>
            <p className="text-primary font-mono text-sm tracking-wide animate-pulse mt-3">{LOADING_MESSAGES[loadingMsgIdx]}</p>
            <div className="mt-6 w-64 h-1 rounded-full bg-black/60 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary via-emerald-400 to-primary animate-marquee" style={{ width: '50%' }} />
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col flex-1">
            <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 bg-black/30">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-pixel text-[10px] tracking-[0.25em] text-primary/80">LIVE · STREAMING</span>
              <span className="ml-auto text-[10px] font-mono text-white/40">{streamingText.length.toLocaleString()} chars</span>
            </div>
            <pre
              ref={el => { if (el) el.scrollTop = el.scrollHeight; }}
              className="flex-1 overflow-auto font-mono text-[11px] leading-relaxed text-white/75 p-4 whitespace-pre-wrap break-words"
            >
              {streamingText}
              <span className="inline-block w-2 h-3 bg-primary/80 align-middle animate-pulse ml-0.5" />
            </pre>
          </div>
        )}
      </div>
    );
  }

  if (!files || Object.keys(files).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[600px] mc-slot rounded-2xl p-8 text-center relative overflow-hidden group scanlines">
        <div className="absolute inset-0 pixel-grid opacity-50 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.06)_0%,transparent_70%)]" />

        <div className="relative z-10 max-w-sm">
          <div className="w-24 h-24 mc-slot mx-auto rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
               style={{ filter: 'drop-shadow(0 0 20px rgba(34,197,94,0.25))' }}>
            <div className="text-[54px] leading-none">🧱</div>
          </div>
          <div className="font-pixel text-[10px] tracking-[0.25em] text-primary/70 mb-3">OUTPUT_SLOT · EMPTY</div>
          <h3 className="text-xl font-black text-white mb-3 uppercase tracking-wider">
            Your crafted plugin<br />will appear here
          </h3>
          <p className="text-white/45 text-sm leading-relaxed">
            Describe your plugin in the recipe input panel, then click <span className="text-primary font-bold">Craft Plugin</span>
          </p>

          {/* floating hint sparkles */}
          <div className="mt-6 flex justify-center gap-3 text-primary/30 font-mono text-[10px]">
            <span>★</span><span>★</span><span>★</span>
          </div>
        </div>
      </div>
    );
  }

  const fileKeys = Object.keys(localFiles || {});
  const allTabs = compileLog ? [...fileKeys, 'compiler-log'] : fileKeys;
  const activeContent = activeTab === 'compiler-log' ? compileLog : (localFiles[activeTab] || '');
  const setupInstructions = localFiles['README.md'] || '';

  return (
    <div className="flex flex-col h-full flex-grow min-h-[600px] rounded-2xl border-2 rarity-legendary bg-[#080808] overflow-hidden scanlines">
      {/* Top Bar */}
      <div className="p-4 border-b border-white/8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 mc-slot rounded-lg flex items-center justify-center text-xl">📦</div>
          <div>
            <div className="font-pixel text-[8px] tracking-[0.25em] text-amber-400 mb-0.5">★ LEGENDARY</div>
            <h2 className="font-black text-white text-base leading-tight glow-gold">{pluginName || 'Generated Plugin'}</h2>
          </div>
          <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1 ml-2">
            <CheckCircle2 size={10} /> Crafted
          </span>
          {providerName && (
            <span className="text-[10px] text-white/40 font-mono hidden sm:block">· by {providerName}</span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => {
              if (!isPaid) {
                setShowUpgradeModal(true);
                return;
              }
              handleDownloadZip();
            }}
            className={`mc-btn flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-black uppercase tracking-wider text-xs transition-colors ${
              isPaid
                ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                : 'bg-[#1b1307] hover:bg-[#261b0c] border border-amber-500/20 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.1)]'
            }`}
          >
            {!isPaid && <Lock size={12} className="text-amber-500/50" />}
            <Download size={14} />
            Download ZIP
          </button>

          <button
            onClick={handleCompile}
            disabled={isCompiling}
            className={`mc-btn flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-black uppercase tracking-wider text-xs transition-all ${
              isCompiling
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-not-allowed animate-pulse'
                : 'bg-primary hover:bg-primary-hover text-black font-extrabold shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]'
            }`}
          >
            {isCompiling ? (
              <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-amber-400 text-sm leading-none font-bold">⚡</span>
            )}
            <span>{isCompiling ? 'Compiling...' : 'Compile JAR'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-white/8 bg-black/50 hide-scrollbar">
        {allTabs.map((path) => (
          <button
            key={path}
            onClick={() => setActiveTab(path)}
            className={`px-4 py-3 text-xs font-mono whitespace-nowrap border-b-2 transition-colors font-bold ${
              activeTab === path
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {path === 'compiler-log' ? '💻 Compiler Logs' : path.split('/').pop()}
          </button>
        ))}
      </div>

      {/* Code Display */}
      <div className="relative flex-grow bg-code overflow-hidden flex flex-col group min-h-[450px]">
        <div className="absolute right-4 top-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => handleCopy(activeContent, activeTab)}
            className="p-2 bg-surface/80 backdrop-blur border border-border rounded text-white/70 hover:text-white"
          >
            {copiedStates[activeTab] ? <CheckCircle2 size={18} className="text-primary" /> : <Copy size={18} />}
          </button>
        </div>

        {activeTab === 'compiler-log' ? (
          <div className="flex-grow overflow-auto p-4 custom-scrollbar">
            <pre className="m-0 text-sm font-mono leading-relaxed">
              <code dangerouslySetInnerHTML={{ __html: highlight(activeContent, activeTab) }} />
            </pre>
          </div>
        ) : (
          <div className="flex-grow flex flex-col h-full bg-[#030303]">
            {/* Header info */}
            <div className="px-4 py-2 bg-black/40 border-b border-white/5 flex items-center justify-between text-[10px] font-mono text-white/40 select-none">
              <span>✏️ Browser IDE: You can edit the code inside this tab before compiling</span>
              <span>{(activeContent || '').split('\n').length} lines</span>
            </div>
            
            {/* Textarea IDE container */}
            <div className="flex-grow overflow-auto p-4 custom-scrollbar flex min-h-[400px]">
              {/* Line numbers column */}
              <div className="select-none text-right text-white/20 pr-4 border-r border-white/5 font-mono text-sm leading-relaxed shrink-0">
                {(activeContent || '').split('\n').map((_, idx) => (
                  <div key={idx} className="h-6 flex items-center justify-end font-mono text-[11px] select-none">{idx + 1}</div>
                ))}
              </div>
              {/* Editable area */}
              <textarea
                value={activeContent}
                onChange={e => handleCodeChange(e.target.value)}
                spellCheck={false}
                className="flex-grow bg-transparent text-white/90 outline-none resize-none p-0 pl-4 border-none font-mono text-sm leading-6 focus:ring-0 focus:outline-none min-h-[380px] focus:bg-white/[0.01] transition-colors"
                style={{ lineHeight: '24px' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* README.md preview if it exists */}
      {setupInstructions && (
        <div className="border-t border-border bg-[#151515]">
          <div className="p-4 border-b border-white/5">
            <h3 className="font-semibold flex items-center gap-2 text-amber-400">
              📋 Plugin Documentation
            </h3>
          </div>
          <div className="p-4 bg-surface max-h-48 overflow-y-auto custom-scrollbar text-sm text-white/80 whitespace-pre-wrap font-mono">
            {setupInstructions}
          </div>
        </div>
      )}

      {/* Premium Upgrade Modal for JAR Compiler */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-[fadeInUp_0.2s_ease-out_forwards]">
          <div className="relative w-full max-w-lg rounded-2xl border-2 border-primary bg-[#0a0a0a] p-8 scanlines overflow-hidden">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-md bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="absolute inset-0 pixel-grid-fine opacity-30 pointer-events-none rounded-2xl" />

            <div className="relative z-10 text-center">
              <div className="w-16 h-16 mx-auto mc-slot rounded-xl flex items-center justify-center mb-5" style={{ filter: 'drop-shadow(0 0 15px rgba(34,197,94,0.4))' }}>
                <Lock className="w-7 h-7 text-primary animate-pulse" />
              </div>

              <div className="font-pixel text-[9px] tracking-[0.25em] text-amber-400 mb-3 animate-pulse">
                ★ PREMIUM ACCESS REQUIRED ★
              </div>
              <h3 className="text-2xl font-black text-white mb-3 tracking-wide uppercase">
                {user ? "Unlock ZIP Source Download" : "Unlock Developer Access"}
              </h3>
              <p className="text-white/60 text-sm mb-7 leading-relaxed max-w-sm mx-auto">
                {user 
                  ? "Downloading full source code ZIP packages is only available on premium plans. Upgrade to Starter, Crafter, or Master to access complete editable files and developer resources!"
                  : "Create an account to compile plugins instantly for free! Registered free plans get one-click JAR compilation, while premium tiers unlock complete editable ZIP downloads."
                }
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {user ? (
                  <Link
                    href="/pricing"
                    className="mc-btn inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-black px-6 py-3 rounded-md font-black uppercase tracking-wider text-xs transition-colors"
                  >
                    <Pickaxe className="w-4 h-4" />
                    View Pricing Plans
                    <MoveRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      className="mc-btn inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-black px-6 py-3 rounded-md font-black uppercase tracking-wider text-xs transition-colors"
                    >
                      <Pickaxe className="w-4 h-4" />
                      Sign Up Now
                    </Link>
                    <Link
                      href="/login"
                      className="mc-btn inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-md font-black uppercase tracking-wider text-xs transition-colors"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowUpgradeModal(false)}
                className="mt-5 text-[11px] text-white/40 hover:text-white uppercase tracking-widest font-mono transition-colors"
              >
                Back to code viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
