'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Scene types
export type SettingType =
  | 'forest' | 'dungeon' | 'tavern' | 'castle' | 'cave'
  | 'village' | 'city' | 'temple' | 'ruins' | 'swamp'
  | 'mountain' | 'desert' | 'ocean' | 'battlefield' | 'crypt';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';
export type MoodType = 'peaceful' | 'mysterious' | 'tense' | 'epic' | 'dark' | 'triumphant';

export interface ParsedScene {
  setting: SettingType;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  mood: MoodType;
  features: string[];
}

export interface ParallaxLayer {
  id: string;
  depth: number; // 0 = far background, 1 = foreground
  color: string;
  opacity: number;
  elements?: React.ReactNode;
}

// Keyword mappings for simple NLP parsing
const SETTING_KEYWORDS: Record<string, SettingType> = {
  forest: 'forest', woods: 'forest', trees: 'forest', grove: 'forest',
  dungeon: 'dungeon', corridor: 'dungeon', underground: 'dungeon',
  tavern: 'tavern', inn: 'tavern', bar: 'tavern', pub: 'tavern',
  castle: 'castle', palace: 'castle', fortress: 'castle', keep: 'castle',
  cave: 'cave', cavern: 'cave', grotto: 'cave',
  village: 'village', town: 'village', hamlet: 'village',
  city: 'city', streets: 'city', urban: 'city',
  temple: 'temple', shrine: 'temple', altar: 'temple', church: 'temple',
  ruins: 'ruins', ancient: 'ruins', crumbling: 'ruins',
  swamp: 'swamp', marsh: 'swamp', bog: 'swamp',
  mountain: 'mountain', peak: 'mountain', cliff: 'mountain',
  desert: 'desert', sand: 'desert', dunes: 'desert',
  ocean: 'ocean', sea: 'ocean', beach: 'ocean', shore: 'ocean',
  battlefield: 'battlefield', war: 'battlefield', combat: 'battlefield',
  crypt: 'crypt', tomb: 'crypt', grave: 'crypt', cemetery: 'crypt',
};

const TIME_KEYWORDS: Record<string, TimeOfDay> = {
  dawn: 'dawn', sunrise: 'dawn', morning: 'dawn',
  day: 'day', noon: 'day', afternoon: 'day', daylight: 'day', bright: 'day',
  dusk: 'dusk', sunset: 'dusk', evening: 'dusk', twilight: 'dusk',
  night: 'night', dark: 'night', midnight: 'night', moonlit: 'night',
};

const WEATHER_KEYWORDS: Record<string, WeatherType> = {
  clear: 'clear', sunny: 'clear', bright: 'clear',
  cloudy: 'cloudy', overcast: 'cloudy', grey: 'cloudy',
  rain: 'rain', raining: 'rain', drizzle: 'rain', wet: 'rain',
  storm: 'storm', thunder: 'storm', lightning: 'storm', tempest: 'storm',
  snow: 'snow', snowing: 'snow', blizzard: 'snow', cold: 'snow',
  fog: 'fog', mist: 'fog', haze: 'fog', foggy: 'fog', misty: 'fog',
};

const MOOD_KEYWORDS: Record<string, MoodType> = {
  peaceful: 'peaceful', calm: 'peaceful', serene: 'peaceful', quiet: 'peaceful',
  mysterious: 'mysterious', strange: 'mysterious', eerie: 'mysterious', odd: 'mysterious',
  tense: 'tense', danger: 'tense', threatening: 'tense', ominous: 'tense',
  epic: 'epic', grand: 'epic', magnificent: 'epic', majestic: 'epic',
  dark: 'dark', evil: 'dark', sinister: 'dark', grim: 'dark',
  triumphant: 'triumphant', victory: 'triumphant', glory: 'triumphant',
};

// Setting-based color palettes
const SETTING_COLORS: Record<SettingType, { bg: string; mid: string; fg: string }> = {
  forest: { bg: '#1a3d1a', mid: '#2d5a2d', fg: '#3d7a3d' },
  dungeon: { bg: '#1a1a2e', mid: '#2d2d4a', fg: '#3d3d5a' },
  tavern: { bg: '#3d2a1a', mid: '#5a3d2d', fg: '#7a5a3d' },
  castle: { bg: '#2a2a3a', mid: '#3d3d5a', fg: '#5a5a7a' },
  cave: { bg: '#1a1a1a', mid: '#2d2d2d', fg: '#3d3d3d' },
  village: { bg: '#3a4a2a', mid: '#5a6a3d', fg: '#7a8a5a' },
  city: { bg: '#2a2a2a', mid: '#4a4a4a', fg: '#6a6a6a' },
  temple: { bg: '#2a2a4a', mid: '#4a4a7a', fg: '#6a6a9a' },
  ruins: { bg: '#3a3a2a', mid: '#5a5a4a', fg: '#7a7a6a' },
  swamp: { bg: '#1a2a1a', mid: '#2d3d2d', fg: '#3d4d3d' },
  mountain: { bg: '#3a4a5a', mid: '#5a6a7a', fg: '#7a8a9a' },
  desert: { bg: '#5a4a2a', mid: '#8a7a4a', fg: '#aa9a6a' },
  ocean: { bg: '#1a3a5a', mid: '#2d5a7a', fg: '#3d7a9a' },
  battlefield: { bg: '#3a2a2a', mid: '#5a3d3d', fg: '#7a5a5a' },
  crypt: { bg: '#1a1a2a', mid: '#2d2d3d', fg: '#3d3d4a' },
};

