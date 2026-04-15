'use client';
import Link from 'next/link';
import { NAVIGATION_LINKS } from '@/lib/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-primary text-xl">🧱</span>
            <span className="font-pixel text-primary mt-1">CIY</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAVIGATION_LINKS.map((link) => (
              <Link 
                key={link.label} 
                href={link.href}
                className="text-white/80 hover:text-primary transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex">
            <Link 
              href="/create"
              className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-md font-semibold transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] text-sm"
            >
              Start Building →
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-surface border-b border-border">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {NAVIGATION_LINKS.map((link) => (
              <Link 
                key={link.label} 
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-base font-medium text-white/80 hover:text-primary hover:bg-white/5 rounded-md"
              >
                {link.label}
              </Link>
            ))}
            <Link 
              href="/create"
              onClick={() => setIsOpen(false)}
              className="block mt-4 text-center bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-md font-semibold text-sm"
            >
              Start Building →
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
