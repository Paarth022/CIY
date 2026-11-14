'use client';

import { useEffect, useRef, useState, memo } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PluginCard from '@/components/PluginCard';
import { EXPLORE_PLUGINS } from '@/lib/examplePlugins';
import {
  Sparkles, Code2, Package, Download, Layers, Key,
  Brain, ChevronRight, MoveRight, Star, Zap,
  Terminal, Pickaxe, Gem, Hammer, Boxes, Cpu, Gift, Play, Monitor, ShieldAlert,
  MessageSquare, Code, Wrench, Target, Gamepad2, Coins, Trophy, BarChart3, Home, TrendingUp, ShoppingCart, CreditCard, Scale
} from 'lucide-react';
import { PLANS, PASSES, TIERS } from '@/lib/plans';
import { useAuth } from '@/lib/auth';

/* ──────────────────────────────────────────────────────────
   PREMIUM OBSIDIAN CRAFTING GRID
   ────────────────────────────────────────────────────────── */
const RECIPES = [
  {
    name: 'HealCommand.jar',
    items: ['💬', '🤖', '⚡', '📝', '✨', '🔧', '🎯', '📦', '🎮'],
    color: '#22c55e',
    rarity: 'LEGENDARY',
    lines: [
      '> parsing intent...',
      '> calling Craft-It-Yourself AI core',
      '> writing Java + plugin.yml',
      '> ✓ build complete',
    ],
  },
  {
    name: 'CratesPlus.jar',
    items: ['🎁', '🔑', '💎', '🎲', '🪙', '📦', '🗝️', '🏆', '✨'],
    color: '#a855f7',
    rarity: 'EPIC',
    lines: [
      '> loading crate system',
      '> generating reward tiers',
      '> linking GUI handlers',
      '> ✓ build complete',
    ],
  },
  {
    name: 'EconomyCore.jar',
    items: ['🪙', '💰', '📊', '🏦', '💵', '📈', '🛒', '💳', '⚖️'],
    color: '#3b82f6',
    rarity: 'RARE',
    lines: [
      '> bootstrapping vault hook',
      '> async mysql pool ready',
      '> writing listeners',
      '> ✓ build complete',
    ],
  },
];

function renderRecipeIcon(emoji) {
  const props = { className: "w-5 h-5 transition-all duration-300" };
  const icons = {
    '💬': <MessageSquare {...props} className="w-5 h-5 text-emerald-400" />,
    '🤖': <Brain {...props} className="w-5 h-5 text-purple-400" />,
    '⚡': <Zap {...props} className="w-5 h-5 text-amber-400 animate-pulse" />,
    '📝': <Code {...props} className="w-5 h-5 text-blue-400" />,
    '✨': <Sparkles {...props} className="w-5 h-5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />,
    '🔧': <Wrench {...props} className="w-5 h-5 text-zinc-400" />,
    '🎯': <Target {...props} className="w-5 h-5 text-rose-400 animate-bounce" style={{ animationDuration: '3s' }} />,
    '📦': <Package {...props} className="w-5 h-5 text-amber-400" />,
    '🎮': <Gamepad2 {...props} className="w-5 h-5 text-pink-400" />,
    '🎁': <Gift {...props} className="w-5 h-5 text-pink-400 animate-pulse" />,
    '🔑': <Key {...props} className="w-5 h-5 text-yellow-400" />,
    '💎': <Gem {...props} className="w-5 h-5 text-cyan-400 animate-pulse" />,
    '🎲': <Sparkles {...props} className="w-5 h-5 text-amber-400" />,
    '🪙': <Coins {...props} className="w-5 h-5 text-yellow-400" />,
    '🗝️': <Key {...props} className="w-5 h-5 text-zinc-400" />,
    '🏆': <Trophy {...props} className="w-5 h-5 text-yellow-400" />,
    '💰': <Coins {...props} className="w-5 h-5 text-emerald-400" />,
    '📊': <BarChart3 {...props} className="w-5 h-5 text-blue-400" />,
    '🏦': <Home {...props} className="w-5 h-5 text-indigo-400" />,
    '💵': <Coins {...props} className="w-5 h-5 text-emerald-400" />,
    '📈': <TrendingUp {...props} className="w-5 h-5 text-emerald-400" />,
    '🛒': <ShoppingCart {...props} className="w-5 h-5 text-sky-400" />,
    '💳': <CreditCard {...props} className="w-5 h-5 text-purple-400" />,
    '⚖️': <Scale {...props} className="w-5 h-5 text-yellow-400" />
  };
  return icons[emoji] || <span className="text-xl">{emoji}</span>;
}

