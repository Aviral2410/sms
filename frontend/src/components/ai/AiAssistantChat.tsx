import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, CheckCheck, Globe, MessageCircle, Plus, Send,
  Sparkles, Trash2, UserCircle2, X, ChevronRight, Cpu
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { readSseStream, tryParseJson } from '../../lib/sse';

// ─── Types ──────────────────────────────────────────────────────────────────

type RenderedResponse = {
  type: 'chart' | 'table' | 'text' | 'action';
  data: Record<string, unknown>;
  meta: Record<string, unknown>;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  response?: RenderedResponse;
  ts?: number;
  streaming?: boolean;
};

type StreamFinalPayload = {
  workspaceId: string | null;
  conversationId: string;
  response: RenderedResponse;
};

type ToolCatalogItem = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  requiresConfirmation: boolean;
  examplePrompts: string[];
};

type WorkspaceSummary = { workspaceId: string; name: string };
type ChatSummary = { conversationId: string; title: string | null; updatedAt?: string; createdAt?: string };
type StoredRect = { x: number; y: number; w: number; h: number };

// ─── Constants ───────────────────────────────────────────────────────────────

const RECT_STORAGE_KEY = 'aiAssistant:rect:v2';
const MAX_INPUT_CHARS = 2000;
const EXAMPLE_PROMPTS = [
  'Summarize the most important metrics for this workspace.',
  'Show a chart of admissions by month for the last 6 months.',
  'Draft a support update message for parents about transport delays.',
  'List the next 5 onboarding steps to activate a new school.',
  'Where can I update pricing and public content?',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function downloadText(filename: string, text: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, unknown>[]) {
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r ?? {}))));
  const escape = (value: unknown) => {
    const s = value == null ? '' : String(value);
    const needs = /[",\n]/.test(s);
    return needs ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(escape).join(','), ...rows.map((r) => headers.map((h) => escape((r as any)?.[h])).join(','))].join('\n');
}

async function safeReadJson<T = unknown>(res: Response): Promise<T | null> {
  const text = await res.text().catch(() => '');
  if (!text) return null;
  try { return JSON.parse(text) as T; } catch { return null; }
}

// ─── StreamingText — word-by-word animated render (Claude-style) ──────────────

