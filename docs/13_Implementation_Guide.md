# D&D Digital Board Game Platform
# Document 13: Claude Code Implementation Guide

This is the **primary reference document** for implementing the platform with Claude Code.

---

# 1. Implementation Order

Follow this exact sequence:

## Phase 1: Foundation (Week 1-2)

### Step 1.1: Project Scaffolding
```bash
# Create monorepo structure
mkdir dnd-platform && cd dnd-platform
pnpm init
pnpm add -Dw turbo typescript @types/node prettier

# Create workspace structure
mkdir -p apps/{web,mobile,dm-tools}
mkdir -p packages/{shared,ui,api-client}
mkdir -p services/{api-gateway,game-state,rules-engine,grid-solver}
mkdir -p {proto,content,infra,scripts,tests}
```

### Step 1.2: Shared Types Package
Create `packages/shared/src/types/index.ts` with all core types from Document 11.

### Step 1.3: Database Setup
1. Create `services/api-gateway/prisma/schema.prisma` from Document 8
2. Run `pnpm db:migrate`

### Step 1.4: Docker Development Environment
Create `docker-compose.yml` from Document 10.

---

## Phase 2: Backend Core (Week 3-4)

### Step 2.1: API Gateway
Location: `services/api-gateway/`

**Files to create:**
```
src/
├── index.ts              # Entry point
├── server.ts             # Fastify setup
├── routes/
│   ├── auth.routes.ts    # /auth/* endpoints
│   ├── characters.routes.ts
│   └── sessions.routes.ts
├── middleware/
│   ├── auth.middleware.ts
│   └── validation.middleware.ts
└── services/
    ├── auth.service.ts
    └── character.service.ts
```

**Key APIs to implement first:**
1. POST /auth/register
2. POST /auth/login
3. POST /auth/refresh
4. GET /characters
5. POST /characters

### Step 2.2: Rules Engine (Rust)
Location: `services/rules-engine/`

**Priority order:**
1. Dice roller with seeded RNG
2. Ability checks
3. Attack resolution
4. Damage calculation
5. Saving throws
6. Conditions

### Step 2.3: Grid Solver (Rust)
Location: `services/grid-solver/`

**Priority order:**
1. Line of sight
2. Cover calculation
3. AoE shapes (sphere first, then cone, cube, line)
4. Pathfinding

---

## Phase 3: Frontend Foundation (Week 5-6)

### Step 3.1: Web App Setup
Location: `apps/web/`

```bash
cd apps/web
pnpm create next-app . --typescript --tailwind --app
pnpm add pixi.js @pixi/react zustand @tanstack/react-query zod
```

### Step 3.2: Core Components (Build Order)
1. `components/ui/` - Button, Card, Input (use shadcn/ui)
2. `components/game/TileGrid.tsx` - Basic grid rendering
3. `components/game/Token.tsx` - Character/monster tokens
4. `components/game/Board.tsx` - Combines grid + tokens
5. `components/hud/ActionBar.tsx` - Actions UI
6. `components/hud/InitiativeTracker.tsx`

### Step 3.3: Game Engine (PixiJS)
Location: `apps/web/src/game/`

```
game/
├── GameApplication.ts    # PixiJS app wrapper
├── scenes/
│   └── CombatScene.ts    # Main combat view
├── entities/
│   ├── TokenSprite.ts
│   └── TileSprite.ts
└── systems/
    ├── RenderSystem.ts
    └── InputSystem.ts
```

---

## Phase 4: Real-time & Multiplayer (Week 7-8)

### Step 4.1: WebSocket Gateway
Add to `services/api-gateway/src/websocket/`

### Step 4.2: Game State Server
Location: `services/game-state/`

### Step 4.3: Client WebSocket Hook
Location: `apps/web/src/hooks/useGameConnection.ts`

---

## Phase 5: Combat System (Week 9-10)

### Step 5.1: Turn Management
### Step 5.2: Action Processing
### Step 5.3: Combat Resolution

---

## Phase 6: Character Builder (Week 11-12)

### Step 6.1: Race Selection
### Step 6.2: Class Selection
### Step 6.3: Ability Scores
### Step 6.4: Equipment

