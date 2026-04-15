'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PluginCard from '@/components/PluginCard';
import { EXPLORE_PLUGINS } from '@/lib/examplePlugins';
import { MessageSquare, Zap, Package } from 'lucide-react';

const examplePrompts = [
  "A /heal command with cooldown",
  "Custom crate reward system",
  "BedWars minigame",
  "Token economy with GUI shop",
  "Staff mode with vanish",
  "Custom enchantments",
  "Player levels and XP",
  "Auction house"
];

const stats = [
  { value: "2,847", label: "Plugins Generated" },
  { value: "15,241", label: "Total Downloads" },
  { value: "100%", label: "Free to Use" }
];

export default function LandingPage() {
  return (
    <>
      <Navbar />
      
      <main className="flex-grow pt-16">
        {/* HERO SECTION */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          
          {/* Floating Blocks (CSS abstract representation) */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-primary opacity-20 text-3xl select-none"
              initial={{ 
                y: "110vh", 
                x: `${Math.random() * 100}vw`,
                rotate: 0 
              }}
              animate={{ 
                y: "-10vh",
                rotate: 360
              }}
              transition={{ 
                duration: 15 + Math.random() * 20, 
                repeat: Infinity, 
                ease: "linear",
                delay: Math.random() * -20
              }}
            >
              🧱
            </motion.div>
          ))}

          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-surface mb-8"
            >
              <span className="text-sm">✨</span>
              <span className="text-sm font-medium text-white/90">Powered by Gemini AI</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-pixel text-3xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight"
            >
              Create Minecraft Plugins <span className="text-primary block mt-4">Without Coding</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto"
            >
              Describe your plugin in plain English. CIY builds complete, production-ready code instantly using AI.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link 
                href="/create"
                className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold text-lg transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]"
              >
                Start Building →
              </Link>
              <Link 
                href="/explore"
                className="w-full sm:w-auto px-8 py-4 border border-primary text-primary hover:bg-primary/10 rounded-lg font-semibold text-lg transition-colors"
              >
                Explore Plugins
              </Link>
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-sm text-primary"
            >
              No account needed • Free forever • Instant download
            </motion.p>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="border-y border-border bg-surface/50 relative z-20">
          <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-border">
              {stats.map((stat, i) => (
                <div key={i} className="text-center pt-8 md:pt-0 first:pt-0">
                  <div className="text-4xl font-bold font-mono text-primary mb-2">{stat.value}</div>
                  <div className="text-white/60 text-sm tracking-wide uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-24 max-w-6xl mx-auto px-4">
          <h2 className="font-pixel text-2xl md:text-3xl text-center mb-16">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-[100px] left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0"></div>
            
            <motion.div whileHover={{ y: -5 }} className="bg-surface border-t-2 border-t-primary border-x border-b border-border p-8 rounded-xl relative z-10">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6 border border-primary/30">
                <MessageSquare className="text-primary w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Describe</h3>
              <p className="text-white/60 leading-relaxed">Tell CIY what you want in plain English. No technical knowledge needed — just describe what it should do.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="bg-surface border-t-2 border-t-primary border-x border-b border-border p-8 rounded-xl relative z-10">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6 border border-primary/30">
                <Zap className="text-primary w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Generate</h3>
              <p className="text-white/60 leading-relaxed">Our AI writes complete Java code, plugin.yml, pom.xml, and config files. Production-ready in seconds.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="bg-surface border-t-2 border-t-primary border-x border-b border-border p-8 rounded-xl relative z-10">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6 border border-primary/30">
                <Package className="text-primary w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Download</h3>
              <p className="text-white/60 leading-relaxed">Get all your files as a ZIP. Drop the JAR in your plugins folder and you're done.</p>
            </motion.div>
          </div>
        </section>

        {/* PROMPTS SECTION */}
        <section className="bg-surface border-y border-border py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="font-pixel text-2xl md:text-3xl mb-4">What Can You Build?</h2>
            <p className="text-white/60 mb-10">Click any example to try it</p>
            
            <div className="flex flex-wrap justify-center gap-3">
              {examplePrompts.map((prompt, i) => (
                <Link 
                  key={i} 
                  href={`/create?prompt=${encodeURIComponent(prompt)}`}
                  className="bg-background border border-border hover:border-primary px-5 py-3 rounded-full text-sm font-medium transition-colors hover:bg-primary/5"
                >
                  {prompt}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* COMMUNITY PLUGINS */}
        <section className="py-24 max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-pixel text-2xl md:text-3xl mb-4">Made with CIY</h2>
            <p className="text-white/60">Plugins built by the community</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {EXPLORE_PLUGINS.map(plugin => (
              <PluginCard key={plugin.id} plugin={plugin} />
            ))}
          </div>
          
          <div className="text-center">
            <Link 
              href="/explore"
              className="inline-block px-8 py-3 border border-white/20 hover:border-white text-white rounded-lg font-semibold transition-colors"
            >
              View All Plugins →
            </Link>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative py-32 border-t border-border overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
          <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
            <h2 className="font-pixel text-2xl md:text-4xl mb-6">Ready to build your plugin?</h2>
            <p className="text-xl text-white/60 mb-10">Join thousands of server owners and developers using CIY</p>
            <Link 
              href="/create"
              className="inline-block px-10 py-5 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold text-xl transition-all shadow-lg hover:shadow-primary/40"
            >
              Start Building For Free →
            </Link>
            <p className="mt-6 text-white/40 text-sm">No account required</p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
