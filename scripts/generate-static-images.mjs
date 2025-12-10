#!/usr/bin/env node
/**
 * Generate Static Preview Images for Character Builder
 *
 * This script generates AI images for races, classes, and backgrounds using NanoBanana API.
 * Run once and update staticImages.ts with the resulting URLs.
 *
 * Usage:
 *   node scripts/generate-static-images.mjs
 *
 * Environment variables required:
 *   NANOBANANA_API_KEY - Your NanoBanana API key
 */

const NANOBANANA_API_KEY = process.env.NANOBANANA_API_KEY;
const NANOBANANA_API_URL = 'https://api.nanobananaapi.ai/api/v1/nanobanana';

// Race definitions with visual descriptions
const RACES = [
  { id: 'human', name: 'Human', description: 'human adventurer, determined weathered face, strong jaw, medium build, wearing practical travel clothes' },
  { id: 'elf', name: 'Elf', description: 'high elf, gracefully elongated pointed ears, angular cheekbones, almond-shaped luminous eyes, slender elegant build, wearing elven robes' },
  { id: 'dwarf', name: 'Dwarf', description: 'mountain dwarf, broad stocky powerful build, magnificent braided beard with metal beads, wearing dwarven craftwork armor' },
  { id: 'halfling', name: 'Halfling', description: 'halfling, small stature standing 3 feet tall, youthful round friendly face, curly hair, bare large feet, cheerful expression' },
  { id: 'dragonborn', name: 'Dragonborn', description: 'dragonborn, tall reptilian humanoid with scaled skin, draconic head with small horns, powerful muscular build' },
  { id: 'gnome', name: 'Gnome', description: 'rock gnome, very small stature, large curious sparkling eyes, prominent pointed nose, wild hair, mischievous smile' },
  { id: 'half-elf', name: 'Half-Elf', description: 'half-elf, subtle pointed ears, blend of human and elven features, graceful yet sturdy build, charismatic appearance' },
  { id: 'half-orc', name: 'Half-Orc', description: 'half-orc, powerfully muscular build, grayish-green skin, prominent lower tusks, fierce but intelligent eyes' },
  { id: 'tiefling', name: 'Tiefling', description: 'tiefling, curved ram-like horns, solid colored glowing eyes, skin tinted deep red, long tail, mysterious presence' },
];

// Class definitions with visual descriptions
const CLASSES = [
  { id: 'barbarian', name: 'Barbarian', description: 'primal warrior barbarian, minimal fur and leather armor, massive greataxe, tribal war paint, wild hair, intimidating muscular build' },
  { id: 'bard', name: 'Bard', description: 'charismatic bard performer, colorful flamboyant clothes, carrying ornate lute, rapier at hip, confident charming smile' },
  { id: 'cleric', name: 'Cleric', description: 'divine cleric champion, wearing chainmail over holy vestments, glowing holy symbol, mace, radiant divine light' },
  { id: 'druid', name: 'Druid', description: 'nature druid guardian, robes of natural materials with leaves and vines, gnarled wooden staff with crystals, animal companion nearby' },
  { id: 'fighter', name: 'Fighter', description: 'battle-hardened fighter warrior, wearing plate armor with battle damage, longsword and shield, confident stance' },
  { id: 'monk', name: 'Monk', description: 'disciplined monk martial artist, simple practical robes, athletic lean build, meditative calm expression, bandaged hands' },
  { id: 'paladin', name: 'Paladin', description: 'holy paladin knight, gleaming full plate armor with holy symbols, radiant holy sword, cape flowing, noble bearing' },
  { id: 'ranger', name: 'Ranger', description: 'wilderness ranger hunter, wearing green and brown leather armor, longbow and quiver, hooded cloak, forest background' },
  { id: 'rogue', name: 'Rogue', description: 'shadowy rogue infiltrator, wearing dark leather armor, multiple concealed daggers, hooded, mysterious smirk' },
  { id: 'sorcerer', name: 'Sorcerer', description: 'innate sorcerer magic wielder, magical energy crackling around hands, dramatic robes, glowing eyes with arcane power' },
  { id: 'warlock', name: 'Warlock', description: 'pact-bound warlock occultist, dark mysterious robes with eldritch symbols, otherworldly patron shadow looming behind' },
  { id: 'wizard', name: 'Wizard', description: 'scholarly wizard arcane master, wearing robes with arcane embroidery, carrying ancient staff, spellbook, wise expression' },
];

