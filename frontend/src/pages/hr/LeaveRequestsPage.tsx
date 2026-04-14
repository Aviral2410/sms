import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useStore } from '../../store/useStore';
import { ApiError, schoolOpsApi, type LeaveRequestStatus, type LeaveType, type StaffLeaveRequest } from '../../lib/api';

const ADMIN_ROLES = new Set(['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER']);

function fmtRange(item: StaffLeaveRequest) {
  return `${item.startDate} to ${item.endDate}`;
}

function isAdmin(role: string | null | undefined) {
  return role ? ADMIN_ROLES.has(role.toUpperCase()) : false;
}

export default function LeaveRequestsPage() {
  const { session } = useStore();
  const admin = useMemo(() => isAdmin(session.role), [session.role]);
  const [loading, setLoading] = useState(true);
  const [myLeaves, setMyLeaves] = useState<StaffLeaveRequest[]>([]);
  const [pending, setPending] = useState<StaffLeaveRequest[]>([]);

  const [leaveType, setLeaveType] = useState<LeaveType>('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const requests: Promise<any>[] = [schoolOpsApi.listMyLeaveRequests()];
      if (admin) {
        requests.push(schoolOpsApi.listLeaveRequests('PENDING'));
      }
      const [mine, pendingRows] = await Promise.all(requests);
      setMyLeaves(mine || []);
      setPending(pendingRows || []);
    } catch (e: any) {
      const message = e instanceof ApiError ? e.message : 'Failed to load leave requests';
      toast.error(message);
      setMyLeaves([]);
      setPending([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session.token) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.token, admin]);

  const submit = async () => {
    try {
      await schoolOpsApi.createLeaveRequest({
        leaveType,
        startDate,
        endDate,
        reason: reason.trim() ? reason.trim() : null,
      });
      toast.success('Leave request submitted');
      setStartDate('');
      setEndDate('');
      setReason('');
      await load();
    } catch (e: any) {
      const message = e instanceof ApiError ? e.message : 'Failed to submit leave request';
      toast.error(message);
    }
  };

  const approve = async (leaveRequestId: string) => {
    const note = window.prompt('Approval note (required):', 'Approved');
    if (!note) return;
    try {
      await schoolOpsApi.approveLeaveRequest(leaveRequestId, note);
      toast.success('Approved');
      await load();
    } catch (e: any) {
      const message = e instanceof ApiError ? e.message : 'Failed to approve';
      toast.error(message);
    }
  };

  const reject = async (leaveRequestId: string) => {
    const note = window.prompt('Rejection reason (required):', 'Not approved');
    if (!note) return;
    try {
      await schoolOpsApi.rejectLeaveRequest(leaveRequestId, note);
      toast.success('Rejected');
      await load();
    } catch (e: any) {
      const message = e instanceof ApiError ? e.message : 'Failed to reject';
      toast.error(message);
    }
  };

  const cancel = async (leaveRequestId: string) => {
    try {
      await schoolOpsApi.cancelLeaveRequest(leaveRequestId);
      toast.success('Canceled');
      await load();
    } catch (e: any) {
      const message = e instanceof ApiError ? e.message : 'Failed to cancel';
      toast.error(message);
    }
  };

  const pill = (status: LeaveRequestStatus) => {
    const map: Record<string, { bg: string; fg: string; bd: string }> = {
      PENDING: { bg: 'rgba(251,191,36,0.10)', fg: '#fbbf24', bd: 'rgba(251,191,36,0.28)' },
      APPROVED: { bg: 'rgba(52,211,153,0.10)', fg: '#34d399', bd: 'rgba(52,211,153,0.28)' },
      REJECTED: { bg: 'rgba(248,113,113,0.10)', fg: '#f87171', bd: 'rgba(248,113,113,0.28)' },
      CANCELED: { bg: 'rgba(148,163,184,0.10)', fg: '#94a3b8', bd: 'rgba(148,163,184,0.28)' },
    };
    const c = map[status] || map.PENDING;
    return (
      <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999, background: c.bg, color: c.fg, border: `1px solid ${c.bd}` }}>
        {status}
      </span>
    );
  };

  if (loading) return <div style={{ padding: 24, color: 'var(--text-dim)' }}>Loading leave requests...</div>;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#ffb663' }}>HR / Operations</div>
          <h1 style={{ margin: '6px 0 0', fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>Leave Requests</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-dim)' }}>Submit leave, track approval, and manage pending requests.</p>
        </div>
        <button onClick={load} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#e2e8f0', fontWeight: 800, cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: admin ? '1fr 1fr' : '1fr', gap: 14 }}>
        <div style={{ padding: 18, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontWeight: 900, color: '#fff' }}>New Leave Request</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Backend validates policy</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-dim)', marginBottom: 6 }}>Leave Type</div>
              <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,16,24,0.7)', color: '#e2e8f0' }}>
                {(['SICK', 'CASUAL', 'ANNUAL', 'UNPAID', 'OTHER'] as LeaveType[]).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div />
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-dim)', marginBottom: 6 }}>Start Date</div>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,16,24,0.7)', color: '#e2e8f0' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-dim)', marginBottom: 6 }}>End Date</div>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,16,24,0.7)', color: '#e2e8f0' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-dim)', marginBottom: 6 }}>Reason</div>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,16,24,0.7)', color: '#e2e8f0', resize: 'vertical' }} />
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={submit} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(135deg, rgba(255,182,99,0.92), rgba(251,191,36,0.92))', color: '#0b1220', fontWeight: 1000, cursor: 'pointer' }}>
              Submit
            </button>
          </div>
        </div>

        {admin && (
          <div style={{ padding: 18, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontWeight: 900, color: '#fff', marginBottom: 10 }}>Pending Approvals</div>
            {pending.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', padding: 10 }}>No pending requests.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pending.map((p) => (
                  <div key={p.leaveRequestId} style={{ padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ color: '#fff', fontWeight: 900 }}>{p.leaveType} | {fmtRange(p)}</div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{p.reason || 'No reason provided'}</div>
                      </div>
                      {pill(p.status)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                      <button onClick={() => reject(p.leaveRequestId)} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(248,113,113,0.35)', background: 'rgba(248,113,113,0.10)', color: '#fecaca', fontWeight: 900, cursor: 'pointer' }}>
                        Reject
                      </button>
                      <button onClick={() => approve(p.leaveRequestId)} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(52,211,153,0.35)', background: 'rgba(52,211,153,0.10)', color: '#bbf7d0', fontWeight: 900, cursor: 'pointer' }}>
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: 18, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontWeight: 900, color: '#fff', marginBottom: 10 }}>My Requests</div>
        {myLeaves.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', padding: 10 }}>No leave requests yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myLeaves.map((r) => (
              <div key={r.leaveRequestId} style={{ padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ color: '#fff', fontWeight: 900 }}>{r.leaveType} | {fmtRange(r)}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    {r.reason || 'No reason provided'}
                    {r.reviewNote ? ` | Review: ${r.reviewNote}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {pill(r.status)}
                  {r.status === 'PENDING' && (
                    <button onClick={() => cancel(r.leaveRequestId)} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.35)', background: 'rgba(148,163,184,0.10)', color: '#e2e8f0', fontWeight: 900, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

