import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Bot, MessageCircle, Plus, Send, Sparkles, Trash2, 
  X, ChevronLeft, ChevronRight, Cpu, Settings, Search,
  History, Clock, Lightbulb, Shield, HelpCircle, UserCircle2,
  LayoutGrid, FolderPlus, Layers
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useAiStore } from '../store/useAiStore';
import { readSseStream, tryParseJson } from '../lib/sse';
import { toast } from 'sonner';

// --- Components ---

import { SmartUiRenderer } from '../components/ai/SmartUiRenderer';

const ChatBubble: React.FC<{ message: any; onAction?: (token: string) => void }> = ({ message, onAction }) => {
  const isBot = message.role === 'assistant';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-6`}
    >
      <div className={`rounded-2xl p-5 ${
        isBot 
          ? 'bg-[#0a1829] border border-white/10 text-emerald-50 shadow-2xl w-full' 
          : 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-50 shadow-lg max-w-[85%]'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          {isBot ? (
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 shadow-inner">
              <Cpu size={14} className="text-emerald-400" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center">
              <UserCircle2 size={14} className="text-black" />
            </div>
          )}
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
            {isBot ? 'Elevate Neural Layer' : 'Administrative User'}
          </span>
        </div>
        
        {/* If it's a legacy or simple text message */}
        {!message.response && (
            <div className="text-[14px] leading-relaxed whitespace-pre-wrap font-medium text-emerald-50/90">
                {message.content}
            </div>
        )}

        {/* Smart UI Rendering for structured responses */}
        {message.response && (
           <SmartUiRenderer response={message.response.data} />
        )}
      </div>
    </motion.div>
  );
};

