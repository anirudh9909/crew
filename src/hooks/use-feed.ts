import feedData from '@/data/feed.json';
import type { TravelBundle } from '@/types/travel';

const bundles = feedData as TravelBundle[];

export function useFeed() {
  return { bundles };
}
