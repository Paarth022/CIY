'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NAVIGATION_LINKS } from '@/lib/navigation';
import { Menu, X, Pickaxe, MoveRight, User, LogOut, Gem, Zap } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth, logOut, getAvailableCredits } from '@/lib/auth';
import { toast } from 'sonner';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, usage } = useAuth();
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = () => {
    logOut();
    setMenuOpen(false);
    toast.success('Logged out. Come back soon!');
    router.push('/');
  };

  const totalCredits = user && usage
    ? ['advanced', 'medium', 'normal'].reduce((sum, t) => {
        const v = getAvailableCredits(t, usage);
        return v === Infinity || v === -1 ? sum : sum + v;
      }, 0)
    : 0;
  const hasUnlimited = user && usage && ['advanced', 'medium', 'normal']
    .some(t => (usage.credits?.[t] ?? 0) === -1);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#030307]/85 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
          : 'bg-black/20 backdrop-blur-sm border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* ── LOGO (Sleek Gradient & Technical Font) ── */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-[#22c55e] to-[#10b981] flex items-center justify-center overflow-hidden shadow-[0_0_12px_rgba(34,197,94,0.3)]">
              <Pickaxe className="w-4 h-4 text-black relative z-10" strokeWidth={3} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-sans-header font-black text-[12px] text-white tracking-wide">CRAFT IT</span>
              <span className="font-sans-header font-black text-[12px] text-primary tracking-wide">YOURSELF</span>
            </div>
          </Link>

          {/* ── DESKTOP NAV ── */}
          <div className="hidden md:flex items-center gap-1">
            {NAVIGATION_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`relative px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    active ? 'text-primary' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full shadow-[0_0_10px_rgba(34,197,94,0.7)]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ── RIGHT SIDE ── */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {/* Credits pill */}
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-white/80 transition-colors"
                  title="Credits remaining"
                >
                  <Gem className="w-3 h-3 text-primary animate-pulse" />
                  <span className="font-bold text-primary">
                    {hasUnlimited ? '∞' : totalCredits}
                  </span>
                  <span className="text-white/40">credits</span>
                </Link>

                {/* Account menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(v => !v)}
                    className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-3 py-2 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all"
                  >
                    <div className="w-5 h-5 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px]">
                      <User className="w-3 h-3 text-primary" />
                    </div>
                    <span className="max-w-[100px] truncate">{user.name}</span>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#08080c] shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/5 bg-white/[0.01]">
                        <div className="text-[9px] font-mono text-primary tracking-widest mb-0.5 font-bold uppercase">CRAFTER PROFILE</div>
                        <div className="text-white font-black text-sm truncate">{user.name}</div>
                        <div className="text-white/40 text-[9px] font-mono truncate">{user.email}</div>
                      </div>
                      <Link
                        href="/account"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/5 hover:text-primary transition-colors"
                      >
                        <User className="w-3.5 h-3.5" /> Account
                      </Link>
                      <Link
                        href="/pricing"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/5 hover:text-primary transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5" /> Upgrade
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-red-500/10 hover:text-red-400 transition-colors border-t border-white/5"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Log out
                      </button>
                    </div>
                  )}
                </div>

                <Link
                  href="/create"
                  className="modern-btn-primary px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold inline-flex items-center gap-2"
                >
                  <Pickaxe className="w-3.5 h-3.5" />
                  Craft
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup?next=/create"
                  className="modern-btn-primary px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold inline-flex items-center gap-2"
                >
                  <Pickaxe className="w-3.5 h-3.5" />
                  Start Crafting
                  <MoveRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* ── MOBILE BTN ── */}
          <button
            onClick={() => setIsOpen(v => !v)}
            className="md:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center transition-colors hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── MOBILE NAV ── */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#030307] backdrop-blur-xl">
          <div className="px-4 py-4 space-y-2">
            {NAVIGATION_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                    active ? 'border-primary/20 bg-primary/5 text-primary' : 'border-transparent text-white/70 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {user ? (
              <>
                <div className="rounded-xl border border-white/15 px-4 py-3 flex items-center gap-3 mt-3 bg-white/[0.01]">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <User className="w-4 h-4 text-white/55" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-black text-sm truncate">{user.name}</div>
                    <div className="text-[10px] font-mono text-primary font-bold">
                      {hasUnlimited ? '∞' : totalCredits} credits
                    </div>
                  </div>
                </div>
                <Link
                  href="/account"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white border border-transparent"
                >
                  Account
                </Link>
                <Link
                  href="/create"
                  onClick={() => setIsOpen(false)}
                  className="modern-btn-primary px-5 py-3 rounded-xl font-bold uppercase tracking-wider text-xs mt-2 flex items-center justify-center gap-2"
                >
                  <Pickaxe className="w-3.5 h-3.5" /> Craft Plugin
                </Link>
                <button
                  onClick={() => { setIsOpen(false); handleLogout(); }}
                  className="block w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 border border-transparent"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white border border-transparent"
                >
                  Log in
                </Link>
                <Link
                  href="/signup?next=/create"
                  onClick={() => setIsOpen(false)}
                  className="modern-btn-primary mt-3 px-5 py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                >
                  <Pickaxe className="w-3.5 h-3.5" /> Start Crafting
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
