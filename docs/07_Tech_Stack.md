# D&D Digital Board Game Platform
# Document 7: Tech Stack Recommendations

---

# 1. Executive Summary

This document provides technology recommendations for building the D&D Digital Board Game platform. Choices are optimized for:

- **Performance**: Low latency real-time gameplay
- **Scalability**: Support millions of concurrent players
- **Developer Experience**: Fast iteration and debugging
- **Cost Efficiency**: Reasonable infrastructure costs
- **Cross-Platform**: Web and mobile from single codebase

---

# 2. Architecture Overview

## 2.1 Recommended Stack Summary

| Layer | Technology | Alternative |
|-------|------------|-------------|
| **Web Client** | React + TypeScript | Vue 3, Svelte |
| **Mobile Client** | React Native | Flutter, Capacitor |
| **Game Rendering** | PixiJS + React | Phaser, Three.js |
| **State Management** | Zustand | Redux Toolkit, Jotai |
| **API Gateway** | Node.js + Fastify | Express, Hono |
| **Game Services** | Rust | Go, C# |
| **Rules Engine** | Rust | TypeScript, Go |
| **Real-time** | WebSocket (ws) | Socket.io, uWebSockets |
| **Database** | PostgreSQL | CockroachDB |
| **Cache** | Redis Cluster | KeyDB, Dragonfly |
| **Message Queue** | Redis Streams | Kafka, RabbitMQ |
| **Object Storage** | S3 / Cloudflare R2 | GCS, MinIO |
| **CDN** | Cloudflare | CloudFront, Fastly |
| **Infrastructure** | Kubernetes | ECS, Cloud Run |
| **CI/CD** | GitHub Actions | GitLab CI, CircleCI |
| **Monitoring** | Grafana + Prometheus | Datadog |

---

# 3. Frontend Stack

## 3.1 Web Client

### Primary Recommendation: React + TypeScript

**Why React:**
- Largest ecosystem and community
- Excellent developer tooling
- Easy hiring (most common skill)
- Mature, stable, well-documented
- Great for complex, interactive UIs

**Key Libraries:**

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "pixi.js": "^8.0.0",
    "@pixi/react": "^7.1.0",
    "framer-motion": "^10.16.0",
    "tailwindcss": "^3.4.0",
    "zod": "^3.22.0",
    "howler": "^2.2.4"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "playwright": "^1.40.0",
    "storybook": "^7.6.0"
  }
}
```

### Game Rendering: PixiJS

**Why PixiJS over alternatives:**

| Consideration | PixiJS | Phaser | Three.js |
|---------------|--------|--------|----------|
| 2D Performance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Bundle Size | ~200KB | ~1MB | ~600KB |
| React Integration | Good | Poor | Good |
| Learning Curve | Medium | Medium | High |
| WebGL Support | Full | Full | Full |
| Sprite Batching | Excellent | Good | Manual |

**PixiJS Architecture:**

```typescript
// Board Renderer Structure
src/
  game/
    core/
      GameApplication.ts    // PixiJS app wrapper
      AssetLoader.ts        // Sprite/texture loading
      RenderLoop.ts         // 60 FPS game loop
    
    board/
      TileGrid.ts           // Grid rendering
      TileSprite.ts         // Individual tile
      FogOfWar.ts           // Visibility layer
      
    entities/
      Token.ts              // Character/monster tokens
      TokenAnimator.ts      // Animation state machine
      HealthBar.ts          // HP display
      
    effects/
      AoEOverlay.ts         // Spell area display
      SpellVFX.ts           // Spell particle effects
      DamageNumber.ts       // Floating damage text
      
    ui/
      InitiativeTracker.tsx // React component
      ActionBar.tsx         // React component
      CombatLog.tsx         // React component
```

### State Management: Zustand

**Why Zustand:**
- Minimal boilerplate
- TypeScript-first
- No providers needed
- Easy to split stores
- Built-in devtools

```typescript
// Game State Store
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface GameState {
  // Session
  sessionId: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  
  // Entities
  entities: Map<string, Entity>;
  
  // Combat
  turnOrder: string[];
  currentTurnIndex: number;
  roundNumber: number;
  
  // Actions
  setSession: (sessionId: string) => void;
  updateEntity: (id: string, delta: Partial<Entity>) => void;
  setTurnOrder: (order: string[]) => void;
  advanceTurn: () => void;
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    sessionId: null,
    connectionStatus: 'disconnected',
    entities: new Map(),
    turnOrder: [],
    currentTurnIndex: 0,
    roundNumber: 1,
    
    setSession: (sessionId) => set({ sessionId }),
    
    updateEntity: (id, delta) => set((state) => {
      const entities = new Map(state.entities);
      const existing = entities.get(id);
      if (existing) {
        entities.set(id, { ...existing, ...delta });
      }
      return { entities };
    }),
    
    setTurnOrder: (order) => set({ turnOrder: order, currentTurnIndex: 0 }),
    
    advanceTurn: () => set((state) => {
      const nextIndex = (state.currentTurnIndex + 1) % state.turnOrder.length;
      const newRound = nextIndex === 0 ? state.roundNumber + 1 : state.roundNumber;
      return { currentTurnIndex: nextIndex, roundNumber: newRound };
    }),
  }))
);
```

## 3.2 Mobile Client

### Primary Recommendation: React Native

**Why React Native:**
- Code sharing with web (business logic, state)
- Native performance
- Large ecosystem
- Single team can build both platforms
- Expo for easier development

**Alternative: Flutter** - Consider if:
- Team has Dart experience
- Need pixel-perfect custom UI
- Want hot reload on device

**Project Structure:**

```
packages/
  shared/                 # Shared code
    src/
      types/              # TypeScript types
      utils/              # Pure functions
      hooks/              # Business logic hooks
      stores/             # Zustand stores
      
  web/                    # React web app
    src/
      components/
      game/               # PixiJS game
      pages/
      
  mobile/                 # React Native app
    src/
      components/         # RN components
      game/               # Skia game renderer
      screens/
```

### Mobile Game Rendering: React Native Skia

```typescript
// Mobile-optimized rendering
import { Canvas, useFrame, Group, Rect, Image } from '@shopify/react-native-skia';

const GameBoard: React.FC<{ tiles: Tile[] }> = ({ tiles }) => {
  return (
    <Canvas style={{ flex: 1 }}>
      <Group>
        {tiles.map((tile) => (
          <TileSprite key={tile.id} tile={tile} />
        ))}
      </Group>
    </Canvas>
  );
};
```

---

# 4. Backend Stack

## 4.1 API Gateway & Services

### Primary Recommendation: Node.js + Fastify

**Why Fastify:**
- Fast (benchmarks show 2x Express)
- TypeScript-first
- JSON Schema validation
- Excellent plugin ecosystem
- Easy WebSocket integration

```typescript
// API Gateway Structure
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';

const server = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
});

// Plugins
await server.register(cors, { origin: true });
await server.register(jwt, { secret: process.env.JWT_SECRET });
await server.register(websocket);

// Routes
await server.register(authRoutes, { prefix: '/v1/auth' });
await server.register(sessionRoutes, { prefix: '/v1/sessions' });
await server.register(characterRoutes, { prefix: '/v1/characters' });
await server.register(contentRoutes, { prefix: '/v1/content' });

// WebSocket
server.register(async (fastify) => {
  fastify.get('/ws/session/:sessionId', { websocket: true }, (socket, req) => {
    handleGameConnection(socket, req.params.sessionId);
  });
});

await server.listen({ port: 3000, host: '0.0.0.0' });
```

## 4.2 Rules Engine & Game Services

### Primary Recommendation: Rust

**Why Rust:**
- Exceptional performance (C/C++ level)
- Memory safety without GC
- Fearless concurrency
- Strong type system
- Great for game logic

**When to use Rust:**
- Rules Engine (hot path, called every action)
- Grid Solver (heavy computation)
- AI Service (decision trees)

**Alternative: Go** for:
- Services with heavy I/O
- Simpler business logic
- Faster development time

```rust
// Rules Engine Structure
// Cargo.toml
[package]
name = "dnd-rules-engine"
version = "0.1.0"
edition = "2021"

