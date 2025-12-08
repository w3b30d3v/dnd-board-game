# D&D Digital Board Game Platform
# Document 28: E2E Test Scenarios (Playwright)

---

# 1. Overview

This document contains complete Playwright E2E test scenarios for verifying all user journeys. Tests are organized by user role (Player, DM) and feature area.

---

# 2. Test Configuration

```typescript
// playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

# 3. Test Fixtures & Helpers

```typescript
// tests/e2e/fixtures/index.ts

import { test as base, expect, Page } from '@playwright/test';

// Test user data
export const TEST_USERS = {
  player: {
    email: 'test-player@example.com',
    password: 'TestPlayer123!',
    username: 'TestPlayer',
  },
  dm: {
    email: 'test-dm@example.com',
    password: 'TestDM123!',
    username: 'TestDM',
  },
  newUser: {
    email: `new-user-${Date.now()}@example.com`,
    password: 'NewUser123!',
    username: `NewUser${Date.now()}`,
  },
};

// Extended test with authentication helpers
export const test = base.extend<{
  authenticatedPage: Page;
  dmPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    await loginAs(page, TEST_USERS.player);
    await use(page);
  },
  dmPage: async ({ page }, use) => {
    await loginAs(page, TEST_USERS.dm);
    await use(page);
  },
});

// Helper functions
export async function loginAs(page: Page, user: typeof TEST_USERS.player) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', user.email);
  await page.fill('[data-testid="password-input"]', user.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/dashboard');
}

export async function createTestCharacter(page: Page) {
  await page.goto('/characters/new');
  
  // Race selection
  await page.click('[data-testid="race-human"]');
  await page.click('[data-testid="next-button"]');
  
  // Class selection
  await page.click('[data-testid="class-fighter"]');
  await page.click('[data-testid="next-button"]');
  
  // Background
  await page.click('[data-testid="background-soldier"]');
  await page.click('[data-testid="next-button"]');
  
  // Abilities - use standard array
  await page.click('[data-testid="method-standard-array"]');
  await page.click('[data-testid="assign-str-15"]');
  await page.click('[data-testid="assign-con-14"]');
  await page.click('[data-testid="assign-dex-13"]');
  await page.click('[data-testid="next-button"]');
  
  // Name
  await page.fill('[data-testid="character-name"]', `Test Fighter ${Date.now()}`);
  await page.click('[data-testid="create-button"]');
  
  await page.waitForURL(/\/characters\/.+/);
}

export async function waitForGameLoad(page: Page) {
  await page.waitForSelector('[data-testid="game-canvas"]', { state: 'visible' });
  await page.waitForFunction(() => {
    const canvas = document.querySelector('[data-testid="game-canvas"]');
    return canvas && (canvas as HTMLCanvasElement).getContext('2d');
  });
  // Wait for initial render
  await page.waitForTimeout(1000);
}

export { expect };
```

---

# 4. Authentication Tests

```typescript
// tests/e2e/auth/registration.spec.ts

import { test, expect, TEST_USERS } from '../fixtures';

test.describe('User Registration', () => {
  test('should register a new user successfully', async ({ page }) => {
    const newUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      username: `TestUser${Date.now()}`,
      displayName: 'Test User',
    };

    await page.goto('/register');
    
    // Fill registration form
    await page.fill('[data-testid="email-input"]', newUser.email);
    await page.fill('[data-testid="username-input"]', newUser.username);
    await page.fill('[data-testid="display-name-input"]', newUser.displayName);
    await page.fill('[data-testid="password-input"]', newUser.password);
    await page.fill('[data-testid="confirm-password-input"]', newUser.password);
    
    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');
    
    // Submit
    await page.click('[data-testid="register-button"]');
    
    // Should redirect to onboarding
    await page.waitForURL('/onboarding');
    expect(page.url()).toContain('/onboarding');
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/register');
    
    // Submit empty form
    await page.click('[data-testid="register-button"]');
    
    // Check for validation errors
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
  });

  test('should reject duplicate email', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('[data-testid="email-input"]', TEST_USERS.player.email);
    await page.fill('[data-testid="username-input"]', 'UniqueUsername');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!');
    await page.check('[data-testid="terms-checkbox"]');
    
    await page.click('[data-testid="register-button"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Email already registered');
  });
});

