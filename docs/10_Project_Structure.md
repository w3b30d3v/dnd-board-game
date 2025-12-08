# D&D Digital Board Game Platform
# Document 10: Project Structure & File Layout

---

# 1. Monorepo Structure

This document defines the exact file and folder structure for the entire project. Claude Code should follow this structure precisely.

```
dnd-platform/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── deploy-staging.yml
│   │   └── deploy-production.yml
│   ├── CODEOWNERS
│   └── pull_request_template.md
│
├── .vscode/
│   ├── settings.json
│   ├── extensions.json
│   └── launch.json
│
├── apps/
│   ├── web/                          # React web client
│   │   ├── public/
│   │   │   ├── favicon.ico
│   │   │   └── manifest.json
│   │   ├── src/
│   │   │   ├── app/                  # Next.js app router
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   ├── register/page.tsx
│   │   │   │   │   └── forgot-password/page.tsx
│   │   │   │   ├── (game)/
│   │   │   │   │   ├── play/[sessionId]/page.tsx
│   │   │   │   │   └── lobby/[lobbyId]/page.tsx
│   │   │   │   ├── (builder)/
│   │   │   │   │   ├── characters/page.tsx
│   │   │   │   │   ├── characters/[id]/page.tsx
│   │   │   │   │   ├── characters/new/page.tsx
│   │   │   │   │   └── campaigns/page.tsx
│   │   │   │   └── api/              # API routes if needed
│   │   │   ├── components/
│   │   │   │   ├── ui/               # Shadcn/UI components
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── card.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── select.tsx
│   │   │   │   │   ├── tabs.tsx
│   │   │   │   │   ├── toast.tsx
│   │   │   │   │   └── tooltip.tsx
│   │   │   │   ├── game/             # Game-specific components
│   │   │   │   │   ├── Board.tsx
│   │   │   │   │   ├── Token.tsx
│   │   │   │   │   ├── TileGrid.tsx
│   │   │   │   │   ├── FogOfWar.tsx
│   │   │   │   │   ├── AoEOverlay.tsx
│   │   │   │   │   ├── PathPreview.tsx
│   │   │   │   │   └── CoverIndicator.tsx
│   │   │   │   ├── hud/              # HUD components
│   │   │   │   │   ├── ActionBar.tsx
│   │   │   │   │   ├── InitiativeTracker.tsx
│   │   │   │   │   ├── CombatLog.tsx
│   │   │   │   │   ├── CharacterPanel.tsx
│   │   │   │   │   ├── SpellList.tsx
│   │   │   │   │   ├── InventoryPanel.tsx
│   │   │   │   │   └── MiniMap.tsx
│   │   │   │   ├── character-builder/
│   │   │   │   │   ├── RaceSelection.tsx
│   │   │   │   │   ├── ClassSelection.tsx
│   │   │   │   │   ├── AbilityScores.tsx
│   │   │   │   │   ├── BackgroundSelection.tsx
│   │   │   │   │   ├── SkillSelection.tsx
│   │   │   │   │   ├── EquipmentSelection.tsx
│   │   │   │   │   └── CharacterPreview.tsx
│   │   │   │   └── shared/
│   │   │   │       ├── DiceRoller.tsx
│   │   │   │       ├── DamageNumber.tsx
│   │   │   │       ├── ConditionIcon.tsx
│   │   │   │       ├── HealthBar.tsx
│   │   │   │       └── ResourceBar.tsx
│   │   │   ├── game/                 # PixiJS game engine
│   │   │   │   ├── GameApplication.ts
│   │   │   │   ├── scenes/
│   │   │   │   │   ├── CombatScene.ts
│   │   │   │   │   ├── ExplorationScene.ts
│   │   │   │   │   └── CutsceneScene.ts
│   │   │   │   ├── entities/
│   │   │   │   │   ├── TokenSprite.ts
│   │   │   │   │   ├── TileSprite.ts
│   │   │   │   │   └── EffectSprite.ts
│   │   │   │   ├── systems/
│   │   │   │   │   ├── RenderSystem.ts
│   │   │   │   │   ├── AnimationSystem.ts
│   │   │   │   │   ├── InputSystem.ts
│   │   │   │   │   └── CameraSystem.ts
│   │   │   │   ├── effects/
│   │   │   │   │   ├── SpellVFX.ts
│   │   │   │   │   ├── DamageVFX.ts
│   │   │   │   │   └── ParticleEmitter.ts
│   │   │   │   └── utils/
│   │   │   │       ├── GridUtils.ts
│   │   │   │       ├── PathUtils.ts
│   │   │   │       └── SpriteUtils.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useGameConnection.ts
│   │   │   │   ├── useGameState.ts
│   │   │   │   ├── useCombat.ts
│   │   │   │   ├── useCharacter.ts
│   │   │   │   └── useAuth.ts
│   │   │   ├── stores/
│   │   │   │   ├── gameStore.ts
│   │   │   │   ├── authStore.ts
│   │   │   │   ├── uiStore.ts
│   │   │   │   └── settingsStore.ts
│   │   │   ├── lib/
│   │   │   │   ├── api.ts
│   │   │   │   ├── websocket.ts
│   │   │   │   ├── utils.ts
│   │   │   │   └── constants.ts
│   │   │   └── styles/
│   │   │       ├── globals.css
│   │   │       └── game.css
│   │   ├── package.json
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── .env.example
│   │
│   ├── mobile/                       # React Native app
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── navigation/
│   │   │   └── game/
│   │   ├── ios/
│   │   ├── android/
│   │   ├── app.json
│   │   └── package.json
│   │
│   └── dm-tools/                     # DM Tools (separate web app)
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   │   ├── map-editor/
│       │   │   │   ├── MapCanvas.tsx
│       │   │   │   ├── TilePalette.tsx
│       │   │   │   ├── ObjectPlacer.tsx
│       │   │   │   └── LayerPanel.tsx
│       │   │   ├── encounter-editor/
│       │   │   │   ├── MonsterPlacer.tsx
│       │   │   │   ├── TriggerEditor.tsx
│       │   │   │   └── DifficultyCalculator.tsx
│       │   │   └── dialogue-editor/
│       │   │       ├── DialogueGraph.tsx
│       │   │       ├── NodeEditor.tsx
│       │   │       └── ConditionBuilder.tsx
│       │   └── lib/
│       └── package.json
│
├── packages/
│   ├── shared/                       # Shared code between apps
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── index.ts
│   │   │   │   ├── entities.ts
│   │   │   │   ├── combat.ts
│   │   │   │   ├── spells.ts
│   │   │   │   ├── items.ts
│   │   │   │   ├── characters.ts
│   │   │   │   ├── sessions.ts
│   │   │   │   └── api.ts
│   │   │   ├── constants/
│   │   │   │   ├── abilities.ts
│   │   │   │   ├── conditions.ts
│   │   │   │   ├── damage-types.ts
│   │   │   │   ├── skills.ts
│   │   │   │   └── spell-schools.ts
│   │   │   ├── utils/
│   │   │   │   ├── dice.ts
│   │   │   │   ├── modifiers.ts
│   │   │   │   ├── validation.ts
│   │   │   │   └── formatting.ts
│   │   │   └── schemas/
│   │   │       ├── character.schema.ts
│   │   │       ├── spell.schema.ts
│   │   │       └── command.schema.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui/                           # Shared UI components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── styles/
│   │   └── package.json
│   │
│   └── api-client/                   # Generated API client
│       ├── src/
│       │   ├── client.ts
│       │   ├── auth.ts
│       │   ├── characters.ts
│       │   ├── sessions.ts
│       │   └── content.ts
│       └── package.json
│
├── services/
│   ├── api-gateway/                  # Node.js API Gateway
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── server.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── characters.routes.ts
│   │   │   │   ├── sessions.routes.ts
│   │   │   │   ├── content.routes.ts
│   │   │   │   ├── campaigns.routes.ts
│   │   │   │   └── media.routes.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── validation.middleware.ts
│   │   │   │   ├── rateLimit.middleware.ts
│   │   │   │   ├── logging.middleware.ts
│   │   │   │   └── error.middleware.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── character.service.ts
│   │   │   │   ├── session.service.ts
│   │   │   │   └── content.service.ts
│   │   │   ├── websocket/
│   │   │   │   ├── gateway.ts
│   │   │   │   ├── handlers/
│   │   │   │   │   ├── connection.handler.ts
│   │   │   │   │   ├── command.handler.ts
│   │   │   │   │   └── chat.handler.ts
│   │   │   │   └── rooms/
│   │   │   │       └── sessionRoom.ts
│   │   │   ├── grpc/
│   │   │   │   ├── clients/
│   │   │   │   │   ├── rulesEngine.client.ts
│   │   │   │   │   ├── gridSolver.client.ts
│   │   │   │   │   └── aiService.client.ts
│   │   │   │   └── proto/
│   │   │   │       └── (symlink to /proto)
│   │   │   └── utils/
│   │   │       ├── jwt.ts
│   │   │       ├── redis.ts
│   │   │       └── db.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── game-state/                   # Game State Server (Node.js)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── session/
│   │   │   │   ├── SessionManager.ts
│   │   │   │   ├── GameSession.ts
│   │   │   │   └── SessionState.ts
│   │   │   ├── combat/
│   │   │   │   ├── CombatManager.ts
│   │   │   │   ├── TurnManager.ts
│   │   │   │   └── InitiativeTracker.ts
│   │   │   ├── commands/
│   │   │   │   ├── CommandProcessor.ts
│   │   │   │   ├── MoveCommand.ts
│   │   │   │   ├── AttackCommand.ts
│   │   │   │   ├── CastSpellCommand.ts
│   │   │   │   └── EndTurnCommand.ts
│   │   │   ├── state/
│   │   │   │   ├── StateDelta.ts
│   │   │   │   ├── StateSnapshot.ts
│   │   │   │   └── StatePersistence.ts
│   │   │   └── utils/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── rules-engine/                 # Rust Rules Engine
│   │   ├── src/
│   │   │   ├── main.rs
│   │   │   ├── lib.rs
│   │   │   ├── server.rs
│   │   │   ├── dice/
│   │   │   │   ├── mod.rs
│   │   │   │   ├── roller.rs
│   │   │   │   └── expression.rs
│   │   │   ├── checks/
│   │   │   │   ├── mod.rs
│   │   │   │   ├── ability.rs
│   │   │   │   ├── skill.rs
│   │   │   │   └── saving_throw.rs
│   │   │   ├── combat/
│   │   │   │   ├── mod.rs
│   │   │   │   ├── attack.rs
│   │   │   │   ├── damage.rs
│   │   │   │   └── initiative.rs
│   │   │   ├── spells/
│   │   │   │   ├── mod.rs
│   │   │   │   ├── casting.rs
│   │   │   │   ├── targeting.rs
│   │   │   │   └── concentration.rs
│   │   │   ├── conditions/
│   │   │   │   ├── mod.rs
│   │   │   │   ├── effects.rs
│   │   │   │   └── duration.rs
│   │   │   └── proto/
│   │   │       └── rules.rs          # Generated from proto
│   │   ├── build.rs
│   │   ├── Cargo.toml
│   │   └── Dockerfile
│   │
│   ├── grid-solver/                  # Rust Grid Solver
│   │   ├── src/
│   │   │   ├── main.rs
│   │   │   ├── lib.rs
│   │   │   ├── los/
│   │   │   │   ├── mod.rs
│   │   │   │   └── raycaster.rs
│   │   │   ├── cover/
│   │   │   │   └── mod.rs
│   │   │   ├── aoe/
│   │   │   │   ├── mod.rs
│   │   │   │   ├── sphere.rs
│   │   │   │   ├── cone.rs
│   │   │   │   ├── line.rs
│   │   │   │   └── cube.rs
│   │   │   └── pathfinding/
│   │   │       ├── mod.rs
│   │   │       └── astar.rs
│   │   ├── Cargo.toml
│   │   └── Dockerfile
│   │
│   └── ai-service/                   # AI Behaviors (Rust or Go)
│       ├── src/
│       │   ├── main.rs
│       │   ├── behaviors/
│       │   ├── triggers/
│       │   └── bosses/
│       ├── Cargo.toml
│       └── Dockerfile
│
├── proto/                            # Protocol Buffer definitions
│   ├── rules/
│   │   └── v1/
│   │       ├── rules.proto
│   │       ├── dice.proto
│   │       ├── combat.proto
│   │       └── spells.proto
│   ├── grid/
│   │   └── v1/
│   │       ├── grid.proto
│   │       ├── los.proto
│   │       └── pathfinding.proto
│   ├── ai/
│   │   └── v1/
│   │       ├── behavior.proto
│   │       └── triggers.proto
│   └── buf.yaml
│
├── content/                          # 5e Content Data
│   ├── spells/
│   │   ├── cantrips.json
│   │   ├── level-1.json
│   │   ├── level-2.json
│   │   └── ...
│   ├── monsters/
│   │   ├── beasts.json
│   │   ├── humanoids.json
│   │   ├── undead.json
│   │   └── ...
│   ├── items/
│   │   ├── weapons.json
│   │   ├── armor.json
│   │   ├── equipment.json
│   │   └── magic-items.json
│   ├── races/
│   │   └── phb-races.json
│   ├── classes/
│   │   └── phb-classes.json
│   ├── backgrounds/
│   │   └── phb-backgrounds.json
│   └── conditions/
│       └── conditions.json
│
├── infra/                            # Infrastructure as Code
│   ├── kubernetes/
│   │   ├── base/
│   │   │   ├── namespace.yaml
│   │   │   ├── configmap.yaml
│   │   │   └── secrets.yaml
│   │   ├── services/
│   │   │   ├── api-gateway.yaml
│   │   │   ├── game-state.yaml
│   │   │   ├── rules-engine.yaml
│   │   │   └── grid-solver.yaml
│   │   └── overlays/
│   │       ├── staging/
│   │       └── production/
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── modules/
│   └── docker-compose.yml
│
├── scripts/
│   ├── setup.sh
│   ├── seed-content.ts
│   ├── generate-proto.sh
│   └── db-migrate.sh
│
├── tests/
│   ├── golden/                       # Golden scene tests
│   │   ├── combat/
│   │   │   ├── melee-attack.test.ts
│   │   │   ├── ranged-attack.test.ts
│   │   │   └── spell-attack.test.ts
│   │   ├── aoe/
│   │   │   ├── fireball.test.ts
│   │   │   ├── cone-of-cold.test.ts
│   │   │   └── lightning-bolt.test.ts
│   │   ├── cover/
│   │   │   ├── half-cover.test.ts
│   │   │   └── three-quarters-cover.test.ts
│   │   └── los/
│   │       └── visibility.test.ts
│   ├── e2e/
│   │   ├── auth.e2e.ts
│   │   ├── character-builder.e2e.ts
│   │   ├── combat-flow.e2e.ts
│   │   └── multiplayer.e2e.ts
│   └── fixtures/
│       ├── characters/
│       ├── encounters/
│       └── maps/
│
├── docs/
│   ├── api/                          # Generated API docs
│   ├── architecture/
│   └── guides/
│
├── .env.example
├── .gitignore
├── .prettierrc
├── .eslintrc.js
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

# 2. Package Dependencies

## 2.1 Root package.json

```json
{
  "name": "dnd-platform",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*",
    "services/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:golden": "turbo run test:golden",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,js,json,md}\"",
    "clean": "turbo run clean && rm -rf node_modules",
    "db:migrate": "pnpm --filter api-gateway prisma migrate dev",
    "db:generate": "pnpm --filter api-gateway prisma generate",
    "proto:generate": "./scripts/generate-proto.sh",
    "content:seed": "ts-node scripts/seed-content.ts"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "prettier": "^3.1.0",
    "turbo": "^1.11.0",
    "typescript": "^5.3.0"
  },
  "packageManager": "pnpm@8.10.0",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

