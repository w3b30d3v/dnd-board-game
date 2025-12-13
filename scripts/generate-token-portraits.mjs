#!/usr/bin/env node

/**
 * Generate AI token portraits for game board creatures using NanoBanana API
 *
 * Usage: NANOBANANA_API_KEY=your_key node scripts/generate-token-portraits.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../apps/web/public/images/tokens');

const NANOBANANA_API_KEY = process.env.NANOBANANA_API_KEY;

if (!NANOBANANA_API_KEY) {
  console.error('Error: NANOBANANA_API_KEY environment variable is required');
  process.exit(1);
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Token definitions with prompts
const TOKENS = [
  {
    id: 'thorin_dwarf',
    filename: 'thorin_dwarf.png',
    prompt: 'Portrait of Thorin, a battle-hardened dwarf fighter with a braided brown beard, steel helmet with horns, weathered face with scars, holding a battle axe, medieval fantasy style, dramatic lighting, circular portrait format, dark background, highly detailed, professional fantasy art'
  },
  {
    id: 'elara_elf',
    filename: 'elara_elf.png',
    prompt: 'Portrait of Elara, a graceful high elf wizard with long silver hair, pointed ears, glowing blue eyes, wearing ornate robes with arcane symbols, ethereal magical aura around her, circular portrait format, dark mystical background, highly detailed fantasy art'
  },
  {
    id: 'goblin_scout',
    filename: 'goblin_scout.png',
    prompt: 'Portrait of a sneaky goblin scout, green wrinkled skin, large yellow eyes, pointed ears, sharp teeth in a menacing grin, wearing leather hood, holding a crude dagger, circular portrait format, dark cave background, fantasy art style'
  },
  {
    id: 'goblin_boss',
    filename: 'goblin_boss.png',
    prompt: 'Portrait of a fierce goblin boss chieftain, larger green-skinned goblin with tribal war paint, golden nose ring, jagged crown, snarling expression showing fangs, wearing crude armor made of bones, circular portrait format, torch-lit background, detailed fantasy art'
  },
  {
    id: 'ogre',
    filename: 'ogre.png',
    prompt: 'Portrait of a massive brutish ogre, pale greyish-brown skin, small beady eyes, huge underbite with tusks, bald head with bumpy skull, dumb angry expression, wearing animal hide vest, circular portrait format, dark swamp background, fantasy monster art'
  },
  {
    id: 'skeleton_warrior',
    filename: 'skeleton_warrior.png',
    prompt: 'Portrait of an undead skeleton warrior, bleached white skull with glowing red eye sockets, rusted iron helmet, tattered cape, ancient and menacing, dark necromantic energy wisps, circular portrait format, crypt background, dark fantasy art'
  },
  {
    id: 'merchant_npc',
    filename: 'merchant_npc.png',
    prompt: 'Portrait of a friendly traveling merchant, middle-aged human with kind eyes, bushy mustache, colorful turban, weathered but cheerful face, gold earring, carrying various wares, circular portrait format, warm tavern background, fantasy RPG art style'
  }
];

/**
 * Call NanoBanana API to generate an image
 */
async function generateImage(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      prompt: prompt,
      model: 'imagen-3.0-fast-generate-001',
      aspectRatio: '1:1',
      personGeneration: 'allow_all',
      numberOfImages: 1
    });

    const options = {
      hostname: 'api.nanobanana.com',
      port: 443,
      path: '/imagine',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': NANOBANANA_API_KEY,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.images && result.images.length > 0) {
            resolve(result.images[0]);
          } else if (result.error) {
            reject(new Error(result.error));
          } else {
            reject(new Error('No images in response'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Download image from URL
 */
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log('Generating AI token portraits...\n');

  for (const token of TOKENS) {
    const filepath = path.join(OUTPUT_DIR, token.filename);

    // Skip if already exists
    if (fs.existsSync(filepath)) {
      console.log(`✓ ${token.id} already exists, skipping`);
      continue;
    }

    console.log(`Generating ${token.id}...`);

    try {
      const imageData = await generateImage(token.prompt);

      if (imageData.url) {
        await downloadImage(imageData.url, filepath);
        console.log(`  ✓ Saved to ${token.filename}`);
      } else if (imageData.base64) {
        const buffer = Buffer.from(imageData.base64, 'base64');
        fs.writeFileSync(filepath, buffer);
        console.log(`  ✓ Saved to ${token.filename}`);
      } else {
        console.log(`  ✗ No image data for ${token.id}`);
      }

      // Rate limiting - wait 2 seconds between requests
      await new Promise(r => setTimeout(r, 2000));

    } catch (error) {
      console.error(`  ✗ Failed: ${error.message}`);
    }
  }

  console.log('\nDone! Token portraits saved to apps/web/public/images/tokens/');
}

main().catch(console.error);
