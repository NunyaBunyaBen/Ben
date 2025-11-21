
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useData } from '../DataContext';
import { Folder, FileText, ChevronRight, Upload, Plus, Trash2, ArrowLeft, FileImage, Film, HardDrive, Copy, ExternalLink, Link, Search, Package as PackageIcon, Calendar as CalendarIcon, Settings2, Clock, X } from 'lucide-react';
import { UploadedFile, PackageDefinition, PageType } from '../types';
import { ROOT_FOLDERS, STRUCTURE_TEMPLATES, MONTHLY_TEMPLATE, MONTHS_LIST } from '../constants';
import { FilePreviewModal } from './FilePreviewModal';

interface ClientPortalProps {
  clientId: string;
  onBack?: () => void;
  onNavigate?: (pageId: string, pageType: PageType, clientFilter?: string) => void;
}

type DisplayFolder = {
  id: string;
  name: string;
  isRoot?: boolean;
};

type PackageDraft = Omit<PackageDefinition, 'id'> & { id?: string };

const draftId = () => Math.random().toString(36).substring(2, 9);
const EVENT_TYPES = [
  { value: 'meeting', label: '👥 Meeting' },
  { value: 'shoot', label: '📸 Shoot' },
  { value: 'post', label: '📝 Content' },
  { value: 'followup', label: '👋 Follow-up' },
  { value: 'outreach', label: '📞 Outreach' },
];

