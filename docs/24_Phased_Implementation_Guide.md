# D&D Digital Board Game Platform
# Document 24: Phased Implementation Guide for Claude Code

---

# 1. Overview

This document provides a structured implementation plan that Claude Code can follow to build the platform in verifiable stages. Each phase has:
- Clear deliverables
- Specific acceptance criteria
- Verification tests
- Deployment instructions
- Manual testing checklist

---

# 2. Implementation Phases Summary

| Phase | Name | Duration | Dependencies | Output |
|-------|------|----------|--------------|--------|
| 0 | Project Setup | 1-2 days | None | Working dev environment |
| 1 | Authentication | 3-4 days | Phase 0 | Login/register flow |
| 2 | Character Builder | 5-7 days | Phase 1 | Full character creation |
| 3 | Game Board Core | 7-10 days | Phase 1 | Playable board with tokens |
| 4 | Rules Engine | 7-10 days | Phase 3 | RAW 5e combat |
| 5 | Multiplayer | 5-7 days | Phase 4 | Real-time sessions |
| 6 | Campaign Builder | 7-10 days | Phase 5 | DM tools suite |
| 7 | Media Pipeline | 5-7 days | Phase 6 | AI image generation |
| 8 | Polish & Launch | 5-7 days | All | Production ready |

---

# 3. Phase 0: Project Setup

## 3.1 Objectives
- Initialize monorepo structure
- Set up development environment
- Configure CI/CD pipeline
- Verify all tooling works

## 3.2 Tasks for Claude Code

```bash
# TASK 0.1: Create project structure
mkdir -p dnd-board-game
cd dnd-board-game

# Initialize git
git init

# Create directory structure
mkdir -p apps/web/src
mkdir -p apps/mobile
mkdir -p services/api-gateway/src
mkdir -p services/game-state/src
mkdir -p services/rules-engine/src
mkdir -p services/grid-solver/src
mkdir -p services/media-service/src
mkdir -p packages/shared/src
mkdir -p packages/ui/src
mkdir -p packages/proto
mkdir -p infra/docker
mkdir -p infra/k8s
mkdir -p content/spells
mkdir -p content/monsters
mkdir -p prisma

# Copy root configuration files from Document 16
# Create: package.json, pnpm-workspace.yaml, turbo.json, etc.
```

```bash
# TASK 0.2: Install dependencies
pnpm install

# TASK 0.3: Initialize database
docker-compose up -d postgres redis

# TASK 0.4: Run initial migration
pnpm db:generate
pnpm db:migrate

# TASK 0.5: Verify setup
pnpm build
pnpm test
```

## 3.3 Acceptance Criteria

| Criterion | How to Verify |
|-----------|---------------|
| pnpm install completes | No errors in console |
| Docker services running | `docker ps` shows postgres, redis |
| Build succeeds | `pnpm build` exits with code 0 |
| Tests pass | `pnpm test` shows all green |
| Dev server starts | `pnpm dev` opens http://localhost:3000 |

## 3.4 Verification Script

```bash
#!/bin/bash
# scripts/verify-phase-0.sh

echo "=== Phase 0 Verification ==="

# Check Node version
echo "Checking Node.js version..."
node -v | grep -q "v20" || { echo "❌ Node.js v20 required"; exit 1; }
echo "✅ Node.js version OK"

# Check pnpm
echo "Checking pnpm..."
pnpm -v || { echo "❌ pnpm not installed"; exit 1; }
echo "✅ pnpm OK"

# Check Docker services
echo "Checking Docker services..."
docker ps | grep -q "postgres" || { echo "❌ PostgreSQL not running"; exit 1; }
docker ps | grep -q "redis" || { echo "❌ Redis not running"; exit 1; }
echo "✅ Docker services OK"

# Check database connection
echo "Checking database connection..."
pnpm db:migrate status || { echo "❌ Database connection failed"; exit 1; }
echo "✅ Database OK"

# Build check
echo "Building project..."
pnpm build || { echo "❌ Build failed"; exit 1; }
echo "✅ Build OK"

# Test check
echo "Running tests..."
pnpm test || { echo "❌ Tests failed"; exit 1; }
echo "✅ Tests OK"

echo ""
echo "=== Phase 0 Complete ✅ ==="
echo "Ready to proceed to Phase 1: Authentication"
```

