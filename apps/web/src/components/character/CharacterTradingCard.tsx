'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Types
interface CharacterCardData {
  name: string;
  race: string;
  class: string;
  level: number;
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  armorClass: number;
  maxHitPoints: number;
  motto?: string;
  images: {
    portrait: string;
    heroicPose?: string;
    actionPose?: string;
  };
}

interface CharacterTradingCardProps {
  character: CharacterCardData;
  onPrint?: () => void;
}

// Utility functions
function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function getProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

function getSpellcastingAbility(characterClass: string): keyof CharacterCardData['abilityScores'] | null {
  const spellcastingMap: Record<string, keyof CharacterCardData['abilityScores']> = {
    'Wizard': 'intelligence',
    'Artificer': 'intelligence',
    'Cleric': 'wisdom',
    'Druid': 'wisdom',
    'Ranger': 'wisdom',
    'Monk': 'wisdom',
    'Bard': 'charisma',
    'Paladin': 'charisma',
    'Sorcerer': 'charisma',
    'Warlock': 'charisma',
  };
  return spellcastingMap[characterClass] || null;
}

function calculateRarity(race: string, characterClass: string): number {
  const rareRaces = ['Tiefling', 'Dragonborn', 'Aasimar', 'Drow', 'Genasi', 'Goliath', 'Firbolg'];
  const rareClasses = ['Warlock', 'Sorcerer', 'Paladin', 'Monk', 'Artificer'];

  let rarity = 1;

  if (rareRaces.includes(race)) rarity += 2;
  if (rareClasses.includes(characterClass)) rarity += 1;

  // Legendary combinations
  if (race === 'Aasimar' && characterClass === 'Paladin') rarity = 5;
  if (race === 'Drow' && characterClass === 'Wizard') rarity = 5;
  if (race === 'Tiefling' && characterClass === 'Warlock') rarity = 4;

  return Math.min(rarity, 5);
}

function calculateStats(character: CharacterCardData) {
  const profBonus = getProficiencyBonus(character.level);
  const spellcastingAbility = getSpellcastingAbility(character.class);

  const power = Math.max(
    character.abilityScores.strength,
    character.abilityScores.dexterity
  );

  const magic = spellcastingAbility
    ? getAbilityModifier(character.abilityScores[spellcastingAbility]) + profBonus
    : 0;

  return {
    power,
    defense: character.armorClass,
    magic,
    hp: character.maxHitPoints,
  };
}

