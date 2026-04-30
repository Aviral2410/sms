import React, { useState } from 'react';
import { ArrowUpRight, Menu, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PublicSiteContentResponse } from '../../lib/publicSiteApi';

interface PublicSiteNavProps {
  readonly content: PublicSiteContentResponse | null;
  readonly activePath?: string;
}

const LINKS = [
  { to: '/#product', label: 'Product' },
  { to: '/#solutions', label: 'Solutions' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/#demo', label: 'Demo' },
  { to: '/#contact', label: 'Contact' },
];

export function PublicSiteNav({ content, activePath }: PublicSiteNavProps) {
  const [open, setOpen] = useState(false);
  const primaryCtaUrl = '/#demo';

  return (
    <nav className={`public-site-nav${open ? ' is-open' : ''}`} data-tour="nav">
      <Link to="/" className="public-site-nav__brand" onClick={() => setOpen(false)}>
        <span className="public-site-nav__brand-mark">
          <Sparkles size={18} />
        </span>
        <span>{content?.brandLabel || 'ElevateSmart'}</span>
      </Link>

      <div className="public-site-nav__links">
        {LINKS.map((link) => (
          link.to.includes('#') ? (
            <a
              key={link.to}
              href={link.to}
              className={`public-site-nav__link${activePath === link.to ? ' is-active' : ''}`}
              data-tour={link.to === '/pricing' ? 'nav-pricing' : undefined}
            >
              {link.label}
            </a>
          ) : (
            <Link
              key={link.to}
              to={link.to}
              className={`public-site-nav__link${activePath === link.to ? ' is-active' : ''}`}
              data-tour={link.to === '/pricing' ? 'nav-pricing' : undefined}
            >
              {link.label}
            </Link>
          )
        ))}
      </div>

      <div className="public-site-nav__actions">
        <Link to="/login" className="public-ghost-button public-site-nav__ghost">Sign In</Link>
        <a href={primaryCtaUrl} className="public-primary-button public-site-nav__cta" data-tour="primary-cta">
          Book Demo
          <ArrowUpRight size={16} />
        </a>
        <button
          type="button"
          className="public-site-nav__menu"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <div className={`public-site-nav__mobile${open ? ' is-open' : ''}`}>
        {LINKS.map((link) => (
          link.to.includes('#') ? (
            <a
              key={link.to}
              href={link.to}
              className={`public-site-nav__mobile-link${activePath === link.to ? ' is-active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ) : (
            <Link
              key={link.to}
              to={link.to}
              className={`public-site-nav__mobile-link${activePath === link.to ? ' is-active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          )
        ))}
        <div className="public-site-nav__mobile-actions">
          <Link to="/login" className="public-secondary-button" onClick={() => setOpen(false)}>Sign In</Link>
          <a href={primaryCtaUrl} className="public-primary-button" onClick={() => setOpen(false)}>
            Book Demo
            <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </nav>
  );
}
