export type HalalStatus = 'halal' | 'mushbooh' | 'haram';

export interface AdditiveInfo {
  code: string;
  name: string;
  status: HalalStatus;
  category: string;
  source: string;
  reason: string;
}

export const COMMON_ADDITIVES: Record<string, AdditiveInfo> = {
  // Common Haram additives
  e120: {
    code: 'E120',
    name: 'Carmine / Cochineal / Carminic Acid',
    status: 'haram',
    category: 'Coloring',
    source: 'Crushed female cochineal insects',
    reason: 'Derived from insects/bugs; prohibited in majority of Sunni jurisprudence (Hanafi, Shafi’i, Hanbali).',
  },
  e441: {
    code: 'E441',
    name: 'Gelatin',
    status: 'mushbooh',
    category: 'Gelling agent / Emulsifier',
    source: 'Collagen from animal skins and bones (porcine/pork or bovine/beef)',
    reason: 'Haram if derived from pork or non-dhabihah cattle. Only Halal if certified 100% plant/fish or Halal-dhabihah bovine.',
  },
  e542: {
    code: 'E542',
    name: 'Bone Phosphate (Edible Bone Phosphate)',
    status: 'mushbooh',
    category: 'Anti-caking agent',
    source: 'Bones of slaughtered animals (cattle/pork)',
    reason: 'Prohibited if derived from non-dhabihah animals or porcine bones.',
  },
  e904: {
    code: 'E904',
    name: 'Shellac',
    status: 'mushbooh',
    category: 'Glazing agent',
    source: 'Resinous secretion of the female lac bug (Kerria lacca)',
    reason: 'Insect secretion. Some scholars deem it permissible as it is an exudate, while others consider it doubtful (Mushbooh).',
  },
  e920: {
    code: 'E920',
    name: 'L-Cysteine',
    status: 'mushbooh',
    category: 'Flour treatment agent',
    source: 'Human hair, duck feathers, or synthetic',
    reason: 'Haram if derived from human hair or non-halal animal hair; Halal if synthetic or microbial.',
  },
  e921: {
    code: 'E921',
    name: 'L-Cysteine Hydrochloride',
    status: 'mushbooh',
    category: 'Flour treatment agent',
    source: 'Animal/human hair or synthetic',
    reason: 'Same ruling as E920.',
  },
  e100: {
    code: 'E100',
    name: 'Curcumin (Turmeric)',
    status: 'halal',
    category: 'Coloring',
    source: 'Plant (Turmeric root)',
    reason: '100% plant-derived natural yellow spice color.',
  },
  e101: {
    code: 'E101',
    name: 'Riboflavin (Vitamin B2)',
    status: 'halal',
    category: 'Coloring / Vitamin',
    source: 'Microbial fermentation or synthetic',
    reason: 'Typically produced via bacterial yeast fermentation.',
  },
  e150a: {
    code: 'E150a',
    name: 'Plain Caramel',
    status: 'halal',
    category: 'Coloring',
    source: 'Controlled heating of carbohydrates (sugar/corn)',
    reason: 'Pure plant sugar caramelization.',
  },
  e160a: {
    code: 'E160a',
    name: 'Carotenes (Alpha, Beta, Gamma)',
    status: 'halal',
    category: 'Coloring',
    source: 'Carrots, palm oil, or algae',
    reason: '100% vegetable/plant origin.',
  },
  e162: {
    code: 'E162',
    name: 'Beetroot Red (Betanin)',
    status: 'halal',
    category: 'Coloring',
    source: 'Red beets',
    reason: 'Pure natural plant extract.',
  },
  e170: {
    code: 'E170',
    name: 'Calcium Carbonate',
    status: 'halal',
    category: 'Coloring / Acidity regulator',
    source: 'Mineral (chalk, limestone)',
    reason: 'Natural mineral origin.',
  },
  e200: {
    code: 'E200',
    name: 'Sorbic Acid',
    status: 'halal',
    category: 'Preservative',
    source: 'Berries of rowan tree or synthetic',
    reason: 'Plant or synthetic organic acid.',
  },
  e202: {
    code: 'E202',
    name: 'Potassium Sorbate',
    status: 'halal',
    category: 'Preservative',
    source: 'Synthetic salt of sorbic acid',
    reason: 'Safe synthetic chemical preservative.',
  },
  e211: {
    code: 'E211',
    name: 'Sodium Benzoate',
    status: 'halal',
    category: 'Preservative',
    source: 'Synthetic benzoic acid salt',
    reason: 'Permissible synthetic preservative.',
  },
  e300: {
    code: 'E300',
    name: 'Ascorbic Acid (Vitamin C)',
    status: 'halal',
    category: 'Antioxidant',
    source: 'Citrus fruit or corn glucose fermentation',
    reason: 'Plant / microbial source.',
  },
  e322: {
    code: 'E322',
    name: 'Lecithins (Soy / Sunflower / Egg)',
    status: 'halal',
    category: 'Emulsifier',
    source: 'Soybeans, sunflower seeds, or egg yolks',
    reason: 'Generally derived from soy or sunflower oil; 100% Halal unless explicitly animal-fat based.',
  },
  e330: {
    code: 'E330',
    name: 'Citric Acid',
    status: 'halal',
    category: 'Acidity regulator',
    source: 'Fermentation of molasses or citrus',
    reason: 'Plant-derived organic acid.',
  },
  e406: {
    code: 'E406',
    name: 'Agar-Agar',
    status: 'halal',
    category: 'Gelling agent',
    source: 'Red seaweed / marine algae',
    reason: '100% plant/algae vegetarian gelatin substitute.',
  },
  e407: {
    code: 'E407',
    name: 'Carrageenan',
    status: 'halal',
    category: 'Thickener / Gelling agent',
    source: 'Edible red seaweeds',
    reason: '100% plant/marine origin.',
  },
  e410: {
    code: 'E410',
    name: 'Locust Bean Gum (Carob Gum)',
    status: 'halal',
    category: 'Thickener',
    source: 'Carob tree seeds',
    reason: 'Natural plant seed gum.',
  },
  e412: {
    code: 'E412',
    name: 'Guar Gum',
    status: 'halal',
    category: 'Thickener',
    source: 'Guar beans (cyamopsis tetragonoloba)',
    reason: 'Natural vegetable legume gum.',
  },
  e415: {
    code: 'E415',
    name: 'Xanthan Gum',
    status: 'halal',
    category: 'Thickener / Stabilizer',
    source: 'Bacterial fermentation of corn sugar',
    reason: 'Microbial fermentation; completely Halal.',
  },
  e422: {
    code: 'E422',
    name: 'Glycerol / Glycerin',
    status: 'mushbooh',
    category: 'Humectant / Sweetener',
    source: 'Vegetable oils (palm/soy) or animal tallow (pork/beef)',
    reason: 'Mushbooh unless explicitly labeled as "Vegetable Glycerin" or Halal certified.',
  },
  e471: {
    code: 'E471',
    name: 'Mono- and Diglycerides of Fatty Acids',
    status: 'mushbooh',
    category: 'Emulsifier',
    source: 'Plant oils (palm) or animal fat (pork tallow, beef lard)',
    reason: 'Most common doubtful emulsifier in baked goods. Halal only if plant-based.',
  },
  e472a: {
    code: 'E472a',
    name: 'Acetic Acid Esters of Mono- and Diglycerides',
    status: 'mushbooh',
    category: 'Emulsifier',
    source: 'Plant or animal fats',
    reason: 'May contain animal fats unless plant source specified.',
  },
  e472b: {
    code: 'E472b',
    name: 'Lactic Acid Esters of Mono- and Diglycerides',
    status: 'mushbooh',
    category: 'Emulsifier',
    source: 'Plant or animal fats',
    reason: 'Mushbooh unless vegetable origin confirmed.',
  },
  e472e: {
    code: 'E472e',
    name: 'DATEM (Diacetyl Tartaric Acid Esters)',
    status: 'mushbooh',
    category: 'Emulsifier / Bread dough conditioner',
    source: 'Vegetable or animal fats',
    reason: 'Common in commercial breads. Verify vegetable origin.',
  },
  e476: {
    code: 'E476',
    name: 'Polyglycerol Polyricinoleate (PGPR)',
    status: 'mushbooh',
    category: 'Emulsifier in chocolates',
    source: 'Castor beans & glycerol (which may be animal or plant)',
    reason: 'Mushbooh due to the glycerol component.',
  },
  e481: {
    code: 'E481',
    name: 'Sodium Stearoyl-2-Lactylate',
    status: 'mushbooh',
    category: 'Emulsifier / Dough strengthener',
    source: 'Stearic acid (vegetable palm or animal tallow)',
    reason: 'Mushbooh unless certified plant-derived.',
  },
  e621: {
    code: 'E621',
    name: 'Monosodium Glutamate (MSG)',
    status: 'halal',
    category: 'Flavor enhancer',
    source: 'Bacterial fermentation of sugar beet/cane or corn',
    reason: 'Vegetable / microbial fermentation origin.',
  },
  e631: {
    code: 'E631',
    name: 'Disodium Inosinate',
    status: 'mushbooh',
    category: 'Flavor enhancer',
    source: 'Fermented tapioca or meat/fish extracts',
    reason: 'May be sourced from meat extracts unless plant-derived or fish-derived.',
  },
  e635: {
    code: 'E635',
    name: 'Disodium 5′-Ribonucleotides',
    status: 'mushbooh',
    category: 'Flavor enhancer in chips & noodles',
    source: 'Mixture of E627 & E631 (possibly meat extracts)',
    reason: 'Often used with MSG; mushbooh unless verified vegan or halal certified.',
  },
  e901: {
    code: 'E901',
    name: 'Beeswax (White & Yellow)',
    status: 'halal',
    category: 'Glazing agent',
    source: 'Honey bee comb secretion',
    reason: 'Pure natural insect excretion permitted by Islamic consensus.',
  },
  e903: {
    code: 'E903',
    name: 'Carnauba Wax',
    status: 'halal',
    category: 'Glazing agent',
    source: 'Leaves of Copernicia prunifera palm tree',
    reason: '100% plant origin.',
  },
  pepsin: {
    code: 'PEPSIN',
    name: 'Pepsin Enzyme',
    status: 'mushbooh',
    category: 'Enzyme',
    source: 'Stomachs of pigs or calves',
    reason: 'Commercial pepsin is predominantly extracted from porcine stomach mucosa (Haram).',
  },
  rennet: {
    code: 'RENNET',
    name: 'Animal Rennet',
    status: 'mushbooh',
    category: 'Cheese enzyme',
    source: 'Stomachs of unweaned calves',
    reason: 'Permissible if microbial or vegetarian rennet; doubtful if animal rennet from non-dhabihah calves.',
  },
  cochineal: {
    code: 'COCHINEAL',
    name: 'Cochineal Extract',
    status: 'haram',
    category: 'Coloring',
    source: 'Insects',
    reason: 'Derived from insects (same as E120 Carmine).',
  },
  pork: {
    code: 'PORK',
    name: 'Pork / Swine Fat / Lard / Ham / Bacon',
    status: 'haram',
    category: 'Meat / Animal fat',
    source: 'Swine (Pork)',
    reason: 'Explicitly prohibited in the Holy Qur’an (Surah Al-Baqarah 2:173).',
  },
  alcohol: {
    code: 'ALCOHOL',
    name: 'Ethyl Alcohol / Wine / Liqueur / Spirits',
    status: 'haram',
    category: 'Beverage / Solvent',
    source: 'Fermented intoxicants',
    reason: 'Prohibited intoxicants in foods; small traces in natural vanilla extract have scholarly differences, but added wines/spirits are strictly Haram.',
  },
};

