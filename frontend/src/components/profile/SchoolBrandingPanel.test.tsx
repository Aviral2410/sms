import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SchoolBrandingPanel } from './SchoolBrandingPanel';

const { viMockGetCurrentBranding, viMockUploadCurrentSchoolLogo, viMockToastSuccess, viMockToastError } = vi.hoisted(() => ({
  viMockGetCurrentBranding: vi.fn(),
  viMockUploadCurrentSchoolLogo: vi.fn(),
  viMockToastSuccess: vi.fn(),
  viMockToastError: vi.fn(),
}));

vi.mock('../../lib/api', () => ({
  onboardingApi: {
    getCurrentBranding: viMockGetCurrentBranding,
    uploadCurrentSchoolLogo: viMockUploadCurrentSchoolLogo,
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: viMockToastSuccess,
    error: viMockToastError,
  },
}));

vi.mock('../public/SchoolMark', () => ({
  SchoolMark: ({ school }: { school: { schoolName: string; schoolCode: string; logoUrl?: string | null } }) => (
    <div data-testid="school-mark">{school.schoolName}:{school.schoolCode}:{school.logoUrl ?? 'none'}</div>
  ),
}));

describe('SchoolBrandingPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    viMockGetCurrentBranding.mockResolvedValue({
      onboardingId: 'onboarding-1',
      schoolId: 'school-1',
      schoolName: 'Automation Academy',
      schoolCode: 'AUTO01',
      city: 'Bengaluru',
      state: 'Karnataka',
      logoUrl: 'https://cdn.example.com/logo-1.png',
    });
    viMockUploadCurrentSchoolLogo.mockResolvedValue({
      onboardingId: 'onboarding-1',
      schoolId: 'school-1',
      schoolName: 'Automation Academy',
      schoolCode: 'AUTO01',
      city: 'Bengaluru',
      state: 'Karnataka',
      logoUrl: 'https://cdn.example.com/logo-2.png',
    });
  });

  it('loads branding details on mount', async () => {
    render(<SchoolBrandingPanel accentColor="#22d3ee" />);

    await screen.findByText('Automation Academy');
    expect(viMockGetCurrentBranding).toHaveBeenCalledTimes(1);
    expect(screen.getByText('AUTO01')).toBeInTheDocument();
    expect(screen.getByText('Bengaluru')).toBeInTheDocument();
  });

  it('uploads a new logo and updates the displayed state', async () => {
    render(<SchoolBrandingPanel accentColor="#22d3ee" />);

    await screen.findByText('Automation Academy');

    const fileInput = screen.getByLabelText(/replace school logo/i) as HTMLInputElement;
    const file = new File(['image-bytes'], 'logo.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(viMockUploadCurrentSchoolLogo).toHaveBeenCalledWith(file);
    });

    expect(viMockToastSuccess).toHaveBeenCalledWith('School branding updated.');
    expect(screen.getByTestId('school-mark')).toHaveTextContent('https://cdn.example.com/logo-2.png');
  });
});
