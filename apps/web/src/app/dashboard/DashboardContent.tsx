'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRequireAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { EnchantedCard } from '@/components/dnd/EnchantedCard';
import {
  SwordIcon,
  ScrollIcon,
  D20Icon,
  ClassIcon,
} from '@/components/dnd/DnDIcons';

interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  maxHitPoints: number;
  currentHitPoints: number;
  armorClass: number;
  createdAt: string;
  status: 'draft' | 'generating' | 'complete';
  portraitUrl?: string;
  fullBodyUrls?: string[];
  imageSource?: string;
  background?: string;
  subrace?: string;
  subclass?: string;
  speed?: number;
  initiative?: number;
  proficiencyBonus?: number;
  // Ability scores - flat fields from API
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  // Skills and proficiencies
  skills?: string[];
  savingThrows?: string[];
  languages?: string[];
  tools?: string[];
  weapons?: string[];
  armor?: string[];
  // Equipment and spells
  equipment?: unknown[];
  spellsKnown?: string[];
  spellsPrepared?: string[];
  spellcastingAbility?: string;
  // Appearance
  appearance?: {
    personalityTrait?: string;
    ideal?: string;
    bond?: string;
    flaw?: string;
    backstory?: string;
    hairColor?: string;
    eyeColor?: string;
    skinColor?: string;
    height?: string;
    weight?: string;
    distinguishingFeatures?: string;
  };
}

// Dynamic imports for heavy components
const AmbientParticles = dynamic(
  () => import('@/components/dnd/AmbientParticles').then((mod) => mod.AmbientParticles),
  { ssr: false }
);

const FloatingRunes = dynamic(
  () => import('@/components/dnd/AtmosphericBackground').then((mod) => mod.FloatingRunes),
  { ssr: false }
);

// Card animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

// Character card hover animation
const characterCardVariants = {
  idle: { scale: 1, rotateY: 0 },
  hover: {
    scale: 1.02,
    rotateY: 2,
    transition: { duration: 0.3 }
  },
};

// Character Trading Card Modal - Larger format with prominent image display
interface CharacterCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character | null;
}

