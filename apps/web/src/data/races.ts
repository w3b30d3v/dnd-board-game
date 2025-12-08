// D&D 5e SRD Races
export interface RacialTrait {
  name: string;
  description: string;
}

export interface Subrace {
  id: string;
  name: string;
  description: string;
  abilityBonuses: Record<string, number>;
  traits: RacialTrait[];
}

export interface Race {
  id: string;
  name: string;
  description: string;
  abilityBonuses: Record<string, number>;
  speed: number;
  size: 'Small' | 'Medium';
  languages: string[];
  traits: RacialTrait[];
  subraces?: Subrace[];
}

export const RACES: Race[] = [
  {
    id: 'human',
    name: 'Human',
    description: 'Humans are the most adaptable and ambitious people among the common races. Whatever drives them, humans are the innovators, the achievers, and the pioneers of the worlds.',
    abilityBonuses: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
    speed: 30,
    size: 'Medium',
    languages: ['Common'],
    traits: [
      { name: 'Versatile', description: '+1 to all ability scores' },
      { name: 'Extra Language', description: 'You can speak, read, and write one extra language of your choice' },
    ],
  },
  {
    id: 'elf',
    name: 'Elf',
    description: 'Elves are a magical people of otherworldly grace, living in places of ethereal beauty, in the midst of ancient forests or in silvery spires glittering with faerie light.',
    abilityBonuses: { dexterity: 2 },
    speed: 30,
    size: 'Medium',
    languages: ['Common', 'Elvish'],
    traits: [
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light' },
      { name: 'Keen Senses', description: 'You have proficiency in the Perception skill' },
      { name: 'Fey Ancestry', description: 'You have advantage on saving throws against being charmed' },
      { name: 'Trance', description: 'Elves do not need to sleep. Instead, they meditate deeply for 4 hours a day' },
    ],
    subraces: [
      {
        id: 'high-elf',
        name: 'High Elf',
        description: 'High elves have keen minds and a mastery of basic magic.',
        abilityBonuses: { intelligence: 1 },
        traits: [
          { name: 'Cantrip', description: 'You know one cantrip of your choice from the wizard spell list' },
          { name: 'Extra Language', description: 'You can speak, read, and write one extra language of your choice' },
        ],
      },
      {
        id: 'wood-elf',
        name: 'Wood Elf',
        description: 'Wood elves have keen senses and intuition, and their fleet feet carry them quickly through their native forests.',
        abilityBonuses: { wisdom: 1 },
        traits: [
          { name: 'Fleet of Foot', description: 'Your base walking speed increases to 35 feet' },
          { name: 'Mask of the Wild', description: 'You can attempt to hide when lightly obscured by natural phenomena' },
        ],
      },
      {
        id: 'dark-elf',
        name: 'Dark Elf (Drow)',
        description: 'Descended from an earlier subrace of elves, the drow were banished from the surface world for following the goddess Lolth.',
        abilityBonuses: { charisma: 1 },
        traits: [
          { name: 'Superior Darkvision', description: 'Your darkvision has a radius of 120 feet' },
          { name: 'Sunlight Sensitivity', description: 'You have disadvantage on attack rolls and Perception checks in direct sunlight' },
          { name: 'Drow Magic', description: 'You know the dancing lights cantrip' },
        ],
      },
    ],
  },
  {
    id: 'dwarf',
    name: 'Dwarf',
    description: 'Bold and hardy, dwarves are known as skilled warriors, miners, and workers of stone and metal.',
    abilityBonuses: { constitution: 2 },
    speed: 25,
    size: 'Medium',
    languages: ['Common', 'Dwarvish'],
    traits: [
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light' },
      { name: 'Dwarven Resilience', description: 'You have advantage on saving throws against poison' },
      { name: 'Dwarven Combat Training', description: 'You have proficiency with battleaxe, handaxe, light hammer, and warhammer' },
      { name: 'Stonecunning', description: 'You have expertise on History checks related to stonework' },
    ],
    subraces: [
      {
        id: 'hill-dwarf',
        name: 'Hill Dwarf',
        description: 'Hill dwarves have keen senses, deep intuition, and remarkable resilience.',
        abilityBonuses: { wisdom: 1 },
        traits: [
          { name: 'Dwarven Toughness', description: 'Your hit point maximum increases by 1, and it increases by 1 every time you gain a level' },
        ],
      },
      {
        id: 'mountain-dwarf',
        name: 'Mountain Dwarf',
        description: 'Mountain dwarves are strong and hardy, accustomed to a difficult life in rugged terrain.',
        abilityBonuses: { strength: 2 },
        traits: [
          { name: 'Dwarven Armor Training', description: 'You have proficiency with light and medium armor' },
        ],
      },
    ],
  },
  {
    id: 'halfling',
    name: 'Halfling',
    description: 'The diminutive halflings survive in a world full of larger creatures by avoiding notice or, barring that, avoiding offense.',
    abilityBonuses: { dexterity: 2 },
    speed: 25,
    size: 'Small',
    languages: ['Common', 'Halfling'],
    traits: [
      { name: 'Lucky', description: 'When you roll a 1 on an attack roll, ability check, or saving throw, you can reroll the die' },
      { name: 'Brave', description: 'You have advantage on saving throws against being frightened' },
      { name: 'Halfling Nimbleness', description: 'You can move through the space of any creature that is of a size larger than yours' },
    ],
    subraces: [
      {
        id: 'lightfoot',
        name: 'Lightfoot',
        description: 'Lightfoot halflings are more prone to wanderlust than other halflings.',
        abilityBonuses: { charisma: 1 },
        traits: [
          { name: 'Naturally Stealthy', description: 'You can attempt to hide even when obscured only by a creature at least one size larger than you' },
        ],
      },
      {
        id: 'stout',
        name: 'Stout',
        description: 'Stout halflings are hardier than average and have some resistance to poison.',
        abilityBonuses: { constitution: 1 },
        traits: [
          { name: 'Stout Resilience', description: 'You have advantage on saving throws against poison, and resistance against poison damage' },
        ],
      },
    ],
  },
  {
    id: 'dragonborn',
    name: 'Dragonborn',
    description: 'Born of dragons, dragonborn walk proudly through a world that greets them with fearful incomprehension.',
    abilityBonuses: { strength: 2, charisma: 1 },
    speed: 30,
    size: 'Medium',
    languages: ['Common', 'Draconic'],
    traits: [
      { name: 'Draconic Ancestry', description: 'You have draconic ancestry. Choose one type of dragon from the table to determine your breath weapon and damage resistance' },
      { name: 'Breath Weapon', description: 'You can use your action to exhale destructive energy based on your draconic ancestry' },
      { name: 'Damage Resistance', description: 'You have resistance to the damage type associated with your draconic ancestry' },
    ],
  },
  {
    id: 'gnome',
    name: 'Gnome',
    description: 'A gnome\'s energy and enthusiasm for living shines through every inch of their tiny body.',
    abilityBonuses: { intelligence: 2 },
    speed: 25,
    size: 'Small',
    languages: ['Common', 'Gnomish'],
    traits: [
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light' },
      { name: 'Gnome Cunning', description: 'You have advantage on Intelligence, Wisdom, and Charisma saving throws against magic' },
    ],
    subraces: [
      {
        id: 'forest-gnome',
        name: 'Forest Gnome',
        description: 'Forest gnomes have a natural knack for illusion and inherent quickness and stealth.',
        abilityBonuses: { dexterity: 1 },
        traits: [
          { name: 'Natural Illusionist', description: 'You know the minor illusion cantrip' },
          { name: 'Speak with Small Beasts', description: 'You can communicate simple ideas with Small or smaller beasts' },
        ],
      },
      {
        id: 'rock-gnome',
        name: 'Rock Gnome',
        description: 'Rock gnomes have a natural inventiveness and hardiness beyond that of other gnomes.',
        abilityBonuses: { constitution: 1 },
        traits: [
          { name: 'Artificer\'s Lore', description: 'You have expertise on History checks related to magic items, alchemical objects, or technological devices' },
          { name: 'Tinker', description: 'You can spend 1 hour and 10 gp to construct a Tiny clockwork device' },
        ],
      },
    ],
  },
  {
    id: 'half-elf',
    name: 'Half-Elf',
    description: 'Half-elves combine what some say are the best qualities of their elf and human parents.',
    abilityBonuses: { charisma: 2 },
    speed: 30,
    size: 'Medium',
    languages: ['Common', 'Elvish'],
    traits: [
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light' },
      { name: 'Fey Ancestry', description: 'You have advantage on saving throws against being charmed' },
      { name: 'Skill Versatility', description: 'You gain proficiency in two skills of your choice' },
      { name: 'Ability Score Increase', description: 'Two ability scores of your choice increase by 1' },
    ],
  },
  {
    id: 'half-orc',
    name: 'Half-Orc',
    description: 'Half-orcs\' grayish pigmentation, sloping foreheads, jutting jaws, prominent teeth, and towering builds make their orcish heritage plain for all to see.',
    abilityBonuses: { strength: 2, constitution: 1 },
    speed: 30,
    size: 'Medium',
    languages: ['Common', 'Orc'],
    traits: [
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light' },
      { name: 'Menacing', description: 'You gain proficiency in the Intimidation skill' },
      { name: 'Relentless Endurance', description: 'When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead (once per long rest)' },
      { name: 'Savage Attacks', description: 'When you score a critical hit with a melee weapon attack, you can roll one additional damage die' },
    ],
  },
  {
    id: 'tiefling',
    name: 'Tiefling',
    description: 'To be greeted with stares and whispers, to suffer violence and insult on the street, to see mistrust and fear in every eye: this is the lot of the tiefling.',
    abilityBonuses: { intelligence: 1, charisma: 2 },
    speed: 30,
    size: 'Medium',
    languages: ['Common', 'Infernal'],
    traits: [
      { name: 'Darkvision', description: 'You can see in dim light within 60 feet as if it were bright light' },
      { name: 'Hellish Resistance', description: 'You have resistance to fire damage' },
      { name: 'Infernal Legacy', description: 'You know the thaumaturgy cantrip. At 3rd level, you can cast hellish rebuke once per day' },
    ],
  },
];

export function getRaceById(id: string): Race | undefined {
  return RACES.find(r => r.id === id);
}

export function getSubraceById(raceId: string, subraceId: string): Subrace | undefined {
  const race = getRaceById(raceId);
  return race?.subraces?.find(s => s.id === subraceId);
}