[dependencies]
tonic = "0.10"           # gRPC
prost = "0.12"           # Protocol buffers
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
rand = "0.8"             # Dice rolling
rand_chacha = "0.3"      # Deterministic RNG
thiserror = "1.0"        # Error handling
tracing = "0.1"          # Logging/tracing

[build-dependencies]
tonic-build = "0.10"

// src/lib.rs
pub mod dice;
pub mod modifiers;
pub mod checks;
pub mod combat;
pub mod spells;
pub mod conditions;

// src/dice.rs
use rand::{Rng, SeedableRng};
use rand_chacha::ChaCha8Rng;

#[derive(Debug, Clone)]
pub struct DiceRoller {
    rng: ChaCha8Rng,
}

impl DiceRoller {
    pub fn new(seed: u64) -> Self {
        Self {
            rng: ChaCha8Rng::seed_from_u64(seed),
        }
    }
    
    pub fn roll(&mut self, sides: u8) -> u8 {
        self.rng.gen_range(1..=sides)
    }
    
    pub fn roll_with_advantage(&mut self, sides: u8) -> (u8, u8, u8) {
        let roll1 = self.roll(sides);
        let roll2 = self.roll(sides);
        let result = roll1.max(roll2);
        (result, roll1, roll2)
    }
    
    pub fn roll_with_disadvantage(&mut self, sides: u8) -> (u8, u8, u8) {
        let roll1 = self.roll(sides);
        let roll2 = self.roll(sides);
        let result = roll1.min(roll2);
        (result, roll1, roll2)
    }
}

// src/combat.rs
pub struct AttackResolver {
    dice: DiceRoller,
}

impl AttackResolver {
    pub fn resolve_attack(&mut self, request: AttackRequest) -> AttackResult {
        // Calculate attack bonus
        let attack_bonus = self.calculate_attack_bonus(&request);
        
        // Roll attack
        let (roll, die1, die2) = match request.advantage_state {
            AdvantageState::Advantage => self.dice.roll_with_advantage(20),
            AdvantageState::Disadvantage => self.dice.roll_with_disadvantage(20),
            AdvantageState::Normal => {
                let roll = self.dice.roll(20);
                (roll, roll, roll)
            }
        };
        
        let total = roll as i32 + attack_bonus;
        let is_critical = roll == 20;
        let is_fumble = roll == 1;
        
        // Determine hit
        let hits = !is_fumble && (is_critical || total >= request.target_ac);
        
        // Calculate damage if hit
        let damage = if hits {
            Some(self.calculate_damage(&request, is_critical))
        } else {
            None
        };
        
        AttackResult {
            hits,
            is_critical,
            is_fumble,
            attack_roll: roll,
            attack_total: total,
            damage,
        }
    }
}
```

## 4.3 Service Communication

### gRPC for Internal Services

```protobuf
// proto/rules.proto
syntax = "proto3";
package dnd.rules.v1;

service RulesEngine {
  rpc ResolveAttack(AttackRequest) returns (AttackResult);
  rpc ResolveSavingThrow(SavingThrowRequest) returns (SavingThrowResult);
  rpc ResolveSpellCast(SpellCastRequest) returns (SpellCastResult);
  rpc CalculateDamage(DamageRequest) returns (DamageResult);
}

message AttackRequest {
  string attacker_id = 1;
  string target_id = 2;
  string weapon_id = 3;
  AttackType attack_type = 4;
  AdvantageState advantage = 5;
  repeated Modifier modifiers = 6;
}

message AttackResult {
  bool hits = 1;
  bool is_critical = 2;
  int32 attack_roll = 3;
  int32 attack_total = 4;
  DamageResult damage = 5;
}
```

### REST for External APIs

Use OpenAPI 3.0 specification for documentation:

```yaml
# openapi.yaml
openapi: 3.0.3
info:
  title: D&D Digital Board Game API
  version: 1.0.0
  
paths:
  /v1/characters:
    post:
      summary: Create a new character
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateCharacterRequest'
      responses:
        '201':
          description: Character created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Character'
```

---

# 5. Database Stack

## 5.1 Primary Database: PostgreSQL

**Why PostgreSQL:**
- Rock-solid reliability
- Excellent JSON support (JSONB)
- Advanced indexing (GIN, GiST)
- Strong ecosystem (pgvector for AI features)
- Managed options everywhere

**Schema Design Principles:**

```sql
-- Use JSONB for flexible game data
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    
    -- Core stats as columns for querying
    level INTEGER NOT NULL DEFAULT 1,
    race_id VARCHAR(50) NOT NULL,
    class_id VARCHAR(50) NOT NULL,
    
    -- Flexible data as JSONB
    ability_scores JSONB NOT NULL,
    features JSONB NOT NULL DEFAULT '[]',
    inventory JSONB NOT NULL DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT valid_level CHECK (level >= 1 AND level <= 20)
);

CREATE INDEX idx_characters_user ON characters(user_id);
CREATE INDEX idx_characters_ability_scores ON characters USING GIN(ability_scores);

-- Efficient session state storage
CREATE TABLE session_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    sequence_number BIGINT NOT NULL,
    state JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(session_id, sequence_number)
);

-- Partitioned for efficient cleanup
CREATE TABLE session_events (
    id UUID NOT NULL,
    session_id UUID NOT NULL,
    sequence_number BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE session_events_2024_01 
    PARTITION OF session_events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## 5.2 Cache Layer: Redis Cluster

**Why Redis:**
- Sub-millisecond latency
- Rich data structures (sorted sets for leaderboards)
- Pub/Sub for real-time
- Streams for event sourcing
- Lua scripting for atomic operations

**Redis Usage Patterns:**

```typescript
// Session state caching
const SESSION_TTL = 60 * 60 * 24; // 24 hours

// Store session state
await redis.hSet(`session:${sessionId}`, {
  state: JSON.stringify(gameState),
  sequence: sequenceNumber,
  updatedAt: Date.now()
});
await redis.expire(`session:${sessionId}`, SESSION_TTL);

// Pub/Sub for state updates
const publisher = redis.duplicate();
await publisher.publish(`session:${sessionId}:updates`, JSON.stringify(delta));

// Streams for event sourcing
await redis.xAdd(`session:${sessionId}:events`, '*', {
  type: 'ATTACK',
  data: JSON.stringify(attackEvent)
});

// Rate limiting with sliding window
async function checkRateLimit(userId: string, limit: number, windowMs: number): Promise<boolean> {
  const key = `ratelimit:${userId}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const pipeline = redis.multi();
  pipeline.zRemRangeByScore(key, 0, windowStart);
  pipeline.zCard(key);
  pipeline.zAdd(key, { score: now, value: `${now}` });
  pipeline.expire(key, Math.ceil(windowMs / 1000));
  
  const results = await pipeline.exec();
  const count = results[1] as number;
  
  return count < limit;
}
```

## 5.3 Content Database

For game content (spells, monsters, items), consider:

**Option A: PostgreSQL + JSONB** (Recommended for MVP)
- Same database, simpler ops
- Good enough performance with caching
- Full-text search with pg_trgm

**Option B: MongoDB** (Consider for scale)
- Natural fit for game content documents
- Atlas Search for full-text
- Better horizontal scaling

```typescript
// Content caching strategy
class ContentService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour
  
  async getSpell(spellId: string): Promise<Spell> {
    // Check memory cache
    const cached = this.cache.get(`spell:${spellId}`);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    
    // Check Redis
    const redisData = await redis.get(`content:spell:${spellId}`);
    if (redisData) {
      const spell = JSON.parse(redisData);
      this.cache.set(`spell:${spellId}`, {
        data: spell,
        expiresAt: Date.now() + this.CACHE_TTL
      });
      return spell;
    }
    
    // Fetch from database
    const spell = await db.query('SELECT * FROM spells WHERE id = $1', [spellId]);
    
    // Populate caches
    await redis.setEx(`content:spell:${spellId}`, 3600, JSON.stringify(spell));
    this.cache.set(`spell:${spellId}`, {
      data: spell,
      expiresAt: Date.now() + this.CACHE_TTL
    });
    
    return spell;
  }
}
```

---

# 6. Infrastructure Stack

## 6.1 Container Orchestration: Kubernetes

**Why Kubernetes:**
- Industry standard
- Excellent scaling
- Self-healing
- Good observability integration
- Works with all clouds

**Alternative: Cloud-specific** (AWS ECS, Cloud Run)
- Simpler for smaller teams
- Less operational overhead
- Potentially cheaper at scale

**Kubernetes Architecture:**

```yaml
# Namespace per environment
apiVersion: v1
kind: Namespace
metadata:
  name: dnd-prod