function renderMarkdownLite(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    // Bold: **text**
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
          transition={{ duration: 0.15, delay: streaming ? Math.min(i * 0.018, 1.2) : 0 }}
          style={{ display: 'inline' }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
};

// ─── ThinkingDots — 3-dot pulse ───────────────────────────────────────────────

const ThinkingDots: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '10px 0' }}
  >
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.18, ease: 'easeInOut' }}
        style={{
          display: 'block', width: 7, height: 7, borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981, #34d399)'
        }}
      />
    ))}
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const AiAssistantChat: React.FC = () => {
  const { session } = useStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'a-welcome', role: 'assistant',
    text: 'Welcome. Ask for charts, tables, summaries, or next steps. Responses stream in real time.',
    ts: Date.now(),
  }]);

  const resetThread = useCallback(() => {
    setMessages([{
      id: 'a-welcome', role: 'assistant',
      text: 'Welcome. Ask for charts, tables, summaries, or next steps. Responses stream in real time.',
      ts: Date.now(),
    }]);
  }, []);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [tools, setTools] = useState<ToolCatalogItem[]>([]);
  const [toolsLoaded, setToolsLoaded] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [toolsError, setToolsError] = useState<string | null>(null);
  const [toolsLoading, setToolsLoading] = useState(false);

  const authHeaders = useMemo(() => {
    if (!session.token) return null;
    return { Authorization: `Bearer ${session.token}` };
  }, [session.token]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ active: boolean; dx: number; dy: number }>({ active: false, dx: 0, dy: 0 });
  const resizeRef = useRef<{ active: boolean; startX: number; startY: number; startW: number; startH: number }>({ active: false, startX: 0, startY: 0, startW: 0, startH: 0 });

  const [rect, setRect] = useState<StoredRect>(() => {
    try {
      const raw = window.localStorage.getItem(RECT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredRect>;
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number' && typeof parsed.w === 'number' && typeof parsed.h === 'number') {
          return parsed as StoredRect;
        }
      }
    } catch { /* ignore */ }
    const w = Math.min(480, Math.max(380, Math.floor(window.innerWidth * 0.34)));
    const h = Math.min(740, Math.max(540, Math.floor(window.innerHeight * 0.74)));
    return { x: Math.max(16, window.innerWidth - w - 24), y: Math.max(16, window.innerHeight - h - 24), w, h };
  });

  const canSend = useMemo(() => !!session.token && input.trim().length > 0 && !loading, [session.token, input, loading]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 0);
  }, []);

  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, { ts: Date.now(), ...msg }]);
    scrollToBottom();
  }, [scrollToBottom]);

  const patchMessage = useCallback((id: string, patch: Partial<ChatMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    scrollToBottom();
  }, [scrollToBottom]);

  const formatTime = (ts?: number) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const clampRect = (next: StoredRect) => {
    const minW = 380; const minH = 480;
    const maxW = Math.max(minW, window.innerWidth - 24);
    const maxH = Math.max(minH, window.innerHeight - 24);
    const w = Math.max(minW, Math.min(maxW, next.w));
    const h = Math.max(minH, Math.min(maxH, next.h));
    const x = Math.max(12, Math.min(window.innerWidth - w - 12, next.x));
    const y = Math.max(12, Math.min(window.innerHeight - h - 12, next.y));
    return { x, y, w, h };
  };

  useEffect(() => {
    try { window.localStorage.setItem(RECT_STORAGE_KEY, JSON.stringify(rect)); } catch { /* ignore */ }
  }, [rect]);

  useEffect(() => {
    if (!open) return;
    const onMove = (e: PointerEvent) => {
      if (dragRef.current.active) {
        setRect((r) => clampRect({ ...r, x: e.clientX - dragRef.current.dx, y: e.clientY - dragRef.current.dy }));
      }
      if (resizeRef.current.active) {
        const dw = e.clientX - resizeRef.current.startX;
        const dh = e.clientY - resizeRef.current.startY;
        setRect((r) => clampRect({ ...r, w: resizeRef.current.startW + dw, h: resizeRef.current.startH + dh }));
      }
    };
    const onUp = () => { dragRef.current.active = false; resizeRef.current.active = false; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [open]);

  // ── Workspace / Chat management ─────────────────────────────────────────────

  const ensureWorkspace = async () => {
    if (!authHeaders) return null;
    let activeWorkspaceId = workspaceId;
    if (!activeWorkspaceId) {
      const wsListRes = await fetch('/api/v1/ai-interaction/workspaces', { headers: authHeaders });
      if (wsListRes.ok) {
        const existing = (await safeReadJson<Array<{ workspaceId: string; name: string }>>(wsListRes)) ?? [];
        setWorkspaces(existing.map((w) => ({ workspaceId: w.workspaceId, name: w.name })));
        if (existing.length > 0) activeWorkspaceId = existing[0].workspaceId;
      } else if (wsListRes.status === 401 || wsListRes.status === 403) {
        appendMessage({ id: `a-${Date.now()}`, role: 'assistant', text: 'Please sign in again to use AI chat.' });
        return null;
      }
      if (!activeWorkspaceId) {
        const wsCreateRes = await fetch('/api/v1/ai-interaction/workspaces', {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ name: 'Default Workspace' }),
        });
        if (wsCreateRes.ok) {
          const created = (await safeReadJson<{ workspaceId: string; name?: string }>(wsCreateRes)) ?? null;
          if (!created?.workspaceId) return null;
          activeWorkspaceId = created.workspaceId;
          setWorkspaces([{ workspaceId: created.workspaceId, name: created.name || 'Default Workspace' }]);
        }
      }
      if (activeWorkspaceId) setWorkspaceId(activeWorkspaceId);
    }
    return activeWorkspaceId;
  };

  const loadChats = async (activeWorkspaceId: string) => {
    if (!authHeaders) return;
    const res = await fetch(`/api/v1/ai-interaction/workspaces/${encodeURIComponent(activeWorkspaceId)}/chats`, { headers: authHeaders });
    if (!res.ok) return;
    const data = (await safeReadJson<Array<{ conversationId: string; title: string | null; updatedAt?: string; createdAt?: string }>>(res)) ?? [];
    setChats(data.map((c) => ({ conversationId: c.conversationId, title: c.title ?? null, updatedAt: c.updatedAt, createdAt: c.createdAt })));
  };

  const loadMessages = async (activeConversationId: string) => {
    if (!authHeaders) return;
    const res = await fetch(`/api/v1/ai-interaction/chats/${encodeURIComponent(activeConversationId)}/messages?limit=100`, { headers: authHeaders });
    if (!res.ok) return;
    const data = (await safeReadJson<Array<{ role: string; content: string; payload?: any; messageId: string }>>(res)) ?? [];
    setMessages(data.filter((m) => m.role === 'user' || m.role === 'assistant').map((m) => {
      const payload = m.payload as any;
      const hasRenderedShape = payload && typeof payload === 'object' && typeof payload.type === 'string' && payload.data && typeof payload.data === 'object';
      return {
        id: m.messageId, role: m.role as 'user' | 'assistant',
        text: hasRenderedShape ? undefined : m.content,
        response: hasRenderedShape ? (payload as RenderedResponse) : undefined,
      };
    }));
    scrollToBottom();
  };

  const deleteChat = async (id: string) => {
    if (!authHeaders) return;
    try {
      const res = await fetch(`/api/v1/ai-interaction/chats/${encodeURIComponent(id)}`, { method: 'DELETE', headers: authHeaders });
      if (res.ok) {
        setChats((prev) => prev.filter((c) => c.conversationId !== id));
        if (conversationId === id) { setConversationId(null); resetThread(); }
      }
    } catch { /* ignore */ }
  };

  const startNewChat = async () => {
    if (!authHeaders) return;
    setHistoryLoading(true);
    try {
      const ws = workspaceId ?? (await ensureWorkspace());
      if (!ws) return;
      const res = await fetch('/api/v1/ai-interaction/chats', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ title: null }),
      });
      if (!res.ok) return;
      const created = (await safeReadJson<{ conversationId: string; workspaceId?: string }>(res)) ?? null;
      if (!created?.conversationId) return;
      if (created.workspaceId) setWorkspaceId(created.workspaceId);
      setConversationId(created.conversationId);
      resetThread();
      await loadChats(ws);
      setToolsOpen(false);
    } catch (err) { console.error('Failed to start new chat:', err); }
    finally { setHistoryLoading(false); }
  };

  useEffect(() => {
    if (!open || !authHeaders) return;
    setHistoryLoading(true);
    (async () => {
      try { const ws = await ensureWorkspace(); if (ws) await loadChats(ws); }
      finally { setHistoryLoading(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, authHeaders]);

  // ── Send message ────────────────────────────────────────────────────────────

  const sendMessage = async (override?: string) => {
    if (!session.token) return;
    const message = (override ?? input).trim();
    if (!message || loading) return;
    setInput('');
    appendMessage({ id: `u-${Date.now()}`, role: 'user', text: message });
    setLoading(true);
    const assistantId = `a-${Date.now()}`;
    appendMessage({ id: assistantId, role: 'assistant', text: '', streaming: true });

    try {
      const response = await fetch('/api/v1/ai-interaction/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ workspaceId, conversationId, message, context: { route: window.location.pathname } }),
      });

      if (!response.ok || !response.body) throw new Error('Unable to stream AI response.');

      let finalPayload: StreamFinalPayload | null = null;
      let streamingText = '';
      let gotAny = false;

      await readSseStream(response.body, {
        onEvent: ({ event, data }) => {
          gotAny = true;
          if (data === '[DONE]') return;
          if (event === 'final') {
            const parsed = tryParseJson<StreamFinalPayload>(data);
            if (parsed.ok) finalPayload = parsed.value;
            return;
          }
          if (event === 'status') {
            const parsed = tryParseJson<any>(data);
            const statusText = parsed.ok && typeof parsed.value?.text === 'string' ? parsed.value.text : data;
            patchMessage(assistantId, { text: statusText, streaming: true });
            return;
          }
          const parsed = tryParseJson<any>(data);
          const chunk = parsed.ok && typeof parsed.value?.text === 'string' ? parsed.value.text as string : data;
          if (event === 'token' || event === 'delta' || event === 'chunk' || event === 'message') {
            if (chunk) { streamingText += chunk; patchMessage(assistantId, { text: streamingText, streaming: true }); }
          }
        },
      });

      const payload = finalPayload as StreamFinalPayload | null;
      if (payload?.response) {
        setConversationId(payload.conversationId);
        if (payload.workspaceId) setWorkspaceId(payload.workspaceId);
        const responseText = payload.response.type === 'text' ? (payload.response.data?.text as string) : undefined;
        patchMessage(assistantId, { response: payload.response, text: streamingText || responseText, streaming: false });
      } else if (!gotAny) {
        patchMessage(assistantId, { text: 'No response from AI service. Check if Ollama is running.', streaming: false });
      } else {
        patchMessage(assistantId, { text: streamingText || 'Received an empty response.', streaming: false });
      }
    } catch (error) {
      patchMessage(assistantId, { text: error instanceof Error ? `Connection error: ${error.message}` : 'Failed to fetch AI response.', streaming: false });
    } finally { setLoading(false); }
  };

  const send = async () => {
    if (!canSend) return;
    if (!conversationId && !loading) await startNewChat();
    await sendMessage();
  };

  const loadTools = async () => {
    if (!session.token || toolsLoading) return;
    setToolsLoading(true); setToolsError(null);
    try {
      const res = await fetch('/api/v1/ai-interaction/tools', { headers: authHeaders ?? { Authorization: `Bearer ${session.token}` } });
      if (!res.ok) { setToolsError(`Tools endpoint returned ${res.status}`); return; }
      const data = (await safeReadJson<ToolCatalogItem[]>(res)) ?? [];
      if (!Array.isArray(data)) { setToolsError('Invalid response format from tools API.'); return; }
      setTools(data); setToolsLoaded(true);
    } catch { setToolsError('Network error while loading tools.'); }
    finally { setToolsLoading(false); }
  };

  const confirmAction = async (token: string) => {
    if (!session.token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/ai-interaction/actions/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ confirmationToken: token }),
      });
      if (!res.ok) throw new Error('Failed to confirm action.');
      const result = (await res.json()) as StreamFinalPayload;
      appendMessage({ id: `a-${Date.now()}`, role: 'assistant', response: result.response });
    } catch (error) {
      appendMessage({ id: `a-${Date.now()}`, role: 'assistant', text: error instanceof Error ? error.message : 'Failed to confirm action.' });
    } finally { setLoading(false); }
  };

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderChart = (response: RenderedResponse) => {
    const chart = response.data?.chart as { xKey?: string; yKey?: string; points?: Record<string, unknown>[] } | undefined;
    const points = Array.isArray(chart?.points) ? chart.points : [];
    const xKey = chart?.xKey || 'x'; const yKey = chart?.yKey || 'y';
    if (points.length === 0) return <pre style={preStyle}>{JSON.stringify(response.data, null, 2)}</pre>;
    return (
      <div style={{ width: '100%', height: 220 }}>
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

  const renderAssistantContent = (msg: ChatMessage) => {
    const { response, text, streaming } = msg;

    if (!response && text !== undefined) {
      return (
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: '#d1fae5' }}>
          {streaming && text
            ? <StreamingText text={text} streaming />
            : renderMarkdownLite(text || '')
          }
        </p>
      );
    }

    if (!response) return null;

    if (response.type === 'text') {
      const t = typeof response.data?.text === 'string' ? response.data.text : JSON.stringify(response.data);
      return (
        <div style={{ display: 'grid', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: '#d1fae5' }}>
            {renderMarkdownLite(t)}
          </p>
        </div>
      );
    }

    if (response.type === 'table') {
      const rows = Array.isArray(response.data?.rows) ? (response.data.rows as Record<string, unknown>[]) : [];
      return (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6ee7b7' }}>Rows: {rows.length}</div>
          {rows.length > 0 && (
            <button type="button" onClick={() => downloadText(`ai-table-${Date.now()}.csv`, toCsv(rows), 'text/csv')} style={actionBtnStyle}>
              Export CSV
            </button>
          )}
          <pre style={preStyle}>{JSON.stringify(rows.slice(0, 10), null, 2)}</pre>
        </div>
      );
    }

    if (response.type === 'chart') {
      const points = Array.isArray((response.data?.chart as any)?.points) ? (response.data.chart as any).points : [];
      const t = typeof response.data?.text === 'string' ? response.data.text : '';
      return (
        <div style={{ display: 'grid', gap: 10 }}>
          {t && <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: '#d1fae5' }}>{renderMarkdownLite(t)}</p>}
          {renderChart(response)}
          {points.length > 0 && (
            <button type="button" onClick={() => downloadText(`ai-chart-${Date.now()}.csv`, toCsv(points), 'text/csv')} style={actionBtnStyle}>
              Export CSV
            </button>
          )}
        </div>
      );
    }

    if (response.type === 'action') {
      const status = typeof response.data?.status === 'string' ? response.data.status : '';
      const token = typeof response.data?.confirmationToken === 'string' ? response.data.confirmationToken : '';
      const msgText = typeof response.data?.message === 'string' ? response.data.message : '';
      return (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6ee7b7' }}>{status || 'Action'}</div>
          {msgText && <div style={{ fontSize: 12, color: 'rgba(167,243,208,0.7)' }}>{msgText}</div>}
          {status === 'CONFIRMATION_REQUIRED' && token && (
            <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => void confirmAction(token)} style={confirmBtnStyle}>
              Confirm Action
            </motion.button>
          )}
          <pre style={preStyle}>{JSON.stringify(response.data, null, 2)}</pre>
        </div>
      );
    }

    return <pre style={preStyle}>{JSON.stringify(response.data, null, 2)}</pre>;
  };

  // ─── Launcher FAB ──────────────────────────────────────────────────────────

  if (!open) {
    return (
      <AnimatePresence>
        <motion.button
          key="launcher"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.12, boxShadow: '0 0 30px rgba(16,185,129,0.6)' }}
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={() => setOpen(true)}
          style={fabStyle}
          title="Open AI Assistant"
        >
          <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
            <Bot size={24} />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={fabPulseStyle}
          />
        </motion.button>
      </AnimatePresence>
    );
  }

  // ─── Chat Window ────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 20 }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      style={{ ...chatWindowStyle, left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
    >
      {/* Header */}
      <div
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
            <Cpu size={16} />
          </motion.div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#ecfdf5', letterSpacing: '-0.01em' }}>
              AI Assistant
            </div>
            <div style={{ fontSize: 10.5, color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: 4 }}>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }}
              />
              Powered by Ollama · Streams live
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <motion.button whileHover={{ scale: 1.1, background: 'rgba(16,185,129,0.15)' }} type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => void startNewChat()} style={headerBtnStyle} title="New chat">
            <Plus size={15} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1, background: 'rgba(16,185,129,0.15)' }} type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => { if (!toolsOpen && !toolsLoaded) void loadTools(); setToolsOpen((v) => !v); }} style={headerBtnStyle} title="AI tools">
            <Globe size={15} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1, background: 'rgba(239,68,68,0.15)' }} type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setOpen(false)} style={headerBtnStyle} title="Close">
            <X size={15} />
          </motion.button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar — chat history */}
        <AnimatePresence>
          {toolsOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={sidebarStyle}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 12px 8px' }}>
                Chats
              </div>
              {historyLoading && <div style={{ padding: '8px 12px', fontSize: 11, color: 'rgba(167,243,208,0.5)' }}>Loading...</div>}
              {chats.map((chat) => (
                <motion.div
                  key={chat.conversationId}
                  whileHover={{ background: 'rgba(16,185,129,0.08)' }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                    cursor: 'pointer', borderRadius: 8, margin: '1px 4px',
                    background: chat.conversationId === conversationId ? 'rgba(16,185,129,0.12)' : 'transparent',
                    borderLeft: chat.conversationId === conversationId ? '2px solid #10b981' : '2px solid transparent',
                  }}
                  onClick={() => { setConversationId(chat.conversationId); void loadMessages(chat.conversationId); setToolsOpen(false); }}
                >
                  <MessageCircle size={11} style={{ color: '#6ee7b7', flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, color: 'rgba(209,250,229,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {chat.title || 'Untitled chat'}
                  </span>
                  <motion.button whileHover={{ color: '#f87171' }} type="button"
                    onClick={(e) => { e.stopPropagation(); void deleteChat(chat.conversationId); }}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(167,243,208,0.3)', padding: 2 }}>
                    <Trash2 size={10} />
                  </motion.button>
                </motion.div>
              ))}

              {toolsLoaded && tools.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 12px 8px', marginTop: 8, borderTop: '1px solid rgba(16,185,129,0.1)' }}>
                    Tools ({tools.length})
                  </div>
                  {tools.map((tool) => (
                    <div key={tool.name} style={{ padding: '6px 12px' }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a7f3d0' }}>{tool.name}</div>
                      <div style={{ fontSize: 10.5, color: 'rgba(167,243,208,0.55)', marginTop: 2 }}>{tool.description}</div>
                    </div>
                  ))}
                  {toolsError && <div style={{ padding: '6px 12px', fontSize: 11, color: '#f87171' }}>{toolsError}</div>}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thread */}
        <div ref={scrollRef} style={threadStyle}>
          {/* Example prompts */}
          <AnimatePresence>
            {messages.length <= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                style={{ padding: '12px 16px 4px' }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6ee7b7', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Try asking
                </div>
                <div style={{ display: 'grid', gap: 5 }}>
                  {EXAMPLE_PROMPTS.map((prompt, idx) => (
                    <motion.button
                      key={prompt}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.06 * idx }}
                      whileHover={{ x: 4, background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.4)' }}
                      type="button"
                      onClick={() => void sendMessage(prompt)}
                      style={examplePromptStyle}
                    >
                      <ChevronRight size={11} style={{ color: '#10b981', flexShrink: 0 }} />
                      <span>{prompt}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div style={{ padding: '8px 0' }}>
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    padding: '4px 14px',
                  }}
                >
                  {msg.role === 'assistant' && (
                    <motion.div
                      animate={msg.streaming ? { opacity: [0.7, 1, 0.7] } : { opacity: 1 }}
                      transition={msg.streaming ? { repeat: Infinity, duration: 1.5 } : {}}
                      style={botAvatarStyle}
                    >
                      <Bot size={12} />
                    </motion.div>
                  )}
                  <div style={msg.role === 'user' ? userBubbleStyle : assistantBubbleStyle}>
                    {msg.role === 'assistant' && msg.text === '' && loading
                      ? <ThinkingDots />
                      : renderAssistantContent(msg)
                    }
                    {msg.role === 'user' && <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6 }}>{msg.text}</p>}
                    <div style={tsStyle}>{formatTime(msg.ts)}</div>
                  </div>
                  {msg.role === 'user' && (
                    <div style={userAvatarStyle}>
                      <UserCircle2 size={12} />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Composer */}
      <div style={composerStyle}>
        <div style={inputWrapperStyle}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_CHARS))}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
            placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
            rows={1}
            style={textareaStyle}
          />
          <motion.button
            whileHover={canSend ? { scale: 1.08, boxShadow: '0 0 16px rgba(16,185,129,0.5)' } : {}}
            whileTap={canSend ? { scale: 0.94 } : {}}
            type="button"
            disabled={!canSend}
            onClick={() => void send()}
            style={{ ...sendBtnStyle, opacity: canSend ? 1 : 0.4 }}
          >
            {loading
              ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <Sparkles size={16} />
                </motion.div>
              : <Send size={16} />
            }
          </motion.button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <span style={{ fontSize: 10.5, color: 'rgba(167,243,208,0.35)' }}>
            {input.length > 0 ? `${input.length}/${MAX_INPUT_CHARS}` : 'Ollama · llama3.2:3b'}
          </span>
          {!session.token && (
            <span style={{ fontSize: 10.5, color: '#f87171' }}>Sign in to use AI chat</span>
          )}
        </div>
      </div>

      {/* Resize handle */}
      <div
        style={resizeHandleStyle}
        onPointerDown={(e) => {
          resizeRef.current = { active: true, startX: e.clientX, startY: e.clientY, startW: rect.w, startH: rect.h };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
      />
    </motion.div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const fabStyle: React.CSSProperties = {
  position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
  width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
  background: 'linear-gradient(135deg, #065f46, #10b981)',
  color: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 4px 24px rgba(16,185,129,0.4), 0 0 0 1px rgba(16,185,129,0.2)',
};
const fabPulseStyle: React.CSSProperties = {
  position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
  background: 'rgba(16,185,129,0.3)', pointerEvents: 'none',
};
const chatWindowStyle: React.CSSProperties = {
  position: 'fixed', zIndex: 9998,
  display: 'flex', flexDirection: 'column',
  background: 'rgba(2, 12, 27, 0.92)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(16,185,129,0.2)',
  borderRadius: 18,
  boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(16,185,129,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
  overflow: 'hidden',
};
const headerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '13px 16px',
  background: 'linear-gradient(135deg, rgba(6,95,70,0.4), rgba(2,44,34,0.6))',
  borderBottom: '1px solid rgba(16,185,129,0.15)',
  cursor: 'grab', userSelect: 'none', flexShrink: 0,
};
const headerIconStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 10,
  background: 'linear-gradient(135deg, #065f46, #10b981)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ecfdf5',
  boxShadow: '0 0 14px rgba(16,185,129,0.4)',
};
const headerBtnStyle: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(16,185,129,0.15)',
  background: 'rgba(16,185,129,0.06)', color: 'rgba(167,243,208,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};
const sidebarStyle: React.CSSProperties = {
  flexShrink: 0, overflow: 'hidden auto',
  background: 'rgba(6,95,70,0.06)',
  borderRight: '1px solid rgba(16,185,129,0.1)',
};
const threadStyle: React.CSSProperties = {
  flex: 1, overflow: 'hidden auto',
  display: 'flex', flexDirection: 'column',
};
const botAvatarStyle: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 8, flexShrink: 0, marginRight: 8, marginTop: 2,
  background: 'linear-gradient(135deg, #065f46, #10b981)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ecfdf5',
};
const userAvatarStyle: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 8, flexShrink: 0, marginLeft: 8, marginTop: 2,
  background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6ee7b7',
};
const assistantBubbleStyle: React.CSSProperties = {
  maxWidth: '85%', padding: '11px 14px',
  background: 'rgba(6,95,70,0.12)',
  border: '1px solid rgba(16,185,129,0.15)',
  borderLeft: '3px solid rgba(16,185,129,0.5)',
  borderRadius: '0 14px 14px 14px',
};
const userBubbleStyle: React.CSSProperties = {
  maxWidth: '80%', padding: '11px 14px',
  background: 'linear-gradient(135deg, rgba(6,95,70,0.5), rgba(4,120,87,0.3))',
  border: '1px solid rgba(16,185,129,0.3)',
  borderRadius: '14px 14px 0 14px',
  color: '#ecfdf5',
};
const tsStyle: React.CSSProperties = {
  fontSize: 10, color: 'rgba(167,243,208,0.3)', marginTop: 5, textAlign: 'right',
};
const composerStyle: React.CSSProperties = {
  padding: '10px 14px 14px',
  borderTop: '1px solid rgba(16,185,129,0.12)',
  background: 'rgba(2,12,27,0.6)',
  flexShrink: 0,
};
const inputWrapperStyle: React.CSSProperties = {
  display: 'flex', gap: 8, alignItems: 'flex-end',
};
const textareaStyle: React.CSSProperties = {
  flex: 1, padding: '10px 12px',
  background: 'rgba(6,95,70,0.1)',
  border: '1px solid rgba(16,185,129,0.2)',
  borderRadius: 12,
  color: '#d1fae5', fontSize: 13.5,
  resize: 'none', outline: 'none',
  fontFamily: 'inherit', lineHeight: 1.5,
};
const sendBtnStyle: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer',
  background: 'linear-gradient(135deg, #065f46, #10b981)',
  color: '#ecfdf5',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
  boxShadow: '0 2px 12px rgba(16,185,129,0.3)',
};
const examplePromptStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7,
  padding: '7px 10px', background: 'rgba(16,185,129,0.06)',
  border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8,
  color: 'rgba(167,243,208,0.75)', fontSize: 12, cursor: 'pointer', textAlign: 'left',
};
const preStyle: React.CSSProperties = {
  margin: 0, maxHeight: 180, overflow: 'auto', fontSize: 11,
  background: 'rgba(2,12,27,0.6)', padding: 10, borderRadius: 8,
  color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.1)',
};
const actionBtnStyle: React.CSSProperties = {
  border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.08)',
  color: '#6ee7b7', padding: '5px 10px', borderRadius: 8,
  fontSize: 11.5, fontWeight: 700, cursor: 'pointer', justifySelf: 'start',
};
const confirmBtnStyle: React.CSSProperties = {
  border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.15)',
  color: '#a7f3d0', padding: '7px 14px', borderRadius: 8,
  fontSize: 12.5, fontWeight: 700, cursor: 'pointer', justifySelf: 'start',
};
const resizeHandleStyle: React.CSSProperties = {
  position: 'absolute', bottom: 0, right: 0,
  width: 16, height: 16, cursor: 'nwse-resize',
  background: 'linear-gradient(135deg, transparent 50%, rgba(16,185,129,0.3) 50%)',
  borderRadius: '0 0 18px 0',
};
