#!/bin/bash

echo "=== Phase 0 Verification ==="
echo ""

# Track failures
FAILURES=0

# Check Node version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v 2>/dev/null)
if [[ $NODE_VERSION == v20* ]] || [[ $NODE_VERSION == v21* ]] || [[ $NODE_VERSION == v22* ]]; then
  echo "✅ Node.js version OK: $NODE_VERSION"
else
  echo "❌ Node.js v20+ required (found: $NODE_VERSION)"
  FAILURES=$((FAILURES + 1))
fi

# Check pnpm
echo ""
echo "Checking pnpm..."
PNPM_VERSION=$(pnpm -v 2>/dev/null)
if [ -n "$PNPM_VERSION" ]; then
  echo "✅ pnpm OK: v$PNPM_VERSION"
else
  echo "❌ pnpm not installed"
  FAILURES=$((FAILURES + 1))
fi

# Check Docker
echo ""
echo "Checking Docker..."
DOCKER_VERSION=$(docker -v 2>/dev/null)
if [ -n "$DOCKER_VERSION" ]; then
  echo "✅ Docker OK"
else
  echo "⚠️  Docker not found (optional for local dev)"
fi

# Check Docker services (optional)
echo ""
echo "Checking Docker services..."
if docker ps 2>/dev/null | grep -q "dnd-postgres"; then
  echo "✅ PostgreSQL container running"
else
  echo "⚠️  PostgreSQL not running (run: docker-compose up -d)"
fi

if docker ps 2>/dev/null | grep -q "dnd-redis"; then
  echo "✅ Redis container running"
else
  echo "⚠️  Redis not running (run: docker-compose up -d)"
fi

# Check project structure
echo ""
echo "Checking project structure..."

REQUIRED_DIRS=(
  "apps/web/src"
  "services/api-gateway/src"
  "services/game-state/src"
  "services/ws-gateway/src"
  "services/rules-engine/src"
  "services/grid-solver/src"
  "packages/shared/src"
  "packages/ui/src"
  "prisma"
)

for dir in "${REQUIRED_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "✅ $dir"
  else
    echo "❌ Missing: $dir"
    FAILURES=$((FAILURES + 1))
  fi
done

# Check config files
echo ""
echo "Checking configuration files..."

REQUIRED_FILES=(
  "package.json"
  "pnpm-workspace.yaml"
  "turbo.json"
  "tsconfig.base.json"
  ".env.example"
  "docker-compose.yml"
  ".prettierrc"
  ".eslintrc.js"
  ".gitignore"
  "prisma/schema.prisma"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ Missing: $file"
    FAILURES=$((FAILURES + 1))
  fi
done

# Check if dependencies can be installed
echo ""
echo "Checking dependencies..."
if [ -d "node_modules" ]; then
  echo "✅ node_modules exists"
else
  echo "⚠️  node_modules not found (run: pnpm install)"
fi

# Summary
echo ""
echo "================================"
if [ $FAILURES -eq 0 ]; then
  echo "=== Phase 0 Complete ✅ ==="
  echo "================================"
  echo ""
  echo "Next steps:"
  echo "1. Copy .env.example to .env"
  echo "2. Run: docker-compose up -d"
  echo "3. Run: pnpm install"
  echo "4. Run: pnpm db:generate"
  echo "5. Run: pnpm db:migrate:dev"
  echo "6. Run: pnpm dev"
  echo ""
  echo "Ready to proceed to Phase 1: Authentication"
  exit 0
else
  echo "=== Phase 0 INCOMPLETE ❌ ==="
  echo "================================"
  echo "Found $FAILURES issues. Please fix before proceeding."
  exit 1
fi
