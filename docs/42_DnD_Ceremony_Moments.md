# Document 42: D&D Ceremony Moments

## Purpose

These are the **sacred moments** of D&D - the rituals that dedicated players live for. Each must be treated with maximum dramatic weight. A generic implementation will disappoint; a ceremonial implementation will delight.

---

# 1. THE DICE ROLL CEREMONY

## 1.1 Philosophy

The d20 roll is not a random number generator. It's a **moment of fate**. Players lean in, hold their breath, and watch the die tumble. We must capture:

- **Anticipation** - The pickup, the shake
- **Release** - The throw with real physics
- **Tumble** - Bouncing, spinning, settling
- **Resolution** - The dramatic reveal
- **Reaction** - Celebration or despair

## 1.2 Physical Dice Simulation

```typescript
// Physics-based d20 rolling
interface DicePhysics {
  mass: number;           // Weight feel
  friction: number;       // Table surface
  restitution: number;    // Bounciness
  angularDamping: number; // Spin decay
}

const D20_PHYSICS: DicePhysics = {
  mass: 1.0,
  friction: 0.4,         // Wood table feel
  restitution: 0.3,      // Some bounce, not rubber
  angularDamping: 0.5    // Spins but settles
};

interface RollSequence {
  phase: 'idle' | 'pickup' | 'shake' | 'throw' | 'tumble' | 'settle' | 'reveal';
  duration: number;
}

const ROLL_SEQUENCE: RollSequence[] = [
  { phase: 'pickup', duration: 200 },   // Dice lifts
  { phase: 'shake', duration: 800 },    // Player shakes (user can extend)
  { phase: 'throw', duration: 150 },    // Release moment
  { phase: 'tumble', duration: 1200 },  // Physics simulation
  { phase: 'settle', duration: 400 },   // Coming to rest
  { phase: 'reveal', duration: 500 }    // Number shown dramatically
];
```

## 1.3 The Shake Phase (Player Agency)

```tsx
function DiceShakePhase({ onRelease }: { onRelease: () => void }) {
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  
  // Player can shake by moving mouse/finger or clicking rapidly
  const handleShake = () => {
    setShakeIntensity(prev => Math.min(prev + 0.1, 1));
    // Haptic feedback on mobile
    if (navigator.vibrate) navigator.vibrate(10);
  };
  
  return (
    <motion.div
      className="dice-shake-zone"
      onMouseMove={handleShake}
      onTouchMove={handleShake}
      onClick={onRelease}
      animate={{
        rotate: isShaking ? [0, -5, 5, -3, 3, 0] : 0,
        scale: 1 + shakeIntensity * 0.1
      }}
      transition={{ duration: 0.1, repeat: Infinity }}
    >
      <div className="dice-in-hand">
        <D20Model intensity={shakeIntensity} />
      </div>
      <p className="shake-prompt">Shake and click to roll!</p>
      
      {/* Audio: dice rattling in cupped hands, intensity based */}
      <DiceRattleAudio intensity={shakeIntensity} />
    </motion.div>
  );
}
```

## 1.4 The Tumble Phase (Physics)

```typescript
// Simplified 2.5D dice physics for performance
class DiceTumbleSimulation {
  private velocity = { x: 0, y: 0, rotation: 0 };
  private position = { x: 0, y: 0, rotation: 0 };
  private bounceCount = 0;
  private readonly maxBounces = 4;
  
  constructor(
    private throwForce: number,
    private throwAngle: number,
    private finalValue: number // Pre-determined result
  ) {
    this.velocity = {
      x: Math.cos(throwAngle) * throwForce * 15,
      y: Math.sin(throwAngle) * throwForce * -10,
      rotation: throwForce * 720 + Math.random() * 360
    };
  }
  
  update(deltaTime: number): boolean {
    // Apply physics
    this.velocity.y += 980 * deltaTime; // Gravity
    this.velocity.x *= 0.99; // Air resistance
    this.velocity.rotation *= 0.98;
    
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.rotation += this.velocity.rotation * deltaTime;
    
    // Bounce off table
    if (this.position.y > 0 && this.velocity.y > 0) {
      this.velocity.y *= -0.4; // Energy loss
      this.velocity.rotation *= 0.7;
      this.bounceCount++;
      
      // Play bounce sound with decreasing volume
      playSound('dice_bounce', { volume: 0.8 - this.bounceCount * 0.15 });
    }
    
    // Settled?
    return Math.abs(this.velocity.y) < 5 && 
           Math.abs(this.velocity.rotation) < 10;
  }
}
```

