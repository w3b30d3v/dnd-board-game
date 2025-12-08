# Document 41: Authentic D&D Visual Elements

## Purpose
This document specifies the **iconic visual elements** that dedicated D&D players expect. These aren't just "nice to have" - they're what makes players feel like they're playing D&D, not a generic fantasy game.

---

# PART 1: THE SACRED ELEMENTS

## 1.1 The Read-Aloud Box

This is the **most iconic D&D visual** - the boxed text DMs read to players. It MUST look like the official books.

```css
/* The sacred read-aloud box */
.read-aloud-box {
  position: relative;
  background: 
    /* Parchment texture effect */
    linear-gradient(
      135deg,
      rgba(251, 240, 217, 0.03) 0%,
      rgba(241, 220, 180, 0.05) 50%,
      rgba(251, 240, 217, 0.03) 100%
    ),
    /* Base dark parchment */
    #1a1714;
  
  /* The distinctive border */
  border-left: 4px solid #7C3626;
  border-top: 1px solid rgba(124, 54, 38, 0.3);
  border-bottom: 1px solid rgba(124, 54, 38, 0.3);
  border-right: 1px solid rgba(124, 54, 38, 0.3);
  
  padding: 1.5rem 1.5rem 1.5rem 2rem;
  margin: 1.5rem 0;
  
  /* Subtle inner shadow for depth */
  box-shadow:
    inset 3px 0 10px rgba(0, 0, 0, 0.3),
    inset 0 2px 10px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.2);
  
  /* The text styling */
  font-family: 'Crimson Text', 'Georgia', serif;
  font-style: italic;
  font-size: 1.1rem;
  line-height: 1.7;
  color: #E8DCC4;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Opening quote decoration */
.read-aloud-box::before {
  content: '"';
  position: absolute;
  top: 0.5rem;
  left: 0.75rem;
  font-family: 'Cinzel Decorative', serif;
  font-size: 3rem;
  color: rgba(124, 54, 38, 0.4);
  line-height: 1;
}

/* DM reading indicator */
.read-aloud-box.is-being-read {
  animation: reading-pulse 2s ease-in-out infinite;
}

@keyframes reading-pulse {
  0%, 100% { border-left-color: #7C3626; }
  50% { border-left-color: #B8472A; box-shadow: inset 3px 0 15px rgba(184, 71, 42, 0.3); }
}
```

