/**
 * situationsData.ts
 * Curated authentic prophetic supplications tailored to life situations, emotional states,
 * and daily dilemmas with Hadith citations and spiritual reflections.
 */

export type EmotionCategory =
  | 'anxiety'
  | 'sadness'
  | 'financial'
  | 'illness'
  | 'decision'
  | 'anger'
  | 'forgiveness'
  | 'protection'
  | 'gratitude'
  | 'knowledge';

export interface SituationalDua {
  id: string;
  category: EmotionCategory;
  emotionLabel: string;
  emotionEmoji: string;
  title: string;
  arabicText: string;
  transliteration: string;
  translation: string;
  context: string;
  hadithReference: string;
  virtue: string;
  actionTip: string;
  frequencies: number[];
}

export const EMOTION_TAGS: { key: EmotionCategory | 'all'; label: string; emoji: string }[] = [
  { key: 'all', label: 'All Situations', emoji: '✨' },
  { key: 'anxiety', label: 'Anxiety & Worry', emoji: '🌧️' },
  { key: 'sadness', label: 'Grief & Heartbreak', emoji: '💔' },
  { key: 'illness', label: 'Sickness & Pain', emoji: '🩺' },
  { key: 'financial', label: 'Debt & Provision', emoji: '💼' },
  { key: 'decision', label: 'Decisions & Istikhārah', emoji: '🧭' },
  { key: 'knowledge', label: 'Exams & Focus', emoji: '📚' },
  { key: 'protection', label: 'Fear & Evil Eye', emoji: '🛡️' },
  { key: 'forgiveness', label: 'Guilt & Repentance', emoji: '🕊️' },
  { key: 'anger', label: 'Anger & Frustration', emoji: '🔥' },
  { key: 'gratitude', label: 'Joy & Relief', emoji: '🤲' },
];