// Time-based overlays
const TIME_OVERLAYS: Record<TimeOfDay, string> = {
  dawn: 'linear-gradient(to top, rgba(255, 150, 100, 0.2), transparent)',
  day: 'linear-gradient(to bottom, rgba(255, 255, 200, 0.1), transparent)',
  dusk: 'linear-gradient(to top, rgba(255, 100, 50, 0.3), rgba(50, 50, 100, 0.2))',
  night: 'linear-gradient(to bottom, rgba(0, 0, 50, 0.5), rgba(0, 0, 30, 0.3))',
};

// Simple NLP parser
function parseDescription(text: string): ParsedScene {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  let setting: SettingType = 'dungeon';
  let timeOfDay: TimeOfDay = 'day';
  let weather: WeatherType = 'clear';
  let mood: MoodType = 'mysterious';
  const features: string[] = [];

  // Find setting
  for (const word of words) {
    if (SETTING_KEYWORDS[word]) {
      setting = SETTING_KEYWORDS[word];
      break;
    }
  }

  // Find time
  for (const word of words) {
    if (TIME_KEYWORDS[word]) {
      timeOfDay = TIME_KEYWORDS[word];
      break;
    }
  }

  // Find weather
  for (const word of words) {
    if (WEATHER_KEYWORDS[word]) {
      weather = WEATHER_KEYWORDS[word];
      break;
    }
  }

  // Find mood
  for (const word of words) {
    if (MOOD_KEYWORDS[word]) {
      mood = MOOD_KEYWORDS[word];
      break;
    }
  }

  // Extract features (nouns that aren't settings)
  const featureWords = ['torch', 'fire', 'water', 'statue', 'door', 'chest', 'table', 'altar', 'throne'];
  for (const word of words) {
    if (featureWords.includes(word)) {
      features.push(word);
    }
  }

  return { setting, timeOfDay, weather, mood, features };
}

// Particle component for atmospheric effects
function Particles({ type, count = 30 }: { type: 'dust' | 'rain' | 'snow' | 'fog' | 'embers'; count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4,
    size: type === 'fog' ? 50 + Math.random() * 100 : 2 + Math.random() * 4,
  }));

  const getParticleStyle = (p: typeof particles[0]) => {
    switch (type) {
      case 'rain':
        return {
          left: `${p.x}%`,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration * 0.3}s`,
        };
      case 'snow':
        return {
          left: `${p.x}%`,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
        };
      case 'embers':
        return {
          left: `${p.x}%`,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
        };
      case 'fog':
        return {
          left: `${p.x - 25}%`,
          top: `${30 + Math.random() * 40}%`,
          width: `${p.size}px`,
          height: `${p.size}px`,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration * 2}s`,
        };
      default: // dust
        return {
          left: `${p.x}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
        };
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute ${
            type === 'rain' ? 'w-0.5 h-4 bg-blue-300/50 animate-rain' :
            type === 'snow' ? 'w-2 h-2 bg-white/70 rounded-full animate-snow' :
            type === 'embers' ? 'w-1 h-1 bg-orange-400 rounded-full animate-ember' :
            type === 'fog' ? 'bg-white/10 rounded-full animate-fog' :
            'w-1 h-1 bg-white/30 rounded-full animate-dust'
          }`}
          style={getParticleStyle(p)}
        />
      ))}
      <style jsx>{`
        @keyframes rain {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        @keyframes snow {
          0% { transform: translateY(-10px) translateX(0); }
          50% { transform: translateY(50vh) translateX(20px); }
          100% { transform: translateY(100vh) translateX(-10px); }
        }
        @keyframes ember {
          0% { transform: translateY(100vh) scale(1); opacity: 1; }
          100% { transform: translateY(-20vh) scale(0.5); opacity: 0; }
        }
        @keyframes fog {
          0% { transform: translateX(-50px); opacity: 0.3; }
          50% { opacity: 0.5; }
          100% { transform: translateX(50px); opacity: 0.3; }
        }
        @keyframes dust {
          0% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-20px) translateX(10px); opacity: 0.3; }
        }
        .animate-rain { animation: rain linear infinite; }
        .animate-snow { animation: snow ease-in-out infinite; }
        .animate-ember { animation: ember ease-out infinite; }
        .animate-fog { animation: fog ease-in-out infinite alternate; }
        .animate-dust { animation: dust ease-in-out infinite alternate; }
      `}</style>
    </div>
  );
}

