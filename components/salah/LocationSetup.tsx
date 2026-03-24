'use client';

import { useState } from 'react';
import type { SalahLocation } from '@/types/salah';

interface LocationSetupProps {
  dark: boolean;
  onLocation: (loc: SalahLocation) => void;
}

const CITIES: SalahLocation[] = [
  { lat: 21.3891, lng: 39.8579, city: 'Makkah',    country: 'Saudi Arabia', timezone: 'Asia/Riyadh'   },
  { lat: 24.4672, lng: 39.6150, city: 'Madinah',   country: 'Saudi Arabia', timezone: 'Asia/Riyadh'   },
  { lat: 24.6877, lng: 46.7219, city: 'Riyadh',    country: 'Saudi Arabia', timezone: 'Asia/Riyadh'   },
  { lat: 25.2048, lng: 55.2708, city: 'Dubai',     country: 'UAE',          timezone: 'Asia/Dubai'    },
  { lat: 33.6844, lng: 73.0479, city: 'Islamabad', country: 'Pakistan',     timezone: 'Asia/Karachi'  },
  { lat: 24.8607, lng: 67.0011, city: 'Karachi',   country: 'Pakistan',     timezone: 'Asia/Karachi'  },
  { lat: 31.5204, lng: 74.3587, city: 'Lahore',    country: 'Pakistan',     timezone: 'Asia/Karachi'  },
  { lat: 32.5680, lng: 76.5760, city: 'Jammu',     country: 'India',        timezone: 'Asia/Kolkata'  },
  { lat: 28.6139, lng: 77.2090, city: 'Delhi',     country: 'India',        timezone: 'Asia/Kolkata'  },
  { lat: 19.0760, lng: 72.8777, city: 'Mumbai',    country: 'India',        timezone: 'Asia/Kolkata'  },
  { lat: 23.8103, lng: 90.4125, city: 'Dhaka',     country: 'Bangladesh',   timezone: 'Asia/Dhaka'    },
  { lat: 33.3152, lng: 44.3661, city: 'Baghdad',   country: 'Iraq',         timezone: 'Asia/Baghdad'  },
  { lat: 30.0444, lng: 31.2357, city: 'Cairo',     country: 'Egypt',        timezone: 'Africa/Cairo'  },
  { lat: 34.0209, lng: -6.8416, city: 'Rabat',     country: 'Morocco',      timezone: 'Africa/Casablanca' },
  { lat: 36.8065, lng: 10.1815, city: 'Tunis',     country: 'Tunisia',      timezone: 'Africa/Tunis'  },
  { lat: 51.5074, lng: -0.1278, city: 'London',    country: 'UK',           timezone: 'Europe/London' },
  { lat: 40.7128, lng: -74.0060,city: 'New York',  country: 'USA',          timezone: 'America/New_York' },
  { lat: 34.0522, lng: -118.244,city: 'Los Angeles',country: 'USA',         timezone: 'America/Los_Angeles' },
  { lat: 43.6532, lng: -79.3832,city: 'Toronto',   country: 'Canada',       timezone: 'America/Toronto' },
  { lat: -33.8688,lng: 151.2093,city: 'Sydney',    country: 'Australia',    timezone: 'Australia/Sydney' },
  { lat: 3.1390,  lng: 101.6869,city: 'Kuala Lumpur',country:'Malaysia',    timezone: 'Asia/Kuala_Lumpur' },
  { lat: 1.3521,  lng: 103.8198,city: 'Singapore', country: 'Singapore',    timezone: 'Asia/Singapore' },
  { lat: 41.0082, lng: 28.9784, city: 'Istanbul',  country: 'Turkey',       timezone: 'Europe/Istanbul' },
];

export default function LocationSetup({ dark, onLocation }: LocationSetupProps) {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const filtered = search.length > 1
    ? CITIES.filter(c =>
        c.city.toLowerCase().includes(search.toLowerCase()) ||
        c.country.toLowerCase().includes(search.toLowerCase())
      )
    : CITIES;

  const handleGPS = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;
          // Reverse geocode using a free API
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || 'Your Location';
          const country = data.address?.country || '';
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          onLocation({ lat, lng, city, country, timezone });
        } catch {
          // Fall back to coords only
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          onLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, city: 'My Location', country: '', timezone });
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        setError('Location denied. Please select a city below.');
      },
      { timeout: 8000 }
    );
  };

  const panel = dark ? 'bg-[#0c1a2e]' : 'bg-stone-50';
  const card  = dark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-white border-stone-200 shadow-sm';
  const text  = dark ? 'text-stone-200' : 'text-stone-800';
  const muted = dark ? 'text-stone-500' : 'text-stone-400';
  const inp   = dark ? 'bg-white/5 border-white/10 text-stone-200 placeholder-stone-600' : 'bg-white border-stone-200 text-stone-700 placeholder-stone-400';

  return (
    <div className={`flex min-h-screen flex-col items-center justify-start px-4 py-12 ${panel}`}>
      <div className="mb-2 text-4xl">🕌</div>
      <h1 className={`font-serif text-2xl font-semibold ${dark ? 'text-amber-400' : 'text-amber-700'}`}>
        Set Your Location
      </h1>
      <p className={`mt-2 mb-8 text-center text-sm ${muted}`}>
        Needed for accurate prayer times
      </p>

      {/* GPS button */}
      <button
        onClick={handleGPS}
        disabled={loading}
        className={`mb-6 flex w-full max-w-sm items-center justify-center gap-3 rounded-2xl border py-3.5 text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-60 ${
          dark
            ? 'border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20'
            : 'border-amber-400/50 bg-amber-50 text-amber-700 hover:bg-amber-100'
        }`}
      >
        {loading
          ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          : '📍'}
        {loading ? 'Detecting location…' : 'Use my current location'}
      </button>

      {error && (
        <p className={`mb-4 text-center text-[12px] ${dark ? 'text-red-400' : 'text-red-500'}`}>{error}</p>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search city…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className={`mb-3 w-full max-w-sm rounded-xl border px-4 py-2.5 text-sm outline-none ${inp}`}
      />

      {/* City list */}
      <div className="w-full max-w-sm space-y-2">
        {filtered.slice(0, 12).map(city => (
          <button
            key={`${city.city}-${city.country}`}
            onClick={() => onLocation(city)}
            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all active:scale-[0.98] ${card} hover:border-amber-400/40`}
          >
            <div>
              <p className={`text-[13px] font-medium ${text}`}>{city.city}</p>
              <p className={`text-[11px] ${muted}`}>{city.country}</p>
            </div>
            <span className={`text-[11px] ${muted}`}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
