
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ContentEditor } from './components/ContentEditor';
import { ClientDB } from './components/ClientDB';
import { KanbanBoard } from './components/KanbanBoard';
import { CalendarView } from './components/CalendarView';
import { OutreachDashboard } from './components/OutreachDashboard';
import { ProspectDB } from './components/ProspectDB';
import { ConversionFunnel } from './components/ConversionFunnel';
import { MessageTemplates } from './components/MessageTemplates';
import { ResourceGrid } from './components/ResourceGrid';
import { Analytics } from './components/Analytics';
import { InvoiceGenerator } from './components/InvoiceGenerator';
import { FinanceDashboard } from './components/FinanceDashboard';
import { Settings } from './components/Settings';
import { IntegrationCenter } from './components/IntegrationCenter';
import ContentPlanner from './components/ContentPlanner';
import { EnvironmentGuide } from './components/EnvironmentGuide';
import { ClientPortal } from './components/ClientPortal';
import { SystemStatus } from './components/SystemStatus';
import { LightningBot } from './components/LightningBot';
import { PageType, PageContent } from './types';
import { NAV_STRUCTURE, INITIAL_OUTREACH_EVENTS, INITIAL_CALENDAR_EVENTS } from './constants';
import { Menu } from 'lucide-react';
import { useData } from './DataContext';

const App: React.FC = () => {
  const [activeId, setActiveId] = useState<string>('outreach-home');
  const [activeType, setActiveType] = useState<PageType>(PageType.OUTREACH_DASHBOARD);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [calendarClientFilter, setCalendarClientFilter] = useState<string | undefined>(undefined);
  
  const { pageContent, savePageContent } = useData();

  const handleNavigate = (id: string, type: PageType, clientFilter?: string) => {
    setActiveId(id);
    setActiveType(type);
    if (clientFilter) {
      setCalendarClientFilter(clientFilter);
    } else if (type !== PageType.CALENDAR) {
      setCalendarClientFilter(undefined);
    }
  };

  const getTitle = (id: string) => {
    const find = (items: any[]): string | undefined => {
      for (const item of items) {
        if (item.id === id) return item.label;
        if (item.children) {
          const found = find(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return find(NAV_STRUCTURE) || 'Untitled';
  };

  const renderContent = () => {
    switch (activeType) {
      case PageType.DASHBOARD:
        return <Dashboard />;
      case PageType.OUTREACH_DASHBOARD:
        return <OutreachDashboard onNavigate={handleNavigate} />;
      case PageType.PROSPECT_DB:
        return <ProspectDB />;
      case PageType.FUNNEL:
        return <ConversionFunnel />;
      case PageType.TEMPLATES:
        return <MessageTemplates />;
      case PageType.RESOURCE_GRID:
        return <ResourceGrid pageId={activeId} title={getTitle(activeId)} />;
      case PageType.ANALYTICS:
        return <Analytics />;
      case PageType.INVOICE_GENERATOR:
        return <InvoiceGenerator />;
      case PageType.FINANCE_DASHBOARD:
        return <FinanceDashboard />;
      case PageType.SETTINGS:
        return <Settings />;
      case PageType.INTEGRATIONS:
        return <IntegrationCenter />;
      case PageType.CONTENT_PLANNER:
        return <ContentPlanner />;
      case PageType.ENVIRONMENT:
        return <EnvironmentGuide />;
      case PageType.DATABASE:
         if (activeId.includes('clients') || activeId.includes('sales')) {
           return <ClientDB activeId={activeId} onNavigate={handleNavigate} />;
         }
         return <Dashboard />;
      case PageType.KANBAN:
        return <KanbanBoard />;
      case PageType.CALENDAR:
        const isOutreachCal = activeId === 'outreach-cal';
        return <CalendarView 
            events={isOutreachCal ? INITIAL_OUTREACH_EVENTS : INITIAL_CALENDAR_EVENTS}
            title={isOutreachCal ? "Outreach Planner" : calendarClientFilter ? `${calendarClientFilter} - Content Schedule` : "Content Schedule"}
            initialClientFilter={calendarClientFilter}
        />;
      case PageType.CLIENT_PORTAL:
        return <ClientPortal 
          clientId={activeId} 
          onBack={() => handleNavigate('clients-active', PageType.DATABASE)}
          onNavigate={handleNavigate}
        />;
      case PageType.DOCUMENT:
      default:
        return (
          <ContentEditor 
            key={activeId}
            pageId={activeId}
            title={getTitle(activeId)}
            initialContent={pageContent[activeId]}
            onSave={savePageContent}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-nb-black text-zinc-100 font-sans overflow-hidden selection:bg-nb-pink selection:text-white">
      <Sidebar 
        activeId={activeId} 
        onNavigate={handleNavigate} 
        isMobileOpen={isMobileNavOpen}
        closeMobile={() => setIsMobileNavOpen(false)}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden p-4 border-b border-zinc-800 flex items-center justify-between bg-nb-black/90 backdrop-blur z-30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,0,255,0.3)] overflow-hidden">
              <img 
                src="/nunya-bunya-logo.png" 
                alt="Nunya Bunya HQ logo" 
                className="w-10 h-10 object-contain select-none pointer-events-none" 
                draggable={false}
              />
            </div>
            <span className="font-black italic text-lg tracking-wider">NB<span className="text-nb-teal">HQ</span></span>
          </div>
          <button onClick={() => setIsMobileNavOpen(true)} className="text-zinc-400"><Menu /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {renderContent()}
          </div>
        </div>
      </main>
      
      {/* System Monitor Overlay */}
      <SystemStatus />
      
      {/* Blitz The Bot */}
      <LightningBot />
    </div>
  );
};

export default App;
