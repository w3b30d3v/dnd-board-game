# Document 36: Dynamic Scene Generation System

## Purpose
This document specifies how to transform user/DM narrative descriptions into **living, animated visual scenes** in real-time. The system takes text input and generates immersive visuals with parallax layers, particle effects, dynamic lighting, and atmospheric audio.

---

## 1. System Architecture

### 1.1 Scene Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SCENE GENERATION PIPELINE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐     │
│  │ DM/Player   │───▶│ NLP Parser  │───▶│ Scene Composer      │     │
│  │ Description │    │             │    │                     │     │
│  └─────────────┘    └─────────────┘    └──────────┬──────────┘     │
│                                                    │                │
│                     ┌──────────────────────────────┼──────────┐    │
│                     │                              │          │    │
│                     ▼                              ▼          ▼    │
│              ┌─────────────┐              ┌────────────┐ ┌───────┐ │
│              │ AI Image    │              │ VFX Engine │ │ Audio │ │
│              │ Generator   │              │            │ │ Mixer │ │
│              └──────┬──────┘              └─────┬──────┘ └───┬───┘ │
│                     │                          │             │     │
│                     ▼                          ▼             ▼     │
│              ┌──────────────────────────────────────────────────┐  │
│              │           RENDERED SCENE CANVAS                  │  │
│              │  • Parallax background layers                    │  │
│              │  • Dynamic particles & effects                   │  │
│              │  • Animated lighting                             │  │
│              │  • Ambient audio                                 │  │
│              └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Core Types

```typescript
// packages/shared/src/types/scene.ts

interface SceneDescription {
  id: string;
  rawText: string;
  parsedElements: ParsedSceneElements;
  generatedAssets: GeneratedAssets;
  composition: SceneComposition;
  effects: SceneEffects;
  audio: SceneAudio;
}

interface ParsedSceneElements {
  // Location
  settingType: SettingType;
  specificLocation: string;
  indoorOutdoor: 'indoor' | 'outdoor' | 'underground' | 'planar';
  
  // Atmosphere
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  lighting: LightingType;
  mood: MoodType;
  
  // Details
  keyFeatures: string[];
  colors: string[];
  sounds: string[];
  smells: string[]; // For text description
  
  // Characters/Creatures
  presentEntities: EntityPresence[];
  
  // Narrative
  tension: 'calm' | 'building' | 'high' | 'climax';
  storyBeat: 'exploration' | 'discovery' | 'combat' | 'social' | 'rest';
}

interface SceneComposition {
  layers: ParallaxLayer[];
  focusPoint: { x: number; y: number };
  cameraMovement: CameraMovement;
  depthOfField: DepthOfFieldSettings;
}

interface ParallaxLayer {
  id: string;
  imageUrl: string;
  depth: number; // 0 = foreground, 1 = background
  position: { x: number; y: number };
  scale: number;
  opacity: number;
  blendMode: BlendMode;
  animation?: LayerAnimation;
}

interface LayerAnimation {
  type: 'drift' | 'sway' | 'pulse' | 'flicker' | 'float';
  speed: number;
  amplitude: number;
  direction?: { x: number; y: number };
}
```

---

## 2. Natural Language Scene Parser

### 2.1 Parser Implementation

