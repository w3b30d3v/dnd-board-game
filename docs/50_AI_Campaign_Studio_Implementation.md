# AI Campaign Studio Implementation Guide

## Overview

This document details the implementation plan for the AI-powered Campaign Studio, which transforms D&D campaign creation into a conversational, immersive experience.

## Vision

The Campaign Studio allows Dungeon Masters to:
1. **Describe their vision** in natural language
2. **Collaborate with Claude** to refine and expand ideas
3. **Generate rich content** - NPCs, encounters, quests, maps
4. **Create cinematic cutscenes** with Runway Gen-3 video
5. **Add voice narration** with ElevenLabs TTS
6. **Deliver immersive gameplay** to players

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  Campaign Studio UI                                              │
│  ├── ConversationPanel (chat interface)                         │
│  ├── ContentPreview (generated content cards)                   │
│  ├── PhaseProgress (creation phases)                            │
│  └── CutsceneEditor (video preview/timeline)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI Service (TypeScript)                     │
├─────────────────────────────────────────────────────────────────┤
│  Routes:                    │  Handlers:                        │
│  ├── /ai/conversation/*     │  ├── conversation.ts              │
│  └── /ai/generate/*         │  ├── generation.ts                │
│                             │  └── video.ts (planned)           │
├─────────────────────────────────────────────────────────────────┤
│  External APIs:                                                  │
│  ├── Claude (Anthropic) - Chat & Content Generation             │
│  ├── NanoBanana - AI Image Generation                           │
│  ├── Runway Gen-3 - Video Generation                            │
│  └── ElevenLabs - Text-to-Speech                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                                │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL (Prisma)         │  Redis                           │
│  ├── campaigns               │  ├── conversation_state          │
│  ├── maps                    │  ├── generation_queue            │
│  ├── npcs                    │  └── cost_tracking               │
│  ├── encounters              │                                   │
│  ├── quests                  │                                   │
│  └── dialogues               │                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sprint Plan

### Sprint 1: AI Service Foundation (Week 1)

**Goal**: Claude integration and basic conversation flow

**Tasks**:
- [x] Create ai-service-ts package structure
- [x] Implement Claude client (lib/claude.ts)
- [x] Create campaign studio prompts
- [x] Build conversation handler
- [x] Build generation handler
- [x] Create REST API routes
- [ ] Add Redis for conversation state persistence
- [ ] Add cost tracking and limits
- [ ] Write unit tests

**API Endpoints**:
| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /ai/conversation/start` | Start new conversation |
| `POST /ai/conversation/:id/message` | Send message |
| `GET /ai/conversation/:id/history` | Get chat history |
| `POST /ai/conversation/:id/advance` | Move to next phase |
| `POST /ai/generate/setting` | Generate setting |
| `POST /ai/generate/npc` | Generate NPC |
| `POST /ai/generate/encounter` | Generate encounter |
| `POST /ai/generate/quest` | Generate quest |
| `POST /ai/generate/map` | Generate map layout |

**Environment Variables**:
```env
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL_CHAT=claude-sonnet-4-20250514
CLAUDE_MODEL_GENERATION=claude-opus-4-20250514
AI_SERVICE_PORT=4003
```

---

### Sprint 2: Campaign Studio UI (Week 2)

**Goal**: Chat interface and content preview

**Components**:
```
apps/web/src/app/dm/studio/
├── page.tsx                    # Studio entry/list
├── [campaignId]/
│   └── page.tsx               # Active studio session
└── components/
    ├── ConversationPanel.tsx   # Chat interface
    ├── MessageBubble.tsx       # User/AI message display
    ├── PhaseIndicator.tsx      # Current phase progress
    ├── ContentCard.tsx         # Generated content preview
    ├── NPCCard.tsx            # NPC preview card
    ├── EncounterCard.tsx      # Encounter preview card
    ├── QuestCard.tsx          # Quest preview card
    └── MapPreview.tsx         # Map layout preview
```

**Features**:
- Real-time chat with Claude
- Phase progress indicator
- Generated content cards
- Edit/refine workflow
- Save to campaign database

---

### Sprint 3: Video Generation (Week 3)

**Goal**: Runway Gen-3 integration for cutscenes

**Components**:
```
services/ai-service-ts/src/
├── lib/
│   └── runway.ts              # Runway API client
├── handlers/
│   └── video.ts               # Video generation handler
└── routes/
    └── video.ts               # Video API routes

apps/web/src/components/video/
├── CutscenePlayer.tsx         # Video playback
├── CutsceneEditor.tsx         # Timeline/preview
└── VideoGenerationStatus.tsx  # Generation progress
```

**API Endpoints**:
| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /ai/video/generate` | Start video generation |
| `GET /ai/video/:id/status` | Check generation status |
| `GET /ai/video/:id` | Get video URL |

**Cutscene Types**:
1. **Campaign Intro** - Opening cinematic
2. **Location Reveal** - Arriving at new location
3. **NPC Introduction** - Character entrance
4. **Boss Battle** - Epic encounter setup
5. **Quest Completion** - Victory celebration
6. **Campaign Finale** - Ending cinematic

---

### Sprint 4: Voice Narration (Week 4)

**Goal**: ElevenLabs TTS for NPCs and narration

**Components**:
```
services/ai-service-ts/src/
├── lib/
│   └── elevenlabs.ts          # ElevenLabs API client
├── handlers/
│   └── tts.ts                 # TTS handler
└── routes/
    └── tts.ts                 # TTS API routes

apps/web/src/components/audio/
├── NarratorVoice.tsx          # DM narration player
├── NPCVoice.tsx               # NPC dialogue player
└── VoicePreview.tsx           # Voice preview in editor
```

**Voice Types**:
| Voice | Use Case | ElevenLabs Voice |
|-------|----------|------------------|
| Narrator | Read-aloud text, descriptions | Deep, dramatic male |
| Villain | Antagonist dialogue | Dark, menacing |
| Sage | Wise NPC, exposition | Elderly, wise |
| Merchant | Shop NPCs | Friendly, eager |
| Guard | Authority figures | Stern, official |
| Child | Young NPCs | Light, innocent |

---

### Sprint 5: Content Editors (Week 5)

**Goal**: Full-featured map, encounter, NPC, quest editors

**Components**:
```
apps/web/src/app/dm/campaigns/[id]/
├── maps/
│   ├── page.tsx               # Maps list
│   └── [mapId]/
│       └── page.tsx           # Map editor
├── encounters/
│   ├── page.tsx               # Encounters list
│   └── [encounterId]/
│       └── page.tsx           # Encounter editor
├── npcs/
│   ├── page.tsx               # NPCs list
│   └── [npcId]/
│       └── page.tsx           # NPC editor
└── quests/
    ├── page.tsx               # Quests list
    └── [questId]/
        └── page.tsx           # Quest editor
```

**Features**:
- **Map Editor**: Tile painting, terrain, points of interest
- **Encounter Editor**: Monster placement, CR calculator, tactics
- **NPC Editor**: Dialogue trees, personality, voice preview
- **Quest Editor**: Objectives, rewards, branching paths

---

### Sprint 6: Player Experience (Week 6)

**Goal**: Immersive gameplay with cutscenes and atmosphere

**Features**:
- Cutscene playback at key moments
- NPC voice dialogue
- Dynamic background music
- Atmospheric particle effects
- Death save tension
- Victory celebrations

**Integration Points**:
- Game session triggers cutscenes
- NPC interactions play voice
- Combat outcomes trigger effects
- Quest completions show rewards

---

## API Cost Estimates

### Per Campaign Creation

| Service | Estimated Usage | Cost |
|---------|-----------------|------|
| Claude Sonnet | ~50 chat messages | ~$0.50 |
| Claude Opus | ~10 content generations | ~$1.50 |
| NanoBanana | ~20 images | ~$0.80 |
| Runway Gen-3 | ~5 videos (30s each) | ~$5.00 |
| ElevenLabs | ~10 min narration | ~$1.00 |
| **Total** | | **~$9.00** |

### Monthly Estimates (10 DMs, 3 campaigns each)

| Tier | Campaigns/mo | Monthly Cost |
|------|--------------|--------------|
| Starter | 30 | ~$270 |
| Growth | 100 | ~$900 |
| Scale | 500 | ~$4,500 |

---

## Database Schema Updates

```prisma
// New model for conversation state
model ConversationSession {
  id            String   @id @default(uuid())
  campaignId    String
  userId        String
  phase         String   @default("setting")
  messages      Json     @default("[]")
  generatedIds  Json     @default("{}")
  totalCost     Float    @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  campaign      Campaign @relation(fields: [campaignId], references: [id])
  user          User     @relation(fields: [userId], references: [id])
}

// New model for generated videos
model CampaignVideo {
  id           String   @id @default(uuid())
  campaignId   String
  type         String   // intro, location, npc, battle, outro
  prompt       String
  runwayJobId  String?
  videoUrl     String?
  thumbnailUrl String?
  duration     Int?     // seconds
  status       String   @default("pending")
  cost         Float    @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  campaign     Campaign @relation(fields: [campaignId], references: [id])
}

// New model for TTS audio
model CampaignAudio {
  id           String   @id @default(uuid())
  campaignId   String
  type         String   // narration, npc, dialogue
  text         String
  voiceId      String
  audioUrl     String?
  duration     Int?     // seconds
  status       String   @default("pending")
  cost         Float    @default(0)
  createdAt    DateTime @default(now())

  campaign     Campaign @relation(fields: [campaignId], references: [id])
}
```

---

## Testing Strategy

### Unit Tests
- Claude client mocking
- Conversation handler logic
- Generation handler validation
- Cost calculation accuracy

### Integration Tests
- Full conversation flow
- Content generation pipeline
- Video generation status polling
- TTS audio generation

### E2E Tests
- Campaign Studio user journey
- Content editing workflow
- Cutscene playback
- Player gameplay with cutscenes

---

## Deployment

### Railway Services

| Service | Port | Environment |
|---------|------|-------------|
| ai-service | 4003 | ANTHROPIC_API_KEY, RUNWAY_API_KEY, ELEVENLABS_API_KEY |
| api-gateway | 4000 | (existing) |
| ws-gateway | 4002 | (existing) |

### Environment Variables (Railway)

```
# AI Service
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL_CHAT=claude-sonnet-4-20250514
CLAUDE_MODEL_GENERATION=claude-opus-4-20250514
RUNWAY_API_KEY=rw_...
ELEVENLABS_API_KEY=...
AI_SERVICE_PORT=4003
```

---

## Success Metrics

### Phase Completion
- [ ] Sprint 1: AI Service responds to conversation
- [ ] Sprint 2: DM can chat and see generated content
- [ ] Sprint 3: Videos generate and play
- [ ] Sprint 4: NPCs have voice
- [ ] Sprint 5: Full content editing
- [ ] Sprint 6: Players experience cutscenes

### Quality Metrics
- Claude response latency < 3s
- Video generation < 60s
- TTS generation < 10s
- User satisfaction with AI suggestions > 80%

---

## Next Steps

1. **Install dependencies** for ai-service-ts:
   ```bash
   pnpm install
   ```

2. **Add API keys** to Railway environment variables

3. **Start Sprint 1** - Test Claude integration locally

4. **Deploy ai-service** to Railway

5. **Begin Sprint 2** - Campaign Studio UI