---

# 2. Key Files Reference

## 2.1 Shared Types (Create First)

```typescript
// packages/shared/src/types/index.ts

// Re-export everything
export * from './abilities';
export * from './characters';
export * from './combat';
export * from './conditions';
export * from './entities';
export * from './items';
export * from './sessions';
export * from './spells';
```

```typescript
// packages/shared/src/types/abilities.ts

export type Ability = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export type Skill =
  | 'acrobatics' | 'animal_handling' | 'arcana' | 'athletics'
  | 'deception' | 'history' | 'insight' | 'intimidation'
  | 'investigation' | 'medicine' | 'nature' | 'perception'
  | 'performance' | 'persuasion' | 'religion' | 'sleight_of_hand'
  | 'stealth' | 'survival';

export const ABILITY_TO_SKILLS: Record<Ability, Skill[]> = {
  STR: ['athletics'],
  DEX: ['acrobatics', 'sleight_of_hand', 'stealth'],
  CON: [],
  INT: ['arcana', 'history', 'investigation', 'nature', 'religion'],
  WIS: ['animal_handling', 'insight', 'medicine', 'perception', 'survival'],
  CHA: ['deception', 'intimidation', 'performance', 'persuasion']
};

export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}
```

```typescript
// packages/shared/src/types/combat.ts

export type DamageType =
  | 'BLUDGEONING' | 'PIERCING' | 'SLASHING'
  | 'ACID' | 'COLD' | 'FIRE' | 'FORCE' | 'LIGHTNING'
  | 'NECROTIC' | 'POISON' | 'PSYCHIC' | 'RADIANT' | 'THUNDER';

export type AttackType = 'MELEE_WEAPON' | 'RANGED_WEAPON' | 'MELEE_SPELL' | 'RANGED_SPELL';

export interface AttackRoll {
  natural: number;
  modifier: number;
  total: number;
  advantage: boolean;
  disadvantage: boolean;
  advantageRolls?: [number, number];
  isCritical: boolean;
  isFumble: boolean;
}

export interface DamageRoll {
  dice: string;
  rolls: number[];
  modifier: number;
  total: number;
  type: DamageType;
  isCritical: boolean;
}

export interface AttackResult {
  attackerId: string;
  targetId: string;
  attackRoll: AttackRoll;
  targetAC: number;
  hits: boolean;
  damage?: DamageRoll;
  effects?: string[];
}
```

```typescript
// packages/shared/src/types/conditions.ts

export type ConditionId =
  | 'blinded' | 'charmed' | 'deafened' | 'exhaustion'
  | 'frightened' | 'grappled' | 'incapacitated' | 'invisible'
  | 'paralyzed' | 'petrified' | 'poisoned' | 'prone'
  | 'restrained' | 'stunned' | 'unconscious';

export interface ActiveCondition {
  id: ConditionId;
  sourceId?: string;
  duration?: {
    type: 'rounds' | 'minutes' | 'until_save' | 'permanent';
    remaining?: number;
    saveAbility?: string;
    saveDC?: number;
  };
}
```

## 2.2 API Gateway Entry Point

```typescript
// services/api-gateway/src/index.ts

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import rateLimit from '@fastify/rate-limit';

import { authRoutes } from './routes/auth.routes';
import { characterRoutes } from './routes/characters.routes';
import { sessionRoutes } from './routes/sessions.routes';
import { errorHandler } from './middleware/error.middleware';
import { setupWebSocket } from './websocket/gateway';

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

async function start() {
  // Plugins
  await server.register(cors, { origin: true });
  await server.register(jwt, { secret: process.env.JWT_SECRET! });
  await server.register(websocket);
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Routes
  await server.register(authRoutes, { prefix: '/v1/auth' });
  await server.register(characterRoutes, { prefix: '/v1/characters' });
  await server.register(sessionRoutes, { prefix: '/v1/sessions' });

  // WebSocket
  setupWebSocket(server);

  // Error handling
  server.setErrorHandler(errorHandler);

  // Start
  const port = parseInt(process.env.PORT || '3000');
  await server.listen({ port, host: '0.0.0.0' });
  console.log(`Server running on port ${port}`);
}

start().catch(console.error);
```

