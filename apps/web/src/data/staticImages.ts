// Static images for D&D character builder selection screens
// Using DiceBear as high-quality placeholders
// Replace with AI-generated images by running: node scripts/generate-static-via-api.mjs

// DiceBear styles that match D&D aesthetic
const DICEBEAR_STYLES = {
  race: 'adventurer-neutral',  // Neutral faces for races
  class: 'avataaars',          // More detailed for classes
  background: 'lorelei',       // Artistic style for backgrounds
};

// Generate consistent DiceBear URLs
function getDiceBearUrl(style: string, seed: string, options: Record<string, string> = {}): string {
  const params = new URLSearchParams({
    seed,
    backgroundColor: '1e1b26,2a2735,0f0d13',
    ...options,
  });
  return `https://api.dicebear.com/7.x/${style}/svg?${params.toString()}`;
}

// ===== RACE IMAGES =====
// Each race gets a unique visual identity
export const RACE_IMAGES: Record<string, string> = {
  human: getDiceBearUrl('adventurer-neutral', 'human-warrior', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '45',
  }),
  elf: getDiceBearUrl('adventurer-neutral', 'high-elf-archer', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '135',
  }),
  dwarf: getDiceBearUrl('adventurer-neutral', 'mountain-dwarf', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '90',
  }),
  halfling: getDiceBearUrl('adventurer-neutral', 'lightfoot-halfling', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '180',
  }),
  dragonborn: getDiceBearUrl('bottts', 'brass-dragonborn', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '45',
  }),
  gnome: getDiceBearUrl('adventurer-neutral', 'rock-gnome-inventor', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '270',
  }),
  'half-elf': getDiceBearUrl('adventurer-neutral', 'graceful-half-elf', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '120',
  }),
  'half-orc': getDiceBearUrl('adventurer-neutral', 'fierce-half-orc', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '200',
  }),
  tiefling: getDiceBearUrl('bottts', 'infernal-tiefling', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '315',
  }),
};

// ===== CLASS IMAGES =====
// Each class gets visuals matching their archetype
export const CLASS_IMAGES: Record<string, string> = {
  barbarian: getDiceBearUrl('avataaars', 'raging-barbarian', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '45',
  }),
  bard: getDiceBearUrl('avataaars', 'charismatic-bard', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '90',
  }),
  cleric: getDiceBearUrl('avataaars', 'holy-cleric', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '135',
  }),
  druid: getDiceBearUrl('avataaars', 'nature-druid', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '180',
  }),
  fighter: getDiceBearUrl('avataaars', 'battle-fighter', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '225',
  }),
  monk: getDiceBearUrl('avataaars', 'disciplined-monk', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '270',
  }),
  paladin: getDiceBearUrl('avataaars', 'noble-paladin', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '315',
  }),
  ranger: getDiceBearUrl('avataaars', 'wilderness-ranger', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '0',
  }),
  rogue: getDiceBearUrl('avataaars', 'shadowy-rogue', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '60',
  }),
  sorcerer: getDiceBearUrl('avataaars', 'innate-sorcerer', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '120',
  }),
  warlock: getDiceBearUrl('avataaars', 'pact-warlock', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '180',
  }),
  wizard: getDiceBearUrl('avataaars', 'arcane-wizard', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '240',
  }),
};

// ===== BACKGROUND IMAGES =====
// Each background represents a lifestyle/origin
export const BACKGROUND_IMAGES: Record<string, string> = {
  acolyte: getDiceBearUrl('lorelei', 'temple-acolyte', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '45',
  }),
  criminal: getDiceBearUrl('lorelei', 'shadowy-criminal', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '90',
  }),
  'folk-hero': getDiceBearUrl('lorelei', 'humble-folk-hero', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '135',
  }),
  noble: getDiceBearUrl('lorelei', 'aristocratic-noble', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '180',
  }),
  sage: getDiceBearUrl('lorelei', 'scholarly-sage', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '225',
  }),
  soldier: getDiceBearUrl('lorelei', 'veteran-soldier', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '270',
  }),
  hermit: getDiceBearUrl('lorelei', 'reclusive-hermit', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '315',
  }),
  entertainer: getDiceBearUrl('lorelei', 'performer-entertainer', {
    backgroundType: 'gradientLinear',
    backgroundRotation: '0',
  }),
};

// ===== TERRAIN TEXTURES =====
// Placeholder colored squares for terrain (will be replaced with AI textures)
export const TERRAIN_IMAGES: Record<string, string> = {
  stone_floor: '',
  water: '',
  lava: '',
  difficult_terrain: '',
  wall: '',
  door: '',
  stairs: '',
  pit: '',
};

// ===== HERO IMAGES =====
// Landing page hero images (will be replaced with AI panoramas)
export const HERO_IMAGES: Record<string, string> = {
  epic_battle: '',
  dungeon_entrance: '',
  tavern_gathering: '',
};

// ===== GETTER FUNCTIONS =====
export function getRaceImage(raceId: string): string {
  return RACE_IMAGES[raceId] || '';
}

export function getClassImage(classId: string): string {
  return CLASS_IMAGES[classId] || '';
}

export function getBackgroundImage(backgroundId: string): string {
  return BACKGROUND_IMAGES[backgroundId] || '';
}

export function getTerrainImage(terrainId: string): string {
  return TERRAIN_IMAGES[terrainId] || '';
}

export function getHeroImage(heroId: string): string {
  return HERO_IMAGES[heroId] || '';
}

// ===== AI IMAGE REPLACEMENT =====
// To replace with AI-generated images:
// 1. Login to the web app
// 2. Get your JWT token from localStorage (accessToken)
// 3. Run: node scripts/generate-static-via-api.mjs --token=YOUR_TOKEN
// 4. The script will update this file with NanoBanana URLs
