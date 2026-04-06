// Typed API wrapper for all backend services
const BASE = '/api/v1';

type AuthSessionLike = {
  token?: string | null;
  tenantId?: string | null;
  schoolId?: string | null;
  role?: string | null;
};

const SESSION_STORAGE_KEYS = [
  'sms-admin-session',
  'sms-school-session',
  'sms-saas-v2-state',
] as const;

function readJsonStorageItem(key: string): unknown {
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`[api] Failed to parse localStorage key "${key}"`, error);
    return null;
  }
}

function readPersistedSession(): AuthSessionLike | null {
  for (const key of SESSION_STORAGE_KEYS) {
    const parsed = readJsonStorageItem(key);

    if (parsed && typeof parsed === 'object' && 'token' in (parsed as Record<string, unknown>)) {
      return parsed as AuthSessionLike;
    }

    if (
      key === 'sms-saas-v2-state' &&
      parsed &&
      typeof parsed === 'object' &&
      'state' in (parsed as Record<string, unknown>)
    ) {
      const persistedState = (parsed as { state?: { session?: AuthSessionLike } }).state;
      if (persistedState?.session?.token) {
        return persistedState.session;
      }
    }
  }

  return null;
}

function resolveSession(): AuthSessionLike {
  const store = (window as any).useStore;
  const storeSession = store?.getState?.().session as AuthSessionLike | undefined;
  const persistedSession = readPersistedSession();
  const session = storeSession?.token ? storeSession : persistedSession || storeSession || {};

  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    console.debug('[api] auth session resolved', {
      pathSource: storeSession?.token ? 'store' : persistedSession?.token ? 'storage' : 'none',
      hasStore: Boolean(store?.getState),
      hasToken: Boolean(session?.token),
      role: session?.role ?? null,
    });
  }

  return session;
}

export async function request<T>(path: string, options?: RequestInit & { skipDefaultBase?: boolean }): Promise<T> {
  const session = resolveSession();

  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');

  if (session.token) headers.set('Authorization', `Bearer ${session.token}`);
  
  // Note: X-User-Role, X-Tenant-ID, X-School-ID are now injected by the gateway based on the token.
  // We keep them as fallbacks for transition or public routes if needed, but the gateway will overwrite them for authenticated routes.
  if (session.tenantId) headers.set('X-Tenant-ID', session.tenantId);
  if (session.schoolId) headers.set('X-School-ID', session.schoolId);

  const url = options?.skipDefaultBase ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = res.status === 204
    ? undefined
    : isJson
      ? await res.json().catch(() => undefined)
      : await res.text().catch(() => undefined);

  if (!res.ok) {
    if (payload && typeof payload === 'object') {
      const detail = 'detail' in payload && typeof payload.detail === 'string' ? payload.detail : '';
      const title = 'title' in payload && typeof payload.title === 'string' ? payload.title : '';
      const errors = 'errors' in payload && Array.isArray(payload.errors) ? payload.errors.join(', ') : '';
      throw new Error(errors || detail || title || `HTTP ${res.status}`);
    }

    const text = typeof payload === 'string' ? payload : '';
    throw new Error(text || `HTTP ${res.status}`);
  }

  return payload as T;
}

// ── Auth ────────────────────────────────────────────────────────────────────
export interface SchoolLoginResponse {
  userId: string;
  tenantId: string;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  email: string;
  fullName: string;
  role: string;
  theme?: string;
  activeTheme?: string;
  vibe?: string;
  accentColor?: string;
  glassIntensity?: number;
  borderRadius?: string;
  token: string;
}

export interface AdminLoginResponse {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  theme?: string;
  activeTheme?: string;
  vibe?: string;
  accentColor?: string;
  glassIntensity?: number;
  borderRadius?: string;
  token: string;
}

export interface ActivationResponse {
  schoolCode: string;
  email: string;
  fullName: string;
  status: string;
}

export const authApi = {
  schoolLogin: (body: { schoolCode: string; email: string; password: string }) =>
    request<SchoolLoginResponse>('/auth/school/login', { method: 'POST', body: JSON.stringify(body) }),

  adminLogin: (body: { email: string; password: string }) =>
    request<AdminLoginResponse>('/auth/admin/login', { method: 'POST', body: JSON.stringify(body) }),

  activateAccount: (body: { schoolCode: string; email: string; activationCode: string; newPassword: string }) =>
    request<ActivationResponse>('/auth/school/activate', { method: 'POST', body: JSON.stringify(body) }),
};

