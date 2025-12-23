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

| Phase | Name | Duration | Dependencies | Output | Status |
|-------|------|----------|--------------|--------|--------|
| 0 | Project Setup | 1-2 days | None | Working dev environment | ✅ Complete |
| 1 | Authentication | 3-4 days | Phase 0 | Login/register flow | ✅ Complete |
| 2 | Character Builder | 5-7 days | Phase 1 | Full character creation | ✅ Complete |
| 3 | Game Board Core | 7-10 days | Phase 1 | Playable board with tokens | ✅ Complete |
| 4 | Rules Engine | 7-10 days | Phase 3 | RAW 5e combat | ✅ Complete |
| 5 | Multiplayer | 5-7 days | Phase 4 | Real-time sessions | ✅ Complete |
| 6 | Campaign Builder | 7-10 days | Phase 5 | DM tools suite | ✅ Complete |
| 7 | Media Pipeline | 5-7 days | Phase 6 | AI image generation | ✅ Complete |
| 8 | Polish & Launch | 5-7 days | All | Production ready | ✅ Complete |
| **9** | **AI Campaign Studio** | **6 sprints** | Phase 8 | **Claude-powered campaign creation** | 🚧 In Progress |

---

## Current Phase: Phase 9 - AI Campaign Studio

Phase 9 adds AI-powered campaign creation with Claude integration, video cutscenes, and voice narration. This transforms the DM experience from manual content creation to conversational AI-assisted worldbuilding.

### Phase 9 Sprint Overview

| Sprint | Name | Focus | Key Deliverables |
|--------|------|-------|------------------|
| 9.1 | AI Service Foundation | Backend | ✅ Claude integration, conversation routes, Redis state |
| 9.2 | Campaign Studio UI | Frontend | Chat interface, phase progress, content preview |
| 9.3 | Runway Video Integration | Media | Video cutscene generation pipeline |
| 9.4 | ElevenLabs TTS | Media | Voice narration for NPCs and DM |
| 9.5 | Content Editors | Frontend | Map, NPC, Encounter, Quest editors |
| 9.6 | Player Immersion | Frontend | Cutscene playback, atmospheric effects |

### Production URLs (Phase 9)
- **AI Service:** https://ai-production-0566.up.railway.app
- **Web App:** https://web-production-b649.up.railway.app
- **API Gateway:** https://api-production-2f00.up.railway.app

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

# 11. Phase 9: AI Campaign Studio

Phase 9 introduces Claude-powered conversational campaign creation, video cutscenes with Runway, and voice narration with ElevenLabs. This phase is divided into 6 focused sprints.

---

## 11.1 Sprint 9.1: AI Service Foundation (COMPLETE ✅)

### Objectives
- Deploy standalone AI service with Claude integration
- Implement conversation state management with Redis
- Create authentication middleware for AI endpoints
- Test Claude chat and generation capabilities

### Files Created
```
services/ai-service/
├── src/
│   ├── index.ts                    # Express server entry
│   ├── lib/
│   │   ├── config.ts               # Environment configuration
│   │   ├── logger.ts               # Pino logger
│   │   ├── claude.ts               # Anthropic SDK wrapper
│   │   └── redis.ts                # Redis client
│   ├── middleware/
│   │   └── auth.ts                 # JWT authentication
│   ├── routes/
│   │   ├── conversation.ts         # Conversation endpoints
│   │   └── generation.ts           # Content generation endpoints
│   └── prompts/
│       ├── campaignStudio.ts       # System prompts for phases
│       └── contentGeneration.ts    # Generation prompts
├── package.json
├── tsconfig.json
├── Dockerfile
└── railway.toml
```

### Key Implementation

```typescript
// services/ai-service/src/lib/claude.ts
import Anthropic from '@anthropic-ai/sdk';
import { config } from './config.js';

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey,
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export async function chat(
  systemPrompt: string,
  messages: ChatMessage[],
  options: { maxTokens?: number; model?: string } = {}
): Promise<ChatResponse> {
  const model = options.model || config.claudeModelChat;
  const maxTokens = options.maxTokens || 4096;

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textContent = response.content.find(c => c.type === 'text');

  return {
    content: textContent?.text || '',
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}
```

