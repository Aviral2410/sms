import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Brain,
  Building2,
  ChevronRight,
  Compass,
  FolderPlus,
  GraduationCap,
  History,
  LayoutGrid,
  Library,
  MessageSquare,
  Mic,
  MicOff,
  PanelLeft,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
  type LucideIcon,
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
  timeline?: string[];
  timestamp: string;
  streaming?: boolean;
  error?: boolean;
};

type PublicHistoryEntry = {
  conversationId: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
};

type Props = {
  variant?: Variant;
  accessMode?: AccessMode;
};

type CapabilityAction = {
  label: string;
  icon: LucideIcon;
  prompt: string;
  roles?: string[];
};

const DRAWER_WIDTH = 'min(calc(100vw - 2rem), 96rem)';
const PUBLIC_HISTORY_STORAGE_KEY = 'aura-public-history-v2';

const AUTHENTICATED_EXAMPLE_PROMPTS = [
  'Show me student attendance risk trends for this month.',
  'Summarize onboarding bottlenecks across schools.',
  'List the highest-priority student issues requiring follow-up today.',
  'Draft insights for fee collection and pending dues.',
];

const PUBLIC_EXAMPLE_PROMPTS = [
  'How does Aura connect admissions, attendance, fees, and parent communication?',
  'Show me what the AI workspace can return for school leadership teams.',
  'How would this platform support a multi-campus school group?',
  'What does rollout look like from demo to onboarding?',
];

const ERP_TOOL_LABELS = [
  'Admissions',
  'Attendance',
  'Finance',
  'Transport',
  'Communication',
  'Timetable',
];

const PUBLIC_CAPABILITY_ACTIONS: CapabilityAction[] = [
  { label: 'School ERP aware', icon: Building2, prompt: 'How does Aura connect admissions, attendance, finance, transport, and communication in one workflow?' },
  { label: 'Structured answers', icon: LayoutGrid, prompt: 'Show me an example of a structured Aura answer for school leadership.' },
  { label: 'Streaming replies', icon: Sparkles, prompt: 'What kind of streaming replies and summaries does Aura provide during evaluation?' },
  { label: 'Rollout guidance', icon: Compass, prompt: 'Walk me through the rollout journey from demo to onboarding.' },
];

