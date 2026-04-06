import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Clock, ArrowRight, UserCheck, UserMinus, AlertTriangle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { AttendanceAnalytics } from '../../types';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { toast } from 'sonner';
import { schoolOpsApi } from '../../lib/api';

export default function AttendanceDashboard() {
  const { session } = useStore();
  const navigate = useNavigate();
  const [data, setData] = useState<AttendanceAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!session.schoolId) return;
      try {
        const now = new Date();
        const year = now.getFullYear();
        const analytics = await schoolOpsApi.getAttendanceAnalytics(
          session.schoolId,
          `${year}-01-01`,
          `${year}-12-31`
        );
        setData(analytics as AttendanceAnalytics);
      } catch {
        toast.error('Failed to load attendance analytics');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [session.schoolId]);

  if (isLoading) return <DashboardSkeleton />;
  if (!data) return <div className="text-white p-8">No Attendance Data Available</div>;

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2">Attendance Operations</h1>
        <p className="text-slate-400">School-wide attendance matrix and daily marking tasks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl group hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-xs px-1">Total Marked Present</h3>
            <UserCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-4xl font-display font-bold text-white tabular-nums">{data.byClass.reduce((acc, c) => acc + c.present, 0)}</p>
          <div className="mt-4 h-1.5 w-full bg-emerald-500/10 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (data.byClass.reduce((acc, c) => acc + c.present, 0) / Math.max(1, data.byClass.reduce((acc, c) => acc + c.total, 0))) * 100)}%` }} />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 backdrop-blur-xl group hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-rose-400 font-bold uppercase tracking-wider text-xs px-1">Total Absent</h3>
            <UserMinus className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-4xl font-display font-bold text-white tabular-nums">{data.byClass.reduce((acc, c) => acc + c.absent, 0)}</p>
          <div className="mt-4 h-1.5 w-full bg-rose-500/10 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, (data.byClass.reduce((acc, c) => acc + c.absent, 0) / Math.max(1, data.byClass.reduce((acc, c) => acc + c.total, 0))) * 100)}%` }} />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-xl group hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-amber-400 font-bold uppercase tracking-wider text-xs px-1">Unmarked Classes</h3>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-4xl font-display font-bold text-white tabular-nums">{data.byClass.filter(c => c.total === 0).length}</p>
          <div className="mt-4 h-1.5 w-full bg-amber-500/10 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: `${(data.byClass.filter(c => c.total === 0).length / Math.max(1, data.byClass.length)) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" /> Marking required for {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </h2>
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase text-slate-400 tracking-widest">
            {data.byClass.length} Total Classes
          </div>
        </div>
        
        {data.byClass.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No active classes found. Head to Class Management to add your first classroom.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.byClass.map((cls) => (
              <motion.div 
                key={cls.classId}
                whileHover={{ y: -2, scale: 1.01 }}
                className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-cyan-500/40 transition-all cursor-pointer group relative overflow-hidden"
                onClick={() => navigate(`/attendance/${cls.classId}/mark`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{cls.className}</h4>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Section {cls.sectionName}</p>
                  </div>
                  <div className={`p-2 rounded-xl transition-colors ${cls.total > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-500 group-hover:text-cyan-400'}`}>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    {cls.total > 0 ? (
                      <>
                        <div className="flex -space-x-1">
                           <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
                           <div className="w-4 h-4 rounded-full bg-rose-500 border-2 border-slate-900" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase">Synced • {cls.present}/{cls.total} Present</span>
                      </>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-500 uppercase flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Awaiting Sync
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
