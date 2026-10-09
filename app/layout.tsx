import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Dhikrly — Adhkār, Qur’an & Ṣalāh",
  description:
    'Read and listen to the Quran, track daily remembrances and supplications, and keep a record of your prayers.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Dhikrly',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    title: "Dhikrly — Adhkār, Qur’an & Ṣalāh",
    description:
      'Read and listen to the Quran, track daily remembrances and supplications, and keep a record of your prayers.',
  },
};

export const viewport: Viewport = {
  themeColor: '#fffaf2',
  width: 'device-width',
  initialScale: 1,
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
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Dhikrly" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
