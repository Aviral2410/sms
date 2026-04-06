import React, { useEffect, useState } from 'react';
import { onboardingApi, OnboardingResponse } from '../../lib/api';
import { CheckCircle2, XCircle, Clock, Building2, Loader, MessageSquare, Trash2, Eye, EyeOff, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useRealtime } from '../../components/RealtimeHub';
import { useStore } from '../../store/useStore';

const BG = '#0b0f14'; const TEXT = '#f1f5f9'; const DIM = '#8b95a2'; const BORDER = 'rgba(255,255,255,0.08)';


export default function OnboardingQueue() {
  const { lastMessage } = useRealtime();
  const { session } = useStore();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<OnboardingResponse[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const data = await onboardingApi.listAll();
      const pendingStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'];
      setRequests((data as OnboardingResponse[])
        .filter((d: OnboardingResponse) => pendingStatuses.includes(d.status))
        .sort((a: OnboardingResponse, b: OnboardingResponse) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      );
    } catch (e: any) {
      toast.error('Failed to load queue: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  // Real-time refresh
  useEffect(() => {
    if (lastMessage?.topic?.startsWith('platform/onboarding/')) {
      console.log('Real-time update received:', lastMessage.topic);
      fetchRequests();
    }
  }, [lastMessage]);

  const handleReview = async (id: string, action: 'APPROVE' | 'REJECT', currentStatus: string, comment: string) => {
    try {
      setReviewingId(id);
      const reviewerName = session.fullName || 'Platform Admin';
      
      await onboardingApi.review(id, action, reviewerName, comment || (action === 'APPROVE' ? 'Approved by Admin' : 'Rejected by Admin'));
      toast.success(action === 'APPROVE' ? 'School approved successfully' : 'School rejected successfully');
      await fetchRequests();
    } catch (e: any) {
      toast.error('Review failed: ' + e.message);
    } finally {
      setReviewingId(null);
    }
  };

  const handleDelete = async (onboardingId: string, schoolName: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE the onboarding record for ${schoolName}? This action cannot be undone.`)) return;
    try {
      setReviewingId(onboardingId);
      await onboardingApi.delete(onboardingId);
      toast.success(`Onboarding record for ${schoolName} deleted`);
      await fetchRequests();
    } catch (e: any) {
      toast.error('Deletion failed: ' + e.message);
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.03em' }}>Onboarding Queue</h1>
        <p style={{ color: DIM, margin: 0, fontSize: '0.9rem' }}>Review and approve new school registration requests.</p>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: DIM }}><Loader size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : requests.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: `1px dashed ${BORDER}` }}>
          <CheckCircle2 size={40} color="#34d399" style={{ marginBottom: 16, opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>Queue Empty</h3>
          <p style={{ color: DIM, margin: 0 }}>All caught up! No pending registrations.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {requests.map(req => (
            <OnboardingRequestCard 
              key={req.onboardingId} 
              req={req} 
              onReview={handleReview} 
              onDelete={handleDelete}
              reviewingId={reviewingId} 
            />
          ))}
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function OnboardingRequestCard({ req, onReview, onDelete, reviewingId }: { 
  req: OnboardingResponse; 
  onReview: (id: string, action: 'APPROVE' | 'REJECT', currentStatus: string, comment: string) => Promise<void>; 
  onDelete: (id: string, name: string) => Promise<void>;
  reviewingId: string | null;
}) {
  const [comment, setComment] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true);
      await onboardingApi.sendEmail(req.onboardingId);
      toast.success('Activation email triggered successfully');
    } catch (e: any) {
      toast.error('Failed to send email: ' + e.message);
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', borderRadius: 16, border: `1px solid ${BORDER}`, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(34,211,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={24} color="#22d3ee" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>{req.schoolName}</h3>
            <div style={{ display: 'flex', gap: 12, color: DIM, fontSize: '0.8rem', fontWeight: 600 }}>
              <span>Code: <span style={{ color: '#ffb663' }}>{req.schoolCode}</span></span>
              <span>•</span>
              <span>Admin: {req.adminEmail}</span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12}/> {new Date(req.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div style={{ padding: '6px 12px', borderRadius: 8, 
          background: req.status === 'APPROVED' ? 'rgba(16,185,129,0.1)' : req.status === 'UNDER_REVIEW' ? 'rgba(34,211,238,0.1)' : 'rgba(251,191,36,0.1)', 
          color: req.status === 'APPROVED' ? '#10b981' : req.status === 'UNDER_REVIEW' ? '#22d3ee' : '#fbbf24', 
          fontSize: '0.75rem', fontWeight: 800 }}>
          {req.status}
        </div>
      </div>

      {req.status === 'APPROVED' ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 12, border: `1px solid ${BORDER}` }}>
           <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.65rem', color: DIM, textTransform: 'uppercase', fontWeight: 800 }}>Activation Identity</div>
              <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                Code: 
                <span style={{ 
                  color: '#22d3ee', 
                  fontFamily: 'monospace', 
                  fontSize: '1rem', 
                  letterSpacing: '2px', 
                  background: 'rgba(34,211,238,0.1)', 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  border: '1px solid rgba(34,211,238,0.2)',
                  filter: showCode ? 'none' : 'blur(4px)',
                  transition: 'all 0.2s'
                }}>
                  {req.activationCode || 'PENDING'}
                </span>
                <button 
                  onClick={() => setShowCode(!showCode)}
                  style={{ background: 'none', border: 'none', color: DIM, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                  title={showCode ? "Hide Code" : "Show Code"}
                >
                  {showCode ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
              <div style={{ fontSize: '0.7rem', color: DIM, marginTop: 4 }}>
                Tenant: <span style={{ color: '#ffb663' }}>{req.tenantId?.slice(0, 8)}...</span> • 
                {req.activationSentAt ? ` Sent: ${new Date(req.activationSentAt).toLocaleDateString()}` : ' Not Sent yet'}
              </div>
           </div>
           <div style={{ display: 'flex', gap: 8 }}>
             <button 
                onClick={() => {
                  const subject = encodeURIComponent(`Welcome to ElevateSmart - ${req.schoolName}`);
                  const body = encodeURIComponent(`Hello Admin,\n\nYour school "${req.schoolName}" has been provisioned on ElevateSmart.\n\nLogin Email: ${req.adminEmail}\nSchool Code: ${req.schoolCode}\nActivation Code: ${req.activationCode}\n\nPlease visit the platform and use the activation code to set your password.\n\nBest regards,\nPlatform Administration`);
                  window.location.href = `mailto:${req.adminEmail}?subject=${subject}&body=${body}`;
                }}
                style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Mail size={14}/> Mail
             </button>
             <button 
               onClick={() => {
                 const subject = encodeURIComponent(`Welcome to ElevateSmart - ${req.schoolName}`);
                 const body = encodeURIComponent(`Hello Admin,\n\nYour school "${req.schoolName}" has been provisioned on ElevateSmart.\n\nLogin Email: ${req.adminEmail}\nSchool Code: ${req.schoolCode}\nActivation Code: ${req.activationCode}\n\nPlease visit the platform and use the activation code to set your password.\n\nBest regards,\nPlatform Administration`);
                 window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${req.adminEmail}&su=${subject}&body=${body}`, '_blank');
               }}
               style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(234,67,53,0.15)', border: '1px solid rgba(234,67,53,0.3)', color: '#ea4335', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
             >
               <MessageSquare size={14}/> Gmail
             </button>
             <button 
               onClick={handleSendEmail} 
               disabled={sendingEmail}
               style={{ padding: '10px 20px', borderRadius: 8, background: req.activationSentAt ? 'rgba(255,255,255,0.05)' : '#ffb663', border: 'none', color: req.activationSentAt ? DIM : '#000', fontWeight: 800, fontSize: '0.75rem', cursor: sendingEmail ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
             >
               {sendingEmail ? <Loader size={12} className="animate-spin"/> : <CheckCircle2 size={12}/>} 
               {req.activationSentAt ? 'Notify Again' : 'Auto Notify'}
             </button>
           </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: 12, color: DIM }}><MessageSquare size={16} /></div>
            <input type="text" placeholder="Add a comment (optional)..." value={comment} onChange={e => setComment(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, padding: '10px 14px 10px 38px', borderRadius: 10, color: '#fff', fontSize: '0.85rem', outline: 'none' }}
            />
          </div>
          <button onClick={() => onReview(req.onboardingId, 'APPROVE', req.status, comment)} disabled={!!reviewingId} style={{ padding: '0 24px', borderRadius: 10, background: '#10b981', border: 'none', color: '#fff', fontWeight: 800, cursor: reviewingId ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {reviewingId === req.onboardingId ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }}/> : <CheckCircle2 size={16}/>} Approve
          </button>
          <button onClick={() => onReview(req.onboardingId, 'REJECT', req.status, comment)} disabled={!!reviewingId} style={{ padding: '0 24px', borderRadius: 10, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185', fontWeight: 800, cursor: reviewingId ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <XCircle size={16}/> Reject
          </button>
          <button 
            onClick={() => onDelete(req.onboardingId, req.schoolName)} 
            disabled={!!reviewingId} 
            style={{ padding: '0 16px', borderRadius: 10, background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.1)', color: '#fb7185', cursor: reviewingId ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            title="Delete Record"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

    </div>
  );
}
