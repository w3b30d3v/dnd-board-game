# D&D Digital Board Game Platform
# Document 22: Video, Cutscene & Animation System

---

# 1. Overview

This document specifies the complete media system for creating an immersive gaming experience, including:
- AI-generated images (portraits, locations, items)
- Cutscene creation and playback
- In-game animations and VFX
- Video integration for storytelling

---

# 2. Media Asset Types

## 2.1 Image Assets

| Type | Dimensions | Use Case | Generation Method |
|------|------------|----------|-------------------|
| Character Portrait | 512x512 | Character sheet, tokens | AI + Upload |
| Character Full Body | 512x768 | Character builder preview | AI + Upload |
| Location Art | 1920x1080 | Map backgrounds, cutscenes | AI + Upload |
| Item Icon | 128x128 | Inventory, loot | AI + Upload |
| Spell Icon | 64x64 | Action bar, spell list | Pre-made library |
| Monster Token | 256x256 | Board tokens | AI + Upload |
| Map Tile | 64x64 | Tile textures | Pre-made library |

## 2.2 Video/Animation Assets

| Type | Format | Duration | Use Case |
|------|--------|----------|----------|
| Cutscene Clip | MP4/WebM | 5-30s | Story beats |
| Spell VFX | Sprite sheet | 0.5-3s | Combat effects |
| Token Animation | Sprite sheet | 0.2-1s | Movement, attacks |
| Ambient Loop | WebM | 5-10s | Map backgrounds |
| Boss Intro | MP4/WebM | 10-20s | Boss encounters |

## 2.3 Audio Assets

| Type | Format | Use Case |
|------|--------|----------|
| SFX | MP3/OGG | Actions, UI |
| Music Loop | MP3/OGG | Ambient, combat |
| Voice Line | MP3/OGG | NPC dialogue |
| Ambient Sound | MP3/OGG | Environment |

---

# 3. AI Image Generation Pipeline

## 3.1 Generation API Endpoints

```typescript
// packages/shared/src/types/media.ts

interface ImageGenerationRequest {
  type: ImageAssetType;
  parameters: ImageParameters;
  dimensions: { width: number; height: number };
  style: ArtStyle;
  negative_prompt?: string;
}

type ImageAssetType =
  | 'CHARACTER_PORTRAIT'
  | 'CHARACTER_FULL_BODY'
  | 'LOCATION_ART'
  | 'ITEM_ICON'
  | 'MONSTER_TOKEN'
  | 'BATTLE_SCENE';

interface CharacterImageParams {
  race: Race;
  gender: 'male' | 'female' | 'neutral';
  class: CharacterClass;
  expression: 'neutral' | 'happy' | 'angry' | 'determined' | 'mysterious';
  age: 'young' | 'adult' | 'elderly';
  hair_color?: string;
  skin_tone?: string;
  distinguishing_features?: string[];
  equipment?: string[];  // ["plate armor", "longsword", "shield"]
}

interface LocationImageParams {
  setting: LocationSetting;
  time_of_day: 'dawn' | 'day' | 'dusk' | 'night';
  weather?: 'clear' | 'rain' | 'snow' | 'fog' | 'storm';
  mood: 'peaceful' | 'ominous' | 'mysterious' | 'dangerous' | 'magical';
  features: string[];  // ["ancient ruins", "glowing crystals"]
  lighting: 'natural' | 'torchlight' | 'magical' | 'moonlight';
}

type LocationSetting =
  | 'forest' | 'cave' | 'dungeon' | 'castle' | 'village'
  | 'mountain' | 'swamp' | 'desert' | 'underwater' | 'planar';

type ArtStyle =
  | 'fantasy_realistic'
  | 'fantasy_painterly'
  | 'dark_fantasy'
  | 'high_fantasy'
  | 'anime'
  | 'comic_book';
```

## 3.2 Generation Service Implementation

