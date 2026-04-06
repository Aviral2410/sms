import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { communicationApi, type AnnouncementResponse } from '../../lib/api';
import { Bell, Calendar, ChevronRight, Info, AlertOctagon, Megaphone } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface AnnouncementFeedProps {
  role: string;
  classId?: string;
  limit?: number;
  title?: string;
}

export default function AnnouncementFeed({ role, classId, limit = 5, title = "Announcements" }: AnnouncementFeedProps) {
  const { session } = useStore();
  const [announcements, setAnnouncements] = useState<AnnouncementResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session.schoolId) return;
    
    setLoading(true);
    communicationApi.listAnnouncements({ 
      schoolId: session.schoolId, 
      role, 
      classId 
    })
    .then(res => {
      setAnnouncements(res.slice(0, limit));
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [session.schoolId, role, classId, limit]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-white/5 rounded-2xl border border-white/5" />
        ))}
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
        <p className="text-slate-500 text-xs italic">No active announcements</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
           <Megaphone size={14} className="text-indigo-400" /> {title}
        </h3>
        <button className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:underline transition-all flex items-center gap-1">
          View All <ChevronRight size={12} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {announcements.map((ann, idx) => (
          <motion.div
            key={ann.announcementId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-4 rounded-2xl border transition-all relative overflow-hidden group ${
              ann.priority === 'HIGH' 
                ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40' 
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            {ann.priority === 'HIGH' && (
              <div className="absolute top-0 right-0 p-2">
                <AlertOctagon size={12} className="text-amber-500" />
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  ann.type === 'ANNOUNCEMENT' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {ann.type}
                </span>
                <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                  <Calendar size={10} /> {new Date(ann.publishedAt).toLocaleDateString()}
                </span>
              </div>
              
              <h4 className={`text-sm font-bold ${ann.priority === 'HIGH' ? 'text-amber-200' : 'text-white'}`}>
                {ann.title}
              </h4>
              
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {ann.content}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
