'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  usePreferencesStore,
  type UserPreferences,
  type DiceAnimationFrequency,
} from '@/stores/preferencesStore';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const isAuthenticated = !!user;
  const { preferences, setPreference, _hasHydrated } = usePreferencesStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/settings');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSave = async () => {
    // Preferences are auto-saved via zustand persist
    // Show save confirmation to user
  };

  const togglePreference = (key: keyof UserPreferences) => {
    if (typeof preferences[key] === 'boolean') {
      setPreference(key, !preferences[key]);
    }
  };

  if (isLoading || !_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-text-muted hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-cinzel font-bold text-white">Settings</h1>
          </div>
          <span className="text-sm text-text-muted">Changes are saved automatically</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Account Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-xl border border-white/10 p-6"
        >
          <h2 className="text-xl font-cinzel font-bold text-white mb-4">Account</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div>
                <p className="text-white font-medium">Email</p>
                <p className="text-text-muted text-sm">{user?.email || 'Not set'}</p>
              </div>
              <button className="text-primary hover:text-primary-light text-sm">Change</button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div>
                <p className="text-white font-medium">Username</p>
                <p className="text-text-muted text-sm">@{user?.username || 'Not set'}</p>
              </div>
              <button className="text-primary hover:text-primary-light text-sm">Change</button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Password</p>
                <p className="text-text-muted text-sm">Last changed: Never</p>
              </div>
              <button className="text-primary hover:text-primary-light text-sm">Change</button>
            </div>
          </div>
        </motion.section>

        {/* Appearance Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface rounded-xl border border-white/10 p-6"
        >
          <h2 className="text-xl font-cinzel font-bold text-white mb-4">Appearance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Theme</p>
                <p className="text-text-muted text-sm">Choose your preferred color scheme</p>
              </div>
              <select
                value={preferences.theme}
                onChange={(e) => setPreference('theme', e.target.value as UserPreferences['theme'])}
                className="bg-white border border-white/10 rounded-lg px-3 py-2 text-gray-900"
              >
                <option value="dark" className="text-gray-900 bg-white">Dark</option>
                <option value="light" className="text-gray-900 bg-white">Light</option>
                <option value="system" className="text-gray-900 bg-white">System</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Reduce Animations</p>
                <p className="text-text-muted text-sm">Minimize motion for accessibility</p>
              </div>
              <ToggleSwitch
                enabled={preferences.animationsReduced}
                onToggle={() => togglePreference('animationsReduced')}
              />
            </div>
          </div>
        </motion.section>

        {/* Dice Animation Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-surface rounded-xl border border-white/10 p-6"
        >
          <h2 className="text-xl font-cinzel font-bold text-white mb-4">Dice Animations</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Animation Frequency</p>
                <p className="text-text-muted text-sm">When to show 3D dice roll animations</p>
              </div>
              <select
                value={preferences.diceAnimationFrequency}
                onChange={(e) => setPreference('diceAnimationFrequency', e.target.value as DiceAnimationFrequency)}
                className="bg-white border border-white/10 rounded-lg px-3 py-2 text-gray-900"
              >
                <option value="always" className="text-gray-900 bg-white">Always</option>
                <option value="combat-only" className="text-gray-900 bg-white">Combat Only</option>
                <option value="important-only" className="text-gray-900 bg-white">Important Rolls Only</option>
                <option value="never" className="text-gray-900 bg-white">Never (Instant Results)</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Animation Speed</p>
                <p className="text-text-muted text-sm">How fast dice animations play</p>
              </div>
              <select
                value={preferences.diceAnimationSpeed}
                onChange={(e) => setPreference('diceAnimationSpeed', e.target.value as 'slow' | 'normal' | 'fast')}
                className="bg-white border border-white/10 rounded-lg px-3 py-2 text-gray-900"
              >
                <option value="slow" className="text-gray-900 bg-white">Slow (Dramatic)</option>
                <option value="normal" className="text-gray-900 bg-white">Normal</option>
                <option value="fast" className="text-gray-900 bg-white">Fast</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Critical Celebrations</p>
                <p className="text-text-muted text-sm">Show particle effects on critical hits and fumbles</p>
              </div>
              <ToggleSwitch
                enabled={preferences.diceCelebrationEnabled}
                onToggle={() => setPreference('diceCelebrationEnabled', !preferences.diceCelebrationEnabled)}
              />
            </div>
          </div>
        </motion.section>

        {/* Audio Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface rounded-xl border border-white/10 p-6"
        >
          <h2 className="text-xl font-cinzel font-bold text-white mb-4">Audio</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Sound Effects</p>
                <p className="text-text-muted text-sm">Enable dice rolls, combat sounds, and UI feedback</p>
              </div>
              <ToggleSwitch
                enabled={preferences.soundEnabled}
                onToggle={() => togglePreference('soundEnabled')}
              />
            </div>
            {preferences.soundEnabled && (
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white font-medium">Sound Volume</p>
                  <p className="text-text-muted text-sm">Adjust sound effect volume</p>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={preferences.soundVolume}
                  onChange={(e) => setPreference('soundVolume', parseInt(e.target.value))}
                  className="w-32 accent-primary"
                />
              </div>
            )}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Background Music</p>
                <p className="text-text-muted text-sm">Ambient music during gameplay</p>
              </div>
              <ToggleSwitch
                enabled={preferences.musicEnabled}
                onToggle={() => togglePreference('musicEnabled')}
              />
            </div>
            {preferences.musicEnabled && (
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white font-medium">Music Volume</p>
                  <p className="text-text-muted text-sm">Adjust background music volume</p>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={preferences.musicVolume}
                  onChange={(e) => setPreference('musicVolume', parseInt(e.target.value))}
                  className="w-32 accent-primary"
                />
              </div>
            )}
          </div>
        </motion.section>

        {/* Notifications Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-surface rounded-xl border border-white/10 p-6"
        >
          <h2 className="text-xl font-cinzel font-bold text-white mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Push Notifications</p>
                <p className="text-text-muted text-sm">Get notified about game invites and turns</p>
              </div>
              <ToggleSwitch
                enabled={preferences.notificationsEnabled}
                onToggle={() => togglePreference('notificationsEnabled')}
              />
            </div>
          </div>
        </motion.section>

        {/* Danger Zone */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface rounded-xl border border-danger/30 p-6"
        >
          <h2 className="text-xl font-cinzel font-bold text-danger mb-4">Danger Zone</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Delete Account</p>
                <p className="text-text-muted text-sm">Permanently delete your account and all data</p>
              </div>
              <button className="px-4 py-2 bg-danger/20 hover:bg-danger/30 text-danger border border-danger/30 rounded-lg text-sm transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}

function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-primary' : 'bg-white/20'
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full"
      />
    </button>
  );
}
