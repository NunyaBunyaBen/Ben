
import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';
import { useData } from '../DataContext';
import { INITIAL_OUTREACH_EVENTS } from '../constants';
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Filter } from 'lucide-react';

interface CalendarViewProps {
  events?: CalendarEvent[]; // Optional: if passed, overrides context
  title?: string;
  initialClientFilter?: string; // Optional: pre-filter by client name
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  events: propEvents,
  title = "Schedule",
  initialClientFilter
}) => {
  const { calendarEvents, addCalendarEvent, deleteCalendarEvent, clients } = useData();
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>(initialClientFilter || 'All');
  
  // Update filter if initialClientFilter changes (e.g., when navigating from client portal)
  useEffect(() => {
    if (initialClientFilter) {
      setSelectedClientFilter(initialClientFilter);
    }
  }, [initialClientFilter]);
  
  // Combine context events with prop events if present (Outreach usually passes props)
  let effectiveEvents = propEvents ? [...calendarEvents, ...propEvents] : calendarEvents;

  // Apply Client Filter
  if (selectedClientFilter !== 'All') {
      effectiveEvents = effectiveEvents.filter(e => e.client === selectedClientFilter);
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // New Event Form
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    type: 'shoot',
    client: ''
  });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

  const handleSaveEvent = () => {
    if (!newEvent.title || !newEvent.date) return;
    addCalendarEvent(newEvent as Omit<CalendarEvent, 'id'>);
    setIsModalOpen(false);
    setNewEvent({
        title: '',
        date: new Date().toISOString().split('T')[0],
        type: 'shoot',
        client: ''
    });
  };

  const changeMonth = (delta: number) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;
    if (newMonth > 11) {
        newMonth = 0;
        newYear++;
    } else if (newMonth < 0) {
        newMonth = 11;
        newYear--;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">{title}</h2>
          <p className="text-zinc-500 text-sm">{monthName} {currentYear}</p>
        </div>
        <div className="flex gap-3">
           {/* Client Filter */}
           {!propEvents && ( // Only show filter on main calendar, not outreach calendar
               <div className="relative">
                   <select 
                       value={selectedClientFilter}
                       onChange={(e) => setSelectedClientFilter(e.target.value)}
                       className="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-md pl-3 pr-8 py-2 text-sm font-bold focus:outline-none focus:border-nb-pink cursor-pointer"
                   >
                       <option value="All">All Clients</option>
                       {clients.filter(c => c.status === 'Active' || c.status === 'Onboarding').map(c => (
                           <option key={c.id} value={c.name}>{c.name}</option>
                       ))}
                   </select>
                   <Filter size={14} className="absolute right-3 top-3 text-zinc-500 pointer-events-none" />
               </div>
           )}

           <div className="flex bg-zinc-900 rounded-md border border-zinc-800">
             <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-zinc-800 text-zinc-400"><ChevronLeft size={20}/></button>
             <button onClick={() => changeMonth(1)} className="p-2 hover:bg-zinc-800 text-zinc-400 border-l border-zinc-800"><ChevronRight size={20}/></button>
           </div>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-nb-pink text-white font-bold px-4 py-2 rounded-md hover:bg-pink-600 transition-colors shadow-[0_0_15px_rgba(255,0,255,0.3)] flex items-center gap-2"
           >
             <Plus size={18} /> EVENT
           </button>
        </div>
      </div>

      <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
        {/* Weekday Header */}
        <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900/80">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-zinc-800 divide-y">
          {/* Empty cells for padding */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
             <div key={`empty-${i}`} className="bg-zinc-900/50"></div>
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
             const day = i + 1;
             const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
             const dayEvents = effectiveEvents.filter(e => e.date === dayStr);
             const isToday = dayStr === new Date().toISOString().split('T')[0];

             return (
               <div key={day} className={`min-h-[100px] p-2 relative hover:bg-zinc-900/50 transition-colors ${isToday ? 'bg-zinc-900/80' : ''}`}>
                 <span className={`text-sm font-mono ${isToday ? 'bg-nb-pink text-white w-6 h-6 flex items-center justify-center rounded-full shadow-lg' : 'text-zinc-500'}`}>
                   {day}
                 </span>
                 
                 <div className="mt-2 space-y-1 overflow-y-auto max-h-[120px]">
                   {dayEvents.map(event => (
                     <div key={event.id} className={`
                       text-[10px] p-1.5 rounded border border-l-2 truncate font-medium cursor-pointer hover:opacity-80 group relative
                       ${event.type === 'shoot' ? 'bg-purple-500/10 border-purple-500/20 border-l-purple-500 text-purple-300' : ''}
                       ${event.type === 'post' ? 'bg-teal-500/10 border-teal-500/20 border-l-nb-teal text-teal-300' : ''}
                       ${event.type === 'meeting' ? 'bg-blue-500/10 border-blue-500/20 border-l-blue-500 text-blue-300' : ''}
                       ${event.type === 'outreach' ? 'bg-orange-500/10 border-orange-500/20 border-l-orange-500 text-orange-300' : ''}
                       ${event.type === 'followup' ? 'bg-yellow-500/10 border-yellow-500/20 border-l-yellow-500 text-yellow-300' : ''}
                     `}>
                        <div className="flex justify-between items-center">
                            <span>
                                {event.type === 'shoot' && '📸 '}
                                {event.type === 'followup' && '👋 '}
                                {event.title}
                            </span>
                            {!propEvents && ( // Only allow deleting real events
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if(window.confirm('Delete this event?')) deleteCalendarEvent(event.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500"
                                >
                                    <Trash2 size={10} />
                                </button>
                            )}
                        </div>
                     </div>
                   ))}
                 </div>
               </div>
             );
          })}
        </div>
      </div>

      {/* Add Event Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Add Calendar Event</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Event Title</label>
                        <input 
                            type="text" 
                            className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-pink outline-none"
                            value={newEvent.title}
                            onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                            placeholder="e.g. Shoot @ Neon Burger"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Date</label>
                            <input 
                                type="date" 
                                className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-pink outline-none"
                                value={newEvent.date}
                                onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Type</label>
                            <select 
                                className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-pink outline-none"
                                value={newEvent.type}
                                onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}
                            >
                                <option value="shoot">📸 Photoshoot</option>
                                <option value="post">📝 Content Post</option>
                                <option value="meeting">👥 Meeting</option>
                                <option value="outreach">📞 Outreach</option>
                                <option value="followup">👋 Follow-up</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Client (Optional)</label>
                        <input 
                            type="text" 
                            list="client-list"
                            className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-pink outline-none"
                            value={newEvent.client}
                            onChange={e => setNewEvent({...newEvent, client: e.target.value})}
                            placeholder="Type to search clients..."
                        />
                        <datalist id="client-list">
                            {clients.map(c => <option key={c.id} value={c.name} />)}
                        </datalist>
                    </div>
                </div>

                <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 rounded text-zinc-400 hover:text-white font-bold text-sm"
                    >
                        CANCEL
                    </button>
                    <button 
                        onClick={handleSaveEvent}
                        className="px-6 py-2 bg-nb-pink text-white font-bold rounded shadow-[0_0_10px_rgba(255,0,255,0.2)] hover:shadow-[0_0_20px_rgba(255,0,255,0.4)] transition-all flex items-center gap-2"
                    >
                        <Plus size={16} /> SAVE EVENT
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
