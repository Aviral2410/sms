import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkTextFit, clearTextLayoutCache, getTextLayoutCacheSize, measureTextBlock } from './textLayout';

const prepareWithSegmentsMock = vi.fn((text: string, font: string, options?: Record<string, string>) => ({
  text,
  font,
  options,
}));

const layoutWithLinesMock = vi.fn((prepared: { text: string }, maxWidth: number, lineHeight: number) => {
  const words = prepared.text.split(/\s+/).filter(Boolean);
  const lines: Array<{ text: string; width: number; start: { segmentIndex: number; graphemeIndex: number }; end: { segmentIndex: number; graphemeIndex: number } }> = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (!currentLine || candidate.length * 12 <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    lines.push({
      text: currentLine,
      width: currentLine.length * 12,
      start: { segmentIndex: 0, graphemeIndex: 0 },
      end: { segmentIndex: 0, graphemeIndex: 0 },
    });
    currentLine = word;
  }

  if (currentLine) {
    lines.push({
      text: currentLine,
      width: currentLine.length * 12,
      start: { segmentIndex: 0, graphemeIndex: 0 },
      end: { segmentIndex: 0, graphemeIndex: 0 },
    });
  }

  return {
    height: lines.length * lineHeight,
    lineCount: lines.length,
    lines,
  };
});

vi.mock('@chenglou/pretext', () => ({
  prepareWithSegments: prepareWithSegmentsMock,
  layoutWithLines: layoutWithLinesMock,
}));

describe('textLayout adapter', () => {
  beforeEach(() => {
    clearTextLayoutCache();
    prepareWithSegmentsMock.mockClear();
    layoutWithLinesMock.mockClear();
  });

  it('reuses the prepared text cache when only width changes', () => {
    const baseConfig = {
      text: 'Unified school operations need reliable layout',
      font: '900 32px Manrope',
      lineHeight: 36,
    };

    measureTextBlock({ ...baseConfig, maxWidth: 240 });
    measureTextBlock({ ...baseConfig, maxWidth: 180 });

    expect(prepareWithSegmentsMock).toHaveBeenCalledTimes(1);
    expect(layoutWithLinesMock).toHaveBeenCalledTimes(2);
    expect(getTextLayoutCacheSize()).toBe(1);
  });

  it('returns fit information including overflow state', () => {
    const result = checkTextFit({
      text: 'Predictive attendance insights for every institution',
      font: '900 32px Manrope',
      maxWidth: 120,
      lineHeight: 36,
      maxLines: 2,
    });

    expect(result.lineCount).toBeGreaterThan(2);
    expect(result.maxLineWidth).toBeGreaterThan(0);
    expect(result.lines?.length).toBe(result.lineCount);
    expect(result.isOverflowing).toBe(true);
  });
});
