import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Eye, Filter, History, Search, Users, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  ApiError,
  schoolOpsApi,
  type AttendanceContextResponse,
  type AttendanceRosterStudent,
  type AttendanceSessionDetailResponse,
  type ClassMonitorResponse,
  type SchoolUser,
  type StudentClassEnrollmentResponse,
} from '../../lib/api';
import { useStore } from '../../store/useStore';

type MonitorStudentOption = {
  studentId: string;
  fullName: string;
  classId: string;
  classLabel: string;
};

export default function TeacherAttendanceManager() {
  const { session } = useStore();
  const [context, setContext] = useState<AttendanceContextResponse | null>(null);
  const [detail, setDetail] = useState<AttendanceSessionDetailResponse | null>(null);
  const [monitoring, setMonitoring] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [locked, setLocked] = useState(false);
  const [studentUsers, setStudentUsers] = useState<SchoolUser[]>([]);
  const [studentEnrollments, setStudentEnrollments] = useState<StudentClassEnrollmentResponse[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [detailSearch, setDetailSearch] = useState('');
  const [filters, setFilters] = useState({
    date: new Date().toISOString().slice(0, 10),
    classId: '',
    subjectId: '',
    periodNumber: '',
    studentId: '',
  });
  const [monitor, setMonitor] = useState<ClassMonitorResponse>({ sessions: [], riskStudents: [] });
  const [editDraft, setEditDraft] = useState<{ student: AttendanceRosterStudent; attendanceStatus: 'PRESENT' | 'ABSENT' | 'LATE' } | null>(null);
  const [editReason, setEditReason] = useState('');

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setMonitoring(true);
        const [attendanceContext, users, enrollments] = await Promise.all([
          schoolOpsApi.getAttendanceContext(),
          session.schoolId ? schoolOpsApi.listUsers(session.schoolId) : Promise.resolve([]),
          session.schoolId ? schoolOpsApi.listStudentEnrollments(session.schoolId) : Promise.resolve([]),
        ]);
        if (ignore) return;
        setContext(attendanceContext);
        setStudentUsers(users);
        setStudentEnrollments(enrollments);
        setLocked(false);
        setFilters((current) => ({
          ...current,
          classId:
            current.classId ||
            attendanceContext.classes.find((item) => item.classTeacher)?.classId ||
            attendanceContext.classes[0]?.classId ||
            '',
        }));
      } catch (error: any) {
        if (error instanceof ApiError && error.status === 403) {
          if (!ignore) {
            setLocked(true);
            setContext(null);
            setDetail(null);
          }
          return;
        }
        if (!ignore) {
          setLocked(false);
          toast.error(error?.message || 'Failed to load attendance monitor');
        }
      } finally {
        if (!ignore) setMonitoring(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [session.schoolId]);

  if (locked) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-8 shadow-2xl animate-in text-white">
        <div className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-300">Attendance Locked</div>
        <h2 className="mt-3 text-3xl font-black">Upgrade required</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          Attendance workflows are not enabled for the current subscription.
        </p>
      </div>
    );
  }

  useEffect(() => {
    if (!context) return;
    let ignore = false;
    const loadMonitor = async () => {
      try {
        setMonitoring(true);
        const response = await schoolOpsApi.getAttendanceClassMonitor({
          date: filters.date,
          classId: filters.classId || undefined,
          subjectId: filters.subjectId || undefined,
          periodNumber: filters.periodNumber ? Number(filters.periodNumber) : undefined,
          studentId: filters.studentId || undefined,
        });
        if (!ignore) setMonitor(response);
      } catch (error: any) {
        if (!ignore) toast.error(error?.message || 'Failed to refresh monitor');
      } finally {
        if (!ignore) setMonitoring(false);
      }
    };
    loadMonitor();
    return () => {
      ignore = true;
    };
  }, [context, filters]);

  const selectedClass = useMemo(() => context?.classes.find((item) => item.classId === filters.classId), [context, filters.classId]);

  const availableSubjects = useMemo(() => {
    const source = selectedClass ? [selectedClass] : context?.classes || [];
    const seen = new Set<string>();
    return source.flatMap((item) => item.subjects)
      .filter((subject) => {
        if (seen.has(subject.subjectId)) return false;
        seen.add(subject.subjectId);
        return true;
      });
  }, [context, selectedClass]);

  const availablePeriods = useMemo(() => {
    const source = selectedClass ? selectedClass.periods : (context?.classes || []).flatMap((item) => item.periods);
    return Array.from(new Set(source)).sort((left, right) => left - right);
  }, [context, selectedClass]);

  const studentOptions = useMemo<MonitorStudentOption[]>(() => {
    const enrollmentByStudentId = new Map(studentEnrollments.map((entry) => [entry.studentUserId, entry.classId]));
    const classLabels = new Map((context?.classes || []).map((item) => [item.classId, `${item.className} ${item.sectionName}`.trim()]));
    const query = studentSearch.trim().toLowerCase();

    return studentUsers
      .filter((user) => user.roleName === 'STUDENT')
      .map((user) => {
        const classId = enrollmentByStudentId.get(user.userId);
        if (!classId) return null;
        return {
          studentId: user.userId,
          fullName: user.fullName,
          classId,
          classLabel: classLabels.get(classId) || 'Class not assigned',
        };
      })
      .filter((item): item is MonitorStudentOption => Boolean(item))
      .filter((item) => !filters.classId || item.classId === filters.classId)
      .filter((item) => !query || item.fullName.toLowerCase().includes(query) || item.classLabel.toLowerCase().includes(query))
      .sort((left, right) => left.fullName.localeCompare(right.fullName));
  }, [context, filters.classId, studentEnrollments, studentSearch, studentUsers]);

  const filteredRoster = useMemo(() => {
    const query = detailSearch.trim().toLowerCase();
    if (!detail) return [];
    if (!query) return detail.roster;
    return detail.roster.filter((student) => {
      const haystack = `${student.fullName} ${student.rollNumber || ''} ${student.attendanceStatus}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [detail, detailSearch]);

  useEffect(() => {
    if (!filters.studentId) return;
    if (studentOptions.some((item) => item.studentId === filters.studentId)) return;
    setFilters((current) => ({ ...current, studentId: '' }));
  }, [filters.studentId, studentOptions]);

  const openSession = async (sessionId: string) => {
    try {
      setLoadingDetail(true);
      setDetailSearch('');
      const response = await schoolOpsApi.getAttendanceSession(sessionId);
      setDetail(response);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to open attendance session');
    } finally {
      setLoadingDetail(false);
    }
  };

  const refreshMonitor = async () => {
    const response = await schoolOpsApi.getAttendanceClassMonitor({
      date: filters.date,
      classId: filters.classId || undefined,
      subjectId: filters.subjectId || undefined,
      periodNumber: filters.periodNumber ? Number(filters.periodNumber) : undefined,
      studentId: filters.studentId || undefined,
    });
    setMonitor(response);
  };

  const openEditModal = (student: AttendanceRosterStudent, attendanceStatus: 'PRESENT' | 'ABSENT' | 'LATE') => {
    if (student.attendanceStatus === attendanceStatus) return;
    setEditDraft({ student, attendanceStatus });
    setEditReason(`Class teacher correction: ${student.attendanceStatus} to ${attendanceStatus}`);
  };

  const closeEditModal = () => {
    if (savingEdit) return;
    setEditDraft(null);
    setEditReason('');
  };

  const submitEdit = async () => {
    if (!detail || !editDraft) return;
    if (!editReason.trim()) {
      toast.error('Please add a reason for this attendance correction');
      return;
    }
    try {
      setSavingEdit(true);
      const response = await schoolOpsApi.editAttendanceRecord(editDraft.student.attendanceId, {
        attendanceStatus: editDraft.attendanceStatus,
        editReason: editReason.trim(),
      });
      setDetail(response);
      await refreshMonitor();
      setEditDraft(null);
      setEditReason('');
      toast.success('Attendance corrected and audit trail saved');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to edit attendance');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.95fr]">
        <section className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(17,24,39,0.95),rgba(30,41,59,0.82))] p-8 text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-1 text-[11px] font-black uppercase tracking-[0.26em] text-fuchsia-200">
              <History size={14} /> Class Teacher Monitor
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em]">Review every subject, every period, and every student who needs help.</h1>
            <p className="mt-3 text-sm text-slate-300">Filter the class timeline, open any roster, and correct attendance with a full audit trail instead of one-off prompts.</p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-3 text-white"><Filter size={18} className="text-cyan-300" /><h2 className="text-lg font-black">Filters</h2></div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <Field label="Date"><input type="date" value={filters.date} onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))} className="w-full bg-transparent text-white outline-none" /></Field>
              <Field label="Class">
                <select
                  value={filters.classId}
                  onChange={(event) => {
                    const nextClassId = event.target.value;
                    setFilters((current) => ({
                      ...current,
                      classId: nextClassId,
                      subjectId: '',
                      periodNumber: '',
                      studentId: '',
                    }));
                    setStudentSearch('');
                  }}
                  className="w-full bg-transparent text-white outline-none"
                >
                  <option value="">All classes</option>
                  {context?.classes.map((item) => <option key={item.classId} value={item.classId}>{item.className} {item.sectionName}</option>)}
                </select>
              </Field>
              <Field label="Subject"><select value={filters.subjectId} onChange={(event) => setFilters((current) => ({ ...current, subjectId: event.target.value }))} className="w-full bg-transparent text-white outline-none"><option value="">All subjects</option>{availableSubjects.map((item) => <option key={item.subjectId} value={item.subjectId}>{item.subjectName}</option>)}</select></Field>
              <Field label="Period"><select value={filters.periodNumber} onChange={(event) => setFilters((current) => ({ ...current, periodNumber: event.target.value }))} className="w-full bg-transparent text-white outline-none"><option value="">All periods</option>{availablePeriods.map((item) => <option key={item} value={item}>Period {item}</option>)}</select></Field>
              <Field label="Student">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-slate-400">
                    <Search size={14} />
                    <input
                      value={studentSearch}
                      onChange={(event) => setStudentSearch(event.target.value)}
                      placeholder="Search student name"
                      className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                    />
                  </div>
                  <select value={filters.studentId} onChange={(event) => setFilters((current) => ({ ...current, studentId: event.target.value }))} className="w-full bg-transparent text-white outline-none">
                    <option value="">All students</option>
                    {studentOptions.map((item) => <option key={item.studentId} value={item.studentId}>{item.fullName} · {item.classLabel}</option>)}
                  </select>
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{studentOptions.length} students in scope</div>
                </div>
              </Field>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Sessions In Scope" value={String(monitor.sessions.length)} tone="cyan" helper={monitoring ? 'Refreshing now' : 'Timeline is up to date'} />
            <MetricCard label="Students At Risk" value={String(monitor.riskStudents.length)} tone="amber" helper="Warning and critical only" />
            <MetricCard label="Class Teacher Classes" value={String((context?.classes || []).filter((item) => item.classTeacher).length)} tone="fuchsia" helper="Your homeroom sections" />
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white">Session Timeline</h2>
                <p className="text-sm text-slate-400">{monitoring ? 'Refreshing...' : `${monitor.sessions.length} sessions found for the current filters.`}</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">
                <CalendarDays size={12} /> {filters.date}
              </div>
            </div>
            <div className="space-y-3">
              {monitor.sessions.map((sessionRow) => {
                const isActive = detail?.session.sessionId === sessionRow.sessionId;
                return (
                  <button
                    key={sessionRow.sessionId}
                    onClick={() => openSession(sessionRow.sessionId)}
                    className={`grid w-full gap-4 rounded-2xl border p-4 text-left transition md:grid-cols-[1fr,auto,auto] md:items-center ${isActive ? 'border-cyan-400/35 bg-cyan-500/10' : 'border-white/10 bg-slate-950/30 hover:border-cyan-400/30'}`}
                  >
                    <div>
                      <div className="text-sm font-bold text-white">{sessionRow.className} {sessionRow.sectionName} · {sessionRow.subjectName}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">Period {sessionRow.periodNumber} · {new Date(sessionRow.attendanceDate).toLocaleDateString()}</div>
                    </div>
                    <div className="text-sm text-slate-300">{sessionRow.presentCount}/{sessionRow.totalStudents} present</div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${sessionRow.sessionStatus === 'SUBMITTED' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>{sessionRow.sessionStatus}</span>
                      <Eye size={16} className="text-cyan-300" />
                    </div>
                  </button>
                );
              })}
              {!monitor.sessions.length && <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500">No attendance sessions matched the selected filters.</div>}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3"><AlertTriangle size={18} className="text-amber-300" /><h2 className="text-xl font-black text-white">Risk Watchlist</h2></div>
            <div className="space-y-3">
              {monitor.riskStudents.slice(0, 8).map((student) => (
                <div key={student.studentUserId} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-white">{student.fullName}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{student.className} {student.sectionName} · Roll {student.rollNumber || '--'}</div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${student.riskLevel === 'CRITICAL' ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300'}`}>{student.riskLevel}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full ${student.attendancePercentage < 65 ? 'bg-rose-400' : 'bg-amber-400'}`} style={{ width: `${Math.max(student.attendancePercentage, 6)}%` }} /></div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400"><span>{student.attendancePercentage.toFixed(1)}% current</span><span>{student.predictedAttendancePercentage.toFixed(1)}% predicted</span></div>
                </div>
              ))}
              {!monitor.riskStudents.length && <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500">No warning or critical students in this scope.</div>}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white">Session Detail</h2>
                <p className="text-sm text-slate-400">Open a session from the timeline to review or correct marks.</p>
              </div>
              {loadingDetail && <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Loading...</div>}
            </div>
            {!detail ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-slate-500">Select a session to inspect its roster and audit history.</div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-300">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-white">{detail.session.className} {detail.session.sectionName} · {detail.session.subjectName}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{detail.session.attendanceDate} · Period {detail.session.periodNumber} · {detail.session.sessionStatus}</div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${detail.editable ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/60 text-slate-200'}`}>{detail.editable ? 'Editable' : 'Locked'}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-300"><Users size={16} className="text-cyan-300" /> {filteredRoster.length} students shown</div>
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-slate-400">
                      <Search size={14} />
                      <input value={detailSearch} onChange={(event) => setDetailSearch(event.target.value)} placeholder="Search roster by name, roll, or status" className="w-64 max-w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {filteredRoster.map((student) => (
                    <div key={student.attendanceId} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/30 p-4 md:grid-cols-[1fr,auto] md:items-center">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 text-sm font-black text-slate-300">
                          {student.profilePhotoUrl ? <img src={student.profilePhotoUrl} alt={student.fullName} className="h-full w-full object-cover" /> : student.fullName.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{student.fullName}</div>
                          <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">Roll {student.rollNumber || '--'} · {student.captureSource}{student.lastModifiedAt ? ` · Edited ${new Date(student.lastModifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusButton active={student.attendanceStatus === 'PRESENT'} tone="present" disabled={!detail.editable || savingEdit} onClick={() => openEditModal(student, 'PRESENT')}>Present</StatusButton>
                        <StatusButton active={student.attendanceStatus === 'ABSENT'} tone="absent" disabled={!detail.editable || savingEdit} onClick={() => openEditModal(student, 'ABSENT')}>Absent</StatusButton>
                        <StatusButton active={student.attendanceStatus === 'LATE'} tone="late" disabled={!detail.editable || savingEdit} onClick={() => openEditModal(student, 'LATE')}>Late</StatusButton>
                      </div>
                    </div>
                  ))}
                  {!filteredRoster.length && <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500">No students match the roster search.</div>}
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Audit Trail</div>
                  <div className="mt-3 space-y-3">
                    {detail.audits.slice(0, 6).map((audit) => (
                      <div key={audit.auditLogId} className="text-sm text-slate-300">
                        <span className="font-bold text-white">{audit.studentName}</span> changed from <span className="text-slate-100">{audit.previousStatus || 'NONE'}</span> to <span className="text-cyan-200">{audit.newStatus}</span> by {audit.changedBy}
                        {audit.editReason ? <div className="mt-1 text-xs text-slate-500">Reason: {audit.editReason}</div> : null}
                      </div>
                    ))}
                    {!detail.audits.length && <div className="text-sm text-slate-500">No edits have been logged for this session.</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {editDraft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94))] p-6 text-white shadow-2xl shadow-slate-950/50">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-amber-200">
              <AlertTriangle size={14} /> Attendance Correction
            </div>
            <h3 className="mt-4 text-2xl font-black tracking-[-0.03em]">Audit this change before it goes live.</h3>
            <p className="mt-2 text-sm text-slate-300">You are changing <span className="font-bold text-white">{editDraft.student.fullName}</span> from <span className="font-bold text-white">{editDraft.student.attendanceStatus}</span> to <span className="font-bold text-cyan-200">{editDraft.attendanceStatus}</span>.</p>
            <label className="mt-5 block rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Correction Reason</div>
              <textarea value={editReason} onChange={(event) => setEditReason(event.target.value)} rows={4} className="mt-3 w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="Example: student joined after assembly and was initially marked absent." />
            </label>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button onClick={closeEditModal} disabled={savingEdit} className="rounded-2xl border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-200 transition hover:border-white/30 disabled:opacity-50">Cancel</button>
              <button onClick={submitEdit} disabled={savingEdit} className="rounded-2xl bg-cyan-500 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-cyan-400 disabled:opacity-60">{savingEdit ? 'Saving...' : 'Save Correction'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-3">{children}</div>
    </label>
  );
}

