'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

const DUAS = [
  {
    id: 'ayat-kursi',
    category: 'quran',
    session: ['after-salah', 'evening'],
    priority: true,
    xp: 50,
    count: 'After every Fard Salah · Before sleep',
    title: 'Ayat al-Kursi',
    titleAr: 'آية الكرسي',
    transliteration:
      "Allāhu lā ilāha illā huwal-ḥayyul-qayyūm, lā ta'khudhuhū sinatun wa lā nawm, lahū mā fis-samāwāti wa mā fil-arḍ, man dhal-ladhī yashfa'u 'indahū illā bi'idhnih, ya'lamu mā bayna aydīhim wa mā khalfahum, wa lā yuḥīṭūna bishay'in min 'ilmihī illā bimā shā', wasi'a kursiyyuhus-samāwāti wal-arḍ, wa lā ya'ūduhū ḥifẓuhumā, wa huwal-'aliyyul-'aẓīm.",
    en: 'Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.',
    ar: 'اللّهُ لَا إِلٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ',
  },
  {
    id: 'ikhlas',
    category: 'quran',
    session: ['morning', 'evening'],
    priority: true,
    xp: 30,
    count: "3× morning & evening · equals ⅓ Qur'ān",
    title: 'Surah Al-Ikhlāṣ',
    titleAr: 'سورة الإخلاص',
    transliteration:
      'Bismillāhir-raḥmānir-raḥīm. Qul huwal-lāhu aḥad. Allāhuṣ-ṣamad. Lam yalid wa lam yūlad. Wa lam yakun lahū kufuwan aḥad.',
    en: 'Say: He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born. Nor is there to Him any equivalent.',
    ar: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
  },
  {
    id: 'falaq',
    category: 'quran',
    session: ['morning', 'evening'],
    priority: true,
    xp: 25,
    count: '3× morning & evening',
    title: 'Surah Al-Falaq',
    titleAr: 'سورة الفلق',
    transliteration:
      "Bismillāhir-raḥmānir-raḥīm. Qul a'ūdhu birabbil-falaq. Min sharri mā khalaq. Wa min sharri ghāsiqin idhā waqab. Wa min sharrin-naffāthāti fil-'uqad. Wa min sharri ḥāsidin idhā ḥasad.",
    en: 'Say: I seek refuge in the Lord of daybreak. From the evil of that which He created. And from the evil of darkness when it settles. And from the evil of those who blow on knots. And from the evil of an envier when he envies.',
    ar: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ',
  },
  {
    id: 'nas',
    category: 'quran',
    session: ['morning', 'evening'],
    priority: true,
    xp: 25,
    count: '3× morning & evening',
    title: 'Surah An-Nās',
    titleAr: 'سورة الناس',
    transliteration:
      "Bismillāhir-raḥmānir-raḥīm. Qul a'ūdhu birabbin-nās. Malikin-nās. Ilāhin-nās. Min sharril-waswāsil-khannās. Alladhī yuwaswisu fī ṣudūrin-nās. Minal-jinnati wan-nās.",
    en: 'Say: I seek refuge in the Lord of mankind. The Sovereign of mankind. The God of mankind. From the evil of the retreating whisperer. Who whispers in the breasts of mankind. From among the jinn and mankind.',
    ar: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ',
  },
  {
    id: 'tasbih',
    category: 'athkar',
    session: ['morning'],
    priority: true,
    xp: 35,
    count: '3× every morning',
    title: 'Tasbīḥ of the Heart',
    titleAr: 'تسبيح القلب',
    transliteration:
      "Subḥānallāhi wa biḥamdihī 'adada khalqihī wa riḍā nafsihī wa zinata 'arshihī wa midāda kalimātih.",
    en: 'Glory be to Allah and His praise, by the number of His creation, His pleasure, the weight of His Throne, and the ink of His words.',
    ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ وَرِضَا نَفْسِهِ وَزِنَةَ عَرْشِهِ وَمِدَادَ كَلِمَاتِهِ',
  },
  {
    id: 'hasbiyallah',
    category: 'athkar',
    session: ['morning', 'evening'],
    priority: true,
    xp: 30,
    count: '7× morning · 7× evening',
    title: 'Ḥasbiyallāh',
    titleAr: 'حسبي الله',
    transliteration:
      "Ḥasbiyallāhu lā ilāha illā huwa 'alayhi tawakkaltu wa huwa rabbul-'arshil-'aẓīm.",
    en: 'Allah is sufficient for me; there is no deity except Him. Upon Him I rely, and He is the Lord of the Great Throne.',
    ar: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
  },
  {
    id: 'ilm-nafia',
    category: 'dua',
    session: ['morning'],
    priority: false,
    xp: 20,
    count: '1× after Fajr',
    title: "Du'ā for Beneficial Knowledge",
    titleAr: 'دعاء العلم النافع',
    transliteration:
      "Allāhumma innī as'aluka 'ilman nāfi'ā, wa rizqan ṭayyibā, wa 'amalan mutaqabbalā.",
    en: 'O Allah, I ask You for beneficial knowledge, good wholesome provision, and deeds that are accepted.',
    ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا',
  },
  {
    id: 'yunus',
    category: 'dua',
    session: ['anytime'],
    priority: false,
    xp: 20,
    count: 'Recite in hardship — never rejected',
    title: "Du'ā of Yūnus",
    titleAr: 'دعاء يونس',
    transliteration: 'Lā ilāha illā anta subḥānaka innī kuntu minaẓ-ẓālimīn.',
    en: 'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.',
    ar: 'لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ',
  },
  {
    id: 'hamm',
    category: 'dua',
    session: ['morning', 'evening'],
    priority: false,
    xp: 20,
    count: '1× morning & evening',
    title: 'Refuge from Worry & Debt',
    titleAr: 'دعاء الهم والحزن',
    transliteration:
      "Allāhumma innī a'ūdhu bika minal-hammi wal-ḥazan, wa a'ūdhu bika minal-'ajzi wal-kasal, wa a'ūdhu bika minal-jubni wal-bukhl, wa a'ūdhu bika min ghalabatid-dayni wa qahrir-rijāl.",
    en: 'O Allah, I seek refuge in You from worry and grief. I seek refuge in You from incapacity and laziness. I seek refuge in You from cowardice and miserliness. And I seek refuge in You from the overpowering of debt and the subjugation of men.',
    ar: 'اللّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ',
  },
  {
    id: 'ism-azam',
    category: 'dua',
    session: ['anytime'],
    priority: false,
    xp: 25,
    count: '1× with full presence of heart',
    title: "Du'ā by the Greatest Name",
    titleAr: 'الاسم الأعظم',
    transliteration:
      "Allāhumma innī as'aluka bi-annī ashhadu annaka antallāhu lā ilāha illā antal-aḥaduṣ-ṣamad, alladhī lam yalid wa lam yūlad, wa lam yakun lahū kufuwan aḥad.",
    en: 'O Allah, I ask You by my bearing witness that You are Allah — there is no deity except You — the One, the Self-Sufficient, who neither begets nor was born, and to whom no one is equal.',
    ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ بِأَنِّي أَشْهَدُ أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ الْأَحَدُ الصَّمَدُ الَّذِي لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
  },
  {
    id: 'halal',
    category: 'dua',
    session: ['morning'],
    priority: false,
    xp: 20,
    count: '1× after Fajr',
    title: "Du'ā for Sufficiency Through Ḥalāl",
    titleAr: 'دعاء الاكتفاء بالحلال',
    transliteration:
      "Allāhumma ikfinī biḥalālika 'an ḥarāmik, wa aghninī bifaḍlika 'amman siwāk.",
    en: 'O Allah, suffice me with what You have made lawful so I have no need of the forbidden, and enrich me by Your grace above all others besides You.',
    ar: 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ',
  },
  {
    id: 'majd',
    category: 'dua',
    session: ['anytime'],
    priority: false,
    xp: 20,
    count: 'As needed · seeking provision',
    title: "Du'ā for Glory & Provision",
    titleAr: 'دعاء المجد والرزق',
    transliteration:
      "Allāhumma hab lī ḥamdā, wa hab lī majdā, lā majda illā bifi'āl, wa lā fi'āla illā bimāl. Allāhumma lā yuṣliḥunīl-qalīlu wa lā aṣluḥu 'alayh.",
    en: 'O Allah, grant me praise and grant me glory — for there is no glory except through deeds, and no deeds except through wealth. O Allah, the little does not set me right, and I am not right upon it.',
    ar: 'اللَّهُمَّ هَبْ لِي حَمْدًا وَهَبْ لِي مَجْدًا لَا مَجْدَ إِلَّا بِفِعَالٍ وَلَا فِعَالَ إِلَّا بِمَالٍ اللَّهُمَّ لَا يُصْلِحُنِي الْقَلِيلُ وَلَا أَصْلُحُ عَلَيْهِ',
  },
  {
    id: 'musa',
    category: 'dua',
    session: ['anytime'],
    priority: false,
    xp: 15,
    count: 'In need · seeking rizq',
    title: "Du'ā of Mūsā",
    titleAr: 'دعاء موسى',
    transliteration: 'Rabbi innī limā anzalta ilayya min khayrin faqīr.',
    en: 'My Lord, I am truly in need of whatever good You might send down to me.',
    ar: 'رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ',
  },
  {
    id: 'dunya-akhira',
    category: 'dua',
    session: ['anytime'],
    priority: false,
    xp: 20,
    count: "After every du'ā · seal of supplication",
    title: "Du'ā for Good in Both Worlds",
    titleAr: 'دعاء الدنيا والآخرة',
    transliteration:
      "Rabbanā ātinā fid-dunyā ḥasanah wa fil-ākhirati ḥasanah wa qinā 'adhāban-nār.",
    en: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',
    ar: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
  },
];

