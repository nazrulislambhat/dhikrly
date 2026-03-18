'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

type AuthView = 'signin' | 'signup' | 'reset';

interface AuthModalProps {
  dark: boolean;
  onClose: () => void;
}

export default function AuthModal({ dark, onClose }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } =
    useAuth();

  const [view, setView] = useState<AuthView>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const clearMessages = () => { setError(''); setSuccess(''); };

  const handleSubmit = async () => {
    if (!email.trim()) { setError('Email is required'); return; }
    if (view !== 'reset' && !password.trim()) { setError('Password is required'); return; }
    if (view === 'signup' && password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      if (view === 'signin') {
        const { error } = await signInWithEmail(email, password);
        if (error) { setError(error.message); return; }
        onClose();
      } else if (view === 'signup') {
        const { error } = await signUpWithEmail(email, password);
        if (error) { setError(error.message); return; }
        setSuccess('Check your email for a confirmation link.');
      } else if (view === 'reset') {
        const { error } = await resetPassword(email);
        if (error) { setError(error.message); return; }
        setSuccess('Password reset link sent. Check your email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    clearMessages();
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
    // On success the page redirects — no cleanup needed
  };

  const overlay = dark
    ? 'bg-[#0c1a2e]/80 backdrop-blur-sm'
    : 'bg-stone-900/40 backdrop-blur-sm';
  const panel = dark
    ? 'bg-[#111f33] border-white/10'
    : 'bg-white border-stone-200';
  const inputCls = dark
    ? 'bg-white/5 border-white/10 text-stone-200 placeholder-stone-600 focus:border-amber-400/50'
    : 'bg-stone-50 border-stone-200 text-stone-700 placeholder-stone-400 focus:border-amber-400';
  const mutedText = dark ? 'text-stone-500' : 'text-stone-400';
  const labelText = dark ? 'text-stone-300' : 'text-stone-600';
  const divider = dark ? 'border-white/10' : 'border-stone-200';

  const TITLE: Record<AuthView, string> = {
    signin: 'Welcome back',
    signup: 'Create account',
    reset: 'Reset password',
  };

  const SUBTITLE: Record<AuthView, string> = {
    signin: 'Sign in to sync your adhkār across devices',
    signup: 'Your progress will be synced across all your devices',
    reset: 'We\'ll send a reset link to your email',
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlay}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl ${panel}`}>

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className={`font-serif text-xl font-semibold ${dark ? 'text-stone-100' : 'text-stone-800'}`}>
              {TITLE[view]}
            </h2>
            <p className={`mt-1 text-[11px] ${mutedText}`}>{SUBTITLE[view]}</p>
          </div>
          <button
            onClick={onClose}
            className={`rounded-full p-1.5 transition-colors ${dark ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'}`}
          >✕</button>
        </div>

        {/* Google button (not on reset view) */}
        {view !== 'reset' && (
          <>
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className={`mb-4 flex w-full items-center justify-center gap-3 rounded-xl border py-2.5 text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-60 ${
                dark
                  ? 'border-white/10 bg-white/5 text-stone-200 hover:bg-white/10'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 shadow-sm'
              }`}
            >
              {googleLoading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <GoogleIcon />
              )}
              {googleLoading ? 'Redirecting…' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className={`mb-4 flex items-center gap-3 ${mutedText}`}>
              <div className={`flex-1 border-t ${divider}`} />
              <span className="text-[10px] uppercase tracking-wider">or</span>
              <div className={`flex-1 border-t ${divider}`} />
            </div>
          </>
        )}

        {/* Email */}
        <div className="mb-3">
          <label className={`mb-1 block text-[11px] uppercase tracking-wide ${mutedText}`}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="you@example.com"
            autoComplete="email"
            className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors ${inputCls}`}
          />
        </div>

        {/* Password (not on reset view) */}
        {view !== 'reset' && (
          <div className="mb-4">
            <label className={`mb-1 block text-[11px] uppercase tracking-wide ${mutedText}`}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={view === 'signup' ? 'Min. 8 characters' : '••••••••'}
              autoComplete={view === 'signup' ? 'new-password' : 'current-password'}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors ${inputCls}`}
            />
            {view === 'signin' && (
              <button
                onClick={() => { setView('reset'); clearMessages(); }}
                className={`mt-1.5 text-[10px] transition-colors ${dark ? 'text-amber-400/60 hover:text-amber-400' : 'text-amber-600/70 hover:text-amber-700'}`}
              >
                Forgot password?
              </button>
            )}
          </div>
        )}

        {/* Error / Success messages */}
        {error && (
          <div className={`mb-3 rounded-xl border px-3 py-2 text-[12px] ${dark ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-red-200 bg-red-50 text-red-600'}`}>
            {error}
          </div>
        )}
        {success && (
          <div className={`mb-3 rounded-xl border px-3 py-2 text-[12px] ${dark ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {success}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full rounded-xl py-2.5 text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-60 ${
            dark
              ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
              : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
        >
          {loading
            ? 'Please wait…'
            : view === 'signin'
              ? 'Sign in'
              : view === 'signup'
                ? 'Create account'
                : 'Send reset link'}
        </button>

        {/* View switcher */}
        <div className={`mt-4 text-center text-[11px] ${mutedText}`}>
          {view === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => { setView('signup'); clearMessages(); }}
                className={dark ? 'text-amber-400 hover:underline' : 'text-amber-600 hover:underline'}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => { setView('signin'); clearMessages(); }}
                className={dark ? 'text-amber-400 hover:underline' : 'text-amber-600 hover:underline'}
              >
                Sign in
              </button>
            </>
          )}
        </div>

        {/* Privacy note */}
        <p className={`mt-4 text-center text-[9px] leading-relaxed ${dark ? 'text-stone-700' : 'text-stone-300'}`}>
          Your data is stored securely. Progress syncs across devices when signed in.
        </p>
      </div>
    </div>
  );
}

/* ── Google SVG icon ── */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
