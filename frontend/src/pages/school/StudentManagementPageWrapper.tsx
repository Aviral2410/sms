import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  schoolOpsApi,
  type AcademicClassResponse,
  type TransportRouteFull,
} from '../../lib/api';
import StudentManagementPage from './StudentManagementPage';

type StudentPageData = {
  classes: AcademicClassResponse[];
  transportRoutes: TransportRouteFull[];
};

export default function StudentManagementPageWrapper() {
  const { session } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StudentPageData>({
    classes: [],
    transportRoutes: [],
  });

  const loadData = useCallback(async () => {
    if (!session.schoolId) return;

    try {
      setLoading(true);
      setError(null);

      const [classes, transportRoutes] = await Promise.all([
        schoolOpsApi.listClasses(session.schoolId),
        schoolOpsApi.getFullTransportDashboard(session.schoolId),
      ]);

      setData({
        classes,
        transportRoutes,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load student management data');
    } finally {
      setLoading(false);
    }
  }, [session.schoolId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-slate-400">
        <Loader className="animate-spin text-cyan-400" size={24} />
        <span>Synchronizing student directory...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 flex items-center gap-3">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <StudentManagementPage
      schoolSession={session}
      classes={data.classes}
      transportRoutes={data.transportRoutes}
    />
  );
}
