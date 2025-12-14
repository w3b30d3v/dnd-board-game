'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRequireAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { useCampaignStore } from '@/stores/campaignStore';
import { EnchantedCard } from '@/components/dnd/EnchantedCard';
import {
  ScrollIcon,
  D20Icon,
} from '@/components/dnd/DnDIcons';
import type { Campaign } from '@dnd/shared';

// Dynamic imports for heavy components
const AmbientParticles = dynamic(
  () => import('@/components/dnd/AmbientParticles').then((mod) => mod.AmbientParticles),
  { ssr: false }
);

const FloatingRunes = dynamic(
  () => import('@/components/dnd/AtmosphericBackground').then((mod) => mod.FloatingRunes),
  { ssr: false }
);

// Animation variants
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

// Create Campaign Modal
interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
  isLoading: boolean;
}

function CreateCampaignModal({ isOpen, onClose, onCreate, isLoading }: CreateCampaignModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), description.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <EnchantedCard variant="magical" showCorners>
            <h2 className="dnd-heading-epic text-2xl mb-6">Create New Campaign</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter campaign name..."
                  className="w-full px-4 py-3 rounded-lg bg-bg-primary/50 border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary text-text-primary placeholder-text-muted"
                  required
                  maxLength={100}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your campaign..."
                  className="w-full px-4 py-3 rounded-lg bg-bg-primary/50 border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary text-text-primary placeholder-text-muted resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-stone flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-adventure flex-1"
                  disabled={isLoading || !name.trim()}
                >
                  {isLoading ? 'Creating...' : 'Create Campaign'}
                </motion.button>
              </div>
            </form>
          </EnchantedCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-text-muted/20 text-text-muted border-text-muted/30',
    active: 'bg-success/20 text-success border-success/30',
    completed: 'bg-primary/20 text-primary border-primary/30',
    archived: 'bg-text-muted/10 text-text-muted/70 border-text-muted/20',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${colors[status] || colors.draft}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function CampaignDashboardContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireAuth('/login');
  const { token, logout } = useAuthStore((state) => ({ token: state.token, logout: state.logout }));
  const {
    campaigns,
    isLoading,
    error,
    fetchCampaigns,
    createCampaign,
    deleteCampaign,
    clearError,
  } = useCampaignStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch campaigns on mount
  useEffect(() => {
    if (token && user) {
      fetchCampaigns(token);
    }
  }, [token, user, fetchCampaigns]);

  const handleCreateCampaign = async (name: string, description: string) => {
    if (!token) return;
    setCreating(true);
    const campaign = await createCampaign({ name, description }, token);
    setCreating(false);
    if (campaign) {
      setShowCreateModal(false);
      router.push(`/dm/campaigns/${campaign.id}`);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!token) return;
    const success = await deleteCampaign(id, token);
    if (success) {
      setDeleteConfirm(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (authLoading || !user) {
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
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl bg-secondary/5"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl bg-primary/5"
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
              <Link href="/dashboard" className="group flex items-center gap-2">
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
                <Link href="/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-stone text-sm px-4 py-2"
                  >
                    Dashboard
                  </motion.button>
                </Link>

                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-bg-primary font-bold shadow-glow cursor-pointer"
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center border border-secondary/30">
                  <ScrollIcon size={28} color="#8B5CF6" />
                </div>
                <div>
                  <h1 className="dnd-heading-epic text-4xl pb-0" style={{ color: '#A78BFA' }}>
                    Campaign Builder
                  </h1>
                  <p className="text-text-secondary dnd-flavor">
                    Create and manage your D&D campaigns
                  </p>
                </div>
              </div>
              <motion.button
                onClick={() => setShowCreateModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-magic px-6 py-3 flex items-center gap-2"
              >
                <span className="text-xl">+</span> New Campaign
              </motion.button>
            </div>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-4 p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger flex items-center justify-between"
              >
                <span>{error}</span>
                <button onClick={clearError} className="text-danger hover:text-danger/80">
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          {isLoading && campaigns.length === 0 && (
            <div className="flex justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <D20Icon size={48} color="#8B5CF6" />
              </motion.div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && campaigns.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <EnchantedCard variant="magical" showCorners className="max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/20 flex items-center justify-center">
                  <ScrollIcon size={48} color="#8B5CF6" />
                </div>
                <h3 className="dnd-heading-section text-xl mb-2" style={{ color: '#A78BFA' }}>
                  No Campaigns Yet
                </h3>
                <p className="text-text-secondary mb-6">
                  Begin your journey as a Dungeon Master by creating your first campaign.
                </p>
                <motion.button
                  onClick={() => setShowCreateModal(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-magic"
                >
                  Create Your First Campaign
                </motion.button>
              </EnchantedCard>
            </motion.div>
          )}

          {/* Campaign Grid */}
          {campaigns.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign: Campaign, index: number) => (
                <motion.div
                  key={campaign.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                >
                  <EnchantedCard variant="magical" hover showCorners className="h-full flex flex-col">
                    {/* Cover Image or Placeholder */}
                    <div className="h-32 rounded-lg mb-4 overflow-hidden bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center">
                      {campaign.coverImageUrl ? (
                        <img
                          src={campaign.coverImageUrl}
                          alt={campaign.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ScrollIcon size={48} color="#8B5CF6" />
                      )}
                    </div>

                    {/* Campaign Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="dnd-heading-section text-lg mb-0 border-none pb-0 truncate flex-1" style={{ color: '#A78BFA' }}>
                          {campaign.name}
                        </h3>
                        <StatusBadge status={campaign.status} />
                      </div>
                      <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                        {campaign.description || 'No description provided.'}
                      </p>

                      {/* Stats */}
                      <div className="flex gap-4 text-xs text-text-muted mb-4">
                        <span>{campaign._count?.maps || 0} maps</span>
                        <span>{campaign._count?.encounters || 0} encounters</span>
                        <span>{campaign._count?.npcs || 0} NPCs</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/dm/campaigns/${campaign.id}`} className="flex-1">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="btn-magic w-full text-sm"
                        >
                          Edit
                        </motion.button>
                      </Link>
                      {deleteConfirm === campaign.id ? (
                        <>
                          <motion.button
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-stone text-sm px-3 text-danger"
                          >
                            Confirm
                          </motion.button>
                          <motion.button
                            onClick={() => setDeleteConfirm(null)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-stone text-sm px-3"
                          >
                            Cancel
                          </motion.button>
                        </>
                      ) : (
                        <motion.button
                          onClick={() => setDeleteConfirm(campaign.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="btn-stone text-sm px-3"
                        >
                          Delete
                        </motion.button>
                      )}
                    </div>
                  </EnchantedCard>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateCampaign}
        isLoading={creating}
      />
    </div>
  );
}
