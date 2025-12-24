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
  SwordIcon,
} from '@/components/dnd/DnDIcons';
import type { GameMap, NPC, Encounter, Quest } from '@dnd/shared';

// Dynamic imports for heavy editor components
const MapEditor = dynamic(() => import('@/components/editors/MapEditor'), { ssr: false });
const NPCEditor = dynamic(() => import('@/components/editors/NPCEditor'), { ssr: false });
const EncounterEditor = dynamic(() => import('@/components/editors/EncounterEditor'), { ssr: false });
const QuestEditor = dynamic(() => import('@/components/editors/QuestEditor'), { ssr: false });

// Dynamic imports for heavy components
const AmbientParticles = dynamic(
  () => import('@/components/dnd/AmbientParticles').then((mod) => mod.AmbientParticles),
  { ssr: false }
);

interface CampaignEditorContentProps {
  campaignId: string;
}

type TabType = 'overview' | 'maps' | 'encounters' | 'npcs' | 'quests' | 'settings';

// Tab component
function Tab({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-secondary/20 text-secondary border border-secondary/30'
          : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
}

// Create Item Modal
interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description?: string) => void;
  isLoading: boolean;
  title: string;
  placeholder: string;
}

function CreateItemModal({ isOpen, onClose, onCreate, isLoading, title, placeholder }: CreateItemModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), description.trim());
      setName('');
      setDescription('');
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
            <h2 className="dnd-heading-epic text-2xl mb-6">{title}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-4 py-3 rounded-lg bg-bg-primary/50 border border-border/50 focus:border-secondary focus:ring-1 focus:ring-secondary text-text-primary placeholder-text-muted"
                  required
                  maxLength={100}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description..."
                  className="w-full px-4 py-3 rounded-lg bg-bg-primary/50 border border-border/50 focus:border-secondary focus:ring-1 focus:ring-secondary text-text-primary placeholder-text-muted resize-none"
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
                  className="btn-magic flex-1"
                  disabled={isLoading || !name.trim()}
                >
                  {isLoading ? 'Creating...' : 'Create'}
                </motion.button>
              </div>
            </form>
          </EnchantedCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Empty state component
function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/20 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary mb-6 max-w-md mx-auto">{description}</p>
      <motion.button
        onClick={onAction}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="btn-magic"
      >
        {actionLabel}
      </motion.button>
    </div>
  );
}

