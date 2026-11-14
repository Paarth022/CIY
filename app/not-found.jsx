import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Pickaxe, Home, Boxes } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-x-hidden">
      {/* ambient bg */}
      <div className="fixed inset-0 pixel-grid opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(34,197,94,0.08),transparent)] pointer-events-none" />

      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-20 relative z-10 scanlines">

        {/* 404 as a crafting slot */}
        <div className="mc-slot rounded-2xl p-10 md:p-14 text-center max-w-lg w-full relative overflow-hidden">
          <div className="absolute inset-0 pixel-grid-fine opacity-40 pointer-events-none" />

          {/* corner accents */}
          <div className="absolute top-3 left-3  w-6 h-6 border-t-2 border-l-2 border-red-500/40 rounded-tl" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-red-500/40 rounded-tr" />
          <div className="absolute bottom-3 left-3  w-6 h-6 border-b-2 border-l-2 border-red-500/40 rounded-bl" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-red-500/40 rounded-br" />

          <div className="relative z-10">
            <div className="text-7xl mb-5" style={{ filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.4))' }}>💥</div>
            <h1 className="font-pixel text-[36px] md:text-[44px] text-red-400 mb-3 tracking-wider" style={{ textShadow: '0 0 24px rgba(239,68,68,0.5)' }}>
              404
            </h1>
            <div className="font-pixel text-[10px] tracking-[0.25em] text-red-400/70 mb-5">
              [BLOCK_NOT_FOUND]
            </div>
            <h2 className="text-xl font-black text-white mb-3 uppercase tracking-wider">
              This chunk doesn't exist
            </h2>
            <p className="text-white/50 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
              Looks like a creeper got here first. The page or plugin you're trying to reach has been blown up.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="mc-btn inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-black px-6 py-3 rounded-md font-black uppercase tracking-wider text-sm"
              >
                <Home className="w-4 h-4" />
                Return to Hub
              </Link>
              <Link
                href="/create"
                className="mc-btn inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-primary/40 px-6 py-3 rounded-md font-black uppercase tracking-wider text-sm"
              >
                <Pickaxe className="w-4 h-4" />
                Start Crafting
              </Link>
              <Link
                href="/explore"
                className="mc-btn inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-primary/40 px-6 py-3 rounded-md font-black uppercase tracking-wider text-sm"
              >
                <Boxes className="w-4 h-4" />
                Explore
              </Link>
            </div>
          </div>
        </div>

        {/* small log line */}
        <p className="mt-6 font-mono text-[10px] text-white/30 tracking-wider">
          [ERROR 404] · <span className="text-red-400/60">could_not_find_resource</span> · returning_to_overworld
        </p>
      </main>

      <Footer />
    </div>
  );
}
