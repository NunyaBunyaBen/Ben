
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Prospect, DailyProgress, DataContextType, PageContent, Client, CalendarEvent, KanbanItem, Invoice, Transaction, ImportResult, UploadedFile, ClientFolder, SaveStatus, Reminder, PackageDefinition, IntegrationSubscription, ApiKeyEntry, ClientContentPlan } from './types';
import { INITIAL_PROSPECTS, INITIAL_CONTENT, INITIAL_CLIENTS, INITIAL_CALENDAR_EVENTS, INITIAL_KANBAN_ITEMS, DEFAULT_PACKAGES } from './constants';
import { Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';

if (!isSupabaseConfigured) {
  console.warn('[NBHQ] Supabase environment variables missing. Data will only persist locally.');
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

const STORES = [
  'prospects', 'clients', 'kanban', 'calendar', 'dailyProgress', 
  'content', 'files', 'folders', 'invoices', 'transactions', 'reminders', 'folderOrders', 'packages', 'subscriptions', 'apiKeys', 'contentPlans'
];

const supabaseTable = 'app_state';

const supabaseRead = async (key: string): Promise<any> => {
  if (!supabase || !isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from(supabaseTable)
    .select('data')
    .eq('id', key)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error(`Supabase read error (${key})`, error);
    return null;
  }
  return data?.data ?? null;
};

const supabaseWrite = async (key: string, value: any): Promise<void> => {
  if (!supabase || !isSupabaseConfigured) return;
  const { error } = await supabase
    .from(supabaseTable)
    .upsert({ id: key, data: value });
  if (error) {
    console.error(`Supabase write error (${key})`, error);
    throw error;
  }
};

const supabaseDelete = async (key: string): Promise<void> => {
  if (!supabase || !isSupabaseConfigured) return;
  const { error } = await supabase
    .from(supabaseTable)
    .delete()
    .eq('id', key);
  if (error) console.error(`Supabase delete error (${key})`, error);
};

const createId = () => Math.random().toString(36).substr(2, 9);

interface DataProviderProps {
  children: React.ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [storageUsage, setStorageUsage] = useState<string>('0.0');

  // State
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [kanbanItems, setKanbanItems] = useState<KanbanItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [dailyProgress, setDailyProgress] = useState<Record<string, DailyProgress>>({});
  const [pageContent, setPageContent] = useState<Record<string, PageContent>>({});
  const [clientFiles, setClientFiles] = useState<UploadedFile[]>([]);
  const [clientFolders, setClientFolders] = useState<ClientFolder[]>([]);
  const [folderOrders, setFolderOrders] = useState<Record<string, string[]>>({});
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [packages, setPackages] = useState<PackageDefinition[]>([]);
  const [subscriptions, setSubscriptions] = useState<IntegrationSubscription[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
  const [contentPlans, setContentPlans] = useState<Record<string, ClientContentPlan>>({});

  const calculateStorage = useCallback(async () => {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage) {
        const mbUsed = (estimate.usage / 1024 / 1024).toFixed(2);
        setStorageUsage(mbUsed);
      }
    }
  }, []);

  useEffect(() => {
    calculateStorage();
    const interval = setInterval(calculateStorage, 10000);
    return () => clearInterval(interval);
  }, [calculateStorage]);

  // --- PERSISTENCE ENGINES ---

  // 1. IMMEDIATE SAVE + DUAL WRITE
  const saveImmediate = async (key: string, data: any) => {
    setSaveStatus('saving');
    try {
        await supabaseWrite(key, data);
        
        // Dual-Write Backup to LocalStorage (Secondary)
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch(e) {
            console.warn("LocalStorage backup full, strictly using IndexedDB now.");
        }

        setSaveStatus('saved');
        calculateStorage();
        setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
        console.error(`Failed to save ${key}`, e);
        setSaveStatus('error');
    }
  };

  // 2. DEBOUNCED SAVE
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveDebounced = useCallback((key: string, data: any) => {
    setSaveStatus('saving');
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    
    saveTimeout.current = setTimeout(async () => {
      try {
        await supabaseWrite(key, data);
        try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
        
        setSaveStatus('saved');
        calculateStorage();
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        console.error("Debounced Write Failed", e);
        setSaveStatus('error');
      }
    }, 1000);
  }, [calculateStorage]);

  // -- HELPER: SMART LOAD --
  const smartLoad = async (key: string, setter: (val: any) => void) => {
      // 1. Try IndexedDB
      let data = await supabaseRead(key);
      
      // 2. Failover: If DB is empty, checks LocalStorage Backup
      if (!data || (Array.isArray(data) && data.length === 0)) {
          const backup = localStorage.getItem(key);
          if (backup) {
              console.log(`Recovering ${key} from Backup Mirror...`);
              try {
                  data = JSON.parse(backup);
                  await supabaseWrite(key, data);
              } catch(e) { console.error(e); }
          }
      }
      
      if (data) setter(data);
  };

  // -- INITIAL LOAD --
  useEffect(() => {
    const loadAll = async () => {
      try {
        let packagesLoaded = false;
        await Promise.all([
            smartLoad('prospects', setProspects),
            smartLoad('clients', setClients),
            smartLoad('kanban', setKanbanItems),
            smartLoad('calendar', setCalendarEvents),
            smartLoad('dailyProgress', setDailyProgress),
            smartLoad('content', (d) => setPageContent(d || INITIAL_CONTENT)),
            smartLoad('files', setClientFiles),
            smartLoad('folders', setClientFolders),
            smartLoad('folderOrders', (data) => setFolderOrders(data || {})),
            smartLoad('invoices', setInvoices),
            smartLoad('transactions', setTransactions),
            smartLoad('reminders', setReminders),
            smartLoad('subscriptions', setSubscriptions),
            smartLoad('apiKeys', setApiKeys),
            smartLoad('contentPlans', (data) => setContentPlans(data || {})),
            smartLoad('packages', (data) => {
              if (data && Array.isArray(data) && data.length > 0) {
                setPackages(data);
                packagesLoaded = true;
              }
            })
        ]);
        
        if (!packagesLoaded) {
          setPackages(DEFAULT_PACKAGES);
          await saveImmediate('packages', DEFAULT_PACKAGES);
        }
        
      } catch (e) {
        console.error("Failed to load DB", e);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  // -- STATE WATCHERS --
  useEffect(() => { if(!loading) saveDebounced('content', pageContent); }, [pageContent, loading, saveDebounced]);
  useEffect(() => { if(!loading) saveDebounced('dailyProgress', dailyProgress); }, [dailyProgress, loading, saveDebounced]);

  const createCalendarEvents = async (eventPayloads: Omit<CalendarEvent, 'id'>[]): Promise<CalendarEvent[]> => {
    if (!eventPayloads || eventPayloads.length === 0) return [];
    const created = eventPayloads.map(payload => ({ ...payload, id: createId() }));
    let nextState: CalendarEvent[] = [];
    setCalendarEvents(prev => {
      nextState = [...prev, ...created];
      return nextState;
    });
    await saveImmediate('calendar', nextState);
    return created;
  };

  const removeCalendarEvents = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    let nextState: CalendarEvent[] = [];
    setCalendarEvents(prev => {
      nextState = prev.filter(event => !idSet.has(event.id));
      return nextState;
    });
    await saveImmediate('calendar', nextState);
  };

  // -- ACTIONS --

  const addClient = async (newClientData: Omit<Client, 'id'>) => {
    const newClient: Client = { ...newClientData, id: Math.random().toString(36).substr(2, 9) };
    const next = [newClient, ...clients];
    setClients(next);
    await saveImmediate('clients', next);
  };
  const updateClient = async (id: string, updates: Partial<Client>) => {
    const next = clients.map(c => c.id === id ? { ...c, ...updates } : c);
    setClients(next);
    await saveImmediate('clients', next);
  };
  const deleteClient = async (id: string) => {
    const next = clients.filter(c => c.id !== id);
    setClients(next);
    await saveImmediate('clients', next);
  };

  const addProspect = async (newProspectData: Omit<Prospect, 'id'>) => {
    const newProspect: Prospect = { ...newProspectData, id: Math.random().toString(36).substr(2, 9) };
    const next = [newProspect, ...prospects];
    setProspects(next);
    await saveImmediate('prospects', next);
  };
  const updateProspect = async (id: string, updates: Partial<Prospect>) => {
    const next = prospects.map(p => p.id === id ? { ...p, ...updates } : p);
    setProspects(next);
    await saveImmediate('prospects', next);
  };
  const deleteProspect = async (id: string) => {
    const next = prospects.filter(p => p.id !== id);
    setProspects(next);
    await saveImmediate('prospects', next);
  };
  const deleteAllProspects = async () => {
    const next: Prospect[] = [];
    setProspects(next);
    await saveImmediate('prospects', next);
  };
  
  const importProspects = (rawText: string): ImportResult => {
    try {
        const lines = rawText.split('\n').filter(l => l.trim().length > 0);
        const newLeads: Prospect[] = [];
        let currentIndustry = 'Uncategorized';
        let sectionCount = 0;
        const timestamp = Date.now();

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) return;
            
            const hasCount = /\(\d+\)/.test(trimmed);
            const endsColon = trimmed.endsWith(':');
            
            if (hasCount || endsColon) {
                let name = trimmed.replace(/[:]$/, '').replace(/\(\d+\)/, '').trim();
                name = name.replace(/\s-\s?$/, '').trim();
                if (name.length > 1) {
                    currentIndustry = name;
                    sectionCount++;
                }
            } else {
                const parts = trimmed.split(',');
                let company = parts[0]?.trim() || 'Unknown';
                let industry = parts[1]?.trim();
                if (!industry) industry = currentIndustry;

                if (company.length > 1) {
                     newLeads.push({
                        id: `imp-${timestamp}-${index}`,
                        company: company.substring(0, 100),
                        contactName: 'Unknown', 
                        industry: industry.substring(0, 50),
                        platform: 'LinkedIn',
                        status: 'New',
                        interest: 'Cold',
                        lastContact: new Date().toISOString().split('T')[0],
                        nextFollowUp: '',
                        notes: 'Imported via bulk tool.'
                    });
                }
            }
        });
        
        const next = [...newLeads, ...prospects];
        setProspects(next);
        saveImmediate('prospects', next);
        return { added: newLeads.length, sections: sectionCount };
    } catch (e) {
        return { added: 0, sections: 0 };
    }
  };

  const addKanbanItem = async (newItemData: Omit<KanbanItem, 'id'>) => {
    const newItem: KanbanItem = { ...newItemData, id: Math.random().toString(36).substr(2, 9) };
    const next = [...kanbanItems, newItem];
    setKanbanItems(next);
    await saveImmediate('kanban', next);
  };
  const updateKanbanItem = async (id: string, updates: Partial<KanbanItem>) => {
    const next = kanbanItems.map(k => k.id === id ? { ...k, ...updates } : k);
    setKanbanItems(next);
    await saveImmediate('kanban', next);
  };
  const deleteKanbanItem = async (id: string) => {
    const next = kanbanItems.filter(k => k.id !== id);
    setKanbanItems(next);
    await saveImmediate('kanban', next);
  };

  const addCalendarEvent = async (newEventData: Omit<CalendarEvent, 'id'>) => {
    const created = await createCalendarEvents([newEventData]);
    return created[0];
  };
  const deleteCalendarEvent = async (id: string) => {
    await removeCalendarEvents([id]);
  };

  const updateDailyTask = (date: string, block: 'morning' | 'afternoon', index: number) => {
    setDailyProgress(prev => {
      const currentDay = prev[date] || { date, morningTasks: new Array(10).fill(false), afternoonTasks: new Array(5).fill(false) };
      const newTasks = block === 'morning' ? [...currentDay.morningTasks] : [...currentDay.afternoonTasks];
      newTasks[index] = !newTasks[index];
      const next = { ...prev, [date]: { ...currentDay, [block === 'morning' ? 'morningTasks' : 'afternoonTasks']: newTasks } };
      saveImmediate('dailyProgress', next);
      return next;
    });
  };

  const savePageContent = (content: PageContent) => {
    setPageContent(prev => ({ ...prev, [content.id]: content }));
  };
  
  const savePageContentImmediate = async (content: PageContent) => {
     setPageContent(prev => ({ ...prev, [content.id]: content }));
     await saveImmediate('content', { ...pageContent, [content.id]: content });
  };

  const addClientFile = async (file: UploadedFile) => {
      const next = [...clientFiles, file];
      setClientFiles(next);
      await saveImmediate('files', next);
  };
  const deleteClientFile = async (id: string) => {
      const next = clientFiles.filter(f => f.id !== id);
      setClientFiles(next);
      await saveImmediate('files', next);
  };
  const addClientFolder = async (folderData: Omit<ClientFolder, 'id'>) => {
      const folder: ClientFolder = { ...folderData, id: Math.random().toString(36).substr(2, 9) };
      const next = [...clientFolders, folder];
      setClientFolders(next);
      await saveImmediate('folders', next);
  };
  const deleteClientFolder = async (id: string) => {
      const next = clientFolders.filter(f => f.id !== id);
      setClientFolders(next);
      await saveImmediate('folders', next);
  };

  const folderOrderKey = (clientId: string, path: string) => `${clientId}::${path || 'ROOT'}`;

  const updateFolderOrder = (clientId: string, path: string, order: string[]) => {
      setFolderOrders(prev => {
          const key = folderOrderKey(clientId, path);
          const next = { ...prev, [key]: order };
          saveImmediate('folderOrders', next);
          return next;
      });
  };

  const formatDateString = (date: Date) => date.toISOString().split('T')[0];
  const shiftDate = (date: Date, offset: number) => {
      const next = new Date(date);
      next.setDate(next.getDate() + offset);
      return next;
  };

  const addPackage = async (pkgData: Omit<PackageDefinition, 'id'>) => {
      const pkg: PackageDefinition = { ...pkgData, id: createId() };
      const next = [...packages, pkg];
      setPackages(next);
      await saveImmediate('packages', next);
      return pkg;
  };

  const updatePackage = async (id: string, updates: Partial<PackageDefinition>) => {
      const next = packages.map(pkg => pkg.id === id ? { ...pkg, ...updates } : pkg);
      setPackages(next);
      await saveImmediate('packages', next);
  };

  const deletePackage = async (id: string) => {
      const nextPackages = packages.filter(pkg => pkg.id !== id);
      if (nextPackages.length === packages.length) return;

      let clientsChanged = false;
      const eventsToRemove: string[] = [];

      const nextClients = clients.map(client => {
          const assignments = client.packageAssignments || [];
          if (!assignments.length) return client;
          const keep = assignments.filter(a => a.packageId !== id);
          if (keep.length === assignments.length) return client;
          clientsChanged = true;
          assignments
            .filter(a => a.packageId === id)
            .forEach(a => {
                if (a.calendarEventIds) {
                    eventsToRemove.push(...a.calendarEventIds);
                }
            });
          return { ...client, packageAssignments: keep };
      });

      if (eventsToRemove.length > 0) {
          await removeCalendarEvents(eventsToRemove);
      }

      setPackages(nextPackages);
      await saveImmediate('packages', nextPackages);

      if (clientsChanged) {
          setClients(nextClients);
          await saveImmediate('clients', nextClients);
      }
  };

  const assignPackageToClient = async (clientId: string, packageId: string, startDate: string) => {
      if (!startDate) return;
      const client = clients.find(c => c.id === clientId);
      const pkg = packages.find(p => p.id === packageId);
      if (!client || !pkg) return;
      const baseDate = new Date(startDate);
      if (Number.isNaN(baseDate.getTime())) return;

      const eventPayloads = (pkg.tasks || []).map(task => ({
          title: `${pkg.name}: ${task.title}`,
          date: formatDateString(shiftDate(baseDate, task.offsetDays)),
          type: task.type,
          client: client.name,
          packageId: pkg.id,
          packageTaskId: task.id,
          autoGenerated: true
      }));

      const createdEvents = await createCalendarEvents(eventPayloads);
      const assignment = {
          id: createId(),
          packageId: pkg.id,
          startDate,
          calendarEventIds: createdEvents.map(ev => ev.id)
      };

      const next = clients.map(c => 
          c.id === clientId 
            ? { 
                ...c, 
                packageAssignments: [...(c.packageAssignments || []), assignment],
                package: pkg.name || c.package
              } 
            : c
      );
      setClients(next);
      await saveImmediate('clients', next);
  };

  const removePackageAssignment = async (clientId: string, assignmentId: string) => {
      const client = clients.find(c => c.id === clientId);
      if (!client?.packageAssignments?.length) return;
      const assignment = client.packageAssignments.find(a => a.id === assignmentId);
      if (!assignment) return;

      if (assignment.calendarEventIds?.length) {
          await removeCalendarEvents(assignment.calendarEventIds);
      }

      const nextAssignments = client.packageAssignments.filter(a => a.id !== assignmentId);
      const nextClients = clients.map(c => c.id === clientId ? { ...c, packageAssignments: nextAssignments } : c);
      setClients(nextClients);
      await saveImmediate('clients', nextClients);
  };

  const addInvoice = async (invoiceData: Omit<Invoice, 'id'>) => {
    const newInvoice: Invoice = { ...invoiceData, id: Math.random().toString(36).substr(2, 9) };
    const next = [newInvoice, ...invoices];
    setInvoices(next);
    await saveImmediate('invoices', next);
  };
  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    const next = invoices.map(i => i.id === id ? { ...i, ...updates } : i);
    setInvoices(next);
    await saveImmediate('invoices', next);
  };
  const deleteInvoice = async (id: string) => {
    const next = invoices.filter(i => i.id !== id);
    setInvoices(next);
    await saveImmediate('invoices', next);
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
    const newTrans: Transaction = { ...transactionData, id: Math.random().toString(36).substr(2, 9) };
    const next = [newTrans, ...transactions];
    setTransactions(next);
    await saveImmediate('transactions', next);
  };
  const deleteTransaction = async (id: string) => {
    const next = transactions.filter(t => t.id !== id);
    setTransactions(next);
    await saveImmediate('transactions', next);
  };

  const addSubscription = async (data: Omit<IntegrationSubscription, 'id'>) => {
    const record: IntegrationSubscription = { ...data, id: createId() };
    const next = [record, ...subscriptions];
    setSubscriptions(next);
    await saveImmediate('subscriptions', next);
  };

  const updateSubscription = async (id: string, updates: Partial<IntegrationSubscription>) => {
    const next = subscriptions.map(sub => sub.id === id ? { ...sub, ...updates } : sub);
    setSubscriptions(next);
    await saveImmediate('subscriptions', next);
  };

  const deleteSubscription = async (id: string) => {
    const next = subscriptions.filter(sub => sub.id !== id);
    setSubscriptions(next);
    await saveImmediate('subscriptions', next);
  };

  const addApiKey = async (data: Omit<ApiKeyEntry, 'id' | 'createdAt'>) => {
    const entry: ApiKeyEntry = {
      ...data,
      id: createId(),
      createdAt: new Date().toISOString(),
      status: data.status || 'active'
    };
    const next = [entry, ...apiKeys];
    setApiKeys(next);
    await saveImmediate('apiKeys', next);
  };

  const updateApiKey = async (id: string, updates: Partial<ApiKeyEntry>) => {
    const next = apiKeys.map(key => key.id === id ? { ...key, ...updates } : key);
    setApiKeys(next);
    await saveImmediate('apiKeys', next);
  };

  const deleteApiKey = async (id: string) => {
    const next = apiKeys.filter(key => key.id !== id);
    setApiKeys(next);
    await saveImmediate('apiKeys', next);
  };

  const saveContentPlan = async (plan: ClientContentPlan) => {
    const next = { ...contentPlans, [plan.clientId]: plan };
    setContentPlans(next);
    await saveImmediate('contentPlans', next);
  };

  const deleteContentPlan = async (clientId: string) => {
    const next = { ...contentPlans };
    delete next[clientId];
    setContentPlans(next);
    await saveImmediate('contentPlans', next);
  };

  const addReminder = async (data: Omit<Reminder, 'id' | 'completed' | 'triggeredIntervals'>) => {
    const newItem: Reminder = { 
        ...data, 
        id: Math.random().toString(36).substr(2, 9), 
        completed: false, 
        triggeredIntervals: [] 
    };
    const next = [...reminders, newItem];
    setReminders(next);
    await saveImmediate('reminders', next);
  };
  const deleteReminder = async (id: string) => {
    const next = reminders.filter(r => r.id !== id);
    setReminders(next);
    await saveImmediate('reminders', next);
  };
  const completeReminder = async (id: string) => {
    const next = reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r);
    setReminders(next);
    await saveImmediate('reminders', next);
  };
  const markReminderInterval = async (id: string, intervalId: string) => {
      const next = reminders.map(r => {
          if (r.id !== id) return r;
          if (r.triggeredIntervals.includes(intervalId)) return r;
          return { ...r, triggeredIntervals: [...r.triggeredIntervals, intervalId] };
      });
      setReminders(next);
      await saveImmediate('reminders', next);
  };

  const exportData = () => {
    const data = {
        prospects, clients, kanbanItems, calendarEvents, dailyProgress, pageContent, invoices, transactions, clientFiles, clientFolders, reminders, subscriptions, apiKeys, contentPlans
    };
    return JSON.stringify(data, null, 2);
  };

  const importData = (json: string) => {
    try {
        const data = JSON.parse(json);
        if(data.prospects) { setProspects(data.prospects); saveImmediate('prospects', data.prospects); }
        if(data.clients) { setClients(data.clients); saveImmediate('clients', data.clients); }
        if(data.kanbanItems) { setKanbanItems(data.kanbanItems); saveImmediate('kanban', data.kanbanItems); }
        if(data.calendarEvents) { setCalendarEvents(data.calendarEvents); saveImmediate('calendar', data.calendarEvents); }
        if(data.dailyProgress) { setDailyProgress(data.dailyProgress); saveImmediate('dailyProgress', data.dailyProgress); }
        if(data.pageContent) { setPageContent(data.pageContent); saveImmediate('content', data.pageContent); }
        if(data.invoices) { setInvoices(data.invoices); saveImmediate('invoices', data.invoices); }
        if(data.transactions) { setTransactions(data.transactions); saveImmediate('transactions', data.transactions); }
        if(data.clientFiles) { setClientFiles(data.clientFiles); saveImmediate('files', data.clientFiles); }
        if(data.clientFolders) { setClientFolders(data.clientFolders); saveImmediate('folders', data.clientFolders); }
        if(data.reminders) { setReminders(data.reminders); saveImmediate('reminders', data.reminders); }
        if(data.subscriptions) { setSubscriptions(data.subscriptions); saveImmediate('subscriptions', data.subscriptions); }
        if(data.apiKeys) { setApiKeys(data.apiKeys); saveImmediate('apiKeys', data.apiKeys); }
        if(data.contentPlans) { setContentPlans(data.contentPlans); saveImmediate('contentPlans', data.contentPlans); }
        alert('System restored successfully.');
    } catch (e) {
        alert('Invalid backup file.');
    }
  };

  const recoverLegacyData = () => {
     try {
        const keys = ['clients', 'prospects', 'kanban', 'calendar', 'invoices', 'transactions', 'subscriptions', 'apiKeys', 'contentPlans'];
        let recoveredCount = 0;
        keys.forEach(async key => {
            const raw = localStorage.getItem(key);
            if (raw) {
                const data = JSON.parse(raw);
                const hasContent = Array.isArray(data) ? data.length > 0 : data && Object.keys(data).length > 0;
                if (hasContent) {
                    await supabaseWrite(key, data);
                    recoveredCount += Array.isArray(data) ? data.length : Object.keys(data).length;
                }
            }
        });
        alert(`Recovery complete. Found ${recoveredCount} items in legacy storage. Please refresh.`);
     } catch (e) {
        alert('Recovery failed. See console.');
        console.error(e);
     }
  };

  const hardReset = async () => {
    if (window.confirm("DANGER: This will delete ALL data permanently. Are you sure?")) {
         STORES.forEach(async s => await supabaseDelete(s));
         localStorage.clear();
         window.location.reload();
    }
  };
  
  const forceRecovery = () => {
      recoverLegacyData();
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white">
        <Loader2 size={48} className="text-nb-pink animate-spin mb-4" />
        <h2 className="text-xl font-bold uppercase tracking-widest">SYSTEM LOADING...</h2>
      </div>
    );
  }

  return (
    <DataContext.Provider value={{
      saveStatus, storageUsage, forceRecovery,
      prospects, addProspect, updateProspect, deleteProspect, deleteAllProspects, importProspects,
      clients, addClient, updateClient, deleteClient,
      kanbanItems, addKanbanItem, updateKanbanItem, deleteKanbanItem,
      calendarEvents, addCalendarEvent, deleteCalendarEvent,
      dailyProgress, updateDailyTask,
      pageContent, savePageContent, savePageContentImmediate,
      clientFiles, addClientFile, deleteClientFile,
      clientFolders, addClientFolder, deleteClientFolder,
      folderOrders, updateFolderOrder,
      packages, addPackage, updatePackage, deletePackage, assignPackageToClient, removePackageAssignment,
      invoices, addInvoice, updateInvoice, deleteInvoice,
      transactions, addTransaction, deleteTransaction,
      subscriptions, apiKeys, addSubscription, updateSubscription, deleteSubscription, addApiKey, updateApiKey, deleteApiKey,
      contentPlans, saveContentPlan, deleteContentPlan,
      reminders, addReminder, deleteReminder, completeReminder, markReminderInterval,
      exportData, importData, recoverLegacyData, hardReset
    }}>
      {children}
    </DataContext.Provider>
  );
};
