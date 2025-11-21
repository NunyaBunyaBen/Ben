import React, { useState } from 'react';
import { NAV_STRUCTURE } from '../constants';
import { NavItem } from '../types';
import * as Icons from 'lucide-react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activeId: string;
  onNavigate: (id: string, type: any) => void;
  isMobileOpen: boolean;
  closeMobile: () => void;
}

interface SidebarItemProps {
  item: NavItem;
  depth?: number;
  activeId: string;
  onNavigate: (id: string, type: any) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  item, 
  depth = 0, 
  activeId, 
  onNavigate 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // Determine if this item or any child is active to auto-expand
  const isActive = activeId === item.id;
  const hasActiveChild = item.children?.some(c => c.id === activeId);
  
  React.useEffect(() => {
    if (hasActiveChild) setIsOpen(true);
  }, [hasActiveChild]);

  const IconComponent = item.icon ? (Icons as any)[item.icon] : null;
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="mb-1">
      <button
        onClick={() => {
          if (hasChildren) {
            setIsOpen(!isOpen);
          } else {
            onNavigate(item.id, item.type);
          }
        }}
        className={`
          w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all duration-200
          ${isActive 
            ? 'bg-nb-pink/10 text-nb-pink border-r-2 border-nb-pink' 
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
          }
          ${depth > 0 ? 'pl-10 text-xs' : ''}
        `}
      >
        <div className="flex items-center gap-3">
          {IconComponent && <IconComponent size={18} className={isActive ? "text-nb-pink drop-shadow-[0_0_8px_rgba(255,0,255,0.5)]" : ""} />}
          <span className={isActive ? "font-semibold tracking-wide" : ""}>{item.label}</span>
        </div>
        {hasChildren && (
          isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
        )}
      </button>

      {hasChildren && isOpen && (
        <div className="border-l border-zinc-800 ml-6 my-1 space-y-1">
          {item.children!.map(child => (
            <SidebarItem 
              key={child.id} 
              item={child} 
              depth={depth + 1} 
              activeId={activeId} 
              onNavigate={onNavigate} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ activeId, onNavigate, isMobileOpen, closeMobile }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
          onClick={closeMobile}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-nb-black border-r border-zinc-800 
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
            <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(255,0,255,0.35)] overflow-hidden">
              <img
                src="/nunya-bunya-logo.png"
                alt="Nunya Bunya HQ logo"
                className="w-12 h-12 object-contain select-none pointer-events-none"
                draggable={false}
              />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-wider text-white italic leading-tight">
                NUNYA
                <br />
                <span className="text-nb-teal">BUNYA</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 mt-1">
                HQ
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6">
            {NAV_STRUCTURE.map(item => (
              <SidebarItem 
                key={item.id} 
                item={item} 
                activeId={activeId} 
                onNavigate={(id, type) => {
                  onNavigate(id, type);
                  closeMobile();
                }} 
              />
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800">
            <div className="bg-zinc-900 rounded-lg p-3 text-xs text-zinc-500 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-nb-lime animate-pulse"></div>
              System Online v2.0
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};