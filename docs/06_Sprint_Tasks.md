# D&D Digital Board Game Platform
# Document 6: Sprint Task Breakdowns

---

# 1. Overview

This document provides detailed task breakdowns for each sprint, organized by component and milestone. Tasks are sized using story points (Fibonacci: 1, 2, 3, 5, 8, 13) and include dependencies.

**Assumptions:**
- 2-week sprints
- 6 developers per guild average
- ~40 story points per developer per sprint capacity

---

# 2. Milestone A: Foundations (Sprints 1-2)

## Sprint 1: Core Infrastructure & Scaffolding

### Platform/Ops Guild (40 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| OPS-001 | 5 | Set up monorepo structure (Nx/Turborepo) | None |
| OPS-002 | 3 | Configure CI pipeline (GitHub Actions) | OPS-001 |
| OPS-003 | 3 | Set up linting (ESLint, Prettier, Rust clippy) | OPS-001 |
| OPS-004 | 5 | Create Docker Compose dev environment | OPS-001 |
| OPS-005 | 3 | Set up Postgres + Redis containers | OPS-004 |
| OPS-006 | 5 | Configure basic observability (Grafana/Loki) | OPS-004 |
| OPS-007 | 3 | Set up unit test framework (Jest/Vitest) | OPS-001 |
| OPS-008 | 5 | Create staging environment (Kubernetes) | OPS-002 |
| OPS-009 | 3 | Document dev setup in README | OPS-001 |
| OPS-010 | 5 | Set up secrets management (Vault/AWS SM) | OPS-008 |

### Backend Guild (45 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| BE-001 | 8 | Design and create database schema v1 | OPS-005 |
| BE-002 | 5 | Implement Auth service skeleton | OPS-001 |
| BE-003 | 3 | JWT token generation/validation | BE-002 |
| BE-004 | 5 | User registration endpoint | BE-001, BE-002 |
| BE-005 | 5 | User login endpoint | BE-003 |
| BE-006 | 5 | API Gateway setup (Express/Fastify) | OPS-001 |
| BE-007 | 3 | Health check endpoints | BE-006 |
| BE-008 | 5 | Basic rate limiting middleware | BE-006 |
| BE-009 | 3 | Request logging middleware | BE-006 |
| BE-010 | 3 | Error handling middleware | BE-006 |

### Gameplay Guild (35 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| GP-001 | 8 | Design Rules Engine architecture | None |
| GP-002 | 5 | Implement dice roller (d4-d20, advantage) | GP-001 |
| GP-003 | 5 | Implement modifier calculator | GP-001 |
| GP-004 | 5 | Implement ability check resolver | GP-002, GP-003 |
| GP-005 | 5 | Implement saving throw resolver | GP-002, GP-003 |
| GP-006 | 5 | Create 20 golden test fixtures | GP-004, GP-005 |
| GP-007 | 2 | Document Rules Engine API | GP-001 |

### Frontend Guild (40 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| FE-001 | 8 | Set up React/Next.js project structure | OPS-001 |
| FE-002 | 5 | Configure Tailwind CSS | FE-001 |
| FE-003 | 5 | Set up state management (Zustand) | FE-001 |
| FE-004 | 5 | Create basic tile grid renderer | FE-001 |
| FE-005 | 3 | Implement camera pan/zoom controls | FE-004 |
| FE-006 | 3 | Implement tile selection | FE-004 |
| FE-007 | 5 | Create basic HUD component shell | FE-001 |
| FE-008 | 3 | Create dice roll animation component | FE-001 |
| FE-009 | 3 | Set up WebSocket client library | FE-001 |

---

## Sprint 2: Minimal Playable Loop

