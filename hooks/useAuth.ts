'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import { migrateLocalDataToCloud } from '@/lib/syncEngine';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

interface RawServerUser {
  id: string;
  email?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  accentColor?: string | null;
  timezone?: string | null;
  city?: string | null;
  country?: string | null;
  calculationMethod?: string | null;
  madhhab?: string | null;
  niyyah?: string | null;
  hijriOffset?: number | null;
  dailyDhikrGoal?: number | null;
  user_metadata?: Record<string, unknown>;
  createdAt?: string;
}

function toAuthUser(data: RawServerUser): User {
  const metadata = {
    full_name: data.displayName || data.user_metadata?.full_name,
    name: data.displayName || data.user_metadata?.name,
    avatar_url: data.avatarUrl || data.user_metadata?.avatar_url,
    picture: data.avatarUrl || data.user_metadata?.picture,
    accent_color: data.accentColor || data.user_metadata?.accent_color,
    timezone: data.timezone || data.user_metadata?.timezone,
    city: data.city || data.user_metadata?.city,
    country: data.country || data.user_metadata?.country,
    calculation_method: data.calculationMethod || data.user_metadata?.calculation_method,
    madhhab: data.madhhab || data.user_metadata?.madhhab,
    niyyah: data.niyyah || data.user_metadata?.niyyah,
    hijri_offset: data.hijriOffset ?? data.user_metadata?.hijri_offset,
    daily_dhikr_goal: data.dailyDhikrGoal ?? data.user_metadata?.daily_dhikr_goal,
    ...data.user_metadata,
  };

  return {
    id: data.id,
    app_metadata: {},
    user_metadata: metadata,
    aud: 'authenticated',
    created_at: data.createdAt || new Date().toISOString(),
    email: data.email,
  } as unknown as User;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  const refreshUser = useCallback(async () => {
    try {
      // 1. Try our decoupled backend session endpoint
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          const authUser = toAuthUser(data.user);
          setState({
            user: authUser,
            session: { user: authUser } as unknown as Session,
            loading: false,
          });
          void migrateLocalDataToCloud(authUser.id);
          return;
        }
      }

      // 2. Fallback to Supabase during migration if configured
      if (hasSupabaseConfig) {
        const { data: { session } } = await supabase.auth.getSession();
        setState({ user: session?.user ?? null, session, loading: false });
        return;
      }

      setState({ user: null, session: null, loading: false });
    } catch {
      setState({ user: null, session: null, loading: false });
    }
  }, []);

  useEffect(() => {
    refreshUser();

    // Listen to Supabase if configured for legacy sessions
    if (hasSupabaseConfig) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setState({ user: session.user, session, loading: false });
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [refreshUser]);

  /* ── Email / Password Sign Up ── */
  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          // If server database is not yet configured, fallback to Supabase
          if (res.status === 503 && hasSupabaseConfig) {
            return await supabase.auth.signUp({
              email,
              password,
              options: { emailRedirectTo: `${window.location.origin}/` },
            });
          }
          return { error: { message: data.error || 'Registration failed' } };
        }

        if (data.user) {
          const authUser = toAuthUser(data.user);
          setState({ user: authUser, session: { user: authUser } as unknown as Session, loading: false });
          void migrateLocalDataToCloud(authUser.id);
        }
        return { error: null };
      } catch (err) {
        return { error: { message: (err as Error).message || 'Network error during sign up' } };
      }
    },
    []
  );

  /* ── Email / Password Sign In ── */
  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          // If server database is not yet configured, fallback to Supabase
          if (res.status === 503 && hasSupabaseConfig) {
            return await supabase.auth.signInWithPassword({ email, password });
          }
          return { error: { message: data.error || 'Invalid email or password' } };
        }

        if (data.user) {
          const authUser = toAuthUser(data.user);
          setState({ user: authUser, session: { user: authUser } as unknown as Session, loading: false });
          void migrateLocalDataToCloud(authUser.id);
        }
        return { error: null };
      } catch (err) {
        return { error: { message: (err as Error).message || 'Network error during sign in' } };
      }
    },
    []
  );

  /* ── Password Reset ── */
  const resetPassword = useCallback(async (email: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (hasSupabaseConfig) {
          return await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/`,
          });
        }
        return { error: { message: data.error || 'Password reset request failed' } };
      }
      return { error: null };
    } catch (err) {
      return { error: { message: (err as Error).message || 'Network error' } };
    }
  }, []);

  /* ── Google OAuth ── */
  const signInWithGoogle = useCallback(async () => {
    if (hasSupabaseConfig) {
      return await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
    }
    return { error: { message: 'Google OAuth requires client credentials configuration.' } };
  }, []);

  /* ── Sign Out ── */
  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      if (hasSupabaseConfig) {
        await supabase.auth.signOut();
      }
    } finally {
      setState({ user: null, session: null, loading: false });
    }
  }, []);

  return {
    ...state,
    refreshUser,
    signUpWithEmail,
    signInWithEmail,
    resetPassword,
    signInWithGoogle,
    signOut,
  };
}