// tests/e2e/auth/login.spec.ts

test.describe('User Login', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="email-input"]', TEST_USERS.player.email);
    await page.fill('[data-testid="password-input"]', TEST_USERS.player.password);
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="email-input"]', TEST_USERS.player.email);
    await page.fill('[data-testid="password-input"]', 'WrongPassword');
    await page.click('[data-testid="login-button"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
  });

  test('should redirect authenticated user from login page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/login');
    await authenticatedPage.waitForURL('/dashboard');
  });
});
```

---

# 5. Character Builder Tests

```typescript
// tests/e2e/character/character-builder.spec.ts

import { test, expect, createTestCharacter } from '../fixtures';

test.describe('Character Builder', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/characters');
  });

  test('should complete full character creation flow', async ({ authenticatedPage: page }) => {
    await page.click('[data-testid="create-character-button"]');
    
    // Step 1: Race Selection
    await expect(page.locator('h1')).toContainText('Choose Your Race');
    await page.click('[data-testid="race-elf"]');
    await expect(page.locator('[data-testid="race-info"]')).toContainText('+2 Dexterity');
    await page.click('[data-testid="subrace-high-elf"]');
    await page.click('[data-testid="next-button"]');
    
    // Step 2: Class Selection
    await expect(page.locator('h1')).toContainText('Choose Your Class');
    await page.click('[data-testid="class-wizard"]');
    await expect(page.locator('[data-testid="class-info"]')).toContainText('Spellcasting');
    await page.click('[data-testid="next-button"]');
    
    // Step 3: Background
    await expect(page.locator('h1')).toContainText('Choose Your Background');
    await page.click('[data-testid="background-sage"]');
    await page.click('[data-testid="next-button"]');
    
    // Step 4: Ability Scores
    await expect(page.locator('h1')).toContainText('Ability Scores');
    await page.click('[data-testid="method-point-buy"]');
    
    // Increase Intelligence
    for (let i = 0; i < 7; i++) {
      await page.click('[data-testid="int-increase"]');
    }
    await expect(page.locator('[data-testid="int-score"]')).toContainText('15');
    
    await page.click('[data-testid="next-button"]');
    
    // Step 5: Equipment
    await expect(page.locator('h1')).toContainText('Equipment');
    await page.click('[data-testid="equipment-pack-a"]');
    await page.click('[data-testid="next-button"]');
    
    // Step 6: Spells
    await expect(page.locator('h1')).toContainText('Spells');
    await page.click('[data-testid="cantrip-fire-bolt"]');
    await page.click('[data-testid="cantrip-mage-hand"]');
    await page.click('[data-testid="cantrip-prestidigitation"]');
    await page.click('[data-testid="spell-magic-missile"]');
    await page.click('[data-testid="spell-shield"]');
    await page.click('[data-testid="next-button"]');
    
    // Step 7: Appearance
    await expect(page.locator('h1')).toContainText('Appearance');
    await page.fill('[data-testid="character-name"]', 'Elindra the Wise');
    await page.click('[data-testid="generate-portrait"]');
    await page.waitForSelector('[data-testid="portrait-preview"]', { state: 'visible' });
    await page.click('[data-testid="next-button"]');
    
    // Step 8: Review & Create
    await expect(page.locator('h1')).toContainText('Review');
    await expect(page.locator('[data-testid="review-name"]')).toContainText('Elindra');
    await expect(page.locator('[data-testid="review-race"]')).toContainText('High Elf');
    await expect(page.locator('[data-testid="review-class"]')).toContainText('Wizard');
    
    await page.click('[data-testid="create-character-button"]');
    
    // Should redirect to character sheet
    await page.waitForURL(/\/characters\/.+/);
    await expect(page.locator('[data-testid="character-sheet"]')).toBeVisible();
  });

  test('should validate required fields', async ({ authenticatedPage: page }) => {
    await page.click('[data-testid="create-character-button"]');
    
    // Try to proceed without selecting race
    await page.click('[data-testid="next-button"]');
    
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('Please select a race');
  });

  test('should calculate ability modifiers correctly', async ({ authenticatedPage: page }) => {
    await createTestCharacter(page);
    
    // STR 15 should have +2 modifier
    await expect(page.locator('[data-testid="str-modifier"]')).toContainText('+2');
  });
});
```

---

# 6. Gameplay Tests

```typescript
// tests/e2e/game/combat.spec.ts

