'use client';

import Link from 'next/link';

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalLayout({
  title,
  subtitle,
  lastUpdated,
  children,
}: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      {/* Nav */}
      <nav className="border-b border-black/[0.06] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-amber-700 transition-opacity hover:opacity-70"
          >
            <span className="font-arabic text-xl">🌙</span>
            <span className="font-serif text-[15px] font-semibold tracking-wide">
              Dhikrly
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-full border border-black/10 px-4 py-1.5 text-[11px] uppercase tracking-widest text-stone-500 transition-all hover:text-stone-700"
          >
            ← Back to App
          </Link>
        </div>
      </nav>

      {/* Header */}
      <header className="border-b border-black/[0.06] bg-white py-12">
        <div className="mx-auto max-w-3xl px-6">
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-amber-600/70">
            Dhikrly · https://dhikrly.com
          </p>
          <h1 className="font-serif text-[clamp(28px,5vw,42px)] font-normal tracking-wide text-amber-700">
            {title}
          </h1>
          <p className="mt-2 text-[13px] text-stone-400">{subtitle}</p>
          <p className="mt-4 text-[11px] text-stone-400">
            Last updated: {lastUpdated}
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="prose-legal">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/[0.06] bg-white py-8">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-arabic text-lg text-amber-600/40">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacy-policy"
                className="text-[11px] uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-[11px] uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/contact"
                className="text-[11px] uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/"
                className="text-[11px] uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors"
              >
                App
              </Link>
            </div>
          </div>
          <p className="mt-4 text-[10px] text-stone-300">
            © {new Date().getFullYear()} Dhikrly. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
