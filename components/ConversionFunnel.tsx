
import React from 'react';
import { useData } from '../DataContext';
import { Trophy, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';

export const ConversionFunnel: React.FC = () => {
  const { prospects } = useData();

  // -- CALCULATE REAL METRICS --
  
  // 1. Sent: Total Leads in DB
  const sent = prospects.length; 
  
  // 2. Replies: Status is NOT 'New' or 'Contacted' (implies interaction happened) OR explicit 'Responded' status
  // Filter: Status is Responded, Call Booked, Proposal, Won, Lost (assuming Lost implies they replied No)
  const replies = prospects.filter(p => 
    ['Responded', 'Call Booked', 'Proposal', 'Won', 'Lost'].includes(p.status)
  ).length;

  // 3. Calls: Status is Call Booked, Proposal, Won
  const calls = prospects.filter(p => 
    ['Call Booked', 'Proposal', 'Won'].includes(p.status)
  ).length;

  // 4. Proposals: Status is Proposal, Won
  const proposals = prospects.filter(p => 
    ['Proposal', 'Won'].includes(p.status)
  ).length;

  // 5. Won: Status is Won
  const won = prospects.filter(p => p.status === 'Won').length;

  // Goals
  const goals = {
    sent: 900,
    replies: 180,
    calls: 40,
    proposals: 10,
    won: 4
  };

  const funnelData = [
    { name: 'Messages Sent', value: sent, goal: goals.sent, color: '#333333' },
    { name: 'Replies', value: replies, goal: goals.replies, color: '#d946ef' }, // Pink
    { name: 'Calls Booked', value: calls, goal: goals.calls, color: '#00FFFF' }, // Teal
    { name: 'Proposals', value: proposals, goal: goals.proposals, color: '#bef264' }, // Lime
    { name: 'Clients Won', value: won, goal: goals.won, color: '#ffffff' },
  ];

  // Rates
  const responseRate = sent > 0 ? (replies / sent) * 100 : 0;
  const bookingRate = replies > 0 ? (calls / replies) * 100 : 0;
  const closeRate = proposals > 0 ? (won / proposals) * 100 : 0;

  // Bottleneck Logic
  let bottleneck = "None";
  let bottleneckMsg = "Keep filling the funnel to get more data.";
  let actionMsg = "Send more messages.";

  if (sent > 20 && responseRate < 10) {
    bottleneck = "Response Rate";
    bottleneckMsg = `Your response rate is ${responseRate.toFixed(1)}% (Target: 20%). People aren't replying.`;
    actionMsg = "Review your 'Message 1'. Is it too pitchy? Make it about THEM, not you.";
  } else if (replies > 5 && bookingRate < 15) {
    bottleneck = "Booking Rate";
    bottleneckMsg = `Your booking rate is ${bookingRate.toFixed(1)}% (Target: 20%). You're getting replies but no calls.`;
    actionMsg = "Check your conversation flow. Are you asking for the call too early? Build more value first.";
  } else if (proposals > 2 && closeRate < 25) {
    bottleneck = "Closing Rate";
    bottleneckMsg = `Your close rate is ${closeRate.toFixed(1)}% (Target: 40%). Proposals aren't converting.`;
    actionMsg = "Your offer might be confusing or price/value is off. Practice your objection handling.";
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">90-Day Sprint Tracker</h2>
          <p className="text-zinc-500 text-sm">Real-time conversion metrics from your database</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg flex items-center gap-3">
            <Trophy size={18} className="text-yellow-500" />
            <div>
                <div className="text-xs text-zinc-500 uppercase font-bold">Goal MRR</div>
                <div className="text-white font-mono font-bold">$12,000</div>
            </div>
        </div>
      </div>

      {/* Funnel Visual */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {funnelData.map((stage, idx) => (
            <div key={stage.name} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl relative overflow-hidden flex flex-col justify-between h-40 group">
                 <div className="absolute bottom-0 left-0 w-full bg-zinc-800/50 h-1">
                    <div 
                      className="h-full transition-all duration-1000" 
                      style={{ 
                        width: `${Math.min((stage.value / stage.goal) * 100, 100)}%`, 
                        backgroundColor: stage.color 
                      }}
                    ></div>
                 </div>
                 
                 <div>
                    <h3 className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">{stage.name}</h3>
                    <div className="text-3xl font-black text-white" style={{ color: idx > 0 ? stage.color : 'white' }}>{stage.value}</div>
                 </div>

                 <div className="text-xs text-zinc-400 flex justify-between items-end">
                    <span>Target: {stage.goal}</span>
                    <span className="font-mono">{Math.round((stage.value/stage.goal)*100)}%</span>
                 </div>
            </div>
        ))}
      </div>

      {/* Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-nb-teal" /> Performance Rates
            </h3>
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-400">Response Rate (Target: 20%)</span>
                        <span className={`font-mono font-bold ${responseRate < 10 ? 'text-red-500' : 'text-nb-pink'}`}>
                          {responseRate.toFixed(1)}%
                        </span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full">
                        <div className={`h-2 rounded-full ${responseRate < 10 ? 'bg-red-500' : 'bg-nb-pink'}`} style={{ width: `${Math.min(responseRate * 5, 100)}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-400">Booking Rate (Target: 20%)</span>
                        <span className={`font-mono font-bold ${bookingRate < 15 ? 'text-red-500' : 'text-nb-teal'}`}>
                          {bookingRate.toFixed(1)}%
                        </span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full">
                        <div className={`h-2 rounded-full ${bookingRate < 15 ? 'bg-red-500' : 'bg-nb-teal'}`} style={{ width: `${Math.min(bookingRate * 5, 100)}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-400">Close Rate (Target: 40%)</span>
                        <span className={`font-mono font-bold ${closeRate < 25 ? 'text-red-500' : 'text-nb-lime'}`}>
                          {closeRate.toFixed(1)}%
                        </span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full">
                        <div className={`h-2 rounded-full ${closeRate < 25 ? 'bg-red-500' : 'bg-nb-lime'}`} style={{ width: `${Math.min(closeRate * 2.5, 100)}%` }}></div>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl flex items-start gap-4">
            {bottleneck === "None" ? (
              <Trophy className="text-yellow-500 shrink-0" size={24} />
            ) : (
              <AlertTriangle className="text-red-500 shrink-0" size={24} />
            )}
            <div>
                <h3 className="text-white font-bold mb-2">
                  {bottleneck === "None" ? "All Systems Go" : "Bottleneck Detected"}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                  {bottleneckMsg}
                </p>
                {bottleneck !== "None" && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                    <p className="text-xs text-red-200 font-bold flex items-center gap-2">
                      <ArrowRight size={12} /> {actionMsg}
                    </p>
                  </div>
                )}
                {bottleneck === "None" && sent > 0 && (
                  <p className="text-xs text-green-400 font-bold mt-2">
                    Great job! Keep increasing your outreach volume.
                  </p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