### Backend Guild (45 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| BE-011 | 8 | Implement WebSocket gateway | BE-006 |
| BE-012 | 5 | Session management service | BE-011 |
| BE-013 | 5 | Message routing to sessions | BE-011, BE-012 |
| BE-014 | 5 | Game State Server skeleton | BE-011 |
| BE-015 | 5 | State persistence to Redis | BE-014, OPS-005 |
| BE-016 | 5 | Basic command validation | BE-014 |
| BE-017 | 5 | State delta broadcasting | BE-014 |
| BE-018 | 3 | Heartbeat handling | BE-011 |
| BE-019 | 4 | Connection/disconnection events | BE-011 |

### Gameplay Guild (40 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| GP-008 | 8 | Integrate Rules Engine with Game State | BE-014 |
| GP-009 | 5 | Implement movement command handler | GP-008 |
| GP-010 | 5 | Implement basic pathfinding (A*) | None |
| GP-011 | 5 | Movement validation (speed, terrain) | GP-009, GP-010 |
| GP-012 | 5 | Position update broadcasting | GP-009 |
| GP-013 | 5 | Skill check command handler | GP-008 |
| GP-014 | 5 | Add 30 more golden fixtures | GP-006 |
| GP-015 | 2 | Integration tests for movement | GP-011 |

### Frontend Guild (45 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| FE-010 | 8 | Token rendering on grid | FE-004 |
| FE-011 | 5 | Token selection and highlighting | FE-010 |
| FE-012 | 5 | Movement path preview | FE-010, FE-005 |
| FE-013 | 5 | Click-to-move interaction | FE-012 |
| FE-014 | 5 | WebSocket connection management | FE-009 |
| FE-015 | 5 | State sync from server | FE-014 |
| FE-016 | 5 | Dice roll UI integration | FE-008 |
| FE-017 | 3 | Basic action buttons (Move, Check) | FE-007 |
| FE-018 | 4 | Error toast notifications | FE-001 |

### Milestone A Exit Criteria Validation
- [ ] Single-player toy scene functional
- [ ] Token moves on grid
- [ ] Ability checks work
- [ ] Dice roll shows result

---

# 3. Milestone B: Tactics MVP (Sprints 3-4)

## Sprint 3: Combat Foundation

### Gameplay Guild (50 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| GP-016 | 8 | Initiative system implementation | GP-008 |
| GP-017 | 5 | Turn order management | GP-016 |
| GP-018 | 5 | Start/end turn hooks | GP-017 |
| GP-019 | 8 | Attack resolver (melee) | GP-004 |
| GP-020 | 5 | Attack resolver (ranged) | GP-019 |
| GP-021 | 5 | Damage calculation | GP-019 |
| GP-022 | 5 | HP tracking and updates | GP-021 |
| GP-023 | 5 | Death at 0 HP handling | GP-022 |
| GP-024 | 4 | Golden fixtures for attacks | GP-019 |

### Gameplay Guild - Grid Solver (35 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| GS-001 | 8 | Line of Sight calculation | None |
| GS-002 | 5 | Wall/obstacle blocking | GS-001 |
| GS-003 | 8 | Cover calculation (½, ¾, total) | GS-001 |
| GS-004 | 5 | LoS golden test scenes | GS-001, GS-002 |
| GS-005 | 5 | Cover golden test scenes | GS-003 |
| GS-006 | 4 | Integration with Rules Engine | GS-001, GS-003 |

### Frontend Guild (45 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| FE-019 | 5 | Initiative tracker UI | GP-016 |
| FE-020 | 5 | Turn indicator (current turn glow) | GP-017 |
| FE-021 | 8 | Target selection for attacks | FE-010 |
| FE-022 | 5 | Attack roll animation | FE-008 |
| FE-023 | 5 | Damage number popup | FE-021 |
| FE-024 | 5 | HP bar on tokens | FE-010 |
| FE-025 | 3 | Death/unconscious visual state | FE-024 |
| FE-026 | 5 | Attack action button | FE-017 |
| FE-027 | 4 | End turn button | FE-017 |

---

## Sprint 4: Combat Polish & AoE

