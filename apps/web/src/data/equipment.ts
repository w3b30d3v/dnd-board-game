// D&D 5e SRD Equipment

export interface Equipment {
  id: string;
  name: string;
  category: 'weapon' | 'armor' | 'adventuring-gear' | 'tool' | 'pack';
  cost?: string;
  weight?: number;
  description: string;
  properties?: string[];
  damage?: string;
  armorClass?: number;
}

// Starting equipment packs
export const EQUIPMENT_PACKS: Record<string, Equipment[]> = {
  "explorer's pack": [
    { id: 'backpack', name: 'Backpack', category: 'adventuring-gear', description: 'A sturdy canvas sack' },
    { id: 'bedroll', name: 'Bedroll', category: 'adventuring-gear', description: 'A rolled sleeping pad and blanket' },
    { id: 'mess-kit', name: 'Mess Kit', category: 'adventuring-gear', description: 'A tin box containing utensils' },
    { id: 'tinderbox', name: 'Tinderbox', category: 'adventuring-gear', description: 'For starting fires' },
    { id: 'torches-10', name: 'Torches (10)', category: 'adventuring-gear', description: 'Provides light for 1 hour each' },
    { id: 'rations-10', name: 'Rations (10 days)', category: 'adventuring-gear', description: 'Trail rations for 10 days' },
    { id: 'waterskin', name: 'Waterskin', category: 'adventuring-gear', description: 'Holds 4 pints of liquid' },
    { id: 'rope-50ft', name: 'Hempen Rope (50 ft)', category: 'adventuring-gear', description: 'A 50-foot length of hemp rope' },
  ],
  "dungeoneer's pack": [
    { id: 'backpack', name: 'Backpack', category: 'adventuring-gear', description: 'A sturdy canvas sack' },
    { id: 'crowbar', name: 'Crowbar', category: 'adventuring-gear', description: 'Provides advantage on Strength checks to pry things open' },
    { id: 'hammer', name: 'Hammer', category: 'adventuring-gear', description: 'A standard hammer' },
    { id: 'pitons-10', name: 'Pitons (10)', category: 'adventuring-gear', description: 'Iron spikes for climbing' },
    { id: 'torches-10', name: 'Torches (10)', category: 'adventuring-gear', description: 'Provides light for 1 hour each' },
    { id: 'tinderbox', name: 'Tinderbox', category: 'adventuring-gear', description: 'For starting fires' },
    { id: 'rations-10', name: 'Rations (10 days)', category: 'adventuring-gear', description: 'Trail rations for 10 days' },
    { id: 'waterskin', name: 'Waterskin', category: 'adventuring-gear', description: 'Holds 4 pints of liquid' },
    { id: 'rope-50ft', name: 'Hempen Rope (50 ft)', category: 'adventuring-gear', description: 'A 50-foot length of hemp rope' },
  ],
  "priest's pack": [
    { id: 'backpack', name: 'Backpack', category: 'adventuring-gear', description: 'A sturdy canvas sack' },
    { id: 'blanket', name: 'Blanket', category: 'adventuring-gear', description: 'A warm woolen blanket' },
    { id: 'candles-10', name: 'Candles (10)', category: 'adventuring-gear', description: 'For light and ceremonies' },
    { id: 'tinderbox', name: 'Tinderbox', category: 'adventuring-gear', description: 'For starting fires' },
    { id: 'alms-box', name: 'Alms Box', category: 'adventuring-gear', description: 'For collecting donations' },
    { id: 'incense-2', name: 'Incense (2 blocks)', category: 'adventuring-gear', description: 'For religious ceremonies' },
    { id: 'censer', name: 'Censer', category: 'adventuring-gear', description: 'For burning incense' },
    { id: 'vestments', name: 'Vestments', category: 'adventuring-gear', description: 'Religious robes' },
    { id: 'rations-2', name: 'Rations (2 days)', category: 'adventuring-gear', description: 'Trail rations for 2 days' },
    { id: 'waterskin', name: 'Waterskin', category: 'adventuring-gear', description: 'Holds 4 pints of liquid' },
  ],
  "entertainer's pack": [
    { id: 'backpack', name: 'Backpack', category: 'adventuring-gear', description: 'A sturdy canvas sack' },
    { id: 'bedroll', name: 'Bedroll', category: 'adventuring-gear', description: 'A rolled sleeping pad and blanket' },
    { id: 'costumes-2', name: 'Costumes (2)', category: 'adventuring-gear', description: 'Performance outfits' },
    { id: 'candles-5', name: 'Candles (5)', category: 'adventuring-gear', description: 'For light' },
    { id: 'rations-5', name: 'Rations (5 days)', category: 'adventuring-gear', description: 'Trail rations for 5 days' },
    { id: 'waterskin', name: 'Waterskin', category: 'adventuring-gear', description: 'Holds 4 pints of liquid' },
    { id: 'disguise-kit', name: 'Disguise Kit', category: 'tool', description: 'For changing appearance' },
  ],
  "scholar's pack": [
    { id: 'backpack', name: 'Backpack', category: 'adventuring-gear', description: 'A sturdy canvas sack' },
    { id: 'book-of-lore', name: 'Book of Lore', category: 'adventuring-gear', description: 'A scholarly text' },
    { id: 'ink-bottle', name: 'Ink (1 oz bottle)', category: 'adventuring-gear', description: 'For writing' },
    { id: 'ink-pen', name: 'Ink Pen', category: 'adventuring-gear', description: 'For writing' },
    { id: 'parchment-10', name: 'Parchment (10 sheets)', category: 'adventuring-gear', description: 'For taking notes' },
    { id: 'small-knife', name: 'Small Knife', category: 'adventuring-gear', description: 'For cutting and scraping' },
    { id: 'little-bag-sand', name: 'Little Bag of Sand', category: 'adventuring-gear', description: 'For drying ink' },
  ],
  "burglar's pack": [
    { id: 'backpack', name: 'Backpack', category: 'adventuring-gear', description: 'A sturdy canvas sack' },
    { id: 'ball-bearings', name: 'Ball Bearings (bag of 1,000)', category: 'adventuring-gear', description: 'Can cause slipping' },
    { id: 'string-10ft', name: 'String (10 ft)', category: 'adventuring-gear', description: 'Thin rope' },
    { id: 'bell', name: 'Bell', category: 'adventuring-gear', description: 'For alarms' },
    { id: 'candles-5', name: 'Candles (5)', category: 'adventuring-gear', description: 'For light' },
    { id: 'crowbar', name: 'Crowbar', category: 'adventuring-gear', description: 'For prying' },
    { id: 'hammer', name: 'Hammer', category: 'adventuring-gear', description: 'A standard hammer' },
    { id: 'pitons-10', name: 'Pitons (10)', category: 'adventuring-gear', description: 'Iron spikes' },
    { id: 'hooded-lantern', name: 'Hooded Lantern', category: 'adventuring-gear', description: 'Directional light' },
    { id: 'oil-2', name: 'Oil (2 flasks)', category: 'adventuring-gear', description: 'For the lantern' },
    { id: 'rations-5', name: 'Rations (5 days)', category: 'adventuring-gear', description: 'Trail rations' },
    { id: 'tinderbox', name: 'Tinderbox', category: 'adventuring-gear', description: 'For starting fires' },
    { id: 'waterskin', name: 'Waterskin', category: 'adventuring-gear', description: 'Holds 4 pints' },
    { id: 'rope-50ft', name: 'Hempen Rope (50 ft)', category: 'adventuring-gear', description: '50-foot rope' },
  ],
};

