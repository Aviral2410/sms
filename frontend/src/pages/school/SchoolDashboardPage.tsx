import React from 'react';
import { SchoolDashboard, SchoolSession } from '../../types';
import MetricTile from '../../components/ui/MetricTile';
import GlassCard from '../../components/ui/GlassCard';

interface SchoolDashboardPageProps {
  session: SchoolSession;
  data: SchoolDashboard;
  isLoading: boolean;
}

const SchoolDashboardPage = ({ session, data, isLoading }: SchoolDashboardPageProps) => {
  return (
    <div className="school-dashboard-container">
      <header className="dashboard-header animate-in">
        <div className="header-meta">
          <span className="school-pill">{session.schoolName}</span>
          <h1 className="text-4xl font-bold tracking-tight">Institutional Overview</h1>
        </div>
        <div className="header-actions">
          <span className="academic-session">Session 2026-27</span>
        </div>
      </header>

      {isLoading ? (
        <div className="loading-grid">Synchronizing records...</div>
      ) : (
        <div className="dashboard-content">
          <section className="stats-strip">
            <MetricTile label="Total Students" value={data.studentCount} icon="🧑‍🎓" trend={{ value: '+4.2%', isUp: true }} />
            <MetricTile label="Active Teachers" value={data.teacherCount} icon="🧑‍🏫" trend={{ value: '+2.1%', isUp: true }} />
            <MetricTile label="Departments" value={data.departmentCount} icon="🏢" />
            <MetricTile label="Admissions" value={data.admissionsCount} icon="📝" />
          </section>

          <div className="main-dashboard-grid">
            <GlassCard className="operations-overview-card">
              <h3 className="section-title">Academic Inventory</h3>
              <ul className="inventory-list">
                <li><span>Total Classes</span><strong>{data.classCount}</strong></li>
                <li><span>Subjects Offered</span><strong>{data.subjectCount}</strong></li>
                <li><span>Timetable Slots</span><strong>{data.timetableSlotCount}</strong></li>
              </ul>
            </GlassCard>

            <GlassCard className="engagement-overview-card">
              <h3 className="section-title">Engagement & Records</h3>
              <div className="compact-stats">
                <div className="stat-unit"><span>Homeworks</span><strong>{data.homeworkCount}</strong></div>
                <div className="stat-unit"><span>Notices</span><strong>{data.noticeCount}</strong></div>
                <div className="stat-unit"><span>Attendance Marked</span><strong>{data.attendanceRecordCount}</strong></div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolDashboardPage;
