import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';

/** Approximate Ask Crew FAB height for list scroll clearance. */
const FAB_CLEARANCE = 56;

/**
 * Screen inset helpers for tab screens.
 * Tab content from NativeTabs already sits above the tab bar — do not add tab bar height again.
 */
export function useScreenInsets() {
  const { top, bottom } = useSafeAreaInsets();

  return {
    /** Safe top padding for screen headers (status bar / notch). */
    headerTop: top + Spacing.three,
    /** FAB offset from the bottom edge of the tab content area. */
    fabBottom: Spacing.three,
    /** List padding so the last feed card clears the floating FAB. */
    feedListBottom: FAB_CLEARANCE + Spacing.three,
    /** Bottom safe area inset (home indicator when content is edge-to-edge). */
    safeBottom: bottom,
  };
}
