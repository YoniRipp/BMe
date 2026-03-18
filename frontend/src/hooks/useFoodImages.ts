/**
 * Lightweight food image lookup by keyword matching.
 * All images from Pexels (single source). Each food has a unique photo.
 * No API calls – instant, works offline.
 */

const px = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop`;

// Ordered: more-specific keywords first so "chicken breast" matches "chicken" before "breast"
// Every entry uses a UNIQUE Pexels photo ID — no duplicates.
const FOOD_IMAGE_MAP: [string, string][] = [
  // Poultry
  ['chicken', px(2673353)],    // cooked chicken on white plate
  ['turkey', px(3659862)],     // turkey meat sliced
  ['duck', px(28247014)],      // chicken/poultry plate with vegetables
  ['rotisserie', px(7172851)], // fried chicken on ceramic plate
  // Red meat
  ['beef', px(1639557)],       // raw beef steak
  ['steak', px(1251208)],      // grilled steak
  ['brisket', px(2233729)],    // barbecue meat
  ['ribeye', px(3535383)],     // steak on plate
  ['sirloin', px(8694600)],    // meat on cutting board
  ['filet mignon', px(3997609)], // fine dining steak
  ['veal', px(3338497)],       // meat on plate
  ['lamb', px(1352270)],       // lamb chop
  ['bison', px(2491273)],      // cooked meat
  // Pork
  ['pork', px(2067418)],       // pork cuts
  ['bacon', px(1059943)],      // crispy bacon strips
  ['ham', px(3186654)],        // ham sliced
  ['sausage', px(929137)],     // sausages
  ['prosciutto', px(3662136)], // prosciutto sliced
  ['chorizo', px(4676401)],    // chorizo sausage
  ['pepperoni', px(4109111)],  // pepperoni
  ['salami', px(6287502)],     // salami sliced
  // Fish & seafood
  ['salmon', px(1516415)],     // salmon dish with vegetables
  ['tuna', px(7627407)],       // fish steak with spinach
  ['cod', px(3763847)],        // white fish fillet
  ['tilapia', px(3843224)],    // fried fish
  ['trout', px(19001608)],     // fish on tray
  ['halibut', px(3655916)],    // white fish plate
  ['fish', px(2374946)],       // generic fish
  ['shrimp', px(725992)],      // shrimp prawns
  ['crab', px(3298180)],       // crab on plate
  ['lobster', px(3763908)],    // lobster
  ['scallop', px(8969237)],    // scallops
  ['mussel', px(12419890)],    // mussels
  ['oyster', px(7260470)],     // oysters
  ['squid', px(4553020)],      // calamari
  ['seafood', px(1510714)],    // mixed seafood
  // Eggs
  ['egg', px(824635)],         // eggs in carton
  // Dairy
  ['cheese', px(821365)],      // cheese block
  ['yogurt', px(414262)],      // yogurt bowl
  ['milk', px(2198626)],       // glass of milk
  ['cream', px(5765825)],      // cream in bowl
  ['butter', px(531334)],      // butter block
  ['cottage', px(4397899)],    // cottage cheese
  ['ricotta', px(5417843)],    // ricotta cheese
  ['paneer', px(9609838)],     // paneer cubes
  // Grains & starches
  ['rice', px(723198)],        // bowl of rice
  ['pasta', px(1279330)],      // pasta
  ['bread', px(1775043)],      // bread loaf
  ['oat', px(543730)],         // oatmeal bowl
  ['cereal', px(135525)],      // cereal bowl
  ['tortilla', px(1108775)],   // tortillas
  ['quinoa', px(17910326)],    // quinoa bowl
  ['couscous', px(2284166)],   // couscous grain
  // Vegetables (each gets a unique photo)
  ['broccoli', px(47347)],     // broccoli on wooden table
  ['spinach', px(2325843)],    // spinach leaves
  ['carrot', px(143133)],      // carrots bunch
  ['tomato', px(533280)],      // tomatoes
  ['potato', px(144248)],      // potatoes
  ['pepper', px(128536)],      // bell peppers
  ['onion', px(175414)],       // onions
  ['avocado', px(557659)],     // avocado halved
  ['vegetable', px(2181151)],  // mixed vegetables
  ['salad', px(1059905)],      // salad bowl
  ['lettuce', px(2095569)],    // green leafy vegetables
  ['kale', px(2280567)],       // kale and greens
  ['cucumber', px(2329440)],   // cucumber sliced
  ['celery', px(3727689)],     // green vegetable
  // Fruits (each gets a unique photo)
  ['banana', px(2238316)],     // yellow bananas
  ['apple', px(1510392)],      // red apple
  ['orange', px(2294477)],     // orange citrus
  ['berry', px(1120575)],      // mixed berries
  ['blueberry', px(1253545)],  // blueberries
  ['strawberry', px(934066)],  // strawberries
  ['grape', px(760281)],       // grapes
  ['mango', px(918643)],       // mango
  ['melon', px(2894285)],      // melon
  ['pear', px(568471)],        // pear
  ['fruit', px(1128678)],      // mixed fruit
  // Nuts & seeds (each unique)
  ['almond', px(1295572)],     // almonds
  ['walnut', px(45202)],       // walnuts
  ['peanut', px(1893650)],     // peanuts
  ['cashew', px(7261946)],     // cashews
  ['nut', px(890507)],          // mixed nuts
  ['seed', px(1080754)],       // seeds
  // Prepared / other (each unique)
  ['pizza', px(315755)],       // pizza
  ['burger', px(1199957)],     // burger
  ['sandwich', px(1603901)],   // sandwich
  ['wrap', px(461198)],        // wrap/burrito
  ['soup', px(539451)],        // bowl of soup
  ['smoothie', px(1346155)],   // smoothie glass
  ['protein', px(4220141)],    // protein powder/shake
  ['bar', px(3026810)],        // energy bar
  // Ground meat fallback
  ['ground', px(6941010)],     // ground meat
  ['meatball', px(2741448)],   // meatball plate
  ['jerky', px(6210876)],      // dried meat
];

export function getFoodImageUrl(name: string): string | undefined {
  const lower = name.toLowerCase();
  for (const [keyword, url] of FOOD_IMAGE_MAP) {
    if (lower.includes(keyword)) return url;
  }
  return undefined;
}
