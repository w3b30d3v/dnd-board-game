'use client';

/**
 * EquipmentPanel
 * Manage character equipment - weapons, armor, and inventory items
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Sword,
  Shield,
  Backpack,
  X,
  ChevronDown,
  Star,
  Weight,
  Coins,
  Hand,
  CircleDot,
  Check,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';

// Equipment types
export type EquipmentSlot =
  | 'mainHand'
  | 'offHand'
  | 'armor'
  | 'helmet'
  | 'boots'
  | 'gloves'
  | 'ring1'
  | 'ring2'
  | 'amulet'
  | 'cloak'
  | 'inventory';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'veryRare' | 'legendary' | 'artifact';

export interface EquipmentItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'shield' | 'wondrous' | 'potion' | 'scroll' | 'tool' | 'gear';
  slot?: EquipmentSlot;
  equipped?: boolean;
  rarity: ItemRarity;
  weight: number; // in pounds
  value: number;  // in gold pieces
  description: string;
  properties?: string[];
  // Weapon specific
  damage?: string;      // e.g., "1d8"
  damageType?: string;  // e.g., "slashing"
  range?: string;       // e.g., "30/120"
  // Armor specific
  armorClass?: number;
  maxDexBonus?: number;
  stealthDisadvantage?: boolean;
  // Magic item
  attunement?: boolean;
  attuned?: boolean;
  charges?: number;
  maxCharges?: number;
}

// Rarity colors
const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  veryRare: '#8B5CF6',
  legendary: '#F59E0B',
  artifact: '#EF4444',
};

// Slot display info
const SLOT_INFO: Record<EquipmentSlot, { name: string; icon: React.ComponentType<{ className?: string }> }> = {
  mainHand: { name: 'Main Hand', icon: Sword },
  offHand: { name: 'Off Hand', icon: Hand },
  armor: { name: 'Armor', icon: Shield },
  helmet: { name: 'Helmet', icon: CircleDot },
  boots: { name: 'Boots', icon: CircleDot },
  gloves: { name: 'Gloves', icon: Hand },
  ring1: { name: 'Ring 1', icon: CircleDot },
  ring2: { name: 'Ring 2', icon: CircleDot },
  amulet: { name: 'Amulet', icon: CircleDot },
  cloak: { name: 'Cloak', icon: CircleDot },
  inventory: { name: 'Inventory', icon: Backpack },
};

interface EquipmentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  characterName: string;
  equipment: EquipmentItem[];
  carryingCapacity: number; // in pounds
  gold: number;
  attunementSlots?: number; // Default 3
  onEquip: (itemId: string, slot: EquipmentSlot) => void;
  onUnequip: (itemId: string) => void;
  onUseItem?: (itemId: string) => void;
  onDropItem?: (itemId: string) => void;
  onAttune?: (itemId: string) => void;
  onUnattune?: (itemId: string) => void;
}

export function EquipmentPanel({
  isOpen,
  onClose,
  characterName,
  equipment,
  carryingCapacity,
  gold,
  attunementSlots = 3,
  onEquip,
  onUnequip,
  onUseItem,
  onDropItem,
  onAttune,
  onUnattune,
}: EquipmentPanelProps) {
  const [activeTab, setActiveTab] = useState<'equipped' | 'inventory' | 'all'>('equipped');
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [expandedSlots, setExpandedSlots] = useState<Set<EquipmentSlot>>(new Set(['mainHand', 'offHand', 'armor']));

  // Calculate totals
  const totalWeight = useMemo(() => {
    return equipment.reduce((sum, item) => sum + item.weight, 0);
  }, [equipment]);

  const totalValue = useMemo(() => {
    return equipment.reduce((sum, item) => sum + item.value, 0);
  }, [equipment]);

  const attunedCount = useMemo(() => {
    return equipment.filter(item => item.attuned).length;
  }, [equipment]);

  // Filter equipment by tab
  const filteredEquipment = useMemo(() => {
    switch (activeTab) {
      case 'equipped':
        return equipment.filter(item => item.equipped);
      case 'inventory':
        return equipment.filter(item => !item.equipped);
      default:
        return equipment;
    }
  }, [equipment, activeTab]);

  // Get equipped items by slot
  const equippedBySlot = useMemo(() => {
    const bySlot: Partial<Record<EquipmentSlot, EquipmentItem>> = {};
    equipment.forEach(item => {
      if (item.equipped && item.slot) {
        bySlot[item.slot] = item;
      }
    });
    return bySlot;
  }, [equipment]);

  // Toggle slot expansion
  const toggleSlot = useCallback((slot: EquipmentSlot) => {
    setExpandedSlots(prev => {
      const next = new Set(prev);
      if (next.has(slot)) {
        next.delete(slot);
      } else {
        next.add(slot);
      }
      return next;
    });
  }, []);

  // Handle equip item
  const handleEquip = useCallback((item: EquipmentItem, slot: EquipmentSlot) => {
    onEquip(item.id, slot);
    setSelectedItem(null);
  }, [onEquip]);

  // Handle unequip item
  const handleUnequip = useCallback((item: EquipmentItem) => {
    onUnequip(item.id);
  }, [onUnequip]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[85vh] bg-gradient-to-b from-[#1E1B26] to-[#0d0a14] rounded-xl border border-amber-500/30 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-amber-900/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Backpack className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Equipment</h2>
                <p className="text-sm text-gray-400">{characterName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="px-6 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Weight className="w-4 h-4 text-gray-400" />
                <span className={`text-sm font-medium ${totalWeight > carryingCapacity ? 'text-red-400' : 'text-white'}`}>
                  {totalWeight.toFixed(1)} / {carryingCapacity} lb
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">{gold} gp</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-400">{attunedCount}/{attunementSlots}</span>
                <span className="text-xs text-gray-500">attuned</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Total value: {totalValue} gp
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 py-2 flex gap-2 border-b border-white/10">
            {(['equipped', 'inventory', 'all'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab}
                <span className="ml-2 text-xs opacity-70">
                  ({tab === 'equipped'
                    ? equipment.filter(i => i.equipped).length
                    : tab === 'inventory'
                    ? equipment.filter(i => !i.equipped).length
                    : equipment.length})
                </span>
              </button>
            ))}
          </div>

          {/* Equipment List */}
          <div className="p-4 overflow-y-auto max-h-[calc(85vh-250px)]">
            {activeTab === 'equipped' ? (
              // Show slots view when viewing equipped
              <div className="space-y-2">
                {Object.entries(SLOT_INFO).filter(([slot]) => slot !== 'inventory').map(([slot, info]) => {
                  const slotKey = slot as EquipmentSlot;
                  const item = equippedBySlot[slotKey];
                  const Icon = info.icon;
                  const isExpanded = expandedSlots.has(slotKey);

                  return (
                    <div key={slot} className="border border-white/10 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSlot(slotKey)}
                        className="w-full p-3 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-white">{info.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item ? (
                            <span
                              className="text-sm font-medium"
                              style={{ color: RARITY_COLORS[item.rarity] }}
                            >
                              {item.name}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">Empty</span>
                          )}
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && item && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-3 bg-black/20 border-t border-white/10">
                              <ItemCard
                                item={item}
                                onUnequip={() => handleUnequip(item)}
                                onUse={onUseItem}
                                onAttune={onAttune}
                                onUnattune={onUnattune}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Show list view for inventory/all
              <div className="space-y-2">
                {filteredEquipment.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Backpack className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No items in {activeTab}</p>
                  </div>
                ) : (
                  filteredEquipment.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      showEquipButton={!item.equipped}
                      onEquip={(slot) => handleEquip(item, slot)}
                      onUnequip={() => handleUnequip(item)}
                      onUse={onUseItem}
                      onDrop={onDropItem}
                      onAttune={onAttune}
                      onUnattune={onUnattune}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Item Card Component
interface ItemCardProps {
  item: EquipmentItem;
  showEquipButton?: boolean;
  onEquip?: (slot: EquipmentSlot) => void;
  onUnequip?: () => void;
  onUse?: (itemId: string) => void;
  onDrop?: (itemId: string) => void;
  onAttune?: (itemId: string) => void;
  onUnattune?: (itemId: string) => void;
}

function ItemCard({
  item,
  showEquipButton,
  onEquip,
  onUnequip,
  onUse,
  onDrop,
  onAttune,
  onUnattune,
}: ItemCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showSlotSelect, setShowSlotSelect] = useState(false);

  return (
    <div
      className="p-3 bg-white/5 rounded-lg border transition-colors hover:bg-white/10"
      style={{ borderColor: `${RARITY_COLORS[item.rarity]}40` }}
    >
      {/* Item Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className="font-medium"
              style={{ color: RARITY_COLORS[item.rarity] }}
            >
              {item.name}
            </span>
            {item.attunement && (
              <span className={`text-xs px-1 rounded ${item.attuned ? 'bg-purple-500/30 text-purple-400' : 'bg-gray-500/30 text-gray-400'}`}>
                {item.attuned ? 'Attuned' : 'Requires Attunement'}
              </span>
            )}
            {item.equipped && (
              <span className="text-xs px-1 bg-green-500/30 text-green-400 rounded">
                Equipped
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span className="capitalize">{item.type}</span>
            <span>{item.weight} lb</span>
            <span>{item.value} gp</span>
            {item.damage && (
              <span className="text-red-400">{item.damage} {item.damageType}</span>
            )}
            {item.armorClass && (
              <span className="text-blue-400">AC {item.armorClass}</span>
            )}
            {item.charges !== undefined && (
              <span className="text-purple-400">{item.charges}/{item.maxCharges} charges</span>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="p-1 text-gray-400 hover:text-white"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Properties */}
      {item.properties && item.properties.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.properties.map((prop, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 bg-white/10 rounded text-gray-400">
              {prop}
            </span>
          ))}
        </div>
      )}

      {/* Expanded Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-white/10">
              {item.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-2 border-t border-white/10">
        {showEquipButton && onEquip && (
          <>
            {showSlotSelect ? (
              <div className="flex gap-1 flex-wrap">
                {Object.entries(SLOT_INFO)
                  .filter(([slot]) => slot !== 'inventory')
                  .map(([slot, info]) => (
                    <button
                      key={slot}
                      onClick={() => {
                        onEquip(slot as EquipmentSlot);
                        setShowSlotSelect(false);
                      }}
                      className="px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30"
                    >
                      {info.name}
                    </button>
                  ))}
                <button
                  onClick={() => setShowSlotSelect(false)}
                  className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSlotSelect(true)}
                className="px-3 py-1 text-xs bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Equip
              </button>
            )}
          </>
        )}

        {item.equipped && onUnequip && (
          <button
            onClick={onUnequip}
            className="px-3 py-1 text-xs bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30"
          >
            Unequip
          </button>
        )}

        {item.attunement && !item.attuned && onAttune && (
          <button
            onClick={() => onAttune(item.id)}
            className="px-3 py-1 text-xs bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30"
          >
            Attune
          </button>
        )}

        {item.attuned && onUnattune && (
          <button
            onClick={() => onUnattune(item.id)}
            className="px-3 py-1 text-xs bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30"
          >
            Unattune
          </button>
        )}

        {item.type === 'potion' && onUse && (
          <button
            onClick={() => onUse(item.id)}
            className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
          >
            Use
          </button>
        )}

        {onDrop && (
          <button
            onClick={() => onDrop(item.id)}
            className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 ml-auto"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export default EquipmentPanel;
