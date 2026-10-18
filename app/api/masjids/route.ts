import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export interface OsmElement {
  type: string;
  id: number | string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  class?: string;
  tags?: {
    name?: string;
    'name:en'?: string;
    'name:ar'?: string;
    'name:ur'?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
    'addr:suburb'?: string;
    'addr:postcode'?: string;
    amenity?: string;
    building?: string;
    religion?: string;
    female?: string;
    'female:prayer_room'?: string;
    'female:wudu'?: string;
    women?: string;
    wheelchair?: string;
    wudu?: string;
    'wudu:foot_bath'?: string;
    parking?: string;
    jummah?: string;
    friday_prayer?: string;
    toilets?: string;
    [key: string]: string | undefined;
  };
}

export interface NominatimItem {
  place_id?: number | string;
  osm_id?: number | string;
  osm_type?: string;
  lat?: string | number;
  lon?: string | number;
  class?: string;
  type?: string;
  name?: string;
  display_name?: string;
  namedetails?: {
    'name:en'?: string;
    'name:ar'?: string;
    'name:ur'?: string;
    [key: string]: string | undefined;
  };
  address?: {
    amenity?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    quarter?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    [key: string]: string | undefined;
  };
  extratags?: {
    religion?: string;
    wheelchair?: string;
    female?: string;
    'female:prayer_room'?: string;
    'female:wudu'?: string;
    parking?: string;
    wudu?: string;
    jummah?: string;
    [key: string]: string | undefined;
  };
  tags?: {
    religion?: string;
    name?: string;
    'name:en'?: string;
    'name:ar'?: string;
    'name:ur'?: string;
    amenity?: string;
    building?: string;
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
  googleMapsUrl: string;
  appleMapsUrl: string;
}

// Religious traditions to exclude completely
const NON_MUSLIM_RELIGIONS = new Set([
  'hindu',
  'hinduism',
  'christian',
  'christianity',
  'sikh',
  'sikhism',
  'jain',
  'jainism',
  'buddhist',
  'buddhism',
  'jewish',
  'judaism',
  'bahai',
  'baha\'i',
  'shinto',
  'taoist',
  'taoism',
  'zoroastrian',
  'zoroastrianism',
  'pagan',
  'animist',
]);

// Non-worship classes and types from OpenStreetMap (signs, ruins, transport, businesses)
const REJECTED_OSM_CLASSES = new Set([
  'information',
  'highway',
  'shop',
  'commercial',
  'office',
  'craft',
  'tourism',
  'railway',
  'leisure',
]);

const REJECTED_OSM_TYPES = new Set([
  'board',
  'guidepost',
  'map',
  'bus_stop',
  'platform',
  'stop_position',
  'archaeological_site',
  'ruins',
  'monument',
  'memorial',
  'station',
  'attraction',
  'hotel',
  'guest_house',
  'restaurant',
  'cafe',
]);

// Word-token keywords in name or amenity indicating non-Muslim places of worship
const NON_MUSLIM_WORD_KEYWORDS = [
  // Hindu deities, temples & traditions
  'temple',
  'mandir',
  'mandiram',
  'kovil',
  'devasthanam',
  'shri',
  'sri',
  'swami',
  'devi',
  'shiva',
  'shiv',
  'mahadev',
  'hanuman',
  'durga',
  'ganesh',
  'ganpati',
  'krishna',
  'radha',
  'ram mandir',
  'ram temple',
  'shri ram',
  'sri ram',
  'mata',
  'sanatan',
  'dham',
  'ashram',
  'balaji',
  'samadhi',
  'matha',
  'peeth',
  'tirath',
  'teerth',
  'bhagwan',
  'iskcon',
  'vaishno',
  'kali',
  'jagannath',
  'sai baba',
  'ayappa',
  'murugan',
  'venkateshwara',
  'brahma',
  'vishnu',
  // Christian churches, chapels & saints
  'church',
  'cathedral',
  'chapel',
  'basilica',
  'parish',
  'synagogue',
  'adventist',
  'baptist',
  'methodist',
  'presbyterian',
  'lutheran',
  'pentecostal',
  'anglican',
  'evangelical',
  'orthodox',
  'convent',
  'monastery',
  // Sikh gurdwaras
  'gurdwara',
  'gurudwara',
  'sahib',
  'singh sabha',
  // Jain places
  'jain',
  'derasar',
  'tirthankar',
  'digambar',
  'shwetambar',
  // Buddhist places
  'buddhist',
  'vihara',
  'vihare',
  'pagoda',
  'stupa',
  'gompa',
];

// Non-Latin / regional script keywords indicating non-Muslim places
const NON_MUSLIM_SCRIPT_KEYWORDS = [
  'मंदिर',
  'मंदिरम',
  'गुरुद्वारा',
  'चर्च',
  'आश्रम',
  'धाम',
  'शिवालय',
  'देवालय',
  'मठ',
];

// Positive indicators for Muslim mosques and Islamic prayer spaces
const MUSLIM_POSITIVE_KEYWORDS = [
  'masjid',
  'mosque',
  'jami',
  'jamia',
  'jama',
  'markaz',
  'musalla',
  'musallah',
  'idgah',
  'eidgah',
  'namazgah',
  'khanqah',
  'imambara',
  'imambargah',
  'dargah',
  'islamic',
  'islam',
  'muslim',
  'prayer room',
  'prayer hall',
  'prayer space',
  'ahl-e-hadith',
  'deoband',
  'barelvi',
  'sunni',
  'shia',
  // Arabic / Urdu / Devanagari scripts
  'مسجد',
  'جامع',
  'مصلى',
  'حسينية',
  'مركز',
  'خانقاه',
  'حسینیہ',
  'درگاہ',
  'نماز',
  'إسلامي',
  'اسلامی',
  'عيدگاه',
  'امام بارگاه',
  'मस्जिद',
  'ईदगाह',
  'दरगाह',
  'खानक़ाह',
  'इमामबाड़ा',
];

/**
 * Strict validator to ensure an OpenStreetMap/Nominatim item is truly an authentic
 * Muslim mosque, masjid, musalla, or Islamic prayer space, filtering out all temples,
 * churches, gurdwaras, ruins, and non-worship amenities.
 */
export function isMuslimPrayerSpace(item: NominatimItem): boolean {
  const itemClass = (item.class || '').toLowerCase();
  const itemType = (item.type || '').toLowerCase();

  // 1. Exclude non-worship classes (tourism boards, bus stops, shops, commercial)
  if (itemClass && REJECTED_OSM_CLASSES.has(itemClass)) {
    const isExplicitMosque =
      itemType === 'mosque' ||
      item.extratags?.religion === 'muslim' ||
      item.tags?.religion === 'muslim';
    if (!isExplicitMosque) return false;
  }

  // 2. Exclude non-worship types (boards, bus stops, ruins, etc.)
  if (itemType && REJECTED_OSM_TYPES.has(itemType)) {
    return false;
  }

  // 3. Religion tag verification: if explicit religion tag is non-Muslim, reject immediately
  const religion = (
    item.extratags?.religion ||
    item.tags?.religion ||
    ''
  ).toLowerCase().trim();

  if (religion) {
    if (NON_MUSLIM_RELIGIONS.has(religion)) {
      return false;
    }
    if (religion !== 'muslim' && religion !== 'islam' && religion !== 'islamic') {
      return false;
    }
  }

  // 4. Blacklist check on name and amenity
  const rawName =
    item.name ||
    item.tags?.['name:en'] ||
    item.tags?.name ||
    '';
  const rawAmenity =
    item.address?.amenity ||
    item.tags?.amenity ||
    '';

  const combined = `${rawName} ${rawAmenity}`;
  // Normalized word tokens for robust boundary matching
  const normalizedWords = ` ${combined.toLowerCase().replace(/[^a-z0-9]/g, ' ')} `;

  for (const kw of NON_MUSLIM_WORD_KEYWORDS) {
    if (normalizedWords.includes(` ${kw} `)) {
      return false;
    }
  }

  for (const kw of NON_MUSLIM_SCRIPT_KEYWORDS) {
    if (combined.includes(kw)) {
      return false;
    }
  }

  // 5. Positive qualification: must satisfy at least one Islamic prayer space indicator
  if (religion === 'muslim' || religion === 'islam' || religion === 'islamic') {
    return true;
  }

  if (
    itemType === 'mosque' ||
    item.tags?.building === 'mosque' ||
    (itemClass === 'building' && itemType === 'mosque')
  ) {
    return true;
  }

  // Check positive keywords in name or amenity
  const combinedLower = combined.toLowerCase();
  for (const kw of MUSLIM_POSITIVE_KEYWORDS) {
    if (combinedLower.includes(kw) || combined.includes(kw)) {
      return true;
    }
  }

  return false;
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
  if (radiusKm > 50) radiusKm = 50; // Max 50km radius

  if (isNaN(userLat) || isNaN(userLng) || userLat < -90 || userLat > 90 || userLng < -180 || userLng > 180) {
    return NextResponse.json({ error: 'Invalid latitude or longitude coordinates' }, { status: 400 });
  }

  // Calculate precise bounding box for Nominatim viewbox search
  // 1 deg latitude ≈ 111 km; 1 deg longitude ≈ 111 * cos(lat) km
  const latDelta = (radiusKm * 1.15) / 111.0;
  const cosLat = Math.cos((userLat * Math.PI) / 180);
  const lonDelta = (radiusKm * 1.15) / (111.0 * Math.max(0.1, Math.abs(cosLat)));

  const minLon = (userLng - lonDelta).toFixed(4);
  const maxLon = (userLng + lonDelta).toFixed(4);
  const minLat = (userLat - latDelta).toFixed(4);
  const maxLat = (userLat + latDelta).toFixed(4);

  // Nominatim viewbox format: left,top,right,bottom -> minLon,maxLat,maxLon,minLat
  const viewbox = `${minLon},${maxLat},${maxLon},${minLat}`;

  const elements: OsmElement[] = [];

  // Query Nominatim bounded search with multiple targeted Islamic search terms in parallel
  const searchTerms = ['mosque', 'masjid', 'مسجد', 'jama masjid', 'islamic center'];
  const fetchPromises = searchTerms.map(async (term) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&viewbox=${viewbox}&bounded=1&limit=40&addressdetails=1&extratags=1`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'DhikrlyApp/2.3 (https://dhikrly.app; contact@dhikrly.app)',
          Referer: 'https://dhikrly.app',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data as NominatimItem[];
        }
      }
    } catch {
      // Ignore individual search failures
    }
    return [] as NominatimItem[];
  });

  const searchResults = await Promise.all(fetchPromises);
  for (const items of searchResults) {
    for (const item of items) {
      if (!item.lat || !item.lon) continue;
      // STRICT FILTER: Only allow authentic Muslim prayer spaces
      if (!isMuslimPrayerSpace(item)) continue;

      elements.push({
        type: item.osm_type || 'node',
        id: item.place_id ? `nom_${item.place_id}` : `nom_${item.osm_id || Math.random()}`,
        lat: typeof item.lat === 'string' ? parseFloat(item.lat) : item.lat,
        lon: typeof item.lon === 'string' ? parseFloat(item.lon) : item.lon,
        class: item.class,
        tags: {
          name: item.name || item.address?.amenity || item.display_name?.split(',')[0],
          'name:en': item.namedetails?.['name:en'] || item.name,
          'name:ar': item.namedetails?.['name:ar'],
          'name:ur': item.namedetails?.['name:ur'],
          'addr:street': item.address?.road || item.address?.neighbourhood,
          'addr:city': item.address?.city || item.address?.town || item.address?.village || item.address?.county,
          'addr:suburb': item.address?.suburb || item.address?.quarter,
          'addr:postcode': item.address?.postcode,
          amenity: item.address?.amenity,
          wheelchair: item.extratags?.wheelchair,
          female: item.extratags?.female || item.extratags?.['female:prayer_room'],
          parking: item.extratags?.parking,
          wudu: item.extratags?.wudu,
          jummah: item.extratags?.jummah,
          religion: item.extratags?.religion,
        },
      });
    }
  }

  // Also try Overpass API with a short timeout as an enhancement if available
  try {
    const radiusMeters = Math.round(radiusKm * 1000);
    const overpassQuery = `
      [out:json][timeout:4];
      (
        node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${userLat},${userLng});
        way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${userLat},${userLng});
        node["building"="mosque"](around:${radiusMeters},${userLat},${userLng});
        way["building"="mosque"](around:${radiusMeters},${userLat},${userLng});
      );
      out center 30;
    `;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const opRes = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'DhikrlyApp/2.3 (https://dhikrly.app; contact@dhikrly.app)',
        Referer: 'https://dhikrly.app',
      },
      body: new URLSearchParams({ data: overpassQuery }).toString(),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (opRes.ok) {
      const opData = await opRes.json();
      if (Array.isArray(opData.elements)) {
        for (const el of opData.elements) {
          if (isMuslimPrayerSpace(el)) {
            elements.push(el);
          }
        }
      }
    }
  } catch {
    // Overpass is optional; Nominatim provides robust data
  }

  const masjids: MasjidItem[] = [];
  const seenCoords = new Set<string>();

  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat ?? 0;
    const lng = el.lon ?? el.center?.lon ?? 0;
    if (!lat || !lng) continue;

    // Strict Muslim check safeguard
    if (!isMuslimPrayerSpace(el)) continue;

    const dist = haversineDistance(userLat, userLng, lat, lng);
    // Allow slight leeway for bounding box edge
    if (dist > radiusKm * 1.2) continue;

    // Deduplicate within ~40 meters
    const coordKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (seenCoords.has(coordKey)) continue;
    seenCoords.add(coordKey);

    const brng = calculateBearing(userLat, userLng, lat, lng);
    const cardinal = getCardinalDirection(brng);

    const facilities: string[] = ['Jumu‘ah Prayers', 'Wuḍū Area'];
    if (
      el.tags?.female === 'yes' ||
      el.tags?.['female:prayer_room'] === 'yes' ||
      el.tags?.['female:wudu'] === 'yes' ||
      el.tags?.women === 'yes'
    ) {
      facilities.push("Women's Section");
    }
    if (el.tags?.wheelchair === 'yes' || el.tags?.wheelchair === 'designated' || el.tags?.wheelchair === 'limited') {
      facilities.push('Wheelchair Accessible');
    }
    if (el.tags?.parking === 'yes' || el.tags?.amenity === 'parking') {
      facilities.push('Parking Area');
    }
    if (el.tags?.wudu === 'yes' || el.tags?.['wudu:foot_bath'] === 'yes' || el.tags?.toilets === 'yes') {
      if (!facilities.includes('Wuḍū Area')) facilities.push('Wuḍū Area');
    }

    const street = el.tags?.['addr:street'];
    const suburb = el.tags?.['addr:suburb'];
    const city = el.tags?.['addr:city'] || suburb;
    const streetAddress = street ? (suburb && suburb !== street ? `${street}, ${suburb}` : street) : suburb;
    const address = streetAddress
      ? city && city !== suburb
        ? `${streetAddress}, ${city}`
        : streetAddress
      : city || 'Masjid Premises';

    let rawName =
      el.tags?.['name:en'] ||
      el.tags?.name ||
      el.tags?.['name:ur'] ||
      el.tags?.amenity ||
      'Masjid';

    // If name is just generic "Mosque" or "Masjid", append neighborhood for clarity
    const lowerName = rawName.trim().toLowerCase();
    if (
      lowerName === 'mosque' ||
      lowerName === 'masjid' ||
      lowerName === 'place of worship' ||
      lowerName === 'place_of_worship'
    ) {
      const locParts = [street, suburb].filter(Boolean);
      const locLabel = locParts.length > 0 ? locParts.join(', ') : city;
      if (locLabel) {
        rawName = `Masjid (${locLabel})`;
      } else {
        rawName = `Masjid (${cardinal} · ${dist.toFixed(1)}km)`;
      }
    }

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${lat},${lng}&travelmode=walking`;
    const appleMapsUrl = `maps://maps.apple.com/?saddr=${userLat},${userLng}&daddr=${lat},${lng}&q=${encodeURIComponent(rawName)}&dirflg=w`;

    masjids.push({
      id: String(el.id),
      name: rawName,
      nameAr: el.tags?.['name:ar'],
      address,
      lat,
      lng,
      distance: Math.round(dist * 100) / 100,
      bearing: Math.round(brng),
      cardinal,
      facilities,
      googleMapsUrl,
      appleMapsUrl,
    });
  }

  masjids.sort((a, b) => a.distance - b.distance);

  return NextResponse.json(
    {
      source: 'openstreetmap',
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
