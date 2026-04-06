import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { schoolOpsApi, ParentWorkspaceResponse } from '../../lib/api';
import { motion } from 'framer-motion';
import { Users, ChevronRight, GraduationCap, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import AnnouncementFeed from '../../components/communication/AnnouncementFeed';

const ParentChildrenPage: React.FC = () => {
  const { session } = useStore();
  const navigate = useNavigate();
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
      toast.error("Failed to load children data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-[#8b95a2] font-medium tracking-tight">Loading Profiles...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#f5efdf] flex items-center gap-3">
              <Users className="text-[#f59e0b]" />
              Linked Students
            </h1>
            <p className="text-[#8b95a2] mt-2 font-medium">Manage and view detailed profiles of your children enrolled in {data?.schoolCode}.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data?.children.map((child, idx) => (
              <motion.div
                key={child.student.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group"
              >
                <div 
                  onClick={() => navigate(`/students/${child.student.userId}`)}
                  className="bg-[#121820] border border-white/5 rounded-2xl p-6 hover:border-[#f59e0b]/40 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 bg-[#f59e0b]/10 rounded-2xl flex items-center justify-center text-[#f59e0b] font-black text-2xl group-hover:scale-110 transition-transform">
                      {child.student.fullName[0]}
                    </div>
                    <div className="bg-[#34d399]/10 text-[#34d399] text-[0.6rem] font-black px-2 py-1 rounded-md uppercase tracking-widest">Enrolled</div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1">{child.student.fullName}</h3>
                  <p className="text-[#8b95a2] text-xs font-bold uppercase tracking-wider mb-6">
                    {child.enrolledClass?.className} • {child.enrolledClass?.sectionName}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-[#8b95a2]">
                      <GraduationCap size={16} className="text-[#f59e0b]" />
                      <span className="font-medium text-[#f5efdf]">{child.classTeacher?.fullName || 'No Class Teacher'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#8b95a2]">
                      <Phone size={16} className="text-[#f59e0b]" />
                      <span className="font-medium text-[#f5efdf]">{child.student.email}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-[#f59e0b] font-bold text-sm">
                    View Performance
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <aside className="space-y-8">
           <AnnouncementFeed 
             role="PARENTS" 
             title="School Announcements"
           />
        </aside>
      </div>
    </div>
  );
};


export default ParentChildrenPage;
