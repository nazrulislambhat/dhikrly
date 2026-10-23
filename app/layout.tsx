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
  themeColor: '#f5f8f7',
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem('duas_settings_v3')||'{}');if(s.dark){document.documentElement.classList.add('dark');}var a=localStorage.getItem('dhikrly_accent_color_v1')||'emerald';var p={emerald:{l:{p:'#0d5e42',h:'#094430',fg:'#fff'},d:{p:'#10b981',h:'#34d399',fg:'#021a10'}},amber:{l:{p:'#c25708',h:'#9a4204',fg:'#fff'},d:{p:'#f59e0b',h:'#fbbf24',fg:'#1c0d02'}},teal:{l:{p:'#0f766e',h:'#115e59',fg:'#fff'},d:{p:'#14b8a6',h:'#2dd4bf',fg:'#021a17'}},sky:{l:{p:'#0369a1',h:'#075985',fg:'#fff'},d:{p:'#38bdf8',h:'#7dd3fc',fg:'#041624'}},rose:{l:{p:'#be123c',h:'#9f1239',fg:'#fff'},d:{p:'#fb7185',h:'#fda4af',fg:'#24040a'}},violet:{l:{p:'#6d28d9',h:'#5b21b6',fg:'#fff'},d:{p:'#a78bfa',h:'#c4b5fd',fg:'#14092b'}}};var pal=p[a]||p.emerald;var isD=s.dark||document.documentElement.classList.contains('dark');var c=isD?pal.d:pal.l;document.documentElement.style.setProperty('--app-primary',c.p);document.documentElement.style.setProperty('--app-primary-hover',c.h);document.documentElement.style.setProperty('--app-primary-fg',c.fg);document.documentElement.style.setProperty('--app-accent',c.p);}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
