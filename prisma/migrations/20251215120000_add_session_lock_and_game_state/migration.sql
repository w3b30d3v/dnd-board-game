-- Add session lock fields to game_sessions
ALTER TABLE "game_sessions" ADD COLUMN IF NOT EXISTS "isLocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "game_sessions" ADD COLUMN IF NOT EXISTS "allowedUsers" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add game state persistence fields to campaigns
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "gameState" JSONB;
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "lastSavedAt" TIMESTAMP(3);