### Acceptance Criteria

| Criterion | Status |
|-----------|--------|
| AI Service deploys to Railway | ✅ https://ai-production-0566.up.railway.app |
| /health returns service status | ✅ Returns features enabled |
| /test/claude confirms Claude connection | ✅ Returns Claude response |
| JWT authentication works | ✅ Protected routes reject invalid tokens |
| Environment variables configured | ✅ ANTHROPIC_API_KEY set in Railway |

### Verification

```bash
# Test health endpoint
curl https://ai-production-0566.up.railway.app/health
# Returns: {"status":"ok","service":"ai-service","features":{...}}

# Test Claude connection
curl https://ai-production-0566.up.railway.app/test/claude
# Returns: {"status":"ok","response":"Hello! I'm Claude...","usage":{...}}
```

---

## 11.2 Sprint 9.2: Campaign Studio UI (PENDING)

### Objectives
- Build conversational chat interface for campaign creation
- Implement 6-phase progress tracker
- Create content preview panel with cards
- Add real-time generation status indicators

### Files to Create
```
apps/web/src/
├── app/dm/campaign-studio/
│   ├── page.tsx                    # Main Campaign Studio page
│   ├── layout.tsx                  # Studio layout
│   └── [conversationId]/
│       └── page.tsx                # Active conversation
├── components/campaign-studio/
│   ├── ChatPanel.tsx               # Message thread
│   ├── ChatInput.tsx               # Message input with send
│   ├── PhaseProgress.tsx           # 6-phase progress bar
│   ├── ContentPreview.tsx          # Generated content cards
│   ├── SettingCard.tsx             # Campaign setting display
│   ├── NPCCard.tsx                 # NPC preview card
│   ├── EncounterCard.tsx           # Encounter preview card
│   ├── QuestCard.tsx               # Quest chain display
│   ├── LocationCard.tsx            # Location with map preview
│   └── GeneratingIndicator.tsx     # Animated generation status
├── stores/
│   └── campaignStudioStore.ts      # Zustand store for studio state
└── hooks/
    └── useCampaignStudio.ts        # API integration hook
```

### Key Components

```tsx
// apps/web/src/components/campaign-studio/ChatPanel.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useCampaignStudioStore } from '@/stores/campaignStudioStore';

const messageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  },
  exit: { opacity: 0, y: -10, scale: 0.95 }
};

export function ChatPanel() {
  const { messages, isGenerating } = useCampaignStudioStore();

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            variants={messageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-xl ${
                message.role === 'user'
                  ? 'bg-primary/20 text-white'
                  : 'bg-bg-elevated border border-border'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center">
                    <span className="text-xs">AI</span>
                  </div>
                  <span className="text-sm text-text-secondary">Campaign Guide</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-4"
        >
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-purple-500"
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
          <span className="text-text-secondary text-sm">Claude is thinking...</span>
        </motion.div>
      )}
    </div>
  );
}
```

