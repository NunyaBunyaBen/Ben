
import React from 'react';
import { useData } from '../DataContext';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { DollarSign, Briefcase, Users } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { clients, kanbanItems } = useData();

  // -- DATA PREP --
  const activeClients = clients.filter(c => c.status === 'Active');
  const totalRev = activeClients.reduce((acc, c) => acc + c.revenue, 0);

  // 1. Revenue by Client
  const revenueData = activeClients.map(c => ({
    name: c.name,
    value: c.revenue
  }));

  // 2. Project Status Distribution
  const statusCounts = kanbanItems.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const projectData = [
    { name: 'Scripting', value: statusCounts['scripting'] || 0 },
    { name: 'Shooting', value: statusCounts['shooting'] || 0 },
    { name: 'Editing', value: statusCounts['editing'] || 0 },
    { name: 'Review', value: statusCounts['review'] || 0 },
    { name: 'Done', value: statusCounts['done'] || 0 },
  ];

  const COLORS = ['#FF00FF', '#00FFFF', '#CCFF00', '#ffffff', '#333333'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Analytics & Reports</h2>
          <p className="text-zinc-500 text-sm">Deep dive into your agency performance.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-nb-pink/10 flex items-center justify-center text-nb-pink">
             <DollarSign size={24} />
           </div>
           <div>
             <div className="text-xs text-zinc-500 uppercase font-bold">Total Monthly Revenue</div>
             <div className="text-2xl font-mono font-bold text-white">${totalRev.toLocaleString()}</div>
           </div>
        </div>
        <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-nb-teal/10 flex items-center justify-center text-nb-teal">
             <Briefcase size={24} />
           </div>
           <div>
             <div className="text-xs text-zinc-500 uppercase font-bold">Active Projects</div>
             <div className="text-2xl font-mono font-bold text-white">{kanbanItems.filter(i => i.status !== 'done').length}</div>
           </div>
        </div>
        <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-nb-lime/10 flex items-center justify-center text-nb-lime">
             <Users size={24} />
           </div>
           <div>
             <div className="text-xs text-zinc-500 uppercase font-bold">Avg. Client Value</div>
             <div className="text-2xl font-mono font-bold text-white">
                ${activeClients.length > 0 ? Math.round(totalRev / activeClients.length).toLocaleString() : 0}
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Distribution */}
        <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl min-h-[400px] flex flex-col">
           <h3 className="text-white font-bold mb-6 uppercase">Revenue by Client</h3>
           {revenueData.length === 0 ? (
               <div className="flex-1 flex items-center justify-center text-zinc-600">No active clients yet.</div>
           ) : (
               <div className="flex-1">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={revenueData}
                         cx="50%"
                         cy="50%"
                         innerRadius={60}
                         outerRadius={100}
                         fill="#8884d8"
                         paddingAngle={5}
                         dataKey="value"
                       >
                         {revenueData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                       </Pie>
                       <Tooltip 
                          contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                          formatter={(value: number) => `$${value.toLocaleString()}`}
                       />
                       <Legend verticalAlign="bottom" height={36}/>
                     </PieChart>
                   </ResponsiveContainer>
               </div>
           )}
        </div>

        {/* Production Volume */}
        <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl min-h-[400px] flex flex-col">
           <h3 className="text-white font-bold mb-6 uppercase">Production Pipeline</h3>
           <div className="flex-1">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={projectData}>
                    <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                        cursor={{fill: '#ffffff10'}}
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                    />
                    <Bar dataKey="value" fill="#00FFFF" radius={[4, 4, 0, 0]} barSize={40}>
                      {projectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};