```typescript
// services/media-service/src/parser/sceneParser.ts

import nlp from 'compromise';

interface ParseResult {
  setting: SettingAnalysis;
  atmosphere: AtmosphereAnalysis;
  entities: EntityAnalysis[];
  mood: MoodAnalysis;
  action: ActionAnalysis;
}

export class SceneParser {
  private settingKeywords: Map<string, SettingType>;
  private moodKeywords: Map<string, MoodType>;
  private weatherKeywords: Map<string, WeatherType>;
  private lightingKeywords: Map<string, LightingType>;

  constructor() {
    this.initializeKeywordMaps();
  }

  async parseDescription(text: string): Promise<ParseResult> {
    const doc = nlp(text);
    
    return {
      setting: this.analyzeSetting(doc, text),
      atmosphere: this.analyzeAtmosphere(doc, text),
      entities: this.analyzeEntities(doc, text),
      mood: this.analyzeMood(doc, text),
      action: this.analyzeAction(doc, text)
    };
  }

  private analyzeSetting(doc: any, text: string): SettingAnalysis {
    // Extract location nouns
    const places = doc.places().out('array');
    const nouns = doc.nouns().out('array');
    
    // Match against setting keywords
    const settingType = this.matchSettingType(text);
    const isIndoor = this.detectIndoorOutdoor(text);
    const specificFeatures = this.extractFeatures(nouns);

    return {
      type: settingType,
      indoor: isIndoor,
      features: specificFeatures,
      rawPlaces: places
    };
  }

  private analyzeAtmosphere(doc: any, text: string): AtmosphereAnalysis {
    const adjectives = doc.adjectives().out('array');
    
    return {
      timeOfDay: this.detectTimeOfDay(text),
      weather: this.detectWeather(text),
      lighting: this.detectLighting(text, adjectives),
      temperature: this.detectTemperature(adjectives),
      visibility: this.detectVisibility(adjectives)
    };
  }

  private analyzeMood(doc: any, text: string): MoodAnalysis {
    const adjectives = doc.adjectives().out('array');
    const verbs = doc.verbs().out('array');
    
    // Sentiment analysis
    const sentiment = this.calculateSentiment(adjectives, verbs);
    const tension = this.calculateTension(text);
    const danger = this.detectDanger(text);

    return {
      primary: this.determinePrimaryMood(sentiment, tension, danger),
      tension: tension,
      dangerLevel: danger,
      emotionalTone: sentiment
    };
  }

  // Keyword matching helpers
  private matchSettingType(text: string): SettingType {
    const lowerText = text.toLowerCase();
    
    const settingPatterns = [
      { pattern: /dungeon|crypt|tomb|underground|cavern|cave/i, type: 'dungeon' },
      { pattern: /forest|woods|grove|jungle|trees/i, type: 'forest' },
      { pattern: /castle|fortress|keep|tower|stronghold/i, type: 'castle' },
      { pattern: /village|town|city|market|inn|tavern/i, type: 'settlement' },
      { pattern: /mountain|cliff|peak|highlands/i, type: 'mountain' },
      { pattern: /swamp|marsh|bog|wetland/i, type: 'swamp' },
      { pattern: /desert|dunes|wasteland|sand/i, type: 'desert' },
      { pattern: /ocean|sea|ship|coast|beach/i, type: 'coastal' },
      { pattern: /temple|shrine|altar|sacred/i, type: 'temple' },
      { pattern: /plane|realm|dimension|void|astral/i, type: 'planar' }
    ];

    for (const { pattern, type } of settingPatterns) {
      if (pattern.test(lowerText)) {
        return type as SettingType;
      }
    }
    
    return 'generic_fantasy';
  }

  private detectTimeOfDay(text: string): TimeOfDay {
    const patterns = [
      { pattern: /dawn|sunrise|morning light|early morning/i, time: 'dawn' },
      { pattern: /morning|midmorning/i, time: 'morning' },
      { pattern: /noon|midday|high sun/i, time: 'noon' },
      { pattern: /afternoon|late day/i, time: 'afternoon' },
      { pattern: /dusk|sunset|evening|twilight/i, time: 'dusk' },
      { pattern: /night|midnight|dark|moonlight|stars/i, time: 'night' }
    ];

    for (const { pattern, time } of patterns) {
      if (pattern.test(text)) {
        return time as TimeOfDay;
      }
    }
    
    return 'day'; // Default
  }

  private detectWeather(text: string): WeatherType {
    const patterns = [
      { pattern: /rain|raining|downpour|drizzle/i, weather: 'rain' },
      { pattern: /storm|thunder|lightning|tempest/i, weather: 'storm' },
      { pattern: /snow|snowing|blizzard|frost/i, weather: 'snow' },
      { pattern: /fog|mist|haze|murky/i, weather: 'fog' },
      { pattern: /wind|windy|gale|blustery/i, weather: 'windy' },
      { pattern: /clear|sunny|bright|cloudless/i, weather: 'clear' }
    ];

    for (const { pattern, weather } of patterns) {
      if (pattern.test(text)) {
        return weather as WeatherType;
      }
    }
    
    return 'clear';
  }
}
```

---

## 3. Scene Composer

### 3.1 Layer Composition Engine

