import { createContext, useContext } from 'react';

import type { ChatMessage } from '@/hooks/use-chat';

export type ChatSheetActions = {
  onSend: (text: string) => void;
};

const actionsContext = createContext<ChatSheetActions | null>(null);
const streamingContext = createContext(false);
const messagesContext = createContext<ChatMessage[]>([]);

/** Stable send callback — does not change during token streaming. */
export function useChatSheetActions() {
  const ctx = useContext(actionsContext);
  if (!ctx) {
    throw new Error('useChatSheetActions must be used within ChatSheetProvider');
  }
  return ctx;
}

/** Streaming flag only — footer re-renders on start/end, not per token. */
export function useChatSheetStreaming() {
  return useContext(streamingContext);
}

/** Message list — list subtree re-renders when messages update. */
export function useChatSheetMessages() {
  return useContext(messagesContext);
}

export const ChatSheetActionsContext = actionsContext;
export const ChatSheetStreamingContext = streamingContext;
export const ChatSheetMessagesContext = messagesContext;