export default function CampaignEditorContent({ campaignId }: CampaignEditorContentProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireAuth('/login');
  const { token } = useAuthStore((state) => ({ token: state.token }));
  const {
    currentCampaign,
    isLoading,
    error,
    fetchCampaign,
    updateCampaign,
    createMap,
    updateMap,
    deleteMap,
    createEncounter,
    updateEncounter,
    deleteEncounter,
    createNPC,
    updateNPC,
    deleteNPC,
    createQuest,
    updateQuest,
    deleteQuest,
    validateCampaign,
    clearError,
  } = useCampaignStore();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showCreateModal, setShowCreateModal] = useState<TabType | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [validationResult, setValidationResult] = useState<{ valid: boolean; score: number; issues: unknown[]; warnings: unknown[] } | null>(null);

  // Editor states
  const [editingMap, setEditingMap] = useState<GameMap | null>(null);
  const [editingNPC, setEditingNPC] = useState<NPC | null>(null);
  const [editingEncounter, setEditingEncounter] = useState<Encounter | null>(null);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);

  // Fetch campaign on mount
  useEffect(() => {
    if (token && user) {
      fetchCampaign(campaignId, token);
    }
  }, [token, user, campaignId, fetchCampaign]);

  // Update local values when campaign loads
  useEffect(() => {
    if (currentCampaign) {
      setNameValue(currentCampaign.name);
      setDescriptionValue(currentCampaign.description || '');
    }
  }, [currentCampaign]);

  const handleSaveName = async () => {
    if (!token || !currentCampaign || nameValue === currentCampaign.name) {
      setEditingName(false);
      return;
    }
    setSaving(true);
    await updateCampaign(campaignId, { name: nameValue }, token);
    setSaving(false);
    setEditingName(false);
  };

  const handleSaveDescription = async () => {
    if (!token || !currentCampaign || descriptionValue === (currentCampaign.description || '')) {
      setEditingDescription(false);
      return;
    }
    setSaving(true);
    await updateCampaign(campaignId, { description: descriptionValue }, token);
    setSaving(false);
    setEditingDescription(false);
  };

  const handleCreateItem = async (name: string, description?: string) => {
    if (!token || !showCreateModal) return;
    setCreating(true);

    switch (showCreateModal) {
      case 'maps':
        await createMap(campaignId, { name, description, width: 30, height: 30 }, token);
        break;
      case 'encounters':
        await createEncounter(campaignId, { name, description }, token);
        break;
      case 'npcs':
        await createNPC(campaignId, { name, description }, token);
        break;
      case 'quests':
        await createQuest(campaignId, { name, description }, token);
        break;
    }

    setCreating(false);
    setShowCreateModal(null);
  };

  const handleValidate = async () => {
    if (!token) return;
    const result = await validateCampaign(campaignId, token);
    setValidationResult(result);
  };

  if (authLoading || isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="dnd-page-background" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <D20Icon size={48} color="#8B5CF6" animate />
        </motion.div>
      </div>
    );
  }

  if (!currentCampaign) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="dnd-page-background" />
        <EnchantedCard variant="magical">
          <p className="text-text-secondary">Campaign not found.</p>
          <Link href="/dm/campaigns">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-magic mt-4">
              Back to Campaigns
            </motion.button>
          </Link>
        </EnchantedCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="dnd-page-background" />

      {/* Particles */}
      <Suspense fallback={null}>
        <AmbientParticles variant="dust" />
      </Suspense>

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
              <div className="flex items-center gap-4">
                <Link href="/dm/campaigns" className="text-text-muted hover:text-text-primary transition-colors">
                  <motion.div whileHover={{ x: -4 }} className="flex items-center gap-2">
                    <span>&larr;</span>
                    <span>Back</span>
                  </motion.div>
                </Link>
                <div className="h-6 w-px bg-border/50" />
                <div className="flex items-center gap-2">
                  <ScrollIcon size={20} color="#8B5CF6" />
                  {editingName ? (
                    <input
                      type="text"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      onBlur={handleSaveName}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      className="bg-transparent border-b border-secondary text-text-primary font-semibold focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="font-semibold text-text-primary cursor-pointer hover:text-secondary transition-colors"
                      onClick={() => setEditingName(true)}
                    >
                      {currentCampaign.name}
                    </span>
                  )}
                  {saving && <span className="text-xs text-text-muted">Saving...</span>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <motion.button
                  onClick={handleValidate}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-stone text-sm px-4 py-2"
                >
                  Validate
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-magic text-sm px-4 py-2"
                  disabled
                >
                  Publish
                </motion.button>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4"
            >
              <div className="p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger flex items-center justify-between">
                <span>{error}</span>
                <button onClick={clearError} className="text-danger hover:text-danger/80">Dismiss</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation Result */}
        <AnimatePresence>
          {validationResult && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4"
            >
              <EnchantedCard className={validationResult.valid ? 'border-success/30' : 'border-warning/30'}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`font-semibold ${validationResult.valid ? 'text-success' : 'text-warning'}`}>
                      {validationResult.valid ? 'Ready to Publish' : 'Validation Issues Found'}
                    </span>
                    <span className="text-text-muted ml-2">Score: {validationResult.score}/100</span>
                  </div>
                  <button onClick={() => setValidationResult(null)} className="text-text-muted hover:text-text-primary">
                    Dismiss
                  </button>
                </div>
                {(validationResult.issues.length > 0 || validationResult.warnings.length > 0) && (
                  <div className="mt-2 text-sm">
                    {validationResult.issues.map((issue: unknown, i: number) => {
                      const iss = issue as { message: string };
                      return (
                        <div key={i} className="text-danger">{iss.message}</div>
                      );
                    })}
                    {validationResult.warnings.map((warning: unknown, i: number) => {
                      const warn = warning as { message: string };
                      return (
                        <div key={i} className="text-warning">{warn.message}</div>
                      );
                    })}
                  </div>
                )}
              </EnchantedCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Tab label="Overview" icon={<ScrollIcon size={16} color="#8B5CF6" />} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <Tab label={`Maps (${currentCampaign.maps?.length || 0})`} icon={<span>🗺️</span>} active={activeTab === 'maps'} onClick={() => setActiveTab('maps')} />
            <Tab label={`Encounters (${currentCampaign.encounters?.length || 0})`} icon={<SwordIcon size={16} color="#EF4444" />} active={activeTab === 'encounters'} onClick={() => setActiveTab('encounters')} />
            <Tab label={`NPCs (${currentCampaign.npcs?.length || 0})`} icon={<span>👤</span>} active={activeTab === 'npcs'} onClick={() => setActiveTab('npcs')} />
            <Tab label={`Quests (${currentCampaign.quests?.length || 0})`} icon={<span>📜</span>} active={activeTab === 'quests'} onClick={() => setActiveTab('quests')} />
            <Tab label="Settings" icon={<span>⚙️</span>} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          </div>
        </div>

        {/* Tab Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Campaign Info */}
                  <div className="lg:col-span-2 space-y-6">
                    <EnchantedCard variant="magical" showCorners>
                      <h3 className="dnd-heading-section text-lg mb-4" style={{ color: '#A78BFA' }}>Campaign Details</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-text-muted mb-1">Description</label>
                          {editingDescription ? (
                            <textarea
                              value={descriptionValue}
                              onChange={(e) => setDescriptionValue(e.target.value)}
                              onBlur={handleSaveDescription}
                              className="w-full px-3 py-2 rounded bg-bg-primary/50 border border-border/50 focus:border-secondary focus:outline-none text-text-primary resize-none"
                              rows={4}
                              autoFocus
                            />
                          ) : (
                            <p
                              className="text-text-secondary cursor-pointer hover:text-text-primary transition-colors p-2 rounded hover:bg-bg-elevated/50"
                              onClick={() => setEditingDescription(true)}
                            >
                              {currentCampaign.description || 'Click to add description...'}
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-text-muted mb-1">Status</label>
                            <span className="text-text-primary capitalize">{currentCampaign.status}</span>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-text-muted mb-1">Visibility</label>
                            <span className="text-text-primary">{currentCampaign.isPublic ? 'Public' : 'Private'}</span>
                          </div>
                        </div>
                      </div>
                    </EnchantedCard>
                  </div>

                  {/* Quick Stats */}
                  <div className="space-y-4">
                    <EnchantedCard>
                      <h3 className="text-sm font-medium text-text-muted mb-3">Content Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Maps</span>
                          <span className="text-text-primary font-medium">{currentCampaign.maps?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Encounters</span>
                          <span className="text-text-primary font-medium">{currentCampaign.encounters?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">NPCs</span>
                          <span className="text-text-primary font-medium">{currentCampaign.npcs?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Quests</span>
                          <span className="text-text-primary font-medium">{currentCampaign.quests?.length || 0}</span>
                        </div>
                      </div>
                    </EnchantedCard>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'maps' && (
              <motion.div
                key="maps"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="dnd-heading-section text-xl" style={{ color: '#A78BFA' }}>Maps</h2>
                  <motion.button
                    onClick={() => setShowCreateModal('maps')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-magic"
                  >
                    + New Map
                  </motion.button>
                </div>

                {(!currentCampaign.maps || currentCampaign.maps.length === 0) ? (
                  <EmptyState
                    icon={<span className="text-3xl">🗺️</span>}
                    title="No Maps Yet"
                    description="Create your first map to start building your campaign world."
                    actionLabel="Create Map"
                    onAction={() => setShowCreateModal('maps')}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentCampaign.maps.map((map) => (
                      <EnchantedCard key={map.id} hover>
                        <div className="h-24 rounded-lg mb-3 bg-gradient-to-br from-secondary/10 to-secondary/5 flex items-center justify-center">
                          <span className="text-3xl">🗺️</span>
                        </div>
                        <h3 className="font-semibold text-text-primary truncate">{map.name}</h3>
                        <p className="text-sm text-text-muted">{map.width}x{map.height} tiles</p>
                        <div className="flex gap-2 mt-3">
                          <motion.button
                            onClick={() => setEditingMap(map)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-magic text-sm flex-1"
                          >
                            Edit
                          </motion.button>
                          <motion.button
                            onClick={() => token && deleteMap(campaignId, map.id, token)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-stone text-sm px-3"
                          >
                            Delete
                          </motion.button>
                        </div>
                      </EnchantedCard>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'encounters' && (
              <motion.div
                key="encounters"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="dnd-heading-section text-xl" style={{ color: '#A78BFA' }}>Encounters</h2>
                  <motion.button
                    onClick={() => setShowCreateModal('encounters')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-magic"
                  >
                    + New Encounter
                  </motion.button>
                </div>

                {(!currentCampaign.encounters || currentCampaign.encounters.length === 0) ? (
                  <EmptyState
                    icon={<SwordIcon size={32} color="#EF4444" />}
                    title="No Encounters Yet"
                    description="Create combat encounters to challenge your players."
                    actionLabel="Create Encounter"
                    onAction={() => setShowCreateModal('encounters')}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentCampaign.encounters.map((encounter) => (
                      <EnchantedCard key={encounter.id} hover>
                        <div className="flex items-center gap-2 mb-2">
                          <SwordIcon size={20} color="#EF4444" />
                          <h3 className="font-semibold text-text-primary truncate">{encounter.name}</h3>
                        </div>
                        <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                          {encounter.description || 'No description'}
                        </p>
                        <span className="text-xs px-2 py-0.5 rounded bg-danger/20 text-danger capitalize">
                          {encounter.difficulty}
                        </span>
                        <div className="flex gap-2 mt-3">
                          <motion.button
                            onClick={() => setEditingEncounter(encounter)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-magic text-sm flex-1"
                          >
                            Edit
                          </motion.button>
                          <motion.button
                            onClick={() => token && deleteEncounter(campaignId, encounter.id, token)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-stone text-sm px-3"
                          >
                            Delete
                          </motion.button>
                        </div>
                      </EnchantedCard>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'npcs' && (
              <motion.div
                key="npcs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="dnd-heading-section text-xl" style={{ color: '#A78BFA' }}>NPCs</h2>
                  <motion.button
                    onClick={() => setShowCreateModal('npcs')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-magic"
                  >
                    + New NPC
                  </motion.button>
                </div>

                {(!currentCampaign.npcs || currentCampaign.npcs.length === 0) ? (
                  <EmptyState
                    icon={<span className="text-3xl">👤</span>}
                    title="No NPCs Yet"
                    description="Create non-player characters to populate your world."
                    actionLabel="Create NPC"
                    onAction={() => setShowCreateModal('npcs')}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentCampaign.npcs.map((npc) => (
                      <EnchantedCard key={npc.id} hover>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                            {npc.portraitUrl ? (
                              <img src={npc.portraitUrl} alt={npc.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span>👤</span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-text-primary">{npc.name}</h3>
                            {npc.title && <p className="text-xs text-text-muted">{npc.title}</p>}
                          </div>
                        </div>
                        <p className="text-sm text-text-secondary line-clamp-2">
                          {npc.description || 'No description'}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <motion.button
                            onClick={() => setEditingNPC(npc)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-magic text-sm flex-1"
                          >
                            Edit
                          </motion.button>
                          <motion.button
                            onClick={() => token && deleteNPC(campaignId, npc.id, token)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-stone text-sm px-3"
                          >
                            Delete
                          </motion.button>
                        </div>
                      </EnchantedCard>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'quests' && (
              <motion.div
                key="quests"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="dnd-heading-section text-xl" style={{ color: '#A78BFA' }}>Quests</h2>
                  <motion.button
                    onClick={() => setShowCreateModal('quests')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-magic"
                  >
                    + New Quest
                  </motion.button>
                </div>

                {(!currentCampaign.quests || currentCampaign.quests.length === 0) ? (
                  <EmptyState
                    icon={<span className="text-3xl">📜</span>}
                    title="No Quests Yet"
                    description="Create quests to give your players objectives."
                    actionLabel="Create Quest"
                    onAction={() => setShowCreateModal('quests')}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentCampaign.quests.map((quest) => (
                      <EnchantedCard key={quest.id} hover>
                        <div className="flex items-center gap-2 mb-2">
                          <span>📜</span>
                          <h3 className="font-semibold text-text-primary truncate">{quest.name}</h3>
                        </div>
                        <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                          {quest.description || 'No description'}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                          quest.type === 'main' ? 'bg-primary/20 text-primary' :
                          quest.type === 'side' ? 'bg-secondary/20 text-secondary' :
                          'bg-text-muted/20 text-text-muted'
                        }`}>
                          {quest.type}
                        </span>
                        <div className="flex gap-2 mt-3">
                          <motion.button
                            onClick={() => setEditingQuest(quest)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-magic text-sm flex-1"
                          >
                            Edit
                          </motion.button>
                          <motion.button
                            onClick={() => token && deleteQuest(campaignId, quest.id, token)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-stone text-sm px-3"
                          >
                            Delete
                          </motion.button>
                        </div>
                      </EnchantedCard>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <EnchantedCard variant="magical" showCorners>
                  <h3 className="dnd-heading-section text-lg mb-4" style={{ color: '#A78BFA' }}>Campaign Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-bg-elevated/30">
                      <div>
                        <h4 className="font-medium text-text-primary">Public Campaign</h4>
                        <p className="text-sm text-text-muted">Allow others to discover and view this campaign</p>
                      </div>
                      <button
                        onClick={() => token && updateCampaign(campaignId, { isPublic: !currentCampaign.isPublic }, token)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          currentCampaign.isPublic ? 'bg-success' : 'bg-text-muted/30'
                        }`}
                      >
                        <motion.div
                          animate={{ x: currentCampaign.isPublic ? 24 : 2 }}
                          className="w-5 h-5 rounded-full bg-white shadow"
                        />
                      </button>
                    </div>

                    <div className="p-3 rounded-lg bg-bg-elevated/30">
                      <h4 className="font-medium text-text-primary mb-2">Recommended Level</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted">Level</span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={currentCampaign.recommendedLevel?.min || 1}
                          className="w-16 px-2 py-1 rounded bg-bg-primary/50 border border-border/50 text-text-primary text-center"
                          onChange={(e) => token && updateCampaign(campaignId, {
                            recommendedLevel: { min: parseInt(e.target.value) || 1, max: currentCampaign.recommendedLevel?.max || 5 }
                          }, token)}
                        />
                        <span className="text-text-muted">to</span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={currentCampaign.recommendedLevel?.max || 5}
                          className="w-16 px-2 py-1 rounded bg-bg-primary/50 border border-border/50 text-text-primary text-center"
                          onChange={(e) => token && updateCampaign(campaignId, {
                            recommendedLevel: { min: currentCampaign.recommendedLevel?.min || 1, max: parseInt(e.target.value) || 5 }
                          }, token)}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/30">
                      <h4 className="font-medium text-danger mb-2">Danger Zone</h4>
                      <motion.button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this campaign? This cannot be undone.')) {
                            // Handle delete
                            router.push('/dm/campaigns');
                          }
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 rounded-lg border border-danger text-danger hover:bg-danger/10 transition-colors"
                      >
                        Delete Campaign
                      </motion.button>
                    </div>
                  </div>
                </EnchantedCard>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Create Item Modal */}
      <CreateItemModal
        isOpen={showCreateModal !== null}
        onClose={() => setShowCreateModal(null)}
        onCreate={handleCreateItem}
        isLoading={creating}
        title={
          showCreateModal === 'maps' ? 'Create New Map' :
          showCreateModal === 'encounters' ? 'Create New Encounter' :
          showCreateModal === 'npcs' ? 'Create New NPC' :
          'Create New Quest'
        }
        placeholder={
          showCreateModal === 'maps' ? 'Tavern Basement, Dragon\'s Lair...' :
          showCreateModal === 'encounters' ? 'Goblin Ambush, Final Boss...' :
          showCreateModal === 'npcs' ? 'Bartender Tom, Wise Sage...' :
          'Find the Lost Artifact...'
        }
      />

      {/* Content Editors */}
      {editingMap && (
        <MapEditor
          map={editingMap}
          onSave={async (updates) => {
            if (token) {
              await updateMap(campaignId, editingMap.id, updates, token);
              setEditingMap(null);
            }
          }}
          onClose={() => setEditingMap(null)}
        />
      )}

      {editingNPC && (
        <NPCEditor
          npc={editingNPC}
          onSave={async (updates) => {
            if (token) {
              await updateNPC(campaignId, editingNPC.id, updates, token);
              setEditingNPC(null);
            }
          }}
          onClose={() => setEditingNPC(null)}
        />
      )}

      {editingEncounter && (
        <EncounterEditor
          encounter={editingEncounter}
          maps={currentCampaign?.maps}
          onSave={async (updates) => {
            if (token) {
              await updateEncounter(campaignId, editingEncounter.id, updates, token);
              setEditingEncounter(null);
            }
          }}
          onClose={() => setEditingEncounter(null)}
        />
      )}

      {editingQuest && (
        <QuestEditor
          quest={editingQuest}
          npcs={currentCampaign?.npcs}
          onSave={async (updates) => {
            if (token) {
              await updateQuest(campaignId, editingQuest.id, updates, token);
              setEditingQuest(null);
            }
          }}
          onClose={() => setEditingQuest(null)}
        />
      )}
    </div>
  );
}