```typescript
// services/media-service/src/generators/imageGenerator.ts

import Replicate from 'replicate';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

interface GenerationJob {
  jobId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  request: ImageGenerationRequest;
  result?: GeneratedAsset;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export class ImageGenerator {
  private replicate: Replicate;
  private s3: S3Client;
  private redis: Redis;

  constructor() {
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
    this.s3 = new S3Client({ region: process.env.AWS_REGION });
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async generateImage(request: ImageGenerationRequest): Promise<string> {
    const jobId = `job_${nanoid()}`;
    
    // Queue job
    const job: GenerationJob = {
      jobId,
      status: 'QUEUED',
      request,
      createdAt: new Date(),
    };
    
    await this.redis.set(`media_job:${jobId}`, JSON.stringify(job));
    await this.redis.lpush('media_job_queue', jobId);
    
    return jobId;
  }

  async processJob(jobId: string): Promise<void> {
    const jobData = await this.redis.get(`media_job:${jobId}`);
    if (!jobData) throw new Error('Job not found');
    
    const job: GenerationJob = JSON.parse(jobData);
    job.status = 'PROCESSING';
    await this.redis.set(`media_job:${jobId}`, JSON.stringify(job));

    try {
      const prompt = this.buildPrompt(job.request);
      
      // Call AI model
      const output = await this.replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
          input: {
            prompt: prompt,
            negative_prompt: job.request.negative_prompt || this.getDefaultNegativePrompt(),
            width: job.request.dimensions.width,
            height: job.request.dimensions.height,
            num_outputs: 1,
            scheduler: "K_EULER",
            num_inference_steps: 30,
            guidance_scale: 7.5,
          }
        }
      );

      // Upload to S3
      const imageUrl = output[0];
      const imageBuffer = await this.downloadImage(imageUrl);
      const assetId = `asset_${nanoid()}`;
      
      await this.s3.send(new PutObjectCommand({
        Bucket: process.env.MEDIA_BUCKET,
        Key: `images/${assetId}.png`,
        Body: imageBuffer,
        ContentType: 'image/png',
      }));

      // Generate thumbnail
      const thumbnail = await this.generateThumbnail(imageBuffer);
      await this.s3.send(new PutObjectCommand({
        Bucket: process.env.MEDIA_BUCKET,
        Key: `thumbnails/${assetId}.png`,
        Body: thumbnail,
        ContentType: 'image/png',
      }));

      job.status = 'COMPLETED';
      job.completedAt = new Date();
      job.result = {
        assetId,
        urls: {
          original: `${process.env.CDN_URL}/images/${assetId}.png`,
          thumbnail: `${process.env.CDN_URL}/thumbnails/${assetId}.png`,
        },
      };
      
      await this.redis.set(`media_job:${jobId}`, JSON.stringify(job));
      
    } catch (error) {
      job.status = 'FAILED';
      job.error = error.message;
      await this.redis.set(`media_job:${jobId}`, JSON.stringify(job));
    }
  }

  private buildPrompt(request: ImageGenerationRequest): string {
    const stylePrefix = this.getStylePrefix(request.style);
    const typePrompt = this.getTypePrompt(request.type, request.parameters);
    return `${stylePrefix}, ${typePrompt}, high quality, detailed, 4k`;
  }

  private getStylePrefix(style: ArtStyle): string {
    const styles = {
      'fantasy_realistic': 'realistic fantasy art, detailed illustration',
      'fantasy_painterly': 'oil painting style, painterly fantasy art',
      'dark_fantasy': 'dark fantasy art, gothic style, dramatic lighting',
      'high_fantasy': 'vibrant high fantasy art, magical, epic',
      'anime': 'anime style illustration, clean lines',
      'comic_book': 'comic book style, bold colors, dynamic',
    };
    return styles[style];
  }

  private getTypePrompt(type: ImageAssetType, params: any): string {
    switch (type) {
      case 'CHARACTER_PORTRAIT':
        return this.buildCharacterPrompt(params);
      case 'LOCATION_ART':
        return this.buildLocationPrompt(params);
      case 'MONSTER_TOKEN':
        return `fantasy monster, ${params.creature_type}, menacing, token art`;
      default:
        return '';
    }
  }

  private buildCharacterPrompt(params: CharacterImageParams): string {
    const parts = [
      `${params.race} ${params.class}`,
      `${params.gender}`,
      `${params.expression} expression`,
      params.equipment?.join(', '),
      params.distinguishing_features?.join(', '),
      'portrait, character art, fantasy'
    ];
    return parts.filter(Boolean).join(', ');
  }

  private buildLocationPrompt(params: LocationImageParams): string {
    return [
      `${params.setting} environment`,
      `${params.time_of_day} time`,
      `${params.mood} mood`,
      `${params.lighting} lighting`,
      params.features.join(', '),
      'landscape, environment art, fantasy'
    ].join(', ');
  }

  private getDefaultNegativePrompt(): string {
    return 'blurry, low quality, deformed, ugly, bad anatomy, watermark, text, logo';
  }
}
```

---

# 4. Cutscene System

## 4.1 Cutscene Data Model

```typescript
// packages/shared/src/types/cutscene.ts

interface Cutscene {
  id: string;
  name: string;
  campaignId: string;
  duration: number;  // Total duration in milliseconds
  
  // Scenes are sequential
  scenes: CutsceneScene[];
  
  // Audio
  backgroundMusic?: AudioAsset;
  
  // Trigger conditions
  trigger: CutsceneTrigger;
  
  // Skip settings
  skippable: boolean;
  skipAfterFirstView: boolean;
}

interface CutsceneScene {
  id: string;
  order: number;
  duration: number;
  
  // Background
  background: {
    type: 'image' | 'video' | 'game_board';
    assetId?: string;
    mapId?: string;  // If showing game board
  };
  
  // Camera (for game board scenes)
  camera?: {
    startPosition: { x: number; y: number };
    endPosition?: { x: number; y: number };
    startZoom: number;
    endZoom?: number;
    easing: 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out';
  };
  
  // Characters on screen
  characters: CutsceneCharacter[];
  
  // Dialogue
  dialogue?: CutsceneDialogue;
  
  // Effects
  effects: CutsceneEffect[];
  
  // Transitions
  transitionIn: Transition;
  transitionOut: Transition;
}

interface CutsceneCharacter {
  characterId: string;
  position: 'left' | 'center' | 'right';
  portrait: string;  // Asset ID
  scale: number;
  
  // Animation
  enterAnimation?: 'fade' | 'slide_in' | 'none';
  exitAnimation?: 'fade' | 'slide_out' | 'none';
  
  // Expression changes during scene
  expressions?: Array<{
    timestamp: number;
    portrait: string;  // Different portrait asset
  }>;
}

interface CutsceneDialogue {
  speaker?: string;
  text: string;
  typewriterEffect: boolean;
  typewriterSpeed: number;  // Characters per second
  voiceOver?: AudioAsset;
  
  // Player choices (optional)
  choices?: Array<{
    text: string;
    nextSceneId?: string;
    flagToSet?: string;
  }>;
}

interface CutsceneEffect {
  type: 'particle' | 'shake' | 'flash' | 'vignette' | 'weather';
  startTime: number;
  duration: number;
  parameters: Record<string, any>;
}

interface Transition {
  type: 'none' | 'fade' | 'dissolve' | 'wipe' | 'zoom';
  duration: number;
  color?: string;  // For fade transitions
  direction?: 'left' | 'right' | 'up' | 'down';  // For wipe
}

interface CutsceneTrigger {
  type: 'manual' | 'on_enter_area' | 'on_combat_start' | 'on_npc_interact' | 'on_item_pickup' | 'on_quest_complete';
  parameters: Record<string, string>;
  conditions?: string[];  // Flag conditions
  playOnce: boolean;
}
```