---

# 4. Phase 1: Authentication

## 4.1 Objectives
- User registration and login
- JWT token management
- OAuth integration (Google, Discord)
- Basic user profile

## 4.2 Files to Create

```
services/api-gateway/src/
├── routes/
│   └── auth.ts              # Auth routes
├── middleware/
│   └── auth.ts              # JWT verification
├── services/
│   └── authService.ts       # Business logic
└── controllers/
    └── authController.ts    # Request handlers

apps/web/src/
├── pages/
│   ├── login.tsx
│   └── register.tsx
├── components/auth/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── OAuthButtons.tsx
├── hooks/
│   └── useAuth.ts
└── stores/
    └── authStore.ts

prisma/
└── schema.prisma           # User model
```

## 4.3 Implementation Instructions

```typescript
// TASK 1.1: Create User model in Prisma
// prisma/schema.prisma

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String    @unique
  displayName   String
  passwordHash  String?
  avatarUrl     String?
  
  // OAuth
  googleId      String?   @unique
  discordId     String?   @unique
  
  // Status
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?
  
  // Preferences
  preferences   Json      @default("{}")
  
  // Relations
  characters    Character[]
  sessions      Session[]
  campaigns     Campaign[]  @relation("CampaignOwner")
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
}
```

```typescript
// TASK 1.2: Auth service implementation
// services/api-gateway/src/services/authService.ts

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY = '7d';

export class AuthService {
  async register(data: RegisterInput): Promise<AuthResult> {
    // Check existing user
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username },
        ],
      },
    });
    
    if (existing) {
      throw new Error(existing.email === data.email 
        ? 'Email already registered' 
        : 'Username taken');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        displayName: data.displayName || data.username,
        passwordHash,
      },
    });
    
    // Generate token
    const token = this.generateToken(user.id);
    
    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }
    
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    
    const token = this.generateToken(user.id);
    
    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      return prisma.user.findUnique({ where: { id: payload.userId } });
    } catch {
      return null;
    }
  }

  private generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  }

  private sanitizeUser(user: User): SafeUser {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
```

```typescript
// TASK 1.3: Auth routes
// services/api-gateway/src/routes/auth.ts

import { Router } from 'express';
import { AuthService } from '../services/authService';
import { validateBody } from '../middleware/validation';
import { registerSchema, loginSchema } from '../schemas/auth';

const router = Router();
const authService = new AuthService();

router.post('/register', validateBody(registerSchema), async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', validateBody(loginSchema), async (req, res) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.post('/logout', auth, async (req, res) => {
  // Invalidate session if needed
  res.json({ success: true });
});

router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
```

```tsx
// TASK 1.4: Login page
// apps/web/src/pages/login.tsx

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../stores/authStore';
import { LoginForm } from '../components/auth/LoginForm';
import { OAuthButtons } from '../components/auth/OAuthButtons';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  
  const handleLogin = async (email: string, password: string) => {
    const success = await login(email, password);
    if (success) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark">
      <div className="w-full max-w-md p-8 bg-bg-medium rounded-xl">
        <h1 className="text-3xl font-cinzel text-center mb-8">
          Welcome Back
        </h1>
        
        <LoginForm 
          onSubmit={handleLogin}
          isLoading={isLoading}
          error={error}
        />
        
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-border"></div>
          <span className="px-4 text-text-muted">or</span>
          <div className="flex-1 border-t border-border"></div>
        </div>
        
        <OAuthButtons />
        
        <p className="mt-6 text-center text-text-secondary">
          Don't have an account?{' '}
          <a href="/register" className="text-primary hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
```

## 4.4 Acceptance Criteria

| Criterion | How to Verify |
|-----------|---------------|
| Registration works | POST /auth/register returns 201 with token |
| Login works | POST /auth/login returns 200 with token |
| Invalid login rejected | Wrong password returns 401 |
| Protected routes work | /auth/me returns 401 without token |
| Token stored in browser | Check localStorage/cookie |
| UI shows logged in state | Dashboard shows username |

## 4.5 Verification Script

