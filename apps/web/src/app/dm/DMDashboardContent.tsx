'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

// Dynamic imports for immersive effects
const AmbientParticles = dynamic(
  () => import('@/components/dnd/AmbientParticles').then((mod) => mod.AmbientParticles),
  { ssr: false }
);

interface CampaignPlayer {
  userId: string;
  role: string;
  displayName: string;
  avatarUrl?: string;
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: string;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  counts: {
    maps: number;
    encounters: number;
    npcs: number;
    quests: number;
    players: number;
    gameSessions: number;
  };
  players: CampaignPlayer[];
  progress: number;
}

interface SessionParticipant {
  userId: string;
  role: string;
  isConnected: boolean;
  lastSeenAt: string;
}

interface GameSession {
  id: string;
  name: string;
  status: string;
  inviteCode: string;
  campaignId: string;
  campaignName: string;
  inCombat: boolean;
  round: number;
  lastActivityAt: string;
  createdAt: string;
  playerCount: number;
  connectedCount: number;
  participants: SessionParticipant[];
}

interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  draftCampaigns: number;
  completedCampaigns: number;
  totalPlayers: number;
  activeSessions: number;
  maxSessions: number;
  totalMaps: number;
  totalEncounters: number;
  totalNpcs: number;
  totalQuests: number;
}

interface DashboardData {
  stats: DashboardStats;
  campaigns: Campaign[];
  activeSessions: GameSession[];
}

