'use client';

import { useState, useEffect, useCallback } from 'react';
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

interface UserProfile {
  bio?: string;
  gender?: string;
  avatarUrl?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, token, updateUser } = useAuthStore();
  const isAuthenticated = !!user;
  const [stats, setStats] = useState<UserStats>({
    charactersCreated: 0,
    campaignsPlayed: 0,
    sessionsCompleted: 0,
    totalPlayTime: '0h',
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [saving, setSaving] = useState(false);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setBio(data.user.bio || '');
          setGender(data.user.gender || '');
          setAvatarUrl(data.user.avatarUrl);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  }, [API_URL, token]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!token) return;

    try {
      setStatsLoading(true);
      const response = await fetch(`${API_URL}/profile/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.username || '');
      setAvatarUrl(user.avatarUrl || undefined);
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      fetchProfile();
      fetchStats();
    }
  }, [token, fetchProfile, fetchStats]);

  const handleSave = async () => {
    if (!token) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName,
          bio,
          gender: gender || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Update the auth store with new user data
          updateUser({
            displayName: data.user.displayName,
            avatarUrl: data.user.avatarUrl,
          });
        }
        setIsEditing(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!token) return;

    setGeneratingAvatar(true);
    try {
      const response = await fetch(`${API_URL}/profile/generate-avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.avatarUrl) {
          setAvatarUrl(data.avatarUrl);
          // Update the auth store
          updateUser({ avatarUrl: data.avatarUrl });
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to generate avatar');
      }
    } catch (error) {
      console.error('Failed to generate avatar:', error);
      alert('Failed to generate avatar');
    } finally {
      setGeneratingAvatar(false);
    }
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
                disabled={saving}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
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
                {avatarUrl || user.avatarUrl ? (
                  <Image
                    src={avatarUrl || user.avatarUrl || ''}
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
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleGenerateAvatar}
                  disabled={generatingAvatar}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                  title="Generate AI Avatar"
                >
                  {generatingAvatar ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </motion.button>
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
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Gender (optional)</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full md:w-48 bg-background border border-white/10 rounded-lg p-2 text-white"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself... (used for AI avatar generation)"
                      className="w-full bg-background border border-white/10 rounded-lg p-3 text-white placeholder-text-muted resize-none h-24"
                      maxLength={500}
                    />
                    <p className="text-xs text-text-muted mt-1">{bio.length}/500 characters</p>
                  </div>
                </div>
              ) : bio ? (
                <p className="mt-4 text-text-secondary">{bio}</p>
              ) : (
                <p className="mt-4 text-text-muted italic">No bio yet - add one to generate a personalized AI avatar!</p>
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
            loading={statsLoading}
          />
          <StatCard
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            }
            label="Campaigns"
            value={stats.campaignsPlayed}
            loading={statsLoading}
          />
          <StatCard
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Sessions"
            value={stats.sessionsCompleted}
            loading={statsLoading}
          />
          <StatCard
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            label="Play Time"
            value={stats.totalPlayTime}
            loading={statsLoading}
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
  isString = false,
  loading = false
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  isString?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="bg-surface rounded-xl border border-white/10 p-4 text-center">
      <div className="text-primary mb-2 flex justify-center">{icon}</div>
      <div className="text-2xl font-bold text-white">
        {loading ? (
          <div className="w-8 h-6 bg-white/10 animate-pulse rounded mx-auto" />
        ) : isString ? (
          value
        ) : (
          (value as number).toLocaleString()
        )}
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
