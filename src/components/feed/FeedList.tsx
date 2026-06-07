import { FlashList } from '@shopify/flash-list';
import { memo, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { FeedCard } from '@/components/feed/FeedCard';
import { ThemedText } from '@/components/themed-text';
import { FeedGutter, Spacing } from '@/constants/theme';
import { useExpandedCardsStore } from '@/hooks/use-expanded-cards';
import { useScreenInsets } from '@/hooks/use-screen-insets';
import { useTheme } from '@/hooks/use-theme';
import type { TravelBundle } from '@/types/travel';
import { perf } from '@/utils/perf';

type FeedListProps = {
  data: TravelBundle[];
};

function FeedListComponent({ data }: FeedListProps) {
  const theme = useTheme();
  const { headerTop, feedListBottom } = useScreenInsets();
  const { expandedCount, toggleExpanded, isExpanded } = useExpandedCardsStore();

  useEffect(() => {
    perf.markOnce('feed_mount', { itemCount: data.length });
  }, [data.length]);

  const renderItem = useCallback(
    ({ item }: { item: TravelBundle }) => (
      <FeedCard bundle={item} onToggleDetails={toggleExpanded} />
    ),
    [toggleExpanded],
  );

  const keyExtractor = useCallback((item: TravelBundle) => item.id, []);

  const getItemType = useCallback(
    (item: TravelBundle) => (isExpanded(item.id) ? 'expanded' : 'collapsed'),
    [isExpanded, expandedCount],
  );

  const handleScrollBeginDrag = useCallback(() => {
    perf.tagScenario('feed_scroll');
  }, []);

  const handleScrollEnd = useCallback(() => {
    perf.tagScenario('feed_scroll_idle');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: headerTop }]}>
        <ThemedText type="subtitle" style={styles.title}>
          Discover
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Curated trips for every kind of journey
        </ThemedText>
      </View>
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        extraData={expandedCount}
        drawDistance={250}
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: feedListBottom }]}
      />
    </View>
  );
}

export const FeedList = memo(FeedListComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: FeedGutter,
    paddingBottom: Spacing.two,
    gap: Spacing.half,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  list: {
    flex: 1,
  },
  listContent: {},
});
