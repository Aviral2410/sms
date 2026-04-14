import React from 'react';
import { SchoolOnboardingRecord } from '../../types';
import GlassCard from '../../components/ui/GlassCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

interface AdminQueuePageProps {
  records: SchoolOnboardingRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

const AdminQueuePage = ({ records, selectedId, onSelect, isLoading }: AdminQueuePageProps) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');

  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.schoolName.toLowerCase().includes(searchTerm.toLowerCase())
      || record.schoolCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedRecord = records.find((record) => record.onboardingId === selectedId) || null;

  return (
    <div className="admin-page-container">
      <header className="page-header">
        <h1 className="text-3xl font-bold tracking-tight">Onboarding Queue</h1>
        <p className="text-muted">Manage and review incoming school registration requests.</p>
      </header>

      <div className="queue-controls p-4 glass-panel mb-6 flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-xs font-semibold opacity-60 mb-1 block">Search Schools</label>
          <input
            type="text"
            placeholder="Search name or code..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-accent outline-none transition-all"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="w-48">
          <label className="text-xs font-semibold opacity-60 mb-1 block">Status Filter</label>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-accent outline-none appearance-none cursor-pointer"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All Requests</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="queue-layout">
        <div className="queue-list-section">
          {isLoading ? (
            <div className="loading-state">Syncing platform records...</div>
          ) : filteredRecords.length === 0 ? (
            <GlassCard className="empty-state">
              <span className="icon">Search</span>
              <p>No records match your current filter criteria.</p>
            </GlassCard>
          ) : (
            <div className="queue-stack">
              {filteredRecords.map((record) => (
                <GlassCard
                  key={record.onboardingId}
                  className={`queue-item-card ${selectedId === record.onboardingId ? 'active-selection' : ''}`}
                >
                  <div className="record-meta">
                    <span className="record-code">{record.schoolCode}</span>
                    <Badge status={record.status} />
                  </div>
                  <h3 className="record-title">{record.schoolName}</h3>
                  <div className="record-footer">
                    <span className="record-date">{new Date(record.createdAt).toLocaleDateString()}</span>
                    <Button variant="secondary" onClick={() => onSelect(record.onboardingId)}>
                      Review Details
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        <aside className="queue-sidebar">
          {selectedRecord ? (
            <GlassCard className="detail-preview-card">
              <div className="record-meta mb-3">
                <span className="record-code">{selectedRecord.schoolCode}</span>
                <Badge status={selectedRecord.status} />
              </div>
              <h3 className="record-title mb-2">{selectedRecord.schoolName}</h3>
              <p className="text-sm text-muted mb-3">{selectedRecord.city}, {selectedRecord.state}</p>
              <div className="text-xs text-muted space-y-2">
                <div><strong>Board:</strong> {selectedRecord.boardAffiliation}</div>
                <div><strong>Admin:</strong> {selectedRecord.adminEmail}</div>
                <div><strong>Created:</strong> {new Date(selectedRecord.createdAt).toLocaleString()}</div>
                <div><strong>Reviewer:</strong> {selectedRecord.reviewedBy || 'Not assigned'}</div>
                <div><strong>Comment:</strong> {selectedRecord.reviewComment || 'No comment yet'}</div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="detail-preview-card">
              <span className="preview-icon">Details</span>
              <p>Select a queue record to view full onboarding details.</p>
            </GlassCard>
          )}
        </aside>
      </div>
    </div>
  );
};

export default AdminQueuePage;
