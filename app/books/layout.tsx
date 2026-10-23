import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sunni Fiqh Book Recommendations — Ḥanafī, Shāfi‘ī, Mālikī & Ḥanbalī | Dhikrly',
  description:
    'Curated classical and contemporary Islamic jurisprudence works across the 4 Sunni Madhhabs with curriculum levels, verified bookstore links, and study roadmaps.',
  openGraph: {
    title: 'Sunni Fiqh Library & Book Recommendations | Dhikrly',
    description:
      'Curated classical and contemporary Islamic jurisprudence works across the 4 Sunni Madhhabs with curriculum levels and verified bookstore links.',
  },
};

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
