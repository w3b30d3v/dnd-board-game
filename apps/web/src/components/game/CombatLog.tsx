'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CombatLogEntry {
  id: string;
  timestamp: Date;
  type: 'attack' | 'damage' | 'heal' | 'death' | 'save' | 'condition' | 'initiative' | 'turn' | 'info';
  actor: string;
  target?: string;
  message: string;
  details?: {
    roll?: number;
    modifier?: number;
    total?: number;
    dc?: number;
    success?: boolean;
    critical?: boolean;
    damageType?: string;
    amount?: number;
  };
}

interface CombatLogProps {
  entries: CombatLogEntry[];
  maxEntries?: number;
  onClear?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  attack: 'text-orange-400',
  damage: 'text-red-400',
  heal: 'text-green-400',
  death: 'text-purple-400',
  save: 'text-blue-400',
  condition: 'text-yellow-400',
  initiative: 'text-cyan-400',
  turn: 'text-primary',
  info: 'text-text-secondary',
};

const TYPE_ICONS: Record<string, string> = {
  attack: '⚔️',
  damage: '💥',
  heal: '💚',
  death: '💀',
  save: '🛡️',
  condition: '✨',
  initiative: '🎲',
  turn: '➡️',
  info: 'ℹ️',
};

export function CombatLog({
  entries,
  maxEntries = 50,
  onClear,
  isExpanded = true,
  onToggleExpand,
}: CombatLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<string | null>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (isExpanded && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, isExpanded]);

  const filteredEntries = filter
    ? entries.filter((e) => e.type === filter)
    : entries;

  const displayEntries = filteredEntries.slice(-maxEntries);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const renderDetails = (entry: CombatLogEntry) => {
    if (!entry.details) return null;
    const { roll, modifier, total, dc, success, critical, amount, damageType } = entry.details;

    const parts: string[] = [];
    if (roll !== undefined) {
      parts.push(`Roll: ${roll}`);
      if (modifier !== undefined) {
        const sign = modifier >= 0 ? '+' : '';
        parts.push(`${sign}${modifier}`);
      }
      if (total !== undefined) {
        parts.push(`= ${total}`);
      }
    }
    if (dc !== undefined) {
      parts.push(`DC: ${dc}`);
    }
    if (amount !== undefined) {
      parts.push(`${amount}${damageType ? ` ${damageType}` : ''}`);
    }
    if (critical) {
      parts.push('CRITICAL!');
    }
    if (success !== undefined) {
      parts.push(success ? 'SUCCESS' : 'FAILURE');
    }

    if (parts.length === 0) return null;

    return (
      <span className="text-xs text-text-muted ml-2">
        ({parts.join(' | ')})
      </span>
    );
  };

  return (
    <div className="bg-bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-bg-elevated border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-lg">📜</span>
          <h3 className="font-medium text-text-primary text-sm">Combat Log</h3>
          <span className="text-xs text-text-muted">({entries.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          <div className="flex gap-1">
            {['attack', 'damage', 'save', 'death'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(filter === type ? null : type)}
                className={`px-1.5 py-0.5 text-xs rounded ${
                  filter === type
                    ? 'bg-primary/20 text-primary'
                    : 'bg-bg-card text-text-muted hover:bg-border'
                }`}
              >
                {TYPE_ICONS[type]}
              </button>
            ))}
          </div>
          {onClear && (
            <button
              onClick={onClear}
              className="px-2 py-1 text-xs text-text-muted hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          )}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              {isExpanded ? '▼' : '▲'}
            </button>
          )}
        </div>
      </div>

      {/* Log entries */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="max-h-48 overflow-y-auto p-2 space-y-1">
              {displayEntries.length === 0 ? (
                <p className="text-center text-text-muted text-sm py-4">
                  No combat events yet...
                </p>
              ) : (
                displayEntries.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`text-sm px-2 py-1 rounded ${
                      entry.details?.critical
                        ? 'bg-red-500/10 border border-red-500/30'
                        : 'hover:bg-bg-elevated'
                    }`}
                  >
                    <span className="text-text-muted text-xs mr-2">
                      {formatTime(entry.timestamp)}
                    </span>
                    <span className="mr-1">{TYPE_ICONS[entry.type]}</span>
                    <span className={TYPE_COLORS[entry.type]}>
                      <strong>{entry.actor}</strong>
                      {entry.target && (
                        <>
                          {' → '}
                          <strong>{entry.target}</strong>
                        </>
                      )}
                      {': '}
                    </span>
                    <span className="text-text-primary">{entry.message}</span>
                    {renderDetails(entry)}
                  </motion.div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook to manage combat log state
export function useCombatLog() {
  const [entries, setEntries] = useState<CombatLogEntry[]>([]);

  const addEntry = (
    type: CombatLogEntry['type'],
    actor: string,
    message: string,
    options?: {
      target?: string;
      details?: CombatLogEntry['details'];
    }
  ) => {
    const entry: CombatLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      actor,
      target: options?.target,
      message,
      details: options?.details,
    };
    setEntries((prev) => [...prev, entry]);
    return entry;
  };

  const logAttack = (
    attacker: string,
    defender: string,
    roll: number,
    modifier: number,
    ac: number,
    hit: boolean,
    critical: boolean = false
  ) => {
    const total = roll + modifier;
    const message = critical
      ? 'CRITICAL HIT!'
      : hit
      ? `hits (${total} vs AC ${ac})`
      : `misses (${total} vs AC ${ac})`;
    return addEntry('attack', attacker, message, {
      target: defender,
      details: { roll, modifier, total, dc: ac, success: hit, critical },
    });
  };

  const logDamage = (
    source: string,
    target: string,
    amount: number,
    damageType: string
  ) => {
    return addEntry('damage', source, `deals ${amount} ${damageType} damage`, {
      target,
      details: { amount, damageType },
    });
  };

  const logHeal = (healer: string, target: string, amount: number) => {
    return addEntry('heal', healer, `heals for ${amount} HP`, {
      target,
      details: { amount },
    });
  };

  const logDeath = (creature: string) => {
    return addEntry('death', creature, 'has fallen!');
  };

  const logSave = (
    creature: string,
    abilityName: string,
    roll: number,
    modifier: number,
    dc: number,
    success: boolean
  ) => {
    const total = roll + modifier;
    const message = success
      ? `succeeds ${abilityName} save (${total} vs DC ${dc})`
      : `fails ${abilityName} save (${total} vs DC ${dc})`;
    return addEntry('save', creature, message, {
      details: { roll, modifier, total, dc, success },
    });
  };

  const logCondition = (creature: string, condition: string, applied: boolean) => {
    const message = applied
      ? `is now ${condition}`
      : `is no longer ${condition}`;
    return addEntry('condition', creature, message);
  };

  const logInitiative = (creatures: Array<{ name: string; roll: number }>) => {
    const sorted = [...creatures].sort((a, b) => b.roll - a.roll);
    const order = sorted.map((c, i) => `${i + 1}. ${c.name} (${c.roll})`).join(', ');
    return addEntry('initiative', 'Combat', `Initiative order: ${order}`);
  };

  const logTurnStart = (creature: string, round: number) => {
    return addEntry('turn', creature, `begins turn (Round ${round})`);
  };

  const logInfo = (message: string) => {
    return addEntry('info', 'System', message);
  };

  const clearLog = () => {
    setEntries([]);
  };

  return {
    entries,
    addEntry,
    logAttack,
    logDamage,
    logHeal,
    logDeath,
    logSave,
    logCondition,
    logInitiative,
    logTurnStart,
    logInfo,
    clearLog,
  };
}

export default CombatLog;
