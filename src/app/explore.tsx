import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useScreenInsets } from '@/hooks/use-screen-insets';
import { Spacing } from '@/constants/theme';

export default function ExploreScreen() {
  const { headerTop } = useScreenInsets();

  return (
    <ThemedView style={styles.container}>
      <ThemedView
        style={[styles.safeArea, { paddingTop: headerTop }]}>
        <ThemedText type="subtitle">Saved Trips</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          Your bookmarked bundles will appear here.
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
});
