import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, MoreVertical, Phone, Calendar, UserCheck } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { StudentAdmission } from '../../types';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { toast } from 'sonner';
import { schoolOpsApi } from '../../lib/api';

export default function AdmissionsList() {
  const { session } = useStore();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<StudentAdmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!session.schoolId) return;
      try {
        const data = await schoolOpsApi.listAdmissions(session.schoolId);
        setLeads(data as StudentAdmission[]);
      } catch {
        toast.error('Failed to load admissions');
        setLeads([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [session.schoolId]);

  if (isLoading) return <DashboardSkeleton />;

  const stages = [
    { key: 'LEAD', title: 'New Leads', color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400' },
    { key: 'APPLICATION', title: 'Applications', color: 'border-orange-500/30 bg-orange-500/5 text-orange-400' },
    { key: 'ADMITTED', title: 'Admitted', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' },
    { key: 'ACTIVE', title: 'Active Students', color: 'border-violet-500/30 bg-violet-500/5 text-violet-400' },
  ];

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight mb-2 text-white">Admissions Pipeline</h1>
          <p className="text-slate-400 text-sm">Select any lead to view context or progress their enrollment.</p>
        </div>
        <button 
          onClick={() => navigate('/admissions/new/enroll')}
          className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
        >
          <Plus className="w-5 h-5" />
          New Enrollment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.admissionStatus === stage.key);
          
          return (
            <div key={stage.key} className="flex flex-col min-w-[300px]">
              <div className={`p-4 rounded-t-2xl border-t border-x ${stage.color} font-bold text-sm flex items-center justify-between backdrop-blur-md`}>
                <span>{stage.title}</span>
                <span className="bg-white/10 px-2 py-0.5 rounded-md text-xs">{stageLeads.length}</span>
              </div>
              <div className="flex-1 bg-slate-900/40 p-4 border-t-0 rounded-b-2xl border-x border-b border-white/5 min-h-[500px] flex flex-col gap-3">
                {stageLeads.map((lead) => (
                  <motion.div 
                    layoutId={lead.admissionId}
                    key={lead.admissionId}
                    onClick={() => navigate(`/admissions/${lead.admissionId}`)}
                    className="p-5 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 hover:border-cyan-500/30 transition-all shadow-lg group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">{lead.guardianName}'s Ward</h4>
                        <span className="text-xs font-semibold text-slate-400 tracking-wider">ID: {lead.admissionNo || 'Pending'}</span>
                      </div>
                      <UserCheck className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    
                    <div className="space-y-2 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500" /> {lead.guardianPhone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" /> Applied: {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {stageLeads.length === 0 && (
                  <div className="h-32 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-sm text-slate-500 font-medium bg-white/5">
                    No leads in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
