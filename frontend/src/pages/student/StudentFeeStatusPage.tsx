import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, Download, Loader } from 'lucide-react';
import { studentPortalApi, type StudentFeeRecordResponse } from '../../lib/schoolPortalApi';
import { PortalPageHeader, PortalSection, PortalStatePanel, PortalStatCard } from '../../components/portal/PortalPagePrimitives';

export default function StudentFeeStatusPage() {
  const [records, setRecords] = useState<StudentFeeRecordResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    studentPortalApi.getFeeRecords()
      .then((response) => {
        if (active) setRecords(response);
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
  }, []);

  const totals = useMemo(() => ({
    due: records.reduce((sum, item) => sum + item.amountDue, 0),
    paid: records.reduce((sum, item) => sum + item.amountPaid, 0),
  }), [records]);

  const downloadReceipt = (item: StudentFeeRecordResponse) => {
    const receipt = [
      'Student Fee Receipt',
      `Fee record: ${item.feeRecordId}`,
      `Category: ${item.feeCategory}`,
      `Due date: ${item.dueDate}`,
      `Amount due: ${item.amountDue}`,
      `Amount paid: ${item.amountPaid}`,
      `Status: ${item.paymentStatus}`,
      `Created at: ${item.createdAt}`,
    ].join('\n');

    const blob = new Blob([receipt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `fee-receipt-${item.feeRecordId}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

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
        description="This page now loads only the signed-in student’s fee records from the student module and keeps the receipt action functional."
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
                <button type="button" className="secondary-button" onClick={() => downloadReceipt(item)}>
                  <Download size={16} /> Receipt
                </button>
              </div>
            </div>
          ))}
        </div>
      </PortalSection>
    </div>
  );
}
