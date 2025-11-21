
import React, { useState, useEffect } from 'react';
import { useData } from '../DataContext';
import { Copy, Check, Edit3, Save, X } from 'lucide-react';

interface TemplateCard {
  title: string;
  content: string;
  category: string;
}

export const MessageTemplates: React.FC = () => {
  const { pageContent, savePageContent } = useData();
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [rawText, setRawText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load content
  useEffect(() => {
    const content = pageContent['outreach-templates'];
    if (content) {
      setRawText(content.text);
    }
  }, [pageContent]);

  // Parse Markdown to Cards
  const parseTemplates = (text: string): Record<string, TemplateCard[]> => {
    const lines = text.split('\n');
    const categories: Record<string, TemplateCard[]> = {};
    
    let currentCategory = 'General';
    let currentTitle = '';
    let currentContent: string[] = [];
    
    lines.forEach(line => {
      if (line.startsWith('## ')) {
        // Save previous card if exists
        if (currentTitle && currentContent.length > 0) {
          if (!categories[currentCategory]) categories[currentCategory] = [];
          categories[currentCategory].push({
            title: currentTitle,
            content: currentContent.join('\n').trim(),
            category: currentCategory
          });
          currentTitle = '';
          currentContent = [];
        }
        currentCategory = line.replace('## ', '').trim();
      } else if (line.startsWith('### ')) {
        // Save previous card if exists
        if (currentTitle && currentContent.length > 0) {
          if (!categories[currentCategory]) categories[currentCategory] = [];
          categories[currentCategory].push({
            title: currentTitle,
            content: currentContent.join('\n').trim(),
            category: currentCategory
          });
        }
        currentTitle = line.replace('### ', '').trim();
        currentContent = [];
      } else if (line.trim() === '---') {
        // Separator, ignore
      } else {
        if (currentTitle) {
          currentContent.push(line);
        }
      }
    });

    // Catch the last one
    if (currentTitle && currentContent.length > 0) {
      if (!categories[currentCategory]) categories[currentCategory] = [];
      categories[currentCategory].push({
        title: currentTitle,
        content: currentContent.join('\n').trim(),
        category: currentCategory
      });
    }

    return categories;
  };

  const templates = parseTemplates(rawText);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = () => {
    savePageContent({
      id: 'outreach-templates',
      text: rawText,
      files: pageContent['outreach-templates']?.files || []
    });
    setMode('view');
  };

  if (mode === 'edit') {
    return (
      <div className="h-full flex flex-col animate-in fade-in duration-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Edit Templates</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setMode('view')}
              className="px-4 py-2 rounded border border-zinc-700 text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 rounded bg-nb-pink text-white font-bold flex items-center gap-2"
            >
              <Save size={16} /> Save Changes
            </button>
          </div>
        </div>
        <div className="flex-1 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <textarea 
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full h-full bg-transparent p-6 text-zinc-300 font-mono text-sm resize-none focus:outline-none"
            placeholder="# Use Markdown to format..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Message Templates</h2>
          <p className="text-zinc-500 text-sm">Click any card to copy the script.</p>
        </div>
        <button 
          onClick={() => setMode('edit')}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-900 text-nb-teal border border-nb-teal/30 hover:bg-nb-teal/10 transition-colors text-sm font-bold"
        >
          <Edit3 size={14} /> EDIT TEMPLATES
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-8">
        {Object.entries(templates).map(([category, cards]) => (
          <div key={category}>
            <h3 className="text-nb-pink font-bold uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-nb-pink"></span>
              {category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {cards.map((card, idx) => {
                const id = `${category}-${idx}`;
                return (
                  <div 
                    key={id} 
                    onClick={() => handleCopy(card.content, id)}
                    className="group relative bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl hover:border-nb-teal/50 hover:bg-zinc-900 transition-all cursor-pointer flex flex-col shadow-sm"
                  >
                    <div className="absolute top-4 right-4 text-zinc-500 group-hover:text-white transition-colors">
                      {copiedId === id ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                    </div>
                    
                    <h4 className="font-bold text-white mb-3 pr-8">{card.title}</h4>
                    
                    <div className="bg-black/50 rounded p-3 border border-zinc-800/50 flex-1">
                      <p className="text-zinc-400 text-xs font-mono whitespace-pre-wrap line-clamp-6 group-hover:text-zinc-300 transition-colors">
                        {card.content}
                      </p>
                    </div>
                    
                    <div className="mt-3 text-[10px] text-nb-teal font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wide">
                      {copiedId === id ? 'COPIED TO CLIPBOARD!' : 'CLICK TO COPY'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
