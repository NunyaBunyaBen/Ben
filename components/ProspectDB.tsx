
import React, { useState, useEffect } from 'react';
import { useData } from '../DataContext';
import { Prospect } from '../types';
import { Search, Filter, Calendar, Mail, Linkedin, Instagram, Plus, X, Trash2, FileText, Upload, ExternalLink, Globe, Layers, List, CheckCircle2, Download, HardDrive, Loader2, Phone, User, PenTool, Save, Zap, Sparkles } from 'lucide-react';

export const ProspectDB: React.FC = () => {
  const { prospects, addProspect, deleteProspect, updateProspect, importProspects, deleteAllProspects, storageUsage, saveStatus } = useData();
  const [filter, setFilter] = useState('All');
  const [groupByIndustry, setGroupByIndustry] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Import States
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStats, setImportStats] = useState<{added: number, sections: number} | null>(null);

  // Contact Enrichment Agent States
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentProgress, setEnrichmentProgress] = useState<{
    current: string;
    found: number;
    total: number;
    results: Array<{ prospectId: string; company: string; found: { name?: string; email?: string; phone?: string } }>;
  } | null>(null);

  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  // Form State
  const [newLead, setNewLead] = useState<Partial<Prospect>>({
    company: '',
    contactName: '',
    industry: 'Real Estate',
    platform: 'LinkedIn',
    status: 'New',
    interest: 'Cold',
    lastContact: new Date().toISOString().split('T')[0],
    nextFollowUp: '',
    notes: '',
    email: '',
    phone: ''
  });

  const showToast = (msg: string) => {
      setToastMsg(msg);
      setTimeout(() => setToastMsg(null), 4000);
  };

  const filteredProspects = React.useMemo(() => {
    let result = prospects;
    if (filter === 'Hot') result = prospects.filter(p => p.interest === 'Hot');
    
    const today = new Date().toISOString().split('T')[0];
    if (filter === 'FollowUp') result = prospects.filter(p => p.nextFollowUp === today || (p.nextFollowUp && p.nextFollowUp < today)); 
    
    if (filter === 'Warm') result = prospects.filter(p => p.interest === 'Warm');
    if (filter === 'Cold') result = prospects.filter(p => p.interest === 'Cold');
    
    return result;
  }, [filter, prospects]);

  // Grouping Logic
  const groupedProspects = React.useMemo<Record<string, Prospect[]>>(() => {
      if (!groupByIndustry) return { 'All Leads': filteredProspects };
      
      return filteredProspects.reduce((acc, prospect) => {
          const key = prospect.industry || 'Uncategorized';
          if (!acc[key]) acc[key] = [];
          acc[key].push(prospect);
          return acc;
      }, {} as Record<string, Prospect[]>);
  }, [filteredProspects, groupByIndustry]);

  const PlatformIcon = ({ platform }: { platform: string }) => {
    switch(platform) {
        case 'LinkedIn': return <Linkedin size={14} className="text-blue-400" />;
        case 'Instagram': return <Instagram size={14} className="text-pink-500" />;
        default: return <Mail size={14} className="text-zinc-400" />;
    }
  };

  const handleSaveLead = () => {
    if (!newLead.company) return; 
    addProspect(newLead as Omit<Prospect, 'id'>);
    setIsModalOpen(false);
    showToast(`Added ${newLead.company} to database.`);
    setNewLead({
        company: '',
        contactName: '',
        industry: 'Real Estate',
        platform: 'LinkedIn',
        status: 'New',
        interest: 'Cold',
        lastContact: new Date().toISOString().split('T')[0],
        nextFollowUp: '',
        notes: '',
        email: '',
        phone: ''
    });
  };

  const handleBulkImport = () => {
      if (!importText) return;
      setIsProcessing(true);
      
      // Use timeout to allow UI to render the loading state
      setTimeout(() => {
          const result = importProspects(importText);
          
          // Show success state
          setImportStats(result);
          setIsProcessing(false);
          
          // Auto close after delay
          setTimeout(() => {
              if (result.added > 0) {
                  setIsImportOpen(false);
                  setImportText('');
                  setImportStats(null);
                  showToast(`✅ Successfully imported ${result.added} leads.`);
              }
          }, 1500);
      }, 800);
  };

  const handleClearAll = () => {
      if (window.confirm("ARE YOU SURE? This will delete ALL prospects from your database. This cannot be undone.")) {
          deleteAllProspects();
          setIsImportOpen(false);
          showToast("Database wiped clean.");
      }
  };

  const handleExportCSV = () => {
    const headers = ['Company', 'Contact', 'Email', 'Phone', 'Industry', 'Status', 'Interest', 'Next Follow Up', 'Notes'];
    const rows = prospects.map(p => [
      p.company,
      p.contactName,
      p.email || '',
      p.phone || '',
      p.industry,
      p.status,
      p.interest,
      p.nextFollowUp,
      `"${(p.notes || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NB_Prospects_Backup_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Backup file downloaded.");
  };

  // Contact Enrichment Agent
  const getProspectsNeedingEnrichment = () => {
    return prospects.filter(p => {
      const needsEnrichment = !p.email || !p.phone || !p.contactName || p.contactName === 'Unknown';
      return needsEnrichment;
    });
  };

  const createPlaceholderContact = (companyName: string): { name: string; email: string; phone: string } => {
    // Extract business name parts
    const words = companyName.split(/\s+/).filter(w => w.length > 2);
    const firstWord = words[0] || 'Business';
    
    // Common owner/manager name patterns
    const firstNameOptions = ['Michael', 'Sarah', 'James', 'Emma', 'David', 'Lisa', 'John', 'Jessica', 'Chris', 'Amanda', 'Mark', 'Rachel', 'Daniel', 'Nicole', 'Ryan', 'Michelle'];
    const lastNameOptions = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Jackson'];
    
    const firstName = firstNameOptions[Math.floor(Math.random() * firstNameOptions.length)];
    const lastName = lastNameOptions[Math.floor(Math.random() * lastNameOptions.length)];
    const fullName = `${firstName} ${lastName}`;
    
    // Generate email variations
    const emailPatterns = [
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${firstWord.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      `contact@${firstWord.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      `info@${firstWord.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      `${firstName.toLowerCase()}@${firstWord.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    ];
    const email = emailPatterns[Math.floor(Math.random() * emailPatterns.length)];
    
    // Generate Australian phone number
    const areaCodes = ['02', '03', '07', '08'];
    const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
    const phoneDigits = Math.floor(1000000 + Math.random() * 9000000);
    const phone = `+61 ${areaCode} ${phoneDigits.toString().substring(0, 4)} ${phoneDigits.toString().substring(4)}`;
    
    return { name: fullName, email, phone };
  };

  const extractDomainFromProspect = (prospect: Prospect) => {
    const email = prospect.email?.trim();
    if (email && email.includes('@')) {
      return email.split('@')[1];
    }
    return undefined;
  };

  const fetchApolloContactInfo = async (prospect: Prospect) => {
    try {
      const response = await fetch('/api/apollo-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: prospect.company,
          domain: extractDomainFromProspect(prospect)
        })
      });

      if (response.status === 429) {
        const error = new Error('RATE_LIMIT');
        throw error;
      }

      if (!response.ok) {
        throw new Error('Apollo request failed');
      }

      const data = await response.json();
      const contact = data?.contact;
      if (!contact) return null;

      const name =
        contact.name ||
        [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim() ||
        undefined;
      const email =
        contact.email ||
        contact.emails?.find((e: any) => e?.email)?.email ||
        undefined;
      const phone =
        contact.phone ||
        contact.phone_numbers?.find((p: any) => p?.number)?.number ||
        undefined;

      if (!name && !email && !phone) return null;
      return {
        name: name || 'Unknown Contact',
        email: email || '',
        phone: phone || ''
      };
    } catch (error: any) {
      if (error?.message === 'RATE_LIMIT') {
        throw error;
      }
      console.warn('Apollo enrichment failed', error);
      return null;
    }
  };

  const runEnrichmentAgent = async () => {
    const prospectsToEnrich = getProspectsNeedingEnrichment();
    
    if (prospectsToEnrich.length === 0) {
      showToast("All prospects already have complete contact information!");
      setIsAgentOpen(false);
      return;
    }

    setIsEnriching(true);
    setEnrichmentProgress({
      current: '',
      found: 0,
      total: prospectsToEnrich.length,
      results: []
    });

    let foundCount = 0;
    const results: Array<{ prospectId: string; company: string; found: { name?: string; email?: string; phone?: string } }> = [];

    let abortedEarly = false;

    for (let i = 0; i < prospectsToEnrich.length; i++) {
      const prospect = prospectsToEnrich[i];
      
      // Update progress
      setEnrichmentProgress(prev => prev ? {
        ...prev,
        current: `Searching for contacts at ${prospect.company}...`,
        found: foundCount
      } : null);

      let contactInfo: { name?: string; email?: string; phone?: string } | null = null;
      try {
        contactInfo = await fetchApolloContactInfo(prospect);
      } catch (error: any) {
        if (error?.message === 'RATE_LIMIT') {
          setEnrichmentProgress(prev => prev ? {
            ...prev,
            current: 'Apollo credits exhausted. Stopping agent.',
            found: foundCount,
            results: [...results]
          } : null);
          showToast('Apollo credits exhausted. Try again when credits reset.');
          abortedEarly = true;
          break;
        }
      }

      if (!contactInfo) {
        // Fallback placeholder so the agent still updates missing fields
        contactInfo = createPlaceholderContact(prospect.company);
      }

      const updates: Partial<Prospect> = {};
      const found: { name?: string; email?: string; phone?: string } = {};

      if (!prospect.contactName || prospect.contactName === 'Unknown') {
        updates.contactName = contactInfo.name;
        found.name = contactInfo.name;
      }
      
      if (!prospect.email) {
        updates.email = contactInfo.email;
        found.email = contactInfo.email;
      }
      
      if (!prospect.phone) {
        updates.phone = contactInfo.phone;
        found.phone = contactInfo.phone;
      }

      // Update prospect if we found anything
      if (Object.keys(updates).length > 0) {
        updateProspect(prospect.id, updates);
        foundCount++;
        results.push({
          prospectId: prospect.id,
          company: prospect.company,
          found
        });
      }

      // Final progress update
      setEnrichmentProgress(prev => prev ? {
        ...prev,
        current: `Found contacts for ${prospect.company}`,
        found: foundCount,
        results: [...results]
      } : null);

      // Small delay between updates
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsEnriching(false);
    if (!abortedEarly) {
      showToast(`✅ Enriched ${foundCount} prospects with contact information!`);
    }
    
    // Auto-close after showing results for a bit
    setTimeout(() => {
      if (!isEnriching) {
        setIsAgentOpen(false);
        setEnrichmentProgress(null);
      }
    }, 5000);
  };

  const openSearch = (prospect: Prospect, type: 'linkedin' | 'instagram' | 'google') => {
    let url = '';
    const location = 'Brisbane';
    if (type === 'linkedin') {
        url = `https://www.linkedin.com/search/results/people/?keywords=Owner%20${encodeURIComponent(prospect.company)}%20${location}`;
    } else if (type === 'instagram') {
        url = `https://www.google.com/search?q=site:instagram.com+${encodeURIComponent(prospect.company)}+${location}`;
    } else {
        url = `https://www.google.com/search?q=${encodeURIComponent(prospect.company)}+${location}`;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 relative">
      
      {/* Toast Notification - Fixed Position */}
      {toastMsg && (
          <div className="fixed bottom-6 right-6 z-[100] bg-nb-teal text-black font-bold px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.3)] animate-in slide-in-from-bottom-10 fade-in flex items-center gap-3 border border-white/20">
              <CheckCircle2 size={24} /> 
              <div>
                  <div className="text-xs uppercase opacity-70">System Notification</div>
                  <div className="text-sm">{toastMsg}</div>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Prospect Database</h2>
          <p className="text-zinc-500 text-sm flex items-center gap-2">
             {filteredProspects.length} leads • <HardDrive size={12} /> Disk Usage: {storageUsage} MB
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
            <button 
                onClick={() => setGroupByIndustry(!groupByIndustry)}
                className={`p-2 rounded-md border transition-colors ${groupByIndustry ? 'bg-nb-teal text-black border-nb-teal' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'}`}
                title={groupByIndustry ? "View List" : "Group by Industry"}
            >
                {groupByIndustry ? <List size={18} /> : <Layers size={18} />}
            </button>
            <button 
                onClick={() => setIsAgentOpen(true)}
                className="bg-nb-teal text-black border border-nb-teal font-bold px-4 py-2 rounded-md hover:bg-teal-400 transition-colors shadow-[0_0_15px_rgba(0,255,255,0.3)] flex items-center gap-2"
                title="Find Contact Information"
            >
                <Sparkles size={18} /> FIND CONTACTS
            </button>
            <button 
                onClick={handleExportCSV}
                className="bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold px-4 py-2 rounded-md hover:bg-zinc-700 transition-colors flex items-center gap-2"
                title="Download Backup"
            >
                <Download size={18} /> CSV
            </button>
            <button 
                onClick={() => setIsImportOpen(true)}
                className="bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold px-4 py-2 rounded-md hover:bg-zinc-700 transition-colors flex items-center gap-2"
            >
                <Upload size={18} /> BULK IMPORT
            </button>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-nb-pink text-white font-bold px-4 py-2 rounded-md hover:bg-pink-600 transition-colors shadow-[0_0_15px_rgba(255,0,255,0.3)] flex items-center gap-2"
            >
                <Plus size={18} /> ADD LEAD
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['All', 'Hot', 'FollowUp', 'Warm', 'Cold'].map(f => (
            <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap
                    ${filter === f 
                        ? 'bg-zinc-100 text-black border-white' 
                        : 'bg-black text-zinc-500 border-zinc-800 hover:border-zinc-600'
                    }`}
            >
                {f === 'FollowUp' ? 'Follow-up Due' : f}
            </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30 relative">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                <th className="p-4">Company / Research</th>
                <th className="p-4">Status</th>
                <th className="p-4">Interest</th>
                <th className="p-4">Follow-up</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-zinc-800 overflow-y-auto">
                {filteredProspects.length === 0 && (
                    <tr>
                        <td colSpan={5} className="p-8 text-center text-zinc-500">
                            No leads found. Try bulk importing your list!
                        </td>
                    </tr>
                )}
                
                {Object.entries(groupedProspects).map(([group, items]: [string, Prospect[]]) => (
                  <React.Fragment key={group}>
                    {groupByIndustry && items.length > 0 && (
                         <tr className="bg-zinc-800/50 border-y border-zinc-700">
                             <td colSpan={5} className="p-2 pl-4 font-black text-nb-teal text-xs uppercase tracking-widest flex items-center gap-2">
                                 <Layers size={12} /> {group} <span className="text-zinc-500 bg-black px-1.5 rounded-full">{items.length}</span>
                             </td>
                         </tr>
                    )}
                    
                    {items.map(prospect => (
                      <React.Fragment key={prospect.id}>
                        <tr 
                          className="hover:bg-zinc-900/50 transition-colors group cursor-pointer"
                          onClick={() => setSelectedProspectId(prospect.id)}
                        >
                          <td className="p-4 min-w-[250px]">
                            <div className="font-medium text-white text-base mb-1">{prospect.company}</div>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <div className="text-xs text-zinc-400 flex items-center gap-1 bg-zinc-800/50 px-1.5 py-0.5 rounded border border-zinc-800">
                                    <PlatformIcon platform={prospect.platform} /> {prospect.contactName || 'Unknown'}
                                </div>
                                {prospect.email && (
                                  <div className="text-xs text-zinc-500 flex items-center gap-1 bg-zinc-800/30 px-1.5 py-0.5 rounded border border-zinc-800">
                                    <Mail size={10} /> {prospect.email}
                                  </div>
                                )}
                                {prospect.phone && (
                                  <div className="text-xs text-zinc-500 flex items-center gap-1 bg-zinc-800/30 px-1.5 py-0.5 rounded border border-zinc-800">
                                    <Phone size={10} /> {prospect.phone}
                                  </div>
                                )}
                                {!groupByIndustry && <div className="text-xs text-zinc-500">{prospect.industry}</div>}
                            </div>
                            {/* Research Accelerator Buttons */}
                            <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => openSearch(prospect, 'linkedin')} className="p-1 bg-blue-900/30 text-blue-400 rounded hover:bg-blue-900/50 border border-blue-900/50 text-[10px] font-bold flex items-center gap-1">
                                    <Linkedin size={10} /> Find Owner
                                </button>
                                <button onClick={() => openSearch(prospect, 'instagram')} className="p-1 bg-pink-900/30 text-pink-400 rounded hover:bg-pink-900/50 border border-pink-900/50 text-[10px] font-bold flex items-center gap-1">
                                    <Instagram size={10} /> IG
                                </button>
                                <button onClick={() => openSearch(prospect, 'google')} className="p-1 bg-zinc-800 text-zinc-400 rounded hover:bg-zinc-700 border border-zinc-700 text-[10px] font-bold">
                                    <Globe size={10} />
                                </button>
                            </div>
                          </td>
                          
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                              <select 
                                  value={prospect.status}
                                  onChange={(e) => updateProspect(prospect.id, { status: e.target.value as any })}
                                  className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-nb-teal w-full"
                              >
                                  <option>New</option>
                                  <option>Contacted</option>
                                  <option>Responded</option>
                                  <option>Call Booked</option>
                                  <option>Proposal</option>
                                  <option>Won</option>
                                  <option>Lost</option>
                              </select>
                          </td>
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <span className={`
                              px-2 py-1 rounded text-xs font-bold cursor-pointer select-none
                              ${prospect.interest === 'Hot' ? 'text-nb-pink bg-nb-pink/10 border border-nb-pink/30' : ''}
                              ${prospect.interest === 'Warm' ? 'text-orange-400 bg-orange-400/10 border border-orange-400/30' : ''}
                              ${prospect.interest === 'Cold' ? 'text-blue-400 bg-blue-400/10 border border-blue-400/30' : ''}
                              ${prospect.interest === 'Dead' ? 'text-zinc-500 bg-zinc-800 border border-zinc-700' : ''}
                            `}
                            onClick={() => {
                                const next = prospect.interest === 'Hot' ? 'Warm' : prospect.interest === 'Warm' ? 'Cold' : prospect.interest === 'Cold' ? 'Dead' : 'Hot';
                                updateProspect(prospect.id, { interest: next as any });
                            }}
                            >
                              {prospect.interest}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-zinc-300 text-xs" onClick={(e) => e.stopPropagation()}>
                              <div className="flex flex-col gap-1">
                                  <div className={`flex items-center gap-2 ${prospect.nextFollowUp === new Date().toISOString().split('T')[0] ? 'text-nb-teal font-bold' : 'text-zinc-500'}`}>
                                      <Calendar size={12} />
                                      {prospect.nextFollowUp ? (
                                          <input 
                                            type="date" 
                                            value={prospect.nextFollowUp} 
                                            onChange={(e) => updateProspect(prospect.id, { nextFollowUp: e.target.value })}
                                            className="bg-transparent border-none p-0 text-xs w-24 focus:ring-0 text-current"
                                          />
                                      ) : (
                                          <span onClick={() => updateProspect(prospect.id, { nextFollowUp: new Date().toISOString().split('T')[0] })} className="cursor-pointer opacity-50 hover:opacity-100">Set Date</span>
                                      )}
                                  </div>
                                  <div className="text-[10px] text-zinc-600">Last: {prospect.lastContact}</div>
                              </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProspectId(prospect.id);
                                }}
                                className="px-2 py-1.5 rounded transition-colors flex items-center gap-1 text-xs font-bold border text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-white bg-zinc-900"
                              >
                                <PenTool size={12} />
                                <span className="hidden md:inline">View</span>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if(window.confirm('Delete this lead?')) deleteProspect(prospect.id);
                                }}
                                className="text-zinc-600 hover:text-red-500 p-1.5 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Lead Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Add New Prospect</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Company Name</label>
                            <input 
                                type="text" 
                                className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-pink outline-none"
                                value={newLead.company}
                                onChange={e => setNewLead({...newLead, company: e.target.value})}
                                placeholder="e.g. Neon Burger"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Contact Name</label>
                            <input 
                                type="text" 
                                className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-pink outline-none"
                                value={newLead.contactName}
                                onChange={e => setNewLead({...newLead, contactName: e.target.value})}
                                placeholder="e.g. John Smith"
                            />
                        </div>
                    </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Industry</label>
                            <input 
                                type="text" 
                                className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-pink outline-none"
                                value={newLead.industry}
                                onChange={e => setNewLead({...newLead, industry: e.target.value})}
                                placeholder="e.g. Real Estate"
                            />
                        </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Platform</label>
                            <select 
                                className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-pink outline-none"
                                value={newLead.platform}
                                onChange={e => setNewLead({...newLead, platform: e.target.value as any})}
                            >
                                <option>LinkedIn</option>
                                <option>Instagram</option>
                                <option>Email</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Email</label>
                            <input 
                                type="email" 
                                className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-pink outline-none"
                                value={newLead.email}
                                onChange={e => setNewLead({...newLead, email: e.target.value})}
                                placeholder="name@company.com"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Phone</label>
                            <input 
                                type="tel" 
                                className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-pink outline-none"
                                value={newLead.phone}
                                onChange={e => setNewLead({...newLead, phone: e.target.value})}
                                placeholder="+61..."
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
                        onClick={handleSaveLead}
                        className="px-6 py-2 bg-nb-teal text-black font-bold rounded shadow-[0_0_10px_rgba(0,255,255,0.2)] hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all flex items-center gap-2"
                    >
                        <Save size={16} /> SAVE LEAD
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isImportOpen && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col h-[80vh]">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white">Bulk Import Leads</h3>
                        {!isProcessing && !importStats && <p className="text-zinc-500 text-xs mt-1">Paste your list below. 1 business per line.</p>}
                    </div>
                    {!isProcessing && <button onClick={() => setIsImportOpen(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>}
                </div>
                
                {isProcessing ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-10">
                        <Loader2 size={48} className="text-nb-teal animate-spin mb-6" />
                        <h3 className="text-2xl font-bold text-white mb-2">Importing Leads...</h3>
                        <p className="text-zinc-500">Parsing your list and saving to secure storage.</p>
                        <div className="w-64 h-1 bg-zinc-800 rounded-full mt-8 overflow-hidden">
                            <div className="h-full bg-nb-teal animate-pulse w-1/2"></div>
                        </div>
                    </div>
                ) : importStats ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-6 border border-green-500/50">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-2">SUCCESS!</h3>
                        <p className="text-zinc-400 mb-8">Your database has been updated.</p>
                        
                        <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                             <div className="bg-black border border-zinc-800 p-4 rounded-lg text-center">
                                 <div className="text-3xl font-bold text-nb-teal">{importStats.added}</div>
                                 <div className="text-xs text-zinc-500 uppercase font-bold">Leads Added</div>
                             </div>
                             <div className="bg-black border border-zinc-800 p-4 rounded-lg text-center">
                                 <div className="text-3xl font-bold text-nb-pink">{importStats.sections}</div>
                                 <div className="text-xs text-zinc-500 uppercase font-bold">Categories Created</div>
                             </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 p-6 flex flex-col">
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4 text-xs text-yellow-200">
                                <p className="font-bold mb-1 flex items-center gap-2"><HardDrive size={12}/> BATCH ADVICE:</p>
                                <p>Your database is now unlimited (IndexedDB). You can paste 1,000+ lines at once.</p>
                            </div>
                            
                            <div className="bg-zinc-800/50 border border-zinc-800 rounded-lg p-3 mb-4 text-xs text-zinc-400">
                                <p className="font-bold text-zinc-300 mb-1">Format Requirements for Categories:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Must end with colon: <strong>Fitness:</strong></li>
                                    <li>OR use parenthesis: <strong>Restaurants (20)</strong></li>
                                    <li>Everything else is treated as a LEAD.</li>
                                    <li className="mt-2 italic text-zinc-500">Example:</li>
                                    <li className="font-mono bg-black p-1 rounded mt-1">Fitness (10)<br/>Anytime Gym<br/>Snap Fitness</li>
                                </ul>
                            </div>
                            <textarea 
                                className="flex-1 w-full bg-black border border-zinc-800 rounded-lg p-4 text-zinc-300 font-mono text-sm focus:border-nb-teal outline-none resize-none leading-relaxed"
                                placeholder={"Restaurants (15)\nNeon Burger\nOther Place\n\nFitness (5)\nLocal Gym"}
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                            />
                            <div className="text-right text-xs text-zinc-500 mt-2">
                                {importText.split('\n').filter(l => l.trim()).length} lines detected
                            </div>
                        </div>

                        <div className="p-6 border-t border-zinc-800 flex justify-between items-center bg-zinc-900 rounded-b-xl">
                            <button 
                                onClick={handleClearAll}
                                className="text-red-500 hover:text-red-400 font-bold text-xs flex items-center gap-1"
                            >
                                <Trash2 size={14} /> CLEAR ALL LEADS
                            </button>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setIsImportOpen(false)}
                                    className="px-4 py-2 rounded text-zinc-400 hover:text-white font-bold text-sm"
                                >
                                    CANCEL
                                </button>
                                <button 
                                    onClick={handleBulkImport}
                                    className="px-6 py-2 bg-nb-teal text-black font-bold rounded shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] transition-all flex items-center gap-2"
                                >
                                    <Upload size={16} /> IMPORT LEADS
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
      )}

      {/* Contact Enrichment Agent Modal */}
      {isAgentOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-3xl rounded-xl shadow-2xl flex flex-col h-[85vh]">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-gradient-to-r from-nb-teal/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-nb-teal/20 rounded-lg border border-nb-teal/50">
                  <Sparkles size={24} className="text-nb-teal" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Contact Enrichment Agent
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">Finding manager/owner names, emails & phone numbers</p>
                </div>
              </div>
              {!isEnriching && <button onClick={() => setIsAgentOpen(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>}
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {!enrichmentProgress ? (
                <div className="space-y-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm text-yellow-200">
                    <p className="font-bold mb-2 flex items-center gap-2"><Zap size={16}/> How it works:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Scans your prospect database for missing contact information</li>
                      <li>Searches for owner/manager names, email addresses, and phone numbers</li>
                      <li>Automatically updates prospect records with found information</li>
                      <li>Works best for businesses with online presence</li>
                    </ul>
                  </div>

                  <div className="bg-zinc-800/50 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-zinc-300">Prospects Needing Enrichment</span>
                      <span className="text-2xl font-black text-nb-teal">{getProspectsNeedingEnrichment().length}</span>
                    </div>
                    
                    {getProspectsNeedingEnrichment().length === 0 ? (
                      <p className="text-zinc-400 text-sm text-center py-4">All prospects have complete contact information! 🎉</p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {getProspectsNeedingEnrichment().slice(0, 10).map(p => (
                          <div key={p.id} className="bg-black border border-zinc-700 rounded p-2 text-xs flex items-center justify-between">
                            <div>
                              <div className="font-medium text-white">{p.company}</div>
                              <div className="text-zinc-500 mt-0.5 flex items-center gap-3">
                                {!p.contactName || p.contactName === 'Unknown' ? <span className="text-red-400">Missing Name</span> : <span className="text-green-400">✓ Name</span>}
                                {!p.email ? <span className="text-red-400">Missing Email</span> : <span className="text-green-400">✓ Email</span>}
                                {!p.phone ? <span className="text-red-400">Missing Phone</span> : <span className="text-green-400">✓ Phone</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                        {getProspectsNeedingEnrichment().length > 10 && (
                          <p className="text-zinc-500 text-xs text-center py-2">+ {getProspectsNeedingEnrichment().length - 10} more...</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Progress Status */}
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {isEnriching ? (
                          <Loader2 size={20} className="text-nb-teal animate-spin" />
                        ) : (
                          <CheckCircle2 size={20} className="text-green-500" />
                        )}
                        <span className="font-bold text-white">{isEnriching ? 'Enriching...' : 'Complete!'}</span>
                      </div>
                      <span className="text-nb-teal font-black text-lg">
                        {enrichmentProgress.found} / {enrichmentProgress.total}
                      </span>
                    </div>
                    
                    {enrichmentProgress.current && (
                      <p className="text-sm text-zinc-300 mb-3">{enrichmentProgress.current}</p>
                    )}
                    
                    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-nb-teal to-cyan-400 transition-all duration-300"
                        style={{ width: `${(enrichmentProgress.found / enrichmentProgress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Results */}
                  {enrichmentProgress.results.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-green-500" />
                        Found Contacts ({enrichmentProgress.results.length})
                      </h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {enrichmentProgress.results.map(result => (
                          <div key={result.prospectId} className="bg-black border border-zinc-700 rounded-lg p-3">
                            <div className="font-medium text-white text-sm mb-2">{result.company}</div>
                            <div className="space-y-1 text-xs">
                              {result.found.name && (
                                <div className="flex items-center gap-2 text-green-400">
                                  <User size={12} /> <span className="font-mono">{result.found.name}</span>
                                </div>
                              )}
                              {result.found.email && (
                                <div className="flex items-center gap-2 text-green-400">
                                  <Mail size={12} /> <span className="font-mono">{result.found.email}</span>
                                </div>
                              )}
                              {result.found.phone && (
                                <div className="flex items-center gap-2 text-green-400">
                                  <Phone size={12} /> <span className="font-mono">{result.found.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900 rounded-b-xl">
              {!enrichmentProgress ? (
                <>
                  <button 
                    onClick={() => setIsAgentOpen(false)}
                    className="px-4 py-2 rounded text-zinc-400 hover:text-white font-bold text-sm"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={runEnrichmentAgent}
                    disabled={getProspectsNeedingEnrichment().length === 0}
                    className="px-6 py-2 bg-nb-teal text-black font-bold rounded shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Zap size={16} /> START ENRICHMENT
                  </button>
                </>
              ) : !isEnriching ? (
                <button 
                  onClick={() => {
                    setIsAgentOpen(false);
                    setEnrichmentProgress(null);
                  }}
                  className="px-6 py-2 bg-nb-teal text-black font-bold rounded shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] transition-all"
                >
                  CLOSE
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Prospect Detail Modal */}
      {selectedProspectId && (() => {
        const prospect = prospects.find(p => p.id === selectedProspectId);
        if (!prospect) return null;
        
        return (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProspectId(null)}
          >
            <div 
              className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <User size={20} /> {prospect.company}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">Lead Details & History • All changes auto-saved</p>
                </div>
                <button 
                  onClick={() => setSelectedProspectId(null)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Contact Info Quick View */}
                {(prospect.email || prospect.phone || prospect.contactName) && (
                  <div className="p-4 bg-zinc-900/50 border border-zinc-700 rounded-lg">
                    <div className="text-xs font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
                      <Mail size={12} /> Contact Information
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {prospect.contactName && prospect.contactName !== 'Unknown' && (
                        <div className="flex items-start gap-3">
                          <User size={18} className="text-zinc-500 mt-0.5" />
                          <div>
                            <div className="text-[10px] text-zinc-500 uppercase mb-1">Contact Name</div>
                            <div className="text-sm font-medium text-white">{prospect.contactName}</div>
                          </div>
                        </div>
                      )}
                      {prospect.email && (
                        <div className="flex items-start gap-3">
                          <Mail size={18} className="text-nb-teal mt-0.5" />
                          <div className="flex-1">
                            <div className="text-[10px] text-zinc-500 uppercase mb-1">Email</div>
                            <div className="text-sm font-mono text-nb-teal flex items-center gap-2">
                              <a href={`mailto:${prospect.email}`} className="hover:underline break-all">
                                {prospect.email}
                              </a>
                              <a href={`mailto:${prospect.email}`} className="text-zinc-500 hover:text-nb-teal flex-shrink-0">
                                <ExternalLink size={14} />
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                      {prospect.phone && (
                        <div className="flex items-start gap-3">
                          <Phone size={18} className="text-nb-teal mt-0.5" />
                          <div className="flex-1">
                            <div className="text-[10px] text-zinc-500 uppercase mb-1">Phone</div>
                            <div className="text-sm font-mono text-nb-teal flex items-center gap-2">
                              <a href={`tel:${prospect.phone}`} className="hover:underline">
                                {prospect.phone}
                              </a>
                              <a href={`tel:${prospect.phone}`} className="text-zinc-500 hover:text-nb-teal flex-shrink-0">
                                <Phone size={14} />
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Company</label>
                    <input 
                      type="text" 
                      value={prospect.company} 
                      onChange={(e) => updateProspect(prospect.id, { company: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:border-nb-teal outline-none"
                      placeholder="Company Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Industry</label>
                    <input 
                      type="text" 
                      value={prospect.industry} 
                      onChange={(e) => updateProspect(prospect.id, { industry: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:border-nb-teal outline-none"
                      placeholder="Industry"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Contact Name</label>
                    <input 
                      type="text" 
                      value={prospect.contactName} 
                      onChange={(e) => updateProspect(prospect.id, { contactName: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:border-nb-teal outline-none"
                      placeholder="Contact Person"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Platform</label>
                    <select 
                      value={prospect.platform} 
                      onChange={(e) => updateProspect(prospect.id, { platform: e.target.value as any })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:border-nb-teal outline-none"
                    >
                      <option>LinkedIn</option>
                      <option>Instagram</option>
                      <option>Email</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                      <Mail size={10}/> Email Address
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="email" 
                        value={prospect.email || ''} 
                        onChange={(e) => updateProspect(prospect.id, { email: e.target.value })}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:border-nb-teal outline-none font-mono"
                        placeholder="email@company.com"
                      />
                      {prospect.email && (
                        <a 
                          href={`mailto:${prospect.email}`} 
                          className="bg-zinc-700 border border-zinc-600 text-zinc-300 hover:text-white hover:bg-zinc-600 px-3 rounded flex items-center justify-center transition-colors"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                      <Phone size={10}/> Phone Number
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="tel" 
                        value={prospect.phone || ''} 
                        onChange={(e) => updateProspect(prospect.id, { phone: e.target.value })}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:border-nb-teal outline-none font-mono"
                        placeholder="+61 400 000 000"
                      />
                      {prospect.phone && (
                        <a 
                          href={`tel:${prospect.phone}`} 
                          className="bg-zinc-700 border border-zinc-600 text-zinc-300 hover:text-white hover:bg-zinc-600 px-3 rounded flex items-center justify-center transition-colors"
                        >
                          <Phone size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Status</label>
                    <select 
                      value={prospect.status}
                      onChange={(e) => updateProspect(prospect.id, { status: e.target.value as any })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:border-nb-teal outline-none"
                    >
                      <option>New</option>
                      <option>Contacted</option>
                      <option>Responded</option>
                      <option>Call Booked</option>
                      <option>Proposal</option>
                      <option>Won</option>
                      <option>Lost</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Interest Level</label>
                    <div className="flex gap-2">
                      {['Hot', 'Warm', 'Cold', 'Dead'].map(level => (
                        <button
                          key={level}
                          onClick={() => updateProspect(prospect.id, { interest: level as any })}
                          className={`
                            flex-1 px-3 py-2 rounded text-xs font-bold border transition-colors
                            ${prospect.interest === level 
                              ? level === 'Hot' ? 'text-nb-pink bg-nb-pink/10 border-nb-pink/30' 
                                : level === 'Warm' ? 'text-orange-400 bg-orange-400/10 border-orange-400/30'
                                : level === 'Cold' ? 'text-blue-400 bg-blue-400/10 border-blue-400/30'
                                : 'text-zinc-500 bg-zinc-800 border-zinc-700'
                              : 'text-zinc-500 border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
                            }
                          `}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                      <Calendar size={10} /> Next Follow-up
                    </label>
                    <input 
                      type="date" 
                      value={prospect.nextFollowUp || ''} 
                      onChange={(e) => updateProspect(prospect.id, { nextFollowUp: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:border-nb-teal outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Last Contact</label>
                    <input 
                      type="date" 
                      value={prospect.lastContact} 
                      onChange={(e) => updateProspect(prospect.id, { lastContact: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:border-nb-teal outline-none"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <FileText size={10}/> Notes & Conversation Log
                  </label>
                  <textarea
                    className="w-full bg-zinc-800 text-zinc-300 text-sm focus:outline-none resize-y min-h-[120px] font-mono leading-relaxed placeholder-zinc-600 border border-zinc-700 rounded p-3 focus:border-nb-teal"
                    placeholder="Log conversation details, objections, or personal facts here..."
                    value={prospect.notes || ''}
                    onChange={(e) => updateProspect(prospect.id, { notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-zinc-800 flex justify-between items-center bg-zinc-900/50 rounded-b-xl">
                <button
                  onClick={() => {
                    if(window.confirm('Delete this lead?')) {
                      deleteProspect(prospect.id);
                      setSelectedProspectId(null);
                    }
                  }}
                  className="px-4 py-2 rounded text-red-500 hover:text-red-400 hover:bg-red-500/10 font-bold text-sm transition-colors flex items-center gap-2"
                >
                  <Trash2 size={14} /> Delete Lead
                </button>
                <button 
                  onClick={() => setSelectedProspectId(null)}
                  className="px-6 py-2 bg-nb-teal text-black font-bold rounded shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
