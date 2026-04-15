import React, { useMemo, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { request } from '../../lib/api';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export function PublicAiAssistantChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'a-welcome',
      role: 'assistant',
      text: 'Ask about pricing, onboarding, features, or support. This chat is not tied to an account.',
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

  const send = async () => {
    if (!canSend) return;
    const message = input.trim();
    setInput('');
    append({ id: `u-${Date.now()}`, role: 'user', text: message });
    setLoading(true);

    try {
      const response = await request<any>('/ai-interaction/chat', {
        method: 'POST',
        body: JSON.stringify({ message, context: { route: window.location.pathname, public: true } }),
      });

      const text = typeof response?.response?.data?.text === 'string'
        ? response.response.data.text
        : typeof response?.text === 'string'
          ? response.text
          : JSON.stringify(response?.response?.data ?? response, null, 2);

      append({ id: `a-${Date.now()}`, role: 'assistant', text });
    } catch (error: any) {
      append({
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: `I could not complete that request right now: ${error?.message || 'service unavailable'}.`,
      });
    } finally {
      setLoading(false);
    }
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
            border: '1px solid rgba(99,102,241,0.35)',
            background: 'rgba(15,23,42,0.75)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 140,
            cursor: 'pointer',
            boxShadow: '0 12px 28px rgba(2,6,23,0.45)',
            backdropFilter: 'blur(10px)',
          }}
          title="Chat with AI"
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
            background: 'rgba(2,6,23,0.92)',
            border: '1px solid rgba(148,163,184,0.18)',
            borderRadius: 16,
            zIndex: 140,
            boxShadow: '0 24px 48px rgba(2,6,23,0.6)',
            display: 'grid',
            gridTemplateRows: '56px 1fr 70px',
            overflow: 'hidden',
            backdropFilter: 'blur(16px)',
          }}
        >
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: '1px solid rgba(148,163,184,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: 'white' }}>
              <MessageCircle size={18} />
              <span style={{ fontSize: 14 }}>AI Assistant</span>
              <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.9)', fontWeight: 700 }}>(Public)</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'rgba(148,163,184,0.95)', cursor: 'pointer' }}
              title="Close"
            >
              <X size={18} />
            </button>
          </header>

          <div ref={scrollRef} style={{ overflow: 'auto', padding: 12, display: 'grid', gap: 10 }}>
            {messages.map((msg) => (
              <article
                key={msg.id}
                style={{
                  justifySelf: msg.role === 'user' ? 'end' : 'start',
                  maxWidth: '92%',
                  padding: 10,
                  borderRadius: 12,
                  border: '1px solid rgba(148,163,184,0.18)',
                  background: msg.role === 'user' ? 'rgba(99,102,241,0.18)' : 'rgba(15,23,42,0.65)',
                  color: 'rgba(226,232,240,0.98)',
                }}
              >
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{msg.text}</p>
              </article>
            ))}
            {loading && <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.95)' }}>Thinking...</div>}
          </div>

          <footer style={{ borderTop: '1px solid rgba(148,163,184,0.18)', padding: 10, display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
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
              style={{
                width: '100%',
                borderRadius: 10,
                border: '1px solid rgba(148,163,184,0.18)',
                background: 'rgba(15,23,42,0.6)',
                color: 'rgba(226,232,240,0.98)',
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
                border: '1px solid rgba(99,102,241,0.35)',
                background: canSend ? 'rgba(99,102,241,0.18)' : 'rgba(15,23,42,0.6)',
                color: canSend ? 'white' : 'rgba(148,163,184,0.95)',
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
}

