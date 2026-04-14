import React from 'react';
import { 
  BarChart2, TrendingUp, Users, 
  Award, Target, Zap, 
  ChevronUp, ChevronDown 
} from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ label, value, trend, trendValue, icon: Icon, color }: any) => (
  <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <div className="p-2.5 rounded-xl bg-white/5 text-white" style={{ color }}>
        <Icon size={18} />
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
        {trend === 'up' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {trendValue}
      </div>
    </div>
    <div>
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">{label}</span>
      <span className="text-2xl font-black text-white">{value}</span>
    </div>
  </div>
);

export const TeacherAnalytics: React.FC = () => {
  return (
    <div className="space-y-8 animate-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Avg. Attendance" value="94.2%" trend="up" trendValue="+2.1%" icon={Users} color="#10b981" />
        <StatCard label="Assignment Completion" value="88.5%" trend="up" trendValue="+5.4%" icon={Zap} color="#3b82f6" />
        <StatCard label="Class Engagement" value="76/100" trend="down" trendValue="-1.2%" icon={Target} color="#f59e0b" />
        <StatCard label="Academic Growth" value="+12.4%" trend="up" trendValue="+0.8%" icon={TrendingUp} color="#8b5cf6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 p-8 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-3xl min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <BarChart2 size={16} className="text-blue-500" /> Class Performance Analytics
            </h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-slate-500">Weekly</span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold text-white">Monthly</span>
            </div>
          </div>
          <div className="flex-1 flex items-end justify-between gap-4 px-4 pb-4">
            {[45, 62, 58, 85, 72, 90, 65, 78, 82, 95, 88, 75].map((h, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.05 }}
                className="w-full bg-gradient-to-t from-blue-600/20 to-blue-400 rounded-t-lg relative group"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 p-2 rounded-lg bg-slate-900 border border-white/10 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                  {h}%
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between px-4 pt-4 border-t border-white/5">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
              <span key={m} className="text-[10px] font-bold text-slate-600">{m}</span>
            ))}
          </div>
        </div>

        {/* Gamification / Badges */}
        <div className="p-8 rounded-[40px] bg-gradient-to-br from-indigo-600/10 via-purple-600/10 to-transparent border border-indigo-500/20 backdrop-blur-3xl">
           <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-8">
            <Award size={16} className="text-indigo-400" /> Teacher Achievements
          </h3>
          <div className="space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] group-hover:scale-110 transition-all">
                <Users size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-white leading-tight">Master Mentor</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Top 5% Engagement</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 group-hover:bg-amber-500 group-hover:text-slate-950 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                <Zap size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-white leading-tight">Fast Feedbacker</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Grade 10 papers in &lt;1hr</p>
              </div>
            </div>
             <div className="flex items-center gap-4 group opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 group-hover:bg-emerald-500 group-hover:text-slate-950 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <Target size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-white leading-tight">Curriculum King</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Complete syllabus 1 week early</p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 rounded-3xl bg-white/5 border border-white/5">
             <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">XP Progress</span>
               <span className="text-[10px] font-black text-indigo-400">Level 12</span>
             </div>
             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[65%]" />
             </div>
             <p className="text-[10px] text-slate-500 mt-3 font-bold">1,240 XP to next level</p>
          </div>
        </div>
      </div>
    </div>
  );
};
