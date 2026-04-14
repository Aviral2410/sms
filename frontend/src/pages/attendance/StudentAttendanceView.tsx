import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, CalendarDays, FileText, Flame, LineChart } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError, schoolOpsApi, type AttendanceRecordResponse, type StudentAttendanceSummaryResponse } from '../../lib/api';
import { useStore } from '../../store/useStore';

const PRESETS = ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'] as const;

export default function StudentAttendanceView() {
  const { session } = useStore();
  const [searchParams] = useSearchParams();
  const targetStudentId: string = searchParams.get('studentId') || (session.role === 'STUDENT' ? session.userId || '' : '');

  const [summary, setSummary] = useState<StudentAttendanceSummaryResponse | null>(null);
  const [records, setRecords] = useState<AttendanceRecordResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    preset: 'MONTHLY',
    from: new Date().toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const [reasonForm, setReasonForm] = useState({ attendanceId: '', category: 'SICK', description: '' });

  useEffect(() => {
    const schoolId = session.schoolId;
    if (!targetStudentId || !schoolId) return;
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        const nextSummary = await schoolOpsApi.getStudentAttendanceSummaryV2(targetStudentId, {
          preset: filters.preset,
          from: filters.preset === 'CUSTOM' ? filters.from : undefined,
          to: filters.preset === 'CUSTOM' ? filters.to : undefined,
        });
        if (ignore) return;
        setSummary(nextSummary);
        setLocked(false);

        const enrollments = await schoolOpsApi.listStudentEnrollments(schoolId);
        const enrollment = enrollments.find((item) => item.studentUserId === targetStudentId);
        const classRecords = enrollment
          ? await schoolOpsApi.listAttendanceRecords({ schoolId, classId: enrollment.classId, fromDate: nextSummary.fromDate, toDate: nextSummary.toDate })
          : [];
        if (ignore) return;
        const studentRecords = classRecords.filter((item) => item.userId === targetStudentId);
        setRecords(studentRecords);
        const firstAbsent = studentRecords.find((item) => item.attendanceStatus === 'ABSENT');
        setReasonForm((current) => ({ ...current, attendanceId: current.attendanceId || firstAbsent?.attendanceId || '' }));
      } catch (error: any) {
        if (error instanceof ApiError && error.status === 403) {
          if (!ignore) {
            setLocked(true);
            setSummary(null);
            setRecords([]);
          }
          return;
        }
        if (!ignore) {
          setLocked(false);
          toast.error(error?.message || 'Failed to load attendance summary');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [filters, session.schoolId, targetStudentId]);

  if (locked) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-8 shadow-2xl animate-in text-white">
        <div className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-300">Attendance Locked</div>
        <h2 className="mt-3 text-3xl font-black">Upgrade required</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          Attendance is not enabled for the current subscription.
        </p>
      </div>
    );
  }

  const absentRecords = useMemo(() => records.filter((item) => item.attendanceStatus === 'ABSENT'), [records]);
  const levelTone = summary?.warningLevel === 'CRITICAL' ? 'bg-rose-500/15 text-rose-200 border-rose-400/20' : summary?.warningLevel === 'WARNING' ? 'bg-amber-500/15 text-amber-200 border-amber-400/20' : 'bg-emerald-500/15 text-emerald-200 border-emerald-400/20';

  const submitReason = async () => {
    if (!reasonForm.attendanceId) {
      toast.error('Choose an absent day first');
      return;
    }
    try {
      setSubmitting(true);
      await schoolOpsApi.submitAbsenceReasonV2(reasonForm);
      toast.success('Absence reason submitted');
      setReasonForm((current) => ({ ...current, description: '' }));
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit absence reason');
    } finally {
      setSubmitting(false);
    }
  };

  if (!targetStudentId) {
    return <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-slate-400">Select a student to view attendance.</div>;
  }

  if (loading || !summary) {
    return <div className="p-8 text-slate-300">Loading attendance summary...</div>;
  }

  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.2),_transparent_28%),linear-gradient(145deg,rgba(17,24,39,0.95),rgba(30,41,59,0.85))] p-8 text-white">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-amber-200">
              <CalendarDays size={14} /> My Attendance
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em]">{summary.studentName}</h1>
            <p className="mt-2 text-sm text-slate-300">{summary.className} {summary.sectionName} · {summary.fromDate} to {summary.toDate}</p>
          </div>
          <div className={`rounded-[24px] border px-5 py-4 ${levelTone}`}>
            <div className="text-[11px] font-black uppercase tracking-[0.22em]">{summary.warningLevel}</div>
            <div className="mt-2 text-3xl font-black text-white">{summary.attendancePercentage.toFixed(1)}%</div>
            <div className="mt-1 text-xs">Thresholds: {summary.warningThreshold}% / {summary.criticalThreshold}%</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric title="Present Days" value={summary.presentDays} accent="text-emerald-300" icon={<LineChart size={16} />} />
        <Metric title="Absent Days" value={summary.absentDays} accent="text-rose-300" icon={<AlertTriangle size={16} />} />
        <Metric title="Late Days" value={summary.lateDays} accent="text-amber-300" icon={<Flame size={16} />} />
        <Metric title="Excused Days" value={summary.excusedDays} accent="text-cyan-300" icon={<FileText size={16} />} />
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {PRESETS.map((preset) => (
            <button key={preset} onClick={() => setFilters((current) => ({ ...current, preset }))} className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition ${filters.preset === preset ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200' : 'border-white/10 text-slate-300'}`}>{preset}</button>
          ))}
          {filters.preset === 'CUSTOM' && (
            <div className="ml-auto flex flex-wrap gap-3">
              <input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-2 text-sm text-white outline-none" />
              <input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-2 text-sm text-white outline-none" />
            </div>
          )}
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
          <div>
            <h2 className="text-lg font-black text-white">Monthly Calendar</h2>
            <div className="mt-4 grid grid-cols-7 gap-2">
              {summary.calendar.map((day) => (
                <div key={day.date} className={`rounded-2xl border p-3 text-center ${day.status === 'ABSENT' ? 'border-rose-400/20 bg-rose-500/10' : day.status === 'LATE' ? 'border-amber-400/20 bg-amber-500/10' : day.status === 'PRESENT' ? 'border-emerald-400/20 bg-emerald-500/10' : 'border-white/10 bg-slate-950/30'}`}>
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{new Date(day.date).getDate()}</div>
                  <div className="mt-2 text-[11px] font-bold text-white">{day.status === 'NO_DATA' ? '--' : day.status}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Attendance Heatmap</h2>
            <div className="mt-4 grid grid-cols-6 gap-2">
              {summary.heatmap.map((item) => (
                <div key={item.date} title={`${item.date} · ${item.score}`} className={`h-12 rounded-2xl border ${item.color === 'red' ? 'border-rose-400/20 bg-rose-500/20' : item.color === 'yellow' ? 'border-amber-400/20 bg-amber-500/20' : 'border-emerald-400/20 bg-emerald-500/20'}`} />
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-300">
              <div className="font-bold text-white">Progress bar</div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10"><div className={`${summary.warningLevel === 'CRITICAL' ? 'bg-rose-400' : summary.warningLevel === 'WARNING' ? 'bg-amber-400' : 'bg-emerald-400'} h-full`} style={{ width: `${Math.max(summary.attendancePercentage, 4)}%` }} /></div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500"><span>{summary.attendancePercentage.toFixed(1)}%</span><span>Target {summary.warningThreshold}%+</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-lg font-black text-white">Daily Timeline</h2>
          <div className="mt-4 space-y-3">
            {summary.daily.map((item, index) => (
              <div key={`${item.date}-${item.periodNumber}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-white">{new Date(item.date).toLocaleDateString()}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{item.subjectName || 'General'} {item.periodNumber ? `· Period ${item.periodNumber}` : ''}</div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${item.status === 'ABSENT' ? 'bg-rose-500/15 text-rose-300' : item.status === 'LATE' ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>{item.status}</span>
                </div>
                <div className="mt-2 text-xs text-slate-400">Marked by {item.markedBy || 'School'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-lg font-black text-white">Submit Absence Reason</h2>
          <p className="mt-2 text-sm text-slate-400">If you were absent, send a reason for review.</p>
          <div className="mt-4 space-y-4">
            <select value={reasonForm.attendanceId} onChange={(event) => setReasonForm((current) => ({ ...current, attendanceId: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-white outline-none">
              <option value="">Choose absent record</option>
              {absentRecords.map((record) => <option key={record.attendanceId} value={record.attendanceId}>{record.attendanceDate} {record.periodNumber ? `· Period ${record.periodNumber}` : ''}</option>)}
            </select>
            <select value={reasonForm.category} onChange={(event) => setReasonForm((current) => ({ ...current, category: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-white outline-none">
              <option value="SICK">Sick</option>
              <option value="LEAVE">Leave</option>
              <option value="PERSONAL">Personal</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <textarea value={reasonForm.description} onChange={(event) => setReasonForm((current) => ({ ...current, description: event.target.value }))} placeholder="Add a short explanation" className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" />
            <button onClick={submitReason} disabled={submitting} className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-cyan-400 disabled:opacity-60">{submitting ? 'Submitting...' : 'Submit Reason'}</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ title, value, accent, icon }: { title: string; value: number; accent: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between text-slate-400">
        <div className="text-[11px] font-black uppercase tracking-[0.18em]">{title}</div>
        {icon}
      </div>
      <div className={`mt-3 text-3xl font-black ${accent}`}>{value}</div>
    </div>
  );
}

