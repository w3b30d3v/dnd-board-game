#!/usr/bin/env node
/**
 * Generate Static Assets via Production API
 *
 * This script calls the production API endpoint which handles
 * NanoBanana webhook callbacks properly.
 *
 * Prerequisites:
 * 1. Have a valid user account on the production API
 * 2. Get an access token via login
 *
 * Usage:
 *   node scripts/generate-static-via-api.mjs --token=YOUR_JWT_TOKEN
 *   node scripts/generate-static-via-api.mjs --token=YOUR_JWT_TOKEN --category=races
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API Configuration
const API_BASE_URL = process.env.API_URL || 'https://api-production-2f00.up.railway.app';
const OUTPUT_DIR = path.join(__dirname, '..', 'generated-assets');

// Asset definitions
const RACES = [
  { id: 'human', name: 'Human' },
  { id: 'elf', name: 'Elf' },
  { id: 'dwarf', name: 'Dwarf' },
  { id: 'halfling', name: 'Halfling' },
  { id: 'dragonborn', name: 'Dragonborn' },
  { id: 'gnome', name: 'Gnome' },
  { id: 'half-elf', name: 'Half-Elf' },
  { id: 'half-orc', name: 'Half-Orc' },
  { id: 'tiefling', name: 'Tiefling' },
];

const CLASSES = [
  { id: 'barbarian', name: 'Barbarian' },
  { id: 'bard', name: 'Bard' },
  { id: 'cleric', name: 'Cleric' },
  { id: 'druid', name: 'Druid' },
  { id: 'fighter', name: 'Fighter' },
  { id: 'monk', name: 'Monk' },
  { id: 'paladin', name: 'Paladin' },
  { id: 'ranger', name: 'Ranger' },
  { id: 'rogue', name: 'Rogue' },
  { id: 'sorcerer', name: 'Sorcerer' },
  { id: 'warlock', name: 'Warlock' },
  { id: 'wizard', name: 'Wizard' },
];

const BACKGROUNDS = [
  { id: 'acolyte', name: 'Acolyte' },
  { id: 'criminal', name: 'Criminal' },
  { id: 'folk-hero', name: 'Folk Hero' },
  { id: 'noble', name: 'Noble' },
  { id: 'sage', name: 'Sage' },
  { id: 'soldier', name: 'Soldier' },
  { id: 'hermit', name: 'Hermit' },
  { id: 'entertainer', name: 'Entertainer' },
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generatePortrait(token, race, charClass, style = 'portrait') {
  const response = await fetch(`${API_BASE_URL}/media/generate/portrait`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      character: {
        race,
        class: charClass,
        name: `${race} ${charClass}`, // Generic name for preview
      },
      style,
      quality: 'standard',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Generation failed');
  }

  return {
    imageUrl: data.imageUrl,
    source: data.source,
  };
}

async function generateRaceImages(token) {
  console.log('\n=== Generating RACE Images ===\n');
  const results = {};

  for (let i = 0; i < RACES.length; i++) {
    const race = RACES[i];
    console.log(`[${i + 1}/${RACES.length}] ${race.name}...`);

    try {
      // Use fighter as default class for race previews
      const result = await generatePortrait(token, race.id, 'fighter', 'portrait');
      results[race.id] = {
        name: race.name,
        imageUrl: result.imageUrl,
        source: result.source,
        generatedAt: new Date().toISOString(),
      };
      console.log(`  ✓ Success (${result.source}): ${result.imageUrl.substring(0, 50)}...`);

      // Wait between requests to avoid rate limiting
      await sleep(2000);
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}`);
      results[race.id] = {
        name: race.name,
        error: error.message,
        generatedAt: new Date().toISOString(),
      };
    }
  }

  return results;
}

async function generateClassImages(token) {
  console.log('\n=== Generating CLASS Images ===\n');
  const results = {};

  for (let i = 0; i < CLASSES.length; i++) {
    const charClass = CLASSES[i];
    console.log(`[${i + 1}/${CLASSES.length}] ${charClass.name}...`);

    try {
      // Use human as default race for class previews
      const result = await generatePortrait(token, 'human', charClass.id, 'portrait');
      results[charClass.id] = {
        name: charClass.name,
        imageUrl: result.imageUrl,
        source: result.source,
        generatedAt: new Date().toISOString(),
      };
      console.log(`  ✓ Success (${result.source}): ${result.imageUrl.substring(0, 50)}...`);

      await sleep(2000);
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}`);
      results[charClass.id] = {
        name: charClass.name,
        error: error.message,
        generatedAt: new Date().toISOString(),
      };
    }
  }

  return results;
}

async function generateBackgroundImages(token) {
  console.log('\n=== Generating BACKGROUND Images ===\n');
  const results = {};

  // Background prompts need custom handling - we'll use the portrait endpoint
  // but with descriptions that evoke the background's lifestyle
  const backgroundClasses = {
    'acolyte': 'cleric',
    'criminal': 'rogue',
    'folk-hero': 'fighter',
    'noble': 'paladin',
    'sage': 'wizard',
    'soldier': 'fighter',
    'hermit': 'druid',
    'entertainer': 'bard',
  };

  for (let i = 0; i < BACKGROUNDS.length; i++) {
    const bg = BACKGROUNDS[i];
    console.log(`[${i + 1}/${BACKGROUNDS.length}] ${bg.name}...`);

    try {
      const charClass = backgroundClasses[bg.id] || 'fighter';
      const result = await generatePortrait(token, 'human', charClass, 'portrait');
      results[bg.id] = {
        name: bg.name,
        imageUrl: result.imageUrl,
        source: result.source,
        generatedAt: new Date().toISOString(),
      };
      console.log(`  ✓ Success (${result.source}): ${result.imageUrl.substring(0, 50)}...`);

      await sleep(2000);
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}`);
      results[bg.id] = {
        name: bg.name,
        error: error.message,
        generatedAt: new Date().toISOString(),
      };
    }
  }

  return results;
}

function saveResults(category, results) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const outputFile = path.join(OUTPUT_DIR, `${category}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\nSaved to: ${outputFile}`);
  return outputFile;
}

function updateStaticImagesTs(allResults) {
  const code = `// Auto-generated static images from NanoBanana API
// Generated on: ${new Date().toISOString()}
// Run: node scripts/generate-static-via-api.mjs --token=YOUR_TOKEN

export const RACE_IMAGES: Record<string, string> = {
${Object.entries(allResults.races || {})
  .filter(([_, v]) => v.imageUrl)
  .map(([id, v]) => `  '${id}': '${v.imageUrl}',`)
  .join('\n')}
};

export const CLASS_IMAGES: Record<string, string> = {
${Object.entries(allResults.classes || {})
  .filter(([_, v]) => v.imageUrl)
  .map(([id, v]) => `  '${id}': '${v.imageUrl}',`)
  .join('\n')}
};

export const BACKGROUND_IMAGES: Record<string, string> = {
${Object.entries(allResults.backgrounds || {})
  .filter(([_, v]) => v.imageUrl)
  .map(([id, v]) => `  '${id}': '${v.imageUrl}',`)
  .join('\n')}
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
`;

  const outputPath = path.join(__dirname, '..', 'apps', 'web', 'src', 'data', 'staticImages.ts');
  fs.writeFileSync(outputPath, code);
  console.log(`\nUpdated: ${outputPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  const tokenArg = args.find(a => a.startsWith('--token='));
  const categoryArg = args.find(a => a.startsWith('--category='));

  const token = tokenArg?.split('=')[1] || process.env.AUTH_TOKEN;
  const category = categoryArg?.split('=')[1] || 'all';

  console.log('\n========================================');
  console.log('  D&D Static Asset Generator (via API)');
  console.log('========================================\n');
  console.log(`API: ${API_BASE_URL}`);
  console.log(`Category: ${category}`);
  console.log(`Token: ${token ? token.substring(0, 20) + '...' : 'NOT PROVIDED'}`);

  if (!token) {
    console.error('\n❌ ERROR: No authentication token provided\n');
    console.log('Usage:');
    console.log('  node scripts/generate-static-via-api.mjs --token=YOUR_JWT_TOKEN\n');
    console.log('To get a token:');
    console.log('  1. Login at https://web-production-85b97.up.railway.app/login');
    console.log('  2. Open browser DevTools > Application > Local Storage');
    console.log('  3. Copy the accessToken value\n');
    process.exit(1);
  }

  const allResults = {
    races: {},
    classes: {},
    backgrounds: {},
  };

  // Load existing results
  for (const cat of ['races', 'classes', 'backgrounds']) {
    const filePath = path.join(OUTPUT_DIR, `${cat}.json`);
    if (fs.existsSync(filePath)) {
      try {
        allResults[cat] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        console.log(`Loaded existing ${cat}: ${Object.keys(allResults[cat]).length} items`);
      } catch (e) {
        // Ignore
      }
    }
  }

  // Generate requested category
  if (category === 'races' || category === 'all') {
    allResults.races = await generateRaceImages(token);
    saveResults('races', allResults.races);
  }

  if (category === 'classes' || category === 'all') {
    allResults.classes = await generateClassImages(token);
    saveResults('classes', allResults.classes);
  }

  if (category === 'backgrounds' || category === 'all') {
    allResults.backgrounds = await generateBackgroundImages(token);
    saveResults('backgrounds', allResults.backgrounds);
  }

  // Update TypeScript file
  updateStaticImagesTs(allResults);

  // Summary
  console.log('\n========================================');
  console.log('  GENERATION SUMMARY');
  console.log('========================================\n');

  let totalSuccess = 0;
  let totalFailed = 0;
  let totalFallback = 0;

  for (const [cat, results] of Object.entries(allResults)) {
    const success = Object.values(results).filter(r => r.imageUrl && r.source === 'nanobanana').length;
    const fallback = Object.values(results).filter(r => r.imageUrl && r.source === 'fallback').length;
    const failed = Object.values(results).filter(r => r.error).length;

    console.log(`${cat}:`);
    console.log(`  ✓ AI Generated: ${success}`);
    console.log(`  ⚠ Fallback: ${fallback}`);
    console.log(`  ✗ Failed: ${failed}`);

    totalSuccess += success;
    totalFallback += fallback;
    totalFailed += failed;
  }

  console.log(`\nTOTAL:`);
  console.log(`  ✓ AI Generated: ${totalSuccess}`);
  console.log(`  ⚠ Fallback: ${totalFallback}`);
  console.log(`  ✗ Failed: ${totalFailed}`);
  console.log(`\nEstimated cost: ~$${(totalSuccess * 0.03).toFixed(2)}`);
}

main().catch(console.error);
