import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  CheckCircle2, 
  Loader2, 
  ClipboardList,
  ArrowLeft,
  Sparkles,
  User,
  ShieldCheck,
  Globe,
  MapPin,
  Smartphone,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'sonner';
import { schoolOpsApi } from '../../lib/api';

export default function EnrollmentWizard() {
  const navigate = useNavigate();
  const { session } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoadingAdmissionNo, setIsLoadingAdmissionNo] = useState(false);
  
  const [formData, setFormData] = useState({
    studentFullName: '',
    studentEmail: '',
    studentPhone: '',
    admissionNo: '',
    admittedOn: new Date().toISOString().split('T')[0],
    dateOfBirth: '',
    guardianName: '',
    guardianPhone: '',
    address: '',
    previousSchool: '',
  });

  const refreshAdmissionNo = useCallback(async () => {
    if (!session.schoolId) return;
    setIsLoadingAdmissionNo(true);
    try {
      const response = await schoolOpsApi.getNextAdmissionNumber(session.schoolId);
      setFormData((current) => ({ ...current, admissionNo: response.admissionNo }));
    } catch (error: any) {
      toast.error(error?.message || 'Unable to allocate admission number');
    } finally {
      setIsLoadingAdmissionNo(false);
    }
  }, [session.schoolId]);

  useEffect(() => {
    refreshAdmissionNo();
  }, [refreshAdmissionNo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.schoolId) return toast.error('Missing school context');
    
    // Basic validation
    if (!formData.studentFullName || !formData.studentEmail) {
      return toast.error('Student name and email are required');
    }
    if (!formData.guardianName || !formData.guardianPhone) {
      return toast.error('Guardian details are required');
    }

    setIsSubmitting(true);
    try {
      await schoolOpsApi.createAdmission({
        schoolId: session.schoolId,
        studentFullName: formData.studentFullName.trim(),
        studentEmail: formData.studentEmail.trim(),
        admissionNo: formData.admissionNo.trim() || null,
        admittedOn: formData.admittedOn,
        dateOfBirth: formData.dateOfBirth || null,
        guardianName: formData.guardianName.trim(),
        guardianPhone: formData.guardianPhone.trim(),
        address: formData.address.trim() || null,
        previousSchool: formData.previousSchool.trim() || null,
        admissionStatus: 'ACTIVE',
        classId: null, // No longer required during enrollment
      });

      toast.success('Student enrolled successfully');
      setIsSuccess(true);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to complete enrollment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto pt-20 px-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="p-16 rounded-[48px] bg-slate-900/40 border border-emerald-500/20 backdrop-blur-3xl shadow-[0_0_80px_rgba(16,185,129,0.1)]"
        >
          <div className="w-28 h-28 bg-emerald-500/10 rounded-[36px] flex items-center justify-center border-2 border-emerald-500/50 mx-auto mb-10 relative">
            <CheckCircle2 className="w-14 h-14 text-emerald-400" />
            <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute inset-0 bg-emerald-500/20 rounded-[36px]"
            />
          </div>
          <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Enrollment Finalized</h2>
          <p className="text-slate-400 text-lg mb-12 max-w-md mx-auto">
            <span className="text-white font-bold">{formData.studentFullName}</span> has been successfully added to the system. You can now assign them to a class in the student management dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/admissions')}
              className="px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95"
            >
              View Pipeline
            </button>
            <button 
              onClick={() => {
                setIsSuccess(false);
                setFormData({
                    ...formData,
                    studentFullName: '',
                    studentEmail: '',
                    studentPhone: '',
                    admissionNo: '',
                    dateOfBirth: '',
                    guardianName: '',
                    guardianPhone: '',
                    address: '',
                    previousSchool: '',
                });
                refreshAdmissionNo();
              }}
              className="px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
            >
              Enroll Another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pt-10 pb-24 px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-[10px] font-black uppercase tracking-widest">
               Admissions Module
             </div>
             <div className="w-1 h-1 bg-slate-700 rounded-full" />
             <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Step 1: Record Identity</div>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter flex items-center gap-4">
            New Enrollment
            <Sparkles className="w-10 h-10 text-yellow-400" />
          </h1>
          <p className="text-slate-400 mt-4 text-xl font-medium max-w-lg leading-relaxed">
            Record core student and guardian details. Class and transport routing will be finalized during onboarding.
          </p>
        </div>
        
        <button 
          onClick={() => navigate('/admissions')}
          className="group self-start md:self-center flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-300 hover:text-white transition-all shadow-2xl backdrop-blur-md"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold">Back to Pipeline</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Section 1: Identity Card */}
        <section className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-[40px] blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative p-10 rounded-[40px] bg-slate-900/60 border border-white/10 backdrop-blur-2xl shadow-3xl">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <User className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Student Identity</h3>
                <p className="text-slate-500 text-sm font-medium">Core information for student records</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-300 ml-1">
                  Full Legal Name
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                </label>
                <input 
                  required
                  value={formData.studentFullName} 
                  onChange={e => setFormData({...formData, studentFullName: e.target.value})}
                  placeholder="e.g. Alexander Pierce" 
                  className="w-full bg-slate-950/40 border border-white/5 focus:border-cyan-500/50 rounded-2xl px-6 py-5 text-white font-medium focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all placeholder:text-slate-600 shadow-inner" 
                />
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-300 ml-1">
                  Primary Email Address
                  <Globe className="w-3 h-3 text-cyan-400" />
                </label>
                <input 
                  required
                  type="email"
                  value={formData.studentEmail} 
                  onChange={e => setFormData({...formData, studentEmail: e.target.value})}
                  placeholder="alex@example.com" 
                  className="w-full bg-slate-950/40 border border-white/5 focus:border-cyan-500/50 rounded-2xl px-6 py-5 text-white font-medium focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all placeholder:text-slate-600 shadow-inner" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-300 ml-1">Date of Birth</label>
                <input 
                  type="date"
                  value={formData.dateOfBirth} 
                  onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
                  className="w-full bg-slate-950/40 border border-white/5 focus:border-cyan-500/50 rounded-2xl px-6 py-5 text-white font-medium focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all [color-scheme:dark] shadow-inner" 
                />
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-300 ml-1">
                  Contact Number
                  <Smartphone className="w-3 h-3 text-cyan-400" />
                </label>
                <input 
                  value={formData.studentPhone} 
                  onChange={e => setFormData({...formData, studentPhone: e.target.value})}
                  placeholder="+1 (555) 000-0000" 
                  className="w-full bg-slate-950/40 border border-white/5 focus:border-cyan-500/50 rounded-2xl px-6 py-5 text-white font-medium focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all placeholder:text-slate-600 shadow-inner" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Guardian Info Card */}
        <section className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 to-rose-500/20 rounded-[40px] blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative p-10 rounded-[40px] bg-slate-900/60 border border-white/10 backdrop-blur-2xl shadow-3xl">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <UserPlus className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Guardian Support</h3>
                <p className="text-slate-500 text-sm font-medium">Primary emergency and billing contact</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label htmlFor="guardianName" className="text-sm font-bold text-slate-300 ml-1">Guardian Name</label>
                <input 
                  id="guardianName"
                  required
                  value={formData.guardianName} 
                  onChange={e => setFormData({...formData, guardianName: e.target.value})}
                  placeholder="Full name of guardian" 
                  className="w-full bg-slate-950/40 border border-white/5 focus:border-orange-500/50 rounded-2xl px-6 py-5 text-white font-medium focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder:text-slate-600 shadow-inner" 
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="emergencyPhone" className="text-sm font-bold text-slate-300 ml-1">Emergency Phone</label>
                <input 
                  id="emergencyPhone"
                  required
                  value={formData.guardianPhone} 
                  onChange={e => setFormData({...formData, guardianPhone: e.target.value})}
                  placeholder="+1 (555) 000-0000" 
                  className="w-full bg-slate-950/40 border border-white/5 focus:border-orange-500/50 rounded-2xl px-6 py-5 text-white font-medium focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder:text-slate-600 shadow-inner" 
                />
              </div>
              <div className="md:col-span-2 space-y-3">
                <label htmlFor="address" className="flex items-center gap-2 text-sm font-bold text-slate-300 ml-1">
                  Residential Address
                  <MapPin className="w-3 h-3 text-orange-400" />
                </label>
                <textarea 
                  id="address"
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  placeholder="Complete home address for transport evaluation..." 
                  rows={3}
                  className="w-full bg-slate-950/40 border border-white/5 focus:border-orange-500/50 rounded-[24px] px-6 py-5 text-white font-medium focus:ring-4 focus:ring-orange-500/10 outline-none transition-all resize-none placeholder:text-slate-600 leading-relaxed shadow-inner" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Background Card */}
        <section className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-[40px] blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative p-10 rounded-[40px] bg-slate-900/60 border border-white/10 backdrop-blur-2xl shadow-3xl">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ClipboardList className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Institutional Background</h3>
                <p className="text-slate-500 text-sm font-medium">Previous academic history and system IDs</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label htmlFor="admissionNo" className="text-sm font-bold text-slate-300 ml-1">Proposed Admission No.</label>
                <input 
                  id="admissionNo"
                  disabled
                  value={isLoadingAdmissionNo ? 'Allocating admission number...' : formData.admissionNo} 
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-slate-500 cursor-not-allowed font-mono text-lg shadow-inner" 
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="admissionDate" className="text-sm font-bold text-slate-300 ml-1">Official Admission Date</label>
                <input 
                  id="admissionDate"
                  type="date"
                  value={formData.admittedOn} 
                  onChange={e => setFormData({...formData, admittedOn: e.target.value})}
                  className="w-full bg-slate-950/40 border border-white/5 focus:border-emerald-500/50 rounded-2xl px-6 py-5 text-white font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all [color-scheme:dark] shadow-inner" 
                />
              </div>
              <div className="md:col-span-2 space-y-3">
                <label htmlFor="prevSchool" className="text-sm font-bold text-slate-300 ml-1">Previous School (if applicable)</label>
                <input 
                  id="prevSchool"
                  value={formData.previousSchool} 
                  onChange={e => setFormData({...formData, previousSchool: e.target.value})}
                  placeholder="The last educational institution attended" 
                  className="w-full bg-slate-950/40 border border-white/5 focus:border-emerald-500/50 rounded-2xl px-6 py-5 text-white font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-600 shadow-inner" 
                />
              </div>
            </div>
          </div>
        </section>

        <div className="pt-4 flex flex-col items-center">
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full max-w-xl py-6 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:scale-[1.02] active:scale-95 text-white font-black text-xl rounded-[32px] transition-all shadow-[0_20px_40px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:grayscale disabled:scale-100 uppercase tracking-[0.2em] relative overflow-hidden group/btn"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin" />
                Processing Enrollment...
              </span>
            ) : (
              <span className="relative z-10 flex items-center justify-center gap-3">
                Complete Enrollment
                <ChevronRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
              </span>
            )}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
          </button>
          
          <p className="mt-8 text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] flex items-center gap-4 opacity-70">
            <span className="w-12 h-px bg-slate-800" />
            SECURE ADMISSION REGISTRY
            <span className="w-12 h-px bg-slate-800" />
          </p>
        </div>
      </form>
    </div>
  );
}
