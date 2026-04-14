// Using standard string for UUID representation in frontend.

export type OnboardingStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
export type ViewMode = 'school' | 'admin' | 'mcp';
export type ReviewAction = 'START_REVIEW' | 'APPROVE' | 'REJECT';
export type SchoolAdminModule = 'dashboard' | 'classes' | 'teachers' | 'students' | 'attendance';
export type { TextLayoutConfig, TextLayoutResult, TextWhiteSpace, TextWordBreak } from './textLayout';

export type SchoolOnboardingRecord = {
  onboardingId: string;
  schoolName: string;
  schoolCode: string;
  status: OnboardingStatus;
  boardAffiliation: string;
  city: string;
  state: string;
  adminEmail: string;
  reviewedBy: string | null;
  reviewComment: string | null;
  reviewedAt: string | null;
  tenantId: string | null;
  schoolId: string | null;
  activatedAt: string | null;
  requiredDocuments: string[];
  createdAt: string;
};

export type SchoolStatusLookupResponse = {
  schoolName: string;
  schoolCode: string;
  status: OnboardingStatus;
  reviewComment: string | null;
  reviewedAt: string | null;
  createdAt: string;
  loginEnabled: boolean;
  loginEmail: string;
  dashboardPath: string;
};

export type AdminSession = { email: string; fullName: string; role: string };
export type ToastKind = 'success' | 'error';
export type Toast = { id: number; message: string; kind: ToastKind };

export type ActivationDetails = {
  schoolCode: string;
  email: string;
  activationCode: string;
  expiresAt: string;
};

export type PlatformOverview = {
  totals: {
    totalRequests: number;
    submitted: number;
    underReview: number;
    approved: number;
    rejected: number;
    activeSchools: number;
    totalStudents: number;
    totalTeachers: number;
  };
};

export type SchoolSession = {
  tenantId: string;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  email: string;
  fullName: string;
  role: string;
};

export type Department = { departmentId: string; schoolId: string; departmentName: string; departmentCode: string; createdAt: string };
export type Subject = { subjectId: string; schoolId: string; departmentId: string | null; subjectName: string; subjectCode: string; createdAt: string };
export type AcademicClass = { classId: string; schoolId: string; className: string; sectionName: string; academicYear: string; createdAt: string };
export type SchoolUser = {
  userId: string;
  tenantId: string;
  schoolId: string;
  schoolCode: string;
  fullName: string;
  email: string;
  roleName: string;
  createdAt: string;
};

export type SchoolDashboard = {
  schoolId: string;
  departmentCount: number;
  subjectCount: number;
  classCount: number;
  teacherCount: number;
  studentCount: number;
  staffCount: number;
  principalCount: number;
  managerCount: number;
  teacherSubjectMappings: number;
  teacherClassMappings: number;
  classTeacherMappings: number;
  studentEnrollments: number;
  admissionsCount: number;
  timetableSlotCount: number;
  feeRecordCount: number;
  attendanceRecordCount: number;
  homeworkCount: number;
  noticeCount: number;
  examResultCount: number;
  teacherReportCount: number;
  studentReportCount: number;
  activityCount: number;
  libraryResourceCount: number;
  noteShareCount: number;
  transportRouteCount: number;
  voiceNoteCount: number;
  reminderCount: number;
};

export type StudentStatus = 'PROSPECTIVE' | 'ADMITTED' | 'ACTIVE' | 'INACTIVE' | 'ALUMNI';

export type StudentAdmission = {
  admissionId: string;
  schoolId: string;
  studentUserId: string | null;
  studentFullName: string;
  studentEmail: string;
  admissionNo: string;
  admittedOn: string;
  dateOfBirth: string | null;
  guardianName: string;
  guardianPhone: string;
  address: string | null;
  previousSchool: string | null;
  admissionStatus: StudentStatus;
  createdAt: string;
};

export type TimetableSlot = {
  slotId: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  teacherUserId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomName: string | null;
  createdAt: string;
};

export type FeeRecord = {
  feeRecordId: string;
  schoolId: string;
  studentUserId: string;
  feeCategory: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  paymentStatus: string;
  createdAt: string;
};

export type AttendanceRecord = {
  attendanceId: string;
  schoolId: string;
  userId: string;
  roleName: string;
  classId: string | null;
  teacherUserId: string | null;
  subjectId: string | null;
  attendanceMode: 'DAILY' | 'PERIOD';
  timetableSlotId: string | null;
  periodNumber: number | null;
  attendanceDate: string;
  attendanceStatus: string;
  markedBy: string;
  recordedAt: string | null;
  createdAt: string;
};

export type TeacherClassMapping = { mappingId: string; schoolId: string; teacherUserId: string; classId: string; createdAt: string };
export type ClassTeacherMapping = { mappingId: string; schoolId: string; teacherUserId: string; classId: string; createdAt: string };
export type StudentClassEnrollment = { enrollmentId: string; schoolId: string; studentUserId: string; classId: string; createdAt: string };

export type AttendanceSummaryPoint = { date: string; total: number; present: number; absent: number; late: number; leave: number };
export type AttendanceClassSummary = { classId: string; className: string; sectionName: string; total: number; present: number; absent: number };
export type AttendanceTeacherSummary = { teacherUserId: string; teacherName: string; totalMarked: number };
export type AttendanceAnalytics = {
  trend: AttendanceSummaryPoint[];
  byClass: AttendanceClassSummary[];
  byTeacher: AttendanceTeacherSummary[];
};