```typescript
// services/media-service/src/composer/sceneComposer.ts

interface ComposedScene {
  background: ParallaxLayer[];
  midground: ParallaxLayer[];
  foreground: ParallaxLayer[];
  effects: VisualEffect[];
  lighting: LightingSetup;
  camera: CameraSetup;
}

export class SceneComposer {
  private imageGenerator: ImageGenerator;
  private assetLibrary: AssetLibrary;
  private effectsEngine: EffectsEngine;

  async composeScene(parsed: ParseResult): Promise<ComposedScene> {
    // 1. Determine layer structure based on setting
    const layerTemplate = this.getLayerTemplate(parsed.setting.type);
    
    // 2. Generate or fetch images for each layer
    const layers = await this.generateLayers(layerTemplate, parsed);
    
    // 3. Apply atmospheric effects
    const effects = this.buildEffects(parsed.atmosphere, parsed.mood);
    
    // 4. Configure lighting
    const lighting = this.buildLighting(parsed.atmosphere);
    
    // 5. Set up camera movement
    const camera = this.buildCameraSetup(parsed.mood, parsed.action);

    return {
      background: layers.filter(l => l.depth > 0.7),
      midground: layers.filter(l => l.depth > 0.3 && l.depth <= 0.7),
      foreground: layers.filter(l => l.depth <= 0.3),
      effects,
      lighting,
      camera
    };
  }

  private getLayerTemplate(settingType: SettingType): LayerTemplate {
    const templates: Record<SettingType, LayerTemplate> = {
      dungeon: {
        layers: [
          { name: 'far_wall', depth: 1.0, promptMod: 'distant stone walls, ancient carvings' },
          { name: 'mid_pillars', depth: 0.6, promptMod: 'crumbling pillars, shadows' },
          { name: 'near_debris', depth: 0.3, promptMod: 'rubble, cobwebs, bones' },
          { name: 'foreground_atmosphere', depth: 0.1, promptMod: 'dust particles, fog wisps' }
        ],
        defaultEffects: ['dust_particles', 'torch_flicker', 'fog_wisps'],
        defaultAudio: 'dungeon_ambience'
      },
      
      forest: {
        layers: [
          { name: 'sky', depth: 1.0, promptMod: 'sky through canopy, light rays' },
          { name: 'distant_trees', depth: 0.8, promptMod: 'misty distant trees' },
          { name: 'mid_trees', depth: 0.5, promptMod: 'large tree trunks, foliage' },
          { name: 'near_foliage', depth: 0.2, promptMod: 'ferns, undergrowth, flowers' },
          { name: 'foreground_leaves', depth: 0.05, promptMod: 'floating leaves, insects' }
        ],
        defaultEffects: ['floating_particles', 'light_rays', 'fireflies'],
        defaultAudio: 'forest_ambience'
      },

      castle: {
        layers: [
          { name: 'sky_backdrop', depth: 1.0, promptMod: 'dramatic sky, distant mountains' },
          { name: 'castle_structure', depth: 0.7, promptMod: 'towering walls, spires' },
          { name: 'courtyard', depth: 0.4, promptMod: 'cobblestones, banners' },
          { name: 'foreground', depth: 0.1, promptMod: 'torches, guards' }
        ],
        defaultEffects: ['banner_sway', 'torch_flicker', 'birds'],
        defaultAudio: 'castle_ambience'
      },

      // ... more templates for each setting type
    };

    return templates[settingType] || templates.dungeon;
  }

  private async generateLayers(
    template: LayerTemplate, 
    parsed: ParseResult
  ): Promise<ParallaxLayer[]> {
    const layers: ParallaxLayer[] = [];

    for (const layerDef of template.layers) {
      // Build prompt for this specific layer
      const prompt = this.buildLayerPrompt(layerDef, parsed);
      
      // Generate or fetch from cache
      const imageUrl = await this.getLayerImage(prompt, layerDef);
      
      // Create parallax layer with animation
      layers.push({
        id: `layer_${layerDef.name}`,
        imageUrl,
        depth: layerDef.depth,
        position: { x: 0, y: 0 },
        scale: 1 + (layerDef.depth * 0.2), // Deeper layers slightly larger
        opacity: 1,
        blendMode: 'normal',
        animation: this.getLayerAnimation(layerDef, parsed)
      });
    }

    return layers;
  }

  private buildLayerPrompt(layerDef: LayerDef, parsed: ParseResult): string {
    return `
      ${parsed.setting.type} scene layer,
      ${layerDef.promptMod},
      ${parsed.atmosphere.timeOfDay} lighting,
      ${parsed.atmosphere.weather} weather,
      ${parsed.mood.primary} mood,
      seamless horizontal tile, parallax layer,
      ${layerDef.depth > 0.5 ? 'blurred background' : 'sharp detail'},
      fantasy art style, high quality
    `.trim();
  }

  private getLayerAnimation(layerDef: LayerDef, parsed: ParseResult): LayerAnimation {
    // Determine animation based on layer type and conditions
    if (layerDef.name.includes('sky') || layerDef.name.includes('cloud')) {
      return { type: 'drift', speed: 0.02, amplitude: 50, direction: { x: 1, y: 0 } };
    }
    
    if (layerDef.name.includes('foliage') || layerDef.name.includes('leaves')) {
      return { type: 'sway', speed: 0.5, amplitude: 5 };
    }
    
    if (layerDef.name.includes('water')) {
      return { type: 'pulse', speed: 0.3, amplitude: 2 };
    }
    
    if (layerDef.name.includes('torch') || layerDef.name.includes('fire')) {
      return { type: 'flicker', speed: 0.8, amplitude: 0.1 };
    }

    // Default subtle movement
    return { type: 'drift', speed: 0.01 * layerDef.depth, amplitude: 10 };
  }
}
```

