# Document 35: AI Image Generation Guide

## Purpose
This document provides **comprehensive prompt engineering templates** for generating stunning, consistent fantasy imagery that brings user and DM imagination to life. Use these prompts with Stable Diffusion XL, Midjourney, or similar AI image generators.

---

## 1. Core Prompt Architecture

### 1.1 Universal Prompt Structure

```
[STYLE PREFIX] [SUBJECT] [DETAILS] [ENVIRONMENT] [LIGHTING] [MOOD] [QUALITY SUFFIX]
```

### 1.2 Quality Suffix (Always Include)
```
masterpiece, best quality, highly detailed, sharp focus, 8k uhd, professional lighting, 
cinematic composition, award-winning, artstation trending
```

### 1.3 Negative Prompt (Always Include)
```
low quality, blurry, pixelated, jpeg artifacts, watermark, signature, text, 
deformed, ugly, duplicate, morbid, mutilated, poorly drawn face, mutation, 
extra limbs, extra fingers, missing limbs, bad anatomy, bad proportions, 
gross proportions, malformed limbs, disfigured, out of frame, amateur, 
cartoon (unless requested), 3d render (unless requested)
```

---

## 2. Character Portrait Generation

### 2.1 Base Character Portrait Prompt
```typescript
interface CharacterPromptParams {
  race: string;
  gender: string;
  class: string;
  age: 'young' | 'adult' | 'middle-aged' | 'elderly';
  expression: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  skinTone: string;
  distinguishingFeatures: string[];
  equipment: string[];
  background: string;
}

function buildCharacterPrompt(params: CharacterPromptParams): string {
  return `
    fantasy character portrait, ${params.race} ${params.gender} ${params.class},
    ${params.age} age, ${params.expression} expression,
    ${params.hairColor} ${params.hairStyle} hair, ${params.eyeColor} eyes,
    ${params.skinTone} skin, ${params.distinguishingFeatures.join(', ')},
    wearing ${params.equipment.join(', ')},
    ${params.background} background,
    dramatic rim lighting, warm key light, deep shadows,
    head and shoulders portrait, 3/4 angle view,
    painterly style, oil painting texture, rich colors,
    masterpiece, highly detailed, sharp focus, 8k
  `.trim();
}
```

### 2.2 Race-Specific Prompts

#### Human
```
human fantasy character, realistic proportions, expressive face, 
{skin_tone} complexion, weathered features for warriors / refined features for nobles,
natural hair colors or exotic (white, silver for mages)
```

#### Elf
```
elegant elven character, graceful features, pointed ears clearly visible,
high cheekbones, almond-shaped eyes, ethereal beauty,
slender build, ageless appearance, otherworldly aura,
luminous skin with subtle glow, flowing hair
```

#### Dwarf
```
stout dwarven character, broad shoulders, muscular build,
thick luxurious beard (male) / braided hair (female),
weathered skin, deep-set determined eyes,
intricate braids, clan jewelry, runic decorations,
powerful stance, grounded presence
```

#### Halfling
```
cheerful halfling character, youthful round face, bright curious eyes,
shorter stature, bare feet with furry tops,
warm friendly expression, rosy cheeks,
practical comfortable clothing, hidden pockets
```

#### Dragonborn
```
majestic dragonborn character, reptilian humanoid, scaled skin,
draconic head with snout, sharp teeth visible,
{color} scales matching ancestry (red, blue, green, etc.),
no hair, possibly horns or frills,
muscular powerful build, tail optional,
fierce proud expression, elemental hints in eyes
```

#### Tiefling
```
striking tiefling character, infernal heritage visible,
horns (curved, straight, or spiral), solid colored eyes (red, gold, silver),
{skin_tone} skin (red, purple, blue, or human tones),
pointed tail, sharp canines,
otherworldly beauty, hint of danger,
possibly small fangs, clawed fingernails
```

### 2.3 Class-Specific Equipment & Styling

