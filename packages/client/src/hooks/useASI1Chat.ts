import { useCallback, useRef } from 'react';
import { useAIStore } from '@/stores/aiStore';

export function useASI1Chat() {
  const { addMessage, updateStreamingMessage, finishStreaming, setIsStreaming, isStreaming } = useAIStore();
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (message: string, history: Array<{ role: string; content: string }> = []) => {
    // Add user message
    addMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now(),
    });

    setIsStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, stream: true }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error('Chat request failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.token) {
              fullContent += parsed.token;
              updateStreamingMessage(parsed.token);
            }
          } catch { /* skip */ }
        }
      }

      finishStreaming(fullContent);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        finishStreaming('Sorry, an error occurred. Please try again.');
      }
    } finally {
      abortRef.current = null;
    }
  }, [addMessage, updateStreamingMessage, finishStreaming, setIsStreaming]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, [setIsStreaming]);

  return { sendMessage, stopGeneration, isStreaming };
}