// ── Onboarding ───────────────────────────────────────────────────────────────
export interface OnboardingRequest {
  schoolName: string;
  schoolCode: string;
  boardAffiliation: string;
  contactEmail: string;
  contactPhone: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface OnboardingResponse {
  onboardingId: string;
  schoolName: string;
  schoolCode: string;
  status: string;
  boardAffiliation: string;
  city: string;
  state: string;
  adminEmail: string;
  reviewedBy?: string | null;
  reviewComment?: string | null;
  reviewedAt?: string | null;
  tenantId?: string | null;
  schoolId?: string | null;
  createdAt: string;
  activatedAt?: string;
  activationSentAt?: string;
  activationCode?: string;
  requiredDocuments?: string[];
}

export interface PublicSchoolProfileResponse {
  onboardingId: string;
  schoolName: string;
  schoolCode: string;
  city: string;
  state: string;
  vision: string;
  mission: string;
  achievements: string[];
  houses: { name: string; color: string; motto: string; icon: string }[];
}

export const onboardingApi = {
  create: (body: OnboardingRequest) =>
    request<OnboardingResponse>('/onboarding/schools', { method: 'POST', body: JSON.stringify(body) }),

  listAll: () => request<OnboardingResponse[]>('/onboarding/schools'),

  review: (onboardingId: string, action: 'START_REVIEW' | 'APPROVE' | 'REJECT', reviewerName: string, comment: string) =>
    request<OnboardingResponse>(`/onboarding/schools/${onboardingId}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ action, reviewerName, comment }),
    }),
  markActivationAsSent: (onboardingId: string) =>
    request<OnboardingResponse>(`/onboarding/schools/${onboardingId}/activation-sent`, { method: 'POST' }),
  sendEmail: (onboardingId: string) => request<void>(`/onboarding/schools/${onboardingId}/activation-email`, { method: 'POST' }),
  delete: (onboardingId: string) =>
    request<void>(`/onboarding/schools/${onboardingId}`, { method: 'DELETE' }),
};

// ── School Operations ────────────────────────────────────────────────────────
export interface SchoolDashboard {
  schoolId: string;
  departmentCount: number;
  subjectCount: number;
  classCount: number;
  teacherCount: number;
  studentCount: number;
  staffCount: number;
  admissionsCount: number;
  attendanceRecordCount: number;
  feeRecordCount: number;
  homeworkCount: number;
  noticeCount: number;
  timetableSlotCount: number;
  examResultCount: number;
}

export interface TeacherWorkspace {
  schoolId: string;
  schoolCode: string;
  teacher: { userId: string; fullName: string; email: string; roleName: string };
  assignedSubjects: { subjectId: string; subjectName: string; subjectCode: string }[];
  assignedClasses: { classId: string; className: string; sectionName: string; academicYear: string }[];
  classTeacherOf: { classId: string; className: string; sectionName: string; academicYear: string }[];
  scheduleStatus: string;
  scheduleMessage: string;
}

export interface StudentWorkspaceResponse {
  schoolId: string;
  schoolCode: string;
  student: { userId: string; fullName: string; email: string; roleName: string };
  enrolledClass: { classId: string; className: string; sectionName: string; academicYear: string } | null;
  classTeacher: { userId: string; fullName: string; email: string; roleName: string } | null;
  subjectTeachers: { subjectName: string; subjectCode: string; teacherName: string; teacherEmail: string }[];
  scheduleStatus: string;
  scheduleMessage: string;
}

export interface AcademicClassResponse {
  classId: string;
  schoolId: string;
  className: string;
  sectionName: string;
  academicYear: string;
  createdAt: string;
}

export interface SubjectResponse {
  subjectId: string;
  schoolId: string;
  departmentId: string;
  subjectName: string;
  subjectCode: string;
  createdAt: string;
}

export interface NoticeBoardItemResponse {
  noticeId: string;
  schoolId: string;
  title: string;
  message: string;
  audience: string;
  publishedAt: string;
  createdAt: string;
}

export interface ParentWorkspaceResponse {
  schoolId: string;
  schoolCode: string;
  parent: { userId: string; fullName: string; email: string; roleName: string };
  children: StudentWorkspaceResponse[];
  recentVoiceNotes: VoiceNoteResponse[];
}

export interface VoiceNoteResponse {
  voiceNoteId: string;
  schoolId: string;
  relatedUserId: string;
  audience: string;
  title: string;
  transcript: string;
  audioUrl: string;
  translations: string;
  createdAt: string;
}

export interface TransportRouteResponse {
  routeId: string;
  schoolId: string;
  routeName: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  attendantName: string;
  status: string;
  capacity: number;
  conductorName: string;
  conductorPhone: string;
  createdAt: string;
}

export interface TransportStopResponse {
  stopId: string;
  schoolId: string;
  routeId: string;
  stopName: string;
  stopOrder: number;
  latitude: number;
  longitude: number;
  pickupTime: string;
  dropTime: string;
  createdAt: string;
}

export interface TransportStudentAssignmentResponse {
  assignmentId: string;
  schoolId: string;
  studentUserId: string;
  routeId: string;
  stopId: string;
  createdAt: string;
}

export interface TransportVehiclePositionResponse {
  positionId: string;
  schoolId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  recordedAt: string;
}

export interface TransportPickupLogResponse {
  logId: string;
  schoolId: string;
  routeId: string;
  studentUserId: string;
  stopId: string;
  action: 'PICKED_UP' | 'DROPPED_OFF' | 'ABSENT' | 'MISSED';
  markedBy: string;
  tripDate: string;
  markedAt: string;
}

export interface TransportRouteFull {
  route: TransportRouteResponse;
  stops: TransportStopResponse[];
  assignments: TransportStudentAssignmentResponse[];
  latestPosition: TransportVehiclePositionResponse | null;
}

export interface SchoolUser {
  userId: string;
  fullName: string;
  email: string;
  roleName: string;
  schoolId: string;
  tenantId: string;
  schoolCode: string;
  createdAt: string;
  theme?: string;
  activeTheme?: string;
  vibe?: string;
  accentColor?: string;
  glassIntensity?: number;
  borderRadius?: string;
}

export interface StudentAdmissionResponse {
  admissionId: string;
  schoolId: string;
  studentUserId: string;
  admissionNo: string;
  admittedOn: string;
  dateOfBirth: string | null;
  guardianName: string;
  guardianPhone: string;
  address: string | null;
  previousSchool: string | null;
  admissionStatus: 'LEAD' | 'APPLICATION' | 'ADMITTED' | 'ACTIVE' | 'INACTIVE' | 'ALUMNI';
  createdAt: string;
}

export interface StudentClassEnrollmentResponse {
  enrollmentId: string;
  schoolId: string;
  studentUserId: string;
  classId: string;
  createdAt: string;
}

export interface StudentMonitoringReportResponse {
  reportId: string;
  schoolId: string;
  studentUserId: string;
  reportMonth: string;
  academicYear: string;
  attendancePercentage: number;
  academicNote: string | null;
  behaviourNote: string | null;
  wellbeingNote: string | null;
  createdAt: string;
}

export interface StudentDirectoryRowResponse {
  studentUserId: string;
  fullName: string;
  email: string;
  createdAt: string;
  admissionId: string | null;
  admissionNo: string | null;
  admittedOn: string | null;
  admissionStatus: 'LEAD' | 'APPLICATION' | 'ADMITTED' | 'ACTIVE' | 'INACTIVE' | 'ALUMNI' | null;
  guardianName: string | null;
  guardianPhone: string | null;
  classId: string | null;
  className: string | null;
  sectionName: string | null;
  routeId: string | null;
  routeName: string | null;
  stopId: string | null;
  stopName: string | null;
  latestReportMonth: string | null;
  latestReportAcademicYear: string | null;
  latestAttendancePercentage: number | null;
  latestAcademicNote: string | null;
  latestBehaviourNote: string | null;
  latestWellbeingNote: string | null;
}

export interface StudentRowResponse {
  studentUserId: string;
  schoolId: string;
  admissionId: string | null;
  fullName: string;
  email: string;
  admissionNo: string | null;
  rollNo: string | null;
  className: string | null;
  sectionName: string | null;
  classId: string | null;
  classTeacherName: string | null;
  guardianName: string | null;
  contact: string | null;
  transportStatus: 'ASSIGNED' | 'UNASSIGNED' | string;
  routeId: string | null;
  routeName: string | null;
  stopId: string | null;
  status: 'LEAD' | 'APPLICATION' | 'ADMITTED' | 'ACTIVE' | 'INACTIVE' | 'ALUMNI' | 'UNTRACKED' | string;
  createdAt: string;
}

export interface StudentsPageResponse {
  items: StudentRowResponse[];
  total: number;
  page: number;
  size: number;
  hasMore: boolean;
}

export interface StudentAnalyticsPoint {
  label: string;
  value: number;
}

export interface StudentAnalyticsResponse {
  studentUserId: string;
  attendancePercentage: number;
  attendanceTrend: StudentAnalyticsPoint[];
  academicProgress: StudentAnalyticsPoint[];
  behaviourSummary: string;
  remarksSummary: string;
}

export interface StudentUpsertRequest {
  schoolId: string;
  studentUserId?: string | null;
  fullName: string;
  email: string;
  admissionNo: string;
  rollNo?: string | null;
  guardianName: string;
  contact: string;
  address?: string | null;
  previousSchool?: string | null;
  admissionStatus: 'LEAD' | 'APPLICATION' | 'ADMITTED' | 'ACTIVE' | 'INACTIVE' | 'ALUMNI';
  classId?: string | null;
  routeId?: string | null;
  stopId?: string | null;
}

export interface FeeRecordResponse {
  feeRecordId: string;
  schoolId: string;
  studentUserId: string;
  feeCategory: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  paymentStatus: string;
  createdAt: string;
}

export interface TimetableSlotResponse {
  slotId: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  teacherUserId: string;
  dayOfWeek: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  roomNumber: string;
  createdAt: string;
}

export interface LibraryResourceResponse {
  resourceId: string;
  schoolId: string;
  title: string;
  resourceType: string;
  authorName?: string;
  accessUrl: string;
  description?: string;
  subject?: string;
  gradeLevel?: string;
  tags?: string;
  uploadedByUserId?: string;
  fileSize?: number;
  createdAt: string;
  isBookmarked: boolean;
  viewCount: number;
}

export interface AttendanceRecordResponse {
  attendanceId: string;
  schoolId: string;
  userId: string;
  roleName: string;
  classId: string | null;
  teacherUserId: string | null;
  subjectId: string | null;
  attendanceMode: string | null;
  timetableSlotId: string | null;
  periodNumber: number | null;
  attendanceDate: string;
  attendanceStatus: string;
  markedBy: string;
  recordedAt: string | null;
  createdAt: string;
}

export interface ExamResultRecordResponse {
  resultId: string;
  schoolId: string;
  studentUserId: string;
  subjectId: string;
  examName: string;
  academicYear: string;
  marksObtained: number;
  maxMarks: number;
  grade?: string;
  createdAt: string;
}

export interface AttendanceAnalyticsResponse {
  trend: { date: string; total: number; present: number; absent: number; late: number; leave: number }[];
  byClass: { classId: string; className: string; sectionName: string; total: number; present: number; absent: number }[];
  byTeacher: { teacherUserId: string; teacherName: string; totalMarked: number }[];
}

export interface ForumQuestionResponse {
  questionId: string;
  schoolId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  subject?: string;
  status: 'APPROVED' | 'BLOCKED' | 'FLAGGED';
  upvotes: number;
  answerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ForumAnswerResponse {
  answerId: string;
  questionId: string;
  authorId: string;
  authorName: string;
  content: string;
  isCorrect: boolean;
  upvotes: number;
  status: 'APPROVED' | 'BLOCKED' | 'FLAGGED';
  createdAt: string;
}

export interface ForumLeaderboardEntry {
  userId: string;
  fullName: string;
  roleName: string;
  points: number;
  rank: number;
}

export interface ForumLeaderboardResponse {
  schoolId: string;
  period: 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';
  entries: ForumLeaderboardEntry[];
}

export interface VisualizationStep {
  stepNumber: number;
  heading: string;
  explanation: string;
  icon: string;
  visual?: string;
  tip?: string;
}

export interface McpToolCallResponse {
  content: { type: string; text: string }[];
  isError?: boolean;
}

export interface VisualizeResponse {
  title: string;
  summary: string;
  subject: string;
  level: string;
  steps: VisualizationStep[];
  approaches: string[];
  tags: string[];
  llmEnhanced: boolean;
  diagramType?: 'NONE' | 'MIND_MAP' | 'FLOWCHART' | 'XY_CHART';
  diagramDefinition?: string;
}

export interface AiExample {
  title: string;
  scenario: string;
  solution: string;
  difficulty: string;
}

export interface ExampleResponse {
  examples: AiExample[];
  relatedTopics: string[];
  llmEnhanced: boolean;
}

export const schoolOpsApi = {
  getForumFeed: (schoolId: string, subject?: string) =>
    request<ForumQuestionResponse[]>(`/school-ops/forum/feed?schoolId=${schoolId}${subject ? `&subject=${subject}` : ''}`),

  askForumQuestion: (body: { schoolId: string; authorId: string; authorName: string; title: string; content: string; subject?: string }) =>
    request<ForumQuestionResponse>('/school-ops/forum/questions', { method: 'POST', body: JSON.stringify(body) }),

  answerForumQuestion: (body: { questionId: string; authorId: string; authorName: string; content: string }) =>
    request<ForumAnswerResponse>('/school-ops/forum/answers', { method: 'POST', body: JSON.stringify(body) }),

  getForumAnswers: (questionId: string) =>
    request<ForumAnswerResponse[]>(`/school-ops/forum/questions/${questionId}/answers`),

  voteForum: (body: { targetId: string; voterId: string; voteType: number }) =>
    request<void>('/school-ops/forum/votes', { method: 'POST', body: JSON.stringify(body) }),

  flagForum: (body: { targetId: string; reporterId: string; reason: string }) =>
    request<void>('/school-ops/forum/flags', { method: 'POST', body: JSON.stringify(body) }),

  markAnswerCorrect: (answerId: string) =>
    request<void>(`/school-ops/forum/answers/${answerId}/correct`, { method: 'PATCH' }),

  getForumLeaderboard: (schoolId: string, period: string = 'WEEKLY') =>
    request<ForumLeaderboardResponse>(`/school-ops/forum/leaderboard?schoolId=${schoolId}&period=${period}`),

  getDashboard: (schoolId: string) =>
    request<SchoolDashboard>(`/school-ops/dashboard?schoolId=${schoolId}`),

  getTeacherWorkspace: (schoolId: string, email: string) =>
    request<TeacherWorkspace>(`/school-ops/teacher-workspace?schoolId=${schoolId}&email=${encodeURIComponent(email)}`),

  getStudentWorkspace: (schoolId: string, email: string) =>
    request<StudentWorkspaceResponse>(`/school-ops/student-workspace?schoolId=${schoolId}&email=${encodeURIComponent(email)}`),

  createUser: (body: {
    schoolId: string;
    tenantId: string;
    schoolCode: string;
    schoolName: string;
    fullName: string;
    email: string;
    roleName: string;
    accessKey?: string;
  }) => request<SchoolUser>('/school-ops/users', { method: 'POST', body: JSON.stringify(body) }),

  listUsers: (schoolId: string) =>
    request<SchoolUser[]>(`/school-ops/users?schoolId=${schoolId}`),

  listClasses: (schoolId: string) =>
    request<AcademicClassResponse[]>(`/school-ops/classes?schoolId=${schoolId}`),

  listSubjects: (schoolId: string) =>
    request<SubjectResponse[]>(`/school-ops/subjects?schoolId=${schoolId}`),

  listNoticeBoardItems: (schoolId: string) =>
    request<NoticeBoardItemResponse[]>(`/school-ops/notices?schoolId=${schoolId}`),

  getParentWorkspace: (schoolId: string, email: string) =>
    request<ParentWorkspaceResponse>(`/school-ops/parent-workspace?schoolId=${schoolId}&email=${encodeURIComponent(email)}`),

  linkParentToStudent: (body: { schoolId: string; studentUserId: string; parentUserId: string; relationship: string }) =>
    request<any>('/school-ops/assignments/student-parent', { method: 'POST', body: JSON.stringify(body) }),

  createVoiceNote: (body: { schoolId: string; relatedUserId?: string; audience: string; title: string; transcript: string; audioUrl: string }) =>
    request<VoiceNoteResponse>('/school-ops/voice-notes', { method: 'POST', body: JSON.stringify(body) }),

  listAdmissions: (schoolId: string) =>
    request<StudentAdmissionResponse[]>(`/school-ops/admissions?schoolId=${schoolId}`),

  createAdmission: (body: {
    schoolId: string;
    studentUserId?: string | null;
    studentFullName?: string | null;
    studentEmail?: string | null;
    admissionNo: string;
    admittedOn: string;
    dateOfBirth?: string | null;
    guardianName: string;
    guardianPhone: string;
    address?: string | null;
    previousSchool?: string | null;
    admissionStatus: 'LEAD' | 'APPLICATION' | 'ADMITTED' | 'ACTIVE' | 'INACTIVE' | 'ALUMNI';
    classId?: string | null;
  }) => request<StudentAdmissionResponse>('/school-ops/admissions', { method: 'POST', body: JSON.stringify(body) }),

  updateAdmission: (admissionId: string, body: {
    guardianName: string;
    guardianPhone: string;
    address?: string | null;
    previousSchool?: string | null;
    admissionStatus: 'LEAD' | 'APPLICATION' | 'ADMITTED' | 'ACTIVE' | 'INACTIVE' | 'ALUMNI';
  }) => request<StudentAdmissionResponse>(`/school-ops/admissions/${admissionId}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deleteAdmission: (admissionId: string) =>
    request<void>(`/school-ops/admissions/${admissionId}`, { method: 'DELETE' }),

  promoteStudent: (body: {
    schoolId: string;
    studentUserId: string;
    newClassId: string;
  }) => request<any>('/school-ops/students/promote', { method: 'POST', body: JSON.stringify(body) }),

  listStudentEnrollments: (schoolId: string) =>
    request<StudentClassEnrollmentResponse[]>(`/school-ops/assignments/student-class?schoolId=${schoolId}`),

  assignStudentToClass: (body: { schoolId: string; studentUserId: string; classId: string }) =>
    request<StudentClassEnrollmentResponse>('/school-ops/assignments/student-class', {
      method: 'POST',
      body: JSON.stringify({
        schoolId: body.schoolId,
        primaryId: body.studentUserId,
        secondaryId: body.classId,
      }),
    }),

  listStudentReports: (schoolId: string) =>
    request<StudentMonitoringReportResponse[]>(`/school-ops/student-reports?schoolId=${schoolId}`),

  listStudentDirectory: (params: {
    schoolId: string;
    search?: string;
    status?: string;
    classId?: string;
    routeId?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) => {
    const query = new URLSearchParams({ schoolId: params.schoolId });
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.classId && params.classId !== 'ALL') query.set('classId', params.classId);
    if (params.routeId && params.routeId !== 'ALL') query.set('routeId', params.routeId);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortDir) query.set('sortDir', params.sortDir);
    return request<StudentDirectoryRowResponse[]>(`/school-ops/students/directory?${query.toString()}`);
  },

  getStudents: (params: {
    schoolId: string;
    search?: string;
    classId?: string;
    section?: string;
    transport?: string;
    status?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    page?: number;
    size?: number;
  }) => {
    const query = new URLSearchParams({ schoolId: params.schoolId });
    if (params.search) query.set('search', params.search);
    if (params.classId && params.classId !== 'ALL') query.set('classId', params.classId);
    if (params.section && params.section !== 'ALL') query.set('section', params.section);
    if (params.transport && params.transport !== 'ALL') query.set('transport', params.transport);
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortDir) query.set('sortDir', params.sortDir);
    query.set('page', String(params.page ?? 0));
    query.set('size', String(params.size ?? 20));
    return request<StudentsPageResponse>(`/school-ops/students?${query.toString()}`);
  },

