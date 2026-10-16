export interface JumuahSunnahItem {
  id: string;
  title: string;
  arabicTitle?: string;
  desc: string;
  hadith: string;
  link?: string;
  icon: string;
}

export const JUMUAH_SUNNAH_ITEMS: JumuahSunnahItem[] = [
  {
    id: 'ghusl',
    title: 'Ghusl (Ritual Bath)',
    arabicTitle: 'الغُسْل',
    desc: 'Perform a full ritual bath before setting out for the Friday prayer.',
    hadith: '“Ghusl on Friday is obligatory upon every mature person.” (Sahih al-Bukhari 879)',
    icon: 'Droplets',
  },
  {
    id: 'clean_clothes',
    title: 'Clean Garments & ‘Itr (Perfume)',
    arabicTitle: 'الثِّيَاب الحَسَنَة وَالطِّيب',
    desc: 'Dress in one’s finest clean clothes and apply natural fragrance.',
    hadith: '“Whoever takes a bath on Friday, cleanses himself, and uses his oil or perfume...” (Sahih al-Bukhari 883)',
    icon: 'Sparkles',
  },
  {
    id: 'miswak',
    title: 'Miswak & Oral Hygiene',
    arabicTitle: 'السِّوَاك',
    desc: 'Clean teeth with the traditional olive or arak miswak or toothbrush.',
    hadith: '“...and uses the miswak.” (Sahih Muslim 846)',
    icon: 'Smile',
  },
  {
    id: 'surah_kahf',
    title: 'Recite Surah Al-Kahf (The Cave)',
    arabicTitle: 'قِرَاءَة سُورَة الكَهْف',
    desc: 'Recite all 110 verses of Surah 18 for divine illumination and protection.',
    hadith: '“Whoever reads Surah Al-Kahf on Friday will have a light shining from under his feet to the clouds of heaven...” (Al-Hakim)',
    link: '/quran',
    icon: 'BookOpen',
  },
  {
    id: 'durood',
    title: 'Abundant Salawāt upon Prophet Muhammad ﷺ',
    arabicTitle: 'الإِكْثَار مِنَ الصَّلَاةِ عَلَى النَّبِيّ',
    desc: 'Send continuous blessings upon the Prophet ﷺ throughout the entire day.',
    hadith: '“The best of your days is Friday... so send abundant blessings upon me on it.” (Abu Dawud 1047)',
    icon: 'HeartHandshake',
  },
  {
    id: 'early_arrival',
    title: 'Early Arrival at the Mosque',
    arabicTitle: 'التَّبْكِير إِلَى المَسْجِد',
    desc: 'Walk peacefully to the mosque early to pray Tahiyyat al-Masjid and engage in dhikr.',
    hadith: '“On Friday the angels stand at the door of the mosque writing down the names of the people in the order of their arrival...” (Sahih al-Bukhari 929)',
    icon: 'Clock',
  },
  {
    id: 'khutbah',
    title: 'Attentive Listening to the Khutbah',
    arabicTitle: 'الإنْصَات لِلْخُطْبَة',
    desc: 'Sit quietly without speaking, touching phones, or fidgeting with misbaha.',
    hadith: '“If you say to your companion: ‘Listen!’ while the Imam is delivering the sermon, you have engaged in an idle deed.” (Sahih al-Bukhari 934)',
    icon: 'Ear',
  },
  {
    id: 'hour_of_response',
    title: 'The Hour of Response (Sā‘at al-Istijābah)',
    arabicTitle: 'سَاعَة الاسْتِجَابَة',
    desc: 'Earnest supplication during the special hour before Maghrib when du‘ā is granted.',
    hadith: '“On Friday there is an hour in which no Muslim stands praying and asking Allah for something good but He grants it to him.” (Sahih al-Bukhari 935)',
    icon: 'HandHeart',
  },
];

export const JUMUAH_STORAGE_PREFIX = 'dhikrly_jumuah_';

/**
 * Returns true if today is Friday (or Thursday night after Maghrib)
 */
export function isFriday(date = new Date()): boolean {
  return date.getDay() === 5;
}

export function isJumuahTimeWindow(date = new Date()): {
  isJumuah: boolean;
  isEve: boolean;
  fridayDateStr: string;
} {
  const day = date.getDay();
  const hours = date.getHours();

  // Friday itself
  if (day === 5) {
    return {
      isJumuah: true,
      isEve: false,
      fridayDateStr: date.toISOString().slice(0, 10),
    };
  }

  // Thursday evening after 18:00 (Islamic day begins at Maghrib)
  if (day === 4 && hours >= 18) {
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    return {
      isJumuah: true,
      isEve: true,
      fridayDateStr: nextDay.toISOString().slice(0, 10),
    };
  }

  return {
    isJumuah: false,
    isEve: false,
    fridayDateStr: date.toISOString().slice(0, 10),
  };
}

export interface JumuahState {
  completedSunnahs: Record<string, boolean>;
  salawatCount: number;
  kahfRead: boolean;
}

export function getJumuahState(fridayDateStr: string): JumuahState {
  if (typeof window === 'undefined') {
    return { completedSunnahs: {}, salawatCount: 0, kahfRead: false };
  }
  try {
    const raw = localStorage.getItem(`${JUMUAH_STORAGE_PREFIX}${fridayDateStr}`);
    if (!raw) {
      return { completedSunnahs: {}, salawatCount: 0, kahfRead: false };
    }
    return JSON.parse(raw) as JumuahState;
  } catch {
    return { completedSunnahs: {}, salawatCount: 0, kahfRead: false };
  }
}

export function saveJumuahState(fridayDateStr: string, state: JumuahState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${JUMUAH_STORAGE_PREFIX}${fridayDateStr}`, JSON.stringify(state));
    window.dispatchEvent(new Event('dhikrly:jumuah-updated'));
  } catch (e) {
    console.error('Failed to save Jumuah state:', e);
  }
}
