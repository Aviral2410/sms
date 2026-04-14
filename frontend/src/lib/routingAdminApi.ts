import { request } from './api';

export interface TenantDomainRecord {
  domainId: string;
  tenantId: string;
  domain: string;
  host: string;
  domainType: string;
  isPrimary: boolean;
  isCanonical: boolean;
  isActive: boolean;
  verificationStatus: string;
  verificationMethod: string;
  verificationToken?: string | null;
  verificationDetailsJson?: string | null;
  sslMode?: string | null;
  sslStatus?: string | null;
  dnsStatus?: string | null;
  lastVerifiedAt?: string | null;
  lastDnsCheckAt?: string | null;
  lastSslCheckAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TenantResolutionResponse {
  tenantId?: string;
  host?: string;
  type?: string;
  realmName?: string;
  schoolCode?: string;
  redirectUrl?: string;
  error?: string;
}

export const routingAdminApi = {
  addDomain: (tenantId: string, body: { domain: string; verificationMethod: string }) =>
    request<TenantDomainRecord>(`/auth/admin/routing/domains?tenantId=${encodeURIComponent(tenantId)}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  verifyDomain: (domainId: string) =>
    request<TenantDomainRecord>(`/auth/admin/routing/domains/${encodeURIComponent(domainId)}/verify`, {
      method: 'POST',
    }),
  setPrimary: (tenantId: string, domainId: string) =>
    request<void>(`/auth/admin/routing/domains/${encodeURIComponent(domainId)}/set-primary?tenantId=${encodeURIComponent(tenantId)}`, {
      method: 'POST',
    }),
  resolveHost: (host: string) =>
    request<TenantResolutionResponse>(`/public/tenant/resolve?host=${encodeURIComponent(host)}`, {
      skipAuth: true,
    }),
};
