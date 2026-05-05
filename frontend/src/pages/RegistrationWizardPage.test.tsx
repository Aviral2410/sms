import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegistrationWizardPage from './RegistrationWizardPage';

const { viMockNavigate, viMockCreate, viMockUploadLogo, viMockToastSuccess, viMockToastError } = vi.hoisted(() => ({
  viMockNavigate: vi.fn(),
  viMockCreate: vi.fn(),
  viMockUploadLogo: vi.fn(),
  viMockToastSuccess: vi.fn(),
  viMockToastError: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => viMockNavigate,
  };
});

vi.mock('../lib/api', () => ({
  onboardingApi: {
    create: viMockCreate,
    uploadPublicSchoolLogo: viMockUploadLogo,
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: viMockToastSuccess,
    error: viMockToastError,
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

// Helper to fill step 1 fields
function fillStep1() {
  fireEvent.change(screen.getByPlaceholderText('Global Tech Academy'), { target: { value: 'Automation Academy' } });
  fireEvent.change(screen.getByPlaceholderText('GTA01'), { target: { value: 'AUTO01' } });
  fireEvent.change(screen.getByPlaceholderText('admin@academy.edu'), { target: { value: 'admin@example.edu' } });
  fireEvent.change(screen.getByPlaceholderText('+91 9876543210'), { target: { value: '+91 9876543210' } });
}

// Helper to fill step 2 fields
function fillStep2() {
  fireEvent.change(screen.getByPlaceholderText('123 Innovation Drive'), { target: { value: '123 Innovation Drive' } });
  fireEvent.change(screen.getByPlaceholderText('Mumbai'), { target: { value: 'Bengaluru' } });
  fireEvent.change(screen.getByPlaceholderText('Maharashtra'), { target: { value: 'Karnataka' } });
  fireEvent.change(screen.getByPlaceholderText('400001'), { target: { value: '560001' } });
}

describe('RegistrationWizardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    viMockCreate.mockResolvedValue({ onboardingId: 'test-id' });
    viMockUploadLogo.mockResolvedValue({ publicUrl: 'https://cdn.example.com/logo.png' });
  });

  it('shows a validation error on the first step when required fields are missing', async () => {
    render(
      <MemoryRouter>
        <RegistrationWizardPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(viMockToastError).toHaveBeenCalledWith('Please fill in school name, school code, admin email, and contact phone.');
    });
    expect(viMockCreate).not.toHaveBeenCalled();
  });

  it('submits a normalized onboarding payload through the full wizard flow', async () => {
    render(
      <MemoryRouter>
        <RegistrationWizardPage />
      </MemoryRouter>
    );

    // Step 1: School details
    fillStep1();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 2: Campus details
    await waitFor(() => expect(screen.getByPlaceholderText('123 Innovation Drive')).toBeInTheDocument());
    fillStep2();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 3: Routing - realm auto-filled, just continue
    await waitFor(() => expect(screen.queryByPlaceholderText('123 Innovation Drive')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 4: Plan - select Premium
    await waitFor(() => expect(screen.getByText('Premium')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Premium'));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 5: Review + submit
    await waitFor(() => expect(screen.getByRole('button', { name: /submit registration/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /submit registration/i }));

    await waitFor(() => {
      expect(viMockCreate).toHaveBeenCalledTimes(1);
    });

    expect(viMockCreate).toHaveBeenCalledWith(expect.objectContaining({
      schoolName: 'Automation Academy',
      schoolCode: 'AUTO01',
      contactEmail: 'admin@example.edu',
      contactPhone: '+91 9876543210',
      addressLine: '123 Innovation Drive',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560001',
      selectedPlanCode: 'PREMIUM',
      customDomain: null,
      tagline: null,
      hasBranches: false,
    }));

    await screen.findByText(/application submitted/i);
    expect(viMockToastSuccess).toHaveBeenCalledWith('Onboarding request submitted successfully.');
  });

  it('uploads a school logo after the school code is entered', async () => {
    render(
      <MemoryRouter>
        <RegistrationWizardPage />
      </MemoryRouter>
    );

    // Enter a school code first (required before logo upload)
    fireEvent.change(screen.getByPlaceholderText('GTA01'), { target: { value: 'AUTO02' } });

    // The logo input is inside a <label> with visible text "Upload school logo"
    // It has no aria-label, so we query it by role with the label text
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    const file = new File(['image-bytes'], 'logo.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(viMockUploadLogo).toHaveBeenCalledWith(file, 'AUTO02');
    });

    expect(viMockToastSuccess).toHaveBeenCalledWith('School logo uploaded. You can replace it later inside the school CMS.');
  });
});
