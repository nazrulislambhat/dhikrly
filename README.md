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
| Framework | Next.js 14 (App Router) |
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

## Environment Variables

```bash
# Supabase (required for sync)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# VAPID — generate with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:hello@dhikrly.app

# Cron secret — any random string (openssl rand -hex 32)
CRON_SECRET=

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Supabase Setup

1. Run `supabase-schema.sql` in Supabase SQL Editor
2. Enable Email + Google providers in Authentication → Providers
3. Add your domain to Authentication → URL Configuration

---

## Deploying an Update

Edit `public/changelog.json` — bump `"current"` and add a release entry. Users see an update pill within 5 minutes of deployment.

---

## Git Branching Strategy

```
main          ← production (Vercel auto-deploys from here)
develop       ← integration branch (all PRs merge here first)
feature/*     ← new features
fix/*         ← bug fixes
chore/*       ← dependency updates, refactors, docs
```

### Workflow

```bash
# 1. Branch off develop
git checkout develop
git pull origin develop
git checkout -b feature/tasbih-counter

# 2. Build & commit
git add .
git commit -m "feat: add tasbih counter with haptic feedback"

# 3. Push and open PR → develop
git push origin feature/tasbih-counter
# Open PR: feature/tasbih-counter → develop

# 4. After review & CI passes, merge to develop

# 5. When ready to release, merge develop → main
git checkout main
git merge develop
git push origin main
# Vercel deploys automatically
```

### Rules

- **Never push directly to `main`** — always go through `develop`
- `main` = what's live on [dhikrly.vercel.app](https://dhikrly.vercel.app)
- `develop` = staging / integration — should always be deployable
- Branch names use lowercase kebab-case: `feature/qibla-compass`, `fix/prayer-time-offset`
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org): `feat:`, `fix:`, `chore:`, `docs:`
- **Update `public/changelog.json`** when merging to `main` — bumps the version and triggers the in-app update banner for users

---

### Near-term
| Feature | Description |
|---|---|
| **Qibla Compass** | Device orientation API — points toward Makkah from anywhere, no external service |
| **Tasbih Counter** | Tap counter for dhikr (33×, 99×) with haptic feedback and auto-reset at target |
| **Prayer Time Card** | Share today's prayer times as an image (Canvas API) — for WhatsApp/Instagram |
| **Azan Audio** | Play azan at prayer time when app is open |
| **Better Arabic Input** | Arabic keyboard helper for custom dua entry |

### Mid-term
| Feature | Description |
|---|---|
| **Hijri Calendar** | Month view with completion dots — a visual prayer journal |
| **Ramadan Mode** | Suhoor/Iftar times, Tarawih tracker, 30-day Quran completion tracker |
| **Multi-language UI** | Urdu, Turkish, Indonesian — Arabic content already in place |
| **Family Streaks** | Shared accountability groups — see members' completion without seeing their duas |
| **Offline Quran Juz** | One Juz per day, stored locally, with completion tracking |

### Long-term
| Feature | Description |
|---|---|
| **AI Dua Suggestions** | Context-aware suggestions based on time, occasion (travel, illness, rain) |
| **Apple Watch / Wear OS** | Companion app — next prayer time and quick logging from the wrist |
| **Imam Dashboard** | Masjids push prayer time corrections and announcements to followers |

---

| Key | Contents |
|---|---|
| `duas_checked_v3` | Daily adhkār completion (90 days) |
| `duas_streak_v3` | Current & best streak |
| `duas_settings_v3` | Dark mode, sound preference |
| `salah_log_v1` | Daily prayer logs (120 days) |
| `salah_settings_v1` | Location, calc method, tracking toggles |

---

*May Allah accept it from all of us. آمين*
