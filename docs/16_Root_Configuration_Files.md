# D&D Digital Board Game Platform
# Document 16: Root Configuration Files

---

# 1. Overview

This document contains all root-level configuration files needed to bootstrap the monorepo.

---

# 2. Root package.json

```json
{
  "name": "dnd-platform",
  "version": "0.1.0",
  "private": true,
  "description": "D&D Digital Board Game Platform - RAW 5e Tactical Combat",
  "author": "Your Team <team@example.com>",
  "license": "UNLICENSED",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:unit": "turbo run test:unit",
    "test:golden": "turbo run test:golden",
    "test:integration": "turbo run test:integration",
    "test:e2e": "turbo run test:e2e",
    "test:watch": "turbo run test:watch",
    "test:coverage": "turbo run test:coverage",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean && rm -rf node_modules",
    "db:generate": "pnpm --filter @dnd/api-gateway db:generate",
    "db:migrate": "pnpm --filter @dnd/api-gateway db:migrate",
    "db:migrate:dev": "pnpm --filter @dnd/api-gateway db:migrate:dev",
    "db:reset": "pnpm --filter @dnd/api-gateway db:reset",
    "db:studio": "pnpm --filter @dnd/api-gateway db:studio",
    "db:seed": "pnpm --filter @dnd/api-gateway db:seed",
    "content:seed": "pnpm --filter @dnd/api-gateway content:seed",
    "proto:generate": "pnpm --filter @dnd/shared proto:generate && pnpm --filter @dnd/api-gateway proto:generate",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    "prepare": "husky install"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.2.0",
    "prettier": "^3.2.0",
    "turbo": "^1.12.0",
    "typescript": "^5.3.0"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

---

# 3. pnpm-workspace.yaml

```yaml
packages:
  # Applications
  - "apps/*"
  
  # Shared packages
  - "packages/*"
  
  # Backend services
  - "services/*"
  
  # Exclude Rust services from pnpm (they use Cargo)
  - "!services/rules-engine"
  - "!services/grid-solver"
  - "!services/ai-service"
```

---

# 4. turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    ".env",
    ".env.local"
  ],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"],
      "env": ["NODE_ENV"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "env": ["NODE_ENV", "DATABASE_URL"]
    },
    "test:unit": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "test:golden": {
      "dependsOn": ["build"],
      "outputs": [],
      "env": ["RULES_ENGINE_URL", "GRID_SOLVER_URL"]
    },
    "test:integration": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "env": ["DATABASE_URL", "REDIS_URL"]
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "outputs": [],
      "env": ["BASE_URL"]
    },
    "test:watch": {
      "cache": false,
      "persistent": true
    },
    "test:coverage": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "lint:fix": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "proto:generate": {
      "outputs": ["src/generated/**"]
    }
  }
}
```

---

# 5. .env.example

```bash
# ===========================================
# D&D Platform Environment Configuration
# ===========================================
# Copy this file to .env and fill in values

# -----------------------------
# Database
# -----------------------------
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dnd_dev"
DATABASE_LOG_QUERIES=false

# -----------------------------
# Redis
# -----------------------------
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=

# -----------------------------
# JWT / Auth
# -----------------------------
# Generate with: openssl rand -base64 32
JWT_SECRET="your-super-secret-key-at-least-32-characters-long"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# -----------------------------
# Service URLs (Development)
# -----------------------------
# API Gateway (public)
API_GATEWAY_URL="http://localhost:4000"
API_GATEWAY_PORT=4000

# Game State Server (internal)
GAME_STATE_URL="http://localhost:4001"
GAME_STATE_PORT=4001

# WebSocket Gateway
WS_GATEWAY_URL="ws://localhost:4002"
WS_GATEWAY_PORT=4002

# Rust Services (gRPC)
RULES_ENGINE_URL="localhost:50051"
GRID_SOLVER_URL="localhost:50052"
AI_SERVICE_URL="localhost:50053"

# -----------------------------
# Web Client
# -----------------------------
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_WS_URL="ws://localhost:4002"

# -----------------------------
# Object Storage (MinIO/S3)
# -----------------------------
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET_ASSETS="dnd-assets"
S3_BUCKET_MEDIA="dnd-media"

# -----------------------------
# Logging
# -----------------------------
LOG_LEVEL="debug"
LOG_FORMAT="pretty"

# -----------------------------
# Environment
# -----------------------------
NODE_ENV="development"

# -----------------------------
# Feature Flags
# -----------------------------
FEATURE_AI_GENERATION=true
FEATURE_VOICE_CHAT=false
FEATURE_CAMPAIGN_MARKETPLACE=false
```

---

# 6. docker-compose.yml

```yaml
version: "3.8"

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: dnd-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: dnd_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache & Pub/Sub
  redis:
    image: redis:7-alpine
    container_name: dnd-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MinIO Object Storage (S3-compatible)
  minio:
    image: minio/minio:latest
    container_name: dnd-minio
    restart: unless-stopped
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # MinIO Bucket Setup
  minio-setup:
    image: minio/mc:latest
    container_name: dnd-minio-setup
    depends_on:
      minio:
        condition: service_healthy
    entrypoint: >
      /bin/sh -c "
      mc alias set myminio http://minio:9000 minioadmin minioadmin;
      mc mb --ignore-existing myminio/dnd-assets;
      mc mb --ignore-existing myminio/dnd-media;
      mc anonymous set download myminio/dnd-assets;
      exit 0;
      "

volumes:
  postgres_data:
  redis_data:
  minio_data:

networks:
  default:
    name: dnd-network
```

