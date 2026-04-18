/**
 * Subdomain utility to handle school-specific routing.
 * Detects school codes from the hostname (e.g. bmps.elevatesmart.in)
 * or from a ?schoolCode= query parameter for local development.
 */

export interface SchoolContext {
  kind: 'platform' | 'school' | 'invalid';
  schoolCode: string | null;
  hostname: string;
  subdomain: string | null;
  isSubdomain: boolean;
  platformView: boolean;
  reason?: string;
}

const RESERVED_PLATFORM_LABELS = new Set([
  'www',
  'app',
  'sms',
  'api',
  'admin',
  'portal',
  'mcp',
  'cdn',
  'static',
  'assets',
]);

const DEV_SUFFIXES = ['localhost', 'lvh.me', 'localtest.me'];
const DEV_MULTI_LABEL_SUFFIXES = ['127.0.0.1.nip.io', '127.0.0.1.sslip.io'];

function normalizeSchoolCode(value: string | null | undefined) {
  return value?.trim().toUpperCase() || null;
}

function isValidSchoolLabel(label: string) {
  return /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/i.test(label);
}

function platformContext(hostname: string, reason?: string): SchoolContext {
  return {
    kind: 'platform',
    schoolCode: null,
    hostname,
    subdomain: null,
    isSubdomain: false,
    platformView: true,
    reason,
  };
}

function invalidContext(hostname: string, subdomain: string, reason: string): SchoolContext {
  return {
    kind: 'invalid',
    schoolCode: null,
    hostname,
    subdomain,
    isSubdomain: true,
    platformView: true,
    reason,
  };
}

function schoolContext(hostname: string, subdomain: string, reason?: string): SchoolContext {
  return {
    kind: 'school',
    schoolCode: normalizeSchoolCode(subdomain),
    hostname,
    subdomain,
    isSubdomain: true,
    platformView: false,
    reason,
  };
}

function readSubdomainLabel(hostname: string) {
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  for (const suffix of DEV_MULTI_LABEL_SUFFIXES) {
    const marker = `.${suffix}`;
    if (hostname.endsWith(marker)) {
      return hostname.slice(0, -marker.length);
    }
  }

  for (const suffix of DEV_SUFFIXES) {
    const marker = `.${suffix}`;
    if (hostname.endsWith(marker)) {
      return hostname.slice(0, -marker.length);
    }
  }

  const parts = hostname.split('.');
  if (parts.length < 3) {
    return null;
  }

  return parts[0];
}

export function getSchoolContext(): SchoolContext {
  const hostname = window.location.hostname;
  const searchParams = new URLSearchParams(window.location.search);
  
  // 1. Support query parameter override for local development
  const querySchoolCode = normalizeSchoolCode(searchParams.get('schoolCode'));
  if (querySchoolCode) {
    return schoolContext(hostname, querySchoolCode, 'query_override');
  }

  const subdomain = readSubdomainLabel(hostname);
  if (!subdomain) {
    return platformContext(hostname, 'root_host');
  }

  const normalizedLabel = subdomain.toLowerCase();
  if (RESERVED_PLATFORM_LABELS.has(normalizedLabel)) {
    return platformContext(hostname, 'reserved_subdomain');
  }

  if (!isValidSchoolLabel(normalizedLabel)) {
    return invalidContext(hostname, subdomain, 'invalid_school_subdomain');
  }

  return schoolContext(hostname, subdomain, 'subdomain_detected');
}

/**
 * Helper to determine if we should show the school-specific landing page 
 * instead of the platform landing page for the root ('/') route.
 */
export function isSchoolPortal(): boolean {
  const ctx = getSchoolContext();
  return ctx.kind === 'school' && ctx.schoolCode !== null;
}

export function portalPath(path = '/') {
  return path.startsWith('/') ? path : `/${path}`;
}

export function getPortalLoginPath() {
  return portalPath('/login');
}

export function getPortalHomePath() {
  return portalPath('/');
}
