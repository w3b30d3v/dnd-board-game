'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useCampaignStudio } from '@/hooks/useCampaignStudio';
import {
  ChatPanel,
  ChatInput,
  PhaseProgress,
  PhaseProgressCompact,
  ContentPreview,
} from '@/components/campaign-studio';

export default function CampaignStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams?.get('campaign') ?? null;

  const { token, user, _hasHydrated } = useAuthStore();
  const [showMobileContent, setShowMobileContent] = useState(false);

  const {
    conversationId,
    currentPhase,
    currentPhaseIndex,
    totalPhases,
    progressPercent,
    completedPhases,
    messages,
    generatedContent,
    isGenerating,
    error,
    canAdvancePhase,
    sendMessage,
    advancePhase,
    goToPhase,
    regenerateContent,
    clearConversation,
    startConversation,
  } = useCampaignStudio(campaignId || undefined);

  // Wait for hydration before checking auth
  useEffect(() => {
    if (_hasHydrated && !token) {
      router.push('/login?redirect=/dm/campaign-studio');
    }
  }, [_hasHydrated, token, router]);

  // Handle campaign selection
  const handleStartNew = () => {
    clearConversation();
    // For now, create a temporary campaign ID
    const tempCampaignId = `temp_${Date.now()}`;
    router.push(`/dm/campaign-studio?campaign=${tempCampaignId}`);
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
              <p className="text-xs text-text-muted">
                AI-Powered Campaign Creation
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile content toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMobileContent(!showMobileContent)}
              className="lg:hidden p-2 rounded-lg bg-bg-elevated hover:bg-border transition-colors"
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {generatedContent.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-bg-dark text-[10px] rounded-full flex items-center justify-center">
                  {generatedContent.length}
                </span>
              )}
            </motion.button>

            {/* Advance phase button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={advancePhase}
              disabled={!canAdvancePhase()}
              className={`
                hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                transition-all duration-200
                ${
                  canAdvancePhase()
                    ? 'bg-primary text-bg-dark hover:bg-primary/90'
                    : 'bg-bg-elevated text-text-muted cursor-not-allowed'
                }
              `}
            >
              Next Phase
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Phase Progress - Desktop */}
      <div className="hidden lg:block">
        <PhaseProgress
          currentPhase={currentPhase}
          completedPhases={completedPhases}
          onPhaseClick={goToPhase}
        />
      </div>

      {/* Phase Progress - Mobile */}
      <div className="lg:hidden">
        <PhaseProgressCompact
          currentPhase={currentPhase}
          completedPhases={completedPhases}
          progressPercent={progressPercent}
        />
      </div>

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

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatPanel messages={messages} isGenerating={isGenerating} />
          <ChatInput onSend={sendMessage} isGenerating={isGenerating} />
        </div>

        {/* Content preview - Desktop */}
        <div className="hidden lg:block w-80 xl:w-96">
          <ContentPreview
            content={generatedContent}
            currentPhase={currentPhase}
            onRegenerate={regenerateContent}
          />
        </div>

        {/* Content preview - Mobile overlay */}
        <AnimatePresence>
          {showMobileContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/50"
              onClick={() => setShowMobileContent(false)}
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="absolute right-0 top-0 bottom-0 w-80 bg-bg-card"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h2 className="font-medium text-text-primary">Content</h2>
                  <button
                    onClick={() => setShowMobileContent(false)}
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
                  <ContentPreview
                    content={generatedContent}
                    currentPhase={currentPhase}
                    onRegenerate={regenerateContent}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile advance button */}
      <div className="sm:hidden p-4 border-t border-border bg-bg-card">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={advancePhase}
          disabled={!canAdvancePhase()}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium
            transition-all duration-200
            ${
              canAdvancePhase()
                ? 'bg-primary text-bg-dark'
                : 'bg-bg-elevated text-text-muted cursor-not-allowed'
            }
          `}
        >
          Complete Phase & Continue
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </motion.button>
      </div>
    </div>
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
          AI Campaign Studio
        </h1>
        <p className="text-text-secondary mb-8">
          Create immersive D&D campaigns with Claude AI. Have a conversation, and watch
          your world come to life with locations, NPCs, encounters, and quests.
        </p>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { icon: '🌍', label: 'World Building' },
            { icon: '👥', label: 'NPC Generation' },
            { icon: '⚔️', label: 'Encounters' },
            { icon: '🎯', label: 'Quest Design' },
          ].map((feature) => (
            <div
              key={feature.label}
              className="p-3 bg-bg-elevated rounded-lg border border-border/50"
            >
              <span className="text-2xl block mb-1">{feature.icon}</span>
              <span className="text-xs text-text-secondary">{feature.label}</span>
            </div>
          ))}
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
              Choose Existing Campaign
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
