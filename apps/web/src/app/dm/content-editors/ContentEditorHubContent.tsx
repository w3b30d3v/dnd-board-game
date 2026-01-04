'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { CollapsibleSidebar } from '@/components/dnd/CollapsibleSidebar';
import { EncounterEditor, EncounterData } from '@/components/editors/EncounterEditor';
import { NPCEditor, NPCData } from '@/components/editors/NPCEditor';
import { QuestEditor, QuestData } from '@/components/editors/QuestEditor';
import { DialogueEditor, DialogueData } from '@/components/editors/DialogueEditor';
import { ItemEditor, ItemData } from '@/components/editors/ItemEditor';
import { CutsceneSequencer, CutsceneScene } from '@/components/cutscene/CutsceneSequencer';
import { useCampaignStudioStore, ContentBlock, CutsceneData } from '@/stores/campaignStudioStore';
import { useAuthStore } from '@/stores/authStore';
import { useCampaignStudio } from '@/hooks/useCampaignStudio';

type EditorType = 'hub' | 'encounters' | 'npcs' | 'quests' | 'cutscenes' | 'dialogues' | 'items';

interface EditorCard {
  id: EditorType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  contentType: ContentBlock['type'];
}

const editorCards: EditorCard[] = [
  {
    id: 'encounters',
    title: 'Encounter Editor',
    description: 'Build balanced combat encounters with monster placement and difficulty calculation',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: 'from-red-500 to-orange-500',
    contentType: 'encounter',
  },
  {
    id: 'npcs',
    title: 'NPC Editor',
    description: 'Create memorable NPCs with personality traits, dialogue, and voice profiles',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'from-blue-500 to-cyan-500',
    contentType: 'npc',
  },
  {
    id: 'quests',
    title: 'Quest Editor',
    description: 'Design epic quests with objectives, rewards, and branching storylines',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    color: 'from-green-500 to-emerald-500',
    contentType: 'quest',
  },
  {
    id: 'cutscenes',
    title: 'Cutscene Sequencer',
    description: 'Compose cinematic video sequences with AI-generated scenes',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    ),
    color: 'from-purple-500 to-pink-500',
    contentType: 'cutscene',
  },
  {
    id: 'dialogues',
    title: 'Dialogue Editor',
    description: 'Create branching conversations with NPCs and skill checks',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: 'from-indigo-500 to-purple-500',
    contentType: 'dialogue' as ContentBlock['type'],
  },
  {
    id: 'items',
    title: 'Item Editor',
    description: 'Create magical items, weapons, armor, and treasure',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    color: 'from-amber-500 to-yellow-500',
    contentType: 'item' as ContentBlock['type'],
  },
];

