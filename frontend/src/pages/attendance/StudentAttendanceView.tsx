import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, BarChart3, Calendar, CheckCircle2, Loader } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { schoolOpsApi, type AcademicClassResponse, type AttendanceRecordResponse, type SchoolUser } from '../../lib/api';

const DIM = '#8b95a2';

export default function StudentAttendanceView() {
  const { session } = useStore();
  const [searchParams] = useSearchParams();
  const targetStudentId = searchParams.get('studentId') || (session.role === 'STUDENT' ? session.userId : null);

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<SchoolUser | null>(null);
  const [studentClass, setStudentClass] = useState<AcademicClassResponse | null>(null);
  const [records, setRecords] = useState<AttendanceRecordResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!session.schoolId || !targetStudentId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [users, classes, enrollments] = await Promise.all([
          schoolOpsApi.listUsers(session.schoolId),
          schoolOpsApi.listClasses(session.schoolId),
          schoolOpsApi.listStudentEnrollments(session.schoolId),
        ]);

        const foundStudent = users.find((user) => user.userId === targetStudentId) || null;
        const enrollment = enrollments.find((item) => item.studentUserId === targetStudentId) || null;
        const foundClass = enrollment ? classes.find((item) => item.classId === enrollment.classId) || null : null;

        const attendance = await schoolOpsApi.listAttendanceRecords({
          schoolId: session.schoolId,
          classId: enrollment?.classId,
        });

        setStudent(foundStudent);
        setStudentClass(foundClass);
        setRecords(attendance.filter((item) => item.userId === targetStudentId));
      } catch (err: any) {
        setError(err.message || 'Failed to load attendance details');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [session.schoolId, session.role, session.userId, targetStudentId]);

  const summary = useMemo(() => {
    const present = records.filter((item) => item.attendanceStatus === 'PRESENT').length;
    const absent = records.filter((item) => item.attendanceStatus === 'ABSENT').length;
    const late = records.filter((item) => item.attendanceStatus === 'LATE').length;
    const leave = records.filter((item) => item.attendanceStatus === 'LEAVE').length;
    const total = records.length;
    const percentage = total === 0 ? 0 : Math.round(((present + late) / total) * 100);

    const recent = [...records].slice(0, 8);

    return { present, absent, late, leave, total, percentage, recent };
  }, [records]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-slate-400">
        <Loader className="animate-spin text-cyan-400" size={24} />
        <span>Loading attendance view...</span>
      </div>
    );
  }

  if (!targetStudentId) {
    return <div className="py-20 text-center text-slate-500">Select a student from the directory to view attendance.</div>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-red-400">
        <div className="flex items-center gap-3">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">
          <Calendar size={14} />
          Attendance
        </div>
        <h1 className="mt-3 text-3xl font-black text-white">{student?.fullName || 'Student Attendance'}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {studentClass ? `${studentClass.className} - ${studentClass.sectionName}` : 'Class not assigned yet'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <AttendanceMetric label="Attendance %" value={`${summary.percentage}%`} accent="text-cyan-300" />
        <AttendanceMetric label="Present" value={summary.present} accent="text-emerald-300" />
        <AttendanceMetric label="Absent" value={summary.absent} accent="text-rose-300" />
        <AttendanceMetric label="Late / Leave" value={`${summary.late} / ${summary.leave}`} accent="text-amber-300" />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-white">
          <BarChart3 size={18} className="text-cyan-300" />
          Recent Attendance Records
        </h2>

        {summary.recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center text-sm text-slate-500">
            No attendance records are available for this student yet.
          </div>
        ) : (
          <div className="space-y-3">
            {summary.recent.map((record) => (
              <div
                key={record.attendanceId}
                className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-bold text-white">{new Date(record.attendanceDate).toLocaleDateString()}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {record.attendanceMode || 'DAILY'} {record.periodNumber ? `• Period ${record.periodNumber}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-200">
                    {record.attendanceStatus}
                  </span>
                  <span className="text-xs text-slate-500">Marked by {record.markedBy}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AttendanceMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className={`mt-2 text-3xl font-black ${accent}`}>{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
        <CheckCircle2 size={12} />
        <span style={{ color: DIM }}>Student-specific view</span>
      </div>
    </div>
  );
}
