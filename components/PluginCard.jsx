'use client';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PluginCard({ plugin }) {
  return (
    <motion.div 
      whileHover={{ y: -5, boxShadow: "0 0 20px rgba(34,197,94,0.15)" }}
      className="bg-surface border border-border rounded-xl p-5 flex flex-col h-full transition-colors hover:border-primary/50 group"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-white text-lg group-hover:text-primary transition-colors">{plugin.name}</h3>
        <span className="bg-black/50 border border-white/10 text-white/70 text-xs px-2 py-1 rounded">
          {plugin.version}
        </span>
      </div>
      
      <p className="text-white/60 text-sm mb-4 line-clamp-2 flex-grow">
        {plugin.description}
      </p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {plugin.tags.map(tag => (
          <span key={tag} className="bg-primary/10 text-primary border border-primary/20 text-xs px-2 py-1 rounded-full">
            {tag}
          </span>
        ))}
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
        <div className="flex items-center text-white/50 text-sm gap-1">
          <Download size={14} />
          <span>{plugin.downloads.toLocaleString()}</span>
        </div>
        <Link 
          href="/create" 
          className="text-primary font-medium text-sm hover:underline flex items-center gap-1"
        >
          View Code →
        </Link>
      </div>
    </motion.div>
  );
}
