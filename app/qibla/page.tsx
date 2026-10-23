'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Compass as CompassIcon,
  HelpCircle,
  Info,
  LocateFixed,
  MapPin,
  RefreshCw,
  RotateCw,
  Sun,
  Vibrate,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { load, save, SETTINGS_KEY } from '@/lib/storage';
import { getSalahSettings, saveSalahSettings } from '@/lib/salahStorage';
import type { SalahLocation } from '@/types/salah';
import {
  calculateDistanceToKaaba,
  calculateQiblaBearing,
  getCompassDirection,
  KAABA_COORDINATES,
  POPULAR_CITIES,
  type CityPreset,
} from '@/lib/qibla';
import { playCheck } from '@/lib/sounds';

export default function QiblaPage() {
  const [dark, setDark] = useState<boolean>(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );

  const [location, setLocation] = useState<SalahLocation>(() => {
    const saved = getSalahSettings().location;
    if (saved) return saved;
    return {
      lat: 51.5074,
      lng: -0.1278,
      city: 'London',
      country: 'UK',
      timezone: 'Europe/London',
    };
  });

  const [heading, setHeading] = useState<number>(0); // Current device direction (0-360)
  const [deviceSensorActive, setDeviceSensorActive] = useState<boolean>(false);
  const [permissionRequired, setPermissionRequired] = useState<boolean>(false);
  const [manualHeading, setManualHeading] = useState<number>(0);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [showCalibrationHelp, setShowCalibrationHelp] = useState<boolean>(false);
  const [isAligned, setIsAligned] = useState<boolean>(false);

  const targetHeadingRef = useRef<number>(0);
  const currentContinuousHeadingRef = useRef<number>(0);
  const dialRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Qibla bearing from user's current location to Kaaba
  const qiblaBearing = useMemo(() => {
    return calculateQiblaBearing(location.lat, location.lng);
  }, [location]);

  // Distance to Kaaba
  const distance = useMemo(() => {
    return calculateDistanceToKaaba(location.lat, location.lng);
  }, [location]);

  // Compass cardinal direction
  const cardinal = useMemo(() => {
    return getCompassDirection(qiblaBearing);
  }, [qiblaBearing]);

  // The active heading to display (sensor or manual slider)
  const currentHeading = deviceSensorActive ? heading : manualHeading;

  // The needle angle pointing directly toward Kaaba
  const qiblaRelativeAngle = (qiblaBearing - currentHeading + 360) % 360;

  // Haptic feedback when device aligns with Qibla
  const hasVibratedRef = useRef(false);
  useEffect(() => {
    if (isAligned && !hasVibratedRef.current) {
      hasVibratedRef.current = true;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([40, 50, 60]);
        } catch {
          // Ignore
        }
      }
    } else if (!isAligned) {
      hasVibratedRef.current = false;
    }
  }, [isAligned]);

  // Setup DeviceOrientation listener (single source to prevent double-event conflicts)
  useEffect(() => {
    // Check if iOS DeviceOrientation permissions are required
    if (
      typeof window !== 'undefined' &&
      'DeviceOrientationEvent' in window &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      setPermissionRequired(true);
    }

    let absoluteActive = false;

    const handleAbsoluteOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null && typeof e.alpha === 'number') {
        absoluteActive = true;
        // Standard Android / Web absolute orientation (alpha is counter-clockwise)
        const compass = (360 - e.alpha) % 360;
        targetHeadingRef.current = compass;
        setDeviceSensorActive(true);
      }
    };

    const handleStandardOrientation = (e: DeviceOrientationEvent) => {
      if (absoluteActive) return; // Don't fight with absolute sensor

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const webkitCompass = (e as any).webkitCompassHeading;
      if (typeof webkitCompass === 'number' && !isNaN(webkitCompass)) {
        // iOS Safari gives direct clockwise heading (0-360)
        targetHeadingRef.current = webkitCompass;
        setDeviceSensorActive(true);
      } else if (e.alpha !== null && typeof e.alpha === 'number') {
        const compass = (360 - e.alpha) % 360;
        targetHeadingRef.current = compass;
        setDeviceSensorActive(true);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.addEventListener('deviceorientationabsolute' as any, handleAbsoluteOrientation, true);
    window.addEventListener('deviceorientation', handleStandardOrientation, true);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window.removeEventListener('deviceorientationabsolute' as any, handleAbsoluteOrientation);
      window.removeEventListener('deviceorientation', handleStandardOrientation);
    };
  }, []);

  // Physics animation loop: continuous angle unwrapping + adaptive Exponential Moving Average (EMA) damping
  useEffect(() => {
    let animId: number;
    let lastStateTime = 0;

    const shortestDiff = (target: number, current: number) => {
      const normCurrent = ((current % 360) + 360) % 360;
      return ((target - normCurrent + 540) % 360) - 180;
    };

    const tick = (time: number) => {
      const target = deviceSensorActive ? targetHeadingRef.current : manualHeading;
      const diff = shortestDiff(target, currentContinuousHeadingRef.current);

      // Deadband: ignore sensor micro-tremors < 0.25° when phone is held steady
      if (Math.abs(diff) > 0.25) {
        // Adaptive EMA filter:
        // Responsive tracking when device turns quickly (> 18° delta)
        // Heavy, stable, liquid-damped feel when steady or fine-turning (0.09)
        const alpha = Math.abs(diff) > 18 ? 0.22 : 0.09;
        currentContinuousHeadingRef.current += diff * alpha;
      }

      const continuousHeading = currentContinuousHeadingRef.current;
      const normalizedHeading = ((continuousHeading % 360) + 360) % 360;

      // Update rotating dial in DOM at native refresh rate (60/120Hz)
      if (dialRef.current) {
        dialRef.current.style.transform = `rotate(${-continuousHeading}deg)`;
      }

      // Update central needle in DOM pointing towards Kaaba
      const needleAngle = qiblaBearing - continuousHeading;
      if (needleRef.current) {
        needleRef.current.style.transform = `rotate(${needleAngle}deg)`;
      }

      // Alignment check (within 3.5° of Kaaba)
      const angleDiffToQibla = Math.abs((((qiblaBearing - normalizedHeading + 540) % 360) - 180));
      const aligned = angleDiffToQibla <= 3.5;

      // Throttle React state updates to 20fps (every 50ms) to avoid re-render thrashing
      if (time - lastStateTime > 50) {
        lastStateTime = time;
        setHeading(normalizedHeading);
        setIsAligned(aligned);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [deviceSensorActive, manualHeading, qiblaBearing]);

  const requestIosSensor = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await (DeviceOrientationEvent as any).requestPermission();
        if (res === 'granted') {
          setPermissionRequired(false);
          setDeviceSensorActive(true);
        }
      } catch {
        // Permission denied
      }
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLoc: SalahLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          city: 'Current Location',
          country: '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        };
        setLocation(newLoc);
        const s = getSalahSettings();
        saveSalahSettings({ ...s, location: newLoc });
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const handleCitySelect = (city: CityPreset) => {
    playCheck();
    const newLoc: SalahLocation = {
      lat: city.lat,
      lng: city.lng,
      city: city.name,
      country: city.country,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    };
    setLocation(newLoc);
    const s = getSalahSettings();
    saveSalahSettings({ ...s, location: newLoc });
  };

  const cardClass = `rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] shadow-sm`;
  const muted = dark ? 'text-stone-400' : 'text-stone-500';

  return (
    <AppShell active="qibla" dark={dark} onToggleDark={() => setDark((v) => !v)}>
      <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CompassIcon className="h-3.5 w-3.5" />
              <span>HIGH-PRECISION QIBLA COMPASS</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--app-ink)]">
              Qibla Direction
            </h1>
            <p className="mt-1 text-sm text-[var(--app-muted)] max-w-xl">
              Turn your face toward the Sacred Mosque (Al-Masjid Al-Haram) from anywhere on earth using spherical trigonometry and magnetometer sensors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={detectLocation}
              disabled={gpsLoading}
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] px-4 py-2.5 text-xs font-bold text-[var(--app-ink)] shadow-xs hover:bg-emerald-500/10 transition-colors"
            >
              <LocateFixed className={`h-4 w-4 text-emerald-700 dark:text-emerald-300 ${gpsLoading ? 'animate-spin' : ''}`} />
              <span>{gpsLoading ? 'Locating…' : 'Use GPS Location'}</span>
            </button>
          </div>
        </header>

        {/* Permission Request for iOS Safari */}
        {permissionRequired && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs">
              <strong className="text-emerald-900 dark:text-emerald-200">Enable Compass Motion Sensors</strong>
              <p className="text-[var(--app-muted)] mt-0.5">
                iOS requires permission to access your device’s magnetometer for live compass needle orientation.
              </p>
            </div>
            <button
              type="button"
              onClick={requestIosSensor}
              className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-xs dark:bg-emerald-400 dark:text-emerald-950 shrink-0"
            >
              Grant Sensor Access
            </button>
          </div>
        )}

        {/* Main Compass Rose Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 items-center">
          {/* Compass Visualizer Column (7 cols) */}
          <section
            className={`${cardClass} lg:col-span-7 p-6 sm:p-10 flex flex-col items-center justify-center relative overflow-hidden ${
              isAligned ? 'ring-4 ring-emerald-500/40 bg-emerald-500/5' : ''
            }`}
          >
            {/* Alignment status banner */}
            <div className="mb-6 flex items-center justify-center">
              {isAligned ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-extrabold text-white shadow-lg animate-pulse">
                  <span>✓ You are facing the Holy Ka’bah!</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--app-line)] bg-black/5 dark:bg-white/5 px-4 py-1 text-xs font-bold text-[var(--app-muted)]">
                  <span>Rotate your device until the needle turns emerald</span>
                </div>
              )}
            </div>

            {/* Luxury Brass / Emerald Compass Rose */}
            <div className="relative my-4 grid h-80 w-80 sm:h-96 sm:w-96 place-items-center select-none">
              {/* Outer Outer Decorative Ring */}
              <div className="absolute inset-0 rounded-full border-4 border-stone-200 dark:border-stone-800 shadow-2xl" />
              <div className="absolute inset-3 rounded-full border border-dashed border-emerald-500/30" />

              {/* Rotating Compass Dial with Degree Markings & Cardinals */}
              <div
                ref={dialRef}
                className="absolute inset-6 rounded-full will-change-transform flex items-center justify-center"
                style={{ transform: `rotate(${-currentHeading}deg)` }}
              >
                {/* Cardinal Directions */}
                <span className="absolute top-2 text-xs font-extrabold text-red-500">
                  N <span className="text-[9px] font-arabic">(شمال)</span>
                </span>
                <span className="absolute bottom-2 text-xs font-bold text-[var(--app-muted)]">
                  S <span className="text-[9px] font-arabic">(جنوب)</span>
                </span>
                <span className="absolute right-2 text-xs font-bold text-[var(--app-muted)]">
                  E <span className="text-[9px] font-arabic">(شرق)</span>
                </span>
                <span className="absolute left-2 text-xs font-bold text-[var(--app-muted)]">
                  W <span className="text-[9px] font-arabic">(غرب)</span>
                </span>

                {/* Kaaba Target Marker on the Dial */}
                <div
                  className="absolute inset-0 flex items-start justify-center"
                  style={{ transform: `rotate(${qiblaBearing}deg)` }}
                >
                  <div className="flex flex-col items-center -mt-3.5">
                    {/* Ka'bah Icon */}
                    <div
                      className="grid h-8 w-8 place-items-center rounded-lg bg-stone-900 border-2 border-amber-400 text-[11px] shadow-lg"
                      title="Holy Ka'bah"
                    >
                      <span className="text-amber-300 font-extrabold">🕋</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-[var(--app-surface)] px-1 rounded shadow-xs mt-0.5">
                      Qibla
                    </span>
                  </div>
                </div>
              </div>

              {/* Central Needle pointing to Kaaba relative to device heading */}
              <div
                ref={needleRef}
                className="relative z-20 flex h-64 w-8 items-center justify-center will-change-transform"
                style={{ transform: `rotate(${qiblaRelativeAngle}deg)` }}
              >
                {/* Top Arrow: Points to Qibla */}
                <div
                  className={`w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[90px] drop-shadow-md transition-colors ${
                    isAligned
                      ? 'border-b-emerald-500'
                      : 'border-b-emerald-800 dark:border-b-emerald-400'
                  }`}
                />
                {/* Center Pivot Gem */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-7 w-7 rounded-full border-2 border-white bg-amber-400 shadow-md grid place-items-center">
                  <div className="h-2 w-2 rounded-full bg-emerald-950" />
                </div>
                {/* Bottom Tail */}
                <div className="absolute top-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[80px] border-t-stone-400 dark:border-t-stone-600 opacity-60" />
              </div>
            </div>

            {/* Heading Angle Indicator */}
            <div className="mt-4 text-center">
              <span className="text-2xl font-extrabold text-[var(--app-ink)]">
                {Math.round(currentHeading)}°
              </span>
              <span className="block text-xs text-[var(--app-muted)]">
                {deviceSensorActive ? 'Live Sensor Heading' : 'Simulated Heading (Desktop Mode)'}
              </span>
            </div>

            {/* Slider for Desktop / Manual adjustment */}
            {!deviceSensorActive && (
              <div className="w-full max-w-xs mt-4 flex items-center gap-3">
                <span className="text-xs text-[var(--app-muted)]">0°</span>
                <input
                  type="range"
                  min="0"
                  max="359"
                  value={manualHeading}
                  onChange={(e) => setManualHeading(parseInt(e.target.value, 10))}
                  className="flex-1 h-1.5 accent-emerald-600 cursor-pointer rounded-lg bg-stone-200 dark:bg-stone-700"
                  aria-label="Rotate compass heading"
                />
                <span className="text-xs text-[var(--app-muted)]">360°</span>
              </div>
            )}
          </section>

          {/* Details & Location Selection Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Location & Qibla Stats Card */}
            <section className={`${cardClass} p-6`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                    Current Location
                  </span>
                  <h2 className="text-lg font-extrabold text-[var(--app-ink)] mt-0.5">
                    {location.city || `${location.lat.toFixed(2)}°, ${location.lng.toFixed(2)}°`}
                  </h2>
                </div>
                <span className="rounded-xl border border-[var(--app-line)] bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-extrabold text-emerald-800 dark:text-emerald-200">
                  {qiblaBearing}° {cardinal.en}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 p-3">
                  <span className="text-[10px] font-bold text-[var(--app-muted)]">Bearing</span>
                  <span className="block text-xl font-extrabold text-[var(--app-ink)] mt-0.5">
                    {qiblaBearing}°
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                    {cardinal.ar}
                  </span>
                </div>

                <div className="rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 p-3">
                  <span className="text-[10px] font-bold text-[var(--app-muted)]">Distance to Ka’bah</span>
                  <span className="block text-xl font-extrabold text-[var(--app-ink)] mt-0.5">
                    {distance.km.toLocaleString()} km
                  </span>
                  <span className="text-[11px] text-[var(--app-muted)]">
                    ~{distance.miles.toLocaleString()} mi
                  </span>
                </div>
              </div>

              <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                Coordinates: {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E · Holy Ka’bah: 21.4225°N, 39.8262°E
              </p>
            </section>

            {/* Popular City Selector */}
            <section className={`${cardClass} p-6`}>
              <h3 className="text-sm font-bold text-[var(--app-ink)] mb-3">
                Select City Preset
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {POPULAR_CITIES.map((c) => {
                  const isCur = location.city?.includes(c.name);
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleCitySelect(c)}
                      className={`text-left p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        isCur
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                          : 'border-[var(--app-line)] bg-[var(--app-surface)] hover:bg-emerald-500/5'
                      }`}
                    >
                      <span className="block font-bold">{c.name}</span>
                      <span className="block text-[10px] text-[var(--app-muted)] truncate">{c.country}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Accuracy & Figure-8 Calibration Guide */}
            <section className={`${cardClass} p-5 flex items-start gap-3`}>
              <Info className="h-5 w-5 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-[var(--app-muted)]">
                <strong className="text-[var(--app-ink)]">Calibration Tip:</strong> Keep your phone flat (horizontal) and away from metal objects, magnets, or laptops. If compass seems inaccurate, wave your device in a smooth figure-8 pattern in the air.
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
