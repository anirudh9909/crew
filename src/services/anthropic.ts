import type { StreamCallbacks } from '@/services/stream-types';

const CHAT_API_URL = process.env.EXPO_PUBLIC_CHAT_API_URL;

type ChatMessagePayload = {
  role: 'user' | 'assistant';
  content: string;
};

export function streamChat(
  messages: ChatMessagePayload[],
  callbacks: StreamCallbacks,
): () => void {
  if (!CHAT_API_URL) {
    callbacks.onError?.(new Error('EXPO_PUBLIC_CHAT_API_URL is not configured'));
    callbacks.onDone();
    return () => {};
  }

  const abortController = new AbortController();
  let cancelled = false;
  let pending = '';
  let rafId: number | null = null;

  const flush = () => {
    rafId = null;
    if (cancelled || !pending) return;
    callbacks.onToken(pending);
    pending = '';
  };

  const scheduleFlush = () => {
    if (rafId === null) {
      rafId = requestAnimationFrame(flush);
    }
  };

  (async () => {
    try {
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Streaming not supported');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (!cancelled) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data) as {
              type?: string;
              delta?: { text?: string };
            };
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              pending += parsed.delta.text;
              scheduleFlush();
            }
          } catch {
            // ignore malformed SSE chunks
          }
        }
      }

      if (pending) flush();
      if (!cancelled) callbacks.onDone();
    } catch (error) {
      if (!cancelled) {
        callbacks.onError?.(error instanceof Error ? error : new Error('Stream failed'));
        callbacks.onDone();
      }
    }
  })();

  return () => {
    cancelled = true;
    abortController.abort();
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
}
