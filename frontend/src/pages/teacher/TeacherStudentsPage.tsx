import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import { schoolOpsApi, type SchoolUser } from '../../lib/api';
import { Users, Search, Filter, Loader, User, Mail, Shield, ChevronRight, MessageSquare, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DIM = '#8b95a2'; const BORDER = 'rgba(255,255,255,0.07)';

export default function TeacherStudentsPage() {
  const { session, accentColor: BLUE } = useStore();
  const navigate = useNavigate();
  const [students, setStudents] = useState<SchoolUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!session.schoolId) return;
    schoolOpsApi.listUsers(session.schoolId)
      .then(users => {
        // Filter only students for this view
        setStudents(users.filter(u => u.roleName === 'STUDENT'));
      }).finally(() => setLoading(false));
  }, [session.schoolId]);

  const filtered = students.filter(s => s.fullName.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh] gap-3 text-slate-400 font-bold uppercase tracking-widest text-xs">
      <Loader size={20} className="animate-spin text-blue-400" /> Scanning student records...
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8 pb-12">
      <header className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2 w-fit">
          <Users size={12} /> Student Directory
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Active Students</h1>
        <p className="text-slate-400 text-sm">Monitor student progress and manage digital profiles.</p>
      </header>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Find a student by name or email..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm outline-none focus:border-blue-500/50 transition-all font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((s, idx) => (
          <motion.div 
            key={s.userId}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.03 }}
            onClick={() => navigate(`/students/${s.userId}`)}
            className="p-5 rounded-[24px] bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-blue-500/30 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-white/5 flex items-center justify-center text-blue-400 font-black text-lg">
                {s.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold truncate group-hover:text-blue-300 transition-colors">{s.fullName}</h3>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <Shield size={10} className="text-amber-500/70" /> Roll #{(idx + 101)}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-black/20 border border-white/5 mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Mail size={12} className="text-slate-500" /> <span className="truncate">{s.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Star size={12} className="text-amber-500" /> <span className="font-bold text-slate-300">Class 10-A</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
               <button className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors">
                  <MessageSquare size={16} />
               </button>
               <div className="flex items-center gap-1 text-[10px] font-black text-blue-400/80 uppercase tracking-widest">
                  View Profile <ChevronRight size={14} />
               </div>
            </div>
          </motion.div>
        ))}
      </div>

    </motion.div>
  );
}
