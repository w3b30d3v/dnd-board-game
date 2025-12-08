# D&D Digital Board Game Platform
# Document 20: Rust Rules Engine Implementation

---

# 1. Overview

This document contains the complete Rust Rules Engine implementation. Create these files in `services/rules-engine/`.

---

# 2. Cargo.toml (services/rules-engine/Cargo.toml)

```toml
[package]
name = "rules-engine"
version.workspace = true
edition.workspace = true
authors.workspace = true

[[bin]]
name = "rules-engine"
path = "src/main.rs"

[dependencies]
# Workspace dependencies
tokio.workspace = true
tonic.workspace = true
prost.workspace = true
serde.workspace = true
serde_json.workspace = true
tracing.workspace = true
tracing-subscriber.workspace = true
anyhow.workspace = true
thiserror.workspace = true
uuid.workspace = true
rand.workspace = true
chrono.workspace = true

# Local dependencies
shared-rust = { path = "../shared-rust" }

[dev-dependencies]
proptest.workspace = true
criterion.workspace = true

[build-dependencies]
tonic-build.workspace = true
```

---

# 3. build.rs (services/rules-engine/build.rs)

```rust
fn main() -> Result<(), Box<dyn std::error::Error>> {
    tonic_build::configure()
        .build_server(true)
        .build_client(false)
        .out_dir("src/generated")
        .compile(
            &[
                "../../proto/rules/v1/rules_service.proto",
                "../../proto/rules/v1/dice.proto",
                "../../proto/rules/v1/combat.proto",
                "../../proto/rules/v1/spells.proto",
                "../../proto/rules/v1/conditions.proto",
            ],
            &["../../proto"],
        )?;
    Ok(())
}
```

---

# 4. Main Entry Point (services/rules-engine/src/main.rs)

```rust
use anyhow::Result;
use std::net::SocketAddr;
use tonic::transport::Server;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

mod config;
mod dice;
mod combat;
mod conditions;
mod spells;
mod service;
mod generated;

use service::RulesServiceImpl;
use generated::rules::v1::rules_service_server::RulesServiceServer;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .with_target(true)
        .json()
        .init();

    let config = config::Config::from_env()?;
    let addr: SocketAddr = format!("0.0.0.0:{}", config.port).parse()?;

    info!("Starting Rules Engine on {}", addr);

    let rules_service = RulesServiceImpl::new();

    Server::builder()
        .add_service(RulesServiceServer::new(rules_service))
        .serve(addr)
        .await?;

    Ok(())
}
```

---

# 5. Configuration (services/rules-engine/src/config.rs)

```rust
use anyhow::Result;
use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub port: u16,
    pub log_level: String,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            port: env::var("RULES_ENGINE_PORT")
                .unwrap_or_else(|_| "50051".to_string())
                .parse()?,
            log_level: env::var("LOG_LEVEL").unwrap_or_else(|_| "info".to_string()),
        })
    }
}
```

---

# 6. Dice Module (services/rules-engine/src/dice.rs)

