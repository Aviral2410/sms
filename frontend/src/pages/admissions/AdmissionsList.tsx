import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  Phone,
  Plus,
  Search,
  UserRoundCheck,
  Users,
} from 'lucide-react';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { toast } from 'sonner';
import { schoolOpsApi, type StudentAdmissionResponse } from '../../lib/api';
import { useStore } from '../../store/useStore';
import '../../styles/admin-management.css';
import './admissions.css';

type PipelineStageKey = 'LEAD' | 'APPLICATION' | 'ADMITTED' | 'ACTIVE';
type StageFilter = PipelineStageKey | 'ALL';
type SortOption = 'newest' | 'oldest' | 'name';
type StageTone = 'cyan' | 'amber' | 'emerald' | 'violet';

type StageConfig = {
  key: PipelineStageKey;
  title: string;
  description: string;
  tone: StageTone;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
};

const STAGES: StageConfig[] = [
  {
    key: 'LEAD',
    title: 'New Leads',
    description: 'Fresh enquiries waiting for first contact.',
    tone: 'cyan',
    icon: Users,
    emptyTitle: 'No new leads',
    emptyDescription: 'Fresh enquiries will appear here once intake starts.',
  },
  {
    key: 'APPLICATION',
    title: 'Applications',
    description: 'Applicants currently under review.',
    tone: 'amber',
    icon: ClipboardList,
    emptyTitle: 'No open applications',
    emptyDescription: 'Qualified leads move here while documents are reviewed.',
  },
  {
    key: 'ADMITTED',
    title: 'Ready To Enroll',
    description: 'Students approved and waiting for onboarding.',
    tone: 'emerald',
    icon: FileCheck2,
    emptyTitle: 'No admitted students',
    emptyDescription: 'Approved applicants will appear here before activation.',
  },
  {
    key: 'ACTIVE',
    title: 'Active Students',
    description: 'Admissions already converted into student records.',
    tone: 'violet',
    icon: GraduationCap,
    emptyTitle: 'No active students',
    emptyDescription: 'Completed enrollments will appear here once onboarding is done.',
  },
];

const STAGE_LABELS: Record<StageFilter, string> = {
  ALL: 'All stages',
  LEAD: 'New Leads',
  APPLICATION: 'Applications',
  ADMITTED: 'Ready To Enroll',
  ACTIVE: 'Active Students',
};

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const ACTIVE_STAGE_KEYS = new Set<PipelineStageKey>(STAGES.map((stage) => stage.key));

