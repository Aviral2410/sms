import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { FeeRecord } from '../../types';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { SaaSTable } from '../../components/ui/SaaSTable';
import { toast } from 'sonner';
import { ApiError, schoolOpsApi } from '../../lib/api';

export default function BillingOverview() {
  const { session } = useStore();
  const navigate = useNavigate();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'PAID' | 'OVERDUE'>('PENDING');

  useEffect(() => {
    async function loadData() {
      if (!session.schoolId) return;
      try {
        const data = await schoolOpsApi.listFeeRecords(session.schoolId);
        setFees(data as FeeRecord[]);
        setLocked(false);
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          setLocked(true);
          setFees([]);
          return;
        }
        setLocked(false);
        toast.error('Failed to load billing records');
        setFees([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [session.schoolId]);

  if (isLoading) return <DashboardSkeleton />;
  if (locked) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-8 shadow-2xl animate-in">
        <div className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-300">Billing Locked</div>
        <h2 className="mt-3 text-3xl font-black text-white">Upgrade required</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          Billing and fee management are not enabled for the current subscription.
        </p>
      </div>
    );
  }

  // Aggregations
  const totalCollected = fees.filter(f => f.paymentStatus === 'PAID').reduce((acc, curr) => acc + curr.amountPaid, 0);
  const totalPending = fees.filter(f => f.paymentStatus === 'PENDING').reduce((acc, curr) => acc + curr.amountDue, 0);
  const totalOverdue = fees.filter(f => f.paymentStatus === 'OVERDUE').reduce((acc, curr) => acc + curr.amountDue, 0);

  const filteredInvoices = fees.filter(f => f.paymentStatus === activeTab);

  const columns = [
    { key: 'feeRecordId', label: 'Invoice No', width: '25%' },
    { key: 'studentUserId', label: 'Student ID', width: '20%' },
    { key: 'dueDate', label: 'Due Date', width: '15%' },
    { key: 'amountDue', label: 'Amount', width: '15%' },
    { key: 'statusBadge', label: 'Status', width: '25%' }
  ];

  const dataWithBadges = filteredInvoices.map(inv => ({
    ...inv,
    invoiceIdRaw: inv.feeRecordId,
    feeRecordId: inv.feeRecordId.substring(0, 8).toUpperCase(),
    amountDue: `$${inv.amountDue.toLocaleString()}`,
    dueDate: new Date(inv.dueDate).toLocaleDateString(),
    statusBadge: (
      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 w-max shadow-lg
        ${inv.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : ''}
        ${inv.paymentStatus === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : ''}
        ${inv.paymentStatus === 'OVERDUE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' : ''}
      `}>
        {inv.paymentStatus === 'PAID' && <CheckCircle className="w-3 h-3" />}
        {inv.paymentStatus === 'PENDING' && <Clock className="w-3 h-3" />}
        {inv.paymentStatus === 'OVERDUE' && <AlertCircle className="w-3 h-3" />}
        {inv.paymentStatus}
      </span>
    )
  }));

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight mb-2 text-white">Revenue Operations</h1>
          <p className="text-slate-400 text-sm">Select any invoice to trigger context-aware actions.</p>
        </div>
        <button 
          onClick={() => {
            if(totalOverdue > 0) {
              toast.success('Workflow Triggered', { description: 'Batch SMS sent auto-targeted to overdue accounts via Smart Action rules.' });
            } else {
              toast.info('No Action Needed', { description: 'No overdue accounts found in this cycle.' });
            }
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(225,29,72,0.2)]"
        >
          <AlertCircle className="w-5 h-5" />
          Bulk Remind Anomalies
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl group hover:-translate-y-1 transition-transform">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Total Collected</p>
          <h3 className="text-4xl font-display font-black text-white">${totalCollected.toLocaleString()}</h3>
        </div>
        <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-xl group hover:-translate-y-1 transition-transform">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">Pending Ledger</p>
          <h3 className="text-4xl font-display font-black text-white">${totalPending.toLocaleString()}</h3>
        </div>
        <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 backdrop-blur-xl group hover:-translate-y-1 transition-transform shadow-[0_0_20px_rgba(225,29,72,0.15)]">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-1">Overdue Revenue</p>
          <h3 className="text-4xl font-display font-black text-white">${totalOverdue.toLocaleString()}</h3>
        </div>
      </div>

      <div className="bg-slate-900/60 rounded-3xl border border-white/10 overflow-hidden mt-8 backdrop-blur-md">
        <div className="border-b border-white/5 px-4 flex gap-6 mt-2">
          {(['PENDING', 'PAID', 'OVERDUE'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-3 font-bold text-sm tracking-wide border-b-2 transition-all flex items-center gap-2 ${
                activeTab === tab 
                  ? 'border-cyan-500 text-cyan-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20'
              }`}
            >
              {tab === 'OVERDUE' && activeTab !== 'OVERDUE' && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
              {tab} Invoices
            </button>
          ))}
        </div>
        
        <div className="p-0">
          <SaaSTable 
            columns={columns} 
            data={dataWithBadges} 
            onRowClick={(row) => navigate(`/billing/${row.invoiceIdRaw || row.feeRecordId}`)}
            description="Row clicks route to contextual actions."
          />
        </div>
      </div>
    </div>
  );
}
