import React from 'react';
import { MotionBackdrop, type MotionBackdropMode } from '../MotionBackdrop';

interface PublicPageShellProps {
  children: React.ReactNode;
  mode?: MotionBackdropMode;
  contentWidth?: number | string;
  centered?: boolean;
  density?: number;
  baseColor?: string;
  showOrbs?: boolean;
  cursorFollow?: boolean;
  textStream?: boolean;
  flareTrail?: boolean;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
}

export function PublicPageShell({
  children,
  mode = 'ambient',
  contentWidth = 1120,
  centered = false,
  density,
  baseColor,
  showOrbs = false,
  cursorFollow,
  textStream,
  flareTrail,
  style,
  contentStyle,
}: PublicPageShellProps) {
  return (
    <div
      className={`public-page-shell${centered ? ' public-page-shell--centered' : ''}`}
      style={{
        ['--public-content-width' as any]: typeof contentWidth === 'number' ? `${contentWidth}px` : contentWidth,
        ...style,
      }}
    >
      <MotionBackdrop
        mode={mode}
        density={density}
        baseColor={baseColor}
        showOrbs={showOrbs}
        cursorFollow={cursorFollow}
        textStream={textStream}
        flareTrail={flareTrail}
      />
      <div className="public-page-shell__veil" />
      <div className="public-page-shell__content" style={contentStyle}>
        {children}
      </div>
    </div>
  );
}
