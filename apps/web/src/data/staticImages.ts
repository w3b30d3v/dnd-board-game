// Static pre-generated images for races, classes, and backgrounds
// These images are generated once and reused for all character creation sessions
// To update: generate new images using NanoBanana and update the URLs here

// DiceBear fallback generator for consistent placeholder images
const diceBearUrl = (seed: string, style: string = 'adventurer') =>
  `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1e1b26&size=256`;

// Race preview images
// Use pre-generated AI images when available, fallback to DiceBear
export const RACE_IMAGES: Record<string, string> = {
  // Core races
  human: diceBearUrl('human-race-preview', 'adventurer'),
  elf: diceBearUrl('elf-race-preview', 'lorelei'),
  dwarf: diceBearUrl('dwarf-race-preview', 'adventurer'),
  halfling: diceBearUrl('halfling-race-preview', 'fun-emoji'),
  dragonborn: diceBearUrl('dragonborn-race-preview', 'bottts'),
  gnome: diceBearUrl('gnome-race-preview', 'fun-emoji'),
  'half-elf': diceBearUrl('half-elf-race-preview', 'lorelei'),
  'half-orc': diceBearUrl('half-orc-race-preview', 'adventurer'),
  tiefling: diceBearUrl('tiefling-race-preview', 'bottts'),
};

// Class preview images
export const CLASS_IMAGES: Record<string, string> = {
  barbarian: diceBearUrl('barbarian-class-preview', 'adventurer'),
  bard: diceBearUrl('bard-class-preview', 'avataaars'),
  cleric: diceBearUrl('cleric-class-preview', 'adventurer'),
  druid: diceBearUrl('druid-class-preview', 'lorelei'),
  fighter: diceBearUrl('fighter-class-preview', 'adventurer'),
  monk: diceBearUrl('monk-class-preview', 'adventurer'),
  paladin: diceBearUrl('paladin-class-preview', 'adventurer'),
  ranger: diceBearUrl('ranger-class-preview', 'adventurer'),
  rogue: diceBearUrl('rogue-class-preview', 'adventurer'),
  sorcerer: diceBearUrl('sorcerer-class-preview', 'lorelei'),
  warlock: diceBearUrl('warlock-class-preview', 'bottts'),
  wizard: diceBearUrl('wizard-class-preview', 'lorelei'),
};

// Background preview images
export const BACKGROUND_IMAGES: Record<string, string> = {
  acolyte: diceBearUrl('acolyte-background-preview', 'adventurer'),
  criminal: diceBearUrl('criminal-background-preview', 'adventurer'),
  'folk-hero': diceBearUrl('folk-hero-background-preview', 'adventurer'),
  noble: diceBearUrl('noble-background-preview', 'avataaars'),
  sage: diceBearUrl('sage-background-preview', 'lorelei'),
  soldier: diceBearUrl('soldier-background-preview', 'adventurer'),
  hermit: diceBearUrl('hermit-background-preview', 'lorelei'),
  entertainer: diceBearUrl('entertainer-background-preview', 'avataaars'),
};

// Helper function to get image URL with fallback
export function getRaceImage(raceId: string): string {
  return RACE_IMAGES[raceId.toLowerCase()] || diceBearUrl(`race-${raceId}`, 'adventurer');
}

export function getClassImage(classId: string): string {
  return CLASS_IMAGES[classId.toLowerCase()] || diceBearUrl(`class-${classId}`, 'adventurer');
}

export function getBackgroundImage(backgroundId: string): string {
  return BACKGROUND_IMAGES[backgroundId.toLowerCase()] || diceBearUrl(`background-${backgroundId}`, 'adventurer');
}
