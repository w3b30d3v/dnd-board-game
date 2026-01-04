'use client';

/**
 * AoETargeting
 * UI component for selecting and visualizing Area of Effect spell targets
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Circle,
  Square,
  Minus,
  Cylinder,
  X,
  Check,
  RotateCcw,
  Target,
} from 'lucide-react';
import type { GridPosition, Creature } from '@/game/types';
import { calculateAoE, getCreaturesInAoE, type AoEShape } from '@/game/AoECalculator';

interface AoETargetingProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (affectedCreatureIds: string[], affectedTiles: GridPosition[]) => void;
  spellName?: string;
  shape: AoEShape;
  radius?: number;
  length?: number;
  width?: number;
  size?: number;
  casterPosition: GridPosition;
  creatures: Creature[];
  gridWidth: number;
  gridHeight: number;
  onPreviewChange?: (tiles: GridPosition[]) => void;
}

// Shape display info
const SHAPE_INFO: Record<AoEShape, { name: string; icon: React.ComponentType<{ className?: string }>; color: string; description: string }> = {
  sphere: { name: 'Sphere', icon: Circle, color: '#EF4444', description: 'Radiates from a point' },
  cone: { name: 'Cone', icon: Target, color: '#F59E0B', description: 'Spreads from caster' },
  line: { name: 'Line', icon: Minus, color: '#3B82F6', description: 'Extends in a direction' },
  cube: { name: 'Cube', icon: Square, color: '#22C55E', description: 'Fills a cube area' },
  cylinder: { name: 'Cylinder', icon: Cylinder, color: '#8B5CF6', description: 'Column effect' },
};

// Direction presets (in degrees)
const DIRECTIONS = [
  { angle: 0, label: 'East', icon: '→' },
  { angle: 45, label: 'SE', icon: '↘' },
  { angle: 90, label: 'South', icon: '↓' },
  { angle: 135, label: 'SW', icon: '↙' },
  { angle: 180, label: 'West', icon: '←' },
  { angle: 225, label: 'NW', icon: '↖' },
  { angle: 270, label: 'North', icon: '↑' },
  { angle: 315, label: 'NE', icon: '↗' },
];

export function AoETargeting({
  isOpen,
  onClose,
  onConfirm,
  spellName,
  shape,
  radius = 20,
  length = 30,
  width = 5,
  size = 15,
  casterPosition,
  creatures,
  gridWidth,
  gridHeight,
  onPreviewChange,
}: AoETargetingProps) {
  // Origin point for the AoE (default to caster position)
  const [origin, setOrigin] = useState<GridPosition>(casterPosition);
  // Direction in degrees (for cones, lines, cubes)
  const [direction, setDirection] = useState(0);
  // Manual origin selection mode
  const [isSelectingOrigin, setIsSelectingOrigin] = useState(false);

  // Shape info
  const shapeInfo = SHAPE_INFO[shape];
  const needsDirection = ['cone', 'line', 'cube'].includes(shape);

  // Calculate affected tiles
  const aoeResult = useMemo(() => {
    return calculateAoE({
      shape,
      origin,
      radius,
      length,
      width,
      size,
      direction,
    });
  }, [shape, origin, radius, length, width, size, direction]);

  // Filter to valid grid positions
  const validAffectedTiles = useMemo(() => {
    return aoeResult.affectedTiles.filter(
      t => t.x >= 0 && t.x < gridWidth && t.y >= 0 && t.y < gridHeight
    );
  }, [aoeResult.affectedTiles, gridWidth, gridHeight]);

  // Get affected creatures
  const affectedCreatures = useMemo(() => {
    return getCreaturesInAoE(
      { ...aoeResult, affectedTiles: validAffectedTiles },
      creatures.map(c => ({ id: c.id, position: c.position }))
    );
  }, [aoeResult, validAffectedTiles, creatures]);

  // Notify parent of preview changes
  useEffect(() => {
    if (isOpen && onPreviewChange) {
      onPreviewChange(validAffectedTiles);
    }
    return () => {
      if (onPreviewChange) {
        onPreviewChange([]);
      }
    };
  }, [isOpen, validAffectedTiles, onPreviewChange]);

  // Reset to caster position
  const handleReset = useCallback(() => {
    setOrigin(casterPosition);
    setDirection(0);
  }, [casterPosition]);

  // Confirm the targeting
  const handleConfirm = useCallback(() => {
    onConfirm(affectedCreatures, validAffectedTiles);
    onClose();
  }, [affectedCreatures, validAffectedTiles, onConfirm, onClose]);

  // Rotate direction
  const handleRotate = useCallback((clockwise: boolean) => {
    setDirection(prev => {
      const newDir = clockwise ? prev + 45 : prev - 45;
      return ((newDir % 360) + 360) % 360;
    });
  }, []);

  if (!isOpen) return null;

  const Icon = shapeInfo.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center pb-4 pointer-events-none"
      >
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-gradient-to-b from-[#1E1B26] to-[#0d0a14] rounded-xl border border-red-500/30 shadow-2xl pointer-events-auto mx-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-red-500/20 bg-red-900/20">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${shapeInfo.color}20` }}
              >
                <span style={{ color: shapeInfo.color }}><Icon className="w-5 h-5" /></span>
              </div>
              <div>
                <h3 className="font-medium text-white">
                  {spellName || 'Select Target Area'}
                </h3>
                <p className="text-xs text-gray-400">
                  {shapeInfo.name} - {shapeInfo.description}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Origin Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">Origin Point</label>
                <button
                  onClick={() => setIsSelectingOrigin(!isSelectingOrigin)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    isSelectingOrigin
                      ? 'bg-red-500/30 text-red-400'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  {isSelectingOrigin ? 'Click on map...' : 'Change Origin'}
                </button>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
                <Target className="w-4 h-4 text-red-400" />
                <span className="text-white text-sm">
                  ({origin.x}, {origin.y})
                </span>
                <span className="text-gray-500 text-xs ml-auto">
                  {origin.x === casterPosition.x && origin.y === casterPosition.y
                    ? 'At caster'
                    : `${Math.max(Math.abs(origin.x - casterPosition.x), Math.abs(origin.y - casterPosition.y)) * 5}ft from caster`}
                </span>
              </div>
            </div>

            {/* Direction Control (for directional AoEs) */}
            {needsDirection && (
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Direction</label>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleRotate(false)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-white" />
                  </button>

                  <div className="grid grid-cols-3 gap-1">
                    {DIRECTIONS.slice(5, 8).concat(DIRECTIONS.slice(0, 1)).map((dir, i) => {
                      // Rearrange for visual grid: NW, N, NE row
                      const gridDirs = [
                        DIRECTIONS[5], DIRECTIONS[6], DIRECTIONS[7],
                        DIRECTIONS[4], null, DIRECTIONS[0],
                        DIRECTIONS[3], DIRECTIONS[2], DIRECTIONS[1],
                      ];
                      const d = gridDirs[i < 3 ? i : i + 3];
                      if (!d) return <div key={i} className="w-8 h-8" />;
                      return (
                        <button
                          key={d.angle}
                          onClick={() => setDirection(d.angle)}
                          className={`w-8 h-8 rounded flex items-center justify-center text-lg transition-colors ${
                            direction === d.angle
                              ? 'bg-red-500 text-white'
                              : 'bg-white/10 text-gray-400 hover:bg-white/20'
                          }`}
                          title={d.label}
                        >
                          {d.icon}
                        </button>
                      );
                    })}
                    {/* Middle row */}
                    <button
                      onClick={() => setDirection(180)}
                      className={`w-8 h-8 rounded flex items-center justify-center text-lg transition-colors ${
                        direction === 180
                          ? 'bg-red-500 text-white'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      ←
                    </button>
                    <div className="w-8 h-8 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    </div>
                    <button
                      onClick={() => setDirection(0)}
                      className={`w-8 h-8 rounded flex items-center justify-center text-lg transition-colors ${
                        direction === 0
                          ? 'bg-red-500 text-white'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      →
                    </button>
                    {/* Bottom row */}
                    <button
                      onClick={() => setDirection(225)}
                      className={`w-8 h-8 rounded flex items-center justify-center text-lg transition-colors ${
                        direction === 225
                          ? 'bg-red-500 text-white'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      ↙
                    </button>
                    <button
                      onClick={() => setDirection(270)}
                      className={`w-8 h-8 rounded flex items-center justify-center text-lg transition-colors ${
                        direction === 270
                          ? 'bg-red-500 text-white'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => setDirection(315)}
                      className={`w-8 h-8 rounded flex items-center justify-center text-lg transition-colors ${
                        direction === 315
                          ? 'bg-red-500 text-white'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      ↘
                    </button>
                  </div>

                  <button
                    onClick={() => handleRotate(true)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-white transform scale-x-[-1]" />
                  </button>
                </div>
              </div>
            )}

            {/* Stats Display */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="text-xs text-gray-400 mb-1">Tiles Affected</div>
                <div className="text-xl font-bold text-white">{validAffectedTiles.length}</div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="text-xs text-gray-400 mb-1">Creatures Hit</div>
                <div className="text-xl font-bold text-red-400">{affectedCreatures.length}</div>
              </div>
            </div>

            {/* Affected Creatures List */}
            {affectedCreatures.length > 0 && (
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Targets</label>
                <div className="flex flex-wrap gap-2">
                  {affectedCreatures.map(id => {
                    const creature = creatures.find(c => c.id === id);
                    if (!creature) return null;
                    return (
                      <span
                        key={id}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          creature.type === 'monster'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {creature.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AoE Size Info */}
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span style={{ color: shapeInfo.color }}><Icon className="w-4 h-4" /></span>
                <span>
                  {shape === 'sphere' && `${radius}ft radius sphere`}
                  {shape === 'cone' && `${length}ft cone`}
                  {shape === 'line' && `${length}ft x ${width}ft line`}
                  {shape === 'cube' && `${size}ft cube`}
                  {shape === 'cylinder' && `${radius}ft radius cylinder`}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-white/10 flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2 bg-red-500 hover:bg-red-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Cast
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AoETargeting;