const LEVELS = [
  { min: 0, max: 99, name: "Mubtadi'", nameAr: 'مبتدئ', emoji: '🌱' },
  { min: 100, max: 249, name: 'Ṭālib', nameAr: 'طالب', emoji: '📖' },
  { min: 250, max: 449, name: 'Murābiṭ', nameAr: 'مرابط', emoji: '⚔️' },
  { min: 450, max: 699, name: 'Dhākirīn', nameAr: 'ذاكرين', emoji: '🌙' },
  { min: 700, max: 999, name: 'Mukhliṣ', nameAr: 'مخلص', emoji: '✨' },
  { min: 1000, max: Infinity, name: 'Walī', nameAr: 'ولي', emoji: '👑' },
];

function getLevel(xp) {
  return LEVELS.find((l) => xp >= l.min && xp <= l.max) || LEVELS[0];
}

const STORAGE_KEY = 'duas_tracker_v2';
const STREAK_KEY = 'duas_streak_v2';
const SETTINGS_KEY = 'duas_settings_v2';

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const getGregorianDate = () =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const getHijriDate = () => {
  try {
    return new Intl.DateTimeFormat('en-TN-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  } catch {
    return '';
  }
};

const loadStorage = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};
const saveStorage = (d) => localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
const loadStreak = () => {
  try {
    return JSON.parse(
      localStorage.getItem(STREAK_KEY) ||
        '{"current":0,"best":0,"lastComplete":"","totalXP":0}',
    );
  } catch {
    return { current: 0, best: 0, lastComplete: '', totalXP: 0 };
  }
};
const saveStreak = (s) => localStorage.setItem(STREAK_KEY, JSON.stringify(s));
const loadSettings = () => {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{"dark":true}');
  } catch {
    return { dark: true };
  }
};
const saveSettings = (s) =>
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));

