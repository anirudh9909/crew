import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { HERO_HEIGHT, HERO_WIDTH } from '@/constants/feed-layout';
import { CardRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

type FeedCardHeroProps = {
  id: string;
  uri: string;
  width?: number;
  height?: number;
};

export function FeedCardHero({
  id,
  uri,
  width = HERO_WIDTH,
  height = HERO_HEIGHT,
}: FeedCardHeroProps) {
  const theme = useTheme();

  return (
    <Image
      source={{ uri }}
      style={[styles.image, { width, height, backgroundColor: theme.backgroundElement }]}
      contentFit="cover"
      placeholder={{ blurhash: PLACEHOLDER_BLURHASH }}
      transition={200}
      recyclingKey={id}
      cachePolicy="memory-disk"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    borderTopLeftRadius: CardRadius,
    borderTopRightRadius: CardRadius,
  },
});
