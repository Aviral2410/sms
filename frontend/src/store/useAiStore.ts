import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: string;
  data?: any;
  timestamp: string;
}

export interface ChatThread {
  id: string;
  title: string;
  updatedAt: string;
}

interface AiState {
  guestId: string;
  currentConversationId: string | null;
  history: ChatThread[];
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  showSuggestions: boolean;
  
  setGuestId: (id: string) => void;
  setCurrentConversationId: (id: string | null) => void;
  setHistory: (history: ChatThread[]) => void;
  setSidebarWidth: (width: number) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSuggestions: () => void;
  
  ensureGuestId: () => string;
}

export const useAiStore = create<AiState>()(
  persist(
    (set, get) => ({
      guestId: '',
      currentConversationId: null,
      history: [],
      sidebarWidth: 280,
      sidebarCollapsed: false,
      showSuggestions: true,

      setGuestId: (guestId) => set({ guestId }),
      setCurrentConversationId: (currentConversationId) => set({ currentConversationId }),
      setHistory: (history) => set({ history }),
      setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      ensureGuestId: () => {
        let gid = get().guestId;
          gid = uuidv4();
          set({ guestId: gid });
        }
        return gid;
      },
    }),
    {
      name: 'sms-ai-session',
    }
  )
);
