import React, { useEffect, useState } from 'react';
import { CalendarRange, Loader, School, ShieldCheck, UserRound } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { PortalPageHeader, PortalSection, PortalStatePanel, PortalStatCard } from '../../components/portal/PortalPagePrimitives';
import { teacherPortalApi, type TeacherBiometricComplianceResponse, type TeacherWorkspaceSummary } from '../../lib/schoolPortalApi';

export default function TeacherProfilePortalPage() {
  const { session } = useStore();
  const [workspace, setWorkspace] = useState<TeacherWorkspaceSummary | null>(null);
  const [compliance, setCompliance] = useState<TeacherBiometricComplianceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    Promise.allSettled([teacherPortalApi.getWorkspace(), teacherPortalApi.getBiometricCompliance()])
      .then((results) => {
        if (!active) return;
        const [workspaceResult, complianceResult] = results;
        if (workspaceResult.status === 'fulfilled') setWorkspace(workspaceResult.value);
        if (complianceResult.status === 'fulfilled') setCompliance(complianceResult.value);
        if (workspaceResult.status === 'rejected' && complianceResult.status === 'rejected') {
          setMessage('Unable to load teacher profile details.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <PortalStatePanel icon={Loader} title="Loading teacher profile" description="Fetching teaching workload and attendance summary." accent="#a78bfa" />;
  }

  if (!workspace && !compliance) {
    return <PortalStatePanel title="Profile unavailable" description={message || 'Teacher profile details are unavailable right now.'} />;
  }

  return (
    <div className="space-y-6 pb-16">
      <PortalPageHeader
        eyebrow="Teacher profile"
        title={session.fullName || 'Teacher workspace'}
        description="A concise teacher profile view showing workload, current upcoming periods, and biometric attendance compliance without leaving the dashboard shell."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <PortalStatCard label="Classes today" value={workspace?.totalClassesToday || 0} icon={School} accent="#22d3ee" />
        <PortalStatCard label="Pending reviews" value={workspace?.pendingHomeworkReviews || 0} icon={ShieldCheck} accent="#ffb663" />
        <PortalStatCard label="Attendance %" value={compliance ? `${compliance.attendancePercentage}%` : 'N/A'} icon={CalendarRange} accent="#34d399" />
        <PortalStatCard label="Compliance" value={compliance?.biometricCompliance || 'Unavailable'} icon={UserRound} accent="#a78bfa" />
      </div>

      <PortalSection title="Teacher identity" description="Core account fields remain read-only and role-scoped.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Name', session.fullName || 'Teacher'],
            ['Email', session.email || 'Unknown'],
            ['Role', session.role || 'Teacher'],
            ['School', session.schoolName || 'Current school'],
          ].map(([label, value]) => (
            <div key={label} className="glass-panel" style={{ padding: 18, display: 'grid', gap: 8 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>{label}</div>
              <div style={{ color: 'var(--text-strong)', fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>
      </PortalSection>

      <PortalSection title="Upcoming teaching periods" description="Quick schedule visibility for the next classes without forcing a full timetable view.">
        <div className="grid gap-4 lg:grid-cols-2">
          {(workspace?.upcomingPeriods || []).map((period, index) => (
            <div key={`${period.time}-${index}`} className="glass-panel" style={{ padding: 20, display: 'grid', gap: 8 }}>
              <div style={{ fontSize: '0.72rem', color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>{period.time}</div>
              <div style={{ color: 'var(--text-strong)', fontWeight: 800 }}>{period.className}</div>
              <div style={{ color: 'var(--text-dim)' }}>{period.subjectName}{period.room ? ` - ${period.room}` : ''}</div>
            </div>
          ))}
          {!workspace?.upcomingPeriods?.length ? (
            <div className="glass-panel" style={{ padding: 20, color: 'var(--text-dim)' }}>No upcoming periods scheduled.</div>
          ) : null}
        </div>
      </PortalSection>

      {compliance ? (
        <PortalSection title="Attendance compliance" description="Teacher attendance is surfaced as a lightweight compliance summary instead of a dense audit screen.">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="glass-panel" style={{ padding: 18 }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>Report month</div>
              <div style={{ color: 'var(--text-strong)', fontWeight: 800, marginTop: 8 }}>{compliance.reportMonth}</div>
            </div>
            <div className="glass-panel" style={{ padding: 18 }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>Academic year</div>
              <div style={{ color: 'var(--text-strong)', fontWeight: 800, marginTop: 8 }}>{compliance.academicYear}</div>
            </div>
            <div className="glass-panel" style={{ padding: 18 }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>Principal note</div>
              <div style={{ color: 'var(--text-strong)', fontWeight: 800, marginTop: 8 }}>{compliance.principalNote || 'No note shared.'}</div>
            </div>
          </div>
        </PortalSection>
      ) : null}
    </div>
  );
}
