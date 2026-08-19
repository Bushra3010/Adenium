/**
 * Development / demo seed.
 *
 * Loads a representative catalog so the storefront can be reviewed with real
 * content rather than placeholders. Product copy and horticultural data follow
 * PRD §7.3. The client replaces this with their own catalog via the CSV import
 * (ADM-04) before launch.
 */
import { PrismaClient, type AppliesTo, type ProductType } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const img = (slug: string, n = 1) => `/img/ph/${slug}-${n}.svg`;

// ── Attribute registry (PRD §7.3) ────────────────────────────────
const ATTRIBUTES: {
  key: string;
  label: string;
  unit?: string;
  appliesTo: AppliesTo;
  filterable: boolean;
}[] = [
  // Seeds
  { key: 'germination_days', label: 'Germination time', unit: 'days', appliesTo: 'SEED', filterable: false },
  { key: 'germination_difficulty', label: 'Germination difficulty', appliesTo: 'SEED', filterable: true },
  { key: 'ideal_temp', label: 'Ideal temperature', unit: '°C', appliesTo: 'SEED', filterable: false },
  { key: 'light_hours', label: 'Light requirement', unit: 'hrs/day', appliesTo: 'SEED', filterable: false },
  { key: 'sowing_depth', label: 'Sowing depth', appliesTo: 'SEED', filterable: false },
  { key: 'sowing_season', label: 'Best sowing season', appliesTo: 'SEED', filterable: true },
  { key: 'hybrid_status', label: 'Hybrid status', appliesTo: 'SEED', filterable: true },
  // Plants
  { key: 'current_height', label: 'Current height', appliesTo: 'PLANT', filterable: false },
  { key: 'pot_supplied', label: 'Supplied in', appliesTo: 'PLANT', filterable: false },
  { key: 'watering', label: 'Watering', appliesTo: 'PLANT', filterable: false },
  { key: 'maturity', label: 'Plant age', appliesTo: 'PLANT', filterable: false },
  { key: 'caudex_size', label: 'Caudex size', appliesTo: 'PLANT', filterable: false },
  // Both
  { key: 'flower_colour', label: 'Flower colour', appliesTo: 'BOTH', filterable: true },
  { key: 'light', label: 'Light', appliesTo: 'BOTH', filterable: true },
  { key: 'growth_pattern', label: 'Growth pattern', appliesTo: 'BOTH', filterable: false },
  { key: 'placement', label: 'Ideal placement', appliesTo: 'BOTH', filterable: true },
  { key: 'difficulty', label: 'Care difficulty', appliesTo: 'BOTH', filterable: true },
  { key: 'origin', label: 'Origin', appliesTo: 'BOTH', filterable: false },
];

const OPTION_TYPES: { key: string; label: string; appliesTo: AppliesTo; values: string[] }[] = [
  { key: 'pack_size', label: 'Pack size', appliesTo: 'SEED', values: ['10 seeds', '25 seeds', '50 seeds', '100 seeds'] },
  { key: 'pot_size', label: 'Pot size', appliesTo: 'PLANT', values: ['4 inch', '5 inch', '6 inch', '8 inch'] },
  { key: 'height', label: 'Plant height', appliesTo: 'PLANT', values: ['10–15 cm', '15–25 cm', '25–40 cm', '40–60 cm'] },
];

const CATEGORIES: { name: string; slug: string; type: ProductType; description: string; children: { name: string; slug: string; description: string }[] }[] = [
  {
    name: 'Seeds', slug: 'seeds', type: 'SEED',
    description: 'Fresh, viable seed with tested germination rates — sown by collectors and nurseries across India.',
    children: [
      { name: 'Adenium Seeds', slug: 'adenium-seeds', description: 'Desert rose seed, including arabicum and obesum hybrids selected for caudex form.' },
      { name: 'Cactus Seeds', slug: 'cactus-seeds', description: 'Slow, rewarding sowings — astrophytum, mammillaria and columnar species.' },
      { name: 'Succulent Seeds', slug: 'succulent-seeds', description: 'Caudex and euphorbia seed for growers who want to raise plants from scratch.' },
      { name: 'Flowering Seeds', slug: 'flowering-seeds', description: 'Seasonal flowering varieties suited to Indian balconies and terraces.' },
    ],
  },
  {
    name: 'Plants', slug: 'plants', type: 'PLANT',
    description: 'Established, nursery-grown plants despatched in their pots with the soil they are used to.',
    children: [
      { name: 'Adenium & Caudex', slug: 'adenium-caudex', description: 'Swollen-stemmed plants grown for their caudex — the trait that makes them bonsai subjects.' },
      { name: 'Cacti', slug: 'cacti', description: 'Globular, columnar and rare grafted cacti from our collection.' },
      { name: 'Succulents', slug: 'succulents', description: 'Euphorbias, aloes and asclepiads that thrive on neglect.' },
      { name: 'Foliage & Flowering', slug: 'foliage-flowering', description: 'Green companions for the windowsill that ask for a little more water.' },
    ],
  },
];

type SeedProduct = {
  type: ProductType;
  name: string;
  botanicalName?: string;
  slug: string;
  sku: string;
  category: string;
  shortDescription: string;
  description: string;
  careGuide: string;
  featured?: boolean;
  tags: string[];
  attributes: Record<string, string>;
  faqs?: { question: string; answer: string }[];
  variants: { options: Record<string, string>; price: number; compareAt?: number; stock: number; weightG: number }[];
};