### Gameplay Guild (45 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| GP-025 | 8 | AoE template calculations (sphere) | GS-001 |
| GP-026 | 5 | AoE template (cone) | GP-025 |
| GP-027 | 5 | AoE template (line) | GP-025 |
| GP-028 | 5 | AoE template (cube) | GP-025 |
| GP-029 | 5 | AoE affected entities finder | GP-025 |
| GP-030 | 5 | Opportunity attack triggers | GP-011 |
| GP-031 | 5 | Basic reactions system | GP-030 |
| GP-032 | 4 | AoE golden fixtures | GP-025-28 |
| GP-033 | 3 | Combat round transition | GP-017 |

### Frontend Guild (40 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| FE-028 | 8 | AoE template overlay rendering | GP-025 |
| FE-029 | 5 | AoE placement preview | FE-028 |
| FE-030 | 5 | Cover indicator icons | GS-003 |
| FE-031 | 5 | LoS visualization (dim blocked tiles) | GS-001 |
| FE-032 | 5 | Reaction prompt modal | GP-031 |
| FE-033 | 5 | Combat log panel | GP-019 |
| FE-034 | 4 | Round counter display | GP-033 |
| FE-035 | 3 | "Your turn" notification | GP-017 |

### Backend Guild (30 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| BE-020 | 5 | Reaction window handling | GP-031 |
| BE-021 | 5 | Turn timer implementation | GP-017 |
| BE-022 | 5 | Multiple client sync testing | BE-017 |
| BE-023 | 5 | Load test: 10 concurrent combats | BE-022 |
| BE-024 | 5 | Reconnection handling | BE-019 |
| BE-025 | 5 | State recovery after reconnect | BE-024 |

### Milestone B Exit Criteria Validation
- [ ] Full RAW combat works
- [ ] Initiative, turns, rounds functional
- [ ] Attacks hit/miss correctly
- [ ] Cover applies AC bonus
- [ ] AoE templates render correctly

---

# 4. Milestone C: Spellcasting & Encounters (Sprints 5-6)

## Sprint 5: Spellcasting System

### Gameplay Guild (50 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| GP-034 | 8 | Spell slot management | GP-008 |
| GP-035 | 5 | Spell preparation system | GP-034 |
| GP-036 | 8 | Spell targeting validation | GS-001, GP-029 |
| GP-037 | 5 | Spell damage resolution | GP-021 |
| GP-038 | 5 | Saving throw spells | GP-005, GP-037 |
| GP-039 | 5 | Attack roll spells | GP-019, GP-037 |
| GP-040 | 5 | Concentration tracking | GP-034 |
| GP-041 | 5 | Concentration save on damage | GP-040 |
| GP-042 | 4 | Spell golden fixtures (20 spells) | GP-036-41 |

### Gameplay Guild - Content (30 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| CON-001 | 8 | Spell data schema design | None |
| CON-002 | 5 | Import PHB cantrips (20) | CON-001 |
| CON-003 | 5 | Import Level 1 spells (30) | CON-001 |
| CON-004 | 5 | Import Level 2-3 spells (30) | CON-001 |
| CON-005 | 4 | Spell search/filter API | CON-001 |
| CON-006 | 3 | Spell data validation tests | CON-002-04 |

### Frontend Guild (40 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| FE-036 | 8 | Spell list UI component | CON-001 |
| FE-037 | 5 | Spell slot tracker UI | GP-034 |
| FE-038 | 5 | Spell targeting mode | GP-036 |
| FE-039 | 8 | Spell VFX system (basic) | None |
| FE-040 | 5 | Fireball VFX | FE-039 |
| FE-041 | 5 | Magic Missile VFX | FE-039 |
| FE-042 | 4 | Concentration indicator | GP-040 |

---

## Sprint 6: Encounters & Conditions

