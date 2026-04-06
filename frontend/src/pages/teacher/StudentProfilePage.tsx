import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  FileText,
  GraduationCap,
  Loader,
  Mail,
  TrendingUp,
  User,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  schoolOpsApi,
  type AcademicClassResponse,
  type AttendanceRecordResponse,
  type ExamResultRecordResponse,
  type SchoolUser,
  type StudentAdmissionResponse,
  type StudentMonitoringReportResponse,
} from '../../lib/api';

type StudentProfileData = {
  student: SchoolUser | null;
  admission: StudentAdmissionResponse | null;
  assignedClass: AcademicClassResponse | null;
  reports: StudentMonitoringReportResponse[];
  attendance: AttendanceRecordResponse[];
  results: ExamResultRecordResponse[];
};

export default function StudentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StudentProfileData>({
    student: null,
    admission: null,
    assignedClass: null,
    reports: [],
    attendance: [],
    results: [],
  });

  useEffect(() => {
    const load = async () => {
      if (!id || !session.schoolId) return;

      try {
        setLoading(true);
        setError(null);

        const [users, admissions, classes, enrollments, reports, results] = await Promise.all([
          schoolOpsApi.listUsers(session.schoolId),
          schoolOpsApi.listAdmissions(session.schoolId),
          schoolOpsApi.listClasses(session.schoolId),
          schoolOpsApi.listStudentEnrollments(session.schoolId),
          schoolOpsApi.listStudentReports(session.schoolId),
          schoolOpsApi.listResults(session.schoolId),
        ]);

        const student = users.find((user) => user.userId === id) || null;
        const admission = admissions.find((item) => item.studentUserId === id) || null;
        const enrollment = enrollments.find((item) => item.studentUserId === id) || null;
        const assignedClass = enrollment ? classes.find((item) => item.classId === enrollment.classId) || null : null;
        const attendance = await schoolOpsApi.listAttendanceRecords({
          schoolId: session.schoolId,
          classId: enrollment?.classId,
        });

        setData({
          student,
          admission,
          assignedClass,
          reports: reports.filter((report) => report.studentUserId === id),
          attendance: attendance.filter((record) => record.userId === id),
          results: results.filter((result) => result.studentUserId === id),
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load student profile');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, session.schoolId]);

  const summary = useMemo(() => {
    const present = data.attendance.filter((item) => item.attendanceStatus === 'PRESENT').length;
    const late = data.attendance.filter((item) => item.attendanceStatus === 'LATE').length;
    const attendancePct = data.attendance.length === 0 ? 0 : Math.round(((present + late) / data.attendance.length) * 100);
    const averageMarks = data.results.length === 0
      ? 0
      : Math.round(
          data.results.reduce((sum, item) => sum + (Number(item.marksObtained) / Number(item.maxMarks)) * 100, 0) /
            data.results.length,
        );

    return {
      attendancePct,
      averageMarks,
      latestReport: data.reports[0] || null,
      recentResults: data.results.slice(0, 5),
      recentAttendance: data.attendance.slice(0, 5),
    };
  }, [data.attendance, data.reports, data.results]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center gap-3 text-slate-400">
        <Loader size={20} className="animate-spin text-amber-400" />
        <span>Loading student profile...</span>
      </div>
    );
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

  if (!data.student) {
    return <div className="py-20 text-center text-slate-500">Student record not found.</div>;
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-white">
          <ChevronLeft size={18} />
          Back to Students
        </button>
        <button
          onClick={() => navigate(`/attendance/student?studentId=${data.student?.userId}`)}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-white"
        >
          <CalendarDays size={16} />
          Open Attendance
        </button>
      </div>

      <div className="rounded-[32px] border border-white/10 bg-white/5 p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-amber-500/15 text-3xl font-black text-amber-300">
              {data.student.fullName.charAt(0)}
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">
                <GraduationCap size={14} />
                Progress Profile
              </div>
              <h1 className="mt-3 text-3xl font-black text-white">{data.student.fullName}</h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-400">
                <span className="inline-flex items-center gap-2"><Mail size={14} /> {data.student.email}</span>
                <span className="inline-flex items-center gap-2"><User size={14} /> {data.assignedClass ? `${data.assignedClass.className} - ${data.assignedClass.sectionName}` : 'Class pending'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="Attendance" value={`${summary.attendancePct}%`} accent="text-cyan-300" />
            <MetricCard label="Average Marks" value={`${summary.averageMarks}%`} accent="text-emerald-300" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-white">
              <TrendingUp size={18} className="text-emerald-300" />
              Latest Progress Note
            </h2>
            {summary.latestReport ? (
              <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-5">
                <div className="text-sm font-bold text-white">
                  {summary.latestReport.reportMonth} • {summary.latestReport.academicYear}
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  Attendance: {summary.latestReport.attendancePercentage}%
                </div>
                <div className="mt-3 space-y-2 text-sm text-slate-400">
                  <p>{summary.latestReport.academicNote || 'No academic note recorded.'}</p>
                  <p>{summary.latestReport.behaviourNote || 'No behaviour note recorded.'}</p>
                  <p>{summary.latestReport.wellbeingNote || 'No wellbeing note recorded.'}</p>
                </div>
              </div>
            ) : (
              <EmptyCard message="No student monitoring reports are available yet." />
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-white">
              <BarChart3 size={18} className="text-cyan-300" />
              Recent Exam Results
            </h2>
            {summary.recentResults.length === 0 ? (
              <EmptyCard message="No exam results found for this student." />
            ) : (
              <div className="space-y-3">
                {summary.recentResults.map((result) => {
                  const percent = Math.round((Number(result.marksObtained) / Number(result.maxMarks)) * 100);
                  return (
                    <div key={result.resultId} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white">{result.examName}</div>
                          <div className="text-xs text-slate-500">{result.academicYear}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-emerald-300">{percent}%</div>
                          <div className="text-xs text-slate-500">
                            {result.marksObtained} / {result.maxMarks}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
              <FileText size={14} />
              Admission
            </h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div>Admission No: <span className="font-bold text-white">{data.admission?.admissionNo || 'Not available'}</span></div>
              <div>Status: <span className="font-bold text-white">{data.admission?.admissionStatus || 'Not available'}</span></div>
              <div>Guardian: <span className="font-bold text-white">{data.admission?.guardianName || 'Not available'}</span></div>
              <div>Phone: <span className="font-bold text-white">{data.admission?.guardianPhone || 'Not available'}</span></div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
              <CalendarDays size={14} />
              Recent Attendance
            </h3>
            {summary.recentAttendance.length === 0 ? (
              <EmptyCard message="No attendance records yet." compact />
            ) : (
              <div className="space-y-3">
                {summary.recentAttendance.map((record) => (
                  <div key={record.attendanceId} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 text-sm">
                    <div className="font-bold text-white">{new Date(record.attendanceDate).toLocaleDateString()}</div>
                    <div className="mt-1 text-slate-400">{record.attendanceStatus}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className={`mt-2 text-3xl font-black ${accent}`}>{value}</div>
    </div>
  );
}

function EmptyCard({ message, compact = false }: { message: string; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-dashed border-white/10 text-center text-sm text-slate-500 ${compact ? 'px-4 py-6' : 'px-6 py-10'}`}>
      {message}
    </div>
  );
}
