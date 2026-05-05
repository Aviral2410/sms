// Typed API wrapper for all backend services
const BASE = '/api/v1';

type AuthSessionLike = {
  token?: string | null;
  tenantId?: string | null;
  schoolId?: string | null;
  role?: string | null;
  userId?: string | null;
  email?: string | null;
};

const SESSION_STORAGE_KEYS = [
  'sms-admin-session',
  'sms-school-session',
  'sms-saas-v2-state',
] as const;
const AI_GUEST_ID_STORAGE_KEY = 'sms-ai-guest-id';

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

export function resolveAiGuestId(): string {
  const existing = window.localStorage.getItem(AI_GUEST_ID_STORAGE_KEY);
  if (existing?.trim()) {
    return existing;
  }

  const generated = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(AI_GUEST_ID_STORAGE_KEY, generated);
  return generated;
}

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export async function request<T>(path: string, options?: RequestInit & { skipDefaultBase?: boolean; skipAuth?: boolean }): Promise<T> {
  const session = resolveSession();

  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');

  if (!options?.skipAuth && session.token) headers.set('Authorization', `Bearer ${session.token}`);
  if (!session.token) headers.set('X-Guest-ID', resolveAiGuestId());

  // Never send X-User-* / X-Tenant-ID / X-School-ID from the browser.
  // The gateway injects trusted values from the JWT, and client-sent values are spoofable.

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
      throw new ApiError(res.status, extractErrorMessage(payload, res.status), payload);
    }

    const text = typeof payload === 'string' ? payload : '';
    throw new ApiError(res.status, extractErrorMessage(text, res.status), payload);
  }

  return payload as T;
}

export async function requestForm<T>(path: string, body: FormData, options?: RequestInit & { skipDefaultBase?: boolean; skipAuth?: boolean }): Promise<T> {
  const session = resolveSession();
  const headers = new Headers(options?.headers);

  if (!options?.skipAuth && session.token) headers.set('Authorization', `Bearer ${session.token}`);
  if (!session.token) headers.set('X-Guest-ID', resolveAiGuestId());

  const url = options?.skipDefaultBase ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    method: options?.method || 'POST',
    headers,
    body,
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
      throw new ApiError(res.status, extractErrorMessage(payload, res.status), payload);
    }

    const text = typeof payload === 'string' ? payload : '';
    throw new ApiError(res.status, extractErrorMessage(text, res.status), payload);
  }

  return payload as T;
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object') {
    const detail = 'detail' in payload && typeof payload.detail === 'string' ? payload.detail : '';
    const title = 'title' in payload && typeof payload.title === 'string' ? payload.title : '';
    const errors = 'errors' in payload && Array.isArray(payload.errors) ? payload.errors.join(', ') : '';
    const nested = detail ? extractNestedJsonMessage(detail) : '';
    return normalizeErrorMessage(errors || nested || detail || title || `HTTP ${status}`);
  }

  if (typeof payload === 'string' && payload.trim()) {
    const nested = extractNestedJsonMessage(payload);
    return normalizeErrorMessage(nested || payload.trim());
  }

  return `HTTP ${status}`;
}

function extractNestedJsonMessage(value: string): string {
  const jsonStart = value.indexOf('{');
  const jsonEnd = value.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd <= jsonStart) {
    return '';
  }

  try {
    const nested = JSON.parse(value.slice(jsonStart, jsonEnd + 1)) as Record<string, unknown>;
    const nestedDetail = typeof nested.detail === 'string' ? nested.detail : '';
    const nestedTitle = typeof nested.title === 'string' ? nested.title : '';
    return nestedDetail || nestedTitle || '';
  } catch {
    return '';
  }
}

function normalizeErrorMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return 'Something went wrong.';
  }

  if (trimmed.includes('Access denied: Requires Admin role')) {
    return 'You do not have permission to create this staff account.';
  }

  if (trimmed.includes('403 FORBIDDEN')) {
    return 'This action is not permitted for your current account.';
  }

  return trimmed;
}

