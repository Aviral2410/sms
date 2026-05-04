import React from 'react';
import { PublicPageShell } from './PublicPageShell';
import { PublicSiteFooter } from './PublicSiteFooter';
import { PublicSiteNav } from './PublicSiteNav';
import { PublicGuidedTour } from './PublicGuidedTour';
import type { PublicSiteContentResponse } from '../../lib/publicSiteApi';

interface PublicSiteFrameProps {
  readonly children: React.ReactNode;
  readonly content: PublicSiteContentResponse | null;
  readonly activePath?: string;
  readonly mode?: 'hero' | 'ambient' | 'minimal';
  readonly density?: number;
  readonly textStream?: boolean;
  readonly flareTrail?: boolean;
  readonly showOrbs?: boolean;
  readonly contentWidth?: number;
}

export function PublicSiteFrame({
  children,
  content,
  activePath,
  mode = 'hero',
  density = 1.18,
  textStream = true,
  flareTrail = true,
  showOrbs = true,
  contentWidth = 1400,
}: PublicSiteFrameProps) {
  return (
    <PublicPageShell
      mode={mode}
      density={density}
      showOrbs={showOrbs}
      contentWidth={contentWidth}
      textStream={textStream}
      flareTrail={flareTrail}
    >
      <div className="public-site-frame">
        <PublicSiteNav content={content} activePath={activePath} />
        <main className="public-site-frame__body">{children}</main>
        <PublicSiteFooter content={content} />
        <PublicGuidedTour />
      </div>
    </PublicPageShell>
  );
}