---

## 4. Real-Time Scene Renderer

### 4.1 React Scene Component

```typescript
// apps/web/src/components/scene/DynamicScene.tsx

import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Particles } from '@tsparticles/react';

interface DynamicSceneProps {
  scene: ComposedScene;
  onReady?: () => void;
}

export function DynamicScene({ scene, onReady }: DynamicSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const controls = useAnimation();

  // Track mouse for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Calculate parallax offset for each layer
  const getParallaxOffset = (depth: number) => {
    const maxOffset = 50;
    const xOffset = (mousePosition.x - 0.5) * maxOffset * depth;
    const yOffset = (mousePosition.y - 0.5) * maxOffset * depth;
    return { x: xOffset, y: yOffset };
  };

  return (
    <div 
      ref={containerRef}
      className="dynamic-scene"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#0a0a0a'
      }}
    >
      {/* Background Layers */}
      {scene.background.map((layer) => (
        <ParallaxLayer 
          key={layer.id} 
          layer={layer} 
          offset={getParallaxOffset(layer.depth)}
        />
      ))}

      {/* Midground Layers */}
      {scene.midground.map((layer) => (
        <ParallaxLayer 
          key={layer.id} 
          layer={layer}
          offset={getParallaxOffset(layer.depth)}
        />
      ))}

      {/* Effects Layer */}
      <EffectsLayer effects={scene.effects} />

      {/* Lighting Overlay */}
      <LightingOverlay lighting={scene.lighting} />

      {/* Foreground Layers */}
      {scene.foreground.map((layer) => (
        <ParallaxLayer 
          key={layer.id} 
          layer={layer}
          offset={getParallaxOffset(layer.depth)}
        />
      ))}

      {/* Atmospheric Particles */}
      <AtmosphericParticles atmosphere={scene.effects} />

      {/* Vignette */}
      <div className="vignette" style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)'
      }} />
    </div>
  );
}

// Individual parallax layer component
function ParallaxLayer({ layer, offset }: { layer: ParallaxLayer; offset: { x: number; y: number } }) {
  const animationStyle = useLayerAnimation(layer.animation);

  return (
    <motion.div
      className="parallax-layer"
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${layer.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: layer.opacity,
        mixBlendMode: layer.blendMode,
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${layer.scale})`,
        transition: 'transform 0.1s ease-out',
        ...animationStyle
      }}
      animate={layer.animation ? getAnimationVariant(layer.animation) : undefined}
    />
  );
}

// Hook for layer-specific animations
function useLayerAnimation(animation?: LayerAnimation) {
  if (!animation) return {};

  switch (animation.type) {
    case 'drift':
      return {
        animation: `drift ${60 / animation.speed}s linear infinite`,
      };
    case 'sway':
      return {
        animation: `sway ${2 / animation.speed}s ease-in-out infinite`,
      };
    case 'pulse':
      return {
        animation: `pulse ${3 / animation.speed}s ease-in-out infinite`,
      };
    case 'flicker':
      return {
        animation: `flicker ${0.5 / animation.speed}s ease-in-out infinite`,
      };
    default:
      return {};
  }
}