const PRODUCTS: SeedProduct[] = [
  {
    type: 'SEED',
    name: 'Adenium Arabicum — Thai Socotranum Seeds',
    botanicalName: 'Adenium arabicum',
    slug: 'adenium-arabicum-thai-socotranum-seeds',
    sku: 'ADN-S-ARB-TS',
    category: 'adenium-seeds',
    featured: true,
    shortDescription: 'Fat-based arabicum seed selected for a broad, sculptural caudex — the classic bonsai desert rose.',
    description:
      'Adenium arabicum is the species growers reach for when the caudex matters more than the flower. Sown from fresh seed it develops a squat, swollen base within two seasons, branching low and thickening steadily — the form most often trained as a desert rose bonsai.\n\nThis is Thai Socotranum stock, a selection prized for an unusually wide base and short internodes. Seedlings show variation, which is part of the appeal: no two caudices develop the same shoulders, and growers typically raise a batch and select the best forms after the second repot.\n\nSeed is harvested fresh and despatched within the current season. Viability drops sharply with age, so sow soon after arrival rather than storing.',
    careGuide:
      '## Sowing\n\nSoak seed in lukewarm water for 2–4 hours before sowing — long enough to soften the coat, not long enough to drown the embryo. Sow flat on a fast-draining mix (equal parts coarse sand, perlite and sieved cocopeat), then cover with 5 mm of the same mix.\n\nKeep the tray at 25–32 °C. Warmth is the single biggest factor in germination rate; below 20 °C germination stalls and seed rots. In most of India a shaded terrace in March–June needs no bottom heat.\n\n## Germination\n\nExpect the first radicles in 5–7 days, with the batch finishing by day 15. Mist to keep the surface just damp — never wet. Once cotyledons open, move to bright light immediately; seedlings held in shade stretch and never recover a compact base.\n\n## First year\n\nPrick out into individual 3-inch pots when the first pair of true leaves appears. Water only when the mix is dry through. Feed fortnightly at quarter strength from the second month.\n\n## Building the caudex\n\nThe caudex thickens fastest in full sun with a generous pot and unrestricted water during active growth. Lift and root-prune at the end of the second season, replanting slightly higher each time so the shoulders sit proud of the soil — this is what produces the flared, bonsai-like base.\n\nIf you wire branches, wind loosely. Adenium bark scars easily and marks left by tight wire stay for years.',
    tags: ['bonsai', 'caudex', 'collector'],
    attributes: {
      germination_days: '5–15 days',
      germination_difficulty: 'Easy',
      ideal_temp: '25–32 °C',
      light_hours: '5–7 hrs bright light',
      sowing_depth: '5 mm',
      sowing_season: 'March – June',
      hybrid_status: 'Open pollinated',
      flower_colour: 'Pink',
      light: 'Full sun',
      growth_pattern: 'Upright, low-branching',
      placement: 'Outdoor',
      difficulty: 'Easy',
      origin: 'India',
    },
    faqs: [
      { question: 'Why do collectors prefer arabicum over obesum?', answer: 'Arabicum builds a wider, lower caudex and branches closer to the base, which is the form most people want for bonsai. Obesum flowers more freely but stays comparatively slim.' },
      { question: 'Will every seedling look the same?', answer: 'No. Open-pollinated arabicum shows real variation in caudex shape and shoulder width. Growers usually raise ten or more and select the best two or three.' },
    ],
    variants: [
      { options: { pack_size: '10 seeds' }, price: 199, stock: 40, weightG: 20 },
      { options: { pack_size: '25 seeds' }, price: 420, compareAt: 498, stock: 25, weightG: 30 },
      { options: { pack_size: '50 seeds' }, price: 750, compareAt: 995, stock: 14, weightG: 45 },
      { options: { pack_size: '100 seeds' }, price: 1300, compareAt: 1990, stock: 6, weightG: 80 },
    ],
  },
  {
    type: 'SEED',
    name: 'Adenium Obesum Mixed Hybrid Seeds',
    botanicalName: 'Adenium obesum',
    slug: 'adenium-obesum-mixed-hybrid-seeds',
    sku: 'ADN-S-OBS-MIX',
    category: 'adenium-seeds',
    featured: true,
    shortDescription: 'A mixed hybrid lot for flower colour — singles, doubles and picotees from Thai breeding stock.',
    description:
      'Adenium obesum is the desert rose most people meet first: quick to flower, generous through the warm months, and forgiving of a beginner\'s watering can. This is a mixed hybrid lot drawn from Thai breeding stock, so the batch throws singles, doubles and picotee edges across the pink–red–white range.\n\nSeedlings typically flower in their second year, occasionally in the first if given heat and an open position. Because the lot is mixed, colour cannot be selected in advance — growers raise the batch and keep the ones they like.',
    careGuide:
      '## Sowing\n\nSoak for 2–4 hours, then sow flat on a gritty, fast-draining mix and cover lightly. Hold at 25–32 °C in bright, indirect light.\n\n## Germination\n\nMost seed moves in 5–10 days. Keep the surface barely damp; obesum seedlings damp off quickly if the mix stays saturated. Give direct morning sun as soon as the cotyledons open.\n\n## Growing on\n\nPot individually at the second pair of true leaves. Use a terracotta pot if you tend to overwater — the porous wall buys you a margin the plant will use.\n\nWater only when the mix has dried through. In the monsoon, shift under cover: standing wet at the collar is the commonest way to lose an adenium.\n\n## Flowering\n\nFeed a low-nitrogen, higher-potassium feed fortnightly from the second season to push flower rather than leaf. Expect first flowers in year two, and a heavier flush each year after as the caudex fills out.\n\n## Dormancy\n\nGrowth slows below about 15 °C. Cut water right back through the cool months and resume only when new growth appears — watering a dormant plant is what rots the caudex.',
    tags: ['beginner-friendly', 'flowering'],
    attributes: {
      germination_days: '5–10 days',
      germination_difficulty: 'Easy',
      ideal_temp: '25–32 °C',
      light_hours: '5–6 hrs bright light',
      sowing_depth: '5 mm',
      sowing_season: 'February – July',
      hybrid_status: 'Hybrid (mixed)',
      flower_colour: 'Mixed',
      light: 'Full sun',
      growth_pattern: 'Upright',
      placement: 'Outdoor',
      difficulty: 'Easy',
      origin: 'Thailand',
    },
    faqs: [
      { question: 'Can I choose the flower colour?', answer: 'Not in a mixed lot — that is what makes it affordable. If you need a specific colour, buy an established grafted plant instead of seed.' },
      { question: 'How soon will they flower?', answer: 'Usually the second season. Heat, direct sun and a potassium-led feed bring it forward; shade and heavy nitrogen push it back.' },
    ],
    variants: [
      { options: { pack_size: '10 seeds' }, price: 149, stock: 60, weightG: 20 },
      { options: { pack_size: '25 seeds' }, price: 320, stock: 32, weightG: 30 },
      { options: { pack_size: '50 seeds' }, price: 580, compareAt: 745, stock: 18, weightG: 45 },
      { options: { pack_size: '100 seeds' }, price: 999, compareAt: 1490, stock: 9, weightG: 80 },
    ],
  },
  {
    type: 'SEED',
    name: 'Astrophytum Mixed Cactus Seeds',
    botanicalName: 'Astrophytum spp.',
    slug: 'astrophytum-mixed-cactus-seeds',
    sku: 'ADN-S-AST-MIX',
    category: 'cactus-seeds',
    shortDescription: 'Star cactus seed — asterias, myriostigma and capricorne in one lot. Slow, and worth it.',
    description:
      'Astrophytum is where most cactus growers get properly hooked. The genus is geometric to the point of looking manufactured — ribbed stars flecked with white trichome scales — and it raises easily from seed if you can be patient.\n\nThis lot mixes asterias, myriostigma and capricorne. Germination is fast; everything after that is slow. Expect a marble-sized plant at eighteen months and first flowers around year three or four.',
    careGuide:
      '## Sowing\n\nUse the sealed-container method. Fill small pots with a sterile mineral mix, water thoroughly, scatter seed on the surface — do not cover, astrophytum needs light to germinate — and seal the pot inside a clear bag or box.\n\nHold at 22–28 °C in bright shade. Direct sun through a sealed bag will cook the seedlings.\n\n## Germination\n\nMost seed moves in 3–10 days. Leave the container sealed for six to eight weeks; the humidity is doing the work. Open gradually over a fortnight rather than all at once.\n\n## First two years\n\nSeedlings stay tiny for a long time. Keep them slightly damp through the first year — unlike adult cacti, seedlings should not dry out completely. Prick out at 12–18 months into a gritty mix.\n\n## Adult care\n\nFull sun with some midday shade in peak summer. Water thoroughly, then not again until the mix is bone dry. Keep completely dry below 10 °C.',
    tags: ['collector', 'rare'],
    attributes: {
      germination_days: '3–10 days',
      germination_difficulty: 'Medium',
      ideal_temp: '22–28 °C',
      light_hours: '4–6 hrs bright shade',
      sowing_depth: 'Surface sown',
      sowing_season: 'February – September',
      hybrid_status: 'Open pollinated',
      flower_colour: 'Yellow',
      light: 'Bright indirect',
      growth_pattern: 'Globular',
      placement: 'Outdoor / bright window',
      difficulty: 'Medium',
      origin: 'Mexico',
    },
    variants: [
      { options: { pack_size: '25 seeds' }, price: 260, stock: 22, weightG: 15 },
      { options: { pack_size: '50 seeds' }, price: 470, compareAt: 520, stock: 15, weightG: 20 },
      { options: { pack_size: '100 seeds' }, price: 850, compareAt: 1040, stock: 7, weightG: 30 },
    ],
  },
  {
    type: 'SEED',
    name: 'Euphorbia Obesa Seeds',
    botanicalName: 'Euphorbia obesa',
    slug: 'euphorbia-obesa-seeds',
    sku: 'ADN-S-EUP-OBS',
    category: 'succulent-seeds',
    shortDescription: 'The baseball plant — a near-perfect sphere, and one of the tidiest succulents to raise from seed.',
    description:
      'Euphorbia obesa grows as an almost geometrically perfect sphere, banded in soft green and purple, with no spines and no offsets. It is dioecious, so a flowering pair is needed for viable seed — which is why seed-grown plants command what they do.\n\nSeedlings are unmistakable within weeks. Growth is slow and steady; a five-year plant sits comfortably in a four-inch pot.',
    careGuide:
      '## Sowing\n\nSow fresh on a sterile mineral mix and cover with a whisper of fine grit. Hold at 24–30 °C with high humidity for the first fortnight.\n\n## Germination\n\nFast — often 4–8 days. Ventilate progressively once most seed is up.\n\n## Growing on\n\nBright light, but not scorching afternoon sun in the first year. Water sparingly and always from below if you can; water sitting in the apex causes rot.\n\nKeep dry and cool through winter. Euphorbia obesa asks for very little and resents attention.\n\n## Handling\n\nThe milky sap is a skin and eye irritant. Wash after repotting and keep it away from the face.',
    tags: ['collector', 'rare'],
    attributes: {
      germination_days: '4–8 days',
      germination_difficulty: 'Medium',
      ideal_temp: '24–30 °C',
      light_hours: '4–6 hrs bright light',
      sowing_depth: 'Barely covered',
      sowing_season: 'March – August',
      hybrid_status: 'Open pollinated',
      flower_colour: 'Green-yellow',
      light: 'Bright indirect',
      growth_pattern: 'Spherical',
      placement: 'Bright window',
      difficulty: 'Medium',
      origin: 'South Africa',
    },
    variants: [
      { options: { pack_size: '10 seeds' }, price: 240, stock: 18, weightG: 10 },
      { options: { pack_size: '25 seeds' }, price: 520, compareAt: 600, stock: 8, weightG: 15 },
    ],
  },
  {
    type: 'PLANT',
    name: 'Adenium Obesum — Grafted Desert Rose',
    botanicalName: 'Adenium obesum',
    slug: 'adenium-obesum-grafted-desert-rose',
    sku: 'ADN-P-OBS-GR',
    category: 'adenium-caudex',
    featured: true,
    shortDescription: 'A named-colour grafted plant on a seedling rootstock — flowers true, and flowers soon.',
    description:
      'Grafting is how you get a predictable flower on a caudex that was raised from seed. The rootstock supplies vigour and the swollen base; the scion supplies a known colour that will not vary the way a seedling does.\n\nThese are established plants with a healed graft union and an active head, despatched in the pot they were grown in. The caudex is already visible above soil level and will broaden season on season.\n\nEach plant is individually selected — the photograph shows the grade, not the exact specimen, since no two caudices are alike.',
    careGuide:
      '## Position\n\nAs much direct sun as you can give it. Four hours is a minimum; six or more produces a compact plant with a heavy flush. Indoors behind glass is rarely enough on its own.\n\n## Watering\n\nDrench, then let the mix dry through completely before the next water. In peak summer that may be every second day; in the monsoon it may be once a fortnight. Judge by the mix, never by the calendar.\n\nMove under cover during prolonged rain. Standing wet at the collar is the single commonest cause of loss.\n\n## Feeding\n\nFortnightly through the growing season with a balanced feed, shifting to a higher-potassium formulation once buds appear.\n\n## Pruning and the graft\n\nPrune after a flowering flush to keep the head compact; each cut typically returns two or three branches. Remove any shoot that appears below the graft union promptly — rootstock growth will overtake the scion if left.\n\n## Repotting\n\nEvery second or third year in late spring. Root-prune lightly and replant a little higher each time to expose more of the caudex.',
    tags: ['flowering', 'bonsai'],
    attributes: {
      current_height: '25–40 cm',
      pot_supplied: 'Nursery pot',
      watering: 'When mix is dry through',
      maturity: '2–3 years',
      caudex_size: '5–8 cm across',
      flower_colour: 'Red / pink (grade dependent)',
      light: 'Full sun',
      growth_pattern: 'Branching head on swollen base',
      placement: 'Outdoor',
      difficulty: 'Easy',
      origin: 'India (nursery grown)',
    },
    faqs: [
      { question: 'Will it arrive in flower?', answer: 'Not necessarily. Plants are despatched in whatever state the season dictates, and buds are often removed before transit so the plant puts its energy into recovering.' },
      { question: 'What does grafted mean for care?', answer: 'Only one thing extra: remove shoots that appear below the graft union. Everything else is ordinary adenium care.' },
    ],
    variants: [
      { options: { pot_size: '5 inch', height: '15–25 cm' }, price: 649, stock: 8, weightG: 900 },
      { options: { pot_size: '6 inch', height: '25–40 cm' }, price: 949, compareAt: 1150, stock: 5, weightG: 1400 },
      { options: { pot_size: '8 inch', height: '40–60 cm' }, price: 1650, compareAt: 1950, stock: 2, weightG: 2600 },
    ],
  },
  {
    type: 'PLANT',
    name: 'Adenium Arabicum — Caudex Bonsai',
    botanicalName: 'Adenium arabicum',
    slug: 'adenium-arabicum-caudex-bonsai',
    sku: 'ADN-P-ARB-BON',
    category: 'adenium-caudex',
    featured: true,
    shortDescription: 'Seed-raised arabicum with a broad, shouldered base — already reading as a bonsai subject.',
    description:
      'Seed-raised arabicum, grown on for three seasons and lifted twice to build the shoulders. The base is wide relative to the head, which is exactly what you want before starting any serious branch work.\n\nThese are individually grown plants and the caudex form varies between specimens — that variation is the point. Larger grades have been root-pruned and replanted proud, so the flare sits above the soil line and continues to broaden.',
    careGuide:
      '## Position\n\nFull sun. Arabicum is more sun-hungry than obesum and sulks in shade — internodes stretch and the base stops thickening.\n\n## Watering\n\nGenerous through active growth, nothing at all when dormant. The plant will drop its leaves as temperatures fall; that is normal and the cue to stop watering almost entirely until new growth appears.\n\n## Building the form\n\nThe caudex broadens fastest when the plant is allowed to grow unchecked in a generous pot with plenty of water and sun. Restricting it early makes for a small plant, not a better one.\n\nLift at the end of the season, prune the roots back to the main shoulders, and replant slightly higher. Repeat annually for the first few years — this is what produces the flared, buttressed base.\n\n## Wiring\n\nWind loosely and check monthly. Adenium bark marks easily and wire scars persist for years. Many growers skip wire entirely and shape by directional pruning instead.\n\n## Handling\n\nSap is a mild irritant. Wash hands after pruning.',
    tags: ['bonsai', 'caudex', 'collector'],
    attributes: {
      current_height: '20–35 cm',
      pot_supplied: 'Nursery pot',
      watering: 'Generous in growth, dry in dormancy',
      maturity: '3 years',
      caudex_size: '8–14 cm across',
      flower_colour: 'Pale pink',
      light: 'Full sun',
      growth_pattern: 'Squat, low-branching',
      placement: 'Outdoor',
      difficulty: 'Easy',
      origin: 'India (nursery grown)',
    },
    variants: [
      { options: { pot_size: '6 inch', height: '15–25 cm' }, price: 1250, stock: 6, weightG: 1600 },
      { options: { pot_size: '8 inch', height: '25–40 cm' }, price: 2100, compareAt: 2500, stock: 3, weightG: 2900 },
    ],
  },
  {
    type: 'PLANT',
    name: 'Astrophytum Asterias — Sand Dollar Cactus',
    botanicalName: 'Astrophytum asterias',
    slug: 'astrophytum-asterias-sand-dollar-cactus',
    sku: 'ADN-P-AST-AST',
    category: 'cacti',
    shortDescription: 'A spineless, eight-ribbed disc flecked with white — the tidiest cactus on any shelf.',
    description:
      'Astrophytum asterias grows as a flattened, spineless disc divided into eight clean ribs, the surface dusted with white trichome flecks. It is one of the few cacti that genuinely suits a desk: no spines, no offsets, no mess.\n\nPlants offered here are seed-grown, three to four years old, and already showing the ribbed geometry that makes the species collectable. Flowers are yellow with a red throat and open in the warm months.',
    careGuide:
      '## Light\n\nBright light with shade through the fiercest part of summer afternoons. Full unfiltered sun scorches the flat upper surface, and the marks do not grow out.\n\n## Watering\n\nDrench thoroughly, then wait until the mix is completely dry. Water into the mix, not over the plant — moisture sitting in the ribs invites rot.\n\nKeep entirely dry from November to February.\n\n## Mix\n\nAt least half mineral. Pumice, coarse sand or crushed granite with a little sieved compost. A standard potting mix holds far too much water for this species.\n\n## Feeding\n\nA weak low-nitrogen cactus feed once a month through the growing season. Overfeeding produces a swollen, split body.\n\n## Watch for\n\nMealybug in the ribs and at the root collar. Check when repotting.',
    tags: ['collector', 'rare', 'beginner-friendly'],
    attributes: {
      current_height: '4–7 cm across',
      pot_supplied: 'Plastic nursery pot',
      watering: 'Sparingly; dry out fully between',
      maturity: '3–4 years',
      flower_colour: 'Yellow with red throat',
      light: 'Bright indirect',
      growth_pattern: 'Flattened globular',
      placement: 'Bright window',
      difficulty: 'Medium',
      origin: 'India (nursery grown)',
    },
    variants: [
      { options: { pot_size: '4 inch', height: '10–15 cm' }, price: 780, stock: 7, weightG: 500 },
      { options: { pot_size: '5 inch', height: '10–15 cm' }, price: 1150, compareAt: 1300, stock: 3, weightG: 750 },
    ],
  },
  {
    type: 'PLANT',
    name: 'Euphorbia Obesa — Baseball Plant',
    botanicalName: 'Euphorbia obesa',
    slug: 'euphorbia-obesa-baseball-plant',
    sku: 'ADN-P-EUP-OBS',
    category: 'succulents',
    shortDescription: 'A banded green sphere with no spines and no fuss — slow-grown, four years on.',
    description:
      'Grown from seed over four seasons into a firm, evenly banded sphere. Euphorbia obesa produces no spines and no offsets: what you see is the whole plant, and it will simply get larger and slightly more columnar with age.\n\nThe species is dioecious, so a single plant will not set seed. Ours are sold unsexed.',
    careGuide:
      '## Light\n\nBright, with protection from the harshest summer sun. Too little light and the neat banding stretches into something taller and duller.\n\n## Watering\n\nSparingly, and always let the mix dry completely first. Water from below where possible — moisture pooling in the apex is the usual cause of rot in this species.\n\nKeep bone dry through winter and below 10 °C.\n\n## Mix and pot\n\nHeavily mineral, in a pot barely larger than the plant. Obesa resents a big wet pot more than it resents drought.\n\n## Handling\n\nThe white sap is a serious eye irritant and will blister sensitive skin. Wear gloves when repotting and never rub your eyes afterwards.',
    tags: ['collector', 'rare'],
    attributes: {
      current_height: '5–8 cm',
      pot_supplied: 'Plastic nursery pot',
      watering: 'Very sparingly',
      maturity: '4 years',
      flower_colour: 'Green-yellow',
      light: 'Bright indirect',
      growth_pattern: 'Spherical',
      placement: 'Bright window',
      difficulty: 'Medium',
      origin: 'India (nursery grown)',
    },
    variants: [
      { options: { pot_size: '4 inch', height: '10–15 cm' }, price: 890, stock: 5, weightG: 450 },
    ],
  },
  {
    type: 'PLANT',
    name: 'Sansevieria Cylindrica — Cylindrical Snake Plant',
    botanicalName: 'Dracaena angolensis',
    slug: 'sansevieria-cylindrica-snake-plant',
    sku: 'ADN-P-SAN-CYL',
    category: 'foliage-flowering',
    shortDescription: 'Architectural spears that tolerate low light and long absences. The easiest plant we sell.',
    description:
      'Stiff, cylindrical spears rising from a shared base — sansevieria cylindrica reads as sculpture and survives conditions that finish most houseplants. It handles low light, dry air and a fortnight of neglect without complaint.\n\nSupplied as an established multi-spear clump. Spears can be left loose or braided as they lengthen.',
    careGuide:
      '## Light\n\nAnything from bright indirect to genuinely dim. Growth is faster in good light but the plant persists in a hallway corner where little else will.\n\n## Watering\n\nEvery two to three weeks in summer, monthly or less in winter. When in doubt, do not water — far more of these are killed by kindness than by drought.\n\n## Mix\n\nAny free-draining potting mix with added sand or perlite. Avoid moisture-retentive composts.\n\n## Feeding\n\nTwice a year is plenty.\n\n## Note\n\nMildly toxic if chewed — worth siting out of reach of cats and small children.',
    tags: ['beginner-friendly', 'low-light'],
    attributes: {
      current_height: '25–45 cm',
      pot_supplied: 'Plastic nursery pot',
      watering: 'Every 2–3 weeks',
      maturity: '2 years',
      light: 'Low to bright indirect',
      growth_pattern: 'Upright spears',
      placement: 'Indoor',
      difficulty: 'Easy',
      origin: 'India (nursery grown)',
    },
    variants: [
      { options: { pot_size: '5 inch', height: '25–40 cm' }, price: 420, stock: 15, weightG: 1100 },
      { options: { pot_size: '6 inch', height: '40–60 cm' }, price: 680, compareAt: 780, stock: 9, weightG: 1800 },
    ],
  },
  {
    type: 'SEED',
    name: 'Gomphrena Everlasting Flower Seeds',
    botanicalName: 'Gomphrena globosa',
    slug: 'gomphrena-everlasting-flower-seeds',
    sku: 'ADN-S-GOM-GLO',
    category: 'flowering-seeds',
    shortDescription: 'Heat-proof clover-shaped blooms that flower through an Indian summer and dry perfectly.',
    description:
      'Gomphrena is the answer to a terrace that bakes. It flowers through the hottest months when most annuals have given up, in magenta, white and pale pink, and the papery blooms dry without losing colour — which is why they turn up in every everlasting arrangement.\n\nEasy from seed, quick to establish, and reliably self-seeding if a few heads are left to ripen.',
    careGuide:
      '## Sowing\n\nSow 5 mm deep in seed trays or directly where plants are to grow. Germination takes 7–14 days at 20–30 °C.\n\n## Growing on\n\nThin or transplant to 20 cm apart. Full sun is essential; in shade the plants stretch and flower thinly.\n\n## Watering\n\nModerate. Gomphrena tolerates drought far better than it tolerates wet feet.\n\n## Flowering and drying\n\nPinch the growing tips once at about 15 cm to encourage branching and a heavier flush. Cut for drying just as the heads reach full colour, and hang upside down in shade.',
    tags: ['beginner-friendly', 'flowering'],
    attributes: {
      germination_days: '7–14 days',
      germination_difficulty: 'Easy',
      ideal_temp: '20–30 °C',
      light_hours: '6+ hrs direct sun',
      sowing_depth: '5 mm',
      sowing_season: 'February – July',
      hybrid_status: 'Open pollinated',
      flower_colour: 'Magenta / white / pink',
      light: 'Full sun',
      growth_pattern: 'Bushy annual',
      placement: 'Outdoor',
      difficulty: 'Easy',
      origin: 'India',
    },
    variants: [
      { options: { pack_size: '50 seeds' }, price: 79, stock: 80, weightG: 10 },
      { options: { pack_size: '100 seeds' }, price: 129, compareAt: 158, stock: 45, weightG: 15 },
    ],
  },
];

