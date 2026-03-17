import type { Metadata, Viewport } from "next";
import { Crimson_Pro, Scheherazade_New } from "next/font/google";
import "./globals.css";

/* ── Google Fonts ─────────────────────────────────────────────── */
const crimsonPro = Crimson_Pro({
  subsets:  ["latin"],
  weight:   ["400", "600"],
  style:    ["normal", "italic"],
  variable: "--font-crimson",
  display:  "swap",
});

const scheherazade = Scheherazade_New({
  subsets:  ["arabic"],
  weight:   ["400", "700"],
  variable: "--font-scheherazade",
  display:  "swap",
});

/* ── Metadata ─────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title:       "Daily Adhkār & Du'ā | أذكار يومية",
  description: "A minimal daily tracker for Islamic adhkār and du'ā — with full Arabic text, transliteration, English meaning, streaks, and light/dark mode.",
  keywords:    ["adhkar", "dua", "islamic", "daily dhikr", "quran", "tracker", "wird"],
  authors:     [{ name: "Duas Tracker" }],
  robots:      "index, follow",
  openGraph: {
    title:       "Daily Adhkār & Du'ā Tracker",
    description: "Track your daily duas with streaks, full Arabic text, and transliteration.",
    type:        "website",
    locale:      "en_US",
  },
  icons: {
    icon: [
      { url: "/favicon.ico",         sizes: "any"     },
      { url: "/favicon.svg",         type:  "image/svg+xml" },
      { url: "/favicon-16x16.png",   sizes: "16x16",  type: "image/png" },
      { url: "/favicon-32x32.png",   sizes: "32x32",  type: "image/png" },
      { url: "/favicon-48x48.png",   sizes: "48x48",  type: "image/png" },
      { url: "/favicon-128x128.png", sizes: "128x128",type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192",type: "image/png" },
    ],
    apple:    "/favicon-180x180.png",
    shortcut: "/favicon-192x192.png",
  },
};

export const viewport: Viewport = {
  width:        "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#0c1a2e" },
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
  ],
};

/* ── Root Layout ──────────────────────────────────────────────── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${crimsonPro.variable} ${scheherazade.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Reads localStorage BEFORE React hydrates so the
          correct .dark / .light class is on <html> immediately,
          preventing any flash-of-wrong-theme.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var s = JSON.parse(localStorage.getItem('duas_settings_v3') || '{}');
                  document.documentElement.classList.add(s.dark === false ? 'light' : 'dark');
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
