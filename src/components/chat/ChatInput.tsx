import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { SymbolView } from 'expo-symbols';
import { useCallback, useRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CHAT_FOOTER_HEIGHT, CHAT_INPUT_HEIGHT } from '@/constants/chat-layout';
import { CardRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChatInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onFocus?: () => void;
  sendDisabled?: boolean;
};

export function ChatInput({ value, onChangeText, onSend, onFocus, sendDisabled }: ChatInputProps) {
  const theme = useTheme();
  const inputRef = useRef<ComponentRef<typeof BottomSheetTextInput>>(null);

  const refocusInput = useCallback(() => {
    const focus = () => inputRef.current?.focus();
    requestAnimationFrame(focus);
    setTimeout(focus, 50);
    setTimeout(focus, 200);
  }, []);

  const handleSend = useCallback(() => {
    if (sendDisabled || !value.trim()) return;
    onSend();
    refocusInput();
  }, [onSend, refocusInput, sendDisabled, value]);

  return (
    <View
      style={[
        styles.container,
        {
          borderTopColor: theme.backgroundSelected,
          backgroundColor: theme.background,
          minHeight: CHAT_FOOTER_HEIGHT,
        },
      ]}>
      <BottomSheetTextInput
        ref={inputRef}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.backgroundElement, height: CHAT_INPUT_HEIGHT },
        ]}
        placeholder="Ask about your trip..."
        placeholderTextColor={theme.textSecondary}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        multiline={false}
        scrollEnabled={false}
        returnKeyType="send"
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
        maxLength={500}
      />
      <Pressable
        onPress={handleSend}
        onPressIn={(e) => e.stopPropagation()}
        disabled={sendDisabled || !value.trim()}
        style={({ pressed }) => [
          styles.sendButton,
          {
            backgroundColor: theme.fab,
            opacity: sendDisabled || !value.trim() ? 0.4 : pressed ? 0.85 : 1,
          },
        ]}>
        <SymbolView
          name={{ ios: 'arrow.up', android: 'send', web: 'send' }}
          size={18}
          tintColor="#FFFFFF"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderRadius: CardRadius,
    paddingHorizontal: Spacing.three,
    paddingVertical: 0,
    fontSize: 15,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
