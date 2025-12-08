# D&D Digital Board Game Platform
# Document 13: Environment Setup & Getting Started Guide

---

# 1. Prerequisites

## 1.1 Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20.x LTS | JavaScript runtime |
| pnpm | 8.x | Package manager |
| Rust | 1.75+ | Rules Engine, Grid Solver |
| Docker | 24.x | Local services |
| Docker Compose | 2.x | Service orchestration |
| Git | 2.x | Version control |

## 1.2 Optional Tools

| Tool | Purpose |
|------|---------|
| Rust Analyzer | Rust IDE support |
| Prisma Studio | Database GUI |
| Redis Insight | Redis GUI |
| Postman/Insomnia | API testing |
| Playwright | E2E testing |

---

# 2. Initial Setup

## 2.1 Clone Repository

```bash
git clone https://github.com/your-org/dnd-platform.git
cd dnd-platform
```

## 2.2 Install Dependencies

```bash
# Install pnpm if not installed
npm install -g pnpm

# Install all workspace dependencies
pnpm install

# Install Rust toolchain (if not installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

## 2.3 Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your local settings
# Most defaults work for local development
```

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dnd_dev"
REDIS_URL="redis://localhost:6379"

# JWT (generate secure keys for production)
JWT_SECRET="your-development-secret-key-at-least-32-chars"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Service URLs (local development)
RULES_ENGINE_URL="localhost:50051"
GRID_SOLVER_URL="localhost:50052"
AI_SERVICE_URL="localhost:50053"

# Logging
LOG_LEVEL="debug"
```

## 2.4 Start Infrastructure

```bash
# Start PostgreSQL, Redis, MinIO
docker-compose up -d

# Verify services are running
docker-compose ps
```

## 2.5 Initialize Database

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed initial content (spells, monsters, items)
pnpm content:seed
```

---

# 3. Project Structure Overview

```
dnd-platform/
├── apps/
│   ├── web/              # Next.js web client
│   ├── mobile/           # React Native app
│   └── dm-tools/         # DM creation tools
├── packages/
│   ├── shared/           # Shared types & utilities
│   ├── ui/               # Shared UI components
│   └── api-client/       # Generated API client
├── services/
│   ├── api-gateway/      # Node.js API Gateway
│   ├── game-state/       # Game State Server
│   ├── rules-engine/     # Rust Rules Engine
│   └── grid-solver/      # Rust Grid Solver
├── proto/                # gRPC Protocol Buffers
├── content/              # 5e content data (JSON)
├── infra/                # Kubernetes & Terraform
└── tests/                # Golden tests & E2E
```

---

# 4. Development Workflow

## 4.1 Start All Services (Development Mode)

```bash
# Terminal 1: Start infrastructure
docker-compose up -d

# Terminal 2: Start all services in dev mode
pnpm dev
```

This starts:
- Web client at http://localhost:3000
- API Gateway at http://localhost:4000
- Game State server at http://localhost:4001
- WebSocket Gateway at ws://localhost:4002

## 4.2 Start Individual Services

```bash
# Web client only
pnpm --filter @dnd/web dev

# API Gateway only
pnpm --filter @dnd/api-gateway dev

# Rules Engine (Rust)
cd services/rules-engine
cargo run

# Grid Solver (Rust)
cd services/grid-solver
cargo run
```

## 4.3 Running Tests

```bash
# All tests
pnpm test

# Unit tests only
pnpm test:unit

# Golden scene tests
pnpm test:golden

# Integration tests (requires Docker)
pnpm test:integration

# E2E tests
pnpm test:e2e

# Watch mode
pnpm test:watch
```

## 4.4 Code Quality

```bash
# Lint all code
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Type check
pnpm typecheck

# Format code
pnpm format
```

---

# 5. Building for Production

## 5.1 Build All Packages

```bash
# Build everything
pnpm build

# Build specific package
pnpm --filter @dnd/web build
pnpm --filter @dnd/api-gateway build
```

## 5.2 Build Docker Images

```bash
# Build all images
docker-compose -f docker-compose.prod.yml build

# Build specific service
docker build -t dnd-api-gateway:latest -f services/api-gateway/Dockerfile .
docker build -t dnd-rules-engine:latest -f services/rules-engine/Dockerfile .
```

## 5.3 Build Rust Services

```bash
# Release build
cd services/rules-engine
cargo build --release

cd services/grid-solver
cargo build --release
```

---

# 6. Database Management

## 6.1 Prisma Commands

```bash
# Generate client after schema changes
pnpm db:generate

# Create migration
pnpm db:migrate:dev --name your_migration_name

# Apply migrations
pnpm db:migrate

# Reset database (DESTRUCTIVE)
pnpm db:reset

# Open Prisma Studio
pnpm db:studio
```

