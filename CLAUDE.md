# D&D Digital Board Game Platform

## Project Overview

A cinematic, multiplayer, AI-powered D&D 5e digital board game platform for web and mobile. This project implements RAW (Rules As Written) D&D 5th Edition mechanics with animated combat, AI-generated art, and full campaign creation tools.

---

## Quick Start

```bash
# 1. Read the implementation guide first
cat docs/CLAUDE_CODE_INSTRUCTIONS.md

# 2. Follow Phase 0 setup
cat docs/24_Phased_Implementation_Guide.md

# 3. After setup, these commands work:
pnpm install          # Install all dependencies
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm test:golden      # Run RAW 5e validation tests
docker-compose up -d  # Start PostgreSQL + Redis
```

---

## Documentation Index

All specifications are in the `/docs/` directory. **Read in this order:**

### Essential (Read First)
| Document | Purpose |
|----------|---------|
| `CLAUDE_CODE_INSTRUCTIONS.md` | Master instructions for implementation |
| `24_Phased_Implementation_Guide.md` | **START HERE** - Phase-by-phase build order |
| `16_Root_Configuration_Files.md` | All config files to create (package.json, etc) |
| `10_Project_Structure.md` | Complete folder structure |

### Architecture & APIs
| Document | Purpose |
|----------|---------|
| `01_API_Specifications.md` | Auth, Game State, Combat APIs |
| `02_API_Specifications_Part2.md` | Content, Campaign, Media APIs |
| `03_Component_Integration.md` | Service interactions & data flows |
| `17_Proto_Files.md` | gRPC protocol buffer definitions |

### Implementation Code
| Document | Purpose |
|----------|---------|
| `20_Rust_Rules_Engine.md` | Complete Rust implementation (~800 lines) |
| `21_PixiJS_Game_Core.md` | Game renderer implementation (~700 lines) |
| `22_Media_Animation_System.md` | Video, cutscenes, VFX, audio |
| `26_Campaign_Builder_Implementation.md` | Map editor, encounter editor, dialogue system |

### Data & Content
| Document | Purpose |
|----------|---------|
| `08_Database_Schema.md` | PostgreSQL schemas |
| `25_Prisma_Schema.md` | Prisma ORM models |
| `11_Content_Schemas.md` | JSON schemas for 5e content |
| `18_Content_Seed_Data.md` | Spells, monsters, items, conditions |
| `27_Starter_Tutorial_Campaign.md` | Complete tutorial campaign content |

### UI & UX (READ THESE FIRST FOR ALL FRONTEND WORK)
| Document | Purpose |
|----------|---------|
| `33_Complete_Animation_Specification.md` | **CRITICAL: 2600+ lines of exact animation code for EVERY component** |
| `34_Video_Cutscene_Storyboard.md` | **CRITICAL: All video/cutscene sequences with frame-by-frame specs** |
| `30_UI_Component_Specification.md` | Framer Motion setup, React component patterns |
| `31_Asset_Requirements.md` | All images, sounds, videos needed + placeholder strategies |
| `32_Visual_Reference_Guide.md` | Aesthetic direction, emotional goals, what to avoid |
| `29_Design_System.md` | Colors, typography, Tailwind config |
| `09_UI_Specifications.md` | Component behavior specs |
| `15_Wireframes.md` | Screen layouts (ASCII) |
| `23_User_Journeys_Onboarding.md` | Player & DM user flows |

### Character Builder (Phase 2 Specific)
| Document | Purpose |
|----------|---------|
| `43_Character_Builder_Personality_Visualization.md` | **Personality auto-generation, progressive visual build-up, content safety** |

### AI-Powered Graphics & Media (FOR IMPRESSIVE VISUALS)
| Document | Purpose |
|----------|---------|
| `44_NanoBanana_API_Integration.md` | **NanoBanana API integration for AI image generation (characters, locations, monsters, items)** |
| `40_DnD_Immersive_Design_System.md` | **CRITICAL: The complete D&D visual language - textures, borders, cards, animations** |
| `41_Authentic_DnD_Visual_Elements.md` | **CRITICAL: Iconic D&D elements - stat blocks, spell cards, read-aloud boxes, death saves** |
| `42_DnD_Ceremony_Moments.md` | **CRITICAL: Sacred D&D moments - dice physics, initiative, advantage/disadvantage, concentration** |
| `35_AI_Image_Generation_Guide.md` | Complete prompt engineering for characters, locations, items |
| `36_Dynamic_Scene_Generation.md` | Turn DM descriptions into animated parallax scenes |
| `37_VFX_Effects_Library.md` | Complete spell/combat effects with Canvas/particle code |
| `38_AI_Voice_Narration_System.md` | TTS voices for DM narration and NPC dialogue |
| `39_Dynamic_Music_Audio_System.md` | Adaptive music system that responds to gameplay |