// Background definitions with visual descriptions
const BACKGROUNDS = [
  { id: 'acolyte', name: 'Acolyte', description: 'temple acolyte, wearing simple religious robes, prayer beads, holy symbol pendant, peaceful temple background' },
  { id: 'criminal', name: 'Criminal', description: 'streetwise criminal, dark practical clothes, concealed weapons, shadowy alley background, cunning expression' },
  { id: 'folk-hero', name: 'Folk Hero', description: 'folk hero from humble origins, simple but well-made clothes, farming tools nearby, village background, determined noble expression' },
  { id: 'noble', name: 'Noble', description: 'aristocratic noble, fine expensive clothes with family crest, signet ring, elegant bearing, manor house background' },
  { id: 'sage', name: 'Sage', description: 'scholarly sage, wearing academic robes, surrounded by books and scrolls, reading glasses, library background' },
  { id: 'soldier', name: 'Soldier', description: 'veteran soldier, wearing military uniform with medals, weapon at side, disciplined stance, battlefield background' },
  { id: 'hermit', name: 'Hermit', description: 'secluded hermit, worn simple robes, long unkempt hair, wise ancient eyes, cave or forest dwelling background' },
  { id: 'entertainer', name: 'Entertainer', description: 'traveling entertainer, colorful performer costume, musical instrument or juggling props, stage or tavern background' },
];

// Art style for all images
const ART_STYLE = [
  'official Dungeons and Dragons 5th Edition character illustration',
  'by Larry Elmore',
  'by Todd Lockwood',
  'Players Handbook cover art quality',
  'epic fantasy book cover art',
  'rich color palette with deep shadows',
  'portrait composition',
  'head and shoulders',
  'dramatic lighting',
  'highly detailed',
  'masterpiece quality',
].join(', ');

const NEGATIVE_PROMPT = [
  'bad anatomy', 'wrong anatomy', 'extra limbs', 'missing limbs',
  'anime', 'cartoon', 'chibi', 'modern', 'sci-fi',
  'nude', 'nsfw', 'gore', 'blood',
  'blurry', 'low quality', 'watermark', 'text',
  'deformed', 'ugly', 'duplicate',
].join(', ');

async function generateImage(prompt) {
  if (!NANOBANANA_API_KEY) {
    throw new Error('NANOBANANA_API_KEY environment variable not set');
  }

  const fullPrompt = `${ART_STYLE}, ${prompt}. DO NOT include: ${NEGATIVE_PROMPT}`;

  const requestBody = {
    prompt: fullPrompt,
    type: 'TEXTTOIAMGE',
    numImages: 1,
    image_size: '1:1',
  };

  const response = await fetch(`${NANOBANANA_API_URL}/generate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NANOBANANA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`NanoBanana API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(`NanoBanana API error: ${data.msg}`);
  }

  // If image URL is returned immediately
  if (data.data?.imageUrl) {
    return data.data.imageUrl;
  }
  if (data.data?.imageUrls && data.data.imageUrls.length > 0 && data.data.imageUrls[0]) {
    return data.data.imageUrls[0];
  }

  // For async generation, we need to poll or wait for webhook
  const taskId = data.data?.taskId;
  if (!taskId) {
    throw new Error('No image URL or task ID returned');
  }

  // Poll for result (simple approach for script usage)
  console.log(`    Waiting for task ${taskId}...`);
  for (let i = 0; i < 60; i++) { // Wait up to 60 seconds
    await new Promise(resolve => setTimeout(resolve, 1000));

    const statusResponse = await fetch(`${NANOBANANA_API_URL}/status/${taskId}`, {
      headers: {
        Authorization: `Bearer ${NANOBANANA_API_KEY}`,
      },
    });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();

      if (statusData.data?.imageUrl) {
        return statusData.data.imageUrl;
      }
      if (statusData.data?.imageUrls && statusData.data.imageUrls.length > 0 && statusData.data.imageUrls[0]) {
        return statusData.data.imageUrls[0];
      }
    }
  }

  throw new Error('Timed out waiting for image generation');
}

