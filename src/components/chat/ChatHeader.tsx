import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export function ChatHeader() {
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
