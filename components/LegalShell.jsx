export default function LegalShell({ title, effective, children }) {
  return (
    <div className="max-w-3xl mx-auto px-4 relative">
      <div className="fixed inset-0 pixel-grid opacity-40 pointer-events-none -z-10" />
      <header className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono tracking-[0.2em] uppercase mb-5">
          Legal
        </div>
        <h1 className="font-pixel text-[20px] md:text-[28px] leading-[1.5] text-white mb-3">{title}</h1>
        <p className="text-white/40 text-sm font-mono">Effective {effective}</p>
      </header>
      <article className="legal-prose mc-slot rounded-2xl p-8 md:p-10">
        {children}
      </article>
    </div>
  );
}
