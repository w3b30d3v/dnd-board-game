# Document 43: Character Builder - Personality Generation & Visual Progression

## Purpose

This document specifies:
1. **Auto-generation of personality traits** with content safety
2. **Progressive character visualization** that builds up through each step
3. **Content safety guidelines** for all generated content

---

# PART 1: PERSONALITY TRAIT GENERATION

## 1.1 Overview

Each personality field has a "Generate" button (🎲) that creates appropriate, lore-friendly content. All generated text is:
- **Clean** - No expletives, profanity, or inappropriate content
- **Lore-appropriate** - Fits D&D fantasy setting
- **Character-contextual** - Based on race, class, and background selected

## 1.2 UI Component

```tsx
// components/character-builder/PersonalityField.tsx

interface PersonalityFieldProps {
  label: string;
  field: 'personalityTrait' | 'ideal' | 'bond' | 'flaw' | 'backstory';
  value: string;
  onChange: (value: string) => void;
  characterContext: {
    race?: string;
    class?: string;
    background?: string;
    name?: string;
  };
  maxLength?: number;
}

export function PersonalityField({
  label,
  field,
  value,
  onChange,
  characterContext,
  maxLength = 500
}: PersonalityFieldProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const generated = await generatePersonalityContent({
        field,
        ...characterContext
      });
      onChange(generated);
    } catch (error) {
      toast.error('Failed to generate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="personality-field">
      <div className="field-header">
        <label className="field-label">{label}</label>
        <motion.button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={isGenerating}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={`Generate random ${label.toLowerCase()}`}
        >
          {isGenerating ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              ⏳
            </motion.span>
          ) : (
            <>🎲 Generate</>
          )}
        </motion.button>
      </div>
      
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={getPlaceholder(field)}
        className="personality-textarea"
      />
      
      <div className="field-footer">
        <span className="char-count">{value.length}/{maxLength}</span>
      </div>
    </div>
  );
}

function getPlaceholder(field: string): string {
  switch (field) {
    case 'personalityTrait':
      return 'Describe a personality trait that defines your character...';
    case 'ideal':
      return 'What principle or belief guides your character?';
    case 'bond':
      return 'What person, place, or thing is most important to your character?';
    case 'flaw':
      return 'What weakness or vice does your character struggle with?';
    case 'backstory':
      return 'Tell the story of your character\'s past...';
    default:
      return '';
  }
}
```

## 1.3 Generation Service

```typescript
// services/api-gateway/src/services/personalityGenerator.ts

import { sanitizeContent } from '../utils/contentSafety';

interface GenerationRequest {
  field: 'personalityTrait' | 'ideal' | 'bond' | 'flaw' | 'backstory';
  race?: string;
  class?: string;
  background?: string;
  name?: string;
}

interface GenerationResult {
  content: string;
  isSafe: boolean;
}

export async function generatePersonalityContent(
  request: GenerationRequest
): Promise<string> {
  const { field, race, class: charClass, background, name } = request;
  
  // Option 1: Use pre-written templates (fast, always safe)
  if (shouldUseTemplates()) {
    return selectFromTemplates(field, { race, charClass, background });
  }
  
  // Option 2: Use AI generation with safety filters
  const prompt = buildPrompt(field, { race, charClass, background, name });
  const generated = await callAIService(prompt);
  
  // Always sanitize output
  const sanitized = sanitizeContent(generated);
  
  // Validate safety
  if (!isContentSafe(sanitized)) {
    // Fall back to templates if AI generates inappropriate content
    return selectFromTemplates(field, { race, charClass, background });
  }
  
  return sanitized;
}

function buildPrompt(
  field: string, 
  context: { race?: string; charClass?: string; background?: string; name?: string }
): string {
  const { race, charClass, background, name } = context;
  
  const baseContext = [
    race && `Race: ${race}`,
    charClass && `Class: ${charClass}`,
    background && `Background: ${background}`,
    name && `Name: ${name}`
  ].filter(Boolean).join(', ');
  
  const instructions = `
You are generating character personality content for a D&D 5e character.
${baseContext ? `Character details: ${baseContext}` : ''}

IMPORTANT RULES:
- Use clean, family-friendly language
- No profanity, expletives, or crude language
- No sexual content or innuendo
- No graphic violence descriptions
- No real-world controversial topics
- Keep it fantasy/medieval appropriate
- Be creative but appropriate for all ages
`;

  switch (field) {
    case 'personalityTrait':
      return `${instructions}
