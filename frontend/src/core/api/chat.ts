import { request, getApiBase, getToken } from './client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatResponse {
  text: string;
  actions: Array<{ intent: string; success: boolean; message: string; [key: string]: unknown }>;
}

export type AgentResponse = ChatResponse;

export type StreamAction = { intent: string; success: boolean; message: string; [key: string]: unknown };

export const chatApi = {
  sendMessage: (message: string): Promise<ChatResponse> =>
    request('/api/chat', { method: 'POST', body: { message }, timeoutMs: 60000 }),

  sendAgentMessage: (message: string): Promise<AgentResponse> =>
    request('/api/chat/agent', { method: 'POST', body: { message }, timeoutMs: 120000 }),

  async sendAgentMessageStream(
    message: string,
    onChunk: (text: string) => void,
    onThinking: () => void,
    onDone: (actions: StreamAction[]) => void,
    onError: (err: string) => void,
  ): Promise<void> {
    const token = getToken();
    const res = await fetch(`${getApiBase()}/api/chat/agent/stream`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message }),
    });

    if (!res.ok || !res.body) {
      onError('Failed to connect to AI service');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6)) as {
            chunk?: string;
            thinking?: boolean;
            done?: boolean;
            actions?: StreamAction[];
            error?: string;
          };
          if (data.chunk) onChunk(data.chunk);
          else if (data.thinking) onThinking();
          else if (data.done) onDone(data.actions ?? []);
          else if (data.error) onError(data.error);
        } catch {
          // ignore malformed lines
        }
      }
    }
  },

  getHistory: (limit = 30): Promise<{ messages: ChatMessage[] }> =>
    request(`/api/chat/history?limit=${limit}`),

  clearHistory: (): Promise<void> =>
    request('/api/chat/history', { method: 'DELETE' }),
};
