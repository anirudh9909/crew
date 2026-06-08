import feedData from '@/data/feed.json';
import type { TravelBundle } from '@/types/travel';

const bundles = feedData as TravelBundle[];

describe('feed.json', () => {
  it('has at least 100 travel bundles', () => {
    expect(bundles.length).toBeGreaterThanOrEqual(100);
  });

  it('each bundle has an id and remote hero image URL', () => {
    for (const bundle of bundles) {
      expect(bundle.id).toBeTruthy();
      expect(bundle.heroImage.uri).toMatch(/^https:\/\//);
    }
  });
});
