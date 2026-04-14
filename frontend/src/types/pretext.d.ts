declare module '@chenglou/pretext' {
  export type LayoutCursor = {
    segmentIndex: number;
    graphemeIndex: number;
  };

  export type LayoutLine = {
    text: string;
    width: number;
    start: LayoutCursor;
    end: LayoutCursor;
  };

  export type PreparedTextWithSegments = unknown;

  export function prepareWithSegments(
    text: string,
    font: string,
    options?: {
      whiteSpace?: 'normal' | 'pre-wrap';
      wordBreak?: 'normal' | 'keep-all';
    },
  ): PreparedTextWithSegments;

  export function layoutWithLines(
    prepared: PreparedTextWithSegments,
    maxWidth: number,
    lineHeight: number,
  ): {
    height: number;
    lineCount: number;
    lines: LayoutLine[];
  };
}
