import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Check, 
  ChevronRight, 
  UserPlus, 
  FileCheck, 
  CheckCircle2, 
  School, 
  Loader2, 
  Mail, 
  Phone, 
  MapPin, 
  ClipboardList,
  ArrowLeft,
  Sparkles,
  User,
  Calendar
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'sonner';
import { schoolOpsApi, type AcademicClassResponse } from '../../lib/api';

export default function EnrollmentWizard() {
  const navigate = useNavigate();
  const { session } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [classes, setClasses] = useState<AcademicClassResponse[]>([]);
  
  const [formData, setFormData] = useState({
    studentFullName: '',
    studentEmail: '',
    studentPhone: '',
    admissionNo: `ADM-${Math.floor(10000 + Math.random() * 90000)}`,
    admittedOn: new Date().toISOString().split('T')[0],
    dateOfBirth: '',
    guardianName: '',
    guardianPhone: '',
    address: '',
    previousSchool: '',
    classId: '',
  });

  useEffect(() => {
    if (session.schoolId) {
      schoolOpsApi.listClasses(session.schoolId).then(setClasses).catch(console.error);
    }
  }, [session.schoolId]);

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
    if (!formData.classId) {
      return toast.error('Please select an academic class');
    }

    setIsSubmitting(true);
    try {
      await schoolOpsApi.createAdmission({
        schoolId: session.schoolId,
        studentFullName: formData.studentFullName.trim(),
        studentEmail: formData.studentEmail.trim(),
        admissionNo: formData.admissionNo.trim(),
        admittedOn: formData.admittedOn,
        dateOfBirth: formData.dateOfBirth || null,
        guardianName: formData.guardianName.trim(),
        guardianPhone: formData.guardianPhone.trim(),
        address: formData.address.trim() || null,
        previousSchool: formData.previousSchool.trim() || null,
        admissionStatus: 'ACTIVE',
        classId: formData.classId,
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
      <div className="max-w-xl mx-auto pt-20 px-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="p-12 rounded-[40px] bg-slate-900/40 border border-emerald-500/20 backdrop-blur-3xl"
        >
          <div className="w-24 h-24 bg-emerald-500/10 rounded-[32px] flex items-center justify-center border-2 border-emerald-500/50 mx-auto mb-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Enrollment Successful!</h2>
          <p className="text-slate-400 mb-12">
            <span className="text-white font-bold">{formData.studentFullName}</span> has been admitted and enrolled in their class.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/admissions')}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
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
                    admissionNo: `ADM-${Math.floor(10000 + Math.random() * 90000)}`,
                    classId: '',
                    dateOfBirth: '',
                    guardianName: '',
                    guardianPhone: '',
                    address: '',
                    previousSchool: '',
                });
              }}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all"
            >
              Enroll Another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pt-10 pb-20 px-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            Student Enrollment
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Complete the student profile to finalize admission.</p>
        </div>
        <button 
          onClick={() => navigate('/admissions')}
          className="group flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Sections */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Student Identity */}
          <div className="p-8 rounded-[32px] bg-slate-900/40 border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center">
                <User className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Student Identity</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 ml-1">Full Name</label>
                <input 
                  required
                  value={formData.studentFullName} 
                  onChange={e => setFormData({...formData, studentFullName: e.target.value})}
                  placeholder="Johnathan Doe" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-cyan-500/50 focus:bg-white/10 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 ml-1">Email Address</label>
                <input 
                  required
                  type="email"
                  value={formData.studentEmail} 
                  onChange={e => setFormData({...formData, studentEmail: e.target.value})}
                  placeholder="student@school.com" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-cyan-500/50 focus:bg-white/10 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 ml-1">Date of Birth</label>
                <input 
                  type="date"
                  value={formData.dateOfBirth} 
                  onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-cyan-500/50 focus:bg-white/10 outline-none transition-all [color-scheme:dark]" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 ml-1">Phone (Optional)</label>
                <input 
                  value={formData.studentPhone} 
                  onChange={e => setFormData({...formData, studentPhone: e.target.value})}
                  placeholder="+1 (555) 000-0000" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-cyan-500/50 focus:bg-white/10 outline-none transition-all" 
                />
              </div>
            </div>
          </div>

          {/* Section 2: Guardian Info */}
          <div className="p-8 rounded-[32px] bg-slate-900/40 border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Guardian Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 ml-1">Guardian Name</label>
                <input 
                  required
                  value={formData.guardianName} 
                  onChange={e => setFormData({...formData, guardianName: e.target.value})}
                  placeholder="Primary Guardian Name" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 ml-1">Guardian Phone</label>
                <input 
                  required
                  value={formData.guardianPhone} 
                  onChange={e => setFormData({...formData, guardianPhone: e.target.value})}
                  placeholder="+1 (555) 000-0000" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 outline-none transition-all" 
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-400 ml-1">Residential Address</label>
                <textarea 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  placeholder="Current full address..." 
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:bg-white/10 outline-none transition-all resize-none" 
                />
              </div>
            </div>
          </div>

          {/* Section 3: Academic */}
          <div className="p-8 rounded-[32px] bg-slate-900/40 border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Academic Context</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 ml-1">Admission Number</label>
                <input 
                  disabled
                  value={formData.admissionNo} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-slate-500 cursor-not-allowed font-mono" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 ml-1">Admission Date</label>
                <input 
                  type="date"
                  value={formData.admittedOn} 
                  onChange={e => setFormData({...formData, admittedOn: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 outline-none transition-all [color-scheme:dark]" 
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-400 ml-1">Previous School (Optional)</label>
                <input 
                  value={formData.previousSchool} 
                  onChange={e => setFormData({...formData, previousSchool: e.target.value})}
                  placeholder="Last attended institution..." 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 outline-none transition-all" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Class Selection & Submit */}
        <div className="space-y-8">
          <div className="sticky top-24 space-y-8">
            <div className="p-8 rounded-[32px] bg-slate-900/40 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col min-h-[400px]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center">
                  <School className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Enrollment Class</h3>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[400px]">
                {classes.map(c => (
                  <button 
                    key={c.classId}
                    type="button"
                    onClick={() => setFormData({...formData, classId: c.classId})}
                    className={`
                      w-full p-5 rounded-2xl border text-left transition-all group relative overflow-hidden
                      ${formData.classId === c.classId 
                        ? 'bg-violet-500/10 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.2)]' 
                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'}
                    `}
                  >
                    <div className="flex justify-between items-center relative z-10">
                      <div>
                        <div className={`font-bold ${formData.classId === c.classId ? 'text-violet-400' : 'text-slate-200'}`}>
                          {c.className} - {c.sectionName}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">{c.academicYear}</div>
                      </div>
                      {formData.classId === c.classId && (
                        <div className="w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                          <Check className="w-4 h-4 text-white stroke-[3px]" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
                
                {classes.length === 0 && (
                  <div className="py-12 px-4 text-center border-2 border-dashed border-white/5 rounded-3xl text-slate-500 text-sm font-medium">
                    No classes found. Please setup academic classes first.
                  </div>
                )}
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="mt-8 w-full py-5 bg-gradient-to-r from-cyan-500 via-emerald-500 to-violet-500 hover:scale-[1.02] active:scale-95 text-slate-900 font-black text-lg rounded-2xl transition-all shadow-[0_0_40px_rgba(6,182,212,0.2)] disabled:opacity-50 disabled:grayscale disabled:scale-100 uppercase tracking-widest"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enrolling...
                  </span>
                ) : (
                  'Complete Enrollment'
                )}
              </button>
              
              <p className="mt-4 text-[10px] text-center text-slate-500 font-bold uppercase tracking-tighter">
                Clicking will provision student credentials & cloud storage
              </p>
            </div>
          </div>
        </div>
      </form>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>
    </div>
  );
}