// Common weapons
export const WEAPONS: Equipment[] = [
  // Simple Melee
  { id: 'club', name: 'Club', category: 'weapon', damage: '1d4 bludgeoning', properties: ['Light'], description: 'A simple wooden club' },
  { id: 'dagger', name: 'Dagger', category: 'weapon', damage: '1d4 piercing', properties: ['Finesse', 'Light', 'Thrown (20/60)'], description: 'A sharp blade' },
  { id: 'greatclub', name: 'Greatclub', category: 'weapon', damage: '1d8 bludgeoning', properties: ['Two-Handed'], description: 'A large wooden club' },
  { id: 'handaxe', name: 'Handaxe', category: 'weapon', damage: '1d6 slashing', properties: ['Light', 'Thrown (20/60)'], description: 'A small throwing axe' },
  { id: 'javelin', name: 'Javelin', category: 'weapon', damage: '1d6 piercing', properties: ['Thrown (30/120)'], description: 'A throwing spear' },
  { id: 'light-hammer', name: 'Light Hammer', category: 'weapon', damage: '1d4 bludgeoning', properties: ['Light', 'Thrown (20/60)'], description: 'A small throwing hammer' },
  { id: 'mace', name: 'Mace', category: 'weapon', damage: '1d6 bludgeoning', properties: [], description: 'A flanged metal club' },
  { id: 'quarterstaff', name: 'Quarterstaff', category: 'weapon', damage: '1d6 bludgeoning', properties: ['Versatile (1d8)'], description: 'A wooden staff' },
  { id: 'sickle', name: 'Sickle', category: 'weapon', damage: '1d4 slashing', properties: ['Light'], description: 'A curved blade on a handle' },
  { id: 'spear', name: 'Spear', category: 'weapon', damage: '1d6 piercing', properties: ['Thrown (20/60)', 'Versatile (1d8)'], description: 'A pointed pole weapon' },

  // Simple Ranged
  { id: 'light-crossbow', name: 'Light Crossbow', category: 'weapon', damage: '1d8 piercing', properties: ['Ammunition (80/320)', 'Loading', 'Two-Handed'], description: 'A small crossbow' },
  { id: 'dart', name: 'Dart', category: 'weapon', damage: '1d4 piercing', properties: ['Finesse', 'Thrown (20/60)'], description: 'A small throwing dart' },
  { id: 'shortbow', name: 'Shortbow', category: 'weapon', damage: '1d6 piercing', properties: ['Ammunition (80/320)', 'Two-Handed'], description: 'A small bow' },
  { id: 'sling', name: 'Sling', category: 'weapon', damage: '1d4 bludgeoning', properties: ['Ammunition (30/120)'], description: 'A leather pouch for throwing stones' },

  // Martial Melee
  { id: 'battleaxe', name: 'Battleaxe', category: 'weapon', damage: '1d8 slashing', properties: ['Versatile (1d10)'], description: 'A large single-bladed axe' },
  { id: 'flail', name: 'Flail', category: 'weapon', damage: '1d8 bludgeoning', properties: [], description: 'A spiked ball on a chain' },
  { id: 'glaive', name: 'Glaive', category: 'weapon', damage: '1d10 slashing', properties: ['Heavy', 'Reach', 'Two-Handed'], description: 'A blade on a long pole' },
  { id: 'greataxe', name: 'Greataxe', category: 'weapon', damage: '1d12 slashing', properties: ['Heavy', 'Two-Handed'], description: 'A massive two-handed axe' },
  { id: 'greatsword', name: 'Greatsword', category: 'weapon', damage: '2d6 slashing', properties: ['Heavy', 'Two-Handed'], description: 'A large two-handed sword' },
  { id: 'halberd', name: 'Halberd', category: 'weapon', damage: '1d10 slashing', properties: ['Heavy', 'Reach', 'Two-Handed'], description: 'An axe blade on a pole' },
  { id: 'lance', name: 'Lance', category: 'weapon', damage: '1d12 piercing', properties: ['Reach', 'Special'], description: 'A long spear for mounted combat' },
  { id: 'longsword', name: 'Longsword', category: 'weapon', damage: '1d8 slashing', properties: ['Versatile (1d10)'], description: 'A versatile one-handed sword' },
  { id: 'maul', name: 'Maul', category: 'weapon', damage: '2d6 bludgeoning', properties: ['Heavy', 'Two-Handed'], description: 'A massive war hammer' },
  { id: 'morningstar', name: 'Morningstar', category: 'weapon', damage: '1d8 piercing', properties: [], description: 'A spiked mace' },
  { id: 'pike', name: 'Pike', category: 'weapon', damage: '1d10 piercing', properties: ['Heavy', 'Reach', 'Two-Handed'], description: 'A very long spear' },
  { id: 'rapier', name: 'Rapier', category: 'weapon', damage: '1d8 piercing', properties: ['Finesse'], description: 'A slender thrusting sword' },
  { id: 'scimitar', name: 'Scimitar', category: 'weapon', damage: '1d6 slashing', properties: ['Finesse', 'Light'], description: 'A curved blade' },
  { id: 'shortsword', name: 'Shortsword', category: 'weapon', damage: '1d6 piercing', properties: ['Finesse', 'Light'], description: 'A short blade' },
  { id: 'trident', name: 'Trident', category: 'weapon', damage: '1d6 piercing', properties: ['Thrown (20/60)', 'Versatile (1d8)'], description: 'A three-pronged spear' },
  { id: 'war-pick', name: 'War Pick', category: 'weapon', damage: '1d8 piercing', properties: [], description: 'A military pick' },
  { id: 'warhammer', name: 'Warhammer', category: 'weapon', damage: '1d8 bludgeoning', properties: ['Versatile (1d10)'], description: 'A war hammer' },
  { id: 'whip', name: 'Whip', category: 'weapon', damage: '1d4 slashing', properties: ['Finesse', 'Reach'], description: 'A leather whip' },

  // Martial Ranged
  { id: 'hand-crossbow', name: 'Hand Crossbow', category: 'weapon', damage: '1d6 piercing', properties: ['Ammunition (30/120)', 'Light', 'Loading'], description: 'A one-handed crossbow' },
  { id: 'heavy-crossbow', name: 'Heavy Crossbow', category: 'weapon', damage: '1d10 piercing', properties: ['Ammunition (100/400)', 'Heavy', 'Loading', 'Two-Handed'], description: 'A large crossbow' },
  { id: 'longbow', name: 'Longbow', category: 'weapon', damage: '1d8 piercing', properties: ['Ammunition (150/600)', 'Heavy', 'Two-Handed'], description: 'A large bow' },
];

