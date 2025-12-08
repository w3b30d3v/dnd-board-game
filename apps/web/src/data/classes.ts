// D&D 5e SRD Classes
export interface ClassFeature {
  name: string;
  level: number;
  description: string;
}

export interface CharacterClass {
  id: string;
  name: string;
  description: string;
  hitDice: number;
  primaryAbility: string[];
  savingThrows: string[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
  skillChoices: {
    count: number;
    options: string[];
  };
  startingEquipment: string[];
  spellcasting: {
    ability: string;
    cantripsKnown?: number;
    spellsKnown?: number;
    spellSlots?: Record<number, number>;
  } | null;
  features: ClassFeature[];
}

export const CLASSES: CharacterClass[] = [
  {
    id: 'barbarian',
    name: 'Barbarian',
    description: 'A fierce warrior who can enter a battle rage, gaining primal power and resilience.',
    hitDice: 12,
    primaryAbility: ['strength'],
    savingThrows: ['strength', 'constitution'],
    armorProficiencies: ['light', 'medium', 'shields'],
    weaponProficiencies: ['simple', 'martial'],
    toolProficiencies: [],
    skillChoices: {
      count: 2,
      options: ['animal-handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'],
    },
    startingEquipment: ['greataxe', 'two handaxes', 'explorer\'s pack', 'four javelins'],
    spellcasting: null,
    features: [
      { name: 'Rage', level: 1, description: 'Enter a battle rage for extra damage and resistance' },
      { name: 'Unarmored Defense', level: 1, description: 'AC equals 10 + DEX mod + CON mod when not wearing armor' },
      { name: 'Reckless Attack', level: 2, description: 'Gain advantage on attacks, enemies gain advantage against you' },
      { name: 'Danger Sense', level: 2, description: 'Advantage on DEX saves against effects you can see' },
    ],
  },
  {
    id: 'bard',
    name: 'Bard',
    description: 'An inspiring magician whose power echoes the music of creation.',
    hitDice: 8,
    primaryAbility: ['charisma'],
    savingThrows: ['dexterity', 'charisma'],
    armorProficiencies: ['light'],
    weaponProficiencies: ['simple', 'hand crossbows', 'longswords', 'rapiers', 'shortswords'],
    toolProficiencies: ['three musical instruments'],
    skillChoices: {
      count: 3,
      options: ['acrobatics', 'animal-handling', 'arcana', 'athletics', 'deception', 'history', 'insight', 'intimidation', 'investigation', 'medicine', 'nature', 'perception', 'performance', 'persuasion', 'religion', 'sleight-of-hand', 'stealth', 'survival'],
    },
    startingEquipment: ['rapier', 'entertainer\'s pack', 'lute', 'leather armor', 'dagger'],
    spellcasting: {
      ability: 'charisma',
      cantripsKnown: 2,
      spellsKnown: 4,
      spellSlots: { 1: 2 },
    },
    features: [
      { name: 'Spellcasting', level: 1, description: 'Cast bard spells using Charisma' },
      { name: 'Bardic Inspiration', level: 1, description: 'Inspire allies with a bonus die (d6)' },
      { name: 'Jack of All Trades', level: 2, description: 'Add half proficiency to non-proficient ability checks' },
      { name: 'Song of Rest', level: 2, description: 'Allies regain extra HP during short rest' },
    ],
  },
  {
    id: 'cleric',
    name: 'Cleric',
    description: 'A priestly champion who wields divine magic in service of a higher power.',
    hitDice: 8,
    primaryAbility: ['wisdom'],
    savingThrows: ['wisdom', 'charisma'],
    armorProficiencies: ['light', 'medium', 'shields'],
    weaponProficiencies: ['simple'],
    toolProficiencies: [],
    skillChoices: {
      count: 2,
      options: ['history', 'insight', 'medicine', 'persuasion', 'religion'],
    },
    startingEquipment: ['mace', 'scale mail', 'light crossbow', 'priest\'s pack', 'shield', 'holy symbol'],
    spellcasting: {
      ability: 'wisdom',
      cantripsKnown: 3,
      spellSlots: { 1: 2 },
    },
    features: [
      { name: 'Spellcasting', level: 1, description: 'Cast cleric spells using Wisdom' },
      { name: 'Divine Domain', level: 1, description: 'Choose a domain that grants special abilities and spells' },
      { name: 'Channel Divinity', level: 2, description: 'Channel divine energy for special effects' },
    ],
  },
  {
    id: 'druid',
    name: 'Druid',
    description: 'A priest of the Old Faith, wielding the powers of nature and adopting animal forms.',
    hitDice: 8,
    primaryAbility: ['wisdom'],
    savingThrows: ['intelligence', 'wisdom'],
    armorProficiencies: ['light', 'medium', 'shields (non-metal)'],
    weaponProficiencies: ['clubs', 'daggers', 'darts', 'javelins', 'maces', 'quarterstaffs', 'scimitars', 'sickles', 'slings', 'spears'],
    toolProficiencies: ['herbalism kit'],
    skillChoices: {
      count: 2,
      options: ['arcana', 'animal-handling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'],
    },
    startingEquipment: ['wooden shield', 'scimitar', 'leather armor', 'explorer\'s pack', 'druidic focus'],
    spellcasting: {
      ability: 'wisdom',
      cantripsKnown: 2,
      spellSlots: { 1: 2 },
    },
    features: [
      { name: 'Druidic', level: 1, description: 'Know the secret language of druids' },
      { name: 'Spellcasting', level: 1, description: 'Cast druid spells using Wisdom' },
      { name: 'Wild Shape', level: 2, description: 'Transform into beasts you have seen' },
    ],
  },
  {
    id: 'fighter',
    name: 'Fighter',
    description: 'A master of martial combat, skilled with a variety of weapons and armor.',
    hitDice: 10,
    primaryAbility: ['strength', 'dexterity'],
    savingThrows: ['strength', 'constitution'],
    armorProficiencies: ['all armor', 'shields'],
    weaponProficiencies: ['simple', 'martial'],
    toolProficiencies: [],
    skillChoices: {
      count: 2,
      options: ['acrobatics', 'animal-handling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'],
    },
    startingEquipment: ['chain mail', 'martial weapon', 'shield', 'light crossbow', 'dungeoneer\'s pack'],
    spellcasting: null,
    features: [
      { name: 'Fighting Style', level: 1, description: 'Adopt a particular style of fighting as your specialty' },
      { name: 'Second Wind', level: 1, description: 'Regain HP as a bonus action (1d10 + fighter level)' },
      { name: 'Action Surge', level: 2, description: 'Take one additional action on your turn' },
    ],
  },
  {
    id: 'monk',
    name: 'Monk',
    description: 'A master of martial arts, harnessing the power of body and ki.',
    hitDice: 8,
    primaryAbility: ['dexterity', 'wisdom'],
    savingThrows: ['strength', 'dexterity'],
    armorProficiencies: [],
    weaponProficiencies: ['simple', 'shortswords'],
    toolProficiencies: ['one artisan\'s tool or musical instrument'],
    skillChoices: {
      count: 2,
      options: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'],
    },
    startingEquipment: ['shortsword', 'dungeoneer\'s pack', '10 darts'],
    spellcasting: null,
    features: [
      { name: 'Unarmored Defense', level: 1, description: 'AC equals 10 + DEX mod + WIS mod when not wearing armor' },
      { name: 'Martial Arts', level: 1, description: 'Use DEX for unarmed strikes and monk weapons, bonus unarmed strike' },
      { name: 'Ki', level: 2, description: 'Harness mystical energy for special abilities' },
      { name: 'Unarmored Movement', level: 2, description: 'Speed increases by 10 feet when not wearing armor' },
    ],
  },
  {
    id: 'paladin',
    name: 'Paladin',
    description: 'A holy warrior bound to a sacred oath.',
    hitDice: 10,
    primaryAbility: ['strength', 'charisma'],
    savingThrows: ['wisdom', 'charisma'],
    armorProficiencies: ['all armor', 'shields'],
    weaponProficiencies: ['simple', 'martial'],
    toolProficiencies: [],
    skillChoices: {
      count: 2,
      options: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'],
    },
    startingEquipment: ['martial weapon', 'shield', 'five javelins', 'priest\'s pack', 'chain mail', 'holy symbol'],
    spellcasting: {
      ability: 'charisma',
      spellSlots: { 1: 2 },
    },
    features: [
      { name: 'Divine Sense', level: 1, description: 'Sense the presence of celestials, fiends, and undead' },
      { name: 'Lay on Hands', level: 1, description: 'Heal HP equal to paladin level x 5' },
      { name: 'Fighting Style', level: 2, description: 'Adopt a particular style of fighting as your specialty' },
      { name: 'Spellcasting', level: 2, description: 'Cast paladin spells using Charisma' },
      { name: 'Divine Smite', level: 2, description: 'Expend spell slot to deal extra radiant damage' },
    ],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    description: 'A warrior who combats threats on the edges of civilization.',
    hitDice: 10,
    primaryAbility: ['dexterity', 'wisdom'],
    savingThrows: ['strength', 'dexterity'],
    armorProficiencies: ['light', 'medium', 'shields'],
    weaponProficiencies: ['simple', 'martial'],
    toolProficiencies: [],
    skillChoices: {
      count: 3,
      options: ['animal-handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'],
    },
    startingEquipment: ['scale mail', 'two shortswords', 'dungeoneer\'s pack', 'longbow', 'quiver of 20 arrows'],
    spellcasting: {
      ability: 'wisdom',
      spellsKnown: 2,
      spellSlots: { 1: 2 },
    },
    features: [
      { name: 'Favored Enemy', level: 1, description: 'Advantage on tracking and recalling info about chosen enemy types' },
      { name: 'Natural Explorer', level: 1, description: 'Skilled at navigating and surviving in certain terrain types' },
      { name: 'Fighting Style', level: 2, description: 'Adopt a particular style of fighting as your specialty' },
      { name: 'Spellcasting', level: 2, description: 'Cast ranger spells using Wisdom' },
    ],
  },
  {
    id: 'rogue',
    name: 'Rogue',
    description: 'A scoundrel who uses stealth and trickery to overcome obstacles and enemies.',
    hitDice: 8,
    primaryAbility: ['dexterity'],
    savingThrows: ['dexterity', 'intelligence'],
    armorProficiencies: ['light'],
    weaponProficiencies: ['simple', 'hand crossbows', 'longswords', 'rapiers', 'shortswords'],
    toolProficiencies: ['thieves\' tools'],
    skillChoices: {
      count: 4,
      options: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleight-of-hand', 'stealth'],
    },
    startingEquipment: ['rapier', 'shortbow', 'quiver of 20 arrows', 'burglar\'s pack', 'leather armor', 'two daggers', 'thieves\' tools'],
    spellcasting: null,
    features: [
      { name: 'Expertise', level: 1, description: 'Double proficiency bonus for two skills' },
      { name: 'Sneak Attack', level: 1, description: 'Deal extra damage (1d6) to creatures you have advantage against' },
      { name: 'Thieves\' Cant', level: 1, description: 'Know a secret mix of dialect, jargon, and code' },
      { name: 'Cunning Action', level: 2, description: 'Dash, Disengage, or Hide as a bonus action' },
    ],
  },
  {
    id: 'sorcerer',
    name: 'Sorcerer',
    description: 'A spellcaster who draws on inherent magic from a bloodline or otherworldly source.',
    hitDice: 6,
    primaryAbility: ['charisma'],
    savingThrows: ['constitution', 'charisma'],
    armorProficiencies: [],
    weaponProficiencies: ['daggers', 'darts', 'slings', 'quarterstaffs', 'light crossbows'],
    toolProficiencies: [],
    skillChoices: {
      count: 2,
      options: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'],
    },
    startingEquipment: ['light crossbow', '20 bolts', 'arcane focus', 'dungeoneer\'s pack', 'two daggers'],
    spellcasting: {
      ability: 'charisma',
      cantripsKnown: 4,
      spellsKnown: 2,
      spellSlots: { 1: 2 },
    },
    features: [
      { name: 'Spellcasting', level: 1, description: 'Cast sorcerer spells using Charisma' },
      { name: 'Sorcerous Origin', level: 1, description: 'Choose an origin that grants special abilities' },
      { name: 'Font of Magic', level: 2, description: 'Tap into a deep wellspring of magic (sorcery points)' },
    ],
  },
  {
    id: 'warlock',
    name: 'Warlock',
    description: 'A wielder of magic that is derived from a bargain with an extraplanar entity.',
    hitDice: 8,
    primaryAbility: ['charisma'],
    savingThrows: ['wisdom', 'charisma'],
    armorProficiencies: ['light'],
    weaponProficiencies: ['simple'],
    toolProficiencies: [],
    skillChoices: {
      count: 2,
      options: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'],
    },
    startingEquipment: ['light crossbow', '20 bolts', 'arcane focus', 'scholar\'s pack', 'leather armor', 'simple weapon', 'two daggers'],
    spellcasting: {
      ability: 'charisma',
      cantripsKnown: 2,
      spellsKnown: 2,
      spellSlots: { 1: 1 },
    },
    features: [
      { name: 'Otherworldly Patron', level: 1, description: 'Strike a bargain with a powerful extraplanar entity' },
      { name: 'Pact Magic', level: 1, description: 'Cast warlock spells using Charisma (slots recover on short rest)' },
      { name: 'Eldritch Invocations', level: 2, description: 'Learn fragments of forbidden knowledge' },
    ],
  },
  {
    id: 'wizard',
    name: 'Wizard',
    description: 'A scholarly magic-user capable of manipulating the structures of reality.',
    hitDice: 6,
    primaryAbility: ['intelligence'],
    savingThrows: ['intelligence', 'wisdom'],
    armorProficiencies: [],
    weaponProficiencies: ['daggers', 'darts', 'slings', 'quarterstaffs', 'light crossbows'],
    toolProficiencies: [],
    skillChoices: {
      count: 2,
      options: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'],
    },
    startingEquipment: ['quarterstaff', 'arcane focus', 'scholar\'s pack', 'spellbook'],
    spellcasting: {
      ability: 'intelligence',
      cantripsKnown: 3,
      spellSlots: { 1: 2 },
    },
    features: [
      { name: 'Spellcasting', level: 1, description: 'Cast wizard spells using Intelligence and a spellbook' },
      { name: 'Arcane Recovery', level: 1, description: 'Recover spell slots during a short rest' },
      { name: 'Arcane Tradition', level: 2, description: 'Choose a school of magic that grants special abilities' },
    ],
  },
];

export function getClassById(id: string): CharacterClass | undefined {
  return CLASSES.find(c => c.id === id);
}

export function isCaster(classId: string): boolean {
  const charClass = getClassById(classId);
  return charClass?.spellcasting !== null;
}
