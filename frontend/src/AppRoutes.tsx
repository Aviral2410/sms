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
import SchoolPortalLandingPage from './pages/SchoolPortalLandingPage';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/ContactPage';
import SupportPage from './pages/SupportPage';
import FoundersMessagePage from './pages/FoundersMessagePage';
import AuthPortal from './pages/AuthPortal';
import SchoolPortalLoginPage from './pages/SchoolPortalLoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import SignupChoicePage from './pages/SignupChoicePage';
import RegistrationWizardPage from './pages/RegistrationWizardPage';
import JoinSchoolPage from './pages/JoinSchoolPage';
import ActivationJourneyPage from './pages/ActivationJourneyPage';
import AiAssistantPage from "./pages/AiAssistantPage";
import AuraNeuralWorkspace from "./pages/AuraNeuralWorkspace";

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
const TeacherProfilePortalPage = lazy(() => import('./pages/teacher/TeacherProfilePortalPage'));
const TeacherHomeworkPage = lazy(() => import('./pages/teacher/TeacherHomeworkPage'));
const TeacherCommunicationPage = lazy(() => import('./pages/teacher/TeacherCommunicationPage'));
const TeacherBehaviourPage = lazy(() => import('./pages/teacher/TeacherBehaviourPage'));
const TeacherMarksPage = lazy(() => import('./pages/teacher/TeacherMarksPage'));
const ParentDashboard = lazy(() => import('./pages/dashboards/ParentDashboard'));
const ParentChildrenPage = lazy(() => import('./pages/parent/ParentChildrenPage'));
const ParentMessagesPage = lazy(() => import('./pages/parent/ParentMessagesPage'));
const LeaveRequestsPage = lazy(() => import('./pages/hr/LeaveRequestsPage'));

const BillingOverview = lazy(() => import('./pages/billing/BillingOverview'));
const InvoiceDetail = lazy(() => import('./pages/billing/InvoiceDetail'));

const OnboardingQueue = lazy(() => import('./pages/admin/OnboardingQueue'));
const SystemLogs = lazy(() => import('./pages/admin/SystemLogs'));
const AllSchools = lazy(() => import('./pages/admin/AllSchools'));
const PlatformAnalytics = lazy(() => import('./pages/admin/PlatformAnalytics'));
const PlatformSettingsPage = lazy(() => import('./pages/admin/PlatformSettingsPage'));
const AiBriefingPage = lazy(() => import('./pages/admin/AiBriefingPage'));
const AiGovernancePage = lazy(() => import('./pages/admin/AiGovernancePage'));
const PublicInquiryInboxPage = lazy(() => import('./pages/admin/PublicInquiryInboxPage'));
const PricingControlPage = lazy(() => import('./pages/admin/PricingControlPage'));

// School Management (lazy)
const ExamManagement = lazy(() => import('./pages/school/ExamManagement'));
const TimetablePage = lazy(() => import('./pages/school/TimetablePage'));
const TransportManagementHubPage = lazy(() => import('./pages/transport/TransportManagementHubPage'));
const TransportDriverConsolePage = lazy(() => import('./pages/transport/TransportDriverConsolePage'));
const TransportConductorPanelPage = lazy(() => import('./pages/transport/TransportConductorPanelPage'));
const TransportSubscriberPage = lazy(() => import('./pages/transport/TransportSubscriberPage'));
const LibraryPage = lazy(() => import('./pages/school/LibraryPage'));
const ForumPage = lazy(() => import('./pages/forum/ForumPage'));
const QuestionDetail = lazy(() => import('./pages/forum/QuestionDetail'));
const CommunicationCenter = lazy(() => import('./pages/school/CommunicationCenter'));
const SchoolAnalyticsPage = lazy(() => import('./pages/school/SchoolAnalyticsPage'));
const SchoolCmsPage = lazy(() => import('./pages/school/SchoolCmsStudioPage'));
const RoutingManagementPage = lazy(() => import('./pages/school/RoutingManagementPage'));
const AcademicStructurePage = lazy(() => import('./pages/school/AcademicStructurePageWrapper'));
const ClassManagementPage = lazy(() => import('./pages/school/ClassManagementPageWrapper'));
const LearningModePage = lazy(() => import('./pages/LearningModePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const StudentProfilePortalPage = lazy(() => import('./pages/student/StudentProfilePortalPage'));
const StudentClassroomPage = lazy(() => import('./pages/student/StudentClassroomPage'));
const StudentTimetablePage = lazy(() => import('./pages/student/StudentTimetablePage'));
const StudentAttendancePage = lazy(() => import('./pages/student/StudentAttendancePage'));
const StudentHomeworkPage = lazy(() => import('./pages/student/StudentHomeworkPage'));
const StudentResultsPage = lazy(() => import('./pages/student/StudentResultsPage'));
const StudentAssemblyUpdatesPage = lazy(() => import('./pages/student/StudentAssemblyUpdatesPage'));
const StudentFeeStatusPage = lazy(() => import('./pages/student/StudentFeeStatusPage'));

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<DashboardSkeleton />}>{children}</Suspense>
);

function LandingPageSwitcher() {
  return isSchoolPortal() ? <SchoolPortalLandingPage /> : <LandingPage />;
}

function ContactPageSwitcher() {
  return isSchoolPortal() ? <SchoolPortalLandingPage initialSection="contact" /> : <ContactPage />;
}

