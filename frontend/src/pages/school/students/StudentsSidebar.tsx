import React, { useState } from 'react';
import { Activity, Bus, ChevronDown, ChevronUp, RotateCcw, ShieldCheck, Users } from 'lucide-react';
import { clsx } from 'clsx';

type Stats = {
  total: number;
  activePercent: number;
  assignedTransportPercent: number;
  averageAttendance: number | null;
};

type Props = {
  readonly stats: Stats;
  readonly filters: {
    classId: string;
    section?: string;
    transport?: string;
    status?: string;
  };
  readonly classes: Array<{ classId: string; className: string }>;
  readonly sections: string[];
  readonly setFilter: (key: 'classId' | 'section' | 'transport' | 'status', value: string) => void;
  readonly resetFilters?: () => void;
};

export function StudentsSidebar({ stats, filters, classes, sections, setFilter, resetFilters }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    class: true,
    section: true,
    transport: true,
    status: true,
  });

  const classOptions = Array.from(new Map(classes.map((item) => [item.classId, item])).values());

  return (
    <div className="students-sidebar">
      <section className="students-sidecard">
        <div className="students-sidecard-title">Filters</div>
        <div className="students-stats-grid">
          <SidebarStat label="Total Students" value={String(stats.total)} icon={Users} tone="blue" />
          <SidebarStat label="Active" value={`${stats.activePercent}%`} icon={ShieldCheck} tone="green" />
          <SidebarStat label="Transport" value={`${stats.assignedTransportPercent}%`} icon={Bus} tone="amber" />
          <SidebarStat
            label="Avg. Attendance"
            value={stats.averageAttendance === null ? 'N/A' : `${stats.averageAttendance}%`}
            icon={Activity}
            tone="violet"
          />
        </div>
      </section>

      <section className="students-sidecard students-sidecard-grow">
        <div className="students-sidecard-title">Refine Directory</div>

        <Collapsible title="Class" open={expanded.class} onToggle={() => toggle(expanded, setExpanded, 'class')}>
          <div className="students-pill-grid">
            <Pill label="All" active={filters.classId === 'ALL'} onClick={() => setFilter('classId', 'ALL')} />
            {classOptions.map((item) => (
              <Pill
                key={item.classId}
                label={item.className}
                active={filters.classId === item.classId}
                onClick={() => setFilter('classId', item.classId)}
              />
            ))}
          </div>
        </Collapsible>

        <Collapsible title="Section" open={expanded.section} onToggle={() => toggle(expanded, setExpanded, 'section')}>
          <div className="students-pill-grid">
            <Pill label="All" active={filters.section === 'ALL'} onClick={() => setFilter('section', 'ALL')} />
            {sections.map((section) => (
              <Pill
                key={section}
                label={section}
                active={filters.section === section}
                onClick={() => setFilter('section', section)}
              />
            ))}
          </div>
        </Collapsible>

        <Collapsible title="Transport" open={expanded.transport} onToggle={() => toggle(expanded, setExpanded, 'transport')}>
          <div className="students-pill-grid">
            <Pill
              label="Assigned"
              active={filters.transport === 'ASSIGNED'}
              onClick={() => setFilter('transport', 'ASSIGNED')}
            />
            <Pill
              label="Unassigned"
              active={filters.transport === 'UNASSIGNED'}
              onClick={() => setFilter('transport', 'UNASSIGNED')}
            />
          </div>
        </Collapsible>

        <Collapsible title="Status" open={expanded.status} onToggle={() => toggle(expanded, setExpanded, 'status')}>
          <div className="students-pill-grid">
            <Pill label="Active" active={filters.status === 'ACTIVE'} onClick={() => setFilter('status', 'ACTIVE')} />
            <Pill
              label="Admitted"
              active={filters.status === 'ADMITTED'}
              onClick={() => setFilter('status', 'ADMITTED')}
            />
            <Pill
              label="Inactive"
              active={filters.status === 'INACTIVE'}
              onClick={() => setFilter('status', 'INACTIVE')}
            />
            <Pill label="Alumni" active={filters.status === 'ALUMNI'} onClick={() => setFilter('status', 'ALUMNI')} />
          </div>
        </Collapsible>

        <button type="button" className="students-reset-button" onClick={resetFilters}>
          <RotateCcw size={14} />
          Reset Filters
        </button>
      </section>
    </div>
  );
}

function SidebarStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  readonly label: string;
  readonly value: string;
  readonly icon: any;
  readonly tone: 'blue' | 'green' | 'amber' | 'violet';
}) {
  return (
    <div className="students-stat-card">
      <div className={clsx('students-stat-icon', `tone-${tone}`)}>
        <Icon size={14} />
      </div>
      <div className="students-stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function Collapsible({
  title,
  open,
  onToggle,
  children,
}: {
  readonly title: string;
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="students-collapsible">
      <button type="button" className="students-collapsible-header" onClick={onToggle}>
        <span>{title}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="students-collapsible-body">{children}</div>}
    </div>
  );
}

function Pill({ label, active, onClick }: { readonly label: string; readonly active: boolean; readonly onClick: () => void }) {
  return (
    <button type="button" className={clsx('students-filter-pill', active && 'is-active')} onClick={onClick}>
      {label}
    </button>
  );
}

function toggle(
  value: Record<string, boolean>,
  setter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  key: string,
) {
  setter({ ...value, [key]: !value[key] });
}
