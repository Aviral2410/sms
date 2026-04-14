import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, BookOpen, Calendar, Clock,
  Sparkles, AlertTriangle,
  ChevronRight, LayoutGrid, List as ListIcon,
  ArrowRight, Target, Play, Filter, Loader, RefreshCw
} from 'lucide-react';
import { TeacherAnalytics } from '../../components/teacher/TeacherAnalytics';
import { schoolOpsApi, type AttendanceOverviewResponse, type TeacherWorkspace } from '../../lib/api';
import { hasFeature } from '../../lib/features';
import { toast } from 'sonner';

const ActionCard = ({ title, description, icon: Icon, color, actionLabel, onAction }: any) => (
  <motion.button
    whileHover={{ y: -4, scale: 1.01 }}
    className="relative overflow-hidden p-6 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl text-left"
    onClick={onAction}
  >
    <div className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl" style={{ backgroundImage: `linear-gradient(to bottom right, ${color}, transparent)` }} />
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white">
        <Icon size={20} style={{ color }} />
      </div>
      <Sparkles size={16} className="text-white/20" />
    </div>
    <h4 className="font-bold text-white mb-1">{title}</h4>
    <p className="text-xs text-slate-400 leading-relaxed mb-4">{description}</p>
    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color }}>
      {actionLabel} <ChevronRight size={10} />
    </span>
  </motion.button>
);

