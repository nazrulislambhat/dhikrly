/* eslint-disable react-hooks/purity */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type Category = 'quran' | 'athkar' | 'dua';
type TabLabel = 'Arabic' | 'English' | 'Transliteration';
type Accent = 'gold' | 'green' | 'amber' | 'purple' | 'muted';

interface Dua {
  id: string;
  category: Category;
  session: string[];
  priority: boolean;
  count: string;
  title: string;
  titleAr: string;
  transliteration: string;
  en: string;
  ar: string;
}

interface Streak {
  current: number;
  best: number;
  lastComplete: string;
}

interface HistoryDay {
  key: string;
  label: string;
  pct: number;
  isToday: boolean;
}

interface CatEntry {
  key: string;
  label: string;
}

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const DUAS: Dua[] = [
  {
    id: 'ayat-kursi',
    category: 'quran',
    session: ['After Ṣalāh', 'Evening'],
    priority: true,
    count: 'After every Fard Ṣalāh · Before sleep',
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
    session: ['Morning', 'Evening'],
    priority: true,
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
    session: ['Morning', 'Evening'],
    priority: true,
    count: '3× morning & evening',
    title: 'Surah Al-Falaq',
    titleAr: 'سورة الفلق',
    transliteration:
      "Bismillāhir-raḥmānir-raḥīm. Qul a'ūdhu birabbil-falaq. Min sharri mā khalaq. Wa min sharri ghāsiqin idhā waqab. Wa min sharrin-naffāthāti fil-'uqad. Wa min sharri ḥāsidin idhā ḥasad.",
    en: 'Say: I seek refuge in the Lord of daybreak. From the evil of that which He created. From the evil of darkness when it settles. From the evil of those who blow on knots. And from the evil of an envier when he envies.',
    ar: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ',
  },
  {
    id: 'nas',
    category: 'quran',
    session: ['Morning', 'Evening'],
    priority: true,
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
    session: ['Morning'],
    priority: true,
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
    session: ['Morning', 'Evening'],
    priority: true,
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
    session: ['Morning'],
    priority: false,
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
    session: ['Anytime'],
    priority: false,
    count: 'In hardship — never rejected',
    title: "Du'ā of Yūnus",
    titleAr: 'دعاء يونس',
    transliteration: 'Lā ilāha illā anta subḥānaka innī kuntu minaẓ-ẓālimīn.',
    en: 'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.',
    ar: 'لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ',
  },
  {
    id: 'hamm',
    category: 'dua',
    session: ['Morning', 'Evening'],
    priority: false,
    count: '1× morning & evening',
    title: 'Refuge from Worry & Debt',
    titleAr: 'دعاء الهم والحزن',
    transliteration:
      "Allāhumma innī a'ūdhu bika minal-hammi wal-ḥazan, wa a'ūdhu bika minal-'ajzi wal-kasal, wa a'ūdhu bika minal-jubni wal-bukhl, wa a'ūdhu bika min ghalabatid-dayni wa qahrir-rijāl.",
    en: 'O Allah, I seek refuge in You from worry and grief, from incapacity and laziness, from cowardice and miserliness, and from the overpowering of debt and the subjugation of men.',
    ar: 'اللّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ',
  },
  {
    id: 'ism-azam',
    category: 'dua',
    session: ['Anytime'],
    priority: false,
    count: '1× with full presence of heart',
    title: "Du'ā by the Greatest Name",
    titleAr: 'الاسم الأعظم',
    transliteration:
      "Allāhumma innī as'aluka bi-annī ashhadu annaka antallāhu lā ilāha illā antal-aḥaduṣ-ṣamad, alladhī lam yalid wa lam yūlad, wa lam yakun lahū kufuwan aḥad.",
    en: 'O Allah, I ask You, bearing witness that You are Allah — there is no deity except You — the One, the Self-Sufficient, who neither begets nor was born, and to whom no one is equal.',
    ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ بِأَنِّي أَشْهَدُ أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ الْأَحَدُ الصَّمَدُ الَّذِي لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
  },
  {
    id: 'halal',
    category: 'dua',
    session: ['Morning'],
    priority: false,
    count: '1× after Fajr',
    title: "Du'ā for Sufficiency Through Ḥalāl",
    titleAr: 'دعاء الاكتفاء بالحلال',
    transliteration:
      "Allāhumma ikfinī biḥalālika 'an ḥarāmik, wa aghninī bifaḍlika 'amman siwāk.",
    en: 'O Allah, suffice me with what You have made lawful, away from the forbidden, and enrich me by Your grace above all others besides You.',
    ar: 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ',
  },
  {
    id: 'majd',
    category: 'dua',
    session: ['Anytime'],
    priority: false,
    count: 'Seeking provision & honour',
    title: "Du'ā for Glory & Provision",
    titleAr: 'دعاء المجد والرزق',
    transliteration:
      "Allāhumma hab lī ḥamdā, wa hab lī majdā, lā majda illā bifi'āl, wa lā fi'āla illā bimāl. Allāhumma lā yuṣliḥunīl-qalīlu wa lā aṣluḥu 'alayh.",
    en: 'O Allah, grant me praise and glory — for there is no glory except through deeds, and no deeds except through wealth. O Allah, the little does not set me right, nor am I right upon it.',
    ar: 'اللَّهُمَّ هَبْ لِي حَمْدًا وَهَبْ لِي مَجْدًا لَا مَجْدَ إِلَّا بِفِعَالٍ وَلَا فِعَالَ إِلَّا بِمَالٍ اللَّهُمَّ لَا يُصْلِحُنِي الْقَلِيلُ وَلَا أَصْلُحُ عَلَيْهِ',
  },
  {
    id: 'musa',
    category: 'dua',
    session: ['Anytime'],
    priority: false,
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
    session: ['Anytime'],
    priority: false,
    count: "After every du'ā · seal of supplication",
    title: "Du'ā for Good in Both Worlds",
    titleAr: 'دعاء الدنيا والآخرة',
    transliteration:
      "Rabbanā ātinā fid-dunyā ḥasanah wa fil-ākhirati ḥasanah wa qinā 'adhāban-nār.",
    en: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',
    ar: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
  },
];

