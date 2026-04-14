import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  schoolOpsApi,
  type AcademicClassResponse,
  type SubjectResponse,
  type DepartmentResponse,
  type DepartmentHodView,
  type SchoolUser,
  type TeacherSubjectMappingView,
} from '../../lib/api';
import AcademicStructurePage from './AcademicStructurePage';

type AcademicPageData = {
  departments: DepartmentResponse[];
  subjects: SubjectResponse[];
  classes: AcademicClassResponse[];
  teacherUsers: SchoolUser[];
  departmentHods: DepartmentHodView[];
  teacherSubjectMappings: TeacherSubjectMappingView[];
};

type WrapperProps = {
  initialTab?: 'departments' | 'subjects';
};

export default function AcademicStructurePageWrapper({ initialTab }: WrapperProps = {}) {
  const { session } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AcademicPageData>({
    departments: [],
    subjects: [],
    classes: [],
    teacherUsers: [],
    departmentHods: [],
    teacherSubjectMappings: [],
  });

  const loadData = useCallback(async () => {
    if (!session.schoolId) return;

    try {
      setLoading(true);
      setError(null);

      const [departments, subjects, classes, allUsers, hods, teacherSubjectMappingsArr] = await Promise.all([
        schoolOpsApi.listDepartments(session.schoolId),
        schoolOpsApi.listSubjects(session.schoolId),
        schoolOpsApi.listClasses(session.schoolId),
        schoolOpsApi.listUsers(session.schoolId),
        schoolOpsApi.listDepartmentHods(session.schoolId),
        schoolOpsApi.listTeacherSubjectMappings(session.schoolId),
      ]);

      setData({
        departments,
        subjects,
        classes,
        teacherUsers: allUsers.filter((u: any) => u.roleName === 'TEACHER' || u.roleName === 'DEPARTMENT_HEAD' || u.roleName === 'PRINCIPAL'),
        departmentHods: hods,
        teacherSubjectMappings: teacherSubjectMappingsArr,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load academic structure data');
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
        <span>Synchronizing academic structure...</span>
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
    <AcademicStructurePage
      schoolSession={session}
      departments={data.departments}
      subjects={data.subjects}
      classes={data.classes}
      teacherUsers={data.teacherUsers}
      departmentHods={data.departmentHods}
      teacherSubjectMappings={data.teacherSubjectMappings}
      refreshData={loadData}
      initialTab={initialTab}
    />
  );
}