---
# Game State Server Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: game-state-server
  namespace: dnd-prod
spec:
  replicas: 10
  selector:
    matchLabels:
      app: game-state-server
  template:
    metadata:
      labels:
        app: game-state-server
    spec:
      containers:
      - name: game-state
        image: dnd/game-state-server:1.0.0
        ports:
        - containerPort: 8080
        - containerPort: 50051  # gRPC
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        env:
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 20

---
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: game-state-server-hpa
  namespace: dnd-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: game-state-server
  minReplicas: 5
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: active_sessions
      target:
        type: AverageValue
        averageValue: "100"
```

## 6.2 CDN & Edge: Cloudflare

**Why Cloudflare:**
- Global edge network
- WebSocket support
- DDoS protection included
- Workers for edge compute
- R2 for object storage (S3 compatible, cheaper)

```typescript
// Cloudflare Worker for WebSocket routing
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const sessionId = url.pathname.split('/')[3];
      
      // Get appropriate backend based on session affinity
      const backend = await getSessionBackend(sessionId, env);
      
      // Proxy WebSocket to backend
      return fetch(`${backend}${url.pathname}`, {
        headers: request.headers,
      });
    }
    
    // Static assets from R2
    if (url.pathname.startsWith('/assets/')) {
      return env.ASSETS.fetch(request);
    }
    
    // API requests to origin
    return fetch(request);
  }
};
```

## 6.3 CI/CD: GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm test
      
      - name: Run golden scene tests
        run: pnpm test:golden
      
      - name: Build
        run: pnpm build

  build-and-push:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build and push Docker images
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: |
            ghcr.io/dnd/game-state-server:${{ github.sha }}
            ghcr.io/dnd/game-state-server:latest

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          kubectl set image deployment/game-state-server \
            game-state=ghcr.io/dnd/game-state-server:${{ github.sha }} \
            -n dnd-staging

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production (canary)
        run: |
          kubectl set image deployment/game-state-server-canary \
            game-state=ghcr.io/dnd/game-state-server:${{ github.sha }} \
            -n dnd-prod
      
      - name: Wait for canary metrics
        run: sleep 300  # 5 minutes
      
      - name: Promote to full rollout
        run: |
          kubectl set image deployment/game-state-server \
            game-state=ghcr.io/dnd/game-state-server:${{ github.sha }} \
            -n dnd-prod
```

---

# 7. Observability Stack

## 7.1 Metrics: Prometheus + Grafana

```typescript
// Custom metrics
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const registry = new Registry();

// Game metrics
export const commandLatency = new Histogram({
  name: 'game_command_latency_seconds',
  help: 'Latency of game command processing',
  labelNames: ['command_type', 'success'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [registry]
});

export const activeSessions = new Gauge({
  name: 'game_active_sessions',
  help: 'Number of active game sessions',
  registers: [registry]
});

export const combatRounds = new Counter({
  name: 'game_combat_rounds_total',
  help: 'Total number of combat rounds processed',
  registers: [registry]
});

// Usage
async function processCommand(command: Command) {
  const timer = commandLatency.startTimer({ command_type: command.type });
  try {
    const result = await executeCommand(command);
    timer({ success: 'true' });
    return result;
  } catch (error) {
    timer({ success: 'false' });
    throw error;
  }
}
```

## 7.2 Logging: Structured JSON + Loki

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: 'game-state-server',
    version: process.env.APP_VERSION,
  },
});

// Usage with context
function createSessionLogger(sessionId: string) {
  return logger.child({ sessionId });
}

// Structured logging
sessionLogger.info({
  event: 'command_processed',
  commandType: 'ATTACK',
  actorId: attacker.id,
  targetId: target.id,
  result: 'hit',
  damage: 15,
  latencyMs: 45
});
```

## 7.3 Tracing: OpenTelemetry

```typescript
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('game-state-server');

