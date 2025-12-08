# D&D Digital Board Game Platform
# Document 12: Test Specifications

---

# 1. Overview

This document defines the complete testing strategy for RAW 5e compliance and system correctness.

---

# 2. Golden Scene Test Cases

All golden tests use seeded RNG for deterministic, reproducible results.

## 2.1 Attack Tests

| Test ID | Description | Seed | Expected |
|---------|-------------|------|----------|
| ATK-001 | Basic melee hit | 12345 | Roll 15 + 5 mod = 20 >= AC 15, HIT |
| ATK-002 | Basic melee miss | 54321 | Roll 5 + 5 mod = 10 < AC 15, MISS |
| ATK-003 | Natural 20 crit | 20200 | Roll 20, auto-hit, double dice |
| ATK-004 | Natural 1 fumble | 10100 | Roll 1, auto-miss regardless of mod |
| ATK-005 | Advantage (use higher) | 11111 | Rolls 8,17, use 17 |
| ATK-006 | Disadvantage (use lower) | 22222 | Rolls 14,6, use 6 |
| ATK-007 | Adv + Disadv cancel | 33333 | Normal single roll |

## 2.2 Damage Tests

| Test ID | Description | Input | Expected |
|---------|-------------|-------|----------|
| DMG-001 | Fire vs Resistant | 24 fire damage | 12 taken (half) |
| DMG-002 | Fire vs Vulnerable | 15 fire damage | 30 taken (double) |
| DMG-003 | Fire vs Immune | 20 fire damage | 0 taken |
| DMG-004 | Resist + Vuln same type | 20 cold to frost giant | 20 taken (cancel) |
| DMG-005 | Multiple damage types | 10 slashing + 10 fire vs fire resist | 15 taken |

## 2.3 Saving Throw Tests

| Test ID | Description | DC | Roll | Mod | Expected |
|---------|-------------|-----|------|-----|----------|
| SAVE-001 | Pass DEX save | 15 | 14 | +3 | 17 >= 15, SUCCESS |
| SAVE-002 | Fail DEX save | 15 | 8 | +1 | 9 < 15, FAIL |
| SAVE-003 | Paralyzed auto-fail DEX | 10 | N/A | +5 | AUTO-FAIL |
| SAVE-004 | Magic Resistance adv | 14 | 6,15 | +2 | Use 17, SUCCESS |

## 2.4 Condition Tests

| Test ID | Condition | Effect Tested | Expected |
|---------|-----------|---------------|----------|
| COND-001 | Blinded | Attack roll | Disadvantage on attacks made |
| COND-002 | Blinded | Being attacked | Advantage for attackers |
| COND-003 | Paralyzed | Being attacked within 5ft | Auto-critical |
| COND-004 | Paralyzed | DEX save | Auto-fail |
| COND-005 | Prone | Melee attack against | Advantage |
| COND-006 | Prone | Ranged attack against | Disadvantage |
| COND-007 | Restrained | Attack roll | Disadvantage |
| COND-008 | Invisible | Attack roll | Advantage |
| COND-009 | Stunned | Being attacked | Advantage for attackers |
| COND-010 | Unconscious | Being attacked within 5ft | Auto-critical |

## 2.5 AoE Tests

| Test ID | Shape | Size | Origin | Expected Tiles |
|---------|-------|------|--------|----------------|
| AOE-001 | Sphere | 20ft | (10,10) | 4-tile radius, 49 tiles |
| AOE-002 | Cube | 15ft | (5,5) | 3x3 = 9 tiles |
| AOE-003 | Cone | 30ft | (0,0) North | Triangle, ~15 tiles |
| AOE-004 | Line | 60ft x 5ft | (0,5) East | 12x1 = 12 tiles |
| AOE-005 | Cylinder | 10ft r, 40ft h | (10,10) | 2-tile radius, 13 tiles |

## 2.6 Cover Tests

