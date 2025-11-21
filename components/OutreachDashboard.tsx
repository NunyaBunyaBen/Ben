
import React from 'react';
import { useData } from '../DataContext';
import { Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageType } from '../types';

interface OutreachDashboardProps {
  onNavigate: (id: string, type: PageType) => void;
}

export const OutreachDashboard: React.FC<OutreachDashboardProps> = ({ onNavigate }) => {
  const { dailyProgress, updateDailyTask, prospects } = useData();
  
  const today = new Date().toISOString().split('T')[0];
  const currentDay = dailyProgress[today] || { 
    date: today, 
    morningTasks: new Array(10).fill(false), 
    afternoonTasks: new Array(5).fill(false) 
  };

  const morningProgress = currentDay.morningTasks.filter(Boolean).length;
  const afternoonProgress = currentDay.afternoonTasks.filter(Boolean).length;
  const totalProgress = morningProgress + afternoonProgress;
  
  // Real data for followups
  const dueFollowups = prospects.filter(p => p.nextFollowUp && p.nextFollowUp <= today && p.status !== 'Won' && p.status !== 'Lost');

  // Real stats calculation
  const totalSent = prospects.length; // Simplified logic: assumes 1 prospect = 1 message chain
  const totalReplies = prospects.filter(p => ['Responded', 'Call Booked', 'Proposal', 'Won'].includes(p.status)).length;
  const totalCalls = prospects.filter(p => ['Call Booked', 'Proposal', 'Won'].includes(p.status)).length;
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <div className="flex items-center gap-2 text-nb-pink mb-1">
             <Target size={20} />
             <span className="font-bold tracking-widest uppercase text-xs">Mission Control</span>
          </div>
          <h2 className="text-3xl font-black text-white italic uppercase">Daily Outreach HQ</h2>
          <p className="text-zinc-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-zinc-500 font-mono">DAILY GOAL</div>
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-nb-pink to-nb-teal font-mono">
            {Math.round((totalProgress / 15) * 100)}%
          </div>
        </div>
      </div>

      {/* Motivation Banner */}
      <div className="bg-gradient-to-r from-zinc-900 to-black border border-zinc-800 p-4 rounded-xl flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-nb-pink"></div>
        <div className="relative z-10">
          <h3 className="font-bold text-white text-lg">🔥 KEEP PUSHING</h3>
          <p className="text-zinc-400 text-sm">You are {900 - totalSent} messages away from freedom. 4 Clients = $12k/mo.</p>
        </div>
        <div className="hidden md:flex gap-8 text-center pr-4">
           <div>
             <div className="text-xs text-zinc-500 uppercase font-bold">Messages</div>
             <div className="text-white font-mono text-lg">{totalSent}/900</div>
           </div>
           <div>
             <div className="text-xs text-zinc-500 uppercase font-bold">Replies</div>
             <div className="text-white font-mono text-lg">{totalReplies}</div>
           </div>
           <div>
             <div className="text-xs text-zinc-500 uppercase font-bold">Calls</div>
             <div className="text-nb-teal font-mono text-lg font-bold">{totalCalls}</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Targets Panel */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-white font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-nb-teal" /> Today's Targets
          </h3>
          
          <div className="space-y-6">
            {/* Morning Block */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-zinc-500 uppercase">Morning Block (9-10am)</span>
                <span className="text-xs font-mono text-nb-pink">{morningProgress}/10</span>
              </div>
              <div className="w-full bg-zinc-800 h-1 rounded-full mb-3">
                <div className="bg-nb-pink h-1 rounded-full transition-all duration-500" style={{ width: `${(morningProgress/10)*100}%` }}></div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {currentDay.morningTasks.map((done, i) => (
                  <button 
                    key={`m-${i}`}
                    onClick={() => updateDailyTask(today, 'morning', i)}
                    className={`h-8 rounded border transition-all ${done ? 'bg-nb-pink border-nb-pink text-white' : 'bg-black border-zinc-800 hover:border-zinc-600'}`}
                  >
                    {done && <CheckCircle2 size={14} className="mx-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Afternoon Block */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-zinc-500 uppercase">Afternoon Block (3-4pm)</span>
                <span className="text-xs font-mono text-nb-teal">{afternoonProgress}/5</span>
              </div>
              <div className="w-full bg-zinc-800 h-1 rounded-full mb-3">
                <div className="bg-nb-teal h-1 rounded-full transition-all duration-500" style={{ width: `${(afternoonProgress/5)*100}%` }}></div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {currentDay.afternoonTasks.map((done, i) => (
                  <button 
                    key={`a-${i}`}
                    onClick={() => updateDailyTask(today, 'afternoon', i)}
                    className={`h-8 rounded border transition-all ${done ? 'bg-nb-teal border-nb-teal text-black' : 'bg-black border-zinc-800 hover:border-zinc-600'}`}
                  >
                    {done && <CheckCircle2 size={14} className="mx-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Follow-up Panel */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-white font-bold uppercase tracking-wider flex items-center gap-2">
                <AlertCircle size={18} className="text-orange-500" /> Follow-ups Due
            </h3>
            <span className="bg-zinc-800 text-xs px-2 py-1 rounded text-zinc-400">{dueFollowups.length} pending</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[300px]">
            {dueFollowups.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-zinc-600 py-10">
                 <CheckCircle2 size={32} className="mb-2 opacity-20" />
                 <p className="text-sm">No follow-ups due today.</p>
                 <p className="text-xs mt-1">Go find new leads!</p>
               </div>
            ) : (
              dueFollowups.map(p => (
                <div key={p.id} className="bg-black border border-zinc-800 p-3 rounded-lg flex justify-between items-center group hover:border-orange-500/50 transition-colors">
                  <div>
                    <div className="font-bold text-sm text-zinc-200">{p.contactName}</div>
                    <div className="text-xs text-zinc-500">{p.company} • {p.interest}</div>
                    <div className="text-[10px] text-orange-400 mt-1">Due: {p.nextFollowUp}</div>
                  </div>
                  <button 
                    onClick={() => onNavigate('outreach-db', PageType.PROSPECT_DB)}
                    className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:text-white rounded text-zinc-400 transition-colors"
                  >
                    Message
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Links - Now Functional */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
         <button 
            onClick={() => onNavigate('outreach-db', PageType.PROSPECT_DB)}
            className="p-4 bg-black border border-zinc-800 hover:border-nb-pink/50 rounded-lg text-left group transition-colors"
         >
            <h4 className="text-nb-pink font-bold text-sm mb-1 group-hover:text-white transition-colors">Prospect Database &rarr;</h4>
            <p className="text-xs text-zinc-500">Add today's leads here</p>
         </button>
         <button 
            onClick={() => onNavigate('outreach-templates', PageType.TEMPLATES)}
            className="p-4 bg-black border border-zinc-800 hover:border-nb-teal/50 rounded-lg text-left group transition-colors"
         >
            <h4 className="text-nb-teal font-bold text-sm mb-1 group-hover:text-white transition-colors">Message Templates &rarr;</h4>
            <p className="text-xs text-zinc-500">Copy scripts for LinkedIn/IG</p>
         </button>
         <button 
            onClick={() => onNavigate('sales-discovery', PageType.DOCUMENT)}
            className="p-4 bg-black border border-zinc-800 hover:border-nb-lime/50 rounded-lg text-left group transition-colors"
         >
            <h4 className="text-nb-lime font-bold text-sm mb-1 group-hover:text-white transition-colors">Discovery Script &rarr;</h4>
            <p className="text-xs text-zinc-500">For when they say YES</p>
         </button>
      </div>
    </div>
  );
};
