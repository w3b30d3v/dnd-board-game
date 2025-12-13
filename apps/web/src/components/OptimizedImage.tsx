'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { isImageLoaded } from '@/lib/imagePreloader';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  fallbackSrc?: string;
}

/**
 * Optimized image component with:
 * - Loading skeleton
 * - Fade-in animation
 * - Fallback support
 * - Preload awareness
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fallbackSrc,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(!isImageLoaded(src));
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    // Reset state when src changes
    setError(false);
    setCurrentSrc(src);
    setIsLoading(!isImageLoaded(src));
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setError(false);
      setIsLoading(true);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-bg-elevated animate-pulse rounded">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
        </div>
      )}

      {/* Error state */}
      {error && !fallbackSrc && (
        <div className="absolute inset-0 bg-bg-elevated flex items-center justify-center rounded">
          <span className="text-text-secondary text-sm">Failed to load</span>
        </div>
      )}

      {/* Actual image */}
      {!error && (
        <Image
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          unoptimized // Skip Next.js optimization for external URLs
        />
      )}
    </div>
  );
}

/**
 * Simple skeleton loader for images
 */
export function ImageSkeleton({
  width,
  height,
  className = '',
}: {
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <div
      className={`bg-bg-elevated animate-pulse rounded relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
    </div>
  );
}