## 2.3 Dice Roller (Rust)

```rust
// services/rules-engine/src/dice/roller.rs

use rand::SeedableRng;
use rand_chacha::ChaCha8Rng;
use rand::Rng;

pub struct DiceRoller {
    rng: ChaCha8Rng,
}

impl DiceRoller {
    pub fn new(seed: u64) -> Self {
        Self {
            rng: ChaCha8Rng::seed_from_u64(seed),
        }
    }
    
    pub fn roll(&mut self, sides: u32) -> u32 {
        self.rng.gen_range(1..=sides)
    }
    
    pub fn roll_dice(&mut self, count: u32, sides: u32) -> Vec<u32> {
        (0..count).map(|_| self.roll(sides)).collect()
    }
    
    pub fn roll_with_advantage(&mut self, sides: u32) -> (u32, [u32; 2]) {
        let rolls = [self.roll(sides), self.roll(sides)];
        (rolls[0].max(rolls[1]), rolls)
    }
    
    pub fn roll_with_disadvantage(&mut self, sides: u32) -> (u32, [u32; 2]) {
        let rolls = [self.roll(sides), self.roll(sides)];
        (rolls[0].min(rolls[1]), rolls)
    }
}

pub fn parse_dice(expr: &str) -> Result<(u32, u32), String> {
    // Parse "2d6", "1d20", etc.
    let parts: Vec<&str> = expr.to_lowercase().split('d').collect();
    if parts.len() != 2 {
        return Err(format!("Invalid dice expression: {}", expr));
    }
    
    let count: u32 = parts[0].parse().unwrap_or(1);
    let sides: u32 = parts[1].parse().map_err(|_| "Invalid sides")?;
    
    Ok((count, sides))
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_deterministic_rolls() {
        let mut roller1 = DiceRoller::new(12345);
        let mut roller2 = DiceRoller::new(12345);
        
        for _ in 0..100 {
            assert_eq!(roller1.roll(20), roller2.roll(20));
        }
    }
    
    #[test]
    fn test_parse_dice() {
        assert_eq!(parse_dice("2d6").unwrap(), (2, 6));
        assert_eq!(parse_dice("1d20").unwrap(), (1, 20));
        assert_eq!(parse_dice("8d6").unwrap(), (8, 6));
    }
}
```

## 2.4 PixiJS Game Application

```typescript
// apps/web/src/game/GameApplication.ts

import * as PIXI from 'pixi.js';
import { CombatScene } from './scenes/CombatScene';

export class GameApplication {
  private app: PIXI.Application;
  private currentScene: CombatScene | null = null;

  constructor(container: HTMLElement) {
    this.app = new PIXI.Application();
  }

  async init() {
    await this.app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x1a1a2e,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    
    return this.app.canvas;
  }

  loadCombatScene(sessionData: any) {
    if (this.currentScene) {
      this.app.stage.removeChild(this.currentScene.container);
    }
    
    this.currentScene = new CombatScene(this.app, sessionData);
    this.app.stage.addChild(this.currentScene.container);
  }

  destroy() {
    this.app.destroy(true);
  }
}
```

## 2.5 WebSocket Client Hook

