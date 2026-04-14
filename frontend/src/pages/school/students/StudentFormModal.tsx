import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, MapPin, ShieldCheck, Sparkles, UserPlus, X } from 'lucide-react';
import { clsx } from 'clsx';
import {
  schoolOpsApi,
  type AcademicClassResponse,
  type StudentAdmissionResponse,
  type StudentRowResponse,
  type StudentUpsertRequest,
  type TransportRouteFull,
} from '../../../lib/api';
import { toast } from 'sonner';

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
  readonly open: boolean;
  readonly mode: 'create' | 'edit';
  readonly classes: AcademicClassResponse[];
  readonly routes: TransportRouteFull[];
  readonly initial?: StudentRowResponse | null;
  readonly loading?: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (values: StudentFormValues) => Promise<void>;
  readonly schoolId?: string;
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

const fieldClassName =
  'w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:bg-slate-950/70';

function toInitialValues(initial?: StudentRowResponse | null): StudentFormValues {
  if (!initial) return defaultValues;
  return {
    fullName: initial.fullName || '',
    email: initial.email || '',
    admissionNo: initial.admissionNo || '',
    rollNo: initial.rollNo || '',
    classId: initial.classId || '',
    guardianName: initial.guardianName || '',
    contact: initial.contact || '',
    address: '',
    previousSchool: '',
    admissionStatus: normalizeStatus(initial.status),
    routeId: initial.routeId || '',
    stopId: initial.stopId || '',
  };
}

