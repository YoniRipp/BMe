import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi, type ChatMessage, type StreamAction } from '@/core/api/chat';

interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: StreamAction[];
  created_at: string;
}

export function useAgent() {
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const {
    data: historyData,
    isLoading: isLoadingHistory,
  } = useQuery({
    queryKey: ['chat', 'history'],
    queryFn: () => chatApi.getHistory(50),
    staleTime: 30_000,
  });

  const messages: AgentMessage[] = (historyData?.messages ?? []).map((m: ChatMessage) => ({
    ...m,
    actions: undefined,
  }));

  const sendMessage = useCallback(async (text: string): Promise<{ actions: StreamAction[] } | null> => {
    if (!text.trim() || isSending) return null;
    setIsSending(true);
    setIsThinking(true);
    setStreamingContent('');

    return new Promise((resolve) => {
      let accumulated = '';
      let finalActions: StreamAction[] = [];

      chatApi.sendAgentMessageStream(
        text.trim(),
        (chunk) => {
          // First chunk means tool-calls are done, now streaming text
          setIsThinking(false);
          accumulated += chunk;
          setStreamingContent(accumulated);
        },
        () => {
          // Still processing tools
          setIsThinking(true);
        },
        async (actions) => {
          finalActions = actions;
          setIsSending(false);
          setStreamingContent('');
          // Refresh history and data
          await queryClient.invalidateQueries({ queryKey: ['chat', 'history'] });
          await queryClient.invalidateQueries({ queryKey: ['workouts'] });
          await queryClient.invalidateQueries({ queryKey: ['foodEntries'] });
          await queryClient.invalidateQueries({ queryKey: ['goals'] });
          await queryClient.invalidateQueries({ queryKey: ['weight'] });
          await queryClient.invalidateQueries({ queryKey: ['water'] });
          resolve({ actions: finalActions });
        },
        async (err) => {
          console.error('Stream error:', err);
          setIsSending(false);
          setIsThinking(false);
          setStreamingContent('');
          // Refresh history so the user's saved message shows even on error
          await queryClient.invalidateQueries({ queryKey: ['chat', 'history'] });
          resolve(null);
        },
      ).catch((err) => {
        console.error('Stream failed:', err);
        setIsSending(false);
        setIsThinking(false);
        setStreamingContent('');
        resolve(null);
      });
    });
  }, [isSending, queryClient]);

  const clearHistory = useCallback(async () => {
    await chatApi.clearHistory();
    await queryClient.invalidateQueries({ queryKey: ['chat', 'history'] });
  }, [queryClient]);

  return {
    messages,
    isLoadingHistory,
    isSending,
    isThinking,
    streamingContent,
    sendMessage,
    clearHistory,
  };
}
