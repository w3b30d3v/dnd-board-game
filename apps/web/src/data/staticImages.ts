// Auto-generated static images from NanoBanana API
// Generated on: 2025-12-13T13:40:08.666Z
// Run: node scripts/generate-static-via-api.mjs --token=YOUR_TOKEN

// API URL for image proxy (bypasses CORS)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-2f00.up.railway.app';

/**
 * Wrap an image URL with our proxy to bypass CORS
 */
export function proxyImageUrl(url: string): string {
  if (!url) return '';
  return `${API_URL}/media/proxy?url=${encodeURIComponent(url)}`;
}

export const RACE_IMAGES: Record<string, string> = {
  'human': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765629806097_kvaqyx_1x1_1024x1024.png',
  'elf': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765629873281_qo1dzl_1x1_1024x1024.png',
  'dwarf': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765629943400_onby6u_1x1_1024x1024.png',
  'halfling': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765630011986_q6trwo_1x1_1024x1024.png',
  'dragonborn': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765630077852_wcqmfa_1x1_1024x1024.png',
  'gnome': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765630145060_br6m0n_1x1_1024x1024.png',
  'half-elf': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765630212562_y5vjby_1x1_1024x1024.png',
  'half-orc': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765630282633_1kc61y_1x1_1024x1024.png',
  'tiefling': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765630346862_5cbbyk_1x1_1024x1024.png',
};

export const CLASS_IMAGES: Record<string, string> = {
  'barbarian': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765631429844_8dknqy_1x1_1024x1024.png',
  'bard': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765631443595_q37q3g_1x1_1024x1024.png',
  'cleric': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765631457665_ysy1oi_1x1_1024x1024.png',
  'druid': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765631471112_ns8s58_1x1_1024x1024.png',
  'fighter': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765631484618_ahhzh7_1x1_1024x1024.png',
  'monk': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765631499535_drb805_1x1_1024x1024.png',
  'paladin': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765631513746_mznm8w_1x1_1024x1024.png',
  'ranger': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765631530971_qvy102_1x1_1024x1024.png',
  'rogue': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765631549326_zpoy9j_1x1_1024x1024.png',
  'sorcerer': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765631567544_ddb092_1x1_1024x1024.png',
  'warlock': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765631581041_eoycbr_1x1_1024x1024.png',
  'wizard': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765631595472_mb1nji_1x1_1024x1024.png',
};

export const BACKGROUND_IMAGES: Record<string, string> = {
  'acolyte': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765632381656_hjqzm4_1x1_1024x1024.png',
  'criminal': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765632395848_23jlti_1x1_1024x1024.png',
  'folk-hero': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765632409151_q8ucym_1x1_1024x1024.png',
  'noble': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765632425154_ct5r5j_1x1_1024x1024.png',
  'sage': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765632446726_gswp2k_1x1_1024x1024.png',
  'soldier': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765632463941_avnam9_1x1_1024x1024.png',
  'hermit': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765632479068_h4qy4w_1x1_1024x1024.png',
  'entertainer': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765632494402_104d09_1x1_1024x1024.png',
};

// Raw terrain image URLs (may have CORS issues when loaded by PixiJS)
export const TERRAIN_IMAGES_RAW: Record<string, string> = {
  'stone_floor': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765633033542_54ajen_1x1_1024x1024.png',
  'grass': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765633047642_npibyk_1x1_1024x1024.png',
  'water': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765633061486_8rcki1_1x1_1024x1024.png',
  'lava': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765633075372_ral472_1x1_1024x1024.png',
  'sand': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765633089375_vx1xgv_1x1_1024x1024.png',
  'snow': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765633104700_h2wg9n_1x1_1024x1024.png',
  'forest': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765633119157_aqscl1_1x1_1024x1024.png',
  'swamp': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765637519323_3tm8k9_1x1_1024x1024.png',
};

// Terrain images through proxy (for PixiJS/Canvas which need CORS)
export const TERRAIN_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(TERRAIN_IMAGES_RAW).map(([key, url]) => [key, proxyImageUrl(url)])
);

export const HERO_IMAGES: Record<string, string> = {
  'epic_battle': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765633174400_9jqaow_16x9_1024x576.png',
  'dungeon_entrance': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765633192550_ixih9v_16x9_1024x576.png',
  'tavern_gathering': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765637794015_3oez8y_16x9_1024x576.png',
};

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
