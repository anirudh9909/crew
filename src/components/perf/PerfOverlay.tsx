import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { FRAME_DROP_FPS } from '@/constants/perf-layout';
import { Spacing } from '@/constants/theme';
import type { PerfMonitorSnapshot } from '@/hooks/use-perf-monitor';

type PerfOverlayProps = {
  snapshot: PerfMonitorSnapshot;
};

function fpsColor(fps: number): string {
  if (fps >= 58) return '#4ADE80';
  if (fps >= 45) return '#FACC15';
  return '#F87171';
}

function formatMs(ms: number): string {
  return `${ms.toFixed(1)}ms`;
}

function PerfOverlayComponent({ snapshot }: PerfOverlayProps) {
  const { top } = useSafeAreaInsets();
  const { fps, drops, jsBusy, scenario, summary } = snapshot;

  return (
    <View style={[styles.panel, { top: top + 40 }]} pointerEvents="none">
      <ThemedText style={[styles.fps, { color: fpsColor(fps) }]}>
        {fps > 0 ? fps.toFixed(1) : '—'} FPS
      </ThemedText>

      <ThemedText style={styles.row}>
        Drops: {drops} (&lt;{FRAME_DROP_FPS})
      </ThemedText>

      <View style={styles.jsRow}>
        <ThemedText style={styles.row}>JS:</ThemedText>
        <View style={[styles.badge, jsBusy ? styles.badgeBusy : styles.badgeOk]}>
          <ThemedText style={styles.badgeText}>{jsBusy ? 'BUSY' : 'OK'}</ThemedText>
        </View>
      </View>

      {scenario ? (
        <ThemedText style={styles.scenario} numberOfLines={1}>
          {scenario}
        </ThemedText>
      ) : null}

      <View style={styles.divider} />

      <ThemedText style={styles.section}>Session</ThemedText>
      <ThemedText style={styles.row}>p50: {formatMs(summary.p50)}</ThemedText>
      <ThemedText style={styles.row}>p95: {formatMs(summary.p95)}</ThemedText>
      <ThemedText style={styles.row}>worst: {formatMs(summary.worst)}</ThemedText>
      <ThemedText style={styles.muted}>{summary.total} frames</ThemedText>
    </View>
  );
}

export const PerfOverlay = memo(PerfOverlayComponent);

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: Spacing.two,
    zIndex: 10000,
    backgroundColor: 'rgba(10, 10, 10, 0.82)',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    minWidth: 140,
    gap: 2,
  },
  fps: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: Spacing.one,
  },
  row: {
    color: '#E5E5E5',
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  muted: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  jsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeOk: {
    backgroundColor: 'rgba(74, 222, 128, 0.25)',
  },
  badgeBusy: {
    backgroundColor: 'rgba(248, 113, 113, 0.35)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  scenario: {
    color: 'rgba(147, 197, 253, 0.9)',
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: Spacing.one,
  },
  section: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