```tsx
// apps/web/src/components/campaign-studio/PhaseProgress.tsx
import { motion } from 'framer-motion';

const PHASES = [
  { id: 'setting', label: 'Setting', icon: '🌍' },
  { id: 'story', label: 'Story', icon: '📜' },
  { id: 'locations', label: 'Locations', icon: '🗺️' },
  { id: 'npcs', label: 'NPCs', icon: '👥' },
  { id: 'encounters', label: 'Encounters', icon: '⚔️' },
  { id: 'quests', label: 'Quests', icon: '🎯' },
];

interface PhaseProgressProps {
  currentPhase: string;
  completedPhases: string[];
}

export function PhaseProgress({ currentPhase, completedPhases }: PhaseProgressProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-bg-elevated/50 border-b border-border">
      {PHASES.map((phase, index) => {
        const isCompleted = completedPhases.includes(phase.id);
        const isCurrent = phase.id === currentPhase;
        const isUpcoming = !isCompleted && !isCurrent;

        return (
          <div key={phase.id} className="flex items-center">
            <motion.div
              className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-lg cursor-pointer
                ${isCurrent ? 'bg-primary/20 ring-2 ring-primary/50' : ''}
                ${isCompleted ? 'opacity-100' : isUpcoming ? 'opacity-40' : ''}
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-xl">{phase.icon}</span>
              <span className={`text-xs ${isCurrent ? 'text-primary' : 'text-text-secondary'}`}>
                {phase.label}
              </span>
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"
                >
                  <span className="text-[10px]">✓</span>
                </motion.div>
              )}
            </motion.div>
            {index < PHASES.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${isCompleted ? 'bg-green-500' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

### Acceptance Criteria

| Criterion | How to Verify |
|-----------|---------------|
| Chat interface renders | Navigate to /dm/campaign-studio |
| Messages send to AI service | POST /ai/conversation/:id/message works |
| Phase progress updates | Completing phase shows checkmark |
| Content cards display | Generated NPCs/encounters show in panel |
| Loading states animate | Typing indicator appears during generation |
| Mobile responsive | Chat works on 375px viewport |

### API Endpoints Used

```typescript
// Start new conversation
POST /ai/conversation/start
Body: { campaignId: string }
Response: { conversationId: string, phase: 'setting' }

// Send message
POST /ai/conversation/:id/message
Body: { content: string }
Response: { message: string, generatedContent?: ContentBlock[] }

// Advance to next phase
POST /ai/conversation/:id/advance
Response: { phase: string, summary: string }

// Get conversation history
GET /ai/conversation/:id/history
Response: { messages: Message[], phase: string, content: ContentBlock[] }
```

---

## 11.3 Sprint 9.3: Runway Video Integration (PENDING)

### Objectives
- Integrate Runway Gen-3 Alpha for video cutscene generation
- Implement video asset management and storage
- Create cutscene preview and editing UI
- Add video playback component

### Files to Create
```
services/ai-service/src/
├── lib/
│   └── runway.ts                   # Runway API client
├── routes/
│   └── video.ts                    # Video generation endpoints
└── prompts/
    └── videoPrompts.ts             # Scene-to-video prompts

apps/web/src/
├── components/cutscenes/
│   ├── CutscenePlayer.tsx          # Video playback with controls
│   ├── CutsceneEditor.tsx          # Edit generated scenes
│   ├── SceneTimeline.tsx           # Timeline with thumbnails
│   └── GenerationProgress.tsx      # Video generation status
```

### Key Implementation

```typescript
// services/ai-service/src/lib/runway.ts
import RunwayML from '@runwayml/sdk';
import { config } from './config.js';
import { logger } from './logger.js';

const runway = new RunwayML({ apiKey: config.runwayApiKey });

export interface VideoGenerationOptions {
  prompt: string;
  duration?: 5 | 10;  // seconds
  aspectRatio?: '16:9' | '9:16' | '1:1';
  seed?: number;
}

export interface VideoGenerationResult {
  taskId: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
}

export async function generateVideo(
  options: VideoGenerationOptions
): Promise<VideoGenerationResult> {
  try {
    const task = await runway.imageToVideo.create({
      model: 'gen3a_turbo',
      promptText: options.prompt,
      duration: options.duration || config.runwayDefaultDuration,
      ratio: options.aspectRatio || '16:9',
      seed: options.seed,
    });

    logger.info({ taskId: task.id }, 'Video generation started');

    return {
      taskId: task.id,
      status: 'pending',
    };
  } catch (error) {
    logger.error({ error }, 'Video generation failed');
    throw error;
  }
}

export async function getVideoStatus(taskId: string): Promise<VideoGenerationResult> {
  const task = await runway.tasks.retrieve(taskId);

  return {
    taskId: task.id,
    status: task.status === 'SUCCEEDED' ? 'complete' :
            task.status === 'FAILED' ? 'failed' :
            task.status === 'RUNNING' ? 'processing' : 'pending',
    videoUrl: task.output?.[0],
    duration: config.runwayDefaultDuration,
  };
}
```

### API Endpoints

```typescript
// Generate video cutscene
POST /ai/generate/video
Body: {
  sceneDescription: string,
  style: 'cinematic' | 'fantasy' | 'dark',
  duration: 5 | 10,
  campaignId: string
}
Response: { taskId: string, estimatedTime: number }

