/**
 * Qibla calculations, coordinates and helper utilities
 */

export const KAABA_COORDINATES = {
  lat: 21.422487,
  lng: 39.826206,
};

export interface CityPreset {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export const POPULAR_CITIES: CityPreset[] = [
  { name: 'Makkah', country: 'Saudi Arabia', lat: 21.4225, lng: 39.8262 },
  { name: 'Madinah', country: 'Saudi Arabia', lat: 24.4672, lng: 39.6111 },
  { name: 'Jerusalem', country: 'Palestine', lat: 31.7767, lng: 35.2345 },
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
  { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784 },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.006 },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { name: 'Karachi', country: 'Pakistan', lat: 24.8607, lng: 67.0011 },
  { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lng: 90.4125 },
  { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456 },
  { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.139, lng: 101.6869 },
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473 },
];

/**
 * Calculates Great Circle initial bearing from user location to Kaaba in degrees (0 - 360)
 */
export function calculateQiblaBearing(lat: number, lng: number): number {
  const phi1 = (lat * Math.PI) / 180;
  const phi2 = (KAABA_COORDINATES.lat * Math.PI) / 180;
  const deltaLambda = ((KAABA_COORDINATES.lng - lng) * Math.PI) / 180;

  const y = Math.sin(deltaLambda);
  const x =
    Math.cos(phi1) * Math.tan(phi2) -
    Math.sin(phi1) * Math.cos(deltaLambda);

  let qibla = (Math.atan2(y, x) * 180) / Math.PI;
  qibla = (qibla + 360) % 360;

  return Math.round(qibla * 10) / 10;
}

/**
 * Calculates distance from user coordinates to Kaaba in kilometers
 */
export function calculateDistanceToKaaba(lat: number, lng: number): { km: number; miles: number } {
  const R = 6371; // Earth radius in km
  const dLat = ((KAABA_COORDINATES.lat - lat) * Math.PI) / 180;
  const dLng = ((KAABA_COORDINATES.lng - lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat * Math.PI) / 180) *
      Math.cos((KAABA_COORDINATES.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = Math.round(R * c);
  const miles = Math.round(km * 0.621371);

  return { km, miles };
}

/**
 * Compass cardinal direction name from degrees
 */
export function getCompassDirection(deg: number): { en: string; ar: string } {
  const directions = [
    { en: 'N', ar: 'شمال' },
    { en: 'NNE', ar: 'شمال شرقي' },
    { en: 'NE', ar: 'شمال شرق' },
    { en: 'ENE', ar: 'شرق شمالي' },
    { en: 'E', ar: 'شرق' },
    { en: 'ESE', ar: 'شرق جنوبي' },
    { en: 'SE', ar: 'جنوب شرق' },
    { en: 'SSE', ar: 'جنوب شرقي' },
    { en: 'S', ar: 'جنوب' },
    { en: 'SSW', ar: 'جنوب غربي' },
    { en: 'SW', ar: 'جنوب غرب' },
    { en: 'WSW', ar: 'غرب جنوبي' },
    { en: 'W', ar: 'غرب' },
    { en: 'WNW', ar: 'غرب شمالي' },
    { en: 'NW', ar: 'شمال غرب' },
    { en: 'NNW', ar: 'شمال غربي' },
  ];

  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}
