'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'artifact';
export type ItemType = 'weapon' | 'armor' | 'shield' | 'potion' | 'scroll' | 'wondrous' | 'ring' | 'rod' | 'staff' | 'wand' | 'ammunition' | 'treasure' | 'tool' | 'consumable' | 'other';

export interface ItemProperties {
  damage?: string;
  damageType?: string;
  armorClass?: number;
  armorType?: string;
  weight?: number;
  properties?: string[];
  range?: string;
  attunement?: boolean;
  attunementRequirement?: string;
  charges?: number;
  recharge?: string;
}

export interface ItemData {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  properties: ItemProperties;
  value: number;
  valueUnit: 'cp' | 'sp' | 'ep' | 'gp' | 'pp';
  isIdentified: boolean;
  unidentifiedName?: string;
  unidentifiedDescription?: string;
  imageUrl?: string;
  tags: string[];
}

export interface ItemEditorProps {
  initialData?: Partial<ItemData>;
  campaignId?: string;
  onSave?: (data: ItemData) => void;
  onCancel?: () => void;
  className?: string;
}

const ITEM_TYPES: { id: ItemType; name: string; icon: string }[] = [
  { id: 'weapon', name: 'Weapon', icon: '⚔️' },
  { id: 'armor', name: 'Armor', icon: '🛡️' },
  { id: 'shield', name: 'Shield', icon: '🔰' },
  { id: 'potion', name: 'Potion', icon: '🧪' },
  { id: 'scroll', name: 'Scroll', icon: '📜' },
  { id: 'wondrous', name: 'Wondrous Item', icon: '✨' },
  { id: 'ring', name: 'Ring', icon: '💍' },
  { id: 'rod', name: 'Rod', icon: '🪄' },
  { id: 'staff', name: 'Staff', icon: '🏒' },
  { id: 'wand', name: 'Wand', icon: '🪄' },
  { id: 'ammunition', name: 'Ammunition', icon: '🏹' },
  { id: 'treasure', name: 'Treasure', icon: '💎' },
  { id: 'tool', name: 'Tool', icon: '🔧' },
  { id: 'consumable', name: 'Consumable', icon: '🍖' },
  { id: 'other', name: 'Other', icon: '📦' },
];

const RARITIES: { id: ItemRarity; name: string; color: string }[] = [
  { id: 'common', name: 'Common', color: 'text-gray-400' },
  { id: 'uncommon', name: 'Uncommon', color: 'text-green-400' },
  { id: 'rare', name: 'Rare', color: 'text-blue-400' },
  { id: 'very_rare', name: 'Very Rare', color: 'text-purple-400' },
  { id: 'legendary', name: 'Legendary', color: 'text-orange-400' },
  { id: 'artifact', name: 'Artifact', color: 'text-red-400' },
];

const DAMAGE_TYPES = [
  'Slashing', 'Piercing', 'Bludgeoning', 'Fire', 'Cold', 'Lightning', 'Thunder',
  'Poison', 'Acid', 'Necrotic', 'Radiant', 'Force', 'Psychic',
];

const WEAPON_PROPERTIES = [
  'Ammunition', 'Finesse', 'Heavy', 'Light', 'Loading', 'Range', 'Reach',
  'Special', 'Thrown', 'Two-Handed', 'Versatile',
];

const ARMOR_TYPES = ['Light', 'Medium', 'Heavy'];

