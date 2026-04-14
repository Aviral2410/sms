import React, { lazy, Suspense } from 'react';
import { useStore } from '../store/useStore';
import { Loader } from 'lucide-react';

const SchoolAdminDashboard = lazy(() => import('./dashboards/SchoolAdminDashboard'));
const TeacherWorkspacePage = lazy(() => import('./teacher/TeacherWorkspacePage'));
const StudentDashboard = lazy(() => import('./dashboards/StudentDashboard'));
const PlatformDashboard = lazy(() => import('./dashboards/PlatformDashboard'));
const ParentDashboard = lazy(() => import('./dashboards/ParentDashboard'));

const BillingOverview = lazy(() => import('./billing/BillingOverview'));

const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: 'var(--text-dim)' }}>
    <Loader size={22} style={{ animation: 'spin 1s linear infinite', color: '#ffb663' }} />
    <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
  </div>
);

// Maps role → correct dashboard component
const ADMIN_ROLES = new Set(['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER']);
const PLATFORM_ROLES = new Set(['PLATFORM_ADMIN', 'SUPER_ADMIN']);

export default function Dashboard() {
  const { session } = useStore();
  const role = session.role || '';

  let DashComponent: any = SchoolAdminDashboard; // default fallback

  if (PLATFORM_ROLES.has(role)) {
    DashComponent = PlatformDashboard;
  } else if (ADMIN_ROLES.has(role)) {
    DashComponent = SchoolAdminDashboard;
  } else if (role === 'STAFF') {
    DashComponent = BillingOverview;
  } else if (role === 'TEACHER') {
    DashComponent = TeacherWorkspacePage;
  } else if (role === 'STUDENT') {
    DashComponent = StudentDashboard;
  } else if (role === 'PARENT') {
    DashComponent = ParentDashboard;
  }

  return (
    <Suspense fallback={<Spinner />}>
      {React.createElement(DashComponent as any)}
    </Suspense>
  );
}