### Interactive Prototypes (OPEN THESE TO SEE THE FEEL)
**CRITICAL: These HTML files show the EXACT animations, timings, and interactions expected. Open them in a browser before building any component.**

| Prototype | What It Shows |
|-----------|---------------|
| `mockups/00_immersive_prototype.html` | Core feel: particles, cards, dice, spells |
| `mockups/00_interactive_mockup.html` | Overall UI interaction patterns |
| `mockups/01_dashboard.html` | Main dashboard layout |
| `mockups/02_game_board.html` | Basic board layout |
| `mockups/02_combat_board_prototype.html` | Game board with tokens, fog of war, targeting |
| `mockups/03_character_builder.html` | Character creation basics |
| `mockups/03_character_builder_prototype.html` | Full character creation with animations |
| `mockups/04_spells_abilities.html` | Spells list view |
| `mockups/04_spell_system_prototype.html` | Spell cards, casting animations, schools |
| `mockups/05_dm_campaign_builder.html` | DM builder basics |
| `mockups/05_dm_builder_prototype.html` | Campaign/map editor with full features |
| `mockups/06_dice_ceremony_prototype.html` | D20 rolling with physics & celebrations |
| `mockups/07_multiplayer_lobby_prototype.html` | Party formation, ready checks |
| `mockups/08_initiative_tracker_prototype.html` | Turn order, active player highlight |
| `mockups/09_inventory_system_prototype.html` | Equipment, drag-drop, item tooltips |
| `mockups/10_combat_vfx_prototype.html` | Attack animations, damage numbers, deaths |
| `mockups/11_character_sheet_prototype.html` | Full character sheet with ability rolls |
| `mockups/12_levelup_celebration_prototype.html` | Level up sequence with particles, rewards |
| `mockups/13_death_save_prototype.html` | Death save with tension, heartbeat |
| `mockups/14_cutscene_dialogue_prototype.html` | Visual novel style dialogue, choices |
| `mockups/15_victory_defeat_prototype.html` | Combat end sequences

### Testing & DevOps
| Document | Purpose |
|----------|---------|
| `12_Test_Specifications.md` | Testing strategy |
| `28_E2E_Test_Scenarios.md` | Playwright E2E tests |
| `19_GitHub_Actions_Workflows.md` | CI/CD pipelines |

---

## Frontend Implementation Rules

**MANDATORY for all UI work:**

### Before Writing ANY Frontend Code:
1. Read `33_Complete_Animation_Specification.md` - contains exact Framer Motion code
2. Read `29_Design_System.md` - exact colors, typography, spacing
3. Open the relevant prototype HTML in a browser to see the feel
4. Read `31_Asset_Requirements.md` for placeholder strategies

### Animation Requirements (NON-NEGOTIABLE):
- **Every component** must use Framer Motion
- **Every button** must have hover + tap animations
- **Every modal** must animate in/out with spring physics
- **Every list** must use staggered animations
- **Every page transition** must fade + scale
- **Critical hits** must have particle explosions
- **Dice rolls** must have anticipation → roll → result phases

### Code Pattern (use for ALL components):
```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { EASINGS, DURATIONS, STAGGER } from '@/lib/animations';

const variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: DURATIONS.normal, ease: EASINGS.smooth }
  },
  exit: { opacity: 0, y: -10 }
};

export function MyComponent() {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* content */}
    </motion.div>
  );
}
```