const SESSION_META = {
  morning: {
    bgL: '#FEF3C7',
    textL: '#92400E',
    bgD: '#3B2A0A',
    textD: '#FDE68A',
    label: 'Morning',
  },
  evening: {
    bgL: '#EDE9FE',
    textL: '#4C1D95',
    bgD: '#2D1A5E',
    textD: '#C4B5FD',
    label: 'Evening',
  },
  'after-salah': {
    bgL: '#D1FAE5',
    textL: '#064E3B',
    bgD: '#063A2A',
    textD: '#6EE7B7',
    label: 'After Ṣalāh',
  },
  anytime: {
    bgL: '#F1F5F9',
    textL: '#334155',
    bgD: '#1E293B',
    textD: '#94A3B8',
    label: 'Anytime',
  },
};

const CAT_LABELS = {
  all: 'All',
  quran: "Qur'ān",
  athkar: 'Athkār',
  dua: "Du'ā",
};

export default function DuasTracker() {
  const today = getTodayKey();

  const [settings, setSettings] = useState(loadSettings);
  const dark = settings.dark;

  const [checked, setChecked] = useState(() => {
    const s = loadStorage();
    return s[today] || {};
  });
  const [streak, setStreak] = useState(loadStreak);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [toast, setToast] = useState(null);
  const [xpAnimId, setXpAnimId] = useState(null);
  const [xpAnimAmt, setXpAnimAmt] = useState(0);
  const [justDone, setJustDone] = useState(null);
  const prevDone = useRef(Object.values(checked).filter(Boolean).length);

  /* ── theme tokens ─────────────────────────────── */
  const T = dark
    ? {
        bg: 'linear-gradient(160deg,#0a1628 0%,#0d2137 50%,#0a1a10 100%)',
        card: 'rgba(255,255,255,0.04)',
        cardDone: 'rgba(16,185,129,0.07)',
        border: 'rgba(255,255,255,0.08)',
        borderDone: 'rgba(16,185,129,0.3)',
        borderPri: 'rgba(212,175,55,0.3)',
        text: '#e8dcc8',
        textM: 'rgba(232,220,200,0.52)',
        textF: 'rgba(232,220,200,0.3)',
        gold: '#d4af37',
        goldM: 'rgba(212,175,55,0.6)',
        green: '#10b981',
        purple: '#a78bfa',
        amber: '#f59e0b',
        statBg: 'rgba(255,255,255,0.05)',
        inputBg: 'rgba(255,255,255,0.06)',
        inputBorder: 'rgba(212,175,55,0.2)',
        tabOn: 'rgba(212,175,55,0.2)',
        tabOff: 'rgba(255,255,255,0.04)',
        tabBorder: 'rgba(212,175,55,0.45)',
        divider: 'rgba(212,175,55,0.12)',
        arBg: 'rgba(212,175,55,0.05)',
        arBorder: 'rgba(212,175,55,0.35)',
        translitBg: 'rgba(16,185,129,0.06)',
        translitBorder: 'rgba(16,185,129,0.4)',
        translitText: 'rgba(110,231,183,0.9)',
        enBg: 'rgba(255,255,255,0.025)',
        enText: 'rgba(232,220,200,0.7)',
        progressBg: 'rgba(255,255,255,0.07)',
        xpBarBg: 'rgba(255,255,255,0.08)',
        levelBg: 'rgba(212,175,55,0.09)',
        barBg: 'rgba(212,175,55,0.15)',
        resetBg: 'rgba(239,68,68,0.1)',
        resetBorder: 'rgba(239,68,68,0.2)',
        resetText: 'rgba(252,165,165,0.8)',
        shadow: 'none',
        cardShadow: 'none',
        smBg: (s) => SESSION_META[s]?.bgD,
        smText: (s) => SESSION_META[s]?.textD,
      }
    : {
        bg: 'linear-gradient(160deg,#fdf8ee 0%,#f0f5ff 55%,#edfbf3 100%)',
        card: '#ffffff',
        cardDone: 'rgba(16,185,129,0.06)',
        border: 'rgba(0,0,0,0.09)',
        borderDone: 'rgba(5,150,105,0.35)',
        borderPri: 'rgba(180,134,0,0.3)',
        text: '#1a120a',
        textM: 'rgba(26,18,10,0.52)',
        textF: 'rgba(26,18,10,0.33)',
        gold: '#9a6e00',
        goldM: 'rgba(154,110,0,0.65)',
        green: '#059669',
        purple: '#6d28d9',
        amber: '#b45309',
        statBg: 'rgba(0,0,0,0.04)',
        inputBg: 'rgba(0,0,0,0.04)',
        inputBorder: 'rgba(0,0,0,0.15)',
        tabOn: 'rgba(154,110,0,0.12)',
        tabOff: 'rgba(0,0,0,0.04)',
        tabBorder: 'rgba(154,110,0,0.4)',
        divider: 'rgba(0,0,0,0.09)',
        arBg: 'rgba(154,110,0,0.05)',
        arBorder: 'rgba(154,110,0,0.3)',
        translitBg: 'rgba(5,150,105,0.06)',
        translitBorder: 'rgba(5,150,105,0.35)',
        translitText: '#065f46',
        enBg: 'rgba(0,0,0,0.025)',
        enText: 'rgba(26,18,10,0.65)',
        progressBg: 'rgba(0,0,0,0.08)',
        xpBarBg: 'rgba(0,0,0,0.08)',
        levelBg: 'rgba(154,110,0,0.08)',
        barBg: 'rgba(154,110,0,0.14)',
        resetBg: 'rgba(220,38,38,0.07)',
        resetBorder: 'rgba(220,38,38,0.2)',
        resetText: '#b91c1c',
        shadow: '0 2px 12px rgba(0,0,0,0.07)',
        cardShadow: '0 2px 8px rgba(0,0,0,0.06)',
        smBg: (s) => SESSION_META[s]?.bgL,
        smText: (s) => SESSION_META[s]?.textL,
      };

  /* ── derived ─────────────────────────────────── */
  const done = Object.values(checked).filter(Boolean).length;
  const total = DUAS.length;
  const pending = total - done;
  const pct = Math.round((done / total) * 100);
  const todayXP = DUAS.reduce((s, d) => s + (checked[d.id] ? d.xp : 0), 0);
  const level = getLevel(streak.totalXP || 0);
  const nextLvl = LEVELS[LEVELS.indexOf(level) + 1];
  const xpPct = nextLvl
    ? Math.min(
        100,
        Math.round(
          (((streak.totalXP || 0) - level.min) / (nextLvl.min - level.min)) *
            100,
        ),
      )
    : 100;

  const catDone = (cat) =>
    cat === 'all'
      ? done
      : DUAS.filter((d) => d.category === cat && checked[d.id]).length;
  const catTotal = (cat) =>
    cat === 'all' ? total : DUAS.filter((d) => d.category === cat).length;

  const history = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    const cnt = Object.values(loadStorage()[key] || {}).filter(Boolean).length;
    return {
      key,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      pct: Math.round((cnt / total) * 100),
      isToday: key === today,
    };
  });

  const filtered = DUAS.filter((d) => {
    if (filter !== 'all' && d.category !== filter) return false;
    if (priorityOnly && !d.priority) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !d.title.toLowerCase().includes(q) &&
        !d.titleAr.includes(search) &&
        !d.en.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  /* ── persist ─────────────────────────────────── */
  useEffect(() => {
    const s = loadStorage();
    s[today] = checked;
    const keys = Object.keys(s).sort();
    if (keys.length > 60)
      keys.slice(0, keys.length - 60).forEach((k) => delete s[k]);
    saveStorage(s);

    if (done === total && prevDone.current < total) {
      const strk = { ...streak };
      if (strk.lastComplete !== today) {
        const yesterday = new Date(Date.now() - 86400000)
          .toISOString()
          .slice(0, 10);
        strk.current = strk.lastComplete === yesterday ? strk.current + 1 : 1;
        strk.best = Math.max(strk.best, strk.current);
        strk.lastComplete = today;
        strk.totalXP = (strk.totalXP || 0) + todayXP;
        setStreak(strk);
        saveStreak(strk);
        showToast(
          '🏆 All duas completed! +XP earned. BarakAllahu feek!',
          'gold',
        );
      }
    }
    prevDone.current = done;
  }, [checked]);

  const showToast = (msg, type = 'green') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3600);
  };

  const toggle = useCallback((id) => {
    setChecked((prev) => {
      const willCheck = !prev[id];
      if (willCheck) {
        const dua = DUAS.find((x) => x.id === id);
        setXpAnimId(id);
        setXpAnimAmt(dua?.xp || 0);
        setJustDone(id);
        setTimeout(() => setXpAnimId(null), 1300);
        setTimeout(() => setJustDone(null), 600);
      }
      return { ...prev, [id]: willCheck };
    });
  }, []);

  const resetDay = () => {
    setChecked({});
    prevDone.current = 0;
    showToast('Reset complete. Begin again with Bismillah. 🌙');
  };

  const toggleTheme = () => {
    const next = { ...settings, dark: !dark };
    setSettings(next);
    saveSettings(next);
  };

  /* ── render ─────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.bg,
        fontFamily: "'Georgia',serif",
        color: T.text,
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.28);border-radius:2px}
        @keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes xpFloat{0%{opacity:0;transform:translateY(0) scale(0.8)}25%{opacity:1;transform:translateY(-10px) scale(1.15)}80%{opacity:1;transform:translateY(-30px) scale(1)}100%{opacity:0;transform:translateY(-42px) scale(0.85)}}
        @keyframes checkPop{0%{transform:scale(0.5)}55%{transform:scale(1.3)}100%{transform:scale(1)}}
        @keyframes glowGreen{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}50%{box-shadow:0 0 18px 5px rgba(16,185,129,0.22)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .dua-card{transition:transform 0.2s,box-shadow 0.22s,background 0.25s,border-color 0.25s}
        .dua-card:hover{transform:translateY(-2px)}
        .check-btn{transition:transform 0.15s,background 0.2s,border-color 0.2s;cursor:pointer;border:none;outline:none}
        .check-btn:active{transform:scale(0.86) !important}
        .tab-btn,.action-btn{transition:all 0.18s;cursor:pointer;border:none;outline:none}
        .tab-btn:hover{filter:brightness(1.12)}
        .action-btn:hover{filter:brightness(1.12);transform:translateY(-1px)}
        .action-btn:active{transform:scale(0.96)}
        input[type=text]{outline:none}
        .theme-btn{transition:transform 0.3s;cursor:pointer;border:none;outline:none;background:none}
        .theme-btn:hover{transform:rotate(22deg) scale(1.1)}
      `}</style>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 18,
            left: '50%',
            transform: 'translateX(-50%)',
            background:
              toast.type === 'gold'
                ? 'linear-gradient(90deg,#9a6e00,#c9950a)'
                : dark
                  ? 'rgba(16,185,129,0.95)'
                  : 'rgba(5,150,105,0.95)',
            color: '#fff',
            padding: '12px 26px',
            borderRadius: 40,
            fontSize: 14,
            zIndex: 9999,
            fontFamily: 'Crimson Pro,Georgia,serif',
            letterSpacing: '0.02em',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            animation: 'toastIn 0.3s ease',
            maxWidth: '90vw',
            textAlign: 'center',
          }}
        >
          {toast.msg}
        </div>
      )}

      <div
        style={{
          maxWidth: 920,
          margin: '0 auto',
          padding: '24px 16px 48px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 28,
            position: 'relative',
          }}
        >
          <button
            className="theme-btn"
            onClick={toggleTheme}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              fontSize: 22,
              padding: 6,
              borderRadius: 40,
            }}
            title={dark ? 'Switch to Light' : 'Switch to Dark'}
          >
            {dark ? '☀️' : '🌙'}
          </button>
          <div
            style={{
              fontSize: 12,
              color: T.goldM,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            {getHijriDate()}
          </div>
          <h1
            style={{
              fontSize: 'clamp(24px,4vw,38px)',
              fontWeight: 400,
              color: T.gold,
              letterSpacing: '0.04em',
              marginBottom: 4,
            }}
          >
            Daily Adhkār & Du'ā
          </h1>
          <div
            style={{
              fontSize: 26,
              fontFamily: "'Scheherazade New',serif",
              color: T.goldM,
              marginBottom: 6,
            }}
          >
            أَذْكَار يَوْمِيَّة
          </div>
          <div
            style={{ fontSize: 12, color: T.textF, letterSpacing: '0.05em' }}
          >
            {getGregorianDate()}
          </div>
        </div>

        {/* ── Level Banner ── */}
        <div
          style={{
            background: T.levelBg,
            border: `0.5px solid ${T.divider}`,
            borderRadius: 16,
            padding: '14px 20px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: T.shadow,
          }}
        >
          <div style={{ fontSize: 36 }}>{level.emoji}</div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 6,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: T.gold,
                    fontFamily: 'Crimson Pro,Georgia,serif',
                  }}
                >
                  {level.name}
                </span>
                <span
                  style={{
                    fontFamily: "'Scheherazade New',serif",
                    fontSize: 15,
                    color: T.goldM,
                    marginLeft: 10,
                  }}
                >
                  {level.nameAr}
                </span>
              </div>
              <span style={{ fontSize: 11, color: T.textM }}>
                {streak.totalXP || 0} XP{' '}
                {nextLvl ? `· next at ${nextLvl.min}` : '· MAX LEVEL'}
              </span>
            </div>
            <div
              style={{
                background: T.xpBarBg,
                borderRadius: 99,
                height: 7,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${xpPct}%`,
                  background: `linear-gradient(90deg,${T.gold},${T.amber})`,
                  borderRadius: 99,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>
          <div
            style={{
              textAlign: 'center',
              background: T.statBg,
              borderRadius: 12,
              padding: '8px 14px',
              minWidth: 68,
              border: `0.5px solid ${T.divider}`,
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 600, color: T.amber }}>
              {todayXP}
            </div>
            <div
              style={{
                fontSize: 10,
                color: T.textF,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}
            >
              XP Today
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 10,
            marginBottom: 14,
          }}
        >
          {[
            { label: 'Total', value: total, color: T.gold },
            { label: 'Done', value: done, color: T.green },
            {
              label: 'Pending',
              value: pending,
              color: pending > 0 ? T.amber : T.green,
            },
            {
              label: 'Streak',
              value: `${streak.current}d 🔥`,
              color: T.purple,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: T.statBg,
                border: `0.5px solid ${T.divider}`,
                borderRadius: 12,
                padding: '12px 8px',
                textAlign: 'center',
                boxShadow: T.shadow,
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(18px,2.8vw,26px)',
                  fontWeight: 400,
                  color: s.color,
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: T.textF,
                  marginTop: 4,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Progress Bar ── */}
        <div
          style={{
            background: T.progressBg,
            borderRadius: 99,
            height: 9,
            marginBottom: 5,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background:
                pct === 100
                  ? `linear-gradient(90deg,${T.green},#34d399)`
                  : `linear-gradient(90deg,${T.gold},${T.amber})`,
              borderRadius: 99,
              transition: 'width 0.5s ease',
              animation: pct === 100 ? 'glowGreen 2s infinite' : 'none',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: T.textF,
            marginBottom: 18,
          }}
        >
          <span>{pct}% complete</span>
          <span>
            {done}/{total} duas
          </span>
        </div>

        {/* ── 7-Day History ── */}
        <div
          style={{
            background: T.card,
            border: `0.5px solid ${T.divider}`,
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 16,
            boxShadow: T.cardShadow,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: T.goldM,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            7-Day Completion · Best Streak: {streak.best}d 🏆
          </div>
          <div
            style={{
              display: 'flex',
              gap: 6,
              alignItems: 'flex-end',
              height: 58,
            }}
          >
            {history.map((h) => (
              <div
                key={h.key}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    borderRadius: 4,
                    height: Math.max(4, (h.pct / 100) * 44),
                    background: h.isToday
                      ? h.pct === 100
                        ? T.green
                        : T.gold
                      : h.pct === 100
                        ? dark
                          ? 'rgba(16,185,129,0.42)'
                          : 'rgba(5,150,105,0.32)'
                        : T.barBg,
                    transition: 'height 0.4s ease',
                  }}
                />
                <div
                  style={{
                    fontSize: 9,
                    color: h.isToday ? T.gold : T.textF,
                    fontWeight: h.isToday ? 700 : 400,
                  }}
                >
                  {h.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Controls ── */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 12,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder="Search duas…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: '1 1 170px',
              background: T.inputBg,
              border: `0.5px solid ${T.inputBorder}`,
              borderRadius: 40,
              padding: '8px 16px',
              color: T.text,
              fontSize: 13,
              fontFamily: 'Georgia,serif',
            }}
          />
          <button
            className="action-btn"
            onClick={() => setPriorityOnly((p) => !p)}
            style={{
              padding: '8px 14px',
              borderRadius: 40,
              fontSize: 12,
              background: priorityOnly ? T.tabOn : T.tabOff,
              color: priorityOnly ? T.gold : T.textM,
              border: `0.5px solid ${priorityOnly ? T.tabBorder : T.divider}`,
            }}
          >
            ⭐ Priority
          </button>
          <button
            className="action-btn"
            onClick={resetDay}
            style={{
              padding: '8px 14px',
              borderRadius: 40,
              fontSize: 12,
              background: T.resetBg,
              color: T.resetText,
              border: `0.5px solid ${T.resetBorder}`,
            }}
          >
            ↺ Reset
          </button>
        </div>

        {/* ── Category Tabs ── */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          {Object.entries(CAT_LABELS).map(([key, label]) => {
            const active = filter === key;
            return (
              <button
                key={key}
                className="tab-btn"
                onClick={() => setFilter(key)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 40,
                  fontSize: 12,
                  background: active ? T.tabOn : T.tabOff,
                  color: active ? T.gold : T.textM,
                  border: `0.5px solid ${active ? T.tabBorder : T.divider}`,
                  letterSpacing: '0.04em',
                }}
              >
                {label}
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 10,
                    color: active ? T.goldM : T.textF,
                  }}
                >
                  {catDone(key)}/{catTotal(key)}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Duas List ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                color: T.textF,
                padding: '48px 0',
                fontSize: 14,
              }}
            >
              No duas match.
            </div>
          )}
          {filtered.map((d, i) => {
            const isChecked = !!checked[d.id];
            const isAnim = xpAnimId === d.id;
            const wasDone = justDone === d.id;

            return (
              <div
                key={d.id}
                className="dua-card"
                style={{
                  background: isChecked ? T.cardDone : T.card,
                  border: `0.5px solid ${isChecked ? T.borderDone : T.border}`,
                  borderLeft: d.priority
                    ? `3px solid ${isChecked ? T.green : T.gold}`
                    : `0.5px solid ${isChecked ? T.borderDone : T.border}`,
                  borderRadius: d.priority ? '0 16px 16px 0' : 16,
                  padding: '18px 18px 16px',
                  animation: `slideUp 0.35s ease ${Math.min(i * 0.045, 0.55)}s both`,
                  position: 'relative',
                  boxShadow: isChecked
                    ? dark
                      ? '0 2px 18px rgba(16,185,129,0.1)'
                      : '0 2px 14px rgba(5,150,105,0.1)'
                    : T.cardShadow,
                }}
              >
                {/* XP float */}
                {isAnim && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: 56,
                      color: T.amber,
                      fontWeight: 700,
                      fontSize: 17,
                      animation: 'xpFloat 1.2s ease forwards',
                      pointerEvents: 'none',
                      zIndex: 20,
                      fontFamily: 'Georgia,serif',
                    }}
                  >
                    +{xpAnimAmt} XP ✨
                  </div>
                )}

                {/* Row 1: checkbox + title + badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    marginBottom: 12,
                  }}
                >
                  {/* Checkbox */}
                  <button
                    className="check-btn"
                    onClick={() => toggle(d.id)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      flexShrink: 0,
                      marginTop: 3,
                      background: isChecked ? T.green : 'transparent',
                      border: `2px solid ${isChecked ? T.green : T.goldM}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: wasDone ? 'checkPop 0.4s ease' : 'none',
                    }}
                  >
                    {isChecked && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M2 7l4 4 6-7"
                          stroke="#fff"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                        marginBottom: 5,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 'clamp(14px,1.9vw,16px)',
                          fontWeight: 600,
                          color: T.text,
                          fontFamily: 'Crimson Pro,Georgia,serif',
                          textDecoration: isChecked ? 'line-through' : 'none',
                          textDecorationColor: T.green,
                          opacity: isChecked ? 0.7 : 1,
                        }}
                      >
                        {d.title}
                      </span>
                      {d.priority && (
                        <span style={{ fontSize: 13, color: T.gold }}>⭐</span>
                      )}
                      <span
                        style={{
                          fontFamily: "'Scheherazade New',serif",
                          fontSize: 16,
                          color: T.goldM,
                        }}
                      >
                        {d.titleAr}
                      </span>
                    </div>

                    {/* Session pills + count */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 5,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                      }}
                    >
                      {d.session.map((s) => (
                        <span
                          key={s}
                          style={{
                            fontSize: 10,
                            padding: '2px 9px',
                            borderRadius: 99,
                            background: T.smBg(s),
                            color: T.smText(s),
                          }}
                        >
                          {SESSION_META[s]?.label}
                        </span>
                      ))}
                      <span
                        style={{ fontSize: 10, color: T.textF, marginLeft: 2 }}
                      >
                        {d.count}
                      </span>
                    </div>
                  </div>

                  {/* Status + XP badge */}
                  <div
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 5,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        padding: '3px 11px',
                        borderRadius: 99,
                        fontWeight: 600,
                        background: isChecked
                          ? dark
                            ? 'rgba(16,185,129,0.16)'
                            : 'rgba(5,150,105,0.1)'
                          : T.levelBg,
                        color: isChecked ? T.green : T.amber,
                        border: `0.5px solid ${isChecked ? T.borderDone : T.divider}`,
                      }}
                    >
                      {isChecked ? '✓ Done' : `+${d.xp} XP`}
                    </span>
                  </div>
                </div>

                {/* Transliteration */}
                <div
                  style={{
                    fontSize: 13,
                    fontStyle: 'italic',
                    lineHeight: 1.8,
                    letterSpacing: '0.01em',
                    color: T.translitText,
                    marginBottom: 10,
                    padding: '9px 14px',
                    background: T.translitBg,
                    borderRadius: 10,
                    borderLeft: `2.5px solid ${T.translitBorder}`,
                    fontFamily: 'Crimson Pro,Georgia,serif',
                    opacity: isChecked ? 0.55 : 1,
                    transition: 'opacity 0.3s',
                  }}
                >
                  {d.transliteration}
                </div>

                {/* English meaning */}
                <div
                  style={{
                    fontSize: 13.5,
                    fontStyle: 'italic',
                    lineHeight: 1.85,
                    color: T.enText,
                    marginBottom: 12,
                    padding: '9px 14px',
                    background: T.enBg,
                    borderRadius: 10,
                    fontFamily: 'Crimson Pro,Georgia,serif',
                    opacity: isChecked ? 0.55 : 1,
                    transition: 'opacity 0.3s',
                  }}
                >
                  {d.en}
                </div>

                {/* Arabic */}
                <div
                  style={{
                    fontFamily: "'Scheherazade New',serif",
                    fontSize: 'clamp(19px,2.8vw,24px)',
                    color: isChecked ? T.goldM : T.text,
                    textAlign: 'right',
                    direction: 'rtl',
                    lineHeight: 2.2,
                    padding: '13px 18px',
                    background: T.arBg,
                    borderRadius: 10,
                    borderRight: `2.5px solid ${T.arBorder}`,
                    opacity: isChecked ? 0.5 : 1,
                    transition: 'opacity 0.3s, color 0.3s',
                  }}
                >
                  {d.ar}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 52,
            paddingTop: 20,
            borderTop: `0.5px solid ${T.divider}`,
            color: T.textF,
            fontSize: 12,
            letterSpacing: '0.08em',
          }}
        >
          <div
            style={{
              fontFamily: "'Scheherazade New',serif",
              fontSize: 22,
              marginBottom: 6,
              color: T.goldM,
            }}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
          Daily Adhkār Tracker · Saved locally · Total XP earned:{' '}
          {streak.totalXP || 0}
        </div>
      </div>
    </div>
  );
}
