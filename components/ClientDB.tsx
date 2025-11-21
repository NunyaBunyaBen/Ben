
import React, { useState } from 'react';
import { Client, PageType } from '../types';
import { useData } from '../DataContext';
import { Search, Plus, X, Trash2, User, DollarSign, Calendar, Mail, Package, Folder, MoreHorizontal, HardDrive, Copy, CheckCircle2 } from 'lucide-react';
import { ROOT_FOLDERS, STRUCTURE_TEMPLATES } from '../constants';

interface ClientDBProps {
  activeId?: string;
  onNavigate?: (id: string, type: PageType) => void;
}

export const ClientDB: React.FC<ClientDBProps> = ({ activeId, onNavigate }) => {
  const { clients, addClient, deleteClient, packages } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);

  const packageChoices = packages.length 
    ? packages.map(pkg => pkg.name) 
    : ['Set & Forget', 'Starter Pack', 'Enterprise', 'Consulting', 'Add-on'];
  const defaultPackageName = packageChoices[0] || 'Custom Package';

  // New Client Form State
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    status: 'Onboarding',
    revenue: 2997,
    nextShoot: '',
    contact: '',
    package: defaultPackageName,
    driveUrl: ''
  });
  
  const filteredClients = React.useMemo(() => {
    let result = clients;

    // Filter by View ID
    if (activeId) {
      const normalizedId = activeId.toLowerCase();
      if (normalizedId.includes('active')) {
        result = result.filter(c => c.status === 'Active');
      } else if (normalizedId.includes('onboard')) {
        result = result.filter(c => c.status === 'Onboarding');
      } else if (normalizedId.includes('churned')) {
        result = result.filter(c => c.status === 'Churned');
      } else if (normalizedId.includes('leads')) {
        result = result.filter(c => c.status === 'Lead');
      }
    }

    // Filter by Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(lowerSearch) || 
        c.contact.toLowerCase().includes(lowerSearch)
      );
    }
    
    return result;
  }, [activeId, clients, searchTerm]);

  const handleOpenModal = () => {
    // Smart Default: Set status based on current view so the user sees what they add
    let defaultStatus: Client['status'] = 'Active';
    if (activeId?.includes('onboard')) defaultStatus = 'Onboarding';
    if (activeId?.includes('churned')) defaultStatus = 'Churned';
    if (activeId?.includes('leads')) defaultStatus = 'Lead';
    
    setNewClient({
        name: '',
        status: defaultStatus,
        revenue: 2997,
        nextShoot: '',
        contact: '',
        package: defaultPackageName,
        driveUrl: ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveClient = () => {
    if (!newClient.name) {
        setError('Client name is required');
        return;
    }
    addClient(newClient as Omit<Client, 'id'>);
    setIsModalOpen(false);
    
    // Trigger Toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleOpenPortal = (clientId: string) => {
    if (onNavigate) {
        onNavigate(clientId, PageType.CLIENT_PORTAL);
    }
  };
  
  const handleCopyStructure = () => {
      const structure = ROOT_FOLDERS.map(f => {
          const sub = STRUCTURE_TEMPLATES[f] ? STRUCTURE_TEMPLATES[f].map(s => `  - ${s}`).join('\n') : '';
          return `${f}\n${sub}`;
      }).join('\n');
      navigator.clipboard.writeText(structure);
      alert("Folder list copied! Paste this into a notepad or use it to quickly create folders in Drive.");
  };

  const getViewTitle = () => {
    if (activeId?.includes('leads')) return 'Lead Pipeline';
    if (activeId?.includes('onboard')) return 'Onboarding Queue';
    if (activeId?.includes('churned')) return 'Churned Clients';
    return 'Active Client Database';
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Active': return 'text-green-400 bg-green-500/10 border-green-500/30';
          case 'Onboarding': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
          case 'Churned': return 'text-red-400 bg-red-500/10 border-red-500/30';
          default: return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 relative pb-10">
      {/* Notification Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] bg-nb-teal text-black font-bold px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(0,255,255,0.4)] animate-in slide-in-from-bottom-5 fade-in flex items-center gap-2">
            <CheckCircle2 size={20} />
            <span>Client Saved Successfully</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">{getViewTitle()}</h2>
          <p className="text-zinc-500 text-sm">
            {filteredClients.length} records found
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleOpenModal}
            className="bg-nb-teal text-black font-bold px-4 py-2 rounded-md hover:bg-cyan-300 transition-colors shadow-[0_0_15px_rgba(0,255,255,0.3)] flex items-center gap-2"
          >
            <Plus size={18} /> NEW CLIENT
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-8 relative">
        <Search className="absolute left-4 top-3 text-zinc-500" size={18} />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search clients, contacts, or status..." 
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-zinc-300 focus:outline-none focus:border-nb-teal transition-colors shadow-inner"
        />
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-4">
          {filteredClients.length === 0 && (
            <div className="col-span-full text-center py-20 border-2 border-dashed border-zinc-800 rounded-xl">
              <p className="text-zinc-500">No clients found matching criteria.</p>
            </div>
          )}

          {filteredClients.map(client => (
            <div 
                key={client.id}
                onClick={() => handleOpenPortal(client.id)}
                className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 hover:border-nb-pink/50 hover:bg-zinc-900/50 transition-all cursor-pointer group relative flex flex-col"
            >
                {/* Card Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                         <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-nb-pink to-purple-900 flex items-center justify-center text-white font-bold text-lg shadow-[0_0_10px_rgba(255,0,255,0.2)]">
                            {client.name.substring(0, 2).toUpperCase()}
                         </div>
                         <div>
                             <h3 className="font-bold text-white text-lg leading-tight group-hover:text-nb-pink transition-colors">{client.name}</h3>
                             <div className="text-xs text-zinc-500 flex items-center gap-1">
                                <Mail size={10} /> {client.contact || 'No email'}
                             </div>
                         </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${getStatusColor(client.status)}`}>
                        {client.status}
                    </div>
                </div>

                {/* Card Body */}
                <div className="space-y-3 flex-1">
                     <div className="bg-black/40 rounded p-3 flex justify-between items-center border border-zinc-800/50">
                         <div className="text-xs text-zinc-500 uppercase font-bold">Package</div>
                         <div className="text-sm font-bold text-nb-teal">
                           {client.packageAssignments?.length
                              ? client.packageAssignments
                                  .map(assignment => {
                                      const pkg = packages.find(p => p.id === assignment.packageId);
                                      return pkg?.name;
                                  })
                                  .filter(Boolean)
                                  .join(', ') || client.package || 'N/A'
                              : client.package || 'N/A'}
                         </div>
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div className="bg-black/40 rounded p-3 border border-zinc-800/50">
                             <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Revenue</div>
                             <div className="text-sm font-mono font-bold text-zinc-200">${client.revenue.toLocaleString()}</div>
                        </div>
                        <div className="bg-black/40 rounded p-3 border border-zinc-800/50">
                             <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Next Shoot</div>
                             <div className="text-sm font-mono font-bold text-zinc-200">{client.nextShoot || 'TBD'}</div>
                        </div>
                     </div>
                     {client.driveUrl && (
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 bg-blue-900/10 border border-blue-900/30 p-2 rounded">
                            <HardDrive size={12} className="text-blue-400"/> Linked to Google Drive
                        </div>
                     )}
                </div>

                {/* Card Footer */}
                <div className="mt-6 pt-4 border-t border-zinc-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-1 text-xs font-bold text-zinc-500 group-hover:text-nb-teal transition-colors">
                        <Folder size={14} />
                        Open Portal
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal(); 
                            }}
                            className="p-2 hover:bg-zinc-800 rounded-full text-zinc-600 hover:text-white transition-colors"
                        >
                            <MoreHorizontal size={16} />
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if(window.confirm('Delete this client record?')) deleteClient(client.id);
                            }}
                            className="p-2 hover:bg-red-500/10 rounded-full text-zinc-600 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
          ))}
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Add New Client</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><User size={12}/> Client Name <span className="text-nb-pink">*</span></label>
                        <input 
                            type="text" 
                            className={`w-full bg-black border rounded p-2 text-white focus:border-nb-teal outline-none ${error ? 'border-red-500' : 'border-zinc-800'}`}
                            value={newClient.name}
                            onChange={e => {
                                setNewClient({...newClient, name: e.target.value});
                                setError('');
                            }}
                            placeholder="e.g. Neon Burger"
                        />
                        {error && <p className="text-[10px] text-red-500 font-bold">{error}</p>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><DollarSign size={12}/> Revenue</label>
                            <input 
                                type="number" 
                                className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-teal outline-none"
                                value={newClient.revenue}
                                onChange={e => setNewClient({...newClient, revenue: Number(e.target.value)})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Status</label>
                            <select 
                                className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-teal outline-none"
                                value={newClient.status}
                                onChange={e => setNewClient({...newClient, status: e.target.value as any})}
                            >
                                <option>Active</option>
                                <option>Onboarding</option>
                                <option>Churned</option>
                                <option>Lead</option>
                            </select>
                        </div>
                    </div>
                    
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><Package size={12}/> Package / Offer</label>
                        <select 
                            className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-teal outline-none"
                            value={newClient.package}
                            onChange={e => setNewClient({...newClient, package: e.target.value})}
                        >
                            {packageChoices.map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                            <option value="Custom Package">Custom Package</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><Mail size={12}/> Contact Email</label>
                        <input 
                            type="email" 
                            className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-teal outline-none"
                            value={newClient.contact}
                            onChange={e => setNewClient({...newClient, contact: e.target.value})}
                            placeholder="email@client.com"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><Calendar size={12}/> Next Shoot Date</label>
                        <input 
                            type="date" 
                            className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-teal outline-none"
                            value={newClient.nextShoot}
                            onChange={e => setNewClient({...newClient, nextShoot: e.target.value})}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2 text-blue-400"><HardDrive size={12}/> Google Drive Folder Link</label>
                        <input 
                            type="url" 
                            className="w-full bg-black border border-blue-900/30 rounded p-2 text-white focus:border-blue-400 outline-none"
                            value={newClient.driveUrl}
                            onChange={e => setNewClient({...newClient, driveUrl: e.target.value})}
                            placeholder="https://drive.google.com/drive/folders/..."
                        />
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-[10px] text-zinc-500">Paste the link to the client's root folder in Drive.</p>
                            <button 
                                onClick={handleCopyStructure}
                                className="text-[10px] text-blue-400 font-bold hover:text-white flex items-center gap-1 bg-blue-900/20 px-2 py-1 rounded border border-blue-900/30"
                            >
                                <Copy size={10} /> Copy Folder Structure for Drive
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900 rounded-b-xl">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 rounded text-zinc-400 hover:text-white font-bold text-sm"
                    >
                        CANCEL
                    </button>
                    <button 
                        onClick={handleSaveClient}
                        className="px-6 py-2 bg-nb-teal text-black font-bold rounded shadow-[0_0_10px_rgba(0,255,255,0.2)] hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all flex items-center gap-2"
                    >
                        <Plus size={16} /> SAVE CLIENT
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
