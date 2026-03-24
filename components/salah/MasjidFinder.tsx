'use client';

import { useState, useEffect } from 'react';
import type { SalahLocation } from '@/types/salah';

interface Masjid {
  name: string;
  vicinity: string;
  lat: number;
  lng: number;
  distance: number; // km
  placeId: string;
}

interface MasjidFinderProps {
  location: SalahLocation | null;
  dark: boolean;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MasjidFinder({ location, dark }: MasjidFinderProps) {
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const card = dark ? 'bg-white/[0.04] border-white/[0.07]' : 'bg-white border-stone-200 shadow-sm';
  const muted = dark ? 'text-stone-500' : 'text-stone-400';

  const searchMasjids = async () => {
    if (!location) return;
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      // Use Overpass API (OpenStreetMap) — free, no API key needed
      const query = `
        [out:json][timeout:15];
        (
          node["amenity"="place_of_worship"]["religion"="muslim"](around:3000,${location.lat},${location.lng});
          way["amenity"="place_of_worship"]["religion"="muslim"](around:3000,${location.lat},${location.lng});
        );
        out body center 15;
      `;
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      });
      const data = await res.json();

      const results: Masjid[] = (data.elements ?? [])
        .map((el: { type: string; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: { name?: string; 'name:en'?: string }; id: number }) => {
          const lat = el.lat ?? el.center?.lat ?? 0;
          const lng = el.lon ?? el.center?.lon ?? 0;
          return {
            name: el.tags?.['name:en'] || el.tags?.name || 'Masjid',
            vicinity: '',
            lat, lng,
            distance: haversine(location.lat, location.lng, lat, lng),
            placeId: String(el.id),
          };
        })
        .filter((m: Masjid) => m.lat && m.lng)
        .sort((a: Masjid, b: Masjid) => a.distance - b.distance)
        .slice(0, 10);

      setMasjids(results);
      if (results.length === 0) setError('No masjids found within 3km. Try expanding your search area.');
    } catch {
      setError('Could not search for masjids. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = (m: Masjid) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open(`maps://maps.apple.com/?q=${encodeURIComponent(m.name)}&ll=${m.lat},${m.lng}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.name)}&query_place_id=${m.placeId}&center=${m.lat},${m.lng}`, '_blank');
    }
  };

  return (
    <div className={`rounded-2xl border p-4 ${card}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`font-serif text-[15px] font-semibold ${dark ? 'text-stone-100' : 'text-stone-800'}`}>
          Nearby Masjids
        </h3>
        {location && (
          <button
            onClick={searchMasjids}
            disabled={loading}
            className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-all active:scale-95 disabled:opacity-60 ${
              dark ? 'bg-amber-400/15 text-amber-300 hover:bg-amber-400/25' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            {loading ? 'Searching…' : searched ? '↺ Refresh' : '📍 Find Masjids'}
          </button>
        )}
      </div>

      {!location && (
        <p className={`text-[12px] ${muted}`}>Set your location first to find nearby masjids.</p>
      )}

      {error && (
        <p className={`text-[12px] ${dark ? 'text-red-400' : 'text-red-500'}`}>{error}</p>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-4">
          <span className={`h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${dark ? 'text-amber-400' : 'text-amber-600'}`} />
          <span className={`text-[12px] ${muted}`}>Finding nearby masjids…</span>
        </div>
      )}

      {!loading && masjids.length > 0 && (
        <div className="space-y-2">
          {masjids.map((m, i) => (
            <div
              key={m.placeId}
              className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${
                dark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-stone-100 bg-stone-50'
              }`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${
                dark ? 'bg-amber-400/15 text-amber-400' : 'bg-amber-100 text-amber-700'
              }`}>
                🕌
              </span>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-[13px] font-medium ${dark ? 'text-stone-200' : 'text-stone-700'}`}>
                  {m.name}
                </p>
                <p className={`text-[10px] ${muted}`}>
                  {m.distance < 1
                    ? `${Math.round(m.distance * 1000)}m away`
                    : `${m.distance.toFixed(1)}km away`}
                </p>
              </div>
              <button
                onClick={() => openInMaps(m)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all ${
                  dark ? 'bg-white/5 text-stone-400 hover:text-stone-200' : 'bg-stone-100 text-stone-500 hover:text-stone-700'
                }`}
              >
                Maps →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
