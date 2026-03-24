import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomNavWrapper from '@/components/BottomNavWrapper';

export const metadata: Metadata = {
  title: "Dhikrly — Adhkār, Du'ā & Ṣalāh",
  description:
    "Track your daily Islamic remembrances, supplications, and prayers. Morning & evening adhkār with streaks, reminders, and salah tracker.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Dhikrly',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    title: "Dhikrly — Adhkār, Du'ā & Ṣalāh",
    description: 'Track your daily Islamic remembrances, supplications, and prayers.',
  },
};

export const viewport: Viewport = {
  themeColor: '#0c1a2e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Dhikrly" />
      </head>
      <body suppressHydrationWarning>
        {children}
        <BottomNavWrapper />
      </body>
    </html>
  );
}