## 4.2 Cutscene Player Component

```typescript
// apps/web/src/components/CutscenePlayer.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../hooks/useAudio';
import type { Cutscene, CutsceneScene } from '@dnd/shared';

interface CutscenePlayerProps {
  cutscene: Cutscene;
  onComplete: () => void;
  onSkip?: () => void;
}

export const CutscenePlayer: React.FC<CutscenePlayerProps> = ({
  cutscene,
  onComplete,
  onSkip,
}) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [dialogueProgress, setDialogueProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSkipPrompt, setShowSkipPrompt] = useState(false);
  
  const { playMusic, playSound, stopAll } = useAudio();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const currentScene = cutscene.scenes[currentSceneIndex];
  const hasNextScene = currentSceneIndex < cutscene.scenes.length - 1;

  // Start background music
  useEffect(() => {
    if (cutscene.backgroundMusic) {
      playMusic(cutscene.backgroundMusic.url, { loop: true, volume: 0.5 });
    }
    return () => stopAll();
  }, [cutscene.backgroundMusic]);

  // Scene progression
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasNextScene) {
        advanceScene();
      } else {
        onComplete();
      }
    }, currentScene.duration);

    return () => clearTimeout(timer);
  }, [currentSceneIndex, currentScene.duration]);

  // Typewriter effect for dialogue
  useEffect(() => {
    if (!currentScene.dialogue) return;
    
    const text = currentScene.dialogue.text;
    const speed = currentScene.dialogue.typewriterSpeed || 30;
    const interval = 1000 / speed;
    
    let charIndex = 0;
    const timer = setInterval(() => {
      charIndex++;
      setDialogueProgress(charIndex);
      if (charIndex >= text.length) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [currentSceneIndex, currentScene.dialogue]);

  // Handle voice over
  useEffect(() => {
    if (currentScene.dialogue?.voiceOver) {
      playSound(currentScene.dialogue.voiceOver.url);
    }
  }, [currentSceneIndex]);

  const advanceScene = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSceneIndex(prev => prev + 1);
      setDialogueProgress(0);
      setIsTransitioning(false);
    }, currentScene.transitionOut.duration);
  }, [currentScene.transitionOut.duration]);

  const handleSkip = useCallback(() => {
    if (cutscene.skippable) {
      stopAll();
      onSkip?.();
      onComplete();
    }
  }, [cutscene.skippable, onSkip, onComplete]);

  const handleClick = useCallback(() => {
    // Click to advance dialogue or skip
    if (currentScene.dialogue) {
      const fullText = currentScene.dialogue.text;
      if (dialogueProgress < fullText.length) {
        // Complete dialogue instantly
        setDialogueProgress(fullText.length);
      } else if (hasNextScene) {
        advanceScene();
      } else {
        onComplete();
      }
    }
  }, [currentScene.dialogue, dialogueProgress, hasNextScene, advanceScene, onComplete]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSkipPrompt(true);
      } else if (e.key === ' ' || e.key === 'Enter') {
        handleClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClick]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50"
      onClick={handleClick}
    >
      {/* Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScene.id}
          className="absolute inset-0"
          initial={getTransitionVariant(currentScene.transitionIn, 'initial')}
          animate={getTransitionVariant(currentScene.transitionIn, 'animate')}
          exit={getTransitionVariant(currentScene.transitionOut, 'exit')}
        >
          {currentScene.background.type === 'image' && (
            <img
              src={getAssetUrl(currentScene.background.assetId!)}
              className="w-full h-full object-cover"
              alt=""
            />
          )}
          {currentScene.background.type === 'video' && (
            <video
              src={getAssetUrl(currentScene.background.assetId!)}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Characters */}
      <div className="absolute inset-0 flex items-end justify-center pb-48">
        {currentScene.characters.map((char) => (
          <motion.div
            key={char.characterId}
            className={`absolute ${getPositionClass(char.position)}`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={getAssetUrl(char.portrait)}
              className="h-96 object-contain"
              style={{ transform: `scale(${char.scale})` }}
              alt=""
            />
          </motion.div>
        ))}
      </div>

      {/* Dialogue Box */}
      {currentScene.dialogue && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="max-w-4xl mx-auto">
            {currentScene.dialogue.speaker && (
              <div className="text-amber-400 font-cinzel text-xl mb-2">
                {currentScene.dialogue.speaker}
              </div>
            )}
            <div className="text-white text-lg leading-relaxed font-inter">
              {currentScene.dialogue.text.slice(0, dialogueProgress)}
              <span className="animate-pulse">|</span>
            </div>
            
            {/* Choices */}
            {currentScene.dialogue.choices && dialogueProgress >= currentScene.dialogue.text.length && (
              <div className="mt-4 space-y-2">
                {currentScene.dialogue.choices.map((choice, index) => (
                  <button
                    key={index}
                    className="block w-full text-left px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (choice.nextSceneId) {
                        const sceneIndex = cutscene.scenes.findIndex(s => s.id === choice.nextSceneId);
                        if (sceneIndex !== -1) {
                          setCurrentSceneIndex(sceneIndex);
                        }
                      }
                    }}
                  >
                    <span className="text-amber-400 mr-2">{index + 1}.</span>
                    {choice.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Effects */}
      <CutsceneEffects effects={currentScene.effects} />

      {/* Skip button */}
      {cutscene.skippable && (
        <button
          className="absolute top-4 right-4 text-white/50 hover:text-white text-sm"
          onClick={handleSkip}
        >
          Press ESC to skip
        </button>
      )}

      {/* Skip confirmation */}
      {showSkipPrompt && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-bg-medium p-8 rounded-lg text-center">
            <p className="text-white mb-4">Skip cutscene?</p>
            <div className="space-x-4">
              <button
                className="px-4 py-2 bg-primary rounded"
                onClick={handleSkip}
              >
                Skip
              </button>
              <button
                className="px-4 py-2 bg-bg-light rounded"
                onClick={() => setShowSkipPrompt(false)}
              >
                Continue Watching
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
        {cutscene.scenes.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full ${
              index === currentSceneIndex ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Helper functions
function getPositionClass(position: string): string {
  switch (position) {
    case 'left': return 'left-1/4 -translate-x-1/2';
    case 'center': return 'left-1/2 -translate-x-1/2';
    case 'right': return 'left-3/4 -translate-x-1/2';
    default: return 'left-1/2 -translate-x-1/2';
  }
}

function getTransitionVariant(
  transition: Transition,
  phase: 'initial' | 'animate' | 'exit'
): object {
  const duration = transition.duration / 1000;
  
  switch (transition.type) {
    case 'fade':
      return {
        opacity: phase === 'animate' ? 1 : 0,
        transition: { duration },
      };
    case 'dissolve':
      return {
        opacity: phase === 'animate' ? 1 : 0,
        filter: phase === 'animate' ? 'blur(0px)' : 'blur(10px)',
        transition: { duration },
      };
    case 'wipe':
      const direction = transition.direction || 'left';
      return {
        x: phase === 'initial' ? (direction === 'left' ? '100%' : '-100%') :
           phase === 'exit' ? (direction === 'left' ? '-100%' : '100%') : 0,
        transition: { duration },
      };
    case 'zoom':
      return {
        scale: phase === 'animate' ? 1 : phase === 'initial' ? 1.5 : 0.5,
        opacity: phase === 'animate' ? 1 : 0,
        transition: { duration },
      };
    default:
      return {};
  }
}

function getAssetUrl(assetId: string): string {
  return `${process.env.NEXT_PUBLIC_CDN_URL}/assets/${assetId}`;
}
```