```tsx
// ReadAloudBox component
function ReadAloudBox({ 
  text, 
  isBeingRead = false,
  onComplete 
}: { 
  text: string; 
  isBeingRead?: boolean;
  onComplete?: () => void;
}) {
  return (
    <motion.div 
      className={`read-aloud-box ${isBeingRead ? 'is-being-read' : ''}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {isBeingRead ? (
        <TypewriterText text={text} speed={50} onComplete={onComplete} />
      ) : (
        text
      )}
    </motion.div>
  );
}
```

---

## 1.2 Monster Stat Block

Must look EXACTLY like the Monster Manual. This is non-negotiable for D&D players.

```css
.stat-block {
  /* The parchment/tan background */
  background: 
    linear-gradient(180deg, #FDF1DC 0%, #EDE5C8 100%);
  
  color: #1A1A1A;
  font-family: 'Libre Baskerville', 'Georgia', serif;
  font-size: 0.9rem;
  
  /* The distinctive red top/bottom borders */
  border-top: 3px solid #7A200D;
  border-bottom: 3px solid #7A200D;
  
  /* Orange accent bars */
  background-image: 
    linear-gradient(to bottom, #F0D6B4 0%, #F0D6B4 2px, transparent 2px),
    linear-gradient(to top, #F0D6B4 0%, #F0D6B4 2px, transparent 2px);
  
  padding: 1rem;
  max-width: 400px;
  
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.stat-block-name {
  font-family: 'Libre Baskerville', serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #7A200D;
  margin: 0;
  letter-spacing: 0.02em;
}

.stat-block-type {
  font-style: italic;
  font-size: 0.85rem;
  color: #1A1A1A;
  margin-bottom: 0.5rem;
}

/* The red divider lines */
.stat-block-divider {
  height: 2px;
  background: linear-gradient(90deg, transparent, #7A200D, transparent);
  margin: 0.5rem 0;
}

/* Orange section divider (tapered) */
.stat-block-orange-bar {
  height: 5px;
  background: 
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 5'%3E%3Cpath d='M0 2 L10 0 L390 0 L400 2 L390 5 L10 5 Z' fill='%23B8472A'/%3E%3C/svg%3E") no-repeat center;
  background-size: 100% 100%;
  margin: 0.75rem 0;
}

/* Ability scores row */
.stat-block-abilities {
  display: flex;
  justify-content: space-around;
  text-align: center;
  padding: 0.5rem 0;
  border-top: 1px solid rgba(122, 32, 13, 0.3);
  border-bottom: 1px solid rgba(122, 32, 13, 0.3);
}

.ability-score {
  font-size: 0.8rem;
}

.ability-name {
  font-weight: 700;
  color: #7A200D;
}

.ability-value {
  font-family: 'Libre Baskerville', serif;
}

/* Property names in red */
.stat-property-name {
  font-weight: 700;
  color: #7A200D;
}

/* Action names */
.stat-action-name {
  font-style: italic;
  font-weight: 700;
}

/* Attack notation styling */
.stat-attack {
  font-style: italic;
}

.stat-damage {
  color: #1A1A1A;
}
```

```tsx
// MonsterStatBlock component - MUST match official format
function MonsterStatBlock({ monster }: { monster: Monster }) {
  return (
    <div className="stat-block">
      <h2 className="stat-block-name">{monster.name}</h2>
      <p className="stat-block-type">
        {monster.size} {monster.type}, {monster.alignment}
      </p>
      
      <div className="stat-block-orange-bar" />
      
      <p><span className="stat-property-name">Armor Class</span> {monster.ac}</p>
      <p><span className="stat-property-name">Hit Points</span> {monster.hp} ({monster.hitDice})</p>
      <p><span className="stat-property-name">Speed</span> {monster.speed}</p>
      
      <div className="stat-block-orange-bar" />
      
      <div className="stat-block-abilities">
        {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(ability => (
          <div className="ability-score" key={ability}>
            <div className="ability-name">{ability}</div>
            <div className="ability-value">
              {monster[ability.toLowerCase()]} ({formatModifier(monster[ability.toLowerCase()])})
            </div>
          </div>
        ))}
      </div>
      
      <div className="stat-block-orange-bar" />
      
      {/* Skills, Senses, Languages, CR */}
      
      <div className="stat-block-divider" />
      
      {/* Traits */}
      {monster.traits?.map(trait => (
        <p key={trait.name}>
          <span className="stat-action-name">{trait.name}.</span> {trait.description}
        </p>
      ))}
      
      <h3 className="stat-block-section">Actions</h3>
      <div className="stat-block-orange-bar" />
      
      {monster.actions?.map(action => (
        <p key={action.name}>
          <span className="stat-action-name">{action.name}.</span> {action.description}
        </p>
      ))}
    </div>
  );
}
```

---

## 1.3 Spell Cards

Players use physical spell cards - ours should feel the same.

```css
.spell-card {
  width: 250px;
  min-height: 350px;
  position: relative;
  
  /* School-colored border */
  background: linear-gradient(180deg, var(--school-color) 0%, var(--school-color-dark) 100%);
  border-radius: 12px;
  padding: 3px;
  
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.4),
    0 8px 40px rgba(0, 0, 0, 0.2);
  
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
}

.spell-card:hover {
  transform: translateY(-8px) rotateX(5deg);
}

.spell-card-inner {
  background: 
    linear-gradient(180deg, #1E1B26 0%, #12101A 100%);
  border-radius: 10px;
  height: 100%;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.spell-card-header {
  text-align: center;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.spell-card-name {
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--school-color-light);
  margin-bottom: 0.25rem;
  text-shadow: 0 0 10px var(--school-color);
}

.spell-card-level {
  font-size: 0.75rem;
  color: #A1A1AA;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.spell-card-school-icon {
  width: 48px;
  height: 48px;
  margin: 1rem auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  background: radial-gradient(circle, var(--school-color) 0%, transparent 70%);
  border-radius: 50%;
  animation: school-pulse 3s ease-in-out infinite;
}

@keyframes school-pulse {
  0%, 100% { box-shadow: 0 0 20px var(--school-color); }
  50% { box-shadow: 0 0 40px var(--school-color); }
}

.spell-card-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  padding: 0.75rem 0;
  font-size: 0.8rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.spell-stat-label {
  color: #71717A;
  text-transform: uppercase;
  font-size: 0.65rem;
  letter-spacing: 0.05em;
}

.spell-stat-value {
  color: #F4F4F5;
}

.spell-card-description {
  flex: 1;
  padding: 0.75rem 0;
  font-size: 0.85rem;
  color: #A1A1AA;
  line-height: 1.5;
  overflow-y: auto;
}

.spell-card-components {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.component-badge {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.1);
  color: #F4F4F5;
}

.component-badge.active {
  background: var(--school-color);
  color: #0F0D13;
}

/* School colors */
.spell-card[data-school="evocation"] {
  --school-color: #EF4444;
  --school-color-dark: #991B1B;
  --school-color-light: #FCA5A5;
}

.spell-card[data-school="abjuration"] {
  --school-color: #3B82F6;
  --school-color-dark: #1E3A8A;
  --school-color-light: #93C5FD;
}

.spell-card[data-school="necromancy"] {
  --school-color: #22C55E;
  --school-color-dark: #14532D;
  --school-color-light: #86EFAC;
}

.spell-card[data-school="illusion"] {
  --school-color: #8B5CF6;
  --school-color-dark: #4C1D95;
  --school-color-light: #C4B5FD;
}

.spell-card[data-school="conjuration"] {
  --school-color: #F59E0B;
  --school-color-dark: #78350F;
  --school-color-light: #FCD34D;
}

.spell-card[data-school="transmutation"] {
  --school-color: #EC4899;
  --school-color-dark: #831843;
  --school-color-light: #F9A8D4;
}

.spell-card[data-school="divination"] {
  --school-color: #06B6D4;
  --school-color-dark: #164E63;
  --school-color-light: #67E8F9;
}

.spell-card[data-school="enchantment"] {
  --school-color: #F472B6;
  --school-color-dark: #9D174D;
  --school-color-light: #FBCFE8;
}
```

---

## 1.4 Character Sheet (Parchment Style)

The character sheet is SACRED. It must feel like the real paper sheet.

```css
.character-sheet {
  /* Actual parchment color and texture */
  background: 
    /* Paper grain texture */
    url('/textures/parchment-grain.png'),
    /* Subtle aging/staining */
    radial-gradient(ellipse at 30% 20%, rgba(160, 120, 60, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(120, 90, 40, 0.08) 0%, transparent 50%),
    /* Base parchment color */
    linear-gradient(180deg, #F4E4C1 0%, #E8D5A3 50%, #DEC992 100%);
  
  color: #2A1A0A;
  font-family: 'Bookinsanity', 'Crimson Text', serif;
  
  /* Worn edges effect */
  border-radius: 2px;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.1),
    0 4px 20px rgba(0, 0, 0, 0.3),
    inset 0 0 60px rgba(0, 0, 0, 0.05);
  
  position: relative;
  overflow: hidden;
}

/* Ink color for text */
.sheet-ink {
  color: #1A0A00;
}

/* Handwritten-style numbers */
.sheet-value {
  font-family: 'Homemade Apple', cursive;
  font-size: 1.5rem;
  color: #0A0500;
}

/* Section headers like the real sheet */
.sheet-section-header {
  background: #1A1A1A;
  color: #F4E4C1;
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  padding: 0.25rem 0.5rem;
  text-align: center;
}

/* Ability score boxes */
.ability-score-box {
  width: 70px;
  text-align: center;
  border: 2px solid #1A1A1A;
  border-radius: 8px 8px 20px 20px;
  background: rgba(255, 255, 255, 0.3);
  padding: 0.5rem;
}

.ability-score-name {
  font-family: 'Cinzel', serif;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: #1A1A1A;
  color: #F4E4C1;
  margin: -0.5rem -0.5rem 0.5rem -0.5rem;
  padding: 0.25rem;
  border-radius: 6px 6px 0 0;
}

.ability-score-value {
  font-family: 'Homemade Apple', cursive;
  font-size: 2rem;
  line-height: 1;
}

.ability-score-modifier {
  width: 36px;
  height: 36px;
  margin: 0.5rem auto 0;
  border: 2px solid #1A1A1A;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Homemade Apple', cursive;
  font-size: 1.25rem;
  background: rgba(255, 255, 255, 0.5);
}

/* Death saves section - THE MOST IMPORTANT */
.death-saves {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(122, 32, 13, 0.1);
  border: 1px solid rgba(122, 32, 13, 0.3);
}

.death-save-circles {
  display: flex;
  gap: 0.25rem;
}

.death-save-circle {
  width: 20px;
  height: 20px;
  border: 2px solid #1A1A1A;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.death-save-circle.success.filled {
  background: #22C55E;
  border-color: #22C55E;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
}

.death-save-circle.failure.filled {
  background: #EF4444;
  border-color: #EF4444;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
}
```

---

## 1.5 The D20 - Physical Weight

The d20 is the HEART of D&D. It needs to feel like a real die.

```css
.d20-container {
  perspective: 1000px;
  width: 120px;
  height: 120px;
}

.d20 {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.1s ease-out;
  cursor: grab;
}

.d20:active {
  cursor: grabbing;
}

.d20-face {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* Metallic/plastic die appearance */
  background: linear-gradient(
    135deg,
    #2A2735 0%,
    #1E1B26 40%,
    #12101A 100%
  );
  
  font-family: 'Cinzel', serif;
  font-size: 2.5rem;
  font-weight: 700;
  color: #F59E0B;
  
  border: 2px solid rgba(245, 158, 11, 0.3);
  
  /* Die edge highlight */
  box-shadow:
    inset 2px 2px 8px rgba(255, 255, 255, 0.1),
    inset -2px -2px 8px rgba(0, 0, 0, 0.3);
  
  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
}

/* Rolling animation */
.d20.rolling {
  animation: dice-tumble 0.8s ease-out;
}

@keyframes dice-tumble {
  0% { transform: rotateX(0) rotateY(0) rotateZ(0); }
  20% { transform: rotateX(180deg) rotateY(90deg) rotateZ(45deg); }
  40% { transform: rotateX(360deg) rotateY(180deg) rotateZ(90deg); }
  60% { transform: rotateX(540deg) rotateY(270deg) rotateZ(135deg); }
  80% { transform: rotateX(680deg) rotateY(340deg) rotateZ(160deg); }
  100% { transform: rotateX(720deg) rotateY(360deg) rotateZ(180deg); }
}

/* Natural 20 celebration */
.d20.nat20 .d20-face {
  background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #F59E0B 100%);
  color: #0F0D13;
  animation: nat20-pulse 0.5s ease-in-out infinite;
}

@keyframes nat20-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.8), inset 2px 2px 8px rgba(255,255,255,0.3); }
  50% { box-shadow: 0 0 40px rgba(245, 158, 11, 1), 0 0 60px rgba(245, 158, 11, 0.5), inset 2px 2px 8px rgba(255,255,255,0.3); }
}

/* Natural 1 despair */
.d20.nat1 .d20-face {
  background: linear-gradient(135deg, #7F1D1D 0%, #EF4444 50%, #7F1D1D 100%);
  color: #FCA5A5;
  animation: nat1-shake 0.3s ease-in-out;
}

@keyframes nat1-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px) rotate(-2deg); }
  75% { transform: translateX(5px) rotate(2deg); }
}
```

---

## 1.6 Initiative Tracker - The Tension

Initiative order is where combat LIVES. It needs tension.

```css
.initiative-tracker {
  background: 
    linear-gradient(180deg, rgba(18, 16, 26, 0.95) 0%, rgba(12, 10, 18, 0.98) 100%);
  border: 1px solid rgba(180, 83, 9, 0.3);
  border-radius: 12px;
  overflow: hidden;
}

.initiative-header {
  background: linear-gradient(90deg, #7A200D 0%, #B8472A 50%, #7A200D 100%);
  color: #F4E4C1;
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  padding: 0.75rem 1rem;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.initiative-list {
  padding: 0.5rem;
}

.initiative-entry {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  background: rgba(26, 23, 34, 0.5);
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

/* Active turn - THE SPOTLIGHT */
.initiative-entry.active {
  background: 
    radial-gradient(ellipse at left, rgba(245, 158, 11, 0.15) 0%, transparent 70%),
    rgba(30, 27, 38, 0.9);
  border-color: rgba(245, 158, 11, 0.5);
  box-shadow:
    0 0 20px rgba(245, 158, 11, 0.2),
    inset 0 0 20px rgba(245, 158, 11, 0.05);
  transform: scale(1.02);
}

/* Pulse animation for active turn */
.initiative-entry.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #F59E0B;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.8);
  animation: turn-pulse 1.5s ease-in-out infinite;
}

@keyframes turn-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* "On Deck" - next up */
.initiative-entry.on-deck {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.05);
}

.initiative-roll {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  font-family: 'Cinzel', serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #FBBF24;
}

.initiative-name {
  flex: 1;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  color: #F4F4F5;
}

.initiative-hp {
  font-size: 0.85rem;
  color: #22C55E;
}

.initiative-hp.bloodied {
  color: #EAB308;
}

.initiative-hp.critical {
  color: #EF4444;
  animation: hp-critical-pulse 1s ease-in-out infinite;
}

@keyframes hp-critical-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Enemy entries */
.initiative-entry.enemy {
  border-left: 3px solid #EF4444;
}

/* Ally entries */
.initiative-entry.ally {
  border-left: 3px solid #22C55E;
}

/* Round counter */
.round-counter {
  text-align: center;
  padding: 1rem;
  border-top: 1px solid rgba(180, 83, 9, 0.2);
  font-family: 'Cinzel', serif;
  color: #A1A1AA;
}

.round-number {
  font-size: 2rem;
  font-weight: 700;
  color: #F59E0B;
  text-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
}
```

---

## 1.7 Death Saves - Maximum Drama

This is the MOST DRAMATIC moment in D&D. Treatment must match.

```tsx
// DeathSaveModal - Full screen dramatic moment
function DeathSaveModal({ 
  character, 
  onRoll, 
  successes, 
  failures 
}: DeathSaveProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  
  return (
    <motion.div 
      className="death-save-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Darkened, desaturated background */}
      <div className="death-backdrop" />
      
      {/* Ominous vignette */}
      <div className="death-vignette" />
      
      {/* Blood drip effects at top */}
      <div className="blood-drips" />
      
      {/* Central content */}
      <motion.div 
        className="death-content"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 15 }}
      >
        {/* Character portrait - faded, desaturated */}
        <div className="death-portrait">
          <img src={character.portrait} alt={character.name} />
          <div className="portrait-overlay" />
        </div>
        
        {/* The dreaded text */}
        <h2 className="death-title">
          <span className="death-name">{character.name}</span>
          <span className="death-subtitle">is making a Death Saving Throw</span>
        </h2>
        
        {/* Success/Failure circles - large and dramatic */}
        <div className="death-save-tracker">
          <div className="tracker-section successes">
            <span className="tracker-label">Successes</span>
            <div className="tracker-circles">
              {[0, 1, 2].map(i => (
                <div 
                  key={i}
                  className={`death-circle success ${i < successes ? 'filled' : ''}`}
                />
              ))}
            </div>
          </div>
          
          <div className="death-dice-area">
            <D20 
              rolling={isRolling}
              result={result}
              onRollComplete={(value) => {
                setResult(value);
                setIsRolling(false);
                onRoll(value);
              }}
            />
          </div>
          
          <div className="tracker-section failures">
            <span className="tracker-label">Failures</span>
            <div className="tracker-circles">
              {[0, 1, 2].map(i => (
                <div 
                  key={i}
                  className={`death-circle failure ${i < failures ? 'filled' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Roll button */}
        {!isRolling && result === null && (
          <motion.button
            className="death-roll-button"
            onClick={() => setIsRolling(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Roll Death Save
          </motion.button>
        )}
        
        {/* Result display */}
        {result !== null && (
          <motion.div 
            className={`death-result ${result >= 10 ? 'success' : 'failure'} ${result === 20 ? 'nat20' : ''} ${result === 1 ? 'nat1' : ''}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {result === 20 && "MIRACULOUS RECOVERY!"}
            {result === 1 && "TWO FAILURES..."}
            {result > 1 && result < 10 && "Failed..."}
            {result >= 10 && result < 20 && "Success!"}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
```

```css
.death-save-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.death-backdrop {
  position: absolute;
  inset: 0;
  background: #0a0608;
  animation: death-fade-in 1s ease;
}

@keyframes death-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.death-vignette {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 200px 100px rgba(127, 29, 29, 0.3);
  pointer-events: none;
}

.blood-drips {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: 
    linear-gradient(180deg, rgba(127, 29, 29, 0.4) 0%, transparent 100%);
  mask-image: url('/textures/blood-drip-mask.png');
  mask-size: cover;
}

.death-content {
  position: relative;
  text-align: center;
  padding: 3rem;
}

.death-portrait {
  width: 150px;
  height: 150px;
  margin: 0 auto 2rem;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  border: 3px solid rgba(127, 29, 29, 0.5);
  box-shadow: 0 0 30px rgba(127, 29, 29, 0.3);
}

.death-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(50%) brightness(0.7);
}

.portrait-overlay {
  position: absolute;
  inset: 0;
  background: rgba(127, 29, 29, 0.2);
}

.death-title {
  font-family: 'Cinzel', serif;
  margin-bottom: 3rem;
}

.death-name {
  display: block;
  font-size: 2.5rem;
  color: #F4F4F5;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
}

.death-subtitle {
  display: block;
  font-size: 1rem;
  color: #EF4444;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-top: 0.5rem;
}

.death-save-tracker {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  margin-bottom: 3rem;
}

.tracker-section {
  text-align: center;
}

.tracker-label {
  display: block;
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  color: #71717A;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 1rem;
}

.tracker-circles {
  display: flex;
  gap: 0.75rem;
}

.death-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid;
  transition: all 0.3s ease;
}

.death-circle.success {
  border-color: #22C55E;
}

.death-circle.success.filled {
  background: #22C55E;
  box-shadow: 0 0 15px rgba(34, 197, 94, 0.6);
}

.death-circle.failure {
  border-color: #EF4444;
}

.death-circle.failure.filled {
  background: #EF4444;
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.6);
  animation: failure-pulse 1s ease-in-out infinite;
}

@keyframes failure-pulse {
  0%, 100% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.6); }
  50% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.9); }
}