// Common armor
export const ARMOR: Equipment[] = [
  // Light Armor
  { id: 'padded', name: 'Padded Armor', category: 'armor', armorClass: 11, properties: ['Disadvantage on Stealth'], description: 'Quilted layers of cloth and batting' },
  { id: 'leather', name: 'Leather Armor', category: 'armor', armorClass: 11, properties: [], description: 'Supple and flexible leather' },
  { id: 'studded-leather', name: 'Studded Leather', category: 'armor', armorClass: 12, properties: [], description: 'Leather reinforced with rivets' },

  // Medium Armor
  { id: 'hide', name: 'Hide Armor', category: 'armor', armorClass: 12, properties: [], description: 'Crude armor made from thick furs and pelts' },
  { id: 'chain-shirt', name: 'Chain Shirt', category: 'armor', armorClass: 13, properties: [], description: 'Interlocking metal rings' },
  { id: 'scale-mail', name: 'Scale Mail', category: 'armor', armorClass: 14, properties: ['Disadvantage on Stealth'], description: 'Overlapping metal scales' },
  { id: 'breastplate', name: 'Breastplate', category: 'armor', armorClass: 14, properties: [], description: 'A fitted metal chest piece' },
  { id: 'half-plate', name: 'Half Plate', category: 'armor', armorClass: 15, properties: ['Disadvantage on Stealth'], description: 'Shaped metal plates covering vital areas' },

  // Heavy Armor
  { id: 'ring-mail', name: 'Ring Mail', category: 'armor', armorClass: 14, properties: ['Disadvantage on Stealth'], description: 'Leather with heavy rings' },
  { id: 'chain-mail', name: 'Chain Mail', category: 'armor', armorClass: 16, properties: ['Disadvantage on Stealth', 'Str 13'], description: 'Full suit of interlocking rings' },
  { id: 'splint', name: 'Splint Armor', category: 'armor', armorClass: 17, properties: ['Disadvantage on Stealth', 'Str 15'], description: 'Metal strips riveted to leather' },
  { id: 'plate', name: 'Plate Armor', category: 'armor', armorClass: 18, properties: ['Disadvantage on Stealth', 'Str 15'], description: 'Full plate armor' },

  // Shields
  { id: 'shield', name: 'Shield', category: 'armor', armorClass: 2, properties: [], description: '+2 AC when wielded' },
];

// Get equipment by ID
export function getEquipmentById(id: string): Equipment | undefined {
  return [...WEAPONS, ...ARMOR, ...Object.values(EQUIPMENT_PACKS).flat()].find(e => e.id === id);
}

// Get weapon by ID
export function getWeaponById(id: string): Equipment | undefined {
  return WEAPONS.find(w => w.id === id);
}

// Get armor by ID
export function getArmorById(id: string): Equipment | undefined {
  return ARMOR.find(a => a.id === id);
}
