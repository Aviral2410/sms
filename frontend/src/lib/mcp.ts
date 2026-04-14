import { request, type McpToolCallResponse } from './api';

const BASE = '/mcp-http';
const SESSION_STORAGE_KEYS = [
  'sms-admin-session',
  'sms-school-session',
  'sms-saas-v2-state',
] as const;

function readJsonStorageItem(key: string): unknown {
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function resolveToken(): string | null {
  // try zustand persisted keys that exist across different UI slices
  for (const key of SESSION_STORAGE_KEYS) {
    const parsed = readJsonStorageItem(key);
    if (parsed && typeof parsed === 'object' && 'token' in (parsed as Record<string, unknown>)) {
      const token = (parsed as { token?: string }).token;
      if (token) return token;
    }
    if (
      key === 'sms-saas-v2-state' &&
      parsed &&
      typeof parsed === 'object' &&
      'state' in (parsed as Record<string, unknown>)
    ) {
      const persistedState = (parsed as { state?: { session?: { token?: string } } }).state;
      if (persistedState?.session?.token) return persistedState.session.token;
    }
  }
  return null;
}

export interface McpAiResponse {
  answer: string;
  data?: any;
  mode?: 'interactive' | 'text';
  suggestedQuestions?: string[];
}

/**
 * Calls the MCP server's simple REST API at /insights/ask or /insights/platform-overview.
 * The full JSON-RPC MCP protocol endpoint (/mcp) requires a stateful connection handshake,
 * so we use the dedicated HTTP REST helper endpoints exposed by the server instead.
 */
export const mcpApi = {
  /**
   * Generic tool call - maps named tools to the appropriate REST endpoints.
   */
  callTool: async (name: string, args: any = {}): Promise<McpToolCallResponse> => {
    if (name === 'platform_onboarding_overview') {
      const data = await request<any>(`${BASE}/insights/platform-overview`, { skipDefaultBase: true });
      return { content: [{ type: 'text', text: JSON.stringify(data) }] };
    }

    if (name === 'platform_growth_trend') {
      const data = await request<any>(`${BASE}/insights/growth`, { skipDefaultBase: true });
      return { content: [{ type: 'text', text: JSON.stringify(data) }] };
    }

    if (name === 'ask_school_data') {
      const data = await request<any>(`${BASE}/insights/ask`, {
        method: 'POST',
        body: JSON.stringify(args),
        skipDefaultBase: true,
      });
      return { content: [{ type: 'text', text: JSON.stringify(data) }] };
    }

    // Fallback: call /insights/ask for any other tool
    const data = await request<any>(`${BASE}/insights/ask`, {
      method: 'POST',
      body: JSON.stringify({ tool: name, ...args }),
      skipDefaultBase: true,
    });
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  },

  fetchContainerLogs: async (service: string): Promise<string> => {
    const data = await request<{ logs: string }>(`${BASE}/insights/container-logs?service=${encodeURIComponent(service)}`, { skipDefaultBase: true });
    return data.logs || '';
  },

  listServices: async (): Promise<any[]> => {
    const data = await request<any[]>(`${BASE}/insights/services`, { skipDefaultBase: true });
    return Array.isArray(data) ? data : [];
  },

  getLogStreamUrl: (service: string): string => {
    const token = resolveToken();
    const params = new URLSearchParams({ service });
    if (token) params.set('token', token);
    return `${BASE}/insights/log-stream?${params.toString()}`;
  },

  listTools: async () => {
    const data = await request<{ capabilities: any[] }>(`${BASE}/health`, { skipDefaultBase: true });
    return data.capabilities || [];
  },

  checkHealth: async (): Promise<boolean> => {
    try {
      await request(`${BASE}/health`, { skipDefaultBase: true });
      return true;
    } catch {
      return false;
    }
  },
};
