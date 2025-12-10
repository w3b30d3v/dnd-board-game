'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getClassById } from '@/data/classes';
import { getBackgroundById } from '@/data/backgrounds';
import type { StepProps } from '../types';

// Equipment category icons
const CATEGORY_ICONS: Record<string, string> = {
  weapon: '⚔️',
  armor: '🛡️',
  adventuring: '🎒',
  tool: '🔧',
  default: '📦',
};

// Get icon for equipment item
function getEquipmentIcon(item: string): string {
  const lowerItem = item.toLowerCase();
  if (lowerItem.includes('sword') || lowerItem.includes('axe') || lowerItem.includes('bow') ||
      lowerItem.includes('dagger') || lowerItem.includes('mace') || lowerItem.includes('spear') ||
      lowerItem.includes('crossbow') || lowerItem.includes('javelin')) {
    return CATEGORY_ICONS.weapon;
  }
  if (lowerItem.includes('armor') || lowerItem.includes('mail') || lowerItem.includes('shield')) {
    return CATEGORY_ICONS.armor;
  }
  if (lowerItem.includes('pack') || lowerItem.includes('kit') || lowerItem.includes('tools')) {
    return CATEGORY_ICONS.tool;
  }
  return CATEGORY_ICONS.default;
}

export function EquipmentSelection({ character, onUpdate, onNext, onBack }: StepProps) {
  const classData = getClassById(character.class || '');
  const backgroundData = getBackgroundById(character.background || '');

  // Get starting equipment from class
  const startingEquipment = useMemo(() => {
    return classData?.startingEquipment || [];
  }, [classData]);

  // Get equipment from background (typically gold or specific items)
  const backgroundEquipment = useMemo(() => {
    return backgroundData?.equipment || [];
  }, [backgroundData]);

  const handleContinue = () => {
    // Combine class and background equipment
    const allEquipment = [...startingEquipment, ...backgroundEquipment];
    onUpdate({ equipment: allEquipment });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="dnd-heading-epic text-3xl pb-2">Starting Equipment</h2>
        <p className="text-text-secondary">
          Your class and background provide you with starting equipment.
        </p>
      </div>

      {/* Class Equipment */}
      <div className="space-y-4">
        <h3 className="dnd-heading-section text-xl mb-0 border-none pb-0">
          {classData?.name} Equipment
        </h3>
        <p className="text-sm text-text-muted">
          As a {classData?.name}, you start with the following equipment:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {startingEquipment.map((item, index) => (
            <motion.div
              key={`class-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-bg-dark border border-border"
            >
              <span className="text-xl">{getEquipmentIcon(item)}</span>
              <span className="text-text-primary capitalize">{item}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Background Equipment */}
      {backgroundEquipment.length > 0 && (
        <>
          <div className="dnd-divider my-6" />

          <div className="space-y-4">
            <h3 className="dnd-heading-section text-xl mb-0 border-none pb-0">
              {backgroundData?.name} Equipment
            </h3>
            <p className="text-sm text-text-muted">
              Your {backgroundData?.name} background also provides:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {backgroundEquipment.map((item, index) => (
                <motion.div
                  key={`bg-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (startingEquipment.length + index) * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-bg-dark border border-border"
                >
                  <span className="text-xl">{getEquipmentIcon(item)}</span>
                  <span className="text-text-primary capitalize">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
        <h4 className="font-semibold text-primary mb-2">Equipment Notes</h4>
        <ul className="text-sm text-text-secondary space-y-1">
          <li>• You can buy additional equipment with your starting gold during gameplay</li>
          <li>• Equipment can be traded, dropped, or given to other characters</li>
          <li>• Some equipment requires proficiency to use effectively</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button onClick={onBack} className="btn-stone px-6 py-3">
          Back
        </button>
        <button onClick={handleContinue} className="btn-adventure px-8 py-3 text-lg">
          Continue
        </button>
      </div>
    </div>
  );
}
