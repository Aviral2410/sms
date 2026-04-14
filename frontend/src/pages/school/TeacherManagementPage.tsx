import React, { useMemo, useState } from 'react';
import { ArrowDownAZ, ArrowUpAZ, Search } from 'lucide-react';
import { schoolOpsApi, type SchoolUser } from '../../lib/api';
import { toast } from 'sonner';
import { TeacherSidebar } from './teachers/TeacherSidebar';
import { TeacherTable } from './teachers/TeacherTable';
import { TeacherDetailsDrawer } from './teachers/TeacherDetailsDrawer';
import '../../styles/admin-management.css';

interface TeacherManagementPageProps {
  schoolSession: any;
  teacherUsers: SchoolUser[];
  createSchoolOp: (path: string, body: any, onSuccess: () => Promise<void>, message: string) => Promise<void>;
  loadSchoolOperations: (session: any) => Promise<void>;
}

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

const TeacherManagementPage = ({
  schoolSession,
  teacherUsers,
  createSchoolOp,
  loadSchoolOperations,
}: TeacherManagementPageProps) => {
  const [userForm, setUserForm] = useState({ fullName: '', email: '', roleName: 'TEACHER', accessKey: '' });
  const [teacherFilterText, setTeacherFilterText] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<SchoolUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [performance, setPerformance] = useState<any>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const stats = useMemo(() => {
    const now = Date.now();
    const recentHires = teacherUsers.filter((teacher) => {
      const createdAt = new Date(teacher.createdAt).getTime();
      return Number.isFinite(createdAt) && now - createdAt <= THIRTY_DAYS_IN_MS;
    }).length;

    return {
      totalFaculty: teacherUsers.length,
      recentHires,
    };
  }, [teacherUsers]);

  const filteredTeachers = useMemo(
    () =>
      teacherUsers
        .filter(
          (teacher) =>
            teacher.fullName.toLowerCase().includes(teacherFilterText.toLowerCase()) ||
            teacher.email.toLowerCase().includes(teacherFilterText.toLowerCase()),
        )
        .sort((a, b) =>
          sortDir === 'asc' ? a.fullName.localeCompare(b.fullName) : b.fullName.localeCompare(a.fullName),
        ),
    [teacherUsers, teacherFilterText, sortDir],
  );

  const handleCreateTeacher = async (event: React.FormEvent) => {
    event.preventDefault();
    await createSchoolOp(
      '/api/v1/school-ops/users',
      {
        tenantId: schoolSession.tenantId,
        schoolId: schoolSession.schoolId,
        schoolCode: schoolSession.schoolCode,
        schoolName: schoolSession.schoolName,
        ...userForm,
      },
      async () => {
        await loadSchoolOperations(schoolSession);
        setUserForm({ fullName: '', email: '', roleName: 'TEACHER', accessKey: '' });
      },
      'Faculty member registered.',
    );
  };

  const handleUpdateTeacher = async (teacher: SchoolUser) => {
    const newName = window.prompt('New Full Name:', teacher.fullName);
    if (!newName) return;

    try {
      await schoolOpsApi.updateUser(teacher.userId, { fullName: newName, email: teacher.email });
      toast.success('Profile updated');
      await loadSchoolOperations(schoolSession);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteTeacher = async (userId: string) => {
    if (!window.confirm('Deactivate this faculty member?')) return;

    try {
      await schoolOpsApi.deleteUser(userId);
      toast.success('Faculty deactivated');
      await loadSchoolOperations(schoolSession);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleView = async (teacher: SchoolUser) => {
    setSelectedTeacher(teacher);
    setDrawerOpen(true);

    try {
      const perf = await schoolOpsApi.getTeacherPerformance(schoolSession.schoolId, teacher.userId);
      setPerformance(perf);
    } catch {
      setPerformance(null);
    }
  };

  return (
    <div className="admin-management-shell min-h-screen">
      <div className="admin-management-page">
        <section className="admin-management-card admin-management-hero">
          <div className="admin-management-hero-copy">
            <div className="admin-management-eyebrow">Academic Operations</div>
            <h1 className="admin-management-title">Teachers</h1>
            <p className="admin-management-subtitle">
              Keep faculty onboarding, class coverage, and performance reviews in one stable workspace.
            </p>
          </div>

          <div className="admin-management-hero-actions">
            <div className="admin-management-highlight">
              <span>Faculty Count</span>
              <strong>{stats.totalFaculty} active</strong>
            </div>
          </div>
        </section>

        <section className="admin-management-card admin-management-toolbar">
          <label className="admin-management-search">
            <Search size={18} />
            <input
              value={teacherFilterText}
              onChange={(event) => setTeacherFilterText(event.target.value)}
              placeholder="Search teacher by name or email"
            />
          </label>

          <div className="admin-management-toolbar-actions">
            <div className="admin-management-toolbar-copy">
              <span>Visible faculty</span>
              <strong>
                {filteredTeachers.length} of {teacherUsers.length}
              </strong>
            </div>
            <button
              onClick={() => setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))}
              className="admin-management-secondary"
              type="button"
            >
              {sortDir === 'asc' ? 'Name A-Z' : 'Name Z-A'}
              {sortDir === 'asc' ? <ArrowUpAZ size={16} /> : <ArrowDownAZ size={16} />}
            </button>
          </div>
        </section>

        <section className="admin-management-stats-grid">
          <StatCard
            label="Total faculty"
            value={stats.totalFaculty}
            description="All teachers provisioned for this school"
          />
          <StatCard
            label="Recent hires"
            value={stats.recentHires}
            description="Freshly onboarded faculty added in the last 30 days"
          />
          <StatCard
            label="Academic roles"
            value="Faculty"
            description="Base instructional staff roles"
          />
          <StatCard
            label="Directory status"
            value="Active"
            description="Teacher registry is synchronized"
          />
        </section>

        <section className="admin-management-content-grid">
          <TeacherSidebar
            teacherCount={stats.totalFaculty}
            recentHires={stats.recentHires}
            onboardingForm={userForm}
            setForm={setUserForm}
            onSubmit={handleCreateTeacher}
          />

          <main className="admin-management-main">
            <TeacherTable
              teachers={filteredTeachers}
              onView={handleView}
              onEdit={handleUpdateTeacher}
              onDelete={(teacher) => handleDeleteTeacher(teacher.userId)}
              selectedId={selectedTeacher?.userId}
              filterText={teacherFilterText}
            />
          </main>
        </section>
      </div>

      <TeacherDetailsDrawer
        teacher={selectedTeacher}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        performance={performance}
      />
    </div>
  );
};

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <article className="admin-management-card admin-management-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{description}</p>
    </article>
  );
}

export default TeacherManagementPage;
