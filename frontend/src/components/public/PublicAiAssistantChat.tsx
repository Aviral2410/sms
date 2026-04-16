import React, { useMemo, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { readSseStream, tryParseJson } from '../../lib/sse';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  response?: RenderedResponse;
};

type RenderedResponse = {
  type: 'chart' | 'table' | 'text' | 'action';
  data: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

const EXAMPLE_QUESTIONS = [
  'What is included in the Commercial plan?',
  'How does onboarding work for a new school?',
  'Which modules cover attendance and transport?',
  'How do we raise support with rollout context?',
  'Can you summarize the platform vision?',
];

export function PublicAiAssistantChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'a-welcome',
      role: 'assistant',
      text: 'Welcome. Ask about pricing, onboarding, features, or support. This chat is not tied to an account.',
    },
  ]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const append = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
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

  const renderChart = (response: RenderedResponse) => {
    const chart = response.data?.chart as { xKey?: string; yKey?: string; points?: Record<string, unknown>[] } | undefined;
    const points = Array.isArray(chart?.points) ? chart.points : [];
    const xKey = chart?.xKey || 'x';
    const yKey = chart?.yKey || 'y';

    if (points.length === 0) {
      return (
        <pre className="public-chat__pre">
          {JSON.stringify(response.data, null, 2)}
        </pre>
      );
    }

    return (
      <div className="public-chat__chart">
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

  const renderResponse = (response?: RenderedResponse) => {
    if (!response) return null;

    if (response.type === 'text') {
      const text = typeof response.data?.text === 'string' ? (response.data.text as string) : JSON.stringify(response.data);
      return <div className="public-chat__rich">{text}</div>;
    }

    if (response.type === 'table') {
      const rows = Array.isArray(response.data?.rows) ? (response.data.rows as Record<string, unknown>[]) : [];
      return (
        <div className="public-chat__rich">
          <div className="public-chat__meta">Rows: {rows.length}</div>
          <pre className="public-chat__pre">{JSON.stringify(rows.slice(0, 12), null, 2)}</pre>
        </div>
      );
    }

    if (response.type === 'chart') {
      return <div className="public-chat__rich">{renderChart(response)}</div>;
    }

    if (response.type === 'action') {
      const status = typeof response.data?.status === 'string' ? (response.data.status as string) : 'Action';
      const msg = typeof response.data?.message === 'string' ? (response.data.message as string) : '';
      return (
        <div className="public-chat__rich">
          <div className="public-chat__meta">{status}</div>
          {msg ? <div className="public-chat__meta">{msg}</div> : null}
          <pre className="public-chat__pre">{JSON.stringify(response.data, null, 2)}</pre>
        </div>
      );
    }

    return null;
  };

  const sendText = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    setInput('');
    append({ id: `u-${Date.now()}`, role: 'user', text: trimmed });
    setLoading(true);
    const assistantId = `a-${Date.now()}`;
    append({ id: assistantId, role: 'assistant', text: '' });

    try {
      const res = await fetch('/api/v1/ai-interaction/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, context: { route: window.location.pathname, public: true } }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Chat endpoint returned ${res.status}.`);
      }

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
            const text = typeof payload?.text === 'string'
              ? payload.text
              : typeof payload?.response?.data?.text === 'string'
                ? payload.response.data.text
                : '';
            if (text) currentText = text;
            patchMessage(assistantId, { text: currentText || 'Done.', response });
            return;
          }

          const chunkText = typeof data === 'string' ? data : '';
          const tokenText = parsed.ok && typeof parsed.value?.text === 'string' ? parsed.value.text as string : '';
          const next = tokenText || chunkText;
          if (eventName === 'token' || eventName === 'delta' || eventName === 'chunk' || eventName === 'message') {
            if (next) {
              currentText += next;
              patchMessage(assistantId, { text: currentText });
            }
          }
        },
      });

      if (!gotAny || !currentText.trim()) {
        patchMessage(assistantId, { text: 'No response.' });
      }
    } catch (error: any) {
      patchMessage(assistantId, { text: `I could not complete that request right now: ${error?.message || 'service unavailable'}.` });
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!canSend) return;
    await sendText(input);
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="public-chat-launcher"
          title="Chat with AI"
          data-tour="public-chat-launcher"
        >
          <MessageCircle size={22} />
        </button>
      )}

      {open && (
        <section
          className="public-chat"
        >
          <header className="public-chat__header">
            <div className="public-chat__title">
              <span className="public-chat__mark"><Bot size={18} /></span>
              <span>AI Assistant</span>
              <span className="public-chat__scope">Public</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="public-chat__close"
              title="Close"
            >
              <X size={18} />
            </button>
          </header>

          <div ref={scrollRef} className="public-chat__thread">
            <div className="public-chat__examples">
              <div className="public-chat__examples-title">Try one:</div>
              <div className="public-chat__examples-grid">
                {EXAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="public-chat__example"
                    onClick={() => {
                      void sendText(q);
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            {messages.map((msg) => (
              <article
                key={msg.id}
                className={`public-chat__bubble${msg.role === 'user' ? ' is-user' : ' is-assistant'}`}
              >
                <p className="public-chat__text">{msg.text}</p>
                {msg.role === 'assistant' ? renderResponse(msg.response) : null}
              </article>
            ))}
            {loading && <div className="public-chat__thinking">Thinking...</div>}
          </div>

          <footer className="public-chat__composer">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Ask about pricing, onboarding, support..."
              className="public-chat__input"
            />
            <button
              type="button"
              disabled={!canSend}
              onClick={() => void send()}
              className="public-chat__send"
              title="Send"
            >
              <Send size={16} />
            </button>
          </footer>
        </section>
      )}
    </>
  );
}

