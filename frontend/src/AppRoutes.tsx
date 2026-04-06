import React, { Suspense, lazy, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModernLayout } from './layouts/ModernLayout';
import { useStore } from './store/useStore';
import { DashboardSkeleton } from './components/ui/Skeleton';
import { Toaster } from 'sonner';
import { RealtimeHub } from './components/RealtimeHub';
import { isSchoolPortal } from './lib/subdomain';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Public pages
import LandingPage from './pages/LandingPage';
import SchoolLandingPage from './pages/SchoolLandingPage';
import AuthPortal from './pages/AuthPortal';
import AdminLoginPage from './pages/AdminLoginPage';
import SignupChoicePage from './pages/SignupChoicePage';
import RegistrationPage from './pages/RegistrationPage';
import JoinSchoolPage from './pages/JoinSchoolPage';
import ActivationPage from './pages/ActivationPage';

// Protected pages (lazy)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdmissionsList = lazy(() => import('./pages/admissions/AdmissionsList'));
const AdmissionDetail = lazy(() => import('./pages/admissions/AdmissionDetail'));
const EnrollmentWizard = lazy(() => import('./pages/admissions/EnrollmentWizard'));
const AttendanceDashboard = lazy(() => import('./pages/attendance/AttendanceDashboard'));
const TeacherAttendanceManager = lazy(() => import('./pages/attendance/TeacherAttendanceManager'));
const StudentAttendanceView = lazy(() => import('./pages/attendance/StudentAttendanceView'));
const MarkingFlow = lazy(() => import('./pages/attendance/MarkingFlow'));
const TeacherClassesPage = lazy(() => import('./pages/teacher/TeacherClassesPage'));
const TeacherNoticesPage = lazy(() => import('./pages/teacher/TeacherNoticesPage'));
const StudentProfilePage = lazy(() => import('./pages/teacher/StudentProfilePage'));
const TeacherStudentsPage = lazy(() => import('./pages/teacher/TeacherStudentsPage'));
const TeacherManagementPage = lazy(() => import('./pages/school/TeacherManagementPageWrapper'));
const StudentManagementPage = lazy(() => import('./pages/school/StudentManagementPageWrapper'));
const TeacherWorkspacePage = lazy(() => import('./pages/teacher/TeacherWorkspacePage'));
const ParentDashboard = lazy(() => import('./pages/dashboards/ParentDashboard'));
const ParentChildrenPage = lazy(() => import('./pages/parent/ParentChildrenPage'));
const ParentMessagesPage = lazy(() => import('./pages/parent/ParentMessagesPage'));

const BillingOverview = lazy(() => import('./pages/billing/BillingOverview'));
const InvoiceDetail = lazy(() => import('./pages/billing/InvoiceDetail'));

const OnboardingQueue = lazy(() => import('./pages/admin/OnboardingQueue'));
const SystemLogs = lazy(() => import('./pages/admin/SystemLogs'));
const AllSchools = lazy(() => import('./pages/admin/AllSchools'));
const PlatformAnalytics = lazy(() => import('./pages/admin/PlatformAnalytics'));
const PlatformSettingsPage = lazy(() => import('./pages/admin/PlatformSettingsPage'));
const AiBriefingPage = lazy(() => import('./pages/admin/AiBriefingPage'));

