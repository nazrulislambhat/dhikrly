/**
 * umrahData.ts
 * Comprehensive interactive Hajj & 'Umrah companion dataset.
 * Includes Tawaf 7-circuit guide & du'as, Sa'i 7-lap tracker, Talbiyah audio data,
 * and essential pilgrimage milestones.
 */

export interface PilgrimageStep {
  id: string;
  number: number;
  title: string;
  titleAr: string;
  location: string;
  desc: string;
  arabicText?: string;
  transliteration?: string;
  translation?: string;
  virtue: string;
  ruleWarning?: string;
}

export const TALBIYAH = {
  title: 'The Talbiyah of Hajj & ‘Umrah',
  arabic: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الحَمْدَ وَالنِّعْمَةَ لَكَ وَالمُلْكَ، لَا شَرِيكَ لَكَ',
  transliteration: 'Labbayk Allahumma labbayk, labbayka la shareeka laka labbayk. Innal-hamda wan-ni‘mata laka wal-mulk, la shareeka lak.',
  translation: 'Here I am, O Allah, here I am. Here I am, You have no partner, here I am. Verily all praise, grace, and dominion are Yours; You have no partner.',
  reference: 'Sahih al-Bukhari 1549 · Sahih Muslim 1184',
  frequencies: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25],
};

export const TAWAF_DUA_YAMANI = {
  title: 'Between the Yemeni Corner and the Black Stone',
  arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
  transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina ‘adhaban-nar.',
  translation: 'Our Lord, grant us in this world that which is good and in the Hereafter that which is good, and protect us from the punishment of the Fire.',
  reference: 'Sunan Abi Dawud 1892 · Sahih',
};

export const SAFA_MARWAH_DUA = {
  title: 'Supplication Atop Mount Safa and Mount Marwah',
  intro: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ · أَبْدَأُ بِمَا بَدَأَ اللَّهُ بِهِ',
  introTranslit: 'Innas-Safa wal-Marwata min sha‘a’irillah. Abda’u bima bada’Allahu bih.',
  arabic: 'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ · لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ، أَنْجَزَ وَعْدَهُ، وَنَصَرَ عَبْدَهُ، وَهَزَمَ الأَحْزَابَ وَحْدَهُ',
  transliteration: 'Allahu Akbar, Allahu Akbar, Allahu Akbar. La ilaha illallahu wahdahu la shareeka lah, lahul-mulku wa lahul-hamdu wa Huwa ‘ala kulli shay’in Qadeer. La ilaha illallahu wahdah, anjaza wa‘dah, wa nasara ‘abdah, wa hazamal-ahzaba wahdah.',
  translation: 'Allah is the Greatest (3×). None has the right to be worshipped except Allah alone without partner. To Him belongs all dominion and praise, and He is over all things Competent. None has the right to be worshipped except Allah alone; He fulfilled His promise, granted victory to His slave, and defeated the allied clans alone.',
  reference: 'Sahih Muslim 1218',
};

