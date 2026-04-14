import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Library, Search, BookOpen, Plus, Sparkles, Star, Download, 
  ExternalLink, Filter, X, Brain, Bookmark, BookmarkCheck,
  History, Book, FileText, Globe, MoreVertical, Trash2
} from 'lucide-react';
import { schoolOpsApi, LibraryResourceResponse } from '../../lib/api';
import { useStore } from '../../store/useStore';
import { toast } from 'sonner';
import UploadResourceModal from '../../components/library/UploadResourceModal';
import StudyAssistantWidget from '../../components/library/StudyAssistantWidget';

const V = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const I = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const COLOR = '#34d399';

const TYPE_CONFIG: Record<string, { color: string, icon: any }> = { 
  BOOK: { color: '#60a5fa', icon: Book }, 
  NOTE: { color: '#f472b6', icon: FileText }, 
  DOCUMENT: { color: '#fbbf24', icon: FileText }, 
  LINK: { color: '#34d399', icon: Globe } 
};

export default function LibraryPage() {
  const { session } = useStore();
  const [resources, setResources] = useState<LibraryResourceResponse[]>([]);
  const [recent, setRecent] = useState<LibraryResourceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [showUpload, setShowUpload] = useState(false);
  const [aiContext, setAiContext] = useState<LibraryResourceResponse | null>(null);
  const [showAi, setShowAi] = useState(false);
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);

  const fetchResources = async () => {
    if (!session.schoolId) return;
    setLoading(true);
    try {
      const data = await schoolOpsApi.searchLibrary({
        schoolId: session.schoolId!,
        query: search || undefined,
        resourceType: filter === 'ALL' ? undefined : filter,
        onlyBookmarked: onlyBookmarked || undefined
      }, session.role === 'STUDENT' ? (session as any).userId : undefined);
      setResources(data);

      if (session.role === 'STUDENT') {
        const rec = await schoolOpsApi.getRecentResources(session.schoolId!, (session as any).userId);
        setRecent(rec);
      }
    } catch (err: any) {
      toast.error('Failed to load library resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [session.schoolId, filter, onlyBookmarked]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 2 || search.length === 0) fetchResources();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleBookmark = async (res: LibraryResourceResponse) => {
    if (!session.schoolId || !(session as any).userId) return;
    try {
      await schoolOpsApi.toggleBookmark({
        schoolId: session.schoolId!,
        userId: (session as any).userId,
        resourceId: res.resourceId
      });
      setResources(prev => prev.map(r => 
        r.resourceId === res.resourceId ? { ...r, isBookmarked: !r.isBookmarked } : r
      ));
      toast.success(res.isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
    } catch (err) {
      toast.error('Failed to update bookmark');
    }
  };

  const handleAccess = async (res: LibraryResourceResponse) => {
    if (!session.schoolId || !(session as any).userId) return;
    try {
      await schoolOpsApi.logView(session.schoolId!, (session as any).userId, res.resourceId);
      window.open(res.accessUrl, '_blank');
    } catch (err) {
      console.error('Failed to log view', err);
    }
  };

  const isContributor = ['SCHOOL_ADMIN', 'TEACHER', 'LIBRARIAN'].includes(session.role!);

  return (
    <motion.div variants={V} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 64 }}>
      {/* Header */}
      <motion.div variants={I} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 999, background: `${COLOR}15`, border: `1px solid ${COLOR}30`, color: COLOR, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}><Library size={12} /> Digital Library</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.04em' }}>Study Resources</h1>
          <p style={{ color: '#8b95a2', margin: 0, fontSize: '0.95rem' }}>Centralized hub for books, teacher notes, and AI research tools.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            onClick={() => setShowAi(true)}
            style={{ padding: '12px 20px', borderRadius: 14, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
            <Brain size={16} /> Study Assistant
          </motion.button>
          {isContributor && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowUpload(true)}
              style={{ padding: '12px 24px', borderRadius: 14, background: `linear-gradient(135deg, ${COLOR}, #10b981)`, border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
              <Plus size={16} /> Contribute
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: session.role === 'STUDENT' ? '1fr 320px' : '1fr', gap: 24, alignItems: 'flex-start' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Search + Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 300 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search by title, subject, or tags..." 
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 42px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit' }} 
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['ALL', 'BOOK', 'NOTE', 'DOCUMENT', 'LINK'].map(f => (
                <button 
                  key={f} 
                  onClick={() => setFilter(f)} 
                  style={{ 
                    padding: '10px 18px', 
                    borderRadius: 12, 
                    background: filter === f ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', 
                    border: `1px solid ${filter === f ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, 
                    color: filter === f ? '#fff' : '#8b95a2', 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    cursor: 'pointer', 
                    fontFamily: 'inherit', 
                    transition: 'all 0.2s' 
                }}>{f}</button>
              ))}
              <button 
                onClick={() => setOnlyBookmarked(!onlyBookmarked)}
                style={{ 
                  padding: '10px', 
                  borderRadius: 12, 
                  background: onlyBookmarked ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.03)', 
                  border: `1px solid ${onlyBookmarked ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.06)'}`, 
                  color: onlyBookmarked ? '#fbbf24' : '#8b95a2', 
                  cursor: 'pointer' 
                }}
              >
                <Bookmark size={16} fill={onlyBookmarked ? '#fbbf24' : 'none'} />
              </button>
            </div>
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {loading ? (
              [1, 2, 3, 4].map(n => (
                <div key={n} style={{ height: 260, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
              ))
            ) : resources.map(r => (
              <motion.div 
                key={r.resourceId} 
                variants={I} 
                whileHover={{ y: -6, borderColor: `${TYPE_CONFIG[r.resourceType]?.color}40`, background: 'rgba(255,255,255,0.04)' }}
                style={{ padding: '24px', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden', cursor: 'default', display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 10, background: `${TYPE_CONFIG[r.resourceType]?.color}15`, border: `1px solid ${TYPE_CONFIG[r.resourceType]?.color}25`, color: TYPE_CONFIG[r.resourceType]?.color, fontSize: '0.7rem', fontWeight: 800 }}>
                    {React.createElement(TYPE_CONFIG[r.resourceType]?.icon, { size: 10 })}
                    {r.resourceType}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => handleBookmark(r)}
                      style={{ padding: 6, background: 'none', border: 'none', color: r.isBookmarked ? '#fbbf24' : '#475569', cursor: 'pointer' }}
                    >
                      {r.isBookmarked ? <BookmarkCheck size={18} fill="#fbbf24" /> : <Bookmark size={18} />}
                    </button>
                    <button 
                      onClick={() => { setAiContext(r); setShowAi(true); }}
                      style={{ padding: 6, background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer' }}
                    >
                      <Brain size={18} />
                    </button>
                  </div>
                </div>

                <div onClick={() => handleAccess(r)} style={{ cursor: 'pointer' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: '0 0 4px', lineHeight: 1.4 }}>{r.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: '#8b95a2', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.description || 'No description provided.'}</p>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', fontSize: '0.65rem', fontWeight: 700, color: '#60a5fa' }}>{r.subject}</div>
                  <div style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>{r.gradeLevel}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700 }}>
                    <Download size={10} style={{ display: 'inline', marginRight: 4 }} /> {r.viewCount || 0}
                  </div>
                  <button 
                    onClick={() => handleAccess(r)}
                    style={{ padding: '8px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Open Resource
                  </button>
                </div>
              </motion.div>
            ))}
            {!loading && resources.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '80px 0', textAlign: 'center', color: '#475569' }}>
                <Library size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                <div style={{ fontWeight: 800, color: '#8b95a2' }}>No resources found</div>
                <div style={{ fontSize: '0.8rem' }}>Try adjusting your search or filters.</div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Recently Viewed (Student Only) */}
        {session.role === 'STUDENT' && (
          <motion.aside variants={I} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ padding: 24, borderRadius: 28, background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <History size={18} color="#a78bfa" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: 0 }}>Jump Back In</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recent.slice(0, 5).map(r => (
                  <div 
                    key={r.resourceId} 
                    onClick={() => handleAccess(r)}
                    style={{ padding: 16, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>{r.title}</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569' }}>{r.subject} • {new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
                {recent.length === 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#475569', textAlign: 'center', padding: '20px 0' }}>Your recently viewed items will appear here.</div>
                )}
              </div>
            </div>

            <div style={{ padding: 24, borderRadius: 28, background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Sparkles size={18} color="#34d399" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: 0 }}>Smart Tip</h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#8b95a2', lineHeight: 1.6, margin: 0 }}>
                Did you know? You can ask the <strong>Study Assistant</strong> to generate a quiz based on any resource in the library! Just click the brain icon.
              </p>
            </div>
          </motion.aside>
        )}
      </div>

      <AnimatePresence>
        {showUpload && (
          <UploadResourceModal 
            schoolId={session.schoolId!} 
            userId={(session as any).userId} 
            onClose={() => setShowUpload(false)} 
            onSuccess={fetchResources}
          />
        )}
        {showAi && (
          <StudyAssistantWidget 
            schoolId={session.schoolId!} 
            userId={(session as any).userId} 
            contextResource={aiContext || undefined}
            onClose={() => { setShowAi(false); setAiContext(null); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
