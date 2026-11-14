import Link from 'next/link';
import { FOOTER_LINKS, FOOTER_LEGAL, FOOTER_SUPPORT } from '@/lib/navigation';
import { Pickaxe, Github, MessageCircle, Heart } from 'lucide-react';

function FooterList({ title, items }) {
  return (
    <div>
      <h4 className="font-pixel text-[9px] text-primary/80 tracking-[0.25em] mb-4">[ {title} ]</h4>
      <ul className="space-y-2.5">
        {items.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/55 hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <span className="text-primary/40 text-[10px] group-hover:translate-x-1 transition-transform">▸</span>
                {link.label}
              </a>
            ) : (
              <Link href={link.href} className="text-sm text-white/55 hover:text-primary transition-colors flex items-center gap-2 group">
                <span className="text-primary/40 text-[10px] group-hover:translate-x-1 transition-transform">▸</span>
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="relative bg-background border-t-2 border-primary/15 mt-auto overflow-hidden">
      <div className="absolute inset-0 pixel-grid opacity-40 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto py-14 px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 mb-10">

          {/* brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 mc-btn rounded-md bg-primary flex items-center justify-center">
                <Pickaxe className="w-4 h-4 text-black" strokeWidth={3} />
              </div>
              <div className="leading-none">
                <div className="font-pixel text-[11px] text-white tracking-wider glow-green">CRAFT IT</div>
                <div className="font-pixel text-[11px] text-primary tracking-wider glow-green">YOURSELF</div>
              </div>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm mb-5">
              The fastest way to craft Minecraft plugins. Describe what you want in plain English,
              our AI builds it, you deploy it.
            </p>
            <div className="flex items-center gap-2">
              <a href="https://discord.gg/ciy" target="_blank" rel="noopener noreferrer"
                 className="mc-btn w-9 h-9 flex items-center justify-center rounded-md bg-white/5 border border-white/10 text-white/60 hover:text-primary hover:border-primary/40 transition-colors"
                 aria-label="Discord">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href="https://github.com/craftityourself" target="_blank" rel="noopener noreferrer"
                 className="mc-btn w-9 h-9 flex items-center justify-center rounded-md bg-white/5 border border-white/10 text-white/60 hover:text-primary hover:border-primary/40 transition-colors"
                 aria-label="GitHub">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          <FooterList title="PRODUCT" items={FOOTER_LINKS} />
          <FooterList title="SUPPORT" items={FOOTER_SUPPORT} />
          <FooterList title="LEGAL"   items={FOOTER_LEGAL} />
        </div>

        <div className="border-t border-white/5 mb-6" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/35 font-mono tracking-wider">
            © {new Date().getFullYear()} Craft It Yourself · Made with <Heart className="w-3 h-3 inline text-primary fill-primary" /> by crafters
          </p>
          <p className="text-[10px] text-white/25 font-mono tracking-wider uppercase">
            Not affiliated with Mojang or Microsoft
          </p>
        </div>
      </div>
    </footer>
  );
}
