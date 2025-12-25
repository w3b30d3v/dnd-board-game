'use client';

import { useCallback, useState } from 'react';
import { useCampaignStudioStore } from '@/stores/campaignStudioStore';

export type CutsceneTriggerType =
  | 'campaign_start'
  | 'chapter_start'
  | 'chapter_end'
  | 'location_enter'
  | 'npc_meet'
  | 'combat_start'
  | 'combat_victory'
  | 'combat_defeat'
  | 'quest_start'
  | 'quest_complete'
  | 'boss_encounter'
  | 'revelation'
  | 'custom';

export interface CutsceneTrigger {
  id: string;
  type: CutsceneTriggerType;
  name: string;
  description?: string;
  videoUrl?: string;
  narrationText?: string;
  voiceProfileId?: string;
  autoPlay: boolean;
  priority: number; // Higher priority triggers first
  conditions?: CutsceneCondition[];
}

export interface CutsceneCondition {
  type: 'quest_complete' | 'location_visited' | 'npc_met' | 'item_obtained' | 'level_reached' | 'custom';
  value: string;
}

interface CutsceneQueueItem {
  trigger: CutsceneTrigger;
  context?: Record<string, unknown>;
}

export function useCutsceneTriggers() {
  const [queue, setQueue] = useState<CutsceneQueueItem[]>([]);
  const [currentCutscene, setCurrentCutscene] = useState<CutsceneQueueItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const { generatedContent } = useCampaignStudioStore();

  // Get all cutscenes from campaign content
  const getCampaignCutscenes = useCallback((): CutsceneTrigger[] => {
    // Extract cutscenes from generated content
    const cutsceneContent = generatedContent.filter(c => c.type === 'cutscene' as never);
    return cutsceneContent.map((c, index) => ({
      id: c.id,
      type: 'custom' as CutsceneTriggerType,
      name: (c.data as { name?: string })?.name || `Cutscene ${index + 1}`,
      description: (c.data as { description?: string })?.description,
      videoUrl: (c.data as { videoUrl?: string })?.videoUrl,
      narrationText: (c.data as { narrationText?: string })?.narrationText,
      autoPlay: false,
      priority: index,
    }));
  }, [generatedContent]);

  // Queue a cutscene to play
  const queueCutscene = useCallback((trigger: CutsceneTrigger, context?: Record<string, unknown>) => {
    setQueue(prev => {
      const newQueue = [...prev, { trigger, context }];
      // Sort by priority (higher first)
      return newQueue.sort((a, b) => b.trigger.priority - a.trigger.priority);
    });
  }, []);

  // Queue multiple cutscenes
  const queueCutscenes = useCallback((triggers: CutsceneTrigger[], context?: Record<string, unknown>) => {
    setQueue(prev => {
      const newItems = triggers.map(trigger => ({ trigger, context }));
      const newQueue = [...prev, ...newItems];
      return newQueue.sort((a, b) => b.trigger.priority - a.trigger.priority);
    });
  }, []);

  // Play next cutscene in queue
  const playNext = useCallback(() => {
    if (queue.length === 0) {
      setCurrentCutscene(null);
      setIsPlaying(false);
      return null;
    }

    const [next, ...remaining] = queue;
    setQueue(remaining);
    setCurrentCutscene(next);
    setIsPlaying(true);
    return next;
  }, [queue]);

  // Complete current cutscene and move to next
  const completeCutscene = useCallback(() => {
    setCurrentCutscene(null);
    setIsPlaying(false);
    // Auto-play next if available
    if (queue.length > 0) {
      setTimeout(() => playNext(), 500);
    }
  }, [queue.length, playNext]);

  // Skip current cutscene
  const skipCutscene = useCallback(() => {
    completeCutscene();
  }, [completeCutscene]);

  // Clear all queued cutscenes
  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentCutscene(null);
    setIsPlaying(false);
  }, []);

  // Trigger cutscenes by type (e.g., on location enter)
  const triggerByType = useCallback((type: CutsceneTriggerType, context?: Record<string, unknown>) => {
    const cutscenes = getCampaignCutscenes();
    const matching = cutscenes.filter(c => c.type === type);
    if (matching.length > 0) {
      queueCutscenes(matching, context);
      if (!isPlaying) {
        playNext();
      }
    }
  }, [getCampaignCutscenes, queueCutscenes, isPlaying, playNext]);

  // Create predefined triggers for common events
  const triggerCampaignStart = useCallback((campaignName: string) => {
    triggerByType('campaign_start', { campaignName });
  }, [triggerByType]);

  const triggerLocationEnter = useCallback((locationName: string, locationType: string) => {
    triggerByType('location_enter', { locationName, locationType });
  }, [triggerByType]);

  const triggerNPCMeet = useCallback((npcName: string, npcRole: string) => {
    triggerByType('npc_meet', { npcName, npcRole });
  }, [triggerByType]);

  const triggerCombatStart = useCallback((encounterName: string, isBoss: boolean) => {
    triggerByType(isBoss ? 'boss_encounter' : 'combat_start', { encounterName, isBoss });
  }, [triggerByType]);

  const triggerCombatEnd = useCallback((victory: boolean) => {
    triggerByType(victory ? 'combat_victory' : 'combat_defeat', { victory });
  }, [triggerByType]);

  const triggerQuestUpdate = useCallback((questName: string, isComplete: boolean) => {
    triggerByType(isComplete ? 'quest_complete' : 'quest_start', { questName, isComplete });
  }, [triggerByType]);

  return {
    // State
    queue,
    currentCutscene,
    isPlaying,
    queueLength: queue.length,

    // Queue management
    queueCutscene,
    queueCutscenes,
    playNext,
    completeCutscene,
    skipCutscene,
    clearQueue,

    // Event triggers
    triggerByType,
    triggerCampaignStart,
    triggerLocationEnter,
    triggerNPCMeet,
    triggerCombatStart,
    triggerCombatEnd,
    triggerQuestUpdate,

    // Data access
    getCampaignCutscenes,
  };
}

export default useCutsceneTriggers;