## 1.5 The Reveal Phase

```tsx
function DiceReveal({ 
  value, 
  rollType,
  dc 
}: { 
  value: number; 
  rollType: RollType;
  dc?: number;
}) {
  const isNat20 = value === 20;
  const isNat1 = value === 1;
  const isSuccess = dc ? value >= dc : undefined;
  
  return (
    <motion.div className="dice-reveal">
      {/* The number grows from the dice */}
      <motion.span
        className={cn(
          "dice-result-number",
          isNat20 && "nat-20",
          isNat1 && "nat-1"
        )}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 15,
          delay: 0.2 
        }}
      >
        {value}
      </motion.span>
      
      {/* Nat 20 Celebration */}
      {isNat20 && (
        <>
          <ParticleExplosion 
            type="gold-burst" 
            count={50} 
            spread={200} 
          />
          <ScreenFlash color="gold" duration={200} />
          <motion.div 
            className="nat20-text"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.3 }}
          >
            NATURAL 20!
          </motion.div>
          <CelebrationAudio type="nat20" />
        </>
      )}
      
      {/* Nat 1 Despair */}
      {isNat1 && (
        <>
          <ScreenShake intensity={10} duration={300} />
          <motion.div 
            className="nat1-text"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            Critical Failure...
          </motion.div>
          <DespairAudio type="nat1" />
        </>
      )}
      
      {/* Success/Failure indicator if DC known */}
      {dc !== undefined && (
        <motion.div
          className={cn("dc-result", isSuccess ? "success" : "failure")}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {isSuccess ? "SUCCESS!" : "FAILED"} (DC {dc})
        </motion.div>
      )}
    </motion.div>
  );
}
```

## 1.6 Audio Design

```typescript
const DICE_AUDIO = {
  // Pickup - wood scraping
  pickup: {
    src: '/audio/dice/pickup.mp3',
    volume: 0.5
  },
  
  // Shake - rattling, layered
  shake: {
    src: '/audio/dice/shake-loop.mp3',
    volume: 0.6,
    loop: true,
    // Pitch increases with intensity
    rateRange: [0.9, 1.2]
  },
  
  // Throw - whoosh + release
  throw: {
    src: '/audio/dice/throw.mp3',
    volume: 0.7
  },
  
  // Bounce - multiple variants for realism
  bounce: {
    variants: [
      '/audio/dice/bounce-1.mp3',
      '/audio/dice/bounce-2.mp3',
      '/audio/dice/bounce-3.mp3'
    ],
    volume: 0.6
  },
  
  // Settle - final tap
  settle: {
    src: '/audio/dice/settle.mp3',
    volume: 0.4
  },
  
  // Results
  nat20: {
    src: '/audio/dice/nat20-fanfare.mp3',
    volume: 0.9
  },
  nat1: {
    src: '/audio/dice/nat1-doom.mp3',
    volume: 0.7
  },
  success: {
    src: '/audio/dice/success-chime.mp3',
    volume: 0.5
  },
  failure: {
    src: '/audio/dice/failure-thud.mp3',
    volume: 0.5
  }
};
```

---

# 2. "ROLL FOR INITIATIVE!" CEREMONY

## 2.1 The Moment

This is the transition from exploration/roleplay to COMBAT. It must feel like a dramatic shift - the stakes just became real.

## 2.2 Sequence

```typescript
const INITIATIVE_CEREMONY = {
  phases: [
    {
      name: 'trigger',
      duration: 500,
      actions: [
        'Freeze current scene',
        'Begin dramatic zoom',
        'Music cuts to silence'
      ]
    },
    {
      name: 'announcement',
      duration: 2000,
      actions: [
        'Screen darkens at edges',
        '"ROLL FOR INITIATIVE" text appears',
        'DM voice plays announcement',
        'Dramatic drum hit'
      ]
    },
    {
      name: 'everyone_rolls',
      duration: 3000,
      actions: [
        'All player dice appear on screen',
        'Dice roll simultaneously',
        'Results appear one by one with stagger',
        'Enemy initiatives appear (hidden values)'
      ]
    },
    {
      name: 'order_reveal',
      duration: 2000,
      actions: [
        'Initiative tracker slides in',
        'Order sorts with animation',
        'First actor highlights',
        'Combat music begins'
      ]
    }
  ]
};
```

## 2.3 Visual Implementation