async function processAttack(request: AttackRequest): Promise<AttackResult> {
  return tracer.startActiveSpan('processAttack', async (span) => {
    try {
      span.setAttribute('attacker.id', request.attackerId);
      span.setAttribute('target.id', request.targetId);
      
      // Call Rules Engine
      const attackResult = await tracer.startActiveSpan('rulesEngine.resolveAttack', 
        async (rulesSpan) => {
          const result = await rulesEngine.resolveAttack(request);
          rulesSpan.setAttribute('result.hits', result.hits);
          rulesSpan.setAttribute('result.damage', result.damage?.total || 0);
          return result;
        }
      );
      
      // Update game state
      await tracer.startActiveSpan('updateGameState', async (stateSpan) => {
        await gameState.applyAttackResult(attackResult);
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
      return attackResult;
      
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}
```

---

# 8. Development Tools

## 8.1 Monorepo: Turborepo

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**", "tests/**"]
    },
    "test:golden": {
      "dependsOn": ["build"],
      "inputs": ["src/**", "golden/**"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

## 8.2 Code Quality

```json
// package.json scripts
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:golden": "vitest --config vitest.golden.config.ts"
  }
}
```

## 8.3 Local Development

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: dnd_dev
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # Local S3-compatible storage
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin

volumes:
  postgres_data:
```

---

# 9. Cost Estimates

## 9.1 Infrastructure Costs (Monthly)

| Service | Small (1K DAU) | Medium (10K DAU) | Large (100K DAU) |
|---------|----------------|------------------|------------------|
| Kubernetes | $200 | $800 | $4,000 |
| PostgreSQL | $50 | $200 | $1,000 |
| Redis | $50 | $200 | $800 |
| CDN/Bandwidth | $50 | $200 | $1,000 |
| Object Storage | $10 | $50 | $200 |
| Monitoring | $50 | $100 | $300 |
| **Total** | **~$400** | **~$1,550** | **~$7,300** |

## 9.2 Third-Party Services

| Service | Cost | Notes |
|---------|------|-------|
| AI Generation | Variable | ~$0.01-0.05 per image |
| Voice Chat | ~$0.001/min | If using third-party |
| Analytics | $0-500 | Depends on volume |
| Error Tracking | $0-100 | Sentry free tier available |

---

# 10. Security Considerations

## 10.1 Authentication

```typescript
// JWT with RS256
import jwt from 'jsonwebtoken';

const privateKey = fs.readFileSync('private.pem');
const publicKey = fs.readFileSync('public.pem');

function generateToken(user: User): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    },
    privateKey,
    {
      algorithm: 'RS256',
      expiresIn: '15m',
      issuer: 'dnd-platform',
    }
  );
}

function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: 'dnd-platform',
  });
}
```

## 10.2 Input Validation

```typescript
import { z } from 'zod';

const AttackCommandSchema = z.object({
  type: z.literal('ATTACK'),
  attackerId: z.string().uuid(),
  targetId: z.string().uuid(),
  weaponId: z.string().uuid().optional(),
  attackType: z.enum(['MELEE', 'RANGED', 'SPELL']),
});

// Validate all incoming commands
function validateCommand(command: unknown): Command {
  const result = CommandSchema.safeParse(command);
  if (!result.success) {
    throw new ValidationError(result.error);
  }
  return result.data;
}
```

---

# 11. Summary: Recommended Stack

## Day 1 (MVP)

| Component | Choice |
|-----------|--------|
| Web Frontend | React + TypeScript + PixiJS |
| State Management | Zustand |
| API Server | Node.js + Fastify |
| Database | PostgreSQL |
| Cache | Redis |
| Hosting | Render.com or Railway |

## Scale-Up (Post-Launch)

| Component | Upgrade |
|-----------|---------|
| Rules Engine | Rust (gRPC service) |
| Grid Solver | Rust |
| Infrastructure | Kubernetes |
| CDN | Cloudflare |
| Mobile | React Native |

## Key Principles

1. **Start simple, scale later** - Don't over-engineer day 1
2. **Use boring technology** - Postgres, Redis, Node are proven
3. **Type everything** - TypeScript, Zod, Protobuf
4. **Test the hot paths** - Golden scenes for game logic
5. **Monitor from day 1** - Can't fix what you can't see

---

# END OF TECH STACK RECOMMENDATIONS-query": "^5.0.0",
    "zustand": "^4.4.0",
    "pixi.js": "^7.3.0",
    "@pixi/react": "^7.1.0",
    "framer-motion": "^10.16.0",
    "tailwindcss": "^3.4.0",
    "zod": "^3.22.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "msw": "^2.0.0",
    "storybook": "^7.6.0"
  }
}
```

### Project Structure

```
src/
├── app/                    # App shell, routing
├── features/               # Feature modules
│   ├── auth/
│   ├── character/
│   ├── combat/
│   ├── lobby/
│   └── campaign/
├── game/                   # Game-specific code
│   ├── renderer/          # PixiJS rendering
│   ├── input/             # Input handling
│   ├── animation/         # Animation system
│   └── audio/             # Audio system
├── shared/                 # Shared utilities
│   ├── components/        # UI components
│   ├── hooks/             # Custom hooks
│   ├── api/               # API clients
│   └── types/             # TypeScript types
└── stores/                 # Zustand stores
```

## 3.2 Game Rendering

### Primary Recommendation: PixiJS

**Why PixiJS:**
- Excellent 2D WebGL performance
- Lightweight (vs Three.js for 3D)
- Great sprite batching
- Strong community
- Works well with React

**Rendering Architecture:**

```typescript
// Core renderer setup
import { Application, Container, Sprite } from 'pixi.js';

class GameRenderer {
  private app: Application;
  private layers: Map<string, Container>;
  
  constructor(canvas: HTMLCanvasElement) {
    this.app = new Application({
      view: canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      backgroundColor: 0x1a1a2e,
      resolution: window.devicePixelRatio || 1,
    });
    
    // Layer hierarchy
    this.layers = new Map([
      ['background', new Container()],
      ['tiles', new Container()],
      ['grid', new Container()],
      ['tokens', new Container()],
      ['effects', new Container()],
      ['ui', new Container()],
    ]);
    
    // Add layers in order
    this.layers.forEach(layer => this.app.stage.addChild(layer));
  }
}
```

**Performance Targets:**

| Metric | Target | Measurement |
|--------|--------|-------------|
| FPS | 60 | Chrome DevTools |
| Draw Calls | < 50 | PixiJS stats |
| Memory | < 200MB | Performance API |
| First Paint | < 1s | Lighthouse |
| Time to Interactive | < 3s | Lighthouse |

## 3.3 State Management

### Primary Recommendation: Zustand

**Why Zustand:**
- Minimal boilerplate
- TypeScript-first
- Great DevTools
- Easy testing
- Performant selectors

**Store Architecture:**

```typescript
// Game state store
interface GameState {
  // Session
  sessionId: string | null;
  connected: boolean;
  
  // Board state
  entities: Map<string, Entity>;
  tiles: Map<string, Tile>;
  
  // Combat state
  combatActive: boolean;
  turnOrder: string[];
  currentTurnIndex: number;
  
  // Actions
  setSession: (id: string) => void;
  updateEntity: (id: string, delta: Partial<Entity>) => void;
  nextTurn: () => void;
}

const useGameStore = create<GameState>()(
  devtools(
    immer((set, get) => ({
      sessionId: null,
      connected: false,
      entities: new Map(),
      tiles: new Map(),
      combatActive: false,
      turnOrder: [],
      currentTurnIndex: 0,
      
      setSession: (id) => set({ sessionId: id }),
      
      updateEntity: (id, delta) => set((state) => {
        const entity = state.entities.get(id);
        if (entity) {
          state.entities.set(id, { ...entity, ...delta });
        }
      }),
      
      nextTurn: () => set((state) => {
        state.currentTurnIndex = 
          (state.currentTurnIndex + 1) % state.turnOrder.length;
      }),
    }))
  )
);
```

## 3.4 Mobile Client

### Primary Recommendation: React Native

**Why React Native:**
- Code sharing with web (~60-70%)
- Native performance where needed
- Large ecosystem
- Shared TypeScript types
- Hot reload for development

**Alternative: Capacitor**

If team prefers web-first approach:
- Wrap React web app in native shell
- Use native plugins for performance-critical features
- Easier code sharing (90%+)
- Trade-off: slightly lower performance

**Mobile-Specific Considerations:**

```typescript
// Shared game logic
// packages/game-core/src/rules/attack.ts
export function resolveAttack(attacker: Entity, target: Entity, weapon: Weapon) {
  // This runs identically on web and mobile
}

// Platform-specific rendering
// apps/mobile/src/components/GameBoard.tsx
import { Canvas } from '@shopify/react-native-skia';

// apps/web/src/components/GameBoard.tsx
import { Stage } from '@pixi/react';
```

---

# 4. Backend Stack

## 4.1 API Gateway

### Primary Recommendation: Node.js + Fastify

**Why Fastify:**
- 2-3x faster than Express
- Built-in TypeScript support
- Schema validation (JSON Schema)
- Excellent plugin ecosystem
- Low overhead

**Setup:**

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';

const app = Fastify({
  logger: true,
  trustProxy: true,
});

// Plugins
await app.register(cors, { origin: true });
await app.register(jwt, { secret: process.env.JWT_SECRET });
await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Routes
app.register(authRoutes, { prefix: '/v1/auth' });
app.register(characterRoutes, { prefix: '/v1/characters' });
app.register(sessionRoutes, { prefix: '/v1/sessions' });

await app.listen({ port: 3000, host: '0.0.0.0' });
```

## 4.2 Game Services

### Primary Recommendation: Rust

**Why Rust:**
- Zero-cost abstractions
- Memory safety without GC
- Excellent concurrency
- Predictable latency (no GC pauses)
- Growing game dev ecosystem

**When to Use:**
- Rules Engine (performance critical)
- Game State Server (low latency required)
- Grid Solver (computational)
- AI Decision Making (CPU intensive)

**Example - Rules Engine:**

```rust
// rules-engine/src/attack.rs
use crate::{dice::DiceRoller, entity::Entity, weapon::Weapon};

pub struct AttackResult {
    pub hit: bool,
    pub critical: bool,
    pub damage: i32,
    pub damage_type: DamageType,
}

pub fn resolve_attack(
    attacker: &Entity,
    target: &Entity,
    weapon: &Weapon,
    advantage: AdvantageState,
    roller: &mut impl DiceRoller,
) -> AttackResult {
    // Roll attack
    let attack_roll = match advantage {
        AdvantageState::Advantage => roller.roll_with_advantage(20),
        AdvantageState::Disadvantage => roller.roll_with_disadvantage(20),
        AdvantageState::Normal => roller.roll(20),
    };
    
    let critical = attack_roll.natural == 20;
    let critical_miss = attack_roll.natural == 1;
    
    // Calculate attack bonus
    let attack_bonus = calculate_attack_bonus(attacker, weapon);
    let total_attack = attack_roll.total + attack_bonus;
    
    // Check hit
    let hit = !critical_miss && (critical || total_attack >= target.armor_class);
    
    if !hit {
        return AttackResult {
            hit: false,
            critical: false,
            damage: 0,
            damage_type: weapon.damage_type,
        };
    }
    
    // Roll damage
    let damage_dice = if critical {
        weapon.damage_dice.double()
    } else {
        weapon.damage_dice.clone()
    };
    
    let damage = roller.roll_dice(&damage_dice) + get_damage_modifier(attacker, weapon);
    
    AttackResult {
        hit: true,
        critical,
        damage: damage.max(0),
        damage_type: weapon.damage_type,
    }
}
```

### Alternative: Go

**When to Use Go Instead:**
- Team has Go experience
- Simpler deployment needs
- Less performance critical services
- Rapid prototyping

```go
// rules-engine/attack.go
package rules

type AttackResult struct {
    Hit        bool
    Critical   bool
    Damage     int
    DamageType DamageType
}

func ResolveAttack(
    attacker *Entity,
    target *Entity,
    weapon *Weapon,
    advantage AdvantageState,
) AttackResult {
    // Similar logic in Go
}
```

## 4.3 Real-Time Communication

### Primary Recommendation: Native WebSocket (ws library)

**Why native WebSocket:**
- Lower overhead than Socket.io
- Full control over protocol
- Better for custom binary protocols
- Easier to scale

**Implementation:**

```typescript
// gateway/src/websocket.ts
import { WebSocketServer, WebSocket } from 'ws';
import { verify } from 'jsonwebtoken';

interface Client {
  ws: WebSocket;
  userId: string;
  sessionId: string;
  lastHeartbeat: number;
}

class GameGateway {
  private wss: WebSocketServer;
  private clients = new Map<string, Client>();
  
  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });
    
    // Heartbeat check every 30s
    setInterval(() => this.checkHeartbeats(), 30000);
  }
  
  private async handleConnection(ws: WebSocket, req: IncomingMessage) {
    const token = this.extractToken(req);
    
    try {
      const payload = verify(token, process.env.JWT_SECRET);
      const client: Client = {
        ws,
        userId: payload.sub,
        sessionId: null,
        lastHeartbeat: Date.now(),
      };
      
      this.clients.set(payload.sub, client);
      
      ws.on('message', (data) => this.handleMessage(client, data));
      ws.on('close', () => this.handleDisconnect(client));
      
      // Send connection ack
      this.send(ws, { type: 'CONNECTION_ACK', timestamp: Date.now() });
      
    } catch (err) {
      ws.close(4001, 'Invalid token');
    }
  }
  
  private handleMessage(client: Client, data: Buffer) {
    const message = JSON.parse(data.toString());
    
    switch (message.type) {
      case 'HEARTBEAT':
        client.lastHeartbeat = Date.now();
        this.send(client.ws, { type: 'HEARTBEAT_ACK' });
        break;
        
      case 'COMMAND':
        this.routeToGameServer(client, message);
        break;
        
      case 'CHAT':
        this.broadcastChat(client, message);
        break;
    }
  }
  
  broadcastToSession(sessionId: string, message: any) {
    for (const client of this.clients.values()) {
      if (client.sessionId === sessionId) {
        this.send(client.ws, message);
      }
    }
  }
}
```

## 4.4 Inter-Service Communication

### gRPC for Service-to-Service

**Why gRPC:**
- Binary protocol (faster than JSON)
- Strong typing via Protobuf
- Streaming support
- Code generation
- Excellent for microservices

**Proto Definition:**

```protobuf
// proto/rules.proto
syntax = "proto3";

package dnd.rules.v1;

service RulesEngine {
  rpc ResolveAttack(AttackRequest) returns (AttackResult);
  rpc ResolveSavingThrow(SaveRequest) returns (SaveResult);
  rpc ResolveSpellCast(SpellRequest) returns (SpellResult);
}

message AttackRequest {
  string attacker_id = 1;
  string target_id = 2;
  string weapon_id = 3;
  AdvantageState advantage = 4;
  repeated string active_effects = 5;
}

message AttackResult {
  bool hit = 1;
  bool critical = 2;
  int32 damage = 3;
  DamageType damage_type = 4;
  DiceRoll attack_roll = 5;
  DiceRoll damage_roll = 6;
}
```

---

# 5. Database Stack

## 5.1 Primary Database

### Primary Recommendation: PostgreSQL

**Why PostgreSQL:**
- ACID compliance
- JSON support for flexible schemas
- Excellent performance
- Mature and stable
- Great tooling

**Schema Design Principles:**

```sql
-- Use JSONB for flexible, queryable data
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  
  -- Structured data
  race_id VARCHAR(50) NOT NULL,
  class_id VARCHAR(50) NOT NULL,
  level INT NOT NULL DEFAULT 1,
  
  -- Flexible data as JSONB
  ability_scores JSONB NOT NULL,
  proficiencies JSONB NOT NULL,
  equipment JSONB NOT NULL,
  features JSONB NOT NULL,
  
  -- Computed stats (cached)
  current_hp INT NOT NULL,
  max_hp INT NOT NULL,
  armor_class INT NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index JSONB for common queries
CREATE INDEX idx_characters_class ON characters ((ability_scores->>'class'));
CREATE INDEX idx_characters_level ON characters (level);

-- Partial index for active characters
CREATE INDEX idx_characters_active ON characters (user_id) 
WHERE deleted_at IS NULL;
```

**Connection Pooling:**

```typescript
// Use PgBouncer or built-in pooling
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: 'dnd_game',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,                    // Max connections
  idleTimeoutMillis: 30000,   // Close idle connections
  connectionTimeoutMillis: 2000,
});
```

## 5.2 Cache Layer

### Primary Recommendation: Redis Cluster

**Why Redis:**
- Sub-millisecond latency
- Rich data structures
- Pub/Sub for real-time
- Lua scripting
- Cluster mode for HA

**Use Cases:**

| Use Case | Data Structure | TTL |
|----------|----------------|-----|
| Session State | Hash | Session duration |
| Turn Timer | String + EXPIRE | Turn limit |
| Rate Limiting | String + INCR | Window size |
| Player Presence | Sorted Set | 5 minutes |
| Lobby List | List | Until closed |
| Pub/Sub | Channels | N/A |

**Implementation:**

```typescript
import Redis from 'ioredis';

// Cluster setup
const redis = new Redis.Cluster([
  { host: 'redis-1', port: 6379 },
  { host: 'redis-2', port: 6379 },
  { host: 'redis-3', port: 6379 },
]);

// Session state storage
class SessionCache {
  private redis: Redis.Cluster;
  
  async getSessionState(sessionId: string): Promise<GameState | null> {
    const data = await this.redis.hgetall(`session:${sessionId}`);
    if (!data) return null;
    return this.deserializeState(data);
  }
  
  async setSessionState(sessionId: string, state: GameState): Promise<void> {
    const serialized = this.serializeState(state);
    await this.redis.hmset(`session:${sessionId}`, serialized);
    await this.redis.expire(`session:${sessionId}`, 3600); // 1 hour
  }
  
  async updateEntity(sessionId: string, entityId: string, delta: any): Promise<void> {
    // Atomic update with Lua script
    await this.redis.eval(
      `
      local current = redis.call('HGET', KEYS[1], ARGV[1])
      local entity = cjson.decode(current)
      local delta = cjson.decode(ARGV[2])
      for k, v in pairs(delta) do
        entity[k] = v
      end
      redis.call('HSET', KEYS[1], ARGV[1], cjson.encode(entity))
      return 'OK'
      `,
      1,
      `session:${sessionId}:entities`,
      entityId,
      JSON.stringify(delta)
    );
  }
}
```

## 5.3 Content Database

### Recommendation: PostgreSQL + Read Replicas

**Why:**
- Read-heavy workload
- Strong consistency for writes
- Geographic distribution via replicas
- Familiar tooling

**Setup:**

```yaml
# docker-compose.yml for local dev
services:
  postgres-primary:
    image: postgres:16
    environment:
      POSTGRES_DB: dnd_content
      POSTGRES_USER: dnd
      POSTGRES_PASSWORD: secret
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  postgres-replica:
    image: postgres:16
    environment:
      POSTGRES_USER: dnd
      POSTGRES_PASSWORD: secret
    command: |
      postgres 
      -c hot_standby=on
    depends_on:
      - postgres-primary
```

---

# 6. Infrastructure Stack

## 6.1 Container Orchestration

### Primary Recommendation: Kubernetes

**Why Kubernetes:**
- Industry standard
- Auto-scaling
- Service discovery
- Rolling deployments
- Rich ecosystem

**Deployment Architecture:**

```yaml
# k8s/game-state-server.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: game-state-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: game-state-server
  template:
    metadata:
      labels:
        app: game-state-server
    spec:
      containers:
      - name: game-state-server
        image: dnd-game/game-state-server:latest
        ports:
        - containerPort: 50051
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        env:
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        livenessProbe:
          grpc:
            port: 50051
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          grpc:
            port: 50051
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: game-state-server
spec:
  selector:
    app: game-state-server
  ports:
  - port: 50051
    targetPort: 50051
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: game-state-server-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: game-state-server
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## 6.2 Cloud Provider

### Primary Recommendation: AWS (or GCP)

**AWS Services:**

| Service | Use Case |
|---------|----------|
| EKS | Kubernetes cluster |
| RDS | PostgreSQL |
| ElastiCache | Redis |
| S3 | Asset storage |
| CloudFront | CDN |
| Route 53 | DNS |
| ACM | SSL certificates |
| WAF | Web firewall |

**Alternative: GCP**

| GCP Service | Equivalent |
|-------------|------------|
| GKE | EKS |
| Cloud SQL | RDS |
| Memorystore | ElastiCache |
| Cloud Storage | S3 |
| Cloud CDN | CloudFront |

## 6.3 CDN

### Primary Recommendation: Cloudflare

**Why Cloudflare:**
- Global edge network
- DDoS protection included
- WebSocket support
- Competitive pricing
- R2 for storage (no egress fees)

**Configuration:**

```javascript
// cloudflare-worker.js for edge logic
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Route WebSocket to origin
  if (request.headers.get('Upgrade') === 'websocket') {
    return fetch(request);
  }
  
  // Cache static assets
  if (url.pathname.startsWith('/assets/')) {
    const cache = caches.default;
    let response = await cache.match(request);
    
    if (!response) {
      response = await fetch(request);
      response = new Response(response.body, response);
      response.headers.set('Cache-Control', 'public, max-age=31536000');
      event.waitUntil(cache.put(request, response.clone()));
    }
    
    return response;
  }
  
  // Pass through to origin
  return fetch(request);
}
```

---

# 7. DevOps Stack

## 7.1 CI/CD

### Primary Recommendation: GitHub Actions

**Why GitHub Actions:**
- Native GitHub integration
- Good free tier
- Marketplace for actions
- Matrix builds
- Self-hosted runners option

**Pipeline:**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
      redis:
        image: redis:7
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm test:integration
      - run: pnpm test:e2e

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}/api:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: azure/setup-kubectl@v3
      - run: |
          kubectl set image deployment/api api=ghcr.io/${{ github.repository }}/api:${{ github.sha }}
```

