'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  useCampaignStudioStore,
  CampaignPhase,
  PHASE_ORDER,
  ContentBlock,
} from '@/stores/campaignStudioStore';

/**
 * Hook for managing Campaign Studio interactions
 * Provides a simplified interface to the campaign studio store
 */
export function useCampaignStudio(campaignId?: string) {
  const router = useRouter();
  const { token, user, _hasHydrated } = useAuthStore();

  const {
    id: conversationId,
    currentPhase,
    completedPhases,
    messages,
    generatedContent,
    isGenerating,
    isSaving,
    lastSavedAt,
    error,
    startConversation,
    sendMessage,
    advancePhase,
    setPhase,
    regenerateContent,
    editContent,
    clearConversation,
    setError,
    saveContent,
    generateImage,
    loadContent,
    addContent,
  } = useCampaignStudioStore();

  // Redirect if not authenticated (only after hydration)
  useEffect(() => {
    if (_hasHydrated && !token) {
      router.push('/login?redirect=/dm/campaign-studio');
    }
  }, [_hasHydrated, token, router]);

  // Start conversation when campaign ID changes (only after hydration)
  useEffect(() => {
    if (_hasHydrated && campaignId && token && !conversationId) {
      startConversation(campaignId);
    }
  }, [_hasHydrated, campaignId, token, conversationId, startConversation]);

  // Check if phase is complete (has generated content)
  const isPhaseComplete = useCallback(
    (phase: CampaignPhase): boolean => {
      return completedPhases.includes(phase);
    },
    [completedPhases]
  );

  // Check if can advance to next phase
  const canAdvancePhase = useCallback((): boolean => {
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    const isLastPhase = currentIndex === PHASE_ORDER.length - 1;

    // Need some content generated in current phase
    const hasContentForPhase = generatedContent.some((c) => {
      if (currentPhase === 'setting' || currentPhase === 'story') {
        return c.type === 'setting';
      }
      if (currentPhase === 'locations') return c.type === 'location';
      if (currentPhase === 'npcs') return c.type === 'npc';
      if (currentPhase === 'encounters') return c.type === 'encounter';
      if (currentPhase === 'quests') return c.type === 'quest';
      return false;
    });

    return !isLastPhase && hasContentForPhase && !isGenerating;
  }, [currentPhase, generatedContent, isGenerating]);

  // Get content for specific phase
  const getPhaseContent = useCallback(
    (phase: CampaignPhase): ContentBlock[] => {
      return generatedContent.filter((c) => {
        if (phase === 'setting' || phase === 'story') return c.type === 'setting';
        if (phase === 'locations') return c.type === 'location';
        if (phase === 'npcs') return c.type === 'npc';
        if (phase === 'encounters') return c.type === 'encounter';
        if (phase === 'quests') return c.type === 'quest';
        return false;
      });
    },
    [generatedContent]
  );

  // Get current phase index
  const currentPhaseIndex = PHASE_ORDER.indexOf(currentPhase);
  const totalPhases = PHASE_ORDER.length;
  const progressPercent = Math.round(
    ((completedPhases.length + (isPhaseComplete(currentPhase) ? 1 : 0)) / totalPhases) * 100
  );

  // Send message with validation
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isGenerating) return;
      await sendMessage(content.trim());
    },
    [sendMessage, isGenerating]
  );

  // Handle phase advancement
  const handleAdvancePhase = useCallback(async () => {
    if (!canAdvancePhase()) return;
    await advancePhase();
  }, [advancePhase, canAdvancePhase]);

  // Navigate to a specific phase (if allowed)
  const goToPhase = useCallback(
    (phase: CampaignPhase) => {
      const phaseIndex = PHASE_ORDER.indexOf(phase);
      const canNavigate =
        completedPhases.includes(phase) || phaseIndex <= currentPhaseIndex;

      if (canNavigate) {
        setPhase(phase);
      }
    },
    [completedPhases, currentPhaseIndex, setPhase]
  );

  // Clear error after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  return {
    // State
    conversationId,
    currentPhase,
    currentPhaseIndex,
    totalPhases,
    progressPercent,
    completedPhases,
    messages,
    generatedContent,
    isGenerating,
    isSaving,
    lastSavedAt,
    error,
    isAuthenticated: !!token,
    user,

    // Phase helpers
    isPhaseComplete,
    canAdvancePhase,
    getPhaseContent,

    // Actions
    sendMessage: handleSendMessage,
    advancePhase: handleAdvancePhase,
    goToPhase,
    regenerateContent,
    editContent,
    addContent,
    clearConversation,
    setError,
    startConversation,
    saveContent,
    generateImage,
    loadContent,
  };
}

export default useCampaignStudio;
