#!/bin/bash

# Phase 3 Verification Script: Game Board Core
# Tests PixiJS implementation, game modules, and build

echo "=== Phase 3 Verification: Game Board Core ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Test 1: Check Node.js version
echo "1. Checking Node.js version..."
NODE_VERSION=$(node -v 2>/dev/null)
if [ $? -eq 0 ]; then
  echo -e "   ${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
else
  echo -e "   ${RED}❌ Node.js not installed${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Test 2: Check pnpm
echo ""
echo "2. Checking pnpm..."
PNPM_VERSION=$(pnpm -v 2>/dev/null)
if [ $? -eq 0 ]; then
  echo -e "   ${GREEN}✅ pnpm installed: $PNPM_VERSION${NC}"
else
  echo -e "   ${RED}❌ pnpm not installed${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Test 3: Check PixiJS dependency
echo ""
echo "3. Checking PixiJS dependency..."
if grep -q "pixi.js" "apps/web/package.json" 2>/dev/null; then
  PIXI_VERSION=$(grep '"pixi.js"' apps/web/package.json | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
  echo -e "   ${GREEN}✅ PixiJS installed: v$PIXI_VERSION${NC}"
else
  echo -e "   ${RED}❌ PixiJS not found in package.json${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Test 4: Check game module files exist
echo ""
echo "4. Checking game module files..."
GAME_FILES=(
  "apps/web/src/game/GameApplication.ts"
  "apps/web/src/game/BoardRenderer.ts"
  "apps/web/src/game/TokenManager.ts"
  "apps/web/src/game/FogOfWarRenderer.ts"
  "apps/web/src/game/AoEOverlayRenderer.ts"
  "apps/web/src/game/CameraController.ts"
  "apps/web/src/game/InputHandler.ts"
  "apps/web/src/game/types.ts"
  "apps/web/src/game/index.ts"
)

MISSING_FILES=0
for FILE in "${GAME_FILES[@]}"; do
  if [ -f "$FILE" ]; then
    echo -e "   ${GREEN}✓${NC} $FILE"
  else
    echo -e "   ${RED}✗${NC} $FILE (MISSING)"
    MISSING_FILES=$((MISSING_FILES + 1))
  fi
done

if [ $MISSING_FILES -eq 0 ]; then
  echo -e "   ${GREEN}✅ All 9 game module files present${NC}"
else
  echo -e "   ${RED}❌ $MISSING_FILES game module files missing${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Test 5: Check test page exists
echo ""
echo "5. Checking game test page..."
if [ -f "apps/web/src/app/game/test/page.tsx" ] && [ -f "apps/web/src/app/game/test/GameBoardTest.tsx" ]; then
  echo -e "   ${GREEN}✅ Test page exists at /game/test${NC}"
else
  echo -e "   ${RED}❌ Test page missing${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Test 6: Check shared game types
echo ""
echo "6. Checking shared game types..."
if [ -f "packages/shared/src/types/game.ts" ]; then
  echo -e "   ${GREEN}✅ Shared game types exist${NC}"
else
  echo -e "   ${YELLOW}⚠️  Shared game types not found (non-critical)${NC}"
fi

# Test 7: TypeScript compilation
echo ""
echo "7. Running TypeScript check..."
pnpm --filter @dnd/web typecheck > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "   ${GREEN}✅ TypeScript compilation successful${NC}"
else
  echo -e "   ${RED}❌ TypeScript compilation failed${NC}"
  echo "   Run 'pnpm --filter @dnd/web typecheck' to see errors"
  ERRORS=$((ERRORS + 1))
fi

# Test 8: Build check
echo ""
echo "8. Running build check..."
pnpm --filter @dnd/web build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "   ${GREEN}✅ Build successful${NC}"
else
  echo -e "   ${RED}❌ Build failed${NC}"
  echo "   Run 'pnpm --filter @dnd/web build' to see errors"
  ERRORS=$((ERRORS + 1))
fi

# Test 9: Count lines of code in game module
echo ""
echo "9. Game module statistics..."
TOTAL_LINES=0
for FILE in "${GAME_FILES[@]}"; do
  if [ -f "$FILE" ]; then
    LINES=$(wc -l < "$FILE")
    TOTAL_LINES=$((TOTAL_LINES + LINES))
  fi
done
echo "   Total lines of code: $TOTAL_LINES"
echo "   Files: ${#GAME_FILES[@]}"

# Test 10: Check for key exports
echo ""
echo "10. Checking module exports..."
if grep -q "GameApplication" "apps/web/src/game/index.ts" && \
   grep -q "BoardRenderer" "apps/web/src/game/index.ts" && \
   grep -q "TokenManager" "apps/web/src/game/index.ts"; then
  echo -e "   ${GREEN}✅ All core classes exported${NC}"
else
  echo -e "   ${YELLOW}⚠️  Some exports may be missing${NC}"
fi

# Summary
echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}=== Phase 3 Verification PASSED ✅ ===${NC}"
  echo "================================"
  echo ""
  echo "All game board core checks passed!"
  echo ""
  echo "Features implemented:"
  echo "  - PixiJS 8 WebGL/Canvas rendering"
  echo "  - 8 terrain types (normal, difficult, water, lava, pit, wall, door, stairs)"
  echo "  - Token management with health bars"
  echo "  - Fog of war with 3 visibility states"
  echo "  - Area of effect overlays (sphere, cube, cone, line, cylinder)"
  echo "  - Camera pan/zoom with smooth interpolation"
  echo "  - Mouse, touch, and keyboard input handling"
  echo ""
  echo "Manual testing:"
  echo "  1. Start dev server: pnpm dev"
  echo "  2. Navigate to: http://localhost:3000/game/test"
  echo "  3. Test camera pan (drag), zoom (scroll), tile selection (click)"
  echo "  4. Toggle fog of war and AoE preview buttons"
  echo ""
  echo "Ready to proceed to Phase 4: Rules Engine"
else
  echo -e "${RED}=== Phase 3 Verification FAILED ❌ ===${NC}"
  echo "================================"
  echo ""
  echo "Errors found: $ERRORS"
  echo "Please fix the issues above before proceeding."
fi

exit $ERRORS