## 2.2 apps/web/package.json

```json
{
  "name": "@dnd/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:golden": "vitest --config vitest.golden.config.ts"
  },
  "dependencies": {
    "@dnd/shared": "workspace:*",
    "@dnd/ui": "workspace:*",
    "@dnd/api-client": "workspace:*",
    "@tanstack/react-query": "^5.8.0",
    "framer-motion": "^10.16.0",
    "howler": "^2.2.4",
    "next": "14.0.3",
    "pixi.js": "^8.0.0",
    "@pixi/react": "^7.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zod": "^3.22.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.1.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "vitest": "^1.0.0"
  }
}
```

## 2.3 services/api-gateway/package.json

```json
{
  "name": "@dnd/api-gateway",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src/",
    "test": "vitest"
  },
  "dependencies": {
    "@dnd/shared": "workspace:*",
    "@fastify/cors": "^8.4.0",
    "@fastify/jwt": "^7.2.0",
    "@fastify/rate-limit": "^9.0.0",
    "@fastify/websocket": "^8.3.0",
    "@grpc/grpc-js": "^1.9.0",
    "@prisma/client": "^5.6.0",
    "argon2": "^0.31.0",
    "fastify": "^4.24.0",
    "ioredis": "^5.3.0",
    "pino": "^8.17.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "prisma": "^5.6.0",
    "tsx": "^4.6.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

## 2.4 services/rules-engine/Cargo.toml

```toml
[package]
name = "dnd-rules-engine"
version = "0.1.0"
edition = "2021"

