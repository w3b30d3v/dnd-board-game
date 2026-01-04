# Audio Assets

This directory contains audio files for the D&D Board Game.

## Directory Structure

```
audio/
├── sfx/
│   ├── ui/          # UI interaction sounds
│   │   ├── click.mp3
│   │   ├── hover.mp3
│   │   ├── open.mp3
│   │   ├── close.mp3
│   │   └── notification.mp3
│   ├── combat/      # Combat sounds
│   │   ├── sword_hit.mp3
│   │   ├── sword_swing.mp3
│   │   ├── bow_draw.mp3
│   │   ├── arrow_fire.mp3
│   │   ├── arrow_hit.mp3
│   │   ├── damage_taken.mp3
│   │   ├── critical_hit.mp3
│   │   └── miss.mp3
│   ├── dice/        # Dice rolling sounds
│   │   ├── dice_roll.mp3
│   │   ├── dice_land.mp3
│   │   ├── dice_critical.mp3
│   │   ├── dice_success.mp3
│   │   └── dice_fail.mp3
│   ├── magic/       # Spell/magic sounds
│   │   ├── spell_cast.mp3
│   │   ├── spell_fire.mp3
│   │   ├── spell_ice.mp3
│   │   ├── spell_lightning.mp3
│   │   ├── spell_heal.mp3
│   │   ├── spell_buff.mp3
│   │   └── spell_debuff.mp3
│   └── environment/ # Ambient sounds
│       ├── footstep_stone.mp3
│       ├── door_open.mp3
│       ├── level_up.mp3
│       └── death.mp3
└── music/           # Background music tracks
    └── (stems for dynamic music system)
```

## Recommended Sources for Free Audio

1. **Freesound.org** - Large library of CC0 and CC-BY sounds
2. **OpenGameArt.org** - Game-specific audio assets
3. **Incompetech** - Royalty-free music by Kevin MacLeod
4. **Zapsplat** - Free sound effects (attribution required)
5. **Mixkit** - Free sound effects and music

## Audio Specifications

- **Format**: MP3 or OGG (MP3 preferred for compatibility)
- **Sample Rate**: 44.1kHz
- **Bit Rate**: 128-192kbps for SFX, 256kbps for music
- **Channels**: Stereo for music, Mono or Stereo for SFX
- **Duration**: SFX should be 0.1-3 seconds, music tracks 2-5 minutes

## Integration

The audio system uses Howler.js and is managed by:
- `SFXManager` - Sound effects playback
- `DynamicMusicManager` - Adaptive music with stem-based mixing

See `/src/lib/audio/` for implementation details.
