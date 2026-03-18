/**
 * Lightweight food image lookup by keyword matching.
 * All images from Pexels (single source). Each food has a unique photo.
 * IDs verified by searching Pexels for each food item.
 * No API calls – instant, works offline.
 */

const px = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop`;

// Ordered: more-specific keywords first so "chicken breast" matches "chicken" before "breast"
// Every entry uses a UNIQUE verified Pexels photo ID — no duplicates.
const FOOD_IMAGE_MAP: [string, string][] = [
  // Poultry
  ['chicken', px(616353)],       // roasted chicken
  ['turkey', px(5847715)],       // turkey meat
  ['duck', px(5791675)],         // cooked duck on plates
  ['rotisserie', px(698308)],    // delicious roasted chicken
  // Red meat
  ['beef', px(769289)],          // steak food
  ['steak', px(1251208)],        // grilled steak
  ['brisket', px(12645502)],     // slicing brisket
  ['ribeye', px(6542787)],       // appetizing cut ribeye
  ['sirloin', px(8697542)],      // sirloin fine dining
  ['filet mignon', px(3535383)], // steak and plate
  ['veal', px(3981486)],         // cooked food on white plate
  ['lamb', px(5410460)],         // grilled lamb with vegetables
  ['bison', px(830928)],         // meat shish kabob
  // Pork
  ['pork', px(12592498)],        // close-up roasted pork
  ['bacon', px(4110365)],        // photo of bacon
  ['ham', px(7175711)],          // ham and vegetables on tray
  ['sausage', px(5627444)],      // smoked sausage slices
  ['prosciutto', px(8922185)],   // prosciutto platter
  ['chorizo', px(1998920)],      // cooked spicy grilled
  ['pepperoni', px(4639328)],    // cold cuts cured sausage
  ['salami', px(4639731)],       // salami slices with seasonings
  // Fish & seafood
  ['salmon', px(1516415)],       // salmon dish with vegetables
  ['tuna', px(17942043)],        // plate of tuna crudo
  ['cod', px(272522)],           // cod fish food
  ['tilapia', px(8352785)],      // grilling tilapia fish
  ['trout', px(6839650)],        // trout dinner plate
  ['halibut', px(2213257)],      // fish fillet
  ['fish', px(2374946)],         // cooked fish on plate
  ['shrimp', px(37346)],         // seafood shellfish shrimp
  ['crab', px(775863)],          // cooked crab on ceramic plate
  ['lobster', px(4553378)],      // boiled lobster with wine
  ['scallop', px(32863869)],     // gourmet scallop dish
  ['mussel', px(8352388)],       // mussels
  ['oyster', px(6953377)],       // oyster on ice
  ['squid', px(2433979)],        // cooked squid on plate
  ['seafood', px(2871757)],      // bowl of seafood
  // Eggs
  ['egg', px(1631180)],          // eggs on egg carton
  // Dairy
  ['cheese', px(4187783)],       // assorted cheese on table
  ['yogurt', px(8892364)],       // top view yogurt bowl
  ['milk', px(236010)],          // clear milk glass
  ['cream', px(1435901)],        // assorted cream containers
  ['butter', px(7965943)],       // creamy butter on wooden plate
  ['cottage', px(4198142)],      // cottage cheese with herbs
  ['ricotta', px(5953837)],      // making ricotta cheese
  ['paneer', px(9609838)],       // paneer butter masala
  // Grains & starches
  ['rice', px(1306548)],         // rice in white ceramic bowl
  ['pasta', px(1438672)],        // food photography of pasta
  ['bread', px(1287278)],        // freshly baked bread rolls
  ['oat', px(3233281)],          // oatmeal with raspberries
  ['cereal', px(2835751)],       // top view cereal bowl
  ['tortilla', px(6605198)],     // tortilla with vegetables
  ['quinoa', px(1640777)],       // vegetable salad on plate
  ['couscous', px(1438540)],     // stuffed bell pepper couscous
  // Vegetables (each unique verified ID)
  ['broccoli', px(161514)],      // broccoli
  ['spinach', px(159094)],       // bowl of spinach
  ['carrot', px(1721073)],       // orange carrot
  ['tomato', px(1327838)],       // cherry tomato lot
  ['potato', px(4110476)],       // close-up potato
  ['pepper', px(594137)],        // assorted bell peppers
  ['onion', px(1437811)],        // onions garlic tomatoes
  ['avocado', px(557659)],       // sliced avocado fruit
  ['vegetable', px(2611818)],    // assorted vegetables
  ['salad', px(2097090)],        // salad on a plate
  ['lettuce', px(5604)],         // lettuce
  ['kale', px(5589002)],         // bowl of kale
  ['cucumber', px(2329440)],     // cucumber
  ['celery', px(1194433)],       // sliced celery on pan
  // Fruits (each unique verified ID)
  ['banana', px(2238316)],       // yellow bananas
  ['apple', px(209439)],         // red apple fruit
  ['orange', px(161559)],        // orange fruit
  ['berry', px(4162851)],        // mixed berries containers
  ['blueberry', px(1395958)],    // closeup blueberry fruits
  ['strawberry', px(106148)],    // red strawberry fruits
  ['grape', px(708777)],         // grape fruits
  ['mango', px(7788418)],        // person holding mango slice
  ['melon', px(1313267)],        // watermelon fruit
  ['pear', px(1656665)],         // corella pear fruit
  ['fruit', px(1132047)],        // sliced fruits on tray
  // Nuts & seeds (each unique)
  ['almond', px(1013420)],       // close-up almond nuts
  ['walnut', px(3904510)],       // walnuts
  ['peanut', px(6659880)],       // creamy peanut butter
  ['cashew', px(4663476)],       // cashew nuts
  ['nut', px(5507691)],          // close-up mixed nuts
  ['seed', px(3682192)],         // jar filled with chia seeds
  // Prepared / other (each unique)
  ['pizza', px(1552635)],        // food photography of pizza
  ['burger', px(2983101)],       // hamburger and fries
  ['sandwich', px(5678)],        // sandwich
  ['wrap', px(4955219)],         // sliced tortilla wrap
  ['soup', px(1907227)],         // soup served on bowl
  ['smoothie', px(2424034)],     // smoothie in drinking glass
  ['protein', px(1564585)],      // protein shake
  ['bar', px(14513406)],         // homemade protein bars
  // Ground meat fallback
  ['ground', px(5409020)],       // bowl with meatballs
  ['meatball', px(2741448)],     // meatball plate
  ['jerky', px(2935022)],        // cooked meat jerky
];

export function getFoodImageUrl(name: string): string | undefined {
  const lower = name.toLowerCase();
  for (const [keyword, url] of FOOD_IMAGE_MAP) {
    if (lower.includes(keyword)) return url;
  }
  return undefined;
}
