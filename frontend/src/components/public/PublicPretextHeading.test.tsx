import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicPretextHeading } from './PublicPretextHeading';

const { viMockPrepareWithSegments, viMockLayoutWithLines } = vi.hoisted(() => ({
  viMockPrepareWithSegments: vi.fn((text: string, font: string, options?: Record<string, string>) => ({
    text,
    font,
    options,
  })),
  viMockLayoutWithLines: vi.fn((prepared: { text: string }, maxWidth: number, lineHeight: number) => {
    const limit = Math.max(1, Math.floor(maxWidth / 12));
    const lines: Array<{ text: string; width: number; start: { segmentIndex: number; graphemeIndex: number }; end: { segmentIndex: number; graphemeIndex: number } }> = [];

    for (let index = 0; index < prepared.text.length; index += limit) {
      const text = prepared.text.slice(index, index + limit);
      lines.push({
        text,
        width: text.length * 12,
        start: { segmentIndex: 0, graphemeIndex: index },
        end: { segmentIndex: 0, graphemeIndex: Math.min(prepared.text.length, index + limit) },
      });
    }

    return {
      height: lines.length * lineHeight,
      lineCount: lines.length,
      lines,
    };
  }),
}));

vi.mock('@chenglou/pretext', () => ({
  prepareWithSegments: viMockPrepareWithSegments,
  layoutWithLines: viMockLayoutWithLines,
}));

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];

  private readonly callback: ResizeObserverCallback;

  private element: Element | null = null;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    MockResizeObserver.instances.push(this);
  }

  observe(element: Element) {
    this.element = element;
    this.emit(220);
  }

  unobserve() {}

  disconnect() {}

  emit(width: number) {
    if (!this.element) return;
    this.callback(
      [{ target: this.element, contentRect: { width, height: 0, x: 0, y: 0, top: 0, left: 0, right: width, bottom: 0, toJSON: () => ({}) } as DOMRectReadOnly }] as ResizeObserverEntry[],
      this as unknown as ResizeObserver,
    );
  }
}

describe('PublicPretextHeading', () => {
  beforeEach(() => {
    viMockPrepareWithSegments.mockClear();
    viMockLayoutWithLines.mockClear();
    MockResizeObserver.instances = [];

    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
      fontStyle: 'normal',
      fontVariant: 'normal',
      fontWeight: '900',
      fontSize: '72px',
      fontFamily: 'Manrope, Inter, system-ui, sans-serif',
      lineHeight: '70.56px',
    } as CSSStyleDeclaration));
  });

  it.each([
    'Launch faster',
    'Multilingual campus coordination for every school',
    'Emoji-ready learning support 📚✨',
    '春天到了智慧校园开始运行',
    'بدأت رحلة المدرسة الرقمية',
  ])('renders measured lines for "%s"', async (title) => {
    const { container } = render(
      <PublicPretextHeading
        eyebrow="Platform"
        title={title}
        description="Unified school systems."
      />,
    );

    await waitFor(() => {
      expect(container.querySelectorAll('.public-pretext-heading__line').length).toBeGreaterThan(0);
    });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title);
  });

  it('relayouts cleanly when the heading width changes', async () => {
    const { container } = render(
      <PublicPretextHeading
        eyebrow="Platform"
        title="Operational intelligence for every academic workflow"
      />,
    );

    await waitFor(() => {
      expect(container.querySelectorAll('.public-pretext-heading__line').length).toBeGreaterThan(1);
    });

    const initialCount = container.querySelectorAll('.public-pretext-heading__line').length;

    act(() => {
      MockResizeObserver.instances[0]?.emit(96);
    });

    await waitFor(() => {
      expect(container.querySelectorAll('.public-pretext-heading__line').length).toBeGreaterThan(initialCount);
    });
  });

  it('remeasures when document fonts finish loading', async () => {
    render(
      <PublicPretextHeading
        eyebrow="Platform"
        title="Adaptive typography for public pages"
      />,
    );

    await waitFor(() => {
      expect(viMockLayoutWithLines).toHaveBeenCalled();
    });

    const initialCalls = viMockLayoutWithLines.mock.calls.length;

    act(() => {
      document.fonts.dispatchEvent(new Event('loadingdone'));
    });

    await waitFor(() => {
      expect(viMockLayoutWithLines.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });
});
