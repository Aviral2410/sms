import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  Mic,
  MicOff,
  Brain,
  ChevronRight,
  FolderPlus,
  History,
  MessageSquare,
  PanelLeft,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { AssistantResponseView } from './AssistantResponseView';
import {
  aiInteractionApi,
  resolveAiGuestId,
  type AiChatMessageResponse,
  type AiChatSummaryResponse,
  type AiWorkspaceResponse,
} from '../../lib/api';
import { readSseStream, tryParseJson } from '../../lib/sse';
import { useStore } from '../../store/useStore';

type Variant = 'drawer' | 'page';
type AccessMode = 'authenticated' | 'public';

type RenderedResponse = {
  type: string;
  data: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
  thought?: string | null;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  response?: RenderedResponse | null;
  thought?: string | null;
  timestamp: string;
  streaming?: boolean;
  error?: boolean;
};

type Props = {
  variant?: Variant;
  accessMode?: AccessMode;
};

const DRAWER_WIDTH = 'min(calc(100vw - 2rem), 96rem)';

const AUTHENTICATED_EXAMPLE_PROMPTS = [
  'Show me student attendance risk trends for this month.',
  'Summarize onboarding bottlenecks across schools.',
  'Create a visual explanation of Newton\'s second law for class 8.',
  'Draft insights for fee collection and pending dues.',
];

const PUBLIC_EXAMPLE_PROMPTS = [
  'Compare your subscription plans.',
  'What is on the platform roadmap for 2026?',
  'How many schools are already on ElevateSmart?',
  'Tell me about the platform vision.',
];

