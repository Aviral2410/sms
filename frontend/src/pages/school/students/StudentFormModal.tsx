import React, { useMemo, useState } from 'react';
import { Loader2, X, User, Shield, Landmark, Bus, Smartphone, Mail, Hash, MapPin, Globe } from 'lucide-react';
import type { AcademicClassResponse, StudentRowResponse, StudentUpsertRequest, TransportRouteFull } from '../../../lib/api';
import { clsx } from 'clsx';

export type StudentFormValues = {
  fullName: string;
  email: string;
  admissionNo: string;
  rollNo: string;
  classId: string;
  guardianName: string;
  contact: string;
  address: string;
  previousSchool: string;
  admissionStatus: StudentUpsertRequest['admissionStatus'];
  routeId: string;
  stopId: string;
};

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  classes: AcademicClassResponse[];
  routes: TransportRouteFull[];
  initial?: StudentRowResponse | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: StudentFormValues) => Promise<void>;
};

const defaultValues: StudentFormValues = {
  fullName: '',
  email: '',
  admissionNo: '',
  rollNo: '',
  classId: '',
  guardianName: '',
  contact: '',
  address: '',
  previousSchool: '',
  admissionStatus: 'ACTIVE',
  routeId: '',
  stopId: '',
};

function toInitialValues(initial?: StudentRowResponse | null): StudentFormValues {
  if (!initial) return defaultValues;
  return {
    fullName: initial.fullName,
    email: initial.email,
    admissionNo: initial.admissionNo || '',
    rollNo: initial.rollNo || '',
    classId: initial.classId || '',
    guardianName: initial.guardianName || '',
    contact: initial.contact || '',
    address: '',
    previousSchool: '',
    admissionStatus: (initial.status as StudentUpsertRequest['admissionStatus']) || 'ACTIVE',
    routeId: initial.routeId || '',
    stopId: initial.stopId || '',
  };
}

export function StudentFormModal({
  open,
  mode,
  classes,
  routes,
  initial,
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<StudentFormValues>(toInitialValues(initial));
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setValues(toInitialValues(initial));
      setError(null);
    }
  }, [open, initial]);

  const selectedRoute = useMemo(
    () => routes.find((route) => route.route.routeId === values.routeId) || null,
    [routes, values.routeId],
  );

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!values.fullName.trim()) return setError('Name is required.');
    if (!values.email.trim() || !values.email.includes('@')) return setError('A valid email is required.');
    if (!values.admissionNo.trim()) return setError('Admission number is required.');
    if (!values.classId) return setError('Class selection is required.');

    setError(null);
    await onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-[580px] bg-[#0D1226] border border-white/10 rounded-[28px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col">
          
          {/* Header */}
          <div className="relative h-24 shrink-0 bg-gradient-to-r from-blue-600/10 to-transparent border-b border-white/5 flex items-center px-8">
            <div className="flex-1">
                <h3 className="text-xl font-bold text-white leading-none">{mode === 'create' ? 'Register Student' : 'Edit Profile'}</h3>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-2 opacity-60">Identity Management Terminal</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar-student">
            <div className="p-8 space-y-8">
                
                {/* Academic Context */}
                <div className="grid grid-cols-2 gap-5">
                    <Field label="Full Name" icon={User} className="col-span-2">
                        <input 
                            value={values.fullName}
                            onChange={(e) => setValues(v => ({...v, fullName: e.target.value}))}
                            placeholder="e.g. James Smith"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 transition-all font-medium"
                        />
                    </Field>
                    <Field label="Admission No" icon={Hash}>
                        <input 
                            value={values.admissionNo}
                            onChange={(e) => setValues(v => ({...v, admissionNo: e.target.value}))}
                            placeholder="1001"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 transition-all font-medium"
                        />
                    </Field>
                    <Field label="Class / Section" icon={Landmark}>
                        <select 
                            value={values.classId}
                            onChange={(e) => setValues(v => ({...v, classId: e.target.value}))}
                            className="w-full bg-[#0D1226] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-medium appearance-none"
                        >
                            <option value="">Select Class</option>
                            {classes.map(c => <option key={c.classId} value={c.classId}>{c.className} - {c.sectionName}</option>)}
                        </select>
                    </Field>
                </div>

                <div className="h-px bg-white/5" />

                {/* Logistics & Contact */}
                <div className="grid grid-cols-2 gap-5">
                    <Field label="Guardian Name" icon={Shield}>
                        <input 
                            value={values.guardianName}
                            onChange={(e) => setValues(v => ({...v, guardianName: e.target.value}))}
                            placeholder="John Smith"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 transition-all font-medium"
                        />
                    </Field>
                    <Field label="Contact Phone" icon={Smartphone}>
                        <input 
                            value={values.contact}
                            onChange={(e) => setValues(v => ({...v, contact: e.target.value}))}
                            placeholder="+1 234 567 890"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 transition-all font-medium"
                        />
                    </Field>
                    <Field label="Email Address" icon={Mail} className="col-span-2">
                        <input 
                            value={values.email}
                            onChange={(e) => setValues(v => ({...v, email: e.target.value}))}
                            placeholder="student@school.edu"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 transition-all font-medium"
                        />
                    </Field>
                </div>

                <div className="h-px bg-white/5" />

                {/* Transport Section */}
                <div className="grid grid-cols-2 gap-5">
                    <Field label="Transport Route" icon={Bus}>
                        <select 
                            value={values.routeId}
                            onChange={(e) => setValues(v => ({...v, routeId: e.target.value, stopId: ''}))}
                            className="w-full bg-[#0D1226] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-medium appearance-none"
                        >
                            <option value="">No Transport</option>
                            {routes.map(r => <option key={r.route.routeId} value={r.route.routeId}>{r.route.routeName}</option>)}
                        </select>
                    </Field>
                    <Field label="Pickup Stop" icon={MapPin}>
                        <select 
                            value={values.stopId}
                            onChange={(e) => setValues(v => ({...v, stopId: e.target.value}))}
                            disabled={!selectedRoute}
                            className="w-full bg-[#0D1226] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-medium appearance-none disabled:opacity-20"
                        >
                            <option value="">Select Stop</option>
                            {selectedRoute?.stops.map(s => <option key={s.stopId} value={s.stopId}>{s.stopName}</option>)}
                        </select>
                    </Field>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-8 bg-black/20 border-t border-white/5 flex items-center justify-between">
                <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">{error && `* ${error}`}</div>
                <div className="flex gap-4">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        {mode === 'create' ? 'Confirm Unit' : 'Update Record'}
                    </button>
                </div>
            </div>
          </form>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children, className }: { label: string; icon: any; children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("space-y-2", className)}>
       <div className="flex items-center gap-2 px-1">
          <Icon size={12} className="text-white/20" />
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</p>
       </div>
       {children}
    </div>
  );
}