  createStudent: (body: StudentUpsertRequest) =>
    request<StudentRowResponse>('/school-ops/students', { method: 'POST', body: JSON.stringify(body) }),

  updateStudentRecord: (studentId: string, body: StudentUpsertRequest) =>
    request<StudentRowResponse>(`/school-ops/students/${studentId}`, { method: 'PUT', body: JSON.stringify(body) }),

  deleteStudentRecord: (schoolId: string, studentId: string) =>
    request<void>(`/school-ops/students/${studentId}?schoolId=${schoolId}`, { method: 'DELETE' }),

  getStudentAnalytics: (schoolId: string, studentId: string) =>
    request<StudentAnalyticsResponse>(`/school-ops/students/${studentId}/analytics?schoolId=${schoolId}`),

  listFeeRecords: (schoolId: string) =>
    request<FeeRecordResponse[]>(`/school-ops/fees?schoolId=${schoolId}`),

  listAttendanceRecords: (params: {
    schoolId: string;
    classId?: string;
    teacherUserId?: string;
    attendanceDate?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    const query = new URLSearchParams({ schoolId: params.schoolId });
    if (params.classId) query.set('classId', params.classId);
    if (params.teacherUserId) query.set('teacherUserId', params.teacherUserId);
    if (params.attendanceDate) query.set('attendanceDate', params.attendanceDate);
    if (params.fromDate) query.set('fromDate', params.fromDate);
    if (params.toDate) query.set('toDate', params.toDate);
    return request<AttendanceRecordResponse[]>(`/school-ops/attendance?${query.toString()}`);
  },

  upsertBulkAttendance: (body: {
    schoolId: string;
    classId: string;
    teacherUserId: string;
    subjectId?: string;
    attendanceMode?: string;
    timetableSlotId?: string;
    periodNumber?: number;
    attendanceDate: string;
    markedBy: string;
    entries: { userId: string; attendanceStatus: string; roleName?: string }[];
  }) => request<AttendanceRecordResponse[]>('/school-ops/attendance/bulk', { method: 'POST', body: JSON.stringify(body) }),

  getAttendanceAnalytics: (schoolId: string, fromDate: string, toDate: string) =>
    request<AttendanceAnalyticsResponse>(`/school-ops/attendance/analytics?schoolId=${schoolId}&fromDate=${fromDate}&toDate=${toDate}`),

  listTimetable: (schoolId: string) => request<TimetableSlotResponse[]>(`/school-ops/timetable?schoolId=${schoolId}`),
  createTimetable: (body: any) => request<TimetableSlotResponse>('/school-ops/timetable', { method: 'POST', body: JSON.stringify(body) }),
  saveBulkTimetable: (body: { schoolId: string; classId: string; slots: any[] }) => 
    request<TimetableSlotResponse[]>('/school-ops/timetable/bulk', { method: 'POST', body: JSON.stringify(body) }),
  optimizeTimetable: (body: { 
    schoolId: string; 
    classId: string; 
    periodLengthMinutes?: number; 
    recessLengthMinutes?: number;
    schoolStartTime?: string;
    workingDays?: string[];
    classesPerTeacherPerWeek?: number;
  }) => request<{ suggestedSlots: TimetableSlotResponse[]; optimizationInsight: string }>('/school-ops/timetable/optimize', { method: 'POST', body: JSON.stringify(body) }),
  listResults: (schoolId: string) => request<ExamResultRecordResponse[]>(`/school-ops/results?schoolId=${schoolId}`),

  // Library & Study Resources
  listLibrary: (schoolId: string, userId?: string) => 
    request<LibraryResourceResponse[]>(`/school-ops/library?schoolId=${schoolId}${userId ? `&userId=${userId}` : ''}`),
  
  searchLibrary: (body: { schoolId: string; query?: string; resourceType?: string; subject?: string; gradeLevel?: string; onlyBookmarked?: boolean }, userId?: string) =>
    request<LibraryResourceResponse[]>(`/school-ops/library/search${userId ? `?userId=${userId}` : ''}`, { method: 'POST', body: JSON.stringify(body) }),

  createLibraryResource: (body: any) => 
    request<LibraryResourceResponse>('/school-ops/library', { method: 'POST', body: JSON.stringify(body) }),

  toggleBookmark: (body: { schoolId: string; userId: string; resourceId: string }) =>
    request<void>('/school-ops/library/bookmark', { method: 'POST', body: JSON.stringify(body) }),

  logView: (schoolId: string, userId: string, resourceId: string) =>
    request<void>(`/school-ops/library/view-log?schoolId=${schoolId}&userId=${userId}&resourceId=${resourceId}`, { method: 'POST' }),

  getRecentResources: (schoolId: string, userId: string) =>
    request<LibraryResourceResponse[]>(`/school-ops/library/recent?schoolId=${schoolId}&userId=${userId}`),

  updateUserPreferences: (email: string, body: {
    theme?: string;
    activeTheme?: string;
    vibe?: string;
    accentColor?: string;
    glassIntensity?: number;
    borderRadius?: string;
  }) => request<SchoolUser>(`/school-ops/users/${encodeURIComponent(email)}/preferences`, { method: 'PATCH', body: JSON.stringify(body) }),

  listTransportRoutes: (schoolId: string) =>
    request<TransportRouteResponse[]>(`/school-ops/transport?schoolId=${schoolId}`),
  
  getFullTransportDashboard: (schoolId: string) =>
    request<TransportRouteFull[]>(`/school-ops/transport/full?schoolId=${schoolId}`),

  createTransportRoute: (body: Partial<TransportRouteResponse>) =>
    request<TransportRouteResponse>('/school-ops/transport', { method: 'POST', body: JSON.stringify(body) }),

  createTransportStop: (body: Partial<TransportStopResponse>) =>
    request<TransportStopResponse>('/school-ops/transport/stops', { method: 'POST', body: JSON.stringify(body) }),

  assignStudentToRoute: (body: Partial<TransportStudentAssignmentResponse>) =>
    request<TransportStudentAssignmentResponse>('/school-ops/transport/assign-student', { method: 'POST', body: JSON.stringify(body) }),

  clearStudentTransportAssignment: (schoolId: string, studentUserId: string) =>
    request<void>(`/school-ops/transport/assign-student?schoolId=${schoolId}&studentUserId=${studentUserId}`, { method: 'DELETE' }),

  updateVehicleGps: (body: { schoolId: string; routeId: string; latitude: number; longitude: number; speed?: number; heading?: number }) =>
    request<TransportVehiclePositionResponse>('/school-ops/transport/gps', { method: 'POST', body: JSON.stringify(body) }),

  markPickupDrop: (body: { schoolId: string; routeId: string; studentUserId: string; stopId: string; action: string; markedBy: string; tripDate: string }) =>
    request<TransportPickupLogResponse>('/school-ops/transport/pickup', { method: 'POST', body: JSON.stringify(body) }),

  // AI Learning Mode
  visualize: (body: { question: string; subject?: string; level?: string; visualizationStyle?: string; premiumRequest: boolean }) =>
    request<VisualizeResponse>('/school-ops/ai/visualize', { method: 'POST', body: JSON.stringify(body) }),

  generateExamples: (body: { question: string; context?: string; count: number; premiumRequest: boolean }) =>
    request<ExampleResponse>('/school-ops/ai/example', { method: 'POST', body: JSON.stringify(body) }),

  generateFeedback: (body: { schoolId: string; category: string; context?: string }) =>
    request<any>('/school-ops/ai/feedback', { method: 'POST', body: JSON.stringify(body) }),

  // Public School Profile for Landing Pages
  getPublicProfile: (schoolCode: string) => 
    request<PublicSchoolProfileResponse>(`/onboarding/schools/public/${schoolCode}`),

  getPublicEvents: (schoolId: string) =>
    request<any[]>(`/communication/announcements?schoolId=${schoolId}&public=true`),

  updateUser: (userId: string, body: { fullName?: string; email?: string; roleName?: string; active?: boolean }) =>
    request<SchoolUser>(`/school-ops/users/${userId}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deleteUser: (userId: string) =>
    request<void>(`/school-ops/users/${userId}`, { method: 'DELETE' }),

  getTeacherPerformance: (schoolId: string, userId: string) =>
    request<any>(`/school-ops/users/${userId}/performance?schoolId=${schoolId}`)
};

export const onboardingStatusApi = {
  lookup: (schoolCode: string, adminEmail: string) =>
    request<{ schoolName: string; status: string; schoolId?: string; tenantId?: string }>(
      `/onboarding/schools/status?schoolCode=${schoolCode}&adminEmail=${adminEmail}`
    ),
};

// ── Subscriptions ──────────────────────────────────────────────────────────
export interface SubscriptionPlanResponse {
  planId: string;
  planName: string;
  planCode: string;
  description: string;
  monthlyPrice: number;
  maxStudents: number;
  maxParentsPerStudent: number;
  features: string;
  createdAt: string;
}

export interface TenantSubscriptionResponse {
  subscriptionId: string;
  tenantId: string;
  planId: string;
  planName: string;
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'CANCELLED';
  startDate: string;
  endDate?: string;
  trialEndDate?: string;
}

export interface PlatformStatsResponse {
  totalActiveSubscriptions: number;
  monthlyRecurringRevenue: number;
  totalCapacityStudents: number;
  planCount: number;
}

export const subscriptionApi = {
  listPlans: () => request<SubscriptionPlanResponse[]>('/subscriptions/plans'),
  getCurrent: (tenantId: string) => request<TenantSubscriptionResponse>(`/subscriptions/current?tenantId=${tenantId}`),
  listAll: () => request<TenantSubscriptionResponse[]>('/subscriptions/all'),
  getStats: () => request<PlatformStatsResponse>('/subscriptions/stats'),
  updateStatus: (tenantId: string, status: string) => 
    request<TenantSubscriptionResponse>(`/subscriptions/status?tenantId=${tenantId}&status=${status}`, { method: 'POST' }),
  updatePlan: (tenantId: string, planId: string) => 
    request<TenantSubscriptionResponse>(`/subscriptions/update?tenantId=${tenantId}`, { method: 'POST', body: JSON.stringify({ planId }) }),
};

// ── Platform Settings ───────────────────────────────────────────────────────
export interface PlatformSettingsResponse {
  settingsId: string;
  themeName: string;
  accentColor: string;
  defaultTrialDays: number;
  maintenanceMode: boolean;
  platformName: string;
  contactEmail: string;
  glassIntensity: number;
  borderRadius: string;
  authServiceUrl: string;
  communicationServiceUrl: string;
  updatedAt: string;
}

export interface AnnouncementResponse {
  announcementId: string;
  title: string;
  content: string;
  targetAudience: string;
  targetClassId?: string;
  priority: 'NORMAL' | 'HIGH';
  type: 'ANNOUNCEMENT' | 'NOTICE';
  publishedAt: string;
  createdAt: string;
  schoolId: string;
  createdBy: string;
}

export interface NotificationResponse {
  notificationId: string;
  recipientId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ReminderResponse {
  reminderId: string;
  reminderType: string;
  targetUserId: string;
  message: string;
  dueAt: string;
  reminderStatus: string;
  createdAt: string;
}

export const platformSettingsApi = {
  getSettings: () => request<PlatformSettingsResponse>('/platform/settings'),
  updateSettings: (body: Partial<PlatformSettingsResponse>) => 
    request<PlatformSettingsResponse>('/platform/settings', { method: 'PATCH', body: JSON.stringify(body) }),
};

export const communicationApi = {
  listAnnouncements: (params: { schoolId: string; role?: string; classId?: string }) => {
    const query = new URLSearchParams({ schoolId: params.schoolId });
    if (params.role) query.set('role', params.role);
    if (params.classId) query.set('classId', params.classId);
    return request<AnnouncementResponse[]>(`/communication/announcements?${query.toString()}`);
  },
  createAnnouncement: (body: Partial<AnnouncementResponse>) => 
    request<AnnouncementResponse>('/communication/announcements', { method: 'POST', body: JSON.stringify(body) }),
  listNotifications: (userId: string) => request<NotificationResponse[]>(`/communication/notifications/user/${userId}`),
  markNotificationRead: (id: string) => request<void>(`/communication/notifications/${id}/read`, { method: 'POST' }),
  listReminders: (schoolId: string) => request<ReminderResponse[]>(`/communication/reminders?schoolId=${schoolId}`),
};
