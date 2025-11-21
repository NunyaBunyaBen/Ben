
import React, { useState, useEffect } from 'react';
import { useData } from '../DataContext';
import { Zap, X, Plus, Trash2, CheckCircle2, Clock, Bell, BellOff, Check } from 'lucide-react';

// Defined intervals in milliseconds
const INTERVALS = [
    { id: '1w', label: '1 Week Warning', ms: 7 * 24 * 60 * 60 * 1000 },
    { id: '3d', label: '3 Days Left', ms: 3 * 24 * 60 * 60 * 1000 },
    { id: '1d', label: 'Tomorrow!', ms: 24 * 60 * 60 * 1000 },
    { id: '8h', label: '8 Hours Left', ms: 8 * 60 * 60 * 1000 },
    { id: '4h', label: '4 Hours Left', ms: 4 * 60 * 60 * 1000 },
    { id: '2h', label: '2 Hours Left', ms: 2 * 60 * 60 * 1000 },
    { id: '1h', label: '1 Hour Left', ms: 60 * 60 * 1000 },
];

export const LightningBot: React.FC = () => {
  const { reminders, addReminder, deleteReminder, completeReminder, markReminderInterval } = useData();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Active notification state
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const [activeReminderId, setActiveReminderId] = useState<string | null>(null);
  
  // Form state
  const [newReminder, setNewReminder] = useState('');
  const [newTime, setNewTime] = useState('');

  // Check for due reminders every minute
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date().getTime();
      
      // Find a reminder that hits a new interval threshold
      const alertableReminder = reminders.find(r => {
        if (r.completed) return false;
        
        const due = new Date(r.datetime).getTime();
        const timeLeft = due - now;
        
        if (timeLeft < 0) return false; // Already passed or handled

        // Check if we crossed any interval threshold that hasn't been triggered yet
        const hitInterval = INTERVALS.find(interval => {
             // logic: If time left is LESS than the interval AND we haven't triggered it yet
             return timeLeft <= interval.ms && !r.triggeredIntervals.includes(interval.id);
        });

        if (hitInterval) {
            // We found one! Trigger side effect immediately
            markReminderInterval(r.id, hitInterval.id);
            
            // Set local state to show popup
            setActiveReminderId(r.id);
            setActiveMessage(`Hey! ${hitInterval.label}: "${r.text}"`);
            return true; // Stop searching, handle one at a time
        }
        
        return false;
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [reminders, markReminderInterval]);

  const handleAdd = () => {
    if (!newReminder || !newTime) return;
    addReminder({ text: newReminder, datetime: newTime });
    setNewReminder('');
    setNewTime('');
    
    // Flash confirmation
    setActiveMessage("I'm on it! I'll remind you 7 times.");
    setTimeout(() => setActiveMessage(null), 3000);
  };

  const handleClearActive = () => {
      if (activeReminderId) {
          completeReminder(activeReminderId);
          setActiveMessage(null);
          setActiveReminderId(null);
      }
  };

  const handleSnoozeActive = () => {
      // Just close the bubble. The logic won't trigger again until the NEXT interval threshold is crossed
      // because 'markReminderInterval' was called inside the useEffect.
      setActiveMessage(null);
      setActiveReminderId(null);
  };

  return (
    <>
      {/* The Character - Fixed Bottom Left */}
      <div className="fixed bottom-6 left-6 z-[60] flex flex-col items-start pointer-events-none">
        
        {/* Speech Bubble */}
        {(activeMessage || isPanelOpen) && (
          <div className="mb-4 ml-2 bg-white text-black p-4 rounded-xl rounded-bl-none shadow-2xl max-w-xs animate-in slide-in-from-bottom-5 pointer-events-auto relative border-2 border-nb-lime flex flex-col gap-3">
            <button 
                onClick={() => setActiveMessage(null)}
                className="absolute top-1 right-1 text-zinc-400 hover:text-red-500"
            >
                <X size={14} />
            </button>
            
            <p className="font-bold text-sm pr-4 leading-snug">{activeMessage || "What can I remind you about?"}</p>

            {/* Action Buttons (Only show if it's a real alert) */}
            {activeReminderId && (
                <div className="flex gap-2 mt-1">
                    <button 
                        onClick={handleClearActive}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-1 transition-colors"
                    >
                        <Check size={14} /> I'm Ready
                    </button>
                    <button 
                        onClick={handleSnoozeActive}
                        className="flex-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 text-xs font-bold py-2 rounded flex items-center justify-center gap-1 transition-colors"
                    >
                        <BellOff size={14} /> Later
                    </button>
                </div>
            )}
          </div>
        )}

        {/* The Avatar */}
        <button 
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="pointer-events-auto group relative"
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-nb-lime blur-xl opacity-50 group-hover:opacity-100 transition-opacity animate-pulse"></div>
          
          {/* SVG Character */}
          <div className="relative w-16 h-16">
             <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg transform group-hover:-translate-y-1 transition-transform duration-300">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="#CCFF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#000" />
                <circle cx="9" cy="9" r="1.5" fill="#CCFF00" />
                <circle cx="15" cy="7" r="1.5" fill="#CCFF00" />
                <path d="M10 12C10 12 11 13 13 13" stroke="#CCFF00" strokeWidth="1.5" strokeLinecap="round" />
             </svg>
             {/* Sunglasses */}
             <div className="absolute top-5 left-3 w-10 h-3 bg-black border border-nb-lime rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-1">
                <div className="w-3 h-1 bg-nb-lime/50 rounded-full"></div>
                <div className="w-3 h-1 bg-nb-lime/50 rounded-full"></div>
             </div>
          </div>
        </button>
      </div>

      {/* Reminders Panel */}
      {isPanelOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-80 bg-zinc-900/95 backdrop-blur border border-nb-lime/50 rounded-xl shadow-2xl flex flex-col max-h-[500px] animate-in zoom-in-95 origin-bottom-left">
           <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black/50 rounded-t-xl">
              <h3 className="font-black text-nb-lime uppercase italic flex items-center gap-2">
                 <Zap size={18} /> Blitz's Memory
              </h3>
              <button onClick={() => setIsPanelOpen(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
           </div>

           <div className="p-4 space-y-3 border-b border-zinc-800">
              <input 
                 type="text" 
                 placeholder="Remind me to..." 
                 className="w-full bg-black border border-zinc-700 rounded p-2 text-white text-sm focus:border-nb-lime outline-none"
                 value={newReminder}
                 onChange={e => setNewReminder(e.target.value)}
              />
              <div className="flex gap-2">
                  <input 
                    type="datetime-local" 
                    className="flex-1 bg-black border border-zinc-700 rounded p-2 text-white text-xs focus:border-nb-lime outline-none"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                  />
                  <button 
                    onClick={handleAdd}
                    className="bg-nb-lime text-black font-bold px-3 rounded hover:bg-lime-400 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
              </div>
              <p className="text-[10px] text-zinc-500 text-center italic">
                  I'll bug you 1 week, 3 days, 1 day, 8h, 4h, 2h, and 1h before.
              </p>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {reminders.length === 0 && (
                  <div className="text-center text-zinc-500 text-xs py-4">
                     No active reminders. I'm bored.
                  </div>
              )}
              {reminders.sort((a,b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()).map(r => (
                  <div key={r.id} className={`p-2 rounded border flex justify-between items-start group ${r.completed ? 'bg-zinc-900 border-zinc-800 opacity-50' : 'bg-black border-zinc-800 hover:border-nb-lime/50'}`}>
                      <div className="flex-1">
                          <p className={`text-sm font-medium ${r.completed ? 'text-zinc-500 line-through' : 'text-white'}`}>{r.text}</p>
                          <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-1">
                             <Clock size={10} />
                             {new Date(r.datetime).toLocaleString()}
                          </div>
                          {!r.completed && (
                              <div className="flex gap-1 mt-1">
                                  {INTERVALS.map(int => (
                                      <span key={int.id} className={`w-1.5 h-1.5 rounded-full ${r.triggeredIntervals.includes(int.id) ? 'bg-nb-lime' : 'bg-zinc-800'}`}></span>
                                  ))}
                              </div>
                          )}
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => completeReminder(r.id)} className="text-nb-lime hover:text-white"><CheckCircle2 size={14} /></button>
                          <button onClick={() => deleteReminder(r.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                  </div>
              ))}
           </div>
        </div>
      )}
    </>
  );
};
