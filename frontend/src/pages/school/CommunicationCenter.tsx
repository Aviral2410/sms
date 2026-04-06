import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Bell, Users, Plus, Search, Sparkles, Megaphone, BookOpen, X, Check, Clock, AlertTriangle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { communicationApi, schoolOpsApi, type AnnouncementResponse, type AcademicClassResponse } from '../../lib/api';
import { toast } from 'sonner';

const V = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const I = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const ACCENT = '#22d3ee';

type Message = { id: string; from: string; role: string; text: string; time: string; read: boolean; };

const MESSAGES: Message[] = [
  { id: '1', from: 'Ms. Kapoor', role: 'Teacher', text: 'Please remind students about the Math test on Friday. Preparation material shared on library portal.', time: '10:24 AM', read: false },
  { id: '2', from: 'Dr. Gupta', role: 'Teacher', text: 'Parent meeting for Class 10-A is scheduled for April 20th at 3 PM. Please confirm attendance.', time: '9:15 AM', read: true },
  { id: '3', from: 'Admissions Team', role: 'Staff', text: 'New admission form for student ID ST-2026-042 is pending your approval.', time: 'Yesterday', read: true },
];

export default function CommunicationCenter() {
  const { session } = useStore();
  const [tab, setTab] = useState<'inbox' | 'announcements' | 'compose'>('inbox');
  const [compose, setCompose] = useState({ to: '', subject: '', body: '' });
  const [aiDrafting, setAiDrafting] = useState(false);
  const [showNew, setShowNew] = useState(false);
  
  const [announcements, setAnnouncements] = useState<AnnouncementResponse[]>([]);
  const [classes, setClasses] = useState<AcademicClassResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newAnn, setNewAnn] = useState({ 
    title: '', 
    content: '', 
    targetAudience: 'ALL', 
    targetClassId: '', 
    priority: 'NORMAL' as 'NORMAL' | 'HIGH',
    type: 'ANNOUNCEMENT' as 'ANNOUNCEMENT' | 'NOTICE'
  });

  useEffect(() => {
    if (!session.schoolId) return;
    setLoading(true);
    Promise.all([
      communicationApi.listAnnouncements({ schoolId: session.schoolId }),
      schoolOpsApi.listClasses(session.schoolId)
    ]).then(([annRes, classRes]) => {
      setAnnouncements(annRes);
      setClasses(classRes);
    }).catch(e => toast.error('Failed to load communication data'))
      .finally(() => setLoading(false));
  }, [session.schoolId]);

  const handlePublish = async () => {
    if (!newAnn.title || !newAnn.content || !session.schoolId) {
      toast.error('Please fill in title and content');
      return;
    }
    
    try {
      const resp = await communicationApi.createAnnouncement({
        ...newAnn,
        schoolId: session.schoolId,
        targetClassId: newAnn.targetAudience === 'CLASS' ? newAnn.targetClassId : undefined,
        publishedAt: new Date().toISOString(),
        createdBy: session.userId || ''
      });

      setAnnouncements(prev => [resp, ...prev]);
      toast.success('Announcement published successfully');
      setShowNew(false);
      setNewAnn({ title: '', content: '', targetAudience: 'ALL', targetClassId: '', priority: 'NORMAL', type: 'ANNOUNCEMENT' });
    } catch (e: any) {
      toast.error('Failed to publish: ' + e.message);
    }
  };

  const handleAiDraft = () => {
    setAiDrafting(true);
    setTimeout(() => {
      setCompose(prev => ({ ...prev, body: `Dear Parent/Guardian,\n\nI hope this message finds you well. I am writing to inform you about the upcoming academic activities and assessments for your ward in ${prev.subject || 'the upcoming period'}.\n\nThe students have been working diligently, and we look forward to continued collaboration between home and school to ensure optimal learning outcomes.\n\nPlease feel free to reach out if you have any questions or concerns.\n\nWarm regards,\n${session.fullName || 'School Administration'}` }));
      setAiDrafting(false);
    }, 1800);
  };

  return (
    <motion.div variants={V} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }}>
      {/* Header */}
      <motion.div variants={I} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 999, background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, color: ACCENT, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}><MessageSquare size={12} /> Communication Hub</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.04em' }}>Communication Center</h1>
          <p style={{ color: '#8b95a2', margin: 0 }}>Unified messaging, announcements and AI-assisted communication</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} onClick={() => setTab('compose')}
          style={{ padding: '12px 24px', borderRadius: 14, background: `linear-gradient(135deg, ${ACCENT}, #0891b2)`, border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
          <Plus size={16} /> New Message
        </motion.button>
      </motion.div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, padding: 6, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', width: 'fit-content' }}>
        {[{ id: 'inbox', label: 'Inbox', icon: MessageSquare, count: MESSAGES.filter(m => !m.read).length }, { id: 'announcements', label: 'Announcements', icon: Megaphone, count: announcements.length }, { id: 'compose', label: 'Compose', icon: Send, count: 0 }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 14, background: tab === t.id ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: tab === t.id ? '#fff' : '#8b95a2', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', position: 'relative' }}>
            <t.icon size={16} />{t.label}
            {t.count > 0 && <span style={{ position: 'absolute', top: 6, right: 8, width: 16, height: 16, borderRadius: '50%', background: t.id === 'inbox' ? '#f43f5e' : ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 900, color: '#fff' }}>{t.count}</span>}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'inbox' && (
          <motion.div key="inbox" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MESSAGES.map(msg => (
              <motion.div key={msg.id} whileHover={{ x: 4, borderColor: 'rgba(255,255,255,0.15)' }}
                style={{ padding: '20px 24px', borderRadius: 20, background: msg.read ? 'rgba(255,255,255,0.02)' : 'rgba(34,211,238,0.04)', border: `1px solid ${msg.read ? 'rgba(255,255,255,0.06)' : 'rgba(34,211,238,0.15)'}`, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                  {msg.from[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>{msg.from}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8b95a2', padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)' }}>{msg.role}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{msg.time}</span>
                      {!msg.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT }} />}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>{msg.text}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {tab === 'announcements' && (
          <motion.div key="ann" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <motion.button whileHover={{ scale: 1.03 }} onClick={() => setShowNew(true)}
                style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
                <Megaphone size={14} /> New Announcement
              </motion.button>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>Loading announcements...</div>
            ) : announcements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>No announcements found.</div>
            ) : announcements.map(ann => (
              <motion.div key={ann.announcementId} whileHover={{ x: 4 }}
                style={{ padding: '24px', borderRadius: 20, background: ann.priority === 'HIGH' ? 'rgba(240,171,32,0.05)' : 'rgba(255,255,255,0.02)', border: ann.priority === 'HIGH' ? '1px solid rgba(240,171,32,0.2)' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}>
                {ann.priority === 'HIGH' && <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: '#f0ab20' }} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>{ann.title}</div>
                      {ann.priority === 'HIGH' && <span style={{ color: '#f0ab20', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}><AlertTriangle size={12} /> Priority</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.78rem', color: '#8b95a2' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{new Date(ann.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 800, background: ann.targetAudience === 'ALL' ? 'rgba(52,211,153,0.1)' : 'rgba(34,211,238,0.1)', color: ann.targetAudience === 'ALL' ? '#34d399' : '#22d3ee' }}>
                    <Users size={10} style={{ display: 'inline', marginRight: 4 }} />{ann.targetAudience}{ann.targetClassId ? ': CLASS' : ''}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>{ann.content}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {tab === 'compose' && (
          <motion.div key="compose" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            style={{ maxWidth: 700, padding: '32px', borderRadius: 28, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', margin: '0 0 24px' }}>New Message</h3>
            {[{ label: 'To', key: 'to', placeholder: 'Recipient email or group...' }, { label: 'Subject', key: 'subject', placeholder: 'Message subject...' }].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b95a2', marginBottom: 6 }}>{f.label}</div>
                <input value={(compose as any)[f.key]} onChange={e => setCompose(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }} />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b95a2' }}>Message</div>
                <motion.button whileHover={{ scale: 1.03 }} onClick={handleAiDraft} disabled={aiDrafting}
                  style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                  <Sparkles size={12} className={aiDrafting ? 'animate-spin' : ''} /> {aiDrafting ? 'AI Drafting...' : 'AI Draft'}
                </motion.button>
              </div>
              <textarea value={compose.body} onChange={e => setCompose(prev => ({ ...prev, body: e.target.value }))} rows={8} placeholder="Write your message here or use AI to draft..."
                style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
            </div>
            <motion.button whileHover={{ scale: 1.02 }}
              style={{ padding: '14px 32px', borderRadius: 14, background: `linear-gradient(135deg, ${ACCENT}, #0891b2)`, border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
              <Send size={16} /> Send Message
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Announcement Modal */}
      <AnimatePresence>
        {showNew && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              style={{ width: '100%', maxWidth: 520, background: '#0f1419', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: 36, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}><h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.3rem', margin: 0 }}>New Announcement</h2><button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button></div>
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b95a2', marginBottom: 6 }}>Title</div>
                <input value={newAnn.title} onChange={e => setNewAnn(prev => ({ ...prev, title: e.target.value }))} placeholder="Announcement title..."
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b95a2', marginBottom: 6 }}>Content</div>
                <textarea value={newAnn.content} onChange={e => setNewAnn(prev => ({ ...prev, content: e.target.value }))} rows={4} placeholder="Write your message..."
                  style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b95a2', marginBottom: 6 }}>Audience</div>
                  <select value={newAnn.targetAudience} onChange={e => setNewAnn(prev => ({ ...prev, targetAudience: e.target.value }))} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#0b1016', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}>
                    {['ALL', 'STUDENTS', 'TEACHERS', 'PARENTS', 'STAFF', 'CLASS'].map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b95a2', marginBottom: 6 }}>Priority</div>
                  <select value={newAnn.priority} onChange={e => setNewAnn(prev => ({ ...prev, priority: e.target.value as any }))} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#0b1016', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}>
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              {newAnn.targetAudience === 'CLASS' && (
                 <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b95a2', marginBottom: 6 }}>Target Class</div>
                    <select value={newAnn.targetClassId} onChange={e => setNewAnn(prev => ({ ...prev, targetClassId: e.target.value }))} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#0b1016', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}>
                      <option value="">Select a class...</option>
                      {classes.map(c => <option key={c.classId} value={c.classId}>{c.className} - {c.sectionName}</option>)}
                    </select>
                 </div>
              )}

              <motion.button whileHover={{ scale: 1.02 }} onClick={handlePublish}
                style={{ width: '100%', padding: '14px', borderRadius: 14, background: `linear-gradient(135deg, ${ACCENT}, #0891b2)`, border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Megaphone size={16} /> Publish Announcement</div>
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