### Gameplay Guild (45 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| GP-043 | 8 | Condition system framework | GP-008 |
| GP-044 | 5 | Implement all 15 conditions | GP-043 |
| GP-045 | 5 | Condition effect application | GP-044 |
| GP-046 | 5 | Condition duration tracking | GP-043 |
| GP-047 | 5 | Save-to-end conditions | GP-046 |
| GP-048 | 5 | Effect duration system | GP-046 |
| GP-049 | 5 | Buff/debuff stacking rules | GP-048 |
| GP-050 | 4 | Condition golden fixtures | GP-044 |
| GP-051 | 3 | Integrate conditions with attacks | GP-044 |

### Tools Guild (40 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| TL-001 | 8 | Encounter editor UI skeleton | FE-001 |
| TL-002 | 5 | Monster placement on map | TL-001 |
| TL-003 | 5 | Monster stat block display | CON-001 |
| TL-004 | 5 | Encounter difficulty calculator | TL-002 |
| TL-005 | 5 | Save/load encounter | TL-001 |
| TL-006 | 5 | Trigger system (basic) | TL-001 |
| TL-007 | 4 | Objective definition | TL-001 |
| TL-008 | 3 | Encounter validation | TL-002-07 |

### Frontend Guild (35 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| FE-043 | 5 | Condition icons on tokens | GP-043 |
| FE-044 | 5 | Condition tooltip details | FE-043 |
| FE-045 | 5 | Buff/debuff duration display | GP-048 |
| FE-046 | 8 | Basic cutscene player | None |
| FE-047 | 5 | Camera pan during cutscene | FE-046 |
| FE-048 | 4 | Text overlay system | FE-046 |
| FE-049 | 3 | Boss title card | FE-048 |

### Milestone C Exit Criteria
- [ ] Spellcasting fully functional
- [ ] Concentration works
- [ ] All conditions implemented
- [ ] 2-3 encounter mini-dungeon playable
- [ ] Basic cutscenes work

---

# 5. Milestone D: Multiplayer Core (Sprints 7-8)

## Sprint 7: Networking & Matchmaking

### Backend Guild (50 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| BE-026 | 8 | Matchmaking service | BE-006 |
| BE-027 | 5 | Lobby creation/management | BE-026 |
| BE-028 | 5 | Player invitation system | BE-027 |
| BE-029 | 5 | Ready check system | BE-027 |
| BE-030 | 5 | Character slot assignment | BE-027 |
| BE-031 | 8 | Multi-client state sync | BE-017 |
| BE-032 | 5 | Conflict resolution (same tile) | BE-031 |
| BE-033 | 5 | Turn authorization | BE-031 |
| BE-034 | 4 | Spectator mode | BE-027 |

### Backend Guild - Chat (25 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| BE-035 | 5 | Text chat service | BE-011 |
| BE-036 | 3 | Chat channels (party, all, DM) | BE-035 |
| BE-037 | 3 | Whisper messages | BE-035 |
| BE-038 | 5 | Chat history persistence | BE-035 |
| BE-039 | 5 | Basic moderation (mute/block) | BE-035 |
| BE-040 | 4 | Profanity filter | BE-039 |

### Frontend Guild (40 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| FE-050 | 8 | Lobby browser UI | BE-026 |
| FE-051 | 5 | Lobby creation form | FE-050 |
| FE-052 | 5 | Party roster display | BE-027 |
| FE-053 | 5 | Ready check UI | BE-029 |
| FE-054 | 5 | Character selection in lobby | BE-030 |
| FE-055 | 5 | Chat panel | BE-035 |
| FE-056 | 4 | Chat input with channels | FE-055 |
| FE-057 | 3 | Player status indicators | BE-019 |

---

## Sprint 8: Sync & Recovery

