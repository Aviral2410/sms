import React from 'react';
import Sidebar from './Sidebar';
import { ViewMode } from '../types';
import { useStore } from '../store/useStore';
import { CommandPalette } from '../components/ui/CommandPalette';

interface DashboardLayoutProps {
  viewMode: ViewMode;
  role: string | null;
  activeModule: string;
  onModuleChange: (module: any) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const DashboardLayout = ({ children, ...sidebarProps }: DashboardLayoutProps) => {
  const { theme } = useStore();
  
  return (
    <div className={`dashboard-shell-v2 theme-${theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme}`}>
      <CommandPalette />
      <div className="layout-grid-v2">
        <Sidebar {...sidebarProps} />

        <main className="content-area-v2 animate-in">
          {children}
        </main>
      </div>

      <div className="glow-left-v2" />
      <div className="glow-right-v2" />
    </div>
  );
};

export default DashboardLayout;
