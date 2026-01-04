'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { GameApplication } from '@/game/GameApplication';
import type { GridPosition } from '@/game/types';
import { DMControls } from './DMControls';
import { PlayerPanel } from './PlayerPanel';
import { InitiativeTracker } from './InitiativeTracker';
import { useImmersive } from '@/components/immersion/ImmersiveProvider';
import { AudioControls } from './AudioControls';
import { CombatActionBar } from '@/components/game/CombatActionBar';
import { useCombat } from '@/hooks/useCombat';

interface GameSessionContentProps {
  sessionId: string;
}

export function GameSessionContent({ sessionId }: GameSessionContentProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameApplication | null>(null);

  const { token, _hasHydrated } = useAuthStore();
  const {
    session,
    currentMap,
    isDM,
    gameState,
    isLoading,
    error,
    availableMaps,
    loadSession,
    loadMaps,
    loadEncounters,
    changeMap,
    reset,
  } = useGameSessionStore();

  const [selectedTile, setSelectedTile] = useState<GridPosition | null>(null);
  const [selectedCreature, setSelectedCreature] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showDMControls, setShowDMControls] = useState(false);
  const [showPlayerPanel, setShowPlayerPanel] = useState(true);

  // Immersive system hooks
  const {
    setGamePhase,
    enterLocation,
    playDamage,
    playHeal,
    playCriticalHit,
  } = useImmersive();

  // Get creatures from game state
  const creatures = useMemo(() => gameState?.creatures || [], [gameState?.creatures]);

  // Combat system - the heart of gameplay
  const combat = useCombat(creatures, null); // TokenManager accessed through gameRef

  // Track previous HP values to detect damage/healing
  const prevCreatureHp = useRef<Map<string, number>>(new Map());

  // Auth check
  useEffect(() => {
    if (_hasHydrated && !token) {
      router.push(`/login?redirect=/game/${sessionId}`);
    }
  }, [_hasHydrated, token, router, sessionId]);

  // Load session data
  useEffect(() => {
    if (!token || !sessionId) return;

    loadSession(sessionId).catch((err) => {
      console.error('Failed to load session:', err);
    });

    return () => {
      reset();
    };
  }, [token, sessionId, loadSession, reset]);

  // Load maps and encounters for DM
  useEffect(() => {
    if (!isDM || !sessionId) return;

    loadMaps(sessionId);
    loadEncounters(sessionId);
  }, [isDM, sessionId, loadMaps, loadEncounters]);

  // Set game phase for immersive audio/visuals
  useEffect(() => {
    if (!session) return;

    if (session.inCombat) {
      setGamePhase('combat');
    } else {
      setGamePhase('exploration');
    }
  }, [session?.inCombat, setGamePhase, session]);

  // Set ambient soundscape based on map
  useEffect(() => {
    if (!currentMap) return;

    // Determine location type from map name or tags
    const mapName = currentMap.name.toLowerCase();

    if (mapName.includes('dungeon') || mapName.includes('cave') || mapName.includes('crypt')) {
      enterLocation('dungeon');
    } else if (mapName.includes('forest') || mapName.includes('woods')) {
      enterLocation('forest');
    } else if (mapName.includes('tavern') || mapName.includes('inn')) {
      enterLocation('tavern');
    } else if (mapName.includes('castle') || mapName.includes('throne')) {
      enterLocation('castle');
    } else if (mapName.includes('village')) {
      enterLocation('village');
    } else if (mapName.includes('town') || mapName.includes('city')) {
      enterLocation('city');
    } else if (mapName.includes('swamp') || mapName.includes('marsh')) {
      enterLocation('swamp');
    } else if (mapName.includes('mountain') || mapName.includes('peak')) {
      enterLocation('mountain');
    } else if (mapName.includes('ocean') || mapName.includes('sea') || mapName.includes('beach')) {
      enterLocation('ocean');
    } else {
      // Default to dungeon ambience for battle maps
      enterLocation('dungeon');
    }
  }, [currentMap, enterLocation]);

  // Detect HP changes and play sound/visual effects
  useEffect(() => {
    if (!gameState?.creatures) return;

    const tileSize = 48; // Match game tile size
    const containerRect = containerRef.current?.getBoundingClientRect();

    for (const creature of gameState.creatures) {
      const prevHp = prevCreatureHp.current.get(creature.id);

      if (prevHp !== undefined) {
        const hpChange = creature.currentHitPoints - prevHp;

        // Calculate screen position for VFX (centered on creature)
        const screenX = containerRect
          ? containerRect.left + creature.position.x * tileSize + tileSize / 2
          : window.innerWidth / 2;
        const screenY = containerRect
          ? containerRect.top + creature.position.y * tileSize + tileSize / 2
          : window.innerHeight / 2;

        const position = { x: screenX, y: screenY };

        if (hpChange < 0) {
          // Took damage
          const damageAmount = Math.abs(hpChange);
          const isCritical = damageAmount > creature.maxHitPoints * 0.3; // 30%+ max HP = critical

          if (isCritical) {
            // playCriticalHit includes both VFX and SFX
            playCriticalHit(position);
          } else {
            // playDamage includes both VFX and SFX
            playDamage(damageAmount, position);
          }
        } else if (hpChange > 0) {
          // Received healing - playHeal includes both VFX and SFX
          playHeal(hpChange, position);
        }
      }

      // Update tracked HP
      prevCreatureHp.current.set(creature.id, creature.currentHitPoints);
    }
  }, [gameState?.creatures, playDamage, playHeal, playCriticalHit]);

  // Initialize game
  useEffect(() => {
    if (!containerRef.current || !gameState || gameRef.current) return;

    const game = new GameApplication({
      containerId: 'game-container',
      tileSize: 48,
      gridWidth: gameState.map.width,
      gridHeight: gameState.map.height,
      onTileClick: (pos) => setSelectedTile(pos),
      onTileHover: () => {},
      onTokenClick: (id) => setSelectedCreature(id),
    });

    gameRef.current = game;

    game.ready().then(() => {
      game.loadState(gameState);
      // Reveal fog based on player positions if not DM
      if (!isDM) {
        gameState.creatures
          .filter((c) => c.type === 'character')
          .forEach((c) => {
            game.revealFog(c.position.x, c.position.y, 30);
          });
      } else {
        game.revealAllFog();
      }
    });

    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, [gameState, isDM]);

  // Update game state when it changes
  useEffect(() => {
    if (!gameRef.current || !gameState) return;

    gameRef.current.ready().then(() => {
      gameRef.current?.loadState(gameState);
    });
  }, [gameState]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (!gameRef.current) return;
    const newZoom = Math.min(4, zoom * 1.2);
    gameRef.current.setZoom(newZoom);
    setZoom(newZoom);
  }, [zoom]);

  const handleZoomOut = useCallback(() => {
    if (!gameRef.current) return;
    const newZoom = Math.max(0.25, zoom / 1.2);
    gameRef.current.setZoom(newZoom);
    setZoom(newZoom);
  }, [zoom]);

  const handleResetCamera = useCallback(() => {
    if (!gameRef.current) return;
    gameRef.current.resetCamera();
    setZoom(1);
  }, []);

  // Handle map change
  const handleMapChange = useCallback(
    async (mapId: string | null) => {
      try {
        await changeMap(sessionId, mapId);
        // Reinitialize game with new map
        if (gameRef.current) {
          gameRef.current.destroy();
          gameRef.current = null;
        }
      } catch (err) {
        console.error('Failed to change map:', err);
      }
    },
    [sessionId, changeMap]
  );

  // Loading state
  if (!_hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 spinner border-4 mx-auto mb-4" />
          <p className="text-text-secondary">Loading game session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-cinzel text-text-primary mb-2">Failed to Load Session</h2>
          <p className="text-text-secondary mb-4">{error}</p>
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 bg-primary text-bg-dark rounded-lg font-medium"
            >
              Return to Dashboard
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  // No session loaded
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-secondary">Session not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass border-b border-border/50 backdrop-blur-md z-10">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3">
            <Link href={isDM ? '/dm' : '/dashboard'}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-bg-elevated transition-colors"
              >
                <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
            </Link>
            <div>
              <h1 className="text-lg font-cinzel text-primary">{session.name}</h1>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span>{session.campaign.name}</span>
                <span className="text-text-muted">|</span>
                <span className={session.inCombat ? 'text-red-400' : 'text-green-400'}>
                  {session.inCombat ? `Combat - Round ${session.round}` : 'Exploration'}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Session Status */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Players:</span>
              <span className="text-sm text-text-primary">
                {session.participants.filter((p) => p.role === 'player').length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Invite:</span>
              <code className="text-sm text-primary bg-bg-elevated px-2 py-0.5 rounded">
                {session.inviteCode}
              </code>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Audio Controls */}
            <AudioControls />

            {isDM && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDMControls(!showDMControls)}
                className={`p-2 rounded-lg transition-colors ${
                  showDMControls ? 'bg-primary text-bg-dark' : 'bg-bg-elevated hover:bg-border'
                }`}
                title="DM Controls"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPlayerPanel(!showPlayerPanel)}
              className={`p-2 rounded-lg transition-colors ${
                showPlayerPanel ? 'bg-primary/20 text-primary' : 'bg-bg-elevated hover:bg-border'
              }`}
              title="Player Panel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* DM Controls Sidebar */}
        <AnimatePresence>
          {isDM && showDMControls && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-bg-card border-r border-border overflow-hidden"
            >
              <DMControls
                sessionId={sessionId}
                session={session}
                availableMaps={availableMaps}
                currentMapId={session.currentMapId}
                onMapChange={handleMapChange}
                game={gameRef.current}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Canvas */}
        <div className="flex-1 relative">
          <div id="game-container" ref={containerRef} className="absolute inset-0" />

          {/* Note: VFX are handled by ImmersiveProvider's VFXManager component */}

          {/* No Map Message */}
          {!currentMap && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg-dark/80">
              <div className="text-center">
                <svg className="w-16 h-16 text-text-muted mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <h3 className="text-lg font-cinzel text-text-primary mb-2">No Map Loaded</h3>
                <p className="text-sm text-text-muted">
                  {isDM ? 'Select a map from the DM Controls panel' : 'Waiting for the DM to load a map'}
                </p>
              </div>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleZoomIn}
              className="w-10 h-10 bg-bg-card/80 backdrop-blur rounded-lg flex items-center justify-center text-xl font-bold hover:bg-primary/20 border border-border"
            >
              +
            </motion.button>
            <div className="text-center text-xs text-text-muted">{Math.round(zoom * 100)}%</div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleZoomOut}
              className="w-10 h-10 bg-bg-card/80 backdrop-blur rounded-lg flex items-center justify-center text-xl font-bold hover:bg-primary/20 border border-border"
            >
              -
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleResetCamera}
              className="w-10 h-10 bg-bg-card/80 backdrop-blur rounded-lg flex items-center justify-center hover:bg-primary/20 border border-border"
              title="Reset Camera"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </motion.button>
          </div>

          {/* Position Info */}
          <div className="absolute top-4 left-4 bg-bg-card/80 backdrop-blur rounded-lg p-3 text-sm z-10 border border-border">
            <div className="text-text-muted">
              Selected: {selectedTile ? `(${selectedTile.x}, ${selectedTile.y})` : 'None'}
            </div>
            <div className="text-text-muted">Creature: {selectedCreature || 'None'}</div>
          </div>

          {/* Initiative Tracker (Combat) */}
          {(session.inCombat || combat.isInCombat) && (
            <div className="absolute top-4 right-4 z-10">
              <InitiativeTracker
                initiativeOrder={combat.isInCombat ? combat.initiativeOrder : (session.initiativeOrder || [])}
                currentTurn={combat.isInCombat ?
                  combat.initiativeOrder.findIndex(e => e.creatureId === combat.currentTurnCreatureId) :
                  session.currentTurn}
                creatures={gameState?.creatures || []}
              />
            </div>
          )}
        </div>

        {/* Player Panel Sidebar */}
        <AnimatePresence>
          {showPlayerPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-bg-card border-l border-border overflow-hidden"
            >
              <PlayerPanel
                participants={session.participants}
                isDM={isDM}
                selectedCreature={selectedCreature}
                onSelectCreature={setSelectedCreature}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Combat Action Bar - Bottom of screen */}
      <CombatActionBar
        combatState={{
          isInCombat: combat.isInCombat,
          round: combat.round,
          currentTurnCreatureId: combat.currentTurnCreatureId,
          initiativeOrder: combat.initiativeOrder,
          selectedTargetId: combat.selectedTargetId,
          selectedAction: combat.selectedAction,
          isSelectingTarget: combat.isSelectingTarget,
          combatLog: combat.combatLog,
        }}
        currentCreature={creatures.find(c => c.id === combat.currentTurnCreatureId) || null}
        availableActions={combat.getAvailableActions()}
        validTargets={combat.getValidTargets()}
        creatures={creatures}
        isDM={isDM}
        onSelectAction={combat.selectAction}
        onSelectTarget={combat.selectTarget}
        onConfirmAttack={combat.confirmAttack}
        onCancelAction={combat.cancelAction}
        onEndTurn={combat.nextTurn}
        onStartCombat={combat.startCombat}
        onEndCombat={combat.endCombat}
        isInRange={combat.isInRange}
        getDistance={combat.getDistance}
      />
    </div>
  );
}
