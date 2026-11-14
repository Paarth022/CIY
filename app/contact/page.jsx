'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, MessageCircle, LifeBuoy, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const MAX_MSG   = 4000;
const MAX_NAME  = 80;
const MAX_EMAIL = 254;

export default function ContactPage() {
  const [form, setForm]     = useState({ name: '', email: '', topic: 'general', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent]     = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const name    = form.name.trim().slice(0, MAX_NAME);
    const email   = form.email.trim().slice(0, MAX_EMAIL);
    const message = form.message.trim().slice(0, MAX_MSG);
    if (!email || !message) {
      toast.error('Email and message are required.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, topic: form.topic, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Could not send.');
      setSent(true);
      toast.success('Message received. We usually reply within a day.');
    } catch (err) {
      toast.error(err.message || 'Could not send.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background relative">
      <div className="fixed inset-0 pixel-grid opacity-40 pointer-events-none" />
      <Navbar />
      <main className="flex-grow pt-28 pb-20 relative z-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono tracking-[0.2em] uppercase mb-5">
              <LifeBuoy className="w-3 h-3" />
              Support
            </div>
            <h1 className="font-pixel text-[22px] md:text-[34px] leading-[1.5] mb-4">
              <span className="text-white">Talk to</span>{' '}
              <span className="enchant-text">a crafter.</span>
            </h1>
            <p className="text-white/50 max-w-lg mx-auto">
              Bugs, billing, feature requests, partnerships — we read everything.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-6">
            <div className="space-y-4">
              <ContactTile
                icon={Mail}
                label="GENERAL"
                value="hello@craftityourself.gg"
                href="mailto:hello@craftityourself.gg"
              />
              <ContactTile
                icon={LifeBuoy}
                label="BILLING"
                value="billing@craftityourself.gg"
                href="mailto:billing@craftityourself.gg"
              />
              <ContactTile
                icon={MessageCircle}
                label="DISCORD"
                value="discord.gg/ciy"
                href="https://discord.gg/ciy"
              />
              <div className="mc-slot rounded-2xl p-5">
                <div className="font-pixel text-[9px] tracking-[0.25em] text-primary/80 mb-2">[ RESPONSE_TIME ]</div>
                <p className="text-white/60 text-sm">Most replies within 24 hours, Mon–Fri. Billing questions are triaged first.</p>
              </div>
            </div>

            <form onSubmit={submit} className="mc-slot rounded-2xl p-6">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">Message sent</h3>
                  <p className="text-white/50 max-w-sm">Thanks — we&apos;ll reply to the email you provided.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <Field label="Name">
                      <input
                        value={form.name}
                        maxLength={MAX_NAME}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="mc-input w-full"
                        placeholder="Crafter"
                      />
                    </Field>
                    <Field label="Email *">
                      <input
                        value={form.email}
                        type="email"
                        required
                        maxLength={MAX_EMAIL}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="mc-input w-full"
                        placeholder="you@example.com"
                      />
                    </Field>
                  </div>

                  <Field label="Topic">
                    <select
                      value={form.topic}
                      onChange={e => setForm({ ...form, topic: e.target.value })}
                      className="mc-input w-full"
                    >
                      <option value="general">General question</option>
                      <option value="bug">Bug report</option>
                      <option value="billing">Billing / refunds</option>
                      <option value="feature">Feature request</option>
                      <option value="partnership">Partnership</option>
                      <option value="security">Security disclosure</option>
                    </select>
                  </Field>

                  <div className="h-4" />

                  <Field label={`Message * (${form.message.length}/${MAX_MSG})`}>
                    <textarea
                      value={form.message}
                      required
                      maxLength={MAX_MSG}
                      rows={8}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      className="mc-input w-full resize-none"
                      placeholder="What happened? What would help?"
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={sending}
                    className="mc-btn mt-5 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-black px-5 py-3 rounded-md font-black uppercase tracking-widest text-xs"
                  >
                    {sending ? 'Sending...' : (<><Send className="w-4 h-4" /> Send Message</>)}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ContactTile({ icon: Icon, label, value, href }) {
  return (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
       className="mc-slot rounded-2xl p-5 flex items-center gap-4 card-lift group">
      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="min-w-0">
        <div className="font-pixel text-[9px] tracking-[0.25em] text-primary/70 mb-1">[ {label} ]</div>
        <div className="text-white font-bold text-sm truncate group-hover:text-primary transition-colors">{value}</div>
      </div>
    </a>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-pixel tracking-[0.2em] text-white/50 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