#### Fighter/Warrior
```
battle-worn plate armor, sword and shield,
military bearing, confident stance,
scars from past battles, practical equipment,
red cape or house colors, medal or insignia
```

#### Wizard/Mage
```
flowing robes with arcane symbols, staff or spellbook,
mystical energy crackling around hands,
wise or intense expression, ancient tomes,
crystal focus, constellation patterns on clothing,
glowing runes, ethereal familiar nearby
```

#### Rogue/Thief
```
dark leather armor, hood shadowing face,
daggers at belt, lockpicks visible,
alert watchful expression, ready stance,
urban camouflage colors, hidden pockets,
slight smirk, one eye catching light
```

#### Cleric/Priest
```
holy vestments with deity symbols, sacred weapon (mace, hammer),
divine light emanating softly, prayer beads,
serene or determined expression,
holy symbol prominently displayed,
white and gold colors, healing energy around hands
```

#### Barbarian
```
minimal fur and leather armor, massive weapon,
tribal tattoos, war paint on face,
primal fury in eyes, powerful muscles,
trophy bones or teeth as decoration,
wild untamed hair, battle scars proudly shown
```

#### Paladin
```
gleaming full plate armor, holy sword and shield,
radiant divine energy surrounding,
noble bearing, resolute expression,
deity's symbol on shield and tabard,
celestial light from above, righteous stance
```

### 2.4 Expression Library

```typescript
const EXPRESSIONS = {
  // Positive
  heroic: "determined confident expression, steely gaze, set jaw",
  wise: "knowing eyes, slight smile, contemplative look",
  friendly: "warm smile, kind eyes, approachable demeanor",
  triumphant: "victorious expression, proud stance, raised chin",
  serene: "peaceful expression, calm eyes, inner tranquility",
  
  // Neutral
  stoic: "unreadable expression, guarded eyes, neutral stance",
  mysterious: "enigmatic smile, knowing look, secrets behind eyes",
  focused: "intense concentration, narrowed eyes, determined set",
  
  // Intense
  fierce: "battle rage, bared teeth, wild eyes",
  threatening: "menacing glare, shadowed features, implied violence",
  anguished: "pain in eyes, furrowed brow, emotional turmoil",
  terrified: "wide fearful eyes, pale face, visible dread",
  
  // Magical
  channeling: "glowing eyes, power emanating, arcane focus",
  divine: "eyes filled with holy light, beatific expression",
  corrupted: "dark energy swirling, twisted smile, wrong feeling"
};
```

---

## 3. Location & Environment Generation

### 3.1 Base Location Prompt Structure
```typescript
interface LocationPromptParams {
  setting: string;
  timeOfDay: string;
  weather: string;
  mood: string;
  features: string[];
  lighting: string;
  perspective: string;
}

function buildLocationPrompt(params: LocationPromptParams): string {
  return `
    fantasy landscape, ${params.setting},
    ${params.timeOfDay}, ${params.weather} weather,
    ${params.mood} atmosphere,
    featuring ${params.features.join(', ')},
    ${params.lighting} lighting,
    ${params.perspective} view,
    epic scale, sense of wonder,
    matte painting style, concept art quality,
    dramatic composition, rich color palette,
    masterpiece, highly detailed, 8k resolution
  `.trim();
}
```

### 3.2 Setting Templates

#### Dungeon/Underground
```
ancient underground dungeon, massive stone chambers,
crumbling pillars, moss-covered walls,
flickering torchlight casting long shadows,
mysterious symbols carved in stone,
sense of ancient evil, treasure glints in darkness,
cobwebs, dust particles in light beams,
bottomless chasms, rickety bridges
```

#### Forest/Wilderness
```
enchanted ancient forest, towering trees with massive trunks,
dappled sunlight through canopy, mystical fog,
bioluminescent plants, fairy lights,
hidden pathways, ancient standing stones,
wildlife glimpsed between trees,
carpet of fallen leaves, babbling brook
```

