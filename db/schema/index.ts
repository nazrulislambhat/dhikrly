import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  date,
  uuid,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ── 1. USERS & ACCOUNTS ──────────────────────────────────────────────
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash'),
    displayName: varchar('display_name', { length: 120 }),
    avatarUrl: text('avatar_url'),
    accentColor: varchar('accent_color', { length: 30 }).default('emerald'),
    timezone: varchar('timezone', { length: 60 }).default('UTC'),
    city: varchar('city', { length: 100 }),
    country: varchar('country', { length: 100 }),
    calculationMethod: varchar('calculation_method', { length: 60 }).default('MuslimWorldLeague'),
    madhhab: varchar('madhhab', { length: 30 }).default('Standard'),
    niyyah: text('niyyah'),
    hijriOffset: integer('hijri_offset').default(0),
    dailyDhikrGoal: integer('daily_dhikr_goal').default(100),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('users_email_idx').on(table.email),
  ]
);

// ── 2. SESSIONS (Decoupled Authentication) ───────────────────────────
export const sessions = pgTable(
  'sessions',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('sessions_user_id_idx').on(table.userId),
  ]
);

// ── 3. ADHKĀR DAILY COMPLETIONS ──────────────────────────────────────
export const adhkarCompletions = pgTable(
  'adhkar_completions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    duaId: varchar('dua_id', { length: 100 }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),
    deviceId: varchar('device_id', { length: 100 }),
  },
  (table) => [
    uniqueIndex('adhkar_user_date_dua_idx').on(table.userId, table.date, table.duaId),
    index('adhkar_user_date_idx').on(table.userId, table.date),
  ]
);

// ── 4. CUSTOM DU‘ĀS ──────────────────────────────────────────────────
export const customDuas = pgTable(
  'custom_duas',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    clientDuaId: varchar('client_dua_id', { length: 100 }).notNull(),
    title: text('title').notNull(),
    arabic: text('arabic'),
    transliteration: text('transliteration'),
    translation: text('translation'),
    category: varchar('category', { length: 50 }).default('custom'),
    repeatCount: integer('repeat_count').default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('custom_duas_user_client_id_idx').on(table.userId, table.clientDuaId),
    index('custom_duas_user_idx').on(table.userId),
  ]
);

// ── 5. ṢALĀH LOGS ────────────────────────────────────────────────────
export const salahLogs = pgTable(
  'salah_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    prayer: varchar('prayer', { length: 30 }).notNull(), // 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha'
    status: varchar('status', { length: 30 }).notNull(), // 'completed', 'missed', 'excused'
    isCongregation: boolean('is_congregation').default(false).notNull(),
    loggedAt: timestamp('logged_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('salah_user_date_prayer_idx').on(table.userId, table.date, table.prayer),
    index('salah_user_date_idx').on(table.userId, table.date),
  ]
);

// ── 6. QADĀ BALANCES & REPAYMENT HISTORY ──────────────────────────────
export const qadaBalances = pgTable(
  'qada_balances',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    fajr: integer('fajr').default(0).notNull(),
    dhuhr: integer('dhuhr').default(0).notNull(),
    asr: integer('asr').default(0).notNull(),
    maghrib: integer('maghrib').default(0).notNull(),
    isha: integer('isha').default(0).notNull(),
    witr: integer('witr').default(0).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

export const qadaHistory = pgTable(
  'qada_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    prayer: varchar('prayer', { length: 30 }).notNull(),
    count: integer('count').default(1).notNull(),
    repaidAt: timestamp('repaid_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('qada_history_user_idx').on(table.userId, table.repaidAt),
  ]
);

// ── 7. QUR’AN PROGRESS & BOOKMARKS ───────────────────────────────────
export const quranProgress = pgTable(
  'quran_progress',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    surah: integer('surah').default(1).notNull(),
    ayah: integer('ayah').default(1).notNull(),
    page: integer('page').default(1).notNull(),
    juz: integer('juz').default(1).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

export const quranBookmarks = pgTable(
  'quran_bookmarks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    surah: integer('surah').notNull(),
    ayah: integer('ayah').notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('quran_user_surah_ayah_idx').on(table.userId, table.surah, table.ayah),
    index('quran_bookmarks_user_idx').on(table.userId),
  ]
);

// ── 8. TASBĪḤ SESSIONS & COUNTERS ─────────────────────────────────────
export const tasbihSessions = pgTable(
  'tasbih_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    dhikrKey: varchar('dhikr_key', { length: 100 }).notNull(),
    count: integer('count').notNull(),
    target: integer('target').default(33),
    completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('tasbih_user_date_idx').on(table.userId, table.completedAt),
  ]
);

// ── 9. USER STREAKS & HABIT STATS ────────────────────────────────────
export const userStreaks = pgTable(
  'user_streaks',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    currentStreak: integer('current_streak').default(0).notNull(),
    longestStreak: integer('longest_streak').default(0).notNull(),
    lastCompletedDate: date('last_completed_date'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

// ── 10. RAMAḌĀN & FASTING LOGS ───────────────────────────────────────
export const ramadanLogs = pgTable(
  'ramadan_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    hijriYear: integer('hijri_year').notNull(),
    fastDay: integer('fast_day').notNull(),
    fastCompleted: boolean('fast_completed').default(true).notNull(),
    suhoorDua: boolean('suhoor_dua').default(false),
    iftarDua: boolean('iftar_dua').default(false),
    taraweehRakahs: integer('taraweeh_rakahs').default(0),
    notes: text('notes'),
    loggedAt: timestamp('logged_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('ramadan_user_year_day_idx').on(table.userId, table.hijriYear, table.fastDay),
    index('ramadan_user_idx').on(table.userId),
  ]
);

// ── 11. WEB PUSH NOTIFICATIONS ────────────────────────────────────────
export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    deviceId: varchar('device_id', { length: 120 }),
    endpoint: text('endpoint').notNull().unique(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    morningEnabled: boolean('morning_enabled').default(false).notNull(),
    morningTime: varchar('morning_time', { length: 10 }).default('06:00').notNull(),
    eveningEnabled: boolean('evening_enabled').default(false).notNull(),
    eveningTime: varchar('evening_time', { length: 10 }).default('18:00').notNull(),
    timezone: varchar('timezone', { length: 60 }).default('UTC').notNull(),
    lastSentMorning: date('last_sent_morning'),
    lastSentEvening: date('last_sent_evening'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('push_user_idx').on(table.userId),
    index('push_morning_idx').on(table.morningEnabled, table.morningTime),
    index('push_evening_idx').on(table.eveningEnabled, table.eveningTime),
  ]
);

// ── RELATIONS ────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  adhkarCompletions: many(adhkarCompletions),
  customDuas: many(customDuas),
  salahLogs: many(salahLogs),
  qadaBalance: one(qadaBalances, {
    fields: [users.id],
    references: [qadaBalances.userId],
  }),
  qadaHistory: many(qadaHistory),
  quranProgress: one(quranProgress, {
    fields: [users.id],
    references: [quranProgress.userId],
  }),
  quranBookmarks: many(quranBookmarks),
  tasbihSessions: many(tasbihSessions),
  streak: one(userStreaks, {
    fields: [users.id],
    references: [userStreaks.userId],
  }),
  ramadanLogs: many(ramadanLogs),
  pushSubscriptions: many(pushSubscriptions),
}));
