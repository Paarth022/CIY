'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { logIn } from '@/lib/auth';
import { sanitizeNext } from '@/lib/utils';
import { Pickaxe, Mail, Lock, MoveRight } from 'lucide-react';
import { toast } from 'sonner';

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const next         = sanitizeNext(searchParams.get('next'));

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy]         = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await logIn({ email, password });
      toast.success('Welcome back!');
      router.push(next);
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mc-slot rounded-2xl p-8 scanlines relative overflow-hidden">
      <div className="absolute inset-0 pixel-grid-fine opacity-40 pointer-events-none" />
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono tracking-[0.2em] uppercase mb-5">
          <Pickaxe className="w-3 h-3" />
          Rejoin
        </div>
        <h1 className="font-pixel text-[18px] md:text-[22px] leading-[1.5] mb-2">
          <span className="text-white">Welcome</span>{' '}
          <span className="text-primary glow-green">back.</span>
        </h1>
        <p className="text-white/50 text-sm mb-6">
          Log back in to keep crafting.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
              <input
                type="email"
                required
                placeholder="you@craftityourself.gg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-md pl-10 pr-3 py-3 text-sm outline-none text-white focus:border-primary/50 placeholder:text-white/25 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-md pl-10 pr-3 py-3 text-sm outline-none text-white focus:border-primary/50 placeholder:text-white/25 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mc-btn w-full bg-primary hover:bg-primary-hover disabled:bg-primary/30 text-black font-black text-sm py-4 rounded-md shadow-[0_0_30px_rgba(34,197,94,0.3)] flex justify-center items-center gap-2 uppercase tracking-widest"
          >
            {busy ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <Pickaxe className="w-4 h-4" />
                Log in
                <MoveRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-xs text-white/40 text-center">
          New crafter? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-primary hover:underline font-semibold">Claim your free plugin</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-x-hidden">
      <div className="fixed inset-0 pixel-grid opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(34,197,94,0.08),transparent)] pointer-events-none" />
      <Navbar />
      <main className="flex-grow pt-28 pb-16 flex items-center justify-center px-4 relative z-10">
        <Suspense fallback={<div className="loader" />}>
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
