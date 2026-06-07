const fs = require('fs');
const path = require('path');

const HERO_WIDTH = 400;
const HERO_HEIGHT = 240;

const destinations = [
  'Bali, Indonesia',
  'Tokyo, Japan',
  'Santorini, Greece',
  'Marrakech, Morocco',
  'Kyoto, Japan',
  'Amalfi Coast, Italy',
  'Cape Town, South Africa',
  'Reykjavik, Iceland',
  'Queenstown, New Zealand',
  'Lisbon, Portugal',
  'Maldives',
  'Swiss Alps, Switzerland',
  'Tulum, Mexico',
  'Dubai, UAE',
  'Barcelona, Spain',
];

const tripTypes = [
  { tripType: 'flight_stay', tripTypeLabel: 'Flight + Stay' },
  { tripType: 'villa', tripTypeLabel: 'Villa' },
  { tripType: 'experience', tripTypeLabel: 'Experience' },
];

const itineraryTemplates = [
  { title: 'Arrival', description: 'Land and settle in', icon: 'airplane' },
  { title: 'Explore', description: 'Guided city tour', icon: 'map' },
  { title: 'Adventure', description: 'Outdoor activity', icon: 'figure.hiking' },
  { title: 'Culture', description: 'Local food and markets', icon: 'fork.knife' },
  { title: 'Relax', description: 'Spa and beach time', icon: 'beach.umbrella' },
  { title: 'Departure', description: 'Farewell breakfast', icon: 'suitcase' },
];

const bundles = [];

for (let i = 0; i < 110; i++) {
  const dest = destinations[i % destinations.length];
  const type = tripTypes[i % tripTypes.length];
  const durationDays = 3 + (i % 12);
  const price = 799 + (i % 20) * 125 + (i % 3) * 50;
  const rating = Math.round((40 + (i % 11)) * 10) / 100;
  const imageSeed = (i % 12) + 1;
  const itineraryCount = 3 + (i % 2);

  const itinerary = Array.from({ length: itineraryCount }, (_, dayIndex) => {
    const template = itineraryTemplates[(dayIndex + i) % itineraryTemplates.length];
    return {
      day: dayIndex + 1,
      title: template.title,
      description: template.description,
      icon: template.icon,
    };
  });

  bundles.push({
    id: `bundle-${String(i + 1).padStart(3, '0')}`,
    destination: dest,
    tripType: type.tripType,
    tripTypeLabel: type.tripTypeLabel,
    price,
    currency: 'USD',
    durationDays,
    rating,
    heroImage: {
      uri: `https://picsum.photos/seed/crew${imageSeed}/${HERO_WIDTH}/${HERO_HEIGHT}`,
      width: HERO_WIDTH,
      height: HERO_HEIGHT,
    },
    itinerary,
  });
}

const outPath = path.join(__dirname, '../src/data/feed.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(bundles, null, 2));
console.log(`Generated ${bundles.length} bundles → ${outPath}`);
