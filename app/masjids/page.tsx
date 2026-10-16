'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Car,
  Compass,
  Footprints,
  Heart,
  Landmark,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  Star,
  Users,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { load, save, SETTINGS_KEY } from '@/lib/storage';
import { getDayLog, getSalahSettings, saveDayLog, saveSalahSettings } from '@/lib/salahStorage';
import { getTodayKey } from '@/lib/dates';
import type { SalahLocation } from '@/types/salah';
import { playCheck } from '@/lib/sounds';

interface Masjid {
  id: string;
  name: string;
  nameAr?: string;
  address: string;
  lat: number;
  lng: number;
  distance: number; // km
  bearing: number; // deg
  facilities: string[];
}

const FAVORITES_STORAGE_KEY = 'dhikrly_favorite_masjids_v1';

// Haversine distance formula
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Bearing between coordinates
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

export default function MasjidsPage() {
  const [dark, setDark] = useState<boolean>(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );

  const [location, setLocation] = useState<SalahLocation | null>(() => getSalahSettings().location);
  const [radiusKm, setRadiusKm] = useState<number>(3);
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'nearby' | 'favorites'>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedMasjidId, setSelectedMasjidId] = useState<string | null>(null);
  const [loggedStatus, setLoggedStatus] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      const savedFavs = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
    } catch {
      // Ignore
    }
  }, [dark]);

  // Request browser GPS
  const detectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let detectedCity = 'Current Location';

        // Attempt reverse geocoding for city name
        try {
          const revRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12`,
            { headers: { 'User-Agent': 'DhikrlyApp/2.2' } },
          );
          if (revRes.ok) {
            const revData = await revRes.json();
            detectedCity =
              revData.address?.suburb ||
              revData.address?.city ||
              revData.address?.town ||
              revData.address?.village ||
              'Current Location';
          }
        } catch {
          // Ignore reverse geocode failures
        }

        const newLoc: SalahLocation = {
          lat,
          lng,
          city: detectedCity,
          country: '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        };

        setLocation(newLoc);
        const s = getSalahSettings();
        saveSalahSettings({ ...s, location: newLoc });
        fetchNearbyMasjids(newLoc, radiusKm);
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) {
          setError('Location permission was denied. Please allow GPS access in your browser settings to find masjids near you.');
        } else if (err.code === 2) {
          setError('Position unavailable. Please check your network or GPS connection.');
        } else {
          setError('GPS location timed out. Tap "Find Masjids (GPS)" to try again.');
        }
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 60000 },
    );
  };

  const fetchNearbyMasjids = async (loc: SalahLocation, radius: number) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/masjids?lat=${loc.lat}&lng=${loc.lng}&radius=${radius}`);
      if (!res.ok) {
        throw new Error('Failed to fetch masjids');
      }

      const data = await res.json();
      const results: Masjid[] = data.masjids ?? [];

      setMasjids(results);
      if (results.length === 0) {
        setError(`No registered masjids found within ${radius}km of your location. Try expanding the search radius to 10km or 25km.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching masjids';
      setError(`Could not retrieve nearby masjids (${msg}). Tap "Find Nearby Masjids" to retry.`);
      setMasjids([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If we have a saved location, fetch nearby masjids. Otherwise auto-detect.
    if (location && location.lat && location.lng) {
      fetchNearbyMasjids(location, radiusKm);
    } else {
      detectLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusKm]);

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
    setFavorites(next);
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore
    }
  };

  const logJamahAtMasjid = (masjid: Masjid) => {
    playCheck();
    const today = getTodayKey();
    const cur = getDayLog(today);
    // Find next/current unprayed prayer or default to dhuhr/maghrib
    const updated = {
      ...cur,
      prayers: {
        ...cur.prayers,
        dhuhr: cur.prayers.dhuhr ?? 'jamah',
      },
    };
    saveDayLog(updated);
    setLoggedStatus(`Logged Jamā‘ah prayer at ${masjid.name}!`);
    setTimeout(() => setLoggedStatus(null), 3000);
  };

  const openNavigation = (m: Masjid) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open(`maps://maps.apple.com/?q=${encodeURIComponent(m.name)}&ll=${m.lat},${m.lng}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.name)}&query_place_id=${m.id}&center=${m.lat},${m.lng}`, '_blank');
    }
  };

  // Filtered masjids
  const filteredMasjids = useMemo(() => {
    return masjids.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.address.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (activeFilter === 'favorites') return favorites.includes(m.id);
      if (activeFilter === 'nearby') return m.distance <= 1.5;
      return true;
    });
  }, [masjids, searchQuery, activeFilter, favorites]);

  const cardClass = `rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] shadow-sm dark:bg-[#14211e]`;
  const muted = dark ? 'text-stone-400' : 'text-stone-500';

  return (
    <AppShell active="masjids" dark={dark} onToggleDark={() => setDark((v) => !v)}>
      <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Landmark className="h-3.5 w-3.5" />
              <span>COMMUNITY MOSQUE FINDER</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--app-ink)]">
              Nearby Masjids
            </h1>
            <p className="mt-1 text-sm text-[var(--app-muted)] max-w-xl">
              Locate nearby houses of Allah, calculate walking and driving distances, view facilities, and join congregation (Jamā‘ah).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={detectLocation}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-800 text-white dark:bg-emerald-500 dark:text-emerald-950 px-5 py-3 text-xs font-extrabold shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
            >
              <LocateFixed className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Locating Nearby Masjids…' : 'Find Nearby Masjids (GPS)'}</span>
            </button>
            {location && (
              <span className="inline-flex items-center gap-1.5 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] px-3 py-2.5 text-xs font-semibold text-[var(--app-ink)]">
                <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                {location.city || `${location.lat.toFixed(3)}°, ${location.lng.toFixed(3)}°`}
              </span>
            )}
          </div>
        </header>

        {loggedStatus && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-4 text-xs font-bold text-emerald-800 dark:text-emerald-200">
            ✓ {loggedStatus}
          </div>
        )}

        {/* Radar & Search Bar Section */}
        <section className={`${cardClass} mb-8 p-6`}>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Visual Mini Radar */}
            <div className="relative flex flex-col items-center">
              <div className="relative grid h-44 w-44 place-items-center rounded-full border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20">
                {/* Concentric distance rings */}
                <div className="absolute h-32 w-32 rounded-full border border-dashed border-emerald-500/20" />
                <div className="absolute h-18 w-18 rounded-full border border-emerald-500/30" />

                {/* User Center Pin */}
                <div className="relative z-10 grid h-8 w-8 place-items-center rounded-full bg-emerald-800 text-white shadow-md dark:bg-emerald-400 dark:text-emerald-950">
                  <MapPin className="h-4 w-4" />
                </div>

                {/* Nearby Masjid Pins on Radar */}
                {masjids.slice(0, 8).map((m) => {
                  const rad = ((m.bearing - 90) * Math.PI) / 180;
                  const distRatio = Math.min(1, m.distance / radiusKm);
                  const r = distRatio * 70;
                  const x = 88 + r * Math.cos(rad);
                  const y = 88 + r * Math.sin(rad);

                  const isSelected = selectedMasjidId === m.id;

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMasjidId(m.id)}
                      style={{ left: `${x}px`, top: `${y}px` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform hover:scale-125 ${
                        isSelected
                          ? 'h-5 w-5 bg-amber-400 ring-4 ring-amber-300/40 z-20'
                          : 'h-3.5 w-3.5 bg-emerald-600 dark:bg-emerald-400 z-10'
                      }`}
                      title={`${m.name} (${m.distance} km)`}
                    />
                  );
                })}
              </div>
              <span className="text-[11px] font-bold text-[var(--app-muted)] mt-2">
                Radar View · {radiusKm}km Radius
              </span>
            </div>

            {/* Controls & Filter */}
            <div className="flex-1 w-full space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--app-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by mosque name or street…"
                    className="w-full rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] pl-10 pr-4 py-3 text-xs text-[var(--app-ink)] outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Radius Selector */}
                <div className="flex items-center gap-1.5 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-1.5 shadow-xs">
                  {[1, 3, 5, 10, 25].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRadiusKm(r)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                        radiusKm === r
                          ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950'
                          : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                      }`}
                    >
                      {r}km
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('all')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      activeFilter === 'all'
                        ? 'border border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                        : 'border border-[var(--app-line)] text-[var(--app-muted)]'
                    }`}
                  >
                    All Masjids ({masjids.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('nearby')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      activeFilter === 'nearby'
                        ? 'border border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                        : 'border border-[var(--app-line)] text-[var(--app-muted)]'
                    }`}
                  >
                    Walking Distance (&lt; 1.5km)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('favorites')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      activeFilter === 'favorites'
                        ? 'border border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                        : 'border border-[var(--app-line)] text-[var(--app-muted)]'
                    }`}
                  >
                    Starred ({favorites.length})
                  </button>
                </div>

                {loading && (
                  <span className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-semibold animate-pulse">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Searching OpenStreetMap…
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-medium text-amber-800 dark:text-amber-200">
            {error}
          </div>
        )}

        {/* Masjids Cards Grid */}
        {filteredMasjids.length === 0 && !loading ? (
          <div className={`${cardClass} mb-8 p-8 text-center`}>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 mb-3">
              <Landmark className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-[var(--app-ink)]">
              No masjids found within {radiusKm}km
            </h3>
            <p className="mt-1 text-xs text-[var(--app-muted)] max-w-md mx-auto">
              Try expanding your search radius to 10km or 25km, or use GPS to refresh your precise location coordinates.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setRadiusKm(10)}
                className="rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-200"
              >
                Expand to 10 km
              </button>
              <button
                type="button"
                onClick={() => setRadiusKm(25)}
                className="rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-200"
              >
                Expand to 25 km
              </button>
              <button
                type="button"
                onClick={detectLocation}
                className="rounded-xl bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 px-3.5 py-2 text-xs font-bold"
              >
                Refresh Location
              </button>
            </div>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filteredMasjids.map((masjid) => {
            const isFav = favorites.includes(masjid.id);
            const walkMins = Math.round((masjid.distance / 4.5) * 60);
            const driveMins = Math.max(2, Math.round((masjid.distance / 30) * 60));
            const isSelected = selectedMasjidId === masjid.id;

            return (
              <div
                key={masjid.id}
                className={`${cardClass} p-5 flex flex-col justify-between transition-all ${
                  isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-extrabold text-[var(--app-ink)]">{masjid.name}</h3>
                      {masjid.nameAr && (
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium" dir="rtl" lang="ar">
                          {masjid.nameAr}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(masjid.id)}
                      className="p-1.5 rounded-xl border border-[var(--app-line)] text-stone-400 hover:text-amber-500 transition-colors"
                      aria-label="Star favorite"
                    >
                      <Star className={`h-4 w-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>

                  <p className="text-xs text-[var(--app-muted)] mb-3">{masjid.address}</p>

                  {/* Travel distance badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="rounded-xl border border-[var(--app-line)] bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                      {masjid.distance} km
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-[var(--app-muted)]">
                      <Footprints className="h-3 w-3" /> ~{walkMins}m walk
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-[var(--app-muted)]">
                      <Car className="h-3 w-3" /> ~{driveMins}m drive
                    </span>
                  </div>

                  {/* Facilities */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {masjid.facilities.map((f) => (
                      <span
                        key={f}
                        className="rounded-full bg-black/5 dark:bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-[var(--app-muted)]"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--app-line)] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => logJamahAtMasjid(masjid)}
                    className="flex-1 rounded-xl border border-[var(--app-line)] bg-emerald-50 dark:bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    Log Jamā‘ah Here
                  </button>
                  <button
                    type="button"
                    onClick={() => openNavigation(masjid)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-800 dark:bg-emerald-400 px-4 py-2.5 text-xs font-bold text-white dark:text-emerald-950 shadow-xs hover:bg-emerald-700 transition-colors"
                  >
                    <Navigation className="h-3.5 w-3.5" /> Directions
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
    </AppShell>
  );
}