// School Management (lazy)
const ExamManagement = lazy(() => import('./pages/school/ExamManagement'));
const TimetablePage = lazy(() => import('./pages/school/TimetablePage'));
const TransportPage = lazy(() => import('./pages/school/TransportPage'));
const LibraryPage = lazy(() => import('./pages/school/LibraryPage'));
const ForumPage = lazy(() => import('./pages/forum/ForumPage'));
const QuestionDetail = lazy(() => import('./pages/forum/QuestionDetail'));
const CommunicationCenter = lazy(() => import('./pages/school/CommunicationCenter'));
const SchoolAnalyticsPage = lazy(() => import('./pages/school/SchoolAnalyticsPage'));
const LearningModePage = lazy(() => import('./pages/LearningModePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<DashboardSkeleton />}>{children}</Suspense>
);

const PlaceholderPage = ({ title }: { title: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', flexDirection: 'column', gap: 12, color: 'var(--text-dim)', fontFamily: "'Manrope',sans-serif" }}>
    <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ffb663' }}>Coming Soon</div>
    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-strong)', margin: 0 }}>{title}</h2>
  </div>
);

function LandingPageSwitcher() {
  return isSchoolPortal() ? <SchoolLandingPage /> : <LandingPage />;
}

export const AppRoutes: React.FC = () => {
  const { session, theme } = useStore();
  const isAuthenticated = !!session.email;
  const toasterTheme = useMemo(() => {
    if (theme === 'system') {
      return 'system';
    }
    return theme;
  }, [theme]);

  return (
    <>
      <Toaster theme={toasterTheme} position="bottom-right" richColors toastOptions={{
        style: { background: 'var(--bg-dropdown)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }
      }} />

      <Routes>
        {/* ── Public ── */}
        <Route path="/" element={<LandingPageSwitcher />} />
        <Route path="/login" element={!isAuthenticated ? <AuthPortal /> : <Navigate to="/dashboard" />} />
        <Route path="/login/admin" element={!isAuthenticated ? <AdminLoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!isAuthenticated ? <SignupChoicePage /> : <Navigate to="/dashboard" />} />
        <Route path="/onboarding" element={!isAuthenticated ? <RegistrationPage /> : <Navigate to="/dashboard" />} />
        <Route path="/join" element={!isAuthenticated ? <JoinSchoolPage /> : <Navigate to="/dashboard" />} />
        <Route path="/activate" element={<ActivationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* ── Protected (Base) ── */}
        <Route element={isAuthenticated ? (
          <RealtimeHub tenantId={session.tenantId || undefined}>
            <ModernLayout />
          </RealtimeHub>
        ) : <Navigate to="/" />}>
          
          <Route path="/dashboard" element={<Wrap><Dashboard /></Wrap>} />
          <Route path="/profile" element={<Wrap><ProfilePage /></Wrap>} />
          <Route path="/settings" element={<Wrap><PlatformSettingsPage /></Wrap>} />

          {/* Admissions (School Admin only) */}
          <Route element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN']} />}>
            <Route path="/admissions" element={<Wrap><AdmissionsList /></Wrap>} />
            <Route path="/admissions/:id" element={<Wrap><AdmissionDetail /></Wrap>} />
            <Route path="/admissions/:id/enroll" element={<Wrap><EnrollmentWizard /></Wrap>} />
          </Route>

          {/* Attendance (Teacher or School Admin) */}
          <Route element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'TEACHER']} />}>
            <Route path="/attendance" element={<Wrap><AttendanceDashboard /></Wrap>} />
            <Route path="/attendance/teacher" element={<Wrap><TeacherAttendanceManager /></Wrap>} />
            <Route path="/attendance/student" element={<Wrap><StudentAttendanceView /></Wrap>} />
            <Route path="/attendance/:classId/mark" element={<Wrap><MarkingFlow /></Wrap>} />
          </Route>

          {/* Billing (School Admin only) */}
          <Route element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN']} />}>
            <Route path="/billing" element={<Wrap><BillingOverview /></Wrap>} />
            <Route path="/billing/:invoiceId" element={<Wrap><InvoiceDetail /></Wrap>} />
          </Route>

          {/* Management */}
          <Route path="/students" element={
            <Wrap>
              {session.role === 'SCHOOL_ADMIN' ? <StudentManagementPage /> : <TeacherStudentsPage />}
            </Wrap>
          } />
          <Route path="/students/:id" element={<Wrap><StudentProfilePage /></Wrap>} />
          
          <Route element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN']} />}>
            <Route path="/teachers" element={<Wrap><TeacherManagementPage /></Wrap>} />
          </Route>

          <Route path="/classes" element={<Wrap><TeacherClassesPage /></Wrap>} />
          <Route path="/notices" element={<Wrap><TeacherNoticesPage /></Wrap>} />

          {/* Platform Admin Only */}
          <Route element={<ProtectedRoute allowedRoles={['PLATFORM_ADMIN', 'SUPER_ADMIN']} />}>
            <Route path="/admin/onboarding" element={<Wrap><OnboardingQueue /></Wrap>} />
            <Route path="/admin/logs" element={<Wrap><SystemLogs /></Wrap>} />
            <Route path="/admin/schools" element={<Wrap><AllSchools /></Wrap>} />
            <Route path="/admin/analytics" element={<Wrap><PlatformAnalytics /></Wrap>} />
            <Route path="/admin/ai-briefing" element={<Wrap><AiBriefingPage /></Wrap>} />
          </Route>

          {/* School Management (Shared) */}
          <Route path="/exams" element={<Wrap><ExamManagement /></Wrap>} />
          <Route path="/timetable" element={<Wrap><TimetablePage /></Wrap>} />
          <Route path="/transport" element={<Wrap><TransportPage /></Wrap>} />
          <Route path="/library" element={<Wrap><LibraryPage /></Wrap>} />
          <Route path="/forum" element={<Wrap><ForumPage /></Wrap>} />
          <Route path="/forum/:id" element={<Wrap><QuestionDetail /></Wrap>} />
          <Route path="/communication" element={<Wrap><CommunicationCenter /></Wrap>} />
          <Route path="/school/analytics" element={<Wrap><SchoolAnalyticsPage /></Wrap>} />
          <Route path="/learn" element={<Wrap><LearningModePage /></Wrap>} />

          {/* Parent specific */}
          <Route element={<ProtectedRoute allowedRoles={['PARENT']} />}>
            <Route path="/parents/children" element={<Wrap><ParentChildrenPage /></Wrap>} />
            <Route path="/parents/messages" element={<Wrap><ParentMessagesPage /></Wrap>} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} />
      </Routes>
    </>
  );
};
