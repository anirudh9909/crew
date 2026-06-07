import { perfFrameStore } from '@/utils/perf-frame-store';

type PerfMeta = Record<string, string | number | boolean | undefined>;

const marks = new Map<string, number>();
const onceMarks = new Set<string>();
let activeScenario: string | null = null;

export const perf = {
  mark(name: string, meta?: PerfMeta) {
    marks.set(name, Date.now());
    if (__DEV__) {
      console.log(`[perf] ${name}`, meta ?? '');
    }
  },

  /** Log only the first time per session — avoids Strict Mode double-mount noise. */
  markOnce(name: string, meta?: PerfMeta) {
    if (onceMarks.has(name)) return;
    onceMarks.add(name);
    perf.mark(name, meta);
  },

  measure(name: string, startMark: string, meta?: PerfMeta) {
    const start = marks.get(startMark);
    if (start === undefined) return;
    const duration = Date.now() - start;
    if (__DEV__) {
      console.log(`[perf] ${name}: ${duration}ms`, meta ?? '');
    }
    return duration;
  },

  /** Tag the active interaction scenario for overlay correlation. */
  tagScenario(name: string, meta?: PerfMeta) {
    activeScenario = name;
    const summary = perfFrameStore.getSessionSummary();
    if (__DEV__) {
      console.log(`[perf] scenario:${name}`, {
        ...meta,
        fpsDrops: summary.drops,
        p50: summary.p50.toFixed(1),
        p95: summary.p95.toFixed(1),
      });
    }
  },

  getActiveScenario() {
    return activeScenario;
  },
};

export const SHEET_SNAP_LABELS: Record<number, string> = {
  [-1]: 'closed',
  0: 'half',
  1: 'full',
  2: 'keyboard',
};
