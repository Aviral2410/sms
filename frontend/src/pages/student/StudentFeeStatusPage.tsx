import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, Download, Loader } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { schoolOpsApi, type FeeRecordResponse } from '../../lib/api';
import { PortalPageHeader, PortalSection, PortalStatePanel, PortalStatCard } from '../../components/portal/PortalPagePrimitives';

export default function StudentFeeStatusPage() {
  const { session } = useStore();
  const [records, setRecords] = useState<FeeRecordResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    if (!session.schoolId) {
      setLoading(false);
      return;
    }
    schoolOpsApi.listFeeRecords(session.schoolId)
      .then((response) => {
        if (!active) return;
        const mine = response.filter((item) => item.studentUserId === session.userId);
        setRecords(mine);
      })
      .catch((error: any) => {
        if (active) setMessage(error?.message || 'Unable to load fee records.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session.schoolId, session.userId]);

  const totals = useMemo(() => ({
    due: records.reduce((sum, item) => sum + item.amountDue, 0),
    paid: records.reduce((sum, item) => sum + item.amountPaid, 0),
  }), [records]);

  if (loading) {
    return <PortalStatePanel icon={Loader} title="Loading fee status" description="Fetching student fee records and payment history." accent="#ffb663" />;
  }

  if (!records.length) {
    return <PortalStatePanel title="No fee records" description={message || 'No student fee records are available for this account yet.'} />;
  }

  return (
    <div className="space-y-6 pb-16">
      <PortalPageHeader
        eyebrow="Fee status"
        title="Paid, pending, and overdue fee summary"
        description="This student-facing fee page surfaces only the current learner’s records instead of exposing the wider finance workspace."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <PortalStatCard label="Amount due" value={totals.due} icon={CreditCard} accent="#fb7185" />
        <PortalStatCard label="Amount paid" value={totals.paid} icon={CreditCard} accent="#34d399" />
        <PortalStatCard label="Balance" value={totals.due - totals.paid} icon={CreditCard} accent="#22d3ee" />
      </div>

      <PortalSection title="Payment history" description="Responsive fee cards replace dense finance tables on small screens.">
        <div className="grid gap-4">
          {records.map((item) => (
            <div key={item.feeRecordId} className="glass-panel" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: 'var(--text-strong)', fontWeight: 800 }}>{item.feeCategory}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>Due {item.dueDate}</div>
              </div>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ color: 'var(--text-dim)' }}>Due {item.amountDue}</div>
                <div style={{ color: 'var(--text-dim)' }}>Paid {item.amountPaid}</div>
                <div style={{ color: item.paymentStatus === 'PAID' ? '#34d399' : '#fbbf24', fontWeight: 800 }}>{item.paymentStatus}</div>
                <button type="button" className="secondary-button"><Download size={16} /> Receipt</button>
              </div>
            </div>
          ))}
        </div>
      </PortalSection>
    </div>
  );
}
