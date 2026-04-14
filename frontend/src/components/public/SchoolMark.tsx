import React from 'react';
import { Building2 } from 'lucide-react';

export interface SchoolMarkData {
  schoolName: string;
  schoolCode?: string | null;
  logoUrl?: string | null;
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'SC';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'SC';
}

export function SchoolMark({
  school,
  size = 'md',
  className = '',
}: {
  school: SchoolMarkData;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const initials = initialsFromName(school.schoolName);

  return (
    <div className={`school-mark school-mark--${size} ${className}`.trim()}>
      {school.logoUrl ? (
        <img src={school.logoUrl} alt={`${school.schoolName} logo`} className="school-mark__logo" />
      ) : (
        <div className="school-mark__fallback" aria-hidden="true">
          <div className="school-mark__fallback-glow" />
          <div className="school-mark__fallback-core">
            <span>{initials}</span>
            <Building2 size={size === 'lg' ? 18 : 14} />
          </div>
        </div>
      )}
    </div>
  );
}
