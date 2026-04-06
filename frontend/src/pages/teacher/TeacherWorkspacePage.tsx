import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, BookOpen, Calendar, Clock, 
  Sparkles, CheckCircle, AlertTriangle, 
  ChevronRight, MoreVertical, Search,
  Plus, Play, Filter, LayoutGrid, List as ListIcon,
  ArrowRight, Target, BarChart2, Brain, Loader, RefreshCw
} from 'lucide-react';
import { TeacherAnalytics } from '../../components/teacher/TeacherAnalytics';
import { schoolOpsApi } from '../../lib/api';
import { mcpApi } from '../../lib/mcp';

/* ── UI Components ── */

const ActionCard = ({ title, description, icon: Icon, color, actionLabel, onAction }: any) => (
  <motion.div 
    whileHover={{ y: -4, scale: 1.02 }}
    className="relative overflow-hidden p-6 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl group cursor-pointer"
    onClick={onAction}
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 blur-3xl" style={{ backgroundImage: `linear-gradient(to bottom right, ${color}, transparent)` }} />
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:border-white/20 transition-all text-white">
        <Icon size={20} style={{ color }} />
      </div>
      <Sparkles size={16} className="text-white/20 group-hover:text-white/40 transition-all" />
    </div>
    <h4 className="font-bold text-white mb-1 group-hover:text-white transition-colors">{title}</h4>
    <p className="text-xs text-slate-400 leading-relaxed mb-4">{description}</p>
    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all" style={{ color }}>
      {actionLabel} <ChevronRight size={10} />
    </button>
  </motion.div>
);

const ActiveProgressIndicator = ({ label, progress, status }: { label: string, progress: number, status: string }) => (
  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <span className="text-[10px] font-bold text-accent-primary">{status}</span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
      />
    </div>
  </div>
);

export default function TeacherWorkspacePage() {
  const { session, toggleCopilot, accentColor } = useStore();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
  
  // Mock Data
  const classes = [
    { id: '1', name: 'Class 10-A', subject: 'Mathematics', pupils: 32, attendance: '94%', lastMarked: 'Today, 10:15 AM' },
    { id: '2', name: 'Class 9-C', subject: 'Calculus', pupils: 28, attendance: '88%', lastMarked: 'Yesterday' },
  ];

  return (
    <div className="min-h-screen pb-20 animate-in">
      {/* Header Section */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30`, color: accentColor }}>Live Workspace</span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-slate-500 text-xs font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white mb-2">Morning, {session.fullName?.split(' ')[0]}</h1>
          <p className="text-slate-400 max-w-xl text-sm leading-relaxed font-medium">You have 3 classes today. Your first period starts at 8:30 AM with Class 10-A. AI Copilot has prepared the lesson plan for "Introduction to Derivatives".</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex p-1.5 rounded-2xl bg-white/5 border border-white/5 mr-4">
             <button 
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
             >
                Overview
             </button>
             {session.isPremium && (
               <button 
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'analytics' ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
               >
                  Analytics
               </button>
             )}
          </div>
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
        
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* AI Action Suggestions */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                <Sparkles size={20} style={{ color: accentColor }} /> Smart Suggestions
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ActionCard 
                title="Generate Lesson Plan"
                description="AI-drafted plan for today's Calculus session is ready for review."
                icon={BookOpen}
                color="#3b82f6"
                actionLabel="Review & Sync"
                onAction={() => console.log('Opening Lesson Plan...')}
              />
              <ActionCard 
                title="Student Performance Alert"
                description="3 students in 10-A showed a dip in quiz scores. Analyze roots?"
                icon={AlertTriangle}
                color="#ef4444"
                actionLabel="Drill Down"
                onAction={() => console.log('Analyzing performance...')}
              />
            </div>
          </section>

          {/* Class List Section */}
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
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold cursor-pointer hover:bg-white/10 whitespace-nowrap transition-all">
                Today's Schedule
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold cursor-pointer hover:bg-white/10 whitespace-nowrap transition-all">
                Attendance Pending
              </div>
            </div>

            <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
              {classes.map(cls => (
                <motion.div 
                  key={cls.id}
                  whileHover={{ y: -4 }}
                  className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-white shrink-0">
                      <Users size={22} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                    </div>
                    <button className="p-2 rounded-xl hover:bg-white/5 text-slate-500 transition-all">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-xl font-black text-white tracking-tight leading-none mb-1">{cls.name}</h4>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{cls.subject}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 border-y border-white/5 py-4">
                    <div>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">Pupils</span>
                      <span className="text-sm font-bold text-white">{cls.pupils} Registered</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">Attendance</span>
                      <span className="text-sm font-bold text-white">{cls.attendance} Avg.</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold text-slate-500 italic">Last marked {cls.lastMarked}</p>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-bold hover:bg-amber-500 hover:text-slate-950 transition-all">
                      Open Journal <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
              
              {/* Add New Class Shortcut */}
              <button className="p-6 rounded-3xl border-2 border-dashed border-white/10 bg-transparent hover:border-amber-500/40 hover:bg-amber-500/5 transition-all text-slate-500 flex flex-col items-center justify-center gap-3">
                <div className="p-2 rounded-full border border-current">
                  <Plus size={20} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">New Class Context</span>
              </button>
            </div>
          </section>
        </div>

        {/* Sidebar Controls & Meta */}
        <aside className="lg:col-span-4 space-y-8">
          
          {/* Active Tasks / Progress */}
          <div className="p-8 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none" />
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6 relative">
              <Clock size={16} style={{ color: accentColor }} /> Active Operations
            </h3>
            
            <div className="space-y-6 relative">
              <ActiveProgressIndicator label="10-A Homework Grading" progress={72} status="In Progress" />
              <ActiveProgressIndicator label="Monthly Report Gen" progress={45} status="AI Drafting" />
              <ActiveProgressIndicator label="Timetable Conflict Sync" progress={100} status="Completed" />
              
              <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                View all ongoing tasks
              </button>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Direct Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 rounded-3xl bg-white/5 border border-white/10 text-white flex flex-col gap-3 hover:bg-white/10 transition-all">
                <Plus size={18} className="text-amber-500" />
                <span className="text-xs font-bold leading-none">New Assignment</span>
              </button>
              <button className="p-4 rounded-3xl bg-white/5 border border-white/10 text-white flex flex-col gap-3 hover:bg-white/10 transition-all">
                <Play size={18} className="text-blue-500" />
                <span className="text-xs font-bold leading-none">Launch Lecture</span>
              </button>
            </div>
          </div>

          {/* Premium Plug / Analytics */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Target size={14} />
              </div>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Premium Insight</span>
            </div>
            <h4 className="text-white font-bold text-sm mb-2">Class Engagement Score</h4>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-3xl font-black text-white">82%</span>
              <span className="text-xs text-emerald-500 font-bold mb-1.5">+4.2%</span>
            </div>
            <button className="w-full py-3 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-all">
              Unlock Deep Sentiment Analysis
            </button>
          </div>

        </aside>

        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