```tsx
function InitiativeCeremony({ 
  participants,
  onComplete 
}: InitiativeCeremonyProps) {
  const [phase, setPhase] = useState<'trigger' | 'announce' | 'roll' | 'reveal'>('trigger');
  const [rolls, setRolls] = useState<Map<string, number>>(new Map());
  
  return (
    <motion.div 
      className="initiative-ceremony-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Darkened vignette */}
      <div className="ceremony-vignette" />
      
      {/* THE ANNOUNCEMENT */}
      {phase === 'announce' && (
        <motion.div
          className="initiative-announcement"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <motion.h1
            className="initiative-text"
            initial={{ y: 50 }}
            animate={{ y: 0 }}
          >
            ROLL FOR INITIATIVE!
          </motion.h1>
          
          {/* Crossed swords decoration */}
          <motion.div 
            className="swords-decoration"
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
            transition={{ delay: 0.3 }}
          >
            ⚔️
          </motion.div>
        </motion.div>
      )}
      
      {/* SIMULTANEOUS ROLLING */}
      {phase === 'roll' && (
        <div className="initiative-roll-grid">
          {participants.map((p, i) => (
            <motion.div
              key={p.id}
              className="initiative-roll-slot"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <CharacterPortrait character={p} size="small" />
              <DiceRoll
                modifier={p.initiativeModifier}
                onResult={(value) => {
                  setRolls(prev => new Map(prev).set(p.id, value));
                }}
                autoRoll
                delay={i * 200}
              />
            </motion.div>
          ))}
        </div>
      )}
      
      {/* ORDER REVEAL */}
      {phase === 'reveal' && (
        <InitiativeTrackerReveal 
          participants={participants}
          rolls={rolls}
          onComplete={onComplete}
        />
      )}
    </motion.div>
  );
}
```

## 2.4 Audio

```typescript
const INITIATIVE_AUDIO = {
  // The moment of declaration
  announcement: {
    voiceLine: '/audio/dm/roll-for-initiative.mp3', // "Roll for initiative!"
    drumHit: '/audio/sfx/dramatic-drum.mp3',
    musicCut: true // Silence current music
  },
  
  // During rolls
  rolling: {
    tensionDrone: '/audio/music/initiative-tension.mp3',
    multiDiceRumble: '/audio/dice/multi-roll.mp3'
  },
  
  // Order reveal
  reveal: {
    sortWhoosh: '/audio/sfx/initiative-sort.mp3',
    combatMusicStart: '/audio/music/combat-intro.mp3'
  }
};
```

---

# 3. ADVANTAGE / DISADVANTAGE CEREMONY

## 3.1 The Moment

Rolling with advantage or disadvantage is visceral - you roll TWO dice and fate decides. The discarded die must visibly "die."

## 3.2 Visual Treatment

```tsx
function AdvantageRoll({
  type, // 'advantage' | 'disadvantage'
  modifier,
  dc,
  onResult
}: AdvantageRollProps) {
  const [die1, setDie1] = useState<number | null>(null);
  const [die2, setDie2] = useState<number | null>(null);
  const [chosenDie, setChosenDie] = useState<1 | 2 | null>(null);
  
  const finalValue = chosenDie === 1 ? die1 : die2;
  const discardedValue = chosenDie === 1 ? die2 : die1;
  
  return (
    <div className="advantage-roll">
      {/* Header showing type */}
      <motion.div 
        className={cn(
          "advantage-header",
          type === 'advantage' ? 'text-green-500' : 'text-red-500'
        )}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {type === 'advantage' ? (
          <>✨ ADVANTAGE - Take the Higher</>
        ) : (
          <>💀 DISADVANTAGE - Take the Lower</>
        )}
      </motion.div>
      
      {/* Two dice side by side */}
      <div className="dual-dice-container">
        <motion.div 
          className={cn(
            "die-slot",
            chosenDie === 1 && "chosen",
            chosenDie === 2 && "discarded"
          )}
          animate={chosenDie === 2 ? {
            opacity: 0.3,
            scale: 0.8,
            filter: 'grayscale(100%)',
            y: 20
          } : {}}
        >
          <D20 
            onResult={setDie1} 
            glow={chosenDie === 1}
          />
          {die1 && <span className="die-value">{die1}</span>}
        </motion.div>
        
        <motion.div 
          className={cn(
            "die-slot",
            chosenDie === 2 && "chosen",
            chosenDie === 1 && "discarded"
          )}
          animate={chosenDie === 1 ? {
            opacity: 0.3,
            scale: 0.8,
            filter: 'grayscale(100%)',
            y: 20
          } : {}}
        >
          <D20 
            onResult={setDie2}
            glow={chosenDie === 2}
          />
          {die2 && <span className="die-value">{die2}</span>}
        </motion.div>
      </div>
      
      {/* Once both rolled, show selection */}
      {die1 !== null && die2 !== null && (
        <motion.div
          className="advantage-resolution"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {/* Arrow pointing to chosen die */}
          <motion.div
            className="choice-indicator"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {type === 'advantage' 
              ? `Taking ${Math.max(die1, die2)}!` 
              : `Taking ${Math.min(die1, die2)}...`
            }
          </motion.div>
          
          {/* Final result with modifier */}
          <div className="final-result">
            {finalValue} + {modifier} = {finalValue! + modifier}
          </div>
        </motion.div>
      )}
    </div>
  );
}
```

