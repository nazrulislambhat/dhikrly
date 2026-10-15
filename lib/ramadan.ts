/**
 * Ramadan Tracker, Duas, 30-Day Calendar & Quran Khatmah Planner
 */

export interface RamadanDayRecord {
  day: number; // 1 - 30
  date?: string; // YYYY-MM-DD
  fasted: boolean;
  prayersCount: number; // 0 - 5
  tarawih: boolean;
  tarawihRakahs?: number; // 8, 20
  quranJuz: boolean;
  juzNumber?: number; // 1 - 30
  sadaqah: boolean;
  notes?: string;
}

export interface RamadanDua {
  id: string;
  category: 'iftar' | 'suhoor' | 'qadr' | 'ashra' | 'taraweeh';
  title: string;
  titleAr: string;
  ar: string;
  transliteration: string;
  en: string;
  reference: string;
  significance: string;
}

export const RAMADAN_DUAS: RamadanDua[] = [
  {
    id: 'iftar-thahaba',
    category: 'iftar',
    title: 'Dua at the Time of Breaking Fast (Iftar)',
    titleAr: 'دعاء الإفطار المأثور',
    ar: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ',
    transliteration: 'Dhahaba adh-dhama’u wabtallatil-‘urooqu wa thabatal-ajru in sha’ Allah.',
    en: 'The thirst has gone, the veins are moistened, and the reward is confirmed, if Allah wills.',
    reference: 'Sunan Abi Dawud (2357) — Sahih',
    significance: 'Recited immediately upon taking the first sip of water or date at Maghrib.',
  },
  {
    id: 'iftar-allahumma',
    category: 'iftar',
    title: 'Dua Before Breaking Fast',
    titleAr: 'اللهم إني لك صمت',
    ar: 'اللَّهُمَّ إِنِّي لَكَ صُمْتُ وَبِكَ آمَنْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ',
    transliteration: 'Allāhumma innī laka ṣumtu wa bika āmantu wa ‘alā rizqika afṭart.',
    en: 'O Allah, for You I have fasted, in You I have believed, and with Your provision I have broken my fast.',
    reference: 'Abu Dawud (2358)',
    significance: 'Traditional supplication expressing gratitude for the sustenance provided.',
  },
  {
    id: 'suhoor-niyyah',
    category: 'suhoor',
    title: 'Intention for Fasting (Niyyah)',
    titleAr: 'نية الصيام',
    ar: 'وَبِصَوْمِ غَدٍ نَوَيْتُ مِنْ شَهْرِ رَمَضَانَ',
    transliteration: 'Wa bi-sawmi ghadin nawaytu min shahri Ramadan.',
    en: 'I intend to fast tomorrow for the month of Ramadan.',
    reference: 'Classical Fiqh formulation of intention',
    significance: 'Intention in the heart made before the dawn (Fajr) prayer.',
  },
  {
    id: 'laylatul-qadr',
    category: 'qadr',
    title: 'Dua for Laylatul Qadr (Night of Decree)',
    titleAr: 'دعاء ليلة القدر',
    ar: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
    transliteration: 'Allāhumma innaka ‘afuwwun tuḥibbul-‘afwa fa‘fu ‘annī.',
    en: 'O Allah, You are the One Who pardons greatly, and You love to pardon, so pardon me.',
    reference: 'Jami` at-Tirmidhi (3513) — Sahih',
    significance: 'Taught directly by the Prophet ﷺ to Aisha (ra) to repeat throughout the last ten nights.',
  },
  {
    id: 'ashra-1',
    category: 'ashra',
    title: 'First Ashra Dua (Days 1–10: Mercy)',
    titleAr: 'دعاء العشر الأوائل (الرحمة)',
    ar: 'رَبِّ اغْفِرْ وَارْحَمْ وَأَنْتَ خَيْرُ الرَّاحِمِينَ',
    transliteration: 'Rabbi-ghfir war-ḥam wa anta khayrur-rāḥimīn.',
    en: 'My Lord, forgive and have mercy, and You are the best of the merciful.',
    reference: 'Surah Al-Mu’minun (23:118)',
    significance: 'Repeated during the first ten days focusing on Allah’s divine Mercy (Rahmah).',
  },
  {
    id: 'ashra-2',
    category: 'ashra',
    title: 'Second Ashra Dua (Days 11–20: Forgiveness)',
    titleAr: 'دعاء العشر الأواسط (المغفرة)',
    ar: 'أَسْتَغْفِرُ اللَّهَ رَبِّي مِنْ كُلِّ ذَنْبٍ وَأَتُوبُ إِلَيْهِ',
    transliteration: 'Astaghfirullāha rabbī min kulli dhambin wa atūbu ilayh.',
    en: 'I seek forgiveness from Allah, my Lord, from every sin and I turn to Him in repentance.',
    reference: 'Hadith on Istighfar',
    significance: 'Repeated during the middle ten days dedicated to Seeking Forgiveness (Maghfirah).',
  },
  {
    id: 'ashra-3',
    category: 'ashra',
    title: 'Third Ashra Dua (Days 21–30: Deliverance from Hellfire)',
    titleAr: 'دعاء العشر الأواخر (العتق من النار)',
    ar: 'اللَّهُمَّ أَجِرْنَا مِنَ النَّارِ يَا مُجِيرُ يَا مُجِيرُ يَا مُجِيرُ',
    transliteration: 'Allāhumma ajirnā minan-nār yā mujīru yā mujīru yā mujīr.',
    en: 'O Allah, save us from the fire of Hell, O Protector, O Protector, O Protector.',
    reference: 'Sunan an-Nasa’i & Tirmidhi',
    significance: 'Recited with urgency in the final ten nights seeking release from the Fire.',
  },
];

export const RAMADAN_TRACKER_STORAGE_KEY = 'dhikrly_ramadan_tracker_v1';
export const RAMADAN_KHATMAH_STORAGE_KEY = 'dhikrly_ramadan_khatmah_v1';

export function getRamadanTrackerData(): Record<number, RamadanDayRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(RAMADAN_TRACKER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveRamadanDayRecord(record: RamadanDayRecord) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getRamadanTrackerData();
    existing[record.day] = record;
    window.localStorage.setItem(RAMADAN_TRACKER_STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // LocalStorage quota or disabled
  }
}

export function getKhatmahProgress(): { completedJuz: number[]; completedPages: number } {
  if (typeof window === 'undefined') return { completedJuz: [], completedPages: 0 };
  try {
    const raw = window.localStorage.getItem(RAMADAN_KHATMAH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { completedJuz: [], completedPages: 0 };
  } catch {
    return { completedJuz: [], completedPages: 0 };
  }
}

export function saveKhatmahProgress(data: { completedJuz: number[]; completedPages: number }) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RAMADAN_KHATMAH_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // LocalStorage
  }
}