function LoginPageSwitcher({ isAuthenticated }: { isAuthenticated: boolean }) {
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }
  return isSchoolPortal() ? <SchoolPortalLoginPage /> : <AuthPortal />;
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
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPageSwitcher />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/vision" element={<FoundersMessagePage />} />
        <Route path="/founders-message" element={<FoundersMessagePage />} />
        <Route path="/login" element={<LoginPageSwitcher isAuthenticated={isAuthenticated} />} />
        <Route path="/login/admin" element={!isAuthenticated ? <AdminLoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!isAuthenticated ? <SignupChoicePage /> : <Navigate to="/dashboard" />} />
        <Route path="/onboarding" element={!isAuthenticated ? <RegistrationWizardPage /> : <Navigate to="/dashboard" />} />
        <Route path="/join" element={!isAuthenticated ? <JoinSchoolPage /> : <Navigate to="/dashboard" />} />
        <Route path="/activate" element={<ActivationJourneyPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/ai-assistant" element={<AuraNeuralWorkspace />} />

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
          <Route element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER']} />}>
            <Route path="/admissions" element={<Wrap><AdmissionsList /></Wrap>} />
            <Route path="/admissions/new/enroll" element={<Wrap><EnrollmentWizard /></Wrap>} />
            <Route path="/admissions/:id" element={<Wrap><AdmissionDetail /></Wrap>} />
            <Route path="/admissions/:id/enroll" element={<Wrap><EnrollmentWizard /></Wrap>} />
            <Route path="/school/cms" element={<Wrap><SchoolCmsPage /></Wrap>} />
            <Route path="/school/routing" element={<Wrap><RoutingManagementPage /></Wrap>} />
          </Route>

          {/* Attendance (Teacher, Admin, Student) */}
          <Route element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TEACHER', 'STUDENT']} />}>
            <Route path="/attendance" element={<Wrap><AttendanceDashboard /></Wrap>} />
            <Route path="/attendance/teacher" element={<Wrap><TeacherAttendanceManager /></Wrap>} />
            <Route path="/attendance/student" element={<Wrap><StudentAttendanceView /></Wrap>} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TEACHER']} />}>
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
            <Route path="/admin/ai-briefing" element={<Wrap><AuraNeuralWorkspace /></Wrap>} />
            <Route path="/admin/ai-governance" element={<Wrap><AiGovernancePage /></Wrap>} />
            <Route path="/admin/inquiries" element={<Wrap><PublicInquiryInboxPage /></Wrap>} />
            <Route path="/admin/pricing" element={<Wrap><PricingControlPage /></Wrap>} />
          </Route>

          {/* School Management (Shared) */}
          <Route path="/exams" element={<Wrap><ExamManagement /></Wrap>} />
          <Route path="/timetable" element={<Wrap><TimetablePage /></Wrap>} />
          <Route element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TRANSPORT_MANAGER']} />}>
            <Route path="/transport" element={<Wrap><TransportManagementHubPage /></Wrap>} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['DRIVER']} />}>
            <Route path="/transport/driver" element={<Wrap><TransportDriverConsolePage /></Wrap>} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['CONDUCTOR']} />}>
            <Route path="/transport/conductor" element={<Wrap><TransportConductorPanelPage /></Wrap>} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['PARENT', 'STUDENT', 'TEACHER']} />}>
            <Route path="/transport/my" element={<Wrap><TransportSubscriberPage /></Wrap>} />
          </Route>
          <Route path="/library" element={<Wrap><LibraryPage /></Wrap>} />
          <Route path="/forum" element={<Wrap><ForumPage /></Wrap>} />
          <Route path="/forum/:id" element={<Wrap><QuestionDetail /></Wrap>} />
          <Route path="/communication" element={<Wrap><CommunicationCenter /></Wrap>} />
          <Route path="/school/analytics" element={<Wrap><SchoolAnalyticsPage /></Wrap>} />
          <Route path="/school/structure" element={<Wrap><AcademicStructurePage /></Wrap>} />
          <Route path="/school/classes" element={<Wrap><ClassManagementPage /></Wrap>} />
          <Route path="/learn" element={<Wrap><LearningModePage /></Wrap>} />

          <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
            <Route path="/student/profile" element={<Wrap><StudentProfilePortalPage /></Wrap>} />
            <Route path="/student/classroom" element={<Wrap><StudentClassroomPage /></Wrap>} />
            <Route path="/student/timetable" element={<Wrap><StudentTimetablePage /></Wrap>} />
            <Route path="/student/attendance" element={<Wrap><StudentAttendancePage /></Wrap>} />
            <Route path="/student/homework" element={<Wrap><StudentHomeworkPage /></Wrap>} />
            <Route path="/student/results" element={<Wrap><StudentResultsPage /></Wrap>} />
            <Route path="/student/assembly" element={<Wrap><StudentAssemblyUpdatesPage /></Wrap>} />
            <Route path="/student/fees" element={<Wrap><StudentFeeStatusPage /></Wrap>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
            <Route path="/teacher/profile" element={<Wrap><TeacherProfilePortalPage /></Wrap>} />
            <Route path="/teacher/homework" element={<Wrap><TeacherHomeworkPage /></Wrap>} />
            <Route path="/teacher/communication" element={<Wrap><TeacherCommunicationPage /></Wrap>} />
            <Route path="/teacher/behaviour" element={<Wrap><TeacherBehaviourPage /></Wrap>} />
            <Route path="/teacher/marks" element={<Wrap><TeacherMarksPage /></Wrap>} />
          </Route>

          {/* Parent specific */}
          <Route element={<ProtectedRoute allowedRoles={['PARENT']} />}>
            <Route path="/parents/children" element={<Wrap><ParentChildrenPage /></Wrap>} />
            <Route path="/parents/messages" element={<Wrap><ParentMessagesPage /></Wrap>} />
          </Route>

          {/* HR / Operations (Phase 1) */}
          <Route element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TEACHER', 'STAFF']} />}>
            <Route path="/hr/leaves" element={<Wrap><LeaveRequestsPage /></Wrap>} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} />
      </Routes>
    </>
  );
};

