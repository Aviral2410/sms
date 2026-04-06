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

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         r.schoolCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-48">
          <label className="text-xs font-semibold opacity-60 mb-1 block">Status Filter</label>
          <select 
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-accent outline-none appearance-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Requests</option>
            <option value="PENDING">Pending</option>
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
              <span className="icon">🔍</span>
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
          {/* Placeholder for detail view integration */}
          <GlassCard className="detail-preview-card">
            <span className="preview-icon">👁️</span>
            <p>Select a record from the queue to view institutional details and required documentation.</p>
          </GlassCard>
        </aside>
      </div>
    </div>
  );
};

export default AdminQueuePage;
