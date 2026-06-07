import { useCallback, useEffect, useRef, useState } from 'react';
import { runOnJS, runOnUI, useFrameCallback, useSharedValue } from 'react-native-reanimated';

import {
  FRAME_DROP_MS,
  JS_BUSY_MS,
  UI_SYNC_FRAME_INTERVAL,
  UI_SYNC_MS,
} from '@/constants/perf-layout';
import { perf } from '@/utils/perf';
import { perfFrameStore, type PerfSessionSummary } from '@/utils/perf-frame-store';

export type PerfMonitorSnapshot = {
  fps: number;
  drops: number;
  jsBusy: boolean;
  scenario: string | null;
  summary: PerfSessionSummary;
};

const EMPTY_SUMMARY: PerfSessionSummary = {
  p50: 0,
  p95: 0,
  worst: 0,
  drops: 0,
  total: 0,
};

export function usePerfMonitor(enabled: boolean) {
  const [snapshot, setSnapshot] = useState<PerfMonitorSnapshot>({
    fps: 0,
    drops: 0,
    jsBusy: false,
    scenario: null,
    summary: EMPTY_SUMMARY,
  });

  const jsBusyRef = useRef(false);
  const liveFpsRef = useRef(0);
  const liveDropsRef = useRef(0);

  const liveFps = useSharedValue(0);
  const liveDrops = useSharedValue(0);
  const frameCounter = useSharedValue(0);
  const pendingDeltas = useSharedValue<number[]>([]);

  const flushToStore = useCallback((deltas: number[]) => {
    if (deltas.length > 0) {
      perfFrameStore.appendSamples(deltas);
    }
  }, []);

  const syncLiveStats = useCallback((fps: number, drops: number) => {
    liveFpsRef.current = fps;
    liveDropsRef.current = drops;
  }, []);

  const frameCallback = useFrameCallback((frameInfo) => {
    'worklet';
    const delta = frameInfo.timeSincePreviousFrame;
    if (delta === null || delta <= 0) return;

    const instantFps = 1000 / delta;
    liveFps.value =
      liveFps.value === 0 ? instantFps : liveFps.value * 0.85 + instantFps * 0.15;

    if (delta > FRAME_DROP_MS) {
      liveDrops.value += 1;
    }

    pendingDeltas.modify((batch) => {
      'worklet';
      batch.push(delta);
      return batch;
    });

    frameCounter.value += 1;
    if (frameCounter.value % UI_SYNC_FRAME_INTERVAL !== 0) return;

    pendingDeltas.modify((batch) => {
      'worklet';
      const copy = batch.slice();
      batch.length = 0;
      runOnJS(flushToStore)(copy);
      runOnJS(syncLiveStats)(liveFps.value, liveDrops.value);
      return batch;
    });
  }, false);

  useEffect(() => {
    if (enabled) {
      runOnUI(() => {
        'worklet';
        liveFps.value = 0;
        liveDrops.value = 0;
        frameCounter.value = 0;
        pendingDeltas.value = [];
      })();
    }
    frameCallback.setActive(enabled);
    if (!enabled) {
      jsBusyRef.current = false;
      liveFpsRef.current = 0;
      liveDropsRef.current = 0;
    }
  }, [enabled, frameCallback, frameCounter, liveDrops, liveFps, pendingDeltas]);

  useEffect(() => {
    if (!enabled) return;

    let lastTick = performance.now();
    const heartbeat = setInterval(() => {
      const now = performance.now();
      const gap = now - lastTick;
      lastTick = now;
      jsBusyRef.current = gap > JS_BUSY_MS;
    }, 16);

    const uiSync = setInterval(() => {
      setSnapshot({
        fps: liveFpsRef.current,
        drops: liveDropsRef.current,
        jsBusy: jsBusyRef.current,
        scenario: perf.getActiveScenario(),
        summary: perfFrameStore.getSessionSummary(),
      });
    }, UI_SYNC_MS);

    return () => {
      clearInterval(heartbeat);
      clearInterval(uiSync);
    };
  }, [enabled]);

  return snapshot;
}