### Backend Guild (45 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| BE-041 | 8 | Sequence number system | BE-031 |
| BE-042 | 5 | Delta compression | BE-041 |
| BE-043 | 8 | Reconnection protocol | BE-024 |
| BE-044 | 5 | State delta recovery | BE-043 |
| BE-045 | 5 | Full state snapshot recovery | BE-043 |
| BE-046 | 5 | Session migration (server failover) | BE-045 |
| BE-047 | 5 | DM takeover of disconnected player | BE-043 |
| BE-048 | 4 | Connection quality metrics | BE-011 |

### Platform/Ops Guild (35 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| OPS-011 | 8 | Load testing framework | BE-031 |
| OPS-012 | 5 | 4-player session load tests | OPS-011 |
| OPS-013 | 5 | Desync detection monitoring | BE-041 |
| OPS-014 | 5 | Reconnection success rate metrics | BE-043 |
| OPS-015 | 5 | Auto-scaling configuration | OPS-008 |
| OPS-016 | 4 | Chaos testing: network latency | OPS-011 |
| OPS-017 | 3 | Alert for session crashes | OPS-006 |

### Frontend Guild (35 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| FE-058 | 5 | Connection status indicator | BE-011 |
| FE-059 | 5 | Reconnecting overlay | BE-043 |
| FE-060 | 5 | Sync progress indicator | BE-044 |
| FE-061 | 5 | Latency display | BE-048 |
| FE-062 | 8 | State reconciliation (rollback) | BE-041 |
| FE-063 | 4 | "Player disconnected" notification | BE-019 |
| FE-064 | 3 | Waiting for player indicator | FE-063 |

### Milestone D Exit Criteria
- [ ] 3-4 players can connect
- [ ] Lobbies and matchmaking work
- [ ] Chat functional
- [ ] No desyncs in normal play
- [ ] Reconnection recovers state

---

# 6. Milestone E: Builders (Sprints 9-10)

## Sprint 9: Character Builder

### Frontend Guild (50 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| FE-065 | 8 | Character builder wizard | None |
| FE-066 | 5 | Race selection step | FE-065 |
| FE-067 | 5 | Class selection step | FE-065 |
| FE-068 | 5 | Background selection step | FE-065 |
| FE-069 | 8 | Ability score assignment | FE-065 |
| FE-070 | 5 | Skill/proficiency selection | FE-065 |
| FE-071 | 5 | Equipment selection | FE-065 |
| FE-072 | 5 | Character sheet preview | FE-065 |
| FE-073 | 4 | Character portrait selection | FE-065 |

### Backend Guild (35 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| BE-049 | 8 | Character service | BE-006 |
| BE-050 | 5 | Character creation endpoint | BE-049 |
| BE-051 | 5 | Character validation | BE-050 |
| BE-052 | 5 | Character persistence | BE-049 |
| BE-053 | 5 | Character retrieval/list | BE-049 |
| BE-054 | 4 | Character export | BE-049 |
| BE-055 | 3 | Character duplication | BE-049 |

### Gameplay Guild - Content (30 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| CON-007 | 5 | Race data (PHB races) | CON-001 |
| CON-008 | 5 | Class data (PHB classes) | CON-001 |
| CON-009 | 5 | Background data (PHB) | CON-001 |
| CON-010 | 5 | Equipment data (PHB) | CON-001 |
| CON-011 | 5 | Feat data (PHB) | CON-001 |
| CON-012 | 5 | Content API optimization | CON-005 |

---

## Sprint 10: Campaign Builder

### Tools Guild (50 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| TL-009 | 8 | Map editor foundation | None |
| TL-010 | 5 | Tile palette/brush tools | TL-009 |
| TL-011 | 5 | Wall/door placement | TL-009 |
| TL-012 | 5 | Light source placement | TL-009 |
| TL-013 | 5 | Spawn point definition | TL-009 |
| TL-014 | 5 | Map transitions | TL-009 |
| TL-015 | 8 | Dialogue tree editor | None |
| TL-016 | 5 | Dialogue branching | TL-015 |
| TL-017 | 4 | Skill check in dialogue | TL-015 |

