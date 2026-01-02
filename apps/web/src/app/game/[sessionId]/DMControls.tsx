'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SessionData, MapInfo } from '@/stores/gameSessionStore';
import type { GameApplication } from '@/game/GameApplication';
import { useDiceRoller } from '@/hooks/useDiceRoller';
import type { DiceType } from '@/components/dice/DiceRoller';

interface DMControlsProps {
  sessionId: string;
  session: SessionData;
  availableMaps: MapInfo[];
  currentMapId: string | null;
  onMapChange: (mapId: string | null) => Promise<void>;
  game: GameApplication | null;
}

type Tab = 'maps' | 'combat' | 'dice' | 'fog' | 'tokens';

export function DMControls({
  sessionId: _sessionId,
  session,
  availableMaps,
  currentMapId,
  onMapChange,
  game,
}: DMControlsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('maps');
  const [isChangingMap, setIsChangingMap] = useState(false);
  const [fogBrushSize, setFogBrushSize] = useState(3);
  const [fogMode, setFogMode] = useState<'reveal' | 'hide'>('reveal');
  const [diceCount, setDiceCount] = useState(1);
  const [diceModifier, setDiceModifier] = useState(0);
  const [lastRollResult, setLastRollResult] = useState<{ total: number; rolls: number[]; dice: string } | null>(null);

  const { roll, rollInitiative, isRolling } = useDiceRoller();

  const handleMapSelect = useCallback(
    async (mapId: string | null) => {
      setIsChangingMap(true);
      try {
        await onMapChange(mapId);
      } finally {
        setIsChangingMap(false);
      }
    },
    [onMapChange]
  );

  const handleRevealAll = useCallback(() => {
    if (game) {
      game.revealAllFog();
    }
  }, [game]);

  const handleHideAll = useCallback(() => {
    if (game) {
      game.hideFog();
    }
  }, [game]);

  const handleDiceRoll = useCallback(async (diceType: DiceType) => {
    const result = await roll({
      dice: diceType,
      count: diceCount,
      modifier: diceModifier,
      rollType: 'DM Roll',
      rollContext: `${diceCount}${diceType}${diceModifier >= 0 ? '+' : ''}${diceModifier !== 0 ? diceModifier : ''}`,
      gameContext: session.inCombat ? 'combat' : 'exploration',
    });
    setLastRollResult({
      total: result.total,
      rolls: result.rolls,
      dice: diceType,
    });
  }, [roll, diceCount, diceModifier, session.inCombat]);

  const handleRollInitiative = useCallback(async () => {
    const result = await rollInitiative(0, 'Initiative');
    setLastRollResult({
      total: result.total,
      rolls: result.rolls,
      dice: 'd20',
    });
  }, [rollInitiative]);

  const tabs: { id: Tab; label: string; icon: JSX.Element }[] = [
    {
      id: 'maps',
      label: 'Maps',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
    {
      id: 'combat',
      label: 'Combat',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      id: 'dice',
      label: 'Dice',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      id: 'fog',
      label: 'Fog',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ),
    },
    {
      id: 'tokens',
      label: 'Tokens',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <h2 className="font-cinzel text-primary text-sm">DM Controls</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs transition-colors ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="wait">
          {activeTab === 'maps' && (
            <motion.div
              key="maps"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-3"
            >
              <div className="text-xs text-text-muted mb-2">
                Select a map for the session
              </div>

              {/* No Map Option */}
              <button
                onClick={() => handleMapSelect(null)}
                disabled={isChangingMap}
                className={`w-full p-2 rounded-lg text-left text-sm transition-colors ${
                  currentMapId === null
                    ? 'bg-primary/20 border border-primary text-primary'
                    : 'bg-bg-elevated hover:bg-border text-text-secondary'
                }`}
              >
                No Map (Theater of Mind)
              </button>

              {/* Map List */}
              {availableMaps.length === 0 ? (
                <div className="text-center py-4 text-text-muted text-xs">
                  No maps in this campaign.
                  <br />
                  Create maps in the Campaign Builder.
                </div>
              ) : (
                <div className="space-y-2">
                  {availableMaps.map((map) => (
                    <button
                      key={map.id}
                      onClick={() => handleMapSelect(map.id)}
                      disabled={isChangingMap}
                      className={`w-full p-2 rounded-lg text-left transition-colors ${
                        currentMapId === map.id
                          ? 'bg-primary/20 border border-primary'
                          : 'bg-bg-elevated hover:bg-border'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {map.backgroundUrl ? (
                          <img
                            src={map.backgroundUrl}
                            alt={map.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-bg-dark rounded flex items-center justify-center">
                            <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-text-primary truncate">{map.name}</div>
                          <div className="text-xs text-text-muted">
                            {map.width}x{map.height} tiles
                          </div>
                        </div>
                        {currentMapId === map.id && (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'combat' && (
            <motion.div
              key="combat"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Combat Status */}
              <div className="p-3 rounded-lg bg-bg-elevated">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted">Combat Status</span>
                  <span className={`text-xs font-medium ${session.inCombat ? 'text-red-400' : 'text-green-400'}`}>
                    {session.inCombat ? 'In Combat' : 'Exploration'}
                  </span>
                </div>
                {session.inCombat && (
                  <div className="text-sm text-text-primary">
                    Round {session.round}
                  </div>
                )}
              </div>

              {/* Combat Controls */}
              <div className="space-y-2">
                {!session.inCombat ? (
                  <button className="w-full py-2 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors">
                    Start Combat
                  </button>
                ) : (
                  <>
                    <button className="w-full py-2 px-3 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm font-medium transition-colors">
                      Next Turn
                    </button>
                    <button className="w-full py-2 px-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-colors">
                      End Combat
                    </button>
                  </>
                )}
              </div>

              {/* Initiative Quick Actions */}
              {session.inCombat && (
                <div className="space-y-2">
                  <div className="text-xs text-text-muted">Quick Actions</div>
                  <button
                    onClick={handleRollInitiative}
                    disabled={isRolling}
                    className="w-full py-2 px-3 bg-bg-elevated hover:bg-border text-text-secondary rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    Re-roll Initiative
                  </button>
                  <button className="w-full py-2 px-3 bg-bg-elevated hover:bg-border text-text-secondary rounded-lg text-sm transition-colors">
                    Add Creature
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'dice' && (
            <motion.div
              key="dice"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Quick Dice Buttons */}
              <div>
                <div className="text-xs text-text-muted mb-2">Quick Roll</div>
                <div className="grid grid-cols-4 gap-2">
                  {(['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as DiceType[]).map((dice) => (
                    <motion.button
                      key={dice}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDiceRoll(dice)}
                      disabled={isRolling}
                      className="py-2 px-1 bg-bg-elevated hover:bg-primary/20 text-text-secondary hover:text-primary rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {dice}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Dice Count */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted">Number of Dice</span>
                  <span className="text-xs text-text-primary">{diceCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDiceCount(Math.max(1, diceCount - 1))}
                    className="w-8 h-8 bg-bg-elevated hover:bg-border rounded-lg flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={diceCount}
                    onChange={(e) => setDiceCount(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <button
                    onClick={() => setDiceCount(Math.min(10, diceCount + 1))}
                    className="w-8 h-8 bg-bg-elevated hover:bg-border rounded-lg flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Modifier */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted">Modifier</span>
                  <span className="text-xs text-text-primary">
                    {diceModifier >= 0 ? '+' : ''}{diceModifier}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDiceModifier(diceModifier - 1)}
                    className="w-8 h-8 bg-bg-elevated hover:bg-border rounded-lg flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="-10"
                    max="20"
                    value={diceModifier}
                    onChange={(e) => setDiceModifier(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <button
                    onClick={() => setDiceModifier(diceModifier + 1)}
                    className="w-8 h-8 bg-bg-elevated hover:bg-border rounded-lg flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Roll d20 Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDiceRoll('d20')}
                disabled={isRolling}
                className="w-full py-3 px-4 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg font-medium transition-colors disabled:opacity-50 border border-primary/30"
              >
                Roll {diceCount}d20{diceModifier !== 0 && (diceModifier >= 0 ? `+${diceModifier}` : diceModifier)}
              </motion.button>

              {/* Last Roll Result */}
              {lastRollResult && (
                <div className="p-3 rounded-lg bg-bg-elevated">
                  <div className="text-xs text-text-muted mb-1">Last Roll</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">
                      {lastRollResult.rolls.join(' + ')}{diceModifier !== 0 && ` ${diceModifier >= 0 ? '+' : ''}${diceModifier}`}
                    </span>
                    <span className="text-2xl font-cinzel font-bold text-primary">
                      {lastRollResult.total}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'fog' && (
            <motion.div
              key="fog"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Fog Mode Toggle */}
              <div className="flex rounded-lg bg-bg-elevated p-1">
                <button
                  onClick={() => setFogMode('reveal')}
                  className={`flex-1 py-2 text-xs rounded-md transition-colors ${
                    fogMode === 'reveal' ? 'bg-primary text-bg-dark' : 'text-text-secondary'
                  }`}
                >
                  Reveal
                </button>
                <button
                  onClick={() => setFogMode('hide')}
                  className={`flex-1 py-2 text-xs rounded-md transition-colors ${
                    fogMode === 'hide' ? 'bg-primary text-bg-dark' : 'text-text-secondary'
                  }`}
                >
                  Hide
                </button>
              </div>

              {/* Brush Size */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted">Brush Size</span>
                  <span className="text-xs text-text-primary">{fogBrushSize} tiles</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={fogBrushSize}
                  onChange={(e) => setFogBrushSize(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <button
                  onClick={handleRevealAll}
                  className="w-full py-2 px-3 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm font-medium transition-colors"
                >
                  Reveal All
                </button>
                <button
                  onClick={handleHideAll}
                  className="w-full py-2 px-3 bg-bg-elevated hover:bg-border text-text-secondary rounded-lg text-sm transition-colors"
                >
                  Hide All
                </button>
              </div>

              <div className="text-xs text-text-muted">
                Click and drag on the map to {fogMode} areas.
              </div>
            </motion.div>
          )}

          {activeTab === 'tokens' && (
            <motion.div
              key="tokens"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Add Token */}
              <button className="w-full py-2 px-3 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Monster/NPC
              </button>

              {/* Token List */}
              <div className="space-y-2">
                <div className="text-xs text-text-muted">Active Tokens</div>
                {Object.entries(session.tokenStates || {}).length === 0 ? (
                  <div className="text-center py-4 text-text-muted text-xs">
                    No tokens on the board
                  </div>
                ) : (
                  Object.entries(session.tokenStates || {}).map(([id, state]) => (
                    <div
                      key={id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-bg-elevated"
                    >
                      <div className="w-8 h-8 rounded-full bg-bg-dark flex items-center justify-center text-text-muted">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-text-primary truncate">
                          {id.replace(/^(monster-|npc-)/, '').replace(/-\d+$/, '')}
                        </div>
                        <div className="text-xs text-text-muted">
                          HP: {state.currentHp}/{state.maxHp}
                        </div>
                      </div>
                      <button className="p-1 hover:bg-border rounded transition-colors">
                        <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
