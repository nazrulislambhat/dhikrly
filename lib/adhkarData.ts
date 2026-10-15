/**
 * Comprehensive authentic Adhkar collection from Hisn al-Muslim (Fortress of the Muslim)
 * with full Arabic vocalization, transliteration, English translation, count, and references.
 */

export type AdhkarCategoryKey =
  | 'morning'
  | 'evening'
  | 'post-salah'
  | 'sleep'
  | 'waking'
  | 'protection'
  | 'istighfar'
  | 'quran';

export interface AdhkarItem {
  id: string;
  category: AdhkarCategoryKey;
  targetCount: number;
  countLabel: string;
  title: string;
  titleAr: string;
  ar: string;
  transliteration: string;
  en: string;
  virtue: string;
  source: string;
}

export interface AdhkarCategoryMeta {
  key: AdhkarCategoryKey;
  label: string;
  labelAr: string;
  description: string;
  iconName: string;
}

export const ADHKAR_CATEGORIES: AdhkarCategoryMeta[] = [
  {
    key: 'morning',
    label: 'Morning Adhkār',
    labelAr: 'أذكار الصباح',
    description: 'Recited after Fajr until sunrise for protection, barakah, and clarity',
    iconName: 'Sunrise',
  },
  {
    key: 'evening',
    label: 'Evening Adhkār',
    labelAr: 'أذكار المساء',
    description: 'Recited between Asr and Maghrib for safety through the night',
    iconName: 'Sunset',
  },
  {
    key: 'post-salah',
    label: 'After Farḍ Ṣalāh',
    labelAr: 'أذكار بعد الصلاة المفروضة',
    description: 'Sunnah remembrance prescribed immediately following each obligatory prayer',
    iconName: 'Clock3',
  },
  {
    key: 'sleep',
    label: 'Before Sleep',
    labelAr: 'أذكار النوم',
    description: 'Supplications of peaceful rest, angelic protection, and surrendering the soul',
    iconName: 'Moon',
  },
  {
    key: 'waking',
    label: 'Upon Waking',
    labelAr: 'أذكار الاستيقاظ',
    description: 'Gratitude for the renewal of life and praising the Ever-Living Sustainer',
    iconName: 'Sun',
  },
  {
    key: 'protection',
    label: 'Protection & Refuge',
    labelAr: 'الحفظ والتحصين',
    description: 'Shield against anxiety, evil eye, illness, harm, and devilish whispers',
    iconName: 'ShieldCheck',
  },
  {
    key: 'istighfar',
    label: 'Istighfār & Repentance',
    labelAr: 'الاستغفار والتوبة',
    description: 'Seeking cleansing, forgiveness, and mercy from the All-Forgiving',
    iconName: 'Sparkles',
  },
  {
    key: 'quran',
    label: 'Qur’anic Supplications',
    labelAr: 'أدعية من القرآن الكريم',
    description: 'Timeless duas taught by the Prophets in the Noble Qur’an',
    iconName: 'BookOpen',
  },
];

