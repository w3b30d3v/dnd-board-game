# D&D Digital Board Game - Complete Gameplay Implementation Plan

**Created:** January 4, 2026
**Updated:** January 8, 2026
**Status:** Tier 1 Complete
**Total Tasks:** 231 across 4 tiers
**Completed:** 67 (Tier 1)
**Remaining:** 164 (Tiers 2-4)
**Estimated Remaining Effort:** 150-210 hours

---

## Overview

This document contains the complete, exhaustive implementation plan to make the D&D digital board game:
- **Complete**: All D&D 5e mechanics working
- **Immersive**: Rich audio/visual/animation experience
- **Impressive**: Professional-quality polish
- **Up to D&D Standards**: RAW (Rules As Written) 5e compliance

---

## Progress Summary

### Tier 1 Complete (67 tasks)
- **1.1 Rest Mechanics**: shortRest(), longRest(), hit dice, spell slot restoration
- **1.2 Spell System**: Cantrip scaling, upcasting, ritual casting, spell components
- **1.3 Combat Persistence**: combatState field, API endpoints, participant metadata
- **1.4 Multiplayer Sync**: HP_UPDATE, DEATH_SAVE, CONDITION_CHANGE, etc.
- **1.5 Death System**: Death saves, stabilization, nat 20/1 handling
- **1.6 Conditions**: All 14 D&D 5e conditions with RAW effects
- **1.7 Core Actions**: Dash, Disengage, Dodge, Help, Hide, Ready

### Previously Implemented
- Basic combat flow (initiative, turns, attacks)
- Spell casting with slot consumption
- Concentration tracking with damage checks
- Advantage/disadvantage UI
- Automatic saving throw resolution
- WebSocket message handlers (send/receive)
- Token movement with pathfinding
- AoE calculation and visualization
- Health bars and damage tracking
- Basic fog of war

### Needs Implementation
- 164 tasks in Tiers 2-4 organized below

---

## Tier 1: Critical (67 Tasks) - 80-100 Hours

These must be fixed for basic gameplay to work properly.

### 1.1 Rest Mechanics (8 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Create Short Rest button in game UI | `CombatActionBar.tsx` | Pending |
| 2 | Create Long Rest button in game UI | `CombatActionBar.tsx` | Pending |
| 3 | Implement shortRest() in useCombat hook | `useCombat.ts` | Pending |
| 4 | Implement longRest() in useCombat hook | `useCombat.ts` | Pending |
| 5 | Reset hit dice on long rest | `useCombat.ts` | Pending |
| 6 | Restore spell slots on rest (short for warlock, long for others) | `GameSessionContent.tsx` | Pending |
| 7 | Remove conditions that end on rest | `useCombat.ts` | Pending |
| 8 | Sync rest state via WebSocket | `useWebSocket.ts` | Pending |

### 1.2 Spell System Completion (12 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 9 | Add ritual casting option (10 min, no slot) | `CombatActionBar.tsx` | Pending |
| 10 | Implement cantrip scaling by character level | `GameSessionContent.tsx` | Pending |
| 11 | Add upcast spell slot selection UI | `SpellBook.tsx` | Pending |
| 12 | Calculate upcast damage bonuses | `GameSessionContent.tsx` | Pending |
| 13 | Add spell component tracking (V, S, M) | `SpellBook.tsx` | Pending |
| 14 | Implement material component consumption | `GameSessionContent.tsx` | Pending |
| 15 | Add bonus action spell restrictions | `useCombat.ts` | Pending |
| 16 | Implement reaction spells (Shield, Counterspell) | `useCombat.ts` | Pending |
| 17 | Add concentration save prompts on damage | `GameSessionContent.tsx` | Pending |
| 18 | Visual indicator for concentrating creatures | `TokenRenderer.ts` | Pending |
| 19 | Implement spell preparation system | `CharacterSheet.tsx` | Pending |
| 20 | Add prepared spell limits by class | `GameSessionContent.tsx` | Pending |