## 4.3 Cutscene Editor (DM Tool)

```typescript
// apps/web/src/components/dm/CutsceneEditor.tsx

interface CutsceneEditorProps {
  campaignId: string;
  cutscene?: Cutscene;
  onSave: (cutscene: Cutscene) => void;
}

export const CutsceneEditor: React.FC<CutsceneEditorProps> = ({
  campaignId,
  cutscene,
  onSave,
}) => {
  const [scenes, setScenes] = useState<CutsceneScene[]>(cutscene?.scenes || []);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);

  const addScene = () => {
    const newScene: CutsceneScene = {
      id: `scene_${nanoid()}`,
      order: scenes.length,
      duration: 5000,
      background: { type: 'image' },
      characters: [],
      effects: [],
      transitionIn: { type: 'fade', duration: 500 },
      transitionOut: { type: 'fade', duration: 500 },
    };
    setScenes([...scenes, newScene]);
    setSelectedSceneIndex(scenes.length);
  };

  const updateScene = (index: number, updates: Partial<CutsceneScene>) => {
    setScenes(prev => prev.map((scene, i) => 
      i === index ? { ...scene, ...updates } : scene
    ));
  };

  return (
    <div className="flex h-full">
      {/* Timeline */}
      <div className="w-64 bg-bg-dark border-r border-border p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Scenes</h3>
          <button onClick={addScene} className="btn-ghost">
            + Add
          </button>
        </div>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="scenes">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {scenes.map((scene, index) => (
                  <Draggable key={scene.id} draggableId={scene.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`p-3 mb-2 rounded cursor-pointer ${
                          selectedSceneIndex === index
                            ? 'bg-primary/20 border border-primary'
                            : 'bg-bg-medium hover:bg-bg-light'
                        }`}
                        onClick={() => setSelectedSceneIndex(index)}
                      >
                        <div className="text-sm font-medium">Scene {index + 1}</div>
                        <div className="text-xs text-text-muted">
                          {(scene.duration / 1000).toFixed(1)}s
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Editor Panel */}
      <div className="flex-1 p-6 overflow-auto">
        {scenes[selectedSceneIndex] && (
          <SceneEditor
            scene={scenes[selectedSceneIndex]}
            onChange={(updates) => updateScene(selectedSceneIndex, updates)}
            campaignId={campaignId}
          />
        )}
      </div>

      {/* Preview */}
      <div className="w-96 bg-bg-dark border-l border-border p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Preview</h3>
          <button
            onClick={() => setPreviewMode(true)}
            className="btn-primary"
          >
            ▶ Play
          </button>
        </div>
        
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          {scenes[selectedSceneIndex] && (
            <ScenePreview scene={scenes[selectedSceneIndex]} />
          )}
        </div>
      </div>

      {/* Full Preview Modal */}
      {previewMode && (
        <CutscenePlayer
          cutscene={{
            id: cutscene?.id || 'preview',
            name: cutscene?.name || 'Preview',
            campaignId,
            duration: scenes.reduce((sum, s) => sum + s.duration, 0),
            scenes,
            trigger: { type: 'manual', parameters: {}, playOnce: false },
            skippable: true,
            skipAfterFirstView: false,
          }}
          onComplete={() => setPreviewMode(false)}
          onSkip={() => setPreviewMode(false)}
        />
      )}
    </div>
  );
};
```

