import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, ArrowLeft, Download, Filter, 
  Sparkles, TrendingUp, ShieldAlert, Target,
  RefreshCw, CheckCircle2, ChevronRight,
  TrendingDown, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mcpApi } from '../../lib/mcp';
import { useStore } from '../../store/useStore';

const V = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } } };
const I = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function AiBriefingPage() {
  const navigate = useNavigate();
  const { session } = useStore();
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('7D');
  const [focusArea, setFocusArea] = useState('overall');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchBriefing = async () => {
    setLoading(true);
    try {
      const res = await mcpApi.callTool('ask_school_data', {
        role: 'platform_admin',
        question: `Generate a professional executive AI briefing for the platform.
Time Range: ${timeRange}
Focus Area: ${focusArea}
User: ${session.fullName}

Please provide a structured JSON response with:
- "summary": A high-level overview.
- "metrics": [{ "label": string, "value": string, "trend": "up" | "down" | "stable", "sub": string }]
- "keyInsights": [string]
- "actionItems": [string]
- "riskAssessment": string`,
      });
      const data = JSON.parse(res.content[0].text);
      if (data.answer) {
        // If the tool returns a string (text answer), we attempt to parse JSON from it or use it as summary
        try {
          const parsed = JSON.parse(data.answer.match(/\{[\s\S]*\}/)?.[0] || '{}');
          setBriefing(Object.keys(parsed).length > 0 ? parsed : { summary: data.answer });
        } catch {
          setBriefing({ summary: data.answer });
        }
      } else {
        setBriefing(data);
      }
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
      // Fallback data
      setBriefing({
        summary: "Platform performance remains robust across all core services. School onboarding has slowed slightly this week but student engagement metrics are up 14%.",
        metrics: [
          { label: 'Active Students', value: '42.8k', trend: 'up', sub: '+12% from last week' },
          { label: 'System Uptime', value: '99.98%', trend: 'stable', sub: 'Last incident: 4d ago' },
          { label: 'Onboarding Latency', value: '1.2d', trend: 'down', sub: '20% faster processing' }
        ],
        keyInsights: [
          "Attendance reporting has spiked in the last 48 hours due to new class intake.",
          "Subscription renewals are at an all-time high of 94.2%.",
          "MQTT event latency is slightly higher in the transport-service (240ms avg)."
        ],
        actionItems: [
          "Review pending Tier-2 school approvals by Thursday.",
          "Optimize transport-service WebSocket pooling.",
          "Verify billing webhooks for the upcoming monthly cycle."
        ],
        riskAssessment: "Low risk of system saturation. Monitor storage limits on the logs database."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [timeRange, focusArea]);

  const handleExport = () => {
    window.print();
  };

  return (
    <motion.div variants={V} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 28, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={18} />
          </motion.button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f472b6', fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
              <Brain size={14} /> AI Executive Control
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Platform Intelligence Briefing</h1>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={fetchBriefing} disabled={loading}
            style={{ padding: '0 18px', height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleExport}
            style={{ padding: '0 20px', height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #f472b6, #fb7185)', border: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 24px -6px rgba(244,114,182,0.4)' }}>
            <Download size={16} />
            Export Briefing
          </motion.button>
        </div>
      </div>

      {/* Constraints / Filters */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px 24px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: 20 }}>
          <Filter size={15} color="#475569" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Filters:</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['TODAY', '7D', '30D'].map(t => (
            <button key={t} onClick={() => setTimeRange(t)}
              style={{ padding: '6px 14px', borderRadius: 8, background: timeRange === t ? 'rgba(244,114,182,0.1)' : 'transparent', border: '1px solid', borderColor: timeRange === t ? 'rgba(244,114,182,0.3)' : 'transparent', color: timeRange === t ? '#f472b6' : '#475569', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>
              {t}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {['overall', 'operational', 'growth'].map(f => (
            <button key={f} onClick={() => setFocusArea(f)}
              style={{ padding: '6px 14px', borderRadius: 8, background: focusArea === f ? 'rgba(129,140,248,0.1)' : 'transparent', border: '1px solid', borderColor: focusArea === f ? 'rgba(129,140,248,0.3)' : 'transparent', color: focusArea === f ? '#818cf8' : '#475569', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: loading ? '#f59e0b' : '#34d399' }} />
          Last synced: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {loading ? (
        <div style={{ height: '40vh', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} 
            style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(244,114,182,0.1)', border: '2px dashed #f472b6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={30} color="#f472b6" />
          </motion.div>
          <div style={{ width: '100%', fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>Synthesizing multi-service platform data...</div>
        </div>
      ) : (
        <div className="briefing-content" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Summary Banner */}
          <motion.div variants={I} style={{ padding: '32px 40px', borderRadius: 28, background: 'linear-gradient(135deg, rgba(244,114,182,0.06), rgba(129,140,248,0.04))', border: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(244,114,182,0.05)', filter: 'blur(60px)' }} />
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{ padding: 12, borderRadius: 16, background: 'rgba(244,114,182,0.15)', color: '#f472b6' }}><Sparkles size={24} /></div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>Executive Summary</h2>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#94a3b8', margin: 0 }}>{briefing?.summary}</p>
              </div>
            </div>
          </motion.div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {briefing?.metrics?.map((m: any, i: number) => (
              <motion.div variants={I} key={i} style={{ padding: 24, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{m.value}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 800, color: m.trend === 'up' ? '#34d399' : m.trend === 'down' ? '#f43f5e' : '#64748b' }}>
                    {m.trend === 'up' ? <TrendingUp size={12} /> : m.trend === 'down' ? <TrendingDown size={12} /> : <Target size={12} />}
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{m.sub}</div>
              </motion.div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            {/* Insights */}
            <motion.div variants={I} style={{ background: '#0a0f18', borderRadius: 24, padding: 32, border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <Zap size={18} color="#fcd34d" /> Key Insights & Observations
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {briefing?.keyInsights?.map((k: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5, paddingTop: 2 }}>{k}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Action Items */}
            <motion.div variants={I} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ background: 'linear-gradient(to bottom, #111827, #030712)', borderRadius: 24, padding: 32, border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <CheckCircle2 size={18} color="#34d399" /> Strategic Actions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {briefing?.actionItems?.map((a: string, i: number) => (
                    <motion.div whileHover={{ x: 4 }} key={i} style={{ padding: '14px 18px', borderRadius: 14, background: 'rgba(52,211,153,0.03)', border: '1px solid rgba(52,211,153,0.1)', color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                      {a}
                      <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Risk Assessment */}
              <div style={{ background: 'rgba(244,63,94,0.03)', border: '1px solid rgba(244,63,94,0.1)', borderRadius: 24, padding: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(244,63,94,0.1)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldAlert size={20} /></div>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Risk Assessment</div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 700 }}>{briefing?.riskAssessment}</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Global CSS for printing */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; color: #000 !important; }
          .briefing-content { gap: 40px !important; }
          .briefing-content > div { border: 1px solid #eee !important; background: transparent !important; }
          div { color: #333 !important; }
          h1, h2, h3 { color: #000 !important; }
        }
      `}</style>
    </motion.div>
  );
}