interface ValidationResult {
  campaignId: string;
  status: string;
  counts: { maps: number; encounters: number; npcs: number; quests: number };
  validation: {
    hasMap: boolean;
    hasEncounterOrQuest: boolean;
    hasNpc: boolean;
    hasNpcWithPortrait: boolean;
  };
  isReadyToPublish: boolean;
  warnings: string[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function DMDashboardContent() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState<string | null>(null);
  const [activatingCampaign, setActivatingCampaign] = useState<string | null>(null);
  const [validationModal, setValidationModal] = useState<{
    campaign: Campaign;
    validation: ValidationResult | null;
    action: 'start' | 'activate';
  } | null>(null);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchDashboard();
  }, [token, router]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/dm/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch dashboard');
      }

      const dashboardData = await res.json();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const validateCampaign = async (campaignId: string): Promise<ValidationResult | null> => {
    try {
      const res = await fetch(`${API_URL}/dm/campaigns/${campaignId}/validate`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  const handleStartSession = async (campaign: Campaign) => {
    // For draft campaigns, show validation modal first
    if (campaign.status === 'draft') {
      const validation = await validateCampaign(campaign.id);
      setValidationModal({ campaign, validation, action: 'start' });
    } else {
      // Active campaigns - proceed directly
      await createSession(campaign.id, campaign.name);
    }
  };

  const handleActivateCampaign = async (campaign: Campaign) => {
    const validation = await validateCampaign(campaign.id);
    setValidationModal({ campaign, validation, action: 'activate' });
  };

  const confirmStartSession = async (force: boolean = false) => {
    if (!validationModal) return;
    setValidationModal(null);
    await createSession(validationModal.campaign.id, validationModal.campaign.name);
  };

  const confirmActivateCampaign = async (force: boolean = false) => {
    if (!validationModal) return;
    const campaignId = validationModal.campaign.id;
    setValidationModal(null);

    try {
      setActivatingCampaign(campaignId);
      const res = await fetch(`${API_URL}/dm/campaigns/${campaignId}/activate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to activate campaign');
      }

      await fetchDashboard();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to activate campaign');
    } finally {
      setActivatingCampaign(null);
    }
  };

  const createSession = async (campaignId: string, campaignName: string) => {
    try {
      setCreatingSession(campaignId);
      const res = await fetch(`${API_URL}/dm/sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId,
          name: `${campaignName} - Session`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create session');
      }

      // Refresh dashboard
      await fetchDashboard();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setCreatingSession(null);
    }
  };

  const updateSessionStatus = async (sessionId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/dm/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error('Failed to update session');
      }

      await fetchDashboard();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update session');
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      const res = await fetch(`${API_URL}/dm/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to delete session');
      }

      await fetchDashboard();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete session');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'lobby': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'paused': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'draft': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="w-12 h-12 spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={fetchDashboard} className="btn-magic">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, campaigns, activeSessions } = data;

  return (
    <div className="min-h-screen bg-bg-dark relative overflow-hidden">
      {/* Ambient particles */}
      <Suspense fallback={null}>
        <AmbientParticles variant="dust" />
      </Suspense>

      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-500 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1, 1.15, 1],
            opacity: [0.06, 0.12, 0.06],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-primary blur-3xl"
        />
      </div>

      {/* Vignette overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 0%, rgba(15, 13, 19, 0.4) 100%)' }} />

      {/* Header */}
      <div className="relative z-10 bg-bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-cinzel font-bold text-text-primary flex items-center gap-3"
              >
                <span className="text-3xl">🎭</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-amber-300 to-primary">
                  Dungeon Master&apos;s Sanctum
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-text-secondary mt-1 italic"
              >
                &quot;Command your realm, {user?.displayName || 'Dungeon Master'}...&quot;
              </motion.p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-bg-elevated text-text-secondary rounded-lg font-medium hover:bg-border hover:text-text-primary transition-colors"
                >
                  ← Home
                </motion.button>
              </Link>
              <Link href="/dm/campaign-studio">
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(139, 92, 246, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-primary text-white rounded-lg font-medium shadow-lg shadow-purple-500/20"
                >
                  ✨ AI Campaign Studio
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <StatCard label="Campaigns" value={stats.totalCampaigns} icon="📚" />
          <StatCard label="Active" value={stats.activeCampaigns} icon="🎮" color="green" />
          <StatCard label="Drafts" value={stats.draftCampaigns} icon="📝" color="purple" />
          <StatCard label="Players" value={stats.totalPlayers} icon="👥" color="blue" />
          <StatCard
            label="Sessions"
            value={`${stats.activeSessions}/${stats.maxSessions}`}
            icon="🎲"
            color="yellow"
          />
          <StatCard label="Content" value={stats.totalMaps + stats.totalEncounters + stats.totalNpcs} icon="🗺️" />
        </div>

        {/* Active Sessions */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-cinzel font-bold text-text-primary">
              Active Sessions ({activeSessions.length})
            </h2>
          </div>

          {activeSessions.length === 0 ? (
            <div className="bg-bg-card rounded-lg border border-border p-8 text-center">
              <p className="text-text-secondary mb-4">No active sessions</p>
              <p className="text-text-muted text-sm">
                Create a session from one of your campaigns below
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {activeSessions.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-bg-card rounded-lg border border-border p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-text-primary">{session.name}</h3>
                        <p className="text-sm text-text-secondary">{session.campaignName}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Invite Code:</span>
                        <code className="px-2 py-0.5 bg-bg-elevated rounded text-primary font-mono">
                          {session.inviteCode}
                        </code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Players:</span>
                        <span className="text-text-primary">
                          {session.connectedCount}/{session.playerCount} online
                        </span>
                      </div>
                      {session.inCombat && (
                        <div className="flex justify-between">
                          <span className="text-text-muted">Combat:</span>
                          <span className="text-red-400">Round {session.round}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-text-muted">Last activity:</span>
                        <span className="text-text-secondary">{formatTimeAgo(session.lastActivityAt)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                      <Link href={`/game/${session.id}`} className="flex-1">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full px-3 py-2 bg-primary text-bg-dark rounded text-sm font-medium"
                        >
                          Play
                        </motion.button>
                      </Link>
                      {session.status === 'active' && (
                        <motion.button
                          onClick={() => updateSessionStatus(session.id, 'paused')}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded text-sm"
                        >
                          Pause
                        </motion.button>
                      )}
                      {session.status === 'paused' && (
                        <motion.button
                          onClick={() => updateSessionStatus(session.id, 'active')}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-3 py-2 bg-green-500/20 text-green-400 rounded text-sm"
                        >
                          Resume
                        </motion.button>
                      )}
                      <motion.button
                        onClick={() => deleteSession(session.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-3 py-2 bg-red-500/20 text-red-400 rounded text-sm"
                      >
                        End
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Campaigns */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-cinzel font-bold text-text-primary">
              My Campaigns ({campaigns.length})
            </h2>
            <Link href="/dm/campaigns">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="text-primary text-sm hover:underline"
              >
                View All →
              </motion.button>
            </Link>
          </div>

          {campaigns.length === 0 ? (
            <div className="bg-bg-card rounded-lg border border-border p-8 text-center">
              <p className="text-text-secondary mb-4">No campaigns yet</p>
              <Link href="/dm/campaigns">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-magic"
                >
                  Create Your First Campaign
                </motion.button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {campaigns.map((campaign) => (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-bg-card rounded-lg border border-border overflow-hidden"
                  >
                    {/* Cover Image or Placeholder */}
                    <div className="h-32 bg-gradient-to-br from-purple-900/50 to-bg-elevated relative">
                      {campaign.coverImageUrl && (
                        <img
                          src={campaign.coverImageUrl}
                          alt={campaign.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-medium text-text-primary mb-1">{campaign.name}</h3>
                      {campaign.description && (
                        <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                          {campaign.description}
                        </p>
                      )}

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-text-muted mb-1">
                          <span>Content Progress</span>
                          <span>{campaign.progress}%</span>
                        </div>
                        <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${campaign.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                        <div>
                          <span className="block text-text-primary font-medium">{campaign.counts.maps}</span>
                          <span className="text-text-muted">Maps</span>
                        </div>
                        <div>
                          <span className="block text-text-primary font-medium">{campaign.counts.encounters}</span>
                          <span className="text-text-muted">Encounters</span>
                        </div>
                        <div>
                          <span className="block text-text-primary font-medium">{campaign.counts.npcs}</span>
                          <span className="text-text-muted">NPCs</span>
                        </div>
                        <div>
                          <span className="block text-text-primary font-medium">{campaign.counts.quests}</span>
                          <span className="text-text-muted">Quests</span>
                        </div>
                      </div>

                      {/* Players */}
                      {campaign.players.length > 0 && (
                        <div className="mb-3">
                          <span className="text-xs text-text-muted block mb-1">
                            Players ({campaign.players.length})
                          </span>
                          <div className="flex -space-x-2">
                            {campaign.players.slice(0, 5).map((player) => (
                              <div
                                key={player.userId}
                                className="w-7 h-7 rounded-full bg-bg-elevated border-2 border-bg-card flex items-center justify-center text-xs font-medium text-text-primary"
                                title={player.displayName}
                              >
                                {player.avatarUrl ? (
                                  <img
                                    src={player.avatarUrl}
                                    alt={player.displayName}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  player.displayName.charAt(0).toUpperCase()
                                )}
                              </div>
                            ))}
                            {campaign.players.length > 5 && (
                              <div className="w-7 h-7 rounded-full bg-bg-elevated border-2 border-bg-card flex items-center justify-center text-xs text-text-muted">
                                +{campaign.players.length - 5}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-border">
                        <Link href={`/dm/campaign-studio?id=${campaign.id}`} className="flex-1">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full px-3 py-2 bg-bg-elevated text-text-primary rounded text-sm hover:bg-border"
                          >
                            Edit
                          </motion.button>
                        </Link>
                        {campaign.status === 'draft' && (
                          <motion.button
                            onClick={() => handleActivateCampaign(campaign)}
                            disabled={activatingCampaign === campaign.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-3 py-2 bg-green-500/20 text-green-400 rounded text-sm font-medium disabled:opacity-50 border border-green-500/30"
                          >
                            {activatingCampaign === campaign.id ? 'Activating...' : 'Activate'}
                          </motion.button>
                        )}
                        {(campaign.status === 'active' || campaign.status === 'draft') && (
                          <motion.button
                            onClick={() => handleStartSession(campaign)}
                            disabled={creatingSession === campaign.id || stats.activeSessions >= stats.maxSessions}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex-1 px-3 py-2 rounded text-sm font-medium disabled:opacity-50 ${
                              campaign.status === 'draft'
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : 'bg-primary text-bg-dark'
                            }`}
                          >
                            {creatingSession === campaign.id ? 'Creating...' : 'Start Session'}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* DM Tools */}
        <section className="mt-8 p-6 bg-bg-card rounded-lg border border-border">
          <h3 className="font-medium text-text-primary mb-4">DM Toolkit</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Link href="/dm/campaign-studio">
              <motion.div
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' }}
                className="p-4 bg-gradient-to-br from-purple-900/30 to-bg-elevated rounded-lg text-center cursor-pointer hover:from-purple-900/50 transition-all border border-purple-500/20"
              >
                <span className="text-2xl block mb-2">✨</span>
                <span className="text-sm text-purple-400 font-medium">AI Studio</span>
              </motion.div>
            </Link>
            <Link href="/dm/campaigns">
              <motion.div
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
                className="p-4 bg-bg-elevated rounded-lg text-center cursor-pointer hover:border-primary/50 transition-all border border-border/50"
              >
                <span className="text-2xl block mb-2">📚</span>
                <span className="text-sm text-text-primary">Campaigns</span>
              </motion.div>
            </Link>
            <Link href="/dm/map-editor">
              <motion.div
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                className="p-4 bg-bg-elevated rounded-lg text-center cursor-pointer hover:border-green-500/50 transition-all border border-border/50"
              >
                <span className="text-2xl block mb-2">🗺️</span>
                <span className="text-sm text-text-primary">Map Editor</span>
              </motion.div>
            </Link>
            <Link href="/dm/content-editors">
              <motion.div
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                className="p-4 bg-bg-elevated rounded-lg text-center cursor-pointer hover:border-blue-500/50 transition-all border border-border/50"
              >
                <span className="text-2xl block mb-2">📝</span>
                <span className="text-sm text-text-primary">Content</span>
              </motion.div>
            </Link>
            <Link href="/dashboard">
              <motion.div
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
                className="p-4 bg-bg-elevated rounded-lg text-center cursor-pointer hover:border-primary/50 transition-all border border-border/50"
              >
                <span className="text-2xl block mb-2">🏠</span>
                <span className="text-sm text-text-primary">Home</span>
              </motion.div>
            </Link>
          </div>
        </section>
      </div>

      {/* Validation Modal */}
      <AnimatePresence>
        {validationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setValidationModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-card rounded-lg border border-border p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-cinzel font-bold text-text-primary mb-2">
                {validationModal.action === 'start' ? 'Start Session' : 'Activate Campaign'}
              </h3>
              <p className="text-text-secondary mb-4">
                {validationModal.campaign.name}
              </p>

              {validationModal.campaign.status === 'draft' && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                  <p className="text-yellow-400 text-sm font-medium">
                    This campaign is still in draft mode
                  </p>
                  <p className="text-yellow-400/70 text-xs mt-1">
                    You can continue building content during gameplay.
                  </p>
                </div>
              )}

              {validationModal.validation && validationModal.validation.warnings.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-text-primary">Content Warnings:</p>
                  {validationModal.validation.warnings.map((warning, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-yellow-400">!</span>
                      <span className="text-text-secondary">{warning}</span>
                    </div>
                  ))}
                </div>
              )}

              {validationModal.validation && (
                <div className="grid grid-cols-4 gap-2 text-center text-xs mb-4 p-3 bg-bg-elevated rounded-lg">
                  <div>
                    <span className={`block font-medium ${validationModal.validation.validation.hasMap ? 'text-green-400' : 'text-red-400'}`}>
                      {validationModal.validation.counts.maps}
                    </span>
                    <span className="text-text-muted">Maps</span>
                  </div>
                  <div>
                    <span className={`block font-medium ${validationModal.validation.counts.encounters > 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {validationModal.validation.counts.encounters}
                    </span>
                    <span className="text-text-muted">Encounters</span>
                  </div>
                  <div>
                    <span className={`block font-medium ${validationModal.validation.validation.hasNpc ? 'text-green-400' : 'text-yellow-400'}`}>
                      {validationModal.validation.counts.npcs}
                    </span>
                    <span className="text-text-muted">NPCs</span>
                  </div>
                  <div>
                    <span className={`block font-medium ${validationModal.validation.counts.quests > 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {validationModal.validation.counts.quests}
                    </span>
                    <span className="text-text-muted">Quests</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <motion.button
                  onClick={() => setValidationModal(null)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-2 bg-bg-elevated text-text-primary rounded-lg hover:bg-border"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={() => {
                    if (validationModal.action === 'start') {
                      confirmStartSession(true);
                    } else {
                      confirmActivateCampaign(true);
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                    validationModal.action === 'start'
                      ? 'bg-primary text-bg-dark'
                      : 'bg-green-500 text-white'
                  }`}
                >
                  {validationModal.action === 'start' ? 'Start Anyway' : 'Activate'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Stat Card Component with enhanced styling
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: string;
  color?: 'green' | 'purple' | 'blue' | 'yellow';
}) {
  const colorClasses = {
    green: 'text-green-400 border-green-500/30 hover:border-green-500/50 hover:shadow-green-500/20',
    purple: 'text-purple-400 border-purple-500/30 hover:border-purple-500/50 hover:shadow-purple-500/20',
    blue: 'text-blue-400 border-blue-500/30 hover:border-blue-500/50 hover:shadow-blue-500/20',
    yellow: 'text-yellow-400 border-yellow-500/30 hover:border-yellow-500/50 hover:shadow-yellow-500/20',
  };

  const bgClasses = {
    green: 'from-green-900/20',
    purple: 'from-purple-900/20',
    blue: 'from-blue-900/20',
    yellow: 'from-yellow-900/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-gradient-to-br ${color ? bgClasses[color] : 'from-bg-card'} to-bg-card rounded-lg border p-4 transition-all hover:shadow-lg ${
        color ? colorClasses[color] : 'border-border hover:border-primary/50 hover:shadow-primary/20'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <motion.span
          whileHover={{ scale: 1.2, rotate: 10 }}
          className="text-xl"
        >
          {icon}
        </motion.span>
        <span className="text-text-muted text-sm">{label}</span>
      </div>
      <span className={`text-2xl font-bold font-cinzel ${color ? colorClasses[color].split(' ')[0] : 'text-text-primary'}`}>
        {value}
      </span>
    </motion.div>
  );
}
