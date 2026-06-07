/** Frame-rate threshold below which a frame counts as dropped. */
export const FRAME_DROP_FPS = 45;

export const FRAME_DROP_MS = 1000 / FRAME_DROP_FPS;

/** JS heartbeat gap that indicates the thread is blocked (~3 missed 16ms ticks). */
export const JS_BUSY_MS = 48;

/** Overlay text refresh rate — avoids per-frame React updates. */
export const UI_SYNC_HZ = 8;

export const UI_SYNC_MS = 1000 / UI_SYNC_HZ;

/** Max session samples retained (~3 min at 60fps). */
export const SESSION_SAMPLE_CAP = 12000;

/** UI-thread sync cadence in frames (~125ms at 60fps). */
export const UI_SYNC_FRAME_INTERVAL = 8;
