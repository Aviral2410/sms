export type TextWhiteSpace = 'normal' | 'pre-wrap' | 'nowrap';
export type TextWordBreak = 'normal' | 'keep-all';

export type TextLayoutConfig = {
  text: string;
  font: string;
  maxWidth: number;
  lineHeight: number;
  whiteSpace?: TextWhiteSpace;
  wordBreak?: TextWordBreak;
  maxLines?: number;
};

export type TextLayoutResult = {
  height: number;
  lineCount: number;
  lines?: string[];
  maxLineWidth?: number;
  isOverflowing?: boolean;
};
