import { describe, expect, it } from 'vitest';
import { GET, isMuslimPrayerSpace } from './route';

describe('/api/masjids route & filtering', () => {
  describe('isMuslimPrayerSpace filter unit tests', () => {
    it('strictly rejects Hindu temples, mandirs, and ashrams', () => {
      expect(
        isMuslimPrayerSpace({
          name: 'Shri Ram Mandir',
          class: 'amenity',
          type: 'place_of_worship',
          address: { road: 'Mosque Road' },
        }),
      ).toBe(false);

      expect(
        isMuslimPrayerSpace({
          name: 'Hanuman Temple',
          class: 'amenity',
          type: 'place_of_worship',
        }),
      ).toBe(false);

      expect(
        isMuslimPrayerSpace({
          name: 'Shiv Mandir',
          extratags: { religion: 'hindu' },
          class: 'amenity',
          type: 'place_of_worship',
        }),
      ).toBe(false);

      expect(
        isMuslimPrayerSpace({
          name: 'ISKCON Temple',
          class: 'amenity',
          type: 'place_of_worship',
        }),
      ).toBe(false);

      expect(
        isMuslimPrayerSpace({
          name: 'Radha Krishna Dham',
          class: 'amenity',
          type: 'place_of_worship',
        }),
      ).toBe(false);

      expect(
        isMuslimPrayerSpace({
          name: 'हनुमान मंदिर',
          class: 'amenity',
          type: 'place_of_worship',
        }),
      ).toBe(false);
    });

    it('strictly rejects Christian churches and cathedrals', () => {
      expect(
        isMuslimPrayerSpace({
          name: 'St. Mary Church',
          class: 'amenity',
          type: 'place_of_worship',
        }),
      ).toBe(false);

      expect(
        isMuslimPrayerSpace({
          name: 'Sacred Heart Cathedral',
          extratags: { religion: 'christian' },
          class: 'amenity',
          type: 'place_of_worship',
        }),
      ).toBe(false);

      expect(
        isMuslimPrayerSpace({
          name: 'Holy Trinity Parish Chapel',
          class: 'amenity',
          type: 'place_of_worship',
        }),
      ).toBe(false);
    });

    it('strictly rejects Sikh Gurdwaras', () => {
      expect(
        isMuslimPrayerSpace({
          name: 'Gurudwara Bangla Sahib',
          class: 'amenity',
          type: 'place_of_worship',
        }),
      ).toBe(false);

      expect(
        isMuslimPrayerSpace({
          name: 'Gurdwara Sri Guru Singh Sabha',
          extratags: { religion: 'sikh' },
          class: 'amenity',
          type: 'place_of_worship',
        }),
      ).toBe(false);
    });

    it('strictly rejects Jain and Buddhist places', () => {
      expect(
        isMuslimPrayerSpace({
          name: 'Shri Parshvanath Jain Derasar',
          class: 'amenity',
          type: 'place_of_worship',
        }),
      ).toBe(false);

      expect(
        isMuslimPrayerSpace({
          name: 'Buddhist Vihara Pagoda',
          class: 'amenity',
          type: 'place_of_worship',
        }),
      ).toBe(false);
    });

    it('strictly rejects non-worship amenities (boards, ruins, bus stops)', () => {
      expect(
        isMuslimPrayerSpace({
          name: 'Mosque',
          class: 'information',
          type: 'board',
        }),
      ).toBe(false);

      expect(
        isMuslimPrayerSpace({
          name: 'Mosque',
          class: 'historic',
          type: 'archaeological_site',
        }),
      ).toBe(false);

      expect(
        isMuslimPrayerSpace({
          name: 'The East London Mosque Stop',
          class: 'highway',
          type: 'bus_stop',
        }),
      ).toBe(false);
    });

    it('accepts authentic Muslim masjids, mosques, and prayer spaces', () => {
      expect(
        isMuslimPrayerSpace({
          name: 'Jama Masjid',
          class: 'amenity',
          type: 'place_of_worship',
          extratags: { religion: 'muslim' },
        }),
      ).toBe(true);

      expect(
        isMuslimPrayerSpace({
          name: 'East London Mosque',
          class: 'amenity',
          type: 'place_of_worship',
        }),
      ).toBe(true);

      expect(
        isMuslimPrayerSpace({
          name: 'Masjid Al-Noor',
          class: 'amenity',
          type: 'place_of_worship',
        }),
      ).toBe(true);

      expect(
        isMuslimPrayerSpace({
          name: 'مسجد قباء',
          class: 'amenity',
          type: 'place_of_worship',
        }),
      ).toBe(true);

      expect(
        isMuslimPrayerSpace({
          name: 'Madina Islamic Center Prayer Hall',
          class: 'amenity',
          type: 'place_of_worship',
        }),
      ).toBe(true);

      expect(
        isMuslimPrayerSpace({
          name: 'Markaz Bilal',
          class: 'amenity',
          type: 'place_of_worship',
        }),
      ).toBe(true);

      expect(
        isMuslimPrayerSpace({
          name: 'Mosque',
          class: 'amenity',
          type: 'place_of_worship',
        }),
      ).toBe(true);
    });

    it('does not falsely reject valid places with word substrings', () => {
      expect(
        isMuslimPrayerSpace({
          name: 'Ramadan Islamic Center',
          class: 'amenity',
          type: 'place_of_worship',
        }),
      ).toBe(true);
    });
  });

  describe('GET endpoint', () => {
    it('rejects missing coordinates with 400', async () => {
      const req = new Request('http://localhost/api/masjids');
      const res = await GET(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('rejects invalid coordinates with 400', async () => {
      const req = new Request('http://localhost/api/masjids?lat=999&lng=999');
      const res = await GET(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid');
    });

    it('returns ONLY authentic Muslim masjids and zero non-Muslim places', async () => {
      // Delhi coordinates: 28.6139, 77.2090
      const req = new Request('http://localhost/api/masjids?lat=28.6139&lng=77.2090&radius=5');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.masjids)).toBe(true);
      expect(data.count).toBeGreaterThan(0);

      // Verify that NO returned masjid contains non-Muslim temple/mandir/church terms
      const forbiddenTerms = [
        'mandir',
        'temple',
        'church',
        'gurdwara',
        'cathedral',
        'ashram',
        'shri ram',
        'hanuman',
        'shiva',
        'durga',
      ];

      for (const masjid of data.masjids) {
        const nameLower = masjid.name.toLowerCase();
        for (const term of forbiddenTerms) {
          expect(nameLower).not.toContain(term);
        }
      }
    }, 20000);
  });
});
