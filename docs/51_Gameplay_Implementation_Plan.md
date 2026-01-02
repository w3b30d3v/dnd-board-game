# Complete Gameplay System Implementation Plan

## Overview

This document outlines the phased implementation of the complete D&D gameplay system, including AI-powered map generation, video cutscenes, voice narration, combat system, and comprehensive media management.

---

## Phase 1: Campaign Workflow & Session Management (Priority: CRITICAL)

### 1.1 Campaign Status Transition
- [ ] Add "Publish Campaign" button on DM Dashboard
- [ ] Add campaign content validation before publishing:
  - Minimum 1 map required
  - Minimum 1 encounter OR 1 quest required
  - At least 1 NPC with portrait
- [ ] Allow draft campaigns to show "Activate" button with validation warnings
- [ ] Add campaign status indicator on dashboard

### 1.2 Start Session Enhancement
- [ ] Show "Start Session" for draft campaigns (with warning)
- [ ] Add pre-session setup screen:
  - Map selection
  - Starting positions
  - Initial fog of war setup
- [ ] Player ready-check system
- [ ] Character selection for players joining

### 1.3 DM Live Building
- [ ] Allow DM to add content during active session
- [ ] Real-time sync of new content to players
- [ ] "Pause for DM preparation" feature
- [ ] Quick encounter creation during gameplay

---

## Phase 2: AI Map Generation (Priority: HIGH)

### 2.1 Claude Map Designer
- [ ] Create map generation prompt system
- [ ] Generate map layouts from natural language descriptions
- [ ] Support for:
  - Dungeon layouts (rooms, corridors, traps)
  - Town layouts (buildings, streets, markets)
  - Wilderness (forests, mountains, rivers)
  - Interiors (taverns, castles, temples)

### 2.2 NanoBanana Map Backgrounds
- [ ] Generate atmospheric background images for maps
- [ ] Multiple styles: battle map, artistic, realistic
- [ ] Tile-based terrain textures
- [ ] Dynamic lighting overlays

### 2.3 Map Assets
- [ ] Generate furniture/prop images
- [ ] Generate creature tokens
- [ ] Generate environmental effects (fire, fog, water)

---

## Phase 3: Video Cutscenes - Runway Gen-3 (Priority: HIGH)

### 3.1 Complete Runway Integration
- [ ] Fix existing Runway API integration
- [ ] Implement text-to-video generation
- [ ] Implement image-to-video generation
- [ ] Add video progress tracking

### 3.2 Cutscene System
- [ ] Cutscene editor in Campaign Studio
- [ ] Scene description to video pipeline
- [ ] Cutscene triggers (encounter start, quest complete, etc.)
- [ ] Cutscene player with skip option

### 3.3 Video Storage & Playback
- [ ] Store videos in R2
- [ ] Video streaming support
- [ ] Thumbnail generation
- [ ] Video caching for performance

---

## Phase 4: Voice Narration - ElevenLabs (Priority: HIGH)

### 4.1 Complete ElevenLabs Integration
- [ ] Voice profile management
- [ ] Text-to-speech generation
- [ ] Emotion modifiers
- [ ] Multiple voice presets (narrator, villain, merchant, etc.)

### 4.2 Narration System
- [ ] Read-aloud text narration
- [ ] NPC dialogue voices
- [ ] DM narration for descriptions
- [ ] Combat commentary

### 4.3 Audio Storage & Playback
- [ ] Store audio in R2
- [ ] Audio streaming
- [ ] Subtitle sync
- [ ] Audio caching

---

## Phase 5: Combat System (Priority: CRITICAL)

### 5.1 Combat UI
- [ ] Initiative tracker with portraits
- [ ] Turn indicator with animations
- [ ] Action economy display (action, bonus, reaction, movement)
- [ ] Target selection system

### 5.2 Attack System
- [ ] Attack roll UI with dice animation
- [ ] Damage calculation and display
- [ ] Critical hit celebration
- [ ] Miss/fumble effects

### 5.3 Spell System
- [ ] Spell list with filtering
- [ ] Spell targeting (self, touch, ranged, AoE)
- [ ] Area of effect visualization
- [ ] Concentration tracking

### 5.4 Combat VFX
- [ ] Damage number popups
- [ ] Hit/miss indicators
- [ ] Spell particle effects (fire, ice, lightning, etc.)
- [ ] Death animations
- [ ] Screen shake on critical hits

---

## Phase 6: Encounter & Creature System (Priority: CRITICAL)

### 6.1 Encounter Placement
- [ ] Place creatures on map during encounter setup
- [ ] Drag-and-drop creature positioning
- [ ] Save creature positions with encounter
- [ ] Multiple creature groups per encounter

### 6.2 Creature Spawning
- [ ] Auto-spawn creatures when encounter triggers
- [ ] Wave-based spawning
- [ ] Reinforcement system
- [ ] Boss creature special handling

### 6.3 Creature AI
- [ ] Basic AI behaviors (aggressive, defensive, coward)
- [ ] Target prioritization
- [ ] Movement patterns
- [ ] Special ability usage