const SAMPLE_VIDEO_EXAMPLES = [
  {
    title: 'Physics Motion Storyboard',
    caption: 'Preview how velocity, force, and acceleration can be visualized for a student question.',
    poster: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  },
  {
    title: 'Biology Process Walkthrough',
    caption: 'Reference motion language for generated explainers around systems and cycles.',
    poster: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1200&q=80',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  },
];

function buildAssistantSummary(response: RenderedResponse | null | undefined) {
  if (!response) return 'AURA completed the request.';

  if (response.type === 'text') {
    const text = typeof response.data?.text === 'string' ? response.data.text : '';
    if (text.trim()) return text;
  }

  if (typeof response.thought === 'string' && response.thought.trim()) {
    return response.thought;
  }

  if (typeof response.data?.summary === 'string' && response.data.summary.trim()) {
    return response.data.summary;
  }

  if (typeof response.data?.title === 'string' && response.data.title.trim()) {
    return `${response.data.title} is ready.`;
  }

  return 'AURA synthesized a visual response.';
}

function normalizeStoredMessage(message: AiChatMessageResponse): ChatMessage {
  const payload = message.payload && typeof message.payload === 'object'
    ? {
        type: typeof message.payload.type === 'string' ? message.payload.type : 'text',
        data: (message.payload.data as Record<string, unknown> | null) ?? null,
        meta: (message.payload.meta as Record<string, unknown> | null) ?? null,
        thought: typeof message.payload.thought === 'string' ? message.payload.thought : null,
      }
    : null;

  return {
    id: message.messageId,
    role: message.role === 'assistant' ? 'assistant' : 'user',
    text: message.content || buildAssistantSummary(payload),
      response: payload,
      thought: payload?.thought ?? message.thought ?? null,
      timestamp: message.timestamp,
  };
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isMeaningfulResponse(message: ChatMessage | undefined) {
  return Boolean(message?.response?.data && typeof message.response.data === 'object');
}

export function AiAssistantChat({ variant = 'drawer', accessMode = 'authenticated' }: Props) {
  const { session } = useStore();
  const isPublic = accessMode === 'public';
  const [open, setOpen] = useState(variant === 'page');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (variant === 'page') return window.innerWidth >= 1024;
    return window.innerWidth >= 1280;
  });
  const [workspaces, setWorkspaces] = useState<AiWorkspaceResponse[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [chats, setChats] = useState<AiChatSummaryResponse[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [workspaceDraft, setWorkspaceDraft] = useState('');
  const [workspaceComposerOpen, setWorkspaceComposerOpen] = useState(false);
  const [statusText, setStatusText] = useState('Ready to help');
  const [draggingConversationId, setDraggingConversationId] = useState<string | null>(null);
  const [actionPendingToken, setActionPendingToken] = useState<string | null>(null);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  const examplePrompts = isPublic ? PUBLIC_EXAMPLE_PROMPTS : AUTHENTICATED_EXAMPLE_PROMPTS;

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.workspaceId === activeWorkspaceId) ?? null,
    [activeWorkspaceId, workspaces],
  );

  const lastVisualResponse = useMemo(() => {
    return [...messages].reverse().find((message) => isMeaningfulResponse(message))?.response ?? null;
  }, [messages]);

  const sortChats = useCallback((items: AiChatSummaryResponse[]) => {
    return [...items].sort((left, right) => {
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
  }, []);

  const loadChats = useCallback(async (workspaceId: string, preferredConversationId?: string | null) => {
    setHistoryLoading(true);
    try {
      const nextChats = sortChats(await aiInteractionApi.listChats(workspaceId));
      setChats(nextChats);

      if (!nextChats.length) {
        setActiveConversationId(null);
        setMessages([]);
        return;
      }

      const resolvedConversationId = preferredConversationId && nextChats.some((chat) => chat.conversationId === preferredConversationId)
        ? preferredConversationId
        : nextChats[0].conversationId;
      setActiveConversationId(resolvedConversationId);
    } finally {
      setHistoryLoading(false);
    }
  }, [sortChats]);

  const loadWorkspaces = useCallback(async () => {
    setBootstrapping(true);
    try {
      const nextWorkspaces = await aiInteractionApi.listWorkspaces();
      setWorkspaces(nextWorkspaces);
      if (!nextWorkspaces.length) {
        setActiveWorkspaceId(null);
        setChats([]);
        setActiveConversationId(null);
        setMessages([]);
        return;
      }

      const nextWorkspaceId = nextWorkspaces[0].workspaceId;
      setActiveWorkspaceId((current) =>
        current && nextWorkspaces.some((workspace) => workspace.workspaceId === current) ? current : nextWorkspaceId,
      );
    } finally {
      setBootstrapping(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadWorkspaces();
  }, [loadWorkspaces, open]);

  useEffect(() => {
    if (!open || !activeWorkspaceId) return;
    void loadChats(activeWorkspaceId, activeConversationId);
  }, [activeWorkspaceId, loadChats, open]);

  useEffect(() => {
    if (!open || !activeConversationId) return;

    let cancelled = false;

    const run = async () => {
      try {
        const history = await aiInteractionApi.listChatMessages(activeConversationId, 80);
        if (cancelled) return;
        setMessages(history.map(normalizeStoredMessage));
      } catch {
        if (!cancelled) {
          setMessages([]);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [activeConversationId, open]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (variant === 'page') {
      setOpen(true);
    }
  }, [variant]);

  const handleCreateWorkspace = useCallback(async () => {
    const name = workspaceDraft.trim();
    if (!name) return;
    try {
      const workspace = await aiInteractionApi.createWorkspace(name);
      setWorkspaces((current) => [workspace, ...current]);
      setActiveWorkspaceId(workspace.workspaceId);
      setWorkspaceDraft('');
      setWorkspaceComposerOpen(false);
      setChats([]);
      setMessages([]);
      setActiveConversationId(null);
      setStatusText('Workspace created');
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Workspace could not be created.');
    }
  }, [workspaceDraft]);

  const handleDeleteChat = useCallback(async (conversationId: string) => {
    const target = chats.find((chat) => chat.conversationId === conversationId);
    if (!target) return;

    const confirmed = window.confirm(`Delete "${target.title || 'this chat'}"?`);
    if (!confirmed) return;

    try {
      await aiInteractionApi.deleteChat(conversationId);

      setChats((current) => current.filter((chat) => chat.conversationId !== conversationId));

      if (activeConversationId === conversationId) {
        const remaining = chats.filter((chat) => chat.conversationId !== conversationId);
        const nextConversationId = remaining[0]?.conversationId ?? null;
        setActiveConversationId(nextConversationId);
        if (!nextConversationId) {
          setMessages([]);
        }
      }
      setStatusText('Chat deleted');
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Chat could not be deleted.');
    }
  }, [activeConversationId, chats]);

  const handleDeleteWorkspace = useCallback(async (workspaceId: string) => {
    const target = workspaces.find((workspace) => workspace.workspaceId === workspaceId);
    if (!target) return;

    const confirmed = window.confirm(`Delete workspace "${target.name}"? Its chats will be moved to another workspace when possible.`);
    if (!confirmed) return;

    try {
      await aiInteractionApi.deleteWorkspace(workspaceId);
      const nextWorkspaces = await aiInteractionApi.listWorkspaces();
      setWorkspaces(nextWorkspaces);
      const nextWorkspaceId = nextWorkspaces[0]?.workspaceId ?? null;
      setActiveWorkspaceId((current) => current === workspaceId ? nextWorkspaceId : current);
      if (nextWorkspaceId) {
        await loadChats(nextWorkspaceId);
      } else {
        setChats([]);
        setMessages([]);
        setActiveConversationId(null);
      }
      setStatusText('Workspace deleted');
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Workspace could not be deleted.');
    }
  }, [loadChats, workspaces]);

  const handleMoveChatToWorkspace = useCallback(async (conversationId: string, workspaceId: string) => {
    try {
      await aiInteractionApi.moveChat(conversationId, workspaceId);
      if (activeWorkspaceId) {
        await loadChats(activeWorkspaceId);
      }
      setStatusText('Chat moved to workspace');
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Chat could not be moved.');
    } finally {
      setDraggingConversationId(null);
    }
  }, [activeWorkspaceId, loadChats]);

  const handleConfirmAction = useCallback(async (confirmationToken: string) => {
    try {
      setActionPendingToken(confirmationToken);
      const result = await aiInteractionApi.confirmAction(confirmationToken);
      const response = result.response as RenderedResponse;
      setMessages((current) => [
        ...current,
        {
          id: `assistant-confirm-${Date.now()}`,
          role: 'assistant',
          text: buildAssistantSummary(response),
          response,
          thought: response.thought ?? null,
          timestamp: new Date().toISOString(),
        },
      ]);
      setStatusText('Action completed');
      if (activeWorkspaceId) {
        await loadChats(activeWorkspaceId, result.conversationId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The action could not be confirmed.';
      setStatusText(message);
    } finally {
      setActionPendingToken(null);
    }
  }, [activeWorkspaceId, loadChats]);

  const stopVoiceCapture = useCallback(() => {
    speechRecognitionRef.current?.stop?.();
    speechRecognitionRef.current = null;
    setVoiceListening(false);
  }, []);

  useEffect(() => {
    return () => {
      stopVoiceCapture();
    };
  }, [stopVoiceCapture]);

  const handleCreateDraftChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setStatusText('Fresh draft started');
    composerRef.current?.focus();
  }, []);

  const handleSend = useCallback(async (override?: string) => {
    const messageText = (override ?? input).trim();
    if (!messageText || loading || !activeWorkspaceId) return;

    setInput('');
    setLoading(true);
    setStatusText('Analyzing your request');

    const assistantId = `assistant-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((current) => [
      ...current,
      userMessage,
      {
        id: assistantId,
        role: 'assistant',
        text: '',
        timestamp: new Date().toISOString(),
        streaming: true,
      },
    ]);

    let conversationId = activeConversationId;

    try {
      if (!conversationId) {
        const chat = await aiInteractionApi.createChat(activeWorkspaceId, messageText.slice(0, 64));
        conversationId = chat.conversationId;
        setActiveConversationId(chat.conversationId);
        setChats((current) => sortChats([chat, ...current.filter((item) => item.conversationId !== chat.conversationId)]));
      }

      const response = await fetch('/api/v1/ai-interaction/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}),
          ...(!session.token ? { 'X-Guest-ID': resolveAiGuestId() } : {}),
        },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          conversationId,
          message: messageText,
          context: {
            route: variant === 'page' ? '/ai-assistant' : '/assistant-drawer',
          },
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('AURA stream could not be established.');
      }

      await readSseStream(response.body, {
        onEvent: ({ event, data }) => {
          if (event === 'thought') {
            const parsed = tryParseJson<{ text?: string }>(data);
            if (parsed.ok && parsed.value.text) {
              setStatusText(parsed.value.text);
              setMessages((current) =>
                current.map((message) =>
                  message.id === assistantId ? { ...message, thought: parsed.value.text ?? null } : message,
                ),
              );
            }
            return;
          }

          if (event === 'final') {
            const parsed = tryParseJson<{
              workspaceId: string | null;
              conversationId: string;
              response: RenderedResponse;
            }>(data);

            if (!parsed.ok) return;

            setStatusText('Response ready');
            setActiveConversationId(parsed.value.conversationId);
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? {
                      ...message,
                      text: buildAssistantSummary(parsed.value.response),
                      response: parsed.value.response,
                      thought: parsed.value.response.thought ?? message.thought ?? null,
                      streaming: false,
                    }
                  : message,
              ),
            );
          }

          if (event === 'error') {
            const parsed = tryParseJson<{ text?: string }>(data);
            const text = parsed.ok && parsed.value.text ? parsed.value.text : 'The assistant stream failed.';
            throw new Error(text);
          }
        },
      });

      if (conversationId) {
        await loadChats(activeWorkspaceId, conversationId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The assistant hit an unexpected error.';
      setStatusText('The assistant needs another try');
      setMessages((current) =>
        current.map((entry) =>
          entry.id === assistantId
            ? {
                ...entry,
                text: message,
                streaming: false,
                error: true,
              }
            : entry,
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [activeConversationId, activeWorkspaceId, input, loadChats, loading, session.token, sortChats, variant]);

  const startVoiceCapture = useCallback(() => {
    setVoiceError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('Voice input is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    speechRecognitionRef.current = recognition;

    recognition.onstart = () => {
      setVoiceListening(true);
      setStatusText('Listening for your question');
    };

    recognition.onerror = () => {
      setVoiceListening(false);
      setVoiceError('Voice capture failed. Please try again.');
      setStatusText('Voice capture failed');
    };

    recognition.onend = () => {
      setVoiceListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || '')
        .join(' ')
        .trim();
      if (transcript) {
        setInput(transcript);
        void handleSend(transcript);
      }
    };

    recognition.start();
  }, [handleSend]);

  const shellTitle = isPublic
    ? 'AURA Public Assistant'
    : variant === 'page'
      ? 'AURA Strategy Workspace'
      : 'AURA Assistant';
  const shellSubtitle = isPublic
    ? 'Ask about pricing, onboarding, platform capabilities, and roadmap with the same assistant experience.'
    : variant === 'page'
      ? 'Manage chats, review history, and open generated intelligence next to the conversation.'
      : 'Fast insight, summaries, and visual reasoning without leaving the page.';

  const shellBody = (
    <div className="relative flex h-full min-h-0 flex-col lg:grid lg:grid-cols-[20rem_minmax(0,1fr)_minmax(0,30rem)]">
      <AnimatePresence>
        {(variant === 'page' || sidebarOpen) && (
          <motion.aside
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            className={`${
              variant === 'page'
                ? `${sidebarOpen ? 'absolute inset-y-0 left-0 z-20 w-[18rem]' : 'hidden'} border-r border-white/10 bg-slate-950/95 shadow-2xl lg:static lg:z-auto lg:block lg:w-auto lg:border-b-0 lg:bg-black/20 lg:shadow-none`
                : 'absolute inset-y-0 left-0 z-20 w-[18rem] border-r border-white/10 bg-slate-950/95 shadow-2xl'
            } border-white/10`}
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="border-b border-white/10 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-emerald-300/70">Workspace Hub</div>
                    <div className="mt-1 text-sm font-semibold text-white/80">
                      {activeWorkspace?.name || 'Loading workspace'}
                    </div>
                  </div>
                  {variant !== 'page' ? (
                    <button
                      type="button"
                      onClick={() => setSidebarOpen(false)}
                      className="rounded-xl border border-white/10 p-2 text-white/60 transition hover:bg-white/5 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 space-y-2">
                  {workspaceComposerOpen ? (
                    <div className="space-y-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-3">
                      <input
                        value={workspaceDraft}
                        onChange={(event) => setWorkspaceDraft(event.target.value)}
                        placeholder="New workspace name"
                        className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleCreateWorkspace()}
                          className="flex-1 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setWorkspaceComposerOpen(false);
                            setWorkspaceDraft('');
                          }}
                          className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setWorkspaceComposerOpen(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-400/25 bg-emerald-500/5 px-4 py-3 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300/40 hover:bg-emerald-500/10"
                    >
                      <FolderPlus size={16} />
                      New Workspace
                    </button>
                  )}

                  <div className="max-h-32 space-y-2 overflow-y-auto pr-1">
                    {workspaces.map((workspace) => (
                      <div
                        key={workspace.workspaceId}
                        onDragOver={(event) => {
                          if (!draggingConversationId) return;
                          event.preventDefault();
                        }}
                        onDrop={(event) => {
                          if (!draggingConversationId) return;
                          event.preventDefault();
                          void handleMoveChatToWorkspace(draggingConversationId, workspace.workspaceId);
                        }}
                        className={draggingConversationId ? 'rounded-2xl ring-1 ring-dashed ring-emerald-400/25' : ''}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setActiveWorkspaceId(workspace.workspaceId);
                            setSidebarOpen(variant === 'page');
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setActiveWorkspaceId(workspace.workspaceId);
                            }
                          }}
                          className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition ${
                            workspace.workspaceId === activeWorkspaceId
                              ? 'bg-emerald-500/12 text-white ring-1 ring-emerald-400/30'
                              : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">{workspace.name}</div>
                            <div className="mt-1 text-[0.7rem] uppercase tracking-[0.2em] text-white/35">
                              {new Date(workspace.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {workspaces.length > 1 ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleDeleteWorkspace(workspace.workspaceId);
                                }}
                                className="rounded-xl border border-transparent p-2 text-white/35 transition hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200"
                                aria-label={`Delete workspace ${workspace.name}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : null}
                            <ChevronRight size={14} className="shrink-0" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-3">
                <div className="text-[0.7rem] font-black uppercase tracking-[0.24em] text-white/35">Chat History</div>
                <button
                  type="button"
                  onClick={handleCreateDraftChat}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/75 transition hover:bg-white/5 hover:text-white"
                >
                  <Plus size={14} />
                  New chat
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
                {historyLoading ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/50">Loading conversations...</div>
                ) : chats.length ? (
                  <div className="space-y-2">
                    {chats.map((chat) => (
                      <div
                        key={chat.conversationId}
                        draggable
                        onDragStart={() => setDraggingConversationId(chat.conversationId)}
                        onDragEnd={() => setDraggingConversationId(null)}
                        className={`group flex items-center gap-2 rounded-2xl px-3 py-3 transition ${
                          chat.conversationId === activeConversationId
                            ? 'bg-white/10 text-white ring-1 ring-white/15'
                            : 'bg-white/[0.03] text-white/70 hover:bg-white/8 hover:text-white'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveConversationId(chat.conversationId);
                            if (variant !== 'page') setSidebarOpen(false);
                          }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="truncate text-sm font-semibold">{chat.title || 'Untitled chat'}</div>
                          <div className="mt-1 text-[0.68rem] uppercase tracking-[0.18em] text-white/35">
                            {new Date(chat.updatedAt).toLocaleDateString()}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteChat(chat.conversationId)}
                          className="rounded-xl border border-transparent p-2 text-white/35 transition hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200"
                          aria-label={`Delete ${chat.title}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/45">
                    No chats in this workspace yet. Start a draft to create one automatically.
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <section className="min-h-0 border-b border-white/10 lg:border-b-0 lg:border-r">
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-b border-white/10 px-4 py-4 md:px-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-emerald-300/70">Neural Assistant</div>
                <h2 className="mt-2 text-xl font-black tracking-tight text-white">{shellTitle}</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-white/55">{shellSubtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSidebarOpen((current) => !current)}
                  className="rounded-2xl border border-white/10 bg-white/5 p-2.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <PanelLeft size={18} />
                </button>
                {variant === 'drawer' ? (
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-2xl border border-white/10 bg-white/5 p-2.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {examplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void handleSend(prompt)}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-emerald-300/30 hover:bg-emerald-500/10 hover:text-emerald-100"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 md:px-5">
            {!messages.length ? (
              <div className="rounded-[1.75rem] border border-dashed border-white/12 bg-white/[0.03] p-6 text-white/60">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-500/12 p-3 text-emerald-300">
                    <Brain size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Start a new analysis</div>
                    <div className="mt-1 text-sm text-white/50">Ask for school insights, operations summaries, or a visual learning explanation.</div>
                  </div>
                </div>
              </div>
            ) : null}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[92%] sm:max-w-[84%] ${message.role === 'assistant' ? 'w-full' : ''}`}>
                  {message.role === 'assistant' ? (
                    <div className={`rounded-[1.6rem] border p-4 shadow-lg ${
                      message.error
                        ? 'border-rose-400/20 bg-rose-500/10'
                        : 'border-emerald-400/15 bg-emerald-500/[0.06]'
                    }`}>
                      <div className="mb-3 flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-200">
                          <Bot size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200/75">AURA</div>
                          <div className="text-[0.72rem] text-white/35">{formatTimestamp(message.timestamp)}</div>
                        </div>
                      </div>
                      {message.thought ? (
                        <div className="mb-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-emerald-100/80">
                          {message.thought}
                        </div>
                      ) : null}
                      {message.response ? (
                        <div className="mt-2">
                          <AssistantResponseView
                            response={message.response}
                            onConfirmAction={(token) => handleConfirmAction(token)}
                            actionPending={actionPendingToken === message.response?.meta?.confirmationToken}
                          />
                        </div>
                      ) : (
                        <div className="text-sm leading-7 text-white/85">{message.text}</div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-[1.5rem] border border-cyan-400/15 bg-cyan-500/[0.08] px-4 py-3 text-sm leading-7 text-white">
                      <div className="mb-1 text-[0.68rem] font-black uppercase tracking-[0.2em] text-cyan-100/55">You</div>
                      {message.text}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 px-4 py-4 md:px-5">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs text-white/40">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-300/70" />
                <span>{loading ? statusText : 'Tool-aware assistant connected'}</span>
              </div>
              <div className="flex items-center gap-2">
                <History size={13} />
                <span>{activeConversationId ? 'History saved' : 'Draft mode'}</span>
              </div>
            </div>
            {voiceError ? (
              <div className="mb-3 rounded-2xl border border-rose-400/20 bg-rose-500/[0.08] px-3 py-2 text-xs text-rose-100/85">
                {voiceError}
              </div>
            ) : null}
            <div className="flex items-end gap-3">
              <textarea
                ref={composerRef}
                value={input}
                maxLength={2000}
                onChange={(event) => setInput(event.target.value.slice(0, 2000))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Ask for insights, explain a concept, or request a visual answer..."
                className="min-h-[58px] flex-1 resize-none rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-300/30 focus:bg-white/[0.06]"
              />
              <button
                type="button"
                onClick={() => {
                  if (voiceListening) {
                    stopVoiceCapture();
                    setStatusText('Voice capture stopped');
                    return;
                  }
                  startVoiceCapture();
                }}
                className={`inline-flex h-[58px] w-[58px] items-center justify-center rounded-[1.25rem] border transition ${
                  voiceListening
                    ? 'border-rose-400/30 bg-rose-500/15 text-rose-100'
                    : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-emerald-300/30 hover:bg-white/[0.08] hover:text-white'
                }`}
                aria-label={voiceListening ? 'Stop voice input' : 'Start voice input'}
              >
                {voiceListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={loading || !input.trim() || !activeWorkspaceId}
                className="inline-flex h-[58px] w-[58px] items-center justify-center rounded-[1.25rem] bg-emerald-500 text-slate-950 shadow-[0_12px_30px_rgba(16,185,129,0.25)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="mt-2 text-right text-[0.72rem] text-white/35">{input.length}/2000</div>
          </div>
        </div>
      </section>

      <aside className="hidden min-h-0 bg-black/10 lg:block">
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-b border-white/10 px-4 py-4">
            <div className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-emerald-300/70">Visualizer</div>
            <h3 className="mt-2 text-lg font-black text-white">Response canvas</h3>
            <p className="mt-1 text-sm leading-6 text-white/50">
              The latest generated intelligence is shown here, alongside sample motion references for explainers.
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5">
            {lastVisualResponse?.data ? (
              <div className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-3">
                <AssistantResponseView response={lastVisualResponse} />
              </div>
            ) : (
              <div className="rounded-[1.8rem] border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm leading-6 text-white/45">
                Ask AURA for a visualization, chart, or workflow breakdown to populate this canvas.
              </div>
            )}

            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <Video size={16} className="text-emerald-300" />
                Motion examples
              </div>
              <div className="space-y-4">
                {SAMPLE_VIDEO_EXAMPLES.map((item) => (
                  <div key={item.title} className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-black/20">
                    <video
                      className="aspect-video w-full object-cover"
                      src={item.src}
                      poster={item.poster}
                      muted
                      playsInline
                      autoPlay
                      loop
                      controls
                    />
                    <div className="p-3">
                      <div className="text-sm font-semibold text-white">{item.title}</div>
                      <div className="mt-1 text-sm leading-6 text-white/50">{item.caption}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );

  if (variant === 'page') {
    return (
      <div className="min-h-[calc(100vh-4rem)] rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_26%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(3,7,18,0.94))] text-white shadow-[0_24px_80px_rgba(2,6,23,0.45)]">
        {shellBody}
      </div>
    );
  }

  return (
    <>
      {!open ? (
        <motion.button
          type="button"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-emerald-500 text-slate-950 shadow-[0_18px_45px_rgba(16,185,129,0.35)] transition hover:scale-105 hover:bg-emerald-400"
        >
          <MessageSquare size={22} />
        </motion.button>
      ) : null}

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            className="fixed bottom-0 right-0 z-50 h-[100dvh] w-full sm:bottom-5 sm:right-5 sm:h-[min(90vh,48rem)]"
            style={{ maxWidth: DRAWER_WIDTH }}
          >
            <div className="flex h-full flex-col overflow-hidden border border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.98),rgba(3,7,18,0.96))] text-white shadow-[0_30px_80px_rgba(2,6,23,0.7)] sm:rounded-[2rem]">
              {shellBody}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default AiAssistantChat;
