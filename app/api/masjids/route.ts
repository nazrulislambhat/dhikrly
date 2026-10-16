import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface OsmElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    'name:en'?: string;
    'name:ar'?: string;
    'name:ur'?: string;
    'addr:street'?: string;
    'addr:city'?: string;
    'addr:suburb'?: string;
    'addr:postcode'?: string;
    female?: string;
    wheelchair?: string;
    wudu?: string;
    parking?: string;
    jummah?: string;
    [key: string]: string | undefined;
  };
}

export interface MasjidItem {
  id: string;
  name: string;
  nameAr?: string;
  address: string;
  lat: number;
  lng: number;
  distance: number; // in km
  bearing: number; // in degrees
  cardinal: string; // 'N', 'NE', etc.
  facilities: string[];
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

function getCardinalDirection(angle: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8;
  return directions[index];
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');
  const radiusKmStr = searchParams.get('radius') ?? '5';

  if (!latStr || !lngStr) {
    return NextResponse.json(
      { error: 'Coordinates (lat, lng) are required' },
      { status: 400 },
    );
  }

  const userLat = parseFloat(latStr);
  const userLng = parseFloat(lngStr);
  let radiusKm = parseFloat(radiusKmStr);
  if (isNaN(radiusKm) || radiusKm <= 0) radiusKm = 5;
  if (radiusKm > 30) radiusKm = 30; // Max 30km radius

  if (isNaN(userLat) || isNaN(userLng) || userLat < -90 || userLat > 90 || userLng < -180 || userLng > 180) {
    return NextResponse.json({ error: 'Invalid latitude or longitude coordinates' }, { status: 400 });
  }

  const radiusMeters = Math.round(radiusKm * 1000);
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${userLat},${userLng});
      way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${userLat},${userLng});
      relation["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${userLat},${userLng});
    );
    out center 40;
  `;

  let elements: OsmElement[] = [];
  let fetchSuccess = false;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'DhikrlyApp/2.2 (https://dhikrly.app; contact@dhikrly.app)',
        },
        body: new URLSearchParams({ data: query }).toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.elements)) {
          elements = data.elements;
          fetchSuccess = true;
          break;
        }
      }
    } catch {
      // Try next endpoint
      continue;
    }
  }

  // If Overpass endpoints failed or were slow, fallback to Nominatim search
  if (!fetchSuccess || elements.length === 0) {
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=mosque&lat=${userLat}&lon=${userLng}&limit=30&addressdetails=1`;
      const nomRes = await fetch(nomUrl, {
        headers: {
          'User-Agent': 'DhikrlyApp/2.2 (https://dhikrly.app; contact@dhikrly.app)',
        },
      });

      if (nomRes.ok) {
        const nomData = await nomRes.json();
        if (Array.isArray(nomData)) {
          for (const item of nomData) {
            elements.push({
              type: 'node',
              id: item.place_id || Math.floor(Math.random() * 1000000),
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              tags: {
                name: item.name || item.display_name?.split(',')[0],
                'addr:street': item.address?.road || item.address?.suburb,
                'addr:city': item.address?.city || item.address?.town,
              },
            });
          }
          fetchSuccess = true;
        }
      }
    } catch {
      // Ignore
    }
  }

  const masjids: MasjidItem[] = [];
  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat ?? 0;
    const lng = el.lon ?? el.center?.lon ?? 0;
    if (!lat || !lng) continue;

    const dist = haversineDistance(userLat, userLng, lat, lng);
    // Filter out elements beyond search radius
    if (dist > radiusKm * 1.15) continue;

    const brng = calculateBearing(userLat, userLng, lat, lng);
    const cardinal = getCardinalDirection(brng);

    const facilities: string[] = ['Jumu‘ah Prayers', 'Wuḍū Area'];
    if (el.tags?.female === 'yes' || el.tags?.['female:prayer_room'] === 'yes') {
      facilities.push("Women's Section");
    }
    if (el.tags?.wheelchair === 'yes') {
      facilities.push('Wheelchair Accessible');
    }
    if (el.tags?.parking === 'yes') {
      facilities.push('Parking Area');
    }
    if (el.tags?.wudu === 'yes' || el.tags?.['wudu:foot_bath'] === 'yes') {
      if (!facilities.includes('Wuḍū Area')) facilities.push('Wuḍū Area');
    }

    const street = el.tags?.['addr:street'];
    const city = el.tags?.['addr:city'] || el.tags?.['addr:suburb'];
    const address = street ? (city ? `${street}, ${city}` : street) : city || 'Masjid Premises';

    const name =
      el.tags?.['name:en'] ||
      el.tags?.name ||
      el.tags?.['name:ur'] ||
      'Local Masjid';

    masjids.push({
      id: String(el.id),
      name,
      nameAr: el.tags?.['name:ar'],
      address,
      lat,
      lng,
      distance: Math.round(dist * 100) / 100,
      bearing: Math.round(brng),
      cardinal,
      facilities,
    });
  }

  masjids.sort((a, b) => a.distance - b.distance);

  return NextResponse.json(
    {
      source: fetchSuccess ? 'openstreetmap' : 'fallback',
      count: masjids.length,
      radiusKm,
      masjids,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
