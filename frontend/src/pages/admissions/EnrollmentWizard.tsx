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
      <div className="mx-auto max-w-2xl px-4 pt-10 text-center sm:px-6 sm:pt-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[28px] border border-emerald-500/20 bg-slate-900/40 p-6 shadow-[0_0_80px_rgba(16,185,129,0.1)] backdrop-blur-3xl sm:rounded-[48px] sm:p-10 lg:p-16"
        >
          <div className="relative mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[28px] border-2 border-emerald-500/50 bg-emerald-500/10 sm:mb-10 sm:h-28 sm:w-28 sm:rounded-[36px]">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 sm:h-14 sm:w-14" />
            <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute inset-0 bg-emerald-500/20 rounded-[36px]"
            />
          </div>
          <h2 className="mb-4 text-3xl font-black tracking-tight text-white sm:text-4xl">Enrollment Finalized</h2>
          <p className="mx-auto mb-8 max-w-md text-base text-slate-400 sm:mb-12 sm:text-lg">
            <span className="text-white font-bold">{formData.studentFullName}</span> has been successfully added to the system. You can now assign them to a class in the student management dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/admissions')}
              className="rounded-2xl bg-emerald-500 px-6 py-4 font-black text-slate-900 shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] hover:bg-emerald-400 active:scale-95 sm:px-10 sm:py-5"
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
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-bold text-white transition-all hover:scale-[1.02] hover:bg-white/10 active:scale-95 sm:px-10 sm:py-5"
            >
              Enroll Another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-6 sm:px-6 sm:pb-24 sm:pt-10">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-6 md:mb-16 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-[10px] font-black uppercase tracking-widest">
               Admissions Module
             </div>
             <div className="w-1 h-1 bg-slate-700 rounded-full" />
             <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Step 1: Record Identity</div>
          </div>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tighter text-white sm:gap-4 sm:text-5xl">
            New Enrollment
            <Sparkles className="h-7 w-7 text-yellow-400 sm:h-10 sm:w-10" />
          </h1>
          <p className="mt-4 max-w-lg text-base font-medium leading-relaxed text-slate-400 sm:text-xl">
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
          <div className="absolute -inset-0.5 rounded-[28px] bg-gradient-to-r from-cyan-500/20 to-violet-500/20 blur opacity-0 transition duration-1000 group-hover:opacity-100 group-hover:duration-200 sm:rounded-[40px]"></div>
          <div className="relative rounded-[28px] border border-white/10 bg-slate-900/60 p-5 shadow-3xl backdrop-blur-2xl sm:rounded-[40px] sm:p-8 lg:p-10">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <User className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Student Identity</h3>
                <p className="text-slate-500 text-sm font-medium">Core information for student records</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
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
                  className="w-full rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-4 font-medium text-white shadow-inner outline-none transition-all placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 sm:px-6 sm:py-5" 
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
                  className="w-full rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-4 font-medium text-white shadow-inner outline-none transition-all placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 sm:px-6 sm:py-5" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-300 ml-1">Date of Birth</label>
                <input 
                  type="date"
                  value={formData.dateOfBirth} 
                  onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
                  className="w-full rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-4 font-medium text-white shadow-inner outline-none transition-all [color-scheme:dark] focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 sm:px-6 sm:py-5" 
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
                  className="w-full rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-4 font-medium text-white shadow-inner outline-none transition-all placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 sm:px-6 sm:py-5" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Guardian Info Card */}
        <section className="relative group">
          <div className="absolute -inset-0.5 rounded-[28px] bg-gradient-to-r from-orange-500/20 to-rose-500/20 blur opacity-0 transition duration-1000 group-hover:opacity-100 group-hover:duration-200 sm:rounded-[40px]"></div>
          <div className="relative rounded-[28px] border border-white/10 bg-slate-900/60 p-5 shadow-3xl backdrop-blur-2xl sm:rounded-[40px] sm:p-8 lg:p-10">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <UserPlus className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Guardian Support</h3>
                <p className="text-slate-500 text-sm font-medium">Primary emergency and billing contact</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
              <div className="space-y-3">
                <label htmlFor="guardianName" className="text-sm font-bold text-slate-300 ml-1">Guardian Name</label>
                <input 
                  id="guardianName"
                  required
                  value={formData.guardianName} 
                  onChange={e => setFormData({...formData, guardianName: e.target.value})}
                  placeholder="Full name of guardian" 
                  className="w-full rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-4 font-medium text-white shadow-inner outline-none transition-all placeholder:text-slate-600 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 sm:px-6 sm:py-5" 
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
                  className="w-full rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-4 font-medium text-white shadow-inner outline-none transition-all placeholder:text-slate-600 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 sm:px-6 sm:py-5" 
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
                  className="w-full resize-none rounded-[24px] border border-white/5 bg-slate-950/40 px-4 py-4 font-medium leading-relaxed text-white shadow-inner outline-none transition-all placeholder:text-slate-600 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 sm:px-6 sm:py-5" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Background Card */}
        <section className="relative group">
          <div className="absolute -inset-0.5 rounded-[28px] bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur opacity-0 transition duration-1000 group-hover:opacity-100 group-hover:duration-200 sm:rounded-[40px]"></div>
          <div className="relative rounded-[28px] border border-white/10 bg-slate-900/60 p-5 shadow-3xl backdrop-blur-2xl sm:rounded-[40px] sm:p-8 lg:p-10">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ClipboardList className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Institutional Background</h3>
                <p className="text-slate-500 text-sm font-medium">Previous academic history and system IDs</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
              <div className="space-y-3">
                <label htmlFor="admissionNo" className="text-sm font-bold text-slate-300 ml-1">Proposed Admission No.</label>
                <input 
                  id="admissionNo"
                  disabled
                  value={isLoadingAdmissionNo ? 'Allocating admission number...' : formData.admissionNo} 
                  className="w-full cursor-not-allowed rounded-2xl border border-white/5 bg-white/5 px-4 py-4 font-mono text-base text-slate-500 shadow-inner sm:px-6 sm:py-5 sm:text-lg" 
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="admissionDate" className="text-sm font-bold text-slate-300 ml-1">Official Admission Date</label>
                <input 
                  id="admissionDate"
                  type="date"
                  value={formData.admittedOn} 
                  onChange={e => setFormData({...formData, admittedOn: e.target.value})}
                  className="w-full rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-4 font-medium text-white shadow-inner outline-none transition-all [color-scheme:dark] focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 sm:px-6 sm:py-5" 
                />
              </div>
              <div className="md:col-span-2 space-y-3">
                <label htmlFor="prevSchool" className="text-sm font-bold text-slate-300 ml-1">Previous School (if applicable)</label>
                <input 
                  id="prevSchool"
                  value={formData.previousSchool} 
                  onChange={e => setFormData({...formData, previousSchool: e.target.value})}
                  placeholder="The last educational institution attended" 
                  className="w-full rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-4 font-medium text-white shadow-inner outline-none transition-all placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 sm:px-6 sm:py-5" 
                />
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col items-center pt-4">
          <button 
            type="submit"
            disabled={isSubmitting}
            className="group/btn relative w-full max-w-xl overflow-hidden rounded-[24px] bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 py-4 text-base font-black uppercase tracking-[0.18em] text-white shadow-[0_20px_40px_rgba(79,70,229,0.3)] transition-all hover:scale-[1.02] active:scale-95 disabled:scale-100 disabled:grayscale disabled:opacity-50 sm:rounded-[32px] sm:py-6 sm:text-xl"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin sm:h-6 sm:w-6" />
                Processing Enrollment...
              </span>
            ) : (
              <span className="relative z-10 flex items-center justify-center gap-3">
                Complete Enrollment
                <ChevronRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-2 sm:h-6 sm:w-6" />
              </span>
            )}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
          </button>
          
          <p className="mt-6 flex items-center gap-3 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 opacity-70 sm:mt-8 sm:gap-4 sm:tracking-[0.4em]">
            <span className="h-px w-8 bg-slate-800 sm:w-12" />
            SECURE ADMISSION REGISTRY
            <span className="h-px w-8 bg-slate-800 sm:w-12" />
          </p>
        </div>
      </form>
    </div>
  );
}