#### Castle/Fortress
```
imposing medieval castle, towering spires,
massive stone walls, fluttering banners,
drawbridge over moat, arrow slits,
guards patrolling battlements,
heraldic symbols, Gothic architecture,
sense of history and power
```

#### Village/Town
```
quaint fantasy village, cobblestone streets,
half-timbered buildings, thatched roofs,
market square with colorful stalls,
smoke rising from chimneys,
villagers going about daily life,
tavern with hanging sign, blacksmith's forge
```

#### Cave System
```
vast underground cavern, stalactites and stalagmites,
underground lake with mirror surface,
bioluminescent crystals providing dim light,
ancient dwarven carvings on walls,
hidden passages, mineral deposits glittering,
echoing emptiness, sense of depth
```

#### Planar/Otherworldly
```
alien otherworldly landscape, impossible geometry,
floating islands, inverted mountains,
multiple moons in strange colored sky,
reality-bending architecture,
ethereal energy flows, cosmic phenomena,
sense of the infinite and unknowable
```

### 3.3 Lighting Scenarios

```typescript
const LIGHTING = {
  // Natural
  sunrise: "golden hour light, long shadows, warm orange glow, hope",
  midday: "bright sunlight, harsh shadows, clear visibility, stark",
  sunset: "dramatic red and purple sky, silhouettes, romantic",
  moonlight: "silver ethereal glow, deep blue shadows, mysterious",
  overcast: "soft diffused light, muted colors, melancholy",
  
  // Artificial
  torchlight: "warm flickering orange, dancing shadows, intimate",
  candlelight: "soft golden pools, deep darkness beyond, cozy",
  magical: "emanating glow from source, unnatural colors, otherworldly",
  firelight: "warm crackling glow, red-orange, primal comfort",
  
  // Dramatic
  lightning: "stark white flash, frozen moment, dramatic contrast",
  divine: "rays from above, golden holy light, heavenly",
  infernal: "red hellish glow from below, ominous, threatening",
  bioluminescent: "soft blue-green glow, alien beauty, wonder"
};
```

### 3.4 Weather Effects

```typescript
const WEATHER = {
  clear: "crystal clear sky, perfect visibility, crisp air",
  rain: "heavy rainfall, puddles reflecting, wet surfaces gleaming",
  storm: "dark thunderclouds, lightning strikes, dramatic",
  snow: "gentle snowfall, pristine white blanket, peaceful cold",
  blizzard: "howling wind, zero visibility, survival stakes",
  fog: "thick mist, obscured shapes, mysterious atmosphere",
  sandstorm: "swirling sand, harsh conditions, survival",
  magical_storm: "arcane lightning, reality tears, wild magic"
};
```

---

## 4. Monster & Creature Generation

### 4.1 Monster Portrait Template
```
terrifying fantasy monster, [CREATURE_TYPE],
[SIZE] creature, [BODY_DESCRIPTION],
[DISTINCTIVE_FEATURES],
[THREATENING_ELEMENTS],
[ENVIRONMENT] background,
menacing pose, predatory stance,
dramatic lighting emphasizing threat,
dark fantasy art style, detailed textures,
masterpiece quality, frightening atmosphere
```

### 4.2 Classic Monster Prompts

#### Dragon
```
ancient magnificent dragon, [COLOR] scales,
massive wingspan, powerful muscular body,
intelligent malevolent eyes, smoke from nostrils,
treasure hoard visible, cavernous lair,
sense of immense age and power,
scales catching light, battle scars,
overwhelming presence, apex predator
```

#### Beholder
```
horrific beholder, floating spherical body,
large central eye, mouth of sharp teeth,
multiple eyestalks each with unique eye,
reality-warping presence, alien intelligence,
dark dungeon background, victims petrified,
wrongness made manifest, eldritch horror
```

