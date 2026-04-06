import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  BookOpen, 
  CreditCard,
  Settings,
  LogOut,
  Zap,
  Globe,
  Bell,
  Sparkles,
  Search,
  Brain,
  ChevronRight
} from 'lucide-react';
import { AiNotificationCenter } from './AiNotificationCenter';
import { AiVisualizer } from './AiVisualizer';
import { useRealtime } from './RealtimeHub';
import { useStore } from '../store/useStore';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  role?: string[];
  minPlan?: 'FREE' | 'BASIC' | 'PREMIUM';
}

interface DashboardShellProps {
  children: React.ReactNode;
  schoolName: string;
  userName: string;
  userRole: string;
  activeModule: string;
  planCode?: 'FREE' | 'BASIC' | 'PREMIUM';
  onModuleChange: (moduleId: string) => void;
  onSignOut: () => void;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  children,
  schoolName,
  userName,
  userRole,
  activeModule,
  planCode = 'BASIC',
  onModuleChange,
  onSignOut
}) => {
  const { isConnected } = useRealtime();
  const [showAiCenter, setShowAiCenter] = useState(false);

  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'teachers', label: 'Teachers', icon: <Users size={18} />, role: ['ADMIN', 'PRINCIPAL'], minPlan: 'BASIC' },
    { id: 'students', label: 'Students', icon: <GraduationCap size={18} />, role: ['ADMIN', 'PRINCIPAL'], minPlan: 'BASIC' },
    { id: 'classes', label: 'Classes', icon: <BookOpen size={18} />, role: ['ADMIN', 'PRINCIPAL'], minPlan: 'BASIC' },
    { id: 'attendance', label: 'Attendance', icon: <CalendarCheck size={18} />, role: ['ADMIN', 'TEACHER'], minPlan: 'BASIC' },
    { id: 'billing', label: 'Billing & Plans', icon: <CreditCard size={18} />, role: ['ADMIN'] },
    { id: 'platform', label: 'SaaS Manager', icon: <Globe size={18} />, role: ['PLATFORM_ADMIN', 'SUPER_ADMIN'] },
  ];

  const planRank = { 'FREE': 0, 'BASIC': 1, 'PREMIUM': 2 };

  const filteredItems = sidebarItems.filter(item => {
    const roleMatch = !item.role || item.role.includes(userRole);
    const planMatch = !item.minPlan || planRank[planCode] >= planRank[item.minPlan];
    return roleMatch && planMatch;
  });

  return (
    <div className="dashboard-layout">
      <aside className="modern-sidebar">
        <div className="sidebar-header">
          <div className="school-logo">
            <div className="logo-box">
              <Sparkles size={20} className="neon-text" />
            </div>
            <div className="logo-text">
              <strong>{schoolName}</strong>
              <span className="eyebrow">{userRole} Portal • {planCode}</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {filteredItems.map(item => (
            <div 
              key={item.id}
              className={`nav-item ${activeModule === item.id ? 'active' : ''}`}
              onClick={() => onModuleChange(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {activeModule === item.id && <ChevronRight size={14} className="active-indicator" />}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar-neon">{userName.charAt(0)}</div>
            <div className="user-details">
              <strong>{userName}</strong>
              <div className="connection-status">
                <span className={`status-dot ${isConnected ? 'online' : 'offline'}`}></span>
                <span className="eyebrow">{isConnected ? 'Live' : 'Offline'}</span>
              </div>
            </div>
          </div>
          <button className="sign-out-btn-neon" onClick={onSignOut}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <div className="header-breadcrumbs">
            <span className="crumb">Portal</span>
            <span className="separator">/</span>
            <span className="crumb active">{activeModule.charAt(0).toUpperCase() + activeModule.slice(1)}</span>
          </div>
          
          <div className="header-actions">
            <button 
              className="search-box-glass"
              onClick={() => useStore.getState().setSearchOpen(true)}
            >
              <Search size={16} />
              <span className="text-slate-500 text-sm font-medium">AI Search...</span>
              <kbd className="ml-auto hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-slate-400 opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
            
            <button 
              className={`ai-toggle-btn ${showAiCenter ? 'active' : ''}`}
              onClick={() => setShowAiCenter(!showAiCenter)}
            >
              <Brain size={18} />
              <span className="pulse-aura"></span>
            </button>
          </div>
        </header>
        
        <div className="viewport">
          <div className="content-area">
            {activeModule === 'overview' && planRank[planCode] >= 1 && (
              <div className="ai-viz-strip mb-8">
                <AiVisualizer />
              </div>
            )}
            {children}
          </div>

          {showAiCenter && (
            <aside className="ai-sidebar-overlay">
              <AiNotificationCenter />
            </aside>
          )}
        </div>
      </main>
    </div>
  );
};