Generate ONE personality trait (1-2 sentences) that fits this character.
Examples of good traits:
- "I always have a plan for what to do when things go wrong."
- "I am incredibly slow to trust. Those who seem the fairest often have the most to hide."
- "I idolize a hero of the old tales and measure my deeds against that person's."`;

    case 'ideal':
      return `${instructions}
Generate ONE ideal (a guiding principle) for this character (1-2 sentences).
Format: "[Ideal Name]. [Description]"
Examples:
- "Honor. If I dishonor myself, I dishonor my whole clan."
- "Freedom. Chains are meant to be broken, as are those who would forge them."
- "Knowledge. The path to power and self-improvement is through knowledge."`;

    case 'bond':
      return `${instructions}
Generate ONE bond (an important connection) for this character (1-2 sentences).
Examples:
- "I would die to recover an ancient relic of my faith that was lost long ago."
- "I protect those who cannot protect themselves."
- "My village was destroyed by a dragon. I will have my revenge."`;

    case 'flaw':
      return `${instructions}
Generate ONE character flaw (a weakness or vice) for this character (1-2 sentences).
Keep flaws interesting but not offensive.
Examples:
- "I have trouble keeping my true feelings hidden. My sharp tongue lands me in trouble."
- "I am slow to trust members of other races, though I am working to overcome this."
- "I am inflexible in my thinking."`;

    case 'backstory':
      return `${instructions}
Generate a brief backstory (3-5 sentences) for this character.
Include:
- Where they came from
- A formative event
- Why they became an adventurer
Keep it engaging but appropriate for all audiences.`;

    default:
      return instructions;
  }
}
```

## 1.4 Pre-Written Templates (Fallback & Fast Option)

