import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { CommandPalette } from '../components/CommandPalette';
import { onboardingApi, subscriptionApi } from '../lib/api';
import {
  LayoutDashboard, Building2, ShieldCheck, BarChart2, Settings,
  Users, BookOpen, Calendar, CreditCard, FileText, Bell, LogOut, Home,
  Sparkles, Menu, X, GraduationCap, Clock, Bus, Library,
  MessageSquare, User, Activity, ArrowLeft, Layers,
  TrendingUp, Brain, Globe2, Flag
} from 'lucide-react';
import { MotionBackdrop } from '../components/MotionBackdrop';
import { AiAssistantChat } from '../components/ai/AiAssistantChat';



// ── Nav item config ──
const PLATFORM_ROLES = ['PLATFORM_ADMIN', 'SUPER_ADMIN'];

type NavItem = {
  path: string;
  label: string;
  icon: any;
  roles: string[];
  group: string;
  color: string;
  requiredFeature?: string;
};

function hasFeature(featureCodes: string[] | undefined, requiredFeature?: string) {
  if (!requiredFeature) return true;
  const codes = featureCodes || [];
  return codes.includes('*') || codes.includes(requiredFeature);
}

function getNavItems(role: string): NavItem[] {
  const all: NavItem[] = [
    // Platform Admin
    { path: '/dashboard', label: 'Command Center', icon: LayoutDashboard, roles: [...PLATFORM_ROLES], group: 'Overview', color: '#818cf8' },
    { path: '/admin/onboarding', label: 'Onboarding Queue', icon: Building2, roles: [...PLATFORM_ROLES], group: 'Operations', color: '#22d3ee' },
    { path: '/admin/schools', label: 'All Schools', icon: ShieldCheck, roles: [...PLATFORM_ROLES], group: 'Operations', color: '#34d399' },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart2, roles: [...PLATFORM_ROLES], group: 'Intelligence', color: '#a78bfa' },
    { path: '/admin/ai-governance', label: 'AI Governance', icon: Brain, roles: [...PLATFORM_ROLES], group: 'Intelligence', color: '#22d3ee' },
    { path: '/admin/pricing', label: 'Pricing Control', icon: TrendingUp, roles: [...PLATFORM_ROLES], group: 'Operations', color: '#fbbf24' },
    { path: '/admin/inquiries', label: 'Public Inbox', icon: Bell, roles: [...PLATFORM_ROLES], group: 'Operations', color: '#f472b6' },
    { path: '/learn', label: 'AI Visualizer', icon: Brain, roles: [...PLATFORM_ROLES], group: 'Intelligence', color: '#fbbf24' },
    { path: '/admin/logs', label: 'System Logs', icon: Activity, roles: [...PLATFORM_ROLES], group: 'Intelligence', color: '#f87171' },
    { path: '/settings', label: 'Platform Engine', icon: Settings, roles: [...PLATFORM_ROLES], group: 'System', color: '#64748b' },
    // School Admin
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TRANSPORT_MANAGER'], group: 'Overview', color: '#ffb663' },
    { path: '/school/cms', label: 'School CMS', icon: Sparkles, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER'], group: 'Overview', color: '#fbbf24', requiredFeature: 'SCHOOL_OPS' },
    { path: '/school/routing', label: 'Routing', icon: Globe2, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER'], group: 'Overview', color: '#22d3ee', requiredFeature: 'SCHOOL_OPS' },
    { path: '/students', label: 'Students', icon: Users, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TRANSPORT_MANAGER', 'TEACHER'], group: 'Academics', color: '#22d3ee', requiredFeature: 'SCHOOL_OPS' },
    { path: '/teachers', label: 'Teachers', icon: BookOpen, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TRANSPORT_MANAGER'], group: 'Academics', color: '#a78bfa', requiredFeature: 'SCHOOL_OPS' },
    { path: '/admissions', label: 'Admissions', icon: FileText, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TRANSPORT_MANAGER'], group: 'Academics', color: '#a78bfa', requiredFeature: 'SCHOOL_OPS' },
    { path: '/school/classes', label: 'Class', icon: Home, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TRANSPORT_MANAGER'], group: 'Academics', color: '#38bdf8' },
    { path: '/school/structure', label: 'Department', icon: Layers, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TRANSPORT_MANAGER'], group: 'Academics', color: '#22c55e' },
    { path: '/attendance', label: 'Attendance', icon: Calendar, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TRANSPORT_MANAGER', 'TEACHER'], group: 'Academics', color: '#34d399', requiredFeature: 'ATTENDANCE' },
    { path: '/exams', label: 'Examinations', icon: GraduationCap, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TRANSPORT_MANAGER', 'TEACHER'], group: 'Academics', color: '#f472b6' },
    { path: '/timetable', label: 'Timetable', icon: Clock, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TRANSPORT_MANAGER', 'TEACHER'], group: 'Operations', color: '#818cf8' },
    { path: '/hr/leaves', label: 'HR Leaves', icon: Calendar, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TEACHER', 'STAFF'], group: 'Operations', color: '#fde68a', requiredFeature: 'SCHOOL_OPS' },
    { path: '/transport', label: 'Transport Hub', icon: Bus, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TRANSPORT_MANAGER'], group: 'Operations', color: '#fb923c', requiredFeature: 'TRANSPORT_BASE' },
    { path: '/transport/driver', label: 'Driver Console', icon: Bus, roles: ['DRIVER'], group: 'Operations', color: '#fb923c', requiredFeature: 'TRANSPORT_BASE' },
    { path: '/transport/conductor', label: 'Conductor Panel', icon: Bus, roles: ['CONDUCTOR'], group: 'Operations', color: '#fb923c', requiredFeature: 'TRANSPORT_BASE' },
    { path: '/transport/my', label: 'My Transport', icon: Bus, roles: ['PARENT', 'STUDENT', 'TEACHER'], group: 'Operations', color: '#fb923c', requiredFeature: 'TRANSPORT_BASE' },
    { path: '/library', label: 'Library', icon: Library, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TEACHER', 'STUDENT'], group: 'Resources', color: '#34d399' },
    { path: '/forum', label: 'Forum', icon: MessageSquare, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TEACHER', 'STUDENT'], group: 'Resources', color: '#6366f1' },
    { path: '/communication', label: 'Communication', icon: MessageSquare, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TEACHER'], group: 'Resources', color: '#22d3ee' },
    { path: '/billing', label: 'Billing & Fees', icon: CreditCard, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER'], group: 'Finance', color: '#ffb663', requiredFeature: 'SCHOOL_OPS' },
    { path: '/school/analytics', label: 'Analytics', icon: TrendingUp, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER'], group: 'Intelligence', color: '#c084fc' },
    { path: '/learn', label: 'AI Visualizer', icon: Brain, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER'], group: 'Intelligence', color: '#fbbf24' },
    // Teacher
    { path: '/dashboard', label: 'Workspace', icon: Sparkles, roles: ['TEACHER'], group: 'Overview', color: '#a78bfa', requiredFeature: 'SCHOOL_OPS' },
    { path: '/teacher/profile', label: 'Profile', icon: User, roles: ['TEACHER'], group: 'Overview', color: '#94a3b8', requiredFeature: 'SCHOOL_OPS' },
    { path: '/classes', label: 'My Classes', icon: BookOpen, roles: ['TEACHER'], group: 'Teaching', color: '#22d3ee', requiredFeature: 'SCHOOL_OPS' },
    { path: '/attendance', label: 'Attendance', icon: Calendar, roles: ['TEACHER'], group: 'Teaching', color: '#34d399', requiredFeature: 'ATTENDANCE' },
    { path: '/teacher/homework', label: 'Homework', icon: FileText, roles: ['TEACHER'], group: 'Teaching', color: '#fbbf24', requiredFeature: 'SCHOOL_OPS' },
    { path: '/teacher/marks', label: 'Exams & Marks', icon: GraduationCap, roles: ['TEACHER'], group: 'Teaching', color: '#f472b6', requiredFeature: 'SCHOOL_OPS' },
    { path: '/teacher/behaviour', label: 'Behaviour', icon: Flag, roles: ['TEACHER'], group: 'Teaching', color: '#fb7185', requiredFeature: 'SCHOOL_OPS' },
    { path: '/teacher/communication', label: 'Parent Communication', icon: MessageSquare, roles: ['TEACHER'], group: 'Resources', color: '#22d3ee', requiredFeature: 'SCHOOL_OPS' },
    { path: '/library', label: 'Library Resources', icon: Library, roles: ['TEACHER'], group: 'Resources', color: '#34d399' },
    { path: '/notices', label: 'Notices', icon: Bell, roles: ['TEACHER'], group: 'Resources', color: '#fbbf24', requiredFeature: 'SCHOOL_OPS' },
    { path: '/learn', label: 'AI Visualizer', icon: Brain, roles: ['TEACHER'], group: 'Resources', color: '#fbbf24' },
    // Student
    { path: '/dashboard', label: 'My Portal', icon: LayoutDashboard, roles: ['STUDENT'], group: 'Overview', color: '#22d3ee', requiredFeature: 'SCHOOL_OPS' },
    { path: '/student/profile', label: 'Profile', icon: User, roles: ['STUDENT'], group: 'Overview', color: '#94a3b8', requiredFeature: 'SCHOOL_OPS' },
    { path: '/student/classroom', label: 'Classroom', icon: Users, roles: ['STUDENT'], group: 'Academic', color: '#a78bfa', requiredFeature: 'SCHOOL_OPS' },
    { path: '/student/timetable', label: 'Timetable', icon: Clock, roles: ['STUDENT'], group: 'Academic', color: '#818cf8', requiredFeature: 'SCHOOL_OPS' },
    { path: '/student/attendance', label: 'Attendance', icon: Calendar, roles: ['STUDENT'], group: 'Academic', color: '#34d399', requiredFeature: 'ATTENDANCE' },
    { path: '/student/homework', label: 'Homework', icon: FileText, roles: ['STUDENT'], group: 'Academic', color: '#ffb663', requiredFeature: 'SCHOOL_OPS' },
    { path: '/student/results', label: 'Results', icon: GraduationCap, roles: ['STUDENT'], group: 'Academic', color: '#f472b6', requiredFeature: 'SCHOOL_OPS' },
    { path: '/student/assembly', label: 'Assembly', icon: Bell, roles: ['STUDENT'], group: 'Resources', color: '#fbbf24', requiredFeature: 'SCHOOL_OPS' },
    { path: '/student/fees', label: 'Fee Status', icon: CreditCard, roles: ['STUDENT'], group: 'Resources', color: '#ffb663', requiredFeature: 'SCHOOL_OPS' },
    { path: '/library', label: 'Library', icon: Library, roles: ['STUDENT'], group: 'Resources', color: '#34d399' },
    { path: '/forum', label: 'Forums', icon: MessageSquare, roles: ['STUDENT'], group: 'Resources', color: '#6366f1' },
    { path: '/transport/my', label: 'Transport', icon: Bus, roles: ['STUDENT'], group: 'Resources', color: '#fb923c', requiredFeature: 'TRANSPORT_BASE' },
    { path: '/learn', label: 'AI Visualizer', icon: Brain, roles: ['STUDENT'], group: 'Resources', color: '#fbbf24' },
    // Parent
    { path: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['PARENT'], group: 'Overview', color: '#f472b6', requiredFeature: 'SCHOOL_OPS' },
    { path: '/parents/children', label: 'My Children', icon: Users, roles: ['PARENT'], group: 'Family', color: '#22d3ee', requiredFeature: 'SCHOOL_OPS' },
    { path: '/parents/messages', label: 'Messages', icon: MessageSquare, roles: ['PARENT'], group: 'Family', color: '#a78bfa', requiredFeature: 'SCHOOL_OPS' },
    { path: '/learn', label: 'AI Visualizer', icon: Brain, roles: ['PARENT'], group: 'Family', color: '#fbbf24' },
    // Common
    { path: '/profile', label: 'Profile', icon: User, roles: [...PLATFORM_ROLES, 'SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TRANSPORT_MANAGER', 'PARENT', 'DRIVER', 'CONDUCTOR'], group: 'Account', color: '#64748b' },
  ];
  return all.filter(item => item.roles.includes(role));
}

export function ModernLayout() {
  const { 
    session, logout, updateSession,
    accentColor, glassIntensity, borderRadius, theme
  } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; title: string; body: string; time: string; color: string; read: boolean }[]>([]);

  // Fetch real notifications
  useEffect(() => {
    const loadNotifications = async () => {
      const notifs: { id: string; title: string; body: string; time: string; color: string; read: boolean }[] = [];
      // Platform admin: check onboarding queue
      if (session.role === 'PLATFORM_ADMIN' || session.role === 'SUPER_ADMIN') {
        try {
          const [queue, publicInquiries] = await Promise.all([
            onboardingApi.listAll(),
            onboardingApi.listPublicInquiries(),
          ]);
          const pending = queue.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW');
          if (pending.length > 0) {
            notifs.push({
              id: 'pending-review',
              title: `${pending.length} school${pending.length > 1 ? 's' : ''} awaiting review`,
              body: `${pending.map(s => s.schoolName).slice(0, 2).join(', ')}${pending.length > 2 ? ` and ${pending.length - 2} more` : ''} in the onboarding queue.`,
              time: 'Just now',
              color: '#fbbf24',
              read: false,
            });
          }
          const openInquiries = publicInquiries.filter((item) => item.status === 'OPEN');
          if (openInquiries.length > 0) {
            notifs.push({
              id: 'public-inquiries',
              title: `${openInquiries.length} public request${openInquiries.length > 1 ? 's' : ''} waiting`,
              body: `${openInquiries[0].subject}${openInquiries.length > 1 ? ` and ${openInquiries.length - 1} more need platform follow-up.` : ' needs platform follow-up.'}`,
              time: 'Live',
              color: '#f472b6',
              read: false,
            });
          }
          notifs.push({
            id: 'system-health',
            title: 'System health nominal',
            body: `Platform services are operational. ${queue.length} total onboarding records.`,
            time: new Date().toLocaleTimeString(),
            color: '#34d399',
            read: true,
          });
        } catch {
          notifs.push({
            id: 'connectivity-issue',
            title: 'Service connectivity issue',
            body: 'Could not load onboarding queue. Check backend services.',
            time: 'Just now',
            color: '#f43f5e',
            read: false,
          });
        }
      } else {
        notifs.push({
          id: 'welcome',
          title: 'Welcome back!',
          body: `You are logged in as ${session.fullName || 'User'}. Have a productive session.`,
          time: new Date().toLocaleTimeString(),
          color: '#22d3ee',
          read: true,
        });
      }
      setNotifications(notifs);
    };
    loadNotifications();
  }, [session.role, session.fullName]);

  useEffect(() => {
    let cancelled = false;
    const role = session.role || '';

    if (PLATFORM_ROLES.includes(role)) {
      return () => {
        cancelled = true;
      };
    }

    if (!session.tenantId) {
      if (session.isPremium || session.planCode !== 'FREE') {
        updateSession({ isPremium: false, planCode: 'FREE', featureCodes: [] });
      }
      return () => {
        cancelled = true;
      };
    }

    const loadSubscriptionTier = async () => {
      try {
        const current = await subscriptionApi.getCurrent();
        if (cancelled) return;

        const status = (current.status || '').toUpperCase();
        const planCode = (current.planCode || 'FREE').toUpperCase() as 'FREE' | 'BASIC' | 'PREMIUM';
        const isPremium = planCode === 'PREMIUM' && ['ACTIVE', 'TRIAL'].includes(status);
        const featureCodes = current.featureCodes || [];
        const transportScopes =
          role === 'DRIVER' ? ['driver'] :
          role === 'CONDUCTOR' ? ['conductor'] :
          ['PARENT', 'STUDENT', 'TEACHER'].includes(role) ? ['subscriber'] :
          ['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TRANSPORT_MANAGER'].includes(role) ? ['operations'] :
          [];

        if (session.isPremium !== isPremium || session.planCode !== planCode || JSON.stringify(session.featureCodes || []) !== JSON.stringify(featureCodes)) {
          updateSession({ isPremium, planCode, featureCodes, transportScopes });
        }
      } catch {
        if (!cancelled && (session.isPremium || session.planCode !== 'FREE')) {
          updateSession({ isPremium: false, planCode: 'FREE', featureCodes: [], transportScopes: [] });
        }
      }
    };

    loadSubscriptionTier();

    return () => {
      cancelled = true;
    };
  }, [session.role, session.tenantId, session.isPremium, session.planCode, session.featureCodes, updateSession]);

  const unreadCount = notifications.filter((item) => !item.read).length;
  const navItems = getNavItems(session.role || '').filter((item) => hasFeature(session.featureCodes, item.requiredFeature));

  // ── Global Theme Inoculation ──
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-accent', accentColor);
    root.style.setProperty('--glass-intensity', glassIntensity.toString());
    root.style.setProperty('--radius-main', borderRadius);

    // Theme Class Handling
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('light', !isDark);
      root.classList.toggle('dark', isDark);
    } else {
      root.classList.toggle('light', theme === 'light');
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [accentColor, glassIntensity, borderRadius, theme]);

  useEffect(() => {
    if (location.pathname === '/settings') {
      setSidebarCollapsed(true);
    }
  }, [location.pathname]);

  // Group nav items
  const groups = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const roleLabel = {
    PLATFORM_ADMIN: 'Platform', SUPER_ADMIN: 'Platform',
    SCHOOL_ADMIN: 'School Admin', PRINCIPAL: 'Principal', MANAGER: 'Manager', TRANSPORT_MANAGER: 'Transport Manager',
    TEACHER: 'Teacher', STUDENT: 'Student', PARENT: 'Parent', DRIVER: 'Driver', CONDUCTOR: 'Conductor'
  }[session.role || ''] || 'User';

  const roleColor = {
    PLATFORM_ADMIN: '#34d399', SUPER_ADMIN: '#34d399',
    SCHOOL_ADMIN: '#ffb663', PRINCIPAL: '#ffb663', MANAGER: '#ffb663', TRANSPORT_MANAGER: '#fb923c',
    TEACHER: '#a78bfa', STUDENT: '#22d3ee', PARENT: '#f472b6', DRIVER: '#38bdf8', CONDUCTOR: '#fb923c'
  }[session.role || ''] || accentColor;

  const handleLogout = () => { logout(); navigate('/'); };
  const pageTitle = navItems.find(n => n.path === location.pathname)?.label || 'Dashboard';
  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-main, #040b14)', fontFamily: "'Manrope','Inter',system-ui,sans-serif", overflow: 'hidden', position: 'relative' }}>
      <MotionBackdrop mode="minimal" density={1.28} baseColor={roleColor} />

      {/* ── SIDEBAR ── */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 248 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{
          height: '100%', flexShrink: 0, overflow: 'hidden',
          background: 'var(--bg-sidebar, rgba(6, 11, 20, 0.85))',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid var(--glass-border)',
          display: 'flex', flexDirection: 'column', zIndex: 30, position: 'relative',
          boxShadow: '4px 0 24px rgba(2,6,23,0.16)',
        }}
      >
        {/* Sidebar aurora accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30%', background: `radial-gradient(ellipse at 50% 0%, ${roleColor}10 0%, transparent 70%)`, pointerEvents: 'none' }} />

        {/* Brand */}
        <div style={{ padding: sidebarCollapsed ? '20px 16px' : '24px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--glass-border)', flexShrink: 0, position: 'relative' }}>
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
            style={{ width: 38, height: 38, background: `linear-gradient(135deg, ${roleColor}cc, ${roleColor}66)`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 20px ${roleColor}30` }}>
            <Sparkles size={18} color="#040b14" />
          </motion.div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text-strong)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>ElevateSmart</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: roleColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{roleLabel} Portal</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Groups */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 10px' }}>
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} style={{ marginBottom: 20 }}>
              {!sidebarCollapsed && (
                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '0 8px', marginBottom: 6 }}>{group}</div>
              )}
              {items.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.button key={item.path + item.label} whileHover={{ x: sidebarCollapsed ? 0 : 4 }}
                    onClick={() => navigate(item.path)} title={sidebarCollapsed ? item.label : undefined}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: sidebarCollapsed ? '10px 14px' : '10px 12px', borderRadius: 12, background: isActive ? `${item.color}12` : 'transparent', border: `1px solid ${isActive ? `${item.color}20` : 'transparent'}`, color: isActive ? item.color : 'var(--text-soft)', fontSize: '0.82rem', fontWeight: isActive ? 800 : 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', textAlign: 'left', marginBottom: 2, position: 'relative', flexShrink: 0 }}>
                    {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, background: item.color, boxShadow: `0 0 8px ${item.color}` }} />}
                    <item.icon size={17} style={{ flexShrink: 0, color: isActive ? item.color : 'inherit' }} />
                    <AnimatePresence>
                      {!sidebarCollapsed && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--glass-border)', flexShrink: 0 }}>
          <button onClick={handleLogout} title={sidebarCollapsed ? 'Sign Out' : undefined}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'transparent', border: '1px solid transparent', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; e.currentTarget.style.color = '#fb7185'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
            <LogOut size={17} style={{ flexShrink: 0 }} />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 10 }}>
        {/* ── TOP HEADER ── */}
        <header style={{
          height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', background: 'var(--bg-header, rgba(6, 11, 20, 0.7))', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--glass-border)', position: 'relative', zIndex: 20,
          boxShadow: '0 2px 20px rgba(2,6,23,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={goBack}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 10, background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text-soft)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <ArrowLeft size={14} />
              Back
            </motion.button>
            {/* Sidebar toggle */}
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setSidebarCollapsed(p => !p)}
              style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)' }}>
              {sidebarCollapsed ? <Menu size={16} /> : <X size={16} />}
            </motion.button>
            {/* Breadcrumb */}
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ padding: '4px 10px', borderRadius: 999, border: '1px solid var(--glass-border)', color: 'var(--text-soft)', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'var(--surface-elevated)' }}>ElevateSmart</span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span style={{ color: 'var(--text-strong)', fontWeight: 800 }}>{pageTitle}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            \n\n            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <motion.button whileHover={{ scale: 1.1 }} onClick={() => setNotifOpen(!notifOpen)}
                style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)', position: 'relative' }}>
                <Bell size={16} />
                {unreadCount > 0 && <div style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: '#f43f5e', border: '1.5px solid var(--bg-header)' }} />}
              </motion.button>
              {/* Notif Dropdown */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 320, background: 'var(--bg-dropdown, #0a1018)', border: '1px solid var(--glass-border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 48px rgba(2,6,23,0.18)', zIndex: 100 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: 'var(--text-strong)', fontSize: '0.9rem' }}>Notifications</span>
                      <button
                        onClick={() => setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))}
                        style={{ fontSize: '0.68rem', fontWeight: 700, color: unreadCount > 0 ? '#f43f5e' : 'var(--text-dim)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>
                        {unreadCount > 0 ? `Mark ${unreadCount} read` : 'All read'}
                      </button>
                    </div>
                    {notifications.map((n, i) => (
                      <div key={n.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'background 0.2s', background: n.read ? 'transparent' : 'var(--surface-elevated)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, read: true } : item));
                          if (n.id === 'system-health' || n.title.toLowerCase().includes('ai') || n.title.toLowerCase().includes('health')) {
                             navigate('/admin/ai-briefing');
                             setNotifOpen(false);
                          }
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-elevated-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.color, flexShrink: 0, marginTop: 5, boxShadow: `0 0 6px ${n.color}` }} />
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: '0.82rem', marginBottom: 3 }}>{n.title}</div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>{n.body}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>{n.time}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div style={{ padding: '12px 20px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setNotifOpen(false)}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)' }}>Close</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Avatar */}
            <motion.div whileHover={{ scale: 1.05 }} onClick={() => navigate('/profile')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 10px', borderRadius: 12, background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: `linear-gradient(135deg, ${roleColor}50, ${roleColor}20)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900, color: roleColor, border: `1px solid ${roleColor}30` }}>
                {(session.fullName || 'U')[0].toUpperCase()}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.fullName?.split(' ')[0] || 'Profile'}
              </div>
            </motion.div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '32px 36px', position: 'relative', zIndex: 5 }}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette />
      <AiAssistantChat />

      {/* Click-outside to close notifications */}
      {notifOpen && <div onClick={() => setNotifOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />}
    </div>
  );
}
