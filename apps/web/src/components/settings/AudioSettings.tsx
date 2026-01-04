'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SFXManager, playSFX } from '@/lib/audio/SFXManager';
import { DynamicMusicManager } from '@/lib/audio/DynamicMusicManager';
import type { SFXCategory } from '@/lib/audio/SFXManager';

interface VolumeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon?: React.ReactNode;
  testSound?: () => void;
}

function VolumeSlider({ label, value, onChange, icon, testSound }: VolumeSliderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 flex items-center justify-center text-text-secondary">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-text-secondary">{label}</span>
          <span className="text-sm text-text-muted">{Math.round(value * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={value * 100}
          onChange={(e) => onChange(parseInt(e.target.value) / 100)}
          className="w-full h-2 bg-bg-elevated rounded-lg appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:bg-primary
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110"
        />
      </div>
      {testSound && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={testSound}
          className="p-2 rounded-lg bg-bg-elevated hover:bg-border transition-colors"
          title="Test sound"
        >
          <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </motion.button>
      )}
    </div>
  );
}

interface AudioSettingsProps {
  onClose?: () => void;
  className?: string;
}

export function AudioSettings({ onClose, className }: AudioSettingsProps) {
  const [masterVolume, setMasterVolume] = useState(1);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const [categoryVolumes, setCategoryVolumes] = useState<Record<SFXCategory, number>>({
    ui: 1,
    dice: 1,
    combat: 1,
    magic: 1,
    environment: 1,
    character: 1,
    notification: 1,
  });

  // Load current settings on mount
  useEffect(() => {
    setMasterVolume(SFXManager.getMasterVolume());
    setMusicVolume(DynamicMusicManager.getMasterVolume());
    setMuted(SFXManager.isMuted());

    const categories: SFXCategory[] = ['ui', 'dice', 'combat', 'magic', 'environment', 'character', 'notification'];
    const volumes: Record<SFXCategory, number> = {} as Record<SFXCategory, number>;
    categories.forEach(cat => {
      volumes[cat] = SFXManager.getCategoryVolume(cat);
    });
    setCategoryVolumes(volumes);
  }, []);

  const handleMasterVolumeChange = useCallback((value: number) => {
    setMasterVolume(value);
    SFXManager.setMasterVolume(value);
  }, []);

  const handleMusicVolumeChange = useCallback((value: number) => {
    setMusicVolume(value);
    DynamicMusicManager.setMasterVolume(value);
  }, []);

  const handleCategoryVolumeChange = useCallback((category: SFXCategory, value: number) => {
    setCategoryVolumes(prev => ({ ...prev, [category]: value }));
    SFXManager.setCategoryVolume(category, value);
  }, []);

  const handleMuteToggle = useCallback(() => {
    const newMuted = !muted;
    setMuted(newMuted);
    SFXManager.setMuted(newMuted);
    DynamicMusicManager.setMuted(newMuted);
  }, [muted]);

  const testUISound = useCallback(() => playSFX.click(), []);
  const testDiceSound = useCallback(() => playSFX.diceRoll(), []);
  const testCombatSound = useCallback(() => playSFX.swordHit(), []);
  const testMagicSound = useCallback(() => playSFX.fire(), []);

  // Icons
  const volumeIcon = (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  );

  const musicIcon = (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  );

  return (
    <div className={`bg-bg-card border border-border rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-cinzel font-bold text-xl text-text-primary">Audio Settings</h2>
        {onClose && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-elevated transition-colors"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        )}
      </div>

      {/* Mute toggle */}
      <div className="flex items-center justify-between mb-6 p-3 bg-bg-elevated rounded-lg">
        <div className="flex items-center gap-3">
          <svg className={`w-5 h-5 ${muted ? 'text-red-400' : 'text-text-secondary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {muted ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zm11.485-4.485l2.829 2.828m-2.829 0l2.829-2.828" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            )}
          </svg>
          <span className="text-text-primary">{muted ? 'Sound Muted' : 'Sound Enabled'}</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleMuteToggle}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            muted
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-primary/20 text-primary hover:bg-primary/30'
          }`}
        >
          {muted ? 'Unmute' : 'Mute All'}
        </motion.button>
      </div>

      {/* Main volumes */}
      <div className="space-y-6 mb-8">
        <VolumeSlider
          label="Master Volume"
          value={masterVolume}
          onChange={handleMasterVolumeChange}
          icon={volumeIcon}
        />
        <VolumeSlider
          label="Music Volume"
          value={musicVolume}
          onChange={handleMusicVolumeChange}
          icon={musicIcon}
        />
      </div>

      {/* Category volumes */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-text-secondary mb-4">Sound Effect Categories</h3>
        <div className="space-y-4">
          <VolumeSlider
            label="UI Sounds"
            value={categoryVolumes.ui}
            onChange={(v) => handleCategoryVolumeChange('ui', v)}
            testSound={testUISound}
          />
          <VolumeSlider
            label="Dice Sounds"
            value={categoryVolumes.dice}
            onChange={(v) => handleCategoryVolumeChange('dice', v)}
            testSound={testDiceSound}
          />
          <VolumeSlider
            label="Combat Sounds"
            value={categoryVolumes.combat}
            onChange={(v) => handleCategoryVolumeChange('combat', v)}
            testSound={testCombatSound}
          />
          <VolumeSlider
            label="Magic Sounds"
            value={categoryVolumes.magic}
            onChange={(v) => handleCategoryVolumeChange('magic', v)}
            testSound={testMagicSound}
          />
          <VolumeSlider
            label="Environment"
            value={categoryVolumes.environment}
            onChange={(v) => handleCategoryVolumeChange('environment', v)}
          />
          <VolumeSlider
            label="Character"
            value={categoryVolumes.character}
            onChange={(v) => handleCategoryVolumeChange('character', v)}
          />
          <VolumeSlider
            label="Notifications"
            value={categoryVolumes.notification}
            onChange={(v) => handleCategoryVolumeChange('notification', v)}
          />
        </div>
      </div>

      {/* Reset button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          handleMasterVolumeChange(1);
          handleMusicVolumeChange(0.5);
          setMuted(false);
          SFXManager.setMuted(false);
          DynamicMusicManager.setMuted(false);
          const defaultVolumes: Record<SFXCategory, number> = {
            ui: 1, dice: 1, combat: 1, magic: 1, environment: 1, character: 1, notification: 1,
          };
          Object.entries(defaultVolumes).forEach(([cat, vol]) => {
            handleCategoryVolumeChange(cat as SFXCategory, vol);
          });
        }}
        className="w-full py-2 bg-bg-elevated text-text-secondary rounded-lg hover:bg-border transition-colors"
      >
        Reset to Defaults
      </motion.button>
    </div>
  );
}

export default AudioSettings;
