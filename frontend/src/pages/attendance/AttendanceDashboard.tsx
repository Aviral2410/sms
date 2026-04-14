import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BellRing,
  CalendarDays,
  Clock3,
  Download,
  MapPin,
  Mic,
  ShieldCheck,
  Sparkles,
  Users,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ApiError,
  schoolOpsApi,
  type AttendanceClassContext,
  type AttendanceContextResponse,
  type AttendanceOverviewResponse,
  type AttendancePolicyResponse,
  type AttendanceRiskStudentRow,
  type AttendanceSessionSummary,
  type ClassMonitorResponse,
} from '../../lib/api';
import { useStore } from '../../store/useStore';
import './AttendanceDashboard.css';

const ADMIN_ROLES = new Set(['SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER']);

export default function AttendanceDashboard() {
  const { session } = useStore();
  const navigate = useNavigate();
  const isStudent = session.role === 'STUDENT';
  const isAdmin = ADMIN_ROLES.has(session.role || '');

  const [context, setContext] = useState<AttendanceContextResponse | null>(null);
  const [overview, setOverview] = useState<AttendanceOverviewResponse | null>(null);
  const [monitor, setMonitor] = useState<ClassMonitorResponse | null>(null);
  const [policyDraft, setPolicyDraft] = useState<Partial<AttendancePolicyResponse>>({});
  const [loading, setLoading] = useState(true);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (isStudent) return;
    let ignore = false;

    const load = async () => {
      try {
        setLoading(true);
        const attendanceContext = await schoolOpsApi.getAttendanceContext();
        if (ignore) return;
        setContext(attendanceContext);
        setPolicyDraft(attendanceContext.policy);
        setLocked(false);

        if (isAdmin) {
          const adminOverview = await schoolOpsApi.getAttendanceOverview();
          if (!ignore) setOverview(adminOverview);
        } else {
          const teacherMonitor = await schoolOpsApi.getAttendanceClassMonitor({
            date: new Date().toISOString().slice(0, 10),
          });
          if (!ignore) setMonitor(teacherMonitor);
        }
      } catch (error: any) {
        if (error instanceof ApiError && error.status === 403) {
          if (!ignore) {
            setLocked(true);
            setContext(null);
            setOverview(null);
            setMonitor(null);
          }
          return;
        }
        if (!ignore) {
          setLocked(false);
          toast.error(error?.message || 'Failed to load attendance dashboard');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [isAdmin, isStudent]);

  if (!isStudent && locked) {
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

  const priorityClasses = useMemo<AttendanceClassContext[]>(() => {
    return (context?.classes || [])
      .slice()
      .sort((a, b) => Number(b.classTeacher) - Number(a.classTeacher) || a.className.localeCompare(b.className));
  }, [context]);

  const recentSessions = useMemo<AttendanceSessionSummary[]>(() => {
    return (context?.recentSessions || []).slice(0, 6);
  }, [context]);

  const riskStudents = useMemo<AttendanceRiskStudentRow[]>(() => {
    const source = isAdmin ? overview?.riskStudents || [] : monitor?.riskStudents || [];
    return source
      .slice()
      .sort(
        (a, b) =>
          riskWeight(b.riskLevel) - riskWeight(a.riskLevel) ||
          Number(Boolean(b.alertActive)) - Number(Boolean(a.alertActive)) ||
          a.attendancePercentage - b.attendancePercentage,
      );
  }, [isAdmin, monitor, overview]);

  const actionableClasses = useMemo(() => priorityClasses.slice(0, 6), [priorityClasses]);
  const featuredRisk = riskStudents[0] || null;
  const totalSessions = isAdmin ? overview?.totalSessions || 0 : monitor?.sessions.length || 0;
  const submittedSessions = isAdmin
    ? overview?.submittedSessions || 0
    : (monitor?.sessions || []).filter((item) => isSubmittedStatus(item.sessionStatus)).length;
  const draftSessions = isAdmin ? overview?.draftSessions || 0 : Math.max(totalSessions - submittedSessions, 0);
  const coverageRate = useMemo(() => {
    if (isAdmin) return overview?.schoolAttendancePercentage || 0;
    const sessions = monitor?.sessions || [];
    const totalStudents = sessions.reduce((sum, item) => sum + item.totalStudents, 0);
    const presentStudents = sessions.reduce((sum, item) => sum + item.presentCount + item.lateCount, 0);
    return totalStudents ? (presentStudents / totalStudents) * 100 : 0;
  }, [isAdmin, monitor?.sessions, overview?.schoolAttendancePercentage]);
  const criticalCount = riskStudents.filter((item) => item.riskLevel === 'CRITICAL').length;
  const teacherSections = priorityClasses.filter((item) => item.classTeacher).length;
  const firstLaunchClass = actionableClasses[0] || null;

  const heroStats = [
    {
      label: 'Live Coverage',
      value: `${coverageRate.toFixed(1)}%`,
      hint: isAdmin ? 'school-wide' : 'active monitor',
      tone: 'emerald' as const,
      icon: <Activity size={16} />,
    },
    {
      label: 'Sessions',
      value: String(totalSessions),
      hint: submittedSessions ? `${submittedSessions} submitted` : 'no submissions yet',
      tone: 'cyan' as const,
      icon: <CalendarDays size={16} />,
    },
    {
      label: 'Risk Queue',
      value: String(riskStudents.length),
      hint: criticalCount ? `${criticalCount} critical` : 'stable today',
      tone: 'amber' as const,
      icon: <AlertTriangle size={16} />,
    },
    {
      label: isAdmin ? 'Draft Flow' : 'Class Teacher',
      value: isAdmin ? String(draftSessions) : String(teacherSections),
      hint: isAdmin ? 'needs closure' : 'homeroom sections',
      tone: 'slate' as const,
      icon: <Users size={16} />,
    },
  ];

  const automationSignals = [
    {
      label: 'Voice Assist',
      active: Boolean(context?.policy.voiceEnabled),
      icon: <Mic size={14} />,
    },
    {
      label: 'GPS Guard',
      active: Boolean(context?.policy.gpsEnabled),
      icon: <MapPin size={14} />,
    },
    {
      label: 'AI Prediction',
      active: Boolean(context?.policy.aiPredictionEnabled),
      icon: <Sparkles size={14} />,
    },
    {
      label: 'Reminders',
      active: Boolean(context?.policy.reminderEnabled),
      icon: <BellRing size={14} />,
    },
  ];

  const downloadExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      const blob = await schoolOpsApi.exportAttendanceV2({ format });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-export.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to export attendance');
    }
  };

  const savePolicy = async () => {
    try {
      setSavingPolicy(true);
      const next = await schoolOpsApi.updateAttendancePolicy(policyDraft);
      setPolicyDraft(next);
      setContext((current) => (current ? { ...current, policy: next } : current));
      setOverview((current) => (current ? { ...current, policy: next } : current));
      toast.success('Attendance policy updated');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save attendance policy');
    } finally {
      setSavingPolicy(false);
    }
  };

  const openPrimaryMarking = () => {
    if (!firstLaunchClass) return;
    const subject = firstLaunchClass.subjects[0];
    navigate(`/attendance/${firstLaunchClass.classId}/mark`, {
      state: {
        classId: firstLaunchClass.classId,
        subjectId: subject?.subjectId,
        period: firstLaunchClass.periods[0] || 1,
      },
    });
  };

  if (isStudent) {
    return <Navigate to="/attendance/student" replace />;
  }

  if (loading) {
    return (
      <div className="attendance-loading-state">
        <div className="attendance-loading-orb" />
        <div>Loading attendance workspace...</div>
      </div>
    );
  }

  return (
    <div className="attendance-dashboard-shell">
      <div className="attendance-dashboard">
        <section className="attendance-hero-panel">
          <div className="attendance-hero-copy">
            <div className="attendance-kicker">
              <Sparkles size={14} />
              Attendance Command Center
            </div>
            <h1>Fast marking, cleaner risk visibility, and a workspace that feels operational.</h1>
            <p>
              Launch period rosters, watch intervention signals build in real time, and keep policy,
              compliance, and exports in one modern attendance surface.
            </p>
            <div className="attendance-hero-actions">
              <button
                type="button"
                className="attendance-primary-button"
                onClick={openPrimaryMarking}
                disabled={!firstLaunchClass}
              >
                <CalendarDays size={17} />
                {firstLaunchClass ? `Mark ${firstLaunchClass.className} ${firstLaunchClass.sectionName}` : 'No Class Ready'}
              </button>
              <button type="button" className="attendance-secondary-button" onClick={() => navigate('/attendance/teacher')}>
                <ShieldCheck size={17} />
                Open Monitor
              </button>
            </div>
          </div>

          <div className="attendance-hero-metrics">
            {heroStats.map((item) => (
              <MetricTile
                key={item.label}
                label={item.label}
                value={item.value}
                hint={item.hint}
                tone={item.tone}
                icon={item.icon}
              />
            ))}
          </div>

          <div className="attendance-signal-strip">
            {automationSignals.map((item) => (
              <div key={item.label} className={`attendance-signal-chip${item.active ? ' is-active' : ''}`}>
                {item.icon}
                <span>{item.label}</span>
                <strong>{item.active ? 'Ready' : 'Off'}</strong>
              </div>
            ))}
          </div>
        </section>

        <aside className="attendance-left-rail">
          <div className="attendance-panel">
            <div className="attendance-panel-head">
              <div>
                <span className="attendance-panel-label">Launch Deck</span>
                <h2>Quick Actions</h2>
              </div>
              <Link to="/attendance/teacher" className="attendance-inline-link">
                Full Monitor
              </Link>
            </div>

            <div className="attendance-quick-grid">
              {actionableClasses.map((cls) => {
                const subject = cls.subjects[0];
                return (
                  <button
                    key={cls.classId}
                    type="button"
                    className="attendance-quick-card"
                    onClick={() =>
                      navigate(`/attendance/${cls.classId}/mark`, {
                        state: {
                          classId: cls.classId,
                          subjectId: subject?.subjectId,
                          period: cls.periods[0] || 1,
                        },
                      })
                    }
                  >
                    <div className="attendance-quick-head">
                      <div className="attendance-quick-icon">
                        <CalendarDays size={18} />
                      </div>
                      <span className={`attendance-mini-badge${cls.classTeacher ? ' is-highlight' : ''}`}>
                        {cls.classTeacher ? 'Class Teacher' : 'Assigned'}
                      </span>
                    </div>
                    <strong>
                      {cls.className} {cls.sectionName}
                    </strong>
                    <p>{subject ? `${subject.subjectName} • Period ${cls.periods[0] || 1}` : 'Choose subject and period'}</p>
                    <div className="attendance-quick-meta">
                      <span>{cls.subjects.length} subjects</span>
                      <span>{cls.periods.length} periods</span>
                    </div>
                  </button>
                );
              })}
              {!actionableClasses.length && <EmptyState message="No classes are assigned to attendance launch yet." compact />}
            </div>
          </div>

          <div className="attendance-panel">
            <div className="attendance-panel-head">
              <div>
                <span className="attendance-panel-label">Capture Stack</span>
                <h2>Policy Snapshot</h2>
              </div>
            </div>

            <div className="attendance-snapshot-grid">
              <SnapshotItem label="Warning" value={`${policyDraft.warningThreshold ?? context?.policy.warningThreshold ?? 75}%`} />
              <SnapshotItem label="Critical" value={`${policyDraft.criticalThreshold ?? context?.policy.criticalThreshold ?? 65}%`} />
              <SnapshotItem label="Auto Absent" value={context?.policy.autoAbsentEnabled ? `${context.policy.autoAbsentMinutes}m` : 'Off'} />
              <SnapshotItem label="Channels" value={context?.policy.enabledChannels?.length ? context.policy.enabledChannels.join(', ') : 'None'} />
            </div>

            <div className="attendance-note-card">
              <Wand2 size={18} />
              <div>
                <strong>{isAdmin ? 'Admin view' : 'Teacher view'}</strong>
                <p>
                  {isAdmin
                    ? 'Tune thresholds and exports here, then move to the monitor when a class needs intervention.'
                    : 'Use this dashboard to choose your next class fast, then jump into monitor when a session needs correction.'}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main className="attendance-main-column">
          <div className="attendance-panel">
            <div className="attendance-panel-head">
              <div>
                <span className="attendance-panel-label">Flow Activity</span>
                <h2>Recent Sessions</h2>
              </div>
              <div className="attendance-panel-meta">
                {recentSessions.length ? `${recentSessions.length} recent sessions` : 'Waiting for the first session'}
              </div>
            </div>

            <div className="attendance-session-grid">
              {recentSessions.map((sessionRow) => (
                <div key={sessionRow.sessionId} className="attendance-session-card">
                  <div className="attendance-session-topline">
                    <span className="attendance-mini-badge">{sessionRow.sessionStatus}</span>
                    <span className="attendance-session-date">{formatSessionDate(sessionRow.attendanceDate)}</span>
                  </div>
                  <strong>
                    {sessionRow.className || 'Class'} {sessionRow.sectionName || ''}
                  </strong>
                  <p>
                    {sessionRow.subjectName || 'Subject pending'} • Period {sessionRow.periodNumber}
                  </p>
                  <div className="attendance-session-stats">
                    <span>{sessionRow.presentCount}/{sessionRow.totalStudents} present</span>
                    <span>{sessionRow.absentCount} absent</span>
                    <span>{sessionRow.lateCount} late</span>
                  </div>
                </div>
              ))}
              {!recentSessions.length && <EmptyState message="No attendance sessions have been opened yet." />}
            </div>
          </div>

          {isAdmin && overview ? (
            <div className="attendance-panel">
              <div className="attendance-panel-head">
                <div>
                  <span className="attendance-panel-label">School Analytics</span>
                  <h2>Attendance Trend</h2>
                </div>
                <div className="attendance-legend">
                  <span><i className="is-present" /> Present</span>
                  <span><i className="is-absent" /> Absent</span>
                </div>
              </div>

              <div className="attendance-chart-panel">
                {overview.trend.slice(-14).map((point) => {
                  const total = Math.max(point.total, 1);
                  const presentHeight = Math.max(10, (point.present / total) * 100);
                  const absentHeight = Math.max(8, (point.absent / total) * 100);
                  return (
                    <div key={point.date} className="attendance-chart-column">
                      <div className="attendance-chart-bars">
                        <div className="attendance-chart-bar is-present" style={{ height: `${presentHeight}%` }} />
                        <div className="attendance-chart-bar is-absent" style={{ height: `${absentHeight}%` }} />
                      </div>
                      <span>{new Date(point.date).getDate()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="attendance-panel attendance-pulse-banner">
              <div className="attendance-panel-head">
                <div>
                  <span className="attendance-panel-label">Teacher Pulse</span>
                  <h2>What Needs Attention Now</h2>
                </div>
              </div>
              <div className="attendance-pulse-grid">
                <PulseCard label="Assigned Sections" value={String(priorityClasses.length)} hint="launch-ready classes" />
                <PulseCard label="Submitted Today" value={String(submittedSessions)} hint="sessions already closed" />
                <PulseCard label="Draft Queue" value={String(draftSessions)} hint="sessions still open" />
              </div>
            </div>
          )}

          {isAdmin && overview && (
            <div className="attendance-panel">
              <div className="attendance-panel-head">
                <div>
                  <span className="attendance-panel-label">Performance Map</span>
                  <h2>By Class</h2>
                </div>
              </div>

              <div className="attendance-class-list">
                {overview.byClass.slice(0, 8).map((row) => (
                  <div key={row.classId} className="attendance-class-row">
                    <div className="attendance-class-copy">
                      <strong>
                        {row.className} {row.sectionName}
                      </strong>
                      <span>
                        {row.presentCount} present • {row.absentCount} absent • {row.lateCount} late
                      </span>
                    </div>
                    <div className="attendance-class-progress">
                      <div className="attendance-class-progress-track">
                        <div
                          className={`attendance-class-progress-fill${resolveClassTone(
                            row.attendancePercentage,
                            context?.policy.warningThreshold,
                            context?.policy.criticalThreshold,
                          )}`}
                          style={{ width: `${Math.max(8, row.attendancePercentage)}%` }}
                        />
                      </div>
                      <strong>{row.attendancePercentage.toFixed(1)}%</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <aside className="attendance-right-rail">
          <div className="attendance-panel">
            <div className="attendance-panel-head">
              <div>
                <span className="attendance-panel-label">Intervention Radar</span>
                <h2>Low Attendance</h2>
              </div>
              <div className="attendance-panel-meta">{riskStudents.length} students flagged</div>
            </div>

            {featuredRisk && (
              <div className="attendance-featured-risk">
                <div className="attendance-featured-risk-head">
                  <span className={`attendance-mini-badge${featuredRisk.riskLevel === 'CRITICAL' ? ' is-danger' : ' is-warning'}`}>
                    {featuredRisk.riskLevel}
                  </span>
                  <span>{featuredRisk.alertActive ? 'Alert active' : 'Watchlist'}</span>
                </div>
                <strong>{featuredRisk.fullName}</strong>
                <p>
                  {featuredRisk.className} {featuredRisk.sectionName} • Roll {featuredRisk.rollNumber || '--'}
                </p>
                <div className="attendance-featured-risk-meter">
                  <div className="attendance-featured-risk-track">
                    <div style={{ width: `${Math.max(8, featuredRisk.attendancePercentage)}%` }} />
                  </div>
                  <div className="attendance-featured-risk-values">
                    <span>{featuredRisk.attendancePercentage.toFixed(1)}% current</span>
                    <span>{featuredRisk.predictedAttendancePercentage.toFixed(1)}% projected</span>
                  </div>
                </div>
              </div>
            )}

            <div className="attendance-risk-list">
              {riskStudents.slice(0, 5).map((row) => (
                <div key={row.studentUserId} className="attendance-risk-row">
                  <div>
                    <strong>{row.fullName}</strong>
                    <span>
                      {row.className} {row.sectionName} • {row.absentCount} absent • {row.lateCount} late
                    </span>
                  </div>
                  <div className="attendance-risk-meta">
                    <b>{row.attendancePercentage.toFixed(1)}%</b>
                    <span>{row.riskLevel}</span>
                  </div>
                </div>
              ))}
              {!riskStudents.length && <EmptyState message="No warning or critical students at the moment." compact />}
            </div>
          </div>

          {isAdmin ? (
            <div className="attendance-panel">
              <div className="attendance-panel-head">
                <div>
                  <span className="attendance-panel-label">Control Room</span>
                  <h2>Policy & Export</h2>
                </div>
              </div>

              <div className="attendance-policy-grid">
                <PolicyField
                  label="Warning Threshold"
                  value={String(policyDraft.warningThreshold ?? context?.policy.warningThreshold ?? 75)}
                  onChange={(value) => setPolicyDraft((current) => ({ ...current, warningThreshold: Number(value) }))}
                />
                <PolicyField
                  label="Critical Threshold"
                  value={String(policyDraft.criticalThreshold ?? context?.policy.criticalThreshold ?? 65)}
                  onChange={(value) => setPolicyDraft((current) => ({ ...current, criticalThreshold: Number(value) }))}
                />
              </div>

              <div className="attendance-toggle-grid">
                <ToggleCard
                  label="Voice Enabled"
                  active={Boolean(policyDraft.voiceEnabled ?? context?.policy.voiceEnabled)}
                  icon={<Mic size={16} />}
                  onClick={() => setPolicyDraft((current) => ({ ...current, voiceEnabled: !(current.voiceEnabled ?? context?.policy.voiceEnabled) }))}
                />
                <ToggleCard
                  label="Reminders"
                  active={Boolean(policyDraft.reminderEnabled ?? context?.policy.reminderEnabled)}
                  icon={<BellRing size={16} />}
                  onClick={() => setPolicyDraft((current) => ({ ...current, reminderEnabled: !(current.reminderEnabled ?? context?.policy.reminderEnabled) }))}
                />
              </div>

              <div className="attendance-export-row">
                <button type="button" className="attendance-primary-button" onClick={savePolicy} disabled={savingPolicy}>
                  <ShieldCheck size={16} />
                  {savingPolicy ? 'Saving...' : 'Save Policy'}
                </button>
                <button type="button" className="attendance-icon-button" onClick={() => downloadExport('csv')} aria-label="Export CSV">
                  <Download size={16} />
                  CSV
                </button>
                <button type="button" className="attendance-icon-button" onClick={() => downloadExport('xlsx')} aria-label="Export XLSX">
                  <Download size={16} />
                  XLSX
                </button>
                <button type="button" className="attendance-icon-button" onClick={() => downloadExport('pdf')} aria-label="Export PDF">
                  <Download size={16} />
                  PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="attendance-panel">
              <div className="attendance-panel-head">
                <div>
                  <span className="attendance-panel-label">Correction Flow</span>
                  <h2>Teacher Pulse</h2>
                </div>
              </div>

              <div className="attendance-teacher-stack">
                <TeacherPulseRow label="Class Teacher Sections" value={String(teacherSections)} icon={<Users size={15} />} />
                <TeacherPulseRow label="Review Queue" value={String(totalSessions)} icon={<Clock3 size={15} />} />
                <TeacherPulseRow label="Coverage" value={`${coverageRate.toFixed(1)}%`} icon={<BarChart3 size={15} />} />
              </div>

              <button type="button" className="attendance-recommendation-card" onClick={() => navigate('/attendance/teacher')}>
                <div>
                  <span>Recommended next step</span>
                  <strong>Open monitor and correct any draft or exception session.</strong>
                </div>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  tone: 'emerald' | 'cyan' | 'amber' | 'slate';
  icon: React.ReactNode;
}) {
  return (
    <div className={`attendance-metric-tile is-${tone}`}>
      <div className="attendance-metric-top">
        <span>{label}</span>
        {icon}
      </div>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}

function SnapshotItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="attendance-snapshot-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PolicyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="attendance-policy-field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ToggleCard({
  label,
  active,
  icon,
  onClick,
}: {
  label: string;
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={`attendance-toggle-card${active ? ' is-active' : ''}`}>
      <div>
        <span>{label}</span>
        <strong>{active ? 'Enabled' : 'Disabled'}</strong>
      </div>
      {icon}
    </button>
  );
}

function PulseCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="attendance-pulse-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}

function TeacherPulseRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="attendance-teacher-row">
      <div className="attendance-teacher-row-copy">
        <i>{icon}</i>
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState({ message, compact = false }: { message: string; compact?: boolean }) {
  return <div className={`attendance-empty-state${compact ? ' is-compact' : ''}`}>{message}</div>;
}

function formatSessionDate(value: string) {
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function isSubmittedStatus(status: string | null | undefined) {
  const normalized = (status || '').toUpperCase();
  return normalized.includes('SUBMIT') || normalized.includes('LOCK') || normalized.includes('COMPLETE');
}

function riskWeight(level: string | null | undefined) {
  const normalized = (level || '').toUpperCase();
  if (normalized === 'CRITICAL') return 3;
  if (normalized === 'WARNING') return 2;
  if (normalized === 'WATCH') return 1;
  return 0;
}

function resolveClassTone(value: number, warningThreshold = 75, criticalThreshold = 65) {
  if (value < criticalThreshold) return ' is-danger';
  if (value < warningThreshold) return ' is-warning';
  return ' is-good';
}