// Star Rating Component
function RarityStars({ count }: { count: number }) {
  return (
    <div className="flex gap-[3px] mt-[2px]">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-[10px] ${
            star <= count
              ? 'text-primary drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]'
              : 'text-zinc-700'
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// Stat Box Component
function StatBox({
  icon,
  value,
  label,
  colorClass,
}: {
  icon: string;
  value: number | string;
  label: string;
  colorClass: 'power' | 'defense' | 'magic' | 'hp';
}) {
  const colorStyles = {
    power: {
      icon: 'text-[#FF6B6B] drop-shadow-[0_0_10px_#FF6B6B] drop-shadow-[0_0_16px_#FF6B6B]',
      value: 'text-[#FCA5A5] drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]',
      label: 'text-[#EF4444]',
      bar: 'bg-gradient-to-r from-transparent via-[#EF4444] to-transparent',
    },
    defense: {
      icon: 'text-[#7DD3FC] drop-shadow-[0_0_10px_#7DD3FC] drop-shadow-[0_0_16px_#7DD3FC]',
      value: 'text-[#BAE6FD] drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]',
      label: 'text-[#38BDF8]',
      bar: 'bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent',
    },
    magic: {
      icon: 'text-[#C4B5FD] drop-shadow-[0_0_10px_#C4B5FD] drop-shadow-[0_0_16px_#C4B5FD]',
      value: 'text-[#DDD6FE] drop-shadow-[0_0_8px_rgba(167,139,250,0.4)]',
      label: 'text-[#A78BFA]',
      bar: 'bg-gradient-to-r from-transparent via-[#A78BFA] to-transparent',
    },
    hp: {
      icon: 'text-[#86EFAC] drop-shadow-[0_0_10px_#86EFAC] drop-shadow-[0_0_16px_#86EFAC]',
      value: 'text-[#BBF7D0] drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]',
      label: 'text-[#4ADE80]',
      bar: 'bg-gradient-to-r from-transparent via-[#4ADE80] to-transparent',
    },
  };

  const styles = colorStyles[colorClass];

  return (
    <div className="text-center bg-gradient-to-b from-black/40 to-black/60 rounded p-[3px_2px] border border-primary/30 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${styles.bar}`} />
      <div className={`text-[16px] mb-[1px] ${styles.icon} brightness-150`}>
        {icon}
      </div>
      <div className={`font-cinzel text-[14px] font-bold ${styles.value}`}>
        {value}
      </div>
      <div className={`text-[6px] uppercase tracking-[0.5px] font-semibold ${styles.label}`}>
        {label}
      </div>
    </div>
  );
}

// Ability Score Box Component
function AbilityBox({ name, value }: { name: string; value: number }) {
  return (
    <div className="text-center p-[2px_4px] bg-black/30 border border-primary/40 rounded min-w-[28px]">
      <div className="text-[7px] text-primary font-semibold">{name}</div>
      <div className="text-[10px] font-bold text-[#FCD34D] drop-shadow-[0_0_4px_rgba(252,211,77,0.3)]">
        {value}
      </div>
    </div>
  );
}

// Main Component
export function CharacterTradingCard({ character, onPrint }: CharacterTradingCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const images = [
    character.images.portrait,
    character.images.heroicPose,
    character.images.actionPose,
  ].filter(Boolean) as string[];

  const rarity = calculateRarity(character.race, character.class);
  const stats = calculateStats(character);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Card Container - Standard trading card ratio */}
      <div
        ref={cardRef}
        className="w-[250px] h-[350px] relative print:w-[2.5in] print:h-[3.5in]"
      >
        <div className="w-full h-full bg-gradient-to-br from-[#2a2735] via-[#1e1b26] to-[#151218] rounded-[10px] overflow-hidden relative shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_0_60px_rgba(0,0,0,0.3)]">
          {/* Gold Frame Border */}
          <div className="absolute inset-0 border-[3px] border-primary rounded-[10px] pointer-events-none z-10" />

          {/* Header - Name and Stars */}
          <div className="flex flex-col items-center justify-center p-[6px_12px_4px] bg-gradient-to-b from-primary/10 to-transparent">
            <h2 className="font-cinzel text-[12px] font-bold text-primary uppercase tracking-[0.5px] text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              {character.name}
            </h2>
            <RarityStars count={rarity} />
          </div>

          {/* Ornate Bar */}
          <div className="h-[6px] mx-3 mb-[6px] rounded-[3px] bg-gradient-to-r from-transparent via-[#92400E] via-[30%] via-primary via-[50%] via-[#FCD34D] via-primary via-[70%] via-[#92400E] to-transparent shadow-[0_2px_8px_rgba(245,158,11,0.3)]" />

          {/* Image Section */}
          <div className="w-[calc(100%-24px)] h-[120px] mx-3 relative rounded-[6px] overflow-hidden bg-[#0f0d13] border-2 border-primary shadow-[inset_0_0_20px_rgba(0,0,0,0.5),0_2px_8px_rgba(0,0,0,0.3),0_0_10px_rgba(245,158,11,0.3)]">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={images[currentImageIndex]}
                alt={`${character.name} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </AnimatePresence>

            {/* Navigation Arrows (hidden on print) */}
            {images.length > 1 && (
              <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-1 pointer-events-none print:hidden">
                <motion.button
                  onClick={handlePrevImage}
                  className="w-6 h-6 bg-black/70 border border-primary/50 rounded-full text-primary flex items-center justify-center cursor-pointer pointer-events-auto"
                  whileHover={{ backgroundColor: 'rgba(245, 158, 11, 0.3)', borderColor: '#F59E0B' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronLeft size={12} />
                </motion.button>
                <motion.button
                  onClick={handleNextImage}
                  className="w-6 h-6 bg-black/70 border border-primary/50 rounded-full text-primary flex items-center justify-center cursor-pointer pointer-events-auto"
                  whileHover={{ backgroundColor: 'rgba(245, 158, 11, 0.3)', borderColor: '#F59E0B' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronRight size={12} />
                </motion.button>
              </div>
            )}

            {/* Image Counter (hidden on print) */}
            {images.length > 1 && (
              <div className="absolute bottom-[6px] right-[6px] bg-black/70 px-2 py-[2px] rounded-[10px] text-[9px] text-zinc-100 border border-primary/30 print:hidden">
                {currentImageIndex + 1}/{images.length}
              </div>
            )}
          </div>

          {/* Character Subtitle */}
          <p className="text-center text-[10px] text-zinc-400 p-[6px_12px_2px]">
            {character.race} • {character.class} • Lv.{character.level}
          </p>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-4 gap-1 p-1 mx-3 bg-black/20 border border-primary/40 rounded-[6px]">
            <StatBox icon="⚔" value={stats.power} label="PWR" colorClass="power" />
            <StatBox icon="🛡" value={stats.defense} label="DEF" colorClass="defense" />
            <StatBox icon="✨" value={stats.magic > 0 ? `+${stats.magic}` : '0'} label="MAG" colorClass="magic" />
            <StatBox icon="❤" value={stats.hp} label="HP" colorClass="hp" />
          </div>

          {/* Ability Scores Row */}
          <div className="flex justify-around p-[4px_8px] mx-3 mt-1 bg-black/20 border border-primary/30 rounded-[6px]">
            <AbilityBox name="STR" value={character.abilityScores.strength} />
            <AbilityBox name="DEX" value={character.abilityScores.dexterity} />
            <AbilityBox name="CON" value={character.abilityScores.constitution} />
            <AbilityBox name="INT" value={character.abilityScores.intelligence} />
            <AbilityBox name="WIS" value={character.abilityScores.wisdom} />
            <AbilityBox name="CHA" value={character.abilityScores.charisma} />
          </div>

          {/* Motto */}
          {character.motto && (
            <div className="p-[4px_14px_0] text-center">
              <p className="italic text-[9px] text-zinc-300 leading-[1.3] whitespace-nowrap overflow-hidden text-ellipsis">
                "{character.motto}"
              </p>
            </div>
          )}

          {/* D&D Logo */}
          <div className="absolute bottom-[3px] left-0 right-0 flex justify-center items-center">
            <div className="flex items-center">
              <span className="font-cinzel-decorative text-[12px] font-bold text-primary drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
                D
              </span>
              <span className="font-cinzel-decorative text-[16px] text-primary mx-[1px] drop-shadow-[0_0_10px_rgba(245,158,11,0.5),0_1px_4px_rgba(0,0,0,0.5)]">
                &
              </span>
              <span className="font-cinzel-decorative text-[12px] font-bold text-primary drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
                D
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Print Button (outside card, hidden on print) */}
      <motion.button
        onClick={handlePrint}
        className="mt-4 px-6 py-2 bg-gradient-to-r from-primary to-[#D97706] text-[#0f0d13] font-cinzel font-semibold rounded-md print:hidden"
        whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)' }}
        whileTap={{ scale: 0.98 }}
      >
        Print Card
      </motion.button>
    </div>
  );
}

export default CharacterTradingCard;