```typescript
// data/personalityTemplates.ts

export const PERSONALITY_TEMPLATES = {
  personalityTrait: {
    generic: [
      "I always have a plan for what to do when things go wrong.",
      "I am incredibly slow to trust. Those who seem the fairest often have the most to hide.",
      "I would rather make a new friend than a new enemy.",
      "I've read every book in the world's greatest libraries—or I like to boast that I have.",
      "I'm always polite and respectful, even to my enemies.",
      "I can find common ground between the fiercest enemies, empathizing with them.",
      "Nothing can shake my optimistic attitude.",
      "I misuse long words in an attempt to sound smarter.",
      "I get bored easily. When am I going to get on with my destiny?",
      "I believe that everything worth doing is worth doing right.",
    ],
    
    // Race-specific additions
    byRace: {
      dwarf: [
        "I judge people by their actions, not their words.",
        "If someone is in trouble, I'm always ready to lend aid.",
        "I take great pride in my clan's craftsmanship.",
      ],
      elf: [
        "I've seen empires rise and fall. What's a few more decades?",
        "I feel more at home among the trees than in any city.",
        "I appreciate beauty in all its forms, from art to nature.",
      ],
      halfling: [
        "I am always curious about new places and new people.",
        "I enjoy a good meal more than almost anything else.",
        "I'm small, but I never let that stop me from standing up to bullies.",
      ],
      // ... more races
    },
    
    // Class-specific additions
    byClass: {
      fighter: [
        "I face problems head-on. A simple, direct solution is the best path.",
        "I've lost too many friends in battle. I don't let myself get close to people anymore.",
      ],
      wizard: [
        "I'm convinced that people are always trying to steal my secrets.",
        "I speak without really thinking through my words, invariably insulting others.",
      ],
      rogue: [
        "I always have an escape route planned, in case things go wrong.",
        "I pocket anything I see that might have some value.",
      ],
      cleric: [
        "I see omens in every event and action. The gods try to speak to us constantly.",
        "I put no trust in divine beings. We mortals must solve our own problems.",
      ],
      // ... more classes
    },
    
    // Background-specific additions
    byBackground: {
      noble: [
        "My eloquent flattery makes everyone I talk to feel wonderful.",
        "Despite my noble birth, I do not place myself above other folk.",
      ],
      soldier: [
        "I can stare down a hell hound without flinching.",
        "I'm haunted by memories of war. I can't get the images out of my mind.",
      ],
      criminal: [
        "I always have an exit strategy planned.",
        "I don't pay attention to the risks in a situation. Never tell me the odds.",
      ],
      // ... more backgrounds
    }
  },
  
  ideal: {
    generic: [
      "Respect. People deserve to be treated with dignity and respect.",
      "Fairness. No one should get preferential treatment before the law.",
      "Freedom. Tyrants must not be allowed to oppress the people.",
      "Knowledge. The path to power and self-improvement is through knowledge.",
      "Protection. It is my duty to protect those who cannot protect themselves.",
      "Tradition. Ancient traditions must be preserved and upheld.",
      "Honor. I never break my word.",
      "Redemption. There's a spark of good in everyone.",
      "Self-Improvement. I must always strive to be better.",
      "Community. We have to take care of each other.",
    ],
    // ... similar structure for race/class/background
  },
  
  bond: {
    generic: [
      "I would die to recover an ancient relic that was lost long ago.",
      "I will someday get revenge on those who destroyed everything I held dear.",
      "I owe my life to a mentor who taught me everything I know.",
      "Everything I do is for the common people.",
      "I will become the greatest hero my homeland has ever known.",
      "Someone I loved died because of a mistake I made. I will never make that mistake again.",
      "My homeland is the most important place in the world to me.",
      "I'm trying to pay off an old debt I owe to a generous benefactor.",
      "My family means everything to me.",
      "I seek to prove myself worthy of my mentor's faith in me.",
    ],
    // ... similar structure
  },
  
  flaw: {
    generic: [
      "I judge others harshly, and myself even more severely.",
      "I have trouble trusting in my allies.",
      "Once I pick a goal, I become obsessed with it.",
      "I am slow to trust members of other races or cultures.",
      "I have trouble keeping my true feelings hidden.",
      "I turn tail and run when things look bad.",
      "I'm convinced of the significance of my destiny.",
      "My pride will probably lead to my destruction.",
      "I am suspicious of strangers and expect the worst of them.",
      "Once someone questions my courage, I never back down.",
    ],
    // ... similar structure
  },
  
  backstory: {
    templates: [
      // Template-based generation
      {
        template: "Born in {birthplace}, {name} grew up {upbringing}. A pivotal moment came when {event}. This experience led {name} to become a {class}, seeking {goal}.",
        variables: {
          birthplace: ['a small village', 'a bustling city', 'a remote monastery', 'a traveling caravan', 'a noble estate'],
          upbringing: ['learning the ways of their people', 'struggling to survive', 'surrounded by books and learning', 'training for battle', 'in relative comfort'],
          event: ['they witnessed an injustice they could not ignore', 'a mysterious stranger revealed a hidden truth', 'their home was threatened by dark forces', 'they discovered an ancient artifact', 'a vision from the gods changed everything'],
          goal: ['adventure and glory', 'knowledge and power', 'justice for the oppressed', 'redemption for past mistakes', 'to protect those they love']
        }
      }
    ]
  }
};

// Selection function
export function selectFromTemplates(
  field: string,
  context: { race?: string; charClass?: string; background?: string }
): string {
  const { race, charClass, background } = context;
  const templates = PERSONALITY_TEMPLATES[field as keyof typeof PERSONALITY_TEMPLATES];
  
  if (!templates) return '';
  
  // Collect all applicable options
  const options: string[] = [...(templates.generic || [])];
  
  if (race && templates.byRace?.[race.toLowerCase()]) {
    options.push(...templates.byRace[race.toLowerCase()]);
  }
  
  if (charClass && templates.byClass?.[charClass.toLowerCase()]) {
    options.push(...templates.byClass[charClass.toLowerCase()]);
  }
  
  if (background && templates.byBackground?.[background.toLowerCase()]) {
    options.push(...templates.byBackground[background.toLowerCase()]);
  }
  
  // Random selection
  return options[Math.floor(Math.random() * options.length)];
}
```

## 1.5 Content Safety Utilities

