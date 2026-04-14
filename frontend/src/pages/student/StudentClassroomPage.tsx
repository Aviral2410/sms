import React, { useEffect, useState } from 'react';
import { BookOpen, Loader, Mail, School, Users } from 'lucide-react';
import { PortalPageHeader, PortalSection, PortalStatePanel, PortalStatCard } from '../../components/portal/PortalPagePrimitives';
import { studentPortalApi, type ClassroomDetailResponse } from '../../lib/schoolPortalApi';

export default function StudentClassroomPage() {
  const [classroom, setClassroom] = useState<ClassroomDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    studentPortalApi.getClassroom()
      .then((response) => {
        if (active) setClassroom(response);
      })
      .catch((error: any) => {
        if (active) setMessage(error?.message || 'Unable to load classroom details.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <PortalStatePanel icon={Loader} title="Loading classroom" description="Resolving current class, teachers, and classmates." accent="#22d3ee" />;
  }

  if (!classroom) {
    return <PortalStatePanel title="Classroom unavailable" description={message || 'No classroom details are mapped for this student yet.'} />;
  }

  return (
    <div className="space-y-6 pb-16">
      <PortalPageHeader
        eyebrow="My classroom"
        title={`${classroom.className} - ${classroom.sectionName}`}
        description="A student-facing class view with class-teacher visibility, subject teacher contact context, and a lightweight peer list."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <PortalStatCard label="Subjects" value={classroom.subjects.length} icon={BookOpen} accent="#22d3ee" />
        <PortalStatCard label="Classmates" value={classroom.classmates.length} icon={Users} accent="#a78bfa" />
        <PortalStatCard label="Class teacher" value={classroom.classTeacherName || 'Pending'} icon={School} accent="#ffb663" />
        <PortalStatCard label="Section" value={classroom.sectionName} icon={Users} accent="#34d399" />
      </div>

      <PortalSection title="Subject teachers" description="Teachers are grouped by subject so students can find the right contact quickly.">
        <div className="grid gap-4 lg:grid-cols-2">
          {classroom.subjects.map((subject) => (
            <div key={subject.subjectId} className="glass-panel" style={{ padding: 20, display: 'grid', gap: 10 }}>
              <div style={{ fontSize: '0.72rem', color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>
                {subject.subjectName}
              </div>
              <div style={{ color: 'var(--text-strong)', fontSize: '1.05rem', fontWeight: 800 }}>{subject.teacherName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)' }}>
                <Mail size={14} />
                {subject.teacherEmail}
              </div>
            </div>
          ))}
        </div>
      </PortalSection>

      <PortalSection title="Class roster" description="The roster keeps mobile density low while still surfacing roll numbers when available.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classroom.classmates.map((student) => (
            <div key={student.userId} className="glass-panel" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(34,211,238,0.12)',
                  color: '#22d3ee',
                  fontWeight: 800,
                }}
              >
                {student.fullName.slice(0, 1)}
              </div>
              <div>
                <div style={{ color: 'var(--text-strong)', fontWeight: 700 }}>{student.fullName}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                  {student.rollNo ? `Roll No. ${student.rollNo}` : 'Roll number pending'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </PortalSection>
    </div>
  );
}
