import React from 'react';
import { type StudentWorkspaceResponse as StudentWorkspace } from '../../lib/api';
import MetricTile from '../../components/ui/MetricTile';
import GlassCard from '../../components/ui/GlassCard';
import AnnouncementFeed from '../../components/communication/AnnouncementFeed';

interface StudentWorkspacePageProps {
  data: StudentWorkspace | null;
  isLoading: boolean;
}

const StudentWorkspacePage = ({ data, isLoading }: StudentWorkspacePageProps) => {
  const [teacherSearch, setTeacherSearch] = React.useState('');

  if (!data && !isLoading) return <div className="p-8 text-center glass-panel m-10">No student workspace data found.</div>;

  const filteredTeachers = data?.subjectTeachers?.filter(t => 
    t.teacherName.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    t.subjectName.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  return (
    <div className="student-workspace-container animate-in">
      <header className="workspace-header mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Student Workspace</h1>
        <p className="opacity-70">Welcome to your academic hub, {data?.student?.fullName}.</p>
      </header>

      {isLoading ? (
        <div className="loading-grid h-64 flex items-center justify-center glass-panel">
          <div className="animate-pulse text-accent-secondary font-display font-bold">Synchronizing your academic records...</div>
        </div>
      ) : (
        <div className="workspace-content">
          <section className="stats-strip mb-10">
            <MetricTile label="Enrolled Class" value={data?.enrolledClass?.className || 'Not Enrolled'} icon="🏫" />
            <MetricTile label="My Subjects" value={data?.subjectTeachers?.length || 0} icon="📚" />
            <MetricTile label="Status" value={data?.scheduleStatus || 'ACTIVE'} icon="✅" />
          </section>

          <div className="workspace-grid-layout grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold font-display">My Teachers</h3>
                <div className="search-box w-64">
                   <input 
                    type="text" 
                    className="input-field py-2 text-sm" 
                    placeholder="Search subjects or teachers..." 
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="class-grid grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTeachers?.map((st) => (
                  <GlassCard key={st.subjectCode} variant="interactive" className="group">
                    <span className="text-xs uppercase tracking-widest font-bold mb-1 block" style={{ color: 'var(--accent-secondary)' }}>{st.subjectCode}</span>
                    <h4 className="text-2xl font-bold font-display mb-3 group-hover:text-blue-400 transition-colors">
                      {st.subjectName}
                    </h4>
                    <div className="flex flex-col border-t border-white/5 pt-4">
                      <span className="font-bold text-sm">{st.teacherName}</span>
                      <span className="text-xs opacity-50">{st.teacherEmail}</span>
                    </div>
                  </GlassCard>
                 ))}
                {filteredTeachers?.length === 0 && (
                  <div className="col-span-full py-12 text-center glass-panel">
                    <p className="opacity-50">No subjects matching "{teacherSearch}"</p>
                  </div>
                )}
              </div>
            </div>

            <aside className="workspace-sidebar flex flex-col gap-8">
              <AnnouncementFeed 
                role="STUDENT" 
                classId={data?.enrolledClass?.classId} 
                title="School Notices"
              />

              <GlassCard variant="accent" className="animate-slide">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🔔</span>
                  <h3 className="text-lg font-bold font-display">Class Teacher</h3>
                </div>
                <p className="font-bold mb-1">{data?.classTeacher?.fullName || 'Not Assigned'}</p>
                <p className="text-sm opacity-60 leading-relaxed italic">Reach out for any academic or administrative guidance.</p>
              </GlassCard>

              <GlassCard className="animate-slide [animation-delay:100ms] border-accent-secondary/20 bg-accent-secondary/5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">📅</span>
                  <h3 className="text-lg font-bold font-display">Today's Schedule</h3>
                </div>
                <p className="text-sm leading-relaxed opacity-70 italic">"{data?.scheduleMessage}"</p>
              </GlassCard>

              <GlassCard variant="interactive" className="animate-slide [animation-delay:200ms]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">📝</span>
                  <h3 className="text-lg font-bold font-display">Resources</h3>
                </div>
                <div className="flex flex-col gap-2">
                  <button className="text-left w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs transition-all border border-white/5 flex items-center gap-3">
                    📚 Digital Library
                  </button>
                  <button className="text-left w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs transition-all border border-white/5 flex items-center gap-3">
                    📊 My Performance
                  </button>
                </div>
              </GlassCard>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentWorkspacePage;