#### Mind Flayer
```
terrifying mind flayer illithid, purple rubbery skin,
octopus-like head with tentacles,
blank white eyes, flowing dark robes,
psionically glowing, superior intellect,
alien technology and architecture,
sense of incomprehensible evil
```

#### Undead (Skeleton/Zombie)
```
shambling undead creature, decaying flesh,
exposed bone, tattered burial clothes,
empty eye sockets with pinpoints of light,
reaching grasping hands, eternal hunger,
graveyard or dungeon setting,
horror atmosphere, death incarnate
```

#### Demon
```
terrifying demon from the abyss, [TYPE],
unnatural muscular form, leathery wings,
burning eyes, sharp claws and fangs,
hellfire emanating, sulfurous smoke,
infernal symbols branded on flesh,
pure malevolence, corruption incarnate
```

---

## 5. Item & Equipment Generation

### 5.1 Weapon Prompts

#### Legendary Sword
```
legendary magical sword, ornate blade,
glowing runes along edge, perfect balance,
jeweled crossguard, wrapped leather grip,
faint ethereal glow, ancient craftsmanship,
floating on dark background, dramatic lighting,
game item icon style, clean presentation
```

#### Magic Staff
```
powerful wizard's staff, gnarled ancient wood,
crystal orb mounted at top, glowing with power,
carved runes along shaft, magical energy wisps,
old and powerful, arcane focus,
icon presentation, detailed craftsmanship
```

### 5.2 Armor Prompts

```
legendary plate armor set, ornate metalwork,
[METAL_TYPE] with [ACCENT_COLOR] trim,
deity/faction symbols, battle-worn but maintained,
perfect craftsmanship, magical enchantments visible,
dramatic presentation, floating display,
game item icon style
```

### 5.3 Magic Items

```
magical artifact [ITEM_TYPE], ancient and powerful,
glowing with arcane energy, [COLOR] light emanating,
intricate design, mysterious runes,
sense of immense power, artifact tier,
dark background, dramatic lighting,
icon presentation style
```

---

## 6. Scene Composition & Storytelling

### 6.1 Battle Scene
```
epic fantasy battle scene, [HEROES] versus [ENEMIES],
dynamic action poses, spells flying,
weapons clashing, dramatic moment frozen,
[ENVIRONMENT] battlefield,
particles and debris, magical effects,
cinematic composition, movie poster quality,
dramatic lighting, sense of stakes
```

### 6.2 Dramatic Moment
```
dramatic fantasy scene, [CHARACTERS],
[ACTION/SITUATION], emotional intensity,
[ENVIRONMENT] setting, [TIME_OF_DAY],
cinematic framing, key moment frozen,
rich atmosphere, storytelling composition,
concept art quality, emotional impact
```

### 6.3 Discovery Scene
```
moment of discovery, [CHARACTER] finding [OBJECT/PLACE],
wonder and awe on face, dramatic reveal,
light source illuminating discovery,
[ENVIRONMENT] context,
sense of importance, turning point,
cinematic composition, rich detail
```

---

## 7. Style Modifiers

### 7.1 Art Styles

```typescript
const ART_STYLES = {
  // Realistic Fantasy
  realistic: "photorealistic fantasy art, detailed textures, lifelike",
  painterly: "oil painting style, visible brushstrokes, classical art",
  
  // Stylized
  anime: "anime art style, clean lines, expressive eyes, vibrant",
  comic: "comic book style, bold lines, dynamic colors, action",
  cartoon: "stylized cartoon, exaggerated features, friendly",
  
  // Dark/Mature
  dark_fantasy: "dark fantasy, gothic, horror elements, gritty",
  grimdark: "grimdark aesthetic, brutal, realistic violence, bleak",
  
  // Ethereal
  ethereal: "dreamlike quality, soft edges, magical atmosphere",
  celestial: "divine light, heavenly, pure, radiant",
  
  // Technical
  concept_art: "professional concept art, clean presentation",
  matte_painting: "matte painting style, epic landscapes",
  
  // Period
  medieval: "medieval manuscript style, illuminated, gold leaf",
  art_nouveau: "art nouveau style, flowing lines, organic shapes"
};
```

