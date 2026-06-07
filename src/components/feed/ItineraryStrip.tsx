import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  ITINERARY_CHIP_HEIGHT,
  ITINERARY_CHIP_WIDTH,
} from '@/constants/feed-layout';
import { CardRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DayHighlight } from '@/types/travel';

const ICON_MAP = {
  airplane: 'airplane',
  map: 'map',
  'figure.hiking': 'figure.hiking',
  'fork.knife': 'fork.knife',
  'beach.umbrella': 'beach.umbrella',
  suitcase: 'suitcase',
} as const;

type IconKey = keyof typeof ICON_MAP;

type ItineraryStripProps = {
  items: DayHighlight[];
};

function getIconName(icon: string): IconKey {
  if (icon in ICON_MAP) return icon as IconKey;
  return 'map';
}

export function ItineraryStrip({ items }: ItineraryStripProps) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      nestedScrollEnabled>
      {items.map((item) => {
        const iconName = ICON_MAP[getIconName(item.icon)];
        return (
          <View
            key={item.day}
            style={[styles.chip, { backgroundColor: theme.backgroundSelected }]}>
            <SymbolView
              name={{ ios: iconName, android: 'star', web: 'star' }}
              size={18}
              tintColor={theme.accent}
            />
            <ThemedText type="smallBold">Day {item.day}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {item.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
              {item.description}
            </ThemedText>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  chip: {
    width: ITINERARY_CHIP_WIDTH,
    height: ITINERARY_CHIP_HEIGHT,
    borderRadius: CardRadius,
    padding: Spacing.two,
    gap: Spacing.half,
  },
});