## 3.3 The "Discarded Die" Effect

```css
/* The die not chosen fades and falls */
.die-slot.discarded {
  animation: die-discard 0.6s ease-out forwards;
}

@keyframes die-discard {
  0% {
    opacity: 1;
    transform: scale(1) translateY(0) rotate(0deg);
    filter: grayscale(0);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.9) translateY(10px) rotate(10deg);
  }
  100% {
    opacity: 0.2;
    transform: scale(0.7) translateY(30px) rotate(20deg);
    filter: grayscale(100%);
  }
}

/* The chosen die glows with triumph/despair */
.die-slot.chosen.advantage {
  animation: chosen-triumph 0.5s ease-out;
}

@keyframes chosen-triumph {
  0% { box-shadow: 0 0 0 rgba(34, 197, 94, 0); }
  50% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.8); }
  100% { box-shadow: 0 0 15px rgba(34, 197, 94, 0.4); }
}

.die-slot.chosen.disadvantage {
  animation: chosen-despair 0.5s ease-out;
}

@keyframes chosen-despair {
  0% { box-shadow: 0 0 0 rgba(239, 68, 68, 0); }
  50% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.8); }
  100% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); }
}
```

---

# 4. CONCENTRATION TRACKING

## 4.1 The Stakes

Losing concentration can end a battle. Casters MUST always see:
- What spell they're concentrating on
- How long it's been active
- When they need to make a check

## 4.2 Persistent Indicator

```tsx
function ConcentrationIndicator({ 
  spell,
  caster,
  startedRound,
  currentRound
}: ConcentrationIndicatorProps) {
  const [isPulsing, setIsPulsing] = useState(false);
  
  // Pulse when damage taken
  useEffect(() => {
    const handleDamage = (e: DamageEvent) => {
      if (e.targetId === caster.id) {
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 1000);
      }
    };
    
    gameEvents.on('damage', handleDamage);
    return () => gameEvents.off('damage', handleDamage);
  }, [caster.id]);
  
  return (
    <motion.div 
      className={cn(
        "concentration-indicator",
        isPulsing && "concentration-threatened"
      )}
      animate={isPulsing ? {
        scale: [1, 1.1, 1],
        borderColor: ['#8B5CF6', '#EF4444', '#8B5CF6']
      } : {}}
    >
      {/* The iconic concentration symbol */}
      <div className="concentration-icon">
        <motion.div 
          className="concentration-ring"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          🔮
        </motion.div>
      </div>
      
      {/* Spell info */}
      <div className="concentration-spell">
        <span className="spell-name">{spell.name}</span>
        <span className="spell-duration">
          Round {currentRound - startedRound + 1} / {spell.duration}
        </span>
      </div>
      
      {/* Warning when threatened */}
      {isPulsing && (
        <motion.div 
          className="concentration-check-warning"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          ⚠️ CONCENTRATION CHECK!
        </motion.div>
      )}
    </motion.div>
  );
}
```

## 4.3 Concentration Check Ceremony

