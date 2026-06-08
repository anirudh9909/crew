/** Half-peek and full-height snap positions (spec). */
export const SHEET_SNAP_HALF = '50%';
export const SHEET_SNAP_FULL = '90%';

export const CHAT_INPUT_HEIGHT = 48;

/** Input row + vertical padding — must match ChatInput container height. */
export const CHAT_FOOTER_HEIGHT = CHAT_INPUT_HEIGHT + 16;

/** Scroll padding so the last bubble clears the pinned input footer. */
export const CHAT_LIST_BOTTOM_SPACER = CHAT_FOOTER_HEIGHT + 8;

/** Sheet open/close animation length — tuned for 60 fps (fewer frames in flight). */
export const SHEET_ANIMATION_MS = 280;

/** Smooth scroll while streaming; instant jumps when snapping after sheet open. */
export const CHAT_STREAM_SCROLL_ANIMATED = true;