export const SITUATIONAL_DUAS: SituationalDua[] = [
  {
    id: 'anxiety-relief-1',
    category: 'anxiety',
    emotionLabel: 'Anxious & Overwhelmed',
    emotionEmoji: '🌧️',
    title: 'The Great Du‘ā Against Worry, Sorrow & Debt',
    arabicText: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الهَمِّ وَالحَزَنِ، وَالعَجْزِ وَالكَسَلِ، وَالبُخْلِ وَالجُبْنِ، وَضَلَعِ الدَّيْنِ، وَغَلَبَةِ الرِّجَالِ',
    transliteration: 'Allahumma inni a‘oodhu bika minal-hammi wal-hazan, wal-‘ajzi wal-kasal, wal-bukhli wal-jubn, wa dala‘id-dayni wa ghalabatir-rijal.',
    translation: 'O Allah, I seek refuge in You from grief and sorrow, from weakness and laziness, from miserliness and cowardice, from being overwhelmed by debt and overpowered by men.',
    context: 'The Prophet ﷺ taught this supplication to Abu Umamah when he found him sitting sorrowful and burdened in the mosque.',
    hadithReference: 'Sahih al-Bukhari 2893',
    virtue: 'Cures internal paralysis, lifts heavy depression, and breaks financial anxiety.',
    actionTip: 'Make wudu, sit facing Qiblah, and recite this du‘ā three times slowly whenever worry grips your chest.',
    frequencies: [261.63, 329.63, 392.0, 523.25],
  },
  {
    id: 'anxiety-relief-2',
    category: 'anxiety',
    emotionLabel: 'Distressed & Helpless',
    emotionEmoji: '🌧️',
    title: 'Supplication of the Distressed (Du‘ā al-Karb)',
    arabicText: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    transliteration: 'La ilaha illa Anta subhanaka inni kuntu minaz-zalimeen.',
    translation: 'There is no deity worthy of worship except You; exalted are You! Indeed, I have been of the wrongdoers.',
    context: 'The prayer of Prophet Yunus (Jonah) from inside the three layers of darkness: darkness of the belly of the whale, darkness of the deep ocean, and darkness of the night.',
    hadithReference: 'Surah Al-Anbiya 21:87 · Jami` at-Tirmidhi 3505',
    virtue: '“No Muslim ever supplication with this in any distress except that Allah relieves him.”',
    actionTip: 'Repeat this 40 times in sujud when facing a bottleneck where worldly solutions seem exhausted.',
    frequencies: [293.66, 369.99, 440.0, 587.33],
  },
  {
    id: 'sadness-heartbreak-1',
    category: 'sadness',
    emotionLabel: 'Grief & Loss',
    emotionEmoji: '💔',
    title: 'Supplication upon Loss or Calamity (Istirjā‘)',
    arabicText: 'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ، اللَّهُمَّ أْجُرْنِي فِي مُصِيبَتِي، وَأَخْلِفْ لِي خَيْرًا مِنْهَا',
    transliteration: 'Inna lillahi wa inna ilayhi raji‘oon. Allahumma’jurni fee museebati wa akhlif li khayran minha.',
    translation: 'Indeed to Allah we belong and to Him we shall return. O Allah, reward me in my affliction and replace it with something better for me.',
    context: 'Umm Salamah recited this when her beloved husband Abu Salamah passed away; Allah then granted her marriage to the Prophet Muhammad ﷺ.',
    hadithReference: 'Sahih Muslim 918',
    virtue: 'Guarantees divine reward for the trial and a replacement far superior to what was lost.',
    actionTip: 'Say this immediately upon receiving heartbreaking news, before grief causes you to utter regretful words.',
    frequencies: [220.0, 277.18, 329.63, 440.0],
  },
  {
    id: 'illness-healing-1',
    category: 'illness',
    emotionLabel: 'Physical Pain & Sickness',
    emotionEmoji: '🩺',
    title: 'Prophetic Ruqyah for Pain in the Body',
    arabicText: 'بِاسْمِ اللَّهِ (ثَلَاثًا) · أَعُوذُ بِاللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ (سَبْعًا)',
    transliteration: 'Bismillah (3 times) · A‘oodhu billahi wa qudratihi min sharri ma ajidu wa uhadhir (7 times).',
    translation: 'In the name of Allah (3×). I seek refuge in Allah and in His power from the evil of what I feel and what I fear (7×).',
    context: 'Prescribed by the Prophet ﷺ to ‘Uthman ibn Abi al-‘As when he complained of severe pain in his body since he accepted Islam.',
    hadithReference: 'Sahih Muslim 2202',
    virtue: 'Direct prophetic spiritual remedy for physical discomfort and bodily ailments.',
    actionTip: 'Place your right hand firmly over the spot where you feel pain, say Bismillah thrice, then recite the supplication 7 times.',
    frequencies: [329.63, 392.0, 493.88, 659.25],
  },
  {
    id: 'illness-visiting-2',
    category: 'illness',
    emotionLabel: 'Visiting the Sick',
    emotionEmoji: '🩺',
    title: 'Supplication for Healing (Shifā)',
    arabicText: 'أَسْأَلُ اللَّهَ العَظِيمَ رَبَّ العَرْشِ العَظِيمِ أَنْ يَشْفِيَكَ (سَبْعَ مَرَّاتٍ)',
    transliteration: 'As’alullahal-‘Azeema Rabbal-‘Arshil-‘Azeemi an yashfiyak (7 times).',
    translation: 'I ask Allah the Almighty, Lord of the Magnificent Throne, to cure you (7×).',
    context: 'Recited seven times when visiting any sick person who has not reached the final moments of death.',
    hadithReference: 'Sunan Abi Dawud 3106 · Sahih',
    virtue: '“No Muslim visits a sick person whose time has not yet come and says this seven times, except that Allah will heal him.”',
    actionTip: 'Hold the hand of the unwell person or sit by their head while uttering this with complete conviction in Allah’s cure.',
    frequencies: [349.23, 440.0, 523.25, 698.46],
  },
  {
    id: 'financial-debt-1',
    category: 'financial',
    emotionLabel: 'Burdened by Debt',
    emotionEmoji: '💼',
    title: 'Repayment of Mountain-Sized Debt',
    arabicText: 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ',
    transliteration: 'Allahummak-fini bi-halalika ‘an haramika, wa aghnini bi-fadlika ‘amman siwak.',
    translation: 'O Allah, suffice me with Your lawful provision away from what is unlawful, and enrich me by Your grace from needing anyone besides You.',
    context: '‘Ali (may Allah be pleased with him) taught this to a debtor who said: “Even if you owe a debt equal to Mount Seer, Allah will settle it for you.”',
    hadithReference: 'Jami` at-Tirmidhi 3563 · Hasan',
    virtue: 'Attracts halal income, opens closed business avenues, and frees the heart from financial dread.',
    actionTip: 'Recite this du‘ā after every obligatory prayer and during the last hour of Friday before Maghrib.',
    frequencies: [392.0, 493.88, 587.33, 783.99],
  },
  {
    id: 'decision-istikhara-1',
    category: 'decision',
    emotionLabel: 'Confused & Unsure',
    emotionEmoji: '🧭',
    title: 'Salāt al-Istikhārah (Divine Counsel)',
    arabicText: 'اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ، وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ العَظِيمِ، فَإِنَّكَ تَقْدِرُ وَلَا أَقْدِرُ، وَتَعْلَمُ وَلَا أَعْلَمُ، وَأَنْتَ عَلَّامُ الغُيُوبِ',
    transliteration: 'Allahumma inni astakheeruka bi-‘ilmika, wa astaqdiruka bi-qudratika, wa as’aluka min fadlikal-‘azeem, fa-innaka taqdiru wa la aqdir, wa ta‘lamu wa la a‘lam, wa Anta ‘Allamul-ghuyoob...',
    translation: 'O Allah, I seek Your counsel through Your knowledge, and I seek ability through Your power, and I ask You from Your immense bounty, for You possess power and I do not, and You know and I do not, and You are the Knower of the unseen...',
    context: 'The Prophet ﷺ used to teach his companions Istikharah for every matter just as he taught them a chapter of the Qur’an.',
    hadithReference: 'Sahih al-Bukhari 1162',
    virtue: 'Guarantees that whatever path opens up afterwards is the most blessed and beneficial for your faith, life, and future.',
    actionTip: 'Pray two voluntary units (rak‘ahs), recite this supplication mentioning your specific decision, then move forward with tranquility.',
    frequencies: [261.63, 311.13, 392.0, 523.25],
  },
  {
    id: 'knowledge-exams-1',
    category: 'knowledge',
    emotionLabel: 'Exam & Difficulty',
    emotionEmoji: '📚',
    title: 'Easing Difficulties & Freeing the Tongue',
    arabicText: 'رَبِّ اشْرَحْ لِي صَدْرِي · وَيَسِّرْ لِي أَمْرِي · وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي · يَفْقَهُوا قَوْلِي',
    transliteration: 'Rabbish-rah li sadri, wa yassir li amri, wahlul ‘uqdatam-mil-lisani, yafqahoo qawli.',
    translation: 'My Lord, expand for me my chest, and ease for me my task, and untie the knot from my tongue that they may understand my speech.',
    context: 'The prayer of Prophet Musa (Moses) when commanded to face Pharaoh, asking for clarity, composure, and eloquence.',
    hadithReference: 'Surah Ta-Ha 20:25-28',
    virtue: 'Removes nervous stuttering, grants serenity during tests and presentations, and clarifies thought.',
    actionTip: 'Recite this three times before sitting down for an exam, interview, or important conversation.',
    frequencies: [293.66, 349.23, 440.0, 587.33],
  },
  {
    id: 'knowledge-exams-2',
    category: 'knowledge',
    emotionLabel: 'When Something is Difficult',
    emotionEmoji: '📚',
    title: 'Making the Impossible Simple',
    arabicText: 'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا، وَأَنْتَ تَجْعَلُ الحَزْنَ إِذَا شِئْتَ سَهْلًا',
    transliteration: 'Allahumma la sahla illa ma ja‘altahu sahla, wa Anta taj‘alul-hazna idha shi’ta sahla.',
    translation: 'O Allah, there is no ease except that which You have made easy, and You can make difficulty, if You will, easy.',
    context: 'Authentic prophetic formula for confronting complicated intellectual or practical hurdles.',
    hadithReference: 'Sahih Ibn Hibban 974',
    virtue: 'Transforms tough challenges into manageable steps by seeking Allah’s enabling grace.',
    actionTip: 'Utter this whenever you open a difficult study chapter or face an obstacle at work.',
    frequencies: [329.63, 392.0, 493.88, 659.25],
  },
  {
    id: 'protection-fear-1',
    category: 'protection',
    emotionLabel: 'Fear of Harm & Evil',
    emotionEmoji: '🛡️',
    title: 'Impenetrable Shield in the Heavens & Earth',
    arabicText: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ العَلِيمُ (ثَلَاثًا)',
    transliteration: 'Bismillahil-ladhi la yadurru ma‘asmihi shay’un fil-ardi wa la fis-sama’i wa Huwas-Samee‘ul-‘Aleem (3 times).',
    translation: 'In the name of Allah, with whose name nothing in the earth nor in the heaven can cause harm, and He is the All-Hearing, the All-Knowing (3×).',
    context: 'Prescribed by the Prophet ﷺ to be said 3 times every morning and evening.',
    hadithReference: 'Sunan Abi Dawud 5088 · Sahih',
    virtue: '“Whoever says it three times in the morning and evening will not be harmed by anything that day.”',
    actionTip: 'Say this right before leaving the house or traveling.',
    frequencies: [349.23, 440.0, 523.25, 698.46],
  },
  {
    id: 'forgiveness-guilt-1',
    category: 'forgiveness',
    emotionLabel: 'Guilt & Heavy Sins',
    emotionEmoji: '🕊️',
    title: 'Supplication for Complete Pardon',
    arabicText: 'رَبِّ إِنِّي ظَلَمْتُ نَفْسِي فَاغْفِرْ لِي',
    transliteration: 'Rabbi inni zalamtu nafsi faghfir li.',
    translation: 'My Lord, indeed I have wronged myself, so forgive me.',
    context: 'The prayer of Prophet Musa after his mistake, and Allah immediately granted him full pardon.',
    hadithReference: 'Surah Al-Qasas 28:16',
    virtue: 'Acknowledges accountability without making excuses, bringing instant divine clemency.',
    actionTip: 'Follow every slip or transgression immediately with two rak‘ahs of Tawbah and this du‘ā.',
    frequencies: [261.63, 329.63, 392.0, 523.25],
  },
  {
    id: 'anger-frustration-1',
    category: 'anger',
    emotionLabel: 'Boiling Anger',
    emotionEmoji: '🔥',
    title: 'Extinguishing the Fire of Anger',
    arabicText: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
    transliteration: 'A‘oodhu billahi minash-shaytanir-rajeem.',
    translation: 'I seek refuge in Allah from Satan the outcast.',
    context: 'Two men argued in front of the Prophet ﷺ until one’s face turned red with rage. The Prophet ﷺ said: “I know a word which, if he says it, what he feels will go away.”',
    hadithReference: 'Sahih al-Bukhari 6115',
    virtue: 'Binds the instigator of malice and cools hot-tempered wrath immediately.',
    actionTip: 'When angry: seek refuge in Allah, sit down if standing (or lie down if sitting), stay silent, and perform wudu with cold water.',
    frequencies: [220.0, 277.18, 329.63, 440.0],
  },
  {
    id: 'gratitude-joy-1',
    category: 'gratitude',
    emotionLabel: 'Grateful & Victorious',
    emotionEmoji: '🤲',
    title: 'Supplication upon Receiving Good News or Relief',
    arabicText: 'الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ',
    transliteration: 'Alhamdu lillahil-ladhi bi-ni‘matihi tatimmus-salihat.',
    translation: 'All praise is due to Allah by whose blessing all good things are accomplished.',
    context: 'The Prophet ﷺ would recite this whenever something occurred that pleased him.',
    hadithReference: 'Sunan Ibn Majah 3803 · Sahih',
    virtue: 'Anchors the heart in humbleness and shields the blessing from vanishing (Zawal an-Ni‘mah).',
    actionTip: 'Prostrate in Sujud ash-Shukr (Prostration of Gratitude) and say this du‘ā when receiving wonderful news.',
    frequencies: [392.0, 493.88, 587.33, 783.99],
  },
];