[dependencies]
tonic = "0.10"
prost = "0.12"
tokio = { version = "1.34", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
rand = "0.8"
rand_chacha = "0.3"
thiserror = "1.0"
tracing = "0.1"
tracing-subscriber = "0.3"

[build-dependencies]
tonic-build = "0.10"

[[bin]]
name = "rules-engine"
path = "src/main.rs"

[lib]
name = "dnd_rules"
path = "src/lib.rs"
```

---

# 3. Configuration Files

## 3.1 turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "tests/**/*.ts"]
    },
    "test:golden": {
      "dependsOn": ["build"],
      "inputs": ["src/**/*.ts", "tests/golden/**/*.ts", "tests/fixtures/**/*"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

## 3.2 .env.example

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dnd_dev"
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Services (local development)
RULES_ENGINE_URL="localhost:50051"
GRID_SOLVER_URL="localhost:50052"
AI_SERVICE_URL="localhost:50053"

# External Services
CLOUDFLARE_ACCOUNT_ID=""
CLOUDFLARE_API_TOKEN=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="dnd-assets"

# AI Generation (optional)
OPENAI_API_KEY=""
STABILITY_API_KEY=""

# Feature Flags
ENABLE_AI_GENERATION="false"
ENABLE_VOICE_CHAT="false"

# Observability
LOG_LEVEL="info"
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"
```

## 3.3 docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: dnd-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: dnd_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: dnd-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio
    container_name: dnd-minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data

  # Observability
  grafana:
    image: grafana/grafana:latest
    container_name: dnd-grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana

  prometheus:
    image: prom/prometheus:latest
    container_name: dnd-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./infra/prometheus.yml:/etc/prometheus/prometheus.yml

volumes:
  postgres_data:
  redis_data:
  minio_data:
  grafana_data:
```

---

# 4. TypeScript Configuration

## 4.1 packages/shared/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

# 5. Import Conventions

## 5.1 Path Aliases

```typescript
// In apps/web/tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@game/*": ["./src/game/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@stores/*": ["./src/stores/*"],
      "@lib/*": ["./src/lib/*"]
    }
  }
}
```

## 5.2 Import Order

```typescript
// 1. External packages
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal packages
import { Character, Spell } from '@dnd/shared';
import { Button, Card } from '@dnd/ui';

// 3. Absolute imports from app
import { useGameStore } from '@stores/gameStore';
import { api } from '@lib/api';

// 4. Relative imports
import { TokenSprite } from './TokenSprite';
import type { BoardProps } from './types';
```

---

# 6. File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| React Components | PascalCase | `ActionBar.tsx` |
| Hooks | camelCase with `use` prefix | `useGameState.ts` |
| Utilities | camelCase | `formatDamage.ts` |
| Constants | SCREAMING_SNAKE_CASE | `DAMAGE_TYPES.ts` |
| Types/Interfaces | PascalCase | `Character.ts` |
| Test files | Same name + `.test` | `ActionBar.test.tsx` |
| Stories | Same name + `.stories` | `ActionBar.stories.tsx` |
| Styles | Same name + `.module.css` | `ActionBar.module.css` |

---

# END OF PROJECT STRUCTURE
