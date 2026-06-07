import {
  FRAME_DROP_MS,
  SESSION_SAMPLE_CAP,
} from '@/constants/perf-layout';

export type PerfSessionSummary = {
  p50: number;
  p95: number;
  worst: number;
  drops: number;
  total: number;
};

const sessionSamples: number[] = [];
let dropCount = 0;
let worstFrameMs = 0;
let totalFrames = 0;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

export const perfFrameStore = {
  resetSession() {
    sessionSamples.length = 0;
    dropCount = 0;
    worstFrameMs = 0;
    totalFrames = 0;
  },

  appendSamples(deltas: number[]) {
    for (const delta of deltas) {
      if (delta <= 0 || !Number.isFinite(delta)) continue;

      totalFrames += 1;
      if (delta > FRAME_DROP_MS) {
        dropCount += 1;
      }
      if (delta > worstFrameMs) {
        worstFrameMs = delta;
      }

      sessionSamples.push(delta);
      if (sessionSamples.length > SESSION_SAMPLE_CAP) {
        sessionSamples.shift();
      }
    }
  },

  getSessionSummary(): PerfSessionSummary {
    if (sessionSamples.length === 0) {
      return { p50: 0, p95: 0, worst: worstFrameMs, drops: dropCount, total: totalFrames };
    }

    const sorted = [...sessionSamples].sort((a, b) => a - b);
    return {
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      worst: worstFrameMs,
      drops: dropCount,
      total: totalFrames,
    };
  },
};