---

# 5. In-Game Animation System

## 5.1 Spell VFX Library

```typescript
// apps/web/src/game/vfx/SpellEffects.ts

interface SpellEffect {
  id: string;
  name: string;
  category: 'projectile' | 'aoe' | 'buff' | 'debuff' | 'summon' | 'instant';
  
  // Animation data
  spriteSheet?: string;
  frameCount?: number;
  frameRate?: number;
  
  // Particle configuration
  particles?: ParticleConfig;
  
  // Audio
  castSound?: string;
  impactSound?: string;
  loopSound?: string;
  
  // Timing
  castDuration: number;
  travelDuration?: number;  // For projectiles
  impactDuration: number;
}

const SPELL_EFFECTS: Record<string, SpellEffect> = {
  // Cantrips
  'fire-bolt': {
    id: 'fire-bolt',
    name: 'Fire Bolt',
    category: 'projectile',
    particles: {
      type: 'trail',
      color: ['#ff6b35', '#ff9500', '#ffcc00'],
      count: 20,
      speed: 500,
      lifetime: 0.3,
      size: { min: 5, max: 15 },
    },
    castSound: '/audio/sfx/fire_cast.mp3',
    impactSound: '/audio/sfx/fire_impact.mp3',
    castDuration: 300,
    travelDuration: 400,
    impactDuration: 300,
  },
  
  'sacred-flame': {
    id: 'sacred-flame',
    name: 'Sacred Flame',
    category: 'instant',
    particles: {
      type: 'column',
      color: ['#ffd54f', '#ffecb3', '#ffffff'],
      count: 50,
      speed: 200,
      lifetime: 0.8,
      size: { min: 3, max: 10 },
      direction: 'up',
    },
    castSound: '/audio/sfx/radiant_cast.mp3',
    impactSound: '/audio/sfx/radiant_impact.mp3',
    castDuration: 200,
    impactDuration: 800,
  },

  'eldritch-blast': {
    id: 'eldritch-blast',
    name: 'Eldritch Blast',
    category: 'projectile',
    particles: {
      type: 'beam',
      color: ['#7c3aed', '#a78bfa', '#c4b5fd'],
      count: 30,
      speed: 600,
      lifetime: 0.2,
      size: { min: 8, max: 20 },
    },
    castSound: '/audio/sfx/eldritch_cast.mp3',
    impactSound: '/audio/sfx/force_impact.mp3',
    castDuration: 250,
    travelDuration: 300,
    impactDuration: 400,
  },

  // Level 1
  'magic-missile': {
    id: 'magic-missile',
    name: 'Magic Missile',
    category: 'projectile',
    particles: {
      type: 'homing',
      color: ['#00bcd4', '#4dd0e1', '#80deea'],
      count: 3,  // Per missile
      speed: 400,
      lifetime: 0.5,
      size: { min: 10, max: 15 },
      glow: true,
    },
    castSound: '/audio/sfx/magic_missile_cast.mp3',
    impactSound: '/audio/sfx/magic_missile_impact.mp3',
    castDuration: 200,
    travelDuration: 500,
    impactDuration: 200,
  },

  'burning-hands': {
    id: 'burning-hands',
    name: 'Burning Hands',
    category: 'aoe',
    particles: {
      type: 'cone',
      color: ['#ff6b35', '#ff9500', '#ffcc00'],
      count: 100,
      speed: 300,
      lifetime: 0.5,
      size: { min: 5, max: 20 },
      spread: 60,  // Degrees
    },
    castSound: '/audio/sfx/fire_cast.mp3',
    loopSound: '/audio/sfx/fire_loop.mp3',
    castDuration: 500,
    impactDuration: 1000,
  },

  // Level 3
  'fireball': {
    id: 'fireball',
    name: 'Fireball',
    category: 'aoe',
    particles: {
      type: 'explosion',
      color: ['#ff6b35', '#ff9500', '#ffcc00', '#ffffff'],
      count: 200,
      speed: 400,
      lifetime: 0.8,
      size: { min: 10, max: 40 },
      shockwave: true,
    },
    castSound: '/audio/sfx/fireball_cast.mp3',
    impactSound: '/audio/sfx/fireball_explosion.mp3',
    castDuration: 400,
    travelDuration: 600,
    impactDuration: 1200,
  },

  'lightning-bolt': {
    id: 'lightning-bolt',
    name: 'Lightning Bolt',
    category: 'aoe',
    particles: {
      type: 'line',
      color: ['#ffeb3b', '#ffffff', '#64b5f6'],
      count: 50,
      speed: 1000,
      lifetime: 0.1,
      size: { min: 5, max: 30 },
      branching: true,
    },
    castSound: '/audio/sfx/lightning_cast.mp3',
    impactSound: '/audio/sfx/lightning_impact.mp3',
    castDuration: 200,
    impactDuration: 400,
  },
};

export class SpellVFXManager {
  private container: PIXI.Container;
  private particleSystems: Map<string, ParticleSystem> = new Map();
  private audioManager: AudioManager;

  constructor(container: PIXI.Container, audioManager: AudioManager) {
    this.container = container;
    this.audioManager = audioManager;
  }

  async playSpellEffect(
    spellId: string,
    caster: GridPosition,
    targets: GridPosition[],
    onComplete?: () => void
  ): Promise<void> {
    const effect = SPELL_EFFECTS[spellId];
    if (!effect) {
      console.warn(`Unknown spell effect: ${spellId}`);
      onComplete?.();
      return;
    }

    // Play cast sound
    if (effect.castSound) {
      this.audioManager.play(effect.castSound);
    }

    // Create particle system based on category
    switch (effect.category) {
      case 'projectile':
        await this.playProjectile(effect, caster, targets[0], onComplete);
        break;
      case 'aoe':
        await this.playAoE(effect, targets, onComplete);
        break;
      case 'instant':
        await this.playInstant(effect, targets, onComplete);
        break;
      case 'buff':
      case 'debuff':
        await this.playBuff(effect, targets, onComplete);
        break;
    }
  }

  private async playProjectile(
    effect: SpellEffect,
    from: GridPosition,
    to: GridPosition,
    onComplete?: () => void
  ): Promise<void> {
    const fromWorld = this.gridToWorld(from);
    const toWorld = this.gridToWorld(to);
    
    // Create projectile
    const projectile = new ParticleEmitter(this.container, effect.particles!);
    projectile.position.set(fromWorld.x, fromWorld.y);
    
    // Animate to target
    const travelTime = effect.travelDuration || 500;
    await this.tweenPosition(projectile, toWorld, travelTime);
    
    // Play impact
    if (effect.impactSound) {
      this.audioManager.play(effect.impactSound);
    }
    
    projectile.stop();
    
    // Impact particles
    const impact = new ParticleEmitter(this.container, {
      ...effect.particles!,
      type: 'burst',
    });
    impact.position.set(toWorld.x, toWorld.y);
    impact.emit();
    
    await this.delay(effect.impactDuration);
    impact.destroy();
    
    onComplete?.();
  }

  private async playAoE(
    effect: SpellEffect,
    targets: GridPosition[],
    onComplete?: () => void
  ): Promise<void> {
    // Calculate center of AoE
    const center = this.calculateCenter(targets);
    
    // Create AoE particle system
    const emitter = new ParticleEmitter(this.container, effect.particles!);
    emitter.position.set(center.x, center.y);
    emitter.emit();
    
    if (effect.impactSound) {
      this.audioManager.play(effect.impactSound);
    }
    
    await this.delay(effect.impactDuration);
    emitter.destroy();
    
    onComplete?.();
  }

  private gridToWorld(pos: GridPosition): { x: number; y: number } {
    const tileSize = 64;
    return {
      x: pos.x * tileSize + tileSize / 2,
      y: pos.y * tileSize + tileSize / 2,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 5.2 Token Animation States

```typescript
// apps/web/src/game/animations/TokenAnimator.ts

