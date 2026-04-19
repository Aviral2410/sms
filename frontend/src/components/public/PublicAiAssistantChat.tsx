import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Bot, Send, X, Sparkles, ChevronRight, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { readSseStream, tryParseJson } from '../../lib/sse';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  response?: RenderedResponse;
  streaming?: boolean;
};

type RenderedResponse = {
  type: 'chart' | 'table' | 'text' | 'action';
  data: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

const EXAMPLE_QUESTIONS = [
  'Compare our subscription plans.',
  'Request a demo for my school.',
  'What is included in the Academics module?',
  'What is on the platform roadmap for 2026?',
  'How many schools are already on ElevateSmart?',
  'Tell me about the platform vision.',
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const fabStyle: React.CSSProperties = {
  position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
  width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
  background: 'linear-gradient(135deg, #065f46, #10b981)',
  color: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 4px 20px rgba(16,185,129,0.4), 0 0 0 1px rgba(16,185,129,0.2)',
};
const fabPulseStyle: React.CSSProperties = {
  position: 'absolute', inset: 0, borderRadius: '50%',
  background: 'rgba(16,185,129,0.3)', pointerEvents: 'none',
};
const chatWindowStyle: React.CSSProperties = {
  position: 'fixed', zIndex: 9998,
  display: 'flex', flexDirection: 'column',
  background: 'rgba(2, 12, 27, 0.94)',
  backdropFilter: 'blur(32px)',
  border: '1px solid rgba(16,185,129,0.25)',
  borderRadius: 20,
  boxShadow: '0 32px 96px rgba(0,0,0,0.8), 0 0 0 1px rgba(16,185,129,0.08)',
  overflow: 'hidden',
  userSelect: 'none',
};
const headerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '14px 16px',
  background: 'linear-gradient(135deg, rgba(6,95,70,0.5), rgba(2,44,34,0.7))',
  borderBottom: '1px solid rgba(16,185,129,0.2)',
  flexShrink: 0,
  cursor: 'grab',
};
const headerIconStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 10,
  background: 'linear-gradient(135deg, #065f46, #10b981)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#ecfdf5', boxShadow: '0 0 14px rgba(16,185,129,0.5)',
};
const closeBtnStyle: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 9, border: '1px solid rgba(16,185,129,0.2)',
  background: 'rgba(16,185,129,0.08)', color: 'rgba(167,243,208,0.8)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};
