import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export function ChatEmpty() {
  return (
    <View style={styles.empty}>
      <ThemedText type="smallBold">Ask Crew anything</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
        Trip ideas, itinerary tweaks, or what to pack — we are here to help.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  hint: {
    textAlign: 'center',
  },
});
