
import React from 'react';
import { UploadedFile } from '../types';
import { X, Download, Trash2, ExternalLink, FileText, AlertCircle } from 'lucide-react';

interface FilePreviewModalProps {
  file: UploadedFile | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose, onDelete }) => {
  if (!file) return null;

  const handleDownload = () => {
    if (file.linkUrl) {
      window.open(file.linkUrl, '_blank');
    } else if (file.data) {
      const link = document.createElement('a');
      link.href = file.data;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      onDelete(file.id);
      onClose();
    }
  };

  const renderContent = () => {
    if (file.linkUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <ExternalLink size={48} className="text-blue-400 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">External Link</h3>
          <p className="text-zinc-400 mb-6 max-w-md break-all">{file.linkUrl}</p>
          <button 
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold transition-colors flex items-center gap-2"
          >
            Open Link <ExternalLink size={16} />
          </button>
        </div>
      );
    }

    if (!file.data) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle size={48} className="text-yellow-500 mb-4" />
          <p className="text-zinc-400">File content not available for preview.</p>
        </div>
      );
    }

    if (file.type.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center bg-black/50 rounded-lg p-4 h-full overflow-hidden">
           <img src={file.data} alt={file.name} className="max-w-full max-h-[60vh] object-contain shadow-2xl rounded" />
        </div>
      );
    }

    if (file.type === 'application/pdf') {
      return (
        <div className="h-[65vh] bg-white rounded-lg overflow-hidden">
           <iframe src={file.data} className="w-full h-full" title="PDF Preview"></iframe>
        </div>
      );
    }

    if (file.type.startsWith('video/')) {
       return (
        <div className="flex items-center justify-center bg-black rounded-lg h-full">
           <video controls src={file.data} className="max-w-full max-h-[60vh] rounded" />
        </div>
       );
    }

    // Fallback for other files
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <FileText size={64} className="text-zinc-600 mb-4" />
        <p className="text-zinc-400 mb-4">Preview not supported for this file type.</p>
        <button 
            onClick={handleDownload}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-full font-bold transition-colors flex items-center gap-2 border border-zinc-700"
        >
           <Download size={16} /> Download File
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-5xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 rounded-t-xl">
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="p-2 bg-zinc-800 rounded text-zinc-400">
                <FileText size={20} />
             </div>
             <div>
                <h3 className="font-bold text-white truncate max-w-md">{file.name}</h3>
                <p className="text-xs text-zinc-500">
                    {(file.size / 1024).toFixed(1)} KB • {new Date(file.uploadDate).toLocaleDateString()}
                </p>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <button 
               onClick={handleDownload}
               className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-nb-teal rounded transition-colors"
               title="Download"
             >
                <Download size={20} />
             </button>
             <button 
               onClick={handleDelete}
               className="p-2 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded transition-colors"
               title="Delete"
             >
                <Trash2 size={20} />
             </button>
             <div className="w-px h-6 bg-zinc-800 mx-2"></div>
             <button 
               onClick={onClose}
               className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
             >
                <X size={24} />
             </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/50">
           {renderContent()}
        </div>

      </div>
    </div>
  );
};
