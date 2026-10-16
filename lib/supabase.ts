import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

export const hasSupabaseConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co') &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-anon-key'
);

if (!hasSupabaseConfig) {
  // Only warn in dev/build, do not throw
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'adhkar-auth',
  },
});

/* ── Typed DB helpers ── */
export type DailyProgressRow = {
  id: string;
  user_id: string;
  date: string;                          // "YYYY-MM-DD"
  checked: Record<string, boolean>;
  updated_at: string;
};

export type CustomDuaRow = {
  id: string;
  user_id: string;
  local_id: string;
  dua: Record<string, unknown>;
  created_at: string;
};

export type UserDataRow = {
  user_id: string;
  streak: { current: number; best: number; lastComplete: string };
  notif_settings: Record<string, unknown>;
  updated_at: string;
};
