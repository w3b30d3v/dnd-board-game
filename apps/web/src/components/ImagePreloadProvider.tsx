'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { preloadAllImages, getPreloadStatus } from '@/lib/imagePreloader';

interface PreloadContextValue {
  isLoading: boolean;
  isComplete: boolean;
  progress: number;
  loadedCount: number;
  totalCount: number;
}

const PreloadContext = createContext<PreloadContextValue>({
  isLoading: false,
  isComplete: false,
  progress: 0,
  loadedCount: 0,
  totalCount: 0,
});

export function useImagePreload() {
  return useContext(PreloadContext);
}

interface ImagePreloadProviderProps {
  children: ReactNode;
}

export function ImagePreloadProvider({ children }: ImagePreloadProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    // Check if already complete
    const status = getPreloadStatus();
    if (status.complete) {
      setIsComplete(true);
      setLoadedCount(status.loaded);
      return;
    }

    // Start preloading
    setIsLoading(true);

    preloadAllImages((loaded, total) => {
      setLoadedCount(loaded);
      setTotalCount(total);
    })
      .then(() => {
        setIsLoading(false);
        setIsComplete(true);
      })
      .catch((error) => {
        console.error('Image preload error:', error);
        setIsLoading(false);
      });
  }, []);

  const progress = totalCount > 0 ? (loadedCount / totalCount) * 100 : 0;

  return (
    <PreloadContext.Provider
      value={{ isLoading, isComplete, progress, loadedCount, totalCount }}
    >
      {children}
    </PreloadContext.Provider>
  );
}
