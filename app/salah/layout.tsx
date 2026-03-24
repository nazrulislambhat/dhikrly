import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Ṣalāh Tracker — Dhikrly",
  description: "Track your daily five prayers, Sunnah, Tahajjud and Nafl with accurate prayer times and nearby masjid finder.",
};

export default function SalahLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