## 6.2 Content Seeding

```bash
# Seed all 5e content
pnpm content:seed

# Seed specific content
pnpm content:seed --spells
pnpm content:seed --monsters
pnpm content:seed --items
```

---

# 7. Protocol Buffers

## 7.1 Generate Proto Files

```bash
# Generate all protos
pnpm proto:generate

# This generates:
# - TypeScript types for Node.js services
# - Rust types for Rust services
```

## 7.2 Proto File Locations

```
proto/
├── rules/v1/
│   ├── rules.proto       # Rules Engine service
│   ├── dice.proto        # Dice rolling
│   ├── combat.proto      # Combat resolution
│   └── spells.proto      # Spellcasting
├── grid/v1/
│   ├── grid.proto        # Grid Solver service
│   ├── los.proto         # Line of sight
│   └── pathfinding.proto # A* pathfinding
└── buf.yaml              # Buf configuration
```

---

# 8. Common Development Tasks

## 8.1 Adding a New API Endpoint

1. Define types in `packages/shared/src/types/`
2. Add route in `services/api-gateway/src/routes/`
3. Implement service logic in `services/api-gateway/src/services/`
4. Add validation schema with Zod
5. Update API client in `packages/api-client/`
6. Add tests

## 8.2 Adding a New Rules Engine RPC

1. Define proto in `proto/rules/v1/`
2. Run `pnpm proto:generate`
3. Implement in Rust: `services/rules-engine/src/`
4. Add gRPC client call in API Gateway
5. Add golden tests

## 8.3 Adding a New UI Component

1. Create component in `apps/web/src/components/`
2. Add to shared UI if reusable: `packages/ui/`
3. Write Storybook story
4. Add unit tests

## 8.4 Adding New Content Data

1. Add JSON file in `content/` directory
2. Update seed script: `scripts/seed-content.ts`
3. Run `pnpm content:seed`

---

# 9. Debugging

## 9.1 Logging

```typescript
// Use Pino for structured logging
import { logger } from '@/lib/logger';

logger.info({ userId, action: 'login' }, 'User logged in');
logger.error({ err, requestId }, 'Request failed');
```

## 9.2 Debug Mode

```bash
# Enable verbose logging
LOG_LEVEL=debug pnpm dev

# Node.js inspector
NODE_OPTIONS='--inspect' pnpm --filter @dnd/api-gateway dev
```

## 9.3 Database Queries

```bash
# Enable Prisma query logging
DATABASE_LOG_QUERIES=true pnpm dev

# Open Prisma Studio for GUI
pnpm db:studio
```

## 9.4 Redis Debugging

```bash
# Connect to Redis CLI
docker exec -it dnd-redis redis-cli

# Monitor all commands
MONITOR

# Check keys
KEYS *
```

---

# 10. Troubleshooting

## 10.1 Common Issues

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Prisma Client Outdated

```bash
# Regenerate client
pnpm db:generate
```

### Node Modules Issues

```bash
# Clean and reinstall
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
rm -rf services/*/node_modules
pnpm install
```

### Rust Build Issues

```bash
# Clean and rebuild
cd services/rules-engine
cargo clean
cargo build
```

---

# 11. VS Code Configuration

## 11.1 Recommended Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "rust-lang.rust-analyzer",
    "bradlc.vscode-tailwindcss",
    "zxh404.vscode-proto3"
  ]
}
```

## 11.2 Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[rust]": {
    "editor.defaultFormatter": "rust-lang.rust-analyzer"
  },
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## 11.3 Launch Configurations

```json
// .vscode/launch.json
{
  "configurations": [
    {
      "name": "Debug API Gateway",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "args": ["--filter", "@dnd/api-gateway", "dev"],
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Web",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Debug Rules Engine",
      "type": "lldb",
      "request": "launch",
      "program": "${workspaceFolder}/services/rules-engine/target/debug/rules-engine"
    }
  ]
}
```

---

# 12. Quick Reference Commands

| Task | Command |
|------|---------|
| Start dev environment | `pnpm dev` |
| Run all tests | `pnpm test` |
| Run golden tests | `pnpm test:golden` |
| Build everything | `pnpm build` |
| Lint code | `pnpm lint` |
| Format code | `pnpm format` |
| Generate Prisma client | `pnpm db:generate` |
| Run migrations | `pnpm db:migrate` |
| Seed content | `pnpm content:seed` |
| Generate protos | `pnpm proto:generate` |
| Start Docker services | `docker-compose up -d` |
| Stop Docker services | `docker-compose down` |
| View logs | `docker-compose logs -f` |

---

# END OF ENVIRONMENT SETUP GUIDE