function CharacterCardModal({ isOpen, onClose, character }: CharacterCardModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen || !character) return null;

  // Build array of available images
  const imageList: { url: string; label: string }[] = [];
  if (character.portraitUrl) {
    imageList.push({ url: character.portraitUrl, label: 'Portrait' });
  }
  if (character.fullBodyUrls && character.fullBodyUrls.length > 0) {
    character.fullBodyUrls.forEach((url, index) => {
      if (url) {
        const labels = ['Heroic Pose', 'Action Pose'];
        imageList.push({ url, label: labels[index] || `Full Body ${index + 1}` });
      }
    });
  }

  const hasImages = imageList.length > 0;
  const currentImage = hasImages ? (imageList[currentImageIndex] || imageList[0]) : null;
  const hasMultipleImages = imageList.length > 1;
  const isGenerating = character.status === 'generating';

  // Use flat ability scores from API
  const abilities = {
    strength: character.strength ?? 10,
    dexterity: character.dexterity ?? 10,
    constitution: character.constitution ?? 10,
    intelligence: character.intelligence ?? 10,
    wisdom: character.wisdom ?? 10,
    charisma: character.charisma ?? 10,
  };
  const proficiencyBonus = Math.floor((character.level - 1) / 4) + 2;
  const hp = character.maxHitPoints || 10;
  const ac = character.armorClass || 10;
  const speed = character.speed || 30;

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
  };

  // Print handler - trading card 2.5" x 3.5" (standard trading card size)
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // 2.5" x 3.5" at 96 DPI = 240px x 336px
    const cardHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${character.name} - Character Card</title>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cinzel+Decorative:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;1,400&display=swap" rel="stylesheet">
        <style>
          @page { size: 2.5in 3.5in; margin: 0; }
          @media print {
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: white; }
          .card {
            width: 2.5in;
            height: 3.5in;
            background: linear-gradient(160deg, #2d2640 0%, #1f1a2e 30%, #171320 60%, #0d0a12 100%);
            border-radius: 8px;
            border: 2px solid #D4A84B;
            padding: 6px;
            font-family: system-ui;
            color: white;
            display: flex;
            flex-direction: column;
          }
          .name { font-family: 'Cinzel', serif; font-size: 11px; font-weight: 700; color: #FFD700; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; text-shadow: 0 0 6px rgba(255, 215, 0, 0.5); margin-bottom: 2px; }
          .gold-bar { height: 1px; background: linear-gradient(90deg, transparent 5%, #92400E 20%, #D4A84B 50%, #92400E 80%, transparent 95%); margin: 2px 12px 4px; }
          .image-container { height: 115px; border: 1px solid #D4A84B; border-radius: 4px; overflow: hidden; margin: 0 2px 4px; background: radial-gradient(ellipse at center, #1a1625 0%, #0a0810 100%); display: flex; align-items: center; justify-content: center; }
          .image-container img { max-width: 100%; max-height: 100%; object-fit: contain; }
          .subtitle { font-family: 'Crimson Text', Georgia, serif; font-size: 8px; color: #e2e2e2; text-align: center; text-transform: capitalize; margin-bottom: 4px; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; margin: 0 2px 4px; }
          .stat-box { text-align: center; padding: 3px 1px; border-radius: 4px; border: 1px solid; }
          .stat-icon { font-size: 10px; }
          .stat-value { font-family: 'Cinzel', serif; font-size: 11px; font-weight: 700; }
          .stat-label { font-size: 6px; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 700; }
          .hp-stat { border-color: rgba(239, 68, 68, 0.7); background: linear-gradient(180deg, rgba(239, 68, 68, 0.3), rgba(0,0,0,0.5)); }
          .hp-stat .stat-icon { color: #EF4444; } .hp-stat .stat-value { color: #FCA5A5; } .hp-stat .stat-label { color: #EF4444; }
          .ac-stat { border-color: rgba(34, 211, 238, 0.7); background: linear-gradient(180deg, rgba(34, 211, 238, 0.3), rgba(0,0,0,0.5)); }
          .ac-stat .stat-icon { color: #22D3EE; } .ac-stat .stat-value { color: #A5F3FC; } .ac-stat .stat-label { color: #22D3EE; }
          .sp-stat { border-color: rgba(34, 197, 94, 0.7); background: linear-gradient(180deg, rgba(34, 197, 94, 0.3), rgba(0,0,0,0.5)); }
          .sp-stat .stat-icon { color: #22C55E; } .sp-stat .stat-value { color: #86EFAC; } .sp-stat .stat-label { color: #22C55E; }
          .pro-stat { border-color: rgba(168, 85, 247, 0.7); background: linear-gradient(180deg, rgba(168, 85, 247, 0.3), rgba(0,0,0,0.5)); }
          .pro-stat .stat-icon { color: #A855F7; } .pro-stat .stat-value { color: #D8B4FE; } .pro-stat .stat-label { color: #A855F7; }
          .abilities { display: flex; justify-content: space-between; gap: 2px; margin: 0 2px 4px; }
          .ability-box { text-align: center; padding: 2px 2px; background: linear-gradient(180deg, rgba(245, 158, 11, 0.15), rgba(0,0,0,0.5)); border: 1px solid rgba(245, 158, 11, 0.6); border-radius: 3px; flex: 1; }
          .ability-name { font-size: 6px; font-weight: 700; color: #F59E0B; }
          .ability-value { font-family: 'Cinzel', serif; font-size: 9px; font-weight: 700; color: #FCD34D; }
          .motto { font-family: 'Crimson Text', Georgia, serif; font-style: italic; font-size: 7px; color: #d4d4d8; text-align: center; padding: 0 4px; line-height: 1.3; margin-bottom: 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 18px; }
          .logo { text-align: center; font-family: 'Cinzel Decorative', Cinzel, serif; font-size: 8px; font-weight: 900; letter-spacing: 0.5px; text-shadow: 0 0 6px rgba(212, 168, 75, 0.5); margin-top: auto; }
          .logo .gold { color: #D4A84B; }
          .logo .red { color: #E53935; text-shadow: 0 0 6px rgba(229, 57, 53, 0.5); margin: 0 2px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="name">${character.name}</div>
          <div class="gold-bar"></div>
          <div class="image-container">
            ${currentImage ? `<img src="${currentImage.url}" alt="${character.name}" />` : ''}
          </div>
          <div class="subtitle">${character.race} • ${character.class} • Level ${character.level}</div>
          <div class="stats-grid">
            <div class="stat-box hp-stat"><div class="stat-icon">❤️</div><div class="stat-value">${hp}</div><div class="stat-label">HP</div></div>
            <div class="stat-box ac-stat"><div class="stat-icon">🛡️</div><div class="stat-value">${ac}</div><div class="stat-label">AC</div></div>
            <div class="stat-box sp-stat"><div class="stat-icon">👟</div><div class="stat-value">${speed}</div><div class="stat-label">SP</div></div>
            <div class="stat-box pro-stat"><div class="stat-icon">⭐</div><div class="stat-value">+${proficiencyBonus}</div><div class="stat-label">PRO</div></div>
          </div>
          <div class="abilities">
            <div class="ability-box"><div class="ability-name">STR</div><div class="ability-value">${abilities.strength}</div></div>
            <div class="ability-box"><div class="ability-name">DEX</div><div class="ability-value">${abilities.dexterity}</div></div>
            <div class="ability-box"><div class="ability-name">CON</div><div class="ability-value">${abilities.constitution}</div></div>
            <div class="ability-box"><div class="ability-name">INT</div><div class="ability-value">${abilities.intelligence}</div></div>
            <div class="ability-box"><div class="ability-name">WIS</div><div class="ability-value">${abilities.wisdom}</div></div>
            <div class="ability-box"><div class="ability-name">CHA</div><div class="ability-value">${abilities.charisma}</div></div>
          </div>
          <div class="motto">"${character.appearance?.personalityTrait?.substring(0, 80) || 'Fortune favors the bold.'}"</div>
          <div class="logo"><span class="gold">DUNGEONS</span><span class="red">&</span><span class="gold">DRAGONS</span></div>
        </div>
        <script>window.onload = () => { setTimeout(() => window.print(), 500); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(cardHtml);
    printWindow.document.close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-4"
          >
            {/* Trading Card Container - rich dark fantasy style */}
            <div
              className="relative"
              style={{
                width: '320px',
                height: '520px',
                background: 'linear-gradient(160deg, #2d2640 0%, #1f1a2e 30%, #171320 60%, #0d0a12 100%)',
                borderRadius: '16px',
                boxShadow: '0 0 80px rgba(245, 158, 11, 0.35), 0 0 40px rgba(168, 85, 247, 0.15), 0 12px 40px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                border: '3px solid #D4A84B',
              }}
            >
              {/* Inner glow effect */}
              <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ boxShadow: 'inset 0 0 40px rgba(245, 158, 11, 0.1)' }} />

              {/* Header with Name and Rarity Stars */}
              <div
                className="flex flex-col items-center justify-center px-4 pt-3 pb-1"
                style={{ background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.15) 0%, rgba(245, 158, 11, 0.08) 50%, transparent 100%)' }}
              >
                <h2
                  className="text-sm font-bold uppercase tracking-wider text-center truncate w-full"
                  style={{
                    fontFamily: 'Cinzel, serif',
                    color: '#FFD700',
                    textShadow: '0 0 15px rgba(255, 215, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  {character.name || 'Unnamed Hero'}
                </h2>
              </div>

              {/* Ornate Gold Bar - thinner */}
              <div
                className="mx-6 mb-2"
                style={{
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent 0%, #92400E 10%, #F59E0B 40%, #FFD700 50%, #F59E0B 60%, #92400E 90%, transparent 100%)',
                  boxShadow: '0 0 8px rgba(255, 215, 0, 0.4)',
                  borderRadius: '1px',
                }}
              />

              {/* Image Section - with ornate frame */}
              <div
                className="mx-3 relative overflow-hidden"
                style={{
                  height: '210px',
                  borderRadius: '8px',
                  border: '2px solid #D4A84B',
                  background: 'radial-gradient(ellipse at center, #1a1625 0%, #110e18 50%, #0a0810 100%)',
                  boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 168, 75, 0.25), 0 4px 12px rgba(0, 0, 0, 0.5)',
                }}
              >
                {hasImages && currentImage ? (
                  <>
                    <img
                      src={currentImage.url}
                      alt={character.name}
                      className="w-full h-full object-contain"
                    />
                    {/* Navigation Arrows - only show if multiple images */}
                    {hasMultipleImages && (
                      <>
                        <button
                          onClick={goToPrevious}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold hover:scale-110 transition-transform"
                          style={{
                            background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.3) 0%, rgba(0, 0, 0, 0.9) 100%)',
                            border: '2px solid #F59E0B',
                            color: '#FFD700',
                            boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)'
                          }}
                        >
                          ‹
                        </button>
                        <button
                          onClick={goToNext}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold hover:scale-110 transition-transform"
                          style={{
                            background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.3) 0%, rgba(0, 0, 0, 0.9) 100%)',
                            border: '2px solid #F59E0B',
                            color: '#FFD700',
                            boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)'
                          }}
                        >
                          ›
                        </button>
                        {/* Image Counter - "1/3" style like mockup */}
                        <div
                          className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-semibold"
                          style={{
                            background: 'rgba(0, 0, 0, 0.7)',
                            color: '#D4A84B',
                            border: '1px solid rgba(212, 168, 75, 0.5)',
                            textShadow: '0 0 4px rgba(212, 168, 75, 0.4)'
                          }}
                        >
                          {currentImageIndex + 1}/{imageList.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    {isGenerating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          className="text-5xl"
                        >
                          🎨
                        </motion.div>
                        <p className="text-amber-400 text-sm mt-2">Generating artwork...</p>
                      </>
                    ) : (
                      <ClassIcon characterClass={character.class} size={64} color="#FFD700" />
                    )}
                  </div>
                )}
              </div>

              {/* Character Subtitle */}
              <p
                className="text-center text-sm py-2 capitalize"
                style={{
                  fontFamily: 'Crimson Text, Georgia, serif',
                  color: '#e2e2e2',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                }}
              >
                {character.race} • {character.class} • Level {character.level}
              </p>

              {/* Stats Grid (HP, AC, SP, PRO) - D&D combat stats */}
              <div className="mx-3 grid grid-cols-4 gap-2">
                {/* HP - Red */}
                <div className="text-center py-2 rounded-lg" style={{ background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.35) 0%, rgba(153, 27, 27, 0.25) 50%, rgba(0, 0, 0, 0.5) 100%)', border: '2px solid rgba(239, 68, 68, 0.7)', boxShadow: '0 0 15px rgba(239, 68, 68, 0.3), inset 0 0 20px rgba(239, 68, 68, 0.1)' }}>
                  <div className="text-xl" style={{ filter: 'drop-shadow(0 0 8px #EF4444)', textShadow: '0 0 15px #EF4444' }}>❤️</div>
                  <div className="text-lg font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#FCA5A5', textShadow: '0 0 10px rgba(252, 165, 165, 0.6)' }}>{hp}</div>
                  <div className="text-[8px] uppercase tracking-wider font-bold" style={{ color: '#EF4444', textShadow: '0 0 6px rgba(239, 68, 68, 0.5)' }}>HP</div>
                </div>
                {/* AC - Cyan/Blue */}
                <div className="text-center py-2 rounded-lg" style={{ background: 'linear-gradient(180deg, rgba(34, 211, 238, 0.35) 0%, rgba(6, 95, 70, 0.25) 50%, rgba(0, 0, 0, 0.5) 100%)', border: '2px solid rgba(34, 211, 238, 0.7)', boxShadow: '0 0 15px rgba(34, 211, 238, 0.3), inset 0 0 20px rgba(34, 211, 238, 0.1)' }}>
                  <div className="text-xl" style={{ filter: 'drop-shadow(0 0 8px #22D3EE)', textShadow: '0 0 15px #22D3EE' }}>🛡️</div>
                  <div className="text-lg font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#A5F3FC', textShadow: '0 0 10px rgba(165, 243, 252, 0.6)' }}>{ac}</div>
                  <div className="text-[8px] uppercase tracking-wider font-bold" style={{ color: '#22D3EE', textShadow: '0 0 6px rgba(34, 211, 238, 0.5)' }}>AC</div>
                </div>
                {/* Speed - Green */}
                <div className="text-center py-2 rounded-lg" style={{ background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.35) 0%, rgba(6, 78, 59, 0.25) 50%, rgba(0, 0, 0, 0.5) 100%)', border: '2px solid rgba(34, 197, 94, 0.7)', boxShadow: '0 0 15px rgba(34, 197, 94, 0.3), inset 0 0 20px rgba(34, 197, 94, 0.1)' }}>
                  <div className="text-xl" style={{ filter: 'drop-shadow(0 0 8px #22C55E)', textShadow: '0 0 15px #22C55E' }}>👟</div>
                  <div className="text-lg font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#86EFAC', textShadow: '0 0 10px rgba(134, 239, 172, 0.6)' }}>{speed}</div>
                  <div className="text-[8px] uppercase tracking-wider font-bold" style={{ color: '#22C55E', textShadow: '0 0 6px rgba(34, 197, 94, 0.5)' }}>SP</div>
                </div>
                {/* Proficiency - Purple */}
                <div className="text-center py-2 rounded-lg" style={{ background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.35) 0%, rgba(88, 28, 135, 0.25) 50%, rgba(0, 0, 0, 0.5) 100%)', border: '2px solid rgba(168, 85, 247, 0.7)', boxShadow: '0 0 15px rgba(168, 85, 247, 0.3), inset 0 0 20px rgba(168, 85, 247, 0.1)' }}>
                  <div className="text-xl" style={{ filter: 'drop-shadow(0 0 8px #A855F7)', textShadow: '0 0 15px #A855F7' }}>⭐</div>
                  <div className="text-lg font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#D8B4FE', textShadow: '0 0 10px rgba(216, 180, 254, 0.6)' }}>+{proficiencyBonus}</div>
                  <div className="text-[8px] uppercase tracking-wider font-bold" style={{ color: '#A855F7', textShadow: '0 0 6px rgba(168, 85, 247, 0.5)' }}>PRO</div>
                </div>
              </div>

              {/* Ability Scores Row - richer gold styling */}
              <div className="mx-3 mt-2 flex justify-between gap-1.5">
                {[
                  { name: 'STR', value: abilities.strength },
                  { name: 'DEX', value: abilities.dexterity },
                  { name: 'CON', value: abilities.constitution },
                  { name: 'INT', value: abilities.intelligence },
                  { name: 'WIS', value: abilities.wisdom },
                  { name: 'CHA', value: abilities.charisma },
                ].map((ability) => (
                  <div
                    key={ability.name}
                    className="text-center px-1 py-1.5 rounded-md flex-1"
                    style={{
                      background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.15) 0%, rgba(0, 0, 0, 0.6) 100%)',
                      border: '1px solid rgba(245, 158, 11, 0.6)',
                      boxShadow: '0 0 8px rgba(245, 158, 11, 0.15), inset 0 0 10px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <div className="text-[7px] font-bold tracking-wide" style={{ color: '#F59E0B', textShadow: '0 0 4px rgba(245, 158, 11, 0.4)' }}>{ability.name}</div>
                    <div className="text-sm font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#FCD34D', textShadow: '0 0 8px rgba(252, 211, 77, 0.4)' }}>{ability.value}</div>
                  </div>
                ))}
              </div>

              {/* Motto/Quote - single line */}
              <div className="px-4 pt-1.5 text-center">
                <p
                  className="text-xs italic truncate"
                  style={{
                    fontFamily: 'Crimson Text, Georgia, serif',
                    lineHeight: '1.3',
                    color: '#d4d4d8'
                  }}
                >
                  {character.appearance?.personalityTrait
                    ? `"${character.appearance.personalityTrait.substring(0, 45)}${character.appearance.personalityTrait.length > 45 ? '...' : ''}"`
                    : '"Fortune favors the bold."'}
                </p>
              </div>

              {/* D&D Logo - single line text with styled ampersand */}
              <div className="flex justify-center items-center pt-1 pb-2">
                <span
                  style={{
                    fontFamily: 'var(--font-cinzel-decorative), Cinzel Decorative, serif',
                    fontSize: '14px',
                    fontWeight: 900,
                    letterSpacing: '1px',
                    textShadow: '0 0 12px rgba(212, 168, 75, 0.6), 0 2px 4px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  <span style={{ color: '#D4A84B' }}>DUNGEONS</span>
                  <span style={{ color: '#E53935', margin: '0 4px', textShadow: '0 0 12px rgba(229, 57, 53, 0.6)' }}>&</span>
                  <span style={{ color: '#D4A84B' }}>DRAGONS</span>
                </span>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform z-20 text-sm font-bold"
                style={{
                  background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.9) 100%)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  color: '#ffffff'
                }}
              >
                ✕
              </button>
            </div>

            {/* Print Button - Below the card */}
            <motion.button
              onClick={handlePrint}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-sm"
              style={{
                background: 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)',
                color: '#000',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
                border: '2px solid #FFD700'
              }}
            >
              <span>🖨️</span> Print Card
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useRequireAuth('/login');
  const { logout, token } = useAuthStore(state => ({ logout: state.logout, token: state.token }));
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [showCreatedMessage, setShowCreatedMessage] = useState(false);
  const [generatingCharacterId, setGeneratingCharacterId] = useState<string | null>(null);
  const [showCharacterCard, setShowCharacterCard] = useState<string | null>(null);

  // Handle image generation for newly created character
  useEffect(() => {
    const characterId = searchParams?.get('characterId');
    const shouldGenerateImages = searchParams?.get('generateImages') === 'true';

    if (characterId && shouldGenerateImages && token) {
      // Clear URL params
      router.replace('/dashboard', { scroll: false });

      // Set generating state
      setGeneratingCharacterId(characterId);
      setShowCreatedMessage(true);

      // Trigger image generation
      const generateImages = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
          const response = await fetch(`${apiUrl}/characters/${characterId}/generate-images`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const result = await response.json();
            // Update the character in state with new images
            setCharacters(prev => prev.map(char =>
              char.id === characterId
                ? {
                    ...char,
                    status: 'complete',
                    portraitUrl: result.character?.portraitUrl,
                    fullBodyUrls: result.character?.fullBodyUrls,
                    imageSource: result.source,
                  }
                : char
            ));
          }
        } catch (error) {
          console.error('Failed to generate images:', error);
        } finally {
          setGeneratingCharacterId(null);
          setTimeout(() => setShowCreatedMessage(false), 3000);
        }
      };

      generateImages();
    }
  }, [searchParams, token, router]);

  // Check if we just created a character (legacy support)
  useEffect(() => {
    if (searchParams?.get('created') === 'true') {
      setShowCreatedMessage(true);
      router.replace('/dashboard', { scroll: false });
      setTimeout(() => setShowCreatedMessage(false), 5000);
    }
  }, [searchParams, router]);

  // Fetch characters
  useEffect(() => {
    const fetchCharacters = async () => {
      if (!token) return;

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/characters`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCharacters(data.characters || []);
        }
      } catch (error) {
        console.error('Failed to fetch characters:', error);
      } finally {
        setLoadingCharacters(false);
      }
    };

    if (user) {
      fetchCharacters();
    }
  }, [token, user]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="dnd-page-background" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <D20Icon size={48} color="#F59E0B" animate />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Multi-layer background */}
      <div className="dnd-page-background" />

      {/* Enhanced background layers */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl bg-primary/5"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl bg-secondary/5"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* Floating runes in background */}
      <Suspense fallback={null}>
        <FloatingRunes />
      </Suspense>

      {/* Particles */}
      <Suspense fallback={null}>
        <AmbientParticles variant="dust" />
      </Suspense>

      {/* Vignette */}
      <div className="dnd-vignette" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass border-b border-border/50 backdrop-blur-md"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="group flex items-center gap-2">
                <motion.div
                  whileHover={{ rotate: 20 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <D20Icon size={28} color="#F59E0B" />
                </motion.div>
                <span className="dnd-heading-epic text-2xl pb-0 logo-glow-pulse">
                  D&D Board
                </span>
              </Link>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-text-muted">Welcome back,</p>
                  <p className="font-medium text-primary">{user.displayName}</p>
                </div>

                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-bg-primary font-bold shadow-glow cursor-pointer"
                >
                  {user.displayName.charAt(0).toUpperCase()}
                </motion.div>

                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-stone text-sm px-4 py-2"
                >
                  Logout
                </motion.button>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="dnd-heading-epic text-4xl pb-4">
              Your Quest Board
            </h1>
            <p className="text-text-secondary dnd-flavor">
              &quot;What adventure calls to you today, brave {user.displayName}?&quot;
            </p>
          </motion.div>

          {/* Success Message */}
          <AnimatePresence>
            {showCreatedMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="col-span-full mb-4 p-4 rounded-lg bg-success/10 border border-success/30 text-success flex items-center gap-3"
              >
                {generatingCharacterId ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      🎨
                    </motion.div>
                    Character created! Generating AI artwork... This may take a moment.
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, repeat: 3 }}
                    >
                      ✨
                    </motion.div>
                    Character created successfully! Your hero is ready for adventure.
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Characters Card */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <EnchantedCard showCorners hover className="h-full">
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    whileHover={{ rotate: 12, scale: 1.1 }}
                    className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30"
                  >
                    <SwordIcon size={28} color="#F59E0B" />
                  </motion.div>
                  <div>
                    <h3 className="dnd-heading-section text-lg mb-0 border-none pb-0">
                      My Heroes
                    </h3>
                    <p className="text-sm text-text-muted">
                      {loadingCharacters ? 'Loading...' : `${characters.length} character${characters.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                <p className="text-text-secondary text-sm mb-4">
                  Create and manage your D&D 5e characters with the full character builder.
                </p>
                <Link href="/characters/create">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-adventure w-full text-center"
                  >
                    Create Character
                  </motion.button>
                </Link>
              </EnchantedCard>
            </motion.div>

            {/* Campaigns Card */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              <EnchantedCard variant="magical" showCorners hover className="h-full">
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    whileHover={{ rotate: -12, scale: 1.1 }}
                    className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center border border-secondary/30"
                  >
                    <ScrollIcon size={28} color="#8B5CF6" />
                  </motion.div>
                  <div>
                    <h3 className="dnd-heading-section text-lg mb-0 border-none pb-0" style={{ color: '#A78BFA' }}>
                      Campaigns
                    </h3>
                    <p className="text-sm text-text-muted">0 campaigns</p>
                  </div>
                </div>
                <p className="text-text-secondary text-sm mb-4">
                  Join existing campaigns or create your own adventure as a Dungeon Master.
                </p>
                <button className="btn-magic w-full opacity-60" disabled>
                  Coming in Phase 6
                </button>
              </EnchantedCard>
            </motion.div>

            {/* Quick Play Card */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={2}
            >
              <EnchantedCard variant="legendary" showCorners hover className="h-full">
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    whileHover={{ rotate: 20, scale: 1.1 }}
                    className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/30 to-amber-500/10 flex items-center justify-center border border-amber-500/30"
                  >
                    <D20Icon size={28} color="#F59E0B" />
                  </motion.div>
                  <div>
                    <h3 className="dnd-heading-section text-lg mb-0 border-none pb-0">
                      Quick Play
                    </h3>
                    <p className="text-sm text-text-muted">Jump right in</p>
                  </div>
                </div>
                <p className="text-text-secondary text-sm mb-4">
                  Start a quick game session with pre-made characters and scenarios.
                </p>
                <button className="btn-stone w-full opacity-60" disabled>
                  Coming in Phase 5
                </button>
              </EnchantedCard>
            </motion.div>
          </div>

          {/* Character List Section */}
          <AnimatePresence>
            {characters.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-12"
              >
                <div className="dnd-divider mb-8" />
                <div className="flex items-center justify-between mb-6">
                  <h2 className="dnd-heading-section text-xl">
                    Your Heroes
                  </h2>
                  <Link href="/characters/create">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-stone text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <span className="text-primary">+</span> New Character
                    </motion.button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {characters.map((char, index) => {
                    const isGenerating = generatingCharacterId === char.id || char.status === 'generating';
                    const hasImages = char.status === 'complete' && char.portraitUrl;

                    return (
                      <motion.div
                        key={char.id}
                        variants={characterCardVariants}
                        initial="idle"
                        whileHover="hover"
                        custom={index}
                        style={{ perspective: 1000 }}
                      >
                        <EnchantedCard hover className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Character Portrait or Class Icon */}
                            <div className="relative">
                              {hasImages && char.portraitUrl ? (
                                <button
                                  onClick={() => setShowCharacterCard(char.id)}
                                  className="w-12 h-12 rounded-lg overflow-hidden border-2 border-primary/50 hover:border-primary transition-colors cursor-pointer"
                                  title="View character card"
                                >
                                  <img
                                    src={char.portraitUrl}
                                    alt={char.name}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                                  {isGenerating ? (
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                      className="text-xl"
                                    >
                                      🎨
                                    </motion.div>
                                  ) : (
                                    <ClassIcon characterClass={char.class} size={24} color="#F59E0B" />
                                  )}
                                </div>
                              )}
                              {/* Status badge */}
                              {isGenerating && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-warning flex items-center justify-center">
                                  <motion.div
                                    animate={{ scale: [1, 1.3, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="w-2 h-2 rounded-full bg-white"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-display font-semibold text-lg text-text-primary">
                                {char.name}
                              </h3>
                              <p className="text-sm text-text-secondary capitalize">
                                {char.race} {char.class}
                              </p>
                              {isGenerating && (
                                <p className="text-xs text-warning mt-1">Generating images...</p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setShowCharacterCard(char.id)}
                              className="btn-adventure text-xs px-3 py-1 flex-1"
                            >
                              View Card
                            </motion.button>
                            <Link href={`/characters/${char.id}`} className="flex-1">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="btn-adventure text-xs px-3 py-1 w-full"
                              >
                                View Details
                              </motion.button>
                            </Link>
                          </div>
                        </EnchantedCard>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Account Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <div className="dnd-divider mb-8" />
            <h2 className="dnd-heading-section text-xl mb-6 flex items-center gap-3">
              <ScrollIcon size={24} color="#F59E0B" />
              Hero&apos;s Chronicle
            </h2>
            <EnchantedCard className="relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

              <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center text-[10px]">@</span>
                    Email
                  </p>
                  <p className="text-text-primary">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center text-[10px]">#</span>
                    Username
                  </p>
                  <p className="text-primary">@{user.username}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center text-[10px]">✦</span>
                    Display Name
                  </p>
                  <p className="text-text-primary">{user.displayName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center text-[10px]">📅</span>
                    Adventure Began
                  </p>
                  <p className="text-text-primary">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </EnchantedCard>
          </motion.div>
        </main>
      </div>

      {/* Character Card Modal */}
      <CharacterCardModal
        isOpen={!!showCharacterCard}
        onClose={() => setShowCharacterCard(null)}
        character={characters.find(c => c.id === showCharacterCard) || null}
      />
    </div>
  );
}