export default function ContentEditorHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams?.get('campaign') ?? null;

  const [activeEditor, setActiveEditor] = useState<EditorType>('hub');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const { token, _hasHydrated } = useAuthStore();
  const {
    generatedContent,
    saveContent,
    loadContent,
    addContent,
  } = useCampaignStudioStore();

  // Use campaign studio hook for image generation
  const { generateImage, isGeneratingImageFor } = useCampaignStudio(campaignId || undefined);

  // Redirect if not authenticated
  useEffect(() => {
    if (_hasHydrated && !token) {
      router.push('/login?redirect=/dm/content-editors');
    }
  }, [_hasHydrated, token, router]);

  // Load content when campaign ID changes
  useEffect(() => {
    if (campaignId && token) {
      loadContent();
    }
  }, [campaignId, token, loadContent]);

  // Get content counts for each type
  const getContentCount = useCallback((type: ContentBlock['type']) => {
    return generatedContent.filter(c => c.type === type).length;
  }, [generatedContent]);

  // Handle save for encounters
  const handleEncounterSave = useCallback(async (data: EncounterData) => {
    setIsSaving(true);
    try {
      addContent({
        id: data.id,
        type: 'encounter',
        data: data as unknown as ContentBlock['data'],
        createdAt: new Date(),
      });
      await saveContent();
      setSaveMessage('Encounter saved successfully!');
      setTimeout(() => {
        setSaveMessage(null);
        setActiveEditor('hub');
      }, 1500);
    } catch {
      setSaveMessage('Failed to save encounter');
    } finally {
      setIsSaving(false);
    }
  }, [addContent, saveContent]);

  // Handle save for NPCs
  const handleNPCSave = useCallback(async (data: NPCData) => {
    setIsSaving(true);
    try {
      addContent({
        id: data.id,
        type: 'npc',
        data: data as unknown as ContentBlock['data'],
        createdAt: new Date(),
      });
      await saveContent();
      setSaveMessage('NPC saved successfully!');
      setTimeout(() => {
        setSaveMessage(null);
        setActiveEditor('hub');
      }, 1500);
    } catch {
      setSaveMessage('Failed to save NPC');
    } finally {
      setIsSaving(false);
    }
  }, [addContent, saveContent]);

  // Handle save for quests
  const handleQuestSave = useCallback(async (data: QuestData) => {
    setIsSaving(true);
    try {
      addContent({
        id: data.id,
        type: 'quest',
        data: data as unknown as ContentBlock['data'],
        createdAt: new Date(),
      });
      await saveContent();
      setSaveMessage('Quest saved successfully!');
      setTimeout(() => {
        setSaveMessage(null);
        setActiveEditor('hub');
      }, 1500);
    } catch {
      setSaveMessage('Failed to save quest');
    } finally {
      setIsSaving(false);
    }
  }, [addContent, saveContent]);

  // Handle NPC portrait generation
  const handleGeneratePortrait = useCallback(async (npcId: string) => {
    await generateImage(npcId);
  }, [generateImage]);

  // Handle save for dialogues
  const handleDialogueSave = useCallback(async (data: DialogueData) => {
    setIsSaving(true);
    try {
      addContent({
        id: data.id,
        type: 'dialogue' as ContentBlock['type'],
        data: data as unknown as ContentBlock['data'],
        createdAt: new Date(),
      });
      await saveContent();
      setSaveMessage('Dialogue saved successfully!');
      setTimeout(() => {
        setSaveMessage(null);
        setActiveEditor('hub');
      }, 1500);
    } catch {
      setSaveMessage('Failed to save dialogue');
    } finally {
      setIsSaving(false);
    }
  }, [addContent, saveContent]);

  // Handle save for items
  const handleItemSave = useCallback(async (data: ItemData) => {
    setIsSaving(true);
    try {
      addContent({
        id: data.id,
        type: 'item' as ContentBlock['type'],
        data: data as unknown as ContentBlock['data'],
        createdAt: new Date(),
      });
      await saveContent();
      setSaveMessage('Item saved successfully!');
      setTimeout(() => {
        setSaveMessage(null);
        setActiveEditor('hub');
      }, 1500);
    } catch {
      setSaveMessage('Failed to save item');
    } finally {
      setIsSaving(false);
    }
  }, [addContent, saveContent]);

  // Handle save for cutscenes
  const handleCutsceneSave = useCallback(async (scenes: CutsceneScene[]) => {
    setIsSaving(true);
    try {
      // Save each scene as a content block
      scenes.forEach(scene => {
        const cutsceneData: CutsceneData = {
          id: scene.id,
          name: scene.title,
          videoUrl: scene.videoUrl,
          duration: scene.duration,
          description: scene.description,
        };
        addContent({
          id: scene.id,
          type: 'cutscene',
          data: cutsceneData,
          createdAt: new Date(),
        });
      });
      await saveContent();
      setSaveMessage('Cutscene saved successfully!');
      setTimeout(() => {
        setSaveMessage(null);
        setActiveEditor('hub');
      }, 1500);
    } catch {
      setSaveMessage('Failed to save cutscene');
    } finally {
      setIsSaving(false);
    }
  }, [addContent, saveContent]);

  const renderEditor = () => {
    switch (activeEditor) {
      case 'encounters':
        return (
          <EncounterEditor
            campaignId={campaignId || undefined}
            onSave={handleEncounterSave}
            onCancel={() => setActiveEditor('hub')}
          />
        );
      case 'npcs':
        return (
          <NPCEditor
            campaignId={campaignId || undefined}
            onSave={handleNPCSave}
            onCancel={() => setActiveEditor('hub')}
            onGeneratePortrait={handleGeneratePortrait}
          />
        );
      case 'quests':
        return (
          <QuestEditor
            campaignId={campaignId || undefined}
            onSave={handleQuestSave}
            onCancel={() => setActiveEditor('hub')}
          />
        );
      case 'cutscenes':
        return (
          <CutsceneSequencer
            campaignId={campaignId || undefined}
            onSave={handleCutsceneSave}
          />
        );
      case 'dialogues':
        return (
          <DialogueEditor
            campaignId={campaignId || undefined}
            onSave={handleDialogueSave}
            onCancel={() => setActiveEditor('hub')}
          />
        );
      case 'items':
        return (
          <ItemEditor
            campaignId={campaignId || undefined}
            onSave={handleItemSave}
            onCancel={() => setActiveEditor('hub')}
          />
        );
      default:
        return null;
    }
  };

  // Show campaign selector if no campaign selected
  if (!campaignId) {
    return (
      <div className="flex min-h-screen bg-bg-dark">
        <CollapsibleSidebar />
        <main className="flex-1 ml-64 transition-all duration-300">
          <div className="p-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-bg-elevated flex items-center justify-center">
                <svg className="w-10 h-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="font-cinzel text-2xl font-bold text-text-primary mb-2">
                Select a Campaign
              </h2>
              <p className="text-text-secondary mb-8 max-w-md mx-auto">
                Choose a campaign to edit its content. You can create encounters, NPCs, quests, and cutscenes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/dm/campaigns"
                  className="px-6 py-3 bg-primary text-bg-dark rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Browse Campaigns
                </Link>
                <Link
                  href="/dm/campaign-studio"
                  className="px-6 py-3 bg-bg-elevated text-text-primary rounded-lg font-medium hover:bg-bg-card transition-colors"
                >
                  Create New Campaign
                </Link>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg-dark">
      <CollapsibleSidebar />

      <main className="flex-1 ml-64 transition-all duration-300">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Save Message Toast */}
          <AnimatePresence>
            {saveMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg ${
                  saveMessage.includes('Failed') ? 'bg-red-500/90' : 'bg-green-500/90'
                } text-white font-medium`}
              >
                {saveMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-4">
              {activeEditor !== 'hub' && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveEditor('hub')}
                  disabled={isSaving}
                  className="p-2 rounded-lg bg-bg-elevated hover:bg-bg-card text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
              )}
              <div>
                <h1 className="font-cinzel text-3xl font-bold text-text-primary">
                  {activeEditor === 'hub' ? 'Content Editors' : editorCards.find(e => e.id === activeEditor)?.title}
                </h1>
                <p className="text-text-muted mt-1">
                  {activeEditor === 'hub'
                    ? 'Create and manage your campaign content'
                    : editorCards.find(e => e.id === activeEditor)?.description}
                </p>
              </div>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Link href="/dm" className="hover:text-primary transition-colors">
                DM Dashboard
              </Link>
              <span>/</span>
              <Link href="/dm/campaigns" className="hover:text-primary transition-colors">
                Campaigns
              </Link>
              <span>/</span>
              <span className={activeEditor === 'hub' ? 'text-primary' : ''}>Content Editors</span>
              {activeEditor !== 'hub' && (
                <>
                  <span>/</span>
                  <span className="text-primary">{editorCards.find(e => e.id === activeEditor)?.title}</span>
                </>
              )}
            </div>
          </motion.div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeEditor === 'hub' ? (
              <motion.div
                key="hub"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {editorCards.map((card, index) => (
                  <motion.button
                    key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveEditor(card.id)}
                    className="group relative bg-bg-card border border-border rounded-xl p-6 text-left hover:border-primary/50 transition-colors overflow-hidden"
                  >
                    {/* Gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity`} />

                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} text-white`}>
                          {card.icon}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-text-primary">
                            {getContentCount(card.contentType)}
                          </p>
                          <p className="text-xs text-text-muted">{card.title.split(' ')[0]}s</p>
                        </div>
                      </div>

                      <h3 className="font-cinzel text-xl font-bold text-text-primary mb-2">
                        {card.title}
                      </h3>
                      <p className="text-text-secondary text-sm">
                        {card.description}
                      </p>

                      <div className="mt-4 flex items-center gap-2 text-primary text-sm font-medium">
                        <span>Open Editor</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key={activeEditor}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {renderEditor()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Links */}
          {activeEditor === 'hub' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 p-6 bg-bg-card border border-border rounded-xl"
            >
              <h3 className="font-cinzel text-lg font-bold text-text-primary mb-4">
                Related Tools
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  href="/dm/map-editor"
                  className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated hover:bg-bg-dark transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">Map Editor</p>
                    <p className="text-xs text-text-muted">Design battle maps</p>
                  </div>
                </Link>

                <Link
                  href={`/dm/campaign-studio?campaign=${campaignId}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated hover:bg-bg-dark transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">Campaign Studio</p>
                    <p className="text-xs text-text-muted">AI-powered creation</p>
                  </div>
                </Link>

                <Link
                  href="/dm/campaigns"
                  className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated hover:bg-bg-dark transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">Campaigns</p>
                    <p className="text-xs text-text-muted">Manage campaigns</p>
                  </div>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