## 7.2 Monitoring

### Primary Recommendation: Grafana Stack

**Components:**

| Component | Purpose |
|-----------|---------|
| Prometheus | Metrics collection |
| Grafana | Dashboards |
| Loki | Log aggregation |
| Tempo | Distributed tracing |
| Alertmanager | Alerting |

**Key Dashboards:**

1. **Game Health Dashboard**
   - Active sessions
   - Player count
   - Commands per second
   - Average latency

2. **Service Health Dashboard**
   - Request rate
   - Error rate
   - P50/P95/P99 latency
   - CPU/Memory usage

3. **Business Metrics Dashboard**
   - Daily active users
   - Session duration
   - Combat completion rate
   - Conversion metrics

**Alerting Rules:**

```yaml
# prometheus/alerts.yml
groups:
  - name: game-alerts
    rules:
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(request_duration_seconds_bucket[5m])) > 0.3
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          
      - alert: HighErrorRate
        expr: rate(request_errors_total[5m]) / rate(requests_total[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Error rate above 5%"
          
      - alert: SessionDesync
        expr: increase(session_desync_total[10m]) > 0
        labels:
          severity: warning
        annotations:
          summary: "Session desync detected"
```

---

# 8. Development Tools

## 8.1 Monorepo Setup

### Recommendation: Turborepo

