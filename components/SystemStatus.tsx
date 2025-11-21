
import React from 'react';
import { useData } from '../DataContext';
import { CheckCircle2, Loader2, AlertTriangle, HardDrive } from 'lucide-react';

export const SystemStatus: React.FC = () => {
  const { saveStatus, storageUsage } = useData();

  // IndexedDB is vast, so "Danger" is relative to massive sizes (like 1GB)
  const usageNum = parseFloat(storageUsage);
  const isWarning = usageNum > 1000; // > 1GB

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-lg p-3 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
      
      {/* Storage Meter */}
      <div className="flex items-center gap-3 border-r border-zinc-700 pr-4">
        <HardDrive size={16} className={isWarning ? 'text-yellow-500' : 'text-nb-teal'} />
        <div>
          <div className="text-[10px] text-zinc-500 uppercase font-bold">DB Storage</div>
          <div className={`text-xs font-mono font-bold text-zinc-300`}>
            {storageUsage} MB <span className="text-zinc-600 uppercase text-[10px]"> / Unlimited</span>
          </div>
        </div>
      </div>

      {/* Save Status Light */}
      <div className="flex items-center gap-2 min-w-[100px]">
        {saveStatus === 'idle' && (
             <span className="w-2 h-2 rounded-full bg-zinc-700 ml-auto mr-2"></span>
        )}
        {saveStatus === 'saving' && (
             <>
               <Loader2 size={16} className="text-yellow-500 animate-spin" />
               <span className="text-xs font-bold text-yellow-500 animate-pulse">WRITING...</span>
             </>
        )}
        {saveStatus === 'saved' && (
             <>
               <CheckCircle2 size={16} className="text-green-500" />
               <span className="text-xs font-bold text-green-500">SYNCED</span>
             </>
        )}
        {saveStatus === 'error' && (
             <>
               <AlertTriangle size={16} className="text-red-500 animate-pulse" />
               <span className="text-xs font-bold text-red-500">ERROR</span>
             </>
        )}
      </div>
    </div>
  );
};