export function ItemEditor({
  initialData,
  campaignId: _campaignId,
  onSave,
  onCancel,
  className,
}: ItemEditorProps) {
  const [data, setData] = useState<Partial<ItemData>>({
    id: initialData?.id || `item_${Date.now()}`,
    name: initialData?.name || '',
    type: initialData?.type || 'wondrous',
    rarity: initialData?.rarity || 'common',
    description: initialData?.description || '',
    properties: initialData?.properties || {},
    value: initialData?.value || 0,
    valueUnit: initialData?.valueUnit || 'gp',
    isIdentified: initialData?.isIdentified ?? true,
    unidentifiedName: initialData?.unidentifiedName,
    unidentifiedDescription: initialData?.unidentifiedDescription,
    imageUrl: initialData?.imageUrl,
    tags: initialData?.tags || [],
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'properties' | 'identification'>('basic');

  const updateProperty = useCallback((key: keyof ItemProperties, value: unknown) => {
    setData(prev => ({
      ...prev,
      properties: { ...prev.properties, [key]: value },
    }));
  }, []);

  const toggleWeaponProperty = useCallback((prop: string) => {
    setData(prev => {
      const current = prev.properties?.properties || [];
      const updated = current.includes(prop)
        ? current.filter(p => p !== prop)
        : [...current, prop];
      return {
        ...prev,
        properties: { ...prev.properties, properties: updated },
      };
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!data.name) return;
    onSave?.(data as ItemData);
  }, [data, onSave]);

  const selectedRarity = RARITIES.find(r => r.id === data.rarity);
  const selectedType = ITEM_TYPES.find(t => t.id === data.type);

  return (
    <div className={`bg-bg-card border border-border rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-xl">
            {selectedType?.icon || '📦'}
          </div>
          <div className="flex-1">
            <h3 className="font-cinzel font-bold text-text-primary">Item Editor</h3>
            <p className="text-xs text-text-muted">Create magical items and equipment</p>
          </div>
          <span className={`px-2 py-1 rounded text-xs ${selectedRarity?.color || 'text-gray-400'}`}>
            {selectedRarity?.name || 'Common'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['basic', 'properties', 'identification'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'basic' && (
            <motion.div
              key="basic"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Name */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Item Name</label>
                <input
                  type="text"
                  value={data.name || ''}
                  onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Flame Tongue Longsword"
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Type & Rarity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Item Type</label>
                  <select
                    value={data.type || 'wondrous'}
                    onChange={(e) => setData(prev => ({ ...prev, type: e.target.value as ItemType }))}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                  >
                    {ITEM_TYPES.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.icon} {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Rarity</label>
                  <select
                    value={data.rarity || 'common'}
                    onChange={(e) => setData(prev => ({ ...prev, rarity: e.target.value as ItemRarity }))}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                  >
                    {RARITIES.map(rarity => (
                      <option key={rarity.id} value={rarity.id}>
                        {rarity.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Value */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-text-secondary mb-1">Value</label>
                  <input
                    type="number"
                    min={0}
                    value={data.value || 0}
                    onChange={(e) => setData(prev => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Unit</label>
                  <select
                    value={data.valueUnit || 'gp'}
                    onChange={(e) => setData(prev => ({ ...prev, valueUnit: e.target.value as ItemData['valueUnit'] }))}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                  >
                    <option value="cp">CP</option>
                    <option value="sp">SP</option>
                    <option value="ep">EP</option>
                    <option value="gp">GP</option>
                    <option value="pp">PP</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Description</label>
                <textarea
                  value={data.description || ''}
                  onChange={(e) => setData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the item's appearance and magical properties..."
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50 h-32 resize-none"
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'properties' && (
            <motion.div
              key="properties"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Attunement */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.properties?.attunement || false}
                    onChange={(e) => updateProperty('attunement', e.target.checked)}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm text-text-secondary">Requires Attunement</span>
                </label>
              </div>

              {data.properties?.attunement && (
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Attunement Requirement</label>
                  <input
                    type="text"
                    value={data.properties?.attunementRequirement || ''}
                    onChange={(e) => updateProperty('attunementRequirement', e.target.value)}
                    placeholder="e.g., by a spellcaster"
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
              )}

              {/* Weapon Properties */}
              {data.type === 'weapon' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-text-secondary mb-1">Damage</label>
                      <input
                        type="text"
                        value={data.properties?.damage || ''}
                        onChange={(e) => updateProperty('damage', e.target.value)}
                        placeholder="e.g., 1d8"
                        className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-1">Damage Type</label>
                      <select
                        value={data.properties?.damageType || ''}
                        onChange={(e) => updateProperty('damageType', e.target.value)}
                        className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                      >
                        <option value="">Select...</option>
                        {DAMAGE_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-2">Weapon Properties</label>
                    <div className="flex flex-wrap gap-2">
                      {WEAPON_PROPERTIES.map(prop => (
                        <button
                          key={prop}
                          onClick={() => toggleWeaponProperty(prop)}
                          className={`px-2 py-1 rounded text-xs transition-colors ${
                            data.properties?.properties?.includes(prop)
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-bg-elevated text-text-secondary hover:bg-border'
                          }`}
                        >
                          {prop}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Range</label>
                    <input
                      type="text"
                      value={data.properties?.range || ''}
                      onChange={(e) => updateProperty('range', e.target.value)}
                      placeholder="e.g., 30/120 ft."
                      className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </>
              )}

              {/* Armor Properties */}
              {(data.type === 'armor' || data.type === 'shield') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Armor Class</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={data.properties?.armorClass || 0}
                      onChange={(e) => updateProperty('armorClass', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  {data.type === 'armor' && (
                    <div>
                      <label className="block text-sm text-text-secondary mb-1">Armor Type</label>
                      <select
                        value={data.properties?.armorType || ''}
                        onChange={(e) => updateProperty('armorType', e.target.value)}
                        className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                      >
                        <option value="">Select...</option>
                        {ARMOR_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Charges */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Charges</label>
                  <input
                    type="number"
                    min={0}
                    value={data.properties?.charges || 0}
                    onChange={(e) => updateProperty('charges', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Recharge</label>
                  <input
                    type="text"
                    value={data.properties?.recharge || ''}
                    onChange={(e) => updateProperty('recharge', e.target.value)}
                    placeholder="e.g., at dawn"
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Weight (lbs)</label>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={data.properties?.weight || 0}
                  onChange={(e) => updateProperty('weight', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'identification' && (
            <motion.div
              key="identification"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Is Identified */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.isIdentified ?? true}
                    onChange={(e) => setData(prev => ({ ...prev, isIdentified: e.target.checked }))}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm text-text-secondary">Item is Identified</span>
                </label>
              </div>

              <p className="text-xs text-text-muted">
                Unidentified items show a different name and description until the party uses Identify or similar magic.
              </p>

              {/* Unidentified Name */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Unidentified Name</label>
                <input
                  type="text"
                  value={data.unidentifiedName || ''}
                  onChange={(e) => setData(prev => ({ ...prev, unidentifiedName: e.target.value }))}
                  placeholder="e.g., Glowing Longsword"
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Unidentified Description */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Unidentified Description</label>
                <textarea
                  value={data.unidentifiedDescription || ''}
                  onChange={(e) => setData(prev => ({ ...prev, unidentifiedDescription: e.target.value }))}
                  placeholder="What the party sees before identifying the item..."
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50 h-24 resize-none"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Item Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={data.imageUrl || ''}
                    onChange={(e) => setData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                  />
                  {data.imageUrl && (
                    <div className="w-12 h-12 rounded border border-border overflow-hidden">
                      <img
                        src={data.imageUrl}
                        alt={data.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border flex justify-end gap-3">
        {onCancel && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            className="px-4 py-2 bg-bg-elevated text-text-secondary rounded-lg"
          >
            Cancel
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={!data.name}
          className="px-4 py-2 bg-primary text-bg-dark rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Item
        </motion.button>
      </div>
    </div>
  );
}

export default ItemEditor;
