'use client';

import { useState } from 'react';
import type { SalahLocation } from '@/types/salah';
import { Compass, Landmark, LocateFixed, Navigation } from 'lucide-react';

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

  const card = dark ? 'bg-white/[0.04] border-white/[0.07]' : 'bg-white border-[var(--app-line)] shadow-sm';
  const muted = dark ? 'text-stone-400' : 'text-stone-500';

  const mapPoint = (masjid: Masjid) => {
    if (!location) return { x: 50, y: 50 };
    const dxKm = (masjid.lng - location.lng) * 111.32 * Math.cos((location.lat * Math.PI) / 180);
    const dyKm = (location.lat - masjid.lat) * 110.574;
    return {
      x: Math.max(9, Math.min(91, 50 + (dxKm / 3) * 38)),
      y: Math.max(12, Math.min(88, 50 + (dyKm / 3) * 38)),
    };
  };

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
    <div className={`rounded-3xl border p-5 sm:p-6 ${card}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`grid h-10 w-10 place-items-center rounded-xl ${dark ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50 text-emerald-800'}`} aria-hidden="true">
            <Landmark className="h-5 w-5" />
          </span>
          <div>
            <h3 className={`font-serif text-base font-semibold ${dark ? 'text-stone-100' : 'text-stone-900'}`}>
              Masjids near you
            </h3>
            <p className={`mt-0.5 text-xs ${muted}`}>Find a place to pray in congregation</p>
          </div>
        </div>
        {location && (
          <button
            onClick={searchMasjids}
            disabled={loading}
            className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all active:scale-95 disabled:opacity-60 ${
              dark ? 'bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/25' : 'bg-emerald-800 text-white hover:bg-emerald-900'
            }`}
          >
            {loading ? <Compass className="h-4 w-4 animate-pulse" aria-hidden="true" /> : <LocateFixed className="h-4 w-4" aria-hidden="true" />}
            {loading ? 'Searching…' : searched ? 'Refresh map' : 'Find masjids'}
          </button>
        )}
      </div>

      {!location && (
        <p className={`text-[12px] ${muted}`}>Set your location first to find nearby masjids.</p>
      )}

      {error && (
        <p role="status" className={`mb-3 rounded-xl border px-3 py-2 text-xs ${dark ? 'border-red-400/20 bg-red-400/5 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`}>{error}</p>
      )}

      <div className={`relative mb-4 h-64 overflow-hidden rounded-2xl border sm:h-80 ${dark ? 'border-white/10 bg-[#17251f]' : 'border-emerald-900/10 bg-[#edf4ec]'}`} role="img" aria-label={masjids.length ? `Map showing your location and ${masjids.length} nearby masjids` : 'Map preview for nearby masjids'}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 360" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">
          <path d="M-20 86 180 138 354 82 630 142M-25 263 166 215 355 273 630 214M120 -20 196 90 156 190 258 380M425 -20 363 92 432 187 394 380" stroke={dark ? '#375347' : '#d3e1d4'} strokeWidth="38" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M-20 86 180 138 354 82 630 142M-25 263 166 215 355 273 630 214M120 -20 196 90 156 190 258 380M425 -20 363 92 432 187 394 380" stroke={dark ? '#1e332a' : '#fbfcf7'} strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 36h76v36H14zm396 35h60v34h-60zM61 283h70v37H61zm411-51h78v44h-78zM245 18h64v34h-64zM267 303h74v34h-74z" fill={dark ? '#243b30' : '#dce9d9'} />
          <path d="M0 175h600M300 0v360" stroke={dark ? '#466457' : '#d6e3d3'} strokeWidth="2" strokeDasharray="5 8" />
        </svg>
        <div className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-emerald-800 text-white shadow-lg dark:border-[#243b30] dark:bg-emerald-300 dark:text-emerald-950" aria-label="Your location">
          <LocateFixed className="h-5 w-5" aria-hidden="true" />
        </div>
        {masjids.slice(0, 8).map((masjid) => {
          const point = mapPoint(masjid);
          return (
            <span
              key={masjid.placeId}
              className="absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-white text-emerald-800 shadow-md dark:border-[#365447] dark:bg-[#20382d] dark:text-emerald-200"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              title={`${masjid.name} · ${masjid.distance.toFixed(1)} km`}
              aria-label={`${masjid.name}, ${masjid.distance.toFixed(1)} kilometers away`}
            >
              <Landmark className="h-4 w-4" aria-hidden="true" />
            </span>
          );
        })}
        <div className={`absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-medium shadow-sm backdrop-blur ${dark ? 'border-white/10 bg-[#14211e]/90 text-stone-200' : 'border-white/70 bg-white/90 text-stone-700'}`}>
          <span className="h-2 w-2 rounded-full bg-emerald-700 dark:bg-emerald-300" />
          {masjids.length ? `${masjids.length} places · within 3 km` : location ? 'Your area · 3 km radius' : 'Set your location to explore'}
        </div>
        <span className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl shadow-sm ${dark ? 'bg-[#14211e]/90 text-emerald-200' : 'bg-white/90 text-emerald-800'}`} aria-hidden="true">
          <Navigation className="h-4 w-4" />
        </span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4">
          <span className={`h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${dark ? 'text-amber-400' : 'text-amber-600'}`} />
          <span className={`text-[12px] ${muted}`}>Finding nearby masjids…</span>
        </div>
      )}

      {!loading && masjids.length > 0 && (
        <div className="space-y-2">
          {masjids.map((m) => (
            <div
              key={m.placeId}
              className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${
                dark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-[var(--app-line)] bg-stone-50/80'
              }`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                dark ? 'bg-emerald-400/15 text-emerald-200' : 'bg-emerald-50 text-emerald-800'
              }`}>
                <Landmark className="h-4 w-4" aria-hidden="true" />
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
                className={`inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all ${
                  dark ? 'bg-white/5 text-stone-300 hover:text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Maps <Navigation className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
