import React from 'react';
import { Link } from 'react-router-dom';
import type { PublicSiteContentResponse } from '../../lib/publicSiteApi';

interface PublicSiteFooterProps {
  readonly content: PublicSiteContentResponse | null;
}

export function PublicSiteFooter({ content }: PublicSiteFooterProps) {
  return (
    <footer className="public-site-footer public-panel--strong">
      <div>
        <div className="public-site-footer__brand">{content?.brandLabel || 'ElevateSmart'}</div>
        <p className="public-muted public-site-footer__copy">
          {content?.whyBody || 'Operational intelligence for institutions that want one connected platform.'}
        </p>
        <div className="public-site-footer__micro">
          One shared operating layer for admissions, academics, finance, communication, transport, and support.
        </div>
      </div>

      <div>
        <div className="public-site-footer__label">Get Started</div>
        <div className="public-site-footer__links">
          <Link to="/onboarding">Register School</Link>
          <Link to="/join">Join with Code</Link>
          <Link to="/login/admin">Platform Admin Login</Link>
        </div>
      </div>

      <div>
        <div className="public-site-footer__label">Reach Us</div>
        <div className="public-site-footer__links">
          <Link to="/pricing">Pricing</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/support">Raise Support</Link>
          <Link to="/vision">Vision</Link>
        </div>
      </div>
    </footer>
  );
}
