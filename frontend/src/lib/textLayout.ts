import type { CSSProperties } from 'react';
import type { TextLayoutConfig, TextLayoutResult, TextWhiteSpace, TextWordBreak } from '../types';

type PreparedToken = {
  text: string;
  width: number;
};

type PreparedParagraph = {
  tokens: PreparedToken[];
};

type PreparedTextHandle = {
  prepared: PreparedParagraph[];
  cacheKey: string;
};

const preparedTextCache = new Map<string, PreparedTextHandle>();
const textMeasureCache = new Map<string, number>();

function getCacheKey({ text, font, whiteSpace = 'normal', wordBreak = 'normal' }: Pick<TextLayoutConfig, 'text' | 'font' | 'whiteSpace' | 'wordBreak'>) {
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

function getApproxCharacterWidth(font: string) {
  const match = font.match(/(\d+(?:\.\d+)?)px/);
  const fontSize = match ? Number.parseFloat(match[1]) : 16;
  return fontSize * 0.62;
}

function measureTextWidth(text: string, font: string) {
  const cacheKey = `${font}::${text}`;
  const cached = textMeasureCache.get(cacheKey);
  if (cached != null) return cached;

  let width = text.length * getApproxCharacterWidth(font);

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      context.font = font;
      width = context.measureText(text).width;
    }
  }

  textMeasureCache.set(cacheKey, width);
  return width;
}

function tokenizeParagraph(text: string, font: string, whiteSpace: TextWhiteSpace, wordBreak: TextWordBreak): PreparedToken[] {
  if (!text) return [];

  if (whiteSpace === 'pre-wrap') {
    const regex = wordBreak === 'keep-all' ? /(\s+)/ : /(\s+|(?<=-))/;
    return text.split(regex).filter(Boolean).map((token) => ({
      text: token,
      width: measureTextWidth(token, font),
    }));
  }

  if (wordBreak === 'keep-all') {
    return text.split(/\s+/).filter(Boolean).map((token, index, source) => ({
      text: index < source.length - 1 ? `${token} ` : token,
      width: measureTextWidth(index < source.length - 1 ? `${token} ` : token, font),
    }));
  }

  return text.split(/(\s+)/).filter(Boolean).map((token) => ({
    text: token,
    width: measureTextWidth(token, font),
  }));
}

function forceBreakToken(token: PreparedToken, maxWidth: number, font: string) {
  if (!token.text) return [];

  const segments: PreparedToken[] = [];
  let current = '';

  for (const character of token.text) {
    const candidate = `${current}${character}`;
    const candidateWidth = measureTextWidth(candidate, font);

    if (current && candidateWidth > maxWidth) {
      segments.push({
        text: current,
        width: measureTextWidth(current, font),
      });
      current = character;
      continue;
    }

    current = candidate;
  }

  if (current) {
    segments.push({
      text: current,
      width: measureTextWidth(current, font),
    });
  }

  return segments;
}

export function prepareText(config: Pick<TextLayoutConfig, 'text' | 'font' | 'whiteSpace' | 'wordBreak'>) {
  const cacheKey = getCacheKey(config);
  const cached = preparedTextCache.get(cacheKey);
  if (cached) return cached;

  const whiteSpace = config.whiteSpace ?? 'normal';
  const wordBreak = config.wordBreak ?? 'normal';
  const paragraphs = (whiteSpace === 'pre-wrap' ? config.text.split('\n') : [config.text])
    .map((paragraph) => ({
      tokens: tokenizeParagraph(paragraph, config.font, whiteSpace, wordBreak),
    }));

  const handle = {
    prepared: paragraphs,
    cacheKey,
  };

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

  const whiteSpace = config.whiteSpace ?? 'normal';
  const wordBreak = config.wordBreak ?? 'normal';
  const { prepared } = prepareText(config);
  const lines: string[] = [];
  const lineWidths: number[] = [];

  for (const paragraph of prepared) {
    let currentLine = '';
    let currentWidth = 0;

    const pushLine = (lineText: string, width: number) => {
      lines.push(whiteSpace === 'normal' ? lineText.trim() : lineText.replace(/\s+$/, ''));
      lineWidths.push(width);
    };

    for (const token of paragraph.tokens) {
      if (!token.text.trim()) {
        if (whiteSpace === 'pre-wrap' && currentLine) {
          currentLine += token.text;
          currentWidth += token.width;
        }
        continue;
      }

      const candidate = `${currentLine}${token.text}`;
      const candidateWidth = currentWidth + token.width;

      if (!currentLine || candidateWidth <= maxWidth) {
        currentLine = candidate;
        currentWidth = candidateWidth;
        continue;
      }

      pushLine(currentLine, currentWidth);

      if (token.width <= maxWidth || wordBreak === 'keep-all') {
        currentLine = token.text;
        currentWidth = token.width;
        continue;
      }

      const forcedSegments = forceBreakToken(token, maxWidth, config.font);
      currentLine = '';
      currentWidth = 0;

      forcedSegments.forEach((segment, index) => {
        const isLast = index === forcedSegments.length - 1;
        if (isLast) {
          currentLine = segment.text;
          currentWidth = segment.width;
          return;
        }
        pushLine(segment.text, segment.width);
      });
    }

    if (currentLine) {
      pushLine(currentLine, currentWidth);
    } else if (whiteSpace === 'pre-wrap' && !paragraph.tokens.length) {
      lines.push('');
      lineWidths.push(0);
    }
  }

  const normalizedLines = lines.length ? lines : [text];
  const maxLineWidth = lineWidths.length ? Math.max(...lineWidths) : measureTextWidth(text, config.font);
  const lineCount = normalizedLines.length;

  return {
    height: lineCount * lineHeight,
    lineCount,
    lines: normalizedLines,
    maxLineWidth,
    isOverflowing: config.maxLines != null ? lineCount > config.maxLines : maxLineWidth > maxWidth + 0.5,
  };
}

export function checkTextFit(config: TextLayoutConfig) {
  return measureTextBlock(config);
}

export function clearTextLayoutCache() {
  preparedTextCache.clear();
  textMeasureCache.clear();
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