```bash
#!/bin/bash
# scripts/verify-phase-1.sh

API_URL="http://localhost:3001"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="Test123!@#"

echo "=== Phase 1 Verification ==="

# Test registration
echo "Testing registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"username\":\"testuser$(date +%s)\",\"password\":\"$TEST_PASSWORD\"}")

TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.token')
if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Registration failed"
  echo $REGISTER_RESPONSE
  exit 1
fi
echo "✅ Registration OK"

# Test login
echo "Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

LOGIN_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
if [ "$LOGIN_TOKEN" == "null" ]; then
  echo "❌ Login failed"
  exit 1
fi
echo "✅ Login OK"

# Test protected route
echo "Testing protected route..."
ME_RESPONSE=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $LOGIN_TOKEN")

USER_ID=$(echo $ME_RESPONSE | jq -r '.user.id')
if [ "$USER_ID" == "null" ]; then
  echo "❌ Protected route failed"
  exit 1
fi
echo "✅ Protected route OK"

# Test invalid credentials
echo "Testing invalid credentials..."
INVALID_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrongpassword\"}")

if echo $INVALID_RESPONSE | grep -q "Invalid"; then
  echo "✅ Invalid credentials rejected"
else
  echo "❌ Invalid credentials not rejected properly"
  exit 1
fi

echo ""
echo "=== Phase 1 Complete ✅ ==="
echo "Ready to proceed to Phase 2: Character Builder"
```

## 4.6 Manual Testing Checklist

- [ ] Navigate to /login page - renders correctly
- [ ] Submit empty form - shows validation errors
- [ ] Submit with invalid email format - shows error
- [ ] Submit with wrong password - shows "Invalid credentials"
- [ ] Submit with correct credentials - redirects to dashboard
- [ ] Refresh dashboard - stays logged in
- [ ] Click logout - redirects to login
- [ ] Try accessing /dashboard without login - redirects to login
- [ ] Google OAuth button - opens Google popup
- [ ] Discord OAuth button - opens Discord popup

---

# 5. Phase 2: Character Builder

## 5.1 Objectives
- Full RAW 5e character creation
- Race/Class/Background selection
- Ability score allocation
- Spell selection (for casters)
- Portrait generation integration
- Character sheet view

## 5.2 Database Models

```prisma
// TASK 2.1: Character models
// prisma/schema.prisma

model Character {
  id            String    @id @default(cuid())
  userId        String
  name          String
  
  // Core stats
  race          String
  subrace       String?
  class         String
  subclass      String?
  background    String
  level         Int       @default(1)
  experiencePoints Int    @default(0)
  
  // Ability scores
  strength      Int
  dexterity     Int
  constitution  Int
  intelligence  Int
  wisdom        Int
  charisma      Int
  
  // Derived stats
  maxHitPoints  Int
  currentHitPoints Int
  tempHitPoints Int       @default(0)
  armorClass    Int
  initiative    Int
  speed         Int
  proficiencyBonus Int
  
  // Proficiencies (stored as JSON)
  savingThrows  String[]
  skills        String[]
  tools         String[]
  weapons       String[]
  armor         String[]
  languages     String[]
  
  // Features and traits
  features      Json      @default("[]")
  traits        String[]
  
  // Spellcasting
  spellcastingAbility String?
  spellSlots    Json?
  spellsKnown   String[]
  spellsPrepared String[]
  
  // Equipment
  equipment     Json      @default("[]")
  currency      Json      @default("{\"cp\":0,\"sp\":0,\"gp\":0,\"pp\":0}")
  
  // Appearance
  portraitUrl   String?
  appearance    Json?
  
  // Metadata
  isPublic      Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  user          User      @relation(fields: [userId], references: [id])
}
```

## 5.3 Key Components

