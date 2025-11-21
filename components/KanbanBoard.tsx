
import React, { useState } from 'react';
import { useData } from '../DataContext';
import { KANBAN_COLUMNS } from '../constants';
import { KanbanItem } from '../types';
import { MoreHorizontal, Plus, X, Trash2 } from 'lucide-react';

export const KanbanBoard: React.FC = () => {
  const { kanbanItems, addKanbanItem, updateKanbanItem, deleteKanbanItem, clients } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Project Form
  const [newItem, setNewItem] = useState<Partial<KanbanItem>>({
    title: '',
    client: '',
    status: 'scripting',
    tag: ''
  });

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('text/plain', itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId) {
      updateKanbanItem(itemId, { status: columnId });
    }
  };

  const handleSaveItem = () => {
    if (!newItem.title || !newItem.client) return;
    addKanbanItem(newItem as Omit<KanbanItem, 'id'>);
    setIsModalOpen(false);
    setNewItem({ title: '', client: '', status: 'scripting', tag: '' });
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Video Production Pipeline</h2>
          <p className="text-zinc-500 text-sm">Drag cards to move them across the board</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-nb-teal text-black font-bold px-4 py-2 rounded-md hover:bg-cyan-300 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,255,0.3)]"
        >
          <Plus size={16} /> NEW PROJECT
        </button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full min-w-[1200px]">
          {KANBAN_COLUMNS.map(column => {
            const columnItems = kanbanItems.filter(i => i.status === column.id);
            
            return (
              <div 
                key={column.id} 
                className="w-72 flex flex-col bg-zinc-900/30 rounded-xl border border-zinc-800/50 transition-colors hover:border-zinc-700"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/50 rounded-t-xl">
                  <h3 className="font-bold text-sm text-zinc-300 uppercase">{column.title}</h3>
                  <span className="bg-zinc-800 text-zinc-500 text-xs px-2 py-0.5 rounded-full">{columnItems.length}</span>
                </div>

                {/* Column Body */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[200px]">
                  {columnItems.map(item => (
                    <div 
                      key={item.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      className="bg-black border border-zinc-800 p-3 rounded-lg hover:border-nb-pink/50 transition-all cursor-grab active:cursor-grabbing group relative shadow-sm"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-zinc-800 group-hover:bg-nb-pink rounded-l-lg transition-colors"></div>
                      <div className="pl-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-nb-teal">{item.client}</span>
                          <button 
                            onClick={() => {
                                if(window.confirm('Delete this project?')) deleteKanbanItem(item.id);
                            }}
                            className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <p className="text-sm text-zinc-200 font-medium leading-snug">{item.title}</p>
                        {item.tag && (
                           <div className="mt-3">
                             <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-1 rounded border border-red-500/30 uppercase font-bold">{item.tag}</span>
                           </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {columnItems.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-zinc-800/50 rounded-lg">
                          <p className="text-zinc-700 text-xs">Drop here</p>
                      </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">New Video Project</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Project Title</label>
                        <input 
                            type="text" 
                            className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-teal outline-none"
                            value={newItem.title}
                            onChange={e => setNewItem({...newItem, title: e.target.value})}
                            placeholder="e.g. Month 1 Highlights Reel"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Client</label>
                        <select 
                            className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-teal outline-none"
                            value={newItem.client}
                            onChange={e => setNewItem({...newItem, client: e.target.value})}
                        >
                            <option value="">Select Client...</option>
                            {clients.filter(c => c.status === 'Active' || c.status === 'Onboarding').map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Starting Stage</label>
                            <select 
                                className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-teal outline-none"
                                value={newItem.status}
                                onChange={e => setNewItem({...newItem, status: e.target.value})}
                            >
                                {KANBAN_COLUMNS.map(col => (
                                    <option key={col.id} value={col.id}>{col.title}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Tag (Optional)</label>
                            <input 
                                type="text" 
                                className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-teal outline-none"
                                value={newItem.tag}
                                onChange={e => setNewItem({...newItem, tag: e.target.value})}
                                placeholder="e.g. Urgent"
                            />
                        </div>
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
                        onClick={handleSaveItem}
                        className="px-6 py-2 bg-nb-teal text-black font-bold rounded shadow-[0_0_10px_rgba(0,255,255,0.2)] hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all flex items-center gap-2"
                    >
                        <Plus size={16} /> ADD CARD
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