**Why Turborepo:**
- Fast builds (caching)
- Simple configuration
- Works with any package manager
- Good for TypeScript projects

**Structure:**

```
dnd-game/
├── apps/
│   ├── web/              # React web client
│   ├── mobile/           # React Native app
│   ├── api-gateway/      # Node.js API
│   └── dm-tools/         # DM tool suite
├── packages/
│   ├── game-core/        # Shared game logic (TS)
│   ├── ui/               # Shared UI components
│   ├── types/            # TypeScript types
│   └── config/           # Shared configs
├── services/
│   ├── rules-engine/     # Rust service
│   ├── game-state/       # Rust service
│   ├── grid-solver/      # Rust service
│   └── ai-behavior/      # Rust service
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

**Configuration:**

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**/*.ts", "src/**/*.tsx", "test/**/*.ts"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

## 8.2 Code Quality

**Tools:**

| Tool | Purpose |
|------|---------|
| ESLint | JavaScript/TypeScript linting |
| Prettier | Code formatting |
| Clippy | Rust linting |
| Rustfmt | Rust formatting |
| Husky | Git hooks |
| Commitlint | Commit message linting |

**Configuration:**

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    'react/react-in-jsx-scope': 'off',
  },
};
```

---

# 9. Security Tools

## 9.1 Authentication

### Recommendation: Custom JWT + OAuth Providers

**Implementation:**

```typescript
// auth/src/jwt.ts
import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function createToken(userId: string, roles: string[]): Promise<string> {
  return new SignJWT({ sub: userId, roles })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, SECRET);
  return payload;
}
```

## 9.2 Secrets Management

### Recommendation: HashiCorp Vault (or AWS Secrets Manager)

**Usage:**

```typescript
import Vault from 'node-vault';

const vault = Vault({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

async function getSecret(path: string): Promise<string> {
  const { data } = await vault.read(`secret/data/${path}`);
  return data.data.value;
}

// Usage
const dbPassword = await getSecret('database/password');
```

---

# 10. Cost Estimation

## 10.1 Development Phase (6 months)

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| AWS EKS | $150 | Dev cluster |
| RDS (PostgreSQL) | $100 | db.t3.medium |
| ElastiCache (Redis) | $50 | cache.t3.micro |
| S3 | $20 | Assets |
| CloudFront | $50 | CDN |
| GitHub Actions | $0 | Free tier |
| **Total** | **~$400/month** | |

## 10.2 Production Phase (Launch)

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| AWS EKS | $500 | 3 nodes |
| RDS (PostgreSQL) | $400 | db.r5.large + replica |
| ElastiCache (Redis) | $300 | 3-node cluster |
| S3 | $100 | Assets |
| CloudFront | $200 | CDN traffic |
| Datadog/Grafana | $200 | Monitoring |
| **Total** | **~$1,700/month** | |

## 10.3 Scale Phase (100K DAU)

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| AWS EKS | $3,000 | Auto-scaling |
| RDS (PostgreSQL) | $1,500 | Multi-AZ |
| ElastiCache (Redis) | $1,000 | Large cluster |
| S3 | $500 | Assets |
| CloudFront | $1,000 | High traffic |
| Monitoring | $500 | Full observability |
| **Total** | **~$7,500/month** | |

---

# 11. Decision Matrix

## 11.1 Language Selection

| Criteria | TypeScript | Rust | Go |
|----------|------------|------|-----|
| Performance | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Developer Experience | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Hiring | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| Code Sharing | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Memory Safety | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**Recommendation:**
- TypeScript for API Gateway, tooling, frontend
- Rust for performance-critical game services
- Consider Go if Rust expertise unavailable

## 11.2 Database Selection

| Criteria | PostgreSQL | MongoDB | CockroachDB |
|----------|------------|---------|-------------|
| ACID | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Flexibility | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Scaling | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Tooling | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Cost | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

**Recommendation:** PostgreSQL for simplicity and maturity

---

# 12. Summary

## Recommended Stack

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
├─────────────────────────────────────────────────────────────┤
│  React + TypeScript │ PixiJS │ Zustand │ React Native      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY                            │
├─────────────────────────────────────────────────────────────┤
│  Node.js + Fastify │ WebSocket (ws) │ JWT Auth             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     GAME SERVICES                           │
├─────────────────────────────────────────────────────────────┤
│  Rust │ gRPC │ Redis (State) │ PostgreSQL (Persistence)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     INFRASTRUCTURE                          │
├─────────────────────────────────────────────────────────────┤
│  Kubernetes (EKS) │ Cloudflare CDN │ GitHub Actions        │
└─────────────────────────────────────────────────────────────┘
```

## Key Decisions

1. **TypeScript everywhere** possible for code sharing
2. **Rust for hot paths** (rules engine, game state)
3. **PostgreSQL + Redis** for data layer
4. **Kubernetes** for orchestration
5. **Cloudflare** for CDN and edge
6. **GitHub Actions** for CI/CD
7. **Grafana stack** for observability

---

# END OF TECH STACK RECOMMENDATIONS-query": "^5.0.0",
    "zustand": "^4.4.0",
    "pixi.js": "^8.0.0",
    "@pixi/react": "^7.1.0",
    "framer-motion": "^10.16.0",
    "tailwindcss": "^3.4.0",
    "zod": "^3.22.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "msw": "^2.0.0",
    "storybook": "^7.6.0"
  }
}
```

