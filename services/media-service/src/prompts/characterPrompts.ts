// Character Portrait Prompt Builder
// Generates D&D-appropriate prompts for character portraits

export interface Character {
  race: string;
  class: string;
  background?: string;
  name?: string;
  appearance?: {
    hairColor?: string;
    hairStyle?: string;
    eyeColor?: string;
    skinTone?: string;
    facialHair?: string;
    distinguishingMarks?: string;
  };
  personality?: {
    trait?: string;
    ideal?: string;
    bond?: string;
    flaw?: string;
  };
}

export interface PromptConfig {
  prompt: string;
  negativePrompt: string;
}

export function buildCharacterPortraitPrompt(character: Character): PromptConfig {
  const { race, class: charClass, appearance, personality } = character;

  // Core description
  const coreDescription = [
    'fantasy character portrait',
    'dungeons and dragons art style',
    'detailed digital painting',
    getRaceDescription(race),
    getClassAppearance(charClass),
  ];

  // Physical features
  const physicalFeatures = [
    appearance?.hairColor && `${appearance.hairColor} hair`,
    appearance?.hairStyle && `${appearance.hairStyle} hairstyle`,
    appearance?.eyeColor && `${appearance.eyeColor} eyes`,
    appearance?.skinTone && `${appearance.skinTone} skin`,
    appearance?.facialHair && `${appearance.facialHair}`,
    appearance?.distinguishingMarks && appearance.distinguishingMarks,
  ].filter(Boolean);

  // Expression from personality
  const expression = getExpressionFromPersonality(personality);

  // SAFETY: Mandatory terms
  const safetyTerms = [
    'fully clothed',
    'appropriate fantasy armor and attire',
    'heroic pose',
    'professional illustration',
    'family friendly',
  ];

  // Quality terms
  const qualityTerms = [
    'masterpiece',
    'best quality',
    'highly detailed',
    'sharp focus',
    'dramatic lighting',
    'rich colors',
  ];

  const prompt = [...coreDescription, ...physicalFeatures, expression, ...safetyTerms, ...qualityTerms]
    .filter(Boolean)
    .join(', ');

  // SAFETY: Mandatory negative prompt
  const negativePrompt = [
    'nude',
    'naked',
    'nsfw',
    'sexual',
    'suggestive',
    'revealing clothing',
    'bikini',
    'lingerie',
    'gore',
    'blood',
    'violent',
    'disturbing',
    'deformed',
    'ugly',
    'blurry',
    'low quality',
    'bad anatomy',
    'extra limbs',
    'mutated',
    'watermark',
    'signature',
    'text',
  ].join(', ');

  return { prompt, negativePrompt };
}

// Race descriptions
function getRaceDescription(race: string): string {
  const descriptions: Record<string, string> = {
    human: 'human, realistic proportions, noble bearing',
    elf: 'elf, pointed ears, elegant angular features, ethereal beauty, ageless appearance',
    dwarf: 'dwarf, stocky muscular build, magnificent beard, rugged features, proud stance',
    halfling: 'halfling, small stature, youthful cheerful face, curly hair, bare hairy feet',
    dragonborn: 'dragonborn, reptilian humanoid, scaled skin, draconic head, powerful build',
    tiefling: 'tiefling, demonic horns, solid colored eyes, pointed tail, infernal heritage',
    gnome: 'gnome, very small, large curious eyes, pointed nose, wild hair',
    'half-elf': 'half-elf, slightly pointed ears, blend of human and elven grace',
    'half-orc': 'half-orc, muscular imposing build, prominent lower tusks, grayish-green skin',
    aasimar: 'aasimar, celestial beauty, faint golden glow, radiant eyes, angelic features',
    goliath: 'goliath, massive towering humanoid, gray skin, bald, tribal markings',
    firbolg: 'firbolg, tall gentle giant, cow-like nose, bluish skin, forest dweller',
    tabaxi: 'tabaxi, cat-like humanoid, feline features, spotted or striped fur, agile',
    kenku: 'kenku, raven-like humanoid, black feathers, beak, dark eyes',
    tortle: 'tortle, turtle-like humanoid, shell on back, wise ancient eyes',
  };

  return descriptions[race.toLowerCase()] || 'fantasy humanoid';
}

// Class appearances
function getClassAppearance(charClass: string): string {
  const appearances: Record<string, string> = {
    fighter: 'wearing practical plate armor, sword at hip, battle-ready stance, military bearing',
    wizard: 'wearing elegant arcane robes, holding ornate staff, mystical symbols, scholarly',
    rogue: 'wearing dark leather armor, hooded cloak, daggers visible, shadowy mysterious',
    cleric: 'wearing chainmail with holy vestments, sacred symbol prominent, divine presence',
    paladin: 'wearing brilliant shining plate armor, holy sword, radiant confident, noble',
    ranger: 'wearing practical leather and fur, bow and quiver, woodsman attire, alert',
    barbarian: 'wearing minimal fur and leather armor, muscular powerful build, tribal tattoos, fierce',
    bard: 'wearing colorful flamboyant clothes, musical instrument, charming smile, theatrical',
    druid: 'wearing natural materials leaves and vines, wooden staff, wild hair, connected to nature',
    monk: 'wearing simple practical robes, bare hands ready, serene focused expression',
    sorcerer: 'wearing elegant clothes, magical energy crackling, confident natural power',
    warlock: 'wearing dark mysterious robes, eldritch symbols, otherworldly presence, haunted eyes',
    artificer: 'wearing practical work clothes, tools and gadgets, goggles, inventive curious',
    blood_hunter: 'wearing scarred leather armor, crimson accents, grim determined, monster hunter',
  };

  return appearances[charClass.toLowerCase()] || 'adventurer gear and equipment';
}

// Expression from personality
function getExpressionFromPersonality(
  personality?: Character['personality']
): string {
  if (!personality) return 'determined heroic expression';

  const { trait, flaw, ideal } = personality;
  const combined = `${trait || ''} ${flaw || ''} ${ideal || ''}`.toLowerCase();

  if (combined.includes('friendly') || combined.includes('kind')) return 'warm friendly smile';
  if (combined.includes('suspicious') || combined.includes('trust')) return 'wary guarded expression';
  if (combined.includes('proud') || combined.includes('arrogant')) return 'confident proud expression';
  if (combined.includes('curious') || combined.includes('knowledge')) return 'curious intelligent gaze';
  if (combined.includes('angry') || combined.includes('revenge')) return 'fierce intense stare';
  if (combined.includes('sad') || combined.includes('loss')) return 'melancholy thoughtful expression';
  if (combined.includes('brave') || combined.includes('courage')) return 'bold fearless expression';
  if (combined.includes('shy') || combined.includes('quiet')) return 'reserved gentle expression';

  return 'determined heroic expression';
}

// Style-specific prompt additions
export function addStyleTerms(basePrompt: string, style: string): string {
  const styleTerms: Record<string, string> = {
    portrait: 'head and shoulders portrait, facing slightly to side, eye contact',
    full_body: 'full body standing pose, head to toe visible, dynamic stance',
    action_pose: 'dynamic action pose, mid-movement, dramatic angle, combat ready',
  };

  return `${basePrompt}, ${styleTerms[style] || styleTerms.portrait}`;
}
