import { useCallback, useSyncExternalStore } from 'react';

import { perf } from '@/utils/perf';

const expandedIds = new Set<string>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function useIsExpanded(id: string) {
  return useSyncExternalStore(
    subscribe,
    () => expandedIds.has(id),
    () => expandedIds.has(id),
  );
}

export function useExpandedCardsStore() {
  const expandedCount = useSyncExternalStore(
    subscribe,
    () => expandedIds.size,
    () => expandedIds.size,
  );

  const toggleExpanded = useCallback((id: string) => {
    const expanding = !expandedIds.has(id);
    if (expandedIds.has(id)) {
      expandedIds.delete(id);
    } else {
      expandedIds.add(id);
    }
    perf.tagScenario(expanding ? 'card_expand' : 'card_collapse', { id });
    notify();
  }, []);

  const isExpanded = useCallback((id: string) => expandedIds.has(id), []);

  return { expandedCount, toggleExpanded, isExpanded };
}
