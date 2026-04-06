import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { schoolOpsApi, ParentWorkspaceResponse } from '../../lib/api';
import { motion } from 'framer-motion';
import { 
  Users, MessageSquare, Calendar, TrendingUp, 
  ChevronRight, Play, Volume2, Globe, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-[#121820] border border-white/5 rounded-2xl p-6 ${className}`}>
    {children}
  </div>
);

const ParentDashboard: React.FC = () => {
  const { session } = useStore();
  const [data, setData] = useState<ParentWorkspaceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session.schoolId && session.email) {
      loadData();
    }
  }, [session.schoolId, session.email]);

  const loadData = async () => {
    try {
      const res = await schoolOpsApi.getParentWorkspace(session.schoolId!, session.email!);
      setData(res);
    } catch (error) {
      toast.error("Failed to load parent workspace");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-[#8b95a2] font-medium">Initializing Workspace...</div>;
  if (!data) return <div className="p-8 text-[#fb7185]">Workspace not found.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[0.7rem] font-bold uppercase tracking-widest text-[#f59e0b] mb-2 px-3 py-1 bg-[#f59e0b]/10 rounded-full w-fit"
          >
            SaaS Parent Portal • {data.schoolCode}
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold text-[#f5efdf] tracking-tight"
          >
            Welcome, <span className="text-white">{data.parent.fullName.split(' ')[0]}</span>
          </motion.h1>
          <p className="text-[#8b95a2] mt-2 font-medium">Monitor your children's academic journey in real-time.</p>
        </div>
        
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[#f5efdf] text-sm font-bold transition-all flex items-center gap-2">
            <Calendar size={16} />
            School Calendar
          </button>
        </div>
      </div>

      {/* Children Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.children.map((child, idx) => (
          <motion.div
            key={child.student.userId}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + idx * 0.1 }}
          >
            <Card className="hover:border-[#f59e0b]/30 transition-colors group cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                <Users size={120} />
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#f59e0b] to-[#fbbf24] rounded-2xl flex items-center justify-center text-[#121820] font-black text-xl shadow-lg shadow-[#f59e0b]/20">
                  {child.student.fullName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{child.student.fullName}</h3>
                  <p className="text-[#8b95a2] text-sm font-bold uppercase tracking-wider">{child.enrolledClass?.className} • Section {child.enrolledClass?.sectionName}</p>
                </div>
                <div className="ml-auto bg-[#34d399]/10 text-[#34d399] text-[0.65rem] font-black px-2 py-1 rounded-md uppercase">Active</div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
                  <p className="text-[0.6rem] font-bold text-[#8b95a2] uppercase tracking-widest mb-1">Attendance</p>
                  <p className="text-lg font-black text-[#f5efdf]">95%</p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
                  <p className="text-[0.6rem] font-bold text-[#8b95a2] uppercase tracking-widest mb-1">GPA</p>
                  <p className="text-lg font-black text-[#f5efdf]">3.8</p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
                  <p className="text-[0.6rem] font-bold text-[#8b95a2] uppercase tracking-widest mb-1">Rank</p>
                  <p className="text-lg font-black text-[#f5efdf]">#4</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#8b95a2] font-bold uppercase tracking-wider">
                  <TrendingUp size={14} className="text-[#34d399]" />
                  Improving performance
                </div>
                <ChevronRight size={18} className="text-[#8b95a2] group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </motion.div>
        ))}
        
        {data.children.length === 0 && (
          <div className="col-span-2 border-2 border-dashed border-white/5 rounded-2xl p-12 text-center text-[#8b95a2]">
            No children linked to your account. Please contact the school admin.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Voice Notes & Messages */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <MessageSquare className="text-[#f59e0b]" />
              Recent Voice Notes
            </h2>
            <button className="text-[#f59e0b] text-sm font-bold hover:underline">View All</button>
          </div>

          <div className="space-y-4">
            {data.recentVoiceNotes.map((vn, idx) => (
              <motion.div
                key={vn.voiceNoteId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
              >
                <div className="bg-[#121820] border border-white/5 rounded-xl p-4 flex gap-4 items-start hover:bg-white/[0.03] transition-colors cursor-pointer group">
                  <button className="w-12 h-12 rounded-full bg-[#f59e0b]/10 flex items-center justify-center text-[#f59e0b] group-hover:scale-110 transition-transform shrink-0">
                    <Play size={20} fill="currentColor" />
                  </button>
                  <div className="flex-1 min-width-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-[#f5efdf] uppercase tracking-wider text-xs truncate">{vn.title}</h4>
                      <span className="text-[0.65rem] text-[#8b95a2] font-medium">{new Date(vn.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[#8b95a2] text-sm line-clamp-1 italic">"{vn.transcript}"</p>
                    
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#f59e0b]/5 border border-[#f59e0b]/10 rounded text-[0.65rem] text-[#f59e0b] font-black uppercase tracking-tighter">
                        <Globe size={10} />
                        Translations Available
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#a78bfa]/5 border border-[#a78bfa]/10 rounded text-[0.65rem] text-[#a78bfa] font-black uppercase tracking-tighter">
                        <Sparkles size={10} />
                        AI Summary
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {data.recentVoiceNotes.length === 0 && (
              <div className="p-8 bg-white/[0.02] border border-dashed border-white/5 rounded-xl text-center text-[#8b95a2] text-sm">
                No recent voice notes.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Stats */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <TrendingUp className="text-[#34d399]" />
            Quick Insight
          </h2>
          <Card className="bg-gradient-to-br from-[#121820] to-[#0f172a] border-[#f59e0b]/20">
            <div className="flex items-center gap-3 text-[#f59e0b] font-black text-[0.65rem] tracking-[0.2em] mb-4 uppercase">
              <Sparkles size={14} />
              AI Recommendation
            </div>
            <p className="text-[#f5efdf] text-lg font-bold leading-snug">
              "Student performs 15% better on morning assessments. Consider scheduling tutoring before 10 AM."
            </p>
            <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[#8b95a2] text-sm font-medium">Confidence Score</span>
                <span className="text-[#34d399] font-black">92%</span>
              </div>
              <button className="w-full py-3 bg-[#f59e0b] text-[#121820] font-black rounded-xl text-sm hover:scale-[1.02] active:scale-95 transition-all">
                Download Full AI Report
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
