import { request } from './api';

export interface SchoolLandingProfile {
  id: string;
  tenantId: string;
  schoolName: string;
  shortName?: string | null;
  tagline?: string | null;
  shortDescription?: string | null;
  aboutHtml?: string | null;
  objective?: string | null;
  mission?: string | null;
  vision?: string | null;
  history?: string | null;
  whyUs?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  alternatePhone?: string | null;
  email?: string | null;
  website?: string | null;
  officeHours?: string | null;
  isPublished?: boolean | null;
  updatedAt?: string | null;
}

export interface SchoolLandingProfileRequest {
  schoolName?: string;
  shortName?: string;
  tagline?: string;
  shortDescription?: string;
  aboutHtml?: string;
  objective?: string;
  mission?: string;
  vision?: string;
  history?: string;
  whyUs?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  website?: string;
  officeHours?: string;
  isPublished?: boolean;
}

export interface SchoolLeader {
  id: string;
  type: string;
  name: string;
  title?: string | null;
  bio?: string | null;
  message?: string | null;
  imageMediaId?: string | null;
  displayOrder?: number | null;
  isPublished?: boolean | null;
}

export interface SchoolLeaderRequest {
  type: string;
  name: string;
  title?: string;
  bio?: string;
  message?: string;
  imageMediaId?: string | null;
  displayOrder?: number;
  isPublished?: boolean;
}

export interface SchoolEvent {
  id: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  location?: string | null;
  bannerMediaId?: string | null;
  registrationUrl?: string | null;
  isFeatured?: boolean | null;
  isPublished?: boolean | null;
  status?: string | null;
}

export interface SchoolEventRequest {
  title: string;
  slug?: string;
  description?: string;
  startAt?: string | null;
  endAt?: string | null;
  location?: string;
  bannerMediaId?: string | null;
  registrationUrl?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  status?: string;
}

export interface SchoolGalleryMedia {
  id: string;
  mediaId: string;
  mediaType: string;
  caption?: string | null;
  altText?: string | null;
  tags?: string | null;
  takenAt?: string | null;
  isPublished?: boolean | null;
  sortOrder?: number | null;
}

export interface SchoolGalleryAlbum {
  id: string;
  title: string;
  description?: string | null;
  coverMediaId?: string | null;
  eventId?: string | null;
  isPublished?: boolean | null;
  sortOrder?: number | null;
  mediaItems: SchoolGalleryMedia[];
}

