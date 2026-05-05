import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkTextFit, clearTextLayoutCache, getTextLayoutCacheSize, measureTextBlock, prepareText } from './textLayout';

// textLayout.ts uses its own internal canvas-based measurement — no @chenglou/pretext dependency.
// In JSDOM the canvas returns width=0 for measureText, so we stub it via the global canvas mock
// defined in src/test/setup.ts. For deterministic word-wrap, we override measureText here to
// return proportional widths (10px per character).
const CHAR_WIDTH = 10;

beforeEach(() => {
  // Override the canvas context mock to return character-proportional widths
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    font: '',
    measureText: vi.fn((text: string) => ({ width: text.length * CHAR_WIDTH })),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
});

describe('textLayout adapter', () => {
  beforeEach(() => {
    clearTextLayoutCache();
  });

  it('reuses the prepared text cache when only width changes', () => {
    const baseConfig = {
      text: 'Unified school operations need reliable layout',
      font: '900 32px Manrope',
      lineHeight: 36,
    };

    // First call — prepares and caches
    measureTextBlock({ ...baseConfig, maxWidth: 240 });
    expect(getTextLayoutCacheSize()).toBe(1);

    // Second call with same text/font — should reuse cache
    measureTextBlock({ ...baseConfig, maxWidth: 180 });
    expect(getTextLayoutCacheSize()).toBe(1); // still 1 — no new prepare
  });

  it('returns fit information including overflow state', () => {
    // "Predictive attendance insights for every institution" = 52 chars
    // At 10px/char and maxWidth=120 (~12 chars per line) → should produce > 2 lines
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

  it('caches text preparation separately per text+font combination', () => {
    const config1 = { text: 'First text block', font: '400 16px Inter', lineHeight: 20 };
    const config2 = { text: 'Second different text', font: '400 16px Inter', lineHeight: 20 };

    prepareText(config1);
    prepareText(config2);
    expect(getTextLayoutCacheSize()).toBe(2);

    // Same config again — no new cache entry
    prepareText(config1);
    expect(getTextLayoutCacheSize()).toBe(2);
  });
});
