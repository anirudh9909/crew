import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TripType } from '@/types/travel';

const badgeColorKey = {
  flight_stay: 'badgeFlightStay',
  villa: 'badgeVilla',
  experience: 'badgeExperience',
} as const satisfies Record<TripType, keyof ReturnType<typeof useTheme>>;

type TripTypeBadgeProps = {
  tripType: TripType;
  label: string;
};

export function TripTypeBadge({ tripType, label }: TripTypeBadgeProps) {
  const theme = useTheme();
  const color = theme[badgeColorKey[tripType]];

  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <ThemedText type="small" style={styles.label}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: CardRadius,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
