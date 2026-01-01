'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useCampaignStudio } from '@/hooks/useCampaignStudio';
import {
  ChatPanel,
  ChatInput,
  LiveCampaignPreview,
} from '@/components/campaign-studio';
import { VideoGenerator } from '@/components/cutscene';
import { VoiceGenerator } from '@/components/narration';
import { ContentBlock, CutsceneData, CampaignExportData, useCampaignStudioStore } from '@/stores/campaignStudioStore';

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export default function CampaignStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams?.get('campaign') ?? searchParams?.get('id') ?? null;

  const { token, _hasHydrated } = useAuthStore();
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);
  const [showVoiceGenerator, setShowVoiceGenerator] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [campaignName, setCampaignName] = useState('New Campaign');

  // Get the import function from the store
  const importFromJson = useCampaignStudioStore((state) => state.importFromJson);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    messages,
    generatedContent,
    isGenerating,
    error,
    sendMessage,
    regenerateContent,
    clearConversation,
    saveContent,
    generateImage,
    addContent,
  } = useCampaignStudio(campaignId || undefined);

  // Wait for hydration before checking auth
  useEffect(() => {
    if (_hasHydrated && !token) {
      router.push('/login?redirect=/dm/campaign-studio');
    }
  }, [_hasHydrated, token, router]);

  // Extract campaign name from setting content
  useEffect(() => {
    const setting = generatedContent.find((c) => c.type === 'setting');
    if (setting && 'name' in setting.data) {
      setCampaignName(setting.data.name as string);
    }
  }, [generatedContent]);

  // Auto-save simulation (in real implementation, this would save to API)
  const triggerAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('unsaved');
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saving');
      // Simulate save delay
      setTimeout(() => {
        setSaveStatus('saved');
      }, 500);
    }, 1000);
  }, []);

  // Trigger auto-save when content changes
  useEffect(() => {
    if (generatedContent.length > 0) {
      triggerAutoSave();
    }
  }, [generatedContent, triggerAutoSave]);

  // Handle starting a new campaign
  const handleStartNew = () => {
    clearConversation();
    const tempCampaignId = `temp_${Date.now()}`;
    router.push(`/dm/campaign-studio?campaign=${tempCampaignId}`);
  };

  // Handle clicking on an item in the preview to discuss it
  const handleItemClick = (item: ContentBlock) => {
    const name = 'name' in item.data ? item.data.name : 'this item';
    sendMessage(`Tell me more about ${name}. What else can you add or improve?`);
  };

  // Handle manual save
  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await saveContent();
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  // Handle image generation for NPCs and locations
  const handleGenerateImage = async (contentId: string) => {
    await generateImage(contentId);
  };

  // Handle opening map editor for a location
  const handleOpenMapEditor = (locationId: string, locationName: string) => {
    router.push(`/dm/map-editor?locationId=${locationId}&locationName=${encodeURIComponent(locationName)}&campaignId=${campaignId}`);
  };

  // Handle import from JSON file
  const handleImport = (data: CampaignExportData) => {
    // Create a new campaign ID for the imported campaign
    const newCampaignId = campaignId || `imported_${Date.now()}`;
    importFromJson(data, newCampaignId);
    // Navigate to the imported campaign
    if (!campaignId) {
      router.push(`/dm/campaign-studio?campaign=${newCampaignId}`);
    }
    setShowImportModal(false);
  };

  // Loading state while hydrating
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="w-12 h-12 spinner" />
      </div>
    );
  }

  // No campaign selected - show welcome screen
  if (!campaignId) {
    return (
      <>
        <WelcomeScreen onStartNew={handleStartNew} onImport={() => setShowImportModal(true)} />
        {/* Import Modal - accessible from welcome screen */}
        <AnimatePresence>
          {showImportModal && (
            <ImportModal
              onImport={handleImport}
              onClose={() => setShowImportModal(false)}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="h-screen bg-bg-dark flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3">
            <Link href="/dm">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-bg-elevated transition-colors"
              >
                <svg
                  className="w-5 h-5 text-text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </motion.button>
            </Link>
            <div>
              <h1 className="text-lg font-cinzel font-bold text-text-primary">
                Campaign Studio
              </h1>
              <div className="flex items-center gap-2">
                <SaveStatusIndicator status={saveStatus} />
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Voice Generator button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowVoiceGenerator(true)}
              className="p-2 rounded-lg bg-bg-elevated hover:bg-border transition-colors"
              title="Generate Narration"
            >
              <svg
                className="w-5 h-5 text-text-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </motion.button>

            {/* Video Generator button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowVideoGenerator(true)}
              className="p-2 rounded-lg bg-bg-elevated hover:bg-border transition-colors"
              title="Generate Cutscene"
            >
              <svg
                className="w-5 h-5 text-text-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </motion.button>

            {/* Mobile preview toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMobilePreview(!showMobilePreview)}
              className="lg:hidden p-2 rounded-lg bg-bg-elevated hover:bg-border transition-colors relative"
            >
              <svg
                className="w-5 h-5 text-text-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              {generatedContent.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-bg-dark text-[10px] rounded-full flex items-center justify-center">
                  {generatedContent.length}
                </span>
              )}
            </motion.button>

            {/* Save button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-elevated hover:bg-border text-text-primary text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save
            </motion.button>

            {/* Import button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowImportModal(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-elevated hover:bg-border text-text-primary text-sm transition-colors"
              title="Import Campaign"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Import
            </motion.button>

            {/* Export button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowExportModal(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-bg-dark text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export
            </motion.button>
          </div>
        </div>
      </header>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-500/10 border-b border-red-500/30 px-4 py-2"
          >
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content area - Two panel layout */}
      <div className="flex-1 flex min-h-0">
        {/* Chat panel (left) - with its own scroll */}
        <div className="flex-1 flex flex-col min-w-0 lg:max-w-[60%] min-h-0 overflow-hidden">
          {/* Chat messages scroll area */}
          <ChatPanel messages={messages} isGenerating={isGenerating} />
          <ChatInput onSend={sendMessage} isGenerating={isGenerating} />
        </div>

        {/* Live preview panel (right) - Desktop - with its own scroll */}
        <div className="hidden lg:flex lg:flex-col w-[40%] min-w-[320px] max-w-[480px] min-h-0 h-full">
          {/* Preview content scroll area - takes full width */}
          <LiveCampaignPreview
              campaignName={campaignName}
              campaignId={campaignId || undefined}
              content={generatedContent}
              onItemClick={handleItemClick}
              onRegenerate={regenerateContent}
              onGenerateImage={handleGenerateImage}
              isGeneratingImage={isGenerating}
              onOpenMapEditor={handleOpenMapEditor}
            />
        </div>

        {/* Live preview - Mobile overlay */}
        <AnimatePresence>
          {showMobilePreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/50"
              onClick={() => setShowMobilePreview(false)}
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="absolute right-0 top-0 bottom-0 w-80 sm:w-96 bg-bg-card"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h2 className="font-medium text-text-primary">Campaign Preview</h2>
                  <button
                    onClick={() => setShowMobilePreview(false)}
                    className="p-2 rounded-lg hover:bg-bg-elevated"
                  >
                    <svg
                      className="w-5 h-5 text-text-secondary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="h-[calc(100%-56px)]">
                  <LiveCampaignPreview
                    campaignName={campaignName}
                    campaignId={campaignId || undefined}
                    content={generatedContent}
                    onItemClick={handleItemClick}
                    onRegenerate={regenerateContent}
                    onGenerateImage={handleGenerateImage}
                    isGeneratingImage={isGenerating}
                    onOpenMapEditor={handleOpenMapEditor}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Video Generator Modal */}
      <AnimatePresence>
        {showVideoGenerator && (
          <ModalWrapper onClose={() => setShowVideoGenerator(false)}>
            <VideoGenerator
              campaignId={campaignId || undefined}
              onVideoGenerated={(url) => {
                // Save video URL to campaign content
                const cutsceneId = `cutscene_${Date.now()}`;
                const cutsceneData: CutsceneData = {
                  id: cutsceneId,
                  name: 'Generated Cutscene',
                  videoUrl: url,
                };
                addContent({
                  id: cutsceneId,
                  type: 'cutscene',
                  data: cutsceneData,
                  createdAt: new Date(),
                });
                setShowVideoGenerator(false);
                triggerAutoSave();
              }}
            />
          </ModalWrapper>
        )}
      </AnimatePresence>

      {/* Voice Generator Modal */}
      <AnimatePresence>
        {showVoiceGenerator && (
          <ModalWrapper onClose={() => setShowVoiceGenerator(false)}>
            <VoiceGenerator
              contentType="setting"
              onGenerated={() => {
                // Voice generated - can be used for narration
                setShowVoiceGenerator(false);
              }}
            />
          </ModalWrapper>
        )}
      </AnimatePresence>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <ExportModal
            campaignName={campaignName}
            content={generatedContent}
            messages={messages}
            onClose={() => setShowExportModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <ImportModal
            onImport={handleImport}
            onClose={() => setShowImportModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Save status indicator
function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  const statusConfig = {
    saved: { text: 'Saved', color: 'text-green-400', icon: '✓' },
    saving: { text: 'Saving...', color: 'text-text-muted', icon: '○' },
    unsaved: { text: 'Unsaved changes', color: 'text-yellow-400', icon: '●' },
    error: { text: 'Save failed', color: 'text-red-400', icon: '!' },
  };

  const config = statusConfig[status];

  return (
    <span className={`text-xs ${config.color} flex items-center gap-1`}>
      <span className="text-[10px]">{config.icon}</span>
      {config.text}
    </span>
  );
}

// Modal wrapper component
function ModalWrapper({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-bg-card border border-border shadow-lg"
          >
            <svg
              className="w-4 h-4 text-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </motion.button>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Export Modal
function ExportModal({
  campaignName,
  content,
  messages,
  onClose,
}: {
  campaignName: string;
  content: ContentBlock[];
  messages: Array<{ id: string; role: string; content: string; timestamp: Date }>;
  onClose: () => void;
}) {
  const [exportType, setExportType] = useState<'json' | 'zip'>('json');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Build the export data with both content and chat history
      const exportData = {
        name: campaignName,
        exportedAt: new Date().toISOString(),
        version: '1.0',
        content: content.map((c) => ({
          id: c.id,
          type: c.type,
          data: c.data,
          createdAt: c.createdAt,
        })),
        chatHistory: messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
      };

      if (exportType === 'json') {
        // Quick export - JSON only
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${campaignName.replace(/[^a-z0-9]/gi, '_')}_campaign.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Full export - ZIP with media
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        // Add the campaign JSON
        zip.file('campaign.json', JSON.stringify(exportData, null, 2));

        // Add chat history as a readable text file
        const chatText = messages.map((m) => {
          const time = new Date(m.timestamp).toLocaleString();
          const role = m.role === 'user' ? 'You' : 'Campaign Assistant';
          return `[${time}] ${role}:\n${m.content}\n`;
        }).join('\n---\n\n');
        zip.file('chat_history.txt', chatText);

        // Create folders for different content types
        const mediaFolder = zip.folder('media');
        const settingsFolder = zip.folder('settings');
        const locationsFolder = zip.folder('locations');
        const npcsFolder = zip.folder('npcs');
        const encountersFolder = zip.folder('encounters');
        const questsFolder = zip.folder('quests');

        // Organize content by type
        for (const item of content) {
          const filename = `${item.id}.json`;
          const jsonContent = JSON.stringify(item.data, null, 2);

          switch (item.type) {
            case 'setting':
              settingsFolder?.file(filename, jsonContent);
              break;
            case 'location':
              locationsFolder?.file(filename, jsonContent);
              // If location has imageUrl, add a reference
              if ((item.data as { imageUrl?: string }).imageUrl) {
                mediaFolder?.file(`${item.id}_image.txt`, (item.data as { imageUrl?: string }).imageUrl || '');
              }
              break;
            case 'npc':
              npcsFolder?.file(filename, jsonContent);
              // If NPC has portrait, add a reference
              if ((item.data as { portraitUrl?: string }).portraitUrl) {
                mediaFolder?.file(`${item.id}_portrait.txt`, (item.data as { portraitUrl?: string }).portraitUrl || '');
              }
              break;
            case 'encounter':
              encountersFolder?.file(filename, jsonContent);
              break;
            case 'quest':
              questsFolder?.file(filename, jsonContent);
              break;
          }
        }

        // Add a README
        const readme = `# ${campaignName}

Exported from D&D Campaign Studio on ${new Date().toLocaleDateString()}

## Contents

- campaign.json - Complete campaign data including all content and chat history
- chat_history.txt - Human-readable conversation log
- settings/ - Campaign setting files
- locations/ - Location data
- npcs/ - NPC character data
- encounters/ - Encounter definitions
- quests/ - Quest objectives
- media/ - References to generated images (URLs)

## Importing

To continue working on this campaign, import the campaign.json file
in the Campaign Studio.
`;
        zip.file('README.md', readme);

        // Generate and download the ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${campaignName.replace(/[^a-z0-9]/gi, '_')}_campaign.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-bg-card rounded-xl border border-border p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-cinzel font-bold text-text-primary mb-2">
          Export Campaign
        </h2>
        <p className="text-sm text-text-muted mb-6">
          Choose how you want to export &quot;{campaignName}&quot;
        </p>

        <div className="space-y-3 mb-6">
          {/* Quick Export */}
          <label
            className={`block p-4 rounded-lg border cursor-pointer transition-all ${
              exportType === 'json'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-border/80'
            }`}
          >
            <input
              type="radio"
              name="exportType"
              value="json"
              checked={exportType === 'json'}
              onChange={() => setExportType('json')}
              className="sr-only"
            />
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center text-xl">
                📄
              </div>
              <div>
                <p className="font-medium text-text-primary">Quick Export (JSON)</p>
                <p className="text-xs text-text-muted">
                  Small file, links to hosted media. Best for sharing online.
                </p>
              </div>
            </div>
          </label>

          {/* Full Export */}
          <label
            className={`block p-4 rounded-lg border cursor-pointer transition-all ${
              exportType === 'zip'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-border/80'
            }`}
          >
            <input
              type="radio"
              name="exportType"
              value="zip"
              checked={exportType === 'zip'}
              onChange={() => setExportType('zip')}
              className="sr-only"
            />
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center text-xl">
                📦
              </div>
              <div>
                <p className="font-medium text-text-primary">Full Export (ZIP)</p>
                <p className="text-xs text-text-muted">
                  Includes all images, audio, and video. Works offline.
                </p>
              </div>
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-bg-elevated text-text-primary hover:bg-border transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-bg-dark font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Import Modal
function ImportModal({
  onImport,
  onClose,
}: {
  onImport: (data: CampaignExportData) => void;
  onClose: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CampaignExportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImportData = (data: unknown): data is CampaignExportData => {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
      typeof d.name === 'string' &&
      typeof d.exportedAt === 'string' &&
      typeof d.version === 'string' &&
      Array.isArray(d.content) &&
      Array.isArray(d.chatHistory)
    );
  };

  const handleFile = async (file: File) => {
    setError(null);
    setIsLoading(true);

    try {
      // Check file type
      if (!file.name.endsWith('.json')) {
        throw new Error('Please select a JSON file exported from Campaign Studio');
      }

      // Read file using FileReader for better browser compatibility
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file. Please try again.'));
        reader.readAsText(file);
      });
      const data = JSON.parse(text);

      // Validate structure
      if (!validateImportData(data)) {
        throw new Error('Invalid campaign file format. Please select a valid export file.');
      }

      setSelectedFile(file);
      setPreviewData(data);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON file. Please select a valid campaign export.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to read file');
      }
      setSelectedFile(null);
      setPreviewData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleImport = () => {
    if (previewData) {
      onImport(previewData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-bg-card rounded-xl border border-border p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-cinzel font-bold text-text-primary mb-2">
          Import Campaign
        </h2>
        <p className="text-sm text-text-muted mb-6">
          Restore a previously exported campaign with all content and chat history
        </p>

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-primary bg-primary/10'
              : selectedFile
              ? 'border-green-500 bg-green-500/10'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />

          {isLoading ? (
            <div className="py-4">
              <div className="w-8 h-8 spinner border-2 mx-auto mb-2" />
              <p className="text-sm text-text-muted">Reading file...</p>
            </div>
          ) : selectedFile && previewData ? (
            <div className="py-2">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-medium text-text-primary mb-1">{previewData.name}</p>
              <p className="text-xs text-text-muted">
                {previewData.content.length} items • {previewData.chatHistory.length} messages
              </p>
              <p className="text-xs text-text-muted mt-1">
                Exported: {new Date(previewData.exportedAt).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-bg-elevated flex items-center justify-center">
                <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <p className="text-sm text-text-primary mb-1">
                Drop your campaign file here
              </p>
              <p className="text-xs text-text-muted">
                or click to browse • .json files only
              </p>
            </>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Preview info */}
        {previewData && (
          <div className="mt-4 p-3 rounded-lg bg-bg-elevated">
            <h3 className="text-xs font-medium text-text-primary mb-2">Content Preview</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
              <div>Settings: {previewData.content.filter(c => c.type === 'setting').length}</div>
              <div>Locations: {previewData.content.filter(c => c.type === 'location').length}</div>
              <div>NPCs: {previewData.content.filter(c => c.type === 'npc').length}</div>
              <div>Encounters: {previewData.content.filter(c => c.type === 'encounter').length}</div>
              <div>Quests: {previewData.content.filter(c => c.type === 'quest').length}</div>
              <div>Messages: {previewData.chatHistory.length}</div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-bg-elevated text-text-primary hover:bg-border transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleImport}
            disabled={!previewData}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-bg-dark font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Welcome screen component
function WelcomeScreen({ onStartNew, onImport }: { onStartNew: () => void; onImport?: () => void }) {
  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full bg-bg-card rounded-xl border border-border p-8 text-center"
      >
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-primary flex items-center justify-center">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-cinzel font-bold text-text-primary mb-2">
          Campaign Studio
        </h1>
        <p className="text-text-secondary mb-8">
          Create immersive D&D campaigns with AI assistance. Describe your vision,
          and watch your world come to life with locations, NPCs, encounters, and quests.
        </p>

        {/* How it works */}
        <div className="bg-bg-elevated rounded-lg p-4 mb-8 text-left">
          <h3 className="text-sm font-medium text-text-primary mb-3">How it works:</h3>
          <ol className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <span>Chat with the AI to describe your campaign vision</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <span>Watch your campaign take shape in the preview panel</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <span>Click items to refine them, or ask for changes in chat</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
              <span>Export your campaign to share or use in gameplay</span>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStartNew}
            className="w-full px-6 py-3 bg-primary text-bg-dark rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Start New Campaign
          </motion.button>

          {onImport && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onImport}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-500 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Import Existing Campaign
            </motion.button>
          )}

          <Link href="/dm/campaigns">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-6 py-3 bg-bg-elevated text-text-primary rounded-lg hover:bg-border transition-colors"
            >
              Edit Existing Campaign
            </motion.button>
          </Link>
        </div>

        {/* Back link */}
        <Link href="/dm" className="inline-block mt-6">
          <span className="text-sm text-text-muted hover:text-text-secondary">
            ← Back to DM Dashboard
          </span>
        </Link>
      </motion.div>
    </div>
  );
}
