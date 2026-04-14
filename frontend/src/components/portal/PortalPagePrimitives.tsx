import React from 'react';
import { AlertCircle, type LucideIcon } from 'lucide-react';

export function PortalPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(255,182,99,0.12)',
            border: '1px solid rgba(255,182,99,0.24)',
            color: '#ffb663',
            fontSize: '0.72rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          {eyebrow}
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-strong)' }}>
            {title}
          </h1>
          {description ? (
            <p style={{ margin: '10px 0 0', maxWidth: 760, color: 'var(--text-dim)', lineHeight: 1.7 }}>
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function PortalSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-panel animate-in" style={{ padding: 24, display: 'grid', gap: 20 }}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-strong)' }}>{title}</h2>
          {description ? (
            <p style={{ margin: '8px 0 0', color: 'var(--text-dim)', lineHeight: 1.6 }}>{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PortalStatCard({
  label,
  value,
  icon: Icon,
  accent,
  detail,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent: string;
  detail?: string;
}) {
  return (
    <div
      className="glass-panel"
      style={{
        padding: 20,
        display: 'grid',
        gap: 12,
        borderColor: `${accent}33`,
        background: `linear-gradient(180deg, ${accent}14, rgba(255,255,255,0.03))`,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${accent}18`,
          color: accent,
        }}
      >
        <Icon size={18} />
      </div>
      <div>
        <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>
          {label}
        </div>
        <div style={{ marginTop: 6, fontSize: '1.9rem', lineHeight: 1, color: 'var(--text-strong)', fontWeight: 900, letterSpacing: '-0.04em' }}>
          {value}
        </div>
        {detail ? <div style={{ marginTop: 8, color: 'var(--text-dim)', fontSize: '0.86rem' }}>{detail}</div> : null}
      </div>
    </div>
  );
}

export function PortalStatePanel({
  icon: Icon = AlertCircle,
  title,
  description,
  accent = '#ffb663',
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  accent?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="glass-panel"
      style={{
        minHeight: 240,
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        gap: 16,
        padding: 28,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${accent}18`,
          color: accent,
        }}
      >
        <Icon size={24} />
      </div>
      <div>
        <h3 style={{ margin: 0, color: 'var(--text-strong)', fontSize: '1.2rem', fontWeight: 800 }}>{title}</h3>
        <p style={{ margin: '10px auto 0', maxWidth: 520, color: 'var(--text-dim)', lineHeight: 1.6 }}>{description}</p>
      </div>
      {action}
    </div>
  );
}
