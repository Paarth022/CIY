'use client';
import { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import CodeViewer from '@/components/CodeViewer';
import { AI_PROVIDERS, getDefaultProvider } from '@/lib/providers';
import { QUICK_PROMPTS } from '@/lib/examplePlugins';
import { Sparkles, Settings2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

function CreateForm() {
  const searchParams = useSearchParams();
  const initPrompt = searchParams.get('prompt') || '';

  const [prompt, setPrompt] = useState(initPrompt);
  const [version, setVersion] = useState("1.21.4");
  const [complexity, setComplexity] = useState("Medium");
  
  // AI Provider State
  const [selectedProvider, setSelectedProvider] = useState(getDefaultProvider().id);
  const [apiKey, setApiKey] = useState('');
  
  // App state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);

  // Load API keys from local storage
  useEffect(() => {
    const savedKeys = JSON.parse(localStorage.getItem('ciy-api-keys') || '{}');
    if (savedKeys[selectedProvider]) {
      setApiKey(savedKeys[selectedProvider]);
    } else {
      setApiKey('');
    }
  }, [selectedProvider]);

  const handleKeyChange = (e) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    const savedKeys = JSON.parse(localStorage.getItem('ciy-api-keys') || '{}');
    savedKeys[selectedProvider] = newKey;
    localStorage.setItem('ciy-api-keys', JSON.stringify(savedKeys));
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !apiKey.trim()) {
      toast.error('Please provide both a description and an API key.');
      return;
    }
    
    setIsGenerating(true);
    setGeneratedData(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: prompt,
          version,
          complexity,
          provider: selectedProvider,
          apiKey
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate plugin.');
      }

      setGeneratedData(data.data);
      toast.success('Plugin generated successfully!');
    } catch (err) {
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1600px] w-full mx-auto p-4 flex-grow">
      {/* LEFT PANEL */}
      <div className="w-full lg:w-[38%] flex flex-col gap-4 sticky top-24 h-fit">
        <div className="mb-2">
          <h1 className="font-pixel text-xl sm:text-2xl mb-2 text-white">Build Your Plugin</h1>
          <p className="text-white/60 text-sm">Describe what you want in plain English</p>
        </div>

        {/* Quick Prompts */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-primary flex items-center gap-1">
            <Sparkles size={12} /> Try an example:
          </span>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((qPrompt, i) => (
              <button 
                key={i} 
                className="text-xs bg-surface border border-border hover:border-primary/50 text-white/70 hover:text-white px-3 py-1.5 rounded-full transition-colors text-left"
                onClick={() => setPrompt(qPrompt)}
              >
                {qPrompt}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            placeholder="Describe your plugin...&#10;&#10;Example: Create a /heal command that heals the player to full health, with a configurable cooldown per player. Add a permission node 'myplugin.heal' and make all messages configurable in config.yml"
            className="w-full min-h-[200px] md:min-h-[250px] bg-[#0d0d0d] border border-border outline-none rounded-xl p-4 text-white placeholder-white/30 resize-none focus:border-primary transition-colors disabled:opacity-50"
          ></textarea>
          <div className="absolute bottom-4 right-4 text-xs text-white/30">
            {prompt.length} chars
          </div>
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Minecraft Version</label>
            <select 
              value={version} 
              disabled={isGenerating}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full bg-surface border border-border text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-primary"
            >
              <option value="1.21.4">1.21.4</option>
              <option value="1.21">1.21</option>
              <option value="1.20.6">1.20.6</option>
              <option value="1.20.4">1.20.4</option>
              <option value="1.20.1">1.20.1</option>
              <option value="1.19.4">1.19.4</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Complexity</label>
            <select 
              value={complexity}
              disabled={isGenerating}
              onChange={(e) => setComplexity(e.target.value)}
              className="w-full bg-surface border border-border text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-primary"
            >
              <option value="Simple">Simple (Single class)</option>
              <option value="Medium">Medium (Clean architecture)</option>
              <option value="Advanced">Advanced (Data & managers)</option>
            </select>
          </div>
        </div>

        {/* AI Provider Config */}
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
            <Settings2 size={16} /> AI Settings
          </div>
          <div className="grid grid-cols-2 gap-2">
            {AI_PROVIDERS.map(prov => (
              <button 
                key={prov.id}
                disabled={isGenerating}
                onClick={() => setSelectedProvider(prov.id)}
                className={`py-2 px-2 rounded-lg text-xs font-medium border font-mono transition-colors ${
                  selectedProvider === prov.id 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border bg-background text-white/60 hover:text-white'
                }`}
              >
                {prov.name}
              </button>
            ))}
          </div>
          <div className="relative">
            <input 
              type="password" 
              placeholder={`${AI_PROVIDERS.find(p => p.id === selectedProvider)?.name} API Key`}
              value={apiKey}
              disabled={isGenerating}
              onChange={handleKeyChange}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none text-white focus:border-primary"
            />
            <p className="text-[10px] text-white/40 mt-1">Your API key is never stored — only used for this generation</p>
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim() || !apiKey.trim()}
          className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/50 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-xl shadow-lg transition-all"
        >
          {isGenerating ? 'Generating...' : '⚡ Generate Plugin'}
        </button>

        <div className="mt-2 text-sm text-white/60 bg-white/5 border border-white/5 rounded-lg p-4">
          <p className="font-semibold text-white/80 mb-2">💡 Tips for better results:</p>
          <ul className="list-disc pl-4 space-y-1 text-xs">
            <li>Be specific about commands and permissions</li>
            <li>Mention if you need database storage</li>
            <li>List all features you want included</li>
          </ul>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[62%] h-[600px] lg:h-auto min-h-[600px]">
        <CodeViewer 
          isGenerating={isGenerating} 
          files={generatedData?.files} 
          pluginName={generatedData?.pluginName} 
          providerName={AI_PROVIDERS.find(p => p.id === selectedProvider)?.name}
        />
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20 flex flex-col">
        <Suspense fallback={<div className="p-8 text-center text-white/50">Loading editor...</div>}>
          <CreateForm />
        </Suspense>
      </main>
    </div>
  );
}
