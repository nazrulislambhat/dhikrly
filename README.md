# Dhikrly — ذِكْرلي

Daily Adhkār, Du'ā & Ṣalāh tracker. Offline-first PWA with cross-device sync.

**Live:** [dhikrly.vercel.app](https://dhikrly.vercel.app)

---

## Features

**Adhkār & Du'ā**
- 14 curated duas — Arabic, English, transliteration
- Daily completion tracking with streaks & 16-week heatmap
- Custom duas, missed day recovery, morning/evening reminders
- Background push notifications (server-side, works when app is closed)

**Ṣalāh Tracker**
- Accurate prayer times via GPS or city selection (adhan.js)
- 5 daily prayers with Prayed / Jamā'ah / Delayed / Missed status
- Sunnah, Tahajjud, and Nafl tracking
- Prayer insights dashboard with weekly chart
- Nearby masjid finder (OpenStreetMap, no API key needed)

**Platform**
- Installable PWA — works offline, add to home screen
- Cross-device sync (Supabase) — sign in with Email or Google
- In-app update notifications with changelog
- Dark / light mode

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| Prayer Times | adhan.js |
| Charts | Recharts |
| Auth & Sync | Supabase |
| Push | web-push + Vercel Cron |
| Fonts | Crimson Pro · Noto Naskh Arabic |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Adhkār & Du'ā page
│   ├── salah/page.tsx        # Ṣalāh tracker page
│   ├── api/
│   │   ├── cron/notifications/  # Vercel cron — sends push at scheduled times
│   │   └── push/                # Subscribe / unsubscribe endpoints
│   ├── privacy · terms · contact · about
│   └── globals.css
├── components/
│   ├── salah/                # PrayerCard, SunnahPanel, TahajjudPanel, etc.
│   ├── AuthModal.tsx
│   ├── BottomNav.tsx
│   ├── NotificationSettings.tsx
│   └── UpdateBanner.tsx
├── hooks/
│   ├── useChecked.ts · useStreak.ts · useSync.ts
│   ├── usePrayerTimes.ts · useSalahLog.ts · useSalahSync.ts
│   └── usePushSubscription.ts · useAppUpdate.ts
├── lib/
│   ├── prayerTimes.ts · salahStorage.ts · storage.ts
│   ├── sounds.ts · dates.ts
│   └── supabase.ts · supabase-admin.ts
├── types/
│   ├── index.ts              # Adhkār types
│   └── salah.ts              # Ṣalāh types
└── data/duas.json
public/
├── sw.js                     # Service worker
├── manifest.json             # PWA manifest
└── changelog.json            # Edit on every deploy for update banner
```

---

## Getting Started

```bash
git clone https://github.com/nazrulislambhat/dhikrly.git
cd dhikrly
npm install
cp .env.local.example .env.local   # fill in your keys
npm run dev
```

---

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---
```
## Supabase Setup

1. Run `supabase-schema.sql` in Supabase SQL Editor
2. Enable Email + Google providers in Authentication → Providers
3. Add your domain to Authentication → URL Configuration

---

## Deploying an Update

Edit `public/changelog.json` — bump `"current"` and add a release entry. Users see an update pill within 5 minutes of deployment.

---

## localStorage Keys

| Key | Contents |
|---|---|
| `duas_checked_v3` | Daily adhkār completion (90 days) |
| `duas_streak_v3` | Current & best streak |
| `duas_settings_v3` | Dark mode, sound preference |
| `salah_log_v1` | Daily prayer logs (120 days) |
| `salah_settings_v1` | Location, calc method, tracking toggles |

---

*May Allah accept it from all of us. آمين*
