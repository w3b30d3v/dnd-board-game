/**
 * CombatManager
 * Integrates the D&D 5e rules engine with the game board
 * Handles combat resolution, dice rolling, and visual effects
 */

import type { TokenManager } from './TokenManager';
import type { Creature, GridPosition, Condition } from './types';

// Import rules engine types and functions
import {
  // Dice
  roll,
  rollD20,
  rollWithAdvantage,
  rollWithDisadvantage,
  rollDie,
  // Combat
  resolveAttack,
  resolveAttackWithConditions,
  calculateDamage,
  applyDamage,
  applyHealing,
  checkInstantDeath,
  rollInitiative,
  sortByInitiative,
  rollDeathSave,
  processDeathSave,
  // Abilities
  resolveAbilityCheck,
  resolveSavingThrow,
  calculatePassiveScore,
  getSkillAbility,
  // Spells
  calculateSpellSaveDC,
  calculateSpellAttackBonus,
  resolveConcentrationCheck,
  getAoETiles,
  getCantripDamageDice,
  // Conditions
  getConditionEffects,
  // Types
  type AttackInput,
  type AttackResult,
  type DamageType,
  type DamageResult,
  type AbilityType,
  type ConditionType,
  type InitiativeResult,
  type AoEShape,
} from '@dnd/rules-engine';

// Combat event types
export interface DiceRollEvent {
  type: 'dice_roll';
  formula: string;
  result: number;
  dice: number[];
  modifier: number;
  isNatural20?: boolean;
  isNatural1?: boolean;
}

export interface AttackEvent {
  type: 'attack';
  attackerId: string;
  targetId: string;
  result: AttackResult;
}

export interface DamageEvent {
  type: 'damage';
  targetId: string;
  amount: number;
  damageType: DamageType;
  isCritical: boolean;
  wasResisted: boolean;
  wasVulnerable: boolean;
  wasImmune: boolean;
}

export interface HealingEvent {
  type: 'healing';
  targetId: string;
  amount: number;
  newHP: number;
}

export interface DeathEvent {
  type: 'death';
  creatureId: string;
  wasInstantDeath: boolean;
}

export interface InitiativeEvent {
  type: 'initiative';
  results: Array<{ creatureId: string; roll: number; total: number }>;
  order: string[];
}

export interface ConcentrationEvent {
  type: 'concentration';
  creatureId: string;
  spellName: string;
  dc: number;
  roll: number;
  success: boolean;
}

export type CombatEvent =
  | DiceRollEvent
  | AttackEvent
  | DamageEvent
  | HealingEvent
  | DeathEvent
  | InitiativeEvent
  | ConcentrationEvent;

export type CombatEventHandler = (event: CombatEvent) => void;

/**
 * Combat statistics for a creature
 */
export interface CreatureCombatStats {
  // Ability scores (modifiers)
  strengthMod: number;
  dexterityMod: number;
  constitutionMod: number;
  intelligenceMod: number;
  wisdomMod: number;
  charismaMod: number;

  // Combat values
  proficiencyBonus: number;
  attackBonus: number;
  spellcastingAbility?: AbilityType;
  spellcastingMod?: number;

  // Defenses
  saveProficiencies: AbilityType[];
  resistances: DamageType[];
  vulnerabilities: DamageType[];
  immunities: DamageType[];
}

/**
 * CombatManager class
 */
export class CombatManager {
  private tokenManager: TokenManager | null = null;
  private creatures: Map<string, Creature> = new Map();
  private creatureStats: Map<string, CreatureCombatStats> = new Map();
  private eventHandlers: Set<CombatEventHandler> = new Set();

  // Combat state
  private initiativeOrder: string[] = [];
  private currentTurnIndex: number = 0;
  private round: number = 0;
  private isInCombat: boolean = false;

  // Death save tracking
  private deathSaves: Map<string, { successes: number; failures: number }> = new Map();

  constructor() {}

  /**
   * Connect to a TokenManager for visual effects
   */
  public setTokenManager(tokenManager: TokenManager): void {
    this.tokenManager = tokenManager;
  }

