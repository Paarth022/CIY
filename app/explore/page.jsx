'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PluginCard from '@/components/PluginCard';
import { EXPLORE_PLUGINS } from '@/lib/examplePlugins';
import { CATEGORIES } from '@/lib/categories';
import { Search } from 'lucide-react';
import Link from 'next/link';

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlugins = EXPLORE_PLUGINS.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          plugin.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || 
                            plugin.tags.some(tag => tag.toLowerCase() === activeCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-20 max-w-7xl mx-auto px-4 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="font-pixel text-3xl mb-3 text-white">Explore Plugins</h1>
            <p className="text-white/60">Browse plugins built by the CIY community</p>
          </div>
          <Link 
            href="/create"
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-md font-medium transition-colors border border-white/10 whitespace-nowrap"
          >
            Build Your Own →
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="space-y-6 mb-12">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
            <input 
              type="text"
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-border focus:border-primary/50 text-white pl-12 pr-4 py-4 rounded-xl outline-none transition-colors shadow-inner"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center justify-between">
            <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 gap-2 hide-scrollbar w-full sm:w-auto">
              {CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                    activeCategory === category.id 
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-surface border border-border text-white/70 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
            
            <div className="hidden sm:block">
              <select className="bg-surface border border-border text-white/80 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary">
                <option>Newest</option>
                <option>Most Downloaded</option>
                <option>Most Popular</option>
              </select>
            </div>
          </div>
        </div>

        {/* Plugin Grid */}
        {filteredPlugins.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlugins.map(plugin => (
              <PluginCard key={plugin.id} plugin={plugin} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface border border-border rounded-xl">
            <p className="text-white/50 text-lg">No plugins found matching your criteria.</p>
            <button 
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="mt-4 text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
