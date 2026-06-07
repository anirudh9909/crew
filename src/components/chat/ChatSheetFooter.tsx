import { BottomSheetFooter, type BottomSheetFooterProps } from '@gorhom/bottom-sheet';
import { useCallback, useState } from 'react';

import { useChatSheetContext } from '@/components/chat/chat-sheet-context';
import { ChatInput } from '@/components/chat/ChatInput';

export function ChatSheetFooter(props: BottomSheetFooterProps) {
  const { onSend, isStreaming, onInputFocus } = useChatSheetContext();
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
