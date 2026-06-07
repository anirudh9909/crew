import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type PerfToggleButtonProps = {
  active: boolean;
  onPress: () => void;
};

function PerfToggleButtonComponent({ active, onPress }: PerfToggleButtonProps) {
  const { top } = useSafeAreaInsets();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { top: top + Spacing.two },
        active && styles.buttonActive,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={active ? 'Hide performance overlay' : 'Show performance overlay'}>
      <ThemedText style={styles.label}>PERF</ThemedText>
    </Pressable>
  );
}

export const PerfToggleButton = memo(PerfToggleButtonComponent);

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    left: Spacing.two,
    zIndex: 10000,
    backgroundColor: 'rgba(20, 20, 20, 0.75)',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  buttonActive: {
    backgroundColor: 'rgba(27, 110, 243, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});