async function generateAllImages() {
  const results = [];

  console.log('\n=== Generating Race Images ===\n');
  for (const race of RACES) {
    console.log(`Generating ${race.name}...`);
    try {
      const url = await generateImage(race.description);
      results.push({ id: race.id, name: race.name, type: 'race', url });
      console.log(`  ✓ ${race.name}: ${url}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.push({ id: race.id, name: race.name, type: 'race', url: null, error: errorMsg });
      console.log(`  ✗ ${race.name}: ${errorMsg}`);
    }
    // Rate limiting - wait between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n=== Generating Class Images ===\n');
  for (const cls of CLASSES) {
    console.log(`Generating ${cls.name}...`);
    try {
      const url = await generateImage(cls.description);
      results.push({ id: cls.id, name: cls.name, type: 'class', url });
      console.log(`  ✓ ${cls.name}: ${url}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.push({ id: cls.id, name: cls.name, type: 'class', url: null, error: errorMsg });
      console.log(`  ✗ ${cls.name}: ${errorMsg}`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n=== Generating Background Images ===\n');
  for (const bg of BACKGROUNDS) {
    console.log(`Generating ${bg.name}...`);
    try {
      const url = await generateImage(bg.description);
      results.push({ id: bg.id, name: bg.name, type: 'background', url });
      console.log(`  ✓ ${bg.name}: ${url}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.push({ id: bg.id, name: bg.name, type: 'background', url: null, error: errorMsg });
      console.log(`  ✗ ${bg.name}: ${errorMsg}`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return results;
}

function generateStaticImagesCode(results) {
  const races = results.filter(r => r.type === 'race');
  const classes = results.filter(r => r.type === 'class');
  const backgrounds = results.filter(r => r.type === 'background');

  const formatEntry = (r) => {
    if (r.url) {
      return `  '${r.id}': '${r.url}',`;
    }
    return `  // '${r.id}': 'GENERATION_FAILED - ${r.error}',`;
  };

  return `// Static pre-generated images for races, classes, and backgrounds
// Generated using NanoBanana AI on ${new Date().toISOString()}
// These images are generated once and reused for all character creation sessions

// Race preview images
export const RACE_IMAGES: Record<string, string> = {
${races.map(formatEntry).join('\n')}
};

// Class preview images
export const CLASS_IMAGES: Record<string, string> = {
${classes.map(formatEntry).join('\n')}
};

// Background preview images
export const BACKGROUND_IMAGES: Record<string, string> = {
${backgrounds.map(formatEntry).join('\n')}
};

// Helper function to get image URL with fallback
export function getRaceImage(raceId: string): string {
  return RACE_IMAGES[raceId.toLowerCase()] || '/images/placeholders/race-default.png';
}

export function getClassImage(classId: string): string {
  return CLASS_IMAGES[classId.toLowerCase()] || '/images/placeholders/class-default.png';
}

export function getBackgroundImage(backgroundId: string): string {
  return BACKGROUND_IMAGES[backgroundId.toLowerCase()] || '/images/placeholders/background-default.png';
}
`;
}

async function main() {
  console.log('============================================');
  console.log('  D&D Character Builder - Static Image Generator');
  console.log('============================================\n');

  if (!NANOBANANA_API_KEY) {
    console.error('ERROR: NANOBANANA_API_KEY environment variable is not set');
    console.log('\nTo run this script, set your NanoBanana API key:');
    console.log('  export NANOBANANA_API_KEY=your_api_key_here');
    console.log('  node scripts/generate-static-images.mjs\n');
    process.exit(1);
  }

  console.log('This will generate AI images for:');
  console.log(`  - ${RACES.length} races`);
  console.log(`  - ${CLASSES.length} classes`);
  console.log(`  - ${BACKGROUNDS.length} backgrounds`);
  console.log(`  Total: ${RACES.length + CLASSES.length + BACKGROUNDS.length} images\n`);
  console.log('Estimated time: 3-5 minutes\n');
  console.log('Starting generation...\n');

  const results = await generateAllImages();

  console.log('\n============================================');
  console.log('  Generation Complete');
  console.log('============================================\n');

  const successful = results.filter(r => r.url !== null);
  const failed = results.filter(r => r.url === null);

  console.log(`Successfully generated: ${successful.length}/${results.length}`);
  if (failed.length > 0) {
    console.log(`Failed: ${failed.length}`);
    failed.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
  }

  console.log('\n=== Generated staticImages.ts code ===\n');
  const code = generateStaticImagesCode(results);
  console.log(code);

  console.log('\n=== Instructions ===');
  console.log('1. Copy the code above');
  console.log('2. Replace the contents of apps/web/src/data/staticImages.ts');
  console.log('3. Commit and deploy\n');
}

main().catch(console.error);
