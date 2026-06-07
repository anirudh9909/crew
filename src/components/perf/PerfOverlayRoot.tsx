import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PerfOverlay } from '@/components/perf/PerfOverlay';
import { PerfToggleButton } from '@/components/perf/PerfToggleButton';
import { usePerfMonitor } from '@/hooks/use-perf-monitor';
import { perfFrameStore } from '@/utils/perf-frame-store';

export function PerfOverlayRoot() {
  const [enabled, setEnabled] = useState(false);
  const snapshot = usePerfMonitor(enabled);

  const handleToggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (next) {
        perfFrameStore.resetSession();
      }
      return next;
    });
  }, []);

  return (
    <View style={styles.root} pointerEvents="box-none">
      <PerfToggleButton active={enabled} onPress={handleToggle} />
      {enabled ? <PerfOverlay snapshot={snapshot} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
  },
});
