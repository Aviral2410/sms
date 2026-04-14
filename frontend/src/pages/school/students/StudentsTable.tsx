import React from 'react';
import {
  Bus,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  Trash2,
  UserRound,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { StudentRowResponse } from '../../../lib/api';

type Props = {
  readonly rows: StudentRowResponse[];
  readonly loading: boolean;
  readonly onView: (row: StudentRowResponse) => void;
  readonly onEdit: (row: StudentRowResponse) => void;
  readonly onDelete: (row: StudentRowResponse) => void;
  readonly selectedId?: string;
  readonly selectedIds: string[];
  readonly onSelectRow: (id: string) => void;
  readonly onSelectAll: (ids: string[]) => void;
  readonly onPageChange: (page: number) => void;
  readonly page: number;
  readonly total: number;
  readonly pageSize: number;
  readonly pageCount: number;
  readonly pageNumbers: number[];
};

export function StudentsTable({
  rows,
  loading,
  onView,
  onEdit,
  onDelete,
  selectedId,
  selectedIds,
  onSelectRow,
  onSelectAll,
  onPageChange,
  page,
  total,
  pageSize,
  pageCount,
  pageNumbers,
}: Props) {
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.studentUserId));
  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min(total, page * pageSize + rows.length);

  return (
    <div className="students-table-shell">
      <div className="students-table-scroll">
        <table className="students-table">
          <thead>
            <tr>
              <th className="students-col-check">
                <button
                  type="button"
                  className={clsx('students-check', allSelected && 'is-active')}
                  onClick={() => onSelectAll(allSelected ? [] : rows.map((row) => row.studentUserId))}
                >
                  {allSelected && <Check size={11} />}
                </button>
              </th>
              <th>Name</th>
              <th>Admission No</th>
              <th>Class / Section</th>
              <th>Roll No</th>
              <th>Guardian</th>
              <th>Transport</th>
              <th className="students-col-actions">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>
                  <div className="students-table-empty">
                    <div className="students-loader" />
                    <span>Loading student directory...</span>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="students-table-empty">
                    <UserRound size={22} />
                    <span>No students matched the current filters.</span>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isSelected = row.studentUserId === selectedId;
                const isChecked = selectedIds.includes(row.studentUserId);
                const initials = row.fullName
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join('');

                return (
                  <tr
                    key={row.studentUserId}
                    className={clsx('students-table-row', (isSelected || isChecked) && 'is-selected')}
                    onClick={() => onView(row)}
                  >
                    <td onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        className={clsx('students-check', isChecked && 'is-active')}
                        onClick={() => onSelectRow(row.studentUserId)}
                      >
                        {isChecked && <Check size={11} />}
                      </button>
                    </td>
                    <td>
                      <div className="students-name-cell">
                        <div className="students-avatar">{initials || 'ST'}</div>
                        <div>
                          <div className="students-name-primary">{row.fullName}</div>
                          <div className="students-name-secondary">{row.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{row.admissionNo || 'N/A'}</td>
                    <td>{formatClass(row.className, row.sectionName)}</td>
                    <td>{row.rollNo || 'N/A'}</td>
                    <td>{row.guardianName || 'N/A'}</td>
                    <td>
                      <span className={clsx('students-transport-badge', row.transportStatus === 'ASSIGNED' && 'is-active')}>
                        <Bus size={12} />
                        {row.transportStatus === 'ASSIGNED' ? row.routeName || 'Assigned' : 'Not Assigned'}
                      </span>
                    </td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <div className="students-row-actions">
                        <button type="button" onClick={() => onView(row)} title="View student">
                          <Eye size={14} />
                        </button>
                        <button type="button" onClick={() => onEdit(row)} title="Edit student">
                          <Edit2 size={14} />
                        </button>
                        <button type="button" onClick={() => onDelete(row)} title="Delete student">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="students-table-footer">
        <div className="students-selection-summary">
          {selectedIds.length > 0 ? `${selectedIds.length} selected` : `Showing ${start}-${end} of ${total}`}
        </div>

        <div className="students-pagination">
          <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 0}>
            <ChevronLeft size={16} />
          </button>
          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              className={clsx(page + 1 === pageNumber && 'is-current')}
              onClick={() => onPageChange(pageNumber - 1)}
            >
              {pageNumber}
            </button>
          ))}
          <button type="button" onClick={() => onPageChange(page + 1)} disabled={page + 1 >= pageCount}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function formatClass(className: string | null, sectionName: string | null) {
  if (className && sectionName) return `${className} / ${sectionName}`;
  return className || sectionName || 'Not Assigned';
}
