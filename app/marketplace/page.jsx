'use client';
import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CATEGORIES } from '@/lib/categories';
import { useAuth } from '@/lib/auth';
import {
  Search, Pickaxe, Boxes, X, ChevronRight,
  TrendingUp, Star, Zap, Flame, GitFork,
  ShoppingBag, Plus, Wallet, Tag, ArrowRight,
  CheckCircle, ShieldCheck, DollarSign, Download,
  Percent, Coins, BarChart3, Receipt, Sparkles,
  Lock, AlertTriangle, ShieldAlert, Mail, FileCode2,
  RefreshCw, Check, BookOpen, UserCheck, Shield,
  Github, MessageSquare, LayoutDashboard, PlusCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// Sample pre-populated Marketplace listings with Prices, Sales, and License types
const INITIAL_MARKETPLACE_PLUGINS = [];

export default function MarketplacePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'sell' | 'dashboard'
  const [plugins, setPlugins] = useState(INITIAL_MARKETPLACE_PLUGINS);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  // Seller Onboarding states (Authenticity portfolio checker)
  const [isSellerApproved, setIsSellerApproved] = useState(false);
  const [discordUsername, setDiscordUsername] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [portfolioFile, setPortfolioFile] = useState(null);
  const [onboardingProcessing, setOnboardingProcessing] = useState(false);

  // Checkout modal state
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [buying, setBuying] = useState(false);
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [licenseAgreed, setLicenseAgreed] = useState(false);

  // Email simulator modal
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [purchasedPluginDetails, setPurchasedPluginDetails] = useState(null);
  const [mockLicenseKey, setMockLicenseKey] = useState('');
  const [mockWatermarkId, setMockWatermarkId] = useState('');

  // Seller Dashboard Simulated Balance State
  const [balance, setBalance] = useState(0);
  const [pendingEscrow, setPendingEscrow] = useState(0); // Funds held in 24hr escrow safety
  const [totalSalesCount, setTotalSalesCount] = useState(0);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutEmail, setPayoutEmail] = useState('');
  const [payoutProcessing, setPayoutProcessing] = useState(false);

  // New Listing state with commission calculator
  const [sellPrice, setSellPrice] = useState('9.99');
  const [newPluginName, setNewPluginName] = useState('');
  const [newPluginDesc, setNewPluginDesc] = useState('');
  const [newPluginTagline, setNewPluginTagline] = useState('');
  const [newPluginCategory, setNewPluginCategory] = useState('Utilities');
  const [newPluginComplexity, setNewPluginComplexity] = useState('Medium');
  const [newPluginTags, setNewPluginTags] = useState('admin, tools');
  const [sellSourceCode, setSellSourceCode] = useState(true);

  // Sandboxed Backdoor Scanner state
  const [scanFile, setScanFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanPassed, setScanPassed] = useState(false);
  const [scanLogs, setScanLogs] = useState([]);

  // 2% split fee logic
  const numericPrice = parseFloat(sellPrice) || 0;
  const platformFee = numericPrice * 0.02;
  const sellerEarnings = numericPrice * 0.98;

  // Filter listings
  const filteredPlugins = useMemo(() => {
    return plugins.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = activeCategory === 'all' || p.tags.some(t => t.toLowerCase() === activeCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      if (sortBy === 'popular') return b.sales - a.sales;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'price_high') return b.price - a.price;
      return 0;
    });
  }, [plugins, searchQuery, activeCategory, sortBy]);

  // Handle portfolio file selection & size cap check (Max 20MB limit)
  const handlePortfolioFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxPortfolioSize = 20 * 1024 * 1024; // 20MB limit
    if (file.size > maxPortfolioSize) {
      toast.error(`❌ Secure Gating: Portfolio file exceeds the 20MB limit! (${(file.size / (1024 * 1024)).toFixed(1)}MB detected)`);
      e.target.value = ''; // Reset input element
      setPortfolioFile(null);
      return;
    }

    setPortfolioFile(file);
    toast.success(`📁 Verified attachment: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
  };

  // Handle seller verification portfolio submission
  const handleSellerOnboarding = (e) => {
    e.preventDefault();
    if (!discordUsername || !contactEmail || !portfolioUrl) {
      toast.error('Please enter your Discord, Email, and GitHub/Portfolio URL.');
      return;
    }

    setOnboardingProcessing(true);
    toast.info('🛡️ Initiating portfolio authenticity check...');

    setTimeout(() => {
      setOnboardingProcessing(false);
      setIsSellerApproved(true);
      toast.success('👑 Verified Developer Clearance Granted! You can now publish packages.');
    }, 2000);
  };

  // Simulate server-side anti-backdoor bytecode scanning + Web-Server RCE shields
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setScanFile(file);
    setScanning(true);
    setScanPassed(false);
    setScanLogs([
      '🛡️ engagement: engages isolated V8 Sandbox file broker.',
      '🔐 Storage Lock: execution locked (chmod 000, no-execute bucket policies active).',
      '🤖 parser: static AST (Abstract Syntax Tree) dry-run parser initialized.',
      '🔍 Decompiling byte structures cleanly. Web environment fully immune...'
    ]);

    setTimeout(() => {
      setScanLogs(prev => [...prev, '✓ zero assembly imports initialized.', '✓ Static verification passed: file is parsed as raw isolated data blocks.']);
    }, 600);

    setTimeout(() => {
      setScanLogs(prev => [...prev, '✓ No instances of "setOp(true)" found.', '✓ Network sockets scan completed (0 outbound connection hooks).']);
    }, 1200);

    setTimeout(() => {
      setScanLogs(prev => [...prev, '✓ DRM license traceability watermark successfully injected.', '✓ Clear of RCE (Remote Code Execution) or script payload exploits.', '🛡️ AST SCAN PASSED: Package cleared for distribution.']);
      setScanning(false);
      setScanPassed(true);
      toast.success('🛡️ Security Sandbox: File clearance verified & AST scanned!');
    }, 1800);
  };

  // Handle simulated purchase completion
  const handlePurchase = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please register or sign in to complete purchase.');
      return;
    }
    if (selectedPlugin.price > 0 && (!cardHolder || !cardNumber || !cardExpiry || !cardCvv)) {
      toast.error('Please enter all payment card details.');
      return;
    }
    if (selectedPlugin.price > 0 && !licenseAgreed) {
      toast.error('You must agree to the anti-piracy DRM term.');
      return;
    }

    setBuying(true);
    setTimeout(() => {
      setBuying(false);
      
      setPlugins(prev => prev.map(p => {
        if (p.id === selectedPlugin.id) {
          return { ...p, downloads: p.downloads + 1, sales: p.sales + 1 };
        }
        return p;
      }));

      // Simulate Escrow balance accounting
      if (selectedPlugin.price > 0) {
        setPendingEscrow(p => p + (selectedPlugin.price * 0.98));
        setTotalSalesCount(s => s + 1);
      }

      const transactionId = Math.random().toString(36).substring(2, 9).toUpperCase();
      const generatedLicense = `CIY-LIC-${selectedPlugin.id.toUpperCase()}-${transactionId}`;
      const generatedWatermark = `DRM-WATERMARK-USER-${user.email.toUpperCase()}-${Date.now().toString().slice(-6)}`;

      setMockLicenseKey(generatedLicense);
      setMockWatermarkId(generatedWatermark);
      setPurchasedPluginDetails(selectedPlugin);

      toast.success(`✨ Success! Secure transaction authorized. Dispatching instant download and email...`);
      
      setSelectedPlugin(null);
      setEmailModalOpen(true);

      setCardHolder('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setLicenseAgreed(false);
    }, 1500);
  };

  // Handle new listing submission
  const handleListPlugin = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be signed in to sell plugins.');
      return;
    }
    if (!newPluginName || !newPluginDesc || !sellPrice) {
      toast.error('Please fill in name, description, and price.');
      return;
    }
    if (!scanPassed) {
      toast.error('Please upload your plugin file and pass the Sandboxed Scanner first.');
      return;
    }

    const newPlugin = {
      id: `m_user_${Date.now()}`,
      name: newPluginName,
      author: user.name || 'Anonymous',
      description: newPluginDesc,
      tags: newPluginTags.split(',').map(s => s.trim()).filter(Boolean),
      downloads: 0,
      version: '1.21.4',
      complexity: newPluginComplexity,
      featured: false,
      price: parseFloat(sellPrice) || 0,
      sales: 0,
      rating: 5.0,
      hasSource: sellSourceCode,
    };

    setPlugins(prev => [newPlugin, ...prev]);
    toast.success(`🚀 "${newPluginName}" verified and listed successfully on the CIY Marketplace!`);
    
    setNewPluginName('');
    setNewPluginDesc('');
    setNewPluginTagline('');
    setNewPluginTags('admin, tools');
    setSellPrice('9.99');
    setScanFile(null);
    setScanPassed(false);
    setScanLogs([]);
    setActiveTab('browse');
  };

  // Request balance payout
  const handlePayout = (e) => {
    e.preventDefault();
    if (balance <= 0) {
      toast.error('Your active balance is empty.');
      return;
    }
    if (!payoutEmail) {
      toast.error('Please enter a valid payout email.');
      return;
    }

    setPayoutProcessing(true);
    setTimeout(() => {
      setPayoutProcessing(false);
      toast.success(`💸 Transfer initiated! $${balance.toFixed(2)} is on the way to ${payoutEmail}.`);
      setBalance(0);
      setPayoutOpen(false);
      setPayoutEmail('');
    }, 1800);
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden">
      <div className="fixed inset-0 saas-grid opacity-30 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(34,197,94,0.08),transparent)] pointer-events-none" />

      <Navbar />

      <main className="flex-grow pt-28 pb-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4">

          {/* ⚖️ SYSTEM-WIDE ZERO LIABILITY LEGAL DISCLAIMER GATING CARD */}
          <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-start gap-3 mb-6 relative overflow-hidden font-mono text-[10px] text-white/50 leading-relaxed">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="text-white font-bold block mb-1">⚖️ CIY Marketplace Platform Agreement & Disclaimer</span>
              <p>
                Craft It Yourself acts **exclusively as a connection service provider** between independent sellers and buyers. We do not assume any legal responsibility, liability, or warranty for third-party source files, JARs, or transaction disputes. All code scanning, static analyses, and sandbox encryptions are distributed "as-is" without warranty. By listing or purchasing, you assume all operational risks.
              </p>
            </div>
          </div>

          {/* ── HERO BANNER ── */}
          <div className="glass-panel rounded-3xl border border-primary/30 p-8 md:p-12 mb-10 relative overflow-hidden">
            <div className="absolute inset-0 saas-grid opacity-30 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono tracking-[0.2em] uppercase mb-4">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  CIY SECURED MARKETPLACE
                </div>
                <h1 className="font-sans text-3xl font-black leading-tight text-white mb-4">
                  Escrow-Secured <span className="enchant-text">source</span> &<br />
                  <span className="text-primary glow-green">Verified Developer plugins.</span>
                </h1>
                <p className="text-white/50 max-w-md leading-relaxed text-xs">
                  All sellers are vetted by submitting their GitHub portfolio and Discord handles. All web uploads run in strict isolated sandboxes blocking any execution or RCE hacks.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab('sell')}
                  className="modern-btn-primary px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider font-bold whitespace-nowrap shrink-0 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  List Plugin
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="modern-btn-secondary px-5 py-3.5 rounded-xl text-xs uppercase tracking-wider font-bold whitespace-nowrap shrink-0 flex items-center gap-2"
                >
                  <Wallet className="w-4 h-4 text-primary" />
                  Creator Desk
                </button>
              </div>
            </div>
          </div>

          {/* ── INTERACTIVE TAB SELECTOR ── */}
          <div className="flex border-b border-white/10 mb-8 gap-6 overflow-x-auto scrollbar-none">
            {[
              { id: 'browse', label: 'Browse Plugins', count: filteredPlugins.length, icon: ShoppingBag },
              { id: 'sell', label: 'List Package', count: null, icon: PlusCircle },
              { id: 'dashboard', label: 'Secure Creator Desk', count: null, icon: LayoutDashboard },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 text-xs font-sans-header font-bold uppercase tracking-wider transition-all relative flex items-center gap-2 whitespace-nowrap ${
                    isActive ? 'text-primary font-black' : 'text-white/40 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'text-primary scale-110 animate-pulse' : 'text-white/30'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span className="px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-mono text-primary">
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full shadow-[0_0_12px_rgba(34,197,94,0.8)]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ──────────────────────────────────────────────────────────
              TAB CONTENT 1: BROWSE PLUGINS
          ────────────────────────────────────────────────────────── */}
          {activeTab === 'browse' && (
            <div>
              {/* SEARCH & FILTERS */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 mb-6">
                <div className="relative mc-slot rounded-xl">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search inspected plugins by keyword, package or tag..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-white pl-11 pr-10 py-3.5 rounded-xl outline-none transition-colors placeholder:text-white/25 font-mono text-sm"
                  />
                </div>

                <div className="flex gap-1.5 mc-slot rounded-xl p-1">
                  {[
                    { id: 'popular', label: 'Top Sold', icon: TrendingUp },
                    { id: 'rating', label: 'Highest Rated', icon: Star },
                    { id: 'price_low', label: 'Price: Low-High', icon: DollarSign },
                    { id: 'price_high', label: 'Price: High-Low', icon: DollarSign },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setSortBy(opt.id)}
                      className={`mc-btn flex items-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-black uppercase tracking-wider transition-colors ${
                        sortBy === opt.id ? 'bg-primary text-black' : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <opt.icon className="w-3.5 h-3.5" />
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* GRID */}
              {filteredPlugins.length === 0 ? (
                <div className="glass-panel rounded-3xl p-16 text-center border border-white/5 max-w-xl mx-auto my-12 relative overflow-hidden">
                  <div className="absolute inset-0 saas-grid opacity-20 pointer-events-none" />
                  <Boxes className="w-12 h-12 text-primary/40 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-white font-sans-header font-bold text-lg mb-2">Marketplace is Pristine</h3>
                  <p className="text-white/40 text-xs leading-relaxed mb-6 font-mono">
                    No active packages are listed on the escrow server yet. Click "List Plugin" or "Creator Desk" to verify your credentials and submit the first package!
                  </p>
                  <button
                    onClick={() => setActiveTab('sell')}
                    className="modern-btn-primary px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider font-bold inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Become a Seller
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPlugins.map(plugin => {
                    const isFree = plugin.price === 0;
                    const emoji = ['⚔️', '🎁', '🛡️', '🪙', '👁️', '✨', '⚡', '🧿', '💎', '🏹', '🗡️', '🔮'][plugin.name.length % 12];
                    
                    return (
                      <div
                        key={plugin.id}
                        className="relative rounded-2xl border border-white/10 bg-[#0b0b0b] p-6 flex flex-col justify-between card-lift transition-all group overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/10 transition-all duration-300" />
                        
                        <div>
                          {/* Rating & Top Header */}
                          <div className="flex justify-between items-center mb-4">
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[9px] font-mono text-emerald-400">
                              ✓ Verified Developer
                            </div>
                            
                            {/* Price Tag */}
                            <div className="flex items-center gap-2">
                              {plugin.hasSource && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400">
                                  <FileCode2 className="w-3 h-3" /> +Source
                                </span>
                              )}
                              {isFree ? (
                                <span className="font-sans-header text-[11px] text-primary glow-green uppercase tracking-widest">[ FREE ]</span>
                              ) : (
                                <span className="font-sans-header text-[13px] text-white font-bold">${plugin.price.toFixed(2)}</span>
                              )}
                            </div>
                          </div>

                          {/* Title Info */}
                          <div className="flex gap-4 mb-4">
                            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 shrink-0">
                              {emoji}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-black text-white text-lg leading-tight mb-1 group-hover:text-primary transition-colors">
                                {plugin.name}
                              </h3>
                              <p className="text-[10px] text-white/40 font-mono">
                                By @{plugin.author} · Paper {plugin.version}
                              </p>
                            </div>
                          </div>

                          <p className="text-white/60 text-xs leading-relaxed mb-5 line-clamp-3">
                            {plugin.description}
                          </p>
                        </div>

                        {/* Footer Actions */}
                        <div className="border-t border-white/5 pt-4 mt-auto flex items-center justify-between">
                          <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Scanned
                          </span>

                          <button
                            onClick={() => setSelectedPlugin(plugin)}
                            className="modern-btn-primary px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold"
                          >
                            {isFree ? 'Get Free' : 'Secure Buy'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              TAB CONTENT 2: LIST PACKAGE & SELLER VERIFICATION GATE
          ────────────────────────────────────────────────────────── */}
          {activeTab === 'sell' && (
            <div>
              {!isSellerApproved ? (
                /* SELLER VERIFICATION GATE APPLICATION FORM */
                <div className="max-w-2xl mx-auto glass-panel rounded-3xl border border-white/10 bg-[#08080c] p-8 relative overflow-hidden">
                  <div className="absolute inset-0 saas-grid opacity-30 pointer-events-none" />

                  <div className="flex items-center gap-2 mb-6">
                    <UserCheck className="w-5 h-5 text-primary animate-pulse" />
                    <span className="font-mono text-[10px] text-primary uppercase tracking-[0.2em] font-bold">Developer_Verification_Onboarding</span>
                  </div>

                  <h3 className="text-white font-sans-header font-black text-xl mb-2">Request Verified Seller Status</h3>
                  <p className="text-white/40 text-xs leading-relaxed mb-6 font-mono">
                    To maintain an absolute zero-scam policy, all creators must verify their previous Minecraft portfolios and identity. Applications are checked instantly.
                  </p>

                  <form onSubmit={handleSellerOnboarding} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-white/45 text-[10px] uppercase font-bold tracking-wider font-mono mb-2">
                          Discord Username *
                        </label>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="e.g. craftdev99"
                            value={discordUsername}
                            onChange={e => setDiscordUsername(e.target.value)}
                            className="w-full bg-black border border-white/10 text-white rounded-xl pl-10 pr-3 py-3 outline-none text-xs font-mono focus:border-primary/50"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-white/45 text-[10px] uppercase font-bold tracking-wider font-mono mb-2">
                          Primary Contact Email *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                          <input
                            type="email"
                            placeholder="e.g. dev@spigot.org"
                            value={contactEmail}
                            onChange={e => setContactEmail(e.target.value)}
                            className="w-full bg-black border border-white/10 text-white rounded-xl pl-10 pr-3 py-3 outline-none text-xs font-mono focus:border-primary/50"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/45 text-[10px] uppercase font-bold tracking-wider font-mono mb-2">
                        GitHub URL / Previous Plugin Portfolio *
                      </label>
                      <div className="relative">
                        <Github className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                        <input
                          type="url"
                          placeholder="e.g. https://github.com/craftdev or spigotmc link"
                          value={portfolioUrl}
                          onChange={e => setPortfolioUrl(e.target.value)}
                          className="w-full bg-black border border-white/10 text-white rounded-xl pl-10 pr-3 py-3 outline-none text-xs font-mono focus:border-primary/50"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/45 text-[10px] uppercase font-bold tracking-wider font-mono mb-2">
                        Upload Portfolio Verification ZIP (Previous Work, Optional)
                      </label>
                      <input
                        type="file"
                        accept=".zip,.jar"
                        onChange={handlePortfolioFileChange}
                        className="hidden"
                        id="portfolio-verify-upload"
                      />
                      <label
                        htmlFor="portfolio-verify-upload"
                        className="glass-panel border-dashed rounded-xl p-5 text-center text-xs font-mono text-white/30 hover:border-primary/50 transition-colors cursor-pointer block"
                      >
                        {portfolioFile ? (
                          <span className="text-primary font-bold">📁 Attached: {portfolioFile.name} ({(portfolioFile.size / (1024 * 1024)).toFixed(2)}MB)</span>
                        ) : (
                          '📁 Drag and drop or browse portfolio.zip (Max 20MB limit for secure sandboxing)'
                        )}
                      </label>
                    </div>

                    {/* Liability and zero responsibility reminder banner inside the gate */}
                    <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-[10px] font-mono text-white/40 leading-relaxed">
                      💡 <strong>Note:</strong> Craft It Yourself provides zero liability coverage or guarantees for sales. Your portfolio verification registry tracks accountability to block fraudulent exit-scams.
                    </div>

                    <button
                      type="submit"
                      disabled={onboardingProcessing}
                      className="modern-btn-primary w-full py-4 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                    >
                      {onboardingProcessing ? 'Auditing Portfolio Registry...' : 'Submit Portfolio for Verification'}
                    </button>
                  </form>
                </div>
              ) : (
                /* VERIFIED SELLER LISTING FORM */
                <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8">
                  
                  {/* FORM CARD */}
                  <div className="glass-panel rounded-3xl border border-white/10 bg-[#08080c] p-8">
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="font-mono text-[10px] text-primary uppercase tracking-[0.2em] font-bold">Listing_Terminal</span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400 font-bold uppercase">
                        ✓ VERIFIED SELLER APPROVED
                      </span>
                    </div>

                    <form onSubmit={handleListPlugin} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-white/45 text-[10px] uppercase font-bold tracking-wider font-mono mb-2">
                            Plugin Name *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. AntiCheat Pro, SpigotEconomy"
                            value={newPluginName}
                            onChange={e => setNewPluginName(e.target.value)}
                            className="w-full bg-black border border-white/10 text-white rounded-xl p-3 outline-none text-xs font-mono focus:border-primary/50"
                            required
                          />
                        </div>
 
                        <div>
                          <label className="block text-white/45 text-[10px] uppercase font-bold tracking-wider font-mono mb-2">
                            Short Tagline *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Advanced SQLite Vault Bridge"
                            value={newPluginTagline}
                            onChange={e => setNewPluginTagline(e.target.value)}
                            className="w-full bg-black border border-white/10 text-white rounded-xl p-3 outline-none text-xs font-mono focus:border-primary/50"
                          />
                        </div>
                      </div>
 
                      <div>
                        <label className="block text-white/45 text-[10px] uppercase font-bold tracking-wider font-mono mb-2">
                          Full Marketplace Description *
                        </label>
                        <textarea
                          placeholder="Describe exactly what your plugin does, list configuration file nodes, features, setup guide, and execution commands..."
                          value={newPluginDesc}
                          onChange={e => setNewPluginDesc(e.target.value)}
                          className="w-full bg-black border border-white/10 text-white rounded-xl p-3 outline-none text-xs font-mono focus:border-primary/50 h-32"
                          required
                        />
                      </div>
 
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-white/45 text-[10px] uppercase font-bold tracking-wider font-mono mb-2">
                            Primary Category *
                          </label>
                          <select
                            value={newPluginCategory}
                            onChange={e => setNewPluginCategory(e.target.value)}
                            className="w-full bg-black border border-white/10 text-white rounded-xl p-3 outline-none text-xs font-mono focus:border-primary/50"
                          >
                            <option>Admin</option>
                            <option>Economy</option>
                            <option>Minigames</option>
                            <option>Utilities</option>
                            <option>RPG</option>
                          </select>
                        </div>
 
                        <div>
                          <label className="block text-white/45 text-[10px] uppercase font-bold tracking-wider font-mono mb-2">
                            Complexity Tier *
                          </label>
                          <select
                            value={newPluginComplexity}
                            onChange={e => setNewPluginComplexity(e.target.value)}
                            className="w-full bg-black border border-white/10 text-white rounded-xl p-3 outline-none text-xs font-mono focus:border-primary/50"
                          >
                            <option>Simple</option>
                            <option>Medium</option>
                            <option>Advanced</option>
                          </select>
                        </div>
 
                        <div>
                          <label className="block text-white/45 text-[10px] uppercase font-bold tracking-wider font-mono mb-2">
                            Listing Price (USD) *
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-3.5 h-3.5" />
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={sellPrice}
                              onChange={e => setSellPrice(e.target.value)}
                              className="w-full bg-black border border-white/10 text-white rounded-xl pl-8 pr-3 py-3 outline-none text-xs font-mono focus:border-primary/50"
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>
                      </div>
 
                      {/* SOURCE CODE SALE GATING TOGGLE */}
                      <div className="glass-panel p-4 rounded-xl border border-white/10 bg-black/40 flex items-center justify-between">
                        <div>
                          <h4 className="text-white text-xs font-bold font-mono flex items-center gap-1.5">
                            <FileCode2 className="w-4 h-4 text-primary animate-pulse" /> Include Developer Source Code ZIP?
                          </h4>
                          <p className="text-white/40 text-[10px] leading-relaxed mt-1 font-mono">
                            Checking this allows buyers to download the complete Java source.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sellSourceCode}
                            onChange={e => setSellSourceCode(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
 
                      {/* ANTI-BACKDOOR BYTECODE DECOMPILER AUDIT */}
                      <div>
                        <label className="block text-white/45 text-[10px] uppercase font-bold tracking-wider font-mono mb-2">
                          Upload Plugin Source ZIP / JAR (Uncapped Size) *
                        </label>
                        <input
                          type="file"
                          accept=".zip,.jar"
                          onChange={handleFileChange}
                          className="hidden"
                          id="source-jar-upload"
                        />
                        <label
                          htmlFor="source-jar-upload"
                          className="glass-panel border-dashed rounded-xl p-6 text-center text-xs font-mono text-white/30 hover:border-primary/50 transition-colors cursor-pointer block"
                        >
                          {scanFile ? `📁 Selected File: ${scanFile.name}` : '📁 Drag and drop or click to upload Spigot files (Uncapped file sizes supported via chunking)'}
                        </label>
                      </div>
 
                      {/* Live Sandbox Logs */}
                      {(scanning || scanLogs.length > 0) && (
                        <div className="glass-panel rounded-xl p-4 bg-[#030303] text-[10px] font-mono text-white/50 border border-white/5 space-y-1">
                          <div className="text-primary font-black uppercase text-[9px] mb-2 flex items-center gap-1.5">
                            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} /> Sandbox Bytecode AST Inspector:
                          </div>
                          {scanLogs.map((log, idx) => (
                            <div key={idx} className="leading-relaxed">
                              {log}
                            </div>
                          ))}
                        </div>
                      )}
 
                      <button
                        type="submit"
                        disabled={scanning || !scanPassed}
                        className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all ${
                          scanPassed ? 'modern-btn-primary bg-primary text-black' : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                        }`}
                      >
                        Confirm Escrow Listing & Scan
                      </button>
                    </form>
                  </div>

                  {/* DYNAMIC CALCULATORS AND ESCROW RULES */}
                  <div className="space-y-6">
                    
                    {/* CALCULATOR */}
                    <div className="mc-slot rounded-2xl border border-primary/20 p-6 bg-gradient-to-br from-[#0c0c0c] to-black relative overflow-hidden scanlines">
                      <div className="absolute inset-0 pixel-grid opacity-30 pointer-events-none" />

                      <div className="flex items-center gap-2 mb-4">
                        <Percent className="w-4 h-4 text-primary animate-pulse" />
                        <span className="font-pixel text-[9px] text-primary tracking-[0.2em]">REVENUE_SPLIT</span>
                      </div>

                      <h3 className="text-white font-black text-lg mb-2">Interactive 2% Calculator</h3>
                      <p className="text-white/40 text-xs leading-relaxed mb-6">
                        Our platform commission fee is strictly **2.0%** to pay for isolated AST sandboxes. You take home the other **98.0%** instantly!
                      </p>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs font-mono border-b border-white/5 pb-3">
                          <span className="text-white/55">Your Custom Price:</span>
                          <span className="text-white font-bold">${numericPrice.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between items-center text-xs font-mono border-b border-white/5 pb-3">
                          <span className="text-white/55 flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-primary" /> CIY Fee (2%):
                          </span>
                          <span className="text-red-400 font-bold">-${platformFee.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between items-center p-3 rounded bg-primary/10 border border-primary/20 text-xs font-mono">
                          <span className="text-primary font-black flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-primary" /> Your Earning (98%):
                          </span>
                          <span className="text-primary font-black text-sm">${sellerEarnings.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* ESCROW & NO EXEC STORAGE LAWS */}
                    <div className="mc-slot rounded-2xl border border-red-500/20 p-6 bg-gradient-to-br from-[#0a0505] to-[#040202] space-y-4 relative overflow-hidden">
                      <div className="flex items-center gap-2 text-red-400">
                        <ShieldAlert className="w-5 h-5 text-red-400 animate-bounce" />
                        <span className="font-pixel text-[9px] tracking-wider uppercase font-bold">ANTI_SCAM_ESCROW</span>
                      </div>
                      <h3 className="text-white text-sm font-bold font-mono">Platform Sandbox Protections</h3>
                      
                      <div className="space-y-3 font-mono text-[10px] text-white/50 leading-relaxed">
                        <div className="flex items-start gap-2">
                          <Lock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <p>
                            <strong className="text-white">24h Safe Escrow:</strong> Funds are held securely inside the platform vault to prevent buyers from getting scammed by empty/dummy assets.
                          </p>
                        </div>

                        <div className="flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <p>
                            <strong className="text-white">RCE Hack Defenses:</strong> All web uploads are stored as raw isolated binary data blocks with strict execution locks (`chmod 000` directories). AST dry-runs scan files statically. No Java bytecode is ever initialized or run on our hosting server, preventing web hacks.
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              TAB CONTENT 3: CREATOR DASHBOARD
          ────────────────────────────────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <div>
              {!isSellerApproved ? (
                /* SELLER VERIFICATION GATE APPLICATION FORM */
                <div className="max-w-2xl mx-auto glass-panel rounded-3xl border border-white/10 bg-[#08080c] p-8 relative overflow-hidden">
                  <div className="absolute inset-0 saas-grid opacity-30 pointer-events-none" />

                  <div className="flex items-center gap-2 mb-6">
                    <UserCheck className="w-5 h-5 text-primary animate-pulse" />
                    <span className="font-mono text-[10px] text-primary uppercase tracking-[0.2em] font-bold">Developer_Verification_Onboarding</span>
                  </div>

                  <h3 className="text-white font-sans-header font-black text-xl mb-2">Request Verified Seller Status</h3>
                  <p className="text-white/40 text-xs leading-relaxed mb-6 font-mono">
                    To maintain an absolute zero-scam policy, all creators must verify their previous Minecraft portfolios and identity. Applications are checked instantly.
                  </p>

                  <form onSubmit={handleSellerOnboarding} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-white/45 text-[10px] uppercase font-bold tracking-wider font-mono mb-2">
                          Discord Username *
                        </label>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="e.g. craftdev99"
                            value={discordUsername}
                            onChange={e => setDiscordUsername(e.target.value)}
                            className="w-full bg-black border border-white/10 text-white rounded-xl pl-10 pr-3 py-3 outline-none text-xs font-mono focus:border-primary/50"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-white/45 text-[10px] uppercase font-bold tracking-wider font-mono mb-2">
                          Primary Contact Email *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                          <input
                            type="email"
                            placeholder="e.g. dev@spigot.org"
                            value={contactEmail}
                            onChange={e => setContactEmail(e.target.value)}
                            className="w-full bg-black border border-white/10 text-white rounded-xl pl-10 pr-3 py-3 outline-none text-xs font-mono focus:border-primary/50"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/45 text-[10px] uppercase font-bold tracking-wider font-mono mb-2">
                        GitHub URL / Previous Plugin Portfolio *
                      </label>
                      <div className="relative">
                        <Github className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                        <input
                          type="url"
                          placeholder="e.g. https://github.com/craftdev or spigotmc link"
                          value={portfolioUrl}
                          onChange={e => setPortfolioUrl(e.target.value)}
                          className="w-full bg-black border border-white/10 text-white rounded-xl pl-10 pr-3 py-3 outline-none text-xs font-mono focus:border-primary/50"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/45 text-[10px] uppercase font-bold tracking-wider font-mono mb-2">
                        Upload Portfolio Verification ZIP (Previous Work, Optional)
                      </label>
                      <input
                        type="file"
                        accept=".zip,.jar"
                        onChange={handlePortfolioFileChange}
                        className="hidden"
                        id="portfolio-verify-upload-dash"
                      />
                      <label
                        htmlFor="portfolio-verify-upload-dash"
                        className="glass-panel border-dashed rounded-xl p-5 text-center text-xs font-mono text-white/30 hover:border-primary/50 transition-colors cursor-pointer block"
                      >
                        {portfolioFile ? (
                          <span className="text-primary font-bold">📁 Attached: {portfolioFile.name} ({(portfolioFile.size / (1024 * 1024)).toFixed(2)}MB)</span>
                        ) : (
                          '📁 Drag and drop or browse portfolio.zip (Max 20MB limit for secure sandboxing)'
                        )}
                      </label>
                    </div>

                    {/* Liability and zero responsibility reminder banner inside the gate */}
                    <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-[10px] font-mono text-white/40 leading-relaxed">
                      💡 <strong>Note:</strong> Craft It Yourself provides zero liability coverage or guarantees for sales. Your portfolio verification registry tracks accountability to block fraudulent exit-scams.
                    </div>

                    <button
                      type="submit"
                      disabled={onboardingProcessing}
                      className="modern-btn-primary w-full py-4 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                    >
                      {onboardingProcessing ? 'Auditing Portfolio Registry...' : 'Submit Portfolio for Verification'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* METRICS HEADER */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { title: 'Liquid Balance', val: `$${balance.toFixed(2)}`, desc: 'Withdrawn directly on-demand', icon: Wallet, glow: 'glow-green' },
                      { title: '24-Hour Escrow Hold', val: `$${pendingEscrow.toFixed(2)}`, desc: 'Protected buyer escrow verification', icon: Lock, glow: 'glow-blue' },
                      { title: 'Commission Level', val: '2.0%', desc: 'Vetted verified seller tier', icon: Percent, glow: 'glow-gold' },
                      { title: 'Inspection Grade', val: 'A+', desc: 'Zero scanning warnings resolved', icon: ShieldCheck, glow: '' }
                    ].map((m, i) => (
                      <div key={i} className="glass-panel rounded-2xl p-6 relative overflow-hidden bg-[#08080c]">
                        <m.icon className="w-5 h-5 text-primary/60 mb-3 absolute top-6 right-6" />
                        <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold">{m.title}</div>
                        <div className={`text-2xl font-black text-white mt-2 ${m.glow}`}>{m.val}</div>
                        <div className="text-[9px] text-white/30 font-mono mt-1">{m.desc}</div>
                      </div>
                    ))}
                  </div>

                  {/* PAYOUT ROW */}
                  <div className="glass-panel rounded-3xl p-8 border border-white/10 bg-[#08080c] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-white font-sans-header font-black text-lg mb-1">Transfer Earnings</h3>
                      <p className="text-white/45 text-xs font-mono">
                        Withdraw your marketplace balance directly to your Stripe or PayPal merchant bank account.
                      </p>
                    </div>

                    <button
                      onClick={() => setPayoutOpen(true)}
                      disabled={balance <= 0}
                      className={`px-6 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all ${
                        balance > 0 ? 'modern-btn-primary' : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      Request Payout ($ {balance.toFixed(2)})
                    </button>
                  </div>

              {/* YOUR ACTIVE LISTINGS */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-primary" />
                    <span className="font-mono text-[10px] text-white uppercase tracking-[0.2em] font-bold">Your_Active_Listings</span>
                  </div>
                  <span className="font-mono text-[10px] text-white/30">
                    {plugins.filter(p => p.author === (user?.name || 'Anonymous')).length} active listing modules
                  </span>
                </div>

                <div className="glass-panel rounded-2xl overflow-hidden font-mono text-xs border border-white/10 bg-[#08080c]">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-white/40">
                        <th className="p-4 uppercase font-bold tracking-wider">Plugin Module</th>
                        <th className="p-4 uppercase font-bold tracking-wider">Price (USD)</th>
                        <th className="p-4 uppercase font-bold tracking-wider">Total Sales</th>
                        <th className="p-4 uppercase font-bold tracking-wider">Net Earnings</th>
                        <th className="p-4 uppercase font-bold tracking-wider">Source Status</th>
                        <th className="p-4 uppercase font-bold tracking-wider">Security State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {plugins.filter(p => p.author === (user?.name || 'Anonymous')).length > 0 ? (
                        plugins.filter(p => p.author === (user?.name || 'Anonymous')).map(p => (
                          <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 text-white font-bold">{p.name}</td>
                            <td className="p-4 text-white/70">${p.price.toFixed(2)}</td>
                            <td className="p-4 text-white/70">{p.sales} units</td>
                            <td className="p-4 text-primary font-bold">${(p.sales * p.price * 0.98).toFixed(2)}</td>
                            <td className="p-4 text-emerald-400 font-bold">{p.hasSource ? 'Included (+Source)' : 'Closed Source'}</td>
                            <td className="p-4 text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Verified & Clean
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-white/30 font-mono">
                            You have no active listings. Go to the "List Package" tab to list your first verified plugin!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ──────────────────────────────────────────────────────────
          PAYOUT SIMULATOR OVERLAY
      ────────────────────────────────────────────────────────── */}
      {payoutOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in font-mono">
          <div className="mc-slot border-2 border-primary/30 rounded-2xl bg-[#090909] p-8 max-w-md w-full relative scanlines text-xs">
            <button
              onClick={() => setPayoutOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Coins className="w-4 h-4 text-primary" />
              <span className="font-pixel text-[9px] text-primary tracking-[0.25em]">PAYOUT_GATEWAY</span>
            </div>

            <h3 className="text-white font-black text-xl mb-2">Request Payout</h3>
            <p className="text-white/40 text-xs leading-relaxed mb-6">
              Withdraw active balance **${balance.toFixed(2)}** instantly. The 2% commission fee was already auto-split on each listing purchase.
            </p>

            <form onSubmit={handlePayout} className="space-y-4">
              <div>
                <label className="block text-white/45 text-[10px] uppercase font-bold tracking-wider font-mono mb-2">
                  Payout Email Address (PayPal / Stripe) *
                </label>
                <input
                  type="email"
                  placeholder="e.g. dev@craftityourself.gg"
                  value={payoutEmail}
                  onChange={e => setPayoutEmail(e.target.value)}
                  className="w-full bg-black border border-white/10 text-white rounded-md p-3 outline-none text-xs font-mono focus:border-primary/50"
                  required
                />
              </div>

              <div className="p-3.5 rounded bg-primary/10 border border-primary/20 text-xs font-mono text-center">
                <span className="text-primary font-bold">Transferring Total: ${balance.toFixed(2)}</span>
              </div>

              <button
                type="submit"
                disabled={payoutProcessing}
                className="mc-btn w-full py-3.5 rounded-md bg-primary hover:bg-primary-hover text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                {payoutProcessing ? 'Initiating Payout...' : 'Confirm Bank Payout'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          STRIPE CHECKOUT SIMULATOR OVERLAY
      ────────────────────────────────────────────────────────── */}
      {selectedPlugin && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in font-mono">
          <div className="mc-slot border-2 border-primary/20 rounded-2xl bg-[#090909] p-8 max-w-lg w-full relative scanlines text-xs">
            
            <button
              onClick={() => setSelectedPlugin(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="font-pixel text-[9px] text-primary tracking-[0.25em]">SECURE_CHECKOUT</span>
            </div>

            <h3 className="text-white font-black text-lg mb-1">Buy "{selectedPlugin.name}"</h3>
            <p className="text-white/40 text-[10px] mb-4">By creator @{selectedPlugin.author} · held in 24h escrow</p>

            <form onSubmit={handlePurchase} className="space-y-4">
              
              {/* Order breakdown */}
              <div className="mc-slot rounded-lg p-4 space-y-2 text-white/60 bg-black/40">
                <div className="flex justify-between items-center">
                  <span>Plugin License + Source:</span>
                  <span>${selectedPlugin.price === 0 ? '0.00' : selectedPlugin.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Processing & Escrow Fee:</span>
                  <span className="text-emerald-400">Included</span>
                </div>
                <div className="flex justify-between items-center border-t border-white/10 pt-2 text-white font-bold">
                  <span>Total Due:</span>
                  <span className="text-primary">${selectedPlugin.price === 0 ? '0.00' : selectedPlugin.price.toFixed(2)}</span>
                </div>
              </div>

              {selectedPlugin.price > 0 ? (
                <>
                  <div>
                    <label className="block text-white/45 text-[10px] uppercase font-bold tracking-wider mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Steve Alex"
                      value={cardHolder}
                      onChange={e => setCardHolder(e.target.value)}
                      className="w-full bg-black border border-white/10 text-white rounded-md p-3 outline-none focus:border-primary/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white/45 text-[10px] uppercase font-bold tracking-wider mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="•••• •••• •••• ••••"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      className="w-full bg-black border border-white/10 text-white rounded-md p-3 outline-none focus:border-primary/50"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/45 text-[10px] uppercase font-bold tracking-wider mb-1">
                        Expiration Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={e => setCardExpiry(e.target.value)}
                        className="w-full bg-black border border-white/10 text-white rounded-md p-3 outline-none focus:border-primary/50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white/45 text-[10px] uppercase font-bold tracking-wider mb-1">
                        CVV / CVC
                      </label>
                      <input
                        type="text"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value)}
                        className="w-full bg-black border border-white/10 text-white rounded-md p-3 outline-none focus:border-primary/50"
                        required
                      />
                    </div>
                  </div>

                  {/* ANTI-CHARGEBACK TERMS AGREEMENT */}
                  <div className="flex items-start gap-2 p-3.5 rounded bg-red-500/5 border border-red-500/15">
                    <input
                      type="checkbox"
                      id="agreed-license-drm"
                      checked={licenseAgreed}
                      onChange={e => setLicenseAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-white/20 bg-black text-primary focus:ring-0 cursor-pointer shrink-0"
                      required
                    />
                    <label htmlFor="agreed-license-drm" className="text-white/40 text-[10px] leading-relaxed cursor-pointer selection:bg-transparent">
                      I agree that this is a digital download. The source code files will be injected with an active DRM tracker linked to my email address (<strong className="text-white">{user?.email || 'my-account'}</strong>). I waive all rights to credit card chargeback attempts.
                    </label>
                  </div>
                </>
              ) : (
                <div className="p-4 rounded bg-primary/10 border border-primary/20 text-center text-primary font-bold">
                  🎁 This community plugin is 100% free! Ready to unlock.
                </div>
              )}

              {/* Zero responsibility platform agreement note in checkout */}
              <div className="p-3.5 rounded bg-white/5 border border-white/10 text-[9px] text-white/40 leading-relaxed">
                ⚖️ <strong>Disclaimer:</strong> Craft It Yourself acts purely as a checkout facilitator connecting users. We assume no legal responsibility or disputes liability for third-party scripts.
              </div>

              <button
                type="submit"
                disabled={buying}
                className="mc-btn w-full py-4 rounded-md bg-primary hover:bg-primary-hover text-black font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                {buying ? (
                  <>
                    <div className="loader shrink-0" style={{ width: 14, height: 14, borderWidth: 1.5 }} />
                    Authorizing Secure Escrow...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    {selectedPlugin.price === 0 ? 'Unlock & Download ZIP' : `Pay & Request Delivery`}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          INSTANT EMAIL DISPATCH DELIVERER
      ────────────────────────────────────────────────────────── */}
      {emailModalOpen && purchasedPluginDetails && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in font-mono">
          <div className="mc-slot border-2 border-emerald-500/30 rounded-2xl bg-[#090909] p-8 max-w-2xl w-full relative scanlines text-xs">
            
            <button
              onClick={() => setEmailModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-4 h-4 text-primary animate-pulse" />
              <span className="font-pixel text-[9px] text-primary tracking-[0.25em]">INSTANT_EMAIL_NODE</span>
            </div>

            <h3 className="text-white font-black text-xl mb-1">Instant Email Dispatcher</h3>
            <p className="text-white/40 text-[10px] mb-6">Delivered instantly to <strong className="text-emerald-400">{user?.email || 'buyer@email.com'}</strong></p>

            {/* Email UI container */}
            <div className="border border-white/10 rounded-xl overflow-hidden bg-black/80 shadow-2xl">
              {/* Header */}
              <div className="bg-[#111] p-4 border-b border-white/5 flex justify-between items-center text-[10px] text-white/50">
                <div>
                  <div><strong>From:</strong> Craft It Yourself <span className="text-primary">&lt;no-reply@craftityourself.gg&gt;</span></div>
                  <div className="mt-1"><strong>To:</strong> {user?.name || 'Developer'} &lt;{user?.email || 'buyer@email.com'}&gt;</div>
                </div>
                <div className="text-right">
                  <div><strong>Date:</strong> {new Date().toLocaleString()}</div>
                  <div className="mt-1"><strong>Subject:</strong> 🎮 [CIY Marketplace] Secured Order: {purchasedPluginDetails.name}</div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 text-white/70 leading-relaxed text-[11px] max-h-[300px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                    🎉
                  </div>
                  <div>
                    <h4 className="text-white font-bold font-pixel text-[9px]">YOUR ORDER IS DELIVERED INSTANTLY!</h4>
                    <p className="text-white/40 mt-0.5">Thank you for supporting community independent developers.</p>
                  </div>
                </div>

                <div className="space-y-2 border-y border-white/5 py-4">
                  <div className="flex justify-between">
                    <span className="text-white/40">Product:</span>
                    <span className="text-white font-bold">{purchasedPluginDetails.name} (+ Source Code)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">License Key:</span>
                    <span className="text-primary font-bold font-mono">{mockLicenseKey}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">DRM Signature:</span>
                    <span className="text-red-400 font-mono text-[9px] select-all truncate max-w-[200px]">{mockWatermarkId}</span>
                  </div>
                </div>

                <div className="mc-slot p-3.5 rounded bg-primary/5 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-3">
                  <div>
                    <h5 className="text-white font-bold">Secure Source Downloads</h5>
                    <p className="text-white/40 text-[9px] mt-0.5">Watermarked files are compiled on demand.</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        toast.success('Downloading Compiled JAR...');
                      }}
                      className="mc-btn px-3 py-2 bg-primary text-black font-black uppercase text-[9px] rounded flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Compiled JAR
                    </a>
                    {purchasedPluginDetails.hasSource && (
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          toast.success('Downloading Source ZIP...');
                        }}
                        className="mc-btn px-3 py-2 bg-emerald-500 text-white font-black uppercase text-[9px] rounded flex items-center gap-1"
                      >
                        <FileCode2 className="w-3.5 h-3.5" /> Source ZIP
                      </a>
                    )}
                  </div>
                </div>

                {/* Liability agreement note in secure mail body */}
                <div className="p-3 rounded bg-white/5 border border-white/10 text-[9px] text-white/40 leading-relaxed">
                  ⚖️ <strong>Legal Notice:</strong> Craft It Yourself provides instant secure file routing coordinates for sellers and buyers. We do not assume any legal responsibility, liability, or disputes warranty.
                </div>

                <div className="space-y-1.5 font-mono text-[10px] text-white/30 border-t border-white/5 pt-4">
                  <h6 className="text-white/50 font-bold uppercase text-[9px]">💡 Developer Recipe (Setup Guide):</h6>
                  <p>1. Drop the compiled .jar file in your server's plugins/ directory.</p>
                  <p>2. Restart the server. The config.yml template is auto-generated inside plugin directories.</p>
                  <p>3. Activate your license key by running: /ciy activate {mockLicenseKey} in the server console.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEmailModalOpen(false)}
                className="mc-btn px-6 py-2.5 bg-primary text-black font-black uppercase text-xs rounded"
              >
                Close Dispatcher
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
