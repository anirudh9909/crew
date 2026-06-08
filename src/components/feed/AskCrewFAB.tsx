import { SymbolView } from 'expo-symbols';
import { memo, useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useScreenInsets } from '@/hooks/use-screen-insets';
import { Spacing } from '@/constants/theme';

type AskCrewFABProps = {
  onPress: () => void;
  visible?: boolean;
};

function AskCrewFABComponent({ onPress, visible = true }: AskCrewFABProps) {
  const { fabBottom } = useScreenInsets();
  const opacity = useSharedValue(visible ? 1 : 0);
  const scale = useSharedValue(visible ? 1 : 0.9);

  useEffect(() => {
    // Hide instantly when sheet opens to avoid overlapping Reanimated work with the sheet.
    const duration = visible ? 200 : 0;
    opacity.value = withTiming(visible ? 1 : 0, { duration });
    scale.value = withTiming(visible ? 1 : 0.9, { duration });
  }, [opacity, scale, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[styles.wrapper, { bottom: fabBottom }, animatedStyle]}
      pointerEvents={visible ? 'auto' : 'none'}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Ask Crew">
        <SymbolView
          name={{ ios: 'bubble.left.and.bubble.right.fill', android: 'chat', web: 'chat' }}
          size={22}
          tintColor="#FFFFFF"
        />
        <ThemedText style={styles.label}>Ask Crew</ThemedText>
      </Pressable>
    </Animated.View>
  );
}

export const AskCrewFAB = memo(AskCrewFABComponent);

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: Spacing.three,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#1B6EF3',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
