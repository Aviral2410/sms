import React, { useEffect, useMemo, useState } from 'react';
import { CalendarRange, CheckCircle2, Clock3, Loader, MessageSquarePlus, SendHorizontal, XCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import { PortalPageHeader, PortalSection, PortalStatePanel, PortalStatCard } from '../../components/portal/PortalPagePrimitives';
import { studentPortalApi, type StudentAttendanceAnalyticsResponse } from '../../lib/schoolPortalApi';

export default function StudentAttendancePage() {
  const [attendance, setAttendance] = useState<StudentAttendanceAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedAbsenceId, setSelectedAbsenceId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    studentPortalApi.getAttendanceAnalytics()
      .then((response) => {
        if (active) setAttendance(response);
      })
      .catch((error: any) => {
        if (active) setMessage(error?.message || 'Unable to load attendance insights.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedAbsence = useMemo(
    () => attendance?.recentAbsences.find((item) => item.attendanceId === selectedAbsenceId) ?? null,
    [attendance?.recentAbsences, selectedAbsenceId],
  );

  const handleSubmit = async () => {
    if (!selectedAbsenceId.trim() || !reason.trim()) {
      setMessage('Pick an attendance item and add the reason you want the school to review.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      await studentPortalApi.submitAbsenceReason({ attendanceId: selectedAbsenceId.trim(), reason: reason.trim() });
      setAttendance((current) => current ? ({
        ...current,
        recentAbsences: current.recentAbsences.map((item) => item.attendanceId === selectedAbsenceId
          ? { ...item, reasonStatus: 'SUBMITTED', submittedReason: reason.trim() }
          : item),
      }) : current);
      setReason('');
      setSelectedAbsenceId('');
      setMessage('Absence reason submitted for review.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to submit absence reason.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PortalStatePanel icon={Loader} title="Loading attendance" description="Calculating attendance percentage and absence insights." accent="#34d399" />;
  }

  if (!attendance) {
    return <PortalStatePanel title="Attendance unavailable" description={message || 'Attendance data is not available yet.'} />;
  }

  return (
    <div className="space-y-6 pb-16">
      <PortalPageHeader
        eyebrow="Attendance"
        title="Attendance summary and absence notes"
        description="The student attendance flow now keeps actionable absence items visible, so students can submit or update notes without hunting for raw record ids."
      />

      <div className="grid gap-4 md:grid-cols-5">
        <PortalStatCard label="Attendance %" value={`${attendance.attendancePercentage.toFixed(1)}%`} icon={CheckCircle2} accent="#34d399" />
        <PortalStatCard label="Working days" value={attendance.totalWorkingDays} icon={CalendarRange} accent="#22d3ee" />
        <PortalStatCard label="Present" value={attendance.presentCount} icon={CheckCircle2} accent="#34d399" />
        <PortalStatCard label="Absent" value={attendance.absentCount} icon={XCircle} accent="#fb7185" />
        <PortalStatCard label="Late / Excused" value={`${attendance.lateCount} / ${attendance.excusedCount}`} icon={Clock3} accent="#ffb663" />
      </div>

      <PortalSection title="Attendance insights" description="School-provided insights surface trends without overwhelming the student.">
        <div className="grid gap-4 lg:grid-cols-3">
          {attendance.insights.map((insight, index) => (
            <div key={`${insight.title}-${index}`} className="glass-panel" style={{ padding: 20, display: 'grid', gap: 10 }}>
              <div style={{ fontSize: '0.72rem', color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>
                {insight.trend}
              </div>
              <div style={{ color: 'var(--text-strong)', fontWeight: 800 }}>{insight.title}</div>
              <div style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>{insight.detail}</div>
            </div>
          ))}
        </div>
      </PortalSection>

      <PortalSection title="Recent absence actions" description="Tap the card that needs a note instead of manually searching for an attendance record id.">
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-3">
            {attendance.recentAbsences.length ? attendance.recentAbsences.map((item) => {
              const isSelected = item.attendanceId === selectedAbsenceId;
              const statusColor = item.reasonStatus === 'SUBMITTED' ? '#34d399' : item.reasonStatus === 'APPROVED' ? '#22d3ee' : '#fbbf24';
              return (
                <button
                  key={item.attendanceId}
                  type="button"
                  onClick={() => {
                    setSelectedAbsenceId(item.attendanceId);
                    setReason(item.submittedReason || '');
                    setMessage('');
                  }}
                  className="glass-panel"
                  style={{
                    padding: 18,
                    display: 'grid',
                    gap: 8,
                    textAlign: 'left',
                    border: isSelected ? '1px solid rgba(34,211,238,0.45)' : undefined,
                    background: isSelected ? 'rgba(34,211,238,0.08)' : undefined,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div style={{ color: 'var(--text-strong)', fontWeight: 800 }}>{item.attendanceDate}</div>
                    <div style={{ color: statusColor, fontWeight: 800, fontSize: '0.76rem' }}>{item.reasonStatus.replace('_', ' ')}</div>
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Status: {item.attendanceStatus}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', lineHeight: 1.55 }}>
                    {item.submittedReason || 'No supporting note submitted yet.'}
                  </div>
                </button>
              );
            }) : (
              <div className="glass-panel" style={{ padding: 18, color: 'var(--text-dim)' }}>
                No recent absence or late attendance items need action right now.
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: 20, display: 'grid', gap: 14, alignContent: 'start' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>
                {selectedAbsence ? 'Selected attendance item' : 'Choose an attendance item'}
              </div>
              <div style={{ marginTop: 8, color: 'var(--text-strong)', fontWeight: 800 }}>
                {selectedAbsence ? `${selectedAbsence.attendanceDate} · ${selectedAbsence.attendanceStatus}` : 'Pick a card from the left'}
              </div>
            </div>
            <label className="grid gap-2">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Reason / comment</span>
              <textarea
                className="input-field"
                rows={5}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Add the explanation or supporting note the school should review."
              />
            </label>
            <Button onClick={handleSubmit} isLoading={submitting} disabled={!selectedAbsence}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selectedAbsence?.submittedReason ? <SendHorizontal size={16} /> : <MessageSquarePlus size={16} />}
                {selectedAbsence?.submittedReason ? 'Update note' : 'Submit note'}
              </span>
            </Button>
          </div>
        </div>
        {message ? <div style={{ color: 'var(--text-dim)' }}>{message}</div> : null}
      </PortalSection>
    </div>
  );
}
