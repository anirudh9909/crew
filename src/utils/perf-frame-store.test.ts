import { FRAME_DROP_MS, SESSION_SAMPLE_CAP } from '@/constants/perf-layout';
import { perfFrameStore } from '@/utils/perf-frame-store';

describe('perfFrameStore', () => {
  beforeEach(() => {
    perfFrameStore.resetSession();
  });

  it('returns zeros for an empty session', () => {
    const summary = perfFrameStore.getSessionSummary();
    expect(summary).toEqual({ p50: 0, p95: 0, worst: 0, drops: 0, total: 0 });
  });

  it('computes p50 and p95 for uniform 60 fps frames', () => {
    perfFrameStore.appendSamples(Array(100).fill(16.7));
    const summary = perfFrameStore.getSessionSummary();
    expect(summary.p50).toBe(16.7);
    expect(summary.p95).toBe(16.7);
    expect(summary.drops).toBe(0);
    expect(summary.total).toBe(100);
  });

  it('counts drops above FRAME_DROP_MS threshold', () => {
    perfFrameStore.appendSamples([16.7, 16.7, FRAME_DROP_MS + 1, 16.7, 50]);
    const summary = perfFrameStore.getSessionSummary();
    expect(summary.drops).toBe(2);
    expect(summary.total).toBe(5);
  });

  it('tracks the worst frame time', () => {
    perfFrameStore.appendSamples([16.7, 30, 83.3, 16.7]);
    expect(perfFrameStore.getSessionSummary().worst).toBe(83.3);
  });

  it('skips invalid samples', () => {
    perfFrameStore.appendSamples([0, -5, NaN, Infinity, 16.7]);
    const summary = perfFrameStore.getSessionSummary();
    expect(summary.total).toBe(1);
    expect(summary.p50).toBe(16.7);
  });

  it('resets session state', () => {
    perfFrameStore.appendSamples([16.7, 50, 83.3]);
    perfFrameStore.resetSession();
    expect(perfFrameStore.getSessionSummary()).toEqual({
      p50: 0,
      p95: 0,
      worst: 0,
      drops: 0,
      total: 0,
    });
  });

  it('evicts oldest samples when exceeding SESSION_SAMPLE_CAP', () => {
    const oldValue = 100;
    const newValue = 16.7;
    perfFrameStore.appendSamples(Array(SESSION_SAMPLE_CAP).fill(oldValue));
    perfFrameStore.appendSamples(Array(SESSION_SAMPLE_CAP).fill(newValue));

    const summary = perfFrameStore.getSessionSummary();
    expect(summary.total).toBe(SESSION_SAMPLE_CAP * 2);
    expect(summary.p50).toBe(newValue);
    expect(summary.p95).toBe(newValue);
  });
});
