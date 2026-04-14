import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import {
  schoolOpsApi,
  type AcademicClassResponse,
  type ClassSubjectTeacherMappingView,
  type SchoolUser,
  type StudentClassEnrollmentResponse,
  type SubjectResponse,
} from '../../lib/api';
import ClassManagementPage from './ClassManagementPage';
import { Loader, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

type ClassManagementData = {
  classes: AcademicClassResponse[];
  subjects: SubjectResponse[];
  classSubjectTeacherMappings: ClassSubjectTeacherMappingView[];
  teacherUsers: SchoolUser[];
  classEnrollmentCounts: Record<string, number>;
};

export default function ClassManagementPageWrapper() {
  const { session } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ClassManagementData>({
    classes: [],
    subjects: [],
    classSubjectTeacherMappings: [],
    teacherUsers: [],
    classEnrollmentCounts: {},
  });

  const [classForm, setClassForm] = useState({ className: '', sectionName: '', academicYear: '2026-2027' });

  const loadData = useCallback(async () => {
    if (!session.schoolId) return;

    try {
      setLoading(true);
      setError(null);

      const [classes, users, studentEnrollments, subjects, mappings] = await Promise.all([
        schoolOpsApi.listClasses(session.schoolId),
        schoolOpsApi.listUsers(session.schoolId),
        schoolOpsApi.listStudentEnrollments(session.schoolId),
        schoolOpsApi.listSubjects(session.schoolId),
        schoolOpsApi.listClassSubjectTeacherMappings(session.schoolId),
      ]);

      // Note: Backend might not have a direct "listClassTeachers" but we can infer or use listUsers for now.
      // Ideally, there should be an endpoint for class-teacher mappings.
      // For now, we'll just show the classes list since the goal is onboarding.
      
      const counts: Record<string, number> = {};
      studentEnrollments.forEach((e: StudentClassEnrollmentResponse) => {
        counts[e.classId] = (counts[e.classId] || 0) + 1;
      });

      setData({
        classes,
        subjects,
        classSubjectTeacherMappings: mappings,
        teacherUsers: users.filter((u: any) => u.roleName === 'TEACHER'),
        classEnrollmentCounts: counts
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load class data');
    } finally {
      setLoading(false);
    }
  }, [session.schoolId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createSchoolOp = async (path: string, body: any, onSuccess: () => Promise<void>, message: string) => {
    try {
      await schoolOpsApi.createClass(body);
      toast.success(message);
      await onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-slate-400">
        <Loader className="animate-spin text-cyan-400" size={24} />
        <span>Synchronizing class registry...</span>
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
    <ClassManagementPage
      schoolSession={session}
      classes={data.classes}
      classForm={classForm}
      setClassForm={setClassForm}
      initialClassForm={{ className: '', sectionName: '', academicYear: '2026-2027' }}
      subjects={data.subjects}
      teacherUsers={data.teacherUsers}
      classSubjectTeacherMappings={data.classSubjectTeacherMappings}
      classEnrollmentCounts={data.classEnrollmentCounts}
      createSchoolOp={createSchoolOp}
      loadSchoolOperations={loadData}
    />
  );
}