  /**
   * Register a creature for combat
   */
  public registerCreature(creature: Creature, stats: CreatureCombatStats): void {
    this.creatures.set(creature.id, creature);
    this.creatureStats.set(creature.id, stats);
  }

  /**
   * Unregister a creature
   */
  public unregisterCreature(creatureId: string): void {
    this.creatures.delete(creatureId);
    this.creatureStats.delete(creatureId);
    this.deathSaves.delete(creatureId);
  }

  /**
   * Update creature data
   */
  public updateCreature(creature: Creature): void {
    this.creatures.set(creature.id, creature);
  }

  /**
   * Subscribe to combat events
   */
  public onEvent(handler: CombatEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  /**
   * Emit a combat event
   */
  private emit(event: CombatEvent): void {
    for (const handler of this.eventHandlers) {
      handler(event);
    }
  }

  // ================== DICE ROLLING ==================

  /**
   * Roll dice with visual feedback
   */
  public rollDice(formula: string): { total: number; dice: number[] } {
    const result = roll(formula);
    this.emit({
      type: 'dice_roll',
      formula,
      result: result.total,
      dice: result.dice,
      modifier: result.modifier,
    });
    return { total: result.total, dice: result.dice };
  }

  /**
   * Roll a d20 with modifier
   */
  public rollD20(modifier: number = 0): { total: number; roll: number; isNat20: boolean; isNat1: boolean } {
    const result = rollD20(modifier);
    const dieRoll = result.dice[0];
    this.emit({
      type: 'dice_roll',
      formula: `1d20${modifier >= 0 ? '+' : ''}${modifier}`,
      result: result.total,
      dice: result.dice,
      modifier,
      isNatural20: dieRoll === 20,
      isNatural1: dieRoll === 1,
    });
    return {
      total: result.total,
      roll: dieRoll,
      isNat20: dieRoll === 20,
      isNat1: dieRoll === 1,
    };
  }

  /**
   * Roll with advantage
   */
  public rollWithAdvantage(modifier: number = 0): { total: number; roll: number; bothRolls: number[] } {
    const result = rollWithAdvantage(modifier);
    this.emit({
      type: 'dice_roll',
      formula: `2d20kh1${modifier >= 0 ? '+' : ''}${modifier}`,
      result: result.total,
      dice: result.dice,
      modifier,
      isNatural20: result.isNatural20,
      isNatural1: result.isNatural1,
    });
    return {
      total: result.total,
      roll: result.dice[0],
      bothRolls: result.dice,
    };
  }

  /**
   * Roll with disadvantage
   */
  public rollWithDisadvantage(modifier: number = 0): { total: number; roll: number; bothRolls: number[] } {
    const result = rollWithDisadvantage(modifier);
    this.emit({
      type: 'dice_roll',
      formula: `2d20kl1${modifier >= 0 ? '+' : ''}${modifier}`,
      result: result.total,
      dice: result.dice,
      modifier,
      isNatural20: result.isNatural20,
      isNatural1: result.isNatural1,
    });
    return {
      total: result.total,
      roll: result.dice[0],
      bothRolls: result.dice,
    };
  }

  // ================== ATTACK RESOLUTION ==================

  /**
   * Make an attack roll
   */
  public attack(
    attackerId: string,
    targetId: string,
    options?: {
      advantage?: boolean;
      disadvantage?: boolean;
      bonusToHit?: number;
      withinMeleeRange?: boolean;
    }
  ): AttackResult {
    const attacker = this.creatures.get(attackerId);
    const target = this.creatures.get(targetId);
    const attackerStats = this.creatureStats.get(attackerId);

    if (!attacker || !target || !attackerStats) {
      throw new Error('Attacker or target not found');
    }

    // Get conditions
    const attackerConditions = attacker.conditions as ConditionType[];
    const targetConditions = target.conditions as ConditionType[];

    // Build attack input
    const input: AttackInput = {
      attackBonus: attackerStats.attackBonus + (options?.bonusToHit ?? 0),
      targetAC: target.armorClass,
      advantage: options?.advantage,
      disadvantage: options?.disadvantage,
    };

    // Resolve attack with conditions
    const result = resolveAttackWithConditions(
      input,
      attackerConditions,
      targetConditions,
      options?.withinMeleeRange ?? true
    );

    // Emit event
    this.emit({
      type: 'attack',
      attackerId,
      targetId,
      result,
    });

    return result;
  }

  /**
   * Apply damage to a creature
   */
  public dealDamage(
    targetId: string,
    diceFormula: string,
    damageType: DamageType,
    options?: {
      isCritical?: boolean;
    }
  ): DamageResult & { newHP: number; isDead: boolean } {
    const target = this.creatures.get(targetId);
    const targetStats = this.creatureStats.get(targetId);

    if (!target || !targetStats) {
      throw new Error('Target not found');
    }

    // Calculate damage
    const damageResult = calculateDamage(
      {
        dice: diceFormula,
        type: damageType,
        isCritical: options?.isCritical ?? false,
      },
      {
        resistances: targetStats.resistances,
        vulnerabilities: targetStats.vulnerabilities,
        immunities: targetStats.immunities,
      }
    );

    // Apply damage to HP
    const hpResult = applyDamage(
      target.currentHitPoints,
      target.maxHitPoints,
      target.tempHitPoints,
      damageResult.finalDamage
    );

    // Update creature
    target.currentHitPoints = hpResult.newHP;
    target.tempHitPoints = hpResult.newTempHP;
    this.creatures.set(targetId, target);

    // Visual effects
    if (this.tokenManager) {
      this.tokenManager.showFloatingDamage(targetId, damageResult.finalDamage, damageResult.isCritical);
      this.tokenManager.playDamageFlash(targetId);
      this.tokenManager.updateToken(target);
    }

    // Emit event
    this.emit({
      type: 'damage',
      targetId,
      amount: damageResult.finalDamage,
      damageType,
      isCritical: damageResult.isCritical,
      wasResisted: damageResult.wasResisted,
      wasVulnerable: damageResult.wasVulnerable,
      wasImmune: damageResult.wasImmune,
    });

    // Check for death
    let isDead = false;
    if (hpResult.newHP <= 0) {
      // Check for instant death
      if (checkInstantDeath(target.maxHitPoints, hpResult.excessDamage)) {
        isDead = true;
        this.handleDeath(targetId, true);
      } else if (target.type !== 'character') {
        // Monsters die at 0 HP
        isDead = true;
        this.handleDeath(targetId, false);
      }
    }

    return {
      ...damageResult,
      newHP: hpResult.newHP,
      isDead,
    };
  }

  /**
   * Heal a creature
   */
  public heal(targetId: string, amount: number): { newHP: number; actualHealing: number } {
    const target = this.creatures.get(targetId);

    if (!target) {
      throw new Error('Target not found');
    }

    const oldHP = target.currentHitPoints;
    const newHP = applyHealing(target.currentHitPoints, target.maxHitPoints, amount);
    const actualHealing = newHP - oldHP;

    // Update creature
    target.currentHitPoints = newHP;
    this.creatures.set(targetId, target);

    // Visual effects
    if (this.tokenManager && actualHealing > 0) {
      this.tokenManager.showFloatingHealing(targetId, actualHealing);
      this.tokenManager.playHealingFlash(targetId);
      this.tokenManager.updateToken(target);
    }

    // Emit event
    if (actualHealing > 0) {
      this.emit({
        type: 'healing',
        targetId,
        amount: actualHealing,
        newHP,
      });
    }

    return { newHP, actualHealing };
  }

  /**
   * Handle creature death
   */
  private async handleDeath(creatureId: string, wasInstantDeath: boolean): Promise<void> {
    // Visual effects
    if (this.tokenManager) {
      await this.tokenManager.playDeathAnimation(creatureId);
    }

    // Emit event
    this.emit({
      type: 'death',
      creatureId,
      wasInstantDeath,
    });

    // Remove from initiative if in combat
    const initIndex = this.initiativeOrder.indexOf(creatureId);
    if (initIndex !== -1) {
      this.initiativeOrder.splice(initIndex, 1);
      if (this.currentTurnIndex >= initIndex && this.currentTurnIndex > 0) {
        this.currentTurnIndex--;
      }
    }
  }

  // ================== INITIATIVE ==================

  /**
   * Roll initiative for all registered creatures
   */
  public rollInitiativeForAll(): { order: string[]; results: Map<string, InitiativeResult> } {
    const results = new Map<string, InitiativeResult>();
    const combatants: Array<{ id: string; name: string; initiative: number; dexterity: number }> = [];

    for (const [id, creature] of this.creatures) {
      const stats = this.creatureStats.get(id);
      if (!stats) continue;

      const result = rollInitiative({
        dexterityMod: stats.dexterityMod,
        bonus: 0,
        advantage: false, // Could check for Alert feat, etc.
      });

      results.set(id, result);
      creature.initiative = result.total;
      this.creatures.set(id, creature);

      combatants.push({
        id,
        name: creature.name,
        initiative: result.total,
        dexterity: stats.dexterityMod,
      });
    }

    // Sort by initiative
    const sorted = sortByInitiative(combatants);
    this.initiativeOrder = sorted.map(c => c.id);
    this.currentTurnIndex = 0;
    this.round = 1;
    this.isInCombat = true;

    // Emit event
    this.emit({
      type: 'initiative',
      results: Array.from(results.entries()).map(([creatureId, r]) => ({
        creatureId,
        roll: r.roll,
        total: r.total,
      })),
      order: this.initiativeOrder,
    });

    return { order: this.initiativeOrder, results };
  }

  /**
   * Get current turn creature
   */
  public getCurrentTurnCreature(): string | null {
    if (!this.isInCombat || this.initiativeOrder.length === 0) {
      return null;
    }
    return this.initiativeOrder[this.currentTurnIndex];
  }

  /**
   * Advance to next turn
   */
  public nextTurn(): string | null {
    if (!this.isInCombat) return null;

    this.currentTurnIndex++;
    if (this.currentTurnIndex >= this.initiativeOrder.length) {
      this.currentTurnIndex = 0;
      this.round++;
    }

    return this.getCurrentTurnCreature();
  }

  /**
   * End combat
   */
  public endCombat(): void {
    this.isInCombat = false;
    this.initiativeOrder = [];
    this.currentTurnIndex = 0;
    this.round = 0;
  }

  // ================== SAVING THROWS ==================

  /**
   * Make a saving throw
   */
  public makeSavingThrow(
    creatureId: string,
    ability: AbilityType,
    dc: number,
    options?: {
      advantage?: boolean;
      disadvantage?: boolean;
    }
  ): { success: boolean; roll: number; total: number; autoFailed: boolean } {
    const creature = this.creatures.get(creatureId);
    const stats = this.creatureStats.get(creatureId);

    if (!creature || !stats) {
      throw new Error('Creature not found');
    }

    // Get modifier based on ability
    const modMap: Record<AbilityType, number> = {
      STR: stats.strengthMod,
      DEX: stats.dexterityMod,
      CON: stats.constitutionMod,
      INT: stats.intelligenceMod,
      WIS: stats.wisdomMod,
      CHA: stats.charismaMod,
    };

    const result = resolveSavingThrow({
      ability,
      modifier: modMap[ability],
      dc,
      advantage: options?.advantage,
      disadvantage: options?.disadvantage,
      proficient: stats.saveProficiencies.includes(ability),
      proficiencyBonus: stats.proficiencyBonus,
      conditions: creature.conditions as ConditionType[],
    });

    // Emit dice roll event
    this.emit({
      type: 'dice_roll',
      formula: `${ability} Save DC ${dc}`,
      result: result.total,
      dice: [result.roll],
      modifier: result.modifier,
      isNatural20: result.isNatural20,
      isNatural1: result.isNatural1,
    });

    return {
      success: result.success,
      roll: result.roll,
      total: result.total,
      autoFailed: result.autoFail ?? false,
    };
  }

  // ================== CONCENTRATION ==================

  /**
   * Check concentration when taking damage
   */
  public checkConcentration(
    creatureId: string,
    damage: number,
    spellName: string
  ): { success: boolean; dc: number; roll: number } {
    const creature = this.creatures.get(creatureId);
    const stats = this.creatureStats.get(creatureId);

    if (!creature || !stats || !creature.isConcentrating) {
      throw new Error('Creature not concentrating or not found');
    }

    const result = resolveConcentrationCheck({
      damage,
      constitutionMod: stats.constitutionMod,
    });

    // Emit event
    this.emit({
      type: 'concentration',
      creatureId,
      spellName,
      dc: result.dc,
      roll: result.total,
      success: result.success,
    });

    // If failed, break concentration
    if (!result.success) {
      creature.isConcentrating = false;
      creature.concentrationSpellId = undefined;
      this.creatures.set(creatureId, creature);
    }

    return {
      success: result.success,
      dc: result.dc,
      roll: result.total,
    };
  }

  // ================== DEATH SAVES ==================

  /**
   * Make a death saving throw
   */
  public makeDeathSave(creatureId: string): {
    roll: number;
    totalSuccesses: number;
    totalFailures: number;
    stabilized: boolean;
    dead: boolean;
    regainedConsciousness: boolean;
  } {
    const creature = this.creatures.get(creatureId);

    if (!creature) {
      throw new Error('Creature not found');
    }

    // Get current death save state
    let saves = this.deathSaves.get(creatureId);
    if (!saves) {
      saves = { successes: 0, failures: 0 };
      this.deathSaves.set(creatureId, saves);
    }

    // Roll death save
    const saveResult = rollDeathSave();

    // Process result
    const processed = processDeathSave(saves.successes, saves.failures, saveResult);

    // Update state
    saves.successes = processed.successes;
    saves.failures = processed.failures;

    // Emit dice roll
    this.emit({
      type: 'dice_roll',
      formula: 'Death Save',
      result: saveResult.roll,
      dice: [saveResult.roll],
      modifier: 0,
      isNatural20: saveResult.roll === 20,
      isNatural1: saveResult.roll === 1,
    });

    // Handle outcomes
    if (processed.dead) {
      this.handleDeath(creatureId, false);
    } else if (processed.regainedConsciousness) {
      creature.currentHitPoints = 1;
      this.creatures.set(creatureId, creature);
      this.deathSaves.delete(creatureId);

      if (this.tokenManager) {
        this.tokenManager.showFloatingHealing(creatureId, 1);
        this.tokenManager.updateToken(creature);
      }
    } else if (processed.stabilized) {
      // Creature is stabilized but still at 0 HP
      this.deathSaves.delete(creatureId);
    }

    return {
      roll: saveResult.roll,
      totalSuccesses: processed.successes,
      totalFailures: processed.failures,
      stabilized: processed.stabilized,
      dead: processed.dead,
      regainedConsciousness: processed.regainedConsciousness,
    };
  }

  // ================== SPELL UTILITIES ==================

  /**
   * Get spell save DC for a creature
   */
  public getSpellSaveDC(creatureId: string): number {
    const stats = this.creatureStats.get(creatureId);
    if (!stats || !stats.spellcastingMod) {
      return 10;
    }
    return calculateSpellSaveDC({
      proficiencyBonus: stats.proficiencyBonus,
      spellcastingAbilityMod: stats.spellcastingMod,
    });
  }

  /**
   * Get spell attack bonus for a creature
   */
  public getSpellAttackBonus(creatureId: string): number {
    const stats = this.creatureStats.get(creatureId);
    if (!stats || !stats.spellcastingMod) {
      return 0;
    }
    return calculateSpellAttackBonus({
      proficiencyBonus: stats.proficiencyBonus,
      spellcastingAbilityMod: stats.spellcastingMod,
    });
  }

  /**
   * Get tiles affected by an AoE spell
   */
  public getAoEAffectedTiles(
    shape: AoEShape,
    origin: GridPosition,
    options: {
      radius?: number;
      size?: number;
      length?: number;
      width?: number;
      direction?: number;
    }
  ): GridPosition[] {
    return getAoETiles({
      shape,
      origin,
      ...options,
    });
  }

  /**
   * Get cantrip damage dice for a character level
   */
  public getCantripDamage(baseDice: string, characterLevel: number): string {
    return getCantripDamageDice(baseDice, characterLevel);
  }

  // ================== ABILITY CHECKS ==================

  /**
   * Make an ability check
   */
  public makeAbilityCheck(
    creatureId: string,
    ability: AbilityType,
    dc: number,
    options?: {
      skill?: string;
      advantage?: boolean;
      disadvantage?: boolean;
    }
  ): { success: boolean; roll: number; total: number } {
    const stats = this.creatureStats.get(creatureId);

    if (!stats) {
      throw new Error('Creature not found');
    }

    // Get modifier based on ability
    const modMap: Record<AbilityType, number> = {
      STR: stats.strengthMod,
      DEX: stats.dexterityMod,
      CON: stats.constitutionMod,
      INT: stats.intelligenceMod,
      WIS: stats.wisdomMod,
      CHA: stats.charismaMod,
    };

    // If a skill is specified, use its ability
    let mod = modMap[ability];
    if (options?.skill) {
      const skillAbility = getSkillAbility(options.skill);
      if (skillAbility) {
        mod = modMap[skillAbility];
      }
    }

    const result = resolveAbilityCheck({
      ability,
      modifier: mod,
      dc,
      advantage: options?.advantage,
      disadvantage: options?.disadvantage,
      proficient: false, // Would need skill proficiencies in stats
      proficiencyBonus: stats.proficiencyBonus,
    });

    // Emit dice roll
    this.emit({
      type: 'dice_roll',
      formula: options?.skill ? `${options.skill} (${ability}) DC ${dc}` : `${ability} Check DC ${dc}`,
      result: result.total,
      dice: [result.roll],
      modifier: result.modifier,
      isNatural20: result.isNatural20,
      isNatural1: result.isNatural1,
    });

    return {
      success: result.success,
      roll: result.roll,
      total: result.total,
    };
  }

  /**
   * Get passive perception/investigation/insight
   */
  public getPassiveScore(
    creatureId: string,
    skill: string,
    options?: {
      advantage?: boolean;
      disadvantage?: boolean;
    }
  ): number {
    const stats = this.creatureStats.get(creatureId);
    if (!stats) return 10;

    const skillAbility = getSkillAbility(skill);
    if (!skillAbility) return 10;

    const modMap: Record<AbilityType, number> = {
      STR: stats.strengthMod,
      DEX: stats.dexterityMod,
      CON: stats.constitutionMod,
      INT: stats.intelligenceMod,
      WIS: stats.wisdomMod,
      CHA: stats.charismaMod,
    };

    return calculatePassiveScore(
      modMap[skillAbility],
      false, // Would need skill proficiencies
      stats.proficiencyBonus,
      options?.advantage,
      options?.disadvantage
    );
  }

  // ================== CONDITION EFFECTS ==================

  /**
   * Get the effects of a condition
   */
  public getConditionEffects(condition: ConditionType) {
    return getConditionEffects(condition);
  }

  /**
   * Add a condition to a creature
   */
  public addCondition(creatureId: string, condition: Condition): void {
    const creature = this.creatures.get(creatureId);
    if (!creature) return;

    if (!creature.conditions.includes(condition)) {
      creature.conditions.push(condition);
      this.creatures.set(creatureId, creature);

      if (this.tokenManager) {
        this.tokenManager.updateToken(creature);
      }
    }
  }

  /**
   * Remove a condition from a creature
   */
  public removeCondition(creatureId: string, condition: Condition): void {
    const creature = this.creatures.get(creatureId);
    if (!creature) return;

    const index = creature.conditions.indexOf(condition);
    if (index !== -1) {
      creature.conditions.splice(index, 1);
      this.creatures.set(creatureId, creature);

      if (this.tokenManager) {
        this.tokenManager.updateToken(creature);
      }
    }
  }

  // ================== STATE GETTERS ==================

  public getCreature(id: string): Creature | undefined {
    return this.creatures.get(id);
  }

  public getCreatureStats(id: string): CreatureCombatStats | undefined {
    return this.creatureStats.get(id);
  }

  public getInitiativeOrder(): string[] {
    return [...this.initiativeOrder];
  }

  public getCurrentRound(): number {
    return this.round;
  }

  public isInCombatMode(): boolean {
    return this.isInCombat;
  }

  /**
   * Clean up
   */
  public destroy(): void {
    this.creatures.clear();
    this.creatureStats.clear();
    this.eventHandlers.clear();
    this.deathSaves.clear();
    this.initiativeOrder = [];
    this.tokenManager = null;
  }
}
