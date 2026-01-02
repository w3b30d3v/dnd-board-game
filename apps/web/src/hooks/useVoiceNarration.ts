'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:4003';
const DEFAULT_TIMEOUT = 60000; // 60 seconds for voice generation

// Helper to create fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Voice profile info
export interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  category: 'narrator' | 'npc' | 'system';
}

// Voice status info
export interface VoiceStatus {
  available: boolean;
  configured?: boolean;
  characterCount?: number;
  characterLimit?: number;
  remainingCharacters?: number;
  reason?: string;
}

// Generated audio result
export interface GeneratedAudio {
  audioUrl: string;
  duration: number;
  characterCount: number;
  voiceProfile: string;
}

// Narration queue item
interface NarrationItem {
  id: string;
  text: string;
  voiceProfile?: string;
  emotion?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * Hook for checking ElevenLabs TTS status
 */
export function useVoiceStatus() {
  const [status, setStatus] = useState<VoiceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    async function checkStatus() {
      if (!token) {
        setStatus({ available: false, reason: 'Not authenticated' });
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${AI_SERVICE_URL}/ai/voice/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        } else {
          setStatus({ available: false, reason: 'Failed to check status' });
        }
      } catch {
        setStatus({ available: false, reason: 'Service unavailable' });
      } finally {
        setIsLoading(false);
      }
    }

    checkStatus();
  }, [token]);

  return { status, isLoading, isConfigured: status?.configured ?? status?.available ?? false };
}

/**
 * Hook for fetching available voice profiles
 */
export function useVoiceProfiles() {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    async function fetchProfiles() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${AI_SERVICE_URL}/ai/voice/profiles`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProfiles(data.profiles || []);
          setEmotions(data.emotions || []);
        }
      } catch {
        // Silently fail - profiles will be empty
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfiles();
  }, [token]);

  return { profiles, emotions, isLoading };
}

/**
 * Main hook for voice narration generation and playback
 */
export function useVoiceNarration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<GeneratedAudio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<NarrationItem[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentItemRef = useRef<NarrationItem | null>(null);
  const { token } = useAuthStore();

  // Process the narration queue
  const processQueue = useCallback(async () => {
    if (queue.length === 0 || isGenerating || isPlaying) return;

    const item = queue[0];
    currentItemRef.current = item;
    setQueue((prev) => prev.slice(1));

    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetchWithTimeout(
        `${AI_SERVICE_URL}/ai/voice/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: item.text,
            voiceProfile: item.voiceProfile,
            emotion: item.emotion,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Generation failed: ${response.status}`);
      }

      const audio = await response.json();
      setCurrentAudio(audio);

      // Play the audio
      item.onStart?.();

      const audioElement = new Audio(audio.audioUrl);
      audioRef.current = audioElement;

      audioElement.onplay = () => setIsPlaying(true);
      audioElement.onended = () => {
        setIsPlaying(false);
        item.onEnd?.();
        currentItemRef.current = null;
        // Process next item in queue
        setTimeout(() => processQueue(), 100);
      };
      audioElement.onerror = () => {
        setIsPlaying(false);
        setError('Failed to play audio');
        item.onEnd?.();
        currentItemRef.current = null;
      };

      await audioElement.play();
    } catch (err) {
      // Check if it's a timeout error (AbortError)
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Voice generation timed out. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate speech');
      }
      currentItemRef.current = null;
    } finally {
      setIsGenerating(false);
    }
  }, [queue, isGenerating, isPlaying, token]);

  // Watch queue and process items
  useEffect(() => {
    if (queue.length > 0 && !isGenerating && !isPlaying) {
      processQueue();
    }
  }, [queue, isGenerating, isPlaying, processQueue]);

  // Generate and play speech immediately
  const speak = useCallback(
    async (
      text: string,
      options?: {
        voiceProfile?: string;
        emotion?: string;
        onStart?: () => void;
        onEnd?: () => void;
      }
    ) => {
      const id = `narration_${Date.now()}`;
      setQueue((prev) => [
        ...prev,
        {
          id,
          text,
          voiceProfile: options?.voiceProfile,
          emotion: options?.emotion,
          onStart: options?.onStart,
          onEnd: options?.onEnd,
        },
      ]);
      return id;
    },
    []
  );

  // Generate narration for campaign content
  const narrateContent = useCallback(
    async (
      content: string,
      contentType: 'setting' | 'location' | 'npc' | 'encounter' | 'quest' | 'dialogue',
      options?: {
        speakerName?: string;
        voiceProfile?: string;
        emotion?: string;
      }
    ): Promise<GeneratedAudio> => {
      if (!token) {
        throw new Error('Not authenticated');
      }

      setIsGenerating(true);
      setError(null);

      try {
        const response = await fetchWithTimeout(
          `${AI_SERVICE_URL}/ai/voice/narrate`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              content,
              contentType,
              ...options,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Narration failed: ${response.status}`);
        }

        const audio = await response.json();
        setCurrentAudio(audio);
        return audio;
      } catch (err) {
        // Check if it's a timeout error (AbortError)
        let message: string;
        if (err instanceof Error && err.name === 'AbortError') {
          message = 'Narration generation timed out. Please try again.';
        } else {
          message = err instanceof Error ? err.message : 'Failed to generate narration';
        }
        setError(message);
        throw new Error(message);
      } finally {
        setIsGenerating(false);
      }
    },
    [token]
  );

  // Play a specific audio URL
  const playAudio = useCallback((audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audioElement = new Audio(audioUrl);
    audioRef.current = audioElement;

    audioElement.onplay = () => setIsPlaying(true);
    audioElement.onended = () => setIsPlaying(false);
    audioElement.onerror = () => {
      setIsPlaying(false);
      setError('Failed to play audio');
    };

    audioElement.play();
  }, []);

  // Pause current playback
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Resume current playback
  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  }, []);

  // Stop playback and clear queue
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setQueue([]);
    currentItemRef.current = null;
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return {
    // State
    isGenerating,
    isPlaying,
    currentAudio,
    error,
    queueLength: queue.length,

    // Actions
    speak,
    narrateContent,
    playAudio,
    pause,
    resume,
    stop,
    clearError,
  };
}

export default useVoiceNarration;