### 1.3 Combat State Persistence (8 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 21 | Save combat state to database on each turn | `api-gateway/sessions.ts` | Pending |
| 22 | Load combat state on page reload | `GameSessionContent.tsx` | Pending |
| 23 | Persist initiative order | `api-gateway/sessions.ts` | Pending |
| 24 | Persist creature HP and conditions | `api-gateway/sessions.ts` | Pending |
| 25 | Persist spell slot usage | `api-gateway/sessions.ts` | Pending |
| 26 | Persist concentration state | `api-gateway/sessions.ts` | Pending |
| 27 | Add reconnection state recovery | `useWebSocket.ts` | Pending |
| 28 | Handle mid-combat disconnects gracefully | `ws-gateway/handlers.ts` | Pending |

### 1.4 Multiplayer Sync (10 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 29 | Broadcast HP changes to all players | `ws-gateway/handlers.ts` | Pending |
| 30 | Sync condition changes in real-time | `ws-gateway/handlers.ts` | Pending |
| 31 | Broadcast death save results | `ws-gateway/handlers.ts` | Pending |
| 32 | Sync concentration breaks | `ws-gateway/handlers.ts` | Pending |
| 33 | Add player ready checks for combat | `GameSessionContent.tsx` | Pending |
| 34 | Implement DM override controls | `CombatActionBar.tsx` | Pending |
| 35 | Add spectator mode | `GameSessionContent.tsx` | Pending |
| 36 | Handle latency compensation | `useWebSocket.ts` | Pending |
| 37 | Add conflict resolution for simultaneous actions | `ws-gateway/handlers.ts` | Pending |
| 38 | Implement turn timer with auto-skip | `useCombat.ts` | Pending |

### 1.5 Death & Dying System (8 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 39 | Wire death save roll button | `CombatActionBar.tsx` | Pending |
| 40 | Track death save successes/failures per creature | `useCombat.ts` | Pending |
| 41 | Implement stabilization at 3 successes | `useCombat.ts` | Pending |
| 42 | Implement death at 3 failures | `useCombat.ts` | Pending |
| 43 | Add instant death on massive damage | `GameSessionContent.tsx` | Pending |
| 44 | Implement Spare the Dying cantrip | `GameSessionContent.tsx` | Pending |
| 45 | Add healing from 0 HP mechanics | `GameSessionContent.tsx` | Pending |
| 46 | Death save UI with success/failure pips | `CombatActionBar.tsx` | Pending |

### 1.6 Condition Enforcement (12 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 47 | Implement Blinded condition effects | `CombatManager.ts` | Pending |
| 48 | Implement Charmed condition effects | `CombatManager.ts` | Pending |
| 49 | Implement Deafened condition effects | `CombatManager.ts` | Pending |
| 50 | Implement Frightened condition effects | `CombatManager.ts` | Pending |
| 51 | Implement Grappled condition effects | `CombatManager.ts` | Pending |
| 52 | Implement Incapacitated condition effects | `CombatManager.ts` | Pending |
| 53 | Implement Invisible condition effects | `CombatManager.ts` | Pending |
| 54 | Implement Paralyzed condition effects | `CombatManager.ts` | Pending |
| 55 | Implement Petrified condition effects | `CombatManager.ts` | Pending |
| 56 | Implement Poisoned condition effects | `CombatManager.ts` | Pending |
| 57 | Implement Prone condition effects | `CombatManager.ts` | Pending |
| 58 | Implement Restrained/Stunned/Unconscious effects | `CombatManager.ts` | Pending |

### 1.7 Core Movement & Actions (9 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 59 | Implement Dash action (double movement) | `useCombat.ts` | Pending |
| 60 | Implement Disengage action (no OA) | `useCombat.ts` | Pending |
| 61 | Implement Dodge action (disadvantage on attacks) | `useCombat.ts` | Pending |
| 62 | Implement Help action (give advantage) | `useCombat.ts` | Pending |
| 63 | Implement Hide action with Stealth check | `useCombat.ts` | Pending |
| 64 | Implement Ready action with trigger | `useCombat.ts` | Pending |
| 65 | Add bonus action tracking per turn | `useCombat.ts` | Pending |
| 66 | Add reaction tracking per round | `useCombat.ts` | Pending |
| 67 | Implement difficult terrain cost (2x) | `MovementPathfinder.ts` | Pending |

