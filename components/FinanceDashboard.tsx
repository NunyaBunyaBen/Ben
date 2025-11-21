
import React, { useState } from 'react';
import { useData } from '../DataContext';
import { Transaction } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Plus, Trash2 } from 'lucide-react';

export const FinanceDashboard: React.FC = () => {
  const { transactions, addTransaction, deleteTransaction } = useData();
  
  const [newTrans, setNewTrans] = useState<Partial<Transaction>>({
      description: '',
      amount: 0,
      type: 'Expense',
      date: new Date().toISOString().split('T')[0],
      category: 'Software'
  });

  const income = transactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0);
  const profit = income - expenses;

  const handleAdd = () => {
      if (!newTrans.description || !newTrans.amount) return;
      addTransaction(newTrans as any);
      setNewTrans({ ...newTrans, description: '', amount: 0 });
  };

  // Chart Data (Simple Aggregation by Month - simplified for now)
  const chartData = [
      { name: 'Income', value: income },
      { name: 'Expenses', value: expenses }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Finance Command</h2>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
              <div className="text-xs font-bold text-zinc-500 uppercase">Total Income</div>
              <div className="text-2xl font-bold text-nb-teal mt-1">+${income.toLocaleString()}</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
              <div className="text-xs font-bold text-zinc-500 uppercase">Total Expenses</div>
              <div className="text-2xl font-bold text-nb-pink mt-1">-${expenses.toLocaleString()}</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
              <div className="text-xs font-bold text-zinc-500 uppercase">Net Profit</div>
              <div className={`text-2xl font-bold mt-1 ${profit >= 0 ? 'text-nb-lime' : 'text-red-500'}`}>
                  ${profit.toLocaleString()}
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Add */}
          <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl">
              <h3 className="text-white font-bold mb-4 uppercase">Add Transaction</h3>
              <div className="space-y-3">
                  <div className="flex gap-2">
                      <button 
                        onClick={() => setNewTrans({...newTrans, type: 'Income'})}
                        className={`flex-1 py-2 rounded text-xs font-bold border ${newTrans.type === 'Income' ? 'bg-nb-teal text-black border-nb-teal' : 'bg-black text-zinc-500 border-zinc-800'}`}
                      >INCOME</button>
                      <button 
                        onClick={() => setNewTrans({...newTrans, type: 'Expense'})}
                        className={`flex-1 py-2 rounded text-xs font-bold border ${newTrans.type === 'Expense' ? 'bg-nb-pink text-white border-nb-pink' : 'bg-black text-zinc-500 border-zinc-800'}`}
                      >EXPENSE</button>
                  </div>
                  <input type="date" className="w-full bg-black border border-zinc-800 rounded p-2 text-white text-sm" value={newTrans.date} onChange={e => setNewTrans({...newTrans, date: e.target.value})} />
                  <input type="text" placeholder="Description" className="w-full bg-black border border-zinc-800 rounded p-2 text-white text-sm" value={newTrans.description} onChange={e => setNewTrans({...newTrans, description: e.target.value})} />
                  <input type="number" placeholder="Amount" className="w-full bg-black border border-zinc-800 rounded p-2 text-white text-sm" value={newTrans.amount || ''} onChange={e => setNewTrans({...newTrans, amount: Number(e.target.value)})} />
                  <select className="w-full bg-black border border-zinc-800 rounded p-2 text-white text-sm" value={newTrans.category} onChange={e => setNewTrans({...newTrans, category: e.target.value})}>
                      <option>Software</option>
                      <option>Contractors</option>
                      <option>Equipment</option>
                      <option>Client Payment</option>
                      <option>Marketing</option>
                  </select>
                  <button onClick={handleAdd} className="w-full bg-white text-black font-bold py-2 rounded hover:bg-gray-200">ADD RECORD</button>
              </div>
          </div>

          {/* Transaction List */}
          <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl flex flex-col">
              <h3 className="text-white font-bold mb-4 uppercase">Recent Transactions</h3>
              <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
                  {transactions.length === 0 && <div className="text-zinc-500 text-sm">No transactions recorded.</div>}
                  {transactions.map(t => (
                      <div key={t.id} className="flex justify-between items-center bg-black border border-zinc-800 p-3 rounded hover:border-zinc-700 group">
                          <div>
                              <div className="font-bold text-zinc-200 text-sm">{t.description}</div>
                              <div className="text-xs text-zinc-500">{t.date} • {t.category}</div>
                          </div>
                          <div className="flex items-center gap-4">
                              <div className={`font-mono font-bold ${t.type === 'Income' ? 'text-nb-teal' : 'text-nb-pink'}`}>
                                  {t.type === 'Income' ? '+' : '-'}${t.amount.toLocaleString()}
                              </div>
                              <button onClick={() => deleteTransaction(t.id)} className="text-zinc-700 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};