type TokenState = 
  | 'idle'
  | 'walk'
  | 'run'
  | 'attack_melee'
  | 'attack_ranged'
  | 'cast_spell'
  | 'hit'
  | 'block'
  | 'dodge'
  | 'death'
  | 'unconscious'
  | 'celebrate';

interface TokenAnimation {
  state: TokenState;
  spriteSheet?: string;
  frames: number;
  frameRate: number;
  loop: boolean;
  soundEffect?: string;
}

const TOKEN_ANIMATIONS: Record<TokenState, TokenAnimation> = {
  idle: {
    state: 'idle',
    frames: 4,
    frameRate: 4,
    loop: true,
  },
  walk: {
    state: 'walk',
    frames: 8,
    frameRate: 12,
    loop: true,
    soundEffect: '/audio/sfx/footsteps.mp3',
  },
  run: {
    state: 'run',
    frames: 8,
    frameRate: 16,
    loop: true,
    soundEffect: '/audio/sfx/footsteps_fast.mp3',
  },
  attack_melee: {
    state: 'attack_melee',
    frames: 6,
    frameRate: 12,
    loop: false,
    soundEffect: '/audio/sfx/sword_swing.mp3',
  },
  attack_ranged: {
    state: 'attack_ranged',
    frames: 6,
    frameRate: 12,
    loop: false,
    soundEffect: '/audio/sfx/bow_release.mp3',
  },
  cast_spell: {
    state: 'cast_spell',
    frames: 8,
    frameRate: 10,
    loop: false,
    soundEffect: '/audio/sfx/spell_cast.mp3',
  },
  hit: {
    state: 'hit',
    frames: 4,
    frameRate: 12,
    loop: false,
    soundEffect: '/audio/sfx/hit.mp3',
  },
  block: {
    state: 'block',
    frames: 4,
    frameRate: 12,
    loop: false,
    soundEffect: '/audio/sfx/shield_block.mp3',
  },
  dodge: {
    state: 'dodge',
    frames: 6,
    frameRate: 14,
    loop: false,
    soundEffect: '/audio/sfx/dodge.mp3',
  },
  death: {
    state: 'death',
    frames: 8,
    frameRate: 8,
    loop: false,
    soundEffect: '/audio/sfx/death.mp3',
  },
  unconscious: {
    state: 'unconscious',
    frames: 2,
    frameRate: 2,
    loop: true,
  },
  celebrate: {
    state: 'celebrate',
    frames: 8,
    frameRate: 10,
    loop: true,
  },
};

