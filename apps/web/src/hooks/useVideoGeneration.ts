'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:4003';
const DEFAULT_TIMEOUT = 120000; // 2 minutes for video generation start

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

export type VideoStatus = 'PENDING' | 'THROTTLED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

export interface VideoTask {
  taskId: string;
  status: VideoStatus;
  progress?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
  createdAt?: string;
}

export interface GenerateVideoOptions {
  sceneDescription: string;
  style?: 'cinematic' | 'fantasy' | 'dark' | 'epic';
  duration?: 4 | 6 | 8;
  aspectRatio?: '1280:720' | '720:1280' | '1080:1920' | '1920:1080';
  model?: 'veo3.1' | 'veo3.1_fast';
  audio?: boolean;
  campaignId?: string;
}

export interface GenerateFromImageOptions {
  sceneDescription: string;
  imageUrl: string;
  style?: 'cinematic' | 'fantasy' | 'dark' | 'epic';
  duration?: 4 | 5 | 6 | 8 | 10;
  aspectRatio?: '1280:720' | '720:1280' | '1080:1920' | '1920:1080' | '768:1280' | '1280:768';
  model?: 'gen3a_turbo' | 'veo3.1' | 'veo3.1_fast';
  seed?: number;
  campaignId?: string;
}

export interface GeneratePresetOptions {
  preset: string;
  duration?: 4 | 6 | 8;
  campaignId?: string;
}

// Helper to get auth token
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const storage = localStorage.getItem('auth-storage');
  if (!storage) return null;
  try {
    const parsed = JSON.parse(storage);
    return parsed.state?.token || null;
  } catch {
    return null;
  }
};

export function useVideoGeneration() {
  const [task, setTask] = useState<VideoTask | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Poll for task status
  const pollStatus = useCallback(async (taskId: string) => {
    const token = getAuthToken();
    if (!token) {
      setError('Not authenticated');
      stopPolling();
      return;
    }

    try {
      const response = await fetch(`${AI_SERVICE_URL}/ai/video/${taskId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to get video status');
      }

      const data = await response.json();
      setTask(data);

      // Stop polling when complete
      if (['SUCCEEDED', 'FAILED', 'CANCELLED'].includes(data.status)) {
        stopPolling();
        setIsGenerating(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      stopPolling();
      setIsGenerating(false);
    }
  }, [stopPolling]);

  // Start polling for status
  const startPolling = useCallback((taskId: string) => {
    stopPolling();
    // Poll every 5 seconds (Runway recommends no more frequent than 5s)
    pollingRef.current = setInterval(() => pollStatus(taskId), 5000);
    // Also poll immediately
    pollStatus(taskId);
  }, [pollStatus, stopPolling]);

  // Generate video from text
  const generateVideo = useCallback(async (options: GenerateVideoOptions): Promise<VideoTask | null> => {
    const token = getAuthToken();
    if (!token) {
      setError('Not authenticated');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetchWithTimeout(
        `${AI_SERVICE_URL}/ai/video/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(options),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start video generation');
      }

      const data = await response.json();
      const newTask: VideoTask = {
        taskId: data.taskId,
        status: data.status,
      };

      setTask(newTask);
      startPolling(data.taskId);

      return newTask;
    } catch (err) {
      let message: string;
      if (err instanceof Error && err.name === 'AbortError') {
        message = 'Video generation request timed out. Please try again.';
      } else {
        message = err instanceof Error ? err.message : 'Unknown error';
      }
      setError(message);
      setIsGenerating(false);
      return null;
    }
  }, [startPolling]);

  // Generate video from image
  const generateFromImage = useCallback(async (options: GenerateFromImageOptions): Promise<VideoTask | null> => {
    const token = getAuthToken();
    if (!token) {
      setError('Not authenticated');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetchWithTimeout(
        `${AI_SERVICE_URL}/ai/video/generate-from-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(options),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start video generation');
      }

      const data = await response.json();
      const newTask: VideoTask = {
        taskId: data.taskId,
        status: data.status,
      };

      setTask(newTask);
      startPolling(data.taskId);

      return newTask;
    } catch (err) {
      let message: string;
      if (err instanceof Error && err.name === 'AbortError') {
        message = 'Video generation request timed out. Please try again.';
      } else {
        message = err instanceof Error ? err.message : 'Unknown error';
      }
      setError(message);
      setIsGenerating(false);
      return null;
    }
  }, [startPolling]);

  // Generate video from preset
  const generateFromPreset = useCallback(async (options: GeneratePresetOptions): Promise<VideoTask | null> => {
    const token = getAuthToken();
    if (!token) {
      setError('Not authenticated');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetchWithTimeout(
        `${AI_SERVICE_URL}/ai/video/generate-preset`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(options),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start video generation');
      }

      const data = await response.json();
      const newTask: VideoTask = {
        taskId: data.taskId,
        status: data.status,
      };

      setTask(newTask);
      startPolling(data.taskId);

      return newTask;
    } catch (err) {
      let message: string;
      if (err instanceof Error && err.name === 'AbortError') {
        message = 'Video generation request timed out. Please try again.';
      } else {
        message = err instanceof Error ? err.message : 'Unknown error';
      }
      setError(message);
      setIsGenerating(false);
      return null;
    }
  }, [startPolling]);

  // Cancel video generation
  const cancelVideo = useCallback(async (): Promise<boolean> => {
    if (!task?.taskId) return false;

    const token = getAuthToken();
    if (!token) {
      setError('Not authenticated');
      return false;
    }

    try {
      const response = await fetch(`${AI_SERVICE_URL}/ai/video/${task.taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel video generation');
      }

      stopPolling();
      setTask((prev) => prev ? { ...prev, status: 'CANCELLED' } : null);
      setIsGenerating(false);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return false;
    }
  }, [task?.taskId, stopPolling]);

  // Clear the current task
  const clearTask = useCallback(() => {
    stopPolling();
    setTask(null);
    setError(null);
    setIsGenerating(false);
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    task,
    isGenerating,
    error,
    generateVideo,
    generateFromImage,
    generateFromPreset,
    cancelVideo,
    clearTask,
  };
}

// Hook to fetch available presets
export function useVideoPresets() {
  const [presets, setPresets] = useState<Array<{
    id: string;
    description: string;
    style: string;
    preview: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPresets = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setError('Not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${AI_SERVICE_URL}/ai/video/presets`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch presets');
      }

      const data = await response.json();
      setPresets(data.presets);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  return { presets, isLoading, error, refetch: fetchPresets };
}

// Hook to check Runway status
export function useRunwayStatus() {
  const [status, setStatus] = useState<{
    configured: boolean;
    models?: {
      textToVideo: string[];
      imageToVideo: string[];
    };
    durations?: {
      veo: number[];
      gen3a: number[];
    };
    estimatedCost?: {
      fourSeconds: number;
      sixSeconds: number;
      eightSeconds: number;
    };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${AI_SERVICE_URL}/ai/video/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch {
        // Ignore errors, just set as not configured
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  return { status, isLoading, isConfigured: status?.configured ?? false };
}
