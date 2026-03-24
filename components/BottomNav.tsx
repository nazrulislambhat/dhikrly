'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavProps { dark: boolean; }

const TABS = [
  { href: '/',      label: 'Adhkār',  icon: '🤲' },
  { href: '/salah', label: 'Ṣalāh',   icon: '🕌' },
];

export default function BottomNav({ dark }: BottomNavProps) {
  const pathname = usePathname();

  // Don't show on legal pages
  if (pathname.startsWith('/privacy') || pathname.startsWith('/terms') ||
      pathname.startsWith('/contact') || pathname.startsWith('/about')) return null;

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t pb-safe ${
      dark ? 'bg-[#0c1a2e]/95 border-white/[0.07] backdrop-blur-md' : 'bg-white/95 border-stone-200 backdrop-blur-md shadow-lg'
    }`}>
      <div className="mx-auto flex max-w-2xl">
        {TABS.map(tab => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-center transition-all ${
                active
                  ? dark ? 'text-amber-400' : 'text-amber-700'
                  : dark ? 'text-stone-600 hover:text-stone-400' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className={`text-[10px] font-medium uppercase tracking-widest`}>
                {tab.label}
              </span>
              {active && (
                <span className={`absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full ${dark ? 'bg-amber-400' : 'bg-amber-600'}`} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
