
import React, { useState } from 'react';
import { useData } from '../DataContext';
import { Invoice, InvoiceItem } from '../types';
import { Plus, Trash2, Download, Send, FileText, X } from 'lucide-react';

export const InvoiceGenerator: React.FC = () => {
  const { invoices, addInvoice, updateInvoice, deleteInvoice, clients } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  // New Invoice Form
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    number: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [{ id: '1', description: 'Social Media Management', quantity: 1, price: 2997 }],
    status: 'Draft'
  });

  const calculateTotal = (items: InvoiceItem[]) => {
    return items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  };

  const handleAddItem = () => {
    if (!newInvoice.items) return;
    setNewInvoice({
        ...newInvoice,
        items: [...newInvoice.items, { id: Math.random().toString(), description: '', quantity: 1, price: 0 }]
    });
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    if (!newInvoice.items) return;
    const updatedItems = [...newInvoice.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewInvoice({ ...newInvoice, items: updatedItems });
  };

  const removeItem = (index: number) => {
    if (!newInvoice.items) return;
    const updatedItems = newInvoice.items.filter((_, i) => i !== index);
    setNewInvoice({ ...newInvoice, items: updatedItems });
  };

  const handleSave = () => {
    if (!newInvoice.clientId || !newInvoice.date) return;
    const clientName = clients.find(c => c.id === newInvoice.clientId)?.name || 'Unknown';
    
    addInvoice({
        ...newInvoice,
        clientName,
        total: calculateTotal(newInvoice.items || []),
    } as any);
    
    setIsModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Invoice Generator</h2>
          <p className="text-zinc-500 text-sm">Create and manage professional invoices.</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-nb-pink text-white font-bold px-4 py-2 rounded-md hover:bg-pink-600 transition-colors shadow-[0_0_15px_rgba(255,0,255,0.3)] flex items-center gap-2"
        >
            <Plus size={18} /> NEW INVOICE
        </button>
      </div>

      {/* Invoice List */}
      <div className="flex-1 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30">
         <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
                 <thead>
                     <tr className="border-b border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                         <th className="p-4">Invoice #</th>
                         <th className="p-4">Client</th>
                         <th className="p-4">Date</th>
                         <th className="p-4">Total</th>
                         <th className="p-4">Status</th>
                         <th className="p-4 text-right">Actions</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-800">
                     {invoices.length === 0 && (
                         <tr><td colSpan={6} className="p-8 text-center text-zinc-500">No invoices yet.</td></tr>
                     )}
                     {invoices.map(inv => (
                         <tr key={inv.id} className="hover:bg-zinc-900/50 transition-colors">
                             <td className="p-4 font-mono text-zinc-300">{inv.number}</td>
                             <td className="p-4 font-bold text-white">{inv.clientName}</td>
                             <td className="p-4 text-zinc-400">{inv.date}</td>
                             <td className="p-4 font-mono text-nb-teal font-bold">${inv.total.toLocaleString()}</td>
                             <td className="p-4">
                                 <span className={`px-2 py-1 rounded text-xs font-bold border ${
                                     inv.status === 'Paid' ? 'text-green-400 border-green-500/30 bg-green-500/10' :
                                     inv.status === 'Sent' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' :
                                     inv.status === 'Overdue' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                                     'text-zinc-400 border-zinc-700 bg-zinc-800'
                                 }`}>
                                     {inv.status.toUpperCase()}
                                 </span>
                             </td>
                             <td className="p-4 text-right flex justify-end gap-2">
                                 <button onClick={() => setViewInvoice(inv)} className="p-1.5 text-zinc-400 hover:text-white border border-zinc-700 rounded hover:bg-zinc-800">
                                     <FileText size={14} />
                                 </button>
                                 <button onClick={() => deleteInvoice(inv.id)} className="p-1.5 text-zinc-400 hover:text-red-500 border border-zinc-700 rounded hover:bg-zinc-800">
                                     <Trash2 size={14} />
                                 </button>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-zinc-700 w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-white">Create Invoice</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={24}/></button>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-6 flex-1">
                      <div className="grid grid-cols-3 gap-4">
                          <div>
                              <label className="text-xs font-bold text-zinc-500 uppercase">Client</label>
                              <select 
                                  className="w-full bg-black border border-zinc-800 rounded p-2 text-white mt-1 focus:border-nb-pink outline-none"
                                  value={newInvoice.clientId}
                                  onChange={e => setNewInvoice({...newInvoice, clientId: e.target.value})}
                              >
                                  <option value="">Select Client</option>
                                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-zinc-500 uppercase">Invoice #</label>
                              <input type="text" className="w-full bg-black border border-zinc-800 rounded p-2 text-white mt-1" value={newInvoice.number} onChange={e => setNewInvoice({...newInvoice, number: e.target.value})} />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-zinc-500 uppercase">Due Date</label>
                              <input type="date" className="w-full bg-black border border-zinc-800 rounded p-2 text-white mt-1" value={newInvoice.dueDate} onChange={e => setNewInvoice({...newInvoice, dueDate: e.target.value})} />
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Line Items</label>
                          <div className="space-y-2">
                              {newInvoice.items?.map((item, idx) => (
                                  <div key={idx} className="flex gap-2">
                                      <input 
                                          type="text" 
                                          placeholder="Description" 
                                          className="flex-1 bg-black border border-zinc-800 rounded p-2 text-white" 
                                          value={item.description}
                                          onChange={e => updateItem(idx, 'description', e.target.value)}
                                      />
                                      <input 
                                          type="number" 
                                          placeholder="Qty" 
                                          className="w-16 bg-black border border-zinc-800 rounded p-2 text-white" 
                                          value={item.quantity}
                                          onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                                      />
                                      <input 
                                          type="number" 
                                          placeholder="Price" 
                                          className="w-24 bg-black border border-zinc-800 rounded p-2 text-white" 
                                          value={item.price}
                                          onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                                      />
                                      <button onClick={() => removeItem(idx)} className="text-zinc-500 hover:text-red-500"><Trash2 size={16} /></button>
                                  </div>
                              ))}
                          </div>
                          <button onClick={handleAddItem} className="mt-2 text-xs font-bold text-nb-teal flex items-center gap-1"><Plus size={12} /> ADD ITEM</button>
                      </div>
                      
                      <div className="flex justify-end">
                          <div className="text-right">
                              <div className="text-zinc-500 text-xs uppercase font-bold">Total Due</div>
                              <div className="text-2xl font-bold text-white">${calculateTotal(newInvoice.items || []).toLocaleString()}</div>
                          </div>
                      </div>
                  </div>
                  <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
                       <button onClick={handleSave} className="px-6 py-2 bg-nb-pink text-white font-bold rounded">CREATE INVOICE</button>
                  </div>
              </div>
          </div>
      )}

      {/* View/Print Invoice Modal */}
      {viewInvoice && (
          <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
              <div className="bg-white text-black w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-8 flex-1 overflow-y-auto">
                      <div className="flex justify-between items-start mb-10">
                          <div>
                              <h1 className="text-3xl font-black italic">NUNYA BUNYA</h1>
                              <p className="text-sm text-gray-500">Creative Agency</p>
                          </div>
                          <div className="text-right">
                              <h2 className="text-xl font-bold text-gray-800">INVOICE</h2>
                              <p className="text-gray-500">#{viewInvoice.number}</p>
                          </div>
                      </div>

                      <div className="flex justify-between mb-10">
                          <div>
                              <p className="text-xs font-bold text-gray-400 uppercase">Bill To</p>
                              <p className="font-bold">{viewInvoice.clientName}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-xs font-bold text-gray-400 uppercase">Date</p>
                              <p>{viewInvoice.date}</p>
                              <p className="text-xs font-bold text-gray-400 uppercase mt-2">Due Date</p>
                              <p>{viewInvoice.dueDate || 'On Receipt'}</p>
                          </div>
                      </div>

                      <table className="w-full text-left mb-10">
                          <thead>
                              <tr className="border-b-2 border-black">
                                  <th className="py-2">Description</th>
                                  <th className="py-2 text-right">Qty</th>
                                  <th className="py-2 text-right">Price</th>
                                  <th className="py-2 text-right">Total</th>
                              </tr>
                          </thead>
                          <tbody>
                              {viewInvoice.items.map((item, i) => (
                                  <tr key={i} className="border-b border-gray-200">
                                      <td className="py-3">{item.description}</td>
                                      <td className="py-3 text-right">{item.quantity}</td>
                                      <td className="py-3 text-right">${item.price.toLocaleString()}</td>
                                      <td className="py-3 text-right font-bold">${(item.price * item.quantity).toLocaleString()}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>

                      <div className="flex justify-end">
                          <div className="text-right">
                              <p className="text-lg font-bold">Total Due: <span className="text-2xl">${viewInvoice.total.toLocaleString()}</span></p>
                          </div>
                      </div>
                  </div>
                  
                  <div className="bg-gray-100 p-4 flex justify-end gap-3 print:hidden">
                      <button onClick={() => setViewInvoice(null)} className="px-4 py-2 rounded text-gray-600 font-bold">CLOSE</button>
                      <button onClick={() => window.print()} className="px-4 py-2 bg-black text-white rounded font-bold flex items-center gap-2"><Download size={16}/> PRINT / PDF</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