```rust
use rand::{Rng, SeedableRng};
use rand::rngs::StdRng;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DieType {
    D4 = 4,
    D6 = 6,
    D8 = 8,
    D10 = 10,
    D12 = 12,
    D20 = 20,
    D100 = 100,
}

impl DieType {
    pub fn from_size(size: i32) -> Option<Self> {
        match size {
            4 => Some(DieType::D4),
            6 => Some(DieType::D6),
            8 => Some(DieType::D8),
            10 => Some(DieType::D10),
            12 => Some(DieType::D12),
            20 => Some(DieType::D20),
            100 => Some(DieType::D100),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DieRoll {
    pub die_type: DieType,
    pub result: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RollResult {
    pub rolls: Vec<DieRoll>,
    pub total: i32,
    pub kept: Vec<i32>,
    pub dropped: Vec<i32>,
}

#[derive(Debug, Error)]
pub enum DiceError {
    #[error("Invalid dice expression: {0}")]
    InvalidExpression(String),
    #[error("Invalid die type: {0}")]
    InvalidDieType(i32),
}

pub struct DiceRoller {
    rng: StdRng,
}

impl DiceRoller {
    pub fn new() -> Self {
        Self {
            rng: StdRng::from_entropy(),
        }
    }

    pub fn with_seed(seed: u64) -> Self {
        Self {
            rng: StdRng::seed_from_u64(seed),
        }
    }

    /// Roll a single die
    pub fn roll_die(&mut self, die_type: DieType) -> DieRoll {
        let max = die_type as i32;
        let result = self.rng.gen_range(1..=max);
        DieRoll { die_type, result }
    }

    /// Roll multiple dice
    pub fn roll_dice(&mut self, count: u32, die_type: DieType) -> Vec<DieRoll> {
        (0..count).map(|_| self.roll_die(die_type)).collect()
    }

    /// Roll with advantage (roll 2d20, keep highest)
    pub fn roll_advantage(&mut self) -> (i32, i32, i32) {
        let roll1 = self.rng.gen_range(1..=20);
        let roll2 = self.rng.gen_range(1..=20);
        let used = roll1.max(roll2);
        (roll1, roll2, used)
    }

    /// Roll with disadvantage (roll 2d20, keep lowest)
    pub fn roll_disadvantage(&mut self) -> (i32, i32, i32) {
        let roll1 = self.rng.gen_range(1..=20);
        let roll2 = self.rng.gen_range(1..=20);
        let used = roll1.min(roll2);
        (roll1, roll2, used)
    }

    /// Parse and roll a dice expression like "2d6+3" or "4d6kh3"
    pub fn roll_expression(&mut self, expression: &str) -> Result<RollResult, DiceError> {
        let expression = expression.to_lowercase().replace(" ", "");
        
        // Simple pattern: NdX or NdX+M or NdX-M
        let re = regex::Regex::new(r"^(\d+)d(\d+)(?:(kh|kl)(\d+))?(?:([+-])(\d+))?$")
            .map_err(|_| DiceError::InvalidExpression(expression.clone()))?;

        if let Some(caps) = re.captures(&expression) {
            let count: u32 = caps.get(1).unwrap().as_str().parse()
                .map_err(|_| DiceError::InvalidExpression(expression.clone()))?;
            let die_size: i32 = caps.get(2).unwrap().as_str().parse()
                .map_err(|_| DiceError::InvalidExpression(expression.clone()))?;
            
            let die_type = DieType::from_size(die_size)
                .ok_or(DiceError::InvalidDieType(die_size))?;

            let mut rolls = self.roll_dice(count, die_type);
            let mut all_results: Vec<i32> = rolls.iter().map(|r| r.result).collect();
            
            let (kept, dropped) = if let (Some(keep_type), Some(keep_count)) = 
                (caps.get(3).map(|m| m.as_str()), caps.get(4).map(|m| m.as_str().parse::<usize>().unwrap_or(count as usize))) {
                
                all_results.sort();
                if keep_type == "kh" {
                    all_results.reverse();
                }
                
                let kept: Vec<i32> = all_results.iter().take(keep_count).cloned().collect();
                let dropped: Vec<i32> = all_results.iter().skip(keep_count).cloned().collect();
                (kept, dropped)
            } else {
                (all_results.clone(), vec![])
            };

            let modifier = if let (Some(sign), Some(mod_val)) = 
                (caps.get(5).map(|m| m.as_str()), caps.get(6).map(|m| m.as_str().parse::<i32>().unwrap_or(0))) {
                if sign == "-" { -mod_val } else { mod_val }
            } else {
                0
            };

            let total: i32 = kept.iter().sum::<i32>() + modifier;

            Ok(RollResult {
                rolls,
                total,
                kept,
                dropped,
            })
        } else {
            Err(DiceError::InvalidExpression(expression))
        }
    }
}

impl Default for DiceRoller {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_seeded_roller() {
        let mut roller1 = DiceRoller::with_seed(12345);
        let mut roller2 = DiceRoller::with_seed(12345);
        
        let roll1 = roller1.roll_die(DieType::D20);
        let roll2 = roller2.roll_die(DieType::D20);
        
        assert_eq!(roll1.result, roll2.result);
    }

    #[test]
    fn test_roll_expression() {
        let mut roller = DiceRoller::with_seed(42);
        
        let result = roller.roll_expression("2d6+3").unwrap();
        assert_eq!(result.rolls.len(), 2);
        assert!(result.total >= 5 && result.total <= 15);
    }

    #[test]
    fn test_advantage_keeps_higher() {
        let mut roller = DiceRoller::with_seed(100);
        let (roll1, roll2, used) = roller.roll_advantage();
        assert_eq!(used, roll1.max(roll2));
    }
}
```

---

# 7. Combat Module (services/rules-engine/src/combat.rs)