const AUTHENTICATED_CAPABILITY_ACTIONS: CapabilityAction[] = [
  { label: 'Workspace memory', icon: History, prompt: 'Summarize what this workspace is tracking and suggest the next actions.', roles: ['PLATFORM_ADMIN', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TRANSPORT_MANAGER'] },
  { label: 'Operational analysis', icon: Brain, prompt: 'Give me the highest-priority operational insights for today based on my role.', roles: ['PLATFORM_ADMIN', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TRANSPORT_MANAGER'] },
  { label: 'Leadership briefing', icon: Building2, prompt: 'Draft a leadership briefing for cross-module school operations.', roles: ['PLATFORM_ADMIN', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER'] },
  { label: 'Structured outputs', icon: LayoutGrid, prompt: 'Show this answer as a structured operational summary.', roles: ['PLATFORM_ADMIN', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TRANSPORT_MANAGER', 'TEACHER'] },
  { label: 'Teaching support', icon: GraduationCap, prompt: 'Help me plan instruction, follow-ups, and classroom actions for today.', roles: ['TEACHER'] },
  { label: 'Learner help', icon: Library, prompt: 'Help me understand my school tasks, timetable, and next academic steps.', roles: ['STUDENT'] },
  { label: 'Parent guidance', icon: Building2, prompt: 'Summarize the most important updates I should know as a parent.', roles: ['PARENT'] },
  { label: 'Transport status', icon: Compass, prompt: 'What transport actions or updates should I focus on right now?', roles: ['TRANSPORT_MANAGER', 'DRIVER', 'CONDUCTOR', 'PARENT', 'STUDENT', 'TEACHER'] },
  { label: 'Action confirmation', icon: Compass, prompt: 'Show me tasks that may require confirmation before they are applied.', roles: ['PLATFORM_ADMIN', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'MANAGER', 'TRANSPORT_MANAGER'] },
];

const PUBLIC_STARTER_CARDS = [
  {
    title: 'Leadership briefing',
    body: 'See how Aura explains cross-module workflows in a board-friendly, high-signal format.',
    icon: Building2,
  },
  {
    title: 'Operational walkthrough',
    body: 'Move from admissions to attendance, finance, and parent communication without losing context.',
    icon: Library,
  },
];

const AUTHENTICATED_STARTER_CARDS = [
  {
    title: 'Workspace continuity',
    body: 'Move between workspaces and preserved threads without losing operational context.',
    icon: History,
  },
  {
    title: 'Decision support',
    body: 'Use the same assistant surface for audits, policy questions, and structured school analysis.',
    icon: Building2,
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

  return 'AURA synthesized a response.';
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
    timeline: payload?.thought ? [payload.thought] : message.thought ? [message.thought] : [],
    timestamp: message.timestamp,
  };
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function loadPublicHistory(): PublicHistoryEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(PUBLIC_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.conversationId === 'string' && Array.isArray(item.messages));
  } catch {
    return [];
  }
}

function savePublicHistory(entries: PublicHistoryEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PUBLIC_HISTORY_STORAGE_KEY, JSON.stringify(entries.slice(0, 12)));
  } catch {
    // Ignore storage failures and keep the assistant usable.
  }
}

function buildPublicConversationTitle(messages: ChatMessage[], fallbackText?: string) {
  const firstUserMessage = messages.find((message) => message.role === 'user')?.text || fallbackText || 'New school ERP chat';
  return firstUserMessage.length > 68 ? `${firstUserMessage.slice(0, 65)}...` : firstUserMessage;
}

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function AiAssistantChat({ variant = 'drawer', accessMode = 'authenticated' }: Props) {
  const { session } = useStore();
  const navigate = useNavigate();
  const isPublic = accessMode === 'public';
  const assistantRoute = variant === 'page' ? (isPublic ? '/assistant' : '/ai-assistant') : '/assistant-drawer';

  const [open, setOpen] = useState(variant === 'page');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return variant === 'page';
    if (variant === 'page') return window.innerWidth >= 1024;
    if (accessMode === 'public') return false;
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
  const [publicChats, setPublicChats] = useState<PublicHistoryEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  const examplePrompts = isPublic ? PUBLIC_EXAMPLE_PROMPTS : AUTHENTICATED_EXAMPLE_PROMPTS;
  const capabilityActions = useMemo(() => {
    if (isPublic) return PUBLIC_CAPABILITY_ACTIONS;
    const role = session.role || '';
    const filtered = AUTHENTICATED_CAPABILITY_ACTIONS.filter((item) => !item.roles || item.roles.includes(role));
    return filtered.length ? filtered : AUTHENTICATED_CAPABILITY_ACTIONS.filter((item) => item.label === 'Structured outputs');
  }, [isPublic, session.role]);
  const starterCards = isPublic ? PUBLIC_STARTER_CARDS : AUTHENTICATED_STARTER_CARDS;

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.workspaceId === activeWorkspaceId) ?? null,
    [activeWorkspaceId, workspaces],
  );

  const showEmptyState = messages.length === 0;

  const sortChats = useCallback((items: AiChatSummaryResponse[]) => {
    return [...items].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  }, []);

  const persistPublicConversation = useCallback((conversationId: string, nextMessages: ChatMessage[], fallbackTitle?: string) => {
    const nextEntry: PublicHistoryEntry = {
      conversationId,
      title: buildPublicConversationTitle(nextMessages, fallbackTitle),
      updatedAt: new Date().toISOString(),
      messages: nextMessages.filter((message) => !message.streaming),
    };

    setPublicChats((current) => {
      const next = [nextEntry, ...current.filter((item) => item.conversationId !== conversationId)]
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
      savePublicHistory(next);
      return next;
    });
  }, []);

  const deletePublicConversation = useCallback((conversationId: string) => {
    setPublicChats((current) => {
      const next = current.filter((item) => item.conversationId !== conversationId);
      savePublicHistory(next);
      return next;
    });

    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
      setStatusText('Fresh draft started');
    }
  }, [activeConversationId]);

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
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Assistant workspace is unavailable right now.');
      setWorkspaces([]);
      setChats([]);
      setMessages([]);
      setActiveConversationId(null);
      setActiveWorkspaceId(null);
    } finally {
      setBootstrapping(false);
    }
  }, []);

  const ensureActiveWorkspace = useCallback(async () => {
    if (activeWorkspaceId) {
      return activeWorkspaceId;
    }

    const nextWorkspaces = await aiInteractionApi.listWorkspaces();
    setWorkspaces(nextWorkspaces);
    const nextWorkspaceId = nextWorkspaces[0]?.workspaceId ?? null;
    setActiveWorkspaceId(nextWorkspaceId);
    return nextWorkspaceId;
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (variant === 'page') {
      setOpen(true);
    }
  }, [variant]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!open) return;

    if (isPublic) {
      const storedHistory = loadPublicHistory();
      setPublicChats(storedHistory);
      return;
    }

    void loadWorkspaces();
  }, [isPublic, loadWorkspaces, open]);

  useEffect(() => {
    if (!open || !activeWorkspaceId || isPublic) return;
    void loadChats(activeWorkspaceId, activeConversationId);
  }, [activeConversationId, activeWorkspaceId, isPublic, loadChats, open]);

  useEffect(() => {
    if (!open || !activeConversationId || isPublic) return;

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
  }, [activeConversationId, isPublic, open]);

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
      setStatusText(error instanceof Error ? error.message : 'The action could not be confirmed.');
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

  const handleCloseAssistant = useCallback(() => {
    stopVoiceCapture();
    if (variant === 'page') {
      if (isPublic) {
        navigate('/');
        return;
      }
      if (window.history.length > 1) {
        navigate(-1);
        return;
      }
      navigate('/dashboard');
      return;
    }
    setOpen(false);
  }, [isPublic, navigate, stopVoiceCapture, variant]);

  const handleSend = useCallback(async (override?: string) => {
    const messageText = (override ?? input).trim();
    if (!messageText || loading) return;

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
        timeline: ['Receiving your request'],
        streaming: true,
      },
    ]);

    let conversationId = activeConversationId;
    const chatRequestBody = (workspaceId: string | null, currentConversationId: string | null) => ({
      workspaceId,
      conversationId: currentConversationId,
      message: messageText,
      context: {
        route: assistantRoute,
      },
    });

    const commitFinalResponse = (nextConversationId: string, response: RenderedResponse) => {
      conversationId = nextConversationId;
      setStatusText('Response ready');
      setActiveConversationId(nextConversationId);
      setMessages((current) => {
        const nextMessages = current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                text: buildAssistantSummary(response),
                response,
                thought: response.thought ?? message.thought ?? null,
                streaming: false,
              }
            : message,
        );

        if (isPublic) {
          persistPublicConversation(nextConversationId, nextMessages, messageText);
        }

        return nextMessages;
      });
    };

    try {
      const workspaceId = isPublic ? null : await ensureActiveWorkspace();
      if (!workspaceId && !isPublic) {
        throw new Error('AURA could not prepare a workspace for this chat.');
      }

      if (!conversationId && workspaceId) {
        const chat = await aiInteractionApi.createChat(workspaceId, messageText.slice(0, 64));
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
        body: JSON.stringify(chatRequestBody(workspaceId, conversationId)),
      });

      if (!response.ok || !response.body) {
        const fallback = await aiInteractionApi.chat(workspaceId, conversationId, messageText, {
          route: assistantRoute,
        });
        commitFinalResponse(fallback.conversationId, fallback.response as RenderedResponse);
      } else {
        await readSseStream(response.body, {
          onEvent: ({ event, data }) => {
            if (event === 'thought') {
              const parsed = tryParseJson<{ text?: string }>(data);
              if (parsed.ok && parsed.value.text) {
                setStatusText(parsed.value.text);
                setMessages((current) =>
                  current.map((message) =>
                    message.id === assistantId
                      ? {
                          ...message,
                          thought: parsed.value.text ?? null,
                          timeline: parsed.value.text && !message.timeline?.includes(parsed.value.text)
                            ? [...(message.timeline || []), parsed.value.text]
                            : (message.timeline || []),
                        }
                      : message,
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
              commitFinalResponse(parsed.value.conversationId, parsed.value.response);
            }
          },
        });
      }

      if (workspaceId && conversationId && !isPublic) {
        await loadChats(workspaceId, conversationId);
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
  }, [activeConversationId, assistantRoute, ensureActiveWorkspace, input, isPublic, loadChats, loading, persistPublicConversation, session.token, sortChats]);

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

  const shellTitle = 'Aura Workspace';

  const shellSubtitle = isPublic
    ? 'Explore school operations, rollout fit, and product answers in a focused conversation workspace.'
    : variant === 'page'
      ? 'Manage workspaces, revisit chats, and work in a focused assistant workspace with the same calm interaction model.'
      : 'Fast insight and operational reasoning without leaving the page.';

  const renderPublicSidebar = () => (
    <div className="aura-rail__section">
      <div className="aura-rail__block">
        <div className="aura-rail__eyebrow">Aura History</div>
        <div className="aura-rail__title">Recent school conversations</div>
        <button
          type="button"
          onClick={handleCreateDraftChat}
          className="aura-rail__primary-button"
        >
          <Plus size={16} />
          New chat
        </button>
      </div>

      <div className="aura-note">
        <div className="aura-note__eyebrow">Evaluation mode</div>
        <p className="aura-note__copy">
          Explore product fit, rollout logic, and school ERP use cases in a focused workspace.
        </p>
      </div>

      <div className="aura-rail__block">
        <div className="aura-rail__eyebrow">Capabilities</div>
        <div className="aura-pill-grid">
          {capabilityActions.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => void handleSend(item.prompt)}
                className="aura-capability-pill aura-capability-pill--action"
              >
                <Icon size={13} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="aura-rail__list">
        {publicChats.length ? (
          publicChats.map((chat) => (
            <div
              key={chat.conversationId}
              className={cx('aura-history-card', chat.conversationId === activeConversationId && 'is-active')}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveConversationId(chat.conversationId);
                  setMessages(chat.messages);
                  if (variant !== 'page') setSidebarOpen(false);
                }}
                className="aura-history-card__main"
              >
                <div className="aura-history-card__title">{chat.title}</div>
                <div className="aura-history-card__meta">{new Date(chat.updatedAt).toLocaleDateString()}</div>
              </button>
              <button
                type="button"
                onClick={() => deletePublicConversation(chat.conversationId)}
                className="aura-history-card__delete"
                aria-label={`Delete ${chat.title}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        ) : (
          <div className="aura-empty-rail-state">
            <div className="aura-empty-rail-state__title">No public chats yet</div>
            <p className="aura-empty-rail-state__copy">
              Your public Aura chats will appear here so you can revisit product questions during evaluation.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAuthenticatedSidebar = () => (
    <div className="aura-rail__section">
      <div className="aura-rail__block">
        <div className="aura-rail__eyebrow">{bootstrapping ? 'Loading' : 'Workspace Hub'}</div>
        <div className="aura-rail__title">{activeWorkspace?.name || 'Loading workspace'}</div>
      </div>

      <div className="aura-rail__block">
        {workspaceComposerOpen ? (
          <div className="aura-inline-form">
            <input
              value={workspaceDraft}
              onChange={(event) => setWorkspaceDraft(event.target.value)}
              placeholder="New workspace name"
              className="aura-input"
            />
            <div className="aura-inline-form__actions">
              <button
                type="button"
                onClick={() => void handleCreateWorkspace()}
                className="aura-inline-form__confirm"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setWorkspaceComposerOpen(false);
                  setWorkspaceDraft('');
                }}
                className="aura-inline-form__cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setWorkspaceComposerOpen(true)}
            className="aura-rail__secondary-button"
          >
            <FolderPlus size={16} />
            New Workspace
          </button>
        )}
      </div>

      <div className="aura-rail__block">
        <div className="aura-rail__eyebrow">Workspaces</div>
        <div className="aura-workspace-list">
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
              className={cx('aura-workspace-card-wrap', draggingConversationId && 'is-droppable')}
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
                className={cx('aura-workspace-card', workspace.workspaceId === activeWorkspaceId && 'is-active')}
              >
                <div className="aura-workspace-card__copy">
                  <div className="aura-workspace-card__title">{workspace.name}</div>
                  <div className="aura-workspace-card__meta">{new Date(workspace.updatedAt).toLocaleDateString()}</div>
                </div>
                <div className="aura-workspace-card__actions">
                  {workspaces.length > 1 ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleDeleteWorkspace(workspace.workspaceId);
                      }}
                      className="aura-history-card__delete"
                      aria-label={`Delete workspace ${workspace.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="aura-rail__block aura-rail__block--grow">
        <div className="aura-rail__row">
          <div className="aura-rail__eyebrow">Chat History</div>
          <button
            type="button"
            onClick={handleCreateDraftChat}
            className="aura-rail__quiet-button"
          >
            <Plus size={14} />
            New chat
          </button>
        </div>

        <div className="aura-rail__list">
          {historyLoading ? (
            <div className="aura-empty-rail-state">Loading conversations...</div>
          ) : chats.length ? (
            chats.map((chat) => (
              <div
                key={chat.conversationId}
                draggable
                onDragStart={() => setDraggingConversationId(chat.conversationId)}
                onDragEnd={() => setDraggingConversationId(null)}
                className={cx('aura-history-card', chat.conversationId === activeConversationId && 'is-active')}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveConversationId(chat.conversationId);
                    if (variant !== 'page') setSidebarOpen(false);
                  }}
                  className="aura-history-card__main"
                >
                  <div className="aura-history-card__title">{chat.title || 'Untitled chat'}</div>
                  <div className="aura-history-card__meta">{new Date(chat.updatedAt).toLocaleDateString()}</div>
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteChat(chat.conversationId)}
                  className="aura-history-card__delete"
                  aria-label={`Delete ${chat.title}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          ) : (
            <div className="aura-empty-rail-state">
              No chats in this workspace yet. Start a draft to create one automatically.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const shellBody = (
    <div className={cx('aura-shell', sidebarOpen && 'aura-shell--rail-open', showEmptyState && 'aura-shell--empty')}>
      <AnimatePresence>
        {sidebarOpen ? (
          <motion.aside
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            className={cx('aura-rail', variant !== 'page' && 'aura-rail--drawer')}
          >
            <div className="aura-rail__header">
              <div>
                <div className="aura-rail__brand">AURA</div>
                <div className="aura-rail__brand-sub">{isPublic ? 'Evaluation workspace' : 'Operational workspace'}</div>
              </div>
              {variant !== 'page' ? (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="aura-icon-button"
                  aria-label="Close sidebar"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
            {isPublic ? renderPublicSidebar() : renderAuthenticatedSidebar()}
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <section className="aura-main">
        <div className={cx('aura-main__header', !showEmptyState && 'aura-main__header--compact')}>
          <div className="aura-main__header-copy">
            <div className="aura-main__eyebrow">
              <Sparkles size={12} />
              {isPublic ? 'Neural Assistant' : 'Workspace Assistant'}
            </div>
            <h2 className="aura-main__title">{shellTitle}</h2>
            <p className="aura-main__subtitle">{shellSubtitle}</p>
          </div>

          <div className="aura-main__controls">
            <button
              type="button"
              onClick={() => setSidebarOpen((current) => !current)}
              className="aura-icon-button"
              aria-label="Toggle sidebar"
            >
              <PanelLeft size={18} />
            </button>
            {variant === 'drawer' || variant === 'page' ? (
              <button
                type="button"
                onClick={handleCloseAssistant}
                className="aura-icon-button"
                aria-label="Close assistant"
              >
                <X size={18} />
              </button>
            ) : null}
          </div>
        </div>

        <div ref={scrollRef} className="aura-thread">
          {showEmptyState ? (
            <div className="aura-empty-state">
              <div className="aura-empty-state__hero">
                <div className="aura-empty-state__badge">
                  <Brain size={15} />
                  {isPublic ? 'Start with an evaluation question' : 'Start with an operational question'}
                </div>
                <h3 className="aura-empty-state__title">
                  {isPublic ? 'A calmer school ERP assistant for product evaluation.' : 'A quieter workspace for operational reasoning.'}
                </h3>
                <p className="aura-empty-state__subtitle">
                  {isPublic
                    ? 'Ask how admissions, attendance, finance, parent communication, and rollout come together. Aura responds with structured answers, streaming replies, and leadership-ready summaries.'
                    : 'Ask for school insights, workflow summaries, policy help, and structured analysis without losing the workspace context.'}
                </p>
              </div>

              <div className="aura-empty-state__meta">
                <div className="aura-capabilities">
                  {capabilityActions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => void handleSend(item.prompt)}
                        className="aura-capability-card aura-capability-card--action"
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                {isPublic ? (
                  <div className="aura-tool-row">
                    {ERP_TOOL_LABELS.map((tool) => (
                      <span key={tool} className="aura-tool-pill">{tool}</span>
                    ))}
                  </div>
                ) : (
                  <div className="aura-tool-row">
                    <span className="aura-tool-pill">Workspace history</span>
                    <span className="aura-tool-pill">Saved chats</span>
                    <span className="aura-tool-pill">Structured replies</span>
                    <span className="aura-tool-pill">Confirmation flows</span>
                  </div>
                )}
              </div>

              <div className="aura-prompt-grid">
                {examplePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void handleSend(prompt)}
                    className="aura-prompt-card"
                  >
                    <span className="aura-prompt-card__label">Try asking</span>
                    <span className="aura-prompt-card__text">{prompt}</span>
                  </button>
                ))}
              </div>

              <div className="aura-starter-grid">
                {starterCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="aura-starter-card">
                      <div className="aura-starter-card__icon">
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="aura-starter-card__title">{card.title}</div>
                        <p className="aura-starter-card__body">{card.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="aura-thread__messages">
              {messages.map((message) => (
                <div key={message.id} className={cx('aura-message', message.role === 'user' ? 'aura-message--user' : 'aura-message--assistant')}>
                  {message.role === 'assistant' ? (
                    <div className={cx('aura-response-block', message.error && 'is-error')}>
                      <div className="aura-response-block__header">
                        <div className="aura-response-block__avatar">
                          <Bot size={16} />
                        </div>
                        <div>
                          <div className="aura-response-block__title">AURA</div>
                          <div className="aura-response-block__meta">{formatTimestamp(message.timestamp)}</div>
                        </div>
                      </div>

                      {message.thought ? (
                        <details className="aura-thought">
                          <summary>Reasoning trace</summary>
                          <div className="aura-thought__body">{message.thought}</div>
                        </details>
                      ) : null}

                      {message.timeline && message.timeline.length > 1 ? (
                        <div className="aura-response-timeline">
                          {message.timeline.map((event, index) => (
                            <div key={`${message.id}-timeline-${index}`} className="aura-response-timeline__item">
                              <div className="aura-response-timeline__dot" />
                              <div className="aura-response-timeline__text">{event}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {message.response ? (
                        <AssistantResponseView
                          response={message.response}
                          onConfirmAction={(token) => handleConfirmAction(token)}
                          actionPending={actionPendingToken === message.response?.meta?.confirmationToken}
                        />
                      ) : (
                        <div className="aura-response-block__plain">{message.text || (message.streaming ? statusText : '')}</div>
                      )}
                    </div>
                  ) : (
                    <div className="aura-user-bubble">
                      <div className="aura-user-bubble__label">You</div>
                      <div>{message.text}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="aura-composer">
          <div className="aura-composer__status">
            <div className="aura-composer__status-line">
              <Sparkles size={14} />
              <span>{loading ? statusText : isPublic ? 'Public assistant connected' : 'Tool-aware assistant connected'}</span>
            </div>
            <div className="aura-composer__status-line">
              {isPublic ? <GraduationCap size={13} /> : <History size={13} />}
              <span>{isPublic ? 'School ERP prompts ready' : activeConversationId ? 'History saved' : 'Draft mode'}</span>
            </div>
          </div>

          {voiceError ? (
            <div className="aura-composer__error">{voiceError}</div>
          ) : null}

          <div className="aura-composer__dock">
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
              placeholder={isPublic ? 'Ask Aura about school operations, rollout, AI workflows, pricing, or platform fit...' : 'Ask for insights, explain a concept, or request an operational answer...'}
              className="aura-composer__input"
            />
            <div className="aura-composer__actions">
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
                className={cx('aura-composer__icon', voiceListening && 'is-active')}
                aria-label={voiceListening ? 'Stop voice input' : 'Start voice input'}
              >
                {voiceListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={loading || !input.trim()}
                className="aura-composer__send"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          <div className="aura-composer__meta">{input.length}/2000</div>
        </div>
      </section>
    </div>
  );

  if (variant === 'page') {
    return (
      <div className="aura-page">
        <div className="aura-page__frame">
          {shellBody}
        </div>
      </div>
    );
  }

  return (
    <>
      {!open ? (
        <motion.button
          type="button"
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(true)}
          className="aura-launcher"
          style={{ 
            width: 'auto', 
            padding: '0 24px', 
            gap: '12px',
            borderRadius: '24px'
          }}
        >
          <div className="aura-launcher__icon-wrapper" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '12px'
          }}>
            <Bot size={20} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.02em' }}>Ask Aura</span>
          <Sparkles size={16} style={{ opacity: 0.8 }} />
        </motion.button>
      ) : null}

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            className={cx('aura-drawer', isPublic && 'aura-drawer--public')}
            style={{ maxWidth: isPublic ? 'min(calc(100vw - 1rem), 88rem)' : DRAWER_WIDTH }}
          >
            <div className="aura-drawer__frame">
              {shellBody}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default AiAssistantChat;
