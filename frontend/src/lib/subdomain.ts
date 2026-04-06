/**
 * Subdomain utility to handle school-specific routing.
 * Detects school codes from the hostname (e.g. bmps.elevatesmart.in)
 * or from a ?schoolCode= query parameter for local development.
 */

export interface SchoolContext {
  schoolCode: string | null;
  isSubdomain: boolean;
  platformView: boolean;
}

export function getSchoolContext(): SchoolContext {
  const hostname = window.location.hostname;
  const searchParams = new URLSearchParams(window.location.search);
  
  // 1. Support query parameter override for local development
  const querySchoolCode = searchParams.get('schoolCode');
  if (querySchoolCode) {
    return { 
      schoolCode: querySchoolCode.toUpperCase(), 
      isSubdomain: false, 
      platformView: false 
    };
  }

  // Handle [school].localhost:3000 case
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.replace('.localhost', '');
    if (sub && !['www', 'app', 'api', 'localhost', '127.0.0.1'].includes(sub)) {
      return { schoolCode: sub.toUpperCase(), isSubdomain: true, platformView: false };
    }
  }

  // 2. Parse general subdomain (e.g. bmps.elevatesmart.in)
  const parts = hostname.split('.');
  
  // If we are on localhost or a single-part name without .localhost, it's the platform view
  if (parts.length <= 1 || hostname === 'localhost' || hostname === '127.0.0.1') {
    return { schoolCode: null, isSubdomain: false, platformView: true };
  }

  const firstPart = parts[0].toLowerCase();
  if (['www', 'app', 'api', 'admin', 'portal'].includes(firstPart)) {
    return { schoolCode: null, isSubdomain: false, platformView: true };
  }

  return {
    schoolCode: firstPart.toUpperCase(),
    isSubdomain: true,
    platformView: false
  };
}

/**
 * Helper to determine if we should show the school-specific landing page 
 * instead of the platform landing page for the root ('/') route.
 */
export function isSchoolPortal(): boolean {
  const ctx = getSchoolContext();
  return ctx.schoolCode !== null;
}
