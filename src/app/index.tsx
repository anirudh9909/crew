import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AskCrewSheet, type AskCrewSheetRef } from '@/components/chat/AskCrewSheet';
import { AskCrewFAB } from '@/components/feed/AskCrewFAB';
import { FeedList } from '@/components/feed/FeedList';
import { useFeed } from '@/hooks/use-feed';
import { perf } from '@/utils/perf';

export default function DiscoverScreen() {
  const { bundles } = useFeed();
  const sheetRef = useRef<AskCrewSheetRef>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const openSheet = useCallback(() => {
    perf.mark('sheet_open_requested');
    perf.tagScenario('sheet_open');
    sheetRef.current?.open();
  }, []);

  const handleSheetOpenChange = useCallback((isOpen: boolean) => {
    setIsSheetOpen(isOpen);
  }, []);

  return (
    <View style={styles.container}>
      <FeedList data={bundles} />
      <AskCrewFAB onPress={openSheet} visible={!isSheetOpen} />
      <AskCrewSheet ref={sheetRef} onOpenChange={handleSheetOpenChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
