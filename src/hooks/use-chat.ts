import { useCallback, useRef, useState } from 'react';

import { streamChat } from '@/services/anthropic';
import { streamMockResponse } from '@/services/mock-stream';
import { STREAM_BATCH_MS } from '@/constants/stream-config';
import { perf } from '@/utils/perf';
import { createStreamBatcher } from '@/utils/stream-batch';

export type ChatMessageStatus = 'loading' | 'streaming' | 'complete' | 'error';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: ChatMessageStatus;
};

const USE_ANTHROPIC = Boolean(process.env.EXPO_PUBLIC_CHAT_API_URL);

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);
  const batcherRef = useRef<ReturnType<typeof createStreamBatcher> | null>(null);

  const appendAssistantContent = useCallback((id: string, chunk: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id
          ? {
              ...msg,
              status: msg.status === 'loading' ? 'streaming' : msg.status,
              content: msg.content + chunk,
            }
          : msg,
      ),
    );
  }, []);

  const finalizeAssistant = useCallback(
    (id: string, status: ChatMessageStatus, content?: string) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === id
            ? {
                ...msg,
                status,
                content: content ?? msg.content,
              }
            : msg,
        ),
      );
    },
    [],
  );

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      cancelRef.current?.();
      batcherRef.current?.cancel();

      const userMessage: ChatMessage = {
        id: createId(),
        role: 'user',
        content: trimmed,
        status: 'complete',
      };

      const assistantId = createId();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        status: 'loading',
      };

      let firstTokenMarked = false;

      const batcher = createStreamBatcher((chunk) => {
        if (!firstTokenMarked) {
          firstTokenMarked = true;
          perf.mark('stream_first_token_ms');
        }
        appendAssistantContent(assistantId, chunk);
      }, STREAM_BATCH_MS);

      batcherRef.current = batcher;

      const callbacks = {
        onToken: (token: string) => {
          batcher.push(token);
        },
        onDone: () => {
          batcher.flushNow();
          finalizeAssistant(assistantId, 'complete');
          setIsStreaming(false);
          cancelRef.current = null;
          batcherRef.current = null;
        },
        onError: (error: Error) => {
          batcher.cancel();
          finalizeAssistant(
            assistantId,
            'error',
            `Sorry, something went wrong: ${error.message}`,
          );
          setIsStreaming(false);
          cancelRef.current = null;
          batcherRef.current = null;
        },
      };

      setMessages((prev) => {
        if (USE_ANTHROPIC) {
          const history = [...prev, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          }));
          cancelRef.current = streamChat(history, callbacks);
        }
        return [...prev, userMessage, assistantMessage];
      });

      if (!USE_ANTHROPIC) {
        cancelRef.current = streamMockResponse(trimmed, callbacks);
      }

      setIsStreaming(true);
    },
    [appendAssistantContent, finalizeAssistant, isStreaming],
  );

  return { messages, sendMessage, isStreaming };
}
