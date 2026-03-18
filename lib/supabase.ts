import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.local.example → .env.local and fill in your keys.'
  );
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
