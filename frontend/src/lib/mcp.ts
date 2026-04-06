import { request, type McpToolCallResponse } from './api';

const BASE = '/mcp-http';

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

  getLogStreamUrl: (service: string): string => {
    return `${BASE}/insights/log-stream?service=${encodeURIComponent(service)}`;
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
