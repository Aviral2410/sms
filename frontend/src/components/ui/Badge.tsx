import React from 'react';
import { OnboardingStatus } from '../../types';

interface BadgeProps {
  status: OnboardingStatus | string;
  className?: string;
}

const statusClasses: Record<string, string> = {
  DRAFT: 'status-draft',
  SUBMITTED: 'status-submitted',
  UNDER_REVIEW: 'status-review',
  APPROVED: 'status-approved',
  REJECTED: 'status-rejected',
  ACTIVE: 'status-approved',
  INACTIVE: 'status-rejected',
};

const Badge = ({ status, className = '' }: BadgeProps) => {
  const statusKey = status.toUpperCase();
  const label = status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ');

  return (
    <span className={`status-pill ${statusClasses[statusKey] || 'status-draft'} ${className}`}>
      {label}
    </span>
  );
};

export default Badge;
