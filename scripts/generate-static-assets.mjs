#!/usr/bin/env node
/**
 * Static Asset Generator for D&D Board Game
 *
 * Generates AI images for:
 * - Race previews (9 images)
 * - Class previews (12 images)
 * - Background previews (8 images)
 * - Terrain textures (8 images)
 * - Landing page heroes (3 images)
 *
 * Uses NanoBanana API (Google Gemini-powered)
 *
 * Usage:
 *   node scripts/generate-static-assets.mjs --category=races
 *   node scripts/generate-static-assets.mjs --category=classes
 *   node scripts/generate-static-assets.mjs --category=backgrounds
 *   node scripts/generate-static-assets.mjs --category=terrain
 *   node scripts/generate-static-assets.mjs --category=heroes
 *   node scripts/generate-static-assets.mjs --category=all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NanoBanana API Configuration
const NANOBANANA_API_KEY = process.env.NANOBANANA_API_KEY;
const NANOBANANA_API_URL = 'https://api.nanobananaapi.ai/api/v1/nanobanana';

// Output directory for generated image URLs
const OUTPUT_DIR = path.join(__dirname, '..', 'generated-assets');

// Art style consistent across all images
const ART_STYLE = [
  'official Dungeons and Dragons 5th Edition artwork',
  'by Larry Elmore',
  'by Keith Parkinson',
  'Players Handbook illustration style',
  'epic fantasy art',
  'rich colors with dramatic lighting',
  'highly detailed',
  'professional fantasy illustration',
].join(', ');

const NEGATIVE_PROMPT = [
  'anime', 'cartoon', 'chibi', 'manga', 'pixar', 'disney',
  'blurry', 'low quality', 'ugly', 'deformed', 'bad anatomy',
  'watermark', 'signature', 'text', 'logo',
  'nude', 'nsfw', 'sexual', 'gore', 'blood',
  'modern', 'sci-fi', 'futuristic',
  'photo', 'photorealistic', 'real person',
].join(', ');

// ===== RACE PROMPTS =====
const RACE_PROMPTS = {
  human: {
    name: 'Human',
    prompt: `${ART_STYLE}, portrait of a heroic human adventurer, strong determined face, weathered tanned skin, shoulder-length brown hair, noble bearing, battle-worn but confident, medieval fantasy warrior, dramatic torch lighting, dungeon stone background`,
  },
  elf: {
    name: 'Elf',
    prompt: `${ART_STYLE}, portrait of an elegant high elf, pointed ears, angular ethereal features, luminous almond eyes, long flowing silver hair, ageless otherworldly beauty, graceful and wise, moonlit forest background, magical ambient glow`,
  },
  dwarf: {
    name: 'Dwarf',
    prompt: `${ART_STYLE}, portrait of a stout mountain dwarf, magnificent braided auburn beard with metal clasps, ruddy complexion, deep-set proud eyes, broad nose, warrior spirit, forge fire lighting, stone cavern background`,
  },
  halfling: {
    name: 'Halfling',
    prompt: `${ART_STYLE}, portrait of a cheerful halfling, small stature, round friendly youthful face, rosy cheeks, curly brown hair, large expressive curious eyes, mischievous smile, cozy tavern lighting, warm atmosphere`,
  },
  dragonborn: {
    name: 'Dragonborn',
    prompt: `${ART_STYLE}, portrait of a proud dragonborn warrior, reptilian humanoid, brass metallic scales, draconic head with snout, yellow reptilian eyes, small back-swept horns, powerful noble bearing, volcanic lighting, dramatic smoke`,
  },
  gnome: {
    name: 'Gnome',
    prompt: `${ART_STYLE}, portrait of an inventive rock gnome, very small, huge curious sparkling blue eyes, prominent pointed nose, wild white hair sticking up, excited animated expression, workshop lighting, gears and tools background`,
  },
  'half-elf': {
    name: 'Half-Elf',
    prompt: `${ART_STYLE}, portrait of a graceful half-elf, subtle pointed ears, blend of human and elven beauty, violet eyes, long auburn hair, versatile adaptable appearance, twilight forest lighting, mystical atmosphere`,
  },
  'half-orc': {
    name: 'Half-Orc',
    prompt: `${ART_STYLE}, portrait of a fierce half-orc, muscular imposing build, gray-green skin, prominent lower tusks, amber fierce eyes, tribal scars, black hair in topknot, campfire dramatic lighting, battlefield background`,
  },
  tiefling: {
    name: 'Tiefling',
    prompt: `${ART_STYLE}, portrait of a mysterious tiefling, curved ram horns, solid gold glowing eyes without pupils, deep crimson skin, long black hair, infernal beauty, supernatural allure, hellish red ambient lighting, dark mystical background`,
  },
};

// ===== CLASS PROMPTS =====
const CLASS_PROMPTS = {
  barbarian: {
    name: 'Barbarian',
    prompt: `${ART_STYLE}, portrait of a fierce barbarian berserker, wild untamed hair, tribal war paint, minimal fur armor showing muscular physique, rage in eyes, greataxe weapon, primal warrior, snowy mountain background, battle fury`,
  },
  bard: {
    name: 'Bard',
    prompt: `${ART_STYLE}, portrait of a charismatic bard performer, colorful fine clothes, feathered cap, charming confident smile, holding ornate lute, theatrical flair, tavern stage lighting, audience in background, musical magic`,
  },
  cleric: {
    name: 'Cleric',
    prompt: `${ART_STYLE}, portrait of a holy cleric, polished chainmail over white vestments, glowing holy symbol around neck, divine light emanating, righteous expression, mace weapon, cathedral lighting, stained glass background`,
  },
  druid: {
    name: 'Druid',
    prompt: `${ART_STYLE}, portrait of a wise nature druid, robes of living vines and leaves, antler crown, wooden staff with crystal, wild hair with feathers, one eye glowing green, forest guardian, ancient grove background, natural magic`,
  },
  fighter: {
    name: 'Fighter',
    prompt: `${ART_STYLE}, portrait of a battle-hardened fighter, full plate armor with battle damage, longsword and shield, veteran military bearing, confident warrior stance, red cloak, torch-lit dungeon, ready for combat`,
  },
  monk: {
    name: 'Monk',
    prompt: `${ART_STYLE}, portrait of a disciplined monk, simple saffron robes, shaved head, serene focused expression, martial arts stance, prayer beads, ki energy subtle glow, mountain monastery background, zen atmosphere`,
  },
  paladin: {
    name: 'Paladin',
    prompt: `${ART_STYLE}, portrait of a noble paladin holy knight, gleaming ornate plate armor with gold inlay, glowing holy sword, radiant divine aura, unwavering conviction, white cape, cathedral lighting, righteous presence`,
  },
  ranger: {
    name: 'Ranger',
    prompt: `${ART_STYLE}, portrait of a wilderness ranger tracker, green and brown leather armor, hooded cloak, longbow, alert watchful eyes, camouflage face paint, wolf companion nearby, deep forest background, nature guardian`,
  },
  rogue: {
    name: 'Rogue',
    prompt: `${ART_STYLE}, portrait of a shadowy rogue assassin, dark leather armor, deep hood obscuring face, calculating eyes in shadow, twin daggers, lockpicks visible, lurking in darkness, city alley background, dangerous cunning`,
  },
  sorcerer: {
    name: 'Sorcerer',
    prompt: `${ART_STYLE}, portrait of a powerful innate sorcerer, elegant traveling clothes with scale pattern, arcane energy crackling from hands, glowing eyes, wild magic-touched hair floating, draconic hints, magical storm background`,
  },
  warlock: {
    name: 'Warlock',
    prompt: `${ART_STYLE}, portrait of a mysterious warlock, dark robes with eldritch symbols, deep hood with glowing eyes within, pact weapon of shadow, tome of shadows, otherworldly patron influence visible, void background, forbidden power`,
  },
  wizard: {
    name: 'Wizard',
    prompt: `${ART_STYLE}, portrait of a scholarly arcane wizard, deep blue robes with silver runes, pointed hat with constellations, gnarled staff with crystal orb, long grey beard, wise ancient eyes, library tower background, arcane knowledge`,
  },
};

// ===== BACKGROUND PROMPTS =====
const BACKGROUND_PROMPTS = {
  acolyte: {
    name: 'Acolyte',
    prompt: `${ART_STYLE}, scene of a devoted acolyte in temple, kneeling in prayer, white robes, holy symbol glowing, incense smoke, stained glass windows, divine light rays, peaceful devotion, sacred atmosphere, religious iconography`,
  },
  criminal: {
    name: 'Criminal',
    prompt: `${ART_STYLE}, scene of a cunning criminal in shadows, dark hooded figure, counting gold coins, thieves tools visible, wanted posters on wall, dimly lit back alley, dangerous city streets, moonlight through window, secretive`,
  },
  'folk-hero': {
    name: 'Folk Hero',
    prompt: `${ART_STYLE}, scene of a folk hero among common people, humble farmer clothes, pitchfork or simple weapon, villagers looking with admiration, rural farmland background, golden sunset, rising to destiny, everyday hero`,
  },
  noble: {
    name: 'Noble',
    prompt: `${ART_STYLE}, scene of an aristocratic noble, fine silk clothes, signet ring, regal bearing, grand castle hall, tapestries and chandeliers, servants in background, wealth and privilege, commanding presence, high society`,
  },
  sage: {
    name: 'Sage',
    prompt: `${ART_STYLE}, scene of a learned sage scholar, surrounded by ancient tomes, quill and ink, reading glasses, grand library setting, towering bookshelves, candlelight, dust motes in air, pursuit of knowledge, academic wisdom`,
  },
  soldier: {
    name: 'Soldier',
    prompt: `${ART_STYLE}, scene of a battle-worn soldier, military uniform with insignia of rank, sword and shield, army camp background, tents and banners, other soldiers training, veteran of many battles, disciplined warrior, loyalty`,
  },
  hermit: {
    name: 'Hermit',
    prompt: `${ART_STYLE}, scene of a reclusive hermit, simple robes, mountain cave dwelling, meditation pose, herbs and scrolls around, distant from civilization, deep contemplation, seeking enlightenment, peaceful isolation, wisdom`,
  },
  entertainer: {
    name: 'Entertainer',
    prompt: `${ART_STYLE}, scene of a talented entertainer performing, colorful costume, juggling or playing instrument, crowd cheering, tavern or festival stage, spotlight effect, captivating audience, showmanship, joy and wonder`,
  },
};

// ===== TERRAIN TEXTURE PROMPTS =====
const TERRAIN_PROMPTS = {
  stone_floor: {
    name: 'Stone Floor',
    prompt: `${ART_STYLE}, seamless dungeon stone floor texture, ancient carved flagstones, worn by centuries of footsteps, subtle cracks and moss, top-down view, tileable pattern, gray stone with hints of color, fantasy dungeon aesthetic`,
    aspectRatio: '1:1',
  },
  water: {
    name: 'Water',
    prompt: `${ART_STYLE}, seamless crystal clear water texture, gentle ripples, light playing on surface, underwater pebbles visible, fantasy pond or stream, top-down view, tileable pattern, blue-green magical water`,
    aspectRatio: '1:1',
  },
  lava: {
    name: 'Lava',
    prompt: `${ART_STYLE}, seamless molten lava texture, glowing orange-red magma, cooling black crust, heat distortion, volcanic hellscape, top-down view, tileable pattern, dangerous fiery terrain, ember particles`,
    aspectRatio: '1:1',
  },
  difficult_terrain: {
    name: 'Difficult Terrain',
    prompt: `${ART_STYLE}, seamless rocky difficult terrain texture, scattered rocks and rubble, overgrown with weeds, uneven ground, top-down view, tileable pattern, brown earth with stones, challenging to traverse`,
    aspectRatio: '1:1',
  },
  wall: {
    name: 'Wall',
    prompt: `${ART_STYLE}, seamless dungeon wall texture, ancient stone bricks, mortar between blocks, torch scorch marks, moss in cracks, top-down view showing top of wall, tileable pattern, gray fortress stone`,
    aspectRatio: '1:1',
  },
  door: {
    name: 'Door',
    prompt: `${ART_STYLE}, ornate wooden dungeon door, iron bands and rivets, brass handle and lock, carved decorations, set in stone frame, front view, medieval fantasy door, mysterious what lies beyond`,
    aspectRatio: '1:1',
  },
  stairs: {
    name: 'Stairs',
    prompt: `${ART_STYLE}, stone dungeon stairway, descending into darkness, worn steps, torch brackets on walls, ancient carved railings, top-down angled view, medieval fantasy descent, adventure awaits below`,
    aspectRatio: '1:1',
  },
  pit: {
    name: 'Pit',
    prompt: `${ART_STYLE}, dark bottomless pit trap, crumbling stone edges, darkness below, rope or ladder nearby, dangerous dungeon hazard, top-down view looking into void, fear of falling, fantasy trap`,
    aspectRatio: '1:1',
  },
};

// ===== HERO IMAGE PROMPTS =====
const HERO_PROMPTS = {
  epic_battle: {
    name: 'Epic Battle',
    prompt: `${ART_STYLE}, epic fantasy battle scene, party of adventurers fighting dragon, warrior with sword, wizard casting fireball, rogue dodging, cleric healing, dramatic action poses, dungeon treasure hoard, cinematic wide shot, 16:9 panoramic`,
    aspectRatio: '16:9',
  },
  dungeon_entrance: {
    name: 'Dungeon Entrance',
    prompt: `${ART_STYLE}, mysterious dungeon entrance, massive stone archway with runes, adventuring party silhouettes entering, torchlight piercing darkness, fog rolling out, ancient carved warnings, sense of adventure, 16:9 panoramic`,
    aspectRatio: '16:9',
  },
  tavern_gathering: {
    name: 'Tavern Gathering',
    prompt: `${ART_STYLE}, fantasy tavern scene, diverse adventurers gathered around table, map spread out planning quest, warm firelight, ale mugs, bard playing in corner, camaraderie and anticipation, cozy yet exciting, 16:9 panoramic`,
    aspectRatio: '16:9',
  },
};

// ===== GENERATION FUNCTIONS =====

async function generateImage(prompt, aspectRatio = '1:1') {
  if (!NANOBANANA_API_KEY) {
    console.error('ERROR: NANOBANANA_API_KEY environment variable not set');
    console.log('Set it with: export NANOBANANA_API_KEY=your_key_here');
    process.exit(1);
  }

  const fullPrompt = `${prompt}. DO NOT include: ${NEGATIVE_PROMPT}`;

  const requestBody = {
    prompt: fullPrompt,
    type: 'TEXTTOIAMGE', // Note: NanoBanana API has this typo
    numImages: 1,
    image_size: aspectRatio,
  };

  console.log(`  Calling NanoBanana API...`);

  const response = await fetch(`${NANOBANANA_API_URL}/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NANOBANANA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(`NanoBanana error: ${data.msg}`);
  }

  // Check for immediate image URL
  if (data.data?.imageUrl) {
    return data.data.imageUrl;
  }
  if (data.data?.imageUrls && data.data.imageUrls.length > 0) {
    return data.data.imageUrls[0];
  }

  // If async (webhook required), we need to poll or wait
  // For simplicity, throw error - this script needs synchronous mode
  if (data.data?.taskId) {
    console.log(`  Task ID: ${data.data.taskId}`);
    console.log(`  Waiting for completion (this may take 30-60 seconds)...`);

    // Poll for result
    const imageUrl = await pollForResult(data.data.taskId);
    return imageUrl;
  }

  throw new Error('No image URL or task ID returned');
}

async function pollForResult(taskId, maxAttempts = 30, intervalMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalMs);

    try {
      const response = await fetch(`${NANOBANANA_API_URL}/task/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${NANOBANANA_API_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.info?.resultImageUrl) {
          return data.data.info.resultImageUrl;
        }
        if (data.data?.status === 'completed' && data.data?.imageUrl) {
          return data.data.imageUrl;
        }
      }
    } catch (err) {
      // Continue polling
    }

    process.stdout.write('.');
  }

  throw new Error(`Timeout waiting for task ${taskId}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateCategory(category, prompts) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Generating ${category.toUpperCase()} images`);
  console.log(`${'='.repeat(60)}`);

  const results = {};
  const entries = Object.entries(prompts);

  for (let i = 0; i < entries.length; i++) {
    const [id, config] = entries[i];
    console.log(`\n[${i + 1}/${entries.length}] ${config.name} (${id})`);

    try {
      const imageUrl = await generateImage(config.prompt, config.aspectRatio || '1:1');
      results[id] = {
        name: config.name,
        imageUrl,
        generatedAt: new Date().toISOString(),
      };
      console.log(`  SUCCESS: ${imageUrl.substring(0, 60)}...`);

      // Rate limiting - wait between requests
      await sleep(1000);
    } catch (error) {
      console.error(`  FAILED: ${error.message}`);
      results[id] = {
        name: config.name,
        error: error.message,
        generatedAt: new Date().toISOString(),
      };
    }
  }

  return results;
}

async function saveResults(category, results) {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const outputFile = path.join(OUTPUT_DIR, `${category}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${outputFile}`);

  return outputFile;
}

function generateStaticImagesCode(allResults) {
  const code = `// Auto-generated static images from NanoBanana API
// Generated on: ${new Date().toISOString()}
// DO NOT EDIT MANUALLY - Run scripts/generate-static-assets.mjs to regenerate

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

export const TERRAIN_IMAGES: Record<string, string> = {
${Object.entries(allResults.terrain || {})
  .filter(([_, v]) => v.imageUrl)
  .map(([id, v]) => `  '${id}': '${v.imageUrl}',`)
  .join('\n')}
};

export const HERO_IMAGES: Record<string, string> = {
${Object.entries(allResults.heroes || {})
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

export function getTerrainImage(terrainId: string): string {
  return TERRAIN_IMAGES[terrainId] || '';
}

export function getHeroImage(heroId: string): string {
  return HERO_IMAGES[heroId] || '';
}
`;

  return code;
}

async function main() {
  const args = process.argv.slice(2);
  const categoryArg = args.find(a => a.startsWith('--category='));
  const category = categoryArg ? categoryArg.split('=')[1] : 'all';

  console.log('\n=== D&D Static Asset Generator ===\n');
  console.log(`Category: ${category}`);
  console.log(`API Key: ${NANOBANANA_API_KEY ? 'Set (' + NANOBANANA_API_KEY.substring(0, 8) + '...)' : 'NOT SET'}`);

  if (!NANOBANANA_API_KEY) {
    console.error('\nERROR: NANOBANANA_API_KEY environment variable is required');
    console.log('\nSet it with:');
    console.log('  Linux/Mac: export NANOBANANA_API_KEY=your_key_here');
    console.log('  Windows:   set NANOBANANA_API_KEY=your_key_here');
    process.exit(1);
  }

  const allResults = {};

  // Load existing results if any
  const existingFiles = ['races', 'classes', 'backgrounds', 'terrain', 'heroes'];
  for (const file of existingFiles) {
    const filePath = path.join(OUTPUT_DIR, `${file}.json`);
    if (fs.existsSync(filePath)) {
      try {
        allResults[file] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (e) {
        // Ignore
      }
    }
  }

  // Generate requested category
  if (category === 'races' || category === 'all') {
    allResults.races = await generateCategory('races', RACE_PROMPTS);
    await saveResults('races', allResults.races);
  }

  if (category === 'classes' || category === 'all') {
    allResults.classes = await generateCategory('classes', CLASS_PROMPTS);
    await saveResults('classes', allResults.classes);
  }

  if (category === 'backgrounds' || category === 'all') {
    allResults.backgrounds = await generateCategory('backgrounds', BACKGROUND_PROMPTS);
    await saveResults('backgrounds', allResults.backgrounds);
  }

  if (category === 'terrain' || category === 'all') {
    allResults.terrain = await generateCategory('terrain', TERRAIN_PROMPTS);
    await saveResults('terrain', allResults.terrain);
  }

  if (category === 'heroes' || category === 'all') {
    allResults.heroes = await generateCategory('heroes', HERO_PROMPTS);
    await saveResults('heroes', allResults.heroes);
  }

  // Generate TypeScript code
  const staticImagesCode = generateStaticImagesCode(allResults);
  const staticImagesPath = path.join(__dirname, '..', 'apps', 'web', 'src', 'data', 'staticImages.ts');
  fs.writeFileSync(staticImagesPath, staticImagesCode);
  console.log(`\nUpdated: ${staticImagesPath}`);

  // Summary
  console.log('\n=== GENERATION SUMMARY ===\n');

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const [cat, results] of Object.entries(allResults)) {
    const success = Object.values(results).filter(r => r.imageUrl).length;
    const failed = Object.values(results).filter(r => r.error).length;
    console.log(`${cat}: ${success} succeeded, ${failed} failed`);
    totalSuccess += success;
    totalFailed += failed;
  }

  console.log(`\nTOTAL: ${totalSuccess} images generated, ${totalFailed} failed`);
  console.log(`\nEstimated cost: ~$${(totalSuccess * 0.03).toFixed(2)}`);
}

main().catch(console.error);
