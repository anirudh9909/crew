export type TripType = 'flight_stay' | 'villa' | 'experience';

export interface DayHighlight {
  day: number;
  title: string;
  description: string;
  icon: string;
}

export interface TravelBundle {
  id: string;
  destination: string;
  tripType: TripType;
  tripTypeLabel: string;
  price: number;
  currency: string;
  durationDays: number;
  rating: number;
  heroImage: {
    uri: string;
    width: number;
    height: number;
  };
  itinerary: DayHighlight[];
}
