import { request, requestForm, type SubscriptionPlanResponse } from './api';

export interface PublicSiteFeatureCard {
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  accentColor: string;
  sortOrder: number;
  bullets: string[];
}

export interface PublicRoleBenefit {
  roleKey: string;
  roleLabel: string;
  headline: string;
  description: string;
  accentColor: string;
  outcomes: string[];
}

export interface PublicSectionMedia {
  sectionKey: string;
  imageUrl: string;
  fallbackImageUrl: string;
  altText: string;
  caption: string;
}

export interface PublicTestimonial {
  quote: string;
  authorName: string;
  authorRole: string;
  organization: string;
  avatarUrl: string;
  accentColor: string;
  sortOrder: number;
}

export interface PublicMediaAssetResponse {
  assetId: string;
  assetKey: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  publicUrl: string;
  updatedAt: string;
}

export interface PublicSiteContentResponse {
  contentId: string;
  brandLabel: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubheadline: string;
  visionTitle: string;
  visionBody: string;
  whyTitle: string;
  whyBody: string;
  pricingHeadline: string;
  pricingBody: string;
  contactHeadline: string;
  contactBody: string;
  supportHeadline: string;
  supportBody: string;
  founderTitle: string;
  founderName: string;
  founderRole: string;
  founderMessageTitle: string;
  founderMessageBody: string;
  founderSignoff: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  secondaryCtaLabel: string;
  secondaryCtaUrl: string;
  featureCards: PublicSiteFeatureCard[];
  roleBenefits: PublicRoleBenefit[];
  mediaGallery: PublicSectionMedia[];
  testimonials: PublicTestimonial[];
  updatedAt: string;
}

export interface UpdatePublicSiteContentRequest {
  brandLabel?: string;
  heroEyebrow?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  visionTitle?: string;
  visionBody?: string;
  whyTitle?: string;
  whyBody?: string;
  pricingHeadline?: string;
  pricingBody?: string;
  contactHeadline?: string;
  contactBody?: string;
  supportHeadline?: string;
  supportBody?: string;
  founderTitle?: string;
  founderName?: string;
  founderRole?: string;
  founderMessageTitle?: string;
  founderMessageBody?: string;
  founderSignoff?: string;
  primaryCtaLabel?: string;
  primaryCtaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  featureCards?: PublicSiteFeatureCard[];
  roleBenefits?: PublicRoleBenefit[];
  mediaGallery?: PublicSectionMedia[];
  testimonials?: PublicTestimonial[];
}

export interface PublicSubscriptionOverviewResponse {
  activeInstitutions: number;
  payingInstitutions: number;
  totalLearnerCapacity: number;
  availablePlans: number;
  connectedSchools: number;
  totalUsers: number;
  attachedSchools: {
    schoolName: string;
    schoolCode: string;
    logoUrl?: string | null;
  }[];
  attachedSchoolNames: string[];
}

export interface PublicInquiryRequest {
  fullName: string;
  email: string;
  organization?: string;
  schoolName?: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface PublicInquiryResponse {
  inquiryId: string;
  inquiryType: 'CONTACT' | 'SUPPORT' | string;
  status: string;
  createdAt: string;
}

export const publicSiteApi = {
  getSiteContent: () => request<PublicSiteContentResponse>('/public/site-content', { skipAuth: true }),
  getPlans: () => request<SubscriptionPlanResponse[]>('/subscriptions/public/plans', { skipAuth: true }),
  getOverview: () => request<PublicSubscriptionOverviewResponse>('/subscriptions/public/overview', { skipAuth: true }),
  updateSiteContent: (body: UpdatePublicSiteContentRequest) =>
    request<PublicSiteContentResponse>('/platform/public-site-content', { method: 'PATCH', body: JSON.stringify(body) }),
  uploadMedia: (assetKey: string, file: File) => {
    const formData = new FormData();
    formData.append('assetKey', assetKey);
    formData.append('file', file);
    return requestForm<PublicMediaAssetResponse>('/platform/public-site-content/media', formData, { method: 'POST' });
  },
  submitContactRequest: (body: PublicInquiryRequest) =>
    request<PublicInquiryResponse>('/public/contact-requests', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
  submitSupportRequest: (body: PublicInquiryRequest) =>
    request<PublicInquiryResponse>('/public/support-requests', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
};
