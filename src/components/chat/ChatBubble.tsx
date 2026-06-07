import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { StreamingIndicator } from '@/components/chat/StreamingIndicator';
import { CardRadius, Spacing } from '@/constants/theme';
import type { ChatMessage } from '@/hooks/use-chat';
import { useTheme } from '@/hooks/use-theme';

type ChatBubbleProps = {
  message: ChatMessage;
};

function ChatBubbleComponent({ message }: ChatBubbleProps) {
  const theme = useTheme();
  const isUser = message.role === 'user';

  const bubbleColor = isUser ? theme.userBubble : theme.assistantBubble;
  const textColor = isUser ? '#FFFFFF' : theme.text;

  return (
    <View style={[styles.row, isUser ? styles.userRow : styles.assistantRow]}>
      <View style={[styles.bubble, { backgroundColor: bubbleColor }]}>
        {message.status === 'loading' ? (
          <StreamingIndicator />
        ) : (
          <Text style={[styles.text, { color: textColor }]}>{message.content || ' '}</Text>
        )}
      </View>
    </View>
  );
}

function propsAreEqual(prev: ChatBubbleProps, next: ChatBubbleProps) {
  return (
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.message.status === next.message.status &&
    prev.message.role === next.message.role
  );
}

export const ChatBubble = memo(ChatBubbleComponent, propsAreEqual);

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  assistantRow: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: CardRadius,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
});
