import Link from 'next/link';
import { FOOTER_LINKS } from '@/lib/navigation';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div className="flex items-center gap-2">
            <span className="text-primary text-xl">🧱</span>
            <span className="font-pixel text-primary mt-1 text-sm">CIY</span>
            <span className="text-white/60 text-sm ml-2">— Create Minecraft plugins without coding</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="text-white/60 hover:text-white transition-colors text-sm">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} CIY — Craft It Yourself • Not affiliated with Mojang or Microsoft
          </p>
          <p className="text-white/40 text-sm">
            Made with ❤️ for the Minecraft community
          </p>
        </div>
      </div>
    </footer>
  );
}
