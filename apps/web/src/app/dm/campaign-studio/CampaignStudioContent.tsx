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
import { ContentBlock } from '@/stores/campaignStudioStore';

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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [campaignName, setCampaignName] = useState('New Campaign');

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    messages,
    generatedContent,
    isGenerating,
    error,
    sendMessage,
    regenerateContent,
    clearConversation,
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
    // TODO: Implement actual save to API
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSaveStatus('saved');
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
    return <WelcomeScreen onStartNew={handleStartNew} />;
  }

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col">
      {/* Header */}
      <header className="bg-bg-card border-b border-border">
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
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel (left) */}
        <div className="flex-1 flex flex-col min-w-0 lg:max-w-[60%]">
          <ChatPanel messages={messages} isGenerating={isGenerating} />
          <ChatInput onSend={sendMessage} isGenerating={isGenerating} />
        </div>

        {/* Live preview panel (right) - Desktop */}
        <div className="hidden lg:block w-[40%] min-w-[320px] max-w-[480px]">
          <LiveCampaignPreview
            campaignName={campaignName}
            content={generatedContent}
            onItemClick={handleItemClick}
            onRegenerate={regenerateContent}
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
                    content={generatedContent}
                    onItemClick={handleItemClick}
                    onRegenerate={regenerateContent}
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
                console.log('Video generated:', url);
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
              onGenerated={(audio) => {
                console.log('Voice generated:', audio);
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
            onClose={() => setShowExportModal(false)}
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
  onClose,
}: {
  campaignName: string;
  content: ContentBlock[];
  onClose: () => void;
}) {
  const [exportType, setExportType] = useState<'json' | 'zip'>('json');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      if (exportType === 'json') {
        // Quick export - JSON only
        const exportData = {
          name: campaignName,
          exportedAt: new Date().toISOString(),
          version: '1.0',
          content: content.map((c) => ({
            type: c.type,
            data: c.data,
            createdAt: c.createdAt,
          })),
        };

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
        // Full export - ZIP with media (placeholder for now)
        // TODO: Implement ZIP export with JSZip
        alert('ZIP export coming soon! For now, please use JSON export.');
      }
    } catch (error) {
      console.error('Export failed:', error);
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

// Welcome screen component
function WelcomeScreen({ onStartNew }: { onStartNew: () => void }) {
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