### 6.4 Creature Tokens
- [ ] Generate creature tokens with NanoBanana
- [ ] Health bar display
- [ ] Status effect indicators
- [ ] Size-appropriate tokens (medium, large, huge)

---

## Phase 7: Fog of War & Map Visualization (Priority: HIGH)

### 7.1 Fog of War System
- [ ] Three visibility states (hidden, revealed, visible)
- [ ] DM global reveal control
- [ ] Per-player fog tracking
- [ ] Line-of-sight calculation

### 7.2 Dynamic Lighting
- [ ] Light sources (torches, spells, daylight)
- [ ] Darkvision support
- [ ] Shadow casting
- [ ] Magical darkness

### 7.3 Map Rendering
- [ ] PixiJS map renderer enhancement
- [ ] Terrain textures
- [ ] Animated tiles (water, lava, fire)
- [ ] Weather effects overlay

---

## Phase 8: Campaign Preview & Media Management (Priority: MEDIUM)

### 8.1 Campaign Preview Page
- [ ] All content in one view
- [ ] Setting overview
- [ ] Location gallery
- [ ] NPC roster with portraits
- [ ] Encounter list
- [ ] Quest timeline
- [ ] Media library

### 8.2 Media Library
- [ ] All generated images
- [ ] All videos
- [ ] All audio files
- [ ] Regeneration options
- [ ] Bulk generation

### 8.3 Content Editor
- [ ] Edit any content from preview
- [ ] Quick image regeneration
- [ ] Audio preview and regeneration
- [ ] Video preview

---

## Phase 9: Export/Import System (Priority: MEDIUM)

### 9.1 Enhanced Export
- [ ] Complete JSON with all R2 URLs
- [ ] ZIP with all media downloaded
- [ ] Include:
  - Campaign settings
  - All maps with backgrounds
  - All NPCs with portraits and voice profiles
  - All encounters with creature positions
  - All quests
  - All cutscene videos
  - All narration audio
  - Chat history
  - Game state snapshots

### 9.2 Import System
- [ ] JSON import (uses existing URLs)
- [ ] ZIP import (uploads media to R2)
- [ ] Conflict resolution (merge vs overwrite)
- [ ] Media validation
- [ ] Import preview

### 9.3 Campaign Sharing
- [ ] Generate shareable campaign packages
- [ ] Campaign marketplace preparation
- [ ] Version control for campaigns
- [ ] Fork/extend existing campaigns

---

## Phase 10: Testing & Deployment (Priority: CRITICAL)

### 10.1 Unit Tests
- [ ] Combat mechanics tests
- [ ] Dice roll tests
- [ ] Initiative calculation tests
- [ ] Damage calculation tests

### 10.2 Integration Tests
- [ ] Session creation flow
- [ ] Player joining flow
- [ ] Combat round flow
- [ ] Media generation flow

### 10.3 E2E Tests
- [ ] Full campaign creation
- [ ] Full gameplay session
- [ ] Export/Import cycle
- [ ] Multiplayer session

### 10.4 CI/CD Updates
- [ ] Add new test suites to pipeline
- [ ] Performance benchmarks
- [ ] Media generation mocks for CI
- [ ] Deployment verification

---

## Timeline Estimate

| Phase | Estimated Effort | Dependencies |
|-------|------------------|--------------|
| Phase 1 | 4-6 hours | None |
| Phase 2 | 8-12 hours | Phase 1 |
| Phase 3 | 6-8 hours | Phase 1 |
| Phase 4 | 4-6 hours | Phase 1 |
| Phase 5 | 12-16 hours | Phase 6, 7 |
| Phase 6 | 8-12 hours | Phase 1, 2 |
| Phase 7 | 6-8 hours | Phase 2 |
| Phase 8 | 4-6 hours | Phase 2, 3, 4 |
| Phase 9 | 6-8 hours | Phase 8 |
| Phase 10 | 8-12 hours | All phases |

**Total Estimated Effort: 66-94 hours**

---

## Parallelization Strategy

### Can Run in Parallel:
- Phase 2 (Maps) + Phase 3 (Video) + Phase 4 (Voice)
- Phase 6 (Encounters) + Phase 7 (Fog of War)

### Must Be Sequential:
- Phase 1 → Phase 2, 3, 4
- Phase 6, 7 → Phase 5
- All phases → Phase 9, 10

---

## Success Criteria

1. DM can create and publish campaigns with validation
2. AI-generated maps with impressive backgrounds
3. Video cutscenes play at key moments
4. NPCs speak with unique voices
5. Combat is visually impressive with VFX
6. Creatures spawn and fight intelligently
7. Fog of war reveals dramatically
8. All content viewable in campaign preview
9. Full export/import cycle works
10. All tests pass in CI/CD

---

## Notes

- All media stored in R2 with permanent URLs
- All features designed for mobile-friendly experience
- All animations use Framer Motion or PixiJS
- All AI generation has fallback options
