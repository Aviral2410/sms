import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Bot, CheckCheck, Globe, MessageCircle, Moon, Plus, Send, Sparkles, Trash2, UserCircle2, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { readSseStream, tryParseJson } from '../../lib/sse';

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
};

type StreamFinalPayload = {
  workspaceId?: string | null;
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

const RECT_STORAGE_KEY = 'aiAssistant:rect:v1';
const MAX_INPUT_CHARS = 2000;
const EXAMPLE_PROMPTS = [
  'Summarize the most important metrics for this workspace.',
  'Show a chart of admissions by month for the last 6 months.',
  'Draft a support update message for parents about transport delays.',
  'List the next 5 onboarding steps to activate a new school.',
  'Where can I update pricing and public content?',
];

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
    const needs = /[\",\n]/.test(s);
    const escaped = s.replace(/\"/g, '""');
    return needs ? `"${escaped}"` : escaped;
  };
  return [
    headers.map(escape).join(','),
    ...rows.map((r) => headers.map((h) => escape((r as any)?.[h])).join(',')),
  ].join('\n');
}

async function safeReadJson<T = unknown>(res: Response): Promise<T | null> {
  const text = await res.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export const AiAssistantChat: React.FC = () => {
  const { session } = useStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'a-welcome',
      role: 'assistant',
      text: 'Welcome. Ask for charts, tables, summaries, or next steps. Responses stream in real time.',
      ts: Date.now(),
    },
  ]);

  const resetThread = () => {
    setMessages([
      {
        id: 'a-welcome',
        role: 'assistant',
        text: 'Welcome. Ask for charts, tables, summaries, or next steps. Responses stream in real time.',
        ts: Date.now(),
      },
    ]);
  };
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [tools, setTools] = useState<ToolCatalogItem[]>([]);
  const [toolsLoaded, setToolsLoaded] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [toolsError, setToolsError] = useState<string | null>(null);
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
    } catch {
      // ignore
    }
    const w = Math.min(460, Math.max(360, Math.floor(window.innerWidth * 0.34)));
    const h = Math.min(720, Math.max(520, Math.floor(window.innerHeight * 0.72)));
    return { x: Math.max(16, window.innerWidth - w - 24), y: Math.max(16, window.innerHeight - h - 24), w, h };
  });

  const canSend = useMemo(() => !!session.token && input.trim().length > 0 && !loading, [session.token, input, loading]);

  const appendMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, { ts: Date.now(), ...msg }]);
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 0);
  };

  const patchMessage = (id: string, patch: Partial<ChatMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 0);
  };

  const formatTime = (ts?: number) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const authHeaders = useMemo(() => {
    if (!session.token) return null;
    return { Authorization: `Bearer ${session.token}` };
  }, [session.token]);

  const clampRect = (next: StoredRect) => {
    const minW = 360;
    const minH = 460;
    const maxW = Math.max(minW, window.innerWidth - 24);
    const maxH = Math.max(minH, window.innerHeight - 24);

    const w = Math.max(minW, Math.min(maxW, next.w));
    const h = Math.max(minH, Math.min(maxH, next.h));
    const x = Math.max(12, Math.min(window.innerWidth - w - 12, next.x));
    const y = Math.max(12, Math.min(window.innerHeight - h - 12, next.y));
    return { x, y, w, h };
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(RECT_STORAGE_KEY, JSON.stringify(rect));
    } catch {
      // ignore
    }
  }, [rect]);

  useEffect(() => {
    if (!open) return;

    const onMove = (e: PointerEvent) => {
      if (dragRef.current.active) {
        const next = clampRect({ ...rect, x: e.clientX - dragRef.current.dx, y: e.clientY - dragRef.current.dy });
        setRect(next);
      }
      if (resizeRef.current.active) {
        const dw = e.clientX - resizeRef.current.startX;
        const dh = e.clientY - resizeRef.current.startY;
        const next = clampRect({ ...rect, w: resizeRef.current.startW + dw, h: resizeRef.current.startH + dh });
        setRect(next);
      }
    };

    const onUp = () => {
      dragRef.current.active = false;
      resizeRef.current.active = false;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [open, rect]);

  const ensureWorkspace = async () => {
    if (!authHeaders) return null;
    let activeWorkspaceId = workspaceId;

    if (!activeWorkspaceId) {
      const wsListRes = await fetch('/api/v1/ai-interaction/workspaces', { headers: authHeaders });
      if (wsListRes.ok) {
        const existing = (await safeReadJson<Array<{ workspaceId: string; name: string }>>(wsListRes)) ?? [];
        setWorkspaces(existing.map((w) => ({ workspaceId: w.workspaceId, name: w.name })));
        if (existing.length > 0) {
          activeWorkspaceId = existing[0].workspaceId;
        }
      } else if (wsListRes.status === 401 || wsListRes.status === 403) {
        appendMessage({ id: `a-${Date.now()}`, role: 'assistant', text: 'Please sign in again to use AI chat.' });
        return null;
      }

      if (!activeWorkspaceId) {
        const wsCreateRes = await fetch('/api/v1/ai-interaction/workspaces', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
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
    setMessages(
      data
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => {
          const payload = m.payload as any;
          const hasRenderedShape = payload && typeof payload === 'object' && typeof payload.type === 'string' && payload.data && typeof payload.data === 'object';
          return {
            id: m.messageId,
            role: m.role as 'user' | 'assistant',
            text: hasRenderedShape ? undefined : m.content,
            response: hasRenderedShape ? (payload as RenderedResponse) : undefined,
          };
        })
    );
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 0);
  };

  const createChat = async (activeWorkspaceId: string) => {
    if (!authHeaders) return null;
    const res = await fetch(`/api/v1/ai-interaction/workspaces/${encodeURIComponent(activeWorkspaceId)}/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ title: null }),
    });
    if (!res.ok) return null;
    const created = (await safeReadJson<{ conversationId: string }>(res)) ?? null;
    return created?.conversationId ?? null;
  };

  const createChatInDefaultWorkspace = async () => {
    if (!authHeaders) return null;
    const res = await fetch('/api/v1/ai-interaction/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ title: null }),
    });
    if (!res.ok) return null;
    const created =
      (await safeReadJson<{ conversationId: string; workspaceId?: string; title?: string | null }>(res)) ?? null;
    if (!created?.conversationId) return null;
    if (created.workspaceId) setWorkspaceId(created.workspaceId);
    return created.conversationId;
  };

  const startNewChat = async () => {
    if (!authHeaders) return;
    setHistoryLoading(true);
    try {
      const newId = await createChatInDefaultWorkspace();
      if (!newId) return;
      setConversationId(newId);
      resetThread();
      const ws = workspaceId ?? (await ensureWorkspace());
      if (ws) await loadChats(ws);
    } finally {
      setHistoryLoading(false);
    }
  };

  const clearContext = () => {
    resetThread();
    setConversationId(null);
    setToolsOpen(false);
  };

  useEffect(() => {
    if (!open || !authHeaders) return;
    setHistoryLoading(true);
    (async () => {
      try {
        const ws = await ensureWorkspace();
        if (!ws) return;
        await loadChats(ws);
      } finally {
        setHistoryLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, authHeaders]);

  const sendMessage = async (override?: string) => {
    if (!session.token) return;
    const message = (override ?? input).trim();
    if (!message || loading) return;

    setInput('');
    appendMessage({ id: `u-${Date.now()}`, role: 'user', text: message });
    setLoading(true);
    const assistantId = `a-${Date.now()}`;
    appendMessage({ id: assistantId, role: 'assistant', text: '' });

    try {
      const activeConversationId = conversationId;

      const response = await fetch('/api/v1/ai-interaction/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          workspaceId: workspaceId,
          conversationId: activeConversationId,
          message,
          context: { route: window.location.pathname },
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Unable to stream AI response.');
      }

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

          const parsed = tryParseJson<any>(data);
          const chunk = parsed.ok && typeof parsed.value?.text === 'string' ? parsed.value.text as string : data;
          if (event === 'token' || event === 'delta' || event === 'chunk' || event === 'message') {
            if (chunk) {
              streamingText += chunk;
              patchMessage(assistantId, { text: streamingText });
            }
          }
        },
      });

      // TypeScript can sometimes infer `finalPayload` as `never` across the async stream callback boundary.
      // Re-bind with an explicit type to keep build-time typing stable.
      const payload = finalPayload as StreamFinalPayload | null;
      if (payload?.response) {
        setConversationId(payload.conversationId);
        if (payload.workspaceId) setWorkspaceId(payload.workspaceId);
        patchMessage(assistantId, { response: payload.response, text: streamingText || undefined });
      } else if (!gotAny) {
        patchMessage(assistantId, { text: 'No response.' });
      } else {
        patchMessage(assistantId, { text: streamingText || 'No structured response was returned.' });
      }
    } catch (error) {
      patchMessage(assistantId, { text: error instanceof Error ? error.message : 'Failed to fetch AI response.' });
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!canSend) return;
    await sendMessage();
  };

  const loadTools = async () => {
    if (!session.token || toolsLoaded) return;
    try {
      setToolsError(null);
      const res = await fetch('/api/v1/ai-interaction/tools', {
        headers: authHeaders ?? { Authorization: `Bearer ${session.token}` },
      });
      if (!res.ok) {
        setToolsError(`Tools endpoint returned ${res.status}.`);
        return;
      }
      const raw = (await safeReadJson<any>(res)) ?? null;
      if (!Array.isArray(raw)) {
        setToolsError('Tools response was not a list.');
        return;
      }
      const data = raw as ToolCatalogItem[];
      setTools(data);
      setToolsLoaded(true);
    } catch {
      setToolsError('Failed to load tools.');
    }
  };

  const confirmAction = async (token: string) => {
    if (!session.token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/ai-interaction/actions/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ confirmationToken: token }),
      });
      if (!res.ok) {
        throw new Error('Failed to confirm action.');
      }
      const result = (await res.json()) as StreamFinalPayload;
      appendMessage({
        id: `a-${Date.now()}`,
        role: 'assistant',
        response: result.response,
      });
    } catch (error) {
      appendMessage({
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: error instanceof Error ? error.message : 'Failed to confirm action.',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (response: RenderedResponse) => {
    const chart = response.data?.chart as { xKey?: string; yKey?: string; points?: Record<string, unknown>[] } | undefined;
    const points = Array.isArray(chart?.points) ? chart.points : [];
    const xKey = chart?.xKey || 'x';
    const yKey = chart?.yKey || 'y';

    if (points.length === 0) {
      return (
        <pre style={{ margin: 0, maxHeight: 180, overflow: 'auto', fontSize: 11, background: 'rgba(15,23,42,0.35)', padding: 8, borderRadius: 8 }}>
          {JSON.stringify(response.data, null, 2)}
        </pre>
      );
    }

    return (
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          {points.length > 7 ? (
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={yKey} stroke="#38bdf8" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <BarChart data={points}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={yKey} fill="#22d3ee" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  const renderAssistantResponse = (response?: RenderedResponse, fallback?: string) => {
    if (!response) {
      return <p style={{ margin: 0, fontSize: 13 }}>{fallback || 'No response.'}</p>;
    }

    if (response.type === 'text') {
      const text = typeof response.data?.text === 'string' ? response.data.text : JSON.stringify(response.data);
      return <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{text}</p>;
    }

    if (response.type === 'table') {
      const rows = Array.isArray(response.data?.rows) ? (response.data.rows as Record<string, unknown>[]) : [];
      return (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>Rows: {rows.length}</div>
          {rows.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => downloadText(`ai-table-${Date.now()}.csv`, toCsv(rows), 'text/csv;charset=utf-8')}
                style={{
                  justifySelf: 'start',
                  border: '1px solid rgba(148,163,184,0.18)',
                  background: 'rgba(15,23,42,0.25)',
                  color: 'var(--text-soft)',
                  padding: '6px 10px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Export CSV
              </button>
            </div>
          )}
          <pre style={{ margin: 0, maxHeight: 180, overflow: 'auto', fontSize: 11, background: 'rgba(15,23,42,0.35)', padding: 8, borderRadius: 8 }}>
            {JSON.stringify(rows.slice(0, 10), null, 2)}
          </pre>
        </div>
      );
    }

    if (response.type === 'chart') {
      const chart = response.data?.chart as { xKey?: string; yKey?: string; points?: Record<string, unknown>[] } | undefined;
      const points = Array.isArray(chart?.points) ? chart.points : [];
      return (
        <div style={{ display: 'grid', gap: 10 }}>
          {points.length > 0 && (
            <button
              type="button"
              onClick={() => downloadText(`ai-chart-${Date.now()}.csv`, toCsv(points), 'text/csv;charset=utf-8')}
              style={{
                justifySelf: 'start',
                border: '1px solid rgba(148,163,184,0.18)',
                background: 'rgba(15,23,42,0.25)',
                color: 'var(--text-soft)',
                padding: '6px 10px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Export CSV
            </button>
          )}
          {renderChart(response)}
        </div>
      );
    }

    if (response.type === 'action') {
      const status = typeof response.data?.status === 'string' ? response.data.status : '';
      const token = typeof response.data?.confirmationToken === 'string' ? response.data.confirmationToken : '';
      const msg = typeof response.data?.message === 'string' ? response.data.message : '';
      return (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{status || 'Action'}</div>
          {msg && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{msg}</div>}
          {status === 'CONFIRMATION_REQUIRED' && token && (
            <button
              type="button"
              onClick={() => void confirmAction(token)}
              style={{
                justifySelf: 'start',
                border: '1px solid var(--surface-accent-border)',
                background: 'var(--surface-accent-soft)',
                color: 'var(--text-strong)',
                padding: '7px 10px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Confirm Action
            </button>
          )}
          <pre style={{ margin: 0, maxHeight: 160, overflow: 'auto', fontSize: 11, background: 'rgba(15,23,42,0.35)', padding: 8, borderRadius: 8 }}>
            {JSON.stringify(response.data, null, 2)}
          </pre>
        </div>
      );
    }

    return (
      <pre style={{ margin: 0, maxHeight: 180, overflow: 'auto', fontSize: 11, background: 'rgba(15,23,42,0.35)', padding: 8, borderRadius: 8 }}>
        {JSON.stringify(response.data, null, 2)}
      </pre>
    );
  };

  const renderActionChips = (response?: RenderedResponse) => {
    const actions = (response?.meta as any)?.orchestration?.actions as Array<{ id: string; label: string }> | undefined;
    if (!actions || actions.length === 0) return null;

    const rows = response?.type === 'table' && Array.isArray((response.data as any)?.rows) ? ((response.data as any).rows as Record<string, unknown>[]) : null;

    return (
      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            disabled={loading}
            onClick={() => {
              if (a.id === 'simplify') void sendMessage('Simplify the last answer and keep it short.');
              else if (a.id === 'deep_dive') void sendMessage('Deep dive on the last answer with steps and examples.');
              else if (a.id === 'export_csv' && rows && rows.length > 0) downloadText(`ai-export-${Date.now()}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
            }}
            style={{
              borderRadius: 999,
              border: '1px solid rgba(148,163,184,0.18)',
              background: 'rgba(2,6,23,0.35)',
              color: 'var(--text-soft)',
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 900,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {a.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: '1px solid var(--surface-accent-border)',
            background: 'var(--surface-accent-soft)',
            color: 'var(--text-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 130,
            cursor: 'pointer',
            boxShadow: '0 12px 28px rgba(15,23,42,0.35)',
          }}
          title="Open AI Assistant"
        >
          <MessageCircle size={22} />
        </button>
      )}

      {open && (
        <section
          className="ai-assistant"
          style={{
            position: 'fixed',
            left: rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
            background:
              'radial-gradient(1200px 500px at 25% 0%, rgba(56,189,248,0.10), transparent 40%), radial-gradient(900px 520px at 90% 30%, rgba(168,85,247,0.10), transparent 45%), var(--bg-dropdown)',
            border: '1px solid rgba(148,163,184,0.22)',
            borderRadius: 18,
            zIndex: 130,
            boxShadow: '0 24px 48px rgba(2,6,23,0.4)',
            display: 'grid',
            gridTemplateColumns: '260px 1fr',
            gridTemplateRows: '54px auto auto 1fr 86px',
            overflow: 'hidden',
          }}
        >
          <header
            onPointerDown={(e) => {
              const target = e.target as HTMLElement | null;
              if (!target) return;
              if (target.closest('button')) return;
              dragRef.current.active = true;
              dragRef.current.dx = e.clientX - rect.x;
              dragRef.current.dy = e.clientY - rect.y;
              (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
            }}
            style={{
              gridColumn: '1 / span 2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 10px 0 12px',
              borderBottom: '1px solid rgba(148,163,184,0.16)',
              cursor: 'grab',
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 900, color: 'var(--text-strong)' }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  border: '1px solid rgba(148,163,184,0.18)',
                  background: 'rgba(15,23,42,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={18} />
              </div>
              <div style={{ display: 'grid', lineHeight: 1.1 }}>
                <span style={{ fontSize: 13, letterSpacing: '0.01em' }}>AI Assistant</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)' }}>{historyLoading ? 'Syncing…' : 'Ready'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => void startNewChat()}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  border: '1px solid rgba(148,163,184,0.18)',
                  background: 'rgba(15,23,42,0.25)',
                  color: 'var(--text-soft)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="New chat"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                onClick={() => clearContext()}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  border: '1px solid rgba(148,163,184,0.18)',
                  background: 'rgba(15,23,42,0.25)',
                  color: 'var(--text-soft)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Clear context"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  border: '1px solid rgba(148,163,184,0.18)',
                  background: 'rgba(15,23,42,0.25)',
                  color: 'var(--text-soft)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          <aside
            style={{
              gridRow: '2 / span 4',
              borderRight: '1px solid rgba(148,163,184,0.16)',
              background: 'rgba(2,6,23,0.20)',
              padding: 10,
              display: 'grid',
              gridTemplateRows: 'auto 1fr',
              gap: 10,
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => void startNewChat()}
              style={{
                border: '1px solid rgba(148,163,184,0.18)',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.92), rgba(168,85,247,0.72))',
                color: 'var(--text-soft)',
                padding: '8px 10px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              title="New chat"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={14} />
                New chat
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Ctrl+Enter</span>
            </button>

            <div style={{ overflow: 'auto', display: 'grid', gap: 6, paddingRight: 2 }}>
              {chats.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>No chats yet.</div>
              ) : (
                chats.map((c) => {
                  const active = c.conversationId === conversationId;
                  return (
                    <button
                      key={c.conversationId}
                      type="button"
                      onClick={() => {
                        setConversationId(c.conversationId);
                        void loadMessages(c.conversationId);
                      }}
                      style={{
                        textAlign: 'left',
                        border: '1px solid rgba(148,163,184,0.16)',
                        background: active ? 'rgba(56,189,248,0.14)' : 'rgba(15,23,42,0.20)',
                        color: 'var(--text-soft)',
                        borderRadius: 12,
                        padding: '9px 10px',
                        cursor: 'pointer',
                        display: 'grid',
                        gap: 4,
                      }}
                      title={c.title || 'Chat'}
                    >
                      <div style={{ fontSize: 12, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.title || 'Untitled'}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{c.updatedAt || c.createdAt || ''}</div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <div style={{ gridColumn: 2, gridRow: 2, borderBottom: '1px solid rgba(148,163,184,0.16)', padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {workspaces.length > 0 ? `Workspace: ${workspaces[0].name}` : 'Workspace'}
            </div>
            <div className="ai-assistant__topbar">
              <button type="button" className="ai-assistant__topbtn" title="Magic"><Sparkles size={16} /></button>
              <button type="button" className="ai-assistant__topbtn" title="Theme"><Moon size={16} /></button>
              <button type="button" className="ai-assistant__topbtn" title="Notifications"><Bell size={16} /></button>
              <div className="ai-assistant__avatar" title={session.fullName || 'Admin'}>
                <span>{(session.fullName || 'A').slice(0, 1).toUpperCase()}</span>
                <span className="ai-assistant__avatar-dot" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setToolsOpen((v) => !v);
                void loadTools();
              }}
              style={{
                border: '1px solid rgba(148,163,184,0.18)',
                background: toolsOpen ? 'rgba(56,189,248,0.14)' : 'rgba(15,23,42,0.20)',
                color: 'var(--text-soft)',
                padding: '6px 10px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
              }}
              title="Available tools"
            >
              Tools
            </button>
          </div>

          {toolsOpen && (
            <div style={{ gridColumn: 2, gridRow: 3, borderBottom: '1px solid rgba(148,163,184,0.16)', padding: '10px 10px', display: 'grid', gap: 8 }}>
              {toolsError && <div style={{ fontSize: 12, color: '#fb7185' }}>{toolsError}</div>}
              {tools.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{toolsLoaded ? 'No tools returned.' : 'Loading…'}</div>
              ) : (
                <div style={{ maxHeight: 160, overflow: 'auto', display: 'grid', gap: 8 }}>
                  {tools.map((tool) => (
                    <div key={tool.name} style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 12, padding: 10, background: 'rgba(2,6,23,0.20)' }}>
                      <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--text-strong)' }}>
                        {tool.name}{tool.requiresConfirmation ? ' (confirmation)' : ''}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{tool.description}</div>
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(tool.examplePrompts || []).slice(0, 6).map((p) => (
                          <button
                            key={`${tool.name}-${p}`}
                            type="button"
                            onClick={() => setInput(p)}
                            style={{
                              border: '1px solid rgba(148,163,184,0.14)',
                              background: 'rgba(15,23,42,0.35)',
                              color: 'var(--text-soft)',
                              borderRadius: 999,
                              fontSize: 10,
                              padding: '3px 8px',
                              cursor: 'pointer',
                            }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div
            ref={scrollRef}
            className="ai-assistant__thread"
            style={{
              gridColumn: 2,
              gridRow: toolsOpen ? 4 : 3,
              overflow: 'auto',
              padding: 12,
              display: 'grid',
              gap: 10,
              background: 'linear-gradient(180deg, rgba(2,6,23,0.15), rgba(2,6,23,0.05))',
            }}
          >
            <div className="ai-assistant__greeting">
              <div className="ai-assistant__hello">Hello {session.fullName?.split(' ')[0] || 'Admin'}</div>
              <div className="ai-assistant__sub">How can I help you today?</div>
            </div>
            <div className="ai-assistant__daypill">Today</div>
            {messages.length <= 1 && (
              <div
                style={{
                  border: '1px dashed rgba(148,163,184,0.18)',
                  borderRadius: 16,
                  padding: 12,
                  background: 'rgba(15,23,42,0.28)',
                  display: 'grid',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 900, color: 'var(--text-dim)' }}>
                  Try one
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {EXAMPLE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        void sendMessage(prompt);
                      }}
                      style={{
                        textAlign: 'left',
                        borderRadius: 14,
                        border: '1px solid rgba(148,163,184,0.16)',
                        background: 'rgba(2,6,23,0.45)',
                        color: 'var(--text-main)',
                        padding: '10px 10px',
                        fontSize: 12,
                        lineHeight: 1.4,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <article
                key={msg.id}
                className={`ai-assistant__message${msg.role === 'user' ? ' is-user' : ' is-assistant'}`}
              >
                {msg.role === 'user' ? (
                  <div className="ai-assistant__user-msg">
                    <div className="ai-assistant__user-bubble">
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>{msg.text}</p>
                    </div>
                    <div className="ai-assistant__stamp">
                      <span>{formatTime(msg.ts)}</span>
                      <CheckCheck size={14} />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="ai-assistant__assistant-row">
                      <div className="ai-assistant__assistant-avatar"><Bot size={16} /></div>
                      <div className="ai-assistant__assistant-bubble">
                        {renderAssistantResponse(msg.response, msg.text)}
                        {renderActionChips(msg.response)}
                      </div>
                    </div>
                    <div className="ai-assistant__stamp is-assistant">{formatTime(msg.ts)}</div>
                  </div>
                )}
              </article>
            ))}
            {loading && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Thinking...</div>}
          </div>

          <div className="ai-assistant__chips">
            <button type="button" className="ai-assistant__chip" onClick={() => void sendMessage('Show analytics for this workspace.')}>Show analytics</button>
            <button type="button" className="ai-assistant__chip" onClick={() => void sendMessage('Total students count.')}>Total students count</button>
            <button type="button" className="ai-assistant__chip" onClick={() => void sendMessage('Show recent schools.')}>Recent schools</button>
            <button type="button" className="ai-assistant__chip" onClick={() => void sendMessage('Generate a growth report summary.')}>Growth report</button>
          </div>

          <footer
            className="ai-assistant__composer"
            style={{
              gridColumn: 2,
              gridRow: toolsOpen ? 5 : 4,
              borderTop: '1px solid rgba(148,163,184,0.16)',
              padding: 10,
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              gap: 8,
              background: 'rgba(2,6,23,0.15)',
            }}
          >
            <button
              type="button"
              onClick={() => setToolsOpen((v) => !v)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                border: '1px solid rgba(148,163,184,0.16)',
                background: 'rgba(15,23,42,0.30)',
                color: 'var(--text-soft)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Tools"
            >
              <Globe size={18} />
            </button>
            <div style={{ display: 'grid', gap: 6 }}>
              <input
                value={input}
                maxLength={MAX_INPUT_CHARS}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    void startNewChat();
                  }
                }}
                placeholder="Ask anything about your schools..."
                style={{
                  width: '100%',
                  borderRadius: 18,
                  border: '1px solid rgba(148,163,184,0.18)',
                  background: 'rgba(15,23,42,0.35)',
                  color: 'var(--text-main)',
                  padding: '12px 14px',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)' }}>
                <span>Enter to send • Shift+Enter for newline</span>
                <span>
                  {Math.min(MAX_INPUT_CHARS, input.length)}/{MAX_INPUT_CHARS}
                </span>
              </div>
            </div>
            <button
              type="button"
              disabled={!canSend}
              onClick={() => void send()}
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                border: '1px solid rgba(99,102,241,0.40)',
                background: canSend ? 'linear-gradient(135deg, rgba(99,102,241,0.95), rgba(168,85,247,0.85))' : 'rgba(15,23,42,0.25)',
                color: 'white',
                cursor: canSend ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Send"
            >
              <Send size={16} />
            </button>
          </footer>

          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              resizeRef.current.active = true;
              resizeRef.current.startX = e.clientX;
              resizeRef.current.startY = e.clientY;
              resizeRef.current.startW = rect.w;
              resizeRef.current.startH = rect.h;
              (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
            }}
            style={{
              position: 'absolute',
              right: 6,
              bottom: 6,
              width: 14,
              height: 14,
              borderRadius: 6,
              cursor: 'nwse-resize',
              background: 'rgba(148,163,184,0.26)',
              border: '1px solid rgba(15,23,42,0.5)',
            }}
            title="Resize"
          />
        </section>
      )}
    </>
  );
};