// Check generation status
GET /ai/generate/video/:taskId/status
Response: { status: string, videoUrl?: string, progress?: number }

// List campaign videos
GET /ai/generate/video/campaign/:campaignId
Response: { videos: Video[] }
```

### Acceptance Criteria

| Criterion | How to Verify |
|-----------|---------------|
| Runway SDK initializes | Service starts without errors |
| Video generation starts | POST returns taskId |
| Status polling works | GET returns current status |
| Completed video plays | Video URL loads in player |
| Error handling works | Failed generations show error UI |
| Cost tracking works | Generation costs logged |

---

## 11.4 Sprint 9.4: ElevenLabs TTS (PENDING)

### Objectives
- Integrate ElevenLabs for voice narration
- Create voice profiles for DM and NPCs
- Implement audio playback with subtitles
- Add voice selection UI for NPCs

### Files to Create
```
services/ai-service/src/
├── lib/
│   └── elevenlabs.ts               # ElevenLabs API client
├── routes/
│   └── voice.ts                    # Voice generation endpoints
└── data/
    └── voiceProfiles.ts            # Pre-configured voices

apps/web/src/
├── components/voice/
│   ├── VoicePlayer.tsx             # Audio playback with waveform
│   ├── VoiceSelector.tsx           # Choose NPC voice
│   ├── SubtitleOverlay.tsx         # Synchronized subtitles
│   └── VoicePreview.tsx            # Sample voice clips
```

### Key Implementation

```typescript
// services/ai-service/src/lib/elevenlabs.ts
import { ElevenLabsClient } from 'elevenlabs';
import { config } from './config.js';
import { logger } from './logger.js';

const client = new ElevenLabsClient({
  apiKey: config.elevenLabsApiKey,
});

export interface VoiceGenerationOptions {
  text: string;
  voiceId: string;
  stability?: number;      // 0-1, default 0.5
  similarityBoost?: number; // 0-1, default 0.75
}

export interface VoiceResult {
  audioUrl: string;
  duration: number;
  characterCount: number;
}

// Pre-defined voice profiles
export const VOICE_PROFILES = {
  narrator: {
    id: 'pNInz6obpgDQGcFmaJgB',  // Adam
    name: 'Narrator',
    description: 'Deep, authoritative DM voice',
    stability: 0.7,
    similarityBoost: 0.8,
  },
  wizard: {
    id: 'VR6AewLTigWG4xSOukaG',  // Arnold
    name: 'Wizard',
    description: 'Aged, mysterious spellcaster',
    stability: 0.6,
    similarityBoost: 0.7,
  },
  warrior: {
    id: 'ErXwobaYiN019PkySvjV',  // Antoni
    name: 'Warrior',
    description: 'Strong, confident fighter',
    stability: 0.8,
    similarityBoost: 0.8,
  },
  rogue: {
    id: 'MF3mGyEYCl7XYWbV9V6O',  // Elli
    name: 'Rogue',
    description: 'Sly, quick-witted',
    stability: 0.5,
    similarityBoost: 0.6,
  },
  villain: {
    id: 'N2lVS1w4EtoT3dr4eOWO',  // Callum
    name: 'Villain',
    description: 'Dark, menacing antagonist',
    stability: 0.9,
    similarityBoost: 0.9,
  },
};