export const ALL_ADHKAR: AdhkarItem[] = [
  // ── MORNING ──
  {
    id: 'm-asbahna',
    category: 'morning',
    targetCount: 1,
    countLabel: '1× in morning',
    title: 'We have entered the morning upon the natural disposition of Islam',
    titleAr: 'أَصْبَحْنَا عَلَى فِطْرَةِ الإِسْلاَمِ',
    ar: 'أَصْبَحْنَا عَلَى فِطْرَةِ الإِسْلاَمِ، وَعَلَى كَلِمَةِ الإِخْلاَصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صلى الله عليه وسلم، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ.',
    transliteration: "Aṣbaḥnā 'alā fiṭratil-Islām, wa 'alā kalimatil-ikhlāṣ, wa 'alā dīni nabiyyinā Muḥammadin ṣallallāhu 'alayhi wa sallam, wa 'alā millati abīnā Ibrāhīma ḥanīfan musliman wa mā kāna minal-mushrikīn.",
    en: 'We have entered the morning upon the natural religion of Islam, the word of sincere faith, the religion of our Prophet Muhammad (ﷺ), and the creed of our father Ibrahim, upright and submitting to Allah, and he was not among the polytheists.',
    virtue: 'Renews pure monotheism and connection with the prophetic lineage each morning.',
    source: 'Musnad Ahmad (3/406) · Sahih',
  },
  {
    id: 'm-sayyidul-istighfar',
    category: 'morning',
    targetCount: 1,
    countLabel: '1× morning & evening',
    title: 'Sayyid al-Istighfār (The Master Supplication for Forgiveness)',
    titleAr: 'سَيِّدُ الاِسْتِغْفَارِ',
    ar: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ.',
    transliteration: "Allāhumma anta Rabbī lā ilāha illā anta, khalaqtanī wa anā 'abduka, wa anā 'alā 'ahdika wa wa'dika mastata'tu, a'ūdhu bika min sharri mā ṣana'tu, abū'u laka bini'matika 'alayya, wa abū'u bidhanbī faghfir lī fa-innahu lā yaghfirudh-dhunūba illā ant.",
    en: 'O Allah, You are my Lord; there is no deity worthy of worship except You. You created me and I am Your servant, and I uphold Your covenant and promise as much as I am able. I seek refuge in You from the evil of what I have done. I acknowledge before You Your blessing upon me, and I acknowledge my sin, so forgive me, for none forgives sins except You.',
    virtue: 'Whoever recites this during the day with conviction and dies before evening will be among the people of Paradise (and likewise at night).',
    source: 'Sahih al-Bukhari (6306)',
  },
  {
    id: 'm-rabbighfirli',
    category: 'morning',
    targetCount: 3,
    countLabel: '3× in morning',
    title: 'Praise by the weight of His Throne and ink of His words',
    titleAr: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ',
    ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ: عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ.',
    transliteration: "Subḥānallāhi wa biḥamdih: 'adada khalqih, wa riḍā nafsih, wa zinata 'arshih, wa midāda kalimātih.",
    en: 'Glory be to Allah and His praise, according to the count of His creation, according to His pleasure, according to the weight of His Throne, and according to the ink of His words.',
    virtue: 'Outweighs hours of continuous recitation according to the Prophet ﷺ speaking to Juwayriyah (ra).',
    source: 'Sahih Muslim (2726)',
  },
  {
    id: 'm-bismillahilladhi',
    category: 'morning',
    targetCount: 3,
    countLabel: '3× in morning & evening',
    title: 'Refuge in the Name of Allah from all harm',
    titleAr: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ',
    ar: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ، وَهُوَ السَّمِيعُ الْعَلِيمُ.',
    transliteration: "Bismillāhilladhī lā yaḍurru ma'asmihī shay'un fil-arḍi wa lā fis-samā', wa Huwas-Samī'ul-'Alīm.",
    en: 'In the Name of Allah, with Whose Name nothing can cause harm in the earth nor in the heavens, and He is the All-Hearing, the All-Knowing.',
    virtue: 'Whoever recites it three times in the morning and evening, nothing will harm him.',
    source: 'Sunan Abi Dawud (5088) · Sahih',
  },
  {
    id: 'm-raditu-billah',
    category: 'morning',
    targetCount: 3,
    countLabel: '3× morning & evening',
    title: 'Pleasure with Allah as Lord, Islam as Religion & Muhammad as Prophet',
    titleAr: 'رَضِيتُ بِاللَّهِ رَبًّا',
    ar: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالإِسْلاَمِ دِينًا، وَبِمُحَمَّدٍ صلى الله عليه وسلم نَبِيًّا.',
    transliteration: "Raḍītu billāhi Rabban, wa bil-Islāmi dīnan, wa bi-Muḥammadin (ṣallallāhu 'alayhi wa sallam) nabiyyā.",
    en: 'I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace and blessings of Allah be upon him) as my Prophet.',
    virtue: 'Allah takes it upon Himself to please whoever recites this three times morning and evening on the Day of Resurrection.',
    source: 'Jami` at-Tirmidhi (3389) · Hasan Sahih',
  },

  // ── EVENING ──
  {
    id: 'e-amsayna',
    category: 'evening',
    targetCount: 1,
    countLabel: '1× in evening',
    title: 'We have reached the evening and dominion belongs to Allah',
    titleAr: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ',
    ar: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.',
    transliteration: "Amsaynā wa amsal-mulku lillāh, wal-ḥamdu lillāh, lā ilāha illallāhu waḥdahū lā sharīka lah, lahul-mulku wa lahul-ḥamdu wa Huwa 'alā kulli shay'in Qadīr.",
    en: 'We have reached the evening and the kingdom belongs to Allah, and all praise is for Allah. None has the right to be worshipped except Allah alone, without partner; to Him belongs all dominion and praise, and He has power over all things.',
    virtue: 'Affirms that the sovereignty of the universe belongs only to Allah as the shadows fall.',
    source: 'Sahih Muslim (2723)',
  },
  {
    id: 'e-audhu-bikalimatillah',
    category: 'evening',
    targetCount: 3,
    countLabel: '3× in evening',
    title: 'Refuge in the Perfect Words of Allah from the evil of creation',
    titleAr: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    ar: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ.',
    transliteration: "A'ūdhu bi-kalimātillāhit-tāmmāti min sharri mā khalaq.",
    en: 'I seek refuge in the perfect words of Allah from the evil of whatever He has created.',
    virtue: 'No sting, venom, or harm will touch the reciter on that night.',
    source: 'Sahih Muslim (2709)',
  },
  {
    id: 'e-allahumma-afini',
    category: 'evening',
    targetCount: 3,
    countLabel: '3× in morning & evening',
    title: 'Supplication for Health in Body, Hearing & Sight',
    titleAr: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي',
    ar: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ.',
    transliteration: "Allāhumma 'āfinī fī badanī, Allāhumma 'āfinī fī sam'ī, Allāhumma 'āfinī fī baṣarī, lā ilāha illā ant.",
    en: 'O Allah, grant me health in my body. O Allah, grant me health in my hearing. O Allah, grant me health in my sight. There is no deity worthy of worship except You.',
    virtue: 'A plea for physical, mental and spiritual preservation against decay and afflictions.',
    source: 'Sunan Abi Dawud (5090) · Hasan',
  },

  // ── POST SALAH ──
  {
    id: 'ps-astaghfirullah',
    category: 'post-salah',
    targetCount: 3,
    countLabel: '3× after every prayer',
    title: 'Seeking Forgiveness & Supplication for Peace',
    titleAr: 'أَسْتَغْفِرُ اللَّهَ وَدُعَاءُ السَّلاَمِ',
    ar: 'أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ. اللَّهُمَّ أَنْتَ السَّلاَمُ وَمِنْكَ السَّلاَمُ، تَبَارَكْتَ يَا ذَا الْجَلاَلِ وَالإِكْرَامِ.',
    transliteration: "Astaghfirullāh (3×). Allāhumma Antas-Salāmu wa minkas-salām, tabārakta yā Dhal-Jalāli wal-Ikrām.",
    en: 'I seek the forgiveness of Allah (3×). O Allah, You are Peace and from You comes peace. Blessed are You, O Possessor of majesty and honor.',
    virtue: 'Direct Sunnah of the Prophet ﷺ recited immediately after saying the Tasleem.',
    source: 'Sahih Muslim (591)',
  },
  {
    id: 'ps-tasbih-fatimah',
    category: 'post-salah',
    targetCount: 33,
    countLabel: '33× SubhanAllah, 33× Alhamdulillah, 33× Allahu Akbar',
    title: 'The Great Post-Prayer Tasbīḥ (100 Remembrance)',
    titleAr: 'التَّسْبِيحُ عَقِبَ الصَّلَوَاتِ',
    ar: 'سُبْحَانَ اللَّهِ (٣٣)، الْحَمْدُ لِلَّهِ (٣٣)، اللَّهُ أَكْبَرُ (٣٣). لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.',
    transliteration: "Subḥānallāh (33×), Al-ḥamdu lillāh (33×), Allāhu Akbar (33×). Lā ilāha illallāhu waḥdahū lā sharīka lah, lahul-mulku wa lahul-ḥamdu wa Huwa 'alā kulli shay'in Qadīr.",
    en: 'Glory be to Allah (33×), Praise be to Allah (33×), Allah is the Greatest (33×). None has the right to be worshipped except Allah alone, without partner; to Him belongs all dominion and praise, and He has power over all things.',
    virtue: 'Whoever says this after every prayer, their sins will be forgiven even if they are like the foam of the sea.',
    source: 'Sahih Muslim (597)',
  },
  {
    id: 'ps-ayat-kursi',
    category: 'post-salah',
    targetCount: 1,
    countLabel: '1× after every Fard prayer',
    title: 'Āyat al-Kursī (The Verse of the Throne)',
    titleAr: 'آيَةُ الْكُرْسِيِّ',
    ar: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ.',
    transliteration: "Allāhu lā ilāha illā Huwal-Ḥayyul-Qayyūm, lā ta'khudhuhū sinatun wa lā nawm, lahū mā fis-samāwāti wa mā fil-arḍ, man dhal-ladhī yashfa'u 'indahū illā bi-idhnih...",
    en: 'Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep...',
    virtue: 'Whoever recites it after every obligatory prayer, nothing stands between him and entering Paradise except death.',
    source: 'Sunan an-Nasa’i al-Kubra (9928) · Sahih',
  },

  // ── SLEEP ──
  {
    id: 'sl-bismika',
    category: 'sleep',
    targetCount: 1,
    countLabel: '1× before sleep',
    title: 'In Your Name, O Allah, I die and I live',
    titleAr: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    ar: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا.',
    transliteration: 'Bismikallāhumma amūtu wa aḥyā.',
    en: 'In Your Name, O Allah, I die and I live.',
    virtue: 'The fundamental Sunnah supplication uttered when retiring to bed.',
    source: 'Sahih al-Bukhari (6324)',
  },
  {
    id: 'sl-wadatu-janbi',
    category: 'sleep',
    targetCount: 1,
    countLabel: '1× in bed',
    title: 'In Your Name I place my side and in Your Name I raise it',
    titleAr: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي',
    ar: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ.',
    transliteration: "Bismika Rabbī waḍa'tu jambī, wa bika arfa'uh, fa-in amsakta nafsī farḥam-hā, wa in arsaltahā faḥfaẓhā bimā taḥfaẓu bihī 'ibādakaṣ-ṣāliḥīn.",
    en: 'In Your Name, my Lord, I lay down my side and in Your Name I raise it. If You hold back my soul, then have mercy on it, and if You release it, then protect it with that wherewith You protect Your righteous servants.',
    virtue: 'Offers the soul to Allah’s care during sleep.',
    source: 'Sahih al-Bukhari (6320) & Muslim (2714)',
  },

  // ── WAKING ──
  {
    id: 'wk-alhamdulillah',
    category: 'waking',
    targetCount: 1,
    countLabel: '1× upon waking',
    title: 'Praise to Allah Who gave us life after causing us to die',
    titleAr: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا',
    ar: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ.',
    transliteration: 'Al-ḥamdu lillāhilladhī aḥyānā ba‘da mā amātanā wa ilayhin-nushūr.',
    en: 'All praise is for Allah Who gave us life after having caused us to die, and unto Him is the resurrection.',
    virtue: 'First conscious remembrance to welcome the day with deep gratitude.',
    source: 'Sahih al-Bukhari (6312)',
  },

  // ── PROTECTION ──
  {
    id: 'pr-hasbiyallah',
    category: 'protection',
    targetCount: 7,
    countLabel: '7× morning & evening',
    title: 'Allah is sufficient for me; there is no deity but Him',
    titleAr: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ',
    ar: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ.',
    transliteration: "Ḥasbiyallāhu lā ilāha illā Huwa, 'alayhi tawakkaltu wa Huwa Rabbul-'Arshil-'Aẓīm.",
    en: 'Allah is sufficient for me. There is no deity except Him. Upon Him I have relied, and He is the Lord of the Great Throne.',
    virtue: 'Whoever says it 7 times morning and evening, Allah will suffice him in whatever worries him in this world and the Hereafter.',
    source: 'Sunan Abi Dawud (5081) · Mawquf Sahih',
  },
  {
    id: 'pr-la-hawla',
    category: 'protection',
    targetCount: 100,
    countLabel: '100× daily or anytime',
    title: 'There is no power nor might except with Allah',
    titleAr: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    ar: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ.',
    transliteration: "Lā ḥawla wa lā quwwata illā billāhil-'Aliyyil-'Aẓīm.",
    en: 'There is no power and no strength except with Allah, the Most High, the Most Supreme.',
    virtue: 'A treasure from the treasures of Paradise (Kanzun min kunūzil-Jannah).',
    source: 'Sahih al-Bukhari (6384)',
  },

  // ── ISTIGHFAR ──
  {
    id: 'is-astaghfirullah-wa-atubu',
    category: 'istighfar',
    targetCount: 100,
    countLabel: '100× daily',
    title: 'I seek Allah’s forgiveness and repent to Him',
    titleAr: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    ar: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ.',
    transliteration: 'Astaghfirullāha wa atūbu ilayh.',
    en: 'I seek Allah’s forgiveness and I repent to Him.',
    virtue: 'The Prophet ﷺ said: "By Allah, I seek forgiveness from Allah and turn to Him in repentance more than seventy times a day."',
    source: 'Sahih al-Bukhari (6307)',
  },
  {
    id: 'is-la-ilaha-illa-anta',
    category: 'istighfar',
    targetCount: 33,
    countLabel: '33× or in distress',
    title: 'Dua of Prophet Yunus (Dhun-Nun) in the Whale',
    titleAr: 'دُعَاءُ ذِي النُّونِ عَلَيْهِ السَّلاَمُ',
    ar: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ.',
    transliteration: "Lā ilāha illā anta subḥānaka innī kuntu minaẓ-ẓālimīn.",
    en: 'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.',
    virtue: 'No Muslim supplication with this in any matter of grief or distress except that Allah relieves him.',
    source: 'Jami` at-Tirmidhi (3505) · Sahih',
  },

  // ── QURANIC DUAS ──
  {
    id: 'qr-rabbana-atina',
    category: 'quran',
    targetCount: 3,
    countLabel: '3× in every dua',
    title: 'Dua for the Good in This World and the Hereafter',
    titleAr: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً',
    ar: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ.',
    transliteration: 'Rabbanā ātinā fid-dunyā ḥasanatan wa fil-ākhirati ḥasanatan wa qinā ‘adhāban-nār.',
    en: 'Our Lord, give us in this world that which is good and in the Hereafter that which is good and protect us from the punishment of the Fire.',
    virtue: 'The most frequent supplication made by the Prophet Muhammad ﷺ.',
    source: 'Surah Al-Baqarah (2:201) · Sahih al-Bukhari (6389)',
  },
  {
    id: 'qr-rabbi-zidni',
    category: 'quran',
    targetCount: 3,
    countLabel: '3× when studying or reading',
    title: 'Supplication for Divine Increase in Beneficial Knowledge',
    titleAr: 'رَبِّ زِدْنِي عِلْمًا',
    ar: 'رَّبِّ زِدْنِي عِلْمًا.',
    transliteration: 'Rabbi zidnī ‘ilmā.',
    en: 'My Lord, increase me in knowledge.',
    virtue: 'The only thing Allah commanded His Prophet ﷺ to ask for an increase in.',
    source: 'Surah Taha (20:114)',
  },
  {
    id: 'qr-rabbishrahli',
    category: 'quran',
    targetCount: 1,
    countLabel: '1× before speech or action',
    title: 'Dua of Musa (Moses) for Eloquence and Relief of Hardship',
    titleAr: 'رَبِّ اشْرَحْ لِي صَدْرِي',
    ar: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي يَفْقَهُوا قَوْلِي.',
    transliteration: 'Rabbish-raḥ lī ṣadrī, wa yassir lī amrī, waḥlul ‘uqdatam-mil-lisānī, yafqahū qawlī.',
    en: 'My Lord, expand for me my breast [with assurance], ease for me my task, and untie the knot from my tongue that they may understand my speech.',
    virtue: 'Removes stuttering of anxiety and grants calmness and confidence.',
    source: 'Surah Taha (20:25–28)',
  },
];