const threadStyle: React.CSSProperties = {
  flex: 1, overflowY: 'auto',
  display: 'flex', flexDirection: 'column',
  paddingBottom: 20,
  userSelect: 'text',
};
const botAvatarStyle: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 8, flexShrink: 0, marginRight: 8, marginTop: 2,
  background: 'linear-gradient(135deg, #065f46, #10b981)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ecfdf5',
};
const assistantBubbleStyle: React.CSSProperties = {
  maxWidth: '86%', padding: '12px 14px',
  background: 'rgba(6,95,70,0.14)',
  border: '1px solid rgba(16,185,129,0.2)',
  borderLeft: '4px solid rgba(16,185,129,0.6)',
  borderRadius: '0 14px 14px 14px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
};
const userBubbleStyle: React.CSSProperties = {
  maxWidth: '82%', padding: '12px 14px',
  background: 'linear-gradient(135deg, rgba(6,95,70,0.6), rgba(4,120,87,0.4))',
  border: '1px solid rgba(16,185,129,0.4)',
  borderRadius: '14px 14px 0 14px',
  color: '#ecfdf5',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
};
const composerStyle: React.CSSProperties = {
  padding: '12px 16px 16px',
  borderTop: '1px solid rgba(16,185,129,0.2)',
  background: 'rgba(2,12,27,0.7)',
  flexShrink: 0,
  position: 'relative',
};
const resizeGrabberStyle: React.CSSProperties = {
  position: 'absolute', bottom: 0, right: 0, width: 16, height: 16,
  cursor: 'nwse-resize',
  background: 'linear-gradient(135deg, transparent 50%, rgba(16,185,129,0.4) 50%)',
};
const exampleBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '6px 9px', background: 'rgba(16,185,129,0.06)',
  border: '1px solid rgba(16,185,129,0.14)', borderRadius: 7,
  color: 'rgba(167,243,208,0.75)', fontSize: 11.5, cursor: 'pointer', textAlign: 'left',
};
const preStyle: React.CSSProperties = {
  margin: 0, maxHeight: 160, overflow: 'auto', fontSize: 11,
  background: 'rgba(2,12,27,0.6)', padding: 8, borderRadius: 7,
  color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.1)',
};
const msgTextStyle: React.CSSProperties = {
  margin: 0, fontSize: 13, lineHeight: 1.65, color: '#d1fae5',
};
const inputStyle: React.CSSProperties = {
  flex: 1, padding: '9px 12px',
  background: 'rgba(6,95,70,0.1)', border: '1px solid rgba(16,185,129,0.2)',
  borderRadius: 10, color: '#d1fae5', fontSize: 13, outline: 'none', fontFamily: 'inherit',
};
const sendBtnStyle: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
  background: 'linear-gradient(135deg, #065f46, #10b981)', color: '#ecfdf5',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  boxShadow: '0 2px 10px rgba(16,185,129,0.3)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderMarkdownLite(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    const rendered = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: '#a7f3d0', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} style={{
            background: 'rgba(16,185,129,0.12)', color: '#6ee7b7',
            padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.88em'
          }}>
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={i}>{part}</span>;
    });
    return (
      <React.Fragment key={lineIdx}>
        {rendered}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

const StreamingText: React.FC<{ text: string; streaming?: boolean }> = ({ text, streaming }) => {
  const words = text.split(/(\s+)/);
  return (
    <motion.span style={{ display: 'inline' }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={streaming ? { opacity: 0, y: 3 } : { opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.14, delay: streaming ? Math.min(i * 0.016, 1.0) : 0 }}
          style={{ display: 'inline' }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
};

const ThinkingDots: React.FC = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '8px 0' }}>
    {[0, 1, 2].map((i) => (
      <motion.span key={i}
        animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.18, ease: 'easeInOut' }}
        style={{ display: 'block', width: 6, height: 6, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #34d399)' }}
      />
    ))}
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export function PublicAiAssistantChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'a-welcome', role: 'assistant',
    text: 'Welcome. Ask about pricing, onboarding, features, or support. This chat is powered by Ollama and is not tied to an account.',
  }]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ active: boolean; dx: number; dy: number }>({ active: false, dx: 0, dy: 0 });
  const resizeRef = useRef<{ active: boolean; startX: number; startY: number; startW: number; startH: number }>({ active: false, startX: 0, startY: 0, startW: 0, startH: 0 });
  const abortControllerRef = useRef<AbortController | null>(null);

  const [rect, setRect] = useState<Record<'x' | 'y' | 'w' | 'h', number>>(() => {
    const w = 420;
    const h = Math.min(680, window.innerHeight - 120);
    return { x: window.innerWidth - w - 24, y: window.innerHeight - h - 100, w, h };
  });

  const clampRect = (next: typeof rect) => {
    const minW = 360; const minH = 400;
    const w = Math.max(minW, Math.min(window.innerWidth - 24, next.w));
    const h = Math.max(minH, Math.min(window.innerHeight - 24, next.h));
    const x = Math.max(12, Math.min(window.innerWidth - w - 12, next.x));
    const y = Math.max(12, Math.min(window.innerHeight - h - 12, next.y));
    return { x, y, w, h };
  };

  useEffect(() => {
    if (!open) return;
    const onMove = (e: PointerEvent) => {
      if (dragRef.current.active) {
        setRect((r) => clampRect({ ...r, x: e.clientX - dragRef.current.dx, y: e.clientY - dragRef.current.dy }));
      }
      if (resizeRef.current.active) {
        setRect((r) => clampRect({ ...r, w: resizeRef.current.startW + (e.clientX - resizeRef.current.startX), h: resizeRef.current.startH + (e.clientY - resizeRef.current.startY) }));
      }
    };
    const onUp = () => { dragRef.current.active = false; resizeRef.current.active = false; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [open]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const scrollToBottom = useCallback((instant = false) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: instant ? 'auto' : 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    if (open) {
      // Use requestAnimationFrame to ensure DOM is updated (especially for tables/charts)
      requestAnimationFrame(() => scrollToBottom(loading));
    }
  }, [messages, loading, open, scrollToBottom]);

  // Handle dynamic content resizing (like images or tables loading)
  useEffect(() => {
    if (!scrollRef.current) return;
    const obs = new ResizeObserver(() => {
      if (loading) scrollToBottom(true);
    });
    obs.observe(scrollRef.current);
    return () => obs.disconnect();
  }, [loading, scrollToBottom]);

  const append = useCallback((msg: ChatMessage) => setMessages((prev) => [...prev, msg]), []);

  const patchMessage = useCallback((id: string, patch: Partial<ChatMessage>) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m))), []);

  const renderChart = (response: RenderedResponse) => {
    const chart = response.data?.chart as { xKey?: string; yKey?: string; points?: Record<string, unknown>[] } | undefined;
    const points = Array.isArray(chart?.points) ? chart.points : [];
    const xKey = chart?.xKey || 'x'; const yKey = chart?.yKey || 'y';
    if (points.length === 0) return <pre style={preStyle}>{JSON.stringify(response.data, null, 2)}</pre>;
    return (
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          {points.length > 7
            ? <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.1)" />
                <XAxis dataKey={xKey} stroke="rgba(167,243,208,0.5)" fontSize={10} />
                <YAxis stroke="rgba(167,243,208,0.5)" fontSize={10} />
                <Tooltip contentStyle={{ background: 'rgba(2,12,27,0.95)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10 }} />
                <Line type="monotone" dataKey={yKey} stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            : <BarChart data={points}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.1)" />
                <XAxis dataKey={xKey} stroke="rgba(167,243,208,0.5)" fontSize={10} />
                <YAxis stroke="rgba(167,243,208,0.5)" fontSize={10} />
                <Tooltip contentStyle={{ background: 'rgba(2,12,27,0.95)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10 }} />
                <Bar dataKey={yKey} fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
          }
        </ResponsiveContainer>
      </div>
    );
  };

  const renderResponse = (msg: ChatMessage) => {
    const { response, text, streaming } = msg;
    if (!response && text !== undefined) {
      return (
        <p style={msgTextStyle}>
          {streaming && text ? <StreamingText text={text} streaming /> : renderMarkdownLite(text)}
        </p>
      );
    }
    if (!response) return null;
    if (response.type === 'text') {
      const t = typeof response.data?.text === 'string' ? response.data.text : JSON.stringify(response.data);
      return <p style={msgTextStyle}>{renderMarkdownLite(t)}</p>;
    }
    if (response.type === 'table') {
      const d = response.data || {};
      const rows = Array.isArray(d.rows) ? d.rows 
                 : Array.isArray(d.plans) ? d.plans
                 : Array.isArray(d.roadmapItems) ? d.roadmapItems
                 : Array.isArray(d.schools) ? d.schools
                 : (Object.values(d).find(v => Array.isArray(v)) as any[]) || [];
      
      return (
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Data Results ({rows.length})
          </div>
          <pre style={{ ...preStyle, maxHeight: 300, overflow: 'auto' }}>
            {JSON.stringify(rows, null, 2)}
          </pre>
        </div>
      );
    }
    if (response.type === 'chart') return <div style={{ marginTop: 8 }}>{renderChart(response)}</div>;
    if (response.type === 'action') {
      const status = typeof response.data?.status === 'string' ? response.data.status : 'Action';
      const msgText = typeof response.data?.message === 'string' ? response.data.message : '';
      return (
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6ee7b7' }}>{status}</div>
          {msgText && <p style={msgTextStyle}>{msgText}</p>}
        </div>
      );
    }
    return null;
  };

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const sendText = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    cancelRequest();
    abortControllerRef.current = new AbortController();

    setInput('');
    append({ id: `u-${Date.now()}`, role: 'user', text: trimmed });
    setLoading(true);
    const assistantId = `a-${Date.now()}`;
    append({ id: assistantId, role: 'assistant', text: '', streaming: true });

    try {
      const res = await fetch('/api/v1/ai-interaction/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, context: { route: window.location.pathname, public: true } }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error(`Chat endpoint returned ${res.status}.`);

      let currentText = '';
      let gotAny = false;

      await readSseStream(res.body, {
        onEvent: ({ event, data }) => {
          const parsed = tryParseJson<any>(data);
          const eventName = event || 'message';
          gotAny = true;
          if (data === '[DONE]') return;
          if (eventName === 'final') {
            const payload = parsed.ok ? parsed.value : null;
            const response = payload?.response as RenderedResponse | undefined;
            const text = typeof payload?.text === 'string' ? payload.text
              : typeof payload?.response?.data?.text === 'string' ? payload.response.data.text : '';
            
            // Fix: ensure we use the backend text if no chunks were received
            if (text && !currentText) currentText = text;
            
            patchMessage(assistantId, { text: currentText || 'Done.', response, streaming: false });
            return;
          }
          if (eventName === 'status') {
            const statusText = parsed.ok && typeof parsed.value?.text === 'string' ? parsed.value.text : data;
            patchMessage(assistantId, { text: statusText, streaming: true });
            return;
          }
          const tokenText = parsed.ok && typeof parsed.value?.text === 'string' ? parsed.value.text as string : '';
          const next = tokenText || (typeof data === 'string' ? data : '');
          if (eventName === 'token' || eventName === 'delta' || eventName === 'chunk' || eventName === 'message') {
            if (next) { currentText += next; patchMessage(assistantId, { text: currentText, streaming: true }); }
          }
        },
      });

      if (!gotAny || !currentText.trim()) patchMessage(assistantId, { text: 'No response.', streaming: false });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        patchMessage(assistantId, { text: 'Response cancelled.', streaming: false });
      } else {
        patchMessage(assistantId, { text: `I could not complete that request: ${error?.message || 'service unavailable'}.`, streaming: false });
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <>
      {/* FAB Launcher */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="launcher"
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            whileHover={{ scale: 1.12, boxShadow: '0 0 32px rgba(16,185,129,0.6)' }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => setOpen(true)}
            style={fabStyle}
            title="Chat with AI"
            data-tour="public-chat-launcher"
          >
            <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
              <Bot size={22} />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
              style={fabPulseStyle}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.section
            key="chat-window"
            initial={{ opacity: 0, scale: 0.88, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 40 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            style={{ ...chatWindowStyle, left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
          >
            {/* Header / Grabber */}
            <header
              style={headerStyle}
              onPointerDown={(e) => {
                dragRef.current = { active: true, dx: e.clientX - rect.x, dy: e.clientY - rect.y };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                  style={headerIconStyle}
                >
                  <Cpu size={15} />
                </motion.div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#ecfdf5' }}>Assistant</div>
                  <div style={{ fontSize: 10, color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}
                      style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
                    Live · Public
                  </div>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.1, background: 'rgba(239,68,68,0.15)' }}
                onPointerDown={(e) => e.stopPropagation()}
                type="button" onClick={() => setOpen(false)} style={closeBtnStyle}>
                <X size={16} />
              </motion.button>
            </header>

            {/* Thread */}
            <div ref={scrollRef} style={threadStyle}>
              {/* Example prompts */}
              <AnimatePresence>
                {messages.length === 1 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ padding: '12px 14px 4px' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#6ee7b7', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Suggested questions
                    </div>
                    <div style={{ display: 'grid', gap: 4 }}>
                      {EXAMPLE_QUESTIONS.map((q, idx) => (
                        <motion.button
                          key={q}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.07 * idx }}
                          whileHover={loading ? {} : { x: 4, background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.35)' }}
                          type="button" disabled={loading} onClick={() => void sendText(q)}
                          style={{ ...exampleBtnStyle, opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto' }}
                        >
                          <ChevronRight size={10} style={{ color: '#10b981', flexShrink: 0 }} />
                          <span>{q}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div style={{ padding: '6px 0' }}>
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.article
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                      style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        padding: '4px 12px',
                      }}
                    >
                      {msg.role === 'assistant' && (
                        <motion.div
                          animate={msg.streaming ? { opacity: [0.7, 1, 0.7] } : { opacity: 1 }}
                          transition={msg.streaming ? { repeat: Infinity, duration: 1.4 } : {}}
                          style={botAvatarStyle}
                        >
                          <Bot size={11} />
                        </motion.div>
                      )}
                      <div style={msg.role === 'user' ? userBubbleStyle : assistantBubbleStyle}>
                        {msg.role === 'assistant' ? (
                          msg.text === '' && loading ? (
                            <ThinkingDots />
                          ) : (
                            renderResponse(msg)
                          )
                        ) : (
                          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>{msg.text}</p>
                        )}
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Composer */}
            <footer style={composerStyle}>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void sendText(input); } }}
                  placeholder="Ask about pricing, onboarding, support…"
                  style={inputStyle}
                />
                <motion.button
                  whileHover={canSend ? { scale: 1.08, boxShadow: '0 0 14px rgba(16,185,129,0.5)' } : {}}
                  whileTap={canSend ? { scale: 0.93 } : {}}
                  type="button" disabled={!canSend} onClick={() => void sendText(input)}
                  style={{ ...sendBtnStyle, opacity: canSend ? 1 : 0.35 }}
                >
                  {loading
                    ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}>
                        <Sparkles size={15} />
                      </motion.div>
                    : <Send size={15} />
                  }
                </motion.button>
                {loading && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1, background: 'rgba(239,68,68,0.2)' }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={cancelRequest}
                    style={{
                      width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)',
                      background: 'rgba(239,68,68,0.08)', color: '#f87171',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                    title="Cancel request"
                  >
                    <X size={15} />
                  </motion.button>
                )}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(167,243,208,0.3)', marginTop: 5 }}>
                Powered by Ollama · Resizable Window
              </div>
              <div
                style={resizeGrabberStyle}
                onPointerDown={(e) => {
                  resizeRef.current = { active: true, startX: e.clientX, startY: e.clientY, startW: rect.w, startH: rect.h };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
              />
            </footer>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