---

## Tier 2: Important (58 Tasks) - 60-80 Hours

Needed for a proper D&D experience.

### 2.1 Monster/NPC Database (8 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 68 | Create Monster model in Prisma schema | `schema.prisma` | Pending |
| 69 | Seed SRD monsters (300+ creatures) | `seed.ts` | Pending |
| 70 | Add monster stat block display | `MonsterStatBlock.tsx` | Pending |
| 71 | Implement monster abilities | `CombatManager.ts` | Pending |
| 72 | Add legendary actions | `useCombat.ts` | Pending |
| 73 | Add lair actions | `useCombat.ts` | Pending |
| 74 | Implement monster multiattack | `CombatManager.ts` | Pending |
| 75 | Add CR-based XP calculation | `GameSessionContent.tsx` | Pending |

### 2.2 Equipment & Items (10 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 76 | Create equipment database with stats | `schema.prisma` | Pending |
| 77 | Implement weapon properties (finesse, versatile, etc.) | `CombatManager.ts` | Pending |
| 78 | Add armor AC calculations | `CombatManager.ts` | Pending |
| 79 | Implement shield bonus | `CombatManager.ts` | Pending |
| 80 | Add magic weapon bonuses | `CombatManager.ts` | Pending |
| 81 | Implement attunement system | `CharacterSheet.tsx` | Pending |
| 82 | Add consumable items (potions, scrolls) | `GameSessionContent.tsx` | Pending |
| 83 | Create inventory management UI | `Inventory.tsx` | Pending |
| 84 | Add item drag-drop to equip | `Inventory.tsx` | Pending |
| 85 | Implement encumbrance rules | `CharacterSheet.tsx` | Pending |

### 2.3 Advanced Combat (12 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 86 | Implement opportunity attacks | `useCombat.ts` | Pending |
| 87 | Add flanking variant rule | `CombatManager.ts` | Pending |
| 88 | Implement cover system (half, 3/4, full) | `CombatManager.ts` | Pending |
| 89 | Add line of sight calculations | `grid-solver/` | Pending |
| 90 | Implement grapple/shove actions | `useCombat.ts` | Pending |
| 91 | Add two-weapon fighting | `CombatManager.ts` | Pending |
| 92 | Implement mounted combat | `useCombat.ts` | Pending |
| 93 | Add size-based movement blocking | `MovementPathfinder.ts` | Pending |
| 94 | Implement reach weapons | `CombatManager.ts` | Pending |
| 95 | Add ranged attacks in melee disadvantage | `CombatManager.ts` | Pending |
| 96 | Implement loading property | `CombatManager.ts` | Pending |
| 97 | Add ammunition tracking | `GameSessionContent.tsx` | Pending |

### 2.4 Class Features (10 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 98 | Implement Barbarian Rage | `CombatManager.ts` | Pending |
| 99 | Implement Rogue Sneak Attack | `CombatManager.ts` | Pending |
| 100 | Implement Fighter Action Surge | `useCombat.ts` | Pending |
| 101 | Implement Paladin Divine Smite | `CombatManager.ts` | Pending |
| 102 | Implement Monk Ki Points | `useCombat.ts` | Pending |
| 103 | Implement Sorcerer Metamagic | `GameSessionContent.tsx` | Pending |
| 104 | Implement Warlock Invocations | `CombatManager.ts` | Pending |
| 105 | Implement Channel Divinity | `useCombat.ts` | Pending |
| 106 | Implement Wild Shape | `GameSessionContent.tsx` | Pending |
| 107 | Implement Bardic Inspiration | `useCombat.ts` | Pending |

