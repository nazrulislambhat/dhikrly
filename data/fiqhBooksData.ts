export type MadhhabKey = 'all' | 'hanafi' | 'shafii' | 'maliki' | 'hanbali' | 'comparative';
export type StudyLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';

export interface BuyLink {
  storeName: string;
  url: string;
  region?: string;
  format?: 'Hardcover' | 'Paperback' | 'Bilingual' | 'Multi-volume';
}

export interface FiqhBook {
  id: string;
  titleEnglish: string;
  titleArabic: string;
  author: string;
  authorArabic?: string;
  deathYearAH: number;
  deathYearCE: number;
  madhhab: 'Ḥanafī' | 'Shāfi‘ī' | 'Mālikī' | 'Ḥanbalī' | 'Comparative & Usūl';
  madhhabKey: MadhhabKey;
  level:
    | 'Beginner / Essentials'
    | 'Intermediate'
    | 'Intermediate to Advanced'
    | 'Advanced Reference';
  levelKey: StudyLevel;
  topics: string[];
  description: string;
  whyEssential: string;
  keyFeatures: string[];
  englishTranslation?: string;
  translator?: string;
  buyLinks: BuyLink[];
  freePdfAvailable?: boolean;
}

export const SUNNI_FIQH_BOOKS: FiqhBook[] = [
  // ─── ḤANAFĪ FIQH ───
  {
    id: 'nur-al-idah',
    titleEnglish: 'Nūr al-Īḍāḥ (The Light of Clarification)',
    titleArabic: 'نور الإيضاح ونجاة الأرواح',
    author: 'Imām Ḥasan ibn ‘Ammār ash-Shurunbulālī',
    authorArabic: 'حسن بن عمار الشرنبلالي الحنفي',
    deathYearAH: 1069,
    deathYearCE: 1659,
    madhhab: 'Ḥanafī',
    madhhabKey: 'hanafi',
    level: 'Beginner / Essentials',
    levelKey: 'beginner',
    topics: ['Tahārah (Purification)', 'Ṣalāh (Prayer)', 'Janā’iz (Funerals)', 'Sawm (Fasting)', 'Zakāh', 'Ḥajj'],
    description:
      'The premier classical primer of the Ḥanafī school of jurisprudence studied across the Muslim world. It systematically codifies personal obligations (Farḍ ‘Ayn) for worship with unmatched clarity and pedagogical elegance.',
    whyEssential:
      'Provides the definitive relied-upon (mu‘tamad) positions of the Ḥanafī school for daily worship, eliminating guesswork and doubt in purification and prayer.',
    keyFeatures: [
      'Covers all 5 pillars of ‘Ibādāt with clear conditions, integrals, and invalidators',
      'Preserves the soundest positions of Imām Abū Ḥanīfah and his two prime companions',
      'Over 400 years of unbroken pedagogical transmission in traditional madrasahs',
    ],
    englishTranslation: 'Nur al-Idah: The Light of Clarification',
    translator: 'Translated with commentary by Wesam Charkawi',
    buyLinks: [
      {
        storeName: 'Mecca Books',
        url: 'https://www.meccabooks.com/152-nur-al-idah-light-of-clarification-9780987096418.html',
        region: 'Worldwide',
        format: 'Bilingual',
      },
      {
        storeName: 'White Thread Press',
        url: 'https://www.whitethreadpress.com/publication/nur-al-idah/',
        region: 'UK / USA',
        format: 'Hardcover',
      },
      {
        storeName: 'Amazon',
        url: 'https://www.amazon.com/dp/0987096415',
        region: 'Global',
        format: 'Paperback',
      },
    ],
  },
  {
    id: 'mukhtasar-al-quduri',
    titleEnglish: 'Mukhtaṣar al-Qudūrī (The Compendium of Quduri)',
    titleArabic: 'مختصر القدوري في فقه الإمام الأعظم',
    author: 'Imām Abū al-Ḥasan Aḥmad al-Qudūrī',
    authorArabic: 'أبو الحسن أحمد بن محمد القدوري',
    deathYearAH: 428,
    deathYearCE: 1037,
    madhhab: 'Ḥanafī',
    madhhabKey: 'hanafi',
    level: 'Intermediate',
    levelKey: 'intermediate',
    topics: ['Worship (‘Ibādāt)', 'Commercial Law (Buyū‘)', 'Marriage & Family (Nikāḥ)', 'Inheritance (Farā’iḍ)', 'Judicial Ethics (Qaḍā)'],
    description:
      'Celebrated for a millennium as "The Book" (al-Kitāb) in Ḥanafī scholarship. Spanning over 12,000 legal rulings, it covers the complete expanse of Islamic private and public law.',
    whyEssential:
      'The foundational core of the Dars-e-Nizami syllabus. Memorizing and studying Quduri equips the student with the full terminology and legal architecture of Ḥanafī jurisprudence.',
    keyFeatures: [
      'Covers both devotional worship and complex financial and contractual ethics',
      'Written with razor-sharp legal precision without excessive dialectics',
      'Subject of dozens of celebrated classical commentaries like Al-Lubāb and Al-Jawharah',
    ],
    englishTranslation: 'The Mukhtasar of Al-Quduri: A Manual of Islamic Law',
    translator: 'Translated by Shaykh Muhammad Tahir Kiani',
    buyLinks: [
      {
        storeName: 'Ta-Ha Publishers',
        url: 'https://www.taha.co.uk/products/the-mukhtasar-of-al-quduri',
        region: 'UK / Europe',
        format: 'Hardcover',
      },
      {
        storeName: 'Mecca Books',
        url: 'https://www.meccabooks.com/488-the-mukhtasar-of-al-quduri-a-manual-of-islamic-law-according-to-the-hanafi-school-9781842001189.html',
        region: 'Worldwide',
        format: 'Hardcover',
      },
      {
        storeName: 'Amazon',
        url: 'https://www.amazon.com/dp/1842001183',
        region: 'Global',
        format: 'Hardcover',
      },
    ],
  },
  {
    id: 'ascent-to-felicity',
    titleEnglish: 'Marāqī al-Falāḥ / Ascent to Felicity',
    titleArabic: 'مراقي الفلاح بإمداد الفتاح شرح نور الإيضاح',
    author: 'Imām Ḥasan ibn ‘Ammār ash-Shurunbulālī',
    authorArabic: 'حسن بن عمار الشرنبلالي',
    deathYearAH: 1069,
    deathYearCE: 1659,
    madhhab: 'Ḥanafī',
    madhhabKey: 'hanafi',
    level: 'Intermediate',
    levelKey: 'intermediate',
    topics: ['Purification', 'Prayer Mechanics', 'Sunnah Etiquettes', 'Spiritual Evidences'],
    description:
      'The author’s own comprehensive commentary on Nur al-Idah, elaborating upon scriptural Hadith evidences, spiritual reasoning, and comparative nuances among early Ḥanafī masters.',
    whyEssential:
      'Faraz A. Khan’s lucid translation provides detailed footnotes elucidating contemporary applications, making classical jurisprudence immensely relatable.',
    keyFeatures: [
      'Bridges exact legal technicalities with inward presence of heart (Khushū‘)',
      'Explains why specific practices are recommended, disliked (Makrūh), or invalidating',
      'Beautiful contemporary typesetting by White Thread Press',
    ],
    englishTranslation: 'Ascent to Felicity (Maraqi ’l-Falah)',
    translator: 'Translated and annotated by Faraz A. Khan',
    buyLinks: [
      {
        storeName: 'White Thread Press',
        url: 'https://www.whitethreadpress.com/publication/ascent-to-felicity-maraqi-l-falah/',
        region: 'UK / USA',
        format: 'Paperback',
      },
      {
        storeName: 'Mecca Books',
        url: 'https://www.meccabooks.com/129-ascent-to-felicity-maraqi-l-falah-9781933764092.html',
        region: 'Worldwide',
        format: 'Paperback',
      },
      {
        storeName: 'Amazon',
        url: 'https://www.amazon.com/dp/1933764098',
        region: 'Global',
        format: 'Paperback',
      },
    ],
  },
  {
    id: 'al-hidayah',
    titleEnglish: 'Al-Hidāyah (The Guidance)',
    titleArabic: 'الهداية شرح بداية المبتدي',
    author: 'Imām Burhān al-Dīn ‘Alī al-Marghīnānī',
    authorArabic: 'برهان الدين علي بن أبي بكر المرغيناني',
    deathYearAH: 593,
    deathYearCE: 1197,
    madhhab: 'Ḥanafī',
    madhhabKey: 'hanafi',
    level: 'Advanced Reference',
    levelKey: 'advanced',
    topics: ['Full Legal Corpus', 'Comparative Evidence', 'Jurisprudential Deduction (Qiyās)', 'Legal Philosophy'],
    description:
      'The undisputed masterpiece and pinnacle of Ḥanafī legal literature. Blending Jam‘ bayna al-Uṣūl wa al-Furū‘, it demonstrates the deductive reasoning of the Ḥanafī school alongside opposing views.',
    whyEssential:
      'Studied at the highest tier of Islamic legal education worldwide. It trains the juristic mind in rigorous logic, textual analysis, and contextual adaptation.',
    keyFeatures: [
      'Detailed dialectical analysis between Abū Ḥanīfah, Imām ash-Shāfi‘ī, and Imām Mālik',
      'Encyclopedic depth relied upon by Muslim supreme courts for centuries',
      'Extensively annotated English translation with comparative analysis',
    ],
    englishTranslation: 'Al-Hidayah: The Guidance (Volumes 1 & 2)',
    translator: 'Translated by Dr. Imran Ahsan Khan Nyazee',
    buyLinks: [
      {
        storeName: 'Mecca Books',
        url: 'https://www.meccabooks.com/445-al-hidayah-the-guidance-volume-1-9780954054496.html',
        region: 'Worldwide',
        format: 'Multi-volume',
      },
      {
        storeName: 'Amazon',
        url: 'https://www.amazon.com/dp/0954054490',
        region: 'Global',
        format: 'Hardcover',
      },
    ],
  },

  // ─── SHĀFI‘Ī FIQH ───
  {
    id: 'safinat-an-najah',
    titleEnglish: 'Safīnat an-Najāh (The Ship of Salvation)',
    titleArabic: 'سفينة النجاة فيما يجب على العبد لمولاه',
    author: 'Shaykh Sālim ibn Sumayr al-Ḥaḍramī',
    authorArabic: 'سالم بن سمير الحضرمي الشافعي',
    deathYearAH: 1271,
    deathYearCE: 1854,
    madhhab: 'Shāfi‘ī',
    madhhabKey: 'shafii',
    level: 'Beginner / Essentials',
    levelKey: 'beginner',
    topics: ['Pillars of Faith & Islam', 'Ablution & Ghusl', 'Prayer Integrals & Conditions', 'Fasting Rules', 'Janāzah'],
    description:
      'The introductory textbook of choice across the Shāfi‘ī world (Yemen, East Africa, Egypt, Malaysia, Indonesia). Structured in numbered lists that are exceptionally easy to memorize and review.',
    whyEssential:
      'Covers what every believer is personally obligated to know about valid worship according to the verified Shāfi‘ī tradition in just a few dozen pages.',
    keyFeatures: [
      'Numbered lists of integrals (Arkān), conditions (Shurūṭ), and nullifiers (Mubṭilāt)',
      'Memorized by tens of thousands of students across traditional Ribāṭs and universities',
      'Accessible to children and adult beginners alike',
    ],
    englishTranslation: 'The Ship of Salvation (Safinat al-Naja)',
    translator: 'Translated by Ustadh Abdullah Salih al-Farsi',
    buyLinks: [
      {
        storeName: 'Mecca Books',
        url: 'https://www.meccabooks.com/1125-safinat-al-naja-the-ship-of-salvation-9780993516603.html',
        region: 'Worldwide',
        format: 'Paperback',
      },
      {
        storeName: 'Amazon',
        url: 'https://www.amazon.com/dp/0993516601',
        region: 'Global',
        format: 'Paperback',
      },
    ],
  },
  {
    id: 'matn-abi-shuja',
    titleEnglish: 'Matn Abī Shujā‘ (Al-Ghāyah wa al-Taqrīb)',
    titleArabic: 'متن أبي شجاع (غاية الاختصار ونهاية الإيجاز)',
    author: 'Imām Abū Shujā‘ Aḥmad ibn al-Ḥasan al-Iṣfahānī',
    authorArabic: 'أبو شجاع أحمد بن الحسين الإصفهاني',
    deathYearAH: 593,
    deathYearCE: 1197,
    madhhab: 'Shāfi‘ī',
    madhhabKey: 'shafii',
    level: 'Intermediate',
    levelKey: 'intermediate',
    topics: ['Full Shāfi‘ī Fiqh', 'Purity & Prayer', 'Trade & Finance', 'Marriage & Family', 'Penalties & Judiciary'],
    description:
      'The undisputed foundational standard curriculum text taught at Al-Azhar University and traditional seminaries for over 800 years. It summarizes the entire school in systematic order.',
    whyEssential:
      'Serves as the bridge between basic worship manuals and advanced multi-volume works. Famously commented upon in *Kifāyat al-Akhyār* and *Fatḥ al-Qarīb*.',
    keyFeatures: [
      'Comprehensive coverage of every major chapter of Islamic jurisprudence',
      'Unsurpassed categorizations that form the mental template for the Shāfi‘ī jurist',
      'Clear, accessible English translation with bilingual Arabic text',
    ],
    englishTranslation: 'The Accessible Conspectus: A Summary of Islamic Jurisprudence',
    translator: 'Translated by Musa Furber',
    buyLinks: [
      {
        storeName: 'Islamosaic',
        url: 'https://islamosaic.com/products/accessible-conspectus',
        region: 'Worldwide',
        format: 'Paperback',
      },
      {
        storeName: 'Mecca Books',
        url: 'https://www.meccabooks.com/1090-the-accessible-conspectus-a-summary-of-islamic-jurisprudence-9781944820015.html',
        region: 'Worldwide',
        format: 'Bilingual',
      },
      {
        storeName: 'Amazon',
        url: 'https://www.amazon.com/dp/1944820017',
        region: 'Global',
        format: 'Paperback',
      },
    ],
  },
  {
    id: 'reliance-of-the-traveller',
    titleEnglish: '‘Umdat al-Sālik (Reliance of the Traveller)',
    titleArabic: 'عمدة السالك وعدة الناسك',
    author: 'Imām Shihāb al-Dīn Aḥmad ibn an-Naqīb al-Miṣrī',
    authorArabic: 'شهاب الدين أحمد بن لؤلؤ بن النقيب المصري',
    deathYearAH: 769,
    deathYearCE: 1368,
    madhhab: 'Shāfi‘ī',
    madhhabKey: 'shafii',
    level: 'Intermediate to Advanced',
    levelKey: 'intermediate',
    topics: ['Complete Shāfi‘ī Sacred Law', 'Theology & Creed', 'Sufism & Heart Purity', 'Personal Status & Ethics'],
    description:
      'A complete, rigorously certified manual of Islamic Sacred Law. Bearing the official seal of approval of the Al-Azhar Islamic Research Academy, it is celebrated as the foremost English presentation of classical Sunni Fiqh.',
    whyEssential:
      'Beyond jurisprudence, it includes encyclopedic appendices on biographical notices, orthodox Sunni creed, spiritual etiquettes, and modern practical legal questions.',
    keyFeatures: [
      'Complete facing Arabic and English legal manual over 1,200 pages',
      'Includes relied-upon positions of Imām an-Nawawī and Imām ar-Rāfi‘ī',
      'The single most frequently cited classical Islamic law manual in Western academia and seminaries',
    ],
    englishTranslation: 'Reliance of the Traveller: The Classic Manual of Islamic Sacred Law',
    translator: 'Translated and edited by Shaykh Nuh Ha Mim Keller',
    buyLinks: [
      {
        storeName: 'Amana Publications',
        url: 'https://amana-publications.com/products/reliance-of-the-traveller',
        region: 'USA / Direct',
        format: 'Hardcover',
      },
      {
        storeName: 'Mecca Books',
        url: 'https://www.meccabooks.com/102-reliance-of-the-traveller-a-classic-manual-of-islamic-sacred-law-9780915957729.html',
        region: 'Worldwide',
        format: 'Hardcover',
      },
      {
        storeName: 'Amazon',
        url: 'https://www.amazon.com/dp/0915957728',
        region: 'Global',
        format: 'Hardcover',
      },
    ],
  },
  {
    id: 'minhaj-at-talibin',
    titleEnglish: 'Minhāj al-Ṭālibīn wa ‘Umdat al-Muftīn',
    titleArabic: 'منهاج الطالبين وعمدة المفتين',
    author: 'Imām Yaḥyā ibn Sharaf an-Nawawī',
    authorArabic: 'محيي الدين يحيى بن شرف النووي',
    deathYearAH: 676,
    deathYearCE: 1277,
    madhhab: 'Shāfi‘ī',
    madhhabKey: 'shafii',
    level: 'Advanced Reference',
    levelKey: 'advanced',
    topics: ['Decisive Fatwa Mu‘tamad', 'Full Law Corpus', 'Comparative Intra-Madhhab Positions'],
    description:
      'The ultimate arbiter of the Shāfi‘ī school. Written by the reviver of the school, Imām an-Nawawī, to establish the singular soundest fatwa position across all chapters of law.',
    whyEssential:
      'Any serious researcher of Shāfi‘ī Fiqh must reference the Minhaj; it is the basis of monumental commentaries like Tuhfat al-Muhtaj and Nihayat al-Muhtaj.',
    keyFeatures: [
      'Establishes the precise legal grading hierarchy of Shāfi‘ī opinions',
      'Classic translation preserving historical legal terminology',
      'Essential reference for researchers and advanced students',
    ],
    englishTranslation: 'Minhaj et Talibin: A Manual of Muhammadan Law According to the School of Shafii',
    translator: 'Translated by E.C. Howard',
    buyLinks: [
      {
        storeName: 'Mecca Books',
        url: 'https://www.meccabooks.com/2165-minhaj-et-talibin-a-manual-of-muhammadan-law-according-to-the-school-of-shafii-9789675062223.html',
        region: 'Worldwide',
        format: 'Hardcover',
      },
      {
        storeName: 'Amazon',
        url: 'https://www.amazon.com/dp/9675062226',
        region: 'Global',
        format: 'Hardcover',
      },
    ],
  },

  // ─── MĀLIKĪ FIQH ───
  {
    id: 'al-murshid-al-muin',
    titleEnglish: 'Al-Murshid al-Mu‘īn (The Guiding Helper)',
    titleArabic: 'المرشد المعين على الضروري من علوم الدين',
    author: 'Imām ‘Abd al-Wāḥid ibn ‘Āshir al-Fāsī',
    authorArabic: 'عبد الواحد بن عاشر الفاسي',
    deathYearAH: 1040,
    deathYearCE: 1631,
    madhhab: 'Mālikī',
    madhhabKey: 'maliki',
    level: 'Beginner / Essentials',
    levelKey: 'beginner',
    topics: ['Ash‘arī Creed', 'Mālikī Worship (Purity, Prayer, Zakat, Fasting, Hajj)', 'Tazkiyah & Sufism of Junayd'],
    description:
      'The foundational didactic poem (Manẓūmah) forming the educational spine of North and West Africa, Andalusia, and Morocco. Synthesizes Creed, Law, and Spiritual Purification in accordance with the Hadith of Jibril.',
    whyEssential:
      'Mastering Ibn ‘Āshir provides the student with an integrated understanding of the outer obligations of law and the inner states of spiritual sincerity.',
    keyFeatures: [
      'Composed in rhyming verses designed for easy memorization and recitation',
      'Clear, unadulterated presentation of traditional North African Mālikī jurisprudence',
      'Includes extensive commentaries in English explaining practical daily cases',
    ],
    englishTranslation: 'The Guiding Helper: Main Text and Explanatory Notes',
    translator: 'Translated with notes by Asadullah Yate',
    buyLinks: [
      {
        storeName: 'Diwan Press',
        url: 'https://diwanpress.com/product/the-guiding-helper/',
        region: 'UK / Europe',
        format: 'Paperback',
      },
      {
        storeName: 'Mecca Books',
        url: 'https://www.meccabooks.com/1319-the-guiding-helper-main-text-and-explanatory-notes-9781908892348.html',
        region: 'Worldwide',
        format: 'Paperback',
      },
      {
        storeName: 'Amazon',
        url: 'https://www.amazon.com/dp/1908892340',
        region: 'Global',
        format: 'Paperback',
      },
    ],
  },
  {
    id: 'al-risalah-qayrawani',
    titleEnglish: 'Al-Risālah (The Treatise of Ibn Abi Zayd)',
    titleArabic: 'رسالة ابن أبي زيد القيرواني',
    author: 'Imām Abū Muḥammad ‘Abd Allāh ibn Abī Zayd al-Qayrawānī',
    authorArabic: 'عبد الله بن أبي زيد القيرواني (مالك الصغير)',
    deathYearAH: 386,
    deathYearCE: 996,
    madhhab: 'Mālikī',
    madhhabKey: 'maliki',
    level: 'Intermediate',
    levelKey: 'intermediate',
    topics: ['Orthodox Sunni Creed', 'Worship Rituals', 'Transactions & Commercial Ethics', 'Marriage, Divorce & Family', 'Islamic Social Adab'],
    description:
      'Written by the scholar known as "Younger Mālik" (Mālik al-Ṣaghīr) over 1,000 years ago in Kairouan, Tunisia. It has remained the standard comprehensive textbook of the school from Mauritania to Cairo.',
    whyEssential:
      'Opens with a profoundly moving statement of Sunni ‘Aqīdah, followed by a complete manual of practical living and sacred law.',
    keyFeatures: [
      'One of the oldest surviving comprehensive Sunni law compendiums',
      'Beautiful English translations available from traditional publishers',
      'Covers practical modern situations alongside classical rulings',
    ],
    englishTranslation: 'The Risala: A Treatise on Maliki Fiqh',
    translator: 'Translated by Aisha Bewley',
    buyLinks: [
      {
        storeName: 'Diwan Press',
        url: 'https://diwanpress.com/product/the-risala/',
        region: 'UK / Europe',
        format: 'Paperback',
      },
      {
        storeName: 'Mecca Books',
        url: 'https://www.meccabooks.com/1770-the-risala-a-treatise-on-maliki-fiqh-9781908892607.html',
        region: 'Worldwide',
        format: 'Paperback',
      },
      {
        storeName: 'Amazon',
        url: 'https://www.amazon.com/dp/190889260X',
        region: 'Global',
        format: 'Paperback',
      },
    ],
  },
  {
    id: 'al-muwatta-malik',
    titleEnglish: 'Al-Muwaṭṭa’ (The Well-Trodden Path)',
    titleArabic: 'موطأ الإمام مالك بن أنس',
    author: 'Imām of the Abode of Emigration Mālik ibn Anas',
    authorArabic: 'مالك بن أنس إمام دار الهجرة',
    deathYearAH: 179,
    deathYearCE: 795,
    madhhab: 'Mālikī',
    madhhabKey: 'maliki',
    level: 'Advanced Reference',
    levelKey: 'advanced',
    topics: ['Early Madīnah Practice (‘Amal)', 'Authentic Prophetic Hadith', 'Foundational Legal Verdicts', 'Sahabah Consensus'],
    description:
      'The earliest existing record of the living Sunnah and judicial verdicts of the Prophet ﷺ and his companions. Imam ash-Shafi‘i remarked: "There is no book on earth after the Book of Allah more sound than Malik’s Muwatta."',
    whyEssential:
      'Provides direct access to the living practice of the Prophet’s city (Madīnah al-Munawwarah) and the bedrock upon which Islamic jurisprudence was built.',
    keyFeatures: [
      'The foundational Hadith-Fiqh synthesis in Islamic intellectual history',
      'Narrated through the legendary Golden Chain (Mālik from Nāfi‘ from Ibn ‘Umar)',
      'Rich bilingual translations with comprehensive commentary',
    ],
    englishTranslation: 'Al-Muwatta of Imam Malik ibn Anas',
    translator: 'Translated by Aisha Bewley (Diwan Press)',
    buyLinks: [
      {
        storeName: 'Diwan Press',
        url: 'https://diwanpress.com/product/al-muwatta-of-imam-malik-ibn-anas/',
        region: 'UK / Europe',
        format: 'Hardcover',
      },
      {
        storeName: 'Mecca Books',
        url: 'https://www.meccabooks.com/645-al-muwatta-of-imam-malik-9781908892430.html',
        region: 'Worldwide',
        format: 'Hardcover',
      },
      {
        storeName: 'Amazon',
        url: 'https://www.amazon.com/dp/190889243X',
        region: 'Global',
        format: 'Hardcover',
      },
    ],
  },

  // ─── ḤANBALĪ FIQH ───
  {
    id: 'bidayat-al-abid',
    titleEnglish: 'Bidāyat al-‘Ābid (The Beginning of the Worshipper)',
    titleArabic: 'بداية العابد وكفاية الزاهد في الفقه على مذهب الإمام أحمد',
    author: 'Imām ‘Abd al-Raḥmān ibn ‘Abd Allāh al-Ba‘lī',
    authorArabic: 'عبد الرحمن بن عبد الله البعلي الحنبلي',
    deathYearAH: 1192,
    deathYearCE: 1778,
    madhhab: 'Ḥanbalī',
    madhhabKey: 'hanbali',
    level: 'Beginner / Essentials',
    levelKey: 'beginner',
    topics: ['Purification (Tahārah)', 'Prayer (Ṣalāh)', 'Funerals (Janā’iz)', 'Zakāh', 'Fasting (Ṣiyām)', 'Pilgrimage (Ḥajj)'],
    description:
      'The ideal premier text for anyone embarking on the study of Ḥanbalī jurisprudence. Extracted from the larger work *Kashshāf al-Qinā‘*, it delivers the soundest (mu‘tamad) ruling on every issue concisely.',
    whyEssential:
      'Avoids confusing divergences, enabling the beginner to establish their personal worship firmly upon the relied-upon position of Imām Aḥmad ibn Ḥanbal.',
    keyFeatures: [
      'Focused strictly on acts of worship (‘Ibādāt) needed by every Muslim daily',
      'Modern bilingual English edition with diagrammatic outlines and glossary',
      'Authored by a renowned Damascene Ḥanbalī jurist and Hadith scholar',
    ],
    englishTranslation: 'The Beginning of the Worshipper (Bidayat al-Abid)',
    translator: 'Translated with commentary by Shaykh Joe Bradford & Musa Furber',
    buyLinks: [
      {
        storeName: 'Islamosaic',
        url: 'https://islamosaic.com/products/bidayat-al-abid',
        region: 'Worldwide',
        format: 'Bilingual',
      },
      {
        storeName: 'Mecca Books',
        url: 'https://www.meccabooks.com/2091-the-beginning-of-the-worshipper-bidayat-al-abid-9781944820787.html',
        region: 'Worldwide',
        format: 'Paperback',
      },
      {
        storeName: 'Amazon',
        url: 'https://www.amazon.com/dp/1944820785',
        region: 'Global',
        format: 'Paperback',
      },
    ],
  },
  {
    id: 'umdat-al-fiqh',
    titleEnglish: '‘Umdat al-Fiqh (The Reliable Primer of Jurisprudence)',
    titleArabic: 'عمدة الفقه في المذهب الحنبلي',
    author: 'Imām Muwaffaq al-Dīn Ibn Qudāmah al-Maqdisī',
    authorArabic: 'موفق الدين عبد الله بن قدامة المقدسي',
    deathYearAH: 620,
    deathYearCE: 1223,
    madhhab: 'Ḥanbalī',
    madhhabKey: 'hanbali',
    level: 'Intermediate',
    levelKey: 'intermediate',
    topics: ['Complete Fiqh of Imām Aḥmad', 'Single-Position Rulings (Qawl Wāḥid)', 'Evidential Foundations'],
    description:
      'The first tier in Ibn Qudāmah’s four-stage curriculum (Umdah -> Muqni‘ -> Kāfī -> Mughnī). It is distinguished by stating only one relied-upon position per issue without overwhelming variations.',
    whyEssential:
      'Ibn Qudāmah is the supreme compiler of the Ḥanbalī school. This text introduces students to complete legal chapters in a structured, accessible format.',
    keyFeatures: [
      'Covers both worship and commercial/social transactions',
      'Supplies scriptural Qur’anic and Hadith proofs for core rulings',
      'Contemporary English translations with comprehensive pedagogical notes',
    ],
    englishTranslation: 'Umdat al-Fiqh: A General Treatise on Islamic Jurisprudence',
    translator: 'Translated by Dr. Hatem al-Haj',
    buyLinks: [
      {
        storeName: 'Mecca Books',
        url: 'https://www.meccabooks.com/1779-umdat-al-fiqh-a-general-treatise-on-islamic-jurisprudence-9781842001394.html',
        region: 'Worldwide',
        format: 'Hardcover',
      },
      {
        storeName: 'Darussalam',
        url: 'https://darussalam.com',
        region: 'Worldwide',
        format: 'Hardcover',
      },
      {
        storeName: 'Amazon',
        url: 'https://www.amazon.com/dp/1842001396',
        region: 'Global',
        format: 'Hardcover',
      },
    ],
  },
  {
    id: 'zad-al-mustaqni',
    titleEnglish: 'Zād al-Mustaqni‘ fī Ikhtiṣār al-Muqni‘',
    titleArabic: 'زاد المستقنع في اختصار المقنع',
    author: 'Imām Sharaf al-Dīn Mūsā al-Ḥajjāwī al-Maqdisī',
    authorArabic: 'شرف الدين موسى بن أحمد الحجاوي',
    deathYearAH: 968,
    deathYearCE: 1560,
    madhhab: 'Ḥanbalī',
    madhhabKey: 'hanbali',
    level: 'Intermediate to Advanced',
    levelKey: 'intermediate',
    topics: ['Exhaustive Ḥanbalī Rulings', 'Mu‘tamad Fatwa Reference', 'Dense Juristic Aphorisms'],
    description:
      'The most celebrated and memorized text of the late Ḥanbalī school across the Arabian Peninsula. Condensed from Ibn Qudāmah’s *Al-Muqni‘*, it contains over 3,000 explicit rulings and thousands more derived implicitly.',
    whyEssential:
      'The subject of Shaykh Muḥammad ibn ‘Uthaymīn’s monumental 15-volume commentary *Al-Sharḥ al-Mumti‘*. Memorizing Zād was historically considered the qualification of a Ḥanbalī jurist.',
    keyFeatures: [
      'Extraordinary density: every phrase packs critical conditions and exemptions',
      'The foundation of Islamic university curricula in Makkah, Madinah, and Riyadh',
      'Widely referenced across contemporary international Islamic fatwa councils',
    ],
    buyLinks: [
      {
        storeName: 'Darussalam',
        url: 'https://darussalam.com',
        region: 'Worldwide',
        format: 'Hardcover',
      },
      {
        storeName: 'Jarir Bookstore',
        url: 'https://www.jarir.com',
        region: 'Middle East',
        format: 'Hardcover',
      },
      {
        storeName: 'Amazon',
        url: 'https://www.amazon.com',
        region: 'Global',
        format: 'Hardcover',
      },
    ],
  },

  // ─── FOUNDATIONS, USŪL AL-FIQH & COMPARATIVE ───
  {
    id: 'al-waraqat',
    titleEnglish: 'Al-Waraqāt (The Leaflets on Legal Theory)',
    titleArabic: 'الورقات في أصول الفقه',
    author: 'Imām al-Ḥaramayn Abū al-Ma‘ālī al-Juwaynī',
    authorArabic: 'إمام الحرمين أبو المعالي عبد الملك الجويني',
    deathYearAH: 478,
    deathYearCE: 1085,
    madhhab: 'Comparative & Usūl',
    madhhabKey: 'comparative',
    level: 'Beginner / Essentials',
    levelKey: 'beginner',
    topics: ['Principles of Jurisprudence (Uṣūl)', 'Commands & Prohibitions', 'General vs Specific Texts', 'Qiyās (Analogy)', 'Ijmā‘ (Consensus)', 'Conditions of Ijtihād'],
    description:
      'The universally accepted introductory portal into Uṣūl al-Fiqh across all four Sunni madhhabs for over 900 years. It defines how jurists derive practical rulings from sacred Revelation.',
    whyEssential:
      'Studying Fiqh without Usūl leaves one unable to understand how scholars reach verdicts. Al-Waraqāt demystifies legal deduction in a brief, digestible tract.',
    keyFeatures: [
      'Accessible to any student without requiring prior background in advanced logic',
      'Neutral, cross-madhhab consensus definitions of fundamental terms',
      'Includes contemporary English translation with illustrative modern examples',
    ],
    englishTranslation: 'Al-Waraqat in Usul al-Fiqh',
    translator: 'Translated and commented by Musa Furber',
    buyLinks: [
      {
        storeName: 'Mecca Books',
        url: 'https://www.meccabooks.com/1296-al-waraqat-in-usul-al-fiqh-9781944820404.html',
        region: 'Worldwide',
        format: 'Bilingual',
      },
      {
        storeName: 'Amazon',
        url: 'https://www.amazon.com/dp/1944820408',
        region: 'Global',
        format: 'Paperback',
      },
    ],
  },
  {
    id: 'bidayat-al-mujtahid',
    titleEnglish: 'Bidāyat al-Mujtahid (The Distinguished Jurist’s Primer)',
    titleArabic: 'بداية المجتهد ونهاية المقتصد',
    author: 'Qāḍī Abū al-Walīd Muḥammad Ibn Rushd (Averroes)',
    authorArabic: 'القاضي أبو الوليد محمد بن أحمد بن رشد القرطبي',
    deathYearAH: 595,
    deathYearCE: 1198,
    madhhab: 'Comparative & Usūl',
    madhhabKey: 'comparative',
    level: 'Advanced Reference',
    levelKey: 'advanced',
    topics: ['Comparative Sunni Fiqh', 'Reasons for Differences (Asbāb al-Ikhtilāf)', 'Hadith Evaluation', 'Linguistic Divergence'],
    description:
      'The premier classical comparative jurisprudence treatise. Rather than merely stating rulings, Ibn Rushd explains the profound Hadith and hermeneutic reasons behind the divergent opinions of the 4 Imāms.',
    whyEssential:
      'Fosters deep respect, tolerance, and understanding of the breadth of the orthodox Sunni tradition (*Adab al-Ikhtilāf*), curing narrow-minded fanaticism.',
    keyFeatures: [
      'Published in a magnificent two-volume English set by the Center for Muslim Contribution to Civilization',
      'Examines the grammatical and hadith principles causing scholars to arrive at different conclusions',
      'Indispensable for jurists, academics, and serious seekers of knowledge',
    ],
    englishTranslation: 'The Distinguished Jurist’s Primer (Bidayat al-Mujtahid, 2 Volumes)',
    translator: 'Translated by Dr. Imran Ahsan Khan Nyazee',
    buyLinks: [
      {
        storeName: 'Mecca Books',
        url: 'https://www.meccabooks.com/469-the-distinguished-jurist-s-primer-2-vol-set-9781859641385.html',
        region: 'Worldwide',
        format: 'Multi-volume',
      },
      {
        storeName: 'Garnet Publishing',
        url: 'https://www.garnetpublishing.co.uk/product/bidayat-al-mujtahid/',
        region: 'UK / Europe',
        format: 'Hardcover',
      },
      {
        storeName: 'Amazon',
        url: 'https://www.amazon.com/dp/1859641385',
        region: 'Global',
        format: 'Multi-volume',
      },
    ],
  },
  {
    id: 'al-fiqh-al-muyassar',
    titleEnglish: 'Al-Fiqh al-Muyassar (Simplified Contemporary Fiqh)',
    titleArabic: 'الفقه الميسر في ضوء الكتاب والسنة',
    author: 'Committee of Senior Sunni Jurists & Academics',
    authorArabic: 'نخبة من العلماء والفقهاء المعاصرين',
    deathYearAH: 1425,
    deathYearCE: 2004,
    madhhab: 'Comparative & Usūl',
    madhhabKey: 'comparative',
    level: 'Beginner / Essentials',
    levelKey: 'beginner',
    topics: ['Direct Qur’an & Sunnah Proofs', 'Devotional Worship', 'Financial Transactions', 'Marriage & Family Life'],
    description:
      'A widely circulated, accessible contemporary compilation that presents daily Islamic jurisprudence with straightforward evidence from the Qur’an and authentic Hadith in uncomplicated modern Arabic and English.',
    whyEssential:
      'Perfect for readers looking for quick, authentic answers to day-to-day worship questions without navigating dense medieval grammatical prose.',
    keyFeatures: [
      'Straightforward formatting with bullet points and clear chapter divisions',
      'Provides direct Hadith references for every stated rule',
      'Available in numerous translations worldwide',
    ],
    englishTranslation: 'Al-Fiqh Al-Muyassar: Simplified Jurisprudence',
    buyLinks: [
      {
        storeName: 'Darussalam',
        url: 'https://darussalam.com',
        region: 'Worldwide',
        format: 'Hardcover',
      },
      {
        storeName: 'Amazon',
        url: 'https://www.amazon.com',
        region: 'Global',
        format: 'Hardcover',
      },
    ],
  },
];
