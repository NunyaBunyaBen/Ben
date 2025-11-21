
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../DataContext';
import { PageContent, UploadedFile } from '../types';
import { FileText, Plus, X, Save, Upload, Edit3, Trash2, Paperclip, Download, FileImage, Link } from 'lucide-react';
import { FilePreviewModal } from './FilePreviewModal';

interface ResourceGridProps {
  pageId: string;
  title: string;
}

interface CardData {
  id: string; // Generated slug from title
  title: string;
  content: string;
}

export const ResourceGrid: React.FC<ResourceGridProps> = ({ pageId, title }) => {
  const { pageContent, savePageContentImmediate } = useData();
  const [rawText, setRawText] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  
  const [cards, setCards] = useState<CardData[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state for modal
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview State
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  useEffect(() => {
    const content = pageContent[pageId];
    if (content) {
      setRawText(content.text);
      setFiles(content.files || []);
      parseContentToCards(content.text);
    } else {
      setRawText('');
      setFiles([]);
      setCards([]);
    }
  }, [pageId, pageContent]);

  const parseContentToCards = (text: string) => {
    const lines = text.split('\n');
    const parsedCards: CardData[] = [];
    
    let currentTitle = '';
    let currentBody: string[] = [];
    
    const saveCurrent = () => {
        if (currentTitle) {
            parsedCards.push({
                id: currentTitle.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                title: currentTitle,
                content: currentBody.join('\n').trim()
            });
        }
    };

    lines.forEach(line => {
        if (line.startsWith('## ')) {
            saveCurrent();
            currentTitle = line.replace('## ', '').trim();
            currentBody = [];
        } else if (line.startsWith('### ')) {
             // Treat subheaders as separate cards for now, or keep logic simple
             saveCurrent();
             currentTitle = line.replace('### ', '').trim();
             currentBody = [];
        } else if (line.trim() === '') {
            // Skip empty leading lines
            if (currentBody.length > 0) currentBody.push(line);
        } else {
            if (currentTitle) currentBody.push(line);
        }
    });
    saveCurrent();
    
    if (parsedCards.length === 0 && text.trim().length > 0 && !text.includes('##')) {
        // Fallback if no headers
        parsedCards.push({
            id: 'general',
            title: 'General Notes',
            content: text
        });
    }

    setCards(parsedCards);
  };

  const handleCardClick = (card: CardData) => {
    setSelectedCard(card);
    setEditTitle(card.title);
    setEditContent(card.content);
    setError('');
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCard(null);
    setEditTitle('');
    setEditContent('');
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveCard = async () => {
    if (!editTitle.trim()) {
        setError('Card Title is required');
        return;
    }
    
    setIsSaving(true);

    let newCards = [...cards];
    const newId = editTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');

    if (selectedCard) {
        // Update existing
        newCards = newCards.map(c => c.id === selectedCard.id ? {
            ...c,
            title: editTitle,
            content: editContent,
        } : c);
    } else {
        // Add new
        newCards.push({
            id: newId,
            title: editTitle,
            content: editContent
        });
    }

    // Reconstruct full markdown
    const newMarkdown = newCards.map(c => `## ${c.title}\n${c.content}`).join('\n\n');
    
    // We pass the CURRENT state of files. Files are already in the `files` state array with cardIds
    // When we save the page, we just need to pass the full file list.
    await savePageContentImmediate({
        id: pageId,
        text: newMarkdown,
        files: files
    });
    
    setIsSaving(false);
    setIsModalOpen(false);
  };

  const handleDeleteCard = async () => {
    if (!selectedCard) return;
    if (!window.confirm('Delete this card and its content?')) return;

    setIsSaving(true);
    const newCards = cards.filter(c => c.id !== selectedCard.id);
    const newMarkdown = newCards.map(c => `## ${c.title}\n${c.content}`).join('\n\n');
    
    // Remove files associated with this card
    const remainingFiles = files.filter(f => f.cardId !== selectedCard.id);
    
    await savePageContentImmediate({
        id: pageId,
        text: newMarkdown,
        files: remainingFiles
    });
    
    setIsSaving(false);
    setIsModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const targetCardId = selectedCard ? selectedCard.id : editTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      const file = e.target.files[0]; // Single file for simplicity in logic, loop for multiple
      
      const reader = new FileReader();
      reader.onload = (event) => {
          const base64String = event.target?.result as string;
          const newFile: UploadedFile = {
            id: Math.random().toString(36).substring(7),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadDate: new Date().toLocaleDateString(),
            cardId: targetCardId,
            data: base64String
          };
          
          // Update local state immediately for UI
          const updatedFiles = [...files, newFile];
          setFiles(updatedFiles);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Filter files for the modal
  const currentCardId = selectedCard ? selectedCard.id : editTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const cardFiles = files.filter(f => f.cardId === currentCardId);

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      
      <FilePreviewModal 
        file={previewFile} 
        onClose={() => setPreviewFile(null)} 
        onDelete={removeFile}
      />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">{title}</h2>
          <p className="text-zinc-500 text-sm">Manage your {title.toLowerCase()} cards and assets.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-nb-teal text-black font-bold px-4 py-2 rounded-md hover:bg-cyan-300 transition-colors shadow-[0_0_15px_rgba(0,255,255,0.3)] flex items-center gap-2"
        >
          <Plus size={18} /> NEW CARD
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-10 pr-2">
        {cards.length === 0 && (
             <div className="col-span-full text-center py-20 border-2 border-dashed border-zinc-800 rounded-xl">
                 <p className="text-zinc-500 mb-4">No cards found.</p>
                 <button onClick={handleAddNew} className="text-nb-teal hover:underline">Create your first card</button>
             </div>
        )}
        {cards.map(card => {
            const attachmentCount = files.filter(f => f.cardId === card.id).length;
            return (
                <div 
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    className="bg-zinc-900/50 border border-zinc-800 hover:border-nb-pink/50 rounded-xl p-6 cursor-pointer group transition-all flex flex-col h-64 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-1 h-full bg-zinc-800 group-hover:bg-nb-pink transition-colors"></div>
                    
                    <div className="flex justify-between items-start mb-4 pl-2">
                        <h3 className="font-bold text-lg text-white group-hover:text-nb-pink transition-colors line-clamp-1">{card.title}</h3>
                        <Edit3 size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
                    </div>
                    
                    <div className="flex-1 pl-2 overflow-hidden relative">
                        <p className="text-zinc-400 text-sm whitespace-pre-wrap line-clamp-6 font-mono">
                            {card.content || <span className="italic text-zinc-600">No content...</span>}
                        </p>
                        <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-zinc-900 to-transparent"></div>
                    </div>

                    <div className="mt-4 pl-2 pt-3 border-t border-zinc-800/50 flex items-center gap-4 text-xs text-zinc-500">
                        <div className={`flex items-center gap-1 ${attachmentCount > 0 ? 'text-nb-teal font-bold' : ''}`}>
                            <Paperclip size={12} />
                            {attachmentCount} Attachment{attachmentCount !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col h-[90vh] animate-in zoom-in-95 duration-200">
                
                {/* Modal Header */}
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                    <div className="flex-1 mr-4">
                        <input 
                            type="text" 
                            value={editTitle}
                            onChange={(e) => { setEditTitle(e.target.value); setError(''); }}
                            placeholder="Card Title"
                            className={`bg-transparent text-2xl font-bold text-white focus:outline-none placeholder-zinc-700 w-full border-b ${error ? 'border-red-500' : 'border-transparent'}`}
                        />
                        {error && <p className="text-xs text-red-500 mt-1 font-bold">{error}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedCard && (
                            <button onClick={handleDeleteCard} className="p-2 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 rounded transition-colors">
                                <Trash2 size={20} />
                            </button>
                        )}
                        <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Editor */}
                    <div className="flex-1 flex flex-col border-r border-zinc-800">
                        <textarea 
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="flex-1 bg-transparent p-6 text-zinc-300 font-mono text-sm resize-none focus:outline-none leading-relaxed"
                            placeholder="// Enter content here..."
                        />
                    </div>

                    {/* Attachments Sidebar */}
                    <div className="w-80 bg-black/20 flex flex-col">
                        <div className="p-4 border-b border-zinc-800">
                             <h4 className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                                 <Paperclip size={12} /> Attachments
                             </h4>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {cardFiles.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-xs text-zinc-600">No files attached to this card.</p>
                                </div>
                            ) : (
                                cardFiles.map(file => (
                                    <div 
                                        key={file.id} 
                                        onClick={() => setPreviewFile(file)}
                                        className="bg-zinc-900 border border-zinc-800 rounded p-3 flex justify-between items-center group hover:border-nb-pink/50 cursor-pointer transition-colors"
                                    >
                                        <div className="overflow-hidden flex items-center gap-2">
                                            {file.type.includes('image') ? <FileImage size={14} className="text-nb-pink shrink-0"/> : <FileText size={14} className="text-zinc-400 shrink-0"/>}
                                            <div>
                                                <div className="text-xs text-zinc-300 truncate font-bold max-w-[140px]">{file.name}</div>
                                                <div className="text-[10px] text-zinc-600">{(file.size/1024).toFixed(0)}KB</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                                            className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 border-t border-zinc-800">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-2 border border-dashed border-zinc-700 text-zinc-500 hover:text-nb-teal hover:border-nb-teal/50 rounded transition-colors text-xs font-bold flex items-center justify-center gap-2"
                            >
                                <Upload size={14} /> UPLOAD FILE
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                multiple 
                                onChange={handleFileUpload}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900 rounded-b-xl">
                    <button 
                        onClick={() => setIsModalOpen(false)} 
                        className="px-4 py-2 rounded text-zinc-400 hover:text-white font-bold text-sm"
                    >
                        CANCEL
                    </button>
                    <button 
                        onClick={handleSaveCard}
                        disabled={isSaving}
                        className="px-6 py-2 bg-nb-pink text-white font-bold rounded shadow-[0_0_15px_rgba(255,0,255,0.3)] hover:shadow-[0_0_25px_rgba(255,0,255,0.5)] transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? 'SAVING...' : <><Save size={16} /> SAVE CARD</>}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