```typescript
// apps/web/src/hooks/useGameConnection.ts

import { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';

interface UseGameConnectionOptions {
  sessionId: string;
  token: string;
  onStateUpdate?: (delta: any) => void;
  onError?: (error: Error) => void;
}

export function useGameConnection(options: UseGameConnectionOptions) {
  const { sessionId, token, onStateUpdate, onError } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const sequenceRef = useRef(0);
  
  const connect = useCallback(() => {
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/sessions/${sessionId}`
    );
    
    ws.onopen = () => {
      // Send authentication
      ws.send(JSON.stringify({
        type: 'CONNECT',
        payload: { token, sessionId }
      }));
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'CONNECT_ACK':
          setIsConnected(true);
          sequenceRef.current = message.sequence;
          break;
          
        case 'STATE_DELTA':
          if (message.sequence > sequenceRef.current) {
            sequenceRef.current = message.sequence;
            onStateUpdate?.(message.payload);
          }
          break;
          
        case 'ERROR':
          onError?.(new Error(message.payload.message));
          break;
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      // Attempt reconnection
      setTimeout(connect, 1000);
    };
    
    ws.onerror = (event) => {
      onError?.(new Error('WebSocket error'));
    };
    
    wsRef.current = ws;
  }, [sessionId, token, onStateUpdate, onError]);
  
  const sendCommand = useCallback((command: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'COMMAND',
        payload: command,
        sequence: ++sequenceRef.current
      }));
    }
  }, []);
  
  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);
  
  return {
    isConnected,
    sendCommand,
    disconnect: () => wsRef.current?.close()
  };
}
```

---

# 3. Quick Commands Reference

```bash
# Start all services locally
docker-compose up -d
pnpm dev

# Run tests
pnpm test
pnpm test:golden

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Build for production
pnpm build

# Format code
pnpm format

# Lint
pnpm lint
```

---

# 4. Common Implementation Patterns

## 4.1 Command Processing Pattern

```typescript
// Command processor pattern for game actions
interface Command {
  type: string;
  entityId: string;
  payload: any;
  timestamp: number;
}

async function processCommand(command: Command, session: GameSession) {
  // 1. Validate command
  const validation = validateCommand(command, session);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  // 2. Check turn ownership
  if (!session.isEntityTurn(command.entityId)) {
    return { success: false, error: 'NOT_YOUR_TURN' };
  }
  
  // 3. Execute via Rules Engine
  const result = await rulesEngine.execute(command, session.state);
  
  // 4. Apply state changes
  session.applyDelta(result.delta);
  
  // 5. Broadcast to all clients
  session.broadcast({
    type: 'STATE_DELTA',
    payload: result.delta,
    sequence: session.nextSequence()
  });
  
  return { success: true, result };
}
```

## 4.2 State Delta Pattern

```typescript
// Only send what changed, not full state
interface StateDelta {
  sequence: number;
  timestamp: number;
  changes: {
    entities?: Record<string, Partial<Entity>>;
    combat?: Partial<CombatState>;
    removed?: string[];
    effects?: Effect[];
  };
}

function applyDelta(state: GameState, delta: StateDelta): GameState {
  const newState = { ...state };
  
  if (delta.changes.entities) {
    for (const [id, changes] of Object.entries(delta.changes.entities)) {
      newState.entities[id] = { ...newState.entities[id], ...changes };
    }
  }
  
  if (delta.changes.removed) {
    for (const id of delta.changes.removed) {
      delete newState.entities[id];
    }
  }
  
  if (delta.changes.combat) {
    newState.combat = { ...newState.combat, ...delta.changes.combat };
  }
  
  return newState;
}
```

---

# 5. Document Quick Reference

| Doc # | Name | Use For |
|-------|------|---------|
| 01-02 | API Specifications | All REST/gRPC endpoints |
| 03 | Component Integration | How services connect |
| 04 | Rules Engine Patterns | Combat/spell logic |
| 05 | Network Protocol | WebSocket implementation |
| 06 | Sprint Tasks | What to build when |
| 07 | Tech Stack | Package versions |
| 08 | Database Schema | Prisma/SQL |
| 09 | UI Specifications | React components |
| 10 | Project Structure | File organization |
| 11 | Content Schemas | 5e data JSON formats |
| 12 | Test Specifications | Golden tests |

---

# 6. Critical Success Metrics

Before moving to next phase, verify:

| Phase | Metric | Target |
|-------|--------|--------|
| 1 | Project builds | ✓ Clean build |
| 2 | Auth flow works | ✓ Register/login/refresh |
| 2 | Rules engine tests | ✓ 100% golden tests pass |
| 3 | Grid renders | ✓ 60 FPS on mobile |
| 4 | WebSocket stable | ✓ No desync in 10min |
| 5 | Combat loop | ✓ Full turn executes |
| 6 | Character creates | ✓ Valid L1 character |

---

# END OF IMPLEMENTATION GUIDE