export const AiAssistantPage: React.FC = () => {
  const { session } = useStore();
  const { 
    ensureGuestId, sidebarWidth, setSidebarWidth, 
    sidebarCollapsed, setSidebarCollapsed, showSuggestions, toggleSuggestions 
  } = useAiStore();

  useEffect(() => {
    // Ensure sidebar is open for new or anonymous users to improve discoverability
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
    }
  }, []); // Only on mount
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  // Initialize guest session
  useEffect(() => {
    ensureGuestId();
  }, [ensureGuestId]);

  const fetchWorkspaces = useCallback(async () => {
    const gid = ensureGuestId();
    const headers: any = { 'X-Guest-ID': gid };
    if (session.token) headers.Authorization = `Bearer ${session.token}`;
    
    try {
      const res = await fetch('/api/v1/ai-interaction/workspaces', { headers });
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data);
        if (data && data.length > 0) {
          setActiveWorkspaceId(data[0].workspaceId);
        }
      }
    } catch (e) {
      console.error('Workspaces fetch failed', e);
    }
  }, [session.token, ensureGuestId, activeWorkspaceId]);

  const fetchHistory = useCallback(async () => {
    const gid = ensureGuestId();
    const headers: any = { 'X-Guest-ID': gid };
    if (session.token) headers.Authorization = `Bearer ${session.token}`;
    
    try {
      const chatsRes = await fetch(`/api/v1/ai-interaction/workspaces/${activeWorkspaceId}/chats`, { headers });
      if (chatsRes.ok) {
        setHistory(await chatsRes.json());
      }
    } catch (e) {
      console.error('History fetch failed', e);
    }
  }, [session.token, ensureGuestId, activeWorkspaceId]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const createWorkspace = async () => {
    const gid = ensureGuestId();
    const headers: any = { 
        'X-Guest-ID': gid,
        'Content-Type': 'application/json'
    };
    if (session.token) headers.Authorization = `Bearer ${session.token}`;

    try {
        const res = await fetch('/api/v1/ai-interaction/workspaces', {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: newWorkspaceName })
        });
        if (res.ok) {
            const workspace = await res.json();
            setWorkspaces(prev => [...prev, workspace]);
            setActiveWorkspaceId(workspace.workspaceId);
            setShowWorkspaceModal(false);
            setNewWorkspaceName('');
            toast.success('Workspace created');
            setHistory([]);
            setMessages([]);
        }
    } catch (e) {
        toast.error('Failed to create workspace');
    }
  };

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const gid = ensureGuestId();
    if (gid) {
      fetchWorkspaces();
      fetchHistory();
    }
  }, [ensureGuestId, fetchWorkspaces, fetchHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async (overrideText?: string) => {
    const messageToSend = (overrideText || input).trim();
    
    setInput('');
    const userMsg = { id: Date.now().toString(), role: 'user', content: messageToSend };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', streaming: true }]);

    try {
      const gid = ensureGuestId();
      const headers: any = { 
        'Content-Type': 'application/json',
        'X-Guest-ID': gid 
      };
      if (session.token) headers.Authorization = `Bearer ${session.token}`;

      const response = await fetch('/api/v1/ai-interaction/chat/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          message: messageToSend, 
          workspaceId: activeWorkspaceId,
          conversationId: activeConversationId,
          context: { route: '/ai-assistant' } 
        }),
      });


      let streamText = '';
      if (!response.body) {
        throw new Error('ReadableStream not supported or empty response body');
      }
      await readSseStream(response.body, {
        onEvent: ({ event, data }) => {
          if (event === 'delta' || event === 'token' || event === 'status') {
            const parsed = tryParseJson<any>(data);
            const chunk = parsed.ok ? (parsed.value.text || '') : data;
            streamText += chunk;
            
            // Heuristic to detect structured response during streaming
            let detectedResponse = null;
            if (streamText.trim().startsWith('{')) {
                const fullParsed = tryParseJson<any>(streamText);
                if (fullParsed.ok && fullParsed.value.type === 'smart_ui') {
                    detectedResponse = fullParsed.value;
                }
            }

            setMessages(prev => prev.map(m => m.id === assistantId ? { 
                ...m, 
                content: streamText,
                response: detectedResponse || m.response
            } : m));
          }
          if (event === 'final') {
            const parsed = tryParseJson<any>(data);
            if (parsed.ok) {
              setActiveConversationId(parsed.value.conversationId);
              if (parsed.value.response) {
                setMessages(prev => prev.map(m => m.id === assistantId ? { 
                  ...m, 
                  content: parsed.value.response.data?.text || streamText,
                  response: parsed.value.response,
                  streaming: false 
                } : m));
              }
              fetchHistory();
            }
          }
        }
      });
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: 'Error: ' + err, streaming: false } : m));
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const newWidth = Math.max(240, Math.min(600, e.clientX));
    setSidebarWidth(newWidth);
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const loadConversation = async (conversationId: string) => {
    const gid = ensureGuestId();
    const headers: any = { 'X-Guest-ID': gid };
    if (session.token) headers.Authorization = `Bearer ${session.token}`;
    
    try {
      const res = await fetch(`/api/v1/ai-interaction/chats/${conversationId}/messages`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.map((m: any) => ({
          id: m.messageId,
          role: m.role,
          content: m.content,
          response: m.payload
        })));
        setActiveConversationId(conversationId);
      }
    } catch (e) {
      console.error('Failed to load conversation', e);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setActiveConversationId(null);
  };

  // Force guest session on mount
  useEffect(() => {
    const gid = ensureGuestId();
    if (gid && workspaces.length === 0) {
        fetchWorkspaces();
    }
  }, [ensureGuestId, workspaces.length, fetchWorkspaces]);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#020c1b] text-emerald-50 flex overflow-hidden font-sans z-[9999]">
      <AnimatePresence>
        {showWorkspaceModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-[#0a1829] border border-white/10 p-8 rounded-[2rem] max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-2">Create Workspace</h3>
              <p className="text-sm text-white/40 mb-6 font-medium">Coordinate, organize, and separate your intelligence sessions.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/60 mb-2 block">Workspace Name</label>
                  <input 
                    type="text" 
                    value={newWorkspaceName}
                    onChange={e => setNewWorkspaceName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 transition-colors"
                    placeholder="e.g., Marketing Strategy"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                    <button 
                        onClick={() => setShowWorkspaceModal(false)}
                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 font-bold text-sm hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={createWorkspace}
                        className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-colors"
                    >
                        Create
                    </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div 
        initial={false}
        animate={{ width: sidebarCollapsed ? 0 : (sidebarWidth || 280) }}
        className="relative bg-black/40 border-r border-emerald-500/10 flex flex-col overflow-hidden"
      >
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
              <Bot size={20} className="text-emerald-400" />
            </div>
            <span className="font-bold tracking-tight text-lg text-emerald-50">Assistant</span>
          </div>
          <button 
            onClick={startNewChat}
            className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition-all border border-transparent hover:border-emerald-500/20"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Workspace Selector */}
        <div className="p-3 border-b border-white/5 bg-white/5">
            <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/50">Workspace</span>
                <button onClick={() => setShowWorkspaceModal(true)} className="p-1 hover:bg-white/10 rounded transition-colors text-emerald-500/60"><FolderPlus size={14} /></button>
            </div>
            <select 
                value={activeWorkspaceId || ''}
                onChange={e => setActiveWorkspaceId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs font-bold outline-none text-emerald-50/80 appearance-none cursor-pointer"
            >
                {workspaces.map(w => (
                    <option key={w.workspaceId} value={w.workspaceId}>{w.name}</option>
                ))}
            </select>
        </div>

        <Reorder.Group 
            axis="y" 
            values={history} 
            onReorder={setHistory}
            className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1"
        >
          <div className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-[0.2em] px-3 py-4 flex items-center gap-2">
            <Layers size={10} /> Recent Activity
          </div>
          {history.length === 0 && (
            <div className="px-4 py-8 text-center opacity-30 text-xs italic">
              No recent chats found
            </div>
          )}
          {history.map(item => (
            <Reorder.Item
              value={item}
              key={item.conversationId}
              className="relative"
            >
                <button
                onClick={() => loadConversation(item.conversationId)}
                className={`w-full text-left p-3 rounded-xl transition-all group flex items-start gap-3 cursor-grab active:cursor-grabbing ${
                    activeConversationId === item.conversationId 
                    ? 'bg-emerald-500/10 border border-emerald-500/20' 
                    : 'hover:bg-white/5 border border-white/5'
                }`}
                >
                <MessageCircle size={16} className={`mt-1 flex-shrink-0 ${activeConversationId === item.conversationId ? 'text-emerald-400' : 'opacity-30'}`} />
                <div className="min-w-0 flex-1">
                    <div className={`text-sm font-medium truncate ${activeConversationId === item.conversationId ? 'text-white' : 'text-white/60'}`}>
                    {item.title || 'Untitled Conversation'}
                    </div>
                    <div className="text-[9px] opacity-30 mt-1 flex items-center gap-2 font-bold uppercase tracking-wider">
                    <Clock size={10} />
                    {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                    </div>
                </div>
                </button>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        <div className="p-4 border-t border-white/5 bg-black/30">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <UserCircle2 size={18} className="text-emerald-400/60" />
              </div>
              <div className="text-xs font-semibold text-emerald-50/60">
                {session.fullName || 'Guest Mode'}
              </div>
            </div>
            <button className="p-2 text-emerald-500/40 hover:text-emerald-400 transition-colors"><Settings size={16} /></button>
          </div>
        </div>
      </motion.div>

        <div 
          onMouseDown={handleMouseDown}
          className="w-[2px] cursor-col-resize hover:bg-emerald-500/50 transition-colors z-50 bg-white/5"
        />

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#020c1b]/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-4">
            <button 
              className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors text-emerald-400/70 hover:text-emerald-400"
            >
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <div className="h-4 w-px bg-white/10" />
            <h2 className="text-sm font-bold tracking-tight text-white/80">
              {activeConversationId ? history.find(c => c.conversationId === activeConversationId)?.title || 'Current Session' : 'New Intelligence Session'}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors opacity-60"><Search size={18} /></button>
            <button 
              onClick={toggleSuggestions}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${showSuggestions ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/5 opacity-60'}`}
            >
              <Lightbulb size={18} />
            </button>
            <div className="h-4 w-px bg-white/10 mx-2" />
            <div className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-2.5 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-2 uppercase tracking-[0.1em]">
               <Shield size={10} /> Anonymous Safe
            </div>
          </div>
        </header>

        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pb-40">
          <div className="w-full">
            {messages.length === 0 && (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center">
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="w-24 h-24 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-8 shadow-2xl shadow-emerald-500/5"
                >
                  <Bot size={48} className="text-emerald-400" />
                </motion.div>
                <h1 className="text-4xl font-black tracking-tighter mb-4 text-white">ElevateSmart AI</h1>
                <p className="text-emerald-50/40 text-sm max-w-sm mx-auto leading-relaxed font-medium">
                  Your intelligent partner for school management, 
                  onboarding, and support. Secure, private, and always available.
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              {messages.map(msg => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
            </div>
            
            {loading && messages[messages.length-1]?.role !== 'assistant' && (
              <div className="flex justify-start mb-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                </div>
              </div>
            )}
            <div ref={scrollRef} className="h-4" />
          </div>
        </div>

        {/* Sticky Input Area */}
        <div className="absolute bottom-0 inset-x-0 p-8 pb-10 pointer-events-none">
          <div className="max-w-6xl mx-auto pointer-events-auto">
            {/* Suggestions */}
            <AnimatePresence>
              {showSuggestions && messages.length < 5 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex gap-2 mb-6 flex-wrap justify-center"
                >
                  {[
                    "Join my school with code", "Register a new institution", 
                    "Check platform roadmap", "Raise a support ticket",
                    "Security features", "Pricing details"
                  ].map(suggest => (
                    <button 
                      key={suggest}
                      onClick={() => sendMessage(suggest)}
                      className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all text-emerald-100/60 hover:text-emerald-50 uppercase tracking-wider"
                    >
                      {suggest}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-60 transition duration-1000" />
              <div className="relative bg-[#0a1829]/90 backdrop-blur-3xl border border-white/10 rounded-[2.2rem] p-2.5 flex items-center shadow-2xl">
                <button 
                    onClick={() => setShowWorkspaceModal(true)}
                    className="p-4 hover:bg-emerald-500/10 rounded-full transition-colors text-emerald-500/40 hover:text-emerald-400"
                >
                  <LayoutGrid size={22} />
                </button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask anything or use '/' for tools..."
                  className="flex-1 bg-transparent border-none outline-none text-emerald-50 placeholder-emerald-100/20 px-3 py-4 text-sm font-medium resize-none scrollbar-none h-[56px]"
                />
                <button 
                  onClick={() => sendMessage()}
                  className={`p-4 rounded-[1.8rem] transition-all flex items-center gap-2 group/send ${
                    input.trim().length > 0
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95' 
                      : 'text-emerald-500/20'
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-center gap-8 text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500/30">
              <span className="flex items-center gap-2"><Sparkles size={10} /> Neural Response</span>
              <span className="flex items-center gap-2"><History size={10} /> Guest Sync</span>
              <span className="flex items-center gap-2"><HelpCircle size={10} /> Multi-Turn</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantPage;
