'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';

interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  soundEnabled: boolean;
  musicEnabled: boolean;
  notificationsEnabled: boolean;
  animationsReduced: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const isAuthenticated = !!user;
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'dark',
    soundEnabled: true,
    musicEnabled: true,
    notificationsEnabled: true,
    animationsReduced: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/settings');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    // Load preferences from localStorage
    const stored = localStorage.getItem('userPreferences');
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch {
        // Use defaults
      }
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Save to localStorage
    localStorage.setItem('userPreferences', JSON.stringify(preferences));

    // Simulate API save
    await new Promise(resolve => setTimeout(resolve, 500));

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const togglePreference = (key: keyof UserPreferences) => {
    if (typeof preferences[key] === 'boolean') {
      setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  if (isLoading) {
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
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </motion.button>
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
                onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value as UserPreferences['theme'] }))}
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
          </div>
        </motion.section>

        {/* Notifications Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
          transition={{ delay: 0.4 }}
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
