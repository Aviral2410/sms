import React from 'react';
import { Edit2, Eye, Trash2 } from 'lucide-react';
import type { SchoolUser } from '../../../lib/api';

type Props = {
  teachers: SchoolUser[];
  onView: (teacher: SchoolUser) => void;
  onEdit: (teacher: SchoolUser) => void;
  onDelete: (teacher: SchoolUser) => void;
  selectedId?: string;
  filterText: string;
};

export function TeacherTable({
  teachers,
  onView,
  onEdit,
  onDelete,
  selectedId,
  filterText,
}: Props) {

  return (
    <div className="admin-management-card admin-management-table-card">
      <div className="admin-management-table-header">
        <div>
          <div className="admin-management-panel-kicker">Faculty Directory</div>
          <h2>Teachers</h2>
          <p>Open a profile to review class mapping and performance without leaving the directory.</p>
        </div>
        <div className="admin-management-table-count">{teachers.length} visible</div>
      </div>

      {teachers.length === 0 ? (
        <div className="admin-management-empty-state">
          <h3>No teachers found</h3>
          <p>
            {filterText
              ? `No faculty match "${filterText}". Try a different name or clear the search.`
              : 'Add your first faculty record to start managing assignments and performance.'}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden xl:block overflow-x-auto">
            <table className="admin-management-table">
              <thead>
                <tr>
                  <th>Faculty</th>
                  <th>Contact</th>
                  <th>Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => {

                  return (
                    <tr
                      key={teacher.userId}
                      onClick={() => onView(teacher)}
                      className={teacher.userId === selectedId ? 'is-selected' : ''}
                    >
                      <td>
                        <div className="admin-management-person-cell">
                          <div className="admin-management-avatar">{getInitials(teacher.fullName)}</div>
                          <div>
                            <div className="admin-management-person-name">{teacher.fullName}</div>
                            <div className="admin-management-person-role">{teacher.roleName}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-management-contact">{teacher.email}</div>
                      </td>
                      <td>
                        <div className="admin-management-date">{formatDate(teacher.createdAt)}</div>
                      </td>
                      <td onClick={(event) => event.stopPropagation()}>
                        <div className="admin-management-action-row justify-end">
                          <ActionButton title="View details" onClick={() => onView(teacher)} icon={<Eye size={16} />} />
                          <ActionButton title="Edit profile" onClick={() => onEdit(teacher)} icon={<Edit2 size={16} />} />
                          <ActionButton
                            title="Deactivate teacher"
                            danger
                            onClick={() => onDelete(teacher)}
                            icon={<Trash2 size={16} />}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="admin-management-mobile-list xl:hidden">
            {teachers.map((teacher) => {

              return (
                <article
                  key={teacher.userId}
                  className={`admin-management-mobile-card${teacher.userId === selectedId ? ' is-selected' : ''}`}
                  onClick={() => onView(teacher)}
                >
                  <div className="admin-management-mobile-card-top">
                    <div className="admin-management-person-cell">
                      <div className="admin-management-avatar">{getInitials(teacher.fullName)}</div>
                      <div>
                        <div className="admin-management-person-name">{teacher.fullName}</div>
                        <div className="admin-management-person-role">{teacher.email}</div>
                      </div>
                    </div>
                    <div className="admin-management-mobile-date">{formatDate(teacher.createdAt)}</div>
                  </div>

                  <div className="admin-management-mobile-meta">
                    <div>
                      <span>Role</span>
                      <strong>{teacher.roleName}</strong>
                    </div>
                  </div>

                  <div className="admin-management-action-row" onClick={(event) => event.stopPropagation()}>
                    <ActionButton title="View details" onClick={() => onView(teacher)} icon={<Eye size={16} />} />
                    <ActionButton title="Edit profile" onClick={() => onEdit(teacher)} icon={<Edit2 size={16} />} />
                    <ActionButton
                      title="Deactivate teacher"
                      danger
                      onClick={() => onDelete(teacher)}
                      icon={<Trash2 size={16} />}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ActionButton({
  title,
  icon,
  onClick,
  danger,
}: {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={`admin-management-icon-button${danger ? ' is-danger' : ''}`}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}



function getInitials(fullName: string) {
  const parts = fullName
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return 'T';
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