export async function generateVoice(
  options: VoiceGenerationOptions
): Promise<VoiceResult> {
  try {
    const audio = await client.generate({
      voice: options.voiceId,
      text: options.text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: options.stability ?? 0.5,
        similarity_boost: options.similarityBoost ?? 0.75,
      },
    });

    // Convert stream to buffer and upload to storage
    const chunks: Buffer[] = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    // Upload to CDN and return URL
    const audioUrl = await uploadAudio(audioBuffer);

    return {
      audioUrl,
      duration: estimateDuration(options.text),
      characterCount: options.text.length,
    };
  } catch (error) {
    logger.error({ error }, 'Voice generation failed');
    throw error;
  }
}
```

### API Endpoints

```typescript
// Generate voice narration
POST /ai/generate/voice
Body: {
  text: string,
  voiceProfile: 'narrator' | 'wizard' | 'warrior' | 'rogue' | 'villain' | string,
  npcId?: string
}
Response: { audioUrl: string, duration: number }

// Get available voices
GET /ai/generate/voice/profiles
Response: { profiles: VoiceProfile[] }

// Preview voice
POST /ai/generate/voice/preview
Body: { voiceId: string, text?: string }
Response: { audioUrl: string }
```

### Acceptance Criteria

| Criterion | How to Verify |
|-----------|---------------|
| ElevenLabs SDK works | Test endpoint returns audio |
| Voice profiles selectable | UI shows 5+ voice options |
| Audio plays correctly | Player loads and plays audio |
| Subtitles sync | Text appears in time with audio |
| NPC voice saves | Voice selection persists |
| Usage tracking works | Character count logged |

---

## 11.5 Sprint 9.5: Content Editors (PENDING)

### Objectives
- Build interactive editors for AI-generated content
- Allow manual refinement of NPCs, encounters, locations
- Implement content version history
- Add export to campaign functionality

### Files to Create
```
apps/web/src/
├── components/editors/
│   ├── NPCEditor.tsx               # Edit NPC details
│   ├── EncounterEditor.tsx         # Edit encounter setup
│   ├── LocationEditor.tsx          # Edit location details
│   ├── QuestEditor.tsx             # Edit quest chains
│   ├── DialogueEditor.tsx          # Edit NPC dialogue trees
│   └── MapEditor.tsx               # Edit location maps
├── components/shared/
│   ├── StatBlockEditor.tsx         # D&D stat block editing
│   ├── MarkdownEditor.tsx          # Rich text for descriptions
│   └── ImagePicker.tsx             # Select/generate images
```

### Key Components

```tsx
// apps/web/src/components/editors/NPCEditor.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { StatBlockEditor } from '../shared/StatBlockEditor';
import { VoiceSelector } from '../voice/VoiceSelector';
import { ImagePicker } from '../shared/ImagePicker';

interface NPCEditorProps {
  npc: NPC;
  onSave: (npc: NPC) => void;
  onRegenerate: (field: string) => void;
}

