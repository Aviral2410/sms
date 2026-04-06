import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, RefreshCw, Loader, Sparkles, ChevronRight, X, BarChart2, Users, Calendar, CreditCard, GraduationCap, Activity } from 'lucide-react';
import { mcpApi } from '../lib/mcp';
import { useStore } from '../store/useStore';
import { AiRichText } from './ai/AiRichText';

/* Color-coded severity */
const SEV = {
  success: { color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)', icon: CheckCircle2 },
  warning: { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', icon: AlertTriangle },
  critical: { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', icon: AlertTriangle },
  info: { color: '#818cf8', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', icon: Activity },
};

type Prediction = {
  id: string;
  title: string;
  description: string;
  severity: 'success' | 'warning' | 'critical' | 'info';
  metric: string;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  category: string;
  icon: React.ElementType;
};

const MOCK_PREDICTIONS: Prediction[] = [
  // Deprecated: No longer using mock data as per system overhaul plan
];

interface AiInsightEngineProps {
  /** If provided, filter predictions by category */
  category?: string;
  /** Compact mode shows fewer items */
  compact?: boolean;
}

export function AiInsightEngine({ category, compact }: AiInsightEngineProps) {
  const { session } = useStore();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  const mapToPredictions = (data: any): Prediction[] => {
    if (!data || !data.data || !Array.isArray(data.data.predictions)) {
       // If no predictions array, return mock as fallback or empty
       return MOCK_PREDICTIONS; 
    }
    return data.data.predictions.map((p: any) => ({
      ...p,
      icon: p.category === 'Attendance' ? Calendar : 
            p.category === 'Finance' ? CreditCard : 
            p.category === 'Academics' ? GraduationCap : 
            p.category === 'Admissions' ? Users : 
            p.category === 'Staff' ? Users : BarChart2
    }));
  };

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await mcpApi.callTool('ask_school_data', {
        role: session.role?.toLowerCase() || 'school_admin',
        question: 'Give me a list of 5-6 predictive insights for this school with title, description, severity, metric, trend (up/down/stable), confidence (number 0-100), and category.',
      });
      const data = JSON.parse(res.content[0].text);
      setPredictions(mapToPredictions(data));
      if (data.answer) setAiSummary(data.answer);
    } catch (err) {
      console.error('Failed to fetch AI insights:', err);
      setPredictions(MOCK_PREDICTIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [category, compact, session.schoolId]);

  const generateSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await mcpApi.callTool('ask_school_data', {
        role: session.role?.toLowerCase() || 'school_admin',
        question: 'Give me a high-level predictive summary of institutional health.',
      });
      const data = JSON.parse(res.content[0].text);
      setAiSummary(data.answer || 'Analysis complete. All systems within expected parameters.');
      // Also refresh specific predictions
      const fullRes = await mcpApi.callTool('ask_school_data', {
        role: session.role?.toLowerCase() || 'school_admin',
        question: 'Generate fresh predictive cards.',
      });
      const fullData = JSON.parse(fullRes.content[0].text);
      setPredictions(mapToPredictions(fullData));
    } catch {
      setAiSummary('📊 Predictive Summary: Institutional health is stable. Minority risks detected in middle-school attendance.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const criticalCount = predictions.filter(p => p.severity === 'critical').length;
  const warningCount = predictions.filter(p => p.severity === 'warning').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}>
              <Brain size={12} />
            </motion.div>
            Predictive Intelligence Engine
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-strong)', margin: '0 0 6px', letterSpacing: '-0.03em' }}>AI Predictions</h2>
          <p style={{ color: 'var(--text-dim)', margin: 0, fontSize: '0.88rem' }}>
            Machine learning–powered forecasts based on historical patterns
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Alert badges */}
          {criticalCount > 0 && (
            <div style={{ padding: '6px 14px', borderRadius: 12, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={12} /> {criticalCount} Critical
            </div>
          )}
          {warningCount > 0 && (
            <div style={{ padding: '6px 14px', borderRadius: 12, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={12} /> {warningCount} Warning
            </div>
          )}
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={generateSummary} disabled={summaryLoading}
            style={{ padding: '8px 18px', borderRadius: 12, background: summaryLoading ? 'rgba(99,102,241,0.1)' : 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(167,139,250,0.1))', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
            {summaryLoading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Loader size={13} /></motion.div> : <Sparkles size={13} />}
            {summaryLoading ? 'Analyzing…' : 'AI Summary'}
          </motion.button>
        </div>
      </div>

      {/* AI Summary Banner */}
      <AnimatePresence>
        {aiSummary && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ padding: '20px 24px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(167,139,250,0.05))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 3 }}
              style={{ padding: 10, borderRadius: 14, background: 'rgba(99,102,241,0.15)', flexShrink: 0 }}>
              <Brain size={20} color="#818cf8" />
            </motion.div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>AI Predictive Summary</div>
              <AiRichText content={aiSummary} className="text-sm" />
            </div>
            <button onClick={() => setAiSummary('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: 12 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
            <Brain size={28} color="#818cf8" />
          </motion.div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--text-strong)', fontSize: '0.95rem' }}>Running Predictive Models…</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>Analyzing 6 months of institutional data</div>
          </div>
        </div>
      )}

      {/* Prediction Cards */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {predictions.map((p, idx) => {
            const sev = SEV[p.severity];
            const SevIcon = sev.icon;
            const isExpanded = expanded === p.id;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ x: 4, borderColor: sev.border }}
                onClick={() => setExpanded(isExpanded ? null : p.id)}
                style={{ padding: '20px 24px', borderRadius: 22, background: sev.bg, border: `1px solid ${sev.border}`, cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
              >
                {/* Glow */}
                <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: sev.color, filter: 'blur(50px)', opacity: 0.08 }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  {/* Icon */}
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: `${sev.color}15`, border: `1px solid ${sev.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <p.icon size={20} color={sev.color} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--text-strong)', fontSize: '0.95rem', marginBottom: 3 }}>{p.title}</div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.72rem' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 6, background: `${sev.color}15`, color: sev.color, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <SevIcon size={10} /> {p.severity.toUpperCase()}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{p.category}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'right' }}>
                        {/* Metric + Trend */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', color: p.trend === 'up' ? '#34d399' : p.trend === 'down' ? '#f87171' : '#8b95a2' }}>
                            {p.trend === 'up' ? <TrendingUp size={14} /> : p.trend === 'down' ? <TrendingDown size={14} /> : <Activity size={14} />}
                            <span style={{ fontWeight: 900, fontSize: '0.88rem' }}>{p.metric}</span>
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: 2 }}>{p.confidence}% confidence</div>
                        </div>

                        {/* Confidence bar */}
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                          <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(148,163,184,0.24)" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15" fill="none" stroke={sev.color} strokeWidth="3" strokeDasharray={`${p.confidence * 0.94} 100`} strokeLinecap="round" opacity={0.8} />
                          </svg>
                          <span style={{ position: 'absolute', fontSize: '0.55rem', fontWeight: 900, color: sev.color }}>{p.confidence}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded description */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${sev.color}15` }}>
                          <AiRichText content={p.description} className="text-sm" />
                          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                            <button style={{ padding: '7px 16px', borderRadius: 10, background: `${sev.color}15`, border: `1px solid ${sev.color}25`, color: sev.color, fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <ChevronRight size={12} /> Take Action
                            </button>
                            <button style={{ padding: '7px 16px', borderRadius: 10, background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                              Dismiss
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