```typescript
// utils/contentSafety.ts

// Words/patterns that should never appear in generated content
const BLOCKED_PATTERNS = [
  // Profanity (comprehensive list)
  /\b(fuck|shit|damn|hell|ass|bitch|bastard|crap)\b/gi,
  /\b(f+u+c+k+|s+h+i+t+)\b/gi, // Variations
  
  // Slurs and hate speech (comprehensive list - abbreviated here)
  /\b(slur1|slur2)\b/gi,
  
  // Sexual content
  /\b(sex|nude|naked|erotic|sensual|intimate)\b/gi,
  /\b(breast|genital|penis|vagina)\b/gi,
  
  // Graphic violence
  /\b(gore|mutilate|dismember|torture)\b/gi,
  
  // Real-world sensitive topics
  /\b(nazi|holocaust|terrorism|rape)\b/gi,
  
  // Drug references (non-fantasy)
  /\b(cocaine|heroin|meth|marijuana)\b/gi,
];

// Replacement words for mild terms that might slip through
const REPLACEMENTS: Record<string, string> = {
  'damn': 'cursed',
  'hell': 'the abyss',
  'ass': 'fool',
  'crap': 'rubbish',
};

export function sanitizeContent(content: string): string {
  let sanitized = content;
  
  // Apply replacements for mild terms
  for (const [word, replacement] of Object.entries(REPLACEMENTS)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    sanitized = sanitized.replace(regex, replacement);
  }
  
  return sanitized;
}

export function isContentSafe(content: string): boolean {
  const lowered = content.toLowerCase();
  
  // Check against blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(lowered)) {
      console.warn('Unsafe content detected:', pattern);
      return false;
    }
  }
  
  return true;
}

// For AI image generation prompts
export function sanitizeImagePrompt(prompt: string): string {
  // Remove any potentially problematic terms
  let sanitized = prompt;
  
  // Ensure clothing/armor
  if (!/(armor|clothed|dressed|robed|armored)/i.test(sanitized)) {
    sanitized += ', fully clothed, wearing appropriate adventurer attire';
  }
  
  // Add safety negative prompt
  const safetyNegative = 'nude, naked, nsfw, sexual, revealing, inappropriate';
  
  return {
    prompt: sanitized,
    negativePrompt: safetyNegative
  };
}
```

---

# PART 2: PROGRESSIVE CHARACTER VISUALIZATION

## 2.1 Concept

As the user progresses through character creation, the character portrait/model becomes more detailed:

| Step | What's Selected | Visual Detail Level |
|------|-----------------|---------------------|
| 1. Race | Race only | Silhouette with racial outline |
| 2. Class | Race + Class | Basic figure with class iconography |
| 3. Background | + Background | Added accessories/props |
| 4. Abilities | + Ability Scores | Physique adjustments |
| 5. Details | + Appearance choices | Full colors, features |
| 6. Personality | + Personality/Backstory | Expression, pose, final polish |

## 2.2 Visual States

```typescript
// types/characterVisualization.ts

interface VisualizationState {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  race?: string;
  class?: string;
  background?: string;
  abilities?: AbilityScores;
  appearance?: AppearanceOptions;
  personality?: PersonalityTraits;
}

interface VisualizationLayer {
  type: 'silhouette' | 'base' | 'class' | 'equipment' | 'details' | 'expression';
  opacity: number;
  filter?: string;
  elements: string[];
}
```

## 2.3 Progressive Reveal Component

```tsx
// components/character-builder/CharacterVisualization.tsx

interface CharacterVisualizationProps {
  state: VisualizationState;
}

export function CharacterVisualization({ state }: CharacterVisualizationProps) {
  const layers = useMemo(() => buildLayers(state), [state]);
  
  return (
    <div className="character-visualization">
      {/* Atmospheric background */}
      <div className="viz-background">
        <div className="viz-particles" />
        <div className="viz-glow" style={{ opacity: state.level / 6 }} />
      </div>
      
      {/* Character layers */}
      <div className="viz-character">
        <AnimatePresence mode="sync">
          {layers.map((layer, index) => (
            <motion.div
              key={layer.type}
              className={`viz-layer viz-layer-${layer.type}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: layer.opacity, 
                scale: 1,
                filter: layer.filter || 'none'
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                ease: "easeOut" 
              }}
            >
              <LayerContent layer={layer} state={state} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Progress indicator */}
      <div className="viz-progress">
        <div className="progress-bar">
          <motion.div 
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${(state.level / 6) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="progress-label">
          {getProgressLabel(state.level)}
        </span>
      </div>
    </div>
  );
}

