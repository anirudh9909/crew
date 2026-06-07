import { memo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function StreamingIndicatorComponent() {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={theme.accent} />
      <ThemedText type="small" themeColor="textSecondary">
        Crew is thinking...
      </ThemedText>
    </View>
  );
}

export const StreamingIndicator = memo(StreamingIndicatorComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
});
