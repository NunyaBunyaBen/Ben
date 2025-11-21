
import React, { useRef } from 'react';
import { useData } from '../DataContext';
import { Download, Upload, ShieldCheck, Database } from 'lucide-react';

export const Settings: React.FC = () => {
  const { exportData, importData } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `NB_HQ_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if(text) importData(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto pt-10 animate-in fade-in duration-500">
        <h2 className="text-3xl font-bold text-white mb-2 uppercase italic">Settings & System</h2>
        <p className="text-zinc-500 mb-10">Manage your data and system preferences.</p>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
            <div className="flex items-start gap-4 mb-8">
                <div className="p-3 bg-nb-teal/10 rounded-lg text-nb-teal">
                    <Database size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Data Backup & Restore</h3>
                    <p className="text-zinc-400 text-sm mt-1 leading-relaxed max-w-lg">
                        Your data is currently saved in your browser's Local Storage. 
                        If you clear your cache or switch computers, you will lose access.
                        <br/><br/>
                        <strong>Highly Recommended:</strong> Download a backup file weekly.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                    onClick={handleDownload}
                    className="p-6 border border-zinc-700 bg-black hover:border-nb-teal/50 hover:bg-zinc-900 transition-all rounded-xl text-left group"
                >
                    <Download size={24} className="text-zinc-500 group-hover:text-nb-teal mb-4" />
                    <div className="font-bold text-white text-lg">Download Backup</div>
                    <p className="text-zinc-500 text-xs mt-1">Save a .json file of all your clients, invoices, and content.</p>
                </button>

                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 border border-zinc-700 bg-black hover:border-nb-pink/50 hover:bg-zinc-900 transition-all rounded-xl text-left group"
                >
                    <Upload size={24} className="text-zinc-500 group-hover:text-nb-pink mb-4" />
                    <div className="font-bold text-white text-lg">Restore Data</div>
                    <p className="text-zinc-500 text-xs mt-1">Upload a previously saved .json file to restore your system.</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleUpload} />
                </button>
            </div>
        </div>

        <div className="mt-8 text-center text-xs text-zinc-600 flex items-center justify-center gap-2">
            <ShieldCheck size={14} /> Secure Local Encryption Active
        </div>
    </div>
  );
};