import { test, expect, waitForGameLoad } from '../fixtures';

test.describe('Combat System', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Load test combat scenario
    await authenticatedPage.goto('/game/test-combat');
    await waitForGameLoad(authenticatedPage);
  });

  test('should display game board with tokens', async ({ authenticatedPage: page }) => {
    await expect(page.locator('[data-testid="game-canvas"]')).toBeVisible();
    
    // Verify player token is visible
    const playerToken = page.locator('[data-testid="token-player"]');
    await expect(playerToken).toBeVisible();
  });

  test('should highlight valid movement tiles', async ({ authenticatedPage: page }) => {
    // Click player token
    await page.click('[data-testid="token-player"]');
    
    // Movement highlights should appear
    await expect(page.locator('[data-testid="tile-highlighted"]').first()).toBeVisible();
  });

  test('should move character on tile click', async ({ authenticatedPage: page }) => {
    // Select player token
    await page.click('[data-testid="token-player"]');
    
    // Get initial position
    const initialPos = await page.locator('[data-testid="token-player"]').boundingBox();
    
    // Click valid tile
    await page.click('[data-testid="tile-5-5"]');
    
    // Wait for movement animation
    await page.waitForTimeout(500);
    
    // Verify position changed
    const newPos = await page.locator('[data-testid="token-player"]').boundingBox();
    expect(newPos?.x).not.toEqual(initialPos?.x);
  });

  test('should execute attack action', async ({ authenticatedPage: page }) => {
    // Select attack action
    await page.click('[data-testid="action-attack"]');
    
    // Click enemy target
    await page.click('[data-testid="token-enemy-1"]');
    
    // Dice roll animation should play
    await expect(page.locator('[data-testid="dice-roll"]')).toBeVisible();
    
    // Wait for result
    await page.waitForSelector('[data-testid="attack-result"]');
    
    // Combat log should update
    await expect(page.locator('[data-testid="combat-log"]').last()).toContainText(/Attack|Hit|Miss/);
  });

  test('should handle spell casting', async ({ authenticatedPage: page }) => {
    // Open spells panel
    await page.click('[data-testid="action-cast-spell"]');
    
    // Select Magic Missile
    await page.click('[data-testid="spell-magic-missile"]');
    
    // Select target
    await page.click('[data-testid="token-enemy-1"]');
    
    // Spell should auto-hit
    await page.waitForSelector('[data-testid="spell-effect"]');
    
    // Damage should be applied
    await expect(page.locator('[data-testid="damage-number"]')).toBeVisible();
  });

  test('should show initiative order', async ({ authenticatedPage: page }) => {
    const initiativePanel = page.locator('[data-testid="initiative-panel"]');
    await expect(initiativePanel).toBeVisible();
    
    // Should show turn indicator
    await expect(page.locator('[data-testid="current-turn-indicator"]')).toBeVisible();
  });

  test('should end turn correctly', async ({ authenticatedPage: page }) => {
    const currentTurn = await page.locator('[data-testid="current-turn"]').textContent();
    
    await page.click('[data-testid="end-turn-button"]');
    
    // Wait for turn to change
    await page.waitForTimeout(500);
    
    const newTurn = await page.locator('[data-testid="current-turn"]').textContent();
    expect(newTurn).not.toEqual(currentTurn);
  });
});

// tests/e2e/game/movement.spec.ts