export const PILGRIMAGE_STEPS: PilgrimageStep[] = [
  {
    id: 'ihram',
    number: 1,
    title: 'Entering the State of Iḥrām at the Mīqāt',
    titleAr: 'الإِحْرَامُ مِنَ المِيقَاتِ',
    location: 'At or before the assigned Mīqāt boundary',
    desc: 'Perform full ghusl, clip nails, don the two seamless white sheets (for men) or modest clothing (for women), pray 2 voluntary rak‘ahs, and pronounce your intention (Niyyah).',
    arabicText: 'لَبَّيْكَ عُمْرَةً (أَوْ: لَبَّيْكَ حَجًّا)',
    transliteration: 'Labbayka ‘Umratan (or: Labbayka Hajjan)',
    translation: 'Here I am, O Allah, for ‘Umrah (or: Hajj).',
    virtue: 'Pure state of spiritual equality where all worldly ranks, wealth, and status vanish.',
    ruleWarning: 'Prohibited during Ihram: scented soaps/perfumes, cutting hair or nails, covering head (men), face veils (women), hunting, intimacy.',
  },
  {
    id: 'talbiyah-chant',
    number: 2,
    title: 'Continuous Chanting of the Talbiyah',
    titleAr: 'التَّلْبِيَةُ حَتَّى رُؤْيَةِ الكَعْبَةِ',
    location: 'En route from Mīqāt to Makkah al-Mukarramah',
    desc: 'Chant the Talbiyah continuously with enthusiasm and devotion upon mounting transportation, ascending hills, and descending valleys.',
    arabicText: TALBIYAH.arabic,
    transliteration: TALBIYAH.transliteration,
    translation: TALBIYAH.translation,
    virtue: '“There is no Muslim who chants Talbiyah except that everything on his right and left of trees and stones chants with him.” (Tirmidhi)',
  },
  {
    id: 'enter-haram',
    number: 3,
    title: 'Entering Al-Masjid al-Ḥarām & First Sight of Ka‘bah',
    titleAr: 'دُخُولُ المَسْجِدِ الحَرَامِ وَرُؤْيَةُ الكَعْبَةِ',
    location: 'Bab As-Salam or any gate of the Grand Mosque',
    desc: 'Enter with the right foot forward, recite the mosque du‘ā, and make earnest supplication when first seeing the holy Ka‘bah.',
    arabicText: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، فَحَيِّنَا رَبَّنَا بِالسَّلَامِ · اللَّهُمَّ زِدْ هَذَا البَيْتَ تَشْرِيفًا وَتَعْظِيمًا وَتَكْرِيمًا وَمَهَابَةً',
    transliteration: 'Allahumma Antas-Salamu wa minkas-salam, fa-hayyina Rabbana bis-salam. Allahumma zid hadhal-Bayta tashreefan wa ta‘zeeman wa takreeman wa mahabah.',
    translation: 'O Allah, You are Peace and from You comes peace, greet us our Lord with peace. O Allah, increase this House in honor, greatness, nobility, and awe.',
    virtue: 'The first du‘ā made upon laying eyes upon the Ka‘bah is universally granted.',
  },
  {
    id: 'tawaf',
    number: 4,
    title: 'Ṭawāf (7 Circuits Around the Ka‘bah)',
    titleAr: 'الطَّوَافُ حَوْلَ الكَعْبَةِ (٧ أَشْوَاطٍ)',
    location: 'The Mataf around the Holy Ka‘bah',
    desc: 'Perform 7 anti-clockwise circuits starting aligned with the Black Stone (Hajar al-Aswad) with the Ka‘bah to your left. Touch or point to the Black Stone saying “Allahu Akbar”.',
    virtue: 'Each completed 7-circuit Tawaf forgives all past sins and elevates the servant in rank.',
    ruleWarning: 'Wudu is required. Men uncover their right shoulder (Idtiba‘) during the Tawaf of ‘Umrah and walk briskly with small steps (Raml) during the first 3 circuits.',
  },
  {
    id: 'maqam-ibrahim',
    number: 5,
    title: 'Two Rak‘ahs Behind Maqām Ibrāhīm',
    titleAr: 'رَكْعَتَا مَقَامِ إِبْرَاهِيمَ',
    location: 'Behind Maqam Ibrahim or anywhere in the Grand Mosque',
    desc: 'Recite: “Wattakhidhoo mim-maqami Ibraheema musalla” and pray two light units: recite Surah Al-Kafirun in the first and Surah Al-Ikhlas in the second.',
    arabicText: 'وَاتَّخِذُوا مِنْ مَقَامِ إِبْرَاهِيمَ مُصَلًّى',
    transliteration: 'Wattakhidhoo mim-maqami Ibraheema musalla.',
    translation: 'And take the station of Abraham as a place of prayer. (Surah Al-Baqarah 2:125)',
    virtue: 'Reviving the exact prayer station established by Prophet Ibrahim (peace be upon him).',
  },
  {
    id: 'zamzam-water',
    number: 6,
    title: 'Drinking Blessed Zamzam Water',
    titleAr: 'الشُّرْبُ مِنْ مَاءِ زَمْزَمَ',
    location: 'Zamzam dispensing taps or Mataf wells',
    desc: 'Drink plenty of Zamzam water facing the Ka‘bah, standing, and supplicating for whatever your heart desires.',
    arabicText: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا وَاسِعًا، وَشِفَاءً مِنْ كُلِّ دَاءٍ',
    transliteration: 'Allahumma inni as’aluka ‘ilman nafi‘an, wa rizqan wasi‘an, wa shifa’an min kulli da’.',
    translation: 'O Allah, I ask You for beneficial knowledge, abundant sustenance, and a cure from every illness.',
    virtue: '“The water of Zamzam is for whatever intention it is drank for.” (Ibn Majah)',
  },
  {
    id: 'sai',
    number: 7,
    title: 'Sa‘ī (7 Laps Between Safā and Marwah)',
    titleAr: 'السَّعْيُ بَيْنَ الصَّفَا وَالمَرْوَةِ (٧ أَشْوَاطٍ)',
    location: 'The Mas‘a corridor',
    desc: 'Ascend Mount Safa first. Complete 7 laps ending at Mount Marwah (Safa to Marwah is Lap 1, Marwah to Safa is Lap 2... ending on Lap 7 at Marwah). Men jog gently between green lights.',
    arabicText: SAFA_MARWAH_DUA.arabic,
    transliteration: SAFA_MARWAH_DUA.transliteration,
    translation: SAFA_MARWAH_DUA.translation,
    virtue: 'Commemorating the profound faith and perseverance of Hajar (Mother of Prophet Isma‘il).',
  },
  {
    id: 'halq-taqsir',
    number: 8,
    title: 'Ḥalq (Shaving) or Taqṣīr (Trimming)',
    titleAr: 'الحَلْقُ أَوِ التَّقْصِيرُ',
    location: 'Barber shops near the Grand Mosque',
    desc: 'Men shave the entire head (Halq - triple reward) or trim hair all around (Taqsir). Women trim approximately a fingertip’s length (1-2 cm) from the end of their braid.',
    virtue: 'The Prophet ﷺ prayed for those who shave their heads three times, and once for those who trim.',
    ruleWarning: 'Once hair is cut, your ‘Umrah is complete and all Ihram prohibitions are completely lifted!',
  },
];

export const TAWAF_CIRCUITS_KEY = 'dhikrly_tawaf_circuit_v1';
export const SAI_LAPS_KEY = 'dhikrly_sai_laps_v1';