function buildLayers(state: VisualizationState): VisualizationLayer[] {
  const layers: VisualizationLayer[] = [];
  
  // Level 1: Silhouette
  if (state.level >= 1 && state.race) {
    layers.push({
      type: 'silhouette',
      opacity: state.level === 1 ? 1 : 0.3,
      filter: state.level === 1 ? 'brightness(0)' : 'none',
      elements: [getRaceSilhouette(state.race)]
    });
  }
  
  // Level 2: Base figure with class hints
  if (state.level >= 2 && state.class) {
    layers.push({
      type: 'base',
      opacity: state.level === 2 ? 0.7 : 1,
      filter: state.level === 2 ? 'saturate(0.5)' : 'none',
      elements: [getBaseBody(state.race, state.class)]
    });
    
    layers.push({
      type: 'class',
      opacity: state.level >= 2 ? 1 : 0,
      elements: [getClassIcon(state.class)]
    });
  }
  
  // Level 3: Background equipment
  if (state.level >= 3 && state.background) {
    layers.push({
      type: 'equipment',
      opacity: state.level >= 3 ? 1 : 0,
      elements: getBackgroundEquipment(state.background, state.class)
    });
  }
  
  // Level 4: Ability-influenced physique
  if (state.level >= 4 && state.abilities) {
    // Modify body based on STR, DEX, CON
    layers.push({
      type: 'physique',
      opacity: 1,
      elements: [getPhysiqueModifiers(state.abilities)]
    });
  }
  
  // Level 5: Full appearance details
  if (state.level >= 5 && state.appearance) {
    layers.push({
      type: 'details',
      opacity: 1,
      elements: [
        getHair(state.appearance),
        getSkinTone(state.appearance),
        getFacialFeatures(state.appearance),
        getClothing(state.class, state.background)
      ]
    });
  }
  
  // Level 6: Expression and pose based on personality
  if (state.level >= 6 && state.personality) {
    layers.push({
      type: 'expression',
      opacity: 1,
      elements: [
        getExpression(state.personality),
        getPose(state.class, state.personality)
      ]
    });
  }
  
  return layers;
}

function getProgressLabel(level: number): string {
  switch (level) {
    case 1: return 'Destiny stirs...';
    case 2: return 'A path emerges...';
    case 3: return 'The past shapes you...';
    case 4: return 'Power awakens...';
    case 5: return 'Identity forms...';
    case 6: return 'A hero is born!';
    default: return '';
  }
}
```

## 2.4 Visual Styles per Level

```css
/* Level 1: Mysterious Silhouette */
.viz-level-1 .viz-character {
  filter: brightness(0) drop-shadow(0 0 20px rgba(139, 92, 246, 0.5));
}

.viz-level-1 .viz-background {
  background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
}

/* Level 2: Emerging Form */
.viz-level-2 .viz-character {
  filter: saturate(0.3) brightness(0.8);
  opacity: 0.8;
}

.viz-level-2 .class-icon {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 3rem;
  animation: class-pulse 2s infinite;
}

@keyframes class-pulse {
  0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(1); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.1); }
}

/* Level 3: Adding Equipment */
.viz-level-3 .equipment-layer {
  animation: equip-appear 0.5s ease-out;
}

@keyframes equip-appear {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* Level 4: Physique Definition */
.viz-level-4 .viz-character {
  filter: saturate(0.7);
}

/* Level 5: Full Color */
.viz-level-5 .viz-character {
  filter: none;
  animation: color-reveal 1s ease-out;
}

@keyframes color-reveal {
  0% { filter: saturate(0); }
  100% { filter: saturate(1); }
}

/* Level 6: Final Polish */
.viz-level-6 .viz-character {
  animation: hero-glow 3s ease-in-out infinite;
}

@keyframes hero-glow {
  0%, 100% { 
    filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.3));
  }
  50% { 
    filter: drop-shadow(0 0 20px rgba(245, 158, 11, 0.6));
  }
}