### Project Structure

```
src/
├── app/                    # App routes and layouts
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── game/               # Game-specific components
│   │   ├── Board/
│   │   ├── Token/
│   │   ├── HUD/
│   │   └── Combat/
│   └── builders/           # Character/Campaign builders
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand stores
├── services/               # API clients, WebSocket
├── utils/                  # Utilities
├── types/                  # TypeScript types
└── assets/                 # Static assets
```

## 3.2 Game Rendering

### Primary Recommendation: PixiJS

**Why PixiJS:**
- WebGL-based, hardware accelerated
- Excellent 2D performance (60fps easy)
- Rich sprite and animation support
- Good React integration via @pixi/react
- Active community and plugins
- Smaller bundle than Three.js for 2D

**Key Features Used:**

```typescript
// Example: Board Renderer with PixiJS
import { Stage, Container, Sprite, Graphics } from '@pixi/react';
import { useCallback, useMemo } from 'react';

interface BoardProps {
  tiles: Tile[][];
  tokens: Token[];
  fogOfWar: boolean[][];
  selectedTile: Position | null;
  onTileClick: (pos: Position) => void;
}

export function Board({ tiles, tokens, fogOfWar, selectedTile, onTileClick }: BoardProps) {
  const tileSize = 64;
  
  return (
    <Stage 
      width={tiles[0].length * tileSize} 
      height={tiles.length * tileSize}
      options={{ backgroundColor: 0x1a1a2e }}
    >
      {/* Tile Layer */}
      <Container>
        {tiles.flat().map((tile, i) => (
          <TileSprite 
            key={i} 
            tile={tile} 
            size={tileSize}
            revealed={!fogOfWar[tile.y][tile.x]}
            onClick={() => onTileClick({ x: tile.x, y: tile.y })}
          />
        ))}
      </Container>
      
      {/* Token Layer */}
      <Container>
        {tokens.map(token => (
          <TokenSprite key={token.id} token={token} size={tileSize} />
        ))}
      </Container>
      
      {/* Overlay Layer (selection, AoE) */}
      <Container>
        {selectedTile && (
          <SelectionHighlight position={selectedTile} size={tileSize} />
        )}
      </Container>
    </Stage>
  );
}
```

**Alternative: Phaser 3**

Pros:
- Full game engine (physics, audio, scenes)
- More game-specific features built-in
- Better for complex animations

Cons:
- Harder React integration
- Larger bundle size
- Opinionated architecture

## 3.3 State Management

### Primary Recommendation: Zustand

**Why Zustand:**
- Simple, minimal boilerplate
- Great TypeScript support
- Easy to split stores
- Built-in devtools
- Works with React 18 concurrent features

```typescript
// stores/gameStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface GameState {
  // Session
  sessionId: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  
  // Board
  tiles: Tile[][];
  entities: Map<string, Entity>;
  fogOfWar: boolean[][];
  
  // Combat
  combatActive: boolean;
  turnOrder: string[];
  currentTurnIndex: number;
  
  // Actions
  setSession: (sessionId: string) => void;
  updateEntity: (id: string, changes: Partial<Entity>) => void;
  applyStateDelta: (delta: StateDelta) => void;
  startCombat: (turnOrder: string[]) => void;
  advanceTurn: () => void;
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      sessionId: null,
      connectionStatus: 'disconnected',
      tiles: [],
      entities: new Map(),
      fogOfWar: [],
      combatActive: false,
      turnOrder: [],
      currentTurnIndex: 0,
      
      setSession: (sessionId) => set({ sessionId }),
      
      updateEntity: (id, changes) => set((state) => {
        const entity = state.entities.get(id);
        if (entity) {
          state.entities.set(id, { ...entity, ...changes });
        }
      }),
      
      applyStateDelta: (delta) => set((state) => {
        for (const change of delta.entityChanges) {
          const entity = state.entities.get(change.entityId);
          if (entity) {
            Object.assign(entity, change);
          }
        }
      }),
      
      startCombat: (turnOrder) => set({
        combatActive: true,
        turnOrder,
        currentTurnIndex: 0
      }),
      
      advanceTurn: () => set((state) => {
        state.currentTurnIndex = 
          (state.currentTurnIndex + 1) % state.turnOrder.length;
      }),
    }))
  )
);
```

## 3.4 Mobile Client

### Primary Recommendation: React Native

**Why React Native:**
- Share 70-80% code with web
- Native performance for UI
- Large ecosystem
- Reuse same team/skills

```typescript
// Shared game logic
// packages/game-core/src/rules/attack.ts
export function calculateAttackBonus(
  attacker: Entity,
  weapon: Weapon
): number {
  const abilityMod = weapon.finesse
    ? Math.max(attacker.abilities.str.modifier, attacker.abilities.dex.modifier)
    : weapon.ranged
      ? attacker.abilities.dex.modifier
      : attacker.abilities.str.modifier;
  
  return abilityMod + attacker.proficiencyBonus;
}

// Web component uses same logic
// apps/web/src/components/AttackButton.tsx
import { calculateAttackBonus } from '@dnd/game-core';

// React Native component uses same logic
// apps/mobile/src/components/AttackButton.tsx
import { calculateAttackBonus } from '@dnd/game-core';
```

---

# 4. Backend Stack

## 4.1 API Gateway

### Primary Recommendation: Node.js + Fastify

**Why Fastify:**
- Fastest Node.js framework
- Built-in TypeScript support
- Schema validation (JSON Schema)
- Plugin architecture
- Easy to test

```typescript
// server.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';

const server = Fastify({
  logger: true,
  ajv: {
    customOptions: {
      removeAdditional: 'all',
      coerceTypes: true,
      useDefaults: true,
    }
  }
});

// Plugins
await server.register(cors, { origin: true });
await server.register(jwt, { secret: process.env.JWT_SECRET! });
await server.register(websocket);

// Routes
await server.register(import('./routes/auth'), { prefix: '/v1/auth' });
await server.register(import('./routes/characters'), { prefix: '/v1/characters' });
await server.register(import('./routes/sessions'), { prefix: '/v1/sessions' });

// WebSocket
server.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    connection.socket.on('message', (message) => {
      // Handle game messages
    });
  });
});

await server.listen({ port: 3000, host: '0.0.0.0' });
```

## 4.2 Game Services

### Primary Recommendation: Rust

**Why Rust:**
- Exceptional performance
- Memory safety without GC
- Great for game logic
- Excellent WebAssembly support
- Growing game dev ecosystem

**Service Architecture:**

```rust
// rules-engine/src/lib.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AttackRequest {
    pub attacker: Entity,
    pub target: Entity,
    pub weapon: Weapon,
    pub advantage: AdvantageState,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AttackResult {
    pub hit: bool,
    pub critical: bool,
    pub attack_roll: DiceResult,
    pub damage: Option<DamageResult>,
    pub effects: Vec<Effect>,
}

pub fn resolve_attack(req: AttackRequest, rng: &mut impl Rng) -> AttackResult {
    // Calculate attack bonus
    let attack_bonus = calculate_attack_bonus(&req.attacker, &req.weapon);
    
    // Roll attack
    let attack_roll = roll_d20_with_advantage(req.advantage, rng);
    let total = attack_roll.value + attack_bonus;
    
    // Check for critical
    let critical = attack_roll.natural_value == 20;
    let critical_miss = attack_roll.natural_value == 1;
    
    // Determine hit
    let target_ac = calculate_effective_ac(&req.target);
    let hit = !critical_miss && (critical || total >= target_ac);
    
    if !hit {
        return AttackResult {
            hit: false,
            critical: false,
            attack_roll,
            damage: None,
            effects: vec![],
        };
    }
    
    // Roll damage
    let damage = roll_damage(&req.weapon, critical, rng);
    let final_damage = apply_resistances(&req.target, &damage);
    
    AttackResult {
        hit: true,
        critical,
        attack_roll,
        damage: Some(final_damage),
        effects: vec![],
    }
}
```

**gRPC Service:**