export async function requestBlob(path: string, options?: RequestInit & { skipDefaultBase?: boolean }): Promise<Blob> {
  const session = resolveSession();
  const headers = new Headers(options?.headers);

  if (session.token) headers.set('Authorization', `Bearer ${session.token}`);

  const url = options?.skipDefaultBase ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.blob();
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
    request<SchoolLoginResponse>('/auth/school/login', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),

  adminLogin: (body: { email: string; password: string }) =>
    request<AdminLoginResponse>('/auth/admin/login', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),

  activateAccount: (body: { schoolCode: string; email: string; activationCode: string; newPassword: string }) =>
    request<ActivationResponse>('/auth/school/activate', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
};

// ── Onboarding ───────────────────────────────────────────────────────────────
export interface OnboardingRequest {
  schoolName: string;
  schoolCode: string;
  realmName?: string;
  boardAffiliation: string;
  contactEmail: string;
  contactPhone: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  selectedPlanCode?: 'FREE' | 'BASIC' | 'PREMIUM';
  logoUrl?: string | null;
  usePlatformSubdomain?: boolean;
  customDomain?: string | null;
  tagline?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  hasBranches?: boolean | null;
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
  selectedPlanCode?: 'FREE' | 'BASIC' | 'PREMIUM';
  logoUrl?: string | null;
}

export interface PlatformPublicInquiryResponse {
  inquiryId: string;
  inquiryType: string;
  status: string;
  fullName: string;
  email: string;
  organization?: string | null;
  schoolName?: string | null;
  phone?: string | null;
  subject: string;
  message: string;
  createdAt: string;
}

export interface PublicSchoolProfileResponse {
  onboardingId: string;
  schoolId?: string | null;
  schoolName: string;
  schoolCode: string;
  city: string;
  state: string;
  logoUrl?: string | null;
  vision: string;
  mission: string;
  achievements: string[];
  houses: { name: string; color: string; motto: string; icon: string }[];
}

export interface SchoolBrandingResponse {
  onboardingId: string;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  city: string;
  state: string;
  logoUrl?: string | null;
}

export const onboardingApi = {
  create: (body: OnboardingRequest) =>
    request<OnboardingResponse>('/onboarding/schools', { method: 'POST', body: JSON.stringify(body) }),

  uploadPublicSchoolLogo: (file: File, schoolCode?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (schoolCode) {
      formData.append('schoolCode', schoolCode);
    }
    return requestForm<{
      assetId?: string | null;
      assetKey: string;
      fileName: string;
      contentType: string;
      fileSize: number;
      publicUrl: string;
      updatedAt: string;
    }>('/onboarding/schools/public/logo', formData, { method: 'POST', skipAuth: true });
  },

  listAll: () => request<OnboardingResponse[]>('/onboarding/schools'),

  review: (onboardingId: string, action: 'START_REVIEW' | 'APPROVE' | 'REJECT', reviewerName: string, comment: string) =>
    request<OnboardingResponse>(`/onboarding/schools/${onboardingId}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ action, reviewerName, comment }),
    }),
  sendEmail: (onboardingId: string) =>
    request<void>(`/onboarding/schools/${onboardingId}/activation-email`, { method: 'POST' }),

  delete: (id: string) =>
    request<void>(`/onboarding/schools/${id}`, { method: 'DELETE' }),
  listPublicInquiries: () => request<PlatformPublicInquiryResponse[]>('/platform/public-inquiries'),
  updatePublicInquiryStatus: (inquiryId: string, status: string) =>
    request<PlatformPublicInquiryResponse>(`/platform/public-inquiries/${inquiryId}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getCurrentBranding: () => request<SchoolBrandingResponse>('/onboarding/schools/branding/current'),
  uploadCurrentSchoolLogo: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return requestForm<SchoolBrandingResponse>('/onboarding/schools/branding/current/logo', formData, { method: 'POST' });
  },
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

export interface ClassSubjectTeacherMappingView {
  mappingId: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  teacherUserId: string;
  createdAt: string;
}

export interface TeacherSubjectMappingView {
  mappingId: string;
  schoolId: string;
  teacherUserId: string;
  subjectId: string;
  createdAt: string;
}

export interface AcademicClassResponse {
  classId: string;
  schoolId: string;
  className: string;
  sectionName: string;
  academicYear: string;
  createdAt: string;
}

export interface DepartmentResponse {
  departmentId: string;
  schoolId: string;
  departmentName: string;
  departmentCode: string;
  createdAt: string;
}

export interface DepartmentHodView {
  assignmentId: string;
  departmentId: string;
  departmentName: string;
  teacherUserId: string;
  teacherName: string;
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
  studentFullName: string;
  studentEmail: string;
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

export type ExamStatus = 'DRAFT' | 'SCHEDULED' | 'COMPLETED' | 'PUBLISHED';

export interface ExamResponse {
  examId: string;
  schoolId: string;
  examName: string;
  academicYear: string;
  term?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: ExamStatus;
  createdAt: string;
  publishedAt?: string | null;
}

export interface ExamCreateRequest {
  schoolId: string;
  examName: string;
  academicYear: string;
  term?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ExamScheduleItemResponse {
  scheduleItemId: string;
  schoolId: string;
  examId: string;
  classId: string;
  subjectId: string;
  examDate: string;
  startTime?: string | null;
  endTime?: string | null;
  roomName?: string | null;
  maxMarks: number;
  passMarks?: number | null;
  createdAt: string;
}

export interface ExamScheduleItemCreateRequest {
  schoolId: string;
  classId: string;
  subjectId: string;
  examDate: string;
  startTime?: string | null;
  endTime?: string | null;
  roomName?: string | null;
  maxMarks: number;
  passMarks?: number | null;
}

export interface ExamMarkResponse {
  markId: string;
  schoolId: string;
  examId: string;
  scheduleItemId?: string | null;
  studentUserId: string;
  subjectId: string;
  marksObtained: number;
  maxMarks: number;
  grade?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ExamMarkUpsertRequest {
  schoolId: string;
  scheduleItemId?: string | null;
  studentUserId: string;
  subjectId: string;
  marksObtained: number;
  maxMarks: number;
  grade?: string | null;
}

export interface StudentReportCardResponse {
  examId: string;
  schoolId: string;
  studentUserId: string;
  examName: string;
  academicYear: string;
  term?: string | null;
  totalMarksObtained: number;
  totalMaxMarks: number;
  overallPercentage: number;
  overallGrade: string;
  entries: {
    subjectId: string;
    subjectName: string;
    marksObtained: number;
    maxMarks: number;
    percentage: number;
    grade: string;
  }[];
}

export interface AttendanceAnalyticsResponse {
  trend: { date: string; total: number; present: number; absent: number; late: number; leave: number }[];
  byClass: { classId: string; className: string; sectionName: string; total: number; present: number; absent: number }[];
  byTeacher: { teacherUserId: string; teacherName: string; totalMarked: number }[];
}

export interface AttendancePolicyResponse {
  policyId: string;
  schoolId: string;
  warningThreshold: number;
  criticalThreshold: number;
  enabledChannels: string[];
  autoAbsentEnabled: boolean;
  autoAbsentMinutes: number;
  gpsEnabled: boolean;
  gpsMode: string;
  geofenceLatitude?: number | null;
  geofenceLongitude?: number | null;
  geofenceRadiusMeters?: number | null;
  voiceEnabled: boolean;
  faceEnabled: boolean;
  aiPredictionEnabled: boolean;
  reminderEnabled: boolean;
  reminderFrequency: string;
  faceConfidenceThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSubjectOption {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
}

export interface AttendanceClassContext {
  classId: string;
  className: string;
  sectionName: string;
  academicYear: string;
  classTeacher: boolean;
  subjects: AttendanceSubjectOption[];
  periods: number[];
}

export interface AttendanceSessionSummary {
  sessionId: string;
  schoolId: string;
  classId: string;
  className: string | null;
  sectionName: string | null;
  subjectId: string;
  subjectName: string | null;
  teacherUserId: string;
  teacherName: string | null;
  attendanceDate: string;
  periodNumber: number;
  timetableSlotId?: string | null;
  sessionStatus: string;
  gpsVerificationStatus?: string | null;
  gpsMessage?: string | null;
  gpsDistanceMeters?: number | null;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  editable: boolean;
  autoGenerated: boolean;
  submittedAt?: string | null;
  lastEditedAt?: string | null;
}

export interface AttendanceAuditEntry {
  auditLogId: string;
  attendanceId: string;
  studentUserId: string;
  studentName: string;
  previousStatus?: string | null;
  newStatus: string;
  editReason?: string | null;
  changedBy: string;
  changedRole: string;
  createdAt: string;
}

export interface AttendanceRosterStudent {
  attendanceId: string;
  studentUserId: string;
  fullName: string;
  rollNumber?: string | null;
  profilePhotoUrl?: string | null;
  attendanceStatus: string;
  captureSource: string;
  absenceReasonCategory?: string | null;
  absenceReasonDescription?: string | null;
  lastModifiedAt?: string | null;
}

export interface AttendanceSessionDetailResponse {
  session: AttendanceSessionSummary;
  policy: AttendancePolicyResponse;
  editable: boolean;
  roster: AttendanceRosterStudent[];
  audits: AttendanceAuditEntry[];
}

export interface AttendanceContextResponse {
  policy: AttendancePolicyResponse;
  canMarkAttendance: boolean;
  canManageAttendance: boolean;
  canViewOwnAttendance: boolean;
  classes: AttendanceClassContext[];
  recentSessions: AttendanceSessionSummary[];
}

export interface VoiceCommandMatch {
  rollNumber?: string | null;
  studentName?: string | null;
  attendanceStatus: string;
  applied: boolean;
  reason?: string | null;
}

export interface VoiceCommandResponse {
  transcript: string;
  commands: VoiceCommandMatch[];
  appliedCount: number;
  rejectedCount: number;
}

export interface GpsVerificationResponse {
  verificationStatus: string;
  allowed: boolean;
  distanceMeters?: number | null;
  message: string;
  mode: string;
}

export interface FaceScanResponse {
  matchedStudentId?: string | null;
  matchedStudentName?: string | null;
  confidence: number;
  autoApplied: boolean;
  providerStatus: string;
  reviewOutcome: string;
  message: string;
}

export interface AttendanceCalendarDay {
  date: string;
  status: string;
  periods: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
}

export interface AttendanceHeatmapPoint {
  date: string;
  score: number;
  color: string;
}

export interface AttendanceDailyStatus {
  date: string;
  status: string;
  periodNumber?: number | null;
  subjectName?: string | null;
  markedBy?: string | null;
}

export interface StudentAttendanceSummaryResponse {
  studentUserId: string;
  studentName: string;
  className?: string | null;
  sectionName?: string | null;
  preset: string;
  fromDate: string;
  toDate: string;
  attendancePercentage: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  warningLevel: string;
  warningThreshold: number;
  criticalThreshold: number;
  calendar: AttendanceCalendarDay[];
  heatmap: AttendanceHeatmapPoint[];
  daily: AttendanceDailyStatus[];
}

export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';
export type LeaveType = 'SICK' | 'CASUAL' | 'ANNUAL' | 'UNPAID' | 'OTHER';

export type StaffLeaveRequest = {
  leaveRequestId: string;
  schoolId: string;
  requesterUserId: string;
  requesterRole: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: LeaveRequestStatus;
  reviewedByUserId: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export interface AttendanceTrendPoint {
  date: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export interface AttendanceClassOverview {
  classId: string;
  className: string | null;
  sectionName: string | null;
  attendancePercentage: number;
  totalMarks: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
}

export interface AttendanceRiskStudentRow {
  studentUserId: string;
  fullName: string;
  rollNumber?: string | null;
  classId: string;
  className?: string | null;
  sectionName?: string | null;
  attendancePercentage: number;
  predictedAttendancePercentage: number;
  riskLevel: string;
  absentCount: number;
  lateCount: number;
  alertActive: boolean;
}

export interface AttendanceOverviewResponse {
  policy: AttendancePolicyResponse;
  totalSessions: number;
  submittedSessions: number;
  draftSessions: number;
  totalStudents: number;
  schoolAttendancePercentage: number;
  trend: AttendanceTrendPoint[];
  byClass: AttendanceClassOverview[];
  riskStudents: AttendanceRiskStudentRow[];
}

export interface AttendanceHeatmapResponse {
  fromDate: string;
  toDate: string;
  items: AttendanceHeatmapPoint[];
}

export interface AttendanceCalendarResponse {
  studentUserId: string;
  fromDate: string;
  toDate: string;
  items: AttendanceCalendarDay[];
}

export interface AttendanceRiskResponse {
  snapshotDate: string;
  students: AttendanceRiskStudentRow[];
}

export interface ClassMonitorResponse {
  sessions: AttendanceSessionSummary[];
  riskStudents: AttendanceRiskStudentRow[];
}

export interface AbsenceReasonResponse {
  absenceReasonId: string;
  attendanceId: string;
  category: string;
  description?: string | null;
  reviewStatus: string;
  createdAt: string;
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

export interface VisualizationElement {
  type: 'arrow' | 'object' | 'label' | 'motion' | string;
  name: string;
  direction: string;
  note: string;
}

export interface VisualizationStepDetail {
  step: number;
  title: string;
  description: string;
  visualElements: VisualizationElement[];
}

export interface ConceptMapNode {
  id: string;
  label: string;
}

export interface ConceptMapConnection {
  from: string;
  to: string;
  relationship: string;
}

export interface SimulationObject {
  name: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface SimulationForce {
  source: string;
  target: string;
  magnitudeRelation: string;
  direction: string;
}

export interface FlowDiagramStage {
  stage: string;
  description: string;
}

export interface RealWorldExample {
  title: string;
  explanation: string;
}

export interface StructuredVisualization {
  conceptTitle: string;
  summary: string;
  subject: string;
  difficultyLevel: string;
  stepByStepVisualization: VisualizationStepDetail[];
  conceptMap: {
    nodes: ConceptMapNode[];
    connections: ConceptMapConnection[];
  };
  simulation: {
    objects: SimulationObject[];
    forces: SimulationForce[];
  };
  flowDiagram: FlowDiagramStage[];
  realWorldExamples: RealWorldExample[];
}

export interface VisualizationToolLink {
  id: string;
  provider: string;
  label: string;
  description: string;
  href: string;
}

export interface VisualizationChartPoint {
  label: string;
  x: number;
  y: number;
}

export interface VisualizationChart {
  title: string;
  subtitle?: string;
  xLabel: string;
  yLabel: string;
  data: VisualizationChartPoint[];
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
  structuredVisualization?: StructuredVisualization;
  tutorResponse?: any;
  toolLinks?: VisualizationToolLink[];
  chart?: VisualizationChart;
  generationMode?: 'LOCAL' | 'AI';
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
  generationMode?: 'LOCAL' | 'AI';
}

export const schoolOpsApi = {
  getForumFeed: (subject?: string) =>
    request<ForumQuestionResponse[]>(`/school-ops/forum/feed${subject ? `?subject=${subject}` : ''}`),

  askForumQuestion: (body: { title: string; content: string; subject?: string }) =>
    request<ForumQuestionResponse>('/school-ops/forum/questions', { method: 'POST', body: JSON.stringify(body) }),

  answerForumQuestion: (body: { questionId: string; content: string }) =>
    request<ForumAnswerResponse>('/school-ops/forum/answers', { method: 'POST', body: JSON.stringify(body) }),

  getForumAnswers: (questionId: string) =>
    request<ForumAnswerResponse[]>(`/school-ops/forum/questions/${questionId}/answers`),

  voteForum: (body: { targetId: string; voteType: number }) =>
    request<void>('/school-ops/forum/votes', { method: 'POST', body: JSON.stringify(body) }),

  flagForum: (body: { targetId: string; reason: string }) =>
    request<void>('/school-ops/forum/flags', { method: 'POST', body: JSON.stringify(body) }),

  markAnswerCorrect: (answerId: string) =>
    request<void>(`/school-ops/forum/answers/${answerId}/correct`, { method: 'PATCH' }),

  getForumLeaderboard: (period: string = 'WEEKLY') =>
    request<ForumLeaderboardResponse>(`/school-ops/forum/leaderboard?period=${period}`),

  getDashboard: (schoolId: string) =>
    request<SchoolDashboard>(`/school-ops/dashboard?schoolId=${schoolId}`),

  getTeacherWorkspace: (schoolId: string, email: string) =>
    request<TeacherWorkspace>(`/school-ops/teacher-workspace?schoolId=${schoolId}&email=${encodeURIComponent(email)}`),

  getStudentWorkspace: (schoolId: string, email: string) =>
    request<StudentWorkspaceResponse>(`/school-ops/student-workspace?schoolId=${schoolId}&email=${encodeURIComponent(email)}`),

  getMyStudentWorkspace: () =>
    request<StudentWorkspaceResponse>(`/school-ops/me/student-workspace`),

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

  createClass: (body: { schoolId: string; className: string; sectionName: string; academicYear: string }) =>
    request<AcademicClassResponse>('/school-ops/classes', { method: 'POST', body: JSON.stringify(body) }),

  listSubjects: (schoolId: string) =>
    request<SubjectResponse[]>(`/school-ops/subjects?schoolId=${schoolId}`),

  createSubject: (body: { schoolId: string; subjectName: string; subjectCode: string; departmentId?: string }) =>
    request<SubjectResponse>('/school-ops/subjects', { method: 'POST', body: JSON.stringify(body) }),

  listNoticeBoardItems: (schoolId: string) =>
    request<NoticeBoardItemResponse[]>(`/school-ops/notices?schoolId=${schoolId}`),

  listDepartments: (schoolId: string) =>
    request<DepartmentResponse[]>(`/school-ops/departments?schoolId=${schoolId}`),

  createDepartment: (body: { schoolId: string; departmentName: string; departmentCode: string }) =>
    request<DepartmentResponse>('/school-ops/departments', { method: 'POST', body: JSON.stringify(body) }),

  updateDepartment: (departmentId: string, body: { departmentName?: string; departmentCode?: string }) =>
    request<DepartmentResponse>(`/school-ops/departments/${departmentId}`, { method: 'PUT', body: JSON.stringify(body) }),

  deleteDepartment: (departmentId: string) =>
    request<void>(`/school-ops/departments/${departmentId}`, { method: 'DELETE' }),

  listTeacherSubjectMappings: (schoolId: string) =>
    request<TeacherSubjectMappingView[]>(`/school-ops/assignments/teacher-subject?schoolId=${schoolId}`),

  listClassSubjectTeacherMappings: (schoolId: string) =>
    request<ClassSubjectTeacherMappingView[]>(`/school-ops/assignments/class-subject-teacher?schoolId=${schoolId}`),

  listDepartmentHods: (schoolId: string) =>
    request<DepartmentHodView[]>(`/school-ops/departments/hods?schoolId=${schoolId}`),

  assignHod: (body: { schoolId: string; primaryId: string; secondaryId: string }) =>
    request<any>('/school-ops/assignments/hod', { method: 'POST', body: JSON.stringify(body) }),

  assignTeacherSubject: (body: { schoolId: string; primaryId: string; secondaryId: string }) =>
    request<any>('/school-ops/assignments/teacher-subject', { method: 'POST', body: JSON.stringify(body) }),

  assignClassSubjectTeacher: (body: ClassSubjectTeacherMappingView) =>
    request<ClassSubjectTeacherMappingView>('/school-ops/assignments/class-subject-teacher', { method: 'POST', body: JSON.stringify(body) }),

  assignTeacherClass: (body: { schoolId: string; primaryId: string; secondaryId: string }) =>
    request<any>('/school-ops/assignments/teacher-class', { method: 'POST', body: JSON.stringify(body) }),


  updateSubject: (subjectId: string, body: { subjectName?: string; subjectCode?: string; departmentId?: string }) =>
    request<SubjectResponse>(`/school-ops/subjects/${subjectId}`, { method: 'PUT', body: JSON.stringify(body) }),

  deleteSubject: (subjectId: string) =>
    request<void>(`/school-ops/subjects/${subjectId}`, { method: 'DELETE' }),

  getParentWorkspace: (schoolId: string, email: string) =>
    request<ParentWorkspaceResponse>(`/school-ops/parent-workspace?schoolId=${schoolId}&email=${encodeURIComponent(email)}`),

  getMyParentWorkspace: () =>
    request<ParentWorkspaceResponse>(`/school-ops/me/parent-workspace`),

  // HR / Operations (Phase 1)
  createLeaveRequest: (body: { leaveType: LeaveType; startDate: string; endDate: string; reason?: string | null }) =>
    request<StaffLeaveRequest>(`/school-ops/hr/leaves`, { method: 'POST', body: JSON.stringify(body) }),

  listMyLeaveRequests: () =>
    request<StaffLeaveRequest[]>(`/school-ops/hr/leaves/my`),

  listLeaveRequests: (status?: LeaveRequestStatus) =>
    request<StaffLeaveRequest[]>(`/school-ops/hr/leaves${status ? `?status=${encodeURIComponent(status)}` : ''}`),

  approveLeaveRequest: (leaveRequestId: string, note: string) =>
    request<StaffLeaveRequest>(`/school-ops/hr/leaves/${leaveRequestId}/approve`, { method: 'POST', body: JSON.stringify({ note }) }),

  rejectLeaveRequest: (leaveRequestId: string, note: string) =>
    request<StaffLeaveRequest>(`/school-ops/hr/leaves/${leaveRequestId}/reject`, { method: 'POST', body: JSON.stringify({ note }) }),

  cancelLeaveRequest: (leaveRequestId: string) =>
    request<StaffLeaveRequest>(`/school-ops/hr/leaves/${leaveRequestId}/cancel`, { method: 'POST' }),

  linkParentToStudent: (body: { schoolId: string; studentUserId: string; parentUserId: string; relationship: string }) =>
    request<any>('/school-ops/assignments/student-parent', { method: 'POST', body: JSON.stringify(body) }),

  createVoiceNote: (body: { schoolId: string; relatedUserId?: string; audience: string; title: string; transcript: string; audioUrl: string }) =>
    request<VoiceNoteResponse>('/school-ops/voice-notes', { method: 'POST', body: JSON.stringify(body) }),

  listAdmissions: (schoolId: string) =>
    request<StudentAdmissionResponse[]>(`/school-ops/admissions?schoolId=${schoolId}`),

  getAdmission: (id: string) =>
    request<StudentAdmissionResponse>(`/school-ops/admissions/${id}`),

  getNextAdmissionNumber: (schoolId: string) =>
    request<{ admissionNo: string }>(`/school-ops/admissions/next-number?schoolId=${schoolId}`),

  createAdmission: (body: {
    schoolId: string;
    tenantId?: string | null;
    schoolCode?: string | null;
    studentUserId?: string | null;
    studentFullName?: string | null;
    studentEmail?: string | null;
    admissionNo?: string | null;
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

  getAttendanceContext: () =>
    request<AttendanceContextResponse>('/school-ops/attendance/context'),

  createAttendanceSession: (body: {
    classId: string;
    subjectId: string;
    attendanceDate: string;
    periodNumber: number;
    timetableSlotId?: string;
  }) => request<AttendanceSessionDetailResponse>('/school-ops/attendance/sessions', { method: 'POST', body: JSON.stringify(body) }),

  getAttendanceSession: (sessionId: string) =>
    request<AttendanceSessionDetailResponse>(`/school-ops/attendance/sessions/${sessionId}`),

  updateAttendanceStudent: (sessionId: string, studentId: string, body: {
    attendanceStatus: string;
    captureSource?: string;
    editReason?: string;
  }) => request<AttendanceSessionDetailResponse>(`/school-ops/attendance/sessions/${sessionId}/students/${studentId}`, { method: 'PATCH', body: JSON.stringify(body) }),

  bulkMarkAttendanceSession: (sessionId: string, body: { attendanceStatus: string; captureSource?: string }) =>
    request<AttendanceSessionDetailResponse>(`/school-ops/attendance/sessions/${sessionId}/bulk-present`, { method: 'POST', body: JSON.stringify(body) }),

  applyVoiceAttendance: (sessionId: string, transcript: string) =>
    request<VoiceCommandResponse>(`/school-ops/attendance/sessions/${sessionId}/voice-commands`, { method: 'POST', body: JSON.stringify({ transcript }) }),

  verifyAttendanceGps: (sessionId: string, body: { latitude: number; longitude: number; accuracyMeters?: number }) =>
    request<GpsVerificationResponse>(`/school-ops/attendance/sessions/${sessionId}/gps-verify`, { method: 'POST', body: JSON.stringify(body) }),

  scanAttendanceFace: (sessionId: string, body: { hintedStudentId?: string; captureReference?: string }) =>
    request<FaceScanResponse>(`/school-ops/attendance/sessions/${sessionId}/face-scan`, { method: 'POST', body: JSON.stringify(body) }),

  submitAttendanceSession: (sessionId: string, body?: { submitNote?: string; forceSubmitOutsideGeofence?: boolean }) =>
    request<AttendanceSessionDetailResponse>(`/school-ops/attendance/sessions/${sessionId}/submit`, { method: 'POST', body: JSON.stringify(body ?? {}) }),

  getAttendanceClassMonitor: (params: {
    date?: string;
    classId?: string;
    subjectId?: string;
    periodNumber?: number;
    studentId?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.classId) query.set('classId', params.classId);
    if (params.subjectId) query.set('subjectId', params.subjectId);
    if (typeof params.periodNumber === 'number') query.set('periodNumber', String(params.periodNumber));
    if (params.studentId) query.set('studentId', params.studentId);
    return request<ClassMonitorResponse>(`/school-ops/attendance/class-monitor${query.size ? `?${query.toString()}` : ''}`);
  },

  editAttendanceRecord: (attendanceId: string, body: { attendanceStatus: string; editReason: string }) =>
    request<AttendanceSessionDetailResponse>(`/school-ops/attendance/records/${attendanceId}`, { method: 'PATCH', body: JSON.stringify(body) }),

  getAttendancePolicy: () =>
    request<AttendancePolicyResponse>('/school-ops/attendance/policy'),

  updateAttendancePolicy: (body: Partial<AttendancePolicyResponse>) =>
    request<AttendancePolicyResponse>('/school-ops/attendance/policy', { method: 'PATCH', body: JSON.stringify(body) }),

  getAttendanceOverview: (params?: { from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    return request<AttendanceOverviewResponse>(`/school-ops/attendance/analytics/overview${query.size ? `?${query.toString()}` : ''}`);
  },

  getAttendanceHeatmap: (params?: { studentId?: string; from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.studentId) query.set('studentId', params.studentId);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    return request<AttendanceHeatmapResponse>(`/school-ops/attendance/analytics/heatmap${query.size ? `?${query.toString()}` : ''}`);
  },

  getAttendanceCalendar: (params?: { studentId?: string; from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.studentId) query.set('studentId', params.studentId);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    return request<AttendanceCalendarResponse>(`/school-ops/attendance/analytics/calendar${query.size ? `?${query.toString()}` : ''}`);
  },

  getAttendanceRisk: (classId?: string) =>
    request<AttendanceRiskResponse>(`/school-ops/attendance/analytics/risk${classId ? `?classId=${classId}` : ''}`),

  getStudentAttendanceSummaryV2: (studentId: string, params?: { preset?: string; from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.preset) query.set('preset', params.preset);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    return request<StudentAttendanceSummaryResponse>(`/school-ops/students/${studentId}/attendance-summary${query.size ? `?${query.toString()}` : ''}`);
  },

  submitAbsenceReasonV2: (body: { attendanceId: string; category: string; description?: string }) =>
    request<AbsenceReasonResponse>('/school-ops/attendance/absence-reasons', { method: 'POST', body: JSON.stringify(body) }),

  exportAttendanceV2: async (params?: { format?: string; classId?: string; subjectId?: string; studentId?: string; from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.format) query.set('format', params.format);
    if (params?.classId) query.set('classId', params.classId);
    if (params?.subjectId) query.set('subjectId', params.subjectId);
    if (params?.studentId) query.set('studentId', params.studentId);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    return requestBlob(`/school-ops/attendance/export${query.size ? `?${query.toString()}` : ''}`);
  },

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

  // Academics: exams (schedule-first)
  listExams: (schoolId: string) => request<ExamResponse[]>(`/school-ops/exams?schoolId=${schoolId}`),
  createExam: (body: ExamCreateRequest) =>
    request<ExamResponse>('/school-ops/exams', { method: 'POST', body: JSON.stringify(body) }),
  publishExam: (examId: string, schoolId: string) =>
    request<ExamResponse>(`/school-ops/exams/${examId}/publish?schoolId=${schoolId}`, { method: 'POST' }),
  listExamSchedule: (examId: string, schoolId: string) =>
    request<ExamScheduleItemResponse[]>(`/school-ops/exams/${examId}/schedule?schoolId=${schoolId}`),
  addExamScheduleItem: (examId: string, body: ExamScheduleItemCreateRequest) =>
    request<ExamScheduleItemResponse>(`/school-ops/exams/${examId}/schedule`, { method: 'POST', body: JSON.stringify(body) }),
  upsertExamMark: (examId: string, body: ExamMarkUpsertRequest) =>
    request<ExamMarkResponse>(`/school-ops/exams/${examId}/marks`, { method: 'POST', body: JSON.stringify(body) }),
  getStudentReportCard: (examId: string, schoolId: string, studentUserId: string) =>
    request<StudentReportCardResponse>(`/school-ops/exams/${examId}/report-cards/student/${studentUserId}?schoolId=${schoolId}`),

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
    request<{ schoolName: string; status: string; statusMessage: string; activated: boolean; schoolId?: string; tenantId?: string }>(
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
  featureCodes: string[];
  features: string;
  createdAt: string;
}

export interface SubscriptionPlanUpdateRequest {
  planName?: string;
  planCode?: string;
  description?: string;
  monthlyPrice?: number;
  maxStudents?: number;
  maxParentsPerStudent?: number;
  featureCodes?: string[];
}

export interface TenantSubscriptionResponse {
  subscriptionId: string;
  tenantId: string;
  planId: string;
  planName: string;
  planCode: 'FREE' | 'BASIC' | 'PREMIUM';
  featureCodes: string[];
  status: 'TRIAL' | 'ACTIVE' | 'PENDING_PAYMENT' | 'EXPIRED' | 'REVOKED' | 'CANCELLED';
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
  updatePlanDefinition: (planId: string, body: SubscriptionPlanUpdateRequest) =>
    request<SubscriptionPlanResponse>(`/subscriptions/plans/${planId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  // Tenant-scoped: resolved from gateway-injected X-Tenant-ID.
  getCurrent: () => request<TenantSubscriptionResponse>('/subscriptions/current'),
  listAll: () => request<TenantSubscriptionResponse[]>('/subscriptions/all'),
  getStats: () => request<PlatformStatsResponse>('/subscriptions/stats'),
  updateStatus: (tenantId: string, status: string) => 
    request<TenantSubscriptionResponse>(`/subscriptions/status?tenantId=${tenantId}&status=${status}`, { method: 'POST' }),
  updatePlan: (tenantId: string, planRef: string) => {
    const body = looksLikeUuid(planRef)
      ? { planId: planRef }
      : { planCode: planRef.toUpperCase() };
    return request<TenantSubscriptionResponse>(`/subscriptions/update?tenantId=${tenantId}`, { method: 'POST', body: JSON.stringify(body) });
  },
  // Tenant-scoped: resolved from gateway-injected X-Tenant-ID.
  requestUpgrade: (body: { requestedPlanId: string; requestNotes?: string }) =>
    request<any>('/subscriptions/request-upgrade', { method: 'POST', body: JSON.stringify(body) }),
};

// Public (no auth) endpoints under auth-service.
export const authPublicApi = {
  joinSchool: (body: { schoolCode: string; adminEmail: string; roleName: string; fullName: string; email: string; password: string; guardianName?: string; guardianPhone?: string }) =>
    request<{ status: string; message: string }>('/auth/public/join', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),

  forgotPassword: (body: { schoolCode: string; email: string }) =>
    request<{ status: string; message: string }>('/auth/public/password/forgot', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),

  verifyResetCode: (body: { schoolCode: string; email: string; code: string }) =>
    request<{ resetToken: string }>('/auth/public/password/verify-code', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),

  resetPassword: (body: { resetToken: string; newPassword: string }) =>
    request<{ status: string; message: string }>('/auth/public/password/reset', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
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
  releasedFeatureCodes: string[];
  updatedAt: string;
}

export interface PublicPlatformSettingsResponse {
  platformName: string;
  contactEmail: string;
  maintenanceMode: boolean;
  releasedFeatureCodes: string[];
  updatedAt: string;
}

export const platformSettingsApi = {
  getSettings: () => request<PlatformSettingsResponse>('/platform/settings'),
  updateSettings: (body: Partial<PlatformSettingsResponse>) => 
    request<PlatformSettingsResponse>('/platform/settings', { method: 'PATCH', body: JSON.stringify(body) }),
  getPublicSettings: () => request<PublicPlatformSettingsResponse>('/platform/settings/public', { skipAuth: true }),
};

export interface PlatformConfigResponse {
  configId: string;
  serviceName: string;
  maskedSecret: string;
  secretConfigured: boolean;
  apiBaseUrl?: string | null;
  enabled: boolean;
  refreshRequired: boolean;
  metadata: Record<string, unknown>;
  updatedAt?: string | null;
}

export interface UpsertPlatformConfigRequest {
  serviceName: string;
  secretValue?: string;
  apiBaseUrl?: string;
  enabled: boolean;
  refreshRequired?: boolean;
  metadata?: Record<string, unknown>;
}

export const platformConfigApi = {
  listConfigs: () => request<PlatformConfigResponse[]>('/platform/configs'),
  updateConfig: (serviceName: string, body: UpsertPlatformConfigRequest) =>
    request<PlatformConfigResponse>(`/platform/configs/${encodeURIComponent(serviceName)}`, { method: 'PUT', body: JSON.stringify(body) }),
};

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

export interface MessageThreadResponse {
  threadId: string;
  schoolId: string;
  subject?: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string | null;
  participantUserIds: string[];
  unreadCount?: number | null;
  lastReadAt?: string | null;
}

export interface ThreadMessageResponse {
  messageId: string;
  threadId: string;
  schoolId: string;
  senderUserId: string;
  body: string;
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

export const communicationApi = {
  listAnnouncements: (params: { schoolId: string; role?: string; classId?: string }) => {
    const query = new URLSearchParams();
    if (params.classId) query.set('classId', params.classId);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<AnnouncementResponse[]>(`/communication/announcements/v2${suffix}`);
  },
  createAnnouncement: (body: Partial<AnnouncementResponse>) =>
    request<AnnouncementResponse>('/communication/announcements/v2', {
      method: 'POST',
      body: JSON.stringify({
        title: body.title,
        content: body.content,
        targetAudience: body.targetAudience,
        targetClassId: body.targetClassId,
        priority: body.priority,
        type: body.type,
        publishedAt: body.publishedAt,
      }),
    }),
  listNotifications: (userId: string) => request<NotificationResponse[]>(`/communication/notifications/user/${userId}`),
  markNotificationRead: (id: string) => request<void>(`/communication/notifications/${id}/read`, { method: 'POST' }),
  listThreads: () => request<MessageThreadResponse[]>('/communication/messages/threads'),
  createThread: (body: { subject?: string; participantUserIds: string[] }) =>
    request<MessageThreadResponse>('/communication/messages/threads', { method: 'POST', body: JSON.stringify(body) }),
  listThreadMessages: (threadId: string) => request<ThreadMessageResponse[]>(`/communication/messages/threads/${threadId}`),
  sendThreadMessage: (threadId: string, body: { body: string }) =>
    request<ThreadMessageResponse>(`/communication/messages/threads/${threadId}`, { method: 'POST', body: JSON.stringify(body) }),
  markThreadRead: (threadId: string) => request<{ threadId: string; userId: string; lastReadAt: string }>(`/communication/messages/threads/${threadId}/read`, { method: 'POST' }),
  // Reminders are currently owned by school-operations-service (not communication-service).
  listReminders: (schoolId: string) => request<ReminderResponse[]>(`/school-ops/reminders?schoolId=${schoolId}`),
};

export interface AiToolCatalogItem {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  requiresConfirmation: boolean;
  examplePrompts: string[];
}

export interface AiRateLimitPolicyResponse {
  policyVersion: string;
  limits: Record<string, Record<string, number>>;
}

export interface AiWorkspaceResponse {
  workspaceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiChatSummaryResponse {
  conversationId: string;
  workspaceId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiChatMessageResponse {
  messageId: string;
  role: 'user' | 'assistant' | string;
  content: string;
  payload?: Record<string, unknown> | null;
  timestamp: string;
  thought?: string | null;
}

export interface AiChatResponse {
  workspaceId: string | null;
  conversationId: string;
  response: Record<string, unknown>;
}

export const aiInteractionApi = {
  listTools: () => request<AiToolCatalogItem[]>('/ai-interaction/tools'),
  listAuditEvents: (limit = 100) => request<any[]>(`/ai-interaction/audit/events?limit=${limit}`),
  getRateLimits: () => request<AiRateLimitPolicyResponse>('/ai-interaction/admin/rate-limits'),
  updateRateLimits: (limits: Record<string, Record<string, number>>) =>
    request<AiRateLimitPolicyResponse>('/ai-interaction/admin/rate-limits', { method: 'POST', body: JSON.stringify({ limits }) }),
  createWorkspace: (name: string) =>
    request<AiWorkspaceResponse>('/ai-interaction/workspaces', { method: 'POST', body: JSON.stringify({ name }) }),
  renameWorkspace: (workspaceId: string, name: string) =>
    request<AiWorkspaceResponse>(`/ai-interaction/workspaces/${workspaceId}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deleteWorkspace: (workspaceId: string) =>
    request<void>(`/ai-interaction/workspaces/${workspaceId}`, { method: 'DELETE' }),
  listWorkspaces: () => request<AiWorkspaceResponse[]>('/ai-interaction/workspaces'),
  listAllChats: () => request<AiChatSummaryResponse[]>('/ai-interaction/chats'),
  chat: (workspaceId: string | null, conversationId: string | null, message: string, context?: Record<string, unknown>) =>
    request<AiChatResponse>('/ai-interaction/chat', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, conversationId, message, context }),
    }),
  createChat: (workspaceId: string, title?: string) =>
    request<AiChatSummaryResponse>(`/ai-interaction/workspaces/${workspaceId}/chats`, { method: 'POST', body: JSON.stringify({ title }) }),
  listChats: (workspaceId: string) =>
    request<AiChatSummaryResponse[]>(`/ai-interaction/workspaces/${workspaceId}/chats`),
  moveChat: (conversationId: string, workspaceId: string) =>
    request<AiChatSummaryResponse>(`/ai-interaction/chats/${conversationId}/move`, { method: 'POST', body: JSON.stringify({ workspaceId }) }),
  deleteChat: (conversationId: string) =>
    request<void>(`/ai-interaction/chats/${conversationId}`, { method: 'DELETE' }),
  listChatMessages: (conversationId: string, limit = 50) =>
    request<AiChatMessageResponse[]>(`/ai-interaction/chats/${conversationId}/messages?limit=${limit}`),
  confirmAction: (confirmationToken: string) =>
    request<{ workspaceId: string | null; conversationId: string; response: Record<string, unknown> }>(`/ai-interaction/actions/confirm`, {
      method: 'POST',
      body: JSON.stringify({ confirmationToken }),
    }),
};
