import { memo, useCallback, useState } from 'react';

import { useChatSheetActions, useChatSheetStreaming } from '@/components/chat/chat-sheet-context';
import { ChatInput } from '@/components/chat/ChatInput';

function ChatSheetFooterComponent() {
  const { onSend } = useChatSheetActions();
  const isStreaming = useChatSheetStreaming();
  const [input, setInput] = useState('');

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    onSend(text);
  }, [input, isStreaming, onSend]);

  return (
    <ChatInput
      value={input}
      onChangeText={setInput}
      onSend={handleSend}
      sendDisabled={isStreaming}
    />
  );
}

export const ChatSheetFooter = memo(ChatSheetFooterComponent);