```rust
// rules-engine/src/grpc.rs
use tonic::{Request, Response, Status};
use crate::proto::rules::*;

pub struct RulesService {
    rng: Arc<Mutex<StdRng>>,
}

#[tonic::async_trait]
impl RulesEngine for RulesService {
    async fn resolve_attack(
        &self,
        request: Request<AttackRequest>,
    ) -> Result<Response<AttackResult>, Status> {
        let req = request.into_inner();
        let mut rng = self.rng.lock().unwrap();
        
        let result = crate::resolve_attack(req.into(), &mut *rng);
        
        Ok(Response::new(result.into()))
    }
}
```

**Alternative: Go**

Pros:
- Simpler than Rust
- Fast compilation
- Great concurrency model
- Easier hiring

Cons:
- GC pauses (minor for this use case)
- Less performant than Rust
- Less expressive type system

## 4.3 Real-time Communication

### Primary Recommendation: Native WebSocket (ws library)

**Why native WebSocket:**
- Full control over protocol
- No abstraction overhead
- Better for custom binary protocols
- Easier debugging

```typescript
// gateway/src/websocket.ts
import { WebSocketServer, WebSocket } from 'ws';
import { verify } from 'jsonwebtoken';

interface GameConnection {
  ws: WebSocket;
  userId: string;
  sessionId: string;
  lastHeartbeat: number;
}

export class GameGateway {
  private wss: WebSocketServer;
  private connections = new Map<string, GameConnection>();
  
  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    
    this.wss.on('connection', async (ws, req) => {
      try {
        const token = this.extractToken(req);
        const payload = verify(token, process.env.JWT_SECRET!);
        
        const connection: GameConnection = {
          ws,
          userId: payload.sub as string,
          sessionId: '',
          lastHeartbeat: Date.now(),
        };
        
        this.connections.set(payload.sub as string, connection);
        
        ws.on('message', (data) => this.handleMessage(connection, data));
        ws.on('close', () => this.handleDisconnect(connection));
        
        this.sendMessage(ws, {
          type: 'CONNECT_ACK',
          payload: { connectionId: payload.sub }
        });
        
      } catch (error) {
        ws.close(4001, 'Authentication failed');
      }
    });
  }
  
  private handleMessage(conn: GameConnection, data: Buffer): void {
    const message = JSON.parse(data.toString());
    
    switch (message.type) {
      case 'HEARTBEAT':
        conn.lastHeartbeat = Date.now();
        this.sendMessage(conn.ws, { type: 'HEARTBEAT_ACK' });
        break;
        
      case 'JOIN_SESSION':
        this.handleJoinSession(conn, message.payload);
        break;
        
      case 'COMMAND':
        this.forwardToGameServer(conn, message);
        break;
    }
  }
  
  broadcastToSession(sessionId: string, message: any): void {
    for (const conn of this.connections.values()) {
      if (conn.sessionId === sessionId) {
        this.sendMessage(conn.ws, message);
      }
    }
  }
}
```

---

# 5. Database Stack

## 5.1 Primary Database

### Recommendation: PostgreSQL 16

**Why PostgreSQL:**
- Robust, battle-tested
- Excellent JSON support (JSONB)
- Advanced indexing
- Row-level security
- Great ecosystem

**Schema Example:**

```sql
-- Core schema
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    race VARCHAR(50) NOT NULL,
    class VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    experience INTEGER NOT NULL DEFAULT 0,
    abilities JSONB NOT NULL,
    proficiencies JSONB NOT NULL,
    equipment JSONB NOT NULL,
    spells JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_characters_user ON characters(user_id);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id),
    status VARCHAR(20) NOT NULL DEFAULT 'lobby',
    dm_user_id UUID REFERENCES users(id),
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);
```

## 5.2 Cache Layer

### Recommendation: Redis Cluster

**Why Redis:**
- Sub-millisecond latency
- Rich data structures
- Pub/Sub for real-time
- Streams for event sourcing
- Cluster mode for scaling

```typescript
// cache/redis.ts
import { Redis, Cluster } from 'ioredis';

const redis = new Cluster([
  { host: 'redis-1', port: 6379 },
  { host: 'redis-2', port: 6379 },
  { host: 'redis-3', port: 6379 },
]);

// Session state caching
export async function cacheSessionState(
  sessionId: string, 
  state: SessionState
): Promise<void> {
  await redis.setex(
    `session:${sessionId}:state`,
    300, // 5 minute TTL
    JSON.stringify(state)
  );
}

// Pub/Sub for state updates
export async function publishStateUpdate(
  sessionId: string,
  delta: StateDelta
): Promise<void> {
  await redis.publish(
    `session:${sessionId}:updates`,
    JSON.stringify(delta)
  );
}
```

---

# 6. Infrastructure

## 6.1 Container Orchestration

### Recommendation: Kubernetes (EKS/GKE)

**Why Kubernetes:**
- Industry standard
- Auto-scaling
- Self-healing
- Rich ecosystem
- Multi-cloud portable

```yaml
# k8s/deployments/game-state-server.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: game-state-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: game-state-server
  template:
    spec:
      containers:
      - name: game-state-server
        image: dnd-platform/game-state-server:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: game-state-server-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: game-state-server
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## 6.2 CDN & Static Assets

### Recommendation: Cloudflare

**Why Cloudflare:**
- Global edge network
- Excellent caching
- DDoS protection included
- WebSocket support
- Competitive pricing

## 6.3 CI/CD

### Recommendation: GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: pnpm test
      - name: Run golden scene tests
        run: pnpm test:golden

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker images
        run: |
          docker build -t dnd-platform/api-gateway:${{ github.sha }} ./apps/api-gateway
          docker build -t dnd-platform/rules-engine:${{ github.sha }} ./apps/rules-engine

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: kubectl set image deployment/api-gateway api-gateway=dnd-platform/api-gateway:${{ github.sha }}
```

---

# 7. Monitoring & Observability

## 7.1 Metrics: Prometheus + Grafana

```typescript
import { Counter, Histogram, Gauge } from 'prom-client';

export const commandsProcessed = new Counter({
  name: 'game_commands_processed_total',
  help: 'Total commands processed',
  labelNames: ['command_type', 'result'],
});

export const commandLatency = new Histogram({
  name: 'game_command_latency_seconds',
  help: 'Command processing latency',
  labelNames: ['command_type'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1],
});
```

## 7.2 Logging: Structured Logging + Loki

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: process.env.SERVICE_NAME,
  },
});
```

## 7.3 Tracing: OpenTelemetry

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();
```

---

# 8. Development Environment

## 8.1 Monorepo Structure (Turborepo)

```
dnd-platform/
├── apps/
│   ├── web/                 # React web client
│   ├── mobile/              # React Native app
│   ├── api-gateway/         # Node.js API
│   ├── game-state/          # Rust game server
│   └── rules-engine/        # Rust rules engine
├── packages/
│   ├── game-core/           # Shared game logic
│   ├── ui/                  # Shared UI components
│   └── types/               # TypeScript types
├── infrastructure/
│   ├── k8s/
│   └── docker/
├── turbo.json
└── pnpm-workspace.yaml
```

## 8.2 Local Development (Docker Compose)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    ports: ["5432:5432"]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  api-gateway:
    build: ./apps/api-gateway
    ports: ["3000:3000"]
  rules-engine:
    build: ./apps/rules-engine
    ports: ["50051:50051"]
```

---

# 9. Cost Estimates (Monthly)

| Component | Small (1K MAU) | Medium (100K MAU) | Large (1M MAU) |
|-----------|----------------|-------------------|----------------|
| Kubernetes | $150 | $2,000 | $15,000 |
| PostgreSQL | $50 | $500 | $3,000 |
| Redis | $30 | $300 | $2,000 |
| CDN | $20 | $500 | $5,000 |
| Monitoring | $50 | $300 | $1,500 |
| **Total** | **$300** | **$3,600** | **$26,500** |

---

# 10. Final Recommendations

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Frontend** | React + TypeScript | Ecosystem, hiring, stability |
| **Rendering** | PixiJS | Performance, 2D focus |
| **Mobile** | React Native | Code sharing with web |
| **API Gateway** | Node.js + Fastify | Performance, TypeScript |
| **Game Logic** | Rust | Performance, safety |
| **Database** | PostgreSQL | Reliability, JSON support |
| **Cache** | Redis Cluster | Speed, pub/sub |
| **Infrastructure** | Kubernetes | Scaling, portability |
| **CDN** | Cloudflare | Global, DDoS protection |

---

# END OF TECH STACK RECOMMENDATIONS