const GUIDES = [
  {
    slug: 'growing-adenium-from-seed',
    title: 'Growing Adenium from Seed: a season-by-season guide',
    excerpt: 'Everything between a packet of desert rose seed and a plant with a caudex worth showing — sowing, heat, the first repot, and building the base.',
    body: '## Start with fresh seed\n\nAdenium seed loses viability quickly. Seed from the current season germinates at rates well above 80%; year-old seed can drop below half that. Buy fresh, sow soon, and do not stockpile.\n\n## Soak, sow, and keep it warm\n\nSoak for two to four hours in lukewarm water. Sow flat on a fast-draining mix — equal parts coarse sand, perlite and sieved cocopeat — and cover with about 5 mm.\n\nThe number that matters is temperature. Hold the tray between 25 and 32 °C. Below 20 °C germination stalls and seed rots before it moves. Across most of India, March to June needs no bottom heat at all.\n\n## Days one to fifteen\n\nFirst radicles appear around day five. The batch usually finishes by day fifteen. Mist to keep the surface just damp; standing water is what kills seedlings at this stage.\n\nThe moment cotyledons open, move the tray into bright light. Seedlings held in shade stretch, and a stretched seedling never recovers a compact base.\n\n## The first repot\n\nPrick out into individual three-inch pots when the first true leaves appear. Handle by the cotyledon, never the stem.\n\n## Building the caudex\n\nThis is the part people get wrong. The caudex thickens fastest when the plant is grown hard in full sun with a generous pot and unrestricted water during active growth — not by restricting it. Starving a young adenium produces a small plant, not a fat one.\n\nLift at the end of the second season. Prune the roots back to the main shoulders and replant slightly higher than before, so the flare sits proud of the soil. Repeat annually. Three cycles of this is what separates a nursery plant from a specimen.\n\n## Dormancy\n\nGrowth stops below about 15 °C and leaves drop. Cut water back to almost nothing until new growth appears in spring. Watering a dormant adenium is the commonest way to lose one.',
    isPublished: true,
  },
  {
    slug: 'desert-rose-bonsai-training',
    title: 'Training a Desert Rose as bonsai',
    excerpt: 'Wiring, directional pruning, and root work — how to take an adenium with a good base and give it a canopy to match.',
    body: '## What makes adenium suitable\n\nThe caudex. Adenium thickens at the base naturally, so it arrives at the visual weight a bonsai needs without decades of trunk development. Arabicum does this better than obesum.\n\n## Prune before you wire\n\nMost adenium shaping is done with secateurs, not wire. Each cut typically returns two or three branches, so a single well-placed cut builds ramification faster than any amount of bending.\n\nPrune after a flowering flush, when the plant has energy to respond.\n\n## If you do wire\n\nWind loosely and check every month without fail. Adenium bark is soft and marks easily; wire left a season too long leaves scars that stay for years. Anodised aluminium at a gauge just stiff enough to hold is right — copper is too aggressive for this species.\n\n## Root work builds the base\n\nLift the plant in late spring. Cut the fine roots back hard, keep the main shoulders, and replant higher than it sat before. Each cycle exposes more caudex and widens the flare.\n\nLet the plant recover dry for a week after root work before watering properly — cut roots in wet soil rot.\n\n## Pots\n\nMove to a shallow bonsai pot only once the base is where you want it. Restricting the roots early slows exactly the thickening you are trying to encourage.\n\n## A note on sap\n\nAdenium sap is a mild irritant. Wash your hands after any cutting, and keep it off your face.',
    isPublished: true,
  },
  {
    slug: 'watering-succulents-in-indian-monsoon',
    title: 'Keeping succulents alive through the Indian monsoon',
    excerpt: 'The three months that kill more collections than any drought. Drainage, shelter, airflow and when to simply stop watering.',
    body: '## The problem is not rain, it is rot\n\nSucculents and caudex plants evolved where water arrives fast and drains faster. A monsoon delivers weeks of saturated air and soil that never fully dries — the exact conditions root and collar rot need.\n\n## Move plants under cover\n\nThe single most effective thing you can do. A balcony overhang, a shed roof or a simple polycarbonate sheet keeps direct rain off while leaving plants in good light. They do not need the rain; they need the light.\n\n## Stop watering entirely\n\nIf ambient humidity is high and the mix is not drying within a few days, do not add water. Most collections need no watering at all through peak monsoon weeks.\n\n## Fix the mix before the season, not during\n\nRepot in the weeks before the rains into something at least half mineral — pumice, coarse sand, crushed granite. A mix that drains in seconds in May is what survives July.\n\nTerracotta over plastic. The porous wall loses moisture through the pot surface and buys real margin.\n\n## Airflow matters as much as drainage\n\nStagnant humid air around a crowded shelf invites fungal problems. Space plants apart and run a fan if the collection is indoors.\n\n## Catch it early\n\nSoft, discoloured tissue at the soil line is collar rot. Act immediately: unpot, cut back to clean white tissue, dust the cut with sulphur or cinnamon, and let it callus dry for several days before repotting into fresh dry mix. A plant caught on day two usually lives. One caught on day ten usually does not.',
    isPublished: true,
  },
];

