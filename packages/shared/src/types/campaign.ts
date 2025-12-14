// Campaign Builder Types

// ========================
// Campaign
// ========================

export type CampaignStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface LevelRange {
  min: number;
  max: number;
}

export interface Campaign {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  isPublic: boolean;
  status: CampaignStatus;
  recommendedLevel: LevelRange;
  settings: Record<string, unknown>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  // Relations
  maps?: GameMap[];
  encounters?: Encounter[];
  npcs?: NPC[];
  dialogues?: Dialogue[];
  quests?: Quest[];
  players?: CampaignPlayer[];
  _count?: {
    maps: number;
    encounters: number;
    npcs: number;
    quests: number;
  };
}

export interface CampaignPlayer {
  id: string;
  campaignId: string;
  userId: string;
  role: 'dm' | 'player';
  joinedAt: string;
  user?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  coverImageUrl?: string;
  isPublic?: boolean;
  recommendedLevel?: LevelRange;
  settings?: Record<string, unknown>;
  tags?: string[];
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  coverImageUrl?: string | null;
  isPublic?: boolean;
  status?: CampaignStatus;
  recommendedLevel?: LevelRange;
  settings?: Record<string, unknown>;
  tags?: string[];
}

// ========================
// Map
// ========================

export interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  tiles: MapTile[];
}

export interface MapTile {
  x: number;
  y: number;
  terrain: MapTerrainType;
  elevation?: number;
  rotation?: number;
  customTexture?: string;
}

export type MapTerrainType =
  | 'grass'
  | 'stone'
  | 'water'
  | 'lava'
  | 'ice'
  | 'sand'
  | 'wood'
  | 'void'
  | 'difficult';

export interface MapLighting {
  globalLight: number;
  ambientColor: string;
  lightSources?: LightSource[];
}

export interface LightSource {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
  flicker?: boolean;
}

export interface MapAmbience {
  weather?: 'clear' | 'rain' | 'snow' | 'fog' | 'storm';
  timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night';
  soundscape?: string;
}

export interface GameMap {
  id: string;
  campaignId: string;
  name: string;
  description?: string;
  width: number;
  height: number;
  gridSize: number;
  tileSize: number;
  layers: MapLayer[];
  backgroundUrl?: string;
  lighting: MapLighting;
  ambience: MapAmbience;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMapInput {
  name: string;
  description?: string;
  width: number;
  height: number;
  gridSize?: number;
  tileSize?: number;
  layers?: unknown[];
  backgroundUrl?: string;
  lighting?: Record<string, unknown>;
  ambience?: Record<string, unknown>;
  tags?: string[];
}

// ========================
// Encounter
// ========================

export type EncounterDifficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly';

export interface PlacedMonster {
  id: string;
  monsterId: string;
  name: string;
  x: number;
  y: number;
  hp?: number;
  maxHp?: number;
  conditions?: string[];
}

export interface EncounterObjective {
  id: string;
  type: 'defeat_all' | 'defeat_target' | 'survive' | 'protect' | 'reach' | 'custom';
  description: string;
  targetId?: string;
  location?: { x: number; y: number };
  turns?: number;
  completed?: boolean;
}

export interface EncounterReward {
  id: string;
  type: 'xp' | 'gold' | 'item' | 'quest';
  amount?: number;
  itemId?: string;
  questId?: string;
  description?: string;
}

export interface EncounterTrigger {
  id: string;
  event: 'combat_start' | 'round_start' | 'hp_threshold' | 'creature_death' | 'custom';
  condition?: string;
  action: 'spawn' | 'dialogue' | 'environment' | 'sound' | 'effect';
  payload: Record<string, unknown>;
}

export interface Encounter {
  id: string;
  campaignId: string;
  mapId?: string;
  name: string;
  description?: string;
  difficulty: EncounterDifficulty;
  recommendedLevel: LevelRange;
  monsters: PlacedMonster[];
  objectives: EncounterObjective[];
  rewards: EncounterReward[];
  triggers: EncounterTrigger[];
  environment: Record<string, unknown>;
  audio: Record<string, unknown>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  // Relations
  map?: GameMap;
}

export interface CreateEncounterInput {
  name: string;
  description?: string;
  mapId?: string;
  difficulty?: EncounterDifficulty;
  recommendedLevel?: LevelRange;
  monsters?: unknown[];
  objectives?: unknown[];
  rewards?: unknown[];
  triggers?: unknown[];
  environment?: Record<string, unknown>;
  audio?: Record<string, unknown>;
  tags?: string[];
}

// ========================
// NPC
// ========================

export interface NPCStats {
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
  ac?: number;
  hp?: number;
  speed?: number;
  cr?: string;
}

export interface NPC {
  id: string;
  campaignId: string;
  name: string;
  title?: string;
  monsterId?: string;
  stats?: NPCStats;
  portraitUrl?: string;
  description?: string;
  personality?: string;
  motivation?: string;
  secrets?: string;
  defaultLocation?: string;
  currentMapId?: string;
  defaultDialogueId?: string;
  tags: string[];
  isHostile: boolean;
  faction?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  dialogues?: Dialogue[];
}

export interface CreateNPCInput {
  name: string;
  title?: string;
  monsterId?: string;
  stats?: Record<string, unknown>;
  portraitUrl?: string;
  description?: string;
  personality?: string;
  motivation?: string;
  secrets?: string;
  defaultLocation?: string;
  defaultDialogueId?: string;
  tags?: string[];
  isHostile?: boolean;
  faction?: string;
}

// ========================
// Dialogue
// ========================

export type DialogueNodeType = 'text' | 'choice' | 'action' | 'condition' | 'end';

export interface DialogueNode {
  id: string;
  type: DialogueNodeType;
  speaker?: string;
  text?: string;
  choices?: DialogueChoice[];
  action?: DialogueAction;
  condition?: DialogueCondition;
  nextNodeId?: string;
  position?: { x: number; y: number };
}

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId: string;
  condition?: DialogueCondition;
  action?: DialogueAction;
}

