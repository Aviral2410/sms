import { useEffect, useMemo, useState } from 'react';
import { buildCanvasFont, checkTextFit, parseLineHeight } from '../lib/textLayout';
import type { TextLayoutResult, TextWhiteSpace, TextWordBreak } from '../types';

type UseElementTextLayoutOptions = {
  text: string;
  whiteSpace?: TextWhiteSpace;
  wordBreak?: TextWordBreak;
  maxLines?: number;
  layoutKey?: string | number;
};

type ElementTextLayoutResult = TextLayoutResult & {
  width: number;
  font: string;
  lineHeight: number;
  isReady: boolean;
};

const EMPTY_RESULT: ElementTextLayoutResult = {
  height: 0,
  lineCount: 0,
  lines: [],
  maxLineWidth: 0,
  isOverflowing: false,
  width: 0,
  font: '',
  lineHeight: 0,
  isReady: false,
};

export function useElementTextLayout<T extends HTMLElement>(
  element: T | null,
  options: UseElementTextLayoutOptions,
): ElementTextLayoutResult {
  const [layout, setLayout] = useState<ElementTextLayoutResult>(EMPTY_RESULT);

  const measurementKey = useMemo(
    () => `${options.text}::${options.whiteSpace ?? 'normal'}::${options.wordBreak ?? 'normal'}::${options.maxLines ?? 'none'}::${options.layoutKey ?? 'default'}`,
    [options.layoutKey, options.maxLines, options.text, options.whiteSpace, options.wordBreak],
  );

  useEffect(() => {
    if (!element || typeof window === 'undefined') {
      setLayout(EMPTY_RESULT);
      return;
    }

    let frameId = 0;

    const measure = (explicitWidth?: number) => {
      const style = window.getComputedStyle(element);
      const width = explicitWidth ?? element.clientWidth;
      const font = buildCanvasFont(style);
      const lineHeight = parseLineHeight(style.lineHeight, style.fontSize);

      const next = checkTextFit({
        text: options.text,
        font,
        maxWidth: width,
        lineHeight,
        whiteSpace: options.whiteSpace,
        wordBreak: options.wordBreak,
        maxLines: options.maxLines,
      });

      setLayout({
        ...next,
        width,
        font,
        lineHeight,
        isReady: width > 0 && lineHeight > 0,
      });
    };

    const scheduleMeasure = (width?: number) => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => measure(width));
    };

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      scheduleMeasure(width);
    });

    observer.observe(element);
    scheduleMeasure();

    const fontSet = typeof document !== 'undefined' ? document.fonts : undefined;
    const onFontsChanged = () => scheduleMeasure();

    if (fontSet?.addEventListener) {
      fontSet.addEventListener('loadingdone', onFontsChanged);
      fontSet.addEventListener('loadingerror', onFontsChanged);
    }

    void fontSet?.ready.then(onFontsChanged);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      if (fontSet?.removeEventListener) {
        fontSet.removeEventListener('loadingdone', onFontsChanged);
        fontSet.removeEventListener('loadingerror', onFontsChanged);
      }
    };
  }, [element, measurementKey, options.maxLines, options.text, options.whiteSpace, options.wordBreak]);

  return layout;
}