const PAGES = [
  { slug: 'about', title: 'About Adenium', body: 'Adenium is a specialist grower of desert roses, caudex plants and cacti, raising most of what we sell from seed rather than importing finished plants.\n\nWe ship fresh seed and nursery-grown plants across India.\n\n*Replace this placeholder with your own copy before launch (PRD §11, item 8).*' },
  { slug: 'shipping', title: 'Shipping & Delivery', body: '## Despatch\n\nSeed orders are despatched within 2 working days. Plant orders are despatched Monday to Wednesday only, so that nothing sits in a transit hub over a weekend.\n\n## Charges\n\nShipping is charged at a flat rate, calculated at checkout. Orders above the free-shipping threshold ship free.\n\n## Live plants in transit\n\nPlants travel bare-root or pot-wrapped depending on size and season. Some leaf drop on arrival is normal and is not damage — unpack immediately, let the plant settle in bright shade for a week, and water lightly.\n\n## Seasonal holds\n\nWe pause plant despatch during extreme heat and during peak monsoon weeks in affected regions. Seed orders continue year round.\n\n## Damage claims\n\nPhotograph the parcel before unpacking and email us within 24 hours of delivery.\n\n*Replace this placeholder with your own policy before launch — your payment gateway requires published policies at KYC (PRD §11, item 8).*' },
  { slug: 'returns', title: 'Returns & Refunds', body: 'Living plants and seed are perishable goods and cannot be returned once despatched, except where they arrive damaged.\n\n## If your order arrives damaged\n\nEmail photographs of the parcel and its contents within 24 hours of delivery. Confirmed damage is replaced on the next despatch day, or refunded in full where a replacement is unavailable.\n\n## Germination\n\nWe test germination on every seed lot before listing it. We cannot guarantee results in your conditions, since temperature, medium and watering all govern the outcome.\n\n*Replace this placeholder with your own policy before launch (PRD §11, item 8).*' },
  { slug: 'privacy', title: 'Privacy Policy', body: 'We collect only what is needed to fulfil an order: your name, contact details and delivery address.\n\nCard details are never seen or stored by this website — payments are handled entirely by our payment gateway.\n\nWe do not sell or share personal data with third parties beyond the courier and payment partners needed to deliver your order.\n\n*Replace this placeholder with your own policy before launch (PRD §11, item 8).*' },
  { slug: 'terms', title: 'Terms & Conditions', body: 'By placing an order you agree to these terms.\n\nPrices are in Indian Rupees and include applicable taxes unless stated otherwise. We may correct pricing errors before despatch.\n\nPhotographs indicate the grade supplied. Living plants vary between individual specimens.\n\n*Replace this placeholder with your own terms before launch (PRD §11, item 8).*' },
  { slug: 'contact', title: 'Contact Us', body: 'Questions about an order, a plant, or a germination problem — we answer within one working day.\n\n*Replace with your own contact details before launch.*' },
];

