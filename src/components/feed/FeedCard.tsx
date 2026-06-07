import { SymbolView } from 'expo-symbols';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FeedCardHero } from '@/components/feed/FeedCardHero';
import { ItineraryStrip } from '@/components/feed/ItineraryStrip';
import { TripTypeBadge } from '@/components/feed/TripTypeBadge';
import {
  CARD_COLLAPSED_HEIGHT,
  CARD_EXPANDED_EXTRA,
} from '@/constants/feed-layout';
import { CardRadius, FeedGutter, Spacing } from '@/constants/theme';
import { useIsExpanded } from '@/hooks/use-expanded-cards';
import { useTheme } from '@/hooks/use-theme';
import type { TravelBundle } from '@/types/travel';

type FeedCardProps = {
  bundle: TravelBundle;
  onToggleDetails: (id: string) => void;
};

function FeedCardComponent({ bundle, onToggleDetails }: FeedCardProps) {
  const theme = useTheme();
  const isExpanded = useIsExpanded(bundle.id);

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: bundle.currency,
    maximumFractionDigits: 0,
  }).format(bundle.price);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          minHeight: isExpanded
            ? CARD_COLLAPSED_HEIGHT + CARD_EXPANDED_EXTRA
            : CARD_COLLAPSED_HEIGHT,
        },
      ]}>
      <FeedCardHero
        id={bundle.id}
        uri={bundle.heroImage.uri}
        width={bundle.heroImage.width}
        height={bundle.heroImage.height}
      />

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <ThemedText type="smallBold" style={styles.destination} numberOfLines={1}>
            {bundle.destination}
          </ThemedText>
          <View style={styles.rating}>
            <SymbolView
              name={{ ios: 'star.fill', android: 'star', web: 'star' }}
              size={14}
              tintColor={theme.star}
            />
            <ThemedText type="smallBold">{bundle.rating.toFixed(1)}</ThemedText>
          </View>
        </View>

        <View style={styles.metaRow}>
          <TripTypeBadge tripType={bundle.tripType} label={bundle.tripTypeLabel} />
          <ThemedText type="small" themeColor="textSecondary">
            {bundle.durationDays} days
          </ThemedText>
        </View>

        <ThemedText type="default" style={styles.price}>
          From {formattedPrice}
        </ThemedText>

        <Pressable
          onPress={() => onToggleDetails(bundle.id)}
          style={({ pressed }) => [styles.detailsToggle, pressed && styles.pressed]}>
          <ThemedText type="small" themeColor="textSecondary">
            {isExpanded ? '▲ Hide Details' : '▼ Details'}
          </ThemedText>
        </Pressable>
      </View>

      {isExpanded ? <ItineraryStrip items={bundle.itinerary} /> : null}
    </View>
  );
}

export const FeedCard = memo(FeedCardComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: CardRadius,
    overflow: 'hidden',
    marginHorizontal: FeedGutter,
    marginBottom: Spacing.three,
  },
  body: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  destination: {
    flex: 1,
    fontSize: 18,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontWeight: '700',
  },
  detailsToggle: {
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.7,
  },
});