.viz-level-6 .viz-background {
  background: 
    radial-gradient(circle at 50% 30%, rgba(245, 158, 11, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 50% 100%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
}
```

## 2.5 Generating the Final Portrait

```typescript
// When user completes character creation, generate full AI portrait

async function generateFinalPortrait(character: Character): Promise<string> {
  const { prompt, negativePrompt } = buildSafePortraitPrompt(character);
  
  const result = await aiImageService.generate({
    prompt,
    negativePrompt,
    width: 512,
    height: 768,
    model: 'stable-diffusion-xl'
  });
  
  return result.imageUrl;
}

function buildSafePortraitPrompt(character: Character): { prompt: string; negativePrompt: string } {
  const { race, class: charClass, appearance, personality } = character;
  
  // Build descriptive prompt
  const parts = [
    // Style
    'fantasy character portrait',
    'digital art',
    'highly detailed',
    
    // Race
    getRaceDescription(race),
    
    // Class appearance
    getClassAppearance(charClass),
    
    // Physical details (if provided)
    appearance?.hairColor && `${appearance.hairColor} hair`,
    appearance?.eyeColor && `${appearance.eyeColor} eyes`,
    appearance?.skinTone && `${appearance.skinTone} skin`,
    
    // Expression from personality
    personality?.flaw?.includes('pride') && 'confident expression',
    personality?.trait?.includes('friendly') && 'warm smile',
    
    // SAFETY: Always include
    'fully clothed',
    'appropriate fantasy armor and clothing',
    'heroic pose',
    
    // Quality
    'masterpiece',
    'best quality',
    'sharp focus'
  ].filter(Boolean);
  
  // SAFETY: Negative prompt
  const negativePrompt = [
    'nude',
    'naked',
    'nsfw',
    'sexual',
    'revealing clothing',
    'bikini armor',
    'inappropriate',
    'suggestive',
    'low quality',
    'blurry',
    'deformed',
    'ugly',
    'duplicate',
    'mutated'
  ].join(', ');
  
  return {
    prompt: parts.join(', '),
    negativePrompt
  };
}

function getRaceDescription(race: string): string {
  const descriptions: Record<string, string> = {
    human: 'human, realistic proportions',
    elf: 'elf, pointed ears, elegant features, ethereal beauty',
    dwarf: 'dwarf, stocky build, thick beard, sturdy',
    halfling: 'halfling, small stature, youthful face, bare feet',
    dragonborn: 'dragonborn, reptilian humanoid, scaled skin, draconic head',
    tiefling: 'tiefling, horns, solid colored eyes, infernal heritage',
    gnome: 'gnome, small, large eyes, curious expression',
    'half-elf': 'half-elf, slightly pointed ears, blend of human and elven features',
    'half-orc': 'half-orc, muscular, tusks, green-gray skin',
  };
  
  return descriptions[race.toLowerCase()] || 'humanoid fantasy character';
}

function getClassAppearance(charClass: string): string {
  const appearances: Record<string, string> = {
    fighter: 'wearing plate armor, sword and shield, battle-ready',
    wizard: 'wearing flowing robes, holding staff, arcane symbols',
    rogue: 'wearing dark leather armor, hooded cloak, daggers',
    cleric: 'wearing chainmail with holy vestments, sacred symbol',
    paladin: 'wearing shining plate armor, holy sword, radiant',
    ranger: 'wearing practical leather armor, bow, forest colors',
    barbarian: 'wearing fur and leather, muscular, war paint',
    bard: 'wearing colorful clothes, musical instrument, charming',
    druid: 'wearing natural materials, leaves and vines, wooden staff',
    monk: 'wearing simple robes, bare hands, serene',
    sorcerer: 'wearing elegant clothes, magical energy surrounding',
    warlock: 'wearing dark robes, eldritch symbols, mysterious',
  };
  
  return appearances[charClass.toLowerCase()] || 'adventurer gear';
}
```

---

# PART 3: CONTENT SAFETY GUIDELINES

## 3.1 Image Generation Safety

### Always Include in Prompts
```typescript
const MANDATORY_SAFE_TERMS = [
  'fully clothed',
  'appropriate fantasy attire',
  'heroic',
  'professional illustration'
];

const MANDATORY_NEGATIVE_PROMPT = [
  'nude', 'naked', 'nsfw', 'sexual', 'revealing', 
  'bikini', 'lingerie', 'inappropriate', 'suggestive',
  'gore', 'blood', 'violent', 'disturbing'
].join(', ');
```

### Pre-Generation Validation
```typescript
function validatePromptSafety(prompt: string): boolean {
  const unsafeTerms = [
    'nude', 'naked', 'sexy', 'seductive', 'revealing',
    'nsfw', 'explicit', 'erotic', 'sensual'
  ];
  
  const lowered = prompt.toLowerCase();
  return !unsafeTerms.some(term => lowered.includes(term));
}
```

### Post-Generation Moderation
```typescript
// Use AI moderation service to verify generated images
async function moderateGeneratedImage(imageUrl: string): Promise<boolean> {
  const result = await moderationService.check(imageUrl);
  
  return result.safe && 
         !result.flags.includes('adult') &&
         !result.flags.includes('violence') &&
         !result.flags.includes('hate');
}
```

## 3.2 Text Content Safety

### Blocked Content Categories
1. **Profanity** - No swear words or crude language
2. **Sexual Content** - No sexual themes or innuendo
3. **Graphic Violence** - No torture, gore, or gratuitous violence
4. **Hate Speech** - No slurs, discrimination, or bigotry
5. **Real-World Issues** - No modern political or religious controversy
6. **Drug References** - No real-world drug references (fantasy potions OK)

### Allowed Fantasy Content
- Combat descriptions (non-graphic)
- Character death (tasteful)
- Fantasy substances (potions, herbs)
- Fantasy religions and deities
- Moral complexity (good vs evil themes)
- Character flaws (pride, greed, etc.)

## 3.3 Implementation Checklist

```typescript
// Pre-flight checks before any generation
async function safeGeneration<T>(
  type: 'text' | 'image',
  generator: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    const result = await generator();
    
    // Post-generation safety check
    const isSafe = type === 'text' 
      ? isContentSafe(result as string)
      : await moderateGeneratedImage(result as string);
    
    if (!isSafe) {
      console.warn('Generated content failed safety check, using fallback');
      return fallback;
    }
    
    return result;
  } catch (error) {
    console.error('Generation failed:', error);
    return fallback;
  }
}
```

---

# PART 4: UI INTEGRATION

## 4.1 Character Builder Step Layout

```tsx
// pages/character-builder/index.tsx

export default function CharacterBuilderPage() {
  const [step, setStep] = useState(1);
  const [character, setCharacter] = useState<Partial<Character>>({});
  
  return (
    <div className="character-builder-layout">
      {/* Left side: Form steps */}
      <div className="builder-form-area">
        <StepIndicator currentStep={step} totalSteps={6} />
        
        <AnimatePresence mode="wait">
          {step === 1 && <RaceSelection onSelect={...} />}
          {step === 2 && <ClassSelection onSelect={...} />}
          {step === 3 && <BackgroundSelection onSelect={...} />}
          {step === 4 && <AbilityScores onComplete={...} />}
          {step === 5 && <AppearanceDetails onComplete={...} />}
          {step === 6 && <PersonalityDetails onComplete={...} />}
        </AnimatePresence>
      </div>
      
      {/* Right side: Progressive visualization */}
      <div className="builder-preview-area">
        <CharacterVisualization 
          state={{
            level: step as 1|2|3|4|5|6,
            ...character
          }}
        />
      </div>
    </div>
  );
}
```

## 4.2 Personality Step with Generate Buttons

```tsx
// components/character-builder/steps/PersonalityDetails.tsx

export function PersonalityDetails({ 
  character,
  onUpdate,
  onComplete 
}: PersonalityDetailsProps) {
  return (
    <motion.div
      className="personality-step"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h2 className="step-title">Personality & Backstory</h2>
      <p className="step-description">
        Define who your character truly is. Use the 🎲 button to generate ideas!
      </p>
      
      <div className="personality-fields">
        <PersonalityField
          label="Personality Trait"
          field="personalityTrait"
          value={character.personalityTrait || ''}
          onChange={(value) => onUpdate({ personalityTrait: value })}
          characterContext={{
            race: character.race,
            class: character.class,
            background: character.background
          }}
        />
        
        <PersonalityField
          label="Ideal"
          field="ideal"
          value={character.ideal || ''}
          onChange={(value) => onUpdate({ ideal: value })}
          characterContext={{...}}
        />
        
        <PersonalityField
          label="Bond"
          field="bond"
          value={character.bond || ''}
          onChange={(value) => onUpdate({ bond: value })}
          characterContext={{...}}
        />
        
        <PersonalityField
          label="Flaw"
          field="flaw"
          value={character.flaw || ''}
          onChange={(value) => onUpdate({ flaw: value })}
          characterContext={{...}}
        />
        
        <PersonalityField
          label="Backstory"
          field="backstory"
          value={character.backstory || ''}
          onChange={(value) => onUpdate({ backstory: value })}
          characterContext={{...}}
          maxLength={2000}
        />
      </div>
      
      <div className="step-actions">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <Button variant="primary" onClick={onComplete}>
          Complete Character
        </Button>
      </div>
    </motion.div>
  );
}
```

---

**END OF DOCUMENT 43**