```tsx
function ConcentrationCheck({
  caster,
  spell,
  damageTaken,
  onResult
}: ConcentrationCheckProps) {
  const dc = Math.max(10, Math.floor(damageTaken / 2));
  const [result, setResult] = useState<'pending' | 'maintained' | 'broken'>('pending');
  
  return (
    <motion.div 
      className="concentration-check-modal"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* Dramatic framing */}
      <div className="concentration-frame">
        <div className="concentration-header">
          <span className="concentration-title">CONCENTRATION CHECK</span>
          <span className="concentration-dc">DC {dc}</span>
        </div>
        
        {/* The spell at stake */}
        <div className="spell-at-stake">
          <SpellCard spell={spell} size="small" />
          <div className="stake-text">
            {result === 'pending' && "Will you maintain your focus?"}
            {result === 'maintained' && "Focus maintained!"}
            {result === 'broken' && `${spell.name} fades away...`}
          </div>
        </div>
        
        {/* Constitution save roll */}
        <DiceRoll
          ability="constitution"
          dc={dc}
          character={caster}
          onResult={(roll, success) => {
            setResult(success ? 'maintained' : 'broken');
            onResult(success);
          }}
        />
        
        {/* Result effects */}
        {result === 'broken' && (
          <motion.div
            className="spell-break-effect"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 1 }}
          >
            <ParticleEffect type="spell-shatter" color={spell.school.color} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
```

## 4.4 Concentration Break Effect

```css
/* When concentration breaks - the spell shatters */
.spell-break-effect {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spell-shatter {
  animation: spell-shatter 0.8s ease-out forwards;
}

@keyframes spell-shatter {
  0% {
    transform: scale(1);
    opacity: 1;
    filter: brightness(1);
  }
  20% {
    transform: scale(1.1);
    filter: brightness(2);
  }
  100% {
    transform: scale(2);
    opacity: 0;
    filter: brightness(0);
  }
}

/* Audio: glass shattering + magical dissipation */
```

---

# 5. ADDITIONAL CEREMONY ELEMENTS

## 5.1 Death Save Heartbeat

Already specified in Doc 41, but adding audio detail:

```typescript
const DEATH_SAVE_AUDIO = {
  // Heartbeat starts slow, gets faster with more failures
  heartbeat: {
    base: '/audio/heartbeat-slow.mp3',
    fast: '/audio/heartbeat-fast.mp3',
    flat: '/audio/heartbeat-flatline.mp3'
  },
  
  // Environment goes muffled
  muffle: {
    filter: 'lowpass',
    frequency: 800, // Everything sounds distant
    fadeIn: 1000
  },
  
  // Music
  music: {
    tension: '/audio/music/death-save-tension.mp3',
    volume: 0.3 // Quiet, ominous
  }
};

// Heartbeat rate based on failures
function getHeartbeatRate(failures: number): number {
  switch (failures) {
    case 0: return 1.0;   // Normal
    case 1: return 1.3;   // Slightly faster
    case 2: return 1.8;   // Racing
    default: return 0;    // Flatline (3 failures = death)
  }
}
```

## 5.2 Level Up Celebration

```tsx
function LevelUpCeremony({ 
  character, 
  newLevel,
  newFeatures 
}: LevelUpProps) {
  return (
    <motion.div className="level-up-ceremony">
      {/* Golden light from above */}
      <motion.div
        className="level-up-light"
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Character portrait glowing */}
      <motion.div
        className="character-ascend"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <CharacterPortrait character={character} glowing />
      </motion.div>
      
      {/* THE NUMBER */}
      <motion.div
        className="level-number"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.5, 1] }}
        transition={{ type: "spring", delay: 0.3 }}
      >
        LEVEL {newLevel}
      </motion.div>
      
      {/* New features reveal */}
      <div className="new-features">
        {newFeatures.map((feature, i) => (
          <motion.div
            key={feature.name}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.2 }}
          >
            <span className="feature-icon">{feature.icon}</span>
            <span className="feature-name">{feature.name}</span>
          </motion.div>
        ))}
      </div>
      
      {/* Fanfare audio */}
      <Audio src="/audio/level-up-fanfare.mp3" autoPlay />
    </motion.div>
  );
}
```

---

# 6. AUDIO DESIGN SUMMARY

| Moment | Sounds |
|--------|--------|
| Dice pickup | Wood scrape |
| Dice shake | Rattling (looped, pitch varies) |
| Dice throw | Whoosh |
| Dice bounce | Multiple variants, decreasing volume |
| Dice settle | Final tap |
| Nat 20 | Triumphant fanfare, choir hit |
| Nat 1 | Low brass doom, crowd gasp |
| Initiative call | "Roll for initiative!" + drum hit |
| Combat start | Music shift to battle theme |
| Concentration check | Tension sting |
| Concentration break | Glass shatter + magic dissipate |
| Death save start | Heartbeat begins, audio muffles |
| Death save success | Single relieved heartbeat |
| Death save fail | Heartbeat skip |
| Stabilize | Heartbeat normalizes |
| Death | Flatline + mournful strings |
| Level up | Triumphant fanfare, ascending tones |

---

**END OF DOCUMENT 42**
