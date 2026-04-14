import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Filter, LifeBuoy, Mail, RefreshCw } from 'lucide-react';
import { onboardingApi, type PlatformPublicInquiryResponse } from '../../lib/api';
import { useRealtime } from '../../components/RealtimeHub';

type StatusFilter = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#fbbf24',
  IN_PROGRESS: '#22d3ee',
  RESOLVED: '#34d399',
};

export default function PublicInquiryInboxPage() {
  const { messages } = useRealtime();
  const [items, setItems] = useState<PlatformPublicInquiryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await onboardingApi.listPublicInquiries());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.topic?.startsWith('platform/public-inquiries/')) return;
    load();
  }, [messages]);

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const counts = useMemo(() => ({
    all: items.length,
    open: items.filter((item) => item.status === 'OPEN').length,
    support: items.filter((item) => item.inquiryType === 'SUPPORT').length,
    contact: items.filter((item) => item.inquiryType === 'CONTACT').length,
  }), [items]);

  const updateStatus = async (inquiryId: string, status: 'IN_PROGRESS' | 'RESOLVED') => {
    setUpdatingId(inquiryId);
    try {
      const updated = await onboardingApi.updatePublicInquiryStatus(inquiryId, status);
      setItems((current) => current.map((item) => item.inquiryId === inquiryId ? updated : item));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="modular-page animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header className="page-header">
        <div className="header-content">
          <span className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Mail size={14} className="text-cyan-400" /> Platform Inbox
          </span>
          <h1>Public contact and support intake</h1>
          <p>Every public inquiry lands here and updates in real time when new requests hit the platform.</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: 10 }}>
          <button className="secondary-button compact" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </header>

      <section className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        {[
          { label: 'Total inquiries', value: counts.all, accent: '#818cf8', icon: Mail },
          { label: 'Open now', value: counts.open, accent: '#fbbf24', icon: AlertTriangle },
          { label: 'Support tickets', value: counts.support, accent: '#22d3ee', icon: LifeBuoy },
          { label: 'Contact requests', value: counts.contact, accent: '#34d399', icon: CheckCircle2 },
        ].map((card) => (
          <article key={card.label} className="dashboard-card" style={{ padding: 22, border: `1px solid ${card.accent}33`, background: `linear-gradient(160deg, ${card.accent}14, rgba(15,23,42,0.86))` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.16em', color: card.accent, fontWeight: 800 }}>{card.label}</span>
              <card.icon size={18} color={card.accent} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>{card.value.toLocaleString()}</div>
          </article>
        ))}
      </section>

      <section className="dashboard-card" style={{ padding: 22, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as StatusFilter[]).map((option) => (
            <button
              key={option}
              onClick={() => setStatusFilter(option)}
              className="secondary-button compact"
              style={{
                background: statusFilter === option ? 'rgba(34,211,238,0.18)' : undefined,
                borderColor: statusFilter === option ? 'rgba(34,211,238,0.3)' : undefined,
                color: statusFilter === option ? '#67e8f9' : undefined,
              }}
            >
              <Filter size={14} /> {option.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
          {filtered.length} inquiry{filtered.length === 1 ? '' : 'ies'} in view
        </div>
      </section>

      <section style={{ display: 'grid', gap: 16 }}>
        {loading ? (
          <div className="dashboard-card" style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>Loading public inquiries...</div>
        ) : filtered.length === 0 ? (
          <div className="dashboard-card" style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>No inquiries match this filter.</div>
        ) : filtered.map((item) => (
          <motion.article
            key={item.inquiryId}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="dashboard-card"
            style={{ padding: 24, border: `1px solid ${(STATUS_COLORS[item.status] || '#64748b')}33`, display: 'grid', gap: 16 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="mode-chip-modern" style={{ background: `${(STATUS_COLORS[item.status] || '#64748b')}22`, color: STATUS_COLORS[item.status] || '#cbd5e1' }}>
                    {item.status}
                  </span>
                  <span className="mode-chip-modern" style={{ background: item.inquiryType === 'SUPPORT' ? 'rgba(34,211,238,0.14)' : 'rgba(52,211,153,0.14)', color: item.inquiryType === 'SUPPORT' ? '#67e8f9' : '#86efac' }}>
                    {item.inquiryType}
                  </span>
                </div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.18rem' }}>{item.subject}</h3>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                  {item.fullName} • {item.email} {item.organization ? `• ${item.organization}` : ''} {item.schoolName ? `• ${item.schoolName}` : ''}
                </div>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>

            <div style={{ color: 'var(--text-soft)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
              {item.message}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                {item.phone ? `Phone: ${item.phone}` : 'No phone attached'}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  className="secondary-button compact"
                  disabled={updatingId === item.inquiryId || item.status === 'IN_PROGRESS'}
                  onClick={() => updateStatus(item.inquiryId, 'IN_PROGRESS')}
                >
                  Start handling
                </button>
                <button
                  className="primary-button compact"
                  disabled={updatingId === item.inquiryId || item.status === 'RESOLVED'}
                  onClick={() => updateStatus(item.inquiryId, 'RESOLVED')}
                >
                  Resolve
                </button>
              </div>
            </div>
          </motion.article>
        ))}
      </section>
    </div>
  );
}
