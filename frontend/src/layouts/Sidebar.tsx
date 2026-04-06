import React from 'react';
import { ViewMode, SchoolAdminModule } from '../types';

interface SidebarProps {
  viewMode: ViewMode;
  role: string | null;
  activeModule: string;
  onModuleChange: (module: any) => void;
  onLogout: () => void;
}

const Sidebar = ({ viewMode, role, activeModule, onModuleChange, onLogout }: SidebarProps) => {
  const getNavItems = () => {
    if (viewMode === 'admin') {
      return [
        { id: 'onboarding-queue', label: 'Onboarding Queue', icon: '📋' },
        { id: 'platform-stats', label: 'Platform Stats', icon: '📊' },
        { id: 'subscriptions', label: 'Subscriptions', icon: '💳' },
      ];
    }

    if (viewMode === 'school' && role) {
      if (['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER'].includes(role)) {
        return [
          { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
          { id: 'classes', label: 'Classes', icon: '🏫' },
          { id: 'teachers', label: 'Teachers', icon: '🧑‍🏫' },
          { id: 'students', label: 'Students', icon: '🧑‍🎓' },
          { id: 'attendance', label: 'Attendance', icon: '📅' },
          { id: 'finance', label: 'Finance', icon: '💰' },
          { id: 'communication', label: 'Communications', icon: '✉️' },
        ];
      }

      if (role === 'TEACHER') {
        return [
          { id: 'workspace', label: 'Teacher Workspace', icon: '📑' },
          { id: 'my-classes', label: 'My Classes', icon: '🏫' },
          { id: 'attendance-marking', label: 'Mark Attendance', icon: '📝' },
        ];
      }

      if (role === 'STUDENT') {
        return [
          { id: 'student-workspace', label: 'My Workspace', icon: '🎒' },
          { id: 'grades', label: 'Grades & Results', icon: '📈' },
          { id: 'notices', label: 'Notice Board', icon: '🔔' },
        ];
      }
    }

    return [];
  };

  const navItems = getNavItems();

  return (
    <aside className="sidebar-container glass-effect">
      <div className="sidebar-header">
        <h2 className="brand-title">SMS SaaS</h2>
        <span className="platform-tag">Enterprise</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onModuleChange(item.id)}
            className={`nav-item ${activeModule === item.id ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {role && (
          <button onClick={onLogout} className="logout-action">
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