export function StudentFormModal({
  open,
  mode,
  classes = [],
  routes = [],
  initial,
  loading = false,
  onClose,
  onSubmit,
  schoolId,
}: Props) {
  const [values, setValues] = useState<StudentFormValues>(defaultValues);
  const [error, setError] = useState<string | null>(null);
  const [admissions, setAdmissions] = useState<StudentAdmissionResponse[]>([]);
  const [isFetchingAdmissions, setIsFetchingAdmissions] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(toInitialValues(initial));
    setError(null);

    if (mode === 'create' && schoolId) {
      loadAdmissions();
    }
  }, [initial, mode, open, schoolId]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  const loadAdmissions = async () => {
    setIsFetchingAdmissions(true);
    try {
      const results = await schoolOpsApi.listAdmissions(schoolId!);
      setAdmissions(results || []);
    } catch (e) {
      console.error('Failed to load admissions:', e);
    } finally {
      setIsFetchingAdmissions(false);
    }
  };

  const handleAdmissionSelect = async (admissionId: string) => {
    if (!admissionId) return;

    setIsPrefilling(true);
    try {
      const admission = await schoolOpsApi.getAdmission(admissionId);
      setValues((prev: StudentFormValues) => ({
        ...prev,
        fullName: admission.studentFullName || prev.fullName,
        email: admission.studentEmail || prev.email,
        admissionNo: admission.admissionNo || prev.admissionNo,
        guardianName: admission.guardianName || prev.guardianName,
        contact: admission.guardianPhone || prev.contact,
        address: admission.address || prev.address,
        previousSchool: admission.previousSchool || prev.previousSchool,
        admissionStatus: admission.admissionStatus as StudentFormStatus,
      }));

      toast.success('Fields pre-filled from enrollment record');
    } catch (e: any) {
      toast.error('Failed to pre-fill from enrollment');
    } finally {
      setIsPrefilling(false);
    }
  };

  const selectedRoute = useMemo(
    () => routes.find((route) => route.route.routeId === values.routeId) || null,
    [routes, values.routeId],
  );

  const selectedClass = useMemo(
    () => classes.find((item) => item.classId === values.classId) || null,
    [classes, values.classId],
  );

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.fullName.trim()) return setError('Student name is required.');
    if (!values.email.trim() || !values.email.includes('@')) return setError('A valid email is required.');
    if (!values.admissionNo.trim()) return setError('Admission number is required.');
    if (!values.classId) return setError('Choose a class and section.');
    if (!values.guardianName.trim()) return setError('Guardian name is required.');
    if (!values.contact.trim()) return setError('Contact number is required.');

    setError(null);
    await onSubmit(values);
  };

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md" onClick={onClose} role="none">
      <div
        className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,18,36,0.96),rgba(5,10,24,0.96))] shadow-[0_30px_120px_rgba(2,8,24,0.65)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'create' ? 'Create student' : 'Edit student'}
      >
        <div className="grid max-h-[92vh] min-h-0 lg:grid-cols-[320px,minmax(0,1fr)]">
          <aside className="border-b border-white/6 bg-[radial-gradient(circle_at_top_left,rgba(79,127,255,0.18),transparent_42%),linear-gradient(180deg,rgba(11,18,37,0.98),rgba(8,13,28,0.92))] p-6 lg:border-b-0 lg:border-r lg:border-white/6 lg:p-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
              <UserPlus size={13} />
              {mode === 'create' ? 'Student Onboarding' : 'Student Update'}
            </div>

            <h3 className="mt-5 text-3xl font-black tracking-[-0.04em] text-white">
              {mode === 'create' ? 'Create student from a clean popup flow.' : 'Update the student record without leaving the directory.'}
            </h3>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              Keep registry, class placement, guardian contact, and transport assignment in one focused workflow.
            </p>

            <div className="mt-8 space-y-3">
              <SummaryCard
                icon={<ShieldCheck size={16} />}
                label="Class Placement"
                value={selectedClass ? `${selectedClass.className} ${selectedClass.sectionName}` : 'Choose class'}
              />
              <SummaryCard
                icon={<MapPin size={16} />}
                label="Transport"
                value={selectedRoute ? `${selectedRoute.route.routeName} • ${selectedRoute.stops.length} stops` : 'Optional'}
              />
              <SummaryCard
                icon={<Sparkles size={16} />}
                label="Enrollment Prefill"
                value={mode === 'create' ? `${admissions.length} records ready` : 'Edit mode'}
              />
            </div>

            <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">What this popup fixes</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>Focused form instead of breaking the directory layout.</li>
                <li>Create student from the same page without inline clutter.</li>
                <li>Cleaner transport and admission flow in one place.</li>
              </ul>
            </div>
          </aside>

          <section className="flex min-h-0 flex-col">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/6 bg-slate-950/65 px-6 py-5 backdrop-blur-xl lg:px-8">
              <div>
                <h2 className="text-2xl font-black tracking-[-0.03em] text-white">
                  {mode === 'create' ? 'Add Student' : 'Edit Student'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {mode === 'create'
                    ? 'Create the student here, then return straight to the directory.'
                    : 'Refine identity, enrollment, and transport details in one modal.'}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                onClick={onClose}
              >
                <X size={18} />
              </button>
            </div>

            <form className="min-h-0 overflow-y-auto px-6 py-6 lg:px-8" onSubmit={handleSubmit}>
              {mode === 'create' && (
                <div className="mb-6 flex flex-col gap-4 rounded-[24px] border border-violet-400/18 bg-violet-500/8 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-400/12 text-violet-300">
                      {isPrefilling ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-300">Smart Onboarding</div>
                      <div className="mt-1 text-sm font-semibold text-white">Prefill student details from an admission record</div>
                      <div className="mt-1 text-sm text-slate-300">Pick an enrollment to populate identity and guardian information instantly.</div>
                    </div>
                  </div>

                  <div className="w-full max-w-xl">
                    <select
                      className={clsx(fieldClassName, 'border-violet-400/22 bg-slate-950/75')}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleAdmissionSelect(e.target.value)}
                      disabled={isFetchingAdmissions || isPrefilling}
                      defaultValue=""
                    >
                      <option value="">{isFetchingAdmissions ? 'Loading admissions...' : 'Select enrollment record'}</option>
                      {admissions.map((adm: StudentAdmissionResponse) => (
                        <option key={adm.admissionId} value={adm.admissionId}>
                          {(adm.studentFullName || 'Name Pending') + ` (${adm.admissionNo}) - ${adm.guardianName}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <FormSection title="Identity" subtitle="Student profile and placement essentials.">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label="Full Legal Name" className="md:col-span-2">
                      <input
                        required
                        value={values.fullName}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, fullName: event.target.value }))}
                        placeholder="e.g. Johnathan Doe"
                        className={fieldClassName}
                      />
                    </Field>

                    <Field label="Email Identity" className="md:col-span-2">
                      <input
                        required
                        type="email"
                        value={values.email}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, email: event.target.value }))}
                        placeholder="primary@identity.com"
                        className={fieldClassName}
                      />
                    </Field>

                    <Field label="Admission No.">
                      <input
                        required
                        value={values.admissionNo}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, admissionNo: event.target.value }))}
                        placeholder="ADM-0000"
                        className={fieldClassName}
                      />
                    </Field>

                    <Field label="Roll Number">
                      <input
                        value={values.rollNo}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, rollNo: event.target.value }))}
                        placeholder="Optional"
                        className={fieldClassName}
                      />
                    </Field>

                    <Field label="Academic Group">
                      <select
                        required
                        value={values.classId}
                        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setValues((current) => ({ ...current, classId: event.target.value }))}
                        className={fieldClassName}
                      >
                        <option value="">Select class</option>
                        {classes.map((item) => (
                          <option key={item.classId} value={item.classId}>
                            {item.className} - {item.sectionName}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Admission Status">
                      <select
                        value={values.admissionStatus}
                        onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                          setValues((current) => ({
                            ...current,
                            admissionStatus: event.target.value as StudentFormStatus,
                          }))
                        }
                        className={fieldClassName}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="ADMITTED">Admitted</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="ALUMNI">Alumni</option>
                        <option value="APPLICATION">Application</option>
                        <option value="LEAD">Lead</option>
                      </select>
                    </Field>
                  </div>
                </FormSection>

                <FormSection title="Guardian" subtitle="Primary family contact details for operations.">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label="Guardian Name">
                      <input
                        required
                        value={values.guardianName}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, guardianName: event.target.value }))}
                        placeholder="Primary guardian"
                        className={fieldClassName}
                      />
                    </Field>

                    <Field label="Phone Contact">
                      <input
                        required
                        type="tel"
                        value={values.contact}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, contact: event.target.value }))}
                        placeholder="Primary number"
                        className={fieldClassName}
                      />
                    </Field>

                    <Field label="Address" className="md:col-span-2">
                      <input
                        value={values.address}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, address: event.target.value }))}
                        placeholder="Home address"
                        className={fieldClassName}
                      />
                    </Field>

                    <Field label="Previous School" className="md:col-span-2">
                      <input
                        value={values.previousSchool}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, previousSchool: event.target.value }))}
                        placeholder="Optional"
                        className={fieldClassName}
                      />
                    </Field>
                  </div>
                </FormSection>

                <FormSection title="Transport" subtitle="Optional route and stop assignment.">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label="Transport Route">
                      <select
                        value={values.routeId}
                        onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                          setValues((current) => ({ ...current, routeId: event.target.value, stopId: '' }))
                        }
                        className={fieldClassName}
                      >
                        <option value="">Not assigned</option>
                        {routes.map((route) => (
                          <option key={route.route.routeId} value={route.route.routeId}>
                            {route.route.routeName}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Transport Stop">
                      <select
                        value={values.stopId}
                        disabled={!selectedRoute}
                        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setValues((current) => ({ ...current, stopId: event.target.value }))}
                        className={clsx(fieldClassName, !selectedRoute && 'cursor-not-allowed opacity-60')}
                      >
                        <option value="">{selectedRoute ? 'Select stop' : 'Choose route first'}</option>
                        {selectedRoute?.stops.map((stop) => (
                          <option key={stop.stopId} value={stop.stopId}>
                            {stop.stopName}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </FormSection>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-white/6 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-[20px] text-sm text-rose-300">{error || ''}</div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 text-sm font-bold text-white transition hover:bg-white/10"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 text-sm font-black uppercase tracking-[0.16em] text-white shadow-[0_14px_40px_rgba(59,130,246,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                    {mode === 'create' ? 'Create Student' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function FormSection({
  title,
  subtitle,
  children,
}: {
  readonly title: string;
  readonly subtitle: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
      <div className="mb-5">
        <h4 className="text-lg font-black tracking-[-0.02em] text-white">{title}</h4>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
          {icon}
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</div>
          <div className="mt-1 text-sm font-semibold text-white">{value}</div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
  readonly className?: string;
}) {
  return (
    <div className={clsx('space-y-2', className)}>
      <label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</label>
      {children}
    </div>
  );
}

type StudentFormStatus = StudentUpsertRequest['admissionStatus'];

function normalizeStatus(status: StudentRowResponse['status']): StudentFormStatus {
  const allowed: StudentFormStatus[] = [
    'LEAD',
    'APPLICATION',
    'ADMITTED',
    'ACTIVE',
    'INACTIVE',
    'ALUMNI',
  ];
  return allowed.includes(status as StudentFormStatus)
    ? (status as StudentFormStatus)
    : 'ACTIVE';
}