### 7.2 Color Palettes

```typescript
const COLOR_PALETTES = {
  // Mood-based
  heroic: "warm golds, deep blues, rich reds, triumphant colors",
  dark: "desaturated, deep shadows, accent of red or purple",
  mystical: "purples, teals, silver, ethereal glows",
  natural: "earth tones, greens, browns, natural lighting",
  
  // Element-based
  fire: "oranges, reds, yellows, warm blacks",
  ice: "whites, pale blues, silver, crystalline",
  nature: "greens, browns, golden sunlight",
  shadow: "deep purples, blacks, hints of sickly green",
  
  // Faction-based
  holy: "whites, golds, soft blues, radiant",
  infernal: "reds, blacks, hellfire orange",
  fey: "vibrant greens, pinks, purples, magical sparkles",
  undead: "grays, blacks, sickly greens, cold blues"
};
```

---

## 8. Dynamic Prompt Generation

### 8.1 User Description Parser

```typescript
interface UserDescription {
  rawText: string;
  extractedElements: {
    subject: string;
    attributes: string[];
    environment: string;
    mood: string;
    action: string;
  };
}

function parseUserDescription(input: string): UserDescription {
  // Use NLP to extract key elements
  const elements = extractKeyElements(input);
  
  return {
    rawText: input,
    extractedElements: {
      subject: elements.subject || 'fantasy character',
      attributes: elements.attributes || [],
      environment: elements.environment || 'mysterious background',
      mood: elements.mood || 'dramatic',
      action: elements.action || 'standing pose'
    }
  };
}

function generatePromptFromDescription(desc: UserDescription): string {
  const { subject, attributes, environment, mood, action } = desc.extractedElements;
  
  return `
    ${mood} fantasy art, ${subject},
    ${attributes.join(', ')},
    ${action},
    ${environment},
    masterpiece quality, highly detailed,
    dramatic lighting, cinematic composition,
    8k resolution, sharp focus
  `.trim();
}
```

### 8.2 Campaign Context Integration

```typescript
interface CampaignContext {
  setting: 'high_fantasy' | 'dark_fantasy' | 'sword_and_sorcery';
  currentLocation: string;
  timeOfDay: string;
  weather: string;
  mood: string;
  recentEvents: string[];
}

function buildContextualPrompt(
  basePrompt: string, 
  context: CampaignContext
): string {
  const settingStyle = getSettingStyle(context.setting);
  const environmentMods = buildEnvironmentMods(context);
  
  return `
    ${settingStyle},
    ${basePrompt},
    ${environmentMods},
    consistent with campaign aesthetic
  `.trim();
}
```

---

## 9. Consistency Guidelines

### 9.1 Character Consistency
To maintain character appearance across multiple images:

```
// Include in every prompt for the same character:
[CHARACTER_NAME] character, previously established appearance,
[SPECIFIC_FEATURES_LIST],
[SIGNATURE_EQUIPMENT],
maintaining consistent design
```

### 9.2 World Consistency
```
// Include in every prompt for the same campaign:
[CAMPAIGN_NAME] setting aesthetic,
[WORLD_STYLE] art direction,
consistent lighting and color palette,
established visual language
```

### 9.3 Session Seed
Use consistent seed values for related images:
```typescript
const sessionSeed = generateSessionSeed(campaignId, sessionNumber);
// Use this seed for all images in the session for visual consistency
```

---

## 10. Integration Code

### 10.1 Complete Generation Function

