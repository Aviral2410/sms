import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, LayoutDashboard, ShieldCheck, Building2, BarChart3, Settings,
  Users, Calendar, CreditCard, FileText, Sparkles, ArrowRight, Loader,
  GraduationCap, Clock, Bus, Library, MessageSquare, Mic, Brain, TrendingUp,
  BookOpen, Bell, Command, ChevronRight
} from 'lucide-react';
import { mcpApi, McpAiResponse } from '../lib/mcp';
import { VoiceCommand } from './VoiceCommand';
import { AiDataVisualizer } from './AiDataVisualizer';
import { AiRichText } from './ai/AiRichText';

type NavItem = { icon: React.ElementType; label: string; path: string; category: string; color: string };

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', category: 'Navigation', color: '#818cf8' },
  { icon: Building2, label: 'Onboarding Queue', path: '/admin/onboarding', category: 'Admin', color: '#22d3ee' },
  { icon: ShieldCheck, label: 'All Schools', path: '/admin/schools', category: 'Admin', color: '#34d399' },
  { icon: BarChart3, label: 'Platform Analytics', path: '/admin/analytics', category: 'Admin', color: '#a78bfa' },
  { icon: TrendingUp, label: 'Pricing Control', path: '/admin/pricing', category: 'Admin', color: '#fbbf24' },
  { icon: Bell, label: 'Public Inbox', path: '/admin/inquiries', category: 'Admin', color: '#f472b6' },
  { icon: Settings, label: 'Platform Settings', path: '/settings', category: 'Admin', color: '#64748b' },
  { icon: Users, label: 'Students', path: '/students', category: 'School', color: '#22d3ee' },
  { icon: FileText, label: 'Admissions', path: '/admissions', category: 'School', color: '#a78bfa' },
  { icon: Calendar, label: 'Attendance', path: '/attendance', category: 'School', color: '#34d399' },
  { icon: GraduationCap, label: 'Exam Management', path: '/exams', category: 'School', color: '#f472b6' },
  { icon: Clock, label: 'Timetable', path: '/timetable', category: 'School', color: '#818cf8' },
  { icon: Bus, label: 'Transport', path: '/transport', category: 'School', color: '#fb923c' },
  { icon: Library, label: 'Library', path: '/library', category: 'School', color: '#34d399' },
  { icon: MessageSquare, label: 'Communication', path: '/communication', category: 'School', color: '#22d3ee' },
  { icon: CreditCard, label: 'Billing & Fees', path: '/billing', category: 'Finance', color: '#ffb663' },
  { icon: TrendingUp, label: 'School Analytics', path: '/school/analytics', category: 'Intelligence', color: '#c084fc' },
  { icon: BookOpen, label: 'My Classes', path: '/classes', category: 'Teaching', color: '#60a5fa' },
  { icon: Bell, label: 'Notices', path: '/notices', category: 'Teaching', color: '#fbbf24' },
];

const AI_SUGGESTIONS = [
  'How many students are enrolled this year?',
  'Show attendance summary for this month',
  'Which class has the lowest pass rate?',
  'List pending fee payments',
  'Summarize platform health',
];