### 2.5 AI Content Generation (8 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 108 | Implement Runway video generation for cutscenes | `ai-service-ts/` | Pending |
| 109 | Create ElevenLabs TTS for narration | `ai-service-ts/` | Pending |
| 110 | Generate NPC voice clips | `ai-service-ts/` | Pending |
| 111 | Create dynamic scene backgrounds | `ai-service-ts/` | Pending |
| 112 | Generate battle maps from descriptions | `ai-service-ts/` | Pending |
| 113 | Create item/treasure images | `ai-service-ts/` | Pending |
| 114 | Generate ambient sounds per location | `ai-service-ts/` | Pending |
| 115 | Create victory/defeat cutscenes | `ai-service-ts/` | Pending |

### 2.6 DM Tools (10 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 116 | Add DM creature HP adjustment | `DMControls.tsx` | Pending |
| 117 | Implement monster summoning mid-combat | `GameSessionContent.tsx` | Pending |
| 118 | Add initiative manipulation | `DMControls.tsx` | Pending |
| 119 | Create condition toggle for any creature | `DMControls.tsx` | Pending |
| 120 | Add dice roll override | `DMControls.tsx` | Pending |
| 121 | Implement fog of war reveal/hide tools | `FogOfWar.ts` | Pending |
| 122 | Add environmental hazard placement | `GameSessionContent.tsx` | Pending |
| 123 | Create encounter difficulty calculator | `DMDashboard.tsx` | Pending |
| 124 | Add session notes panel | `DMControls.tsx` | Pending |
| 125 | Implement rule lookup quick reference | `RulesReference.tsx` | Pending |

---

## Tier 3: Polish (71 Tasks) - 50-70 Hours

For an impressive, immersive experience.

### 3.1 Audio System (12 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 126 | Add ambient background music | `AudioManager.ts` | Pending |
| 127 | Create combat music transitions | `AudioManager.ts` | Pending |
| 128 | Add spell casting sound effects | `AudioManager.ts` | Pending |
| 129 | Create weapon hit sounds | `AudioManager.ts` | Pending |
| 130 | Add critical hit sound effect | `AudioManager.ts` | Pending |
| 131 | Create death sound effect | `AudioManager.ts` | Pending |
| 132 | Add dice roll sounds | `AudioManager.ts` | Pending |
| 133 | Create UI interaction sounds | `AudioManager.ts` | Pending |
| 134 | Add victory/defeat music | `AudioManager.ts` | Pending |
| 135 | Implement volume controls | `Settings.tsx` | Pending |
| 136 | Add positional audio for 3D effect | `AudioManager.ts` | Pending |
| 137 | Create environmental sounds (wind, fire, etc.) | `AudioManager.ts` | Pending |

### 3.2 Visual Effects (15 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 138 | Add particle effects for spell casting | `VFXManager.ts` | Pending |
| 139 | Create blood splatter on hit | `VFXManager.ts` | Pending |
| 140 | Add screen shake on critical hit | `GameCanvas.tsx` | Pending |
| 141 | Create death animation | `TokenRenderer.ts` | Pending |
| 142 | Add healing glow effect | `VFXManager.ts` | Pending |
| 143 | Create buff/debuff visual indicators | `TokenRenderer.ts` | Pending |
| 144 | Add floating damage numbers | `VFXManager.ts` | Pending |
| 145 | Create AoE spell animations (fireball, etc.) | `VFXManager.ts` | Pending |
| 146 | Add initiative roll animation | `InitiativeTracker.tsx` | Pending |
| 147 | Create condition visual overlays | `TokenRenderer.ts` | Pending |
| 148 | Add magical weapon glow | `TokenRenderer.ts` | Pending |
| 149 | Create concentration visual indicator | `TokenRenderer.ts` | Pending |
| 150 | Add turn start/end transitions | `GameSessionContent.tsx` | Pending |
| 151 | Create level up celebration | `LevelUpModal.tsx` | Pending |
| 152 | Add loot drop animations | `LootModal.tsx` | Pending |