async function main() {
  console.log('→ clearing existing data');
  // Sequential rather than one batched transaction: the delete order already
  // respects every foreign key, and a single 27-statement batch overwhelms the
  // PGlite dev bridge.
  const wipes = [
    () => prisma.orderEvent.deleteMany(),
    () => prisma.stockReservation.deleteMany(),
    () => prisma.couponRedemption.deleteMany(),
    () => prisma.orderItem.deleteMany(),
    () => prisma.order.deleteMany(),
    () => prisma.cartItem.deleteMany(),
    () => prisma.cart.deleteMany(),
    () => prisma.wishlistItem.deleteMany(),
    () => prisma.review.deleteMany(),
    () => prisma.productAttribute.deleteMany(),
    () => prisma.productFaq.deleteMany(),
    () => prisma.productTag.deleteMany(),
    () => prisma.productCategory.deleteMany(),
    () => prisma.variant.deleteMany(),
    () => prisma.productImage.deleteMany(),
    () => prisma.product.deleteMany(),
    () => prisma.category.deleteMany(),
    () => prisma.tag.deleteMany(),
    () => prisma.attribute.deleteMany(),
    () => prisma.optionTypeValue.deleteMany(),
    () => prisma.optionType.deleteMany(),
    () => prisma.coupon.deleteMany(),
    () => prisma.guide.deleteMany(),
    () => prisma.page.deleteMany(),
    () => prisma.session.deleteMany(),
    () => prisma.verificationToken.deleteMany(),
    () => prisma.address.deleteMany(),
    () => prisma.user.deleteMany(),
    () => prisma.setting.deleteMany(),
    () => prisma.newsletterSubscriber.deleteMany(),
    () => prisma.contactMessage.deleteMany(),
  ];
  for (const wipe of wipes) await wipe();

  console.log('→ users');
  const [adminPw, customerPw] = await Promise.all([
    bcrypt.hash('Admin@12345', 12),
    bcrypt.hash('Customer@12345', 12),
  ]);
  const admin = await prisma.user.create({
    data: { email: 'admin@adenium.local', name: 'Store Admin', passwordHash: adminPw, role: 'ADMIN', emailVerified: new Date(), phone: '9876543210' },
  });
  const customer = await prisma.user.create({
    data: { email: 'customer@adenium.local', name: 'Meera Iyer', passwordHash: customerPw, role: 'CUSTOMER', emailVerified: new Date(), phone: '9812345678' },
  });
  await prisma.address.create({
    data: { userId: customer.id, fullName: 'Meera Iyer', phone: '9812345678', line1: '14 Rosewood Apartments', line2: 'Anna Nagar West', city: 'Chennai', state: 'Tamil Nadu', pincode: '600040', isDefault: true },
  });

  console.log('→ attributes & option types');
  for (const [i, a] of ATTRIBUTES.entries()) {
    await prisma.attribute.create({ data: { ...a, position: i } });
  }
  for (const [i, o] of OPTION_TYPES.entries()) {
    await prisma.optionType.create({
      data: {
        key: o.key, label: o.label, appliesTo: o.appliesTo, position: i,
        values: { create: o.values.map((value, pos) => ({ value, position: pos })) },
      },
    });
  }

  console.log('→ categories');
  const catBySlug = new Map<string, string>();
  for (const [i, parent] of CATEGORIES.entries()) {
    const p = await prisma.category.create({
      data: { name: parent.name, slug: parent.slug, type: parent.type, description: parent.description, position: i, imageUrl: img(parent.slug) },
    });
    catBySlug.set(p.slug, p.id);
    for (const [j, child] of parent.children.entries()) {
      const c = await prisma.category.create({
        data: { name: child.name, slug: child.slug, type: parent.type, description: child.description, parentId: p.id, position: j, imageUrl: img(child.slug) },
      });
      catBySlug.set(c.slug, c.id);
    }
  }

  console.log('→ tags');
  const tagSlugs = [...new Set(PRODUCTS.flatMap((p) => p.tags))];
  const tagBySlug = new Map<string, string>();
  for (const slug of tagSlugs) {
    const t = await prisma.tag.create({
      data: { slug, name: slug.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) },
    });
    tagBySlug.set(slug, t.id);
  }

  console.log('→ products');
  const attrByKey = new Map((await prisma.attribute.findMany()).map((a) => [a.key, a.id]));

  for (const p of PRODUCTS) {
    const parentSlug = p.type === 'SEED' ? 'seeds' : 'plants';
    const product = await prisma.product.create({
      data: {
        type: p.type,
        name: p.name,
        botanicalName: p.botanicalName,
        slug: p.slug,
        sku: p.sku,
        shortDescription: p.shortDescription,
        description: p.description,
        careGuide: p.careGuide,
        status: 'ACTIVE',
        featured: p.featured ?? false,
        metaTitle: `${p.name} | Buy online in India`,
        metaDescription: p.shortDescription.slice(0, 155),
        categories: {
          create: [
            { categoryId: catBySlug.get(parentSlug)! },
            { categoryId: catBySlug.get(p.category)! },
          ],
        },
        tags: { create: p.tags.map((t) => ({ tagId: tagBySlug.get(t)! })) },
        images: {
          create: [
            { url: img(p.slug, 1), alt: `${p.name} — main product photograph`, position: 0, isPrimary: true },
            { url: img(p.slug, 2), alt: `${p.name} — detail view`, position: 1 },
            { url: img(p.slug, 3), alt: `${p.name} — scale reference`, position: 2 },
          ],
        },
        attributes: {
          create: Object.entries(p.attributes)
            .filter(([k]) => attrByKey.has(k))
            .map(([k, value]) => ({ attributeId: attrByKey.get(k)!, value })),
        },
        faqs: { create: (p.faqs ?? []).map((f, i) => ({ ...f, position: i })) },
      },
    });

    for (const [i, v] of p.variants.entries()) {
      await prisma.variant.create({
        data: {
          productId: product.id,
          optionValues: v.options,
          sku: `${p.sku}-${String(i + 1).padStart(2, '0')}`,
          price: v.price,
          compareAtPrice: v.compareAt ?? null,
          stockQty: v.stock,
          weightG: v.weightG,
          isDefault: i === 0,
        },
      });
    }
  }

  console.log('→ coupons');
  await prisma.coupon.createMany({
    data: [
      { code: 'WELCOME10', description: '10% off your first order', discountType: 'PERCENTAGE', value: 10, maxDiscount: 300, minOrderValue: 499, usageLimitPerUser: 1, isActive: true },
      { code: 'SEEDS50', description: 'Flat ₹50 off seed orders above ₹499', discountType: 'FIXED', value: 50, minOrderValue: 499, isActive: true },
      { code: 'FREESHIP', description: 'Free shipping on orders above ₹799', discountType: 'FREE_SHIPPING', minOrderValue: 799, isActive: true },
      { code: 'EXPIRED20', description: 'Lapsed campaign — used to verify expiry handling', discountType: 'PERCENTAGE', value: 20, endsAt: new Date('2026-01-01'), isActive: true },
    ],
  });

  console.log('→ reviews');
  const arabicum = await prisma.product.findUnique({ where: { slug: 'adenium-arabicum-thai-socotranum-seeds' } });
  if (arabicum) {
    await prisma.review.create({
      data: { productId: arabicum.id, userId: customer.id, rating: 5, title: 'Germinated in six days', body: 'Sowed 25 on a warm terrace in April and had 22 up within a week. Bases are already fattening at four months.', status: 'APPROVED' },
    });
    await prisma.product.update({ where: { id: arabicum.id }, data: { ratingAvg: 5, ratingCount: 1 } });
  }

  console.log('→ guides & pages');
  for (const g of GUIDES) {
    await prisma.guide.create({
      data: { ...g, publishedAt: new Date(), coverImage: img(g.slug), metaTitle: g.title, metaDescription: g.excerpt },
    });
  }
  for (const pg of PAGES) {
    await prisma.page.create({ data: { ...pg, metaTitle: pg.title } });
  }

  console.log('→ settings');
  await prisma.setting.create({
    data: {
      key: 'store',
      value: {
        storeName: 'Adenium', storeEmail: 'orders@adenium.local', storePhone: '+91 00000 00000',
        storeAddress: 'India', shippingFlatSeeds: 49, shippingFlatPlants: 149,
        freeShippingThreshold: 1200, taxPercent: 0, reservationMinutes: 30,
        lowStockThreshold: 3, currency: 'INR',
      },
    },
  });

  const counts = {
    products: await prisma.product.count(),
    variants: await prisma.variant.count(),
    categories: await prisma.category.count(),
    guides: await prisma.guide.count(),
  };
  console.log('\n✓ Seed complete', counts);
  console.log(`  admin:    ${admin.email} / Admin@12345`);
  console.log(`  customer: ${customer.email} / Customer@12345`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