```rust
use crate::dice::{DiceRoller, DieType};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Ability {
    STR,
    DEX,
    CON,
    INT,
    WIS,
    CHA,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum DamageType {
    Slashing,
    Piercing,
    Bludgeoning,
    Fire,
    Cold,
    Lightning,
    Thunder,
    Acid,
    Poison,
    Necrotic,
    Radiant,
    Force,
    Psychic,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CoverType {
    None,
    Half,
    ThreeQuarters,
    Total,
}

impl CoverType {
    pub fn ac_bonus(&self) -> i32 {
        match self {
            CoverType::None => 0,
            CoverType::Half => 2,
            CoverType::ThreeQuarters => 5,
            CoverType::Total => 0, // Can't be targeted
        }
    }

    pub fn dex_save_bonus(&self) -> i32 {
        self.ac_bonus() // Same bonus
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatureStats {
    pub creature_id: String,
    pub ability_scores: std::collections::HashMap<Ability, i32>,
    pub armor_class: i32,
    pub proficiency_bonus: i32,
    pub proficient_saves: HashSet<Ability>,
    pub resistances: HashSet<DamageType>,
    pub vulnerabilities: HashSet<DamageType>,
    pub immunities: HashSet<DamageType>,
    pub active_conditions: Vec<String>,
    pub current_hp: i32,
    pub max_hp: i32,
    pub temp_hp: i32,
}

impl CreatureStats {
    pub fn get_modifier(&self, ability: Ability) -> i32 {
        let score = self.ability_scores.get(&ability).copied().unwrap_or(10);
        (score - 10) / 2
    }

    pub fn get_save_modifier(&self, ability: Ability) -> i32 {
        let base = self.get_modifier(ability);
        if self.proficient_saves.contains(&ability) {
            base + self.proficiency_bonus
        } else {
            base
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttackResult {
    pub hits: bool,
    pub natural_roll: i32,
    pub attack_modifier: i32,
    pub total_attack: i32,
    pub target_ac: i32,
    pub is_critical: bool,
    pub is_fumble: bool,
    pub had_advantage: bool,
    pub had_disadvantage: bool,
    pub all_attack_rolls: Vec<i32>,
    pub damage: Option<DamageResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DamageResult {
    pub base_damage: i32,
    pub modifier: i32,
    pub damage_type: DamageType,
    pub is_resistant: bool,
    pub is_vulnerable: bool,
    pub is_immune: bool,
    pub final_damage: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavingThrowResult {
    pub success: bool,
    pub natural_roll: i32,
    pub modifier: i32,
    pub total: i32,
    pub dc: i32,
    pub auto_fail: bool,
    pub auto_success: bool,
}

pub struct CombatEngine {
    roller: DiceRoller,
}

impl CombatEngine {
    pub fn new() -> Self {
        Self {
            roller: DiceRoller::new(),
        }
    }

    pub fn with_seed(seed: u64) -> Self {
        Self {
            roller: DiceRoller::with_seed(seed),
        }
    }

    /// Calculate ability modifier from score
    pub fn calculate_modifier(score: i32) -> i32 {
        (score - 10) / 2
    }

    /// Get proficiency bonus for level
    pub fn get_proficiency_bonus(level: i32) -> i32 {
        ((level - 1) / 4) + 2
    }

    /// Resolve an attack roll
    pub fn resolve_attack(
        &mut self,
        attack_bonus: i32,
        target_ac: i32,
        advantage: bool,
        disadvantage: bool,
        cover: CoverType,
    ) -> AttackResult {
        // Advantage and disadvantage cancel out
        let (has_adv, has_disadv) = match (advantage, disadvantage) {
            (true, true) => (false, false),
            _ => (advantage, disadvantage),
        };

        let (all_rolls, natural_roll) = if has_adv {
            let (r1, r2, used) = self.roller.roll_advantage();
            (vec![r1, r2], used)
        } else if has_disadv {
            let (r1, r2, used) = self.roller.roll_disadvantage();
            (vec![r1, r2], used)
        } else {
            let roll = self.roller.roll_die(DieType::D20).result;
            (vec![roll], roll)
        };

        let is_critical = natural_roll == 20;
        let is_fumble = natural_roll == 1;

        let effective_ac = target_ac + cover.ac_bonus();
        let total_attack = natural_roll + attack_bonus;

        // Natural 20 always hits, Natural 1 always misses
        let hits = if is_critical {
            true
        } else if is_fumble {
            false
        } else {
            total_attack >= effective_ac
        };

        AttackResult {
            hits,
            natural_roll,
            attack_modifier: attack_bonus,
            total_attack,
            target_ac: effective_ac,
            is_critical,
            is_fumble,
            had_advantage: has_adv,
            had_disadvantage: has_disadv,
            all_attack_rolls: all_rolls,
            damage: None,
        }
    }

    /// Calculate damage with resistances/vulnerabilities
    pub fn calculate_damage(
        &mut self,
        dice_expression: &str,
        modifier: i32,
        damage_type: DamageType,
        is_critical: bool,
        target: &CreatureStats,
    ) -> DamageResult {
        // Roll damage
        let mut total_dice = 0;
        let roll_result = self.roller.roll_expression(dice_expression).unwrap();
        total_dice = roll_result.kept.iter().sum::<i32>();

        // Double dice on critical
        if is_critical {
            let crit_roll = self.roller.roll_expression(dice_expression).unwrap();
            total_dice += crit_roll.kept.iter().sum::<i32>();
        }

        let base_damage = total_dice + modifier;

        // Check resistances/vulnerabilities
        let is_immune = target.immunities.contains(&damage_type);
        let is_resistant = target.resistances.contains(&damage_type);
        let is_vulnerable = target.vulnerabilities.contains(&damage_type);

        // Calculate final damage
        // Immunity > Resistance/Vulnerability (they cancel if both present)
        let final_damage = if is_immune {
            0
        } else if is_resistant && is_vulnerable {
            // Cancel out
            base_damage
        } else if is_resistant {
            base_damage / 2
        } else if is_vulnerable {
            base_damage * 2
        } else {
            base_damage
        };

        DamageResult {
            base_damage,
            modifier,
            damage_type,
            is_resistant,
            is_vulnerable,
            is_immune,
            final_damage: final_damage.max(0),
        }
    }

    /// Resolve a saving throw
    pub fn resolve_saving_throw(
        &mut self,
        creature: &CreatureStats,
        ability: Ability,
        dc: i32,
        advantage: bool,
        disadvantage: bool,
        auto_fail: bool,
    ) -> SavingThrowResult {
        if auto_fail {
            return SavingThrowResult {
                success: false,
                natural_roll: 0,
                modifier: 0,
                total: 0,
                dc,
                auto_fail: true,
                auto_success: false,
            };
        }

        let (has_adv, has_disadv) = match (advantage, disadvantage) {
            (true, true) => (false, false),
            _ => (advantage, disadvantage),
        };

        let natural_roll = if has_adv {
            let (_, _, used) = self.roller.roll_advantage();
            used
        } else if has_disadv {
            let (_, _, used) = self.roller.roll_disadvantage();
            used
        } else {
            self.roller.roll_die(DieType::D20).result
        };

        let modifier = creature.get_save_modifier(ability);
        let total = natural_roll + modifier;

        SavingThrowResult {
            success: total >= dc,
            natural_roll,
            modifier,
            total,
            dc,
            auto_fail: false,
            auto_success: false,
        }
    }

    /// Apply damage to a creature
    pub fn apply_damage(
        &self,
        creature: &mut CreatureStats,
        damage: i32,
    ) -> (i32, bool, bool) {
        let mut remaining_damage = damage;
        
        // Temp HP absorbs first
        if creature.temp_hp > 0 {
            if creature.temp_hp >= remaining_damage {
                creature.temp_hp -= remaining_damage;
                remaining_damage = 0;
            } else {
                remaining_damage -= creature.temp_hp;
                creature.temp_hp = 0;
            }
        }

        // Apply to current HP
        creature.current_hp -= remaining_damage;
        
        let is_unconscious = creature.current_hp <= 0;
        let is_dead = creature.current_hp <= -(creature.max_hp);

        // Clamp HP at 0 for unconscious, negative for death saves
        if is_dead {
            creature.current_hp = -(creature.max_hp);
        }

        let actual_damage = damage.min(creature.max_hp + creature.temp_hp);
        
        (actual_damage, is_unconscious, is_dead)
    }

    /// Roll initiative
    pub fn roll_initiative(
        &mut self,
        dex_modifier: i32,
        initiative_bonus: i32,
        advantage: bool,
    ) -> (i32, i32) {
        let natural_roll = if advantage {
            let (_, _, used) = self.roller.roll_advantage();
            used
        } else {
            self.roller.roll_die(DieType::D20).result
        };

        let total = natural_roll + dex_modifier + initiative_bonus;
        (natural_roll, total)
    }
}

impl Default for CombatEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_creature() -> CreatureStats {
        let mut ability_scores = std::collections::HashMap::new();
        ability_scores.insert(Ability::STR, 16);
        ability_scores.insert(Ability::DEX, 14);
        ability_scores.insert(Ability::CON, 14);
        ability_scores.insert(Ability::INT, 10);
        ability_scores.insert(Ability::WIS, 12);
        ability_scores.insert(Ability::CHA, 8);

        CreatureStats {
            creature_id: "test-creature".to_string(),
            ability_scores,
            armor_class: 15,
            proficiency_bonus: 2,
            proficient_saves: HashSet::from([Ability::STR, Ability::CON]),
            resistances: HashSet::from([DamageType::Fire]),
            vulnerabilities: HashSet::from([DamageType::Cold]),
            immunities: HashSet::new(),
            active_conditions: vec![],
            current_hp: 45,
            max_hp: 45,
            temp_hp: 0,
        }
    }

    #[test]
    fn test_modifier_calculation() {
        assert_eq!(CombatEngine::calculate_modifier(10), 0);
        assert_eq!(CombatEngine::calculate_modifier(14), 2);
        assert_eq!(CombatEngine::calculate_modifier(8), -1);
        assert_eq!(CombatEngine::calculate_modifier(20), 5);
    }

    #[test]
    fn test_proficiency_bonus() {
        assert_eq!(CombatEngine::get_proficiency_bonus(1), 2);
        assert_eq!(CombatEngine::get_proficiency_bonus(5), 3);
        assert_eq!(CombatEngine::get_proficiency_bonus(9), 4);
        assert_eq!(CombatEngine::get_proficiency_bonus(17), 6);
    }

    #[test]
    fn test_fire_resistance() {
        let mut engine = CombatEngine::with_seed(42);
        let target = create_test_creature();
        
        let result = engine.calculate_damage("2d6", 3, DamageType::Fire, false, &target);
        assert!(result.is_resistant);
        assert_eq!(result.final_damage, result.base_damage / 2);
    }

    #[test]
    fn test_cold_vulnerability() {
        let mut engine = CombatEngine::with_seed(42);
        let target = create_test_creature();
        
        let result = engine.calculate_damage("2d6", 3, DamageType::Cold, false, &target);
        assert!(result.is_vulnerable);
        assert_eq!(result.final_damage, result.base_damage * 2);
    }

    #[test]
    fn test_natural_20_always_hits() {
        let mut engine = CombatEngine::with_seed(20200); // Seeded to roll 20
        let result = engine.resolve_attack(-5, 30, false, false, CoverType::None);
        // Natural 20 should hit even with impossible AC
        assert!(result.is_critical);
    }
}
```