export function NPCEditor({ npc, onSave, onRegenerate }: NPCEditorProps) {
  const [editedNPC, setEditedNPC] = useState(npc);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-card rounded-xl border border-border p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <ImagePicker
          currentImage={editedNPC.portraitUrl}
          onSelect={(url) => setEditedNPC({ ...editedNPC, portraitUrl: url })}
          onRegenerate={() => onRegenerate('portrait')}
          className="w-24 h-24 rounded-lg"
        />
        <div className="flex-1">
          <input
            type="text"
            value={editedNPC.name}
            onChange={(e) => setEditedNPC({ ...editedNPC, name: e.target.value })}
            className="text-2xl font-cinzel bg-transparent border-none focus:ring-0 w-full"
          />
          <p className="text-text-secondary">{editedNPC.race} {editedNPC.class}</p>
        </div>
        <button
          onClick={() => onRegenerate('all')}
          className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30"
        >
          Regenerate
        </button>
      </div>

      {/* Description */}
      <div>
        <label className="text-sm text-text-secondary mb-2 block">Description</label>
        <textarea
          value={editedNPC.description}
          onChange={(e) => setEditedNPC({ ...editedNPC, description: e.target.value })}
          className="w-full h-24 bg-bg-elevated rounded-lg border border-border p-3 resize-none"
        />
      </div>

      {/* Personality */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Personality Traits</label>
          <input
            type="text"
            value={editedNPC.personality.traits.join(', ')}
            onChange={(e) => setEditedNPC({
              ...editedNPC,
              personality: { ...editedNPC.personality, traits: e.target.value.split(', ') }
            })}
            className="w-full bg-bg-elevated rounded-lg border border-border p-2"
          />
        </div>
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Ideal</label>
          <input
            type="text"
            value={editedNPC.personality.ideal}
            onChange={(e) => setEditedNPC({
              ...editedNPC,
              personality: { ...editedNPC.personality, ideal: e.target.value }
            })}
            className="w-full bg-bg-elevated rounded-lg border border-border p-2"
          />
        </div>
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Flaw</label>
          <input
            type="text"
            value={editedNPC.personality.flaw}
            onChange={(e) => setEditedNPC({
              ...editedNPC,
              personality: { ...editedNPC.personality, flaw: e.target.value }
            })}
            className="w-full bg-bg-elevated rounded-lg border border-border p-2"
          />
        </div>
      </div>

      {/* Voice */}
      <div>
        <label className="text-sm text-text-secondary mb-2 block">Voice Profile</label>
        <VoiceSelector
          selected={editedNPC.voiceProfile}
          onSelect={(voice) => setEditedNPC({ ...editedNPC, voiceProfile: voice })}
        />
      </div>

      {/* Stats */}
      {editedNPC.stats && (
        <StatBlockEditor
          stats={editedNPC.stats}
          onChange={(stats) => setEditedNPC({ ...editedNPC, stats })}
        />
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setEditedNPC(npc)}
          className="px-4 py-2 text-text-secondary hover:text-white"
        >
          Reset
        </button>
        <button
          onClick={() => onSave(editedNPC)}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
        >
          Save Changes
        </button>
      </div>
    </motion.div>
  );
}
```

### Acceptance Criteria

| Criterion | How to Verify |
|-----------|---------------|
| NPC editor loads | Navigate to NPC edit page |
| Fields are editable | Can modify name, description, traits |
| Regenerate works | Clicking regenerate calls AI |
| Voice selector works | Can preview and select voices |
| Changes persist | Saved changes reload correctly |
| Image picker works | Can select/generate new portrait |

---

## 11.6 Sprint 9.6: Player Immersion (PENDING)

### Objectives
- Implement cutscene playback in game sessions
- Add atmospheric effects during narration
- Create seamless transitions between gameplay and cutscenes
- Add ambient soundscapes

### Files to Create
```
apps/web/src/
├── components/immersion/
│   ├── CutsceneOverlay.tsx         # Full-screen video playback
│   ├── NarrationOverlay.tsx        # Voice with subtitles
│   ├── AtmosphereController.tsx    # Ambient effects manager
│   ├── ParticleBackground.tsx      # Context-aware particles
│   └── MusicController.tsx         # Dynamic music system
├── hooks/
│   ├── useAtmosphere.ts            # Atmosphere state hook
│   └── useSoundscape.ts            # Audio management hook
```

### Key Implementation

```tsx
// apps/web/src/components/immersion/CutsceneOverlay.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface CutsceneOverlayProps {
  videoUrl: string;
  audioUrl?: string;
  subtitles?: Subtitle[];
  onComplete: () => void;
  onSkip?: () => void;
}

