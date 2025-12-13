#!/usr/bin/env node

/**
 * Download all AI-generated images to local public folder
 * This eliminates CORS issues and external dependencies
 *
 * Usage: node scripts/download-images.mjs
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// All image URLs from staticImages.ts
const IMAGES = {
  races: {
    'human': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765629806097_kvaqyx_1x1_1024x1024.png',
    'elf': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765629873281_qo1dzl_1x1_1024x1024.png',
    'dwarf': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765629943400_onby6u_1x1_1024x1024.png',
    'halfling': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765630011986_q6trwo_1x1_1024x1024.png',
    'dragonborn': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765630077852_wcqmfa_1x1_1024x1024.png',
    'gnome': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765630145060_br6m0n_1x1_1024x1024.png',
    'half-elf': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765630212562_y5vjby_1x1_1024x1024.png',
    'half-orc': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765630282633_1kc61y_1x1_1024x1024.png',
    'tiefling': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765630346862_5cbbyk_1x1_1024x1024.png',
  },
  classes: {
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
  },
  backgrounds: {
    'acolyte': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765632381656_hjqzm4_1x1_1024x1024.png',
    'criminal': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765632395848_23jlti_1x1_1024x1024.png',
    'folk-hero': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765632409151_q8ucym_1x1_1024x1024.png',
    'noble': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765632425154_ct5r5j_1x1_1024x1024.png',
    'sage': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765632446726_gswp2k_1x1_1024x1024.png',
    'soldier': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765632463941_avnam9_1x1_1024x1024.png',
    'hermit': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765632479068_h4qy4w_1x1_1024x1024.png',
    'entertainer': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765632494402_104d09_1x1_1024x1024.png',
  },
  terrain: {
    'stone_floor': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765633033542_54ajen_1x1_1024x1024.png',
    'grass': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765633047642_npibyk_1x1_1024x1024.png',
    'water': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765633061486_8rcki1_1x1_1024x1024.png',
    'lava': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765633075372_ral472_1x1_1024x1024.png',
    'sand': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765633089375_vx1xgv_1x1_1024x1024.png',
    'snow': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765633104700_h2wg9n_1x1_1024x1024.png',
    'forest': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765633119157_aqscl1_1x1_1024x1024.png',
    'swamp': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765637519323_3tm8k9_1x1_1024x1024.png',
  },
  heroes: {
    'epic_battle': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765633174400_9jqaow_16x9_1024x576.png',
    'dungeon_entrance': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765633192550_ixih9v_16x9_1024x576.png',
    'tavern_gathering': 'https://tempfile.aiquickdraw.com/workers/nano/image_1765637794015_3oez8y_16x9_1024x576.png',
  },
};

const PUBLIC_DIR = path.join(__dirname, '../apps/web/public/images');

/**
 * Download a file from URL to local path
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        file.close();
        fs.unlinkSync(destPath);
        return downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });

      file.on('error', (err) => {
        fs.unlinkSync(destPath);
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

/**
 * Download all images in a category
 */
async function downloadCategory(category, images) {
  const categoryDir = path.join(PUBLIC_DIR, category);
  ensureDir(categoryDir);

  console.log(`\nDownloading ${category}...`);

  for (const [name, url] of Object.entries(images)) {
    const ext = url.includes('.png') ? '.png' : '.jpg';
    const filename = `${name}${ext}`;
    const destPath = path.join(categoryDir, filename);

    // Skip if already exists
    if (fs.existsSync(destPath)) {
      console.log(`  ✓ ${filename} (already exists)`);
      continue;
    }

    try {
      process.stdout.write(`  ⏳ Downloading ${filename}...`);
      await downloadFile(url, destPath);
      console.log(` ✓`);
    } catch (error) {
      console.log(` ✗ ${error.message}`);
    }
  }
}

/**
 * Generate updated staticImages.ts content
 */
function generateStaticImagesTs() {
  const lines = [
    '// Static images hosted in /public/images/',
    '// Generated by: node scripts/download-images.mjs',
    `// Generated on: ${new Date().toISOString()}`,
    '',
    'export const RACE_IMAGES: Record<string, string> = {',
  ];

  for (const name of Object.keys(IMAGES.races)) {
    lines.push(`  '${name}': '/images/races/${name}.png',`);
  }
  lines.push('};', '');

  lines.push('export const CLASS_IMAGES: Record<string, string> = {');
  for (const name of Object.keys(IMAGES.classes)) {
    lines.push(`  '${name}': '/images/classes/${name}.png',`);
  }
  lines.push('};', '');

  lines.push('export const BACKGROUND_IMAGES: Record<string, string> = {');
  for (const name of Object.keys(IMAGES.backgrounds)) {
    lines.push(`  '${name}': '/images/backgrounds/${name}.png',`);
  }
  lines.push('};', '');

  lines.push('export const TERRAIN_IMAGES: Record<string, string> = {');
  for (const name of Object.keys(IMAGES.terrain)) {
    lines.push(`  '${name}': '/images/terrain/${name}.png',`);
  }
  lines.push('};', '');

  lines.push('export const HERO_IMAGES: Record<string, string> = {');
  for (const name of Object.keys(IMAGES.heroes)) {
    lines.push(`  '${name}': '/images/heroes/${name}.png',`);
  }
  lines.push('};', '');

  // Helper functions
  lines.push(
    'export function getRaceImage(raceId: string): string {',
    '  return RACE_IMAGES[raceId] || \'\';',
    '}',
    '',
    'export function getClassImage(classId: string): string {',
    '  return CLASS_IMAGES[classId] || \'\';',
    '}',
    '',
    'export function getBackgroundImage(backgroundId: string): string {',
    '  return BACKGROUND_IMAGES[backgroundId] || \'\';',
    '}',
    '',
    'export function getTerrainImage(terrainId: string): string {',
    '  return TERRAIN_IMAGES[terrainId] || \'\';',
    '}',
    '',
    'export function getHeroImage(heroId: string): string {',
    '  return HERO_IMAGES[heroId] || \'\';',
    '}',
    ''
  );

  return lines.join('\n');
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(50));
  console.log('Downloading AI-generated images to /public/images/');
  console.log('='.repeat(50));

  // Ensure base directory exists
  ensureDir(PUBLIC_DIR);

  // Download all categories
  await downloadCategory('races', IMAGES.races);
  await downloadCategory('classes', IMAGES.classes);
  await downloadCategory('backgrounds', IMAGES.backgrounds);
  await downloadCategory('terrain', IMAGES.terrain);
  await downloadCategory('heroes', IMAGES.heroes);

  // Generate updated staticImages.ts
  console.log('\n' + '='.repeat(50));
  console.log('Generating updated staticImages.ts...');

  const staticImagesPath = path.join(__dirname, '../apps/web/src/data/staticImages.ts');
  const content = generateStaticImagesTs();
  fs.writeFileSync(staticImagesPath, content);
  console.log(`✓ Updated ${staticImagesPath}`);

  // Count images
  let total = 0;
  for (const category of Object.keys(IMAGES)) {
    const categoryDir = path.join(PUBLIC_DIR, category);
    if (fs.existsSync(categoryDir)) {
      const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
      total += files.length;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Done! Downloaded ${total} images to /public/images/`);
  console.log('Run "git add apps/web/public/images" to stage the images');
  console.log('='.repeat(50));
}

main().catch(console.error);
