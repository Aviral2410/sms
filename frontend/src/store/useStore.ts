import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { schoolOpsApi } from '../lib/api';

export type VibeMode = 'minimal' | 'data-heavy' | 'visual';
export type ThemeMode = 'dark' | 'light' | 'system';
export type VoiceLanguage = 'en-US' | 'hi-IN' | 'hinglish';

interface AuthSession {
  userId: string | null;
  role: string | null;
  email: string | null;
  fullName: string | null;
  schoolId: string | null;
  tenantId: string | null;
  isPremium?: boolean;
  token?: string | null;
}


interface AppState {
  // UI State
  vibe: VibeMode;
  theme: ThemeMode;
  sidebarOpen: boolean;
  copilotOpen: boolean;
  voiceLanguage: VoiceLanguage;
  searchOpen: boolean;
  paletteAiMode: boolean;
  accentColor: string;
  glassIntensity: number;
  borderRadius: string;
  activeTheme: string;
  dashboardWidgets: string[];
  customWidgets: { id: string; query: string; title: string }[];
  
  setVibe: (vibe: VibeMode) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleSidebar: () => void;
  toggleCopilot: () => void;
  setVoiceLanguage: (voiceLanguage: VoiceLanguage) => void;
  setSearchOpen: (open: boolean) => void;
  setPaletteAiMode: (enabled: boolean) => void;
  setAccentColor: (color: string) => void;
  setGlassIntensity: (intensity: number) => void;
  setBorderRadius: (radius: string) => void;
  setActiveTheme: (theme: string) => void;
  setDashboardWidgets: (widgets: string[]) => void;
  addCustomWidget: (query: string, title: string) => void;
  removeCustomWidget: (id: string) => void;

  // Session State
  session: AuthSession;
  setSession: (session: AuthSession) => void;
  updateSession: (sessionPatch: Partial<AuthSession>) => void;
  logout: () => void;
}

function attachUseStoreToWindow() {
  (window as Window & { useStore?: typeof useStore }).useStore = useStore;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Default UI
      vibe: 'visual',
      theme: 'dark',
      sidebarOpen: true,
      copilotOpen: false,
      voiceLanguage: 'hinglish',
      searchOpen: false,
      paletteAiMode: false,
      accentColor: '#6366f1', // Default Indigo
      glassIntensity: 0.4,
      borderRadius: '24px',
      activeTheme: 'indigo-flow',
      dashboardWidgets: ['stats', 'onboarding'],
      customWidgets: [],
      
      setVibe: (vibe) => {
        set({ vibe });
        const email = useStore.getState().session.email;
        if (email) schoolOpsApi.updateUserPreferences(email, { vibe }).catch(console.error);
      },
      setTheme: (theme) => {
        set({ theme });
        const email = useStore.getState().session.email;
        if (email) schoolOpsApi.updateUserPreferences(email, { theme }).catch(console.error);
      },
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleCopilot: () => set((state) => ({ copilotOpen: !state.copilotOpen })),
      setVoiceLanguage: (voiceLanguage) => set({ voiceLanguage }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
      setPaletteAiMode: (paletteAiMode) => set({ paletteAiMode }),
      setAccentColor: (accentColor) => {
        set({ accentColor });
        const email = useStore.getState().session.email;
        if (email) schoolOpsApi.updateUserPreferences(email, { accentColor }).catch(console.error);
      },
      setGlassIntensity: (glassIntensity) => {
        set({ glassIntensity });
        const email = useStore.getState().session.email;
        if (email) schoolOpsApi.updateUserPreferences(email, { glassIntensity }).catch(console.error);
      },
      setBorderRadius: (borderRadius) => {
        set({ borderRadius });
        const email = useStore.getState().session.email;
        if (email) schoolOpsApi.updateUserPreferences(email, { borderRadius }).catch(console.error);
      },
      setActiveTheme: (activeTheme) => {
        set({ activeTheme });
        const email = useStore.getState().session.email;
        if (email) schoolOpsApi.updateUserPreferences(email, { activeTheme }).catch(console.error);
      },
      setDashboardWidgets: (dashboardWidgets) => set({ dashboardWidgets }),
      addCustomWidget: (query, title) => set((state) => ({ 
        customWidgets: [...state.customWidgets, { id: Math.random().toString(36).substring(7), query, title }] 
      })),
      removeCustomWidget: (id) => set((state) => ({ 
        customWidgets: state.customWidgets.filter(w => w.id !== id) 
      })),

      // Default Session
      session: {
        userId: null,
        role: null,
        email: null,
        fullName: null,
        schoolId: null,
        tenantId: null,
        isPremium: false,
      },
      
      setSession: (session: any) => {
        const storageKey = session.role === 'PLATFORM_ADMIN' || session.role === 'SUPER_ADMIN'
          ? 'sms-admin-session'
          : 'sms-school-session';
        const activityKey = `${storageKey}-last-activity`;

        attachUseStoreToWindow();
        window.localStorage.setItem(storageKey, JSON.stringify(session));
        window.localStorage.setItem(activityKey, new Date().toISOString());
        
        // Initialize UI from session/backend preferences
        const updates: Partial<AppState> = { session };
        if (session.theme) updates.theme = session.theme;
        if (session.activeTheme) updates.activeTheme = session.activeTheme;
        if (session.vibe) updates.vibe = session.vibe;
        if (session.accentColor) updates.accentColor = session.accentColor;
        if (session.glassIntensity) updates.glassIntensity = session.glassIntensity;
        if (session.borderRadius) updates.borderRadius = session.borderRadius;
        
        set(updates);
        useStore.setState((state) => ({ ...state, ...updates }));
      },
      updateSession: (sessionPatch) => set((state) => ({
        session: {
          ...state.session,
          ...sessionPatch,
        },
      })),
      logout: () => {
        attachUseStoreToWindow();
        // Clear session and return to default
        set({ 
          session: { userId: null, role: null, email: null, fullName: null, schoolId: null, tenantId: null, isPremium: false, token: null },
          // Reset other UI preferences to defaults to avoid cross-user state leakage
          vibe: 'visual',
          theme: 'dark',
          activeTheme: 'indigo-flow',
          accentColor: '#6366f1',
          glassIntensity: 0.4,
          borderRadius: '24px'
        });
        
        // Explicitly clear all potential session keys
        const keysToRemove = [
          'sms-school-session',
          'sms-school-session-last-activity',
          'sms-admin-session',
          'sms-admin-session-last-activity',
          'sms-saas-v2-state' // This is the main persist key
        ];
        keysToRemove.forEach(key => window.localStorage.removeItem(key));
        
        // Force a page reload to ensure all memory state is cleared and routes re-evaluate
        window.location.href = '/login';
      },
    }),
    {
      name: 'sms-saas-v2-state',
      partialize: (state) => Object.fromEntries(
        Object.entries(state)
      ),
    }
  )
);

attachUseStoreToWindow();