### Color Usage (from 29_Design_System.md):
- Background: `#0F0D13` (darkest), `#1E1B26` (cards), `#2A2735` (elevated)
- Gold (primary): `#F59E0B` - use for CTAs, important elements
- Purple (magic): `#8B5CF6` - use for spells, mystical elements
- Red (danger): `#EF4444` - use for damage, warnings
- Green (health): `#22C55E` - use for healing, success
- Text: `#F4F4F5` (primary), `#A1A1AA` (secondary)

### What Makes It Feel "D&D":
- Particles floating in backgrounds
- Gold glows on important elements
- Spring physics on interactions
- Sound effects on every click
- Dramatic pauses before dice results
- Screen shake on critical hits
- Celebration effects on victories

---

**CRITICAL: Complete each phase fully before moving to the next.**

| Phase | Name | Duration | Key Output |
|-------|------|----------|------------|
| 0 | Project Setup | 1-2 days | Working dev environment |
| 1 | Authentication | 3-4 days | Login, register, JWT |
| 2 | Character Builder | 5-7 days | Full RAW 5e character creation |
| 3 | Game Board Core | 7-10 days | PixiJS canvas with tokens |
| 4 | Rules Engine | 7-10 days | Rust 5e combat mechanics |
| 5 | Multiplayer | 5-7 days | WebSocket real-time sync |
| 6 | Campaign Builder | 7-10 days | DM tools suite |
| 7 | Media Pipeline | 5-7 days | AI image generation |
| 8 | Polish & Launch | 5-7 days | Production deployment |

### Phase Verification

After each phase, run verification:
```bash
./scripts/verify-phase-0.sh  # Phase 0
./scripts/verify-phase-1.sh  # Phase 1
# ... etc
```

Report completion in this format:
```
## Phase X Complete
- Files created: [list]
- Tests: X/Y passed
- Verification: ✅ Passed
- Ready for Phase X+1: Yes
```

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion 10+ (REQUIRED for all UI)
- **Particles:** tsparticles (magic effects)
- **Audio:** Howler.js
- **Game Engine:** PixiJS 7
- **State:** Zustand
- **Forms:** React Hook Form + Zod

### Backend
- **API Gateway:** Node.js + Express
- **Rules Engine:** Rust + Tonic (gRPC)
- **Grid Solver:** Rust + Tonic (gRPC)
- **WebSocket:** ws library

### Database
- **Primary:** PostgreSQL 16
- **ORM:** Prisma
- **Cache:** Redis 7

### Infrastructure
- **Containers:** Docker
- **CI/CD:** GitHub Actions

---

## Project Structure

```
dnd-board-game/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── mobile/              # React Native (future)
├── services/
│   ├── api-gateway/         # REST API (Node.js)
│   ├── game-state/          # Session management
│   ├── ws-gateway/          # WebSocket server
│   ├── rules-engine/        # RAW 5e (Rust)
│   ├── grid-solver/         # LoS/AoE (Rust)
│   └── media-service/       # AI generation
├── packages/
│   ├── shared/              # Shared types & utils
│   ├── ui/                  # Component library
│   └── proto/               # gRPC definitions
├── prisma/
│   └── schema.prisma        # Database schema
├── content/
│   ├── spells/              # 5e spell data
│   ├── monsters/            # Monster data
│   └── items/               # Equipment data
├── infra/
│   ├── docker/              # Dockerfiles
│   └── k8s/                 # Kubernetes manifests
├── scripts/
│   └── verify-phase-*.sh    # Verification scripts
└── docs/                    # All documentation
```

---

## Critical Requirements

### RAW 5e Compliance
- All mechanics must match official D&D 5e rules exactly
- Reference `docs/04_Rules_Engine_Patterns.md` for specifics
- Run `pnpm test:golden` to verify correctness

### Performance Targets
- **Client:** 60 FPS on mid-tier mobile
- **Server:** P50 latency < 150ms
- **WebSocket:** P95 message delivery < 100ms

### Mobile First
- All UI must be responsive
- Touch gestures required (pinch zoom, swipe)
- Minimum touch target: 48x48px

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support

---

## Common Commands

```bash
# Development
pnpm dev                    # Start all services
pnpm dev:web               # Start web app only
pnpm dev:api               # Start API only

# Building
pnpm build                 # Build all
pnpm build:web            # Build web app
pnpm build:services       # Build backend services

# Testing
pnpm test                  # All tests
pnpm test:unit            # Unit tests only
pnpm test:integration     # Integration tests
pnpm test:e2e             # E2E tests (Playwright)
pnpm test:golden          # RAW 5e validation

# Database
pnpm db:generate          # Generate Prisma client
pnpm db:migrate           # Run migrations
pnpm db:seed              # Seed content data
pnpm db:studio            # Open Prisma Studio

# Code Quality
pnpm lint                 # ESLint
pnpm format               # Prettier
pnpm typecheck            # TypeScript check

# Deployment
pnpm deploy:staging       # Deploy to staging
pnpm deploy:prod          # Deploy to production
```

---

## Environment Variables

Create `.env` file from `.env.example`:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dnd
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRY=7d

# Services
API_PORT=4000
WS_PORT=4001
RULES_ENGINE_URL=http://localhost:50051

# AI (for media generation)
REPLICATE_API_TOKEN=your-token
OPENAI_API_KEY=your-key

# Storage
AWS_REGION=us-east-1
MEDIA_BUCKET=dnd-media
CDN_URL=https://cdn.yourdomain.com
```

---

## The D&D Immersion Checklist (MANDATORY)

**Every screen MUST pass this checklist before being considered complete:**

- [ ] **Background has 3+ layers** (texture gradient, color orbs, vignette, noise)
- [ ] **Floating particles are present** (dust, embers, or magic sparkles)
- [ ] **Borders are dimensional** (multiple shadows, gradient borders, corner accents)
- [ ] **Cards have depth** (inner glow, outer shadow, texture, hover glow)
- [ ] **Headings use Cinzel font** with text shadows and decorative underlines
- [ ] **Gold accents appear** on all interactive elements
- [ ] **Hover states add magical glow** (not just color change)
- [ ] **Elements animate in** (fade + slide + scale, staggered)
- [ ] **Nothing is static** (subtle pulse, float, or flicker animations)
- [ ] **Screen feels like an enchanted artifact**, not a generic dark-mode app

**Open `mockups/40_ultimate_immersive_prototype.html` to see the target feel.**

---

## Getting Help

If stuck on implementation:

1. **Re-read the relevant document** - Most answers are in the 39 documents
2. **For UI/Animation work** - Read `33_Complete_Animation_Specification.md` FIRST (exact code for every animation)
3. **For video/cutscenes** - Read `34_Video_Cutscene_Storyboard.md` (frame-by-frame sequences)
4. **For AI image generation** - Read `35_AI_Image_Generation_Guide.md` (complete prompts for all asset types)
5. **For dynamic scenes** - Read `36_Dynamic_Scene_Generation.md` (parallax, atmospheric effects)
6. **For spell/combat VFX** - Read `37_VFX_Effects_Library.md` (Canvas, particles, shaders)
7. **For voice/narration** - Read `38_AI_Voice_Narration_System.md` (TTS integration)
8. **For dynamic music** - Read `39_Dynamic_Music_Audio_System.md` (adaptive audio)
9. **Open the prototypes** - See the mockups/ folder for working examples
10. **Check Document 24** - Phase-specific troubleshooting
11. **Search order:**
   - `33_Complete_Animation_Specification.md` (exact animation code)
   - `34_Video_Cutscene_Storyboard.md` (video sequences)
   - `35-39` (AI graphics and audio systems)
   - `24_Phased_Implementation_Guide.md` (implementation steps)
   - `30_UI_Component_Specification.md` (how to build components)
   - `31_Asset_Requirements.md` (what assets to use/create)
   - API docs (`01`, `02`) for endpoint details

### Common Issues

| Issue | Solution |
|-------|----------|
| DB connection fails | Run `docker-compose up -d` |
| Build fails | Check Node v20, Rust 1.75 versions |
| Tests fail | Run `pnpm db:migrate` first |
| Type errors | Run `pnpm db:generate` for Prisma |

---

## Success Criteria

Before declaring a phase complete:

1. ✅ All files from task list created
2. ✅ All acceptance criteria met
3. ✅ Verification script passes
4. ✅ Manual testing complete (if specified)
5. ✅ Code committed with phase tag

---

**BEGIN WITH PHASE 0 IN `docs/24_Phased_Implementation_Guide.md`**

Good luck building the future of digital D&D! 🎲
