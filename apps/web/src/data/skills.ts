// D&D 5e Skills
export interface Skill {
  id: string;
  name: string;
  ability: string;
  description: string;
}

export const SKILLS: Skill[] = [
  { id: 'acrobatics', name: 'Acrobatics', ability: 'dexterity', description: 'Your Dexterity (Acrobatics) check covers your attempt to stay on your feet in a tricky situation.' },
  { id: 'animal-handling', name: 'Animal Handling', ability: 'wisdom', description: 'When there is any question whether you can calm down a domesticated animal, keep a mount from getting spooked, or intuit an animal\'s intentions.' },
  { id: 'arcana', name: 'Arcana', ability: 'intelligence', description: 'Your Intelligence (Arcana) check measures your ability to recall lore about spells, magic items, eldritch symbols, magical traditions, and more.' },
  { id: 'athletics', name: 'Athletics', ability: 'strength', description: 'Your Strength (Athletics) check covers difficult situations you encounter while climbing, jumping, or swimming.' },
  { id: 'deception', name: 'Deception', ability: 'charisma', description: 'Your Charisma (Deception) check determines whether you can convincingly hide the truth.' },
  { id: 'history', name: 'History', ability: 'intelligence', description: 'Your Intelligence (History) check measures your ability to recall lore about historical events, legendary people, ancient kingdoms, and more.' },
  { id: 'insight', name: 'Insight', ability: 'wisdom', description: 'Your Wisdom (Insight) check decides whether you can determine the true intentions of a creature.' },
  { id: 'intimidation', name: 'Intimidation', ability: 'charisma', description: 'When you attempt to influence someone through overt threats, hostile actions, and physical violence.' },
  { id: 'investigation', name: 'Investigation', ability: 'intelligence', description: 'When you look around for clues and make deductions based on those clues.' },
  { id: 'medicine', name: 'Medicine', ability: 'wisdom', description: 'A Wisdom (Medicine) check lets you try to stabilize a dying companion or diagnose an illness.' },
  { id: 'nature', name: 'Nature', ability: 'intelligence', description: 'Your Intelligence (Nature) check measures your ability to recall lore about terrain, plants and animals, the weather, and natural cycles.' },
  { id: 'perception', name: 'Perception', ability: 'wisdom', description: 'Your Wisdom (Perception) check lets you spot, hear, or otherwise detect the presence of something.' },
  { id: 'performance', name: 'Performance', ability: 'charisma', description: 'Your Charisma (Performance) check determines how well you can delight an audience with music, dance, acting, or storytelling.' },
  { id: 'persuasion', name: 'Persuasion', ability: 'charisma', description: 'When you attempt to influence someone through tact, social graces, or good nature.' },
  { id: 'religion', name: 'Religion', ability: 'intelligence', description: 'Your Intelligence (Religion) check measures your ability to recall lore about deities, rites and prayers, religious hierarchies, and more.' },
  { id: 'sleight-of-hand', name: 'Sleight of Hand', ability: 'dexterity', description: 'Whenever you attempt an act of legerdemain or manual trickery, such as planting something on someone.' },
  { id: 'stealth', name: 'Stealth', ability: 'dexterity', description: 'Make a Dexterity (Stealth) check when you attempt to conceal yourself from enemies or sneak past guards.' },
  { id: 'survival', name: 'Survival', ability: 'wisdom', description: 'The DM might ask you to make a Wisdom (Survival) check to follow tracks, hunt wild game, guide your group, and more.' },
];

export const ABILITIES = [
  { id: 'strength', name: 'Strength', abbr: 'STR' },
  { id: 'dexterity', name: 'Dexterity', abbr: 'DEX' },
  { id: 'constitution', name: 'Constitution', abbr: 'CON' },
  { id: 'intelligence', name: 'Intelligence', abbr: 'INT' },
  { id: 'wisdom', name: 'Wisdom', abbr: 'WIS' },
  { id: 'charisma', name: 'Charisma', abbr: 'CHA' },
];

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export function getSkillById(id: string): Skill | undefined {
  return SKILLS.find(s => s.id === id);
}

export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}
