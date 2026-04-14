import { layoutWithLines, prepareWithSegments } from '@chenglou/pretext';
import type { CSSProperties } from 'react';
import type { TextLayoutConfig, TextLayoutResult, TextWhiteSpace, TextWordBreak } from '../types';

type PreparedTextHandle = {
  prepared: ReturnType<typeof prepareWithSegments>;
  cacheKey: string;
};

type PrepareTextConfig = Pick<TextLayoutConfig, 'text' | 'font' | 'whiteSpace' | 'wordBreak'>;

const preparedTextCache = new Map<string, PreparedTextHandle>();

function getCacheKey({ text, font, whiteSpace = 'normal', wordBreak = 'normal' }: PrepareTextConfig) {
  return JSON.stringify([text, font, whiteSpace, wordBreak]);
}

export function buildCanvasFont(style: Pick<CSSStyleDeclaration, 'fontStyle' | 'fontVariant' | 'fontWeight' | 'fontSize' | 'fontFamily'>) {
  return [
    style.fontStyle || 'normal',
    style.fontVariant || 'normal',
    style.fontWeight || '400',
    style.fontSize || '16px',
    style.fontFamily || 'sans-serif',
  ].join(' ');
}

export function parseLineHeight(lineHeight: string, fontSize: string, fallbackMultiplier = 1.2) {
  const numericLineHeight = Number.parseFloat(lineHeight);
  if (Number.isFinite(numericLineHeight)) {
    return numericLineHeight;
  }

  const numericFontSize = Number.parseFloat(fontSize);
  if (Number.isFinite(numericFontSize)) {
    return numericFontSize * fallbackMultiplier;
  }

  return 0;
}

export function prepareText(config: PrepareTextConfig) {
  const cacheKey = getCacheKey(config);
  const cached = preparedTextCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const prepared = prepareWithSegments(config.text, config.font, {
    whiteSpace: config.whiteSpace,
    wordBreak: config.wordBreak,
  });

  const handle = { prepared, cacheKey };
  preparedTextCache.set(cacheKey, handle);
  return handle;
}

export function measureTextBlock(config: TextLayoutConfig): TextLayoutResult {
  const text = config.text ?? '';
  const maxWidth = Number.isFinite(config.maxWidth) ? config.maxWidth : 0;
  const lineHeight = Number.isFinite(config.lineHeight) ? config.lineHeight : 0;

  if (!text || maxWidth <= 0 || lineHeight <= 0) {
    return {
      height: 0,
      lineCount: 0,
      lines: text ? [text] : [],
      maxLineWidth: 0,
      isOverflowing: false,
    };
  }

  const { prepared } = prepareText(config);
  const { height, lineCount, lines } = layoutWithLines(prepared, maxWidth, lineHeight);
  const normalizedLines = lines.map((line) => line.text);
  const maxLineWidth = lines.reduce((widest, line) => Math.max(widest, line.width), 0);
  const isOverflowing = config.maxLines != null
    ? lineCount > config.maxLines
    : maxLineWidth > maxWidth + 0.5;

  return {
    height,
    lineCount,
    lines: normalizedLines,
    maxLineWidth,
    isOverflowing,
  };
}

export function checkTextFit(config: TextLayoutConfig) {
  return measureTextBlock(config);
}

export function clearTextLayoutCache() {
  preparedTextCache.clear();
}

export function getTextLayoutCacheSize() {
  return preparedTextCache.size;
}

export function getPreparedTextCacheKeys() {
  return [...preparedTextCache.keys()];
}

export function getTextLayoutOptions(whiteSpace?: TextWhiteSpace, wordBreak?: TextWordBreak) {
  return {
    whiteSpace: whiteSpace ?? 'normal',
    wordBreak: wordBreak ?? 'normal',
  } satisfies Pick<TextLayoutConfig, 'whiteSpace' | 'wordBreak'>;
}

export function toStyleLineHeight(lineHeight: number): CSSProperties['lineHeight'] {
  return Number.isFinite(lineHeight) && lineHeight > 0 ? `${lineHeight}px` : undefined;
}
