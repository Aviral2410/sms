import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Award, BarChart2, Brain, Calendar, TrendingUp, Users } from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  schoolOpsApi,
  type AttendanceOverviewResponse,
  type ExamResultRecordResponse,
  type FeeRecordResponse,
  type SchoolDashboard,
  type StudentAdmissionResponse,
} from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const V = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const I = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#f472b6', '#fbbf24', '#fb923c'];

function toPercent(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, Number(value.toFixed(2)))) : 0;
}

function compactDate(dateText?: string | null): string {
  if (!dateText) return '-';
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f1824', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 12px', fontSize: '0.8rem', color: '#fff' }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((item: any) => (
        <div key={item.name} style={{ color: item.fill || item.color, fontSize: '0.78rem' }}>
          {item.name}: <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function SchoolAnalyticsPage() {
  const { session } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dashboard, setDashboard] = useState<SchoolDashboard | null>(null);
  const [attendanceOverview, setAttendanceOverview] = useState<AttendanceOverviewResponse | null>(null);
  const [results, setResults] = useState<ExamResultRecordResponse[]>([]);
  const [admissions, setAdmissions] = useState<StudentAdmissionResponse[]>([]);
  const [fees, setFees] = useState<FeeRecordResponse[]>([]);

  useEffect(() => {
    const schoolId = session.schoolId;
    if (!schoolId) return;

    let cancelled = false;

    const load = async () => {
      try {
        const [dashboardRes, attendanceRes, resultRes, admissionRes, feeRes] = await Promise.all([
          schoolOpsApi.getDashboard(schoolId),
          schoolOpsApi.getAttendanceOverview(),
          schoolOpsApi.listResults(schoolId),
          schoolOpsApi.listAdmissions(schoolId),
          schoolOpsApi.listFeeRecords(schoolId),
        ]);

        if (cancelled) return;
        setDashboard(dashboardRes);
        setAttendanceOverview(attendanceRes);
        setResults(resultRes);
        setAdmissions(admissionRes);
        setFees(feeRes);
        setError('');
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load analytics.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    load();
    const intervalId = window.setInterval(load, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [session.schoolId]);

  const attendanceTrend = useMemo(() => {
    return (attendanceOverview?.trend || []).map((point) => ({
      label: compactDate(point.date),
      Present: point.present,
      Absent: point.absent,
      Late: point.late,
    }));
  }, [attendanceOverview]);

  const classHealth = useMemo(() => {
    return (attendanceOverview?.byClass || []).map((item) => ({
      classLabel: `${item.className || 'Class'}${item.sectionName ? `-${item.sectionName}` : ''}`,
      attendance: toPercent(item.attendancePercentage),
    }));
  }, [attendanceOverview]);

  const examPerformance = useMemo(() => {
    const byExam = new Map<string, { total: number; scored: number }>();
    for (const row of results) {
      const key = row.examName || 'Exam';
      const current = byExam.get(key) || { total: 0, scored: 0 };
      current.total += Number(row.maxMarks || 0);
      current.scored += Number(row.marksObtained || 0);
      byExam.set(key, current);
    }
    return Array.from(byExam.entries()).map(([exam, values]) => {
      const percentage = values.total > 0 ? toPercent((values.scored / values.total) * 100) : 0;
      return { exam, score: percentage };
    });
  }, [results]);

  const admissionStatus = useMemo(() => {
    const counts = new Map<string, number>();
    for (const admission of admissions) {
      const status = admission.admissionStatus || 'UNKNOWN';
      counts.set(status, (counts.get(status) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([status, count], index) => ({
      name: status,
      value: count,
      fill: COLORS[index % COLORS.length],
    }));
  }, [admissions]);

  const feeCollection = useMemo(() => {
    const totals = fees.reduce(
      (acc, fee) => {
        acc.due += Number(fee.amountDue || 0);
        acc.paid += Number(fee.amountPaid || 0);
        return acc;
      },
      { due: 0, paid: 0 }
    );
    const pending = Math.max(0, totals.due - totals.paid);
    const paidPercentage = totals.due > 0 ? toPercent((totals.paid / totals.due) * 100) : 0;
    return {
      paid: totals.paid,
      due: totals.due,
      pending,
      paidPercentage,
      chart: [
        { name: 'Paid', value: totals.paid, fill: '#34d399' },
        { name: 'Pending', value: pending, fill: '#f87171' },
      ],
    };
  }, [fees]);

  const avgScore = useMemo(() => {
    if (!results.length) return 0;
    let totalObtained = 0;
    let totalMax = 0;
    for (const row of results) {
      totalObtained += Number(row.marksObtained || 0);
      totalMax += Number(row.maxMarks || 0);
    }
    if (totalMax <= 0) return 0;
    return toPercent((totalObtained / totalMax) * 100);
  }, [results]);

  const aiSummary = useMemo(() => {
    const attendance = toPercent(attendanceOverview?.schoolAttendancePercentage || 0);
    const students = dashboard?.studentCount || 0;
    const exams = examPerformance.length;
    return `Live summary: attendance is ${attendance}%, average exam score is ${avgScore}%, and fee realization is ${feeCollection.paidPercentage}%. Tracking ${students} active students across ${dashboard?.classCount || 0} classes and ${exams} exam groups.`;
  }, [attendanceOverview, dashboard, avgScore, feeCollection, examPerformance.length]);

  if (loading) {
    return <div className="glass-card" style={{ color: 'var(--text-muted)' }}>Loading analytics...</div>;
  }

  if (error) {
    return <div className="glass-card" style={{ color: '#f87171' }}>{error}</div>;
  }

  return (
    <motion.div variants={V} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }}>
      <motion.div variants={I} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 999, background: 'var(--surface-accent-soft)', border: '1px solid var(--surface-accent-border)', color: 'var(--brand-accent)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            <BarChart2 size={12} /> Intelligence Layer
          </div>
          <h1 style={{ margin: 0, color: 'var(--text-strong)', fontSize: '2rem', fontWeight: 900 }}>School Analytics</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>Operational analytics sourced from live school data.</p>
        </div>
      </motion.div>

      <motion.div variants={I} className="glass-card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', borderColor: 'var(--surface-accent-border)' }}>
        <div style={{ padding: 8, borderRadius: 10, background: 'var(--surface-accent-soft)' }}><Brain size={18} color="var(--brand-accent)" /></div>
        <div style={{ color: 'var(--text-soft)', lineHeight: 1.6 }}>{aiSummary}</div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { label: 'Attendance', value: `${toPercent(attendanceOverview?.schoolAttendancePercentage || 0)}%`, icon: Calendar, color: '#22d3ee' },
          { label: 'Avg Exam Score', value: `${avgScore}%`, icon: Award, color: '#a78bfa' },
          { label: 'Fee Collection', value: `${feeCollection.paidPercentage}%`, icon: TrendingUp, color: '#34d399' },
          { label: 'Active Students', value: String(dashboard?.studentCount || 0), icon: Users, color: '#f472b6' },
        ].map((item) => (
          <motion.div key={item.label} variants={I} className="glass-card" style={{ padding: 18, borderColor: `${item.color}33`, background: `${item.color}0d` }}>
            <item.icon size={18} color={item.color} />
            <div style={{ fontSize: '1.55rem', fontWeight: 900, color: 'var(--text-strong)', marginTop: 10 }}>{item.value}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{item.label}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <motion.div variants={I} className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Activity size={16} color="#22d3ee" />
            <h3 style={{ margin: 0, color: 'var(--text-strong)', fontSize: '1rem' }}>Attendance Trend</h3>
          </div>
          {attendanceTrend.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={attendanceTrend}>
                <XAxis dataKey="label" tick={{ fill: '#8b95a2', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8b95a2', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="Present" stroke="#22d3ee" strokeWidth={2.4} dot={false} />
                <Line type="monotone" dataKey="Absent" stroke="#f87171" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Late" stroke="#fbbf24" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>No attendance trend available yet.</div>
          )}
        </motion.div>

        <motion.div variants={I} className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Users size={16} color="#a78bfa" />
            <h3 style={{ margin: 0, color: 'var(--text-strong)', fontSize: '1rem' }}>Class Attendance Health</h3>
          </div>
          {classHealth.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={classHealth}>
                <XAxis dataKey="classLabel" tick={{ fill: '#8b95a2', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8b95a2', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="attendance" name="Attendance %" fill="#a78bfa" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>No class attendance data available yet.</div>
          )}
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <motion.div variants={I} className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <TrendingUp size={16} color="#34d399" />
            <h3 style={{ margin: 0, color: 'var(--text-strong)', fontSize: '1rem' }}>Fee Collection</h3>
          </div>
          {feeCollection.due > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <ResponsiveContainer width={170} height={170}>
                <PieChart>
                  <Pie data={feeCollection.chart} dataKey="value" cx={78} cy={78} innerRadius={46} outerRadius={68} stroke="none">
                    {feeCollection.chart.map((entry, index) => <Cell key={entry.name} fill={entry.fill || COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ color: 'var(--text-soft)', fontWeight: 700 }}>Due: {feeCollection.due.toFixed(2)}</div>
                <div style={{ color: 'var(--text-soft)', fontWeight: 700 }}>Paid: {feeCollection.paid.toFixed(2)}</div>
                <div style={{ color: '#f87171', fontWeight: 700 }}>Pending: {feeCollection.pending.toFixed(2)}</div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>No fee records available yet.</div>
          )}
        </motion.div>

        <motion.div variants={I} className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <BarChart2 size={16} color="#f472b6" />
            <h3 style={{ margin: 0, color: 'var(--text-strong)', fontSize: '1rem' }}>Admission Pipeline</h3>
          </div>
          {admissionStatus.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={admissionStatus}>
                <XAxis dataKey="name" tick={{ fill: '#8b95a2', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8b95a2', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Admissions" radius={[8, 8, 0, 0]}>
                  {admissionStatus.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>No admissions in pipeline yet.</div>
          )}
        </motion.div>
      </div>

      <motion.div variants={I} className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <Award size={16} color="#60a5fa" />
          <h3 style={{ margin: 0, color: 'var(--text-strong)', fontSize: '1rem' }}>Exam Group Performance</h3>
        </div>
        {examPerformance.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={examPerformance}>
              <XAxis dataKey="exam" tick={{ fill: '#8b95a2', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8b95a2', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="score" name="Avg Score %" fill="#60a5fa" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ color: 'var(--text-muted)' }}>No exam results published yet.</div>
        )}
      </motion.div>
    </motion.div>
  );
}
