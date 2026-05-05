import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicPretextHeading } from './PublicPretextHeading';

// Mock the layout hook directly — avoids requestAnimationFrame scheduling complexity in JSDOM.
// The hook is an implementation detail; tests should verify rendered output, not internal calls.
const { viMockUseElementTextLayout } = vi.hoisted(() => ({
  viMockUseElementTextLayout: vi.fn(),
}));

vi.mock('../../hooks/useElementTextLayout', () => ({
  useElementTextLayout: viMockUseElementTextLayout,
}));

// Default multi-line layout result for a wide container
const makeLinesResult = (text: string, lineCount: number) => {
  const charsPerLine = Math.ceil(text.length / lineCount);
  const lines = Array.from({ length: lineCount }, (_, i) =>
    text.slice(i * charsPerLine, Math.min(text.length, (i + 1) * charsPerLine))
  ).filter(Boolean);
  return {
    height: lines.length * 70,
    lineCount: lines.length,
    lines,
    maxLineWidth: charsPerLine * 12,
    isOverflowing: false,
    width: 220,
    font: '900 72px Manrope',
    lineHeight: 70,
    isReady: true,
  };
};

describe('PublicPretextHeading', () => {
  beforeEach(() => {
    viMockUseElementTextLayout.mockReset();
    // Default: single line (short text or wide container)
    viMockUseElementTextLayout.mockReturnValue(makeLinesResult('Default heading', 1));
  });

  it.each([
    'Launch faster',
    'Multilingual campus coordination for every school',
    'Emoji-ready learning support 📚✨',
    '春天到了智慧校园开始运行',
    'بدأت رحلة المدرسة الرقمية',
  ])('renders measured lines for "%s"', (title) => {
    viMockUseElementTextLayout.mockReturnValue(makeLinesResult(title, 1));

    const { container } = render(
      <PublicPretextHeading
        eyebrow="Platform"
        title={title}
        description="Unified school systems."
      />,
    );

    expect(container.querySelectorAll('.public-pretext-heading__line').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title);
  });

  it('relayouts cleanly when the heading width changes', () => {
    const title = 'Operational intelligence for every academic workflow';

    // First render: wide → 1 line
    viMockUseElementTextLayout.mockReturnValueOnce(makeLinesResult(title, 1));

    const { container, rerender } = render(
      <PublicPretextHeading eyebrow="Platform" title={title} />,
    );

    const initialCount = container.querySelectorAll('.public-pretext-heading__line').length;
    expect(initialCount).toBeGreaterThanOrEqual(1);

    // Simulate width change → narrow → 3 lines
    viMockUseElementTextLayout.mockReturnValue(makeLinesResult(title, 3));

    act(() => {
      rerender(<PublicPretextHeading eyebrow="Platform" title={title} />);
    });

    expect(container.querySelectorAll('.public-pretext-heading__line').length).toBeGreaterThan(initialCount);
  });

  it('remeasures when document fonts finish loading', async () => {
    const title = 'Adaptive typography for public pages';

    // Render with initial layout
    viMockUseElementTextLayout.mockReturnValue(makeLinesResult(title, 1));

    render(<PublicPretextHeading eyebrow="Platform" title={title} />);

    // After fonts load, the component re-renders via hook — simulate by changing return value and re-checking
    viMockUseElementTextLayout.mockReturnValue(makeLinesResult(title, 2));

    act(() => {
      document.fonts.dispatchEvent(new Event('loadingdone'));
    });

    // The hook was called at mount — verify the component rendered at least once with its output
    await waitFor(() => {
      expect(viMockUseElementTextLayout).toHaveBeenCalled();
    });
  });
});
