/**
 * sunnahData.ts
 * Curated authentic Prophetic Sunnah practices, supplications,
 * Hadith sources, notification presets, and audio recitation melodic data.
 */

export type SunnahCategory =
  | 'all'
  | 'rawatib'
  | 'daily'
  | 'duha'
  | 'night'
  | 'friday'
  | 'fasting';

export interface SunnahItem {
  id: string;
  category: Exclude<SunnahCategory, 'all'>;
  title: string;
  titleAr: string;
  desc: string;
  virtue: string;
  hadith: string;
  reference: string;
  arabicText?: string;
  transliteration?: string;
  translation?: string;
  rakats?: number;
  timeOfDay?: string;
  audioTitle?: string;
  audioFrequencies?: number[]; // Harmonic melodic intervals for procedural audio playback
  notificationPreset?: {
    defaultTime: string;
    label: string;
  };
}

export const SUNNAH_CATEGORIES: { key: SunnahCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'All Sunnahs', icon: 'Sparkles' },
  { key: 'rawatib', label: 'Rawātib (12 Prayers)', icon: 'Clock3' },
  { key: 'daily', label: 'Daily Habits', icon: 'HeartHandshake' },
  { key: 'duha', label: 'Duḥā Prayer', icon: 'Sun' },
  { key: 'night', label: 'Tahajjud & Sleep', icon: 'MoonStar' },
  { key: 'friday', label: 'Jumu‘ah Traditions', icon: 'BookOpen' },
  { key: 'fasting', label: 'Sunnah Fasting', icon: 'CalendarCheck' },
];