### Backend Guild (40 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| BE-056 | 8 | Campaign Builder backend | BE-006 |
| BE-057 | 5 | Campaign CRUD | BE-056 |
| BE-058 | 5 | Map storage | BE-056 |
| BE-059 | 5 | Encounter storage | BE-056 |
| BE-060 | 5 | Dialogue storage | BE-056 |
| BE-061 | 5 | Campaign validation | BE-056 |
| BE-062 | 4 | Campaign publishing | BE-056 |
| BE-063 | 3 | Campaign versioning | BE-062 |

### Frontend Guild (25 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| FE-074 | 5 | Level up flow | BE-049 |
| FE-075 | 5 | Inventory management UI | BE-049 |
| FE-076 | 5 | Spell preparation UI | GP-035 |
| FE-077 | 5 | Character deletion confirm | BE-049 |
| FE-078 | 5 | My characters list | BE-053 |

### Milestone E Exit Criteria
- [ ] Character builder creates valid characters
- [ ] Characters can be used in sessions
- [ ] DM can create basic map
- [ ] DM can place encounters
- [ ] DM can create dialogue trees
- [ ] Campaigns can be published

---

# 7. Milestone F: Media & Launch Content (Sprints 11-12)

## Sprint 11: Media Pipeline

### Media Guild (50 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| MD-001 | 8 | AI portrait generation integration | None |
| MD-002 | 5 | Portrait generation queue | MD-001 |
| MD-003 | 5 | Portrait safety filtering | MD-001 |
| MD-004 | 5 | Location art generation | MD-001 |
| MD-005 | 8 | Cutscene video generation | MD-001 |
| MD-006 | 5 | Asset upload pipeline | None |
| MD-007 | 5 | CDN integration | MD-006 |
| MD-008 | 5 | Asset management API | MD-006 |
| MD-009 | 4 | Media job status tracking | MD-002 |

### Tools Guild (35 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| TL-018 | 8 | Cutscene editor | TL-015 |
| TL-019 | 5 | Camera shot sequencing | TL-018 |
| TL-020 | 5 | Text overlay in cutscenes | TL-018 |
| TL-021 | 5 | Media library browser | MD-008 |
| TL-022 | 5 | Generate portrait button | MD-001 |
| TL-023 | 4 | Generate location art button | MD-004 |
| TL-024 | 3 | Preview cutscene | TL-018 |

### Frontend Guild (30 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| FE-079 | 8 | Enhanced cutscene player | FE-046 |
| FE-080 | 5 | Screen shake effects | FE-079 |
| FE-081 | 5 | Fade transitions | FE-079 |
| FE-082 | 5 | Boss intro sequence | FE-079 |
| FE-083 | 4 | Victory/defeat cutscenes | FE-079 |
| FE-084 | 3 | Portrait display in dialogue | TL-015 |

---

## Sprint 12: Launch Content & Polish

### Content Team (40 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| CT-001 | 13 | Tutorial campaign (levels 1-3) | All |
| CT-002 | 8 | Tutorial maps (3) | TL-009 |
| CT-003 | 8 | Tutorial encounters (5) | TL-001 |
| CT-004 | 5 | Tutorial dialogue | TL-015 |
| CT-005 | 3 | Tutorial cutscenes (3) | TL-018 |
| CT-006 | 3 | Tutorial testing | CT-001-05 |

### Platform/Ops Guild (35 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| OPS-018 | 8 | Production environment setup | OPS-008 |
| OPS-019 | 5 | CDN configuration | MD-007 |
| OPS-020 | 5 | SSL/TLS setup | OPS-018 |
| OPS-021 | 5 | DDoS protection | OPS-018 |
| OPS-022 | 5 | Backup/disaster recovery | OPS-018 |
| OPS-023 | 4 | Production monitoring | OPS-006 |
| OPS-024 | 3 | Incident response runbook | OPS-023 |

