import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Users, BookOpen, Clock, LogOut, Code, UserPlus, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

type NavItem = { name: string; path: string; icon: React.ReactNode };

export default function AppLayout() {
  const location = useLocation();
  const [session, setSession] = useState<{ fullName: string; role: string } | null>(null);

  useEffect(() => {
    // Attempt to load from new location first, then fallback
    const storedSchool = window.localStorage.getItem('sms-school-session') 
                      || window.localStorage.getItem('sms-admin-session');
    if (storedSchool) {
      setSession(JSON.parse(storedSchool));
    }
  }, []);

  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={18} /> },
    { name: 'Admissions', path: '/admissions', icon: <UserPlus size={18} /> },
    { name: 'Attendance', path: '/attendance', icon: <Clock size={18} /> },
    { name: 'Classes', path: '/classes', icon: <BookOpen size={18} /> },
    { name: 'Teachers', path: '/teachers', icon: <Users size={18} /> },
    { name: 'Reports', path: '/reports', icon: <FileText size={18} /> },
    { name: 'Developer (MCP)', path: '/mcp-test', icon: <Code size={18} /> },
  ];

  const handleLogout = () => {
    window.localStorage.removeItem('sms-school-session');
    window.localStorage.removeItem('sms-school-session-last-activity');
    window.localStorage.removeItem('sms-admin-session');
    window.localStorage.removeItem('sms-admin-session-last-activity');
    window.location.href = '/';
  };

  return (
    <div className="app-layout">
      {/* Dynamic Background */}
      <div className="glow glow-left"></div>
      <div className="glow glow-right"></div>
      
      {/* Sidebar */}
      <aside className="sidebar GlassPanel">
        <div className="sidebar-header">
          <div className="logo-orb"></div>
          <h2>NexSchool</h2>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-group">Main Options</div>
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`nav-link ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
            >
              <span className="icon-wrap">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">{session?.fullName?.[0] || 'A'}</div>
            <div className="user-info">
              <span className="name">{session?.fullName || 'User'}</span>
              <span className="role">{session?.role || 'Guest'}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-header GlassPanel">
          <div className="page-context">
            <h1>{navItems.find(n => location.pathname.startsWith(n.path))?.name || 'Dashboard'}</h1>
          </div>
          <div className="header-actions">
            <div className="status-indicator">
              <span className="pulse-dot"></span> System Online
            </div>
          </div>
        </header>

        <div className="page-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