.death-roll-button {
  font-family: 'Cinzel', serif;
  font-size: 1.25rem;
  padding: 1rem 3rem;
  background: linear-gradient(180deg, #7F1D1D 0%, #991B1B 50%, #7F1D1D 100%);
  color: #FCA5A5;
  border: 2px solid #EF4444;
  border-radius: 8px;
  cursor: pointer;
  box-shadow:
    0 0 20px rgba(239, 68, 68, 0.3),
    0 4px 16px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
}

.death-roll-button:hover {
  background: linear-gradient(180deg, #991B1B 0%, #B91C1C 50%, #991B1B 100%);
  box-shadow:
    0 0 30px rgba(239, 68, 68, 0.5),
    0 6px 20px rgba(0, 0, 0, 0.5);
}

.death-result {
  font-family: 'Cinzel Decorative', serif;
  font-size: 2rem;
  margin-top: 2rem;
}

.death-result.success {
  color: #22C55E;
  text-shadow: 0 0 20px rgba(34, 197, 94, 0.6);
}

.death-result.failure {
  color: #EF4444;
  text-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
}

.death-result.nat20 {
  color: #F59E0B;
  text-shadow: 0 0 30px rgba(245, 158, 11, 0.8);
  animation: nat20-text 0.5s ease-in-out infinite;
}

@keyframes nat20-text {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.death-result.nat1 {
  color: #7F1D1D;
  text-shadow: 0 0 20px rgba(127, 29, 29, 0.8);
}
```

---

## 1.8 The Table Feel - Player Arrangement

Players should feel like they're sitting around a table.

```css
.table-view {
  position: relative;
  background: 
    /* Wood grain table texture */
    url('/textures/dark-wood-table.jpg'),
    radial-gradient(ellipse at center, #2A1F14 0%, #1A1208 100%);
  background-blend-mode: overlay;
  border-radius: 50%;
  aspect-ratio: 1;
  max-width: 800px;
  margin: 0 auto;
  
  box-shadow:
    inset 0 0 100px rgba(0, 0, 0, 0.5),
    0 10px 50px rgba(0, 0, 0, 0.5);
}

/* Player positions around the table */
.player-seat {
  position: absolute;
  transform: translate(-50%, -50%);
}

.player-seat:nth-child(1) { top: 5%; left: 50%; }   /* Top */
.player-seat:nth-child(2) { top: 25%; left: 90%; }  /* Top right */
.player-seat:nth-child(3) { top: 75%; left: 90%; }  /* Bottom right */
.player-seat:nth-child(4) { top: 95%; left: 50%; }  /* Bottom */
.player-seat:nth-child(5) { top: 75%; left: 10%; }  /* Bottom left */
.player-seat:nth-child(6) { top: 25%; left: 10%; }  /* Top left */

/* DM position - special */
.dm-seat {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.dm-screen {
  width: 200px;
  height: 120px;
  background: 
    linear-gradient(180deg, #2A1F14 0%, #1A1208 100%);
  border: 3px solid #78350F;
  border-radius: 8px 8px 0 0;
  position: relative;
  
  /* DM screen art */
  &::before {
    content: 'DM';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-family: 'Cinzel Decorative', serif;
    font-size: 2rem;
    color: rgba(245, 158, 11, 0.3);
  }
}

/* Player portrait at table */
.table-player-portrait {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(245, 158, 11, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
  cursor: pointer;
}

.table-player-portrait.speaking {
  border-color: #22C55E;
  box-shadow: 
    0 0 20px rgba(34, 197, 94, 0.5),
    0 4px 20px rgba(0, 0, 0, 0.5);
  animation: speaking-pulse 1s ease-in-out infinite;
}

@keyframes speaking-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.table-player-portrait.active-turn {
  border-color: #F59E0B;
  box-shadow:
    0 0 30px rgba(245, 158, 11, 0.6),
    0 4px 20px rgba(0, 0, 0, 0.5);
}

/* Player name tag */
.table-player-name {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  color: #F4F4F5;
  white-space: nowrap;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}
```

---

# PART 2: AUDIO THAT SELLS THE FANTASY

## 2.1 Critical Sound Effects

```typescript
const ESSENTIAL_SOUNDS = {
  // Dice
  dice_pickup: 'Wooden dice lifted from table',
  dice_shake: 'Dice rattling in cupped hands',
  dice_roll: 'Dice tumbling across wood',
  dice_land: 'Single die settling',
  dice_nat20: 'Triumphant orchestral sting + crowd cheer',
  dice_nat1: 'Dramatic low brass + gasp',
  
  // Combat
  initiative_call: '"Roll for initiative!" DM voice + dramatic music shift',
  turn_start: 'Subtle whoosh + chime',
  attack_swing: 'Weapon-appropriate swoosh',
  attack_hit: 'Impact + pain grunt',
  attack_miss: 'Whoosh past',
  critical_hit: 'Devastating impact + glass shatter + flash',
  
  // Death saves
  death_save_start: 'Heartbeat begins, music drops, muffled audio',
  death_save_success: 'Single heartbeat, relief tone',
  death_save_fail: 'Heartbeat skip, dread tone',
  death_save_stabilize: 'Heartbeat normalizes, relief music swell',
  death_save_death: 'Flatline, mournful strings',
  death_save_nat20: 'Heartbeat surge, triumphant fanfare',
  
  // Spells
  spell_prepare: 'Magical charging based on school',
  spell_cast: 'School-appropriate release',
  concentration_check: 'Tense sustained tone',
  concentration_break: 'Glass shatter, magic dissipate',
  
  // Ambience per location
  tavern: 'Crowd murmur, fire crackle, occasional laugh, mug clink',
  dungeon: 'Dripping water, distant echoes, rat scurry, wind moan',
  forest: 'Birds, leaves rustle, stream, occasional animal call',
  combat: 'Tense drums, rapid strings, urgent brass',
  boss: 'Epic orchestral, choir, deep percussion',
};
```

---

# PART 3: THE SMALL DETAILS THAT MATTER

## 3.1 Damage Type Indicators

D&D players CARE about damage types. Make them visually distinct.

```css
/* Damage type colors and effects */
.damage-fire { 
  color: #F97316; 
  text-shadow: 0 0 10px rgba(249, 115, 22, 0.5);
  animation: fire-flicker 0.2s infinite;
}

.damage-cold { 
  color: #06B6D4; 
  text-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
}

.damage-lightning { 
  color: #FACC15; 
  text-shadow: 0 0 15px rgba(250, 204, 21, 0.7);
  animation: lightning-flicker 0.1s infinite;
}

.damage-necrotic { 
  color: #A855F7; 
  text-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
}

.damage-radiant { 
  color: #FEF08A; 
  text-shadow: 0 0 15px rgba(254, 240, 138, 0.7);
}

.damage-psychic { 
  color: #EC4899; 
  text-shadow: 0 0 10px rgba(236, 72, 153, 0.5);
}

/* Damage number popup */
.damage-popup {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 2rem;
  animation: damage-float 1s ease-out forwards;
}

@keyframes damage-float {
  0% { 
    opacity: 1; 
    transform: translateY(0) scale(1.5); 
  }
  100% { 
    opacity: 0; 
    transform: translateY(-50px) scale(1); 
  }
}

/* Healing is different */
.healing-popup {
  color: #22C55E;
  text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
}

.healing-popup::before {
  content: '+';
}
```

## 3.2 Condition Icons

Players need to instantly recognize conditions.

```typescript
const CONDITION_VISUALS = {
  blinded: { icon: '👁️‍🗨️', color: '#71717A', effect: 'grayscale(100%)' },
  charmed: { icon: '💕', color: '#EC4899', effect: 'hue-rotate(320deg)' },
  deafened: { icon: '🔇', color: '#71717A', effect: 'none' },
  frightened: { icon: '😨', color: '#FACC15', effect: 'saturate(150%)' },
  grappled: { icon: '🤝', color: '#F97316', effect: 'none' },
  incapacitated: { icon: '💫', color: '#A1A1AA', effect: 'brightness(70%)' },
  invisible: { icon: '👻', color: '#A5B4FC', effect: 'opacity(50%)' },
  paralyzed: { icon: '⚡', color: '#FACC15', effect: 'saturate(0) brightness(120%)' },
  petrified: { icon: '🗿', color: '#78716C', effect: 'grayscale(100%) contrast(120%)' },
  poisoned: { icon: '☠️', color: '#22C55E', effect: 'hue-rotate(80deg) saturate(150%)' },
  prone: { icon: '⬇️', color: '#F97316', effect: 'none' },
  restrained: { icon: '⛓️', color: '#78716C', effect: 'none' },
  stunned: { icon: '💫', color: '#FACC15', effect: 'blur(1px)' },
  unconscious: { icon: '💤', color: '#71717A', effect: 'grayscale(80%) brightness(60%)' },
  exhaustion: { icon: '😓', color: '#EF4444', levels: true },
  concentration: { icon: '🔮', color: '#8B5CF6', effect: 'none' },
};
```

---

**END OF DOCUMENT 41**
