-- Add session management fields to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "maxActiveSessions" INTEGER NOT NULL DEFAULT 3;

-- Add persistent game state fields to game_sessions
ALTER TABLE "game_sessions" ADD COLUMN IF NOT EXISTS "tokenStates" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "game_sessions" ADD COLUMN IF NOT EXISTS "revealedCells" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "game_sessions" ADD COLUMN IF NOT EXISTS "journal" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "game_sessions" ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable for GameSessionParticipant
CREATE TABLE IF NOT EXISTS "game_session_participants" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "characterId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'player',
    "currentHp" INTEGER,
    "tempHp" INTEGER NOT NULL DEFAULT 0,
    "conditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "inspiration" BOOLEAN NOT NULL DEFAULT false,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_session_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "game_session_participants_sessionId_userId_key" ON "game_session_participants"("sessionId", "userId");

-- AddForeignKey (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'game_session_participants_sessionId_fkey'
    ) THEN
        ALTER TABLE "game_session_participants" ADD CONSTRAINT "game_session_participants_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
