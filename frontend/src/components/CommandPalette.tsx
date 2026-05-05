import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, LayoutDashboard, ShieldCheck, Building2, BarChart3, Settings,
  Users, Calendar, CreditCard, FileText, Sparkles, ArrowRight, Loader,
  GraduationCap, Clock, Bus, Library, MessageSquare, Mic, Brain, TrendingUp,
  BookOpen, Bell, Command, ChevronRight, CornerDownLeft
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
  const [aiResponse, setAiResponse] = useState<McpAiResponse | string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeAiQuestion, setActiveAiQuestion] = useState<string | null>(null);
  const [showVoice, setShowVoice] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredNav = query.length > 0
    ? NAV_ITEMS.filter(n => n.label.toLowerCase().includes(query.toLowerCase()) || n.category.toLowerCase().includes(query.toLowerCase()))
    : NAV_ITEMS.slice(0, 6);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(!searchOpen); }
      if (e.key === 'Escape') {
        if (aiResponse || activeAiQuestion || query) {
          setAiResponse(null);
          setActiveAiQuestion(null);
          setQuery('');
        } else {
          setSearchOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen, setSearchOpen, aiResponse, activeAiQuestion, query]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setQuery('');
      setAiResponse(null);
      setActiveAiQuestion(null);
      setSelectedIndex(0);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiResponse, aiLoading, activeAiQuestion]);

  const handleAiQuery = useCallback(async (q: string) => {
    const text = q.trim();
    if (!text) return;
    setAiLoading(true); 
    setAiResponse(null);
    setActiveAiQuestion(text);
    
    try {
      const rawRole = session.role?.toLowerCase() || 'school_admin';
      const role = rawRole === 'super_admin' ? 'platform_admin' : rawRole;
      const isPlatformAdmin = role === 'platform_admin' || rawRole === 'super_admin';
      const args: Record<string, any> = { role, question: text };
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
      if (paletteAiMode) { 
        handleAiQuery(query); 
      } else if (filteredNav.length > 0) { 
        navigate(filteredNav[selectedIndex].path); 
        setSearchOpen(false); 
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!paletteAiMode) setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredNav.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!paletteAiMode) setSelectedIndex(prev => (prev - 1 + filteredNav.length) % Math.max(1, filteredNav.length));
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setPaletteAiMode(!paletteAiMode);
    }
  };

  if (!searchOpen) return null;

  const isModal = !paletteAiMode;

  return (
    <>
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={() => setSearchOpen(false)} 
        style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: 900, 
          background: isModal ? 'rgba(2,6,23,0.52)' : 'rgba(2,6,23,0.2)', 
          backdropFilter: isModal ? 'blur(8px)' : 'none' 
        }} 
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={paletteAiMode ? 'ai-sidebar' : 'search-modal'}
          initial={isModal ? { opacity: 0, scale: 0.94, y: -20 } : { x: '100%' }}
          animate={isModal ? { opacity: 1, scale: 1, y: 0 } : { x: 0 }}
          exit={isModal ? { opacity: 0, scale: 0.94, y: -20 } : { x: '100%' }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{ 
            position: 'fixed', 
            top: isModal ? '12vh' : 0, 
            right: 0,
            left: isModal ? '50%' : 'auto',
            transform: isModal ? 'translateX(-50%)' : 'none',
            width: '100%', 
            maxWidth: isModal ? 640 : 480, 
            height: isModal ? 'auto' : '100vh',
            maxHeight: isModal ? '80vh' : '100vh',
            zIndex: 1000, 
            fontFamily: "'Manrope','Inter',system-ui,sans-serif",
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-dropdown)',
            borderRadius: isModal ? 22 : 0,
            boxShadow: isModal 
              ? '0 30px 80px rgba(2,6,23,0.28), 0 0 0 1px rgba(255,255,255,0.04)' 
              : '-10px 0 40px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            borderLeft: isModal ? 'none' : '1px solid var(--glass-border)'
          }}
        >
          {/* Header Row */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            padding: '16px 20px', 
            borderBottom: `1px solid ${paletteAiMode ? 'rgba(167,139,250,0.25)' : 'var(--glass-border)'}`,
            background: paletteAiMode ? 'rgba(15,23,42,0.4)' : 'transparent',
            flexShrink: 0
          }}>
            {paletteAiMode ? (
              <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}>
                <Brain size={20} color="#a78bfa" />
              </motion.div>
            ) : (
              <Search size={20} color="var(--text-muted)" />
            )}
            
            <input
              ref={inputRef} 
              value={query} 
              onChange={e => setQuery(e.target.value)}
              placeholder={paletteAiMode ? 'Ask insights about school data…' : 'Search pages or press Tab for AI…'}
              style={{ 
                flex: 1, 
                background: 'none', 
                border: 'none', 
                outline: 'none', 
                color: 'var(--text-strong)', 
                fontSize: '1rem', 
                fontFamily: 'inherit', 
                caretColor: paletteAiMode ? '#a78bfa' : '#22d3ee' 
              }}
              onKeyDown={handleKeyDown}
            />

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <motion.button 
                whileHover={{ scale: 1.1 }} 
                whileTap={{ scale: 0.9 }} 
                onClick={() => setShowVoice(true)}
                style={{ 
                  width: 32, height: 32, borderRadius: 9, 
                  background: 'rgba(34,211,238,0.1)', 
                  border: '1px solid rgba(34,211,238,0.2)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', color: '#22d3ee' 
                }}
              >
                <Mic size={14} />
              </motion.button>
              
              <button 
                onClick={() => setPaletteAiMode(!paletteAiMode)}
                style={{ 
                  padding: '5px 12px', borderRadius: 10, 
                  background: paletteAiMode ? 'rgba(167,139,250,0.2)' : 'var(--surface-elevated)', 
                  border: `1px solid ${paletteAiMode ? 'rgba(167,139,250,0.4)' : 'var(--glass-border)'}`, 
                  color: paletteAiMode ? '#a78bfa' : 'var(--text-soft)', 
                  fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', 
                  display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' 
                }}
              >
                <Sparkles size={11} /> Aura {paletteAiMode ? 'ACTIVE' : 'MODAL'}
              </button>
              
              <button onClick={() => setSearchOpen(false)} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Results Area */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: paletteAiMode ? '20px' : '10px 12px 12px' }}>
            {paletteAiMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Suggestions Section */}
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Quick Insights</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {AI_SUGGESTIONS.map(s => {
                      const isActive = activeAiQuestion === s;
                      return (
                        <div key={s}>
                          <button 
                            onClick={() => {
                              if (isActive) {
                                setActiveAiQuestion(null);
                                setAiResponse(null);
                              } else {
                                setQuery(s);
                                handleAiQuery(s);
                              }
                            }}
                            className="suggestion-item"
                            style={{ 
                              width: '100%', display: 'flex', alignItems: 'center', gap: 12, 
                              padding: '12px 16px', borderRadius: 16, 
                              background: isActive ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.02)', 
                              border: `1px solid ${isActive ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.05)'}`, 
                              color: isActive ? 'var(--text-strong)' : 'var(--text-soft)', 
                              fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' 
                            }}
                          >
                            <Sparkles size={14} color="#a78bfa" style={{ flexShrink: 0 }} />
                            <span style={{ flex: 1, fontWeight: isActive ? 700 : 500 }}>{s}</span>
                            {isActive ? <X size={14} style={{ color: 'var(--text-muted)' }} /> : <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />}
                          </button>
                          
                          {isActive && (aiLoading || aiResponse) && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ overflow: 'hidden' }}>
                              <div style={{ padding: '20px 0 10px 16px', borderLeft: '2px solid rgba(167,139,250,0.4)', marginTop: 4, marginLeft: 16 }}>
                                {aiLoading ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#a78bfa', fontSize: '0.85rem' }}>
                                    <Loader className="animate-spin" size={16} /> Retrieving intel...
                                  </div>
                                ) : (
                                  <div className="animate-in fade-in slide-in-from-left-2 duration-500">
                                    <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <Brain size={12} /> Live Analysis
                                    </div>
                                    {typeof aiResponse === 'string' ? <AiRichText content={aiResponse} /> : <AiDataVisualizer response={aiResponse!} />}
                                    
                                    {typeof aiResponse !== 'string' && aiResponse?.suggestedQuestions && aiResponse.suggestedQuestions.length > 0 && (
                                      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Follow-up Questions</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                          {aiResponse.suggestedQuestions.map((sq, idx) => (
                                            <button
                                              key={idx}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setQuery(sq);
                                                handleAiQuery(sq);
                                              }}
                                              style={{ 
                                                padding: '6px 12px', borderRadius: 10, background: 'rgba(167,139,250,0.1)', 
                                                border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa', 
                                                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' 
                                              }}
                                            >
                                              {sq}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Free-form Query results (fallback) */}
                {query && !AI_SUGGESTIONS.includes(query) && (
                  <div style={{ padding: '4px' }}>
                    {aiLoading ? (
                      <div style={{ padding: '16px', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(167,139,250,0.05)', borderRadius: 16 }}>
                        <Loader className="animate-spin" size={18} /> Consulting school database...
                      </div>
                    ) : aiResponse ? (
                      <div style={{ background: 'rgba(15,23,42,0.4)', borderRadius: 20, border: '1px solid rgba(167,139,250,0.2)', padding: '24px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Brain size={14} /> AI Analysis</div>
                        {typeof aiResponse === 'string' ? <AiRichText content={aiResponse} /> : <AiDataVisualizer response={aiResponse!} />}
                        
                        {typeof aiResponse !== 'string' && aiResponse?.suggestedQuestions && aiResponse.suggestedQuestions.length > 0 && (
                          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(167,139,250,0.1)' }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Suggested Follow-ups</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {aiResponse.suggestedQuestions.map((sq, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setQuery(sq);
                                    handleAiQuery(sq);
                                  }}
                                  style={{ 
                                    width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 12, 
                                    background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.1)', 
                                    color: '#a78bfa', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 10
                                  }}
                                >
                                  <Sparkles size={12} /> {sq}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                         <CornerDownLeft size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
                         <p className="text-sm">Press Enter to process your query</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredNav.length === 0 ? (
                  <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <Search size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
                    <p>No pages match "{query}"</p>
                  </div>
                ) : (
                  <>
                    {query === '' && <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '10px' }}>Global Shortcuts</div>}
                    {filteredNav.map((item, i) => (
                      <motion.button 
                        key={item.path + item.label} 
                        initial={{ opacity: 0, x: -8 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ delay: i * 0.03 }}
                        onClick={() => { navigate(item.path); setSearchOpen(false); }}
                        onMouseEnter={() => setSelectedIndex(i)}
                        style={{ 
                          width: '100%', display: 'flex', alignItems: 'center', gap: 14, 
                          padding: '12px 16px', borderRadius: 16, 
                          background: selectedIndex === i ? 'var(--surface-elevated)' : 'transparent', 
                          border: `1px solid ${selectedIndex === i ? 'var(--glass-border)' : 'transparent'}`, 
                          color: selectedIndex === i ? 'var(--text-strong)' : 'var(--text-soft)', 
                          fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' 
                        }}
                      >
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <item.icon size={16} color={item.color} />
                        </div>
                        <span style={{ flex: 1, fontWeight: 600 }}>{item.label}</span>
                        <ArrowRight size={14} style={{ opacity: selectedIndex === i ? 1 : 0, color: item.color, transform: selectedIndex === i ? 'none' : 'translateX(-4px)', transition: 'all 0.2s' }} />
                      </motion.button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <footer style={{ 
            padding: '16px 24px', borderTop: '1px solid var(--glass-border)', 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700,
            background: paletteAiMode ? 'rgba(15,23,42,0.4)' : 'transparent',
            flexShrink: 0 
          }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <span><kbd style={{ background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)', padding: '2px 6px', borderRadius: 4, marginRight: 6 }}>Tab</kbd> Toggle Aura</span>
              <span><kbd style={{ background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)', padding: '2px 6px', borderRadius: 4, marginRight: 6 }}>↵</kbd> {paletteAiMode ? 'Ask Aura' : 'Navigate'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Mic size={12} />
              <span>Voice Ready</span>
            </div>
          </footer>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showVoice && (
          <VoiceCommand 
            autoStart 
            onClose={() => setShowVoice(false)} 
            onResult={(text) => {
              setQuery(text);
              if (paletteAiMode) handleAiQuery(text);
            }} 
          />
        )}
      </AnimatePresence>
    </>
  );
}
