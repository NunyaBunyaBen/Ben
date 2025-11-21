
import React, { useState, useRef, useEffect } from 'react';
import { PageContent, UploadedFile } from '../types';
import { Save, Upload, FileText, Trash2, Check, FileImage } from 'lucide-react';
import { FilePreviewModal } from './FilePreviewModal';

interface ContentEditorProps {
  pageId: string;
  initialContent?: PageContent;
  onSave: (content: PageContent) => void;
  title: string;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({ pageId, initialContent, onSave, title }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Preview State
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  useEffect(() => {
    if (initialContent) {
      setText(initialContent.text);
      setFiles(initialContent.files);
    } else {
      setText('');
      setFiles([]);
    }
  }, [pageId, initialContent]);

  const handleSave = () => {
    setIsSaving(true);
    onSave({
      id: pageId,
      text,
      files
    });
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      const reader = new FileReader();
      reader.onload = (event) => {
          const base64String = event.target?.result as string;
          
          const newFile: UploadedFile = {
            id: Math.random().toString(36).substring(7),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadDate: new Date().toLocaleDateString(),
            data: base64String
          };
          setFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      
      <FilePreviewModal 
        file={previewFile} 
        onClose={() => setPreviewFile(null)} 
        onDelete={removeFile}
      />

      {/* Header Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
           <h2 className="text-2xl font-bold text-white mb-1 uppercase tracking-tight">{title}</h2>
           <p className="text-zinc-500 text-sm">Last synced: Just now</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-900 text-nb-teal border border-nb-teal/30 hover:bg-nb-teal/10 transition-colors"
          >
            <Upload size={16} />
            <span className="font-mono text-sm font-bold">UPLOAD</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            onChange={handleFileUpload}
          />
          
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 rounded-md bg-nb-pink text-white shadow-[0_0_15px_rgba(217,70,239,0.3)] hover:shadow-[0_0_25px_rgba(217,70,239,0.6)] transition-all"
          >
            {isSaving ? <Check size={16} /> : <Save size={16} />}
            <span className="font-mono text-sm font-bold">{isSaving ? 'SAVED' : 'SAVE'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        
        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="bg-zinc-900/80 border-b border-zinc-800 p-3 flex gap-2">
             <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
             <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
             <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 w-full bg-transparent p-6 text-zinc-300 focus:outline-none resize-none font-mono leading-relaxed"
            placeholder="// Enter your SOPs, strategies, or notes here..."
          />
        </div>

        {/* Files Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex-1 overflow-y-auto">
            <h3 className="text-xs font-bold text-zinc-500 uppercase mb-4 flex items-center gap-2">
              <FileText size={14} /> Attached Assets
            </h3>
            
            {files.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-zinc-800 rounded-lg">
                <p className="text-zinc-600 text-sm">No files attached</p>
              </div>
            ) : (
              <div className="space-y-3">
                {files.map(file => (
                  <div 
                    key={file.id} 
                    onClick={() => setPreviewFile(file)}
                    className="group relative bg-black border border-zinc-800 p-3 rounded-lg hover:border-nb-teal/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-400">
                           {file.type.includes('image') ? <FileImage size={16} /> : <FileText size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-200 truncate font-medium group-hover:text-white">{file.name}</p>
                          <p className="text-xs text-zinc-600">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                        className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