const TABS: TabLabel[] = ['Arabic', 'English', 'Transliteration'];

const CATS: CatEntry[] = [
  { key: 'all', label: 'All' },
  { key: 'quran', label: "Qur'ān" },
  { key: 'athkar', label: 'Athkār' },
  { key: 'dua', label: "Du'ā" },
];

/* ─────────────────────────────────────────────
   STORAGE HELPERS
───────────────────────────────────────────── */
const STORAGE_KEY = 'duas_checked_v3';
const SETTINGS_KEY = 'duas_settings_v3';
const STREAK_KEY = 'duas_streak_v3';

const getTodayKey = (): string => new Date().toISOString().slice(0, 10);

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const save = (key: string, val: unknown): void =>
  localStorage.setItem(key, JSON.stringify(val));

const getHijriDate = (): string => {
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

const getGregorianDate = (): string =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
interface DuaCardProps {
  dua: Dua;
  checked: boolean;
  onToggle: (id: string) => void;
  dark: boolean;
}

function DuaCard({ dua, checked, onToggle, dark }: DuaCardProps) {
  const [activeTab, setActiveTab] = useState<TabLabel>('Arabic');

  const baseCard = dark
    ? 'bg-white/[0.04] border-white/[0.08]'
    : 'bg-white border-black/[0.09] shadow-sm';

  const doneCard = dark
    ? 'bg-emerald-500/[0.07] border-emerald-500/30'
    : 'bg-emerald-50/60 border-emerald-400/40 shadow-sm';

  const priorityBorderColor = checked
    ? 'border-l-emerald-500'
    : dark
      ? 'border-l-amber-400'
      : 'border-l-amber-500';

  return (
    <article
      className={[
        'rounded-2xl border transition-all duration-200 hover:-translate-y-px',
        dua.priority
          ? `border-l-[3px] rounded-l-none ${priorityBorderColor}`
          : '',
        checked ? doneCard : baseCard,
      ].join(' ')}
    >
      {/* ── Card Header ── */}
      <div className="flex items-start gap-3 px-4 pb-3 pt-4">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(dua.id)}
          aria-label={checked ? 'Mark incomplete' : 'Mark complete'}
          className={[
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border-2 transition-all duration-150 active:scale-90',
            checked
              ? 'border-emerald-500 bg-emerald-500'
              : dark
                ? 'border-amber-400/50 bg-transparent hover:border-amber-400'
                : 'border-amber-500/60 bg-transparent hover:border-amber-500',
          ].join(' ')}
        >
          {checked && (
            <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 7l4 4 6-7"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Title block */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h3
              className={[
                'font-serif text-[15px] font-semibold leading-snug transition-all',
                checked
                  ? dark
                    ? 'text-emerald-400/70 line-through'
                    : 'text-emerald-600/70 line-through'
                  : dark
                    ? 'text-stone-100'
                    : 'text-stone-800',
              ].join(' ')}
            >
              {dua.title}
            </h3>
            {dua.priority && (
              <span
                className={
                  dark
                    ? 'text-xs text-amber-400/60'
                    : 'text-xs text-amber-500/70'
                }
              >
                ★
              </span>
            )}
            <span
              className={[
                'font-arabic text-base leading-none',
                dark ? 'text-amber-400/50' : 'text-amber-700/50',
              ].join(' ')}
              dir="rtl"
            >
              {dua.titleAr}
            </span>
          </div>

          {/* Session pills + count */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {dua.session.map((s: string) => (
              <SessionPill key={s} label={s} dark={dark} />
            ))}
            <span
              className={`text-[10px] ${dark ? 'text-stone-500' : 'text-stone-400'}`}
            >
              {dua.count}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <span
          className={[
            'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium',
            checked
              ? dark
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-emerald-100 text-emerald-700'
              : dark
                ? 'bg-white/5 text-stone-500'
                : 'bg-stone-100 text-stone-400',
          ].join(' ')}
        >
          {checked ? 'Done' : 'Pending'}
        </span>
      </div>

      {/* ── Tab strip ── */}
      <div
        className={[
          'mx-4 mb-3 flex rounded-lg border p-0.5',
          dark
            ? 'border-white/[0.07] bg-white/[0.03]'
            : 'border-black/[0.06] bg-black/[0.03]',
        ].join(' ')}
      >
        {TABS.map((tab: TabLabel) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'flex-1 rounded-md py-1.5 font-serif text-[11px] transition-all duration-150',
              activeTab === tab
                ? dark
                  ? 'bg-amber-400/20 text-amber-300 shadow-sm'
                  : 'border border-amber-200/60 bg-amber-50 text-amber-700 shadow-sm'
                : dark
                  ? 'text-stone-500 hover:text-stone-300'
                  : 'text-stone-400 hover:text-stone-600',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div
        className={[
          'mx-4 mb-4 rounded-xl border px-4 py-3.5 transition-opacity duration-200',
          checked ? 'opacity-60' : 'opacity-100',
          activeTab === 'Arabic'
            ? dark
              ? 'border-amber-400/20 bg-amber-400/[0.05]'
              : 'border-amber-200/50 bg-amber-50/60'
            : activeTab === 'English'
              ? dark
                ? 'border-white/[0.06] bg-white/[0.03]'
                : 'border-stone-200/60 bg-stone-50'
              : dark
                ? 'border-emerald-500/20 bg-emerald-500/[0.05]'
                : 'border-emerald-200/40 bg-emerald-50/60',
        ].join(' ')}
      >
        {activeTab === 'Arabic' && (
          <p
            className={`font-arabic text-right leading-[2.2] text-[clamp(16px,2vw,24px)] ${dark ? 'text-stone-100' : 'text-stone-800'}`}
            dir="rtl"
            lang="ar"
          >
            {dua.ar}
          </p>
        )}
        {activeTab === 'English' && (
          <p
            className={`font-serif italic leading-relaxed text-[13.5px] ${dark ? 'text-stone-300' : 'text-stone-600'}`}
          >
            {dua.en}
          </p>
        )}
        {activeTab === 'Transliteration' && (
          <p
            className={`font-serif italic leading-relaxed tracking-wide text-[13px] ${dark ? 'text-emerald-300' : 'text-emerald-800'}`}
          >
            {dua.transliteration}
          </p>
        )}
      </div>
    </article>
  );
}

/* ── SessionPill ── */
interface SessionPillProps {
  label: string;
  dark: boolean;
}

const SESSION_CLASSES: Record<string, { dark: string; light: string }> = {
  Morning: {
    dark: 'bg-amber-400/10 text-amber-300',
    light: 'bg-amber-100 text-amber-700',
  },
  Evening: {
    dark: 'bg-violet-400/10 text-violet-300',
    light: 'bg-violet-100 text-violet-700',
  },
  'After Ṣalāh': {
    dark: 'bg-emerald-400/10 text-emerald-300',
    light: 'bg-emerald-100 text-emerald-700',
  },
  Anytime: {
    dark: 'bg-stone-400/10 text-stone-400',
    light: 'bg-stone-100 text-stone-500',
  },
};

function SessionPill({ label, dark }: SessionPillProps) {
  const cls = SESSION_CLASSES[label] ?? SESSION_CLASSES['Anytime'];
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${dark ? cls.dark : cls.light}`}
    >
      {label}
    </span>
  );
}

/* ── ProgressBar ── */
interface ProgressBarProps {
  pct: number;
  dark: boolean;
}

function ProgressBar({ pct, dark }: ProgressBarProps) {
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full ${dark ? 'bg-white/[0.07]' : 'bg-black/[0.07]'}`}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          pct === 100
            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
            : 'bg-gradient-to-r from-amber-400 to-amber-500'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ── StatCard ── */
interface StatCardProps {
  label: string;
  value: string | number;
  dark: boolean;
  accent: Accent;
}

const ACCENT_CLASSES: Record<Accent, { dark: string; light: string }> = {
  gold: { dark: 'text-amber-400', light: 'text-amber-600' },
  green: { dark: 'text-emerald-400', light: 'text-emerald-600' },
  amber: { dark: 'text-orange-400', light: 'text-orange-500' },
  purple: { dark: 'text-violet-400', light: 'text-violet-600' },
  muted: { dark: 'text-stone-400', light: 'text-stone-500' },
};

function StatCard({ label, value, dark, accent }: StatCardProps) {
  const cls = ACCENT_CLASSES[accent];
  return (
    <div
      className={`rounded-xl border px-3 py-3 text-center ${dark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-black/[0.07] bg-white shadow-sm'}`}
    >
      <div
        className={`text-2xl font-light leading-none ${dark ? cls.dark : cls.light}`}
      >
        {value}
      </div>
      <div
        className={`mt-1 text-[9px] uppercase tracking-widest ${dark ? 'text-stone-600' : 'text-stone-400'}`}
      >
        {label}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function DuasTracker() {
  const today = getTodayKey();

  const [dark, setDark] = useState<boolean>(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );
  const [checked, setChecked] = useState<Record<string, boolean>>(
    () =>
      load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {})[today] ??
      {},
  );
  const [streak, setStreak] = useState<Streak>(() =>
    load<Streak>(STREAK_KEY, { current: 0, best: 0, lastComplete: '' }),
  );
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [priOnly, setPriOnly] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const prevDone = useRef<number>(
    Object.values(checked).filter(Boolean).length,
  );
  // Refs let the effect always read the latest values without being deps.
  const streakRef = useRef<Streak>(streak);
  const todayRef = useRef<string>(today);
  useEffect(() => {
    streakRef.current = streak;
  }, [streak]);

  // Defined before the effect that calls it — arrow fns are not hoisted.
  const showToast = useCallback((msg: string): void => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  /* persist checked + update streak */
  useEffect(() => {
    const currentToday = todayRef.current;
    const all = load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {});
    all[currentToday] = checked;
    const keys = Object.keys(all).sort();
    if (keys.length > 60)
      keys.slice(0, keys.length - 60).forEach((k: string) => delete all[k]);
    save(STORAGE_KEY, all);

    const done = Object.values(checked).filter(Boolean).length;
    if (done === DUAS.length && prevDone.current < DUAS.length) {
      const s = { ...streakRef.current };
      if (s.lastComplete !== currentToday) {
        const nowMs = Date.now();
        const yesterday = new Date(nowMs - 86_400_000)
          .toISOString()
          .slice(0, 10);
        s.current = s.lastComplete === yesterday ? s.current + 1 : 1;
        s.best = Math.max(s.best, s.current);
        s.lastComplete = currentToday;
        setStreak(s);
        save(STREAK_KEY, s);
        showToast('All duas completed. BarakAllahu feek. 🌙');
      }
    }
    prevDone.current = done;
  }, [checked, showToast]);

  /* persist dark mode preference */
  useEffect(() => {
    save(SETTINGS_KEY, { dark });
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('light', !dark);
  }, [dark]);

  const toggle = useCallback((id: string): void => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const resetDay = (): void => {
    setChecked({});
    prevDone.current = 0;
    showToast('Reset. Begin again with Bismillah.');
  };

  /* derived values */
  const done = Object.values(checked).filter(Boolean).length;
  const total = DUAS.length;
  const pending = total - done;
  const pct = Math.round((done / total) * 100);

  const catCount = (cat: string): number =>
    cat === 'all' ? total : DUAS.filter((d) => d.category === cat).length;

  const catDone = (cat: string): number =>
    cat === 'all'
      ? done
      : DUAS.filter((d) => d.category === cat && checked[d.id]).length;

  const history: HistoryDay[] = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    const cnt = Object.values(
      load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {})[key] ?? {},
    ).filter(Boolean).length;
    return {
      key,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      pct: Math.round((cnt / total) * 100),
      isToday: key === today,
    };
  });

  const filtered: Dua[] = DUAS.filter((d) => {
    if (filter !== 'all' && d.category !== filter) return false;
    if (priOnly && !d.priority) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.titleAr.includes(search) ||
        d.en.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const bg = dark
    ? 'min-h-screen bg-[#0c1a2e] text-stone-200'
    : 'min-h-screen bg-stone-50 text-stone-800';
  const card = dark
    ? 'bg-white/[0.04] border-white/[0.07]'
    : 'bg-white border-black/[0.07] shadow-sm';

  return (
    <div className={bg}>
      {/* Toast */}
      {toast !== null && (
        <div className="animate-fade-in fixed left-1/2 top-5 z-[9999] -translate-x-1/2 rounded-full bg-emerald-600 px-6 py-3 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}

      <div className="mx-auto max-w-2xl px-4 py-8 pb-16">
        {/* Header */}
        <header className="mb-8 text-center">
          <div
            className={`mb-1 text-[11px] uppercase tracking-[0.18em] ${dark ? 'text-amber-400/60' : 'text-amber-600/70'}`}
          >
            {getHijriDate()}
          </div>
          <h1
            className={`font-serif text-[clamp(22px,4vw,32px)] font-normal tracking-wide ${dark ? 'text-amber-400' : 'text-amber-700'}`}
          >
            Daily Adhkār & Du&apos;ā
          </h1>
          <p
            className={`mt-1 font-arabic text-xl ${dark ? 'text-amber-400/45' : 'text-amber-600/50'}`}
            dir="rtl"
            lang="ar"
          >
            أَذْكَار يَوْمِيَّة
          </p>
          <p
            className={`mt-2 text-[11px] ${dark ? 'text-stone-500' : 'text-stone-400'}`}
          >
            {getGregorianDate()}
          </p>
          <button
            onClick={() => setDark((d) => !d)}
            className={`mt-4 rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
              dark
                ? 'border-white/10 text-stone-400 hover:text-stone-200'
                : 'border-black/10 text-stone-400 hover:text-stone-600'
            }`}
          >
            {dark ? '☀ Light mode' : '☾ Dark mode'}
          </button>
        </header>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-4 gap-2">
          <StatCard label="Total" value={total} accent="gold" dark={dark} />
          <StatCard label="Done" value={done} accent="green" dark={dark} />
          <StatCard
            label="Pending"
            value={pending}
            accent={pending > 0 ? 'amber' : 'green'}
            dark={dark}
          />
          <StatCard
            label="Streak"
            value={`${streak.current}d`}
            accent="purple"
            dark={dark}
          />
        </div>

        {/* Progress bar */}
        <div className="mb-1">
          <ProgressBar pct={pct} dark={dark} />
        </div>
        <div
          className={`mb-5 flex justify-between text-[10px] ${dark ? 'text-stone-600' : 'text-stone-400'}`}
        >
          <span>{pct}% complete</span>
          <span>
            {done} / {total}
          </span>
        </div>

        {/* 7-day history */}
        <div className={`mb-5 rounded-2xl border p-4 ${card}`}>
          <p
            className={`mb-3 text-[10px] uppercase tracking-widest ${dark ? 'text-stone-600' : 'text-stone-400'}`}
          >
            7-day history · best streak {streak.best}d
          </p>
          <div className="flex h-12 items-end gap-1.5">
            {history.map((h: HistoryDay) => (
              <div
                key={h.key}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div
                  className={`w-full rounded-sm transition-all duration-300 ${
                    h.isToday
                      ? h.pct === 100
                        ? 'bg-emerald-500'
                        : 'bg-amber-400'
                      : h.pct === 100
                        ? dark
                          ? 'bg-emerald-600/50'
                          : 'bg-emerald-400/40'
                        : dark
                          ? 'bg-white/[0.08]'
                          : 'bg-black/[0.07]'
                  }`}
                  style={{ height: `${Math.max(4, (h.pct / 100) * 36)}px` }}
                />
                <span
                  className={`text-[8px] ${h.isToday ? (dark ? 'text-amber-400' : 'text-amber-600') : dark ? 'text-stone-700' : 'text-stone-400'}`}
                >
                  {h.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`h-8 flex-1 rounded-full border bg-transparent px-4 text-xs outline-none transition-colors focus:border-amber-400/50 ${
              dark
                ? 'border-white/[0.08] text-stone-200 placeholder-stone-600'
                : 'border-black/[0.09] text-stone-700 placeholder-stone-400'
            }`}
          />
          <button
            onClick={() => setPriOnly((p) => !p)}
            className={`h-8 rounded-full border px-3 text-[11px] transition-all ${
              priOnly
                ? dark
                  ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
                  : 'border-amber-400/50 bg-amber-50 text-amber-700'
                : dark
                  ? 'border-white/[0.08] text-stone-500 hover:text-stone-300'
                  : 'border-black/[0.08] text-stone-400 hover:text-stone-600'
            }`}
          >
            ★ Priority
          </button>
          <button
            onClick={resetDay}
            className={`h-8 rounded-full border px-3 text-[11px] transition-all ${
              dark
                ? 'border-red-500/20 text-red-400/70 hover:text-red-400'
                : 'border-red-300/40 text-red-400 hover:text-red-600'
            }`}
          >
            ↺ Reset
          </button>
        </div>

        {/* Category tabs */}
        <div className="mb-5 flex flex-wrap gap-1.5">
          {CATS.map(({ key, label }: CatEntry) => {
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={[
                  'rounded-full border px-3.5 py-1 font-serif text-[11px] tracking-wide transition-all',
                  active
                    ? dark
                      ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
                      : 'border-amber-400/50 bg-amber-50 text-amber-700'
                    : dark
                      ? 'border-white/[0.07] text-stone-500 hover:text-stone-300'
                      : 'border-black/[0.07] text-stone-400 hover:text-stone-600',
                ].join(' ')}
              >
                {label}
                <span
                  className={`ml-1.5 text-[9px] ${active ? '' : dark ? 'text-stone-700' : 'text-stone-300'}`}
                >
                  {catDone(key)}/{catCount(key)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dua cards */}
        <div className="flex flex-col gap-3">
          {filtered.length === 0 && (
            <p
              className={`py-12 text-center text-sm ${dark ? 'text-stone-600' : 'text-stone-400'}`}
            >
              No duas match your search.
            </p>
          )}
          {filtered.map((d: Dua) => (
            <DuaCard
              key={d.id}
              dua={d}
              checked={!!checked[d.id]}
              onToggle={toggle}
              dark={dark}
            />
          ))}
        </div>

        {/* Footer */}
        <footer
          className={`mt-12 border-t pt-6 text-center ${dark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}
        >
          <p
            className={`font-arabic text-xl ${dark ? 'text-amber-400/30' : 'text-amber-600/30'}`}
            dir="rtl"
            lang="ar"
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <p
            className={`mt-2 text-[10px] uppercase tracking-widest ${dark ? 'text-stone-700' : 'text-stone-400'}`}
          >
            Progress saved locally
          </p>
        </footer>
      </div>
    </div>
  );
}
