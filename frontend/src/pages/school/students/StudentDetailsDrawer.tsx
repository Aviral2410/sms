import React from 'react';
import { Activity, BookOpen, Bus, Mail, Phone, UserRound, X } from 'lucide-react';
import type {
  StudentAnalyticsResponse,
  StudentMonitoringReportResponse,
  StudentRowResponse,
} from '../../../lib/api';

type Props = {
  readonly student: StudentRowResponse | null;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly analytics: StudentAnalyticsResponse | null;
  readonly reports: StudentMonitoringReportResponse[] | null;
  readonly loading?: boolean;
};

export function StudentDetailsDrawer({ student, open, onClose, analytics, reports, loading = false }: Props) {
  if (!open || !student) {
    return (
      <aside className="students-drawer">
        <div className="students-drawer-empty">
          <BookOpen size={24} />
          <h3>Select a student</h3>
          <p>The details panel will show live academic, attendance, and transport information.</p>
        </div>
      </aside>
    );
  }

  const initials = student.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <aside className="students-drawer">
      <div className="students-drawer-header">
        <div>
          <div className="students-drawer-title">{student.fullName}</div>
          <div className="students-drawer-subtitle">{formatClass(student.className, student.sectionName)}</div>
        </div>
        <button type="button" className="students-drawer-close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="students-drawer-scroll">
        <section className="students-profile-card">
          <div className="students-profile-avatar">{initials || 'ST'}</div>
          <div className="students-profile-copy">
            <strong>{student.fullName}</strong>
            <span>{student.admissionNo || 'No admission number'}</span>
            <span>{student.rollNo ? `Roll ${student.rollNo}` : 'Roll not assigned'}</span>
          </div>
        </section>

        <section className="students-detail-card">
          <div className="students-detail-card-title">Student Overview</div>
          {loading ? (
            <div className="students-detail-loading">Fetching analytics...</div>
          ) : (
            <>
              <div className="students-kpi-row">
                <div>
                  <span>Attendance</span>
                  <strong>
                    {analytics?.attendancePercentage ?? 'N/A'}
                    {analytics ? '%' : ''}
                  </strong>
                </div>
                <MiniTrendChart data={analytics?.attendanceTrend || []} />
              </div>
              <p className="students-muted-copy">
                {analytics?.remarksSummary || 'No remarks summary is available for this student yet.'}
              </p>
            </>
          )}
        </section>

        <section className="students-detail-card">
          <div className="students-detail-card-title">Academic Progress</div>
          {loading ? (
            <div className="students-detail-loading">Loading performance trend...</div>
          ) : analytics?.academicProgress?.length ? (
            <LineChart data={analytics.academicProgress} />
          ) : (
            <p className="students-muted-copy">No academic progress records are available yet.</p>
          )}
        </section>

        <section className="students-detail-card">
          <div className="students-detail-card-title">Contact</div>
          <div className="students-contact-list">
            <DetailItem icon={Mail} label="Email" value={student.email || 'Unavailable'} />
            <DetailItem icon={Phone} label="Phone" value={student.contact || 'Unavailable'} />
            <DetailItem icon={UserRound} label="Guardian" value={student.guardianName || 'Unavailable'} />
          </div>
        </section>

        <section className="students-detail-card">
          <div className="students-detail-card-title">Behavior Overview</div>
          {reports && reports.length > 0 ? (
            <div className="students-timeline">
              {reports.slice(0, 3).map((report) => (
                <article key={report.reportId} className="students-timeline-item">
                  <div className="students-timeline-dot" />
                  <div>
                    <strong>{formatMonth(report.reportMonth, report.academicYear)}</strong>
                    <p>{report.behaviourNote || report.wellbeingNote || report.academicNote || 'No notes recorded.'}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="students-muted-copy">No monitoring reports are available for this student yet.</p>
          )}
        </section>

        <section className="students-detail-card">
          <div className="students-detail-card-title">Transport Route</div>
          {student.transportStatus === 'ASSIGNED' ? (
            <div className="students-transport-card">
              <div className="students-transport-head">
                <Bus size={16} />
                <div>
                  <strong>{student.routeName || 'Assigned route'}</strong>
                  <span>{student.stopId ? 'Stop assigned' : 'Stop not assigned'}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="students-muted-copy">This student is not assigned to a transport route.</p>
          )}
        </section>

        <section className="students-detail-card">
          <div className="students-detail-card-title">Behavior Summary</div>
          <div className="students-summary-banner">
            <Activity size={16} />
            <p>{analytics?.behaviourSummary || 'No behavior summary has been recorded yet.'}</p>
          </div>
        </section>
      </div>
    </aside>
  );
}

function DetailItem({ icon: Icon, label, value }: { readonly icon: any; readonly label: string; readonly value: string }) {
  return (
    <div className="students-contact-row">
      <div className="students-contact-icon">
        <Icon size={14} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function MiniTrendChart({ data }: { readonly data: StudentAnalyticsResponse['attendanceTrend'] }) {
  if (!data.length) {
    return <div className="students-chart-placeholder">No trend</div>;
  }

  const points = toPoints(data, 120, 44);
  return (
    <svg viewBox="0 0 120 44" className="students-mini-chart" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function LineChart({ data }: { readonly data: StudentAnalyticsResponse['academicProgress'] }) {
  const width = 260;
  const height = 116;
  const points = toPoints(data, width, height);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="students-line-chart" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="#7ba3ff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((point, index) => {
        const [x, y] = pointToXY(data, index, width, height);
        return <circle key={`${point.label}-${index}`} cx={x} cy={y} r="3.2" fill="#d8e4ff" />;
      })}
    </svg>
  );
}

function toPoints(data: StudentAnalyticsResponse['attendanceTrend'], width: number, height: number) {
  return data.map((_, index) => pointToXY(data, index, width, height).join(',')).join(' ');
}

function pointToXY(data: StudentAnalyticsResponse['attendanceTrend'], index: number, width: number, height: number) {
  const values = data.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(1, max - min);
  const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * (width - 10) + 5;
  const y = height - ((data[index].value - min) / spread) * (height - 18) - 9;
  return [x, y];
}

function formatClass(className: string | null, sectionName: string | null) {
  if (className && sectionName) return `${className} / ${sectionName}`;
  return className || sectionName || 'Class not assigned';
}

function formatMonth(month: string, year: string) {
  return `${month} ${year}`;
}