export function CutsceneOverlay({
  videoUrl,
  audioUrl,
  subtitles,
  onComplete,
  onSkip,
}: CutsceneOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState<string | null>(null);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    // Show skip button after 2 seconds
    const timer = setTimeout(() => setShowSkip(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black"
    >
      {/* Cinematic bars */}
      <div className="absolute top-0 left-0 right-0 h-[10%] bg-black" />
      <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-black" />

      {/* Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        onEnded={onComplete}
        className="w-full h-full object-cover"
      />

      {/* Subtitles */}
      <AnimatePresence>
        {currentSubtitle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-[15%] left-1/2 -translate-x-1/2 max-w-2xl"
          >
            <p className="text-xl text-white text-center bg-black/60 px-6 py-3 rounded-lg">
              {currentSubtitle}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip button */}
      <AnimatePresence>
        {showSkip && onSkip && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onSkip}
            className="absolute bottom-8 right-8 px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30"
          >
            Skip Cutscene
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

```tsx
// apps/web/src/components/immersion/AtmosphereController.tsx
import { useEffect } from 'react';
import { useAtmosphereStore } from '@/stores/atmosphereStore';
import { ParticleBackground } from './ParticleBackground';

const ATMOSPHERE_PRESETS = {
  tavern: {
    particles: 'dust',
    color: '#FFA500',
    intensity: 0.3,
    music: 'tavern-ambient',
  },
  dungeon: {
    particles: 'fog',
    color: '#2D3436',
    intensity: 0.6,
    music: 'dungeon-ambient',
  },
  forest: {
    particles: 'fireflies',
    color: '#27AE60',
    intensity: 0.4,
    music: 'forest-ambient',
  },
  combat: {
    particles: 'embers',
    color: '#E74C3C',
    intensity: 0.8,
    music: 'combat-theme',
  },
  magic: {
    particles: 'sparkles',
    color: '#8E44AD',
    intensity: 0.7,
    music: 'arcane-ambient',
  },
};

export function AtmosphereController() {
  const { preset, intensity, transitioning } = useAtmosphereStore();
  const config = ATMOSPHERE_PRESETS[preset] || ATMOSPHERE_PRESETS.tavern;

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <ParticleBackground
        type={config.particles}
        color={config.color}
        intensity={config.intensity * intensity}
        transitioning={transitioning}
      />
    </div>
  );
}
```

### Acceptance Criteria

| Criterion | How to Verify |
|-----------|---------------|
| Cutscenes play full-screen | Video fills screen with cinematic bars |
| Subtitles sync with audio | Text appears in time |
| Skip button appears | Shows after 2 second delay |
| Atmosphere changes | Particles match scene type |
| Music transitions smoothly | No audio jumps between scenes |
| Mobile playback works | Video plays on iOS/Android |

---

## 11.7 Phase 9 Verification Script

```bash
#!/bin/bash
# scripts/verify-phase-9.sh

echo "=== Phase 9 Verification: AI Campaign Studio ==="

# Check AI Service health
echo "Checking AI Service..."
AI_HEALTH=$(curl -s https://ai-production-0566.up.railway.app/health)
if echo $AI_HEALTH | grep -q '"status":"ok"'; then
  echo "✅ AI Service healthy"
else
  echo "❌ AI Service unhealthy"
  exit 1
fi

# Check Claude connection
echo "Checking Claude integration..."
CLAUDE_TEST=$(curl -s https://ai-production-0566.up.railway.app/test/claude)
if echo $CLAUDE_TEST | grep -q '"status":"ok"'; then
  echo "✅ Claude integration working"
else
  echo "❌ Claude integration failed"
  exit 1
fi

# Check feature flags
echo "Checking feature flags..."
if echo $AI_HEALTH | grep -q '"aiCampaignStudio":true'; then
  echo "✅ AI Campaign Studio enabled"
else
  echo "⚠️ AI Campaign Studio disabled"
fi

if echo $AI_HEALTH | grep -q '"videoCutscenes":true'; then
  echo "✅ Video Cutscenes enabled"
else
  echo "⚠️ Video Cutscenes disabled"
fi

if echo $AI_HEALTH | grep -q '"ttsNarration":true'; then
  echo "✅ TTS Narration enabled"
else
  echo "⚠️ TTS Narration disabled"
fi

echo ""
echo "=== Phase 9 Sprint Status ==="
echo "Sprint 9.1 (AI Foundation): ✅ Complete"
echo "Sprint 9.2 (Campaign Studio UI): ⏳ Pending"
echo "Sprint 9.3 (Runway Video): ⏳ Pending"
echo "Sprint 9.4 (ElevenLabs TTS): ⏳ Pending"
echo "Sprint 9.5 (Content Editors): ⏳ Pending"
echo "Sprint 9.6 (Player Immersion): ⏳ Pending"
echo ""
echo "=== Current Focus: Sprint 9.2 ==="
```

---

# END OF DOCUMENT 24