export default function AdmissionsList() {
  const { session } = useStore();
  const navigate = useNavigate();

  const [admissions, setAdmissions] = useState<StudentAdmissionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      if (!session.schoolId) {
        setAdmissions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await schoolOpsApi.listAdmissions(session.schoolId);
        if (active) {
          setAdmissions(data);
        }
      } catch {
        if (active) {
          toast.error('Failed to load admissions');
          setAdmissions([]);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [session.schoolId]);

  const stats = useMemo(() => {
    const total = admissions.length;
    const openPipeline = admissions.filter((record) => record.admissionStatus === 'LEAD' || record.admissionStatus === 'APPLICATION').length;
    const readyToEnroll = admissions.filter((record) => record.admissionStatus === 'ADMITTED').length;
    const activeStudents = admissions.filter((record) => record.admissionStatus === 'ACTIVE').length;
    const archived = admissions.filter((record) => !ACTIVE_STAGE_KEYS.has(record.admissionStatus as PipelineStageKey)).length;
    const newestRecord = [...admissions].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )[0];

    return {
      total,
      openPipeline,
      readyToEnroll,
      activeStudents,
      archived,
      newestRecordDate: newestRecord ? formatDate(newestRecord.createdAt) : 'No records yet',
    };
  }, [admissions]);

  const filteredAdmissions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return admissions.filter((record) => {
      const matchesStage = stageFilter === 'ALL' ? true : record.admissionStatus === stageFilter;
      if (!matchesStage) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        record.studentFullName,
        record.guardianName,
        record.guardianPhone,
        record.admissionNo,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [admissions, search, stageFilter]);

  const visibleAdmissions = useMemo(() => {
    const sorted = [...filteredAdmissions];

    sorted.sort((left, right) => {
      if (sortBy === 'name') {
        return getRecordLabel(left).localeCompare(getRecordLabel(right));
      }

      const leftTime = new Date(left.createdAt).getTime();
      const rightTime = new Date(right.createdAt).getTime();
      return sortBy === 'oldest' ? leftTime - rightTime : rightTime - leftTime;
    });

    return sorted;
  }, [filteredAdmissions, sortBy]);

  const visibleStageRecords = useMemo(() => {
    return STAGES.reduce<Record<PipelineStageKey, StudentAdmissionResponse[]>>((acc, stage) => {
      acc[stage.key] = visibleAdmissions.filter((record) => record.admissionStatus === stage.key);
      return acc;
    }, {
      LEAD: [],
      APPLICATION: [],
      ADMITTED: [],
      ACTIVE: [],
    });
  }, [visibleAdmissions]);

  const visibleBoardCount = useMemo(
    () => STAGES.reduce((sum, stage) => sum + visibleStageRecords[stage.key].length, 0),
    [visibleStageRecords],
  );

  const visibleArchivedCount = visibleAdmissions.length - visibleBoardCount;
  const conversionRate = stats.total ? Math.round((stats.activeStudents / stats.total) * 100) : 0;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="admin-management-shell admissions-shell min-h-screen">
      <div className="admin-management-page">
        <section className="admin-management-card admin-management-hero">
          <div className="admin-management-hero-copy">
            <div className="admin-management-eyebrow">Admissions Operations</div>
            <h1 className="admin-management-title">Admissions</h1>
            <p className="admin-management-subtitle">
              Review every stage of student intake in one stable workspace, from first enquiry to fully active student.
            </p>
          </div>

          <div className="admin-management-hero-actions">
            <div className="admin-management-highlight">
              <span>Last intake update</span>
              <strong>{stats.newestRecordDate}</strong>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admissions/new/enroll')}
              className="admin-management-primary"
            >
              <Plus size={15} />
              New Enrollment
            </button>
          </div>
        </section>

        <section className="admin-management-card admin-management-toolbar admissions-toolbar">
          <label className="admin-management-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by student, guardian, phone, or admission number"
              aria-label="Search admissions"
            />
          </label>

          <div className="admissions-toolbar-controls">
            <label className="admissions-select">
              <span>Stage</span>
              <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value as StageFilter)}>
                {Object.entries(STAGE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="admissions-select">
              <span>Sort</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name A-Z</option>
              </select>
            </label>

            <div className="admin-management-toolbar-copy">
              <span>Visible on board</span>
              <strong>
                {visibleBoardCount} of {stats.total}
              </strong>
            </div>
          </div>
        </section>

        <section className="admin-management-stats-grid">
          <StatCard
            label="Total records"
            value={stats.total}
            description="All admissions currently tracked for this school"
          />
          <StatCard
            label="Open pipeline"
            value={stats.openPipeline}
            description="Leads and applications still moving through intake"
          />
          <StatCard
            label="Ready to enroll"
            value={stats.readyToEnroll}
            description="Approved applicants waiting for onboarding completion"
          />
          <StatCard
            label="Active students"
            value={stats.activeStudents}
            description="Admissions already converted into live student records"
          />
        </section>

        <section className="admissions-content-grid">
          <aside className="admin-management-sidebar admissions-sidebar">
            <div className="admin-management-card admin-management-panel">
              <div className="admin-management-panel-heading">
                <div>
                  <div className="admin-management-panel-kicker">Pipeline Snapshot</div>
                  <h2>Stage Totals</h2>
                  <p>Quick visibility into where this intake cycle is stacking up.</p>
                </div>
                <div className="admin-management-panel-icon">
                  <ClipboardList size={18} />
                </div>
              </div>

              <div className="admin-management-mini-grid">
                <MiniStat label="New Leads" value={visibleStageRecords.LEAD.length} tone="blue" />
                <MiniStat label="Applications" value={visibleStageRecords.APPLICATION.length} tone="amber" />
                <MiniStat label="Ready" value={visibleStageRecords.ADMITTED.length} tone="emerald" />
                <MiniStat label="Active" value={visibleStageRecords.ACTIVE.length} tone="violet" />
              </div>

              <div className="admin-management-inline-stat">
                <span>Conversion rate</span>
                <strong>{conversionRate}% active</strong>
              </div>
            </div>

            <div className="admin-management-card admin-management-panel">
              <div className="admin-management-panel-heading">
                <div>
                  <div className="admin-management-panel-kicker">Workflow Notes</div>
                  <h2>Board Guidance</h2>
                  <p>Keep the team aligned on what is visible and what still needs action.</p>
                </div>
                <div className="admin-management-panel-icon">
                  <CalendarDays size={18} />
                </div>
              </div>

              <div className="admissions-guidance-list">
                <div className="admissions-guidance-item">
                  <strong>{STAGE_LABELS[stageFilter]}</strong>
                  <span>Current board filter</span>
                </div>
                <div className="admissions-guidance-item">
                  <strong>{sortBy === 'name' ? 'Name A-Z' : sortBy === 'oldest' ? 'Oldest first' : 'Newest first'}</strong>
                  <span>Current sorting rule</span>
                </div>
                <div className="admissions-guidance-item">
                  <strong>{search.trim() ? `"${search.trim()}"` : 'No keyword filter'}</strong>
                  <span>Search scope for visible records</span>
                </div>
                <div className="admissions-guidance-item">
                  <strong>{stats.archived}</strong>
                  <span>Archived records outside the active board</span>
                </div>
              </div>
            </div>
          </aside>

          <main className="admissions-main">
            <div className="admin-management-card admissions-board-card">
              <div className="admin-management-table-header admissions-board-header">
                <div>
                  <div className="admin-management-panel-kicker">Enrollment Pipeline</div>
                  <h2>Admissions Board</h2>
                  <p>
                    Each column stays readable even when empty, so the team can scan the whole intake pipeline quickly.
                  </p>
                </div>
                <div className="admin-management-table-count">{visibleBoardCount} visible</div>
              </div>

              <div className="admissions-board-grid">
                {STAGES.map((stage) => {
                  const StageIcon = stage.icon;
                  const records = visibleStageRecords[stage.key];

                  return (
                    <section key={stage.key} className={`admissions-stage admissions-tone-${stage.tone}`}>
                      <div className="admissions-stage-header">
                        <div className="admissions-stage-heading">
                          <div className="admissions-stage-icon">
                            <StageIcon size={18} />
                          </div>
                          <div>
                            <h3>{stage.title}</h3>
                            <p>{stage.description}</p>
                          </div>
                        </div>
                        <span className="admissions-stage-count">{records.length}</span>
                      </div>

                      <div className="admissions-stage-body">
                        {records.length > 0 ? (
                          <div className="admissions-record-list">
                            {records.map((record) => (
                              <button
                                key={record.admissionId}
                                type="button"
                                onClick={() => navigate(`/admissions/${record.admissionId}`)}
                                className="admissions-record-card"
                              >
                                <div className="admissions-record-top">
                                  <div>
                                    <div className="admissions-record-name">{getRecordLabel(record)}</div>
                                    <div className="admissions-record-id">{record.admissionNo || 'Pending'}</div>
                                  </div>
                                  <ArrowRight size={16} />
                                </div>

                                <div className="admissions-record-meta">
                                  <MetaRow icon={UserRoundCheck} label={record.guardianName || 'Guardian pending'} />
                                  <MetaRow icon={Phone} label={record.guardianPhone || 'Phone pending'} />
                                  <MetaRow icon={CalendarDays} label={formatDate(record.createdAt)} />
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="admissions-empty-state">
                            <div className="admissions-stage-icon">
                              <StageIcon size={18} />
                            </div>
                            <h3>{stage.emptyTitle}</h3>
                            <p>{stage.emptyDescription}</p>
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>

              {visibleArchivedCount > 0 ? (
                <div className="admissions-board-note">
                  {visibleArchivedCount} matching record{visibleArchivedCount === 1 ? '' : 's'} use archived statuses and are intentionally hidden from the active board.
                </div>
              ) : null}
            </div>
          </main>
        </section>
      </div>
    </div>
  );
}

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

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: 'blue' | 'amber' | 'emerald' | 'violet';
}) {
  return (
    <div className={`admin-management-mini-stat tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MetaRow({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="admissions-meta-row">
      <div className="admissions-meta-icon">
        <Icon size={14} />
      </div>
      <span>{label}</span>
    </div>
  );
}

function getRecordLabel(record: StudentAdmissionResponse) {
  return record.studentFullName || record.guardianName || 'Student pending';
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Date unavailable';
  }
  return DATE_FORMATTER.format(parsed);
}