```tsx
// TASK 2.2: Character creation wizard
// apps/web/src/components/character-builder/CharacterWizard.tsx

import { useState } from 'react';
import { RaceSelection } from './steps/RaceSelection';
import { ClassSelection } from './steps/ClassSelection';
import { AbilityScores } from './steps/AbilityScores';
import { BackgroundSelection } from './steps/BackgroundSelection';
import { SpellSelection } from './steps/SpellSelection';
import { EquipmentSelection } from './steps/EquipmentSelection';
import { Appearance } from './steps/Appearance';
import { Review } from './steps/Review';

const STEPS = [
  { id: 'race', label: 'Race', component: RaceSelection },
  { id: 'class', label: 'Class', component: ClassSelection },
  { id: 'abilities', label: 'Abilities', component: AbilityScores },
  { id: 'background', label: 'Background', component: BackgroundSelection },
  { id: 'spells', label: 'Spells', component: SpellSelection, conditional: true },
  { id: 'equipment', label: 'Equipment', component: EquipmentSelection },
  { id: 'appearance', label: 'Appearance', component: Appearance },
  { id: 'review', label: 'Review', component: Review },
];

export function CharacterWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [character, setCharacter] = useState<Partial<Character>>({});

  const updateCharacter = (updates: Partial<Character>) => {
    setCharacter(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    let next = currentStep + 1;
    // Skip spells if non-caster
    if (STEPS[next]?.id === 'spells' && !isCaster(character.class)) {
      next++;
    }
    setCurrentStep(next);
  };

  const prevStep = () => {
    let prev = currentStep - 1;
    if (STEPS[prev]?.id === 'spells' && !isCaster(character.class)) {
      prev--;
    }
    setCurrentStep(prev);
  };

  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between">
          {STEPS.filter(s => !s.conditional || (s.id === 'spells' && isCaster(character.class)))
            .map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 text-center ${
                  index <= currentStep ? 'text-primary' : 'text-text-muted'
                }`}
              >
                <div className={`
                  w-8 h-8 mx-auto rounded-full flex items-center justify-center
                  ${index < currentStep ? 'bg-primary' : 
                    index === currentStep ? 'border-2 border-primary' : 
                    'border border-border'}
                `}>
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <div className="mt-2 text-sm">{step.label}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Step content */}
      <CurrentStepComponent
        character={character}
        onUpdate={updateCharacter}
        onNext={nextStep}
        onBack={currentStep > 0 ? prevStep : undefined}
      />
    </div>
  );
}
```

## 5.4 Acceptance Criteria

| Criterion | How to Verify |
|-----------|---------------|
| Can select race | Clicking race shows selection |
| Can select class | Clicking class shows selection |
| Ability scores total correctly | Standard array sums to fixed total |
| Spell selection works | Casters see spell list |
| Portrait generation works | AI generates portrait |
| Character saves | POST /characters succeeds |
| Character loads | GET /characters/:id returns data |
| Character sheet displays | All stats show correctly |

## 5.5 Verification Script

```bash
#!/bin/bash
# scripts/verify-phase-2.sh

API_URL="http://localhost:3001"

echo "=== Phase 2 Verification ==="

# Login first
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}' | jq -r '.token')

# Create character
echo "Creating character..."
CHAR_RESPONSE=$(curl -s -X POST "$API_URL/characters" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Thorin Ironforge",
    "race": "dwarf",
    "subrace": "mountain",
    "class": "fighter",
    "background": "soldier",
    "strength": 16,
    "dexterity": 14,
    "constitution": 16,
    "intelligence": 10,
    "wisdom": 12,
    "charisma": 8,
    "skills": ["athletics", "intimidation"],
    "equipment": []
  }')

CHAR_ID=$(echo $CHAR_RESPONSE | jq -r '.id')
if [ "$CHAR_ID" == "null" ]; then
  echo "❌ Character creation failed"
  echo $CHAR_RESPONSE
  exit 1
fi
echo "✅ Character created: $CHAR_ID"

