import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, FileText, CheckCircle2, User, Phone, MapPin } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { StudentAdmission } from '../../types';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { toast } from 'sonner';
import { schoolOpsApi } from '../../lib/api';

export default function AdmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useStore();
  const [lead, setLead] = useState<StudentAdmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!session.schoolId || !id) return;
      try {
        const data = await schoolOpsApi.listAdmissions(session.schoolId);
        const target = data.find(d => d.admissionId === id);
        if (target) setLead(target as StudentAdmission);
        else toast.error('Admission record not found');
      } catch {
        toast.error('Failed to load admission details');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [session.schoolId, id]);

  if (isLoading) return <DashboardSkeleton />;
  if (!lead) return <div className="text-white p-8">Lead not found</div>;

  return (
    <div className="space-y-6 animate-in max-w-5xl mx-auto">
      <button 
        onClick={() => navigate('/admissions')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Pipeline
      </button>

      <div className="glass-effect p-8 rounded-3xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-white mb-2">{lead.guardianName}'s Ward</h1>
              <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10">ID: {lead.admissionNo || 'Unassigned'}</span>
                <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{lead.admissionStatus}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            {lead.admissionStatus !== 'ACTIVE' && (
              <button 
                onClick={() => navigate(`/admissions/${lead.admissionId}/enroll`)}
                className="flex-1 md:flex-none flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                <CheckCircle2 className="w-5 h-5" /> Execute Enrollment
              </button>
            )}
            <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 transition-all">
              <Edit className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 relative z-10 border-t border-white/5 pt-8">
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-cyan-400" /> Core Details</h3>
            
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Guardian Phone</span>
                <span className="text-slate-200 flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {lead.guardianPhone}</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Address</span>
                <span className="text-slate-200 flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> {lead.address || 'Not provided'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> System Context</h3>
            
            <div className="bg-[#0b0f14]/50 border border-white/5 rounded-xl p-5 space-y-4">
               <div className="flex justify-between items-center pb-4 border-b border-white/5">
                 <span className="text-sm text-slate-400 font-medium">Applied On</span>
                 <span className="text-sm text-slate-200">{new Date(lead.createdAt).toLocaleDateString()}</span>
               </div>
               <div className="flex justify-between items-center pb-4 border-b border-white/5">
                 <span className="text-sm text-slate-400 font-medium">Previous School</span>
                 <span className="text-sm text-slate-200">{lead.previousSchool || 'N/A'}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-slate-400 font-medium">Date of Birth</span>
                 <span className="text-sm text-slate-200">{lead.dateOfBirth || 'Pending Document'}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