// Effects layer component
function EffectsLayer({ effects }: { effects: VisualEffect[] }) {
  return (
    <div className="effects-layer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {effects.map((effect, index) => (
        <Effect key={`${effect.type}-${index}`} effect={effect} />
      ))}
    </div>
  );
}

// Lighting overlay component
function LightingOverlay({ lighting }: { lighting: LightingSetup }) {
  return (
    <div 
      className="lighting-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `radial-gradient(
          ellipse at ${lighting.source.x}% ${lighting.source.y}%,
          ${lighting.color}${Math.round(lighting.intensity * 40).toString(16)} 0%,
          transparent 70%
        )`,
        mixBlendMode: lighting.blendMode || 'overlay'
      }}
    />
  );
}
```

### 4.2 CSS Animations

```css
/* apps/web/src/styles/scene-animations.css */

@keyframes drift {
  0% { transform: translateX(0); }
  100% { transform: translateX(-100px); }
}

@keyframes sway {
  0%, 100% { transform: rotate(-1deg) translateX(-2px); }
  50% { transform: rotate(1deg) translateX(2px); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.02); }
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  25% { opacity: 0.9; }
  50% { opacity: 1; }
  75% { opacity: 0.85; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes rain {
  0% { transform: translateY(-100%) translateX(0); }
  100% { transform: translateY(100vh) translateX(20px); }
}

@keyframes snow {
  0% { transform: translateY(-100%) translateX(0) rotate(0deg); }
  100% { transform: translateY(100vh) translateX(50px) rotate(360deg); }
}

@keyframes lightning-flash {
  0%, 100% { opacity: 0; }
  5% { opacity: 1; }
  10% { opacity: 0.3; }
  15% { opacity: 0.8; }
  20% { opacity: 0; }
}
```

---

## 5. Atmospheric Effects System

### 5.1 Particle Configurations

```typescript
// apps/web/src/config/atmosphericParticles.ts

export const ATMOSPHERIC_PARTICLES = {
  dust_motes: {
    particles: {
      number: { value: 50 },
      color: { value: '#d4a574' },
      opacity: { value: 0.3, random: true },
      size: { value: 2, random: true },
      move: {
        enable: true,
        speed: 0.3,
        direction: 'none',
        random: true,
        out_mode: 'out'
      }
    },
    interactivity: {
      events: {
        onhover: { enable: true, mode: 'bubble' }
      }
    }
  },

  fog_wisps: {
    particles: {
      number: { value: 20 },
      color: { value: '#ffffff' },
      opacity: { value: 0.1, random: true },
      size: { value: 100, random: true },
      move: {
        enable: true,
        speed: 0.5,
        direction: 'right',
        straight: false
      }
    }
  },

  fireflies: {
    particles: {
      number: { value: 30 },
      color: { value: '#ffeb3b' },
      opacity: {
        value: 0.8,
        animation: { enable: true, speed: 1, minimumValue: 0.1 }
      },
      size: { value: 3, random: true },
      move: {
        enable: true,
        speed: 1,
        direction: 'none',
        random: true
      }
    }
  },

  rain: {
    particles: {
      number: { value: 200 },
      color: { value: '#a4c4d4' },
      opacity: { value: 0.5 },
      size: { value: { min: 1, max: 3 } },
      shape: { type: 'line' },
      move: {
        enable: true,
        speed: 15,
        direction: 'bottom',
        straight: true
      },
      rotate: { value: 15 }
    }
  },

  snow: {
    particles: {
      number: { value: 100 },
      color: { value: '#ffffff' },
      opacity: { value: 0.8, random: true },
      size: { value: { min: 2, max: 5 } },
      move: {
        enable: true,
        speed: 2,
        direction: 'bottom',
        random: true,
        wobble: { enable: true, distance: 10 }
      }
    }
  },

  embers: {
    particles: {
      number: { value: 40 },
      color: { value: ['#ff4500', '#ff6b00', '#ffcc00'] },
      opacity: {
        value: 0.8,
        animation: { enable: true, speed: 0.5, minimumValue: 0 }
      },
      size: { value: { min: 1, max: 4 } },
      move: {
        enable: true,
        speed: 2,
        direction: 'top',
        random: true
      },
      life: {
        duration: { value: 3 },
        count: 1
      }
    }
  },

  magic_sparkles: {
    particles: {
      number: { value: 60 },
      color: { value: ['#F59E0B', '#8B5CF6', '#FBBF24'] },
      opacity: {
        value: 1,
        animation: { enable: true, speed: 2, minimumValue: 0 }
      },
      size: {
        value: 4,
        animation: { enable: true, speed: 3, minimumValue: 0.5 }
      },
      move: {
        enable: true,
        speed: 1,
        direction: 'none',
        random: true
      }
    }
  },

  blood_mist: {
    particles: {
      number: { value: 30 },
      color: { value: '#8b0000' },
      opacity: { value: 0.3 },
      size: { value: 80, random: true },
      move: {
        enable: true,
        speed: 0.3,
        direction: 'none'
      }
    }
  }
};
```

---

## 6. Audio Atmosphere System

### 6.1 Dynamic Audio Mixer

```typescript
// apps/web/src/audio/atmosphereMixer.ts

import { Howl, Howler } from 'howler';

interface AtmosphereLayer {
  id: string;
  sound: Howl;
  baseVolume: number;
  currentVolume: number;
  fadeTarget?: number;
}

export class AtmosphereMixer {
  private layers: Map<string, AtmosphereLayer> = new Map();
  private masterVolume: number = 1;
  private currentMood: MoodType = 'neutral';

  // Predefined atmosphere tracks
  private readonly TRACKS = {
    // Environments
    dungeon_drip: '/audio/ambience/dungeon-drip.mp3',
    dungeon_wind: '/audio/ambience/dungeon-wind.mp3',
    forest_birds: '/audio/ambience/forest-birds.mp3',
    forest_wind: '/audio/ambience/forest-wind.mp3',
    castle_echo: '/audio/ambience/castle-echo.mp3',
    tavern_murmur: '/audio/ambience/tavern-crowd.mp3',
    rain_light: '/audio/ambience/rain-light.mp3',
    rain_heavy: '/audio/ambience/rain-heavy.mp3',
    thunder: '/audio/ambience/thunder.mp3',
    fire_crackle: '/audio/ambience/fire-crackle.mp3',
    
    // Musical beds
    tension_low: '/audio/music/tension-low.mp3',
    tension_medium: '/audio/music/tension-medium.mp3',
    tension_high: '/audio/music/tension-high.mp3',
    mystery: '/audio/music/mystery.mp3',
    wonder: '/audio/music/wonder.mp3',
    danger: '/audio/music/danger.mp3',
    combat_light: '/audio/music/combat-light.mp3',
    combat_intense: '/audio/music/combat-intense.mp3',
    victory: '/audio/music/victory.mp3',
    defeat: '/audio/music/defeat.mp3'
  };

  async setAtmosphere(parsed: ParseResult): Promise<void> {
    // Determine which layers to use
    const layersToUse = this.getLayersForScene(parsed);
    
    // Fade out layers not in new scene
    for (const [id, layer] of this.layers) {
      if (!layersToUse.includes(id)) {
        await this.fadeOutLayer(id, 2000);
      }
    }

    // Fade in new layers
    for (const layerId of layersToUse) {
      if (!this.layers.has(layerId)) {
        await this.addLayer(layerId);
      }
      this.fadeInLayer(layerId, 2000);
    }

    // Adjust volumes based on mood
    this.adjustMoodVolumes(parsed.mood);
  }

  private getLayersForScene(parsed: ParseResult): string[] {
    const layers: string[] = [];

    // Environment sounds
    switch (parsed.setting.type) {
      case 'dungeon':
        layers.push('dungeon_drip', 'dungeon_wind');
        break;
      case 'forest':
        layers.push('forest_birds', 'forest_wind');
        break;
      case 'castle':
        layers.push('castle_echo');
        break;
      case 'settlement':
        if (parsed.setting.features.includes('tavern')) {
          layers.push('tavern_murmur', 'fire_crackle');
        }
        break;
    }

    // Weather sounds
    switch (parsed.atmosphere.weather) {
      case 'rain':
        layers.push('rain_light');
        break;
      case 'storm':
        layers.push('rain_heavy', 'thunder');
        break;
    }

    // Mood music
    switch (parsed.mood.primary) {
      case 'tense':
        layers.push(parsed.mood.tension === 'high' ? 'tension_high' : 'tension_medium');
        break;
      case 'mysterious':
        layers.push('mystery');
        break;
      case 'dangerous':
        layers.push('danger');
        break;
      case 'peaceful':
        layers.push('wonder');
        break;
    }

    return layers;
  }

  private async addLayer(id: string): Promise<void> {
    const trackUrl = this.TRACKS[id as keyof typeof this.TRACKS];
    if (!trackUrl) return;

    const sound = new Howl({
      src: [trackUrl],
      loop: true,
      volume: 0,
      preload: true
    });

    this.layers.set(id, {
      id,
      sound,
      baseVolume: this.getBaseVolume(id),
      currentVolume: 0
    });

    sound.play();
  }

  private fadeInLayer(id: string, duration: number): void {
    const layer = this.layers.get(id);
    if (!layer) return;

    const targetVolume = layer.baseVolume * this.masterVolume;
    layer.sound.fade(layer.currentVolume, targetVolume, duration);
    layer.currentVolume = targetVolume;
  }

  private fadeOutLayer(id: string, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const layer = this.layers.get(id);
      if (!layer) {
        resolve();
        return;
      }

      layer.sound.fade(layer.currentVolume, 0, duration);
      setTimeout(() => {
        layer.sound.stop();
        this.layers.delete(id);
        resolve();
      }, duration);
    });
  }

  private getBaseVolume(id: string): number {
    // Different base volumes for different types
    if (id.includes('music') || id.includes('tension') || id.includes('mystery')) {
      return 0.3; // Music quieter
    }
    if (id.includes('thunder')) {
      return 0.5; // Thunder medium
    }
    return 0.6; // Ambience louder
  }
}
```

---

## 7. Integration: DM Input to Scene

### 7.1 Complete Flow Example

```typescript
// apps/web/src/hooks/useSceneGeneration.ts

export function useSceneGeneration() {
  const [currentScene, setCurrentScene] = useState<ComposedScene | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const atmosphereMixer = useRef(new AtmosphereMixer());
  
  const generateSceneFromDescription = async (description: string) => {
    setIsGenerating(true);
    
    try {
      // 1. Parse the description
      const parser = new SceneParser();
      const parsed = await parser.parseDescription(description);
      
      // 2. Generate the visual scene
      const composer = new SceneComposer();
      const scene = await composer.composeScene(parsed);
      
      // 3. Update atmosphere audio
      await atmosphereMixer.current.setAtmosphere(parsed);
      
      // 4. Set the scene with transition
      setCurrentScene(scene);
      
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    currentScene,
    isGenerating,
    generateSceneFromDescription
  };
}

// Usage in DM interface
function DMNarrativePanel() {
  const { generateSceneFromDescription, isGenerating } = useSceneGeneration();
  const [narrative, setNarrative] = useState('');

  const handleNarrate = async () => {
    await generateSceneFromDescription(narrative);
  };

  return (
    <div className="dm-narrative-panel">
      <textarea
        value={narrative}
        onChange={(e) => setNarrative(e.target.value)}
        placeholder="Describe the scene... (e.g., 'The party enters a dark, ancient dungeon. Water drips from stalactites, and the air smells of decay. Flickering torchlight reveals disturbing carvings on the walls.')"
      />
      <button onClick={handleNarrate} disabled={isGenerating}>
        {isGenerating ? 'Generating Scene...' : 'Set Scene'}
      </button>
    </div>
  );
}
```

---

## 8. Performance Optimization

### 8.1 Layer Caching
```typescript
// Cache generated layers for reuse
const layerCache = new Map<string, string>(); // promptHash -> imageUrl

async function getCachedLayer(prompt: string): Promise<string | null> {
  const hash = await hashPrompt(prompt);
  return layerCache.get(hash) || null;
}
```

### 8.2 Progressive Loading
```typescript
// Load layers progressively from back to front
async function loadLayersProgressive(layers: ParallaxLayer[]) {
  const sorted = [...layers].sort((a, b) => b.depth - a.depth);
  for (const layer of sorted) {
    await preloadImage(layer.imageUrl);
    // Render each layer as it loads
  }
}
```

### 8.3 Mobile Optimizations
```typescript
// Reduce particles and effects on mobile
const isMobile = window.innerWidth < 768;
const particleCount = isMobile ? 20 : 50;
const layerCount = isMobile ? 3 : 5;
```

---

**END OF DOCUMENT 36**
