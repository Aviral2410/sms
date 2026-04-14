import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, CreditCard, Send, ExternalLink, Download } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { FeeRecord } from '../../types';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { toast } from 'sonner';
import { ApiError, schoolOpsApi } from '../../lib/api';

export default function InvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { session } = useStore();
  
  const [invoice, setInvoice] = useState<FeeRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!session.schoolId || !invoiceId) return;
      try {
        const fees = await schoolOpsApi.listFeeRecords(session.schoolId);
        setLocked(false);
        const found = fees.find(
          f => f.feeRecordId.toLowerCase() === invoiceId.toLowerCase()
            || f.feeRecordId.toUpperCase().startsWith(invoiceId.toUpperCase())
        );
        if (found) setInvoice(found as FeeRecord);
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          setLocked(true);
          setInvoice(null);
          return;
        }
        setLocked(false);
        toast.error('Failed to load invoice');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [session.schoolId, invoiceId]);

  if (isLoading) return <DashboardSkeleton />;
  if (locked) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-8 shadow-2xl animate-in text-white">
        <div className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-300">Billing Locked</div>
        <h2 className="mt-3 text-3xl font-black">Upgrade required</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          Billing and fee management are not enabled for the current subscription.
        </p>
      </div>
    );
  }
  if (!invoice) return <div className="text-white p-8">Invoice Not Found in Core.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4 animate-in">
      <button 
        onClick={() => navigate('/billing')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold mb-2"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Ledger
      </button>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
        {invoice.paymentStatus === 'OVERDUE' && (
           <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full"></div>
        )}
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-display font-bold text-white">Invoice {invoiceId}</h1>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 w-max
                ${invoice.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : ''}
                ${invoice.paymentStatus === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : ''}
                ${invoice.paymentStatus === 'OVERDUE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : ''}
              `}>
                {invoice.paymentStatus}
              </span>
            </div>
            <p className="text-slate-400 font-medium">Billed to User: <span className="text-white font-bold">{invoice.studentUserId}</span></p>
          </div>

          <div className="flex gap-3">
            {invoice.paymentStatus !== 'PAID' && (
              <button 
                onClick={() => toast.success('Smart Reminder Sent', { description: `Automated SMS with 1-click Link dispatched to ${invoice.studentUserId}.` })}
                className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              >
                <Send className="w-4 h-4" /> 1-Click Reminder
              </button>
            )}
            {invoice.paymentStatus === 'PAID' ? (
              <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold rounded-xl">
                 <Download className="w-4 h-4" /> Download Receipt
              </button>
            ) : (
              <button className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <CreditCard className="w-4 h-4" /> Process Wire
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-8 border-t border-white/5 relative z-10">
           <div className="space-y-4">
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Line Items</h3>
             <div className="bg-[#0b0f14]/50 border border-white/5 rounded-2xl p-5 flex justify-between items-center">
                <span className="text-slate-200 font-semibold">{invoice.feeCategory} Fee</span>
                <span className="text-xl font-bold text-white">${invoice.amountDue.toLocaleString()}</span>
             </div>
             
             {invoice.paymentStatus === 'PAID' && (
               <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex justify-between items-center text-emerald-400">
                  <span className="font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Amount Paid</span>
                  <span className="text-xl font-bold">${invoice.amountPaid.toLocaleString()}</span>
               </div>
             )}
           </div>

           <div className="space-y-4">
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Metadata Context</h3>
             <div className="space-y-3">
               <div className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                 <span className="text-sm font-medium text-slate-400">Due Date</span>
                 <span className={`text-sm font-bold ${invoice.paymentStatus === 'OVERDUE' ? 'text-rose-400' : 'text-slate-200'}`}>
                   {new Date(invoice.dueDate).toLocaleDateString()}
                 </span>
               </div>
               <div className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                 <span className="text-sm font-medium text-slate-400">System Trace ID</span>
                 <span className="text-sm font-mono text-slate-500">{invoice.feeRecordId}</span>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