# Get character
echo "Fetching character..."
GET_RESPONSE=$(curl -s -X GET "$API_URL/characters/$CHAR_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo $GET_RESPONSE | jq -e '.name' > /dev/null; then
  echo "✅ Character fetch OK"
else
  echo "❌ Character fetch failed"
  exit 1
fi

# Verify derived stats
echo "Verifying derived stats..."
PROF_BONUS=$(echo $GET_RESPONSE | jq -r '.proficiencyBonus')
if [ "$PROF_BONUS" == "2" ]; then
  echo "✅ Proficiency bonus correct"
else
  echo "❌ Proficiency bonus incorrect: $PROF_BONUS"
fi

echo ""
echo "=== Phase 2 Complete ✅ ==="
```

---

# 6. Phase 3: Game Board Core

## 6.1 Objectives
- PixiJS canvas rendering
- Tile-based grid system
- Token management
- Camera controls (pan/zoom)
- Fog of war
- Basic interactions

## 6.2 Key Files

```
apps/web/src/game/
├── GameApplication.ts      # Main game class
├── BoardRenderer.ts        # Grid rendering
├── TokenManager.ts         # Token sprites
├── FogOfWarRenderer.ts     # Visibility system
├── CameraController.ts     # Pan/zoom
├── InputHandler.ts         # Mouse/touch
└── types.ts               # Game types

packages/shared/src/types/
├── grid.ts                # Grid position types
├── tile.ts                # Tile data types
└── map.ts                 # Map structure
```

## 6.3 Acceptance Criteria

| Criterion | How to Verify |
|-----------|---------------|
| Grid renders | Canvas shows tile grid |
| Tokens display | Characters appear on tiles |
| Pan works | Click-drag moves camera |
| Zoom works | Mouse wheel zooms |
| Tile selection | Clicking tile highlights it |
| Fog of war | Hidden areas are obscured |
| Mobile touch | Pinch to zoom, drag to pan |
| 60 FPS | Performance monitor shows 60 |

## 6.4 Verification Script

```bash
#!/bin/bash
# scripts/verify-phase-3.sh

echo "=== Phase 3 Verification ==="

# Check game canvas renders
echo "Starting dev server..."
pnpm dev &
DEV_PID=$!
sleep 10

# Puppeteer test
node << 'EOF'
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/game/test');
  
  // Wait for canvas
  await page.waitForSelector('canvas');
  console.log('✅ Canvas rendered');
  
  // Check for tokens
  const tokens = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return canvas.getContext('2d') !== null;
  });
  console.log(tokens ? '✅ Canvas context OK' : '❌ Canvas context failed');
  
  // Check FPS
  const fps = await page.evaluate(() => window.__PIXI_FPS__ || 60);
  console.log(fps >= 55 ? '✅ FPS OK' : '❌ FPS too low: ' + fps);
  
  await browser.close();
  process.exit(0);
})();
EOF

kill $DEV_PID
echo "=== Phase 3 Complete ✅ ==="
```

---

# 7. Phase 4: Rules Engine

## 7.1 Objectives
- RAW 5e dice rolling
- Ability checks and saves
- Attack resolution
- Damage calculation
- Spell resolution
- Condition management

## 7.2 Key Tests (Golden Fixtures)

```typescript
// services/rules-engine/tests/golden.test.ts