interface DynamicSceneProps {
  description?: string;
  scene?: ParsedScene;
  className?: string;
  showControls?: boolean;
  onSceneChange?: (scene: ParsedScene) => void;
}

export function DynamicScene({
  description: initialDescription = '',
  scene: providedScene,
  className = '',
  showControls = false,
  onSceneChange,
}: DynamicSceneProps) {
  const [description, setDescription] = useState(initialDescription);
  const [scene, setScene] = useState<ParsedScene | null>(providedScene || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  // Parse description when it changes
  const generateScene = useCallback(() => {
    if (!description.trim()) return;

    setIsGenerating(true);

    // Simulate generation delay for effect
    setTimeout(() => {
      const parsed = parseDescription(description);
      setScene(parsed);
      onSceneChange?.(parsed);
      setIsGenerating(false);
    }, 500);
  }, [description, onSceneChange]);

  // Handle mouse movement for parallax effect
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  // Update scene if provided externally
  useEffect(() => {
    if (providedScene) {
      setScene(providedScene);
    }
  }, [providedScene]);

  const colors = scene ? SETTING_COLORS[scene.setting] : SETTING_COLORS.dungeon;
  const timeOverlay = scene ? TIME_OVERLAYS[scene.timeOfDay] : TIME_OVERLAYS.day;

  // Get weather particles
  const getWeatherParticles = () => {
    if (!scene) return null;
    switch (scene.weather) {
      case 'rain':
      case 'storm':
        return <Particles type="rain" count={scene.weather === 'storm' ? 100 : 50} />;
      case 'snow':
        return <Particles type="snow" count={40} />;
      case 'fog':
        return <Particles type="fog" count={15} />;
      default:
        return <Particles type="dust" count={20} />;
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Scene Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative w-full h-full min-h-[300px]"
      >
        <AnimatePresence mode="wait">
          {scene && (
            <motion.div
              key={`${scene.setting}-${scene.timeOfDay}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              {/* Background Layer (far) */}
              <motion.div
                className="absolute inset-0"
                style={{
                  backgroundColor: colors.bg,
                  transform: `translate(${(mousePos.x - 0.5) * -10}px, ${(mousePos.y - 0.5) * -10}px)`,
                }}
              />

              {/* Mid Layer */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to top, ${colors.mid}aa, transparent)`,
                  transform: `translate(${(mousePos.x - 0.5) * -20}px, ${(mousePos.y - 0.5) * -20}px)`,
                }}
              />

              {/* Foreground Layer */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to top, ${colors.fg}66, transparent 50%)`,
                  transform: `translate(${(mousePos.x - 0.5) * -30}px, ${(mousePos.y - 0.5) * -30}px)`,
                }}
              />

              {/* Time of Day Overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: timeOverlay }}
              />

              {/* Weather Particles */}
              {getWeatherParticles()}

              {/* Vignette */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
                }}
              />

              {/* Scene Info Overlay */}
              <div className="absolute bottom-4 left-4 text-white/70 text-sm">
                <div className="flex items-center gap-2">
                  <span className="capitalize">{scene.setting}</span>
                  <span>•</span>
                  <span className="capitalize">{scene.timeOfDay}</span>
                  <span>•</span>
                  <span className="capitalize">{scene.weather}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-secondary/30 border-t-secondary rounded-full mx-auto mb-2"
              />
              <p className="text-text-muted text-sm">Generating scene...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!scene && !isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-card">
            <p className="text-text-muted">Enter a description to generate a scene</p>
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="mt-4 space-y-3">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the scene... (e.g., 'A dark forest at night with fog rolling between the ancient trees')"
            className="w-full px-4 py-3 rounded-lg border border-input-border resize-none focus:border-secondary focus:outline-none"
            style={{ backgroundColor: '#FFFFFF', color: '#18181B' }}
            rows={3}
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateScene}
            disabled={isGenerating || !description.trim()}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-secondary to-purple-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Scene'}
          </motion.button>
        </div>
      )}
    </div>
  );
}

export default DynamicScene;