test.describe('Movement System', () => {
  test('should respect difficult terrain', async ({ authenticatedPage: page }) => {
    await page.goto('/game/test-terrain');
    await waitForGameLoad(page);
    
    await page.click('[data-testid="token-player"]');
    
    // Difficult terrain tiles should show 2x movement cost
    const difficultTile = page.locator('[data-testid="tile-difficult"]');
    await difficultTile.hover();
    
    await expect(page.locator('[data-testid="movement-cost"]')).toContainText('10 ft');
  });

  test('should block movement through walls', async ({ authenticatedPage: page }) => {
    await page.goto('/game/test-walls');
    await waitForGameLoad(page);
    
    await page.click('[data-testid="token-player"]');
    
    // Tiles behind walls should not be highlighted
    const blockedTile = page.locator('[data-testid="tile-behind-wall"]');
    await expect(blockedTile).not.toHaveClass(/highlighted/);
  });
});
```

---

# 7. Campaign Builder Tests (DM)

```typescript
// tests/e2e/dm/map-editor.spec.ts

import { test, expect } from '../fixtures';

test.describe('Map Editor', () => {
  test.beforeEach(async ({ dmPage }) => {
    await dmPage.goto('/dm/campaigns/new');
    await dmPage.click('[data-testid="add-map-button"]');
  });

  test('should create new map', async ({ dmPage: page }) => {
    await page.fill('[data-testid="map-name"]', 'Test Dungeon');
    await page.fill('[data-testid="map-width"]', '20');
    await page.fill('[data-testid="map-height"]', '20');
    await page.click('[data-testid="create-map-button"]');
    
    // Map editor should open
    await expect(page.locator('[data-testid="map-editor"]')).toBeVisible();
    await expect(page.locator('[data-testid="grid-canvas"]')).toBeVisible();
  });

  test('should paint tiles on canvas', async ({ dmPage: page }) => {
    // Select floor tile
    await page.click('[data-testid="tile-floor-stone"]');
    
    // Paint on canvas
    await page.click('[data-testid="grid-canvas"]', { position: { x: 100, y: 100 } });
    
    // Tile should be placed
    await expect(page.locator('[data-testid="placed-tile"]').first()).toBeVisible();
  });

  test('should add light sources', async ({ dmPage: page }) => {
    await page.click('[data-testid="tool-light"]');
    await page.click('[data-testid="grid-canvas"]', { position: { x: 200, y: 200 } });
    
    // Light indicator should appear
    await expect(page.locator('[data-testid="light-source"]').first()).toBeVisible();
  });

  test('should save map', async ({ dmPage: page }) => {
    await page.fill('[data-testid="map-name"]', 'Test Dungeon');
    await page.click('[data-testid="tile-floor-stone"]');
    await page.click('[data-testid="grid-canvas"]', { position: { x: 100, y: 100 } });
    
    await page.click('[data-testid="save-map-button"]');
    
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
  });
});

// tests/e2e/dm/encounter-editor.spec.ts

test.describe('Encounter Editor', () => {
  test('should create encounter with monsters', async ({ dmPage: page }) => {
    await page.goto('/dm/campaigns/test-campaign/encounters/new');
    
    await page.fill('[data-testid="encounter-name"]', 'Goblin Ambush');
    
    // Add monster
    await page.click('[data-testid="add-monster-button"]');
    await page.fill('[data-testid="monster-search"]', 'goblin');
    await page.click('[data-testid="monster-goblin"]');
    
    // Monster should appear in list
    await expect(page.locator('[data-testid="monster-list-item"]')).toContainText('Goblin');
    
    // Difficulty should update
    await expect(page.locator('[data-testid="difficulty-indicator"]')).toBeVisible();
  });

  test('should calculate encounter difficulty', async ({ dmPage: page }) => {
    await page.goto('/dm/campaigns/test-campaign/encounters/new');
    
    // Set party level
    await page.fill('[data-testid="party-level"]', '3');
    await page.fill('[data-testid="party-size"]', '4');
    
    // Add multiple monsters
    await page.click('[data-testid="add-monster-button"]');
    await page.click('[data-testid="monster-goblin"]');
    await page.click('[data-testid="add-monster-button"]');
    await page.click('[data-testid="monster-goblin"]');
    await page.click('[data-testid="add-monster-button"]');
    await page.click('[data-testid="monster-goblin"]');
    
    // Should show "Easy" difficulty
    await expect(page.locator('[data-testid="difficulty-indicator"]')).toContainText('Easy');
  });
});