export class TokenAnimator {
  private sprite: PIXI.AnimatedSprite;
  private currentState: TokenState = 'idle';
  private audioManager: AudioManager;
  private animationQueue: TokenState[] = [];

  constructor(
    container: PIXI.Container,
    baseTexture: PIXI.BaseTexture,
    audioManager: AudioManager
  ) {
    this.audioManager = audioManager;
    this.sprite = this.createSprite(baseTexture);
    container.addChild(this.sprite);
  }

  setState(state: TokenState, immediate: boolean = false): void {
    if (immediate || this.currentState === 'idle') {
      this.playAnimation(state);
    } else {
      this.animationQueue.push(state);
    }
  }

  private playAnimation(state: TokenState): void {
    const anim = TOKEN_ANIMATIONS[state];
    this.currentState = state;
    
    // Update sprite frames
    this.sprite.textures = this.getFrames(state, anim.frames);
    this.sprite.animationSpeed = anim.frameRate / 60;
    this.sprite.loop = anim.loop;
    
    // Play sound
    if (anim.soundEffect) {
      this.audioManager.play(anim.soundEffect);
    }
    
    // Handle completion
    if (!anim.loop) {
      this.sprite.onComplete = () => {
        if (this.animationQueue.length > 0) {
          this.playAnimation(this.animationQueue.shift()!);
        } else {
          this.playAnimation('idle');
        }
      };
    }
    
    this.sprite.gotoAndPlay(0);
  }

  async playAttack(
    targetPosition: { x: number; y: number },
    isRanged: boolean
  ): Promise<void> {
    // Face target
    this.sprite.scale.x = targetPosition.x < this.sprite.x ? -1 : 1;
    
    const state = isRanged ? 'attack_ranged' : 'attack_melee';
    
    return new Promise((resolve) => {
      this.setState(state, true);
      
      if (!isRanged) {
        // Lunge toward target
        const origX = this.sprite.x;
        const dx = (targetPosition.x - origX) * 0.3;
        
        gsap.to(this.sprite, {
          x: origX + dx,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          onComplete: resolve,
        });
      } else {
        setTimeout(resolve, 500);
      }
    });
  }

  playHit(): void {
    this.setState('hit', true);
    
    // Flash red
    this.sprite.tint = 0xff0000;
    setTimeout(() => {
      this.sprite.tint = 0xffffff;
    }, 200);
  }

  playDeath(): Promise<void> {
    return new Promise((resolve) => {
      this.setState('death', true);
      
      // Fade to grayscale
      gsap.to(this.sprite, {
        alpha: 0.5,
        duration: 1,
        onComplete: resolve,
      });
    });
  }
}
```

---

# 6. Audio System

## 6.1 Audio Manager

```typescript
// apps/web/src/audio/AudioManager.ts

interface AudioConfig {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  ambientVolume: number;
  voiceVolume: number;
}

export class AudioManager {
  private context: AudioContext;
  private masterGain: GainNode;
  private musicGain: GainNode;
  private sfxGain: GainNode;
  private ambientGain: GainNode;
  private voiceGain: GainNode;
  
  private currentMusic: AudioBufferSourceNode | null = null;
  private currentAmbient: AudioBufferSourceNode | null = null;
  private audioCache: Map<string, AudioBuffer> = new Map();
  private config: AudioConfig;

  constructor() {
    this.context = new AudioContext();
    this.config = this.loadConfig();
    this.setupGainNodes();
  }

  private setupGainNodes(): void {
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
    
    this.musicGain = this.context.createGain();
    this.musicGain.connect(this.masterGain);
    
    this.sfxGain = this.context.createGain();
    this.sfxGain.connect(this.masterGain);
    
    this.ambientGain = this.context.createGain();
    this.ambientGain.connect(this.masterGain);
    
    this.voiceGain = this.context.createGain();
    this.voiceGain.connect(this.masterGain);
    
    this.applyConfig();
  }

  async preload(urls: string[]): Promise<void> {
    await Promise.all(urls.map(url => this.loadSound(url)));
  }

  async play(
    url: string,
    options: { volume?: number; loop?: boolean; channel?: 'sfx' | 'music' | 'ambient' | 'voice' } = {}
  ): Promise<void> {
    await this.context.resume();
    
    const buffer = await this.loadSound(url);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = options.loop || false;
    
    const gainNode = this.context.createGain();
    gainNode.gain.value = options.volume || 1;
    
    const channel = options.channel || 'sfx';
    const channelGain = this.getChannelGain(channel);
    
    source.connect(gainNode);
    gainNode.connect(channelGain);
    
    source.start(0);
    
    // Track music/ambient for crossfade
    if (channel === 'music') {
      if (this.currentMusic) {
        this.fadeOut(this.currentMusic, 1);
      }
      this.currentMusic = source;
      this.fadeIn(gainNode, 1);
    }
    
    return new Promise((resolve) => {
      source.onended = () => resolve();
    });
  }

  async playMusic(url: string, crossfadeDuration: number = 2): Promise<void> {
    if (this.currentMusic) {
      await this.fadeOut(this.currentMusic, crossfadeDuration);
    }
    await this.play(url, { channel: 'music', loop: true });
  }

  async playAmbient(url: string): Promise<void> {
    if (this.currentAmbient) {
      this.currentAmbient.stop();
    }
    await this.play(url, { channel: 'ambient', loop: true });
  }

  private async loadSound(url: string): Promise<AudioBuffer> {
    if (this.audioCache.has(url)) {
      return this.audioCache.get(url)!;
    }
    
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
    
    this.audioCache.set(url, audioBuffer);
    return audioBuffer;
  }

