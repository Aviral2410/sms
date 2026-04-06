import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { Calendar, Filter, Users, CheckCircle2, BarChart3, AlertCircle } from 'lucide-react';
import { schoolOpsApi, type AttendanceRecordResponse, type SubjectResponse } from '../../lib/api';
import { toast } from 'sonner';

const VIOLET = '#a78bfa'; const CYAN = '#22d3ee';
const TEXT = '#f1f5f9'; const DIM = '#8b95a2'; const BORDER = 'rgba(255,255,255,0.08)';

type GroupedRow = {
  id: string;
  date: string;
  period: string;
  subject: string;
  present: number;
  total: number;
};

export default function TeacherAttendanceManager() {
  const { session } = useStore();
  const [period, setPeriod] = useState('All');
  const [subject, setSubject] = useState('All');
  const [month, setMonth] = useState(new Date().getMonth().toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [records, setRecords] = useState<AttendanceRecordResponse[]>([]);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!session.schoolId) return;
      setLoading(true);
      try {
        const [users, subjectsRes] = await Promise.all([
          schoolOpsApi.listUsers(session.schoolId),
          schoolOpsApi.listSubjects(session.schoolId),
        ]);
        setSubjects(subjectsRes);

        const teacher = users.find(
          (u) => u.roleName === 'TEACHER' && u.email.toLowerCase() === (session.email || '').toLowerCase()
        );
        const monthIndex = Number(month);
        const fromDate = new Date(Number(year), monthIndex, 1).toISOString().slice(0, 10);
        const toDate = new Date(Number(year), monthIndex + 1, 0).toISOString().slice(0, 10);

        const attendance = await schoolOpsApi.listAttendanceRecords({
          schoolId: session.schoolId,
          teacherUserId: teacher?.userId,
          fromDate,
          toDate,
        });
        setRecords(attendance);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load attendance records');
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session.schoolId, session.email, month, year]);

  const subjectNameById = useMemo(() => {
    const map = new Map<string, string>();
    subjects.forEach((s) => map.set(s.subjectId, s.subjectName));
    return map;
  }, [subjects]);

  const groupedRows = useMemo<GroupedRow[]>(() => {
    const grouped = new Map<string, GroupedRow>();
    records.forEach((rec) => {
      const date = rec.attendanceDate;
      const periodLabel = rec.periodNumber ? `Period ${rec.periodNumber}` : 'Daily';
      const subjectLabel = rec.subjectId ? subjectNameById.get(rec.subjectId) || rec.subjectId.slice(0, 8) : 'General';
      const key = `${date}|${periodLabel}|${subjectLabel}`;
      const existing = grouped.get(key) || {
        id: key,
        date,
        period: periodLabel,
        subject: subjectLabel,
        present: 0,
        total: 0,
      };
      existing.total += 1;
      if (rec.attendanceStatus.toUpperCase() === 'PRESENT') existing.present += 1;
      grouped.set(key, existing);
    });
    return Array.from(grouped.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [records, subjectNameById]);

  const filteredRows = groupedRows.filter((row) => {
    if (period !== 'All' && row.period !== period) return false;
    if (subject !== 'All' && row.subject !== subject) return false;
    return true;
  });

  const stats = useMemo(() => {
    const totalClasses = filteredRows.length;
    const avgAttendance = totalClasses > 0
      ? Math.round(filteredRows.reduce((acc, row) => acc + ((row.present / row.total) * 100), 0) / totalClasses)
      : 0;

    const byStudent = new Map<string, { present: number; total: number }>();
    records.forEach((rec) => {
      const curr = byStudent.get(rec.userId) || { present: 0, total: 0 };
      curr.total += 1;
      if (rec.attendanceStatus.toUpperCase() === 'PRESENT') curr.present += 1;
      byStudent.set(rec.userId, curr);
    });
    const lowAttendanceStudents = Array.from(byStudent.values()).filter((entry) => {
      if (entry.total === 0) return false;
      return (entry.present / entry.total) * 100 < 75;
    }).length;

    return { totalClasses, avgAttendance, lowAttendanceStudents };
  }, [filteredRows, records]);

  const availablePeriods = ['All', ...Array.from(new Set(groupedRows.map((r) => r.period)))];
  const availableSubjects = ['All', ...Array.from(new Set(groupedRows.map((r) => r.subject)))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 999, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', color: VIOLET, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Class Teacher View
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.03em' }}>Student Attendance</h1>
        <p style={{ color: DIM, margin: 0, fontSize: '0.9rem' }}>Filter and analyze attendance for your subjects and periods.</p>
      </div>

      <div style={{ padding: '20px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, display: 'flex', gap: 16, alignItems: 'end', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 140 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: DIM }}>Period / Slot</label>
          <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: TEXT, outline: 'none' }}>
            {availablePeriods.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 140 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: DIM }}>Subject</label>
          <select value={subject} onChange={e => setSubject(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: TEXT, outline: 'none' }}>
            {availableSubjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 140 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: DIM }}>Month</label>
          <select value={month} onChange={e => setMonth(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: TEXT, outline: 'none' }}>
            {[...Array(12)].map((_, i) => (
              <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 120 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: DIM }}>Year</label>
          <select value={year} onChange={e => setYear(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: TEXT, outline: 'none' }}>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>
        
        <button style={{ padding: '11px 20px', borderRadius: 10, background: VIOLET, border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} /> Active Filters
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div style={{ padding: '24px', borderRadius: 16, background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)' }}>
          <BarChart3 size={24} color={CYAN} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{stats.avgAttendance}%</div>
          <div style={{ fontSize: '0.85rem', color: DIM, marginTop: 4 }}>Average Attendance</div>
        </div>
        <div style={{ padding: '24px', borderRadius: 16, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
          <Calendar size={24} color={VIOLET} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{stats.totalClasses}</div>
          <div style={{ fontSize: '0.85rem', color: DIM, marginTop: 4 }}>Classes Conducted</div>
        </div>
        <div style={{ padding: '24px', borderRadius: 16, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <AlertCircle size={24} color="#fb7185" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{stats.lowAttendanceStudents}</div>
          <div style={{ fontSize: '0.85rem', color: DIM, marginTop: 4 }}>Students &lt; 75% Attendance</div>
        </div>
      </div>

      <div style={{ padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={18} color={VIOLET} /> Aggregated Subject Records
        </h3>
        
        {loading ? (
          <div style={{ color: DIM, fontSize: '0.9rem' }}>Loading attendance records...</div>
        ) : filteredRows.length === 0 ? (
          <div style={{ color: DIM, fontSize: '0.9rem' }}>No attendance records for selected filters.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}`, color: DIM, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Date</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Period</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Subject</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Present</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const perc = Math.round((row.present / row.total) * 100);
                return (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${BORDER}`, fontSize: '0.9rem' }}>
                    <td style={{ padding: '16px', color: '#fff' }}>{new Date(row.date).toLocaleDateString()}</td>
                    <td style={{ padding: '16px', color: VIOLET, fontWeight: 700 }}>{row.period}</td>
                    <td style={{ padding: '16px', color: '#fff' }}>{row.subject}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, color: '#fff' }}>{row.present}</span>
                        <span style={{ color: DIM }}>/ {row.total}</span>
                        <div style={{ width: 60, height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                          <div style={{ width: `${perc}%`, height: '100%', background: perc > 90 ? '#34d399' : perc > 75 ? '#fbbf24' : '#fb7185' }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {perc > 90 ? <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: 'rgba(52,211,153,0.1)', color: '#34d399', fontSize: '0.75rem', fontWeight: 700 }}><CheckCircle2 size={12}/> Excellent</div>
                       : <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: 'rgba(251,191,36,0.1)', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700 }}><CheckCircle2 size={12}/> Good</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
