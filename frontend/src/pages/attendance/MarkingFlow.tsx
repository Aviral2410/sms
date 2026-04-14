import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Clock3, MapPinned, Mic, Save, ScanFace, Search, Send, Sparkles, UserCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { schoolOpsApi, type AttendanceClassContext, type AttendanceContextResponse, type AttendanceRosterStudent, type AttendanceSessionDetailResponse, type VoiceCommandResponse } from '../../lib/api';

const speechSupport = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;

type LaunchState = {
  classId?: string;
  subjectId?: string;
  period?: number;
};

export default function MarkingFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { classId: urlClassId } = useParams<{ classId: string }>();
  const recognitionRef = useRef<any>(null);
  const launchState = (location.state as LaunchState | null) || null;

  const [context, setContext] = useState<AttendanceContextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [lastVoiceResult, setLastVoiceResult] = useState<VoiceCommandResponse | null>(null);
  const [listening, setListening] = useState(false);
  const [faceHint, setFaceHint] = useState('');
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterFilter, setRosterFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'LATE'>('ALL');
  const [sessionDetail, setSessionDetail] = useState<AttendanceSessionDetailResponse | null>(null);
  const [setup, setSetup] = useState({
    classId: urlClassId || launchState?.classId || '',
    subjectId: launchState?.subjectId || '',
    attendanceDate: new Date().toISOString().slice(0, 10),
    periodNumber: launchState?.period ? String(launchState.period) : '',
  });

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        const attendanceContext = await schoolOpsApi.getAttendanceContext();
        if (ignore) return;
        setContext(attendanceContext);
        const preferredClassId = urlClassId || launchState?.classId || attendanceContext.classes[0]?.classId || '';
        const selectedClass = attendanceContext.classes.find((item) => item.classId === preferredClassId) || attendanceContext.classes[0];
        if (selectedClass) {
          setSetup((current) => ({
            ...current,
            classId: selectedClass.classId,
            subjectId: current.subjectId || launchState?.subjectId || selectedClass.subjects[0]?.subjectId || '',
            periodNumber: current.periodNumber || String(launchState?.period || selectedClass.periods[0] || 1),
          }));
        }
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load attendance setup');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
      recognitionRef.current?.stop?.();
    };
  }, [launchState?.classId, launchState?.period, launchState?.subjectId, urlClassId]);

  const selectedClass = useMemo<AttendanceClassContext | undefined>(() => context?.classes.find((item) => item.classId === setup.classId), [context, setup.classId]);
  const selectedStudents = sessionDetail?.roster || [];
  const editable = sessionDetail?.editable ?? false;

  const attendanceCounts = useMemo(() => {
    return selectedStudents.reduce(
      (counts, student) => {
        if (student.attendanceStatus === 'PRESENT') counts.present += 1;
        else if (student.attendanceStatus === 'ABSENT') counts.absent += 1;
        else if (student.attendanceStatus === 'LATE') counts.late += 1;
        else counts.other += 1;
        return counts;
      },
      { present: 0, absent: 0, late: 0, other: 0 },
    );
  }, [selectedStudents]);

  const filteredStudents = useMemo(() => {
    const query = rosterSearch.trim().toLowerCase();
    return selectedStudents.filter((student) => {
      const matchesFilter = rosterFilter === 'ALL' || student.attendanceStatus === rosterFilter;
      const matchesSearch = !query || `${student.fullName} ${student.rollNumber || ''} ${student.attendanceStatus}`.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [rosterFilter, rosterSearch, selectedStudents]);

  const startSession = async () => {
    if (!setup.classId || !setup.subjectId) {
      toast.error('Choose class, subject, and period first');
      return;
    }
    try {
      setStarting(true);
      const detail = await schoolOpsApi.createAttendanceSession({
        classId: setup.classId,
        subjectId: setup.subjectId,
        attendanceDate: setup.attendanceDate,
        periodNumber: Number(setup.periodNumber),
      });
      setSessionDetail(detail);
      setFaceHint(detail.roster[0]?.studentUserId || '');
      setLastVoiceResult(null);
      setRosterSearch('');
      setRosterFilter('ALL');
      toast.success('Attendance roster is ready');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to open attendance session');
    } finally {
      setStarting(false);
    }
  };

  const updateStudent = async (student: AttendanceRosterStudent, attendanceStatus: string, captureSource = 'MANUAL') => {
    if (!sessionDetail || !editable) return;
    try {
      setSavingId(student.studentUserId);
      const detail = await schoolOpsApi.updateAttendanceStudent(sessionDetail.session.sessionId, student.studentUserId, { attendanceStatus, captureSource, editReason: 'Teacher roster update' });
      setSessionDetail(detail);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update attendance');
    } finally {
      setSavingId(null);
    }
  };

  const markAllPresent = async () => {
    if (!sessionDetail || !editable) return;
    try {
      const detail = await schoolOpsApi.bulkMarkAttendanceSession(sessionDetail.session.sessionId, { attendanceStatus: 'PRESENT', captureSource: 'BULK' });
      setSessionDetail(detail);
      toast.success('All students marked present');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to bulk mark attendance');
    }
  };

  const verifyGps = async () => {
    if (!sessionDetail) return;
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported in this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const response = await schoolOpsApi.verifyAttendanceGps(sessionDetail.session.sessionId, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        });
        toast.success(response.message);
        const refreshed = await schoolOpsApi.getAttendanceSession(sessionDetail.session.sessionId);
        setSessionDetail(refreshed);
      } catch (error: any) {
        toast.error(error?.message || 'Failed to verify location');
      }
    }, () => toast.error('Location permission was denied'));
  };

  const applyVoiceTranscript = async () => {
    if (!sessionDetail || !voiceTranscript.trim() || !editable) return;
    try {
      const result = await schoolOpsApi.applyVoiceAttendance(sessionDetail.session.sessionId, voiceTranscript.trim());
      const refreshed = await schoolOpsApi.getAttendanceSession(sessionDetail.session.sessionId);
      setSessionDetail(refreshed);
      setLastVoiceResult(result);
      toast.success(`Applied ${result.appliedCount} voice commands`);
      if (result.rejectedCount) toast.warning(`${result.rejectedCount} commands need manual review`);
      setVoiceTranscript('');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to apply voice commands');
    }
  };

  const toggleListening = () => {
    if (!speechSupport) {
      toast.error('Speech recognition is not available in this browser');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop?.();
      return;
    }
    const recognition = new speechSupport();
    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      toast.error('Voice capture stopped unexpectedly');
    };
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((item: any) => item[0]?.transcript || '').join(' ');
      setVoiceTranscript(transcript.trim());
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const runFaceAssist = async () => {
    if (!sessionDetail || !faceHint || !editable) return;
    try {
      const result = await schoolOpsApi.scanAttendanceFace(sessionDetail.session.sessionId, { hintedStudentId: faceHint, captureReference: `manual:${Date.now()}` });
      const refreshed = await schoolOpsApi.getAttendanceSession(sessionDetail.session.sessionId);
      setSessionDetail(refreshed);
      toast.success(result.message);
    } catch (error: any) {
      toast.error(error?.message || 'Face assist failed');
    }
  };

  const submitSession = async () => {
    if (!sessionDetail || !editable) return;
    try {
      setSubmitting(true);
      const detail = await schoolOpsApi.submitAttendanceSession(sessionDetail.session.sessionId, { submitNote: 'Submitted from teacher roster' });
      setSessionDetail(detail);
      toast.success('Attendance submitted successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-300">Loading attendance setup...</div>;

  return (
    <div className="space-y-8 pb-12">
      {!sessionDetail ? (
        <section className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-[linear-gradient(140deg,rgba(15,23,42,0.95),rgba(17,24,39,0.85))] p-8 text-white">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-[11px] font-black uppercase tracking-[0.26em] text-cyan-200">Period-wise Attendance</div>
            <h1 className="text-4xl font-black tracking-[-0.04em]">Launch a roster built for speed.</h1>
            <p className="mt-3 text-sm text-slate-300">Select date, class, subject, and period first. The attendance page opens with voice support, bulk present, GPS verification, and later editing built in.</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Field label="Date"><input type="date" value={setup.attendanceDate} onChange={(event) => setSetup((current) => ({ ...current, attendanceDate: event.target.value }))} className="w-full bg-transparent text-white outline-none" /></Field>
            <Field label="Class"><select value={setup.classId} onChange={(event) => {
              const nextClass = context?.classes.find((item) => item.classId === event.target.value);
              setSetup((current) => ({ ...current, classId: event.target.value, subjectId: nextClass?.subjects[0]?.subjectId || '', periodNumber: String(nextClass?.periods[0] || 1) }));
            }} className="w-full bg-transparent text-white outline-none"><option value="">Select class</option>{context?.classes.map((item) => <option key={item.classId} value={item.classId}>{item.className} {item.sectionName}</option>)}</select></Field>
            <Field label="Subject"><select value={setup.subjectId} onChange={(event) => setSetup((current) => ({ ...current, subjectId: event.target.value }))} className="w-full bg-transparent text-white outline-none"><option value="">Select subject</option>{selectedClass?.subjects.map((item) => <option key={item.subjectId} value={item.subjectId}>{item.subjectName}</option>)}</select></Field>
            <Field label="Period"><select value={setup.periodNumber} onChange={(event) => setSetup((current) => ({ ...current, periodNumber: event.target.value }))} className="w-full bg-transparent text-white outline-none">{(selectedClass?.periods || [1, 2, 3, 4, 5, 6, 7, 8]).map((item) => <option key={item} value={item}>Period {item}</option>)}</select></Field>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <QuickLaunchChip label="Voice" value={context?.policy.voiceEnabled ? 'Enabled' : 'Disabled'} tone="cyan" />
            <QuickLaunchChip label="GPS" value={context?.policy.gpsEnabled ? context.policy.gpsMode || 'Enabled' : 'Disabled'} tone="emerald" />
            <QuickLaunchChip label="Face Assist" value={context?.policy.faceEnabled ? 'Enabled' : 'Disabled'} tone="fuchsia" />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={startSession} disabled={starting} className="rounded-2xl bg-cyan-500 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-cyan-400 disabled:opacity-60">{starting ? 'Opening...' : 'Start Attendance'}</button>
            <button onClick={() => navigate('/attendance')} className="rounded-2xl border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-200 transition hover:border-white/30">Back</button>
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">{sessionDetail.session.attendanceDate} · Period {sessionDetail.session.periodNumber}</div>
                <h1 className="mt-2 text-3xl font-black text-white">{sessionDetail.session.className} {sessionDetail.session.sectionName} · {sessionDetail.session.subjectName}</h1>
                <p className="mt-2 text-sm text-slate-400">{sessionDetail.session.totalStudents} students · Session {sessionDetail.session.sessionStatus} · GPS {sessionDetail.session.gpsVerificationStatus || 'PENDING'}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={toggleListening} className={`rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-[0.18em] ${listening ? 'border-rose-400/30 bg-rose-500/10 text-rose-200' : 'border-white/10 bg-slate-950/30 text-slate-100'}`}><Mic className="mr-2 inline-block" size={14} />{listening ? 'Stop Voice' : 'Voice Input'}</button>
                <button onClick={markAllPresent} disabled={!editable} className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-emerald-200 disabled:opacity-50"><CheckCircle2 className="mr-2 inline-block" size={14} />Mark All Present</button>
                <button onClick={verifyGps} className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-200"><MapPinned className="mr-2 inline-block" size={14} />Verify GPS</button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SessionStat label="Present" value={String(attendanceCounts.present)} tone="emerald" />
              <SessionStat label="Absent" value={String(attendanceCounts.absent)} tone="rose" />
              <SessionStat label="Late" value={String(attendanceCounts.late)} tone="amber" />
              <SessionStat label="Visible" value={String(filteredStudents.length)} tone="cyan" />
            </div>

            <div className="mt-5 grid gap-3 xl:grid-cols-[1.3fr,1fr,auto]">
              <div className="space-y-3">
                <textarea value={voiceTranscript} onChange={(event) => setVoiceTranscript(event.target.value)} placeholder="Roll 21 absent, roll 15 present, roll 12 late" className="min-h-[92px] rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" />
                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500"><Sparkles size={14} className="text-cyan-300" /> Voice examples</div>
                  <div className="mt-2">Say phrases like <span className="font-bold text-slate-200">roll 5 absent</span>, <span className="font-bold text-slate-200">roll 12 late</span>, or <span className="font-bold text-slate-200">roll 7 present</span>.</div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Face Assist</div>
                <select value={faceHint} onChange={(event) => setFaceHint(event.target.value)} className="mt-2 w-full bg-transparent text-sm text-white outline-none">
                  {selectedStudents.map((student) => <option key={student.studentUserId} value={student.studentUserId}>{student.rollNumber || '--'} · {student.fullName}</option>)}
                </select>
                <div className="mt-3 text-xs text-slate-400">Use this as a guided recognition hint when a student is difficult to identify quickly.</div>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={applyVoiceTranscript} disabled={!voiceTranscript.trim() || !editable} className="rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-900 transition hover:bg-slate-100 disabled:opacity-50">Apply Voice</button>
                <button onClick={runFaceAssist} disabled={!editable || !faceHint} className="rounded-2xl border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-100 transition hover:border-fuchsia-400/30 disabled:opacity-50"><ScanFace className="mr-2 inline-block" size={14} />Face Assist</button>
              </div>
            </div>

            {lastVoiceResult ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Latest Voice Parse</div>
                    <div className="mt-1 text-sm text-slate-300">{lastVoiceResult.appliedCount} applied · {lastVoiceResult.rejectedCount} needs review</div>
                  </div>
                  <div className="text-xs text-slate-500">{lastVoiceResult.transcript}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {lastVoiceResult.commands.map((command, index) => (
                    <span key={`${command.rollNumber || command.studentName || 'unknown'}-${index}`} className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${command.applied ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border-amber-400/20 bg-amber-500/10 text-amber-200'}`}>
                      {command.rollNumber ? `Roll ${command.rollNumber}` : command.studentName || 'Unknown'} · {command.attendanceStatus}{command.reason ? ` · ${command.reason}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Roster</h2>
                <p className="text-sm text-slate-400">Search quickly, filter by status, and update students one row at a time.</p>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-slate-400">
                  <Search size={14} />
                  <input value={rosterSearch} onChange={(event) => setRosterSearch(event.target.value)} placeholder="Search by name or roll" className="w-full min-w-[220px] bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['ALL', 'PRESENT', 'ABSENT', 'LATE'] as const).map((filter) => (
                    <button key={filter} onClick={() => setRosterFilter(filter)} className={`rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition ${rosterFilter === filter ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200' : 'border-white/10 bg-slate-950/30 text-slate-300'}`}>{filter === 'ALL' ? 'Show All' : filter}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 hidden grid-cols-[90px,1fr,auto] gap-4 border-b border-white/10 px-2 pb-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 md:grid">
              <div>Roll</div><div>Student</div><div>Status</div>
            </div>
            <div className="divide-y divide-white/5">
              {filteredStudents.map((student) => (
                <div key={student.studentUserId} className="grid gap-4 py-4 md:grid-cols-[90px,1fr,auto] md:items-center">
                  <div className="text-sm font-bold text-cyan-200">Roll {student.rollNumber || '--'}</div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 text-slate-400">
                      {student.profilePhotoUrl ? <img src={student.profilePhotoUrl} alt={student.fullName} className="h-full w-full object-cover" /> : <UserCircle2 size={20} />}
                    </div>
                    <div>
                      <div className="font-bold text-white">{student.fullName}</div>
                      <div className="mt-1 text-xs text-slate-500">{student.captureSource}{student.absenceReasonCategory ? ` · ${student.absenceReasonCategory}` : ''}{savingId === student.studentUserId ? ' · Saving...' : ''}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusButton active={student.attendanceStatus === 'PRESENT'} tone="present" disabled={savingId === student.studentUserId || !editable} onClick={() => updateStudent(student, 'PRESENT')}>Present</StatusButton>
                    <StatusButton active={student.attendanceStatus === 'ABSENT'} tone="absent" disabled={savingId === student.studentUserId || !editable} onClick={() => updateStudent(student, 'ABSENT')}>Absent</StatusButton>
                    <StatusButton active={student.attendanceStatus === 'LATE'} tone="late" disabled={savingId === student.studentUserId || !editable} onClick={() => updateStudent(student, 'LATE')}>Late</StatusButton>
                  </div>
                </div>
              ))}
              {!filteredStudents.length && <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500">No students match the current roster filter.</div>}
            </div>
          </div>

          <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-slate-950/85 px-6 py-4 backdrop-blur-xl">
            <div className="space-y-1 text-sm text-slate-300">
              <div>Changes are applied immediately, and final submit triggers alerts, analytics, and realtime refresh.</div>
              {!editable ? <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">This session is currently locked for teacher edits.</div> : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${sessionDetail.session.sessionStatus === 'SUBMITTED' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>{sessionDetail.session.sessionStatus}</span>
              <button onClick={() => toast.success('Roster changes are already saved as draft')} className="rounded-2xl border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-100 transition hover:border-white/30"><Save className="mr-2 inline-block" size={14} />Save Draft</button>
              <button onClick={submitSession} disabled={submitting || !editable} className="rounded-2xl bg-emerald-500 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-emerald-400 disabled:opacity-60"><Send className="mr-2 inline-block" size={14} />{submitting ? 'Submitting...' : 'Submit Attendance'}</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-3">{children}</div>
    </label>
  );
}

function QuickLaunchChip({ label, value, tone }: { label: string; value: string; tone: 'cyan' | 'emerald' | 'fuchsia' }) {
  const toneClasses = {
    cyan: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
    emerald: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    fuchsia: 'border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-200',
  }[tone];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
      <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${toneClasses}`}>{label}</div>
      <div className="mt-3 text-lg font-black text-white">{value}</div>
    </div>
  );
}

function SessionStat({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'rose' | 'amber' | 'cyan' }) {
  const toneClasses = {
    emerald: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    rose: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
    amber: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
    cyan: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
  }[tone];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
      <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${toneClasses}`}>{label}</div>
      <div className="mt-3 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

function StatusButton({ active, tone, disabled, onClick, children }: { active: boolean; tone: 'present' | 'absent' | 'late'; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  const toneClasses = {
    present: active ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' : 'border-white/10 bg-slate-950/30 text-slate-300',
    absent: active ? 'border-rose-400/40 bg-rose-500/15 text-rose-200' : 'border-white/10 bg-slate-950/30 text-slate-300',
    late: active ? 'border-amber-400/40 bg-amber-500/15 text-amber-200' : 'border-white/10 bg-slate-950/30 text-slate-300',
  }[tone];
  const Icon = tone === 'present' ? CheckCircle2 : tone === 'absent' ? XCircle : Clock3;
  return (
    <button disabled={disabled} onClick={onClick} className={`rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${toneClasses} disabled:opacity-50`}>
      <Icon className="mr-2 inline-block" size={14} />{children}
    </button>
  );
}