| Test ID | Scenario | Expected Cover |
|---------|----------|----------------|
| COV-001 | Clear line to target | None (+0 AC) |
| COV-002 | Low wall between | Half (+2 AC) |
| COV-003 | Creature between | Half (+2 AC) |
| COV-004 | Arrow slit | Three-quarters (+5 AC) |
| COV-005 | Full wall | Total (untargetable) |

## 2.7 Spell Tests

| Test ID | Spell | Scenario | Expected |
|---------|-------|----------|----------|
| SPELL-001 | Magic Missile | 3 darts at 1 target | 3d4+3 force, auto-hit |
| SPELL-002 | Fireball L3 | 3 targets, 2 save | 8d6 full/half/full |
| SPELL-003 | Fireball L5 | Upcast | 10d6 damage |
| SPELL-004 | Hold Person | Target saves | No paralyzed |
| SPELL-005 | Hold Person | Target fails | Paralyzed, save each turn |
| SPELL-006 | Cure Wounds L1 | Heal ally | 1d8 + spellmod HP |
| SPELL-007 | Concentration check | 20 damage taken | DC 10 CON save |
| SPELL-008 | Shield (reaction) | Attack would hit | +5 AC, attack misses |

---

# 3. Test Fixtures

## 3.1 Standard Test Characters

```json
{
  "fixture_fighter_5": {
    "class": "fighter",
    "level": 5,
    "abilityScores": { "STR": 18, "DEX": 14, "CON": 16, "INT": 10, "WIS": 12, "CHA": 8 },
    "proficiencyBonus": 3,
    "armorClass": 18,
    "hitPoints": { "max": 49, "current": 49 },
    "weapon": { "name": "Longsword", "damage": "1d8", "type": "SLASHING" },
    "features": ["extra_attack", "action_surge", "second_wind"]
  },
  "fixture_wizard_5": {
    "class": "wizard",
    "level": 5,
    "abilityScores": { "STR": 8, "DEX": 14, "CON": 14, "INT": 18, "WIS": 12, "CHA": 10 },
    "proficiencyBonus": 3,
    "armorClass": 12,
    "hitPoints": { "max": 32, "current": 32 },
    "spellSaveDC": 15,
    "spellAttackBonus": 7,
    "slots": { "1": 4, "2": 3, "3": 2 },
    "spellsKnown": ["fireball", "magic_missile", "shield", "counterspell"]
  },
  "fixture_goblin": {
    "type": "monster",
    "name": "Goblin",
    "armorClass": 15,
    "hitPoints": { "max": 7, "current": 7 },
    "abilityScores": { "STR": 8, "DEX": 14, "CON": 10, "INT": 10, "WIS": 8, "CHA": 8 }
  }
}
```

## 3.2 Standard Test Maps

```
Map: cover_test_10x10
. . . . W . . . . .
. . . . W . . . . .
. . . . D . . . . .
. . . . W . . . . .
. . P . W . . . . .
. . . . . . . . . .
. . . . . . . . . .
. . . . . . . P . .
. . . . . . . . . .
. . . . . . . . . .

Legend: W=Wall, D=Door(open), P=Pillar(half cover), .=Floor
```

---

# 4. Test Commands

```bash
# Run all tests
pnpm test

# Run golden scene tests only
pnpm test:golden

# Run specific test file
pnpm test tests/golden/combat/attack-rolls.test.ts

# Run with coverage
pnpm test:coverage

# Run benchmarks
pnpm test:bench
```

---

# 5. Performance Targets

| Operation | P50 | P99 | Max |
|-----------|-----|-----|-----|
| Attack resolution | 2ms | 10ms | 50ms |
| Spell cast (single target) | 5ms | 20ms | 100ms |
| Fireball (10 targets) | 20ms | 50ms | 200ms |
| Pathfinding (30 tiles) | 1ms | 5ms | 20ms |
| LoS calculation | 0.5ms | 2ms | 10ms |
| Full turn processing | 50ms | 150ms | 500ms |

---

# END OF TEST SPECIFICATIONS
