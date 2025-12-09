'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRaceById, getClassById, getBackgroundById, SKILLS } from '@/data';
import { calculateModifier, formatModifier } from '@/data/skills';
import { getClassTheme } from '@/lib/classThemes';
import {
  AnimatedStat,
  AbilityScoreDisplay,
  StatsRow,
  ShieldIcon,
  ClassIcon,
  SpellIcon,
} from '@/components/dnd';
import type { StepProps, AbilityName, CharacterData } from '../types';

interface ReviewCharacterProps extends StepProps {
  onComplete: (character: CharacterData) => Promise<void>;
}

// Animation variants
const sectionVariants = {
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

export function ReviewCharacter({ character, onBack, onComplete }: ReviewCharacterProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const race = getRaceById(character.race || '');
  const subrace = race?.subraces?.find(s => s.id === character.subrace);
  const classData = getClassById(character.class || '');
  const background = getBackgroundById(character.background || '');

  // Get class theme
  const classTheme = getClassTheme(character.class || '');

  // Calculate racial bonuses
  const racialBonuses: Partial<Record<AbilityName, number>> = {
    ...(race?.abilityBonuses || {}),
    ...(subrace?.abilityBonuses || {}),
  };

  // Get final ability scores
  const getFinalScore = (ability: AbilityName): number => {
    const base = character[ability] || 10;
    const bonus = racialBonuses[ability] || 0;
    return base + bonus;
  };

  // Calculate derived stats
  const conMod = calculateModifier(getFinalScore('constitution'));
  const dexMod = calculateModifier(getFinalScore('dexterity'));
  const hitDice = classData?.hitDice || 8;
  const maxHP = hitDice + conMod;
  const armorClass = 10 + dexMod;
  const initiative = dexMod;
  const proficiencyBonus = 2;
  const speed = race?.speed || 30;

  // Spellcasting info
  const spellcastingAbility = classData?.spellcasting?.ability;
  const spellcastingMod = spellcastingAbility
    ? calculateModifier(getFinalScore(spellcastingAbility as AbilityName))
    : 0;
  const spellSaveDC = spellcastingAbility ? 8 + proficiencyBonus + spellcastingMod : null;
  const spellAttackBonus = spellcastingAbility ? proficiencyBonus + spellcastingMod : null;

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);

    try {
      await onComplete(character as CharacterData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character');
      setIsCreating(false);
    }
  };

  const abilities: { id: AbilityName; name: string }[] = [
    { id: 'strength', name: 'STR' },
    { id: 'dexterity', name: 'DEX' },
    { id: 'constitution', name: 'CON' },
    { id: 'intelligence', name: 'INT' },
    { id: 'wisdom', name: 'WIS' },
    { id: 'charisma', name: 'CHA' },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="dnd-heading-epic text-3xl pb-2">Review Your Hero</h2>
        <p className="text-text-secondary">
          Review your character and begin your adventure!
        </p>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Character Header with Class Theme */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={0}
        className={`p-6 rounded-lg border relative overflow-hidden`}
        style={{
          background: `linear-gradient(135deg, ${classTheme.bgGlow}, transparent, ${classTheme.bgGlow})`,
          borderColor: classTheme.primary + '40',
        }}
      >
        {/* Animated background glow */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            background: `radial-gradient(ellipse at 30% 50%, ${classTheme.bgGlow}, transparent 70%)`,
          }}
        />

        <div className="relative flex items-start gap-6">
          {/* Character Portrait */}
          {character.portraitUrl && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-bg-medium border-2 overflow-hidden shadow-lg flex-shrink-0"
              style={{ borderColor: classTheme.primary }}
            >
              <img
                src={character.portraitUrl}
                alt={`${character.name} portrait`}
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}
          <div className="flex-1 flex items-start justify-between">
            <div>
              <motion.h3
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-display font-bold"
                style={{ color: classTheme.primary }}
              >
                {character.name}
              </motion.h3>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2 mt-2"
              >
                <ClassIcon characterClass={character.class || ''} size={20} color={classTheme.icon} />
                <span className="text-lg text-text-secondary">
                  {race?.name}{subrace ? ` (${subrace.name})` : ''} {classData?.name}
                </span>
              </motion.div>
              <p className="text-sm text-text-muted mt-1">
                {background?.name} Background
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="text-right"
            >
              <div className="text-sm text-text-muted">Level</div>
              <div className="text-4xl font-bold" style={{ color: classTheme.primary }}>1</div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Core Stats Row with Animated Stats */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={1}
      >
        <StatsRow>
          <AnimatedStat
            value={maxHP}
            label="HP"
            icon="hp"
            color="red"
            size="lg"
          />
          <AnimatedStat
            value={armorClass}
            label="AC"
            icon="ac"
            color="gold"
            size="lg"
          />
          <AnimatedStat
            value={initiative >= 0 ? initiative : Math.abs(initiative)}
            label={initiative >= 0 ? `+${initiative} Init` : `${initiative} Init`}
            icon="initiative"
            color="purple"
            size="lg"
          />
          <AnimatedStat
            value={speed}
            label="Speed"
            icon="speed"
            color="blue"
            size="lg"
          />
        </StatsRow>
      </motion.div>

      {/* Ability Scores with Animated Display */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={2}
        className="p-4 rounded-lg bg-bg-dark border border-border"
      >
        <h4 className="text-sm font-semibold text-primary mb-4">Ability Scores</h4>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {abilities.map(({ id, name }, index) => {
            const final = getFinalScore(id);
            const mod = calculateModifier(final);
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <AbilityScoreDisplay
                  ability={name}
                  score={final}
                  modifier={mod}
                  animate
                />
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Skills */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={3}
        className="p-4 rounded-lg bg-bg-dark border border-border"
      >
        <h4 className="text-sm font-semibold text-primary mb-4">Proficient Skills</h4>
        <div className="flex flex-wrap gap-2">
          {(character.skills || []).map((skillId, index) => {
            const skill = SKILLS.find(s => s.id === skillId);
            if (!skill) return null;
            const abilityMod = calculateModifier(getFinalScore(skill.ability as AbilityName));
            const total = abilityMod + proficiencyBonus;
            return (
              <motion.div
                key={skillId}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.03 }}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 px-3 py-2 bg-primary/20 rounded-lg border border-primary/30"
              >
                <span className="text-text-primary font-medium">{skill.name}</span>
                <span className={`font-bold ${total >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatModifier(total)}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Spellcasting (if applicable) */}
      {classData?.spellcasting && (
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={4}
          className="p-4 rounded-lg border relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${classTheme.bgGlow}, transparent)`,
            borderColor: classTheme.primary + '50',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <SpellIcon size={20} color={classTheme.icon} animate />
            <h4 className="text-sm font-semibold" style={{ color: classTheme.primary }}>
              Spellcasting
            </h4>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-text-muted">Ability</div>
              <div className="text-lg font-bold text-text-primary capitalize">
                {classData.spellcasting.ability}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-muted">Spell Save DC</div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="text-lg font-bold"
                style={{ color: classTheme.primary }}
              >
                {spellSaveDC}
              </motion.div>
            </div>
            <div>
              <div className="text-xs text-text-muted">Spell Attack</div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
                className="text-lg font-bold"
                style={{ color: classTheme.primary }}
              >
                {formatModifier(spellAttackBonus!)}
              </motion.div>
            </div>
          </div>
          {classData.spellcasting.cantripsKnown && classData.spellcasting.cantripsKnown > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-3 text-sm text-text-secondary text-center"
            >
              You know {classData.spellcasting.cantripsKnown} cantrips at 1st level
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Proficiencies */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={5}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="p-4 rounded-lg bg-bg-dark border border-border">
          <div className="flex items-center gap-2 mb-3">
            <ShieldIcon size={16} color="#F59E0B" />
            <h4 className="text-sm font-semibold text-primary">Armor Proficiencies</h4>
          </div>
          <p className="text-sm text-text-secondary">
            {classData?.armorProficiencies.length
              ? classData.armorProficiencies.join(', ')
              : 'None'}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-bg-dark border border-border">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-primary">
              <path d="M14.5 4L19 8.5 8.5 19l-4-4L14.5 4z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2" />
            </svg>
            <h4 className="text-sm font-semibold text-primary">Weapon Proficiencies</h4>
          </div>
          <p className="text-sm text-text-secondary">
            {classData?.weaponProficiencies.join(', ')}
          </p>
        </div>
      </motion.div>

      {/* Saving Throws */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={6}
        className="p-4 rounded-lg bg-bg-dark border border-border"
      >
        <h4 className="text-sm font-semibold text-primary mb-3">Saving Throw Proficiencies</h4>
        <div className="flex flex-wrap gap-2">
          {classData?.savingThrows.map((save, index) => {
            const mod = calculateModifier(getFinalScore(save as AbilityName));
            const total = mod + proficiencyBonus;
            return (
              <motion.div
                key={save}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 px-3 py-2 bg-success/20 rounded-lg border border-success/30"
              >
                <span className="text-text-primary font-medium uppercase">{save.substring(0, 3)}</span>
                <span className={`font-bold ${total >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatModifier(total)}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Class Features */}
      {classData && (
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={7}
          className="p-4 rounded-lg bg-bg-dark border border-border"
        >
          <div className="flex items-center gap-2 mb-3">
            <ClassIcon characterClass={character.class || ''} size={16} color={classTheme.icon} />
            <h4 className="text-sm font-semibold text-primary">Level 1 Features</h4>
          </div>
          <div className="space-y-3">
            {classData.features
              .filter(f => f.level === 1)
              .map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                >
                  <span className="text-text-primary font-medium">{feature.name}</span>
                  <p className="text-sm text-text-muted mt-1">{feature.description}</p>
                </motion.div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Racial Traits */}
      {race && (
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={8}
          className="p-4 rounded-lg bg-bg-dark border border-border"
        >
          <h4 className="text-sm font-semibold text-primary mb-3">{race.name} Traits</h4>
          <div className="space-y-3">
            {race.traits.map((trait, index) => (
              <motion.div
                key={trait.name}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.05 }}
              >
                <span className="text-text-primary font-medium">{trait.name}</span>
                <p className="text-sm text-text-muted mt-1">{trait.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Languages */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={9}
        className="p-4 rounded-lg bg-bg-dark border border-border"
      >
        <h4 className="text-sm font-semibold text-primary mb-3">Languages</h4>
        <p className="text-sm text-text-secondary">{race?.languages.join(', ')}</p>
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex justify-between pt-6"
      >
        <motion.button
          onClick={onBack}
          disabled={isCreating}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-stone px-6 py-3"
        >
          Back to Details
        </motion.button>
        <motion.button
          onClick={handleCreate}
          disabled={isCreating}
          whileHover={{ scale: isCreating ? 1 : 1.02 }}
          whileTap={{ scale: isCreating ? 1 : 0.98 }}
          className={`
            btn-adventure px-8 py-3 text-lg
            ${isCreating ? 'opacity-75 cursor-wait' : ''}
          `}
          style={{
            background: isCreating ? undefined : `linear-gradient(135deg, ${classTheme.primary}, ${classTheme.secondary})`,
          }}
        >
          {isCreating ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
              Creating...
            </span>
          ) : (
            'Create Character'
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
