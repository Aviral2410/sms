import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegistrationWizardPage from './RegistrationWizardPage';

const navigateMock = vi.fn();
const createMock = vi.fn();
const uploadLogoMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../lib/api', () => ({
  onboardingApi: {
    create: createMock,
    uploadPublicSchoolLogo: uploadLogoMock,
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

vi.mock('../components/MotionBackdrop', () => ({
  MotionBackdrop: () => <div data-testid="motion-backdrop" />,
}));

vi.mock('../components/public/SchoolMark', () => ({
  SchoolMark: ({ school }: { school: { schoolName: string; schoolCode: string; logoUrl?: string | null } }) => (
    <div data-testid="school-mark">{school.schoolName}:{school.schoolCode}:{school.logoUrl ?? 'none'}</div>
  ),
}));

describe('RegistrationWizardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createMock.mockResolvedValue({ onboardingId: 'test-id' });
    uploadLogoMock.mockResolvedValue({ publicUrl: 'https://cdn.example.com/logo.png' });
  });

  it('shows a validation error on the first step when required fields are missing', async () => {
    render(
      <MemoryRouter>
        <RegistrationWizardPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Please fill in school name, school code, admin email, and contact phone.');
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it('submits a normalized onboarding payload through the full wizard flow', async () => {
    render(
      <MemoryRouter>
        <RegistrationWizardPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. global tech academy/i), { target: { value: 'Automation Academy' } });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. gta01/i), { target: { value: 'auto01' } });
    fireEvent.change(screen.getByPlaceholderText(/admin@academy\.edu/i), { target: { value: 'admin@example.edu' } });
    fireEvent.change(screen.getByPlaceholderText(/\+91 9876543210/i), { target: { value: '+91 9876543210' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    fireEvent.change(screen.getByPlaceholderText(/123 innovation drive/i), { target: { value: '123 Innovation Drive' } });
    fireEvent.change(screen.getByPlaceholderText(/^mumbai$/i), { target: { value: 'Bengaluru' } });
    fireEvent.change(screen.getByPlaceholderText(/^maharashtra$/i), { target: { value: 'Karnataka' } });
    fireEvent.change(screen.getByPlaceholderText(/^400001$/i), { target: { value: '560001' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByText(/premium/i));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit registration/i }));

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledTimes(1);
    });

    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
      schoolName: 'Automation Academy',
      schoolCode: 'AUTO01',
      realmName: 'auto01',
      boardAffiliation: 'CBSE',
      contactEmail: 'admin@example.edu',
      contactPhone: '+91 9876543210',
      addressLine: '123 Innovation Drive',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560001',
      selectedPlanCode: 'PREMIUM',
      usePlatformSubdomain: true,
      customDomain: null,
      tagline: null,
      hasBranches: false,
    }));

    await screen.findByText(/application submitted/i);
    expect(toastSuccessMock).toHaveBeenCalledWith('Onboarding request submitted successfully.');
  });

  it('uploads a school logo after the school code is entered', async () => {
    render(
      <MemoryRouter>
        <RegistrationWizardPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. gta01/i), { target: { value: 'auto02' } });

    const fileInput = screen.getByLabelText(/upload school logo/i) as HTMLInputElement;
    const file = new File(['image-bytes'], 'logo.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadLogoMock).toHaveBeenCalledWith(file, 'AUTO02');
    });

    expect(toastSuccessMock).toHaveBeenCalledWith('School logo uploaded. You can replace it later inside the school CMS.');
  });
});