```typescript
// services/media-service/src/generators/promptBuilder.ts

export class PromptBuilder {
  private stylePrefix: string;
  private qualitySuffix: string;
  private negativePrompt: string;

  constructor(campaignStyle: ArtStyle = 'fantasy_painterly') {
    this.stylePrefix = ART_STYLES[campaignStyle];
    this.qualitySuffix = QUALITY_SUFFIX;
    this.negativePrompt = NEGATIVE_PROMPT;
  }

  buildCharacterPortrait(params: CharacterPromptParams): GenerationPrompt {
    const racePrompt = RACE_PROMPTS[params.race];
    const classPrompt = CLASS_PROMPTS[params.class];
    const expression = EXPRESSIONS[params.expression];

    const prompt = `
      ${this.stylePrefix},
      character portrait, ${params.race} ${params.gender},
      ${racePrompt},
      ${classPrompt},
      ${expression},
      ${params.hairColor} ${params.hairStyle} hair,
      ${params.eyeColor} eyes, ${params.skinTone} skin,
      ${params.distinguishingFeatures?.join(', ') || ''},
      dramatic portrait lighting, 3/4 view,
      ${this.qualitySuffix}
    `.replace(/\s+/g, ' ').trim();

    return {
      prompt,
      negativePrompt: this.negativePrompt,
      dimensions: { width: 512, height: 512 },
      seed: params.seed
    };
  }

  buildLocationArt(params: LocationPromptParams): GenerationPrompt {
    const setting = SETTINGS[params.setting];
    const lighting = LIGHTING[params.lighting];
    const weather = WEATHER[params.weather];

    const prompt = `
      ${this.stylePrefix},
      fantasy landscape, ${params.setting},
      ${setting},
      ${params.timeOfDay}, ${weather},
      ${lighting},
      ${params.features.join(', ')},
      ${params.mood} atmosphere,
      epic scale, matte painting quality,
      ${this.qualitySuffix}
    `.replace(/\s+/g, ' ').trim();

    return {
      prompt,
      negativePrompt: this.negativePrompt,
      dimensions: { width: 1920, height: 1080 },
      seed: params.seed
    };
  }

  buildFromUserDescription(
    description: string,
    type: 'character' | 'location' | 'item' | 'scene',
    context?: CampaignContext
  ): GenerationPrompt {
    const parsed = parseUserDescription(description);
    let prompt = generatePromptFromDescription(parsed);

    if (context) {
      prompt = buildContextualPrompt(prompt, context);
    }

    const dimensions = {
      character: { width: 512, height: 512 },
      location: { width: 1920, height: 1080 },
      item: { width: 512, height: 512 },
      scene: { width: 1920, height: 1080 }
    }[type];

    return {
      prompt: `${this.stylePrefix}, ${prompt}, ${this.qualitySuffix}`,
      negativePrompt: this.negativePrompt,
      dimensions
    };
  }
}
```

---

## 11. Example Generations

### 11.1 DM Describes: "A mysterious elven sorceress with silver hair"

**Generated Prompt:**
```
fantasy painterly style, character portrait, elf female,
elegant elven character, graceful features, pointed ears clearly visible,
high cheekbones, almond-shaped eyes, ethereal beauty,
sorceress class, flowing robes with arcane symbols,
mystical energy crackling around hands,
mysterious enigmatic expression, knowing look, secrets behind eyes,
silver flowing hair, violet glowing eyes, pale luminous skin,
dramatic portrait lighting, 3/4 view,
masterpiece, best quality, highly detailed, sharp focus, 8k uhd
```

### 11.2 Player Describes: "My dwarf is angry, covered in blood after battle"

**Generated Prompt:**
```
dark fantasy style, character portrait, dwarf male,
stout dwarven character, broad shoulders, muscular build,
thick luxurious beard with battle braids,
warrior class, battle-worn plate armor, massive war axe,
fierce battle rage expression, bared teeth, wild eyes,
brown braided beard, amber determined eyes, weathered tan skin,
covered in enemy blood, fresh from combat, victorious fury,
dramatic harsh lighting, 3/4 view,
masterpiece, best quality, highly detailed, sharp focus, 8k uhd
```

---

**END OF DOCUMENT 35**
