import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Plus, Users, Megaphone, AlertTriangle, Clock } from 'lucide-react';
import {
  communicationApi,
  schoolOpsApi,
  type AcademicClassResponse,
  type AnnouncementResponse,
  type MessageThreadResponse,
  type SchoolUser,
  type ThreadMessageResponse,
} from '../../lib/api';
import { useStore } from '../../store/useStore';
import { toast } from 'sonner';

const V = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const I = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

type TabId = 'inbox' | 'announcements' | 'compose';

export default function CommunicationCenter() {
  const { session } = useStore();

  const [tab, setTab] = useState<TabId>('inbox');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [announcements, setAnnouncements] = useState<AnnouncementResponse[]>([]);
  const [threads, setThreads] = useState<MessageThreadResponse[]>([]);
  const [messages, setMessages] = useState<ThreadMessageResponse[]>([]);
  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [classes, setClasses] = useState<AcademicClassResponse[]>([]);

  const [selectedThreadId, setSelectedThreadId] = useState<string>('');
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  const [announcementDraft, setAnnouncementDraft] = useState({
    title: '',
    content: '',
    targetAudience: 'ALL',
    targetClassId: '',
    priority: 'NORMAL' as 'NORMAL' | 'HIGH',
    type: 'ANNOUNCEMENT' as 'ANNOUNCEMENT' | 'NOTICE',
  });

  const [messageDraft, setMessageDraft] = useState({
    recipientUserId: '',
    subject: '',
    body: '',
  });

  const canPublish = useMemo(() => {
    const role = (session.role || '').toUpperCase();
    return role.includes('ADMIN') || role.includes('TEACHER') || role.includes('STAFF') || role.includes('PRINCIPAL');
  }, [session.role]);

  const selectedThread = useMemo(
    () => threads.find((t) => t.threadId === selectedThreadId) || null,
    [threads, selectedThreadId]
  );

  useEffect(() => {
    const schoolId = session.schoolId;
    if (!schoolId) return;

    let cancelled = false;

    const loadAll = async () => {
      try {
        const [announcementRows, threadRows, classRows, userRows] = await Promise.all([
          communicationApi.listAnnouncements({ schoolId }),
          communicationApi.listThreads(),
          schoolOpsApi.listClasses(schoolId),
          schoolOpsApi.listUsers(schoolId),
        ]);

        if (cancelled) return;
        setAnnouncements(announcementRows);
        setThreads(threadRows);
        setClasses(classRows);
        setUsers(userRows);

        if (!selectedThreadId && threadRows.length > 0) {
          setSelectedThreadId(threadRows[0].threadId);
        }
      } catch (error: any) {
        if (!cancelled) {
          toast.error(error?.message || 'Failed to load communication data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    loadAll();

    const intervalId = window.setInterval(loadAll, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [session.schoolId, selectedThreadId]);

  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    const loadMessages = async () => {
      try {
        const rows = await communicationApi.listThreadMessages(selectedThreadId);
        if (!cancelled) {
          setMessages(rows);
          await communicationApi.markThreadRead(selectedThreadId).catch(() => undefined);
        }
      } catch (error: any) {
        if (!cancelled) {
          toast.error(error?.message || 'Failed to load thread messages.');
        }
      }
    };

    loadMessages();
    const intervalId = window.setInterval(loadMessages, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [selectedThreadId]);

  const recipientOptions = useMemo(() => {
    return users.filter((u) => u.userId !== session.userId);
  }, [users, session.userId]);

  const openThreadOrPrepare = (threadId: string) => {
    setSelectedThreadId(threadId);
    setTab('inbox');
  };

  const handleSendMessage = async () => {
    if (!messageDraft.body.trim()) {
      toast.error('Message body is required.');
      return;
    }

    setSending(true);
    try {
      let threadId = selectedThreadId;

      if (!threadId) {
        if (!messageDraft.recipientUserId) {
          toast.error('Choose a recipient or select an existing thread.');
          return;
        }

        const created = await communicationApi.createThread({
          subject: messageDraft.subject.trim() || undefined,
          participantUserIds: [messageDraft.recipientUserId],
        });

        threadId = created.threadId;
        setThreads((prev) => [created, ...prev.filter((t) => t.threadId !== created.threadId)]);
        setSelectedThreadId(threadId);
      }

      const sent = await communicationApi.sendThreadMessage(threadId, { body: messageDraft.body.trim() });
      setMessages((prev) => [...prev, sent]);
      setMessageDraft((prev) => ({ ...prev, body: '' }));
      toast.success('Message sent.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handlePublishAnnouncement = async () => {
    if (!announcementDraft.title.trim() || !announcementDraft.content.trim() || !session.schoolId) {
      toast.error('Title and content are required.');
      return;
    }

    if (announcementDraft.targetAudience === 'CLASS' && !announcementDraft.targetClassId) {
      toast.error('Choose a class for class-only announcement.');
      return;
    }

    setSending(true);
    try {
      const created = await communicationApi.createAnnouncement({
        schoolId: session.schoolId,
        title: announcementDraft.title.trim(),
        content: announcementDraft.content.trim(),
        targetAudience: announcementDraft.targetAudience,
        targetClassId: announcementDraft.targetAudience === 'CLASS' ? announcementDraft.targetClassId : undefined,
        priority: announcementDraft.priority,
        type: announcementDraft.type,
        publishedAt: new Date().toISOString(),
        createdBy: session.userId || '',
      });

      setAnnouncements((prev) => [created, ...prev]);
      setAnnouncementDraft({
        title: '',
        content: '',
        targetAudience: 'ALL',
        targetClassId: '',
        priority: 'NORMAL',
        type: 'ANNOUNCEMENT',
      });
      setShowAnnouncementModal(false);
      toast.success('Announcement published.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to publish announcement.');
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div variants={V} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>
      <motion.div variants={I} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              borderRadius: 999,
              background: 'var(--surface-accent-soft)',
              border: '1px solid var(--surface-accent-border)',
              color: 'var(--brand-accent)',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            <MessageSquare size={12} />
            Communication Hub
          </div>
          <h1 style={{ margin: 0, color: 'var(--text-strong)', fontSize: '2rem', fontWeight: 900 }}>Communication Center</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>
            Real inbox threads, announcements, and school-wide communication.
          </p>
        </div>
      </motion.div>

      <div style={{ display: 'flex', gap: 6, padding: 6, borderRadius: 14, background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)', width: 'fit-content' }}>
        {[
          { id: 'inbox' as TabId, label: 'Inbox', count: threads.reduce((sum, t) => sum + Number(t.unreadCount || 0), 0) },
          { id: 'announcements' as TabId, label: 'Announcements', count: announcements.length },
          { id: 'compose' as TabId, label: 'Compose', count: 0 },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              border: 'none',
              background: tab === item.id ? 'var(--surface-elevated-hover)' : 'transparent',
              color: tab === item.id ? 'var(--text-strong)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            {item.label}{item.count > 0 ? ` (${item.count})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-card" style={{ color: 'var(--text-muted)' }}>Loading communication data...</div>
      ) : null}

      <AnimatePresence mode="wait">
        {tab === 'inbox' && !loading && (
          <motion.div key="inbox" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ display: 'grid', gridTemplateColumns: '330px 1fr', gap: 14 }}>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 420 }}>
              {threads.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No conversations yet. Create one in Compose.</div>
              ) : (
                threads.map((thread) => (
                  <button
                    key={thread.threadId}
                    onClick={() => openThreadOrPrepare(thread.threadId)}
                    style={{
                      textAlign: 'left',
                      borderRadius: 12,
                      border: selectedThreadId === thread.threadId ? '1px solid var(--brand-accent)' : '1px solid var(--glass-border)',
                      background: selectedThreadId === thread.threadId ? 'var(--surface-accent-soft)' : 'var(--surface-elevated)',
                      padding: '12px 14px',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 800, marginBottom: 4 }}>{thread.subject || 'Direct message'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Updated {thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleString() : new Date(thread.updatedAt).toLocaleString()}
                    </div>
                    {(thread.unreadCount || 0) > 0 ? (
                      <div style={{ marginTop: 6, color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: 800 }}>
                        {thread.unreadCount} unread
                      </div>
                    ) : null}
                  </button>
                ))
              )}
            </div>

            <div className="glass-card" style={{ minHeight: 420, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!selectedThread ? (
                <div style={{ color: 'var(--text-muted)' }}>Select a thread to view messages.</div>
              ) : (
                <>
                  <div style={{ fontWeight: 900, color: 'var(--text-strong)' }}>{selectedThread.subject || 'Direct message'}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto', paddingRight: 6 }}>
                    {messages.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)' }}>No messages yet.</div>
                    ) : (
                      messages.map((message) => {
                        const mine = message.senderUserId === session.userId;
                        return (
                          <div key={message.messageId} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
                            <div
                              style={{
                                borderRadius: 12,
                                padding: '10px 12px',
                                background: mine ? 'var(--surface-accent-soft)' : 'var(--surface-elevated)',
                                border: mine ? '1px solid var(--surface-accent-border)' : '1px solid var(--glass-border)',
                                color: 'var(--text-main)',
                              }}
                            >
                              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{message.body}</div>
                            </div>
                            <div style={{ marginTop: 4, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(message.createdAt).toLocaleString()}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {tab === 'announcements' && !loading && (
          <motion.div key="announcements" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="secondary-button"
                disabled={!canPublish}
                onClick={() => {
                  if (!canPublish) {
                    toast.error('Your role cannot publish announcements.');
                    return;
                  }
                  setShowAnnouncementModal(true);
                }}
                style={{ opacity: canPublish ? 1 : 0.65 }}
              >
                <Megaphone size={14} style={{ marginRight: 6 }} /> New Announcement
              </button>
            </div>

            {announcements.length === 0 ? (
              <div className="glass-card" style={{ color: 'var(--text-muted)' }}>No announcements yet.</div>
            ) : (
              announcements.map((ann) => (
                <div key={ann.announcementId} className="glass-card" style={{ borderColor: ann.priority === 'HIGH' ? 'rgba(240,171,32,0.35)' : undefined }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ color: 'var(--text-strong)', fontWeight: 900 }}>{ann.title}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4, display: 'flex', gap: 8 }}>
                        <span><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />{new Date(ann.publishedAt || ann.createdAt).toLocaleString()}</span>
                        <span><Users size={12} style={{ display: 'inline', marginRight: 4 }} />{ann.targetAudience}</span>
                      </div>
                    </div>
                    {ann.priority === 'HIGH' ? (
                      <span style={{ color: '#f0ab20', fontSize: '0.75rem', fontWeight: 800 }}><AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />High Priority</span>
                    ) : null}
                  </div>
                  <p style={{ margin: '10px 0 0', color: 'var(--text-soft)', lineHeight: 1.6 }}>{ann.content}</p>
                </div>
              ))
            )}
          </motion.div>
        )}

        {tab === 'compose' && !loading && (
          <motion.div key="compose" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="glass-card" style={{ maxWidth: 760 }}>
            <h3 style={{ margin: '0 0 14px', color: 'var(--text-strong)' }}>New Message</h3>
            {selectedThreadId ? (
              <div style={{ marginBottom: 10 }}>
                <button
                  className="secondary-button"
                  onClick={() => setSelectedThreadId('')}
                >
                  <Plus size={14} style={{ marginRight: 6 }} /> Start New Thread
                </button>
              </div>
            ) : null}

            {!selectedThreadId ? (
              <label>
                <span>Recipient</span>
                <select
                  value={messageDraft.recipientUserId}
                  onChange={(event) => setMessageDraft((prev) => ({ ...prev, recipientUserId: event.target.value }))}
                >
                  <option value="">Select recipient...</option>
                  {recipientOptions.map((user) => (
                    <option key={user.userId} value={user.userId}>
                      {user.fullName} ({user.roleName})
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {!selectedThreadId ? (
              <label>
                <span>Subject</span>
                <input
                  value={messageDraft.subject}
                  onChange={(event) => setMessageDraft((prev) => ({ ...prev, subject: event.target.value }))}
                  placeholder="Short subject for conversation"
                />
              </label>
            ) : null}

            <label>
              <span>Message</span>
              <textarea
                value={messageDraft.body}
                onChange={(event) => setMessageDraft((prev) => ({ ...prev, body: event.target.value }))}
                rows={8}
                placeholder="Write your message"
                style={{ width: '100%', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--surface-elevated)', color: 'var(--text-main)', padding: 12, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </label>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="primary-button" onClick={handleSendMessage} disabled={sending}>
                <Send size={14} style={{ marginRight: 6 }} /> {sending ? 'Sending...' : 'Send Message'}
              </button>
              <button
                className="secondary-button"
                onClick={() => toast.info('Use the AI Assistant panel for smart drafting. This form sends only real messages.')}
              >
                <Plus size={14} style={{ marginRight: 6 }} /> AI Draft Helper
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAnnouncementModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(2,6,23,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="glass-card" style={{ width: '100%', maxWidth: 560 }}>
              <h3 style={{ margin: '0 0 12px', color: 'var(--text-strong)' }}>Publish Announcement</h3>

              <label>
                <span>Title</span>
                <input value={announcementDraft.title} onChange={(event) => setAnnouncementDraft((prev) => ({ ...prev, title: event.target.value }))} />
              </label>

              <label>
                <span>Content</span>
                <textarea
                  value={announcementDraft.content}
                  onChange={(event) => setAnnouncementDraft((prev) => ({ ...prev, content: event.target.value }))}
                  rows={5}
                  style={{ width: '100%', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--surface-elevated)', color: 'var(--text-main)', padding: 12, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </label>

              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
                <label>
                  <span>Audience</span>
                  <select value={announcementDraft.targetAudience} onChange={(event) => setAnnouncementDraft((prev) => ({ ...prev, targetAudience: event.target.value }))}>
                    {['ALL', 'STUDENTS', 'TEACHERS', 'PARENTS', 'STAFF', 'CLASS'].map((audience) => (
                      <option key={audience} value={audience}>{audience}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Priority</span>
                  <select value={announcementDraft.priority} onChange={(event) => setAnnouncementDraft((prev) => ({ ...prev, priority: event.target.value as 'NORMAL' | 'HIGH' }))}>
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </label>
              </div>

              {announcementDraft.targetAudience === 'CLASS' ? (
                <label>
                  <span>Class</span>
                  <select value={announcementDraft.targetClassId} onChange={(event) => setAnnouncementDraft((prev) => ({ ...prev, targetClassId: event.target.value }))}>
                    <option value="">Select class...</option>
                    {classes.map((academicClass) => (
                      <option key={academicClass.classId} value={academicClass.classId}>
                        {academicClass.className} - {academicClass.sectionName}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button className="secondary-button" onClick={() => setShowAnnouncementModal(false)} disabled={sending}>Cancel</button>
                <button className="primary-button" onClick={handlePublishAnnouncement} disabled={sending}>{sending ? 'Publishing...' : 'Publish'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
