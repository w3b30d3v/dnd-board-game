# Document 38: AI Voice & Narration System

## Purpose
This document specifies the **text-to-speech narration system** that brings the D&D experience to life with AI-generated voice for NPCs, DM narration, and ambient dialogue.

---

## 1. Voice Categories

| Category | Use Case | Voice Style |
|----------|----------|-------------|
| DM Narration | Scene descriptions | Deep, dramatic |
| NPC Dialogue | Character speech | Varied by character |
| Combat Callouts | Action announcements | Quick, energetic |
| System Feedback | Notifications | Neutral, clear |

---

## 2. Voice Profiles

### 2.1 DM/Narrator
```typescript
export const DM_VOICE: VoiceProfile = {
  id: 'dm_narrator',
  provider: 'elevenlabs',
  voiceId: 'pNInz6obpgDQGcFmaJgB',
  settings: { stability: 0.75, similarityBoost: 0.75, style: 0.5 },
  postProcessing: { reverb: 0.15, lowPass: 8000 }
};
```

### 2.2 Character Templates
```typescript
export const CHARACTER_VOICES = {
  noble_male: { voiceId: 'VR6AewLTigWG4xSOukaG', pitchShift: 0, speed: 0.95 },
  warrior_male: { voiceId: 'TxGEqnHWrfWFTfGW9XjX', pitchShift: -2, speed: 1.0 },
  wizard_male: { voiceId: 'SOYHLrjzK2X1ezoPC6cr', pitchShift: 0, speed: 0.9 },
  noble_female: { voiceId: 'EXAVITQu4vr4xnSDxMaL', pitchShift: 0, speed: 0.95 },
  warrior_female: { voiceId: 'jsCqWAovK2LkecY7zXl4', pitchShift: -1, speed: 1.0 },
  dwarf: { voiceId: 'TxGEqnHWrfWFTfGW9XjX', pitchShift: -4, speed: 0.9 },
  elf: { voiceId: 'EXAVITQu4vr4xnSDxMaL', pitchShift: 2, speed: 0.95 },
  goblin: { voiceId: 'jBpfuIE2acCO8z3wKNLl', pitchShift: 8, speed: 1.3 },
  dragon: { voiceId: 'pNInz6obpgDQGcFmaJgB', pitchShift: -6, speed: 0.7, reverb: 0.4 },
  demon: { voiceId: 'TxGEqnHWrfWFTfGW9XjX', pitchShift: -8, speed: 0.8, distortion: 0.2 }
};
```

### 2.3 Emotion Modifiers
```typescript
export const EMOTIONS = {
  neutral: { stability: 0.75, speed: 1.0 },
  excited: { stability: 0.5, speed: 1.15, pitchMod: 2 },
  angry: { stability: 0.4, speed: 1.1, pitchMod: -1, volume: 1.2 },
  fearful: { stability: 0.3, speed: 1.2, pitchMod: 3 },
  sad: { stability: 0.8, speed: 0.85, pitchMod: -2 },
  mysterious: { stability: 0.9, speed: 0.8, reverb: 0.3 },
  threatening: { stability: 0.6, speed: 0.9, pitchMod: -3, volume: 0.9 },
  triumphant: { stability: 0.5, speed: 1.0, pitchMod: 2, volume: 1.3 }
};
```

---

## 3. TTS Service

```typescript
export class VoiceGenerator {
  async generateVoice(request: VoiceRequest): Promise<GeneratedAudio> {
    const cacheKey = this.buildCacheKey(request);
    const cached = await this.checkCache(cacheKey);
    if (cached) return { ...cached, cached: true };
    
    const settings = this.buildSettings(request);
    
    const audioStream = await this.elevenLabs.textToSpeech.convert(
      settings.voiceId,
      {
        text: request.text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: settings
      }
    );
    
    const processed = await this.postProcess(audioStream, settings);
    const url = await this.uploadToS3(processed);
    
    await this.cache(cacheKey, { url, duration: processed.duration });
    return { audioUrl: url, duration: processed.duration, cached: false };
  }
}
```

---

## 4. Narration Queue

```typescript
export class NarrationQueue {
  private queue: NarrationItem[] = [];
  private howl: Howl | null = null;
  
  async speak(item: NarrationItem): Promise<void> {
    if (item.priority === 'high' && this.currentItem?.interruptible) {
      this.interrupt();
    }
    
    this.queue.push(item);
    if (!this.isProcessing) await this.processQueue();
  }
  
  private async processQueue(): Promise<void> {
    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      const audio = await this.voiceGenerator.generateVoice({
        text: item.text,
        voiceProfile: item.voice,
        emotion: item.emotion
      });
      await this.playAudio(audio.audioUrl, item);
    }
  }
}
```

---

## 5. Combat Narration Templates

```typescript
const COMBAT_TEMPLATES = {
  attack_hit: [
    "{actor}'s {weapon} strikes true, dealing {damage} damage!",
    "{target} reels as {actor}'s attack connects!",
  ],
  attack_miss: [
    "{actor}'s attack goes wide, missing {target}.",
    "{target} narrowly dodges {actor}'s strike.",
  ],
  critical: [
    "CRITICAL HIT! {actor} lands a devastating blow!",
    "A perfect strike! {damage} damage to {target}!",
  ],
  spell: [
    "{actor} channels arcane energy, unleashing {spell}!",
    "The air crackles as {actor} casts {spell}!",
  ],
  death: [
    "{target} falls, their strength spent.",
    "{target} has been slain!",
  ]
};
```

---

## 6. Subtitles Component

```tsx
export function Subtitles({ text, speaker, isPlaying, duration }: SubtitleProps) {
  const [displayedText, setDisplayedText] = useState('');
  const words = text.split(' ');
  const msPerWord = duration / words.length;
  
  useEffect(() => {
    if (!isPlaying) return setDisplayedText(text);
    
    let index = 0;
    const interval = setInterval(() => {
      if (index >= words.length) return clearInterval(interval);
      setDisplayedText(words.slice(0, ++index).join(' '));
    }, msPerWord);
    
    return () => clearInterval(interval);
  }, [text, isPlaying, duration]);
  
  return (
    <motion.div className="subtitles" style={{
      position: 'fixed', bottom: '10%', left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.8)', padding: '1rem 2rem'
    }}>
      {speaker && <div style={{ color: '#F59E0B' }}>{speaker}</div>}
      <div style={{ color: '#F4F4F5', fontSize: '1.25rem' }}>{displayedText}</div>
    </motion.div>
  );
}
```

---

## 7. Pre-generation Cache

```typescript
const COMMON_PHRASES = [
  "Roll for initiative!",
  "Your turn.",
  "Critical hit!",
  "You have fallen unconscious.",
  "A new day dawns...",
  "Welcome, traveler.",
  "Farewell, adventurer."
];

async function pregenerateCommonPhrases(): Promise<void> {
  for (const phrase of COMMON_PHRASES) {
    await voiceGenerator.generateVoice({
      text: phrase,
      voiceProfile: 'dm_narrator',
      cacheKey: `pregenerated:${phrase}`
    });
  }
}
```

---

**END OF DOCUMENT 38**
