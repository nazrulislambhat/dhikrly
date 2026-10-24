# Dhikrly — ذِكْرلي

![Dhikrly Preview](https://raw.githubusercontent.com/nazrulislambhat/dhikrly/main/public/dhikrly-cover-4k.svg)

> **Modern Islamic Lifestyle, Worship & Mindfulness Web App & PWA.**
> Complete with Adhkār, Ṣalāh, Qur’an reader & audio memorization tooling, Jumu'ah Mode, Zakāt & Nisāb calculator, Halal scanner, Qadā tracker, Qibla compass, and cross-device sync.

**Live App:** [https://dhikrly.com](https://dhikrly.com) · **Platform:** Web & Installable PWA · **Pricing:** 100% Free & Ad-Free (Ṣadaqah Jāriyah)

---

## ✨ Features Overview

### 🕌 1. Jumu'ah Mode
- **Automatic Friday Detection**: Automatically surfaces every Friday (from Thursday Maghrib until Friday Maghrib) with an on-demand preview toggle for testing anytime.
- **8 Sunan Checklist**:
  1. *Ghusl* (Full ritual bath)
  2. *Siwāk / Miswak* (Oral purification)
  3. *Clean Garments & ‘Itr / Perfume*
  4. *Surah Al-Kahf* (One-tap launcher directly into the Qur'an reader)
  5. *Abundant Salawāt* (Interactive $100\times$ counter with milestone feedback)
  6. *Early Arrival at the Masjid* (Prior to the Imām ascending the Minbar)
  7. *Quiet Attentiveness during the Khutbah*
  8. *Du’ā during the Hour of Response*
- **Prayer & Du’ā Timing**: Displays local Jumu'ah prayer time and calculates *Sa'at al-Istijābah* (the accepted du'ā window between ‘Asr and sunset).

### 📖 2. Holy Qur’an Reader, WBW & Memorization (Hifz) Tools
- **Complete 114 Surahs**: Offline-ready catalog with Indo-Pak script, Uthmani script, and authentic English translations.
- **Mushaf & Verse Reader Views**: Switch effortlessly between compact Mushaf pages (Indo-Pak script) and structured verse-by-verse view.
- **Word-by-Word (WBW) Translation & Isolated Audio**: Tap individual Arabic words to view root meanings, transliteration, English definitions, and listen to isolated word pronunciations directly via audio CDN.
- **Hifz Recite Mode (Active Memorization)**: Toggleable veiling that blurs upcoming verses until tapped, allowing users to recite from memory and test recall. Includes *"Reveal Next"*, *"Reveal All"*, and per-verse re-hiding.
- **Audio Repeat & Verse Range Looping**:
  - Repeat single Ayahs $N$ times ($1\times, 3\times, 5\times, 10\times, \infty$).
  - Verse Range Looping: Specify verse intervals (e.g. Ayah 1 to 5) and cycle repetitions for memorization rhythm.
- **Reciters & Audio Player**: Multiple world-renowned Qāriʾs with real-time word highlighting, variable playback rates ($0.5\times$ to $2\times$), and responsive timeline scrubbing.

### 📊 3. Qur’an Reading Tracker & Khatm Insights
- **Reading Logs**: Log exact Surahs and Ayahs read offline or online with reflections and timestamps.
- **Offline Surah Checklists**: Check off completed Surahs with batch presets (*+ First 5 Surahs*, *+ Juz 30*).
- **Spiritual Analytics**: Interactive Khatm progress percentage, 114 Surahs visual status grid, and 7-day recitation bar chart in `/insights`.

### 💰 4. Zakāt & Nisāb Calculator (`/zakat`)
- **Live & Editable Nisāb Thresholds**: Gold ($87.48\text{ g}$) and Silver ($612.36\text{ g}$) standards with customizable spot commodity prices.
- **Multi-Currency Support**: 10 global currencies (USD, GBP, EUR, SAR, AED, INR, PKR, BDT, MYR, CAD).
- **Asset Categories**: Cash in hand and bank accounts, precious metals, stocks/investments, and business inventory.
- **Deductions & Liability**: Accounts for short-term due debts and bills to determine exact net Zakatable wealth and $2.5\%$ liability.
- **Fiqh Guidance**: Explains the 8 eligible recipient categories based on Surah At-Tawbah (9:60).

### 🔍 5. Halal Food & E-Number Scanner (`/halal`)
- **Camera Barcode Scanner**: Uses device camera via the modern web `BarcodeDetector` API.
- **OpenFoodFacts Integration**: Automatically fetches ingredient breakdown for packaged food products.
- **Classification**: Categorizes ingredients and additives as **Halal**, **Mushbooh** (doubtful / requires verification), or **Haram** (e.g. E120 Carmine, E441 Gelatin, pork enzymes, non-halal animal fats).
- **Comprehensive E-Number Dictionary**: Searchable database of 100+ food additives with detailed dietary rulings.

### 🤲 6. Smart Missed Prayer (Qadā) Tracker (`/qada`)
- **Individual Prayer Counters**: Log missed prayers for Fajr, Dhuhr, Asr, Maghrib, Isha, and Witr.
- **Quick Logging**: `+1`, `-1`, `+5`, `-5` adjustments and a quick *"Prayed 1"* decrement button.
- **Estimation Wizard**: Accurately estimate missed prayers based on months or years since maturity/puberty.
- **Repayment Forecast**: Projects exact completion date based on daily repayment pacing (e.g. praying 1 Qadā with every Fard prayer).

### 🧭 7. Qibla Compass (`/qibla`)
- **Liquid-Damped Orientation**: Uses HTML5 DeviceOrientation API with exponential moving average (EMA) damping to eliminate erratic spin and North-crossing jitter on mobile devices.
- **Precision Heading**: Calculates exact Great Circle bearing to the Ka’bah ($21.4225^\circ\text{ N}, 39.8262^\circ\text{ E}$) from your exact geolocation.

### 🕋 8. Ṣalāh Times & Masjid Finder (`/salah`, `/masjids`)
- **Astronomical Calculation**: 10 calculation authorities (MWL, Karachi, Umm Al-Qura, ISNA, Egypt, Dubai, etc.).
- **Jurisprudence (Madhhab)**: Standard (earlier Asr) vs Ḥanafī (later Asr).
- **Daily Prayer Logging**: Mark prayers as Prayed, Jamā'ah (in congregation), Delayed, or Missed.
- **Sunnah, Tahajjud & Nafl Tracking**: Track rawātib, night vigil, Ishraq, and Duha.
- **Masjid Finder**: Locates nearby mosques using OpenStreetMap Overpass API without requiring private API keys.

### 📿 9. Adhkār & Fortress of the Muslim (`/`, `/adhkar`)
- **Curated Authentic Adhkār**: Morning, evening, before sleep, and after prayer supplications with Arabic, transliteration, and English meanings.
- **Interactive Counters**: Tap to count with subtle haptic/audio feedback, streaks, and a 16-week completion heatmap.
- **Custom Du'as**: Create and track your own personal supplications.

### 🌙 10. Ramadan Hub (`/ramadan`)
- **Fasting Tracker**: Live countdown to Suhoor and Iftar based on local prayer coordinates.
- **Tarawih & Khatmah**: Daily Tarawih tracker (8 or 20 Rak'ahs) and 30-day Qur'an completion planner.

### 🎧 11. Ambient Islamic Focus (`/ambient`)
- **Immersive Soundscapes**: Rain on masjid dome, desert night breeze, Makkah courtyard ambience, and dhikr breathing pacer.

### 👤 12. Personalized Profile & Settings (`/settings`)
- **Islamic Avatar Motifs**: Choose from 8 motifs (Hilāl 🌙, Qur’an 📖, Tasbīḥ 📿, Masjid 🕌, Fanous 🕯️, Olive 🌿, Rub al-Hizb ۞, Ka’bah 🕋) with 6 color accents.
- **Spiritual Aspiration (Niyyah)**: Set your personal spiritual goal with inspiring presets.
- **Madhhab Preference**: Standard (Shāfi‘ī, Mālikī, Ḥanbalī) vs Ḥanafī vs Ja‘farī.
- **GPS City Auto-Detection**: Instant reverse-geocoding of city/country via browser geolocation.
- **Daily Targets**: Set daily dhikr targets (33, 100, 300, 500, 1000) and daily Qur'an verse goals.
- **Hijri Moon Sighting Adjustment**: Offset calendar by $\pm 2$ days with live preview of today's Islamic date.
- **Data Sovereignty & JSON Export**: 1-click download of all user logs, bookmarks, and streaks as an encrypted JSON backup.

### 🔔 13. Web Push Notifications & Background Service
- **Serverless Scheduled Cron**: Background push notifications deliver authentic morning and evening adhkār at customized times even when the browser or app is closed.
- **Branded Notification Cards**: Vibrant brand icons, action buttons, and gentle Islamic vibration patterns.

### 🌿 14. Custom 404 Experience (`app/not-found.tsx`)
- Spiritually uplifting 404 error page featuring Surah Ad-Duha (93:7) with an interactive navigation recovery grid.

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server & Client Components) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict typing) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with CSS custom properties |
| **Database & ORM** | [Neon](https://neon.tech/) (Serverless PostgreSQL + PgBouncer Pooling) + [Drizzle ORM](https://orm.drizzle.team/) |
| **Rate Limiter & Cache** | [Upstash](https://upstash.com/) (Serverless Redis & Sliding Window Rate Limiting) |
| **Local-First Storage** | Typed [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) Engine + dual-write fallback |
| **Authentication** | Decoupled Serverless Session API (`/api/auth`) with `scrypt` hashing & HTTP-only cookies |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Prayer Calculations** | [adhan](https://github.com/batoulapps/adhan-js) |
| **Analytics & Charts** | [Recharts](https://recharts.org/) |
| **Push Notifications** | [web-push](https://github.com/web-push-libs/web-push) + Vercel Cron |
| **Barcode Scanning** | Native Web `BarcodeDetector` API + [OpenFoodFacts API](https://world.openfoodfacts.org/) |
| **Testing** | [Vitest](https://vitest.dev/) (14 test suites, 82 tests) |
| **Typography** | Noto Naskh Arabic, Crimson Pro, Inter |

---

## 📁 Project Structure

```
dhikrly/
├── app/
│   ├── page.tsx                     # Daily Adhkār & Home Dashboard
│   ├── salah/page.tsx               # Ṣalāh Tracker, Times & Sunnah
│   ├── quran/page.tsx               # Qur'an Reader, WBW & Hifz Mode
│   ├── zakat/page.tsx               # Zakāt & Nisāb Threshold Calculator
│   ├── halal/page.tsx               # Barcode Scanner & E-Number Dictionary
│   ├── qada/page.tsx                # Smart Missed Prayer Tracker
│   ├── qibla/page.tsx               # Liquid-Damped Qibla Compass
│   ├── ramadan/page.tsx             # Ramadan & Fasting Tracker
│   ├── masjids/page.tsx             # Nearby Mosque Locator (OpenStreetMap)
│   ├── ambient/page.tsx             # Islamic Focus Soundscapes
│   ├── insights/page.tsx            # Khatm Analytics & Habit Trends
│   ├── adhkar/page.tsx              # Fortress of the Muslim Library
│   ├── settings/page.tsx            # Profile, Madhhab, Targets & Export
│   ├── not-found.tsx                # Branded 404 Not Found Page
│   └── api/
│       ├── cron/notifications/      # Scheduled Push Notification Runner
│       ├── push/                    # Web Push Subscribe / Unsubscribe
│       └── quran/                   # Qur'an Proxy & Data Provider
├── components/
│   ├── AppShell.tsx                 # Navigation Shell, Drawer & Header
│   ├── JumuahBanner.tsx             # Jumu'ah Checklist & Kahf Reminders
│   ├── QuranWordModal.tsx           # Word-by-Word Translation & Audio Modal
│   ├── QuranLoopModal.tsx           # Audio Repeat & Range Looping Modal
│   ├── QuranTrackerModal.tsx        # Qur'an Recitation Logging Modal
│   ├── AuthModal.tsx                # Supabase Email & Google Sign-In
│   ├── NotificationSettings.tsx     # Web Push Timing & Supabase SQL Helper
│   └── UpdateBanner.tsx             # In-App Version Update Notification
├── hooks/
│   ├── useAuth.ts                   # Supabase Session Management
│   ├── useSync.ts                   # Resilient Non-Destructive Cloud Sync
│   ├── useSalahSync.ts              # Prayer Progress Synchronization
│   ├── usePrayerTimes.ts            # Astronomical Calculation Hook
│   └── useAppUpdate.ts              # Changelog & Update Notification Hook
├── lib/
│   ├── jumuah.ts                    # Jumu'ah State & Timing Calculations
│   ├── quranWbw.ts                  # Quran.com WBW API & Audio CDN Loader
│   ├── halalData.ts                 # Food Additives & E-Numbers Database
│   ├── qadaStorage.ts               # Qadā Calculations & Forecast Engine
│   ├── quranTracker.ts              # Khatm Progress & Reading Analytics
│   ├── prayerTimes.ts               # Adhan.js Integration & Location Math
│   ├── storage.ts                   # Resilient LocalStorage Helpers
│   └── supabase.ts                  # Supabase Client Configuration
└── public/
    ├── sw.js                        # PWA Service Worker (Cache-first/Network-first)
    ├── manifest.json                # PWA Manifest
    └── changelog.json               # In-App Update Changelog & Release Feed
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** 18.18+ or 20+
- **npm** 9+ or **pnpm**

### 2. Installation
```bash
git clone https://github.com/nazrulislambhat/dhikrly.git
cd dhikrly
npm install
```

### 3. Environment Configuration
Create a `.env.local` file based on `.env.local.example`:
```bash
# ── Neon Serverless PostgreSQL (Pooled Connection via PgBouncer) ──
DATABASE_URL=postgres://neondb_owner:your_password@ep-cool-butterfly-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# ── Upstash Serverless Redis (Rate Limiting & Abuse Prevention) ──
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# ── Decoupled Auth Secret (Generate via: openssl rand -hex 32) ──
AUTH_SECRET=your-32-byte-random-auth-secret

# ── Web Push VAPID (Generate via: npx web-push generate-vapid-keys) ──
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_EMAIL=mailto:salam@dhikrly.com

# ── Cron Security (Random 32-byte secret for /api/cron/notifications) ──
CRON_SECRET=your-secure-cron-secret

# ── Public Site URL ──
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Push Database Schema to Neon
Run Drizzle Kit to automatically apply all 11 tables to your Neon PostgreSQL database:
```bash
npm run db:push
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Running Tests & Type Checks
```bash
npm run type-check   # Validate TypeScript types (0 errors)
npm test             # Run Vitest test suite (82 passing tests)
```

---

## ☁️ Serverless Infrastructure (Zero VPS, Zero Maintenance)

> **Do you need to buy a dedicated server?**
> **No!** Dhikrly is 100% serverless and autoscaling. You do not need to purchase or configure an Ubuntu/Debian server, Docker containers, or Nginx reverse proxies.

- **Neon (PostgreSQL)**: Create a free account at [neon.tech](https://neon.tech). Neon provides 0.5 GB of free serverless PostgreSQL storage, instant branching, and built-in PgBouncer connection pooling. Its connection pooler handles 10,000+ simultaneous connections with zero connection exhaustion during prayer time concurrency spikes.
- **Upstash (Redis)**: Create a free account at [upstash.com](https://upstash.com). Upstash provides 10,000 free commands per day and powers sliding-window rate limiting on `/api/auth/*` and `/api/v1/sync` to protect against brute-force attacks and abuse.
- **Vercel / Next.js**: Host for free on Vercel or any Node.js host.

---

## 📱 PWA & Offline Support

Dhikrly is built from the ground up as a **Progressive Web App**:
- **Offline First**: All 114 Surahs, adhkār collections, and E-number dictionaries are stored locally.
- **Installable**: Installable on iOS (Safari *Add to Home Screen*), Android (Chrome install banner), and desktop Chrome/Edge.
- **Service Worker Lifecycle**: Automatically notifies users via an in-app banner whenever a new release is deployed, enabling instant updates without hard-refreshing.

---

## 🔒 Data Privacy & Sovereignty

- **No Third-Party Trackers**: Dhikrly does not track, monetize, or sell user data.
- **Local-First Storage**: All worship logs, prayer counters, and notes reside securely on your device.
- **Full JSON Export**: Easily export your entire spiritual history in open JSON format anytime from **Settings → Data Sovereignty**.

---

## 🤝 Contributing

Contributions are welcomed with open arms.
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request against `develop`.

---

## 📄 License & Sadaqah Jariyah

This project is licensed under the [MIT License](LICENSE).

_May Allah accept this effort, forgive our shortcomings, and make it a source of continuous benefit for the Ummah. آمين_
