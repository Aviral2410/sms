import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { communicationApi, schoolOpsApi, type AnnouncementResponse, type TeacherWorkspace } from '../../lib/api';
import { ClipboardList, Plus, Search, Calendar, Bell, ShieldCheck, Filter, Loader, MoreHorizontal, Send, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const DIM = '#8b95a2'; const BORDER = 'rgba(255,255,255,0.07)';

export default function TeacherNoticesPage() {
  const { session, accentColor: AMBER } = useStore();
  const [notices, setNotices] = useState<AnnouncementResponse[]>([]);
  const [workspace, setWorkspace] = useState<TeacherWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newNotice, setNewNotice] = useState({ 
    title: '', 
    content: '', 
    targetAudience: 'CLASS', 
    targetClassId: '',
    priority: 'NORMAL' as 'NORMAL' | 'HIGH'
  });
  const [reminders, setReminders] = useState<any[]>([]);

  useEffect(() => {
    if (!session.schoolId || !session.email) return;
    setLoading(true);
    Promise.all([
      communicationApi.listAnnouncements({ schoolId: session.schoolId, role: 'TEACHER' }),
      communicationApi.listReminders(session.schoolId),
      schoolOpsApi.getTeacherWorkspace(session.schoolId, session.email)
    ]).then(([noticesRes, remindersRes, workspaceRes]) => {
      setNotices(noticesRes);
      setReminders(remindersRes.slice(0, 3));
      setWorkspace(workspaceRes);
      if (workspaceRes.assignedClasses.length > 0) {
        setNewNotice(prev => ({ ...prev, targetClassId: workspaceRes.assignedClasses[0].classId }));
      }
    }).catch(e => setErr(e.message)).finally(() => setLoading(false));
  }, [session.schoolId, session.email]);

  const handlePost = async () => {
    if (!newNotice.title || !newNotice.content || !session.schoolId) {
      toast.error('Please fill in title and content');
      return;
    }
    
    try {
      const resp = await communicationApi.createAnnouncement({
        ...newNotice,
        schoolId: session.schoolId,
        type: 'NOTICE',
        publishedAt: new Date().toISOString(),
        createdBy: session.userId || ''
      });
      setNotices(prev => [resp, ...prev]);
      toast.success('Notice published to ' + newNotice.targetAudience);
      setShowNew(false);
      setNewNotice(prev => ({ ...prev, title: '', content: '' }));
    } catch (e: any) {
      toast.error('Failed to post: ' + e.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh] gap-3 text-slate-400 font-bold uppercase tracking-widest text-xs">
      <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" /> Loading notice board...
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest mb-2">
            <Bell size={12} /> Institutional Communication
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Notice Board</h1>
          <p className="text-slate-500 text-sm mt-1">Broadcast important updates to your classes and the school</p>
        </div>
        <button 
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 text-black font-black text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(251,191,36,0.3)] pointer-events-auto"
        >
          <Plus size={20} strokeWidth={3} /> Post New Notice
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {notices.length === 0 ? (
            <div className="p-12 text-center text-slate-600 italic border border-dashed border-white/10 rounded-3xl">
              No notices published yet.
            </div>
          ) : notices.map((n, idx) => (
            <motion.div 
              key={n.announcementId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col gap-4 relative overflow-hidden"
            >
              {n.priority === 'HIGH' && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                      {n.title}
                      {n.priority === 'HIGH' && <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full uppercase">High Priority</span>}
                    </h3>
                    <div className="flex items-center gap-3 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      <span className="text-amber-500/80">@{n.targetAudience}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(n.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <button className="text-slate-600 hover:text-white transition-colors"><MoreHorizontal size={20}/></button>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{n.content}</p>
            </motion.div>
          ))}
        </div>

        <aside className="flex flex-col gap-6">
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col gap-4">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Plus size={14} className="text-amber-500" /> Active Reminders
            </h4>
            <div className="flex flex-col gap-3">
              {reminders.length > 0 ? reminders.map((r: any) => (
                <div key={r.reminderId} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                  <div className="text-sm font-bold text-white">{r.message}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: r.reminderStatus === 'URGENT' ? '#ef4444' : '#a78bfa' }}>
                    {r.reminderType} • {new Date(r.dueAt).toLocaleDateString()}
                  </div>
                </div>
              )) : (
                <div className="text-slate-600 text-xs py-4 text-center italic">No active reminders</div>
              )}
            </div>
          </div>
          
          <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex flex-col gap-3">
             <div className="flex items-center gap-2 text-amber-500">
               <AlertTriangle size={16} />
               <h4 className="text-xs font-black uppercase tracking-widest">Notice Tip</h4>
             </div>
             <p className="text-[11px] text-slate-400 leading-relaxed">
               Class-specific notices are immediately visible to students and parents of the selected class. High priority notices will be highlighted.
             </p>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {showNew && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md pointer-events-auto">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="w-full max-w-lg bg-[#121820] border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden pointer-events-auto"
            >
              <h2 className="text-2xl font-black text-white mb-6">Create New Notice</h2>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Subject Header</label>
                   <input 
                    type="text" 
                    placeholder="e.g. Extra Class for Mathematics"
                    value={newNotice.title}
                    onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-amber-500/50"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Notice Content</label>
                   <textarea 
                    placeholder="Write your message here..."
                    value={newNotice.content}
                    onChange={e => setNewNotice({...newNotice, content: e.target.value})}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-amber-500/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Audience</label>
                    <select 
                      value={newNotice.targetAudience}
                      onChange={e => setNewNotice({...newNotice, targetAudience: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-amber-500/50"
                    >
                      <option value="CLASS">CLASS</option>
                      <option value="ALL">ALL SCHOOL</option>
                      <option value="TEACHERS">TEACHERS ONLY</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Priority</label>
                    <select 
                      value={newNotice.priority}
                      onChange={e => setNewNotice({...newNotice, priority: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-amber-500/50"
                    >
                      <option value="NORMAL">NORMAL</option>
                      <option value="HIGH">HIGH</option>
                    </select>
                  </div>
                </div>

                {newNotice.targetAudience === 'CLASS' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Select Target Class</label>
                    <select 
                      value={newNotice.targetClassId}
                      onChange={e => setNewNotice({...newNotice, targetClassId: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-amber-500/50"
                    >
                      <option value="">Select a class...</option>
                      {workspace?.assignedClasses.map(c => (
                        <option key={c.classId} value={c.classId}>{c.className} - {c.sectionName}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button onClick={() => setShowNew(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all">Discard</button>
                  <button onClick={handlePost} className="flex-1 py-4 rounded-2xl bg-amber-500 text-black font-black hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-xl"><Send size={18}/> Publish</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