### 3.3 UI Polish (18 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 153 | Add tooltips for all abilities | `Tooltip.tsx` | Pending |
| 154 | Create spell card hover previews | `SpellCard.tsx` | Pending |
| 155 | Add keyboard shortcuts for common actions | `KeyboardShortcuts.ts` | Pending |
| 156 | Create combat log with filters | `CombatLog.tsx` | Pending |
| 157 | Add turn notification popup | `TurnNotification.tsx` | Pending |
| 158 | Create quick action radial menu | `RadialMenu.tsx` | Pending |
| 159 | Add minimap for large boards | `Minimap.tsx` | Pending |
| 160 | Create health bar animations | `HealthBar.tsx` | Pending |
| 161 | Add smooth camera follow on token | `CameraController.ts` | Pending |
| 162 | Create initiative order display | `InitiativeTracker.tsx` | Pending |
| 163 | Add creature info on hover | `TokenTooltip.tsx` | Pending |
| 164 | Create condition icon tooltips | `ConditionTooltip.tsx` | Pending |
| 165 | Add action economy display | `ActionTracker.tsx` | Pending |
| 166 | Create spell slot visual display | `SpellSlotTracker.tsx` | Pending |
| 167 | Add ability recharge indicators | `AbilityTracker.tsx` | Pending |
| 168 | Create turn timer display | `TurnTimer.tsx` | Pending |
| 169 | Add ping/latency indicator | `ConnectionStatus.tsx` | Pending |
| 170 | Create party health overview | `PartyStatus.tsx` | Pending |

### 3.4 Mobile Optimization (10 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 171 | Optimize touch controls for combat | `TouchControls.ts` | Pending |
| 172 | Add gesture support (pinch zoom, swipe) | `GestureHandler.ts` | Pending |
| 173 | Create mobile-friendly action bar | `MobileActionBar.tsx` | Pending |
| 174 | Optimize spell selection for touch | `SpellSelector.tsx` | Pending |
| 175 | Add haptic feedback on actions | `HapticFeedback.ts` | Pending |
| 176 | Create portrait/landscape layouts | `ResponsiveLayout.tsx` | Pending |
| 177 | Optimize token size for mobile | `TokenRenderer.ts` | Pending |
| 178 | Add one-hand play mode | `OneHandMode.tsx` | Pending |
| 179 | Create mobile character sheet | `MobileCharacterSheet.tsx` | Pending |
| 180 | Optimize network for mobile (reduce payload) | `ws-gateway/` | Pending |

### 3.5 Accessibility (8 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 181 | Add screen reader support | All components | Pending |
| 182 | Create high contrast mode | `ThemeProvider.tsx` | Pending |
| 183 | Add colorblind-friendly options | `Settings.tsx` | Pending |
| 184 | Implement full keyboard navigation | `KeyboardNav.ts` | Pending |
| 185 | Add text size scaling | `Settings.tsx` | Pending |
| 186 | Create audio descriptions for combat | `AudioDescriptions.ts` | Pending |
| 187 | Add reduced motion option | `Settings.tsx` | Pending |
| 188 | Implement focus indicators | Global CSS | Pending |

### 3.6 Quality of Life (8 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 189 | Add auto-save every action | `AutoSave.ts` | Pending |
| 190 | Create undo/redo for DM | `UndoRedo.ts` | Pending |
| 191 | Add combat recap at session end | `CombatRecap.tsx` | Pending |
| 192 | Create quick character import | `CharacterImport.tsx` | Pending |
| 193 | Add D&D Beyond character import | `DnDBeyondImport.ts` | Pending |
| 194 | Create session replay recording | `SessionRecorder.ts` | Pending |
| 195 | Add dice roll history | `DiceHistory.tsx` | Pending |
| 196 | Create combat statistics tracking | `CombatStats.ts` | Pending |

---

## Tier 4: Advanced Features (35 Tasks) - 40-60 Hours

For a truly outstanding experience.