---

# 8. Conditions Module (services/rules-engine/src/conditions.rs)

```rust
use crate::combat::Ability;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ConditionType {
    Blinded,
    Charmed,
    Deafened,
    Exhaustion,
    Frightened,
    Grappled,
    Incapacitated,
    Invisible,
    Paralyzed,
    Petrified,
    Poisoned,
    Prone,
    Restrained,
    Stunned,
    Unconscious,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConditionEffects {
    pub attacks_have_disadvantage: bool,
    pub attacks_have_advantage: bool,
    pub attacks_against_have_advantage: bool,
    pub attacks_against_have_disadvantage: bool,
    pub melee_attacks_against_auto_crit: bool,
    pub str_saves_auto_fail: bool,
    pub dex_saves_auto_fail: bool,
    pub ability_checks_have_disadvantage: bool,
    pub speed_is_zero: bool,
    pub speed_halved: bool,
    pub cant_move_closer_to_source: bool,
    pub cant_take_actions: bool,
    pub cant_take_reactions: bool,
    pub cant_take_bonus_actions: bool,
    pub drops_held_items: bool,
    pub falls_prone: bool,
    pub auto_fail_sight_checks: bool,
    pub auto_fail_hearing_checks: bool,
}

impl Default for ConditionEffects {
    fn default() -> Self {
        Self {
            attacks_have_disadvantage: false,
            attacks_have_advantage: false,
            attacks_against_have_advantage: false,
            attacks_against_have_disadvantage: false,
            melee_attacks_against_auto_crit: false,
            str_saves_auto_fail: false,
            dex_saves_auto_fail: false,
            ability_checks_have_disadvantage: false,
            speed_is_zero: false,
            speed_halved: false,
            cant_move_closer_to_source: false,
            cant_take_actions: false,
            cant_take_reactions: false,
            cant_take_bonus_actions: false,
            drops_held_items: false,
            falls_prone: false,
            auto_fail_sight_checks: false,
            auto_fail_hearing_checks: false,
        }
    }
}

impl ConditionType {
    pub fn get_effects(&self) -> ConditionEffects {
        match self {
            ConditionType::Blinded => ConditionEffects {
                attacks_have_disadvantage: true,
                attacks_against_have_advantage: true,
                auto_fail_sight_checks: true,
                ..Default::default()
            },
            ConditionType::Charmed => ConditionEffects::default(),
            ConditionType::Deafened => ConditionEffects {
                auto_fail_hearing_checks: true,
                ..Default::default()
            },
            ConditionType::Exhaustion => ConditionEffects::default(), // Handled by level
            ConditionType::Frightened => ConditionEffects {
                attacks_have_disadvantage: true,
                ability_checks_have_disadvantage: true,
                cant_move_closer_to_source: true,
                ..Default::default()
            },
            ConditionType::Grappled => ConditionEffects {
                speed_is_zero: true,
                ..Default::default()
            },
            ConditionType::Incapacitated => ConditionEffects {
                cant_take_actions: true,
                cant_take_reactions: true,
                ..Default::default()
            },
            ConditionType::Invisible => ConditionEffects {
                attacks_have_advantage: true,
                attacks_against_have_disadvantage: true,
                ..Default::default()
            },
            ConditionType::Paralyzed => ConditionEffects {
                cant_take_actions: true,
                cant_take_reactions: true,
                speed_is_zero: true,
                str_saves_auto_fail: true,
                dex_saves_auto_fail: true,
                attacks_against_have_advantage: true,
                melee_attacks_against_auto_crit: true,
                ..Default::default()
            },
            ConditionType::Petrified => ConditionEffects {
                cant_take_actions: true,
                cant_take_reactions: true,
                speed_is_zero: true,
                str_saves_auto_fail: true,
                dex_saves_auto_fail: true,
                attacks_against_have_advantage: true,
                ..Default::default()
            },
            ConditionType::Poisoned => ConditionEffects {
                attacks_have_disadvantage: true,
                ability_checks_have_disadvantage: true,
                ..Default::default()
            },
            ConditionType::Prone => ConditionEffects {
                attacks_have_disadvantage: true,
                ..Default::default()
            },
            ConditionType::Restrained => ConditionEffects {
                speed_is_zero: true,
                attacks_have_disadvantage: true,
                attacks_against_have_advantage: true,
                ..Default::default()
            },
            ConditionType::Stunned => ConditionEffects {
                cant_take_actions: true,
                cant_take_reactions: true,
                speed_is_zero: true,
                str_saves_auto_fail: true,
                dex_saves_auto_fail: true,
                attacks_against_have_advantage: true,
                ..Default::default()
            },
            ConditionType::Unconscious => ConditionEffects {
                cant_take_actions: true,
                cant_take_reactions: true,
                speed_is_zero: true,
                str_saves_auto_fail: true,
                dex_saves_auto_fail: true,
                attacks_against_have_advantage: true,
                melee_attacks_against_auto_crit: true,
                drops_held_items: true,
                falls_prone: true,
                ..Default::default()
            },
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveCondition {
    pub id: String,
    pub condition_type: ConditionType,
    pub source_id: Option<String>,
    pub remaining_rounds: Option<i32>,
    pub save_ability: Option<Ability>,
    pub save_dc: Option<i32>,
    pub exhaustion_level: Option<i32>,
}

pub struct ConditionManager {
    active_conditions: HashMap<String, Vec<ActiveCondition>>,
}

impl ConditionManager {
    pub fn new() -> Self {
        Self {
            active_conditions: HashMap::new(),
        }
    }

    pub fn apply_condition(
        &mut self,
        creature_id: &str,
        condition: ActiveCondition,
    ) -> bool {
        let conditions = self.active_conditions
            .entry(creature_id.to_string())
            .or_insert_with(Vec::new);
        
        // Check for duplicates (same condition type from same source)
        let already_exists = conditions.iter().any(|c| {
            c.condition_type == condition.condition_type && 
            c.source_id == condition.source_id
        });

        if already_exists && condition.condition_type != ConditionType::Exhaustion {
            return false;
        }

        conditions.push(condition);
        true
    }

    pub fn remove_condition(&mut self, creature_id: &str, condition_id: &str) -> bool {
        if let Some(conditions) = self.active_conditions.get_mut(creature_id) {
            let len_before = conditions.len();
            conditions.retain(|c| c.id != condition_id);
            return conditions.len() < len_before;
        }
        false
    }

    pub fn get_conditions(&self, creature_id: &str) -> Vec<&ActiveCondition> {
        self.active_conditions
            .get(creature_id)
            .map(|c| c.iter().collect())
            .unwrap_or_default()
    }

    pub fn get_combined_effects(&self, creature_id: &str) -> ConditionEffects {
        let mut combined = ConditionEffects::default();
        
        for condition in self.get_conditions(creature_id) {
            let effects = condition.condition_type.get_effects();
            
            combined.attacks_have_disadvantage |= effects.attacks_have_disadvantage;
            combined.attacks_have_advantage |= effects.attacks_have_advantage;
            combined.attacks_against_have_advantage |= effects.attacks_against_have_advantage;
            combined.attacks_against_have_disadvantage |= effects.attacks_against_have_disadvantage;
            combined.melee_attacks_against_auto_crit |= effects.melee_attacks_against_auto_crit;
            combined.str_saves_auto_fail |= effects.str_saves_auto_fail;
            combined.dex_saves_auto_fail |= effects.dex_saves_auto_fail;
            combined.ability_checks_have_disadvantage |= effects.ability_checks_have_disadvantage;
            combined.speed_is_zero |= effects.speed_is_zero;
            combined.speed_halved |= effects.speed_halved;
            combined.cant_take_actions |= effects.cant_take_actions;
            combined.cant_take_reactions |= effects.cant_take_reactions;
        }

        combined
    }

    pub fn process_turn_start(&mut self, creature_id: &str) -> Vec<String> {
        // Return expired condition IDs
        let mut expired = vec![];
        
        if let Some(conditions) = self.active_conditions.get_mut(creature_id) {
            for condition in conditions.iter_mut() {
                if let Some(ref mut remaining) = condition.remaining_rounds {
                    *remaining -= 1;
                    if *remaining <= 0 {
                        expired.push(condition.id.clone());
                    }
                }
            }
            
            conditions.retain(|c| !expired.contains(&c.id));
        }

        expired
    }
}

impl Default for ConditionManager {
    fn default() -> Self {
        Self::new()
    }
}
```

