import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronDown,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  schoolOpsApi,
  type AcademicClassResponse,
  type StudentAnalyticsResponse,
  type StudentMonitoringReportResponse,
  type StudentRowResponse,
  type StudentUpsertRequest,
  type StudentsPageResponse,
  type TransportRouteFull,
} from '../../lib/api';
import { useStudentsStore } from '../../store/useStudentsStore';
import { StudentDetailsDrawer } from './students/StudentDetailsDrawer';
import { StudentFormModal, type StudentFormValues } from './students/StudentFormModal';
import { StudentsSidebar } from './students/StudentsSidebar';
import { StudentsTable } from './students/StudentsTable';
import { useDebouncedValue } from './students/useDebouncedValue';
import './students/StudentsDashboard.css';

type Props = {
  readonly schoolSession: any;
  readonly classes: AcademicClassResponse[];
  readonly transportRoutes: TransportRouteFull[];
};

const PAGE_SIZE = 8;

export default function StudentManagementPage({ schoolSession, classes, transportRoutes }: Props) {
  const fetchStudents = useStudentsStore((s) => s.fetchStudents);
  const invalidateStudents = useStudentsStore((s) => s.invalidateStudents);

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [transportFilter, setTransportFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('fullName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<StudentsPageResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<StudentRowResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [analytics, setAnalytics] = useState<StudentAnalyticsResponse | null>(null);
  const [allReports, setAllReports] = useState<StudentMonitoringReportResponse[]>([]);
  const [studentReports, setStudentReports] = useState<StudentMonitoringReportResponse[] | null>(null);
  const [studentInsightsLoading, setStudentInsightsLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formLoading, setFormLoading] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);

  const query = useMemo(
    () => ({
      schoolId: schoolSession.schoolId,
      search: debouncedSearch,
      classId: classFilter,
      section: sectionFilter,
      transport: transportFilter,
      status: statusFilter,
      sortBy,
      sortDir,
      page,
      size: PAGE_SIZE,
    }),
    [schoolSession.schoolId, debouncedSearch, classFilter, sectionFilter, transportFilter, statusFilter, sortBy, sortDir, page],
  );

  const sections = useMemo(() => {
    const source =
      classFilter === 'ALL'
        ? classes
        : classes.filter((item) => item.classId === classFilter || item.className === classFilter);
    return Array.from(new Set(source.map((item) => item.sectionName).filter(Boolean))).sort();
  }, [classFilter, classes]);

  useEffect(() => {
    if (!schoolSession.schoolId) return;
    let active = true;

    const run = async () => {
      setLoading(true);
      try {
        const response = await fetchStudents(query);
        if (!active) return;
        setData(response);
      } catch (error: any) {
        if (active) {
          toast.error(error?.message || 'Failed to load students');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [fetchStudents, query, schoolSession.schoolId]);

  useEffect(() => {
    if (!data?.items?.length) {
      setSelectedStudent(null);
      setSelectedIds([]);
      return;
    }

    setSelectedIds((prev) => prev.filter((id) => data.items.some((item) => item.studentUserId === id)));
    setSelectedStudent((prev) => {
      if (prev && data.items.some((item) => item.studentUserId === prev.studentUserId)) {
        return data.items.find((item) => item.studentUserId === prev.studentUserId) || prev;
      }
      return data.items[0];
    });
  }, [data]);

  useEffect(() => {
    if (!schoolSession.schoolId) return;
    let active = true;

    schoolOpsApi
      .listStudentReports(schoolSession.schoolId)
      .then((reportsResult) => {
        if (active) {
          const sorted = [...reportsResult].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          setAllReports(sorted);
        }
      })
      .catch(() => {
        if (active) {
          setAllReports([]);
        }
      });

    return () => {
      active = false;
    };
  }, [schoolSession.schoolId]);

  useEffect(() => {
    if (!schoolSession.schoolId || !selectedStudent?.studentUserId) {
      setAnalytics(null);
      setStudentReports(null);
      return;
    }

    let active = true;
    setStudentInsightsLoading(true);

    Promise.all([
      schoolOpsApi.getStudentAnalytics(schoolSession.schoolId, selectedStudent.studentUserId),
    ])
      .then(([analyticsResult]) => {
        if (!active) return;
        setAnalytics(analyticsResult);
        setStudentReports(
          allReports
            .filter((report) => report.studentUserId === selectedStudent.studentUserId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        );
      })
      .catch(() => {
        if (!active) return;
        setAnalytics(null);
        setStudentReports([]);
      })
      .finally(() => {
        if (active) {
          setStudentInsightsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [allReports, schoolSession.schoolId, selectedStudent?.studentUserId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return;

      if (event.altKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        openCreate();
      }

      if (event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setAdvancedOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const stats = useMemo(() => {
    const rows = data?.items ?? [];
    const totalStudents = data?.total ?? 0;
    const activeStudents = rows.filter((row) => row.status === 'ACTIVE' || row.status === 'ADMITTED').length;
    const assignedTransport = rows.filter((row) => row.transportStatus === 'ASSIGNED').length;
    const latestReportByStudent = new Map<string, StudentMonitoringReportResponse>();
    for (const report of allReports) {
      if (!latestReportByStudent.has(report.studentUserId)) {
        latestReportByStudent.set(report.studentUserId, report);
      }
    }
    const attendanceValues = Array.from(latestReportByStudent.values())
      .map((report) => report.attendancePercentage)
      .filter((value): value is number => typeof value === 'number');
    const averageAttendance = attendanceValues.length
      ? Math.round(attendanceValues.reduce((sum, value) => sum + value, 0) / attendanceValues.length)
      : null;

    return {
      total: totalStudents,
      activePercent: totalStudents ? Math.round((activeStudents / Math.max(rows.length, 1)) * 100) : 0,
      assignedTransportPercent: totalStudents ? Math.round((assignedTransport / Math.max(rows.length, 1)) * 100) : 0,
      averageAttendance,
    };
  }, [allReports, data]);

  const pageCount = useMemo(() => {
    if (!data?.total) return 1;
    return Math.max(1, Math.ceil(data.total / data.size));
  }, [data]);

  const pageNumbers = useMemo(() => {
    const current = (data?.page ?? 0) + 1;
    const start = Math.max(1, current - 2);
    const end = Math.min(pageCount, start + 4);
    const adjustedStart = Math.max(1, end - 4);
    return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
  }, [data?.page, pageCount]);

  const activeFilterCount = useMemo(
    () => [classFilter, sectionFilter, transportFilter, statusFilter].filter((value) => value !== 'ALL').length,
    [classFilter, sectionFilter, transportFilter, statusFilter],
  );

  const refetch = async () => {
    invalidateStudents(schoolSession.schoolId);
    const response = await fetchStudents(query, true);
    setData(response);
  };

  const openCreate = () => {
    setSelectedStudent(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const openEdit = (row: StudentRowResponse) => {
    setSelectedStudent(row);
    setFormMode('edit');
    setFormOpen(true);
  };

  const setFilter = (key: 'classId' | 'section' | 'transport' | 'status', value: string) => {
    setPage(0);
    if (key === 'classId') {
      setClassFilter(value);
      setSectionFilter('ALL');
      return;
    }
    if (key === 'section') setSectionFilter(value);
    if (key === 'transport') setTransportFilter(value);
    if (key === 'status') setStatusFilter(value);
  };

  const resetFilters = () => {
    setPage(0);
    setSearch('');
    setClassFilter('ALL');
    setSectionFilter('ALL');
    setTransportFilter('ALL');
    setStatusFilter('ALL');
  };

  const handleSubmitForm = async (values: StudentFormValues) => {
    setFormLoading(true);
    try {
      const payload: StudentUpsertRequest = {
        schoolId: schoolSession.schoolId,
        fullName: values.fullName,
        email: values.email,
        admissionNo: values.admissionNo,
        rollNo: values.rollNo || null,
        guardianName: values.guardianName,
        contact: values.contact,
        address: values.address || null,
        previousSchool: values.previousSchool || null,
        admissionStatus: values.admissionStatus,
        classId: values.classId || null,
        routeId: values.routeId || null,
        stopId: values.stopId || null,
      };

      if (formMode === 'create') {
        await schoolOpsApi.createStudent(payload);
        toast.success('Student created');
      } else if (selectedStudent) {
        await schoolOpsApi.updateStudentRecord(selectedStudent.studentUserId, payload);
        toast.success('Student updated');
      }

      setFormOpen(false);
      await refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Unable to save student');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (row: StudentRowResponse) => {
    if (!window.confirm(`Remove ${row.fullName} from the active student directory?`)) return;
    try {
      await schoolOpsApi.deleteStudentRecord(schoolSession.schoolId, row.studentUserId);
      toast.success('Student removed');
      await refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Delete failed');
    }
  };

  return (
    <div className="students-dashboard-shell">
      <div className="students-dashboard-container">
        <header className="students-header-panel">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-400 text-[10px] font-black uppercase tracking-widest">
                Operations
              </div>
              <div className="w-1 h-1 bg-slate-700 rounded-full" />
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Student Directory</div>
            </div>
            <h1 className="students-page-title flex items-center gap-4">
              Students
              <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
            </h1>
            <p className="students-page-subtitle max-w-2xl">
              Real-time student registry, class assignments, and operational tracking.
            </p>
          </div>

          <div className="students-header-actions">
            <div className="students-header-shortcut">
              <span>Shortcuts</span>
              <strong>Alt + N add - Alt + K tools</strong>
            </div>
          </div>
        </header>

        <section className="students-toolbar-panel">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full -mr-32 -mt-32" />
          
          <div className="students-toolbar-main">
            <div className="students-search-field">
              <Search className="w-5 h-5 text-slate-500" />
              <input
                value={search}
                onChange={(event) => {
                  setPage(0);
                  setSearch(event.target.value);
                }}
                placeholder="Search name, admission ID, or guardian..."
                aria-label="Search students"
              />
              {search && (
                <button 
                  type="button" 
                  className="students-search-clear" 
                  onClick={() => setSearch('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="students-toolbar-controls">
              <label className="students-inline-select">
                <span>Sort By</span>
                <div className="students-inline-select-value">
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    aria-label="Sort students by"
                  >
                    <option value="fullName">Full Name</option>
                    <option value="admissionNo">Admission ID</option>
                    <option value="createdAt">Registry Date</option>
                  </select>
                  <ChevronDown size={16} className="students-inline-select-caret" />
                </div>
              </label>
                <button
                  type="button"
                  className="students-icon-toggle"
                  onClick={() => setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))}
                  aria-label={sortDir === 'asc' ? 'Switch to descending sort' : 'Switch to ascending sort'}
                >
                  {sortDir === 'asc' ? <ArrowUpAZ size={18} /> : <ArrowDownAZ size={18} />}
                </button>
                <div className="students-toolbar-actions">
                  <button
                    type="button"
                    className="students-secondary-button"
                    onClick={() => setAdvancedOpen(true)}
                  >
                    <SlidersHorizontal size={18} className="text-slate-400" />
                    Advanced
                  </button>
                  <button
                    type="button"
                    className="students-primary-button uppercase tracking-widest text-xs"
                    onClick={openCreate}
                  >
                    <Plus size={18} />
                    Add Student
                  </button>
                </div>
            </div>
          </div>

          <div className="students-filter-row">
            <FilterSelect
              label="Academic Class"
              value={classFilter}
              onChange={(value) => setFilter('classId', value)}
              options={[{ value: 'ALL', label: 'All Classes' }, ...classes.map((item) => ({ value: item.classId, label: item.className }))]}
            />
            <FilterSelect
              label="Assigned Section"
              value={sectionFilter}
              onChange={(value) => setFilter('section', value)}
              options={[{ value: 'ALL', label: 'All Sections' }, ...sections.map((section) => ({ value: section, label: section }))]}
            />
            <FilterSelect
              label="Transport Fleet"
              value={transportFilter}
              onChange={(value) => setFilter('transport', value)}
              options={[
                { value: 'ALL', label: 'All Status' },
                { value: 'ASSIGNED', label: 'Assigned' },
                { value: 'UNASSIGNED', label: 'Unassigned' },
              ]}
            />
            <FilterSelect
              label="Active Status"
              value={statusFilter}
              onChange={(value) => setFilter('status', value)}
              options={[
                { value: 'ALL', label: 'All Students' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'ADMITTED', label: 'Admitted' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'ALUMNI', label: 'Alumni' },
              ]}
            />
          </div>
        </section>

        <aside className="students-sidebar-panel">
          <StudentsSidebar
            stats={stats}
            filters={{
              classId: classFilter,
              section: sectionFilter,
              transport: transportFilter,
              status: statusFilter,
            }}
            classes={classes}
            sections={sections}
            setFilter={setFilter}
            resetFilters={resetFilters}
          />
        </aside>

        <main className="students-main-panel">
          <div className="students-content-card">
            <div className="students-chip-bar">
              <FilterChip label={`Class: ${resolveClassLabel(classes, classFilter)}`} active={classFilter !== 'ALL'} />
              <FilterChip label={`Section: ${sectionFilter === 'ALL' ? 'All' : sectionFilter}`} active={sectionFilter !== 'ALL'} />
              <FilterChip label={`Transport: ${transportFilter === 'ALL' ? 'All' : transportFilter.toLowerCase()}`} active={transportFilter !== 'ALL'} />
              <div className="students-chip-bar-meta">
                Showing {(data?.items?.length ?? 0) > 0 ? page * PAGE_SIZE + 1 : 0}
                {' - '}
                {page * PAGE_SIZE + (data?.items?.length ?? 0)} of {data?.total ?? 0}
              </div>
            </div>

            <StudentsTable
              rows={data?.items || []}
              loading={loading}
              selectedId={selectedStudent?.studentUserId}
              selectedIds={selectedIds}
              page={data?.page ?? 0}
              total={data?.total ?? 0}
              pageSize={data?.size ?? PAGE_SIZE}
              pageCount={pageCount}
              pageNumbers={pageNumbers}
              onView={setSelectedStudent}
              onEdit={openEdit}
              onDelete={handleDelete}
              onSelectRow={(id) =>
                setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
              }
              onSelectAll={setSelectedIds}
              onPageChange={setPage}
            />
          </div>
        </main>

        <aside className="students-drawer-panel">
          <StudentDetailsDrawer
            open={Boolean(selectedStudent)}
            student={selectedStudent}
            analytics={analytics}
            reports={studentReports}
            loading={studentInsightsLoading}
            onClose={() => setSelectedStudent(null)}
          />
        </aside>

        <StudentFormModal
          open={formOpen}
          mode={formMode}
          classes={classes}
          routes={transportRoutes}
          initial={formMode === 'edit' ? selectedStudent : null}
          loading={formLoading}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmitForm}
          schoolId={schoolSession.schoolId}
        />

        <StudentsAdvancedModal
          open={advancedOpen}
          activeFilterCount={activeFilterCount}
          selectedCount={selectedIds.length}
          onClose={() => setAdvancedOpen(false)}
          onResetFilters={() => {
            resetFilters();
            setAdvancedOpen(false);
          }}
          onClearSelection={() => setSelectedIds([])}
          onRefresh={() => {
            refetch();
            setAdvancedOpen(false);
          }}
        />
      </div>
    </div>
  );
}

function FilterChip({ label, active }: { readonly label: string; readonly active?: boolean }) {
  return <div className={`students-filter-chip${active ? ' is-active' : ''}`}>{label}</div>;
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="students-select-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function resolveClassLabel(classes: AcademicClassResponse[], classId: string) {
  if (classId === 'ALL') return 'All';
  return classes.find((item) => item.classId === classId)?.className ?? 'Selected';
}

function StudentsAdvancedModal({
  open,
  activeFilterCount,
  selectedCount,
  onClose,
  onResetFilters,
  onClearSelection,
  onRefresh,
}: {
  readonly open: boolean;
  readonly activeFilterCount: number;
  readonly selectedCount: number;
  readonly onClose: () => void;
  readonly onResetFilters: () => void;
  readonly onClearSelection: () => void;
  readonly onRefresh: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="none"
    >
      <div
        className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,20,40,0.96),rgba(10,15,30,0.92))] p-6 shadow-[0_30px_120px_rgba(2,8,24,0.65)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Advanced student tools"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
              <SlidersHorizontal size={13} />
              Advanced Tools
            </div>
            <h3 className="mt-4 text-2xl font-black tracking-[-0.03em] text-white">Directory actions</h3>
            <p className="mt-2 text-sm text-slate-300">
              Filters active: <span className="font-bold text-white">{activeFilterCount}</span> · Selected:{' '}
              <span className="font-bold text-white">{selectedCount}</span>
            </p>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
            onClick={onClose}
            aria-label="Close advanced tools"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-10 sm:grid-cols-3">
          <button
            type="button"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white transition hover:bg-white/10"
            onClick={onRefresh}
          >
            Refresh List
          </button>
          <button
            type="button"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white transition hover:bg-white/10"
            onClick={onResetFilters}
          >
            Reset Filters
          </button>
          <button
            type="button"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onClearSelection}
            disabled={selectedCount === 0}
          >
            Clear Selection
          </button>
        </div>

        <div className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Tip: press Esc to close.
        </div>
      </div>
    </div>,
    document.body,
  );
}
