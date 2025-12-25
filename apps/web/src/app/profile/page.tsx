'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import Image from 'next/image';

interface UserStats {
  charactersCreated: number;
  campaignsPlayed: number;
  sessionsCompleted: number;
  totalPlayTime: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const isAuthenticated = !!user;
  const [stats] = useState<UserStats>({
    charactersCreated: 0,
    campaignsPlayed: 0,
    sessionsCompleted: 0,
    totalPlayTime: '0h',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.username || '');
    }
  }, [user]);

  const handleSave = async () => {
    // Save profile changes
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 spinner" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
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
            <h1 className="text-2xl font-cinzel font-bold text-white">Profile</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/settings">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
              >
                Settings
              </motion.button>
            </Link>
            {isEditing ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
              >
                Save
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
              >
                Edit Profile
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-xl border border-white/10 p-8"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 border-2 border-primary/50 overflow-hidden">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.displayName || user.username}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-cinzel text-primary">
                    {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-dark transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              {isEditing ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="text-2xl font-cinzel font-bold text-white bg-transparent border-b border-white/20 focus:border-primary outline-none w-full md:w-auto"
                  placeholder="Display Name"
                />
              ) : (
                <h2 className="text-2xl font-cinzel font-bold text-white">
                  {user.displayName || user.username}
                </h2>
              )}
              <p className="text-text-muted">@{user.username}</p>
              <p className="text-text-muted text-sm mt-1">{user.email}</p>

              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="mt-4 w-full bg-background border border-white/10 rounded-lg p-3 text-white placeholder-text-muted resize-none h-24"
                />
              ) : bio ? (
                <p className="mt-4 text-text-secondary">{bio}</p>
              ) : (
                <p className="mt-4 text-text-muted italic">No bio yet</p>
              )}

              <p className="mt-4 text-text-muted text-sm">
                Member since {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Stats Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <StatCard
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            label="Characters"
            value={stats.charactersCreated}
          />
          <StatCard
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            }
            label="Campaigns"
            value={stats.campaignsPlayed}
          />
          <StatCard
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Sessions"
            value={stats.sessionsCompleted}
          />
          <StatCard
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            label="Play Time"
            value={stats.totalPlayTime}
            isString
          />
        </motion.section>

        {/* Achievements Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface rounded-xl border border-white/10 p-6"
        >
          <h2 className="text-xl font-cinzel font-bold text-white mb-4">Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AchievementBadge
              icon="🎲"
              name="First Roll"
              description="Roll your first d20"
              unlocked
            />
            <AchievementBadge
              icon="⚔️"
              name="Battle Ready"
              description="Create your first character"
              unlocked={stats.charactersCreated > 0}
            />
            <AchievementBadge
              icon="🏰"
              name="Adventurer"
              description="Join your first campaign"
              unlocked={stats.campaignsPlayed > 0}
            />
            <AchievementBadge
              icon="🐉"
              name="Dragon Slayer"
              description="Defeat a dragon"
              unlocked={false}
            />
          </div>
        </motion.section>

        {/* Recent Activity */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface rounded-xl border border-white/10 p-6"
        >
          <h2 className="text-xl font-cinzel font-bold text-white mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-text-muted">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p>No recent activity yet.</p>
            <p className="text-sm mt-2">Start a game or create a character to see your activity here!</p>
          </div>
        </motion.section>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  isString = false
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  isString?: boolean;
}) {
  return (
    <div className="bg-surface rounded-xl border border-white/10 p-4 text-center">
      <div className="text-primary mb-2 flex justify-center">{icon}</div>
      <div className="text-2xl font-bold text-white">
        {isString ? value : value.toLocaleString()}
      </div>
      <div className="text-text-muted text-sm">{label}</div>
    </div>
  );
}

function AchievementBadge({
  icon,
  name,
  description,
  unlocked
}: {
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`p-4 rounded-xl border text-center transition-colors ${
        unlocked
          ? 'bg-primary/10 border-primary/30'
          : 'bg-white/5 border-white/10 opacity-50'
      }`}
    >
      <div className={`text-3xl mb-2 ${unlocked ? '' : 'grayscale'}`}>{icon}</div>
      <p className={`font-medium ${unlocked ? 'text-white' : 'text-text-muted'}`}>{name}</p>
      <p className="text-xs text-text-muted mt-1">{description}</p>
    </motion.div>
  );
}