// tests/e2e/dm/dialogue-editor.spec.ts

test.describe('Dialogue Editor', () => {
  test('should create dialogue tree', async ({ dmPage: page }) => {
    await page.goto('/dm/campaigns/test-campaign/dialogues/new');
    
    // Add dialogue node
    await page.click('[data-testid="add-node-dialogue"]');
    
    // Edit node
    await page.click('[data-testid="node-1"]');
    await page.fill('[data-testid="speaker-name"]', 'NPC');
    await page.fill('[data-testid="dialogue-text"]', 'Hello, adventurer!');
    
    // Add player choice node
    await page.click('[data-testid="add-node-choice"]');
    
    // Connect nodes
    await page.click('[data-testid="node-1-output"]');
    await page.click('[data-testid="node-2-input"]');
    
    // Connection should appear
    await expect(page.locator('[data-testid="edge-1-2"]')).toBeVisible();
  });
});
```

---

# 8. Multiplayer Tests

```typescript
// tests/e2e/multiplayer/session.spec.ts

import { test, expect, TEST_USERS, loginAs } from '../fixtures';

test.describe('Multiplayer Session', () => {
  test('should create and join game session', async ({ browser }) => {
    // Create two browser contexts for two players
    const dmContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const dmPage = await dmContext.newPage();
    const playerPage = await playerContext.newPage();
    
    try {
      // DM creates session
      await loginAs(dmPage, TEST_USERS.dm);
      await dmPage.goto('/dm/sessions/new');
      await dmPage.fill('[data-testid="session-name"]', 'Test Session');
      await dmPage.click('[data-testid="create-session-button"]');
      
      // Get invite code
      await dmPage.waitForSelector('[data-testid="invite-code"]');
      const inviteCode = await dmPage.locator('[data-testid="invite-code"]').textContent();
      
      // Player joins with code
      await loginAs(playerPage, TEST_USERS.player);
      await playerPage.goto('/join');
      await playerPage.fill('[data-testid="invite-code-input"]', inviteCode!);
      await playerPage.click('[data-testid="join-button"]');
      
      // Both should see lobby
      await expect(dmPage.locator('[data-testid="player-list"]')).toContainText(TEST_USERS.player.username);
      await expect(playerPage.locator('[data-testid="lobby-waiting"]')).toBeVisible();
      
      // DM starts game
      await dmPage.click('[data-testid="start-game-button"]');
      
      // Both should see game board
      await expect(dmPage.locator('[data-testid="game-canvas"]')).toBeVisible();
      await expect(playerPage.locator('[data-testid="game-canvas"]')).toBeVisible();
    } finally {
      await dmContext.close();
      await playerContext.close();
    }
  });

  test('should sync game state between players', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    try {
      // Setup session (simplified)
      await loginAs(page1, TEST_USERS.dm);
      await loginAs(page2, TEST_USERS.player);
      
      // Load same game session
      await page1.goto('/game/test-multiplayer-session');
      await page2.goto('/game/test-multiplayer-session');
      
      // DM moves token
      await page1.click('[data-testid="token-npc-1"]');
      await page1.click('[data-testid="tile-10-10"]');
      
      // Player should see token move
      await page2.waitForTimeout(1000);  // Wait for sync
      
      const tokenPos = await page2.locator('[data-testid="token-npc-1"]').boundingBox();
      expect(tokenPos).toBeTruthy();
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
```

---

# 9. Mobile-Specific Tests

```typescript
// tests/e2e/mobile/touch-controls.spec.ts

import { test, expect, waitForGameLoad } from '../fixtures';

test.describe('Mobile Touch Controls', () => {
  test.use({ viewport: { width: 375, height: 812 } });  // iPhone X

  test('should handle pinch to zoom', async ({ authenticatedPage: page }) => {
    await page.goto('/game/test-combat');
    await waitForGameLoad(page);
    
    // Get initial scale
    const initialTransform = await page.locator('[data-testid="game-container"]').evaluate(
      el => window.getComputedStyle(el).transform
    );
    
    // Simulate pinch gesture
    await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="game-canvas"]');
      if (canvas) {
        const touch1 = new Touch({ identifier: 1, target: canvas, clientX: 100, clientY: 200 });
        const touch2 = new Touch({ identifier: 2, target: canvas, clientX: 200, clientY: 200 });
        
        canvas.dispatchEvent(new TouchEvent('touchstart', { touches: [touch1, touch2] }));
        
        const movedTouch1 = new Touch({ identifier: 1, target: canvas, clientX: 50, clientY: 200 });
        const movedTouch2 = new Touch({ identifier: 2, target: canvas, clientX: 250, clientY: 200 });
        
        canvas.dispatchEvent(new TouchEvent('touchmove', { touches: [movedTouch1, movedTouch2] }));
        canvas.dispatchEvent(new TouchEvent('touchend', { touches: [] }));
      }
    });
    
    await page.waitForTimeout(300);
    
    // Scale should have changed
    const newTransform = await page.locator('[data-testid="game-container"]').evaluate(
      el => window.getComputedStyle(el).transform
    );
    
    expect(newTransform).not.toEqual(initialTransform);
  });

  test('should show mobile action menu on token tap', async ({ authenticatedPage: page }) => {
    await page.goto('/game/test-combat');
    await waitForGameLoad(page);
    
    // Tap player token
    await page.tap('[data-testid="token-player"]');
    
    // Mobile action sheet should appear
    await expect(page.locator('[data-testid="mobile-action-sheet"]')).toBeVisible();
    
    // Should have action buttons
    await expect(page.locator('[data-testid="mobile-action-attack"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-action-move"]')).toBeVisible();
  });

  test('should have minimum touch target size', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    
    // Get all interactive elements
    const buttons = await page.locator('button, a, [role="button"]').all();
    
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        // Minimum 44x44 for accessibility
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
```

---

# 10. Performance Tests

```typescript
// tests/e2e/performance/load-times.spec.ts

import { test, expect } from '../fixtures';

test.describe('Performance', () => {
  test('should load dashboard under 3 seconds', async ({ authenticatedPage: page }) => {
    const start = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('should load game board under 5 seconds', async ({ authenticatedPage: page }) => {
    const start = Date.now();
    await page.goto('/game/test-combat');
    await page.waitForSelector('[data-testid="game-canvas"]');
    const loadTime = Date.now() - start;
    
    expect(loadTime).toBeLessThan(5000);
  });

  test('should maintain 60fps during gameplay', async ({ authenticatedPage: page }) => {
    await page.goto('/game/test-combat');
    await page.waitForSelector('[data-testid="game-canvas"]');
    
    // Measure FPS
    const fps = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frames = 0;
        const start = performance.now();
        
        function countFrame() {
          frames++;
          if (performance.now() - start < 1000) {
            requestAnimationFrame(countFrame);
          } else {
            resolve(frames);
          }
        }
        
        requestAnimationFrame(countFrame);
      });
    });
    
    expect(fps).toBeGreaterThanOrEqual(55);  // Allow some variance
  });
});
```

---

# 11. Running Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm test:e2e tests/e2e/auth/login.spec.ts

# Run tests in headed mode (see browser)
pnpm test:e2e --headed

# Run tests for specific browser
pnpm test:e2e --project="Mobile Safari"

# Run tests with UI mode (interactive)
pnpm test:e2e --ui

# Run tests in debug mode
pnpm test:e2e --debug

# Generate test report
pnpm test:e2e --reporter=html
```

---

# END OF DOCUMENT 28