function MetricCard({ label, value, helper, tone }: { label: string; value: string; helper: string; tone: 'cyan' | 'amber' | 'fuchsia' }) {
  const toneClasses = {
    cyan: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
    amber: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
    fuchsia: 'border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-200',
  }[tone];

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${toneClasses}`}>{label}</div>
      <div className="mt-4 text-3xl font-black text-white">{value}</div>
      <div className="mt-2 text-sm text-slate-400">{helper}</div>
    </div>
  );
}

function StatusButton({ active, tone, disabled, onClick, children }: { active: boolean; tone: 'present' | 'absent' | 'late'; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  const toneClasses = {
    present: active ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' : 'border-white/10 bg-slate-950/30 text-slate-300',
    absent: active ? 'border-rose-400/40 bg-rose-500/15 text-rose-200' : 'border-white/10 bg-slate-950/30 text-slate-300',
    late: active ? 'border-amber-400/40 bg-amber-500/15 text-amber-200' : 'border-white/10 bg-slate-950/30 text-slate-300',
  }[tone];
  const Icon = tone === 'present' ? CheckCircle2 : tone === 'absent' ? XCircle : AlertTriangle;
  return <button disabled={disabled} onClick={onClick} className={`rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${toneClasses} disabled:cursor-not-allowed disabled:opacity-50`}><Icon className="mr-2 inline-block" size={14} />{children}</button>;
}