---

# 7. docker-compose.prod.yml

```yaml
version: "3.8"

services:
  # API Gateway
  api-gateway:
    build:
      context: .
      dockerfile: services/api-gateway/Dockerfile
    container_name: dnd-api-gateway
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "4000:4000"
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Game State Server
  game-state:
    build:
      context: .
      dockerfile: services/game-state/Dockerfile
    container_name: dnd-game-state
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - REDIS_URL=${REDIS_URL}
      - RULES_ENGINE_URL=rules-engine:50051
      - GRID_SOLVER_URL=grid-solver:50052
    ports:
      - "4001:4001"
    depends_on:
      - redis
      - rules-engine
      - grid-solver

  # WebSocket Gateway
  ws-gateway:
    build:
      context: .
      dockerfile: services/ws-gateway/Dockerfile
    container_name: dnd-ws-gateway
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - REDIS_URL=${REDIS_URL}
    ports:
      - "4002:4002"
    depends_on:
      - redis
      - game-state

  # Rules Engine (Rust)
  rules-engine:
    build:
      context: .
      dockerfile: services/rules-engine/Dockerfile
    container_name: dnd-rules-engine
    restart: unless-stopped
    ports:
      - "50051:50051"
    healthcheck:
      test: ["CMD", "/usr/local/bin/grpc_health_probe", "-addr=:50051"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Grid Solver (Rust)
  grid-solver:
    build:
      context: .
      dockerfile: services/grid-solver/Dockerfile
    container_name: dnd-grid-solver
    restart: unless-stopped
    ports:
      - "50052:50052"
    healthcheck:
      test: ["CMD", "/usr/local/bin/grpc_health_probe", "-addr=:50052"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Web Client
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: dnd-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      - api-gateway
      - ws-gateway

  # PostgreSQL
  postgres:
    image: postgres:16-alpine
    container_name: dnd-postgres-prod
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    container_name: dnd-redis-prod
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_prod_data:/data

volumes:
  postgres_prod_data:
  redis_prod_data:
```

---

# 8. .prettierrc

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "overrides": [
    {
      "files": "*.json",
      "options": {
        "printWidth": 200
      }
    }
  ]
}
```

---

# 9. .eslintrc.js (Root)

```javascript
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    '.next',
    'coverage',
    '*.generated.ts',
  ],
};
```

---

# 10. tsconfig.base.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "resolveJsonModule": true,
    "allowJs": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "isolatedModules": true
  },
  "exclude": [
    "node_modules",
    "dist",
    "build",
    "coverage",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

---

# 11. .gitignore

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/
out/
*.tsbuildinfo

# Rust
target/
Cargo.lock

# Environment
.env
.env.local
.env.*.local
!.env.example

# Logs
logs/
*.log
npm-debug.log*
pnpm-debug.log*

# IDE
.idea/
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
!.vscode/launch.json
*.swp
*.swo
*~

# Testing
coverage/
.nyc_output/
playwright-report/
test-results/

# OS
.DS_Store
Thumbs.db

# Generated
*.generated.ts
*.generated.js
src/generated/

# Prisma
prisma/migrations/*.sql.bak

# Turbo
.turbo/

# Docker
docker-compose.override.yml

# Misc
*.pem
*.key
*.crt
```

---

# 12. scripts/init-db.sql

```sql
-- Initialize PostgreSQL extensions and schemas
-- This runs on first database creation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- Create schemas for organization
CREATE SCHEMA IF NOT EXISTS content;    -- Static 5e content
CREATE SCHEMA IF NOT EXISTS analytics;  -- Event tracking

-- Grant permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA content TO postgres;
GRANT ALL ON SCHEMA analytics TO postgres;

-- Create read-only user for analytics (optional)
-- CREATE USER analytics_reader WITH PASSWORD 'analytics_password';
-- GRANT USAGE ON SCHEMA analytics TO analytics_reader;
-- GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO analytics_reader;

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'Database initialized successfully';
END $$;
```

---

# 13. Rust Workspace Cargo.toml

```toml
# /services/Cargo.toml (Rust workspace root)

[workspace]
resolver = "2"
members = [
    "rules-engine",
    "grid-solver",
    "ai-service",
    "shared-rust",
]

[workspace.package]
version = "0.1.0"
edition = "2021"
authors = ["DnD Platform Team"]
license = "UNLICENSED"

[workspace.dependencies]
# Async runtime
tokio = { version = "1.35", features = ["full"] }

# gRPC
tonic = "0.10"
prost = "0.12"
tonic-build = "0.10"

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Logging
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }

# Error handling
anyhow = "1.0"
thiserror = "1.0"

# Utilities
uuid = { version = "1.6", features = ["v4", "serde"] }
rand = "0.8"
chrono = { version = "0.4", features = ["serde"] }

# Testing
proptest = "1.4"
criterion = "0.5"
```

---

# END OF DOCUMENT 16