---

# 9. gRPC Service Implementation (services/rules-engine/src/service.rs)

```rust
use tonic::{Request, Response, Status};
use crate::combat::{CombatEngine, CreatureStats, Ability, DamageType, CoverType};
use crate::conditions::{ConditionManager, ConditionType, ActiveCondition};
use crate::dice::DiceRoller;
use crate::generated::rules::v1::*;
use crate::generated::rules::v1::rules_service_server::RulesService;
use std::sync::Mutex;

pub struct RulesServiceImpl {
    combat_engine: Mutex<CombatEngine>,
    condition_manager: Mutex<ConditionManager>,
}

impl RulesServiceImpl {
    pub fn new() -> Self {
        Self {
            combat_engine: Mutex::new(CombatEngine::new()),
            condition_manager: Mutex::new(ConditionManager::new()),
        }
    }
}

#[tonic::async_trait]
impl RulesService for RulesServiceImpl {
    async fn roll_dice(
        &self,
        request: Request<RollDiceRequest>,
    ) -> Result<Response<RollDiceResponse>, Status> {
        let req = request.into_inner();
        
        let mut roller = if let Some(seed) = req.seed {
            DiceRoller::with_seed(seed as u64)
        } else {
            DiceRoller::new()
        };

        let result = roller.roll_expression(&req.expression)
            .map_err(|e| Status::invalid_argument(e.to_string()))?;

        let rolls = result.rolls.iter().map(|r| DieRoll {
            die_type: r.die_type as i32,
            result: r.result,
        }).collect();

        Ok(Response::new(RollDiceResponse {
            rolls,
            total: result.total,
            expression: req.expression,
            kept_rolls: result.kept,
            dropped_rolls: result.dropped,
        }))
    }

    async fn roll_with_advantage(
        &self,
        request: Request<RollAdvantageRequest>,
    ) -> Result<Response<RollDiceResponse>, Status> {
        let req = request.into_inner();
        
        let mut roller = if let Some(seed) = req.seed {
            DiceRoller::with_seed(seed as u64)
        } else {
            DiceRoller::new()
        };

        // Advantage and disadvantage cancel
        let (all_rolls, used) = if req.advantage && !req.disadvantage {
            let (r1, r2, used) = roller.roll_advantage();
            (vec![r1, r2], used)
        } else if req.disadvantage && !req.advantage {
            let (r1, r2, used) = roller.roll_disadvantage();
            (vec![r1, r2], used)
        } else {
            let roll = roller.roll_die(crate::dice::DieType::D20).result;
            (vec![roll], roll)
        };

        let total = used + req.modifier;

        Ok(Response::new(RollDiceResponse {
            rolls: vec![DieRoll { die_type: 20, result: used }],
            total,
            expression: "1d20".to_string(),
            kept_rolls: vec![used],
            dropped_rolls: all_rolls.into_iter().filter(|&r| r != used).collect(),
        }))
    }

    async fn resolve_attack(
        &self,
        request: Request<AttackRequest>,
    ) -> Result<Response<AttackResponse>, Status> {
        let req = request.into_inner();
        
        let mut engine = self.combat_engine.lock().unwrap();
        
        // If seed provided, create seeded engine
        if let Some(seed) = req.seed {
            *engine = CombatEngine::with_seed(seed as u64);
        }

        let cover = match req.target_cover {
            0 => CoverType::None,
            1 => CoverType::Half,
            2 => CoverType::ThreeQuarters,
            3 => CoverType::Total,
            _ => CoverType::None,
        };

        let result = engine.resolve_attack(
            req.attack_bonus,
            req.target_stats.as_ref().map(|s| s.armor_class).unwrap_or(10),
            req.advantage,
            req.disadvantage,
            cover,
        );

        // Calculate damage if hit
        let damage = if result.hits {
            let target_stats = req.target_stats.as_ref()
                .ok_or_else(|| Status::invalid_argument("Target stats required"))?;
            
            let creature_stats = convert_proto_stats(target_stats);
            let damage_type = convert_damage_type(req.damage_type);
            
            let dmg = engine.calculate_damage(
                &req.damage_dice,
                req.damage_modifier,
                damage_type,
                result.is_critical,
                &creature_stats,
            );

            Some(DamageResult {
                rolls: vec![], // Simplified
                base_damage: dmg.base_damage,
                modifier: dmg.modifier,
                damage_type: req.damage_type,
                is_resistant: dmg.is_resistant,
                is_vulnerable: dmg.is_vulnerable,
                is_immune: dmg.is_immune,
                final_damage: dmg.final_damage,
            })
        } else {
            None
        };

        Ok(Response::new(AttackResponse {
            hits: result.hits,
            natural_roll: result.natural_roll,
            attack_modifier: result.attack_modifier,
            total_attack: result.total_attack,
            target_ac: result.target_ac,
            is_critical: result.is_critical,
            is_fumble: result.is_fumble,
            had_advantage: result.had_advantage,
            had_disadvantage: result.had_disadvantage,
            all_attack_rolls: result.all_attack_rolls,
            damage,
        }))
    }

    async fn resolve_saving_throw(
        &self,
        request: Request<SavingThrowRequest>,
    ) -> Result<Response<SavingThrowResponse>, Status> {
        let req = request.into_inner();
        
        let mut engine = self.combat_engine.lock().unwrap();
        
        if let Some(seed) = req.seed {
            *engine = CombatEngine::with_seed(seed as u64);
        }

        let creature_stats = req.stats.as_ref()
            .map(convert_proto_stats)
            .ok_or_else(|| Status::invalid_argument("Stats required"))?;

        let ability = convert_ability(req.ability);
        
        // Check for auto-fail conditions
        let conditions = self.condition_manager.lock().unwrap();
        let effects = conditions.get_combined_effects(&req.creature_id);
        
        let auto_fail = match ability {
            Ability::STR => effects.str_saves_auto_fail,
            Ability::DEX => effects.dex_saves_auto_fail,
            _ => false,
        };

        let result = engine.resolve_saving_throw(
            &creature_stats,
            ability,
            req.dc,
            req.advantage,
            req.disadvantage,
            auto_fail,
        );

        Ok(Response::new(SavingThrowResponse {
            success: result.success,
            natural_roll: result.natural_roll,
            modifier: result.modifier,
            total: result.total,
            dc: result.dc,
            auto_fail: result.auto_fail,
            auto_success: result.auto_success,
        }))
    }

    async fn roll_initiative(
        &self,
        request: Request<InitiativeRequest>,
    ) -> Result<Response<InitiativeResponse>, Status> {
        let req = request.into_inner();
        
        let mut engine = self.combat_engine.lock().unwrap();
        
        if let Some(seed) = req.seed {
            *engine = CombatEngine::with_seed(seed as u64);
        }

        let (natural_roll, total) = engine.roll_initiative(
            req.dexterity_modifier,
            req.initiative_bonus,
            req.advantage,
        );

        Ok(Response::new(InitiativeResponse {
            creature_id: req.creature_id,
            initiative: total,
            natural_roll,
            total_modifier: req.dexterity_modifier + req.initiative_bonus,
        }))
    }

    async fn calculate_modifier(
        &self,
        request: Request<ModifierRequest>,
    ) -> Result<Response<ModifierResponse>, Status> {
        let req = request.into_inner();
        let modifier = CombatEngine::calculate_modifier(req.ability_score);
        Ok(Response::new(ModifierResponse { modifier }))
    }

    async fn get_proficiency_bonus(
        &self,
        request: Request<ProficiencyRequest>,
    ) -> Result<Response<ProficiencyResponse>, Status> {
        let req = request.into_inner();
        let bonus = CombatEngine::get_proficiency_bonus(req.level);
        Ok(Response::new(ProficiencyResponse { proficiency_bonus: bonus }))
    }

    // ... Additional RPC implementations for spells, conditions, etc.
}

// Helper functions to convert proto types to internal types
fn convert_ability(proto_ability: i32) -> Ability {
    match proto_ability {
        1 => Ability::STR,
        2 => Ability::DEX,
        3 => Ability::CON,
        4 => Ability::INT,
        5 => Ability::WIS,
        6 => Ability::CHA,
        _ => Ability::STR,
    }
}

fn convert_damage_type(proto_type: i32) -> DamageType {
    match proto_type {
        1 => DamageType::Slashing,
        2 => DamageType::Piercing,
        3 => DamageType::Bludgeoning,
        4 => DamageType::Fire,
        5 => DamageType::Cold,
        6 => DamageType::Lightning,
        7 => DamageType::Thunder,
        8 => DamageType::Acid,
        9 => DamageType::Poison,
        10 => DamageType::Necrotic,
        11 => DamageType::Radiant,
        12 => DamageType::Force,
        13 => DamageType::Psychic,
        _ => DamageType::Bludgeoning,
    }
}

fn convert_proto_stats(proto: &ProtoCreatureStats) -> CreatureStats {
    use std::collections::{HashMap, HashSet};
    
    let mut ability_scores = HashMap::new();
    for (key, value) in &proto.ability_scores {
        let ability = match key.as_str() {
            "STR" => Ability::STR,
            "DEX" => Ability::DEX,
            "CON" => Ability::CON,
            "INT" => Ability::INT,
            "WIS" => Ability::WIS,
            "CHA" => Ability::CHA,
            _ => continue,
        };
        ability_scores.insert(ability, *value);
    }

    CreatureStats {
        creature_id: proto.creature_id.clone(),
        ability_scores,
        armor_class: proto.armor_class,
        proficiency_bonus: proto.proficiency_bonus,
        proficient_saves: proto.proficient_saves.iter()
            .filter_map(|s| match s.as_str() {
                "STR" => Some(Ability::STR),
                "DEX" => Some(Ability::DEX),
                "CON" => Some(Ability::CON),
                "INT" => Some(Ability::INT),
                "WIS" => Some(Ability::WIS),
                "CHA" => Some(Ability::CHA),
                _ => None,
            })
            .collect(),
        resistances: proto.resistances.iter()
            .map(|&t| convert_damage_type(t))
            .collect(),
        vulnerabilities: proto.vulnerabilities.iter()
            .map(|&t| convert_damage_type(t))
            .collect(),
        immunities: proto.immunities.iter()
            .map(|&t| convert_damage_type(t))
            .collect(),
        active_conditions: proto.active_conditions.clone(),
        current_hp: proto.current_hp,
        max_hp: proto.max_hp,
        temp_hp: proto.temp_hp,
    }
}

// Type alias for proto CreatureStats
type ProtoCreatureStats = crate::generated::rules::v1::CreatureStats;
```

---

# 10. Generated Module Placeholder

Create an empty `src/generated/mod.rs`:

```rust
// This file will be auto-generated by build.rs
// Include the generated proto types here

pub mod rules {
    pub mod v1 {
        tonic::include_proto!("rules.v1");
    }
}
```

---

# END OF DOCUMENT 20