export interface DialogueAction {
  type: 'give_item' | 'take_item' | 'give_gold' | 'take_gold' | 'start_quest' | 'set_variable' | 'custom';
  payload: Record<string, unknown>;
}

export interface DialogueCondition {
  type: 'variable' | 'has_item' | 'has_gold' | 'quest_status' | 'skill_check' | 'custom';
  operator?: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: unknown;
  target?: string;
}

export interface DialogueVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean';
  defaultValue: unknown;
}

export interface Dialogue {
  id: string;
  campaignId: string;
  npcId?: string;
  name: string;
  description?: string;
  startNodeId: string;
  nodes: DialogueNode[];
  variables: DialogueVariable[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  // Relations
  npc?: NPC;
}

export interface CreateDialogueInput {
  name: string;
  description?: string;
  npcId?: string;
  startNodeId: string;
  nodes: unknown[];
  variables?: unknown[];
  tags?: string[];
}

// ========================
// Quest
// ========================

export type QuestType = 'main' | 'side' | 'personal';
export type QuestStatus = 'draft' | 'active' | 'completed' | 'failed';

export interface QuestObjective {
  id: string;
  description: string;
  type: 'kill' | 'collect' | 'talk' | 'explore' | 'escort' | 'custom';
  target?: string;
  current?: number;
  required?: number;
  completed?: boolean;
  hidden?: boolean;
}

export interface QuestReward {
  id: string;
  type: 'xp' | 'gold' | 'item' | 'reputation';
  amount?: number;
  itemId?: string;
  faction?: string;
  description?: string;
}

export interface Quest {
  id: string;
  campaignId: string;
  name: string;
  description?: string;
  type: QuestType;
  status: QuestStatus;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  prerequisites: unknown[];
  questGiverId?: string;
  recommendedLevel?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestInput {
  name: string;
  description?: string;
  type?: QuestType;
  objectives?: unknown[];
  rewards?: unknown[];
  prerequisites?: unknown[];
  questGiverId?: string;
  recommendedLevel?: number;
  tags?: string[];
}

// ========================
// Published Campaign
// ========================

export type PublishVisibility = 'public' | 'private' | 'unlisted';

export interface PublishedCampaign {
  id: string;
  campaignId: string;
  version: string;
  name: string;
  description?: string;
  visibility: PublishVisibility;
  price: number;
  content: unknown;
  thumbnailUrl?: string;
  downloads: number;
  rating?: number;
  ratingCount: number;
  tags: string[];
  publishedAt: string;
}

export interface PublishCampaignInput {
  visibility: PublishVisibility;
  price?: number;
  description?: string;
  tags?: string[];
}

// ========================
// Validation
// ========================

export interface ValidationIssue {
  type: 'error' | 'warning';
  category: string;
  message: string;
  location?: string;
}

export interface ValidationResult {
  valid: boolean;
  score: number;
  issues: ValidationIssue[];
  warnings: ValidationIssue[];
}
