import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
function ChatHeaderComponent() {
  return (
    <View style={styles.header}>
      <ThemedText type="smallBold" style={styles.title}>
        Ask Crew
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Your AI travel assistant
      </ThemedText>
    </View>
  );
}

export const ChatHeader = memo(ChatHeaderComponent);

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.half,
  },
  title: {
    fontSize: 18,
  },
});