export const SUNNAH_ITEMS: SunnahItem[] = [
  {
    id: 'fajr-rawatib',
    category: 'rawatib',
    title: 'Two Rak‘ahs Before Fajr',
    titleAr: 'سُنَّةُ الفَجْرِ الرَّاتِبَة',
    desc: 'Two light units of prayer prayed before the obligatory Fajr prayer.',
    rakats: 2,
    timeOfDay: 'Between Fajr adhan and iqamah',
    virtue: 'Better than the entire world and everything within it.',
    hadith: '“The two rak‘ahs of Fajr are better than this world and everything in it.”',
    reference: 'Sahih Muslim 725',
    arabicText: 'رَكْعَتَا الْفَجْرِ خَيْرٌ مِنَ الدُّنْيَا وَمَا فِيهَا',
    transliteration: 'Rak‘ata al-fajri khayrun mina ad-dunya wa ma feeha.',
    translation: 'The two rak‘ahs of Fajr are better than the world and all that is in it.',
    audioTitle: 'Fajr Sunnah Supplication',
    audioFrequencies: [330, 392, 440, 494, 523, 587], // E4, G4, A4, B4, C5, D5
    notificationPreset: {
      defaultTime: '05:30',
      label: 'Fajr Sunnah Reminder',
    },
  },
  {
    id: 'dhuhr-rawatib',
    category: 'rawatib',
    title: 'Four Before & Two After Dhuhr',
    titleAr: 'سُنَّةُ الظُّهْرِ (٤ قَبْلَهَا وَ٢ بَعْدَهَا)',
    desc: 'Four rak‘ahs before the Dhuhr fard prayer and two rak‘ahs immediately following it.',
    rakats: 6,
    timeOfDay: 'Midday around Dhuhr',
    virtue: 'Part of the 12 confirmed daily units that guarantee a palace in Paradise.',
    hadith: '“Whoever prays twelve rak‘ahs during the day and night, a house will be built for him in Paradise.”',
    reference: 'Sahih Muslim 728',
    audioTitle: 'Rawātib Supplication',
    audioFrequencies: [261.63, 329.63, 392.0, 523.25], // C Major triad
    notificationPreset: {
      defaultTime: '12:45',
      label: 'Dhuhr Sunnah Reminder',
    },
  },
  {
    id: 'maghrib-rawatib',
    category: 'rawatib',
    title: 'Two Rak‘ahs After Maghrib',
    titleAr: 'سُنَّةُ المَغْرِبِ الرَّاتِبَة',
    desc: 'Two rak‘ahs performed immediately after the three obligatory units of Maghrib, preferably at home.',
    rakats: 2,
    timeOfDay: 'Immediately after Maghrib',
    virtue: 'The Prophet ﷺ regularly prayed these in his home to fill the household with light.',
    hadith: '“Pray some of your prayers in your homes, and do not make them like graves.”',
    reference: 'Sahih al-Bukhari 432',
    audioTitle: 'Maghrib Sunnah Chime',
    audioFrequencies: [392, 440, 494, 587, 659],
  },
  {
    id: 'isha-rawatib',
    category: 'rawatib',
    title: 'Two Rak‘ahs After ‘Isha',
    titleAr: 'سُنَّةُ العِشَاءِ الرَّاتِبَة',
    desc: 'Two rak‘ahs prayed after the four obligatory units of ‘Isha before the Witr prayer.',
    rakats: 2,
    timeOfDay: 'After ‘Isha before sleep',
    virtue: 'Completes the twelve daily rawātib prescribed by the Messenger of Allah ﷺ.',
    hadith: '“Whoever preserves twelve rak‘ahs of Sunnah each day, Allah builds a mansion for him in Jannah.”',
    reference: 'Jami` at-Tirmidhi 414',
    audioTitle: 'Night Rawatib Reflection',
    audioFrequencies: [293.66, 349.23, 440, 587.33],
  },
  {
    id: 'duha-prayer',
    category: 'duha',
    title: 'Salāt ad-Duḥā (Forenoon Prayer)',
    titleAr: 'صَلَاةُ الضُّحَى (صَلَاةُ الأَوَّابِينَ)',
    desc: 'Two to eight rak‘ahs prayed between sunrise (+15 mins) and 15 minutes before Dhuhr.',
    rakats: 2,
    timeOfDay: 'Mid-morning (08:00 - 11:30)',
    virtue: 'Fulfills the daily charity required for every one of the 360 joints in the human body.',
    hadith: '“In the morning, charity is due for every joint in the body of each of you... and two rak‘ahs of Duḥā suffice for all of that.”',
    reference: 'Sahih Muslim 720',
    arabicText: 'يُصْبِحُ عَلَى كُلِّ سُلَامَى مِنْ أَحَدِكُمْ صَدَقَةٌ... وَيُجْزِئُ مِنْ ذَلِكَ رَكْعَتَانِ يَرْكَعُهُمَا مِنَ الضُّحَى',
    transliteration: 'Yusbihu ‘ala kulli sulama min ahadikum sadaqah... wa yujzi’u min dhalika rak‘atani yarka‘uhuma mina ad-Duha.',
    translation: 'Every joint requires charity each day; two rak‘ahs of Duḥā suffice for all of that.',
    audioTitle: 'Duḥā Prayer Supplication',
    audioFrequencies: [349.23, 440.0, 523.25, 659.25, 783.99],
    notificationPreset: {
      defaultTime: '09:00',
      label: 'Duḥā Prayer Notification',
    },
  },
  {
    id: 'sayyidul-istighfar',
    category: 'daily',
    title: 'Sayyid al-Istighfār (Master Du‘ā for Forgiveness)',
    titleAr: 'سَيِّدُ الاِسْتِغْفَارِ',
    desc: 'The most sublime and comprehensive prophetic supplication for repentance and Divine pardon.',
    timeOfDay: 'Morning and Evening',
    virtue: 'Whoever recites it with conviction during the day or night and dies before sunset/sunrise will be among the people of Paradise.',
    hadith: '“The master of supplications for forgiveness is: Allahumma Anta Rabbi la ilaha illa Ant...”',
    reference: 'Sahih al-Bukhari 6306',
    arabicText: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    transliteration: 'Allahumma Anta Rabbi la ilaha illa Anta, khalaqtani wa ana ‘abduka, wa ana ‘ala ‘ahdika wa wa‘dika mastata‘tu, a‘oodhu bika min sharri ma sana‘tu, aboo’u laka bini‘matika ‘alayya, wa aboo’u bidhanbi faghfir li fa-innahu la yaghfiru adh-dhunooba illa Ant.',
    translation: 'O Allah, You are my Lord; there is no deity worthy of worship except You. You created me and I am Your slave, and I uphold Your covenant and promise as much as I am able. I seek refuge in You from the evil of what I have done. I acknowledge Your favor upon me, and I confess my sin, so forgive me, for none forgives sins except You.',
    audioTitle: 'Sayyid al-Istighfar Recitation',
    audioFrequencies: [220, 277.18, 329.63, 440, 554.37], // A major meditative
    notificationPreset: {
      defaultTime: '06:30',
      label: 'Morning Sunnah & Istighfar',
    },
  },
  {
    id: 'ayatul-kursi-fard',
    category: 'daily',
    title: 'Āyat al-Kursī After Obligatory Prayers',
    titleAr: 'آيَةُ الكُرْسِيِّ دُبُرَ كُلِّ صَلَاةٍ',
    desc: 'Reciting Surah Al-Baqarah verse 255 immediately after concluding each obligatory Ṣalāh.',
    timeOfDay: 'After each of the 5 prayers',
    virtue: 'Nothing stands between the person and entering Paradise except physical death.',
    hadith: '“Whoever recites Āyat al-Kursī after every obligatory prayer, nothing will prevent him from entering Paradise except death.”',
    reference: 'Sunan an-Nasa’i al-Kubra 9848 (Sahih)',
    arabicText: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ',
    transliteration: 'Allahu la ilaha illa Huwa al-Hayyul Qayyoom, la ta’khudhuhu sinatuw-wa la nawm...',
    translation: 'Allah! There is no deity except Him, the Ever-Living, the Sustainer of all existence. Neither drowsiness overtakes Him nor sleep...',
    audioTitle: 'Āyat al-Kursī Recitation',
    audioFrequencies: [261.63, 311.13, 392, 466.16, 523.25], // C minor sacred
  },
  {
    id: 'miswak-sunnah',
    category: 'daily',
    title: 'The Sunnah of Miswak & Oral Purity',
    titleAr: 'السِّوَاكُ عِنْدَ الصَّلَاةِ وَالوُضُوءِ',
    desc: 'Cleaning the teeth and gums using natural olive or arak root before wudu, prayer, and recitation.',
    timeOfDay: 'Before every wudu and prayer',
    virtue: 'Purifies the mouth and pleases the Lord of the worlds.',
    hadith: '“The Miswak cleanses the mouth and pleases the Lord.”',
    reference: 'Sahih al-Bukhari 1933',
    audioTitle: 'Miswak & Purity Reminder',
    audioFrequencies: [330, 392, 494, 587],
  },
  {
    id: 'drinking-water-sunnah',
    category: 'daily',
    title: 'Etiquette of Drinking Water (Seated & Three Breaths)',
    titleAr: 'آدَابُ الشُّرْبِ ثَلَاثًا جَالِسًا',
    desc: 'Sitting down, saying Bismillah, and drinking water in three separate sips rather than gulping.',
    timeOfDay: 'Throughout the day',
    virtue: 'More wholesome, thirst-quenching, and healthier for digestion.',
    hadith: '“The Messenger of Allah ﷺ used to breathe three times during drinking.”',
    reference: 'Sahih Muslim 2028',
    audioTitle: 'Prophetic Etiquette Chime',
    audioFrequencies: [440, 523, 659],
  },
  {
    id: 'tahajjud-vigil',
    category: 'night',
    title: 'Tahajjud & Night Vigil (Qiyām al-Layl)',
    titleAr: 'قِيَامُ اللَّيْلِ وَالتَّهَجُّد',
    desc: 'Voluntary night prayers offered after sleeping, ideally in the last third of the night before Fajr.',
    rakats: 8,
    timeOfDay: 'Final third of the night (03:00 - 05:00)',
    virtue: 'The most virtuous prayer after obligatory prayer; the time when Allah descends to the lowest heaven answering du‘ā.',
    hadith: '“Our Lord descends every night to the lowest heaven when the last third of the night remains, saying: ‘Who is calling upon Me that I may answer him?’...”',
    reference: 'Sahih al-Bukhari 1145',
    audioTitle: 'Tahajjud Dawn Resonance',
    audioFrequencies: [130.81, 196, 261.63, 329.63, 440],
    notificationPreset: {
      defaultTime: '04:15',
      label: 'Tahajjud & Night Vigil Reminder',
    },
  },
  {
    id: 'sleep-sunnahs',
    category: 'night',
    title: 'Night Sleep Sunnahs & 3 Quls in Hands',
    titleAr: 'سُنَنُ النَّوْمِ وَالنَّفْثُ بِالمُعَوِّذَاتِ',
    desc: 'Performing wudu before bed, dusting the sheets thrice, cupping the hands to blow into them while reciting Surah Al-Ikhlas, Al-Falaq, and An-Nas, and wiping over the body.',
    timeOfDay: 'Right before sleeping',
    virtue: 'Provides complete divine armor and protection from nightmares, evil, and afflictions throughout the night.',
    hadith: '“Whenever the Prophet ﷺ went to bed every night, he would cup his hands together and blow over them after reciting Surat Al-Ikhlas, Surat Al-Falaq, and Surat An-Nas...”',
    reference: 'Sahih al-Bukhari 5017',
    arabicText: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ',
    transliteration: 'Bismika Rabbi wada‘tu janbi wa bika arfa‘uh, fa-in amsakta nafsi farhamha, wa in arsaltaha fahfazha bima tahfazu bihi ‘ibadakas-saliheen.',
    translation: 'In Your name my Lord, I lay down my side and in Your name I raise it. If You take my soul, have mercy upon it, and if You release it, protect it with that which You protect Your righteous slaves.',
    audioTitle: 'Sleep Protection Du‘ā',
    audioFrequencies: [174.61, 220, 261.63, 349.23], // Warm peaceful F
    notificationPreset: {
      defaultTime: '22:30',
      label: 'Sleep Sunnahs & Du‘ā',
    },
  },
  {
    id: 'surah-mulk-night',
    category: 'night',
    title: 'Recitation of Surah Al-Mulk (The Sovereignty)',
    titleAr: 'قِرَاءَةُ سُورَةِ المُلْكِ كُلَّ لَيْلَةٍ',
    desc: 'Reciting all 30 verses of Surah 67 each evening before sleep.',
    timeOfDay: 'Evening or Night before sleep',
    virtue: 'Intercedes for its reciter until his sins are forgiven and protects against the punishment of the grave.',
    hadith: '“There is a chapter of thirty verses in the Qur’an which will intercede for a man until he is forgiven: Tabarakal-ladhi bi-yadihi al-Mulk.”',
    reference: 'Sunan Abi Dawud 1400',
    audioTitle: 'Surah Al-Mulk Theme',
    audioFrequencies: [220, 261.63, 293.66, 349.23, 440],
  },
  {
    id: 'friday-kahf',
    category: 'friday',
    title: 'Recitation of Surah Al-Kahf on Friday',
    titleAr: 'قِرَاءَةُ سُورَةِ الكَهْفِ يَوْمَ الجُمُعَةِ',
    desc: 'Reciting Surah 18 from Thursday sunset through Friday sunset.',
    timeOfDay: 'Friday from dawn to Maghrib',
    virtue: 'A divine celestial light will illuminate the reciter until the following Friday.',
    hadith: '“Whoever reads Surah Al-Kahf on Friday will have a light shining from under his feet to the clouds of heaven...”',
    reference: 'Al-Mustadrak al-Hakim 3392 (Sahih)',
    audioTitle: 'Surah Al-Kahf Divine Aura',
    audioFrequencies: [261.63, 329.63, 392, 523.25, 659.25],
    notificationPreset: {
      defaultTime: '08:00',
      label: 'Friday Surah Al-Kahf Reminder',
    },
  },
  {
    id: 'friday-salawat',
    category: 'friday',
    title: 'Abundant Salawāt on Prophet Muhammad ﷺ',
    titleAr: 'الإِكْثَارُ مِنَ الصَّلَاةِ عَلَى النَّبِيِّ ﷺ',
    desc: 'Sending continuous blessings and salutations upon the Prophet ﷺ throughout Friday.',
    timeOfDay: 'Throughout the entirety of Friday',
    virtue: 'Blessings are presented directly to the Prophet ﷺ, and Allah sends ten blessings in return for every one sent.',
    hadith: '“The best of your days is Friday... so send abundant blessings upon me on it, for your blessings are shown to me.”',
    reference: 'Sunan Abi Dawud 1047',
    arabicText: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
    transliteration: 'Allahumma salli ‘ala Muhammadin wa ‘ala aali Muhammadin kama sallayta ‘ala Ibrahima wa ‘ala aali Ibrahima innaka Hameedun Majeed.',
    translation: 'O Allah, send blessings upon Muhammad and upon the family of Muhammad, as You sent blessings upon Abraham and upon the family of Abraham; indeed You are Praiseworthy, Glorious.',
    audioTitle: 'Salawāt al-Ibrahimiyyah Recitation',
    audioFrequencies: [293.66, 369.99, 440, 587.33], // D major uplifting
    notificationPreset: {
      defaultTime: '10:00',
      label: 'Friday Salawāt Reminder',
    },
  },
  {
    id: 'monday-thursday-fasting',
    category: 'fasting',
    title: 'Fasting on Mondays and Thursdays',
    titleAr: 'صِيَامُ الإِثْنَيْنِ وَالخَمِيسِ',
    desc: 'Observing voluntary fasts on Mondays and Thursdays as practiced by the Prophet ﷺ.',
    timeOfDay: 'Dawn until sunset (Fajr to Maghrib)',
    virtue: 'The days when deeds are presented before Allah, and the Prophet ﷺ loved for his deeds to be presented while fasting.',
    hadith: '“Deeds are shown (to Allah) on Mondays and Thursdays, and I love for my deeds to be shown while I am fasting.”',
    reference: 'Jami` at-Tirmidhi 747',
    audioTitle: 'Sunnah Fasting Reflection',
    audioFrequencies: [330, 392, 440, 523],
    notificationPreset: {
      defaultTime: '20:30',
      label: 'Monday/Thursday Fasting Reminder',
    },
  },
  {
    id: 'white-days-fasting',
    category: 'fasting',
    title: 'The White Days (Ayyām al-Beed: 13th, 14th, 15th)',
    titleAr: 'صِيَامُ الأَيَّامِ البِيضِ (١٣، ١٤، ١٥)',
    desc: 'Fasting the 13th, 14th, and 15th days of each lunar Hijri month during the full moon.',
    timeOfDay: 'Mid-month Hijri days',
    virtue: 'Equivalent in reward to fasting the entire lifetime.',
    hadith: '“Fast three days of each month: the thirteenth, fourteenth, and fifteenth.”',
    reference: 'Sunan an-Nasa’i 2420',
    audioTitle: 'White Days Contemplation',
    audioFrequencies: [261.63, 329.63, 392, 523.25],
  },
];

export const SUNNAH_STORAGE_KEY = 'dhikrly_sunnah_completed_';
export const SUNNAH_NOTIF_SETTINGS_KEY = 'dhikrly_sunnah_notifs_v1';

export interface SunnahNotificationSettings {
  fajrEnabled: boolean;
  dhuhrEnabled: boolean;
  duhaEnabled: boolean;
  sleepEnabled: boolean;
  fridayEnabled: boolean;
  fastingEnabled: boolean;
}

export const DEFAULT_SUNNAH_NOTIFS: SunnahNotificationSettings = {
  fajrEnabled: true,
  dhuhrEnabled: true,
  duhaEnabled: true,
  sleepEnabled: true,
  fridayEnabled: true,
  fastingEnabled: false,
};