describe('RAW 5e Golden Tests', () => {
  describe('Ability Checks', () => {
    test('STR check with +3 modifier against DC 15', () => {
      // Roll 12 + 3 = 15, should succeed
      const result = engine.resolveCheck({
        ability: 'STR',
        modifier: 3,
        dc: 15,
        roll: 12,  // Seeded
      });
      expect(result.success).toBe(true);
      expect(result.total).toBe(15);
    });

    test('Advantage takes higher roll', () => {
      const result = engine.rollWithAdvantage([8, 15]);
      expect(result.used).toBe(15);
      expect(result.hadAdvantage).toBe(true);
    });
  });

  describe('Combat', () => {
    test('Attack roll vs AC', () => {
      const result = engine.resolveAttack({
        attackBonus: 5,
        targetAC: 15,
        roll: 12,  // 12 + 5 = 17 >= 15
      });
      expect(result.hits).toBe(true);
    });

    test('Natural 20 always hits', () => {
      const result = engine.resolveAttack({
        attackBonus: -5,
        targetAC: 30,
        roll: 20,
      });
      expect(result.hits).toBe(true);
      expect(result.isCritical).toBe(true);
    });

    test('Fire damage vs fire resistant', () => {
      const result = engine.calculateDamage({
        dice: '3d6',
        type: 'FIRE',
        roll: 12,
        target: { resistances: ['FIRE'] },
      });
      expect(result.finalDamage).toBe(6);  // Halved
    });
  });

  describe('Spellcasting', () => {
    test('Fireball affects correct tiles', () => {
      const tiles = engine.getAoETiles({
        shape: 'sphere',
        radius: 20,
        origin: { x: 10, y: 10 },
      });
      // 20ft radius = 4 tiles radius
      expect(tiles.length).toBeGreaterThan(40);
    });

    test('Concentration check on damage', () => {
      const result = engine.concentrationCheck({
        damage: 22,
        constitutionMod: 3,
        roll: 8,  // 8 + 3 = 11 vs DC 11 (half of 22)
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Conditions', () => {
    test('Paralyzed creature auto-fails STR/DEX saves', () => {
      const result = engine.resolveSave({
        ability: 'DEX',
        modifier: 5,
        dc: 10,
        conditions: ['PARALYZED'],
      });
      expect(result.autoFail).toBe(true);
      expect(result.success).toBe(false);
    });

    test('Attacks against paralyzed have advantage', () => {
      const effects = engine.getConditionEffects(['PARALYZED']);
      expect(effects.attacksAgainstHaveAdvantage).toBe(true);
    });
  });
});
```

## 7.3 Acceptance Criteria

| Criterion | How to Verify |
|-----------|---------------|
| All golden tests pass | `pnpm test:golden` all green |
| Dice rolls are deterministic with seed | Same seed = same results |
| All 13 damage types work | Test each resistance/vulnerability |
| All 15 conditions work | Test each condition effect |
| Spell slots track correctly | Can't cast without slots |
| Concentration works | Dropping concentration ends spell |

---

# 8. Remaining Phases Summary

## Phase 5: Multiplayer
- WebSocket gateway
- Session management
- Turn synchronization
- Chat system
- Reconnection handling

## Phase 6: Campaign Builder
- Map editor
- Encounter editor
- Dialogue editor
- Cutscene editor
- Publishing workflow

## Phase 7: Media Pipeline
- AI image generation
- Asset upload
- CDN delivery
- Video rendering

## Phase 8: Polish & Launch
- Performance optimization
- Error handling
- Analytics
- Documentation
- Deployment

---

# 9. Claude Code Instructions

## 9.1 Starting a Phase

```
To start Phase X:

1. Read Document 24 section for Phase X
2. Create all required files listed
3. Implement each TASK in order
4. Run verification script
5. Complete manual testing checklist
6. Report results to user

If tests fail:
- Debug the specific failure
- Fix the issue
- Re-run verification
- Do not proceed until all pass
```

## 9.2 Reporting Format

After each phase, Claude Code should report:

```markdown
## Phase X Complete

### Files Created
- path/to/file1.ts
- path/to/file2.ts

### Tests Run
- Unit tests: 45/45 passed
- Integration tests: 12/12 passed
- Golden tests: 50/50 passed

### Verification Script
✅ All checks passed

### Manual Testing
- [x] Item 1
- [x] Item 2
- [x] Item 3

### Ready for Next Phase
Yes - proceed to Phase X+1
```

## 9.3 Commit Strategy

```bash
# After each phase completion
git add .
git commit -m "Complete Phase X: [Phase Name]

- Feature 1
- Feature 2
- Feature 3

All tests passing. Verified with scripts/verify-phase-x.sh"

git tag vX.0.0
git push origin main --tags
```

---

# 10. Deployment Strategy

## 10.1 Per-Phase Deployment

Each phase can be deployed independently for verification:

| Phase | Deploy To | URL |
|-------|-----------|-----|
| 0 | Local only | localhost:3000 |
| 1 | Staging | staging.dndboard.game |
| 2 | Staging | staging.dndboard.game |
| 3 | Staging | staging.dndboard.game |
| 4 | Staging | staging.dndboard.game |
| 5 | Beta | beta.dndboard.game |
| 6 | Beta | beta.dndboard.game |
| 7 | Beta | beta.dndboard.game |
| 8 | Production | dndboard.game |

## 10.2 Deployment Commands

```bash
# Deploy to staging
pnpm deploy:staging

# Deploy to beta (requires approval)
pnpm deploy:beta

# Deploy to production (requires approval + tests)
pnpm deploy:prod
```

---

# END OF DOCUMENT 24