### QA/Testing (40 points)

| Task | Points | Description | Dependencies |
|------|--------|-------------|--------------|
| QA-001 | 8 | E2E test suite | All |
| QA-002 | 5 | Combat scenario tests | QA-001 |
| QA-003 | 5 | Multiplayer tests | QA-001 |
| QA-004 | 5 | Character builder tests | QA-001 |
| QA-005 | 5 | Campaign builder tests | QA-001 |
| QA-006 | 5 | Performance benchmarks | QA-001 |
| QA-007 | 4 | Accessibility audit | QA-001 |
| QA-008 | 3 | Mobile testing | QA-001 |

### Milestone F Exit Criteria
- [ ] Media pipeline functional
- [ ] Tutorial campaign complete
- [ ] External alpha ready
- [ ] Production environment stable
- [ ] All critical bugs fixed

---

# 8. Task Dependency Graph (Critical Path)

```
Sprint 1                Sprint 2              Sprint 3-4           Sprint 5-6
┌─────────┐            ┌─────────┐           ┌─────────┐          ┌─────────┐
│ OPS-001 │──────────▶ │ BE-011  │─────────▶ │ GP-016  │────────▶ │ GP-034  │
│ Monorepo│            │WebSocket│           │Initiative│         │Spellcast│
└─────────┘            └─────────┘           └─────────┘          └─────────┘
     │                      │                     │                    │
     ▼                      ▼                     ▼                    ▼
┌─────────┐            ┌─────────┐           ┌─────────┐          ┌─────────┐
│ FE-001  │──────────▶ │ FE-014  │─────────▶ │ FE-019  │────────▶ │ FE-036  │
│ React   │            │ WS Conn │           │Init UI  │          │Spell UI │
└─────────┘            └─────────┘           └─────────┘          └─────────┘
     │                      │                     │                    │
     ▼                      ▼                     ▼                    ▼
┌─────────┐            ┌─────────┐           ┌─────────┐          ┌─────────┐
│ GP-001  │──────────▶ │ GP-008  │─────────▶ │ GP-019  │────────▶ │ GP-043  │
│ Rules   │            │Integrate│           │ Attack  │          │Condition│
└─────────┘            └─────────┘           └─────────┘          └─────────┘


Sprint 7-8             Sprint 9-10           Sprint 11-12
┌─────────┐            ┌─────────┐           ┌─────────┐
│ BE-026  │──────────▶ │ FE-065  │─────────▶ │ CT-001  │
│Matchmake│            │Char Bldr│           │Tutorial │
└─────────┘            └─────────┘           └─────────┘
     │                      │                    │
     ▼                      ▼                    ▼
┌─────────┐            ┌─────────┐           ┌─────────┐
│ BE-041  │──────────▶ │ TL-009  │─────────▶ │ OPS-018 │
│ Seq Num │            │ Map Ed  │           │ Prod Env│
└─────────┘            └─────────┘           └─────────┘
```

---

# 9. Risk Items per Sprint

| Sprint | Risk | Mitigation |
|--------|------|------------|
| 1 | Monorepo complexity | Start simple, add tooling iteratively |
| 2 | WebSocket reliability | Use battle-tested library (Socket.io) |
| 3 | Initiative edge cases | Comprehensive golden tests |
| 4 | AoE calculation accuracy | RAW reference tests |
| 5 | Spell complexity | Start with simple spells, iterate |
| 6 | Condition interactions | Isolate each condition |
| 7 | Multi-client sync | Authoritative server model |
| 8 | Reconnection edge cases | Extensive chaos testing |
| 9 | Character validity | Server-side validation |
| 10 | Campaign complexity | MVP feature set only |
| 11 | AI generation quality | Safety filters, human review |
| 12 | Launch readiness | Feature freeze, bug bash |

---

# END OF SPRINT TASK BREAKDOWNS