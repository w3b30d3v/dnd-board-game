# D&D Digital Board Game Platform
# CLAUDE CODE MASTER INSTRUCTIONS

---

# 🎯 OVERVIEW

You are implementing a **D&D 5e Digital Board Game Platform** - a cinematic, multiplayer, AI-powered roleplaying platform for web and mobile. This is a complex project with 24 technical specification documents.

**Your Goal:** Build this platform in 8 phases, with each phase being independently deployable and verifiable.

---

# 📚 DOCUMENT INDEX

Read these documents in order. They are located in the project files.

## Core Architecture (Read First)
| Doc | Name | Purpose |
|-----|------|---------|
| 00 | Master Implementation Guide | Overview & navigation |
| 01 | API Specifications Part 1 | Auth, Game, Combat APIs |
| 02 | API Specifications Part 2 | Content, Campaign, Media APIs |
| 03 | Component Integration | Data flows & dependencies |

## Implementation Details
| Doc | Name | Purpose |
|-----|------|---------|
| 04 | Rules Engine Patterns | RAW 5e mechanics |
| 05 | Network Protocol | WebSocket & real-time |
| 06 | Sprint Tasks | Task breakdown |
| 07 | Tech Stack | All technology decisions |
| 08 | Database Schema | Prisma models & SQL |
| 09 | UI Specifications | Design system & components |
| 10 | Project Structure | Folder organization |
| 11 | Content Schemas | 5e data structures |
| 12 | Test Specifications | Testing strategy |
| 13 | Environment Setup | Docker & local dev |
| 14 | Proto Definitions | gRPC services |
| 15 | Wireframes | Screen layouts |

## Implementation Files
| Doc | Name | Purpose |
|-----|------|---------|
| 16 | Root Configuration | package.json, docker-compose |
| 17 | Proto Files | Complete .proto files |
| 18 | Content Seed Data | Spells, monsters, items JSON |
| 19 | GitHub Actions | CI/CD workflows |
| 20 | Rust Rules Engine | Complete Rust implementation |
| 21 | PixiJS Game Core | Game renderer code |
| 22 | Media & Animation | Video, cutscene, VFX system |
| 23 | User Journeys | Player & DM onboarding |
| 24 | Phased Implementation | **START HERE FOR BUILD ORDER** |

---

# 🚀 QUICK START

## Step 1: Read Phase 0 in Document 24
The phased implementation guide tells you exactly what to build and in what order.

## Step 2: Create Project Structure
```bash
# Initialize the monorepo
mkdir dnd-board-game && cd dnd-board-game
git init

# Copy root configs from Document 16
# Create: package.json, pnpm-workspace.yaml, turbo.json, docker-compose.yml
```

## Step 3: Follow Each Phase
Each phase has:
- **Objectives** - What you're building
- **Tasks** - Step-by-step instructions
- **Files** - What to create
- **Acceptance Criteria** - How to verify completion
- **Verification Script** - Automated testing

## Step 4: Report Completion
After each phase, report:
```markdown
## Phase X Complete
- Files created: [list]
- Tests passed: [count]
- Verification: ✅ Passed
- Ready for Phase X+1: Yes
```

---

# 📋 BUILD ORDER

```
Phase 0: Project Setup (1-2 days)
    └── Dev environment, Docker, initial build
         └── Phase 1: Authentication (3-4 days)
              └── Login, register, OAuth, JWT
                   └── Phase 2: Character Builder (5-7 days)
                        └── Full RAW 5e character creation
                             └── Phase 3: Game Board Core (7-10 days)
                                  └── PixiJS canvas, tokens, camera
                                       └── Phase 4: Rules Engine (7-10 days)
                                            └── Rust 5e mechanics
                                                 └── Phase 5: Multiplayer (5-7 days)
                                                      └── WebSocket, sessions, sync
                                                           └── Phase 6: Campaign Builder (7-10 days)
                                                                └── DM tools, map editor
                                                                     └── Phase 7: Media Pipeline (5-7 days)
                                                                          └── AI images, cutscenes
                                                                               └── Phase 8: Polish (5-7 days)
                                                                                    └── Production ready
```

---

# 🛠️ TECHNOLOGY STACK

## Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Game Engine:** PixiJS 7
- **State:** Zustand
- **Forms:** React Hook Form + Zod

## Backend
- **API Gateway:** Node.js + Express
- **Game State:** Node.js + tRPC
- **Rules Engine:** Rust + Tonic (gRPC)
- **Grid Solver:** Rust + Tonic (gRPC)
- **WebSocket:** ws library

## Database
- **Primary:** PostgreSQL 16
- **ORM:** Prisma
- **Cache:** Redis 7
- **Object Storage:** MinIO (S3-compatible)

## Infrastructure
- **Containerization:** Docker
- **Orchestration:** Kubernetes (production)
- **CI/CD:** GitHub Actions
- **CDN:** Cloudflare

---

# ⚠️ CRITICAL REQUIREMENTS

## RAW 5e Compliance
- All mechanics must match official D&D 5e rules
- Reference Document 04 (Rules Engine Patterns) for specifics
- Run golden tests to verify correctness

## Performance Targets
- **Client:** 60 FPS on mid-tier mobile
- **Server:** P50 latency < 150ms
- **WebSocket:** P95 message delivery < 100ms

## Mobile First
- All UI must be responsive
- Touch gestures required (pinch zoom, swipe)
- Minimum touch target: 48x48px

## Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Colorblind modes

---

# 🧪 TESTING STRATEGY

## Unit Tests
- Pure functions: dice, modifiers, calculations
- Run with: `pnpm test:unit`

## Integration Tests
- API endpoints, database operations
- Run with: `pnpm test:integration`

## Golden Tests
- RAW 5e mechanics verification
- 50+ hardcoded scenarios
- Run with: `pnpm test:golden`

## E2E Tests
- Full user journeys (Playwright)
- Run with: `pnpm test:e2e`

## Verification Scripts
- Phase-specific validation
- Run with: `./scripts/verify-phase-X.sh`

---

# 📁 PROJECT STRUCTURE

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
└── scripts/
    └── verify-phase-*.sh    # Verification scripts
```

---

# 🔄 WORKFLOW

## Starting Each Phase

1. **Read the phase section** in Document 24
2. **Create all listed files** - don't skip any
3. **Follow TASK order** - they build on each other
4. **Run verification script** - must pass before proceeding
5. **Complete manual checklist** - if provided
6. **Report completion** - use the template

## When Tests Fail

1. Read the error message carefully
2. Check the relevant specification document
3. Fix the issue
4. Re-run the specific test
5. Re-run full verification
6. Only proceed when all pass

## When Stuck

1. Re-read the relevant document section
2. Check if a prerequisite was missed
3. Verify database migrations are current
4. Check Docker services are running
5. Clear caches: `pnpm clean && pnpm install`

---

# 📊 PHASE COMPLETION CHECKLIST

Use this for each phase:

```markdown
## Phase X: [Name] - COMPLETE

### Summary
- Duration: X days
- Files created: Y
- Tests: Z/Z passed

### Deliverables
- [ ] All files from task list created
- [ ] All acceptance criteria met
- [ ] Verification script passes
- [ ] Manual testing complete (if required)
- [ ] Code committed with phase tag

### Files Created
1. path/to/file1.ts - Description
2. path/to/file2.ts - Description

### Test Results
```
pnpm test output here
```

### Verification
```
./scripts/verify-phase-X.sh output here
```

### Notes
Any issues encountered and how they were resolved.

### Ready for Next Phase
✅ Yes - Proceed to Phase X+1
```

---

# 🎮 KEY FEATURES TO IMPLEMENT

## Player Features
- [ ] Account creation & login
- [ ] Character builder (RAW 5e)
- [ ] Portrait generation (AI)
- [ ] Join game sessions
- [ ] Combat actions (attack, spell, move)
- [ ] Inventory management
- [ ] Level up progression

## DM Features
- [ ] Campaign creation
- [ ] Map editor
- [ ] Encounter builder
- [ ] Monster placement
- [ ] Dialogue trees
- [ ] Cutscene creator
- [ ] Session management

## Multiplayer
- [ ] Real-time synchronization
- [ ] Turn-based combat
- [ ] Chat system
- [ ] Reconnection handling
- [ ] Spectator mode

## Media
- [ ] AI portrait generation
- [ ] Location art generation
- [ ] Spell VFX animations
- [ ] Combat animations
- [ ] Cutscene playback
- [ ] Background music

---

# 🏁 FINAL DEPLOYMENT

After Phase 8 is complete:

1. **Run full test suite**
   ```bash
   pnpm test:all
   ```

2. **Build production assets**
   ```bash
   pnpm build:prod
   ```

3. **Deploy to staging**
   ```bash
   pnpm deploy:staging
   ```

4. **Run smoke tests**
   ```bash
   pnpm test:smoke --env=staging
   ```

5. **Deploy to production**
   ```bash
   pnpm deploy:prod
   ```

---

# 📞 GETTING HELP

If you encounter issues:

1. **Document Reference:** Most answers are in the 24 documents
2. **Search Order:** 
   - Document 24 (implementation steps)
   - Document 07 (tech stack)
   - Document 08 (database)
   - Relevant API doc (01/02)
3. **Common Issues:**
   - DB connection: Check docker-compose is running
   - Build fails: Check Node/Rust versions
   - Tests fail: Run `pnpm db:migrate` first

---

**BEGIN WITH PHASE 0 IN DOCUMENT 24**

Good luck building the future of digital D&D! 🎲

---

# END OF MASTER INSTRUCTIONS