export const ClientPortal: React.FC<ClientPortalProps> = ({ clientId, onBack, onNavigate }) => {
  const { 
    clients, 
    updateClient, 
    clientFiles, 
    addClientFile, 
    deleteClientFile, 
    clientFolders, 
    addClientFolder, 
    deleteClientFolder,
    folderOrders,
    updateFolderOrder,
    packages,
    addPackage,
    updatePackage,
    deletePackage,
    assignPackageToClient,
    removePackageAssignment
  } = useData();
  const client = clients.find(c => c.id === clientId);
  
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const suppressClickRef = useRef(false);
  
  // Preview State
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isManagePackagesOpen, setIsManagePackagesOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string>(packages[0]?.id || '');
  const [assignmentStartDate, setAssignmentStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAssigningPackage, setIsAssigningPackage] = useState(false);
  const [packageDraft, setPackageDraft] = useState<PackageDraft | null>(null);
  const [isSavingPackage, setIsSavingPackage] = useState(false);

  const clonePackageDraft = (pkg: PackageDefinition): PackageDraft => ({
    id: pkg.id,
    name: pkg.name,
    description: pkg.description || '',
    price: pkg.price ?? 0,
    tasks: pkg.tasks.map(task => ({ ...task }))
  });

  const createBlankPackageDraft = (): PackageDraft => ({
    name: '',
    description: '',
    price: 0,
    tasks: [{ id: draftId(), title: 'Kickoff Strategy Call', type: 'meeting', offsetDays: 0 }]
  });

  useEffect(() => {
    if (!selectedPackageId && packages.length) {
        setSelectedPackageId(packages[0].id);
    }
  }, [packages, selectedPackageId]);

  useEffect(() => {
    if (isManagePackagesOpen) {
        if (!packageDraft && packages.length) {
            setPackageDraft(clonePackageDraft(packages[0]));
        }
    } else {
        setPackageDraft(null);
        setIsSavingPackage(false);
    }
  }, [isManagePackagesOpen, packageDraft, packages]);

  // Auto-Generate Structure on Navigation
  useEffect(() => {
    const currentPathString = currentPath.join('/');

    // Level 1: Main Root Folders (e.g. 01_Brand Assets)
    if (currentPath.length === 1) {
        const currentFolder = currentPath[0];
        const template = STRUCTURE_TEMPLATES[currentFolder];
        
        if (template) {
            template.forEach(subFolder => {
                const exists = clientFolders.some(f => f.clientId === clientId && f.path === currentPathString && f.name === subFolder);
                if (!exists) {
                    addClientFolder({ clientId, name: subFolder, path: currentPathString });
                }
            });
        }
    }

    // Level 2: Years inside Monthly Content (e.g. 03_Monthly Content/2025)
    if (currentPath.length === 2 && currentPath[0] === '03_Monthly Content') {
        const year = currentPath[1]; // e.g. "2025"
        const shortYear = year.slice(-2); // "25"
        
        MONTHS_LIST.forEach(monthBase => {
            const folderName = `${monthBase}${shortYear}`; // e.g. "01_January25"
            const exists = clientFolders.some(f => f.clientId === clientId && f.path === currentPathString && f.name === folderName);
            if (!exists) {
                addClientFolder({ clientId, name: folderName, path: currentPathString });
            }
        });
    }

    // Level 3: Inside a Month folder (e.g. 01_January25)
    if (currentPath.length === 3 && currentPath[0] === '03_Monthly Content') {
         MONTHLY_TEMPLATE.forEach(subFolder => {
             const exists = clientFolders.some(f => f.clientId === clientId && f.path === currentPathString && f.name === subFolder);
             if (!exists) {
                 addClientFolder({ clientId, name: subFolder, path: currentPathString });
             }
         });
    }

  }, [currentPath, clientId, clientFolders, addClientFolder]);

  if (!client) return <div>Client not found</div>;

  const currentPathString = currentPath.join('/');
  const currentFolderName = currentPath[currentPath.length - 1];

  // Visibility Logic
  const rawFolders: DisplayFolder[] = currentPath.length === 0 
    ? ROOT_FOLDERS.map(name => ({ id: name, name, isRoot: true }))
    : clientFolders
        .filter(f => f.clientId === clientId && f.path === currentPathString)
        .map(f => ({ id: f.id, name: f.name, isRoot: false }));

  const folderOrderKey = `${clientId}::${currentPathString || 'ROOT'}`;
  const priorityOrder = folderOrders[folderOrderKey];

  const orderedFolders = useMemo(() => {
    if (!priorityOrder || priorityOrder.length === 0) return rawFolders;
    const priorityMap = new Map(priorityOrder.map((id, index) => [id, index]));
    const fallbackMap = new Map(rawFolders.map((folder, index) => [folder.id, index]));
    const baseOffset = priorityOrder.length;
    return [...rawFolders].sort((a, b) => {
      const rankA = priorityMap.has(a.id) ? priorityMap.get(a.id)! : baseOffset + (fallbackMap.get(a.id) ?? 0);
      const rankB = priorityMap.has(b.id) ? priorityMap.get(b.id)! : baseOffset + (fallbackMap.get(b.id) ?? 0);
      return rankA - rankB;
    });
  }, [rawFolders, priorityOrder]);

  const packageLookup = useMemo(() => {
    const map: Record<string, PackageDefinition> = {};
    packages.forEach(pkg => { map[pkg.id] = pkg; });
    return map;
  }, [packages]);
  const clientAssignments = client.packageAssignments || [];
  const selectedPackage = selectedPackageId ? packageLookup[selectedPackageId] : undefined;

  const visibleFiles = clientFiles.filter(f => f.clientId === clientId && (f.folderPath || '') === currentPathString);

  const handleFolderClick = (folderName: string) => {
    if (suppressClickRef.current) return;
    setCurrentPath([...currentPath, folderName]);
  };
  const handleDragStart = (folderId: string) => {
    setDraggingFolderId(folderId);
  };

  const handleDragEnd = () => {
    setDraggingFolderId(null);
  };

  const handleFolderReorder = (targetId: string) => {
    if (!draggingFolderId || draggingFolderId === targetId) return;
    const baseOrder = orderedFolders.map(folder => folder.id);
    const fromIndex = baseOrder.indexOf(draggingFolderId);
    const toIndex = baseOrder.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const nextOrder = [...baseOrder];
    const [moved] = nextOrder.splice(fromIndex, 1);
    nextOrder.splice(toIndex, 0, moved);
    suppressClickRef.current = true;
    updateFolderOrder(clientId, currentPathString, nextOrder);
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 200);
    setDraggingFolderId(null);
  };


  const handleBreadcrumbClick = (index: number) => {
    setCurrentPath(currentPath.slice(0, index + 1));
  };

  const handleGoRoot = () => {
    setCurrentPath([]);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setIsUploading(true);
      const files: File[] = Array.from(e.target.files);

      for (const file of files) {
          if (file.size > 1500000) {
              alert(`File "${file.name}" is too large (>1.5MB). Please upload smaller files.`);
              continue;
          }

          const reader = new FileReader();
          reader.onload = (event) => {
              const base64String = event.target?.result as string;
              
              const newFile: UploadedFile = {
                id: Math.random().toString(36).substring(7),
                name: file.name,
                size: file.size,
                type: file.type,
                uploadDate: new Date().toLocaleDateString(),
                clientId,
                folderPath: currentPathString,
                data: base64String
              };
              addClientFile(newFile);
          };
          reader.readAsDataURL(file);
      }
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddLink = () => {
      const url = prompt("Enter the external URL (e.g. Google Drive Link, Loom Video, Dropbox):");
      if (url) {
          const name = prompt("Enter a name for this link:", "New Link");
          if (name) {
              const newFile: UploadedFile = {
                  id: Math.random().toString(36).substring(7),
                  name: name,
                  size: 0,
                  type: 'link',
                  uploadDate: new Date().toLocaleDateString(),
                  clientId,
                  folderPath: currentPathString,
                  linkUrl: url
              };
              addClientFile(newFile);
          }
      }
  };

  const handleCreateFolder = () => {
    const name = prompt("Enter folder name:");
    if (name) {
      addClientFolder({
        clientId,
        name,
        path: currentPathString
      });
    }
  };

  const handleConnectDrive = () => {
      const url = prompt("Paste the Main Google Drive Folder URL for this client:");
      if (url) {
          updateClient(client.id, { driveUrl: url });
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

  const openAssignModal = () => {
      if (!packages.length) return;
      setSelectedPackageId(packages[0].id);
      setAssignmentStartDate(new Date().toISOString().split('T')[0]);
      setIsAssignModalOpen(true);
  };

  const handleAssignPackageSubmit = async () => {
      if (!selectedPackageId || !assignmentStartDate) return;
      setIsAssigningPackage(true);
      try {
          await assignPackageToClient(clientId, selectedPackageId, assignmentStartDate);
          setIsAssignModalOpen(false);
      } catch (e) {
          console.error(e);
      } finally {
          setIsAssigningPackage(false);
      }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
      if (window.confirm('Remove this package and its scheduled tasks?')) {
          await removePackageAssignment(clientId, assignmentId);
      }
  };

  const startEditingPackage = (pkg?: PackageDefinition) => {
      setPackageDraft(pkg ? clonePackageDraft(pkg) : createBlankPackageDraft());
  };

  const updateDraftField = (field: keyof PackageDraft, value: string | number) => {
      setPackageDraft(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const updateDraftTask = (taskId: string, field: 'title' | 'type' | 'offsetDays', value: string | number) => {
      setPackageDraft(prev => {
          if (!prev) return prev;
          return {
              ...prev,
              tasks: prev.tasks.map(task => 
                  task.id === taskId 
                    ? { ...task, [field]: field === 'offsetDays' ? Number(value) : value }
                    : task
              )
          };
      });
  };

  const addDraftTask = () => {
      setPackageDraft(prev => prev ? ({ ...prev, tasks: [...prev.tasks, { id: draftId(), title: 'New Task', type: 'shoot', offsetDays: 7 }] }) : prev);
  };

  const removeDraftTask = (taskId: string) => {
      setPackageDraft(prev => {
          if (!prev) return prev;
          const filtered = prev.tasks.filter(task => task.id !== taskId);
          return {
              ...prev,
              tasks: filtered.length ? filtered : [{ id: draftId(), title: 'Kickoff Strategy Call', type: 'meeting', offsetDays: 0 }]
          };
      });
  };

  const savePackageDraft = async () => {
      if (!packageDraft) return;
      if (!packageDraft.name.trim()) {
          alert('Package name is required');
          return;
      }
      const normalizedTasks = packageDraft.tasks
        .filter(task => task.title.trim().length > 0)
        .map(task => ({ ...task, offsetDays: Number.isFinite(task.offsetDays) ? task.offsetDays : 0 }));
      if (normalizedTasks.length === 0) {
          alert('Add at least one task to the package');
          return;
      }
      setIsSavingPackage(true);
      try {
          if (packageDraft.id) {
              await updatePackage(packageDraft.id, {
                  name: packageDraft.name.trim(),
                  description: packageDraft.description?.trim(),
                  price: Number(packageDraft.price) || 0,
                  tasks: normalizedTasks
              });
          } else {
              await addPackage({
                  name: packageDraft.name.trim(),
                  description: packageDraft.description?.trim(),
                  price: Number(packageDraft.price) || 0,
                  tasks: normalizedTasks
              });
          }
          setPackageDraft(null);
      } catch (e) {
          console.error(e);
      } finally {
          setIsSavingPackage(false);
      }
  };

  const deletePackageDraft = async () => {
      if (!packageDraft?.id) return;
      if (window.confirm('Delete this package? All scheduled tasks from it will be removed.')) {
          await deletePackage(packageDraft.id);
          setPackageDraft(null);
      }
  };

  // Helper to generate a Smart Drive Search URL
  const getDriveSearchUrl = () => {
      if (!client.driveUrl) return null;
      
      // If we are at root, return main link
      if (currentPath.length === 0) return client.driveUrl;

      // Try to extract ID (simple regex for standard drive URLs)
      // Matches /folders/ID
      const match = client.driveUrl.match(/\/folders\/([a-zA-Z0-9-_]+)/);
      const rootId = match ? match[1] : null;

      // If deep in folder, search for that folder name
      // We search for: name = 'CurrentFolderName'
      // This is the "Smart" part. It assumes you named them the same in Drive.
      const query = encodeURIComponent(`name = '${currentFolderName}'`);
      return `https://drive.google.com/drive/u/0/search?q=${query}`;
  };

  const driveSearchUrl = getDriveSearchUrl();

  const formatFriendlyDate = (iso: string) => {
    if (!iso) return 'Not scheduled';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const previewTaskDate = (offset: number) => {
    if (!assignmentStartDate) return 'Pick start date';
    const base = new Date(assignmentStartDate);
    if (Number.isNaN(base.getTime())) return 'Pick start date';
    base.setDate(base.getDate() + offset);
    return base.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getFileIcon = (type: string) => {
    if (type === 'link') return <Link size={24} className="text-blue-400" />;
    if (type.includes('image')) return <FileImage size={24} className="text-nb-pink" />;
    if (type.includes('video')) return <Film size={24} className="text-nb-teal" />;
    return <FileText size={24} className="text-zinc-400" />;
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      
      <FilePreviewModal 
        file={previewFile} 
        onClose={() => setPreviewFile(null)} 
        onDelete={deleteClientFile}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-nb-pink to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-[0_0_15px_rgba(255,0,255,0.3)]">
            {client.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
               {client.name} Portal
            </h2>
            <p className="text-zinc-500 text-sm flex items-center gap-2">
               {currentPath.length === 0 ? 'Root Directory' : `/${currentPathString}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onNavigate && (
            <button 
              onClick={() => onNavigate('content-monthly', PageType.CALENDAR, client.name)}
              className="bg-nb-teal text-black font-bold px-4 py-2 rounded-md hover:bg-teal-400 transition-colors shadow-[0_0_15px_rgba(0,255,255,0.3)] flex items-center gap-2"
              title="View Content Calendar"
            >
              <CalendarIcon size={18} /> View Calendar
            </button>
          )}
          {onBack && (
            <button onClick={onBack} className="text-zinc-500 hover:text-white flex items-center gap-1 text-sm font-bold">
              <ArrowLeft size={16} /> BACK
            </button>
          )}
        </div>
      </div>
      
      {/* Assign Package Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Assign Package</h3>
                <p className="text-xs text-zinc-500 mt-1">Automatically schedules each task inside the main calendar.</p>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Package</label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-pink outline-none"
                >
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                  ))}
                </select>
                {!packages.length && (
                  <p className="text-xs text-zinc-500">Create a package first from the manager.</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Start Date</label>
                <input
                  type="date"
                  value={assignmentStartDate}
                  onChange={(e) => setAssignmentStartDate(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-pink outline-none"
                />
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-zinc-500 mb-2">Task Preview</div>
                {selectedPackage?.tasks?.length ? (
                  <div className="bg-black/40 border border-zinc-800 rounded-lg max-h-60 overflow-y-auto divide-y divide-zinc-800/70">
                    {selectedPackage.tasks.map(task => (
                      <div key={task.id} className="p-3 flex justify-between items-center text-sm">
                        <div>
                          <div className="text-white font-semibold">{task.title}</div>
                          <div className="text-[11px] uppercase tracking-wide text-zinc-500">{task.type}</div>
                        </div>
                        <div className="text-right text-xs text-zinc-400">
                          <div>{previewTaskDate(task.offsetDays)}</div>
                          <div>Day +{task.offsetDays}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-lg p-3">
                    This package has no tasks yet. Add tasks from the Package Manager first.
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
              <button 
                onClick={() => setIsAssignModalOpen(false)} 
                className="px-4 py-2 text-zinc-400 hover:text-white text-sm font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignPackageSubmit}
                disabled={!packages.length || !selectedPackageId || isAssigningPackage}
                className="px-5 py-2 rounded bg-nb-pink text-white font-bold text-sm shadow-[0_0_12px_rgba(255,0,255,0.3)] disabled:opacity-50"
              >
                {isAssigningPackage ? 'Scheduling...' : 'Assign & Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Package Manager Modal */}
      {isManagePackagesOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-5xl max-h-[90vh] shadow-2xl flex flex-col">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Package Library</h3>
                <p className="text-xs text-zinc-500 mt-1">Define packages once and reuse them for every client.</p>
              </div>
              <button onClick={() => setIsManagePackagesOpen(false)} className="text-zinc-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid gap-6 lg:grid-cols-[260px,1fr]">
              <div>
                <button
                  onClick={() => startEditingPackage()}
                  className="w-full px-3 py-2 rounded border border-zinc-700 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 flex items-center gap-2 justify-center"
                >
                  <Plus size={14} /> New Package
                </button>
                <div className="mt-4 space-y-2">
                  {packages.map(pkg => (
                    <button
                      key={pkg.id}
                      onClick={() => startEditingPackage(pkg)}
                      className={`w-full text-left px-3 py-2 rounded border text-sm transition-colors ${packageDraft?.id === pkg.id ? 'border-nb-pink text-white' : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
                    >
                      <div className="font-semibold">{pkg.name}</div>
                      <div className="text-[11px] text-zinc-500">{pkg.tasks.length} tasks • ${pkg.price?.toLocaleString() || '0'}/mo</div>
                    </button>
                  ))}
                  {packages.length === 0 && (
                    <div className="text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-lg p-3 text-center">
                      No packages yet. Create one to get started.
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-black/40 border border-zinc-800 rounded-xl p-4">
                {packageDraft ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Name</label>
                        <input
                          type="text"
                          value={packageDraft.name}
                          onChange={(e) => updateDraftField('name', e.target.value)}
                          className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-pink outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Monthly Price</label>
                        <input
                          type="number"
                          value={packageDraft.price ?? 0}
                          onChange={(e) => updateDraftField('price', Number(e.target.value))}
                          className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-pink outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 uppercase">Description</label>
                      <textarea
                        value={packageDraft.description || ''}
                        onChange={(e) => updateDraftField('description', e.target.value)}
                        rows={3}
                        className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-pink outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Tasks</label>
                        <button
                          onClick={addDraftTask}
                          className="text-xs font-bold text-nb-teal hover:text-white flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Task
                        </button>
                      </div>
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {packageDraft.tasks.map(task => (
                          <div key={task.id} className="border border-zinc-800 rounded-lg p-3 bg-zinc-900/40 space-y-2">
                            <div className="flex justify-between items-center gap-2">
                              <input
                                type="text"
                                value={task.title}
                                onChange={(e) => updateDraftTask(task.id, 'title', e.target.value)}
                                className="flex-1 bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-pink outline-none text-sm"
                                placeholder="Task name"
                              />
                              <button onClick={() => removeDraftTask(task.id)} className="text-zinc-600 hover:text-red-500">
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <select
                                value={task.type}
                                onChange={(e) => updateDraftTask(task.id, 'type', e.target.value)}
                                className="bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-pink outline-none text-sm"
                              >
                                {EVENT_TYPES.map(option => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                              <div>
                                <label className="text-[10px] uppercase font-bold text-zinc-500">Day Offset</label>
                                <input
                                  type="number"
                                  value={task.offsetDays}
                                  onChange={(e) => updateDraftTask(task.id, 'offsetDays', Number(e.target.value))}
                                  className="w-full bg-black border border-zinc-800 rounded p-2 text-white focus:border-nb-pink outline-none text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center gap-3">
                      {packageDraft.id && (
                        <button
                          onClick={deletePackageDraft}
                          className="text-xs font-bold text-red-400 hover:text-red-300"
                        >
                          Delete Package
                        </button>
                      )}
                      <div className="ml-auto flex gap-3">
                        <button
                          onClick={() => setIsManagePackagesOpen(false)}
                          className="px-4 py-2 text-zinc-400 hover:text-white text-sm font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={savePackageDraft}
                          disabled={isSavingPackage}
                          className="px-5 py-2 rounded bg-nb-pink text-white font-bold text-sm shadow-[0_0_12px_rgba(255,0,255,0.3)] disabled:opacity-50"
                        >
                          {isSavingPackage ? 'Saving...' : 'Save Package'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-zinc-500">
                    Select a package to edit or create a new template. Tasks you add here will automatically populate the calendar when assigned.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Connection Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 mb-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
              <div className={`p-2 rounded ${client.driveUrl ? 'bg-blue-900/20 text-blue-400' : 'bg-zinc-800 text-zinc-500'}`}>
                  <HardDrive size={18} />
              </div>
              <div>
                  <div className="text-xs font-bold uppercase text-zinc-400">Google Drive Status</div>
                  <div className={`text-sm font-bold ${client.driveUrl ? 'text-white' : 'text-zinc-600'}`}>
                      {client.driveUrl ? 'Connected' : 'Not Linked'}
                  </div>
              </div>
          </div>
          <div className="flex gap-2">
              <button onClick={handleCopyStructure} className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 flex items-center gap-2 border border-zinc-700">
                  <Copy size={12} /> COPY FOLDER LIST
              </button>
              {client.driveUrl ? (
                  <a href={client.driveUrl} target="_blank" rel="noreferrer" className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-[0_0_10px_rgba(37,99,235,0.3)]">
                      <ExternalLink size={14} /> OPEN REAL DRIVE
                  </a>
              ) : (
                  <button onClick={handleConnectDrive} className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 flex items-center gap-2 border border-zinc-700">
                      <Link size={12} /> CONNECT DRIVE
                  </button>
              )}
          </div>
      </div>

      {/* Packages & Retainers */}
      <div className="bg-black/30 border border-zinc-800 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                  <div className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-2">
                      <PackageIcon size={14} /> Packages & Retainers
                  </div>
                  <p className="text-sm text-zinc-500">Assign packages to auto-schedule tasks into the calendar.</p>
              </div>
              <div className="flex gap-2">
                  <button 
                      onClick={() => setIsManagePackagesOpen(true)} 
                      className="px-3 py-1.5 rounded border border-zinc-700 bg-zinc-900/60 text-xs font-bold text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                  >
                      <Settings2 size={14} /> Manage Packages
                  </button>
                  <button 
                      onClick={openAssignModal}
                      disabled={!packages.length}
                      className="px-3 py-1.5 rounded bg-nb-pink text-white text-xs font-bold shadow-[0_0_10px_rgba(255,0,255,0.3)] hover:bg-pink-500 disabled:opacity-50 flex items-center gap-2"
                  >
                      <Plus size={14} /> Assign Package
                  </button>
              </div>
          </div>
          {clientAssignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {clientAssignments.map(assignment => {
                      const pkg = packageLookup[assignment.packageId];
                      return (
                          <div key={assignment.id} className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/40">
                              <div className="flex justify-between items-start gap-3">
                                  <div>
                                      <div className="text-white font-bold text-sm">{pkg?.name || 'Package'}</div>
                                      <p className="text-xs text-zinc-500 mt-1">{pkg?.description || 'Automated workflow'}</p>
                                  </div>
                                  <button 
                                      onClick={() => handleRemoveAssignment(assignment.id)}
                                      className="text-zinc-600 hover:text-red-500 transition-colors"
                                      title="Remove package from client"
                                  >
                                      <Trash2 size={14} />
                                  </button>
                              </div>
                              <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-400">
                                  <span className="flex items-center gap-1">
                                      <CalendarIcon size={12} /> Start {formatFriendlyDate(assignment.startDate)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                      <Clock size={12} /> {(pkg?.tasks?.length ?? 0)} tasks
                                  </span>
                              </div>
                          </div>
                      );
                  })}
              </div>
          ) : (
              <div className="mt-4 border border-dashed border-zinc-800 rounded-lg p-4 text-center text-sm text-zinc-500">
                  No packages assigned yet. Use "Assign Package" to instantly schedule work.
              </div>
          )}
      </div>

      {/* File Explorer */}
      <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
           <div className="flex items-center gap-2 text-sm overflow-x-auto">
              <button onClick={handleGoRoot} className={`font-bold hover:text-nb-teal ${currentPath.length === 0 ? 'text-white' : 'text-zinc-500'}`}>
                 ROOT
              </button>
              {currentPath.map((folder, idx) => (
                 <React.Fragment key={idx}>
                    <ChevronRight size={14} className="text-zinc-600" />
                    <button 
                        onClick={() => handleBreadcrumbClick(idx)}
                        className={`font-bold hover:text-nb-teal whitespace-nowrap ${idx === currentPath.length - 1 ? 'text-white' : 'text-zinc-500'}`}
                    >
                        {folder}
                    </button>
                 </React.Fragment>
              ))}
           </div>

           <div className="flex gap-2">
              {/* SMART DRIVE SEARCH BUTTON */}
              {driveSearchUrl && currentPath.length > 0 && (
                  <a 
                    href={driveSearchUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-colors"
                    title="Search for this folder name in your Google Drive"
                  >
                    <Search size={14} /> FIND IN DRIVE
                  </a>
              )}

              <button 
                onClick={handleAddLink}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-colors border border-zinc-700"
              >
                <Link size={14} /> ADD LINK
              </button>
              <button 
                onClick={handleCreateFolder}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-colors border border-zinc-700"
              >
                <Plus size={14} /> FOLDER
              </button>
              <button 
                 onClick={() => fileInputRef.current?.click()}
                 disabled={isUploading}
                 className="bg-nb-pink hover:bg-pink-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-colors shadow-[0_0_10px_rgba(255,0,255,0.3)] disabled:opacity-50"
              >
                 <Upload size={14} /> {isUploading ? 'UPLOADING...' : 'UPLOAD'}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleUpload} />
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
            
            {/* Empty State */}
            {orderedFolders.length === 0 && visibleFiles.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-zinc-800/50 rounded-xl">
                    <Folder size={48} className="mx-auto text-zinc-700 mb-4" />
                    <p className="text-zinc-500 font-bold mb-4">This folder is empty.</p>
                    <div className="flex justify-center gap-4">
                         <button onClick={() => fileInputRef.current?.click()} className="text-zinc-400 text-sm hover:text-white underline">
                            Upload files
                        </button>
                        <button onClick={handleAddLink} className="text-zinc-400 text-sm hover:text-white underline">
                            Add Link
                        </button>
                    </div>
                </div>
            )}

            {/* Folders Grid */}
            {orderedFolders.length > 0 && (
               <div className="mb-8">
                   <h4 className="text-xs font-bold text-zinc-500 uppercase mb-4">Folders</h4>
                   <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
                      {orderedFolders.map(folder => (
                          <div 
                             key={folder.id} 
                             onClick={() => handleFolderClick(folder.name)}
                             draggable={orderedFolders.length > 1}
                             onDragStart={() => handleDragStart(folder.id)}
                             onDragEnd={handleDragEnd}
                             onDragOver={(e) => e.preventDefault()}
                             onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleFolderReorder(folder.id);
                             }}
                             className={`bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:border-nb-teal/50 hover:bg-zinc-800 cursor-pointer transition-all group flex flex-col items-center text-center aspect-square justify-center relative shadow-sm ${draggingFolderId === folder.id ? 'opacity-70 scale-95' : ''}`}
                          >
                              <Folder size={40} className="text-zinc-600 group-hover:text-nb-teal mb-3 transition-colors" fill="currentColor" fillOpacity={0.1} />
                              <span className="text-sm font-bold text-zinc-300 group-hover:text-white break-words w-full px-2">{folder.name}</span>
                              {!folder.isRoot && (
                                 <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if(window.confirm("Delete folder?")) deleteClientFolder(folder.id);
                                    }}
                                    className="absolute top-2 right-2 text-zinc-700 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                 >
                                     <Trash2 size={14} />
                                 </button>
                              )}
                          </div>
                      ))}
                   </div>
               </div>
            )}

            {/* Files Grid */}
            {visibleFiles.length > 0 && (
               <div>
                   <h4 className="text-xs font-bold text-zinc-500 uppercase mb-4">Files & Links</h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
                       {visibleFiles.map(file => (
                           <div 
                                key={file.id} 
                                onClick={() => setPreviewFile(file)}
                                className="bg-black border border-zinc-800 rounded-lg p-3 flex items-center gap-3 group hover:border-nb-pink/50 hover:bg-zinc-900 cursor-pointer transition-all relative"
                            >
                               <div className="w-10 h-10 bg-zinc-900 rounded flex items-center justify-center">
                                   {getFileIcon(file.type)}
                               </div>
                               <div className="flex-1 min-w-0">
                                   <div className="text-sm font-medium text-zinc-200 truncate group-hover:text-white" title={file.name}>{file.name}</div>
                                   <div className="text-xs text-zinc-500">
                                       {file.linkUrl ? 'External Link' : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                                   </div>
                               </div>
                               <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 bg-black p-1 rounded border border-zinc-800">
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); deleteClientFile(file.id); }} 
                                     className="text-zinc-500 hover:text-red-500 p-1"
                                     title="Delete"
                                   >
                                      <Trash2 size={14} />
                                   </button>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
            )}
        </div>
      </div>
    </div>
  );
};