  private getChannelGain(channel: string): GainNode {
    switch (channel) {
      case 'music': return this.musicGain;
      case 'ambient': return this.ambientGain;
      case 'voice': return this.voiceGain;
      default: return this.sfxGain;
    }
  }

  private fadeIn(gainNode: GainNode, duration: number): void {
    gainNode.gain.setValueAtTime(0, this.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, this.context.currentTime + duration);
  }

  private async fadeOut(source: AudioBufferSourceNode, duration: number): Promise<void> {
    return new Promise((resolve) => {
      // Note: Can't access gain from source directly, would need to track gain nodes
      setTimeout(() => {
        source.stop();
        resolve();
      }, duration * 1000);
    });
  }

  setVolume(channel: 'master' | 'music' | 'sfx' | 'ambient' | 'voice', value: number): void {
    const gain = channel === 'master' ? this.masterGain : this.getChannelGain(channel);
    gain.gain.setValueAtTime(value, this.context.currentTime);
    this.config[`${channel}Volume` as keyof AudioConfig] = value;
    this.saveConfig();
  }

  private loadConfig(): AudioConfig {
    const stored = localStorage.getItem('audio_config');
    return stored ? JSON.parse(stored) : {
      masterVolume: 1,
      musicVolume: 0.7,
      sfxVolume: 1,
      ambientVolume: 0.5,
      voiceVolume: 1,
    };
  }

  private saveConfig(): void {
    localStorage.setItem('audio_config', JSON.stringify(this.config));
  }

  private applyConfig(): void {
    this.masterGain.gain.value = this.config.masterVolume;
    this.musicGain.gain.value = this.config.musicVolume;
    this.sfxGain.gain.value = this.config.sfxVolume;
    this.ambientGain.gain.value = this.config.ambientVolume;
    this.voiceGain.gain.value = this.config.voiceVolume;
  }
}
```

---

# 7. Asset Manifest

```typescript
// packages/shared/src/assets/manifest.ts

export const AUDIO_MANIFEST = {
  // Music
  music: {
    exploration: '/audio/music/exploration.mp3',
    combat: '/audio/music/combat.mp3',
    boss: '/audio/music/boss.mp3',
    victory: '/audio/music/victory.mp3',
    defeat: '/audio/music/defeat.mp3',
    tavern: '/audio/music/tavern.mp3',
    dungeon: '/audio/music/dungeon.mp3',
    mystery: '/audio/music/mystery.mp3',
  },
  
  // Ambient
  ambient: {
    forest: '/audio/ambient/forest.mp3',
    cave: '/audio/ambient/cave.mp3',
    dungeon: '/audio/ambient/dungeon.mp3',
    city: '/audio/ambient/city.mp3',
    rain: '/audio/ambient/rain.mp3',
    fire: '/audio/ambient/fire.mp3',
  },
  
  // UI SFX
  ui: {
    click: '/audio/sfx/ui/click.mp3',
    hover: '/audio/sfx/ui/hover.mp3',
    success: '/audio/sfx/ui/success.mp3',
    error: '/audio/sfx/ui/error.mp3',
    notification: '/audio/sfx/ui/notification.mp3',
    levelUp: '/audio/sfx/ui/level_up.mp3',
  },
  
  // Combat SFX
  combat: {
    swordSwing: '/audio/sfx/combat/sword_swing.mp3',
    swordHit: '/audio/sfx/combat/sword_hit.mp3',
    shieldBlock: '/audio/sfx/combat/shield_block.mp3',
    arrowRelease: '/audio/sfx/combat/arrow_release.mp3',
    arrowHit: '/audio/sfx/combat/arrow_hit.mp3',
    punch: '/audio/sfx/combat/punch.mp3',
    criticalHit: '/audio/sfx/combat/critical.mp3',
    miss: '/audio/sfx/combat/miss.mp3',
    death: '/audio/sfx/combat/death.mp3',
  },
  
  // Dice
  dice: {
    roll: '/audio/sfx/dice/roll.mp3',
    natural20: '/audio/sfx/dice/nat20.mp3',
    natural1: '/audio/sfx/dice/nat1.mp3',
  },
  
  // Spells by school
  spells: {
    evocation: '/audio/sfx/spells/evocation_cast.mp3',
    abjuration: '/audio/sfx/spells/abjuration_cast.mp3',
    conjuration: '/audio/sfx/spells/conjuration_cast.mp3',
    divination: '/audio/sfx/spells/divination_cast.mp3',
    enchantment: '/audio/sfx/spells/enchantment_cast.mp3',
    illusion: '/audio/sfx/spells/illusion_cast.mp3',
    necromancy: '/audio/sfx/spells/necromancy_cast.mp3',
    transmutation: '/audio/sfx/spells/transmutation_cast.mp3',
  },
};

export const VFX_MANIFEST = {
  particles: {
    fire: '/vfx/particles/fire.json',
    ice: '/vfx/particles/ice.json',
    lightning: '/vfx/particles/lightning.json',
    healing: '/vfx/particles/healing.json',
    magic: '/vfx/particles/magic.json',
    smoke: '/vfx/particles/smoke.json',
    blood: '/vfx/particles/blood.json',
  },
  
  spriteSheets: {
    explosions: '/vfx/sheets/explosions.json',
    impacts: '/vfx/sheets/impacts.json',
    buffs: '/vfx/sheets/buffs.json',
  },
};
```

---

# END OF DOCUMENT 22
