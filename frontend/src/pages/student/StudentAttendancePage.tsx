import React, { useEffect, useState } from 'react';
import { CalendarRange, CheckCircle2, Clock3, Loader, MessageSquarePlus, XCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import { PortalPageHeader, PortalSection, PortalStatePanel, PortalStatCard } from '../../components/portal/PortalPagePrimitives';
import { studentPortalApi, type StudentAttendanceAnalyticsResponse } from '../../lib/schoolPortalApi';

export default function StudentAttendancePage() {
  const [attendance, setAttendance] = useState<StudentAttendanceAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [absenceId, setAbsenceId] = useState('');
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

  const handleSubmit = async () => {
    if (!absenceId.trim() || !reason.trim()) {
      setMessage('Enter an attendance record id and a reason.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      await studentPortalApi.submitAbsenceReason({ attendanceId: absenceId.trim(), reason: reason.trim() });
      setAbsenceId('');
      setReason('');
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
        description="The student attendance view keeps summary cards up front, then offers a simple absence-reason flow instead of a cluttered workflow."
      />

      <div className="grid gap-4 md:grid-cols-5">
        <PortalStatCard label="Attendance %" value={`${attendance.attendancePercentage}%`} icon={CheckCircle2} accent="#34d399" />
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

      <PortalSection title="Add absence reason" description="Students can send a reason or note against a known attendance record id.">
        <div className="grid gap-4 xl:grid-cols-[0.6fr_1fr_auto]">
          <label className="grid gap-2">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Attendance record id</span>
            <input className="input-field" value={absenceId} onChange={(event) => setAbsenceId(event.target.value)} placeholder="ATT-..." />
          </label>
          <label className="grid gap-2">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Reason / comment</span>
            <textarea className="input-field" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Add your explanation or supporting note." />
          </label>
          <div className="flex items-end">
            <Button onClick={handleSubmit} isLoading={submitting}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquarePlus size={16} />
                Submit
              </span>
            </Button>
          </div>
        </div>
        {message ? <div style={{ color: 'var(--text-dim)' }}>{message}</div> : null}
      </PortalSection>
    </div>
  );
}
