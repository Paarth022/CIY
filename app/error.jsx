'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function RouteError({ error, reset }) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 pixel-grid opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,146,60,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 max-w-md mx-auto text-center px-6">
        <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>
        <div className="font-pixel text-[10px] tracking-[0.25em] text-amber-400/80 mb-3">[ ERR_500 ]</div>
        <h1 className="text-3xl font-black mb-3">Something broke mid-craft.</h1>
        <p className="text-white/50 mb-6 leading-relaxed">
          Our server hit an unexpected error. We&apos;ve been alerted and are on it.
        </p>
        {error?.digest && (
          <p className="font-mono text-[10px] text-white/30 mb-6">error id · {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="mc-btn inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black px-6 py-3 rounded-md font-black uppercase tracking-wider text-xs"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/"
            className="mc-btn inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-md font-black uppercase tracking-wider text-xs"
          >
            <Home className="w-4 h-4" /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
