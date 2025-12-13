/**
 * Image Preloader
 * Preloads AI-generated images on app startup for faster display
 */

import {
  RACE_IMAGES,
  CLASS_IMAGES,
  BACKGROUND_IMAGES,
  TERRAIN_IMAGES,
  HERO_IMAGES,
} from '@/data/staticImages';

// Track loading state
let preloadStarted = false;
let preloadComplete = false;
const loadedImages: Map<string, HTMLImageElement> = new Map();
const loadPromises: Map<string, Promise<HTMLImageElement>> = new Map();

/**
 * Preload a single image
 */
function preloadImage(url: string): Promise<HTMLImageElement> {
  // Return cached promise if already loading/loaded
  if (loadPromises.has(url)) {
    return loadPromises.get(url)!;
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      loadedImages.set(url, img);
      resolve(img);
    };
    img.onerror = () => {
      console.warn(`Failed to preload image: ${url}`);
      reject(new Error(`Failed to load ${url}`));
    };
    img.src = url;
  });

  loadPromises.set(url, promise);
  return promise;
}

/**
 * Preload all static images in priority order
 * High priority: Character builder images (race, class, background)
 * Lower priority: Terrain, hero images
 */
export async function preloadAllImages(
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  if (preloadStarted) {
    // Wait for existing preload to complete
    while (!preloadComplete) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return;
  }

  preloadStarted = true;
  console.log('Starting image preload...');

  // Collect all image URLs in priority order
  const highPriorityUrls = [
    ...Object.values(RACE_IMAGES),
    ...Object.values(CLASS_IMAGES),
    ...Object.values(BACKGROUND_IMAGES),
  ].filter(Boolean);

  const lowPriorityUrls = [
    ...Object.values(TERRAIN_IMAGES),
    ...Object.values(HERO_IMAGES),
  ].filter(Boolean);

  const allUrls = [...highPriorityUrls, ...lowPriorityUrls];
  let loaded = 0;

  // Load high priority images first (character builder)
  console.log(`Preloading ${highPriorityUrls.length} high-priority images...`);

  // Load in batches to avoid overwhelming the browser
  const batchSize = 4;

  for (let i = 0; i < highPriorityUrls.length; i += batchSize) {
    const batch = highPriorityUrls.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async (url) => {
        try {
          await preloadImage(url);
          loaded++;
          onProgress?.(loaded, allUrls.length);
        } catch {
          loaded++;
          onProgress?.(loaded, allUrls.length);
        }
      })
    );
  }

  console.log(`High-priority images loaded. Loading ${lowPriorityUrls.length} low-priority images...`);

  // Load low priority images
  for (let i = 0; i < lowPriorityUrls.length; i += batchSize) {
    const batch = lowPriorityUrls.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async (url) => {
        try {
          await preloadImage(url);
          loaded++;
          onProgress?.(loaded, allUrls.length);
        } catch {
          loaded++;
          onProgress?.(loaded, allUrls.length);
        }
      })
    );
  }

  preloadComplete = true;
  console.log(`Image preload complete: ${loadedImages.size}/${allUrls.length} images cached`);
}

/**
 * Check if an image is already loaded
 */
export function isImageLoaded(url: string): boolean {
  return loadedImages.has(url);
}

/**
 * Get preload status
 */
export function getPreloadStatus(): {
  started: boolean;
  complete: boolean;
  loaded: number;
} {
  return {
    started: preloadStarted,
    complete: preloadComplete,
    loaded: loadedImages.size,
  };
}

/**
 * Preload specific category of images
 */
export async function preloadCategory(
  category: 'race' | 'class' | 'background' | 'terrain' | 'hero'
): Promise<void> {
  const imageMap = {
    race: RACE_IMAGES,
    class: CLASS_IMAGES,
    background: BACKGROUND_IMAGES,
    terrain: TERRAIN_IMAGES,
    hero: HERO_IMAGES,
  };

  const urls = Object.values(imageMap[category]).filter(Boolean);
  await Promise.allSettled(urls.map(preloadImage));
}
