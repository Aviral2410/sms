import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PricingPage from './PricingPage';

const getPlansMock = vi.fn();
const getPublicSettingsMock = vi.fn();

vi.mock('../hooks/usePublicSiteContent', () => ({
  usePublicSiteContent: () => ({ content: null }),
}));

vi.mock('../components/public/PublicSiteFrame', () => ({
  PublicSiteFrame: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../components/public/PublicPretextHeading', () => ({
  PublicPretextHeading: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('../components/public/ScrollReveal', () => ({
  ScrollReveal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../components/public/HoverTiltCard', () => ({
  HoverTiltCard: ({ children }: { children: React.ReactNode }) => <article>{children}</article>,
}));

vi.mock('../lib/publicSiteApi', () => ({
  publicSiteApi: {
    getPlans: getPlansMock,
  },
}));

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api');
  return {
    ...actual,
    platformSettingsApi: {
      getPublicSettings: getPublicSettingsMock,
    },
  };
});

describe('PricingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPlansMock.mockResolvedValue([
      {
        planId: 'plan-1',
        planName: 'Premium',
        planCode: 'PREMIUM',
        description: 'Best plan',
        monthlyPrice: 2499,
        maxStudents: 1000,
        maxParentsPerStudent: 2,
        featureCodes: ['SCHOOL_OPS', 'TRANSPORT_BASE'],
        features: 'SCHOOL_OPS,TRANSPORT_BASE',
        createdAt: '2026-05-05T08:00:00Z',
      },
    ]);
    getPublicSettingsMock.mockResolvedValue({
      platformName: 'ElevateSmart',
      contactEmail: 'support@elevatesmart.ai',
      maintenanceMode: false,
      releasedFeatureCodes: ['SCHOOL_OPS'],
      updatedAt: '2026-05-05T08:00:00Z',
    });
  });

  it('hides unreleased plan features and shows rollout notice', async () => {
    render(
      <MemoryRouter>
        <PricingPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getPlansMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('School Ops')).toBeInTheDocument();
    expect(screen.queryByText('Transport Base')).not.toBeInTheDocument();
    expect(screen.getAllByText(/not yet enabled/i).length).toBeGreaterThan(0);
  });
});