export default function TeacherWorkspacePage() {
  const { session, toggleCopilot, accentColor } = useStore();
  const canSeeAnalytics = hasFeature(session.featureCodes, 'AI_VISUALIZATION_PREMIUM');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');

  const [workspace, setWorkspace] = useState<TeacherWorkspace | null>(null);
  const [attendanceOverview, setAttendanceOverview] = useState<AttendanceOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWorkspace = async (silent = false) => {
    if (!session.schoolId || !session.email) return;
    try {
      if (silent) setRefreshing(true); else setLoading(true);
      const [workspaceRes, attendanceRes] = await Promise.all([
        schoolOpsApi.getTeacherWorkspace(session.schoolId, session.email),
        schoolOpsApi.getAttendanceOverview(),
      ]);
      setWorkspace(workspaceRes);
      setAttendanceOverview(attendanceRes);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load teacher workspace.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [session.schoolId, session.email]);

  const classCards = useMemo(() => {
    const byClass = new Map((attendanceOverview?.byClass || []).map((item) => [item.classId, item]));
    const subjectCounts = new Map<string, number>();

    for (const subject of workspace?.assignedSubjects || []) {
      subjectCounts.set(subject.subjectId, (subjectCounts.get(subject.subjectId) || 0) + 1);
    }

    return (workspace?.assignedClasses || []).map((classItem) => {
      const classOverview = byClass.get(classItem.classId);
      return {
        classId: classItem.classId,
        name: `${classItem.className}-${classItem.sectionName}`,
        academicYear: classItem.academicYear,
        attendance: classOverview?.attendancePercentage ?? null,
        presentCount: classOverview?.presentCount ?? null,
        absentCount: classOverview?.absentCount ?? null,
        totalMarks: classOverview?.totalMarks ?? null,
        subjects: workspace?.assignedSubjects.length || 0,
      };
    });
  }, [workspace, attendanceOverview]);

  const smartSuggestions = useMemo(() => {
    const suggestions: Array<{ title: string; description: string; color: string; icon: any; action: string }> = [];

    if (workspace?.scheduleStatus?.toUpperCase() !== 'READY') {
      suggestions.push({
        title: 'Timetable Coordination Pending',
        description: workspace?.scheduleMessage || 'Your schedule still needs final alignment by school admin.',
        color: '#f59e0b',
        icon: AlertTriangle,
        action: 'Open Timetable',
      });
    }

    if ((attendanceOverview?.riskStudents?.length || 0) > 0) {
      suggestions.push({
        title: 'Attendance Risk Follow-up',
        description: `${attendanceOverview?.riskStudents?.length} students are marked as attendance risk.`,
        color: '#ef4444',
        icon: AlertTriangle,
        action: 'Review Risk List',
      });
    }

    suggestions.push({
      title: 'Prepare Today\'s Lesson Plan',
      description: `You are assigned to ${workspace?.assignedClasses.length || 0} classes and ${workspace?.assignedSubjects.length || 0} subjects.`,
      color: '#3b82f6',
      icon: BookOpen,
      action: 'Draft with Copilot',
    });

    return suggestions.slice(0, 3);
  }, [workspace, attendanceOverview]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center gap-3 text-slate-400">
        <Loader size={20} className="animate-spin" /> Loading teacher workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 animate-in">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30`, color: accentColor }}>Live Workspace</span>
            <span className="text-slate-500 text-xs">|</span>
            <span className="text-slate-500 text-xs font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white mb-2">Morning, {session.fullName?.split(' ')[0]}</h1>
          <p className="text-slate-400 max-w-xl text-sm leading-relaxed font-medium">{workspace?.scheduleMessage || 'Your class workspace is synced and ready.'}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex p-1.5 rounded-2xl bg-white/5 border border-white/5 mr-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Overview
            </button>
            {canSeeAnalytics && (
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'analytics' ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Analytics
              </button>
            )}
          </div>
          <button onClick={() => loadWorkspace(true)} className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all">
            <Calendar size={18} style={{ color: accentColor }} /> My Timetable
          </button>
          <button
            onClick={toggleCopilot}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-slate-950 font-black text-sm hover:scale-105 active:scale-95 transition-all"
            style={{ background: accentColor, boxShadow: `0 0 20px ${accentColor}40` }}
          >
            <Sparkles size={18} /> Ask AI assistant
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'analytics' ? (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <TeacherAnalytics />
          </motion.div>
        ) : (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-8 space-y-10">
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                    <Sparkles size={20} style={{ color: accentColor }} /> Smart Suggestions
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {smartSuggestions.map((suggestion) => (
                    <ActionCard
                      key={suggestion.title}
                      title={suggestion.title}
                      description={suggestion.description}
                      icon={suggestion.icon}
                      color={suggestion.color}
                      actionLabel={suggestion.action}
                      onAction={toggleCopilot}
                    />
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">My Active Classes</h3>
                  <div className="flex p-1 rounded-xl bg-white/5 border border-white/10">
                    <button
                      onClick={() => setView('grid')}
                      className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <LayoutGrid size={16} />
                    </button>
                    <button
                      onClick={() => setView('list')}
                      className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <ListIcon size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 mb-6 overflow-x-auto pb-4 scrollbar-hide">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap" style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}40`, color: accentColor }}>
                    <Filter size={14} /> All Classes
                  </div>
                </div>

                <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
                  {classCards.map((cls) => (
                    <motion.div key={cls.classId} whileHover={{ y: -4 }} className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-white shrink-0">
                          <Users size={22} className="text-slate-400" />
                        </div>
                      </div>

                      <div className="mb-6">
                        <h4 className="text-xl font-black text-white tracking-tight leading-none mb-1">{cls.name}</h4>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{cls.academicYear}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6 border-y border-white/5 py-4">
                        <div>
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">Subjects</span>
                          <span className="text-sm font-bold text-white">{cls.subjects}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">Attendance</span>
                          <span className="text-sm font-bold text-white">{cls.attendance != null ? `${cls.attendance.toFixed(1)}%` : 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-bold text-slate-500 italic">
                          Present: {cls.presentCount ?? 0} | Absent: {cls.absentCount ?? 0}
                        </p>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-bold hover:bg-amber-500 hover:text-slate-950 transition-all">
                          Open Journal <ArrowRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="lg:col-span-4 space-y-8">
              <div className="p-8 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-3xl relative overflow-hidden">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                  <Clock size={16} style={{ color: accentColor }} /> Active Operations
                </h3>
                <div className="space-y-4 text-sm text-slate-300">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    Assigned classes: <strong className="text-white">{workspace?.assignedClasses.length || 0}</strong>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    Assigned subjects: <strong className="text-white">{workspace?.assignedSubjects.length || 0}</strong>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    Class-teacher roles: <strong className="text-white">{workspace?.classTeacherOf.length || 0}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Direct Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-4 rounded-3xl bg-white/5 border border-white/10 text-white flex flex-col gap-3 hover:bg-white/10 transition-all">
                    <BookOpen size={18} className="text-amber-500" />
                    <span className="text-xs font-bold leading-none">New Assignment</span>
                  </button>
                  <button className="p-4 rounded-3xl bg-white/5 border border-white/10 text-white flex flex-col gap-3 hover:bg-white/10 transition-all">
                    <Play size={18} className="text-blue-500" />
                    <span className="text-xs font-bold leading-none">Launch Lecture</span>
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Target size={14} />
                  </div>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Live Attendance</span>
                </div>
                <h4 className="text-white font-bold text-sm mb-2">School Attendance Snapshot</h4>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-3xl font-black text-white">{attendanceOverview?.schoolAttendancePercentage?.toFixed(1) ?? '0'}%</span>
                </div>
              </div>
            </aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