export type HomeworkItem = {
  homeworkId: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  teacherUserId: string;
  title: string;
  description: string;
  dueDate: string;
  createdAt: string;
};

export type NoticeBoardItem = {
  noticeId: string;
  schoolId: string;
  title: string;
  message: string;
  audience: string;
  publishedAt: string;
  createdAt: string;
};

export type ExamResultRecord = {
  resultId: string;
  schoolId: string;
  studentUserId: string;
  subjectId: string;
  examName: string;
  academicYear: string;
  marksObtained: number;
  maxMarks: number;
  grade: string | null;
  createdAt: string;
};

export type TeacherMonthlyReport = {
  reportId: string;
  schoolId: string;
  teacherUserId: string;
  reportMonth: string;
  academicYear: string;
  classesHandled: number;
  attendancePercentage: number;
  biometricCompliance: string;
  principalNote: string | null;
  createdAt: string;
};

export type StudentMonitoringReport = {
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
};

export type CoCurricularActivity = {
  activityId: string;
  schoolId: string;
  title: string;
  activityType: string;
  eventDate: string;
  coordinatorUserId: string | null;
  description: string | null;
  createdAt: string;
};

export type LibraryResource = {
  resourceId: string;
  schoolId: string;
  title: string;
  resourceType: string;
  authorName: string | null;
  accessUrl: string | null;
  createdAt: string;
};

export type NoteShare = {
  noteId: string;
  schoolId: string;
  sharedByUserId: string;
  classId: string | null;
  subjectId: string | null;
  title: string;
  accessUrl: string;
  createdAt: string;
};

export type TransportRoute = {
  routeId: string;
  schoolId: string;
  routeName: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  attendantName: string | null;
  createdAt: string;
};

export type VoiceNote = {
  voiceNoteId: string;
  schoolId: string;
  relatedUserId: string | null;
  audience: string;
  title: string;
  transcript: string | null;
  audioUrl: string | null;
  createdAt: string;
};

export type Reminder = {
  reminderId: string;
  schoolId: string;
  reminderType: string;
  targetUserId: string | null;
  message: string;
  dueAt: string;
  reminderStatus: string;
  createdAt: string;
};

export type WorkspaceUser = { userId: string; fullName: string; email: string; roleName: string };
export type WorkspaceClass = { classId: string; className: string; sectionName: string; academicYear: string };
export type WorkspaceSubject = { subjectId: string; subjectName: string; subjectCode: string };
export type StudentSubjectTeacher = { subjectName: string; subjectCode: string; teacherName: string; teacherEmail: string };

export type TeacherWorkspace = {
  schoolId: string;
  schoolCode: string;
  teacher: WorkspaceUser;
  assignedSubjects: WorkspaceSubject[];
  assignedClasses: WorkspaceClass[];
  classTeacherOf: WorkspaceClass[];
  scheduleStatus: string;
  scheduleMessage: string;
};

export type StudentWorkspace = {
  schoolId: string;
  schoolCode: string;
  student: WorkspaceUser;
  enrolledClass: WorkspaceClass | null;
  classTeacher: WorkspaceUser | null;
  subjectTeachers: StudentSubjectTeacher[];
  scheduleStatus: string;
  scheduleMessage: string;
};

export type McpAskResponse = {
  answer: string;
  data: unknown;
  mode?: string;
  suggestedQuestions?: string[];
};

export type FormState = {
  schoolName: string;
  schoolCode: string;
  boardAffiliation: string;
  contactPhone: string;
  contactEmail: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
};

export type ReviewState = { reviewerName: string; comment: string };
export type StatusLookupState = { schoolCode: string; email: string };
export type LoginState = { email: string; password: string };
export type SchoolLoginState = { schoolCode: string; email: string; password: string };
export type ActivationState = { schoolCode: string; email: string; activationCode: string; newPassword: string };

export type DepartmentForm = { departmentName: string; departmentCode: string };
export type SubjectForm = { subjectName: string; subjectCode: string; departmentId: string };
export type ClassForm = { className: string; sectionName: string; academicYear: string };
export type UserForm = { fullName: string; email: string; roleName: string; accessKey?: string };
export type MappingForm = { primaryId: string; secondaryId: string };
export type AdmissionForm = {
  studentUserId: string;
  admissionNo: string;
  admittedOn: string;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
  previousSchool: string;
  admissionStatus: StudentStatus;
};
export type TimetableForm = {
  classId: string;
  subjectId: string;
  teacherUserId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomName: string;
};
export type FeeForm = {
  studentUserId: string;
  feeCategory: string;
  amountDue: string;
  amountPaid: string;
  dueDate: string;
  paymentStatus: string;
};
export type AttendanceForm = {
  userId: string;
  roleName: string;
  classId: string;
  teacherUserId: string;
  subjectId: string;
  attendanceMode: 'DAILY' | 'PERIOD';
  timetableSlotId: string;
  periodNumber: string;
  attendanceDate: string;
  attendanceStatus: string;
  markedBy: string;
};
export type HomeworkForm = {
  classId: string;
  subjectId: string;
  teacherUserId: string;
  title: string;
  description: string;
  dueDate: string;
};
export type NoticeForm = { title: string; message: string; audience: string };

export type MappingRequest = { primaryId: string; secondaryId: string; schoolId: string };