### 4.1 AI Creature Behavior (6 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 197 | Create basic AI attack logic | `CreatureAI.ts` | Pending |
| 198 | Add intelligent target selection | `CreatureAI.ts` | Pending |
| 199 | Implement tactical positioning | `CreatureAI.ts` | Pending |
| 200 | Add spell/ability usage AI | `CreatureAI.ts` | Pending |
| 201 | Create personality-based behavior | `CreatureAI.ts` | Pending |
| 202 | Add self-preservation logic | `CreatureAI.ts` | Pending |

### 4.2 Exploration Mode (8 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 203 | Create exploration movement (no initiative) | `ExplorationMode.tsx` | Pending |
| 204 | Add trap detection and triggering | `TrapSystem.ts` | Pending |
| 205 | Implement secret door discovery | `SecretDoors.ts` | Pending |
| 206 | Create treasure/loot system | `LootSystem.ts` | Pending |
| 207 | Add environmental interactions | `Environment.ts` | Pending |
| 208 | Implement light/darkness mechanics | `LightingSystem.ts` | Pending |
| 209 | Create marching order | `MarchingOrder.tsx` | Pending |
| 210 | Add random encounter triggers | `RandomEncounters.ts` | Pending |

### 4.3 Social Encounters (6 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 211 | Create NPC dialogue system | `DialogueSystem.tsx` | Pending |
| 212 | Add skill challenge framework | `SkillChallenge.tsx` | Pending |
| 213 | Implement persuasion/deception rolls | `SocialRolls.ts` | Pending |
| 214 | Create reputation tracking | `Reputation.ts` | Pending |
| 215 | Add faction relationships | `Factions.ts` | Pending |
| 216 | Create merchant/shop interface | `ShopInterface.tsx` | Pending |

### 4.4 Character Advancement (8 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 217 | Implement XP tracking and leveling | `XPSystem.ts` | Pending |
| 218 | Create level up workflow | `LevelUp.tsx` | Pending |
| 219 | Add multiclassing support | `Multiclass.ts` | Pending |
| 220 | Implement feat selection | `FeatSelection.tsx` | Pending |
| 221 | Create ability score improvement | `ASI.tsx` | Pending |
| 222 | Add subclass selection at appropriate levels | `SubclassSelection.tsx` | Pending |
| 223 | Implement spell learning/preparation changes | `SpellManagement.tsx` | Pending |
| 224 | Create milestone leveling option | `MilestoneLeveling.ts` | Pending |

### 4.5 Campaign Features (7 tasks)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 225 | Add campaign calendar/timeline | `CampaignCalendar.tsx` | Pending |
| 226 | Create world map with travel | `WorldMap.tsx` | Pending |
| 227 | Implement quest journal | `QuestJournal.tsx` | Pending |
| 228 | Add NPC relationship tracker | `NPCRelationships.tsx` | Pending |
| 229 | Create party inventory management | `PartyInventory.tsx` | Pending |
| 230 | Add campaign sharing/publishing | `CampaignSharing.ts` | Pending |
| 231 | Create one-shot quick-start templates | `QuickStart.tsx` | Pending |

---

## Implementation Notes

### Priority Order
1. Complete Tier 1 first - gameplay is broken without these
2. Tier 2 makes it feel like real D&D
3. Tier 3 makes it impressive and polished
4. Tier 4 makes it a premium experience

### Testing Requirements
- Each task should have corresponding unit tests
- Integration tests for multi-component features
- E2E tests for critical user flows
- RAW compliance tests for all D&D mechanics

### Performance Targets
- 60 FPS on mid-tier devices
- WebSocket latency < 100ms P95
- Page load < 3 seconds
- No memory leaks during long sessions

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-01-04 | Initial document created with 231 tasks |

---

## References

- `docs/24_Phased_Implementation_Guide.md` - Phase implementation details
- `docs/04_Rules_Engine_Patterns.md` - D&D 5e RAW specifications
- `docs/33_Complete_Animation_Specification.md` - Animation requirements
- `docs/37_VFX_Effects_Library.md` - Visual effects specifications
- `docs/39_Dynamic_Music_Audio_System.md` - Audio system design
