import React, { useMemo, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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
};

type StreamFinalPayload = {
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

export const AiAssistantChat: React.FC = () => {
  const { session } = useStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [tools, setTools] = useState<ToolCatalogItem[]>([]);
  const [toolsLoaded, setToolsLoaded] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => !!session.token && input.trim().length > 0 && !loading, [session.token, input, loading]);

  const appendMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 0);
  };

  const send = async () => {
    if (!canSend || !session.token) return;

    const message = input.trim();
    setInput('');
    appendMessage({ id: `u-${Date.now()}`, role: 'user', text: message });
    setLoading(true);

    try {
      let activeWorkspaceId = workspaceId;
      if (!activeWorkspaceId) {
        const wsListRes = await fetch('/api/v1/ai-interaction/workspaces', {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        if (wsListRes.ok) {
          const existing = (await wsListRes.json()) as Array<{ workspaceId: string }>;
          if (existing.length > 0) {
            activeWorkspaceId = existing[0].workspaceId;
          }
        }
        if (!activeWorkspaceId) {
          const wsCreateRes = await fetch('/api/v1/ai-interaction/workspaces', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.token}`,
            },
            body: JSON.stringify({ name: 'Default Workspace' }),
          });
          if (wsCreateRes.ok) {
            const created = (await wsCreateRes.json()) as { workspaceId: string };
            activeWorkspaceId = created.workspaceId;
          }
        }
        if (activeWorkspaceId) {
          setWorkspaceId(activeWorkspaceId);
        }
      }

      const response = await fetch('/api/v1/ai-interaction/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          conversationId,
          message,
          context: { route: window.location.pathname },
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Unable to stream AI response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';
      let finalPayload: StreamFinalPayload | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx = buffer.indexOf('\n');
        while (idx >= 0) {
          const line = buffer.slice(0, idx).trimEnd();
          buffer = buffer.slice(idx + 1);

          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            const payloadRaw = line.slice(5).trim();
            if (payloadRaw) {
              const payload = JSON.parse(payloadRaw) as Record<string, unknown>;
              if (currentEvent === 'final') {
                finalPayload = payload as unknown as StreamFinalPayload;
              }
            }
          } else if (!line) {
            currentEvent = '';
          }

          idx = buffer.indexOf('\n');
        }
      }

      if (finalPayload?.response) {
        setConversationId(finalPayload.conversationId);
        appendMessage({
          id: `a-${Date.now()}`,
          role: 'assistant',
          response: finalPayload.response,
        });
      } else {
        appendMessage({
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: 'No structured response was returned.',
        });
      }
    } catch (error) {
      appendMessage({
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: error instanceof Error ? error.message : 'Failed to fetch AI response.',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTools = async () => {
    if (!session.token || toolsLoaded) return;
    try {
      const res = await fetch('/api/v1/ai-interaction/tools', {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as ToolCatalogItem[];
      setTools(data);
      setToolsLoaded(true);
    } catch {
      // Silent fail in widget.
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
          <pre style={{ margin: 0, maxHeight: 180, overflow: 'auto', fontSize: 11, background: 'rgba(15,23,42,0.35)', padding: 8, borderRadius: 8 }}>
            {JSON.stringify(rows.slice(0, 10), null, 2)}
          </pre>
        </div>
      );
    }

    if (response.type === 'chart') {
      return renderChart(response);
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
          style={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            width: 'min(420px, calc(100vw - 24px))',
            height: 'min(620px, calc(100vh - 36px))',
            background: 'var(--bg-dropdown)',
            border: '1px solid var(--glass-border)',
            borderRadius: 16,
            zIndex: 130,
            boxShadow: '0 24px 48px rgba(2,6,23,0.4)',
            display: 'grid',
            gridTemplateRows: '56px auto 1fr 70px',
            overflow: 'hidden',
          }}
        >
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: 'var(--text-strong)' }}>
              <Bot size={18} />
              <span style={{ fontSize: 14 }}>AI Assistant</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              title="Close"
            >
              <X size={18} />
            </button>
          </header>

          <div style={{ borderBottom: '1px solid var(--glass-border)', padding: '8px 12px', display: 'grid', gap: 6 }}>
            <button
              type="button"
              onClick={() => {
                setToolsOpen((v) => !v);
                void loadTools();
              }}
              style={{
                justifySelf: 'start',
                border: '1px solid var(--glass-border)',
                background: 'var(--surface-elevated)',
                color: 'var(--text-strong)',
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {toolsOpen ? 'Hide Available Tools' : 'Show Available Tools'}
            </button>
            {toolsOpen && (
              <div style={{ maxHeight: 140, overflow: 'auto', display: 'grid', gap: 6 }}>
                {tools.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>No tools loaded.</div>
                ) : (
                  tools.map((tool) => (
                    <div key={tool.name} style={{ border: '1px solid var(--glass-border)', borderRadius: 8, padding: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-strong)' }}>
                        {tool.name}{tool.requiresConfirmation ? ' (confirmation)' : ''}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{tool.description}</div>
                      <div style={{ marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(tool.examplePrompts || []).map((p) => (
                          <button
                            key={`${tool.name}-${p}`}
                            type="button"
                            onClick={() => setInput(p)}
                            style={{
                              border: '1px solid var(--glass-border)',
                              background: 'var(--surface-elevated)',
                              color: 'var(--text-soft)',
                              borderRadius: 999,
                              fontSize: 10,
                              padding: '2px 7px',
                              cursor: 'pointer',
                            }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div ref={scrollRef} style={{ overflow: 'auto', padding: 12, display: 'grid', gap: 10 }}>
            {messages.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                Ask for attendance, dashboard, announcements, homework, exam results, transport overview, fee defaulters, student performance, library, forum leaderboard, leave workflows, message threads, or notification actions.
              </div>
            )}

            {messages.map((msg) => (
              <article
                key={msg.id}
                style={{
                  justifySelf: msg.role === 'user' ? 'end' : 'start',
                  maxWidth: '92%',
                  padding: 10,
                  borderRadius: 12,
                  border: '1px solid var(--glass-border)',
                  background: msg.role === 'user' ? 'var(--surface-accent-soft)' : 'var(--surface-elevated)',
                  color: 'var(--text-main)',
                }}
              >
                {msg.role === 'user' ? (
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>{msg.text}</p>
                ) : (
                  renderAssistantResponse(msg.response, msg.text)
                )}
              </article>
            ))}
            {loading && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Thinking...</div>}
          </div>

          <footer style={{ borderTop: '1px solid var(--glass-border)', padding: 10, display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Ask the assistant..."
              style={{
                width: '100%',
                borderRadius: 10,
                border: '1px solid var(--glass-border)',
                background: 'var(--surface-elevated)',
                color: 'var(--text-main)',
                padding: '10px 12px',
                fontSize: 13,
              }}
            />
            <button
              type="button"
              disabled={!canSend}
              onClick={() => void send()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: '1px solid var(--surface-accent-border)',
                background: canSend ? 'var(--surface-accent-soft)' : 'var(--surface-elevated)',
                color: canSend ? 'var(--text-strong)' : 'var(--text-dim)',
                cursor: canSend ? 'pointer' : 'not-allowed',
              }}
              title="Send"
            >
              <Send size={16} />
            </button>
          </footer>
        </section>
      )}
    </>
  );
};