const CraftingTable = memo(function CraftingTable() {
  const [recipeIdx, setRecipeIdx] = useState(0);
  const [stage, setStage] = useState(0);
  const recipe = RECIPES[recipeIdx];

  useEffect(() => {
    let step = 0;
    const tick = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      step += 1;
      if (step <= 9)      setStage(step);
      else if (step < 14) setStage(10);
      else if (step < 18) setStage(11);
      else {
        step = 0;
        setStage(0);
        setRecipeIdx(i => (i + 1) % RECIPES.length);
      }
    }, 350);
    return () => clearInterval(tick);
  }, [recipeIdx]);

  const progress = stage === 11 ? 100 : stage === 10 ? 65 : Math.min(stage, 9) * 11;

  return (
    <div className="relative w-full h-[500px] rounded-3xl overflow-hidden glass-panel border border-white/10 p-6 flex flex-col justify-between">
      <div className="absolute inset-0 saas-grid opacity-30 pointer-events-none" />

      {/* TOP BAR */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/50">tri_engine_crafting_table</span>
        </div>
        <span className="text-[9px] font-mono text-primary font-bold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">LIVE · COMPILING</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_auto_1fr] gap-6 items-center my-auto relative z-10">
        {/* 3x3 MATRIX */}
        <div className="flex justify-center">
          <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-black/40 border border-white/5">
            {recipe.items.map((emoji, i) => {
              const active = stage > i;
              return (
                <div
                  key={`${recipeIdx}-${i}`}
                  className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    active ? 'obsidian-slot obsidian-slot-active' : 'obsidian-slot'
                  }`}
                >
                  <div
                    className={`transition-all duration-300 ${
                      active ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-12'
                    }`}
                  >
                    {renderRecipeIcon(emoji)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COMPILING CONNECTOR */}
        <div className="hidden md:flex flex-col items-center justify-center">
          <div className="w-12 h-[2px] bg-white/10 relative overflow-hidden">
            {stage >= 10 && (
              <div className="absolute inset-y-0 w-4 bg-primary blur-sm animate-marquee" style={{ animationDuration: '0.8s' }} />
            )}
          </div>
        </div>

        {/* OUTPUT */}
        <div className="flex flex-col items-center gap-4">
          <div className={`w-28 h-28 rounded-2xl flex flex-col items-center justify-center transition-all duration-500 border ${
            stage >= 11 ? 'border-primary/40 bg-primary/5 shadow-[0_0_30px_rgba(34,197,94,0.15)]' : 'border-white/5 bg-black/40'
          }`}>
            {stage >= 11 ? (
              <div className="flex flex-col items-center gap-1 animate-pulse">
                <Package className="w-10 h-10 text-primary" />
                <span className="text-[9px] font-mono text-primary font-bold">.jar ready</span>
              </div>
            ) : stage >= 10 ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-[8px] font-mono text-primary/60">compiling...</span>
              </div>
            ) : (
              <span className="text-white/20 text-2xl font-mono">?</span>
            )}
          </div>

          <div className="text-center">
            <div className="text-sm font-bold text-white tracking-tight">{recipe.name}</div>
            <div className="text-[9px] font-mono uppercase tracking-widest mt-1" style={{ color: recipe.color }}>
              ✦ {recipe.rarity}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER LIVE LOG */}
      <div className="mt-4 rounded-xl bg-black/75 border border-white/5 p-3.5 font-mono text-[10px] text-white/50 relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span className="text-primary font-bold tracking-wider text-[9px]">live_compiler.log</span>
        </div>
        <div className="space-y-1">
          {recipe.lines.slice(0, Math.min(4, Math.ceil(stage / 3))).map((l, i) => (
            <div key={i} className="text-primary/70">
              <span className="text-white/20">[{String(i).padStart(2, '0')}]</span> {l}
            </div>
          ))}
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/5">
        <div
          className="h-full bg-primary transition-all duration-300 shadow-[0_0_8px_#22c55e]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
});

/* ──────────────────────────────────────────────────────────
   CYCLING SLOGAN
   ────────────────────────────────────────────────────────── */
const WORDS = ['in seconds', 'with AI', 'without coding', 'for free', 'instantly'];

const CyclingWord = memo(function CyclingWord() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="relative inline-block min-w-[200px] align-baseline">
      {WORDS.map((w, i) => (
        <motion.span
          key={w}
          className="absolute left-0 top-0 whitespace-nowrap font-black enchant-text"
          initial={{ opacity: 0, y: 15 }}
          animate={i === idx ? { opacity: 1, y: 0 } : { opacity: 0, y: i < idx ? -15 : 15 }}
          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
        >
          {w}
        </motion.span>
      ))}
      <span className="invisible font-black">{WORDS[2]}</span>
    </span>
  );
});

/* ──────────────────────────────────────────────────────────
   INTERACTIVE SPIGOT LIVE SIMULATOR SHOWCASE
   ────────────────────────────────────────────────────────── */
const DEMO_PLUGINS = [
  {
    name: '🔋 EcoBank Pro',
    tagline: 'SQLite Vault Economy Hook',
    commands: [
      { text: '/eco balance', response: ['[EcoBank] craftdev99\'s Balance: $1,250.00 (Synced Vault DB)', '[EcoBank] Connection to local SQLite DB: 0.1ms (Cached)'] },
      { text: '/eco pay notch 500', response: ['[EcoBank] Transferred $500.00 to Notch successfully.', '[EcoBank] New Balance: $750.00. Dispatching Spigot transaction event...'] },
    ],
  },
  {
    name: '⚔️ CombatLoot',
    tagline: 'Gated Crate Drop Engine',
    commands: [
      { text: '/crates claim', response: ['[CombatLoot] Claiming Epic Crate key...', '[CombatLoot] Rolled rewards: 1x Diamond Sword (+Knockback II), 5x Enchanted Apples!'] },
      { text: '/crates config reload', response: ['[CombatLoot] Reloading config.yml...', '[CombatLoot] Successful reload: 14 unique drops loaded (12% Diamond roll gate active).'] },
    ],
  },
  {
    name: '🛡️ SpartanGuard',
    tagline: 'Anti-Backdoor AST Scanner',
    commands: [
      { text: '/guard scan', response: ['[SpartanGuard] Scanning 142 Spigot JAR packages in directory...', '[SpartanGuard] AST check complete: 0 obfuscated malicious threads found. Clean!'] },
    ],
  },
];

function SpigotTerminalSimulator() {
  const [selectedDemo, setSelectedDemo] = useState(DEMO_PLUGINS[0]);
  const [terminalLogs, setTerminalLogs] = useState([
    '[12:44:02 INFO]: Loading Paper Spigot Server version 1.21.4 (Build #84)...',
    '[12:44:03 INFO]: [EcoBank] Loading SQLite Database Hook...',
    '[12:44:04 INFO]: [EcoBank] Vault API economy bridge successfully loaded!',
  ]);
  const [typedCommand, setTypedCommand] = useState('');

  const handleSelectPlugin = (plugin) => {
    setSelectedDemo(plugin);
    setTerminalLogs([
      `[12:45:00 INFO]: Disabling previous services...`,
      `[12:45:01 INFO]: Loading plugin module: ${plugin.name} (${plugin.tagline})...`,
      `[12:45:02 INFO]: AST decompiler checks passed. Secure sandbox verified.`,
    ]);
  };

  const handleCommandClick = (cmd) => {
    setTerminalLogs(prev => [
      ...prev,
      `[12:45:10 USER]: ${cmd.text}`,
      ...cmd.response.map(r => `[12:45:10 INFO]: ${r}`)
    ].slice(-50));
  };

  const handleSubmitCustom = (e) => {
    e.preventDefault();
    if (!typedCommand) return;
    const cmd = typedCommand;
    setTerminalLogs(prev => [
      ...prev,
      `[12:45:15 USER]: ${cmd}`,
      `[12:45:15 WARN]: Command not recognized. Click any vetted command buttons below to run simulated triggers!`
    ].slice(-50));
    setTypedCommand('');
  };

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#050508] shadow-[0_0_50px_rgba(34,197,94,0.06)] overflow-hidden font-mono text-xs text-white/70">
      {/* TERMINAL HEADER */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-black/60">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>
        <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">interactive_spigot_simulator</span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[9px] text-emerald-400 font-bold">ONLINE</span>
        </div>
      </div>

      {/* SELECTOR ROW */}
      <div className="grid grid-cols-3 border-b border-white/5 bg-black/20">
        {DEMO_PLUGINS.map(p => (
          <button
            key={p.name}
            onClick={() => handleSelectPlugin(p)}
            className={`py-3.5 text-center font-bold border-r border-white/5 transition-colors ${
              selectedDemo.name === p.name ? 'bg-primary/5 text-primary border-b-2 border-b-primary' : 'hover:bg-white/5 hover:text-white'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* CONSOLE DISPLAY */}
      <div className="p-5 h-64 overflow-y-auto space-y-1.5 bg-[#030305] text-[11px] leading-relaxed scrollbar">
        {terminalLogs.map((log, idx) => {
          let color = 'text-white/60';
          if (log.includes('USER')) color = 'text-primary font-bold';
          if (log.includes('WARN')) color = 'text-yellow-400';
          if (log.includes('EcoBank') || log.includes('CombatLoot') || log.includes('SpartanGuard')) color = 'text-emerald-400/80';
          return (
            <div key={idx} className={color}>
              {log}
            </div>
          );
        })}
      </div>

      {/* TRIGGER CONTROLS */}
      <div className="p-4 border-t border-white/5 bg-black/40 space-y-3">
        <div className="text-[10px] uppercase font-bold text-white/30 tracking-wider">Simulate Plugin Commands:</div>
        <div className="flex flex-wrap gap-2">
          {selectedDemo.commands.map(cmd => (
            <button
              key={cmd.text}
              onClick={() => handleCommandClick(cmd)}
              className="px-3 py-1.5 rounded bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all text-[11px] font-bold"
            >
              🚀 Run "{cmd.text}"
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmitCustom} className="flex gap-2 mt-2 pt-2 border-t border-white/5">
          <span className="text-primary font-bold self-center">$</span>
          <input
            type="text"
            placeholder="Type simulated console trigger..."
            value={typedCommand}
            onChange={e => setTypedCommand(e.target.value)}
            className="flex-grow bg-transparent text-white placeholder:text-white/20 outline-none text-[11px]"
          />
          <button type="submit" className="px-3 py-1 rounded bg-primary text-black font-bold uppercase tracking-wider text-[10px]">
            Execute
          </button>
        </form>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   MAIN LANDING PAGE
   ────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { user } = useAuth();
  const craftHref = user ? '/create' : '/signup?next=/create';

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <Navbar />

      <main className="relative z-10">

        {/* HERO */}
        <section className="relative min-h-screen flex items-center pt-28 pb-16">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
              
              {/* COPY SECTION */}
              <motion.div
                initial={{ opacity: 0, y: 35 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-start"
              >
                <div className="flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">
                    🚀 Next-Gen Multi-AI Java Studio
                  </span>
                </div>

                <h1 className="font-sans text-5xl md:text-7xl font-black tracking-tight leading-[1.05] text-white mb-6">
                  Craft Minecraft<br />
                  <span className="enchant-text">plugins</span> with AI.
                </h1>

                <div className="flex items-baseline gap-3 mb-8 text-xl md:text-2xl font-mono text-white/50">
                  <span>Generate Spigot JARs</span>
                  <CyclingWord />
                </div>

                <p className="text-white/50 text-base md:text-lg max-w-md mb-10 leading-relaxed">
                  Describe your plugin idea in plain English. Craft It Yourself harnesses Claude, Gemini, and ChatGPT in parallel to compile production-ready Minecraft Paper plugins instantly.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 mb-10 w-full sm:w-auto">
                  <Link
                    href={craftHref}
                    className="modern-btn-primary px-8 py-4 rounded-xl text-sm uppercase tracking-wider font-bold inline-flex items-center gap-2.5 w-full sm:w-auto justify-center"
                  >
                    <Pickaxe className="w-4 h-4" />
                    {user ? 'Start Crafting' : 'Claim Free Plugin'}
                  </Link>
                  <Link
                    href="/marketplace"
                    className="modern-btn-secondary px-8 py-4 rounded-xl text-sm uppercase tracking-wider font-bold inline-flex items-center gap-2 w-full sm:w-auto justify-center"
                  >
                    <Boxes className="w-4 h-4 text-primary" />
                    Explore Marketplace
                  </Link>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {['#22c55e', '#a855f7', '#3b82f6', '#f59e0b'].map((color, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-[#030307] flex items-center justify-center text-[10px] font-mono font-bold text-white" style={{ backgroundColor: color }}>
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white/80">
                      <span className="text-primary glow-green">2,847</span> active developers
                    </div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest font-mono">1 free package · zero obligation</div>
                  </div>
                </div>
              </motion.div>

              {/* CRAFTING CONTAINER */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
              >
                <CraftingTable />
              </motion.div>

            </div>
          </div>
        </section>

        {/* COMPETITIVE METRICS (Sleek Obsidian Cards) */}
        <section className="py-20 max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { val: '2,847+', label: 'Plugins Compiled', desc: 'Secure AST checks', icon: Hammer },
              { val: '15,241', label: 'Instant Downloads', desc: 'Ready for Bukkit/Paper', icon: Download },
              { val: '3 Models', label: 'Orchestrated AI', desc: 'Claude + Gemini + GPT', icon: Brain },
              { val: '99.99%', label: 'Sandbox Uptime', desc: 'Isolated VM compilation', icon: Gem },
            ].map((stat, i) => (
              <div key={i} className="glass-panel p-6 rounded-2xl text-center card-lift group">
                <stat.icon className="w-5 h-5 text-primary/60 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-black text-white glow-green mb-1">{stat.val}</h3>
                <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold mb-1">{stat.label}</div>
                <div className="text-[9px] text-white/20 font-mono">{stat.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* INTERACTIVE PLAYABLE SIMULATOR PREVIEW */}
        <section className="py-24 max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono tracking-[0.2em] uppercase mb-4">
              <Monitor className="w-3.5 h-3.5 text-primary" />
              LIVE SIMULATOR SHOWCASE
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4">
              Try our code <span className="text-primary glow-green">in action</span>.
            </h2>
            <p className="text-white/40 max-w-md mx-auto">
              No server required. Toggle simulated plugin nodes inside our in-browser Paper server terminal to test execution in real-time.
            </p>
          </div>

          <SpigotTerminalSimulator />
        </section>

        {/* FEATURES (Sleek Rarity-Based Panels) */}
        <section className="py-24 max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono tracking-[0.25em] uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              FEATURE SET
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4">
              Enchanted with <span className="enchant-text">excellence</span>.
            </h2>
            <p className="text-white/40">Professional developer tools wrapped in obsidian glass.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: 'Multi-AI Orchestrator', desc: 'Choose the best tool for the job. Parallel queries ensure reliable logic pipelines.', borderClass: 'border-purple-500/25 bg-purple-500/[0.01]' },
              { icon: Code2, title: 'Asynchronous Paper API', desc: 'Generated plugins strictly implement Paper async event listeners to preserve TPS.', borderClass: 'border-blue-500/25 bg-blue-500/[0.01]' },
              { icon: ShieldAlert, title: 'AST Bytecode Sandboxing', desc: 'Every ZIP compiles in isolated sandboxed Docker containers to decompile and sweep for backdoors.', borderClass: 'border-emerald-500/25 bg-emerald-500/[0.01]' },
              { icon: Download, title: 'One-Click Compiled ZIP', desc: 'Instantly download the raw source files, pom.xml, and compiled plugin.yml jar.', borderClass: 'border-amber-500/25 bg-amber-500/[0.01]' },
              { icon: Layers, title: 'Uncapped Complexity', desc: 'From basic heal tasks to multi-node minigame databases. Scale your system effortlessly.', borderClass: 'border-pink-500/25 bg-pink-500/[0.01]' },
              { icon: Key, title: 'Bring Your Own API Keys', desc: 'No limits, no lock-in. Keep complete control of your tokens by dropping in your credentials.', borderClass: 'border-cyan-500/25 bg-cyan-500/[0.01]' },
            ].map((feat, i) => (
              <div key={i} className={`p-8 rounded-3xl border card-lift group flex flex-col justify-between ${feat.borderClass}`}>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-white text-lg font-black mb-3">{feat.title}</h3>
                  <p className="text-white/50 text-xs leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING (Sleek Glassmorphic Tiers) */}
        <section className="py-24 max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono tracking-[0.25em] uppercase mb-4">
              <Gem className="w-3.5 h-3.5 text-primary" />
              PRICING PLANS
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4">
              Try free. <span className="enchant-text">Scale forever.</span>
            </h2>
            <p className="text-white/40">1 compiled plugin on the house. Cancel premium subscriptions anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {PLANS.map(plan => (
              <div
                key={plan.id}
                className={`relative rounded-3xl border bg-black/30 p-6 flex flex-col justify-between card-lift ${
                  plan.badge ? 'border-primary/40 shadow-[0_0_20px_rgba(34,197,94,0.15)] lg:-translate-y-2' : 'border-white/5'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-black text-[9px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-primary/70 mb-2">★ {plan.name}</div>
                  <p className="text-white/40 text-[10px] tracking-wider uppercase font-bold mb-4">{plan.tagline}</p>
                  
                  <div className="flex items-baseline gap-1 mb-6 border-b border-white/5 pb-4">
                    <span className="text-3xl font-black text-white">${plan.price}</span>
                    {plan.interval && <span className="text-white/30 text-xs font-mono">/{plan.interval}</span>}
                  </div>

                  <div className="rounded-xl bg-black/60 border border-white/5 p-4 space-y-2.5 mb-8 font-mono text-[11px]">
                    {['advanced', 'medium', 'normal'].map(tier => {
                      const count = plan.credits[tier];
                      const t = TIERS[tier];
                      const display = count === -1 ? '∞' : count === 0 ? '—' : count;
                      const dim = count === 0;
                      return (
                        <div key={tier} className={`flex justify-between items-center ${dim ? 'opacity-20' : ''}`}>
                          <span className={`${t.color} font-bold uppercase tracking-wider text-[8px]`}>{t.label}</span>
                          <span className="text-white font-bold">{display}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Link
                  href="/pricing"
                  className={`w-full py-3 rounded-xl text-center text-xs font-bold uppercase tracking-wider transition-all ${
                    plan.badge ? 'modern-btn-primary' : 'modern-btn-secondary'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="glass-panel p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-[10px] font-mono tracking-widest text-amber-400 mb-1">NO RECURRING SUBSCRIPTION?</div>
                <h4 className="text-white font-black text-lg mb-1">Buy one-time credit passes. Never expire.</h4>
                <div className="text-white/50 text-xs">
                  {PASSES.map((p, i) => (
                    <span key={p.id}>
                      <span className="text-white/70 font-bold">${p.price}</span> · {p.name}
                      {i < PASSES.length - 1 && <span className="text-white/20 mx-2.5">•</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <Link
              href="/pricing#packs"
              className="modern-btn-primary bg-amber-400 hover:bg-amber-300 text-black px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider font-bold shrink-0"
            >
              Browse Pack Store
            </Link>
          </div>
        </section>

        {/* COMMUNITY SHOWER */}
        <section className="py-24 max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono tracking-[0.25em] uppercase mb-4">
                <Boxes className="w-3.5 h-3.5 text-primary" />
                VETTED RELEASES
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-2">Made with CIY.</h2>
              <p className="text-white/40">Tested and verified community plugins.</p>
            </div>
            <Link
              href="/marketplace"
              className="modern-btn-secondary px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider font-bold inline-flex items-center gap-2 shrink-0"
            >
              Enter Escrow Marketplace <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {EXPLORE_PLUGINS.map(plugin => <PluginCard key={plugin.id} plugin={plugin} />)}
          </div>
        </section>

        {/* CHAT LOG TESTIMONIALS */}
        <section className="py-24 max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono tracking-[0.25em] uppercase mb-4">
              <Star className="w-3.5 h-3.5 text-primary" />
              DEVELOPER FEEDBACK
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white">
              The console <span className="text-primary glow-green">approves</span>.
            </h2>
          </div>

          <div className="glass-panel p-8 rounded-3xl space-y-4 font-mono text-xs">
            {[
              { tag: 'ADMIN', color: 'text-red-400', name: 'craftdev99', msg: 'Generated a full Vault SQLite economy plugin in 30 seconds. Async thread pool looks flawless.' },
              { tag: 'OWNER', color: 'text-amber-400', name: 'smp_server', msg: 'Instantly bypassed Spigot Java hiring costs. Decompiled assembly checks are super clean.' },
              { tag: 'DEV', color: 'text-violet-400', name: 'javaminecraft', msg: 'Genuinely impressive event handlers. The Multi-AI orchestration writes perfect pom configurations.' },
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-white/30">&lt;</span>
                <span className={`${t.color} font-bold`}>[{t.tag}] {t.name}</span>
                <span className="text-white/30">&gt;</span>
                <span className="text-white/80 leading-relaxed">{t.msg}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-28 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 p-12 md:p-16 text-center glass-panel">
              <div className="absolute inset-0 saas-grid opacity-30 pointer-events-none" />

              <div className="relative z-10">
                <div className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold mb-6">[CLAIM_YOUR_FREE_PACKAGE]</div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
                  One prompt away from<br />
                  <span className="enchant-text">your new Spigot plugin</span>.
                </h2>
                <p className="text-white/50 text-base md:text-lg mb-10 max-w-md mx-auto leading-relaxed">
                  Join thousands of server administrators, developers, and creators crafting compiled JARs instantly.
                </p>

                <Link
                  href={craftHref}
                  className="modern-btn-primary px-10 py-5 rounded-xl text-base uppercase tracking-wider font-bold inline-flex items-center gap-3"
                >
                  <Pickaxe className="w-5 h-5" />
                  {user ? 'Start Crafting' : 'Claim Free Plugin'}
                  <MoveRight className="w-5 h-5" />
                </Link>
                <p className="mt-6 text-[10px] text-white/30 font-mono tracking-wider uppercase">
                  1 free package · zero credit card required
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