export interface SchoolGalleryAlbumRequest {
  title: string;
  description?: string;
  coverMediaId?: string | null;
  eventId?: string | null;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface SchoolGalleryMediaRequest {
  mediaId: string;
  mediaType: string;
  caption?: string;
  altText?: string;
  tags?: string;
  takenAt?: string | null;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface SchoolTestimonial {
  id: string;
  authorName: string;
  relationshipType?: string | null;
  designation?: string | null;
  content: string;
  imageMediaId?: string | null;
  rating?: number | null;
  displayOrder?: number | null;
  isPublished?: boolean | null;
}

export interface SchoolTestimonialRequest {
  authorName: string;
  relationshipType?: string;
  designation?: string;
  content: string;
  imageMediaId?: string | null;
  rating?: number | null;
  displayOrder?: number;
  isPublished?: boolean;
}

export interface SchoolAchievement {
  id: string;
  title: string;
  description?: string | null;
  achievementYear?: string | null;
  category?: string | null;
  imageMediaId?: string | null;
  isFeatured?: boolean | null;
  displayOrder?: number | null;
  isPublished?: boolean | null;
}

export interface SchoolAchievementRequest {
  title: string;
  description?: string;
  achievementYear?: string;
  category?: string;
  imageMediaId?: string | null;
  isFeatured?: boolean;
  displayOrder?: number;
  isPublished?: boolean;
}

export interface SchoolInfrastructureItem {
  id: string;
  type?: string | null;
  title: string;
  description?: string | null;
  imageMediaId?: string | null;
  icon?: string | null;
  displayOrder?: number | null;
  isPublished?: boolean | null;
}

export interface SchoolInfrastructureItemRequest {
  type?: string;
  title: string;
  description?: string;
  imageMediaId?: string | null;
  icon?: string;
  displayOrder?: number;
  isPublished?: boolean;
}

export interface SchoolSectionConfig {
  sectionKey: string;
  isEnabled?: boolean | null;
  displayOrder?: number | null;
  titleOverride?: string | null;
  subtitleOverride?: string | null;
  configJson?: string | null;
}

export interface SchoolSectionConfigRequest {
  sectionKey: string;
  isEnabled?: boolean;
  displayOrder?: number;
  titleOverride?: string;
  subtitleOverride?: string;
  configJson?: string;
}

export interface SchoolSocialLink {
  id: string;
  platform: string;
  url: string;
  displayOrder?: number | null;
  isPublished?: boolean | null;
}

export interface SchoolSocialLinkRequest {
  platform: string;
  url: string;
  displayOrder?: number;
  isPublished?: boolean;
}

export interface SchoolAffiliationInfo {
  boardName: string;
  affiliationNumber?: string | null;
  complianceText?: string | null;
  recognitionDetails?: string | null;
  isPublished?: boolean | null;
}

export interface SchoolAffiliationInfoRequest {
  boardName: string;
  affiliationNumber?: string;
  complianceText?: string;
  recognitionDetails?: string;
  isPublished?: boolean;
}

export interface SchoolBranch {
  id: string;
  branchName: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  email?: string | null;
  isPrimary?: boolean | null;
  isPublished?: boolean | null;
}

export interface SchoolBranchRequest {
  branchName: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
  isPublished?: boolean;
}

export interface SchoolAdmissionInfo {
  id: string;
  overview?: string | null;
  process?: string | null;
  eligibility?: string | null;
  brochureMediaId?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  isPublished?: boolean | null;
}

export interface SchoolAdmissionInfoRequest {
  overview?: string;
  process?: string;
  eligibility?: string;
  brochureMediaId?: string | null;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  isPublished?: boolean;
}

export interface SchoolFeeStructure {
  id: string;
  academicYear: string;
  title: string;
  description?: string | null;
  structuredDataJson?: string | null;
  attachmentMediaId?: string | null;
  isPublished?: boolean | null;
}

export interface SchoolFeeStructureRequest {
  academicYear: string;
  title: string;
  description?: string;
  structuredDataJson?: string;
  attachmentMediaId?: string | null;
  isPublished?: boolean;
}

export interface SchoolAcademicContent {
  id: string;
  curriculum?: string | null;
  coCurricular?: string | null;
  scholarshipInfo?: string | null;
  resultHighlights?: string | null;
  notices?: string | null;
  calendarData?: string | null;
  isPublished?: boolean | null;
}

export interface SchoolAcademicContentRequest {
  curriculum?: string;
  coCurricular?: string;
  scholarshipInfo?: string;
  resultHighlights?: string;
  notices?: string;
  calendarData?: string;
  isPublished?: boolean;
}

export interface SchoolEnquiry {
  id: string;
  type: string;
  studentName?: string | null;
  parentName?: string | null;
  phone: string;
  email?: string | null;
  classInterested?: string | null;
  message?: string | null;
  status: string;
  source?: string | null;
  createdAt: string;
}

export interface SchoolEnquiryRequest {
  type: string;
  studentName?: string;
  parentName?: string;
  phone: string;
  email?: string;
  classInterested?: string;
  message?: string;
  source?: string;
}

export interface NewsletterSubscribeRequest {
  email: string;
}

export interface NewsletterSubscribeResponse {
  id: string;
  email: string;
  status: string;
  subscribedAt: string;
}

export interface SchoolLandingPagePayload {
  tenantId: string;
  profile: SchoolLandingProfile | null;
  leaders: SchoolLeader[];
  upcomingEvents: SchoolEvent[];
  albums: SchoolGalleryAlbum[];
  testimonials: SchoolTestimonial[];
  achievements: SchoolAchievement[];
  infrastructure: SchoolInfrastructureItem[];
  sectionConfigs: SchoolSectionConfig[];
  socialLinks: SchoolSocialLink[];
  affiliation: SchoolAffiliationInfo | null;
  branches: SchoolBranch[];
  admissionInfo: SchoolAdmissionInfo | null;
  feeStructures: SchoolFeeStructure[];
  academicContent: SchoolAcademicContent | null;
}

export interface CmsDashboardStats {
  pendingEnquiries: number;
  upcomingEvents: number;
  unpublishedSections: number;
  totalGalleryAlbums: number;
  activeNewsletterSubscribers: number;
  profilePublished: boolean;
  admissionInfoPublished: boolean;
  affiliationPublished: boolean;
  completeness: {
    hasProfile: boolean;
    hasLeaders: boolean;
    hasBranches: boolean;
    hasEvents: boolean;
    hasGallery: boolean;
    hasTestimonials: boolean;
    hasAchievements: boolean;
    hasAdmissionInfo: boolean;
    hasFeeStructure: boolean;
    completionPercent: number;
  };
}

export interface StudentProfileResponse {
  studentId: string;
  admissionNo: string;
  rollNo?: string | null;
  fullName: string;
  email: string;
  profilePhotoUrl?: string | null;
  address?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  admittedOn?: string | null;
  className?: string | null;
  sectionName?: string | null;
  status?: string | null;
}

export interface StudentProfileUpdateRequest {
  profilePhotoUrl?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
}

export interface ClassroomDetailResponse {
  classId: string;
  className: string;
  sectionName: string;
  classTeacherName?: string | null;
  classTeacherEmail?: string | null;
  subjects: {
    subjectId: string;
    subjectName: string;
    teacherName: string;
    teacherEmail?: string | null;
  }[];
  classmates: {
    userId: string;
    fullName: string;
    rollNo?: string | null;
    profilePhotoUrl?: string | null;
  }[];
}

export interface StudentTimetableResponse {
  schedule: {
    dayOfWeek: string;
    periods: {
      periodNumber: number;
      subjectName: string;
      teacherName: string;
      room?: string | null;
      startTime: string;
      endTime: string;
    }[];
  }[];
}

export interface StudentAttendanceAnalyticsResponse {
  attendancePercentage: number;
  totalWorkingDays: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  insights: {
    title: string;
    detail: string;
    trend: string;
  }[];
  recentAbsences: {
    attendanceId: string;
    attendanceDate: string;
    attendanceStatus: string;
    reasonStatus: string;
    submittedReason?: string | null;
  }[];
}

export interface StudentHomeworkResponse {
  homeworkId: string;
  subjectName: string;
  teacherName: string;
  title: string;
  description: string;
  dueDate: string;
  status: string;
  studentNote?: string | null;
  teacherRemarks?: string | null;
  attachments: string[];
}

export interface HomeworkStatusUpdateRequest {
  status: string;
  notes?: string;
}

export interface StudentResultResponse {
  examId?: string | null;
  examName: string;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  grade?: string | null;
  academicYear?: string | null;
}

export interface StudentFeeRecordResponse {
  feeRecordId: string;
  studentUserId: string;
  feeCategory: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  paymentStatus: string;
  createdAt: string;
}

export interface StudentCommunicationRequest {
  audience: string;
  subject: string;
  message: string;
}

export interface AbsenceReasonRequest {
  attendanceId: string;
  reason: string;
}

export interface LibraryReservationResponse {
  reservationId: string;
  resourceId: string;
  title: string;
  status: string;
  reservedAt: string;
  validUntil: string;
}

export interface StudentForumReputationResponse {
  totalUpvotes: number;
  answersProvided: number;
  currentBadge: string;
  nextBadgeThreshold: number;
}

export interface TeacherHomeworkRequest {
  classId: string;
  subjectId: string;
  title: string;
  description: string;
  dueDate: string;
}

export interface TeacherHomeworkResponse {
  homeworkId: string;
  className: string;
  subjectName: string;
  title: string;
  description: string;
  dueDate: string;
  submissionCount: number;
}

export interface MarksEntryRequest {
  examId: string;
  subjectId: string;
  marks: {
    studentUserId: string;
    marksObtained?: number | null;
    remarks?: string | null;
  }[];
}

export interface BehaviourRemarkRequest {
  studentUserId: string;
  category: string;
  remark: string;
  points: number;
  escalateToAdmin?: boolean;
}

export interface TeacherWorkspaceSummary {
  totalClassesToday: number;
  pendingHomeworkReviews: number;
  upcomingPeriods: {
    time: string;
    className: string;
    subjectName: string;
    room?: string | null;
  }[];
}

export interface TeacherBiometricComplianceResponse {
  reportMonth: string;
  academicYear: string;
  attendancePercentage: number;
  biometricCompliance: string;
  principalNote?: string | null;
}

export interface TeacherCommunicationRequest {
  studentUserId: string;
  subject: string;
  message: string;
}

export interface ForumAnswerApprovalRequest {
  answerId: string;
  isCorrect: boolean;
}

export const schoolCmsApi = {
  getDashboardStats: () => request<CmsDashboardStats>('/admin/cms/dashboard-stats'),
  getProfile: () => request<SchoolLandingProfile>('/admin/cms/profile'),
  saveProfile: (body: SchoolLandingProfileRequest) =>
    request<SchoolLandingProfile>('/admin/cms/profile', { method: 'POST', body: JSON.stringify(body) }),
  publishProfile: (publish: boolean) =>
    request<SchoolLandingProfile>(`/admin/cms/profile/publish?publish=${publish}`, { method: 'PATCH' }),

  listLeaders: () => request<SchoolLeader[]>('/admin/cms/leaders'),
  createLeader: (body: SchoolLeaderRequest) =>
    request<SchoolLeader>('/admin/cms/leaders', { method: 'POST', body: JSON.stringify(body) }),
  updateLeader: (id: string, body: SchoolLeaderRequest) =>
    request<SchoolLeader>(`/admin/cms/leaders/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteLeader: (id: string) => request<void>(`/admin/cms/leaders/${id}`, { method: 'DELETE' }),

  listEvents: () => request<SchoolEvent[]>('/admin/cms/events'),
  listUpcomingEvents: () => request<SchoolEvent[]>('/admin/cms/events/upcoming'),
  listArchivedEvents: () => request<SchoolEvent[]>('/admin/cms/events/archived'),
  getFeaturedEvent: () => request<SchoolEvent>('/admin/cms/events/featured'),
  createEvent: (body: SchoolEventRequest) =>
    request<SchoolEvent>('/admin/cms/events', { method: 'POST', body: JSON.stringify(body) }),
  updateEvent: (id: string, body: SchoolEventRequest) =>
    request<SchoolEvent>(`/admin/cms/events/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteEvent: (id: string) => request<void>(`/admin/cms/events/${id}`, { method: 'DELETE' }),

  listAlbums: () => request<SchoolGalleryAlbum[]>('/admin/cms/gallery/albums'),
  createAlbum: (body: SchoolGalleryAlbumRequest) =>
    request<SchoolGalleryAlbum>('/admin/cms/gallery/albums', { method: 'POST', body: JSON.stringify(body) }),
  updateAlbum: (id: string, body: SchoolGalleryAlbumRequest) =>
    request<SchoolGalleryAlbum>(`/admin/cms/gallery/albums/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAlbum: (id: string) => request<void>(`/admin/cms/gallery/albums/${id}`, { method: 'DELETE' }),
  addMediaToAlbum: (albumId: string, body: SchoolGalleryMediaRequest) =>
    request<SchoolGalleryMedia>(`/admin/cms/gallery/albums/${albumId}/media`, { method: 'POST', body: JSON.stringify(body) }),
  deleteGalleryMedia: (mediaItemId: string) =>
    request<void>(`/admin/cms/gallery/media/${mediaItemId}`, { method: 'DELETE' }),

  listTestimonials: () => request<SchoolTestimonial[]>('/admin/cms/testimonials'),
  createTestimonial: (body: SchoolTestimonialRequest) =>
    request<SchoolTestimonial>('/admin/cms/testimonials', { method: 'POST', body: JSON.stringify(body) }),
  updateTestimonial: (id: string, body: SchoolTestimonialRequest) =>
    request<SchoolTestimonial>(`/admin/cms/testimonials/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTestimonial: (id: string) => request<void>(`/admin/cms/testimonials/${id}`, { method: 'DELETE' }),

  listAchievements: () => request<SchoolAchievement[]>('/admin/cms/achievements'),
  createAchievement: (body: SchoolAchievementRequest) =>
    request<SchoolAchievement>('/admin/cms/achievements', { method: 'POST', body: JSON.stringify(body) }),
  updateAchievement: (id: string, body: SchoolAchievementRequest) =>
    request<SchoolAchievement>(`/admin/cms/achievements/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAchievement: (id: string) => request<void>(`/admin/cms/achievements/${id}`, { method: 'DELETE' }),

  listInfrastructure: () => request<SchoolInfrastructureItem[]>('/admin/cms/infrastructure'),
  createInfrastructure: (body: SchoolInfrastructureItemRequest) =>
    request<SchoolInfrastructureItem>('/admin/cms/infrastructure', { method: 'POST', body: JSON.stringify(body) }),
  updateInfrastructure: (id: string, body: SchoolInfrastructureItemRequest) =>
    request<SchoolInfrastructureItem>(`/admin/cms/infrastructure/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteInfrastructure: (id: string) => request<void>(`/admin/cms/infrastructure/${id}`, { method: 'DELETE' }),

  listSocialLinks: () => request<SchoolSocialLink[]>('/admin/cms/social-links'),
  createSocialLink: (body: SchoolSocialLinkRequest) =>
    request<SchoolSocialLink>('/admin/cms/social-links', { method: 'POST', body: JSON.stringify(body) }),
  updateSocialLink: (id: string, body: SchoolSocialLinkRequest) =>
    request<SchoolSocialLink>(`/admin/cms/social-links/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteSocialLink: (id: string) => request<void>(`/admin/cms/social-links/${id}`, { method: 'DELETE' }),

  getAffiliation: () => request<SchoolAffiliationInfo>('/admin/cms/affiliation'),
  saveAffiliation: (body: SchoolAffiliationInfoRequest) =>
    request<SchoolAffiliationInfo>('/admin/cms/affiliation', { method: 'POST', body: JSON.stringify(body) }),

  listBranches: () => request<SchoolBranch[]>('/admin/cms/branches'),
  createBranch: (body: SchoolBranchRequest) =>
    request<SchoolBranch>('/admin/cms/branches', { method: 'POST', body: JSON.stringify(body) }),
  updateBranch: (id: string, body: SchoolBranchRequest) =>
    request<SchoolBranch>(`/admin/cms/branches/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBranch: (id: string) => request<void>(`/admin/cms/branches/${id}`, { method: 'DELETE' }),

  getAdmissionInfo: () => request<SchoolAdmissionInfo>('/admin/cms/admission-info'),
  saveAdmissionInfo: (body: SchoolAdmissionInfoRequest) =>
    request<SchoolAdmissionInfo>('/admin/cms/admission-info', { method: 'POST', body: JSON.stringify(body) }),

  listFeeStructures: () => request<SchoolFeeStructure[]>('/admin/cms/fee-structures'),
  createFeeStructure: (body: SchoolFeeStructureRequest) =>
    request<SchoolFeeStructure>('/admin/cms/fee-structures', { method: 'POST', body: JSON.stringify(body) }),
  updateFeeStructure: (id: string, body: SchoolFeeStructureRequest) =>
    request<SchoolFeeStructure>(`/admin/cms/fee-structures/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteFeeStructure: (id: string) => request<void>(`/admin/cms/fee-structures/${id}`, { method: 'DELETE' }),

  getAcademicContent: () => request<SchoolAcademicContent>('/admin/cms/academic-content'),
  saveAcademicContent: (body: SchoolAcademicContentRequest) =>
    request<SchoolAcademicContent>('/admin/cms/academic-content', { method: 'POST', body: JSON.stringify(body) }),

  listSectionConfigs: () => request<SchoolSectionConfig[]>('/admin/cms/section-config'),
  saveSectionConfig: (body: SchoolSectionConfigRequest) =>
    request<SchoolSectionConfig>('/admin/cms/section-config', { method: 'POST', body: JSON.stringify(body) }),

  getEnquiries: (params?: { status?: string; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.type) query.set('type', params.type);
    return request<SchoolEnquiry[]>(`/admin/cms/enquiries${query.size ? `?${query.toString()}` : ''}`);
  },
  updateEnquiryStatus: (id: string, status: string) =>
    request<void>(`/admin/cms/enquiries/${id}/status?status=${encodeURIComponent(status)}`, { method: 'PATCH' }),
};

export const publicSchoolCmsApi = {
  getLandingPage: (schoolCode: string) =>
    request<SchoolLandingPagePayload>(`/public/schools/${encodeURIComponent(schoolCode)}/landing-page`, { skipAuth: true }),
  submitEnquiry: (schoolCode: string, body: SchoolEnquiryRequest) =>
    request<SchoolEnquiry>(`/public/schools/${encodeURIComponent(schoolCode)}/enquiries`, { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
  subscribeNewsletter: (schoolCode: string, body: NewsletterSubscribeRequest) =>
    request<NewsletterSubscribeResponse>(`/public/schools/${encodeURIComponent(schoolCode)}/newsletter-subscribe`, { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
};

export const studentPortalApi = {
  getProfile: () => request<StudentProfileResponse>('/school-ops/student/profile'),
  updateProfile: (body: StudentProfileUpdateRequest) =>
    request<StudentProfileResponse>('/school-ops/student/profile', { method: 'PATCH', body: JSON.stringify(body) }),
  getClassroom: () => request<ClassroomDetailResponse>('/school-ops/student/classroom'),
  getTimetable: () => request<StudentTimetableResponse>('/school-ops/student/timetable'),
  getHomework: () => request<StudentHomeworkResponse[]>('/school-ops/student/homework'),
  updateHomeworkStatus: (homeworkId: string, body: HomeworkStatusUpdateRequest) =>
    request<void>(`/school-ops/student/homework/${homeworkId}/status`, { method: 'POST', body: JSON.stringify(body) }),
  getAttendanceAnalytics: () => request<StudentAttendanceAnalyticsResponse>('/school-ops/student/attendance/analytics'),
  submitAbsenceReason: (body: AbsenceReasonRequest) =>
    request<void>('/school-ops/student/attendance/absence-reason', { method: 'PUT', body: JSON.stringify(body) }),
  getResults: () => request<StudentResultResponse[]>('/school-ops/student/results'),
  getFeeRecords: () => request<StudentFeeRecordResponse[]>('/school-ops/student/fees'),
  sendCommunication: (body: StudentCommunicationRequest) =>
    request<void>('/school-ops/student/communication', { method: 'POST', body: JSON.stringify(body) }),
  reserveLibraryResource: (resourceId: string) =>
    request<LibraryReservationResponse>('/school-ops/student/library/reserve', { method: 'POST', body: JSON.stringify({ resourceId }) }),
  getForumReputation: () => request<StudentForumReputationResponse>('/school-ops/student/forum/reputation'),
};

export const teacherPortalApi = {
  getWorkspace: () => request<TeacherWorkspaceSummary>('/school-ops/teacher/workspace'),
  createHomework: (body: TeacherHomeworkRequest) =>
    request<TeacherHomeworkResponse>('/school-ops/teacher/homework', { method: 'POST', body: JSON.stringify(body) }),
  enterMarks: (body: MarksEntryRequest) =>
    request<void>('/school-ops/teacher/marks', { method: 'POST', body: JSON.stringify(body) }),
  logBehaviourRemark: (body: BehaviourRemarkRequest) =>
    request<void>('/school-ops/teacher/behaviour', { method: 'POST', body: JSON.stringify(body) }),
  sendCommunication: (body: TeacherCommunicationRequest) =>
    request<void>('/school-ops/teacher/communication', { method: 'POST', body: JSON.stringify(body) }),
  approveForumAnswer: (body: ForumAnswerApprovalRequest) =>
    request<void>('/school-ops/teacher/forum/approve-answer', { method: 'POST', body: JSON.stringify(body) }),
  getBiometricCompliance: () =>
    request<TeacherBiometricComplianceResponse>('/school-ops/teacher/biometric/compliance'),
};
