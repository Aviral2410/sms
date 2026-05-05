import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SchoolBrandingPanel } from './SchoolBrandingPanel';

const getCurrentBrandingMock = vi.fn();
const uploadCurrentSchoolLogoMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('../../lib/api', () => ({
  onboardingApi: {
    getCurrentBranding: getCurrentBrandingMock,
    uploadCurrentSchoolLogo: uploadCurrentSchoolLogoMock,
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
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
    getCurrentBrandingMock.mockResolvedValue({
      onboardingId: 'onboarding-1',
      schoolId: 'school-1',
      schoolName: 'Automation Academy',
      schoolCode: 'AUTO01',
      city: 'Bengaluru',
      state: 'Karnataka',
      logoUrl: 'https://cdn.example.com/logo-1.png',
    });
    uploadCurrentSchoolLogoMock.mockResolvedValue({
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
    expect(getCurrentBrandingMock).toHaveBeenCalledTimes(1);
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
      expect(uploadCurrentSchoolLogoMock).toHaveBeenCalledWith(file);
    });

    expect(toastSuccessMock).toHaveBeenCalledWith('School branding updated.');
    expect(screen.getByTestId('school-mark')).toHaveTextContent('https://cdn.example.com/logo-2.png');
  });
});
