import { BottomSheetFooter, type BottomSheetFooterProps } from '@gorhom/bottom-sheet';
import { memo, useCallback, useState } from 'react';

import { useChatSheetActions, useChatSheetStreaming } from '@/components/chat/chat-sheet-context';
import { ChatInput } from '@/components/chat/ChatInput';
function ChatSheetFooterComponent(props: BottomSheetFooterProps) {
  const { onSend, onInputFocus } = useChatSheetActions();
  const isStreaming = useChatSheetStreaming();
  const [input, setInput] = useState('');

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    onSend(text);
  }, [input, isStreaming, onSend]);

  return (
    <BottomSheetFooter {...props}>
      <ChatInput
        value={input}
        onChangeText={setInput}
        onSend={handleSend}
        onFocus={onInputFocus}
        sendDisabled={isStreaming}
      />
    </BottomSheetFooter>
  );
}

export const ChatSheetFooter = memo(ChatSheetFooterComponent);
