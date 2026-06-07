import { createContext, useContext } from 'react';

type ChatSheetContextValue = {
  onSend: (text: string) => void;
  isStreaming: boolean;
  onInputFocus: () => void;
};

export const ChatSheetContext = createContext<ChatSheetContextValue | null>(null);

export function useChatSheetContext() {
  const ctx = useContext(ChatSheetContext);
  if (!ctx) {
    throw new Error('useChatSheetContext must be used within ChatSheetContext.Provider');
  }
  return ctx;
}
