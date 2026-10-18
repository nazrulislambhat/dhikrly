'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Accessibility,
  ArrowRight,
  Car,
  Check,
  Compass,
  Copy,
  ExternalLink,
  Footprints,
  Info,
  Landmark,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { load, save, SETTINGS_KEY } from '@/lib/storage';
import { getDayLog, getSalahSettings, saveDayLog, saveSalahSettings } from '@/lib/salahStorage';
import { getTodayKey } from '@/lib/dates';
import type { PrayerName, SalahLocation } from '@/types/salah';
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
  cardinal?: string;
  facilities: string[];
  googleMapsUrl?: string;
  appleMapsUrl?: string;
}

const FAVORITES_STORAGE_KEY = 'dhikrly_favorite_masjids_v1';

const PRESET_CITIES: SalahLocation[] = [
  { lat: 21.3891, lng: 39.8579, city: 'Makkah', country: 'Saudi Arabia', timezone: 'Asia/Riyadh' },
  { lat: 24.4672, lng: 39.6150, city: 'Madinah', country: 'Saudi Arabia', timezone: 'Asia/Riyadh' },
  { lat: 31.7767, lng: 35.2345, city: 'Jerusalem', country: 'Palestine', timezone: 'Asia/Jerusalem' },
  { lat: 41.0082, lng: 28.9784, city: 'Istanbul', country: 'Turkey', timezone: 'Europe/Istanbul' },
  { lat: 30.0444, lng: 31.2357, city: 'Cairo', country: 'Egypt', timezone: 'Africa/Cairo' },
  { lat: 25.2048, lng: 55.2708, city: 'Dubai', country: 'UAE', timezone: 'Asia/Dubai' },
  { lat: 51.5074, lng: -0.1278, city: 'London', country: 'United Kingdom', timezone: 'Europe/London' },
  { lat: 40.7128, lng: -74.0060, city: 'New York', country: 'United States', timezone: 'America/New_York' },
  { lat: 43.6532, lng: -79.3832, city: 'Toronto', country: 'Canada', timezone: 'America/Toronto' },
  { lat: 28.6139, lng: 77.2090, city: 'Delhi', country: 'India', timezone: 'Asia/Kolkata' },
  { lat: 19.0760, lng: 72.8777, city: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata' },
  { lat: 34.0837, lng: 74.7973, city: 'Srinagar', country: 'India', timezone: 'Asia/Kolkata' },
  { lat: 24.8607, lng: 67.0011, city: 'Karachi', country: 'Pakistan', timezone: 'Asia/Karachi' },
  { lat: 23.8103, lng: 90.4125, city: 'Dhaka', country: 'Bangladesh', timezone: 'Asia/Dhaka' },
  { lat: 3.1390, lng: 101.6869, city: 'Kuala Lumpur', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },
];

const AVAILABLE_FACILITIES = [
  "Women's Section",
  'Wheelchair Accessible',
  'Parking Area',
  'Wuḍū Area',
  'Jumu‘ah Prayers',
];

const PRAYER_LIST: { id: PrayerName; label: string; labelAr: string }[] = [
  { id: 'fajr', label: 'Fajr', labelAr: 'فجر' },
  { id: 'dhuhr', label: 'Dhuhr / Jumu‘ah', labelAr: 'ظهر / جمعة' },
  { id: 'asr', label: 'Asr', labelAr: 'عصر' },
  { id: 'maghrib', label: 'Maghrib', labelAr: 'مغرب' },
  { id: 'isha', label: 'Isha', labelAr: 'عشاء' },
];

function getCurrentSuggestedPrayer(): PrayerName {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return 'fajr';
  if (hour >= 11 && hour < 15) return 'dhuhr';
  if (hour >= 15 && hour < 18) return 'asr';
  if (hour >= 18 && hour < 20) return 'maghrib';
  return 'isha';
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
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'distance' | 'name' | 'facilities'>('distance');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedMasjidId, setSelectedMasjidId] = useState<string | null>(null);

  // Modals & toasts
  const [jamahModalMasjid, setJamahModalMasjid] = useState<Masjid | null>(null);
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerName>(() => getCurrentSuggestedPrayer());
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [citySearchLoading, setCitySearchLoading] = useState(false);
  const [citySearchResults, setCitySearchResults] = useState<SalahLocation[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loggedStatusToast, setLoggedStatusToast] = useState<{ text: string; masjidName: string } | null>(null);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
        let detectedCountry = '';

        try {
          const revRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12`,
            { headers: { 'User-Agent': 'DhikrlyApp/2.3' } },
          );
          if (revRes.ok) {
            const revData = await revRes.json();
            detectedCity =
              revData.address?.suburb ||
              revData.address?.city ||
              revData.address?.town ||
              revData.address?.village ||
              'Current Location';
            detectedCountry = revData.address?.country || '';
          }
        } catch {
          // Ignore reverse geocode failures
        }

        const newLoc: SalahLocation = {
          lat,
          lng,
          city: detectedCity,
          country: detectedCountry,
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
          setError('Location permission was denied. Please allow GPS access in your browser or select a city below.');
        } else if (err.code === 2) {
          setError('Position unavailable. Please check your network or GPS connection.');
        } else {
          setError('GPS location timed out. Tap "Find Nearby Masjids (GPS)" or select a city below.');
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

  const toggleFacilityFilter = (facility: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  };

  const handleSelectRadarMasjid = (id: string) => {
    setSelectedMasjidId(id);
    const element = cardRefs.current[id];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Log specific Jamā'ah prayer
  const handleConfirmJamahLog = () => {
    if (!jamahModalMasjid) return;
    playCheck();

    const today = getTodayKey();
    const cur = getDayLog(today);
    const updated = {
      ...cur,
      prayers: {
        ...cur.prayers,
        [selectedPrayer]: 'jamah' as const,
      },
    };

    saveDayLog(updated);

    const prayerObj = PRAYER_LIST.find((p) => p.id === selectedPrayer);
    setLoggedStatusToast({
      text: `Successfully logged ${prayerObj?.label || selectedPrayer} in Jamā‘ah (+27x Reward)!`,
      masjidName: jamahModalMasjid.name,
    });

    setJamahModalMasjid(null);
    setTimeout(() => setLoggedStatusToast(null), 4000);
  };

  const openNavigation = (m: Masjid) => {
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open(m.appleMapsUrl || `maps://maps.apple.com/?q=${encodeURIComponent(m.name)}&ll=${m.lat},${m.lng}`, '_blank');
    } else {
      window.open(m.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`, '_blank');
    }
  };

  const handleShareMasjid = async (m: Masjid) => {
    const shareText = `🕌 ${m.name}\n📍 ${m.address}\n🗺️ Directions: https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: m.name,
          text: shareText,
          url: `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedId(m.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // Ignore clipboard error
    }
  };

  // City search geocode
  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citySearchQuery.trim()) return;

    setCitySearchLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(citySearchQuery)}&limit=5&addressdetails=1`,
        { headers: { 'User-Agent': 'DhikrlyApp/2.3' } }
      );
      if (res.ok) {
        const data = await res.json();
        const mapped: SalahLocation[] = (data || []).map((item: any) => ({
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          city: item.address?.city || item.address?.town || item.address?.suburb || item.display_name?.split(',')[0],
          country: item.address?.country || '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        }));
        setCitySearchResults(mapped);
      }
    } catch {
      // Ignore
    } finally {
      setCitySearchLoading(false);
    }
  };

  const handleSelectCityPreset = (cityLoc: SalahLocation) => {
    setLocation(cityLoc);
    const s = getSalahSettings();
    saveSalahSettings({ ...s, location: cityLoc });
    setCityPickerOpen(false);
    setCitySearchResults([]);
    setCitySearchQuery('');
    fetchNearbyMasjids(cityLoc, radiusKm);
  };

  // Filter & Sort
  const filteredMasjids = useMemo(() => {
    return masjids
      .filter((m) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = m.name.toLowerCase().includes(q);
          const matchAr = m.nameAr ? m.nameAr.toLowerCase().includes(q) : false;
          const matchAddr = m.address.toLowerCase().includes(q);
          if (!matchName && !matchAr && !matchAddr) return false;
        }

        // Category filter
        if (activeFilter === 'favorites' && !favorites.includes(m.id)) return false;
        if (activeFilter === 'nearby' && m.distance > 1.5) return false;

        // Facilities filter
        if (selectedFacilities.length > 0) {
          const hasAllFacilities = selectedFacilities.every((fac) =>
            m.facilities.includes(fac)
          );
          if (!hasAllFacilities) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'distance') return a.distance - b.distance;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'facilities') return b.facilities.length - a.facilities.length;
        return 0;
      });
  }, [masjids, searchQuery, activeFilter, selectedFacilities, sortBy, favorites]);

  // Selected masjid details on radar
  const selectedRadarMasjid = useMemo(() => {
    return masjids.find((m) => m.id === selectedMasjidId) || null;
  }, [masjids, selectedMasjidId]);

  const cardClass = `rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] shadow-sm dark:bg-[#14211e]`;

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
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--app-ink)] font-serif">
              Nearby Masjids
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[var(--app-muted)] max-w-xl">
              Locate nearby houses of Allah, calculate walking and driving distances, view facilities, and join congregation (Jamā‘ah).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={detectLocation}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-800 text-white dark:bg-emerald-500 dark:text-emerald-950 px-4 py-2.5 text-xs font-extrabold shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
            >
              <LocateFixed className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Locating Nearby Masjids…' : 'Find Nearby Masjids (GPS)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCityPickerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] px-3.5 py-2.5 text-xs font-bold text-[var(--app-ink)] hover:border-emerald-500/40 transition-colors shadow-xs"
            >
              <Compass className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{location?.city ? `${location.city}` : 'Change City'}</span>
            </button>
          </div>
        </header>

        {/* Jamā'ah Logged Toast Banner */}
        {loggedStatusToast && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-4 text-xs font-bold text-emerald-900 dark:text-emerald-200 animate-in fade-in duration-200 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <Check className="h-4 w-4" />
              </span>
              <div>
                <p className="font-extrabold">{loggedStatusToast.text}</p>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">At {loggedStatusToast.masjidName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLoggedStatusToast(null)}
              className="p-1 rounded-lg text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Spatial Radar & Search Controls Section */}
        <section className={`${cardClass} mb-8 p-4 sm:p-6 relative overflow-hidden`}>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Visual Spatial Radar */}
            <div className="relative flex flex-col items-center shrink-0">
              <div className="relative grid h-52 w-52 sm:h-56 sm:w-56 place-items-center rounded-full border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-inner overflow-hidden">
                {/* Radar Sweep Animated Beam */}
                <div
                  className="absolute inset-0 pointer-events-none animate-radar-sweep"
                  style={{
                    background:
                      'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(16, 185, 129, 0.18) 45deg, transparent 50deg)',
                  }}
                />

                {/* Cardinal Heading Markers on Rim */}
                <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[10px] font-black text-emerald-700 dark:text-emerald-300">
                  N
                </span>
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-stone-400">
                  S
                </span>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400">
                  E
                </span>
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400">
                  W
                </span>

                {/* Concentric distance rings */}
                <div className="absolute h-40 w-40 sm:h-44 sm:w-44 rounded-full border border-dashed border-emerald-500/20" />
                <div className="absolute h-26 w-26 sm:h-28 sm:w-28 rounded-full border border-emerald-500/25" />
                <div className="absolute h-14 w-14 rounded-full border border-emerald-500/30" />

                {/* User Center Pulse Pin */}
                <div className="relative z-10 grid h-8 w-8 place-items-center rounded-full bg-emerald-800 text-white shadow-lg ring-4 ring-emerald-500/20 dark:bg-emerald-400 dark:text-emerald-950">
                  <MapPin className="h-4 w-4" />
                </div>

                {/* Nearby Masjid Pins on Radar */}
                {masjids.slice(0, 15).map((m) => {
                  const rad = ((m.bearing - 90) * Math.PI) / 180;
                  const distRatio = Math.min(1, m.distance / radiusKm);
                  const maxRadiusPx = 90;
                  const r = distRatio * maxRadiusPx;
                  const centerOffset = 104; // half of 52 (approx 208px)
                  const x = centerOffset + r * Math.cos(rad);
                  const y = centerOffset + r * Math.sin(rad);

                  const isSelected = selectedMasjidId === m.id;

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectRadarMasjid(m.id)}
                      style={{ left: `${x}px`, top: `${y}px` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all cursor-pointer ${
                        isSelected
                          ? 'h-5 w-5 bg-amber-400 ring-4 ring-amber-300/50 z-30 scale-125 shadow-md'
                          : 'h-3.5 w-3.5 bg-emerald-600 dark:bg-emerald-400 z-20 hover:scale-150 hover:bg-amber-400'
                      }`}
                      title={`${m.name} (${m.distance} km · ${m.cardinal || ''})`}
                    />
                  );
                })}
              </div>

              {/* Radar Legend and Tooltip */}
              <div className="text-center mt-2 space-y-1">
                <span className="text-[11px] font-bold text-[var(--app-muted)]">
                  Live Compass Radar · {radiusKm}km Radius ({masjids.length} plotted)
                </span>

                {selectedRadarMasjid && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-900 dark:text-amber-200 shadow-xs">
                    <span className="truncate max-w-[150px]">{selectedRadarMasjid.name}</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-mono">
                      {selectedRadarMasjid.distance}km
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectRadarMasjid(selectedRadarMasjid.id)}
                      className="text-amber-800 dark:text-amber-300 underline text-[10px]"
                    >
                      Jump to card
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Controls, Radius, Search & Advanced Filters */}
            <div className="flex-1 w-full space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search input with Clear button */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--app-muted)] pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by mosque name, Arabic name, or street…"
                    className="w-full rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] pl-10 pr-9 py-3 text-xs text-[var(--app-ink)] outline-none focus:border-emerald-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Radius Selector */}
                <div className="flex items-center gap-1 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-1 shadow-xs shrink-0">
                  <span className="text-[10px] font-extrabold text-[var(--app-muted)] uppercase px-2 hidden sm:inline">
                    Range
                  </span>
                  {[1, 3, 5, 10, 25].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRadiusKm(r)}
                      className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                        radiusKm === r
                          ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                          : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                      }`}
                    >
                      {r}km
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter Pills & Sort Selector */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-[var(--app-line)]">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('all')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      activeFilter === 'all'
                        ? 'border border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 shadow-xs'
                        : 'border border-[var(--app-line)] text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                    }`}
                  >
                    All Masjids ({masjids.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('nearby')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeFilter === 'nearby'
                        ? 'border border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 shadow-xs'
                        : 'border border-[var(--app-line)] text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                    }`}
                  >
                    <Footprints className="h-3 w-3" />
                    <span>Walking (&lt;1.5km)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('favorites')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeFilter === 'favorites'
                        ? 'border border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-200 shadow-xs'
                        : 'border border-[var(--app-line)] text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                    }`}
                  >
                    <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
                    <span>Starred ({favorites.length})</span>
                  </button>
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--app-muted)] ml-auto">
                  <span className="text-[11px]">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] px-2.5 py-1 text-xs text-[var(--app-ink)] font-bold outline-none cursor-pointer"
                  >
                    <option value="distance">Distance (Closest)</option>
                    <option value="name">Name (A → Z)</option>
                    <option value="facilities">Most Facilities</option>
                  </select>
                </div>
              </div>

              {/* Multi-Select Facility Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-[var(--app-muted)] flex items-center gap-1 mr-1">
                  <SlidersHorizontal className="h-3 w-3" /> Facilities:
                </span>
                {AVAILABLE_FACILITIES.map((facility) => {
                  const isSelected = selectedFacilities.includes(facility);
                  return (
                    <button
                      key={facility}
                      type="button"
                      onClick={() => toggleFacilityFilter(facility)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-all ${
                        isSelected
                          ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                          : 'bg-black/5 dark:bg-white/5 text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                      }`}
                    >
                      {isSelected ? `✓ ${facility}` : `+ ${facility}`}
                    </button>
                  );
                })}

                {selectedFacilities.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedFacilities([])}
                    className="text-[10px] text-amber-700 dark:text-amber-400 font-bold hover:underline ml-1"
                  >
                    Reset filters
                  </button>
                )}

                {loading && (
                  <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-semibold animate-pulse">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Fetching mosques…
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-medium text-amber-900 dark:text-amber-200">
            {error}
          </div>
        )}

        {/* Results Count Bar */}
        <div className="mb-4 flex items-center justify-between text-xs text-[var(--app-muted)] font-semibold">
          <span>
            Showing <strong className="text-[var(--app-ink)]">{filteredMasjids.length}</strong> of{' '}
            {masjids.length} masjids within {radiusKm}km
          </span>
          {location && (
            <span className="text-[11px]">
              Location: <strong>{location.city || `${location.lat.toFixed(2)}°, ${location.lng.toFixed(2)}°`}</strong>
            </span>
          )}
        </div>

        {/* Masjids Cards Grid */}
        {filteredMasjids.length === 0 && !loading ? (
          <div className={`${cardClass} mb-8 p-8 text-center`}>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 mb-3">
              <Landmark className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-[var(--app-ink)]">
              No masjids matching your criteria
            </h3>
            <p className="mt-1 text-xs text-[var(--app-muted)] max-w-md mx-auto">
              Try clearing facility filters, expanding search radius to 10km or 25km, or switching your city.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {selectedFacilities.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedFacilities([])}
                  className="rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-200"
                >
                  Clear Facility Filters
                </button>
              )}
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
                onClick={() => setCityPickerOpen(true)}
                className="rounded-xl bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 px-3.5 py-2 text-xs font-bold"
              >
                Choose Another City
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
                  ref={(el) => {
                    cardRefs.current[masjid.id] = el;
                  }}
                  className={`${cardClass} p-5 flex flex-col justify-between transition-all ${
                    isSelected ? 'border-amber-500 ring-2 ring-amber-400/40 shadow-md' : 'hover:border-emerald-500/40'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-extrabold text-[var(--app-ink)] break-words">
                          {masjid.name}
                        </h3>
                        {masjid.nameAr && (
                          <p
                            className="text-xs text-emerald-700 dark:text-emerald-300 font-medium font-arabic mt-0.5"
                            dir="rtl"
                            lang="ar"
                          >
                            {masjid.nameAr}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleShareMasjid(masjid)}
                          className="p-1.5 rounded-xl border border-[var(--app-line)] text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          title="Share mosque location"
                          aria-label="Share mosque"
                        >
                          {copiedId === masjid.id ? (
                            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Share2 className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(masjid.id)}
                          className="p-1.5 rounded-xl border border-[var(--app-line)] text-stone-400 hover:text-amber-500 transition-colors"
                          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                          aria-label="Star favorite"
                        >
                          <Star className={`h-4 w-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--app-muted)] mb-3 leading-relaxed break-words">
                      {masjid.address}
                    </p>

                    {/* Travel Distance & Directional Heading */}
                    <div className="flex flex-wrap items-center gap-2 mb-3.5">
                      <span className="rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                        {masjid.distance} km
                      </span>

                      {/* Directional Compass Needle */}
                      <span
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] px-2.5 py-1 text-[11px] font-bold text-[var(--app-ink)]"
                        title={`Heading: ${masjid.cardinal || ''} (${masjid.bearing}° from your location)`}
                      >
                        <Navigation
                          className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0"
                          style={{ transform: `rotate(${masjid.bearing}deg)` }}
                        />
                        <span>{masjid.cardinal || 'Dir'} · {masjid.bearing}°</span>
                      </span>

                      <span className="flex items-center gap-1 text-[11px] text-[var(--app-muted)] font-medium">
                        <Footprints className="h-3 w-3 shrink-0" /> ~{walkMins}m
                      </span>

                      <span className="flex items-center gap-1 text-[11px] text-[var(--app-muted)] font-medium">
                        <Car className="h-3 w-3 shrink-0" /> ~{driveMins}m
                      </span>
                    </div>

                    {/* Facilities Chips */}
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

                  {/* Actions */}
                  <div className="pt-3 border-t border-[var(--app-line)] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setJamahModalMasjid(masjid);
                        setSelectedPrayer(getCurrentSuggestedPrayer());
                      }}
                      className="flex-1 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 transition-colors text-center"
                    >
                      Log Jamā‘ah Here
                    </button>

                    <button
                      type="button"
                      onClick={() => openNavigation(masjid)}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-800 dark:bg-emerald-400 px-4 py-2.5 text-xs font-bold text-white dark:text-emerald-950 shadow-xs hover:brightness-110 transition-all shrink-0"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>Directions</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Community & Virtue Note */}
        <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-6 mb-8">
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-xs">
              <Users className="h-5 w-5" />
            </span>
            <div className="space-y-1 text-xs">
              <h4 className="font-extrabold text-[var(--app-ink)] text-sm">
                The Virtue of Walking to the Masjid & Jamā‘ah
              </h4>
              <p className="text-[var(--app-muted)] leading-relaxed">
                The Prophet ﷺ said: <em>&ldquo;Whoever purifies himself in his house, then walks to one of the houses of Allah to fulfill one of the obligations of Allah, for every step he takes one sin is wiped away and by the other his status is raised.&rdquo;</em> (Ṣaḥīḥ Muslim 666).
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Jamā'ah Prayer Picker Modal */}
      {jamahModalMasjid && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="jamah-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 overflow-y-auto backdrop-blur-md bg-black/60 animate-in fade-in duration-200"
        >
          <div
            className={`relative w-full max-w-md rounded-3xl border shadow-2xl p-5 sm:p-6 space-y-4 ${
              dark
                ? 'bg-[#12221d] border-emerald-500/30 text-stone-100 shadow-[0_0_50px_rgba(20,40,30,0.8)]'
                : 'bg-white border-emerald-500/30 text-stone-900 shadow-2xl'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase">
                  <Users className="h-3 w-3" /> Jamā‘ah Prayer Log
                </span>
                <h3 id="jamah-dialog-title" className="text-base sm:text-lg font-bold text-[var(--app-ink)] mt-1">
                  Log Congregation at {jamahModalMasjid.name}
                </h3>
                <p className="text-xs text-[var(--app-muted)]">
                  Which Farḍ prayer did you perform together in congregation?
                </p>
              </div>

              <button
                type="button"
                onClick={() => setJamahModalMasjid(null)}
                aria-label="Close dialog"
                className="grid h-7 w-7 place-items-center rounded-full bg-black/5 dark:bg-white/10 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Prayer Selection Grid */}
            <div className="grid grid-cols-1 gap-2 pt-1">
              {PRAYER_LIST.map((p) => {
                const isSelected = selectedPrayer === p.id;
                const isCurrent = getCurrentSuggestedPrayer() === p.id;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPrayer(p.id)}
                    className={`flex items-center justify-between rounded-2xl border p-3 text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/30 shadow-xs'
                        : dark
                          ? 'border-white/10 bg-white/[0.03] text-stone-300 hover:border-white/20'
                          : 'border-stone-200 bg-stone-50/80 text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold">{p.label}</span>
                      {isCurrent && (
                        <span className="rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[9px] px-2 py-0.5 font-black uppercase">
                          Current Prayer
                        </span>
                      )}
                    </div>
                    <span className="font-arabic text-sm text-emerald-700 dark:text-emerald-300 font-bold">
                      {p.labelAr}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Hadith motivation quote */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[11px] text-emerald-900 dark:text-emerald-200">
              <p className="leading-tight">
                ⭐️ <strong>27x Multiplier:</strong> Prayer in congregation is 27 times more rewarding than prayer alone. (Ṣaḥīḥ al-Bukhārī).
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setJamahModalMasjid(null)}
                className="flex-1 rounded-2xl border border-[var(--app-line)] py-2.5 text-xs font-bold text-[var(--app-ink)] hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmJamahLog}
                className="flex-1 rounded-2xl bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 py-2.5 text-xs font-extrabold shadow-md hover:brightness-110 active:scale-95 transition-all text-center"
              >
                Save Jamā‘ah (+27x)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* City / Location Picker Modal */}
      {cityPickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="city-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 overflow-y-auto backdrop-blur-md bg-black/60 animate-in fade-in duration-200"
        >
          <div
            className={`relative w-full max-w-lg rounded-3xl border shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] flex flex-col ${
              dark
                ? 'bg-[#12221d] border-emerald-500/30 text-stone-100 shadow-[0_0_50px_rgba(20,40,30,0.8)]'
                : 'bg-white border-emerald-500/30 text-stone-900 shadow-2xl'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase">
                  <Compass className="h-3 w-3" /> Location Switcher
                </span>
                <h3 id="city-dialog-title" className="text-base sm:text-lg font-bold text-[var(--app-ink)] mt-1">
                  Change Mosque Location
                </h3>
                <p className="text-xs text-[var(--app-muted)]">
                  Pick a popular city or type any town worldwide to explore nearby masjids.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCityPickerOpen(false)}
                aria-label="Close dialog"
                className="grid h-7 w-7 place-items-center rounded-full bg-black/5 dark:bg-white/10 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* City search input */}
            <form onSubmit={handleCitySearch} className="flex gap-2">
              <input
                type="text"
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                placeholder="Search any city (e.g. Manchester, Istanbul, Houston)…"
                className="flex-1 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] px-3.5 py-2.5 text-xs text-[var(--app-ink)] outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={citySearchLoading}
                className="rounded-2xl bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 px-4 py-2.5 text-xs font-bold shrink-0 disabled:opacity-50"
              >
                {citySearchLoading ? 'Searching…' : 'Search'}
              </button>
            </form>

            {/* Geocode search results */}
            {citySearchResults.length > 0 && (
              <div className="space-y-1 border border-[var(--app-line)] rounded-2xl p-2 max-h-40 overflow-y-auto">
                <p className="text-[10px] font-bold text-[var(--app-muted)] uppercase px-2 mb-1">Search Results</p>
                {citySearchResults.map((res, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectCityPreset(res)}
                    className="w-full text-left rounded-xl p-2 text-xs font-semibold hover:bg-emerald-500/10 flex items-center justify-between"
                  >
                    <span>{res.city}, {res.country}</span>
                    <span className="text-[10px] text-[var(--app-muted)] font-mono">{res.lat.toFixed(2)}°, {res.lng.toFixed(2)}°</span>
                  </button>
                ))}
              </div>
            )}

            {/* Preset Global Cities */}
            <div className="flex-1 overflow-y-auto space-y-2">
              <p className="text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-wider">
                Popular Islamic & Global Hubs
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_CITIES.map((c) => {
                  const isCurrent = location?.city === c.city;
                  return (
                    <button
                      key={c.city}
                      type="button"
                      onClick={() => handleSelectCityPreset(c)}
                      className={`text-left rounded-2xl border p-2.5 transition-all text-xs ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-500/20 font-bold ring-2 ring-emerald-500/30'
                          : dark
                            ? 'border-white/10 bg-white/[0.03] hover:border-white/20'
                            : 'border-stone-200 bg-stone-50/70 hover:border-stone-300'
                      }`}
                    >
                      <div className="font-bold text-[var(--app-ink)] truncate">{c.city}</div>
                      <div className="text-[10px] text-[var(--app-muted)] truncate">{c.country}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--app-line)] flex items-center justify-between">
              <button
                type="button"
                onClick={detectLocation}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:underline"
              >
                <LocateFixed className="h-3.5 w-3.5" /> Use My Exact GPS Coordinates
              </button>
              <button
                type="button"
                onClick={() => setCityPickerOpen(false)}
                className="rounded-xl px-3 py-1.5 text-xs font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