export function lookupAdditive(query: string): AdditiveInfo | undefined {
  const clean = query.trim().toLowerCase().replace(/[\s\-_]/g, '');
  if (!clean) return undefined;

  // Direct match e.g. "e120"
  if (COMMON_ADDITIVES[clean]) return COMMON_ADDITIVES[clean];

  // Try matching with "e" prefix e.g. "120" -> "e120"
  if (/^\d+[a-z]?$/.test(clean) && COMMON_ADDITIVES[`e${clean}`]) {
    return COMMON_ADDITIVES[`e${clean}`];
  }

  // Name match search
  for (const item of Object.values(COMMON_ADDITIVES)) {
    const itemClean = item.name.toLowerCase();
    if (itemClean.includes(clean) || clean.includes(itemClean)) {
      return item;
    }
  }

  return undefined;
}

export interface AnalyzedProduct {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  ingredientsText?: string;
  flaggedAdditives: AdditiveInfo[];
  overallStatus: HalalStatus;
  statusSummary: string;
}

export async function analyzeProductByBarcode(barcode: string): Promise<AnalyzedProduct> {
  const cleanBarcode = barcode.trim();
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OpenFoodFacts request failed (${response.status})`);
  }

  const json = await response.json();
  if (json.status !== 1 || !json.product) {
    throw new Error('Product not found in international database.');
  }

  const p = json.product;
  const productName = p.product_name || p.product_name_en || 'Unknown Product';
  const brand = p.brands || '';
  const imageUrl = p.image_front_small_url || p.image_url;
  const ingredientsText: string = p.ingredients_text || p.ingredients_text_en || '';
  const additivesOriginalTags: string[] = p.additives_original_tags || p.additives_tags || [];

  const flagged: AdditiveInfo[] = [];
  const foundCodes = new Set<string>();

  // 1. Check tagged additives
  for (const tag of additivesOriginalTags) {
    const code = tag.replace(/^en:/, '').toLowerCase();
    const info = lookupAdditive(code);
    if (info && !foundCodes.has(info.code)) {
      flagged.push(info);
      foundCodes.add(info.code);
    }
  }

  // 2. Scan ingredients text for keywords
  const lowerIngredients = ingredientsText.toLowerCase();
  for (const [key, info] of Object.entries(COMMON_ADDITIVES)) {
    if (!foundCodes.has(info.code)) {
      const searchTerms = [
        info.code.toLowerCase(),
        ...info.name.toLowerCase().split('/'),
      ].map((s) => s.trim());

      for (const term of searchTerms) {
        if (term.length > 2 && lowerIngredients.includes(term)) {
          flagged.push(info);
          foundCodes.add(info.code);
          break;
        }
      }
    }
  }

  // 3. Determine overall status
  let overallStatus: HalalStatus = 'halal';
  let statusSummary = 'No doubtful or prohibited additives detected in ingredients list.';

  const hasHaram = flagged.some((f) => f.status === 'haram');
  const hasMushbooh = flagged.some((f) => f.status === 'mushbooh');

  if (hasHaram) {
    overallStatus = 'haram';
    const haramItems = flagged.filter((f) => f.status === 'haram').map((f) => f.name).join(', ');
    statusSummary = `Contains Haram / prohibited ingredient(s): ${haramItems}`;
  } else if (hasMushbooh) {
    overallStatus = 'mushbooh';
    const mushboohItems = flagged.filter((f) => f.status === 'mushbooh').map((f) => f.name).join(', ');
    statusSummary = `Contains doubtful (Mushbooh) ingredient(s): ${mushboohItems}. Verify Halal certification.`;
  }

  return {
    barcode: cleanBarcode,
    name: productName,
    brand,
    imageUrl,
    ingredientsText,
    flaggedAdditives: flagged,
    overallStatus,
    statusSummary,
  };
}
