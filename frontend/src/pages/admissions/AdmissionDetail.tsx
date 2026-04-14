import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, FileText, CheckCircle2, User, Phone, MapPin, Mail, School, CalendarIcon, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { toast } from 'sonner';
import { schoolOpsApi, type StudentAdmissionResponse } from '../../lib/api';

export default function AdmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useStore();
  const [lead, setLead] = useState<StudentAdmissionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!session.schoolId || !id) return;
      try {
        const data = await schoolOpsApi.listAdmissions(session.schoolId);
        const target = data.find(d => d.admissionId === id);
        if (target) setLead(target);
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
    <div className="max-w-5xl mx-auto py-10 px-6 space-y-8">
      <button 
        onClick={() => navigate('/admissions')}
        className="group flex items-center gap-3 text-slate-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest"
      >
        <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:border-white/20 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </div>
        Back to Pipeline
      </button>

      <div className="bg-slate-900/60 border border-white/10 backdrop-blur-3xl rounded-[48px] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full -mr-48 -mt-48 transition-opacity group-hover:opacity-100" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -ml-32 -mb-32" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-cyan-500/20 border-2 border-white/20 relative group">
              <User className="w-10 h-10 text-white" />
              <div className="absolute inset-0 bg-white/20 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                 <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-black uppercase tracking-widest">{lead.admissionStatus}</span>
                 <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest font-mono">{lead.admissionNo}</span>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tighter mb-2">{lead.studentFullName || lead.guardianName}</h1>
              <p className="text-slate-400 font-medium text-lg">Identity Registry Profile</p>
            </div>
          </div>
          
          <div className="flex flex-wrap lg:flex-nowrap gap-4 w-full lg:w-auto">
            {lead.admissionStatus !== 'ACTIVE' && (
              <button 
                onClick={() => navigate(`/school/students`)}
                className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-widest text-xs"
              >
                <CheckCircle2 className="w-5 h-5" /> Finalize Profile
              </button>
            )}
            <button className="w-14 h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <Edit className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-16 relative z-10 border-t border-white/5 pt-12">
          {/* Left Column: Personal & Guardian */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <div className="w-6 h-px bg-slate-800" /> Identity Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailCard icon={<Mail className="w-4 h-4 text-cyan-400" />} label="Digital Identity" value={lead.studentEmail || 'Not assigned'} />
                <DetailCard icon={<CalendarIcon className="w-4 h-4 text-orange-400" />} label="Birth Date" value={lead.dateOfBirth || 'Pending Document'} />
                <DetailCard icon={<User className="w-4 h-4 text-indigo-400" />} label="Primary Guardian" value={lead.guardianName} className="sm:col-span-2" />
                <DetailCard icon={<Phone className="w-4 h-4 text-emerald-400" />} label="Contact Voice" value={lead.guardianPhone} />
                <DetailCard icon={<MapPin className="w-4 h-4 text-rose-400" />} label="Living Address" value={lead.address || 'Standard Routing'} />
              </div>
            </div>
          </div>

          {/* Right Column: Institutional */}
          <div className="space-y-8">
             <div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <div className="w-6 h-px bg-slate-800" /> Institutional Context
              </h3>
              <div className="bg-slate-950/40 border border-white/5 rounded-[32px] p-8 space-y-6 shadow-inner">
                 <div className="flex justify-between items-center pb-6 border-b border-white/5">
                   <div className="flex items-center gap-3">
                     <CalendarIcon className="w-4 h-4 text-slate-500" />
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enrollment Date</span>
                   </div>
                   <span className="text-sm text-white font-black">{new Date(lead.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                 </div>
                 <div className="flex justify-between items-center pb-6 border-b border-white/5">
                   <div className="flex items-center gap-3">
                     <School className="w-4 h-4 text-slate-500" />
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Previous Record</span>
                   </div>
                   <span className="text-sm text-white font-black truncate max-w-[200px]">{lead.previousSchool || 'Direct Entry'}</span>
                 </div>
                 <div className="flex flex-col gap-4 pt-2">
                    <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl flex items-start gap-4">
                      <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">Onboarding Status</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Record is staged in the admissions pipeline. Proceed to finalization to assign academic group and transport route.</p>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ icon, label, value, className }: { icon: React.ReactNode, label: string, value: string, className?: string }) {
  return (
    <div className={`bg-slate-950/40 border border-white/5 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:border-white/10 ${className}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-white font-bold text-sm truncate">{value}</span>
    </div>
  );
}