export function CommandPalette() {
  const { searchOpen, setSearchOpen, session, paletteAiMode, setPaletteAiMode } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [aiMode, setAiMode] = useState(false);
  const [aiResponse, setAiResponse] = useState<McpAiResponse | string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeAiQuestion, setActiveAiQuestion] = useState<string | null>(null);
  const [showVoice, setShowVoice] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredNav = query.length > 0
    ? NAV_ITEMS.filter(n => n.label.toLowerCase().includes(query.toLowerCase()) || n.category.toLowerCase().includes(query.toLowerCase()))
    : NAV_ITEMS.slice(0, 6);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(!searchOpen); }
      if (e.key === 'Escape') {
        if (aiResponse || activeAiQuestion || query) {
          setAiResponse('');
          setActiveAiQuestion(null);
          setQuery('');
        } else {
          setSearchOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen, setSearchOpen]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setQuery('');
      setAiMode(paletteAiMode);
      setAiResponse(null);
      setActiveAiQuestion(null);
      setSelectedIndex(0);
    } else {
      setPaletteAiMode(false);
    }
  }, [paletteAiMode, searchOpen, setPaletteAiMode]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, aiMode]);

  const handleAiQuery = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setAiLoading(true); setAiResponse(null);
    setActiveAiQuestion(q);
    try {
      const rawRole = session.role?.toLowerCase() || 'school_admin';
      // MCP server only accepts 'platform_admin', not 'super_admin'
      const role = rawRole === 'super_admin' ? 'platform_admin' : rawRole;
      const isPlatformAdmin = role === 'platform_admin' || rawRole === 'super_admin';
      const args: Record<string, any> = { role, question: q };
      // school-level roles need schoolId + email context
      if (!isPlatformAdmin && session.schoolId) args.schoolId = session.schoolId;
      if (!isPlatformAdmin && session.email) args.email = session.email;
      const res = await mcpApi.callTool('ask_school_data', args);
      const data = JSON.parse(res.content[0].text) as McpAiResponse;
      setAiResponse(data);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('502') || msg.includes('503') || msg.includes('ECONNREFUSED') || msg.includes('Failed to fetch')) {
        setAiResponse('⚠️ AI service is currently unavailable. Please ensure the MCP server container is running.');
      } else {
        setAiResponse(`Could not process your question: ${msg || 'Unknown error'}`);
      }
    } finally {
      setAiLoading(false);
    }
  }, [session.role, session.schoolId, session.email]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (aiMode) { handleAiQuery(query); }
      else if (filteredNav.length > 0) { navigate(filteredNav[0].path); setSearchOpen(false); }
    }
  };

  const go = (path: string) => { navigate(path); setSearchOpen(false); setQuery(''); };

  if (!searchOpen) return null;

  return (
    <>
      <div onClick={() => setSearchOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(2,6,23,0.52)', backdropFilter: 'blur(8px)' }} />

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: -20 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ position: 'fixed', top: '12vh', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 640, zIndex: 1000, fontFamily: "'Manrope','Inter',system-ui,sans-serif" }}
        >
          {/* Search Box */}
          <div className="themed-panel" style={{ background: 'color-mix(in srgb, var(--bg-dropdown) 92%, transparent)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 30px 80px rgba(2,6,23,0.28), 0 0 0 1px rgba(255,255,255,0.04)' }}>

            {/* Input Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: `1px solid ${aiMode ? 'rgba(167,139,250,0.25)' : 'var(--glass-border)'}`, transition: 'border-color 0.2s' }}>
              {aiMode ? (
                <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}>
                  <Brain size={20} color="#a78bfa" />
                </motion.div>
              ) : (
                <Search size={20} color="var(--text-muted)" />
              )}
              <input
                ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                placeholder={aiMode ? 'Ask anything about your school data…' : 'Search pages or press Tab for AI…'}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-strong)', fontSize: '1rem', fontFamily: 'inherit', caretColor: aiMode ? '#a78bfa' : '#22d3ee' }}
                onKeyDown={e => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    setAiMode(m => {
                      const next = !m;
                      setPaletteAiMode(next);
                      return next;
                    });
                  }
                  else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (!aiMode) setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredNav.length));
                  }
                  else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (!aiMode) setSelectedIndex(prev => (prev - 1 + filteredNav.length) % Math.max(1, filteredNav.length));
                  }
                  else if (e.key === 'Enter') {
                    if (aiMode) { handleAiQuery(query); }
                    else if (filteredNav.length > 0) { navigate(filteredNav[selectedIndex].path); setSearchOpen(false); }
                  }
                }}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Voice button */}
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowVoice(true)}
                  style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#22d3ee' }}>
                  <Mic size={14} />
                </motion.button>
                {/* AI toggle */}
                <button onClick={() => {
                  setAiMode(m => {
                    const next = !m;
                    setPaletteAiMode(next);
                    return next;
                  });
                }}
                  style={{ padding: '4px 10px', borderRadius: 8, background: aiMode ? 'rgba(167,139,250,0.2)' : 'var(--surface-elevated)', border: `1px solid ${aiMode ? 'rgba(167,139,250,0.4)' : 'var(--glass-border)'}`, color: aiMode ? '#a78bfa' : 'var(--text-soft)', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', transition: 'all 0.2s' }}>
                  <Sparkles size={11} /> AI {aiMode ? 'ON' : 'OFF'}
                </button>
                <button onClick={() => setSearchOpen(false)} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}><X size={16} /></button>
              </div>
            </div>

            {/* AI Mode */}
            {aiMode && (
              <div style={{ padding: '16px 20px 0' }}>
                {/* Suggestions / Questions */}
                {(!query || activeAiQuestion) && (
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>AI Insights</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                      {AI_SUGGESTIONS.map(s => {
                        const isActive = activeAiQuestion === s;
                        return (
                          <div key={s} style={{ marginBottom: isActive ? 8 : 0 }}>
                            <button onClick={() => { setQuery(s); handleAiQuery(s); }}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: isActive ? 'rgba(167,139,250,0.12)' : 'var(--surface-accent-soft)', border: `1px solid ${isActive ? 'rgba(167,139,250,0.34)' : 'var(--surface-accent-border)'}`, color: isActive ? 'var(--text-strong)' : 'var(--text-soft)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.2s' }}
                              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(167,139,250,0.12)'; e.currentTarget.style.color = 'var(--text-strong)'; } }}
                              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'var(--surface-accent-soft)'; e.currentTarget.style.color = 'var(--text-soft)'; } }}>
                              <Sparkles size={12} color="#a78bfa" style={{ flexShrink: 0 }} />
                              <span style={{ flex: 1 }}>{s}</span>
                              {isActive ? <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#a78bfa', opacity: 0.5 }} /> : <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />}
                            </button>
                            
                            <AnimatePresence>
                              {isActive && (aiLoading || aiResponse) && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                  style={{ overflow: 'hidden' }}>
                                  <div className="ai-response-shell" style={{ margin: '8px 4px 4px 12px', padding: '12px 16px', borderLeft: '2px solid rgba(167,139,250,0.4)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                                    {aiLoading ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a78bfa' }}>
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Loader size={12} /></motion.div>
                                        Analyzing data...
                                      </div>
                                    ) : (
                                      <div>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                          <Brain size={10} /> AI Analysis
                                        </div>
                                        {typeof aiResponse === 'string' ? <AiRichText content={aiResponse} /> : <AiDataVisualizer response={aiResponse!} />}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Free-form Query results (when not clicking a suggestion or when typing something else) */}
                {query && !AI_SUGGESTIONS.includes(query) && (
                  <div>
                    {aiLoading && !activeAiQuestion && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px', color: '#a78bfa', fontSize: '0.85rem', marginBottom: 12 }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Loader size={16} /></motion.div>
                        Processing your request…
                      </div>
                    )}
                    {aiResponse && !aiLoading && !activeAiQuestion && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        style={{ marginBottom: 16, padding: '16px 18px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(99,102,241,0.04))', border: '1px solid rgba(167,139,250,0.2)' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center' }}><Brain size={11} /> AI Answer</div>
                        <div style={{ fontSize: '0.88rem', lineHeight: 1.65, margin: 0 }}>
                          {typeof aiResponse === 'string' ? <AiRichText content={aiResponse} /> : <AiDataVisualizer response={aiResponse!} />}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Nav Results */}
            {!aiMode && (
              <div style={{ padding: '10px 12px 12px' }}>
                {filteredNav.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No pages match "{query}"</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {query === '' && <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '6px 10px' }}>Recent / Quick Nav</div>}
                    {filteredNav.map((item, i) => (
                      <motion.button key={item.path + item.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                        onClick={() => go(item.path)}
                        onMouseEnter={() => setSelectedIndex(i)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 14, background: selectedIndex === i ? 'var(--surface-elevated)' : 'transparent', border: `1px solid ${selectedIndex === i ? 'var(--glass-border)' : 'transparent'}`, color: selectedIndex === i ? 'var(--text-strong)' : 'var(--text-soft)', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'left' }}
                      >
                        <div style={{ width: 30, height: 30, borderRadius: 9, background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <item.icon size={15} color={item.color} />
                        </div>
                        <span style={{ flex: 1, fontWeight: 600 }}>{item.label}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 6, background: 'var(--surface-elevated)' }}>{item.category}</span>
                        <ArrowRight size={12} style={{ color: selectedIndex === i ? item.color : 'var(--text-muted)', transform: selectedIndex === i ? 'translateX(2px)' : 'none', transition: 'all 0.2s' }} />
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer hint */}
            <div style={{ padding: '10px 20px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 16, fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              <span><kbd style={{ fontFamily: 'monospace', background: 'var(--surface-elevated)', padding: '1px 5px', borderRadius: 4, fontSize: '0.65rem', border: '1px solid var(--glass-border)' }}>↑↓</kbd> Navigate</span>
              <span><kbd style={{ fontFamily: 'monospace', background: 'var(--surface-elevated)', padding: '1px 5px', borderRadius: 4, fontSize: '0.65rem', border: '1px solid var(--glass-border)' }}>↵</kbd> Select</span>
              <span><kbd style={{ fontFamily: 'monospace', background: 'var(--surface-elevated)', padding: '1px 5px', borderRadius: 4, fontSize: '0.65rem', border: '1px solid var(--glass-border)' }}>Tab</kbd> Toggle AI</span>
              <span style={{ marginLeft: 'auto' }}><Mic size={10} style={{ display: 'inline', marginRight: 4 }} />Click mic for voice</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Voice Command overlay */}
      <AnimatePresence>
        {showVoice && (
          <VoiceCommand 
            autoStart 
            onClose={() => setShowVoice(false)} 
            onResult={(text) => {
              setQuery(text);
              if (aiMode) {
                handleAiQuery(text);
              }
            }} 
          />
        )}
      </AnimatePresence>
    </>
  );
}
