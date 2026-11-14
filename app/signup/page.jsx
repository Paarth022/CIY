'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { signUp, verifyOtp } from '@/lib/auth';
import { sanitizeNext } from '@/lib/utils';
import { Pickaxe, Mail, User, Lock, MoveRight, Gift, Sparkles, Key, Check, X } from 'lucide-react';
import { toast } from 'sonner';

function SignUpForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const next         = sanitizeNext(searchParams.get('next'));

  const [name, setName]                       = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken]                     = useState('');
  const [busy, setBusy]                       = useState(false);
  const [step, setStep]                       = useState(1);

  // Password Strength Checks
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber    = /[0-9]/.test(password);
  const hasSpecial   = /[^A-Za-z0-9]/.test(password);
  const isLongEnough = password.length >= 8;
  const passwordsMatch = password && password === confirmPassword;
  
  const isPasswordValid = hasUppercase && hasNumber && hasSpecial && isLongEnough && passwordsMatch;

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      toast.error('Please ensure your password meets all requirements.');
      return;
    }
    setBusy(true);
    try {
      const res = await signUp({ name, email, password });
      if (res?.requiresOtp) {
        toast.success('Verification code sent to your email!');
        setStep(2);
      } else {
        toast.success('Welcome, crafter! 🎉 You unlocked 1 free Normal plugin.');
        router.push(next);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await verifyOtp({ email, token, name, type: 'signup' });
      toast.success('Welcome, crafter! 🎉 You unlocked 1 free Normal plugin.');
      router.push(next);
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[1.05fr_1fr] gap-6">
      {/* LEFT — form */}
      <div className="mc-slot rounded-2xl p-8 scanlines relative overflow-hidden">
        <div className="absolute inset-0 pixel-grid-fine opacity-40 pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono tracking-[0.2em] uppercase mb-5">
            <Pickaxe className="w-3 h-3" />
            Join the Server
          </div>
          <h1 className="font-pixel text-[18px] md:text-[22px] leading-[1.5] mb-2">
            <span className="text-white">Claim your</span>{' '}
            <span className="text-primary glow-green">free plugin</span>
          </h1>
          <p className="text-white/50 text-sm mb-6">
            No credit card. One free Normal plugin, instantly.
          </p>

          {step === 1 ? (
            <form onSubmit={handleSignUp} className="space-y-4">
              <FormField icon={User}  label="Username" placeholder="StevenTheCrafter" value={name}     onChange={setName} />
              <FormField icon={Mail}  label="Email"    placeholder="you@craftityourself.gg" type="email" value={email} onChange={setEmail} required />
              
              <FormField icon={Lock}  label="Password" placeholder="••••••••"  type="password" value={password} onChange={setPassword} required />
              <FormField icon={Lock}  label="Confirm Password" placeholder="••••••••"  type="password" value={confirmPassword} onChange={setConfirmPassword} required />
              
              {/* Password Strength Indicator */}
              {(password.length > 0 || confirmPassword.length > 0) && (
                <div className="bg-black/40 border border-white/5 rounded-md p-3 text-[10px] space-y-1.5">
                  <div className="text-white/50 mb-2 uppercase tracking-wider font-bold">Password Strength</div>
                  <StrengthRule met={isLongEnough} text="At least 8 characters" />
                  <StrengthRule met={hasUppercase} text="One uppercase letter" />
                  <StrengthRule met={hasNumber}    text="One number" />
                  <StrengthRule met={hasSpecial}   text="One special character" />
                  <StrengthRule met={passwordsMatch} text="Passwords match" />
                </div>
              )}

              <button
                type="submit"
                disabled={busy || (password && !isPasswordValid)}
                className="mc-btn w-full bg-primary hover:bg-primary-hover disabled:bg-primary/30 text-black font-black text-sm py-4 rounded-md shadow-[0_0_30px_rgba(34,197,94,0.3)] flex justify-center items-center gap-2 uppercase tracking-widest mt-2"
              >
                {busy ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Verify Email
                    <MoveRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <FormField icon={Key} label="Verification Code" placeholder="6-digit code" value={token} onChange={setToken} required />

              <button
                type="submit"
                disabled={busy}
                className="mc-btn w-full bg-primary hover:bg-primary-hover disabled:bg-primary/30 text-black font-black text-sm py-4 rounded-md shadow-[0_0_30px_rgba(34,197,94,0.3)] flex justify-center items-center gap-2 uppercase tracking-widest"
              >
                {busy ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Pickaxe className="w-4 h-4" />
                    Verify & Spawn Account
                    <MoveRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-xs text-white/40 hover:text-white mt-2"
              >
                ← Back to edit details
              </button>
            </form>
          )}

          <p className="mt-5 text-xs text-white/40 text-center">
            Already crafting? <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-primary hover:underline font-semibold">Log in</Link>
          </p>

          <p className="mt-4 text-[10px] text-white/25 text-center font-mono tracking-wider leading-relaxed">
            By signing up you agree that this is a local-only demo account
            (data lives on this device). Stripe + real auth wire-up coming soon.
          </p>
        </div>
      </div>


      {/* RIGHT — benefits */}
      <div className="flex flex-col gap-4">
        <div className="rarity-legendary rounded-2xl p-6 bg-[#0b0b0b] border-2">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-4 h-4 text-amber-400" />
            <span className="font-pixel text-[10px] tracking-[0.25em] text-amber-400">FREE_TRIAL_DROP</span>
          </div>
          <h3 className="text-xl font-black text-white mb-3 glow-gold">What you get:</h3>
          <ul className="space-y-2.5 text-sm">
            {[
              '1 free Normal-tier plugin',
              'All AI providers unlocked',
              'Full Java + plugin.yml + pom.xml',
              'Instant ZIP download',
              'No credit card required',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-white/70">
                <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mc-slot rounded-2xl p-5">
          <div className="font-pixel text-[9px] tracking-[0.25em] text-primary/70 mb-3">[SERVER_STATUS]</div>
          <div className="space-y-2 text-xs font-mono">
            <Row k="crafters_online" v={<span className="text-primary">2,847</span>} />
            <Row k="plugins_crafted" v={<span className="text-white/80">15,241+</span>} />
            <Row k="success_rate"    v={<span className="text-primary">98.2%</span>} />
            <Row k="avg_craft_time"  v={<span className="text-white/80">12s</span>} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/40">{k}</span>
      <span className="flex-1 h-px border-t border-dashed border-white/10 translate-y-1" />
      <span>{v}</span>
    </div>
  );
}

function FormField({ icon: Icon, label, placeholder, type = 'text', value, onChange, required, minLength }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          required={required}
          minLength={minLength}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-black/60 border border-white/10 rounded-md pl-10 pr-3 py-3 text-sm outline-none text-white focus:border-primary/50 placeholder:text-white/25 font-mono"
        />
      </div>
    </div>
  );
}

function StrengthRule({ met, text }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check className="w-3 h-3 text-primary shrink-0" />
      ) : (
        <X className="w-3 h-3 text-white/20 shrink-0" />
      )}
      <span className={met ? 'text-white/80' : 'text-white/30'}>{text}</span>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-x-hidden">
      <div className="fixed inset-0 pixel-grid opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(34,197,94,0.08),transparent)] pointer-events-none" />
      <Navbar />
      <main className="flex-grow pt-28 pb-16 flex items-center justify-center px-4 relative z-10">
        <Suspense fallback={<div className="loader" />}>
          <SignUpForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
