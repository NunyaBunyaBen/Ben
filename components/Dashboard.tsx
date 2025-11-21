
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, AlertCircle, Calendar, DollarSign, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useData } from '../DataContext';

export const Dashboard: React.FC = () => {
  const { clients, kanbanItems, prospects, calendarEvents, transactions } = useData();

  // -- 1. REAL FINANCIAL METRICS --
  const activeClients = clients.filter(c => c.status === 'Active');
  const mrr = activeClients.reduce((acc, curr) => acc + curr.revenue, 0);
  
  // Pipeline value: Hot/Warm leads * Package Price ($2997)
  const pipelineValue = prospects
    .filter(p => ['Hot', 'Warm'].includes(p.interest) || ['Proposal', 'Call Booked'].includes(p.status))
    .length * 2997; 

  const pendingShoots = kanbanItems.filter(k => k.status === 'shooting').length;

  // -- 2. REAL CHART DATA --
  // Get last 7 days
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const last7Days = getLast7Days();
  
  const revenueData = last7Days.map(date => {
      // Find income transactions for this date
      const daysIncome = transactions
        .filter(t => t.type === 'Income' && t.date === date)
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
          name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          value: daysIncome,
          fullDate: date
      };
  });
  
  // -- 3. INTELLIGENT TASK AGGREGATION --
  const today = new Date().toISOString().split('T')[0];

  // Source A: Calendar Events for Today
  const todayEvents = calendarEvents
    .filter(e => e.date === today)
    .map(e => ({
        id: `cal-${e.id}`,
        text: e.title,
        sub: `${e.type.toUpperCase()} • ${e.client || 'General'}`,
        priority: e.type === 'shoot' ? 'High' : 'Med',
        type: 'event',
        time: 'Today'
    }));

  // Source B: Outreach Follow-ups Due Today (or Overdue)
  const dueFollowups = prospects
    .filter(p => p.nextFollowUp && p.nextFollowUp <= today && p.status !== 'Won' && p.status !== 'Lost')
    .map(p => ({
        id: `prospect-${p.id}`,
        text: `Follow up: ${p.contactName}`,
        sub: `${p.company} • ${p.interest} Lead`,
        priority: 'High',
        type: 'outreach',
        time: p.nextFollowUp < today ? 'Overdue' : 'Due Today'
    }));

  // Source C: Kanban Items that are 'Urgent' or in 'Review'
  const urgentTasks = kanbanItems
    .filter(k => k.tag?.toLowerCase() === 'urgent' || k.status === 'review')
    .map(k => ({
        id: `kanban-${k.id}`,
        text: k.status === 'review' ? `Review Content: ${k.title}` : `${k.title}`,
        sub: `${k.client} • ${k.status.toUpperCase()}`,
        priority: k.tag === 'Urgent' ? 'High' : 'Med',
        type: 'production',
        time: 'Action Req'
    }));

  // Combine and Sort
  const allTasks = [...todayEvents, ...dueFollowups, ...urgentTasks];
  
  // Sorting Logic: High Priority first, then by type
  allTasks.sort((a, b) => {
      if (a.priority === 'High' && b.priority !== 'High') return -1;
      if (a.priority !== 'High' && b.priority === 'High') return 1;
      return 0;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-4">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase">Nunya Bunya HQ</h2>
          <p className="text-zinc-400">Mission Control. Systems Online.</p>
        </div>
        <div className="text-right bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
          <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Confirmed MRR</div>
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-nb-pink to-nb-teal font-mono">
            ${mrr.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-nb-pink/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Active Clients</p>
              <h3 className="text-2xl font-bold text-white mt-1">{activeClients.length}</h3>
            </div>
            <div className="p-2 bg-zinc-800 rounded-lg text-nb-pink shadow-[0_0_10px_rgba(255,0,255,0.2)]">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-zinc-400 flex items-center gap-1">
            <span className="text-green-400 font-bold">Live</span>
            <span>database records</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl relative overflow-hidden group">
           <div className="absolute inset-0 bg-nb-teal/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Production Queue</p>
              <h3 className="text-2xl font-bold text-white mt-1">{pendingShoots} <span className="text-sm text-zinc-500 font-normal">shoots</span></h3>
            </div>
            <div className="p-2 bg-zinc-800 rounded-lg text-nb-teal shadow-[0_0_10px_rgba(0,255,255,0.2)]">
              <Calendar size={20} />
            </div>
          </div>
           <div className="mt-4 text-xs text-zinc-400 flex items-center gap-1">
            <span>{kanbanItems.length} total items</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl relative overflow-hidden group">
           <div className="absolute inset-0 bg-nb-lime/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Pipeline Potential</p>
              <h3 className="text-2xl font-bold text-white mt-1">${(pipelineValue/1000).toFixed(1)}k</h3>
            </div>
            <div className="p-2 bg-zinc-800 rounded-lg text-nb-lime shadow-[0_0_10px_rgba(204,255,0,0.2)]">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-zinc-400 flex items-center gap-1">
            <span>Weighted probability</span>
          </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[500px]">
        
        {/* Left: Revenue Chart */}
        <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl flex flex-col">
          <h3 className="text-sm font-bold text-zinc-300 mb-6 uppercase flex items-center gap-2">
            <TrendingUp size={16} className="text-nb-pink" /> Real Revenue (Last 7 Days)
          </h3>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF00FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF00FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#333" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#333" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050505', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#FF00FF' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Income']}
                  labelFormatter={(label) => `${label}`}
                />
                <Area type="monotone" dataKey="value" stroke="#FF00FF" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {transactions.length === 0 && (
              <p className="text-center text-xs text-zinc-600 mt-2">No income recorded yet. Go to Finance to add transactions.</p>
          )}
        </div>

        {/* Right: Intelligent Task Feed */}
        <div className="bg-zinc-900/30 border border-zinc-800 p-0 rounded-xl flex flex-col overflow-hidden">
          <div className="p-5 border-b border-zinc-800 bg-zinc-900/50">
            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <AlertCircle size={16} className="text-nb-teal" /> Today's Missions
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1">aggregated from calendar, sales & production</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {allTasks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 py-10">
                    <CheckCircle2 size={40} className="mb-3 opacity-20 text-nb-lime" />
                    <p className="text-sm font-bold">All Systems Clear</p>
                    <p className="text-xs">No urgent tasks for today.</p>
                </div>
            ) : (
                allTasks.map((task) => (
                <div 
                    key={task.id} 
                    className="flex items-start gap-3 p-3 bg-black border border-zinc-800 rounded-lg hover:border-nb-teal/50 transition-all group cursor-pointer"
                >
                    {/* Status Indicator */}
                    <div className="mt-1">
                        <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-nb-pink animate-pulse' : 'bg-nb-teal'}`}></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <p className="text-sm text-zinc-200 font-bold truncate">{task.text}</p>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${task.time === 'Overdue' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                {task.time}
                            </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide mt-0.5">
                           {task.sub}
                        </p>
                    </div>

                    <ArrowRight size={14} className="text-zinc-700 group-hover:text-white mt-1" />
                </div>
                ))
            )}
          </div>
          
          {allTasks.length > 0 && (
            <div className="p-3 bg-zinc-900/50 border-t border-zinc-800 text-center">
                <p className="text-[10px] text-zinc-500">
                    You have <span className="text-white font-bold">{allTasks.length}</span> missions remaining.
                </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
