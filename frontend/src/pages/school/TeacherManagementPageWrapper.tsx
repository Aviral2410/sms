import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { schoolOpsApi, request, type SchoolUser } from '../../lib/api';
import { toast } from 'sonner';
import { Loader, AlertCircle } from 'lucide-react';
import TeacherManagementPage from './TeacherManagementPage';

export default function TeacherManagementPageWrapper() {
  const { session } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<SchoolUser[]>([]);

  const loadData = async (sess: any) => {
    if (!sess.schoolId) return;
    try {
      setLoading(true);
      const users = await schoolOpsApi.listUsers(sess.schoolId);
      setTeachers(users.filter((u: any) => u.roleName === 'TEACHER'));
    } catch (err: any) {
      setError(err.message || 'Failed to load teacher management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(session);
  }, [session.schoolId]);

  const createSchoolOp = async (path: string, body: any, onSuccess: () => Promise<void>, message: string) => {
    try {
      await request(path, {
        method: 'POST',
        body: JSON.stringify(body),
        skipDefaultBase: true
      });
      toast.success(message);
      await onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };



  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-slate-400">
      <Loader className="animate-spin text-cyan-400" size={24} />
      <span>Synchronizing faculty records...</span>
    </div>
  );

  if (error) return (
    <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 flex items-center gap-3">
      <AlertCircle size={20} />
      <span>{error}</span>
    </div>
  );

  return (
    <TeacherManagementPage
      schoolSession={session}
      teacherUsers={teachers}
      createSchoolOp={createSchoolOp}
      loadSchoolOperations={() => loadData(session)}
    />
  );
}
