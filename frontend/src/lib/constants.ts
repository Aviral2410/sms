import {
  FormState,
  ReviewState,
  StatusLookupState,
  LoginState,
  SchoolLoginState,
  ActivationState,
  DepartmentForm,
  SubjectForm,
  ClassForm,
  UserForm,
  MappingForm,
  AdmissionForm,
  TimetableForm,
  FeeForm,
  AttendanceForm,
  HomeworkForm,
  NoticeForm,
  OnboardingStatus
} from '../types';

export const initialForm: FormState = {
  schoolName: '',
  schoolCode: '',
  boardAffiliation: 'CBSE',
  contactPhone: '',
  contactEmail: '',
  addressLine: '',
  city: '',
  state: '',
  country: 'India',
  postalCode: '',
};

export const boardOptions = ['CBSE', 'ICSE', 'State Board', 'IB', 'Cambridge'];
export const roleOptions = ['PRINCIPAL', 'MANAGER', 'TEACHER', 'STAFF', 'STUDENT'];

export const initialReviewState: ReviewState = { reviewerName: 'Platform Super Admin', comment: '' };
export const initialStatusLookup: StatusLookupState = { schoolCode: '', email: '' };
export const initialAdminLogin: LoginState = { email: '', password: '' };
export const initialSchoolLogin: SchoolLoginState = { schoolCode: '', email: '', password: '' };
export const initialActivationState: ActivationState = { schoolCode: '', email: '', activationCode: '', newPassword: '' };
export const initialDepartmentForm: DepartmentForm = { departmentName: '', departmentCode: '' };
export const initialSubjectForm: SubjectForm = { subjectName: '', subjectCode: '', departmentId: '' };
export const initialClassForm: ClassForm = { className: '', sectionName: '', academicYear: '2026-2027' };
export const initialUserForm: UserForm = { fullName: '', email: '', roleName: 'TEACHER', accessKey: '' };
export const initialMappingForm: MappingForm = { primaryId: '', secondaryId: '' };
export const initialAdmissionForm: AdmissionForm = {
  studentUserId: '',
  admissionNo: '',
  admittedOn: '2026-04-01',
  dateOfBirth: '',
  guardianName: '',
  guardianPhone: '',
  address: '',
  previousSchool: '',
  admissionStatus: 'ACTIVE',
};
export const initialTimetableForm: TimetableForm = {
  classId: '',
  subjectId: '',
  teacherUserId: '',
  dayOfWeek: 'MONDAY',
  startTime: '08:00',
  endTime: '08:45',
  roomName: '',
};
export const initialFeeForm: FeeForm = {
  studentUserId: '',
  feeCategory: 'Tuition',
  amountDue: '',
  amountPaid: '0',
  dueDate: '2026-04-10',
  paymentStatus: 'PENDING',
};
export const initialAttendanceForm: AttendanceForm = {
  userId: '',
  roleName: 'STUDENT',
  classId: '',
  teacherUserId: '',
  subjectId: '',
  attendanceMode: 'DAILY',
  timetableSlotId: '',
  periodNumber: '',
  attendanceDate: '2026-04-01',
  attendanceStatus: 'PRESENT',
  markedBy: '',
};
export const initialHomeworkForm: HomeworkForm = {
  classId: '',
  subjectId: '',
  teacherUserId: '',
  title: '',
  description: '',
  dueDate: '2026-04-08',
};
export const initialNoticeForm: NoticeForm = { title: '', message: '', audience: 'ALL' };

export const statusLabels: Record<OnboardingStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const statusClasses: Record<OnboardingStatus, string> = {
  DRAFT: 'status-draft',
  SUBMITTED: 'status-submitted',
  UNDER_REVIEW: 'status-review',
  APPROVED: 'status-approved',
  REJECTED: 'status-rejected',
};

export const adminSessionStorageKey = 'sms-admin-session';
export const schoolSessionStorageKey = 'sms-school-session';
export const adminActivityStorageKey = 'sms-admin-session-last-activity';
export const schoolActivityStorageKey = 'sms-school-session-last-activity';

export const sessionTimeoutMinutes = Number(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES || '30');
export const sessionTimeoutMs = Math.max(sessionTimeoutMinutes, 1) * 60 * 1000;
