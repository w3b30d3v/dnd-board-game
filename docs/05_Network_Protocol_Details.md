# D&D Digital Board Game Platform
# Document 5: Network Protocol Details

---

# 1. Overview

This document defines the complete network protocol for the D&D Digital Board Game platform, including:
- WebSocket message formats and flows
- State synchronization protocol
- Reconnection and recovery procedures
- Conflict resolution strategies
- Optimistic update patterns
- Latency compensation

---

# 2. Transport Layer

## 2.1 Connection Types

| Use Case | Protocol | Encryption | Port |
|----------|----------|------------|------|
| Gameplay | WebSocket | TLS 1.3 | 443 |
| REST APIs | HTTPS | TLS 1.3 | 443 |
| Internal Services | gRPC | mTLS | 50051-50099 |
| Voice Chat | WebRTC | DTLS | Dynamic |

## 2.2 WebSocket Connection

```
wss://rt.dndboard.game/v1/sessions/{session_id}
```

### Headers Required
```
Authorization: Bearer {jwt_token}
X-Client-Version: 1.2.3
X-Platform: web|ios|android
X-Device-Id: {uuid}
```

### Connection Lifecycle

```
┌─────────┐       ┌─────────┐       ┌─────────┐
│ Client  │       │ Gateway │       │  State  │
└────┬────┘       └────┬────┘       └────┬────┘
     │                 │                 │
     │ 1. Connect      │                 │
     │────────────────>│                 │
     │                 │ 2. Validate JWT │
     │                 │────────────────>│
     │                 │<────────────────│
     │ 3. ACK          │                 │
     │<────────────────│                 │
     │                 │ 4. Subscribe    │
     │                 │────────────────>│
     │ 5. STATE_SNAP   │<────────────────│
     │<────────────────│                 │
     │                 │                 │
     │====== CONNECTED - READY =========│
```

---

# 3. Message Envelope

## 3.1 Standard Message Format

All WebSocket messages use this envelope:

```typescript
interface MessageEnvelope {
  // Message type identifier
  type: string;
  
  // Unique message ID for acknowledgment
  message_id: string;
  
  // Server timestamp (ISO 8601)
  timestamp: string;
  
  // Sequence number for ordering
  sequence: number;
  
  // Session identifier
  session_id: string;
  
  // The actual payload
  payload: object;
  
  // Optional: For request-response correlation
  correlation_id?: string;
}
```

## 3.2 Example Message

```json
{
  "type": "ATTACK",
  "message_id": "msg_abc123",
  "timestamp": "2025-01-15T14:30:00.123Z",
  "sequence": 47,
  "session_id": "sess_xyz789",
  "payload": {
    "attacker_id": "char_player1",
    "target_id": "npc_goblin3",
    "attack_type": "MELEE_WEAPON",
    "weapon_id": "item_longsword"
  }
}
```

---

# 4. Client-to-Server Messages

## 4.1 Action Commands

### MOVE
```typescript
interface MoveCommand {
  type: "MOVE";
  payload: {
    entity_id: string;
    path: Position[];           // Ordered waypoints
    movement_type: "WALK" | "DASH" | "FLY" | "SWIM" | "CLIMB" | "TELEPORT";
  };
}
```

### ATTACK
```typescript
interface AttackCommand {
  type: "ATTACK";
  payload: {
    attacker_id: string;
    target_id: string;
    attack_type: "MELEE_WEAPON" | "RANGED_WEAPON" | "MELEE_SPELL" | "RANGED_SPELL" | "UNARMED";
    weapon_id?: string;
    spell_id?: string;
    
    // Optional modifiers
    two_weapon_fighting?: boolean;
    great_weapon_master?: boolean;  // -5/+10 option
    sharpshooter?: boolean;         // -5/+10 option
  };
}
```

### CAST_SPELL
```typescript
interface CastSpellCommand {
  type: "CAST_SPELL";
  payload: {
    caster_id: string;
    spell_id: string;
    slot_level: number;           // 0 for cantrips
    
    // Targeting
    target_type: "SELF" | "SINGLE" | "MULTIPLE" | "POINT" | "AREA";
    targets?: string[];           // Entity IDs
    target_point?: Position;      // For area spells
    
    // Spell choices
    choices?: Record<string, any>;  // e.g., damage type for Chromatic Orb
    
    // Metamagic (if Sorcerer)
    metamagic?: string[];
  };
}
```

### USE_ABILITY
```typescript
interface UseAbilityCommand {
  type: "USE_ABILITY";
  payload: {
    entity_id: string;
    ability_id: string;           // Feature/trait ID
    targets?: string[];
    target_point?: Position;
    choices?: Record<string, any>;
  };
}
```

### USE_ITEM
```typescript
interface UseItemCommand {
  type: "USE_ITEM";
  payload: {
    entity_id: string;
    item_id: string;
    targets?: string[];
    interaction_type: "USE" | "CONSUME" | "ACTIVATE" | "EQUIP" | "UNEQUIP";
  };
}
```

### END_TURN
```typescript
interface EndTurnCommand {
  type: "END_TURN";
  payload: {
    entity_id: string;
    // Optional: Actions reserved for reactions
    ready_action?: {
      trigger: string;
      action: string;
    };
  };
}
```

## 4.2 Standard Actions

### DASH
```typescript
interface DashCommand {
  type: "DASH";
  payload: {
    entity_id: string;
  };
}
// Result: Doubles movement for this turn
```

### DISENGAGE
```typescript
interface DisengageCommand {
  type: "DISENGAGE";
  payload: {
    entity_id: string;
  };
}
// Result: No opportunity attacks this turn
```

### DODGE
```typescript
interface DodgeCommand {
  type: "DODGE";
  payload: {
    entity_id: string;
  };
}
// Result: Attacks against entity have disadvantage
```

### HIDE
```typescript
interface HideCommand {
  type: "HIDE";
  payload: {
    entity_id: string;
  };
}
// Result: Contested Stealth vs Perception
```

### HELP
```typescript
interface HelpCommand {
  type: "HELP";
  payload: {
    entity_id: string;
    helped_entity_id: string;
    help_type: "ATTACK" | "ABILITY_CHECK";
    target_id?: string;           // Who they're helping attack
  };
}
```

### READY
```typescript
interface ReadyCommand {
  type: "READY";
  payload: {
    entity_id: string;
    trigger_description: string;
    action_to_ready: {
      type: string;               // ATTACK, CAST_SPELL, etc.
      payload: object;            // Pre-specified action details
    };
  };
}
```

### SEARCH
```typescript
interface SearchCommand {
  type: "SEARCH";
  payload: {
    entity_id: string;
    search_area?: Position[];     // Optional specific area
  };
}
```

## 4.3 Reaction Commands

### OPPORTUNITY_ATTACK
```typescript
interface OpportunityAttackCommand {
  type: "OPPORTUNITY_ATTACK";
  payload: {
    attacker_id: string;
    target_id: string;            // Entity that triggered
    weapon_id?: string;
  };
}
```

### COUNTERSPELL
```typescript
interface CounterspellCommand {
  type: "COUNTERSPELL";
  payload: {
    caster_id: string;
    target_spell_cast_id: string; // ID of spell being countered
    slot_level: number;
  };
}
```

### SHIELD
```typescript
interface ShieldCommand {
  type: "SHIELD";
  payload: {
    caster_id: string;
    triggering_attack_id: string;
  };
}
```

### DECLINE_REACTION
```typescript
interface DeclineReactionCommand {
  type: "DECLINE_REACTION";
  payload: {
    entity_id: string;
    reaction_prompt_id: string;
  };
}
```

## 4.4 Chat & Social

### CHAT_MESSAGE
```typescript
interface ChatMessageCommand {
  type: "CHAT_MESSAGE";
  payload: {
    sender_id: string;
    channel: "PARTY" | "DM_ONLY" | "WHISPER" | "IN_CHARACTER";
    content: string;
    whisper_to?: string;          // For WHISPER channel
    character_name?: string;      // For IN_CHARACTER
  };
}
```

### EMOTE
```typescript
interface EmoteCommand {
  type: "EMOTE";
  payload: {
    entity_id: string;
    emote_type: string;           // "cheer", "wave", "bow", etc.
  };
}
```

## 4.5 System Commands

### HEARTBEAT
```typescript
interface HeartbeatCommand {
  type: "HEARTBEAT";
  payload: {
    client_timestamp: string;
    last_sequence_received: number;
  };
}
```

### SYNC_REQUEST
```typescript
interface SyncRequestCommand {
  type: "SYNC_REQUEST";
  payload: {
    last_known_sequence: number;
    reason: "RECONNECT" | "SUSPECTED_DESYNC" | "MANUAL";
  };
}
```

---

# 5. Server-to-Client Messages

## 5.1 Acknowledgments

### COMMAND_ACK
```typescript
interface CommandAck {
  type: "COMMAND_ACK";
  payload: {
    message_id: string;           // ID of acknowledged command
    status: "ACCEPTED" | "REJECTED" | "QUEUED";
    reason?: string;              // If rejected
    
    // If accepted, may include preview
    preview?: {
      estimated_resolution_time: number;
    };
  };
}
```

## 5.2 State Updates

### STATE_DELTA
```typescript
interface StateDelta {
  type: "STATE_DELTA";
  payload: {
    sequence: number;
    
    // Changed entities
    entities: EntityDelta[];
    
    // Combat state changes
    combat?: CombatDelta;
    
    // Map/environment changes
    environment?: EnvironmentDelta;
    
    // Resources changed
    resources?: ResourceDelta[];
  };
}

interface EntityDelta {
  entity_id: string;
  
  // Only include changed fields
  changes: {
    position?: Position;
    hp?: { current: number; max: number; temp: number };
    conditions?: ConditionDelta[];
    resources?: { [key: string]: number };
    inventory?: InventoryDelta;
  };
  
  // Visibility (who can see this delta)
  visibility: "ALL" | "DM_ONLY" | string[];  // Player IDs
}
```

### STATE_SNAPSHOT
```typescript
interface StateSnapshot {
  type: "STATE_SNAPSHOT";
  payload: {
    sequence: number;
    
    // Complete state
    map: MapState;
    entities: Entity[];
    combat: CombatState | null;
    
    // Fog of war state (per-player)
    visibility: VisibilityState;
    
    // Active effects
    effects: ActiveEffect[];
  };
}
```

## 5.3 Combat Results

### COMBAT_RESULT
```typescript
interface CombatResult {
  type: "COMBAT_RESULT";
  payload: {
    action_id: string;
    action_type: string;
    actor: string;
    
    // Roll details
    rolls: {
      attack_roll?: DiceResult;
      damage_rolls?: DiceResult[];
      save_rolls?: { entity_id: string; roll: DiceResult; success: boolean }[];
    };
    
    // Outcomes
    outcomes: {
      hit?: boolean;
      critical?: boolean;
      damage_dealt?: { target_id: string; amount: number; type: string }[];
      conditions_applied?: { target_id: string; condition: string }[];
      hp_changes?: { entity_id: string; old_hp: number; new_hp: number }[];
      deaths?: string[];
    };
    
    // Presentation hints
    visual_effects: VisualEffect[];
    audio_cues: AudioCue[];
    
    // Combat log entry
    log_entry: CombatLogEntry;
  };
}

interface VisualEffect {
  type: string;                   // "spell_fireball", "attack_melee", etc.
  origin: Position;
  targets?: Position[];
  duration_ms: number;
  parameters: Record<string, any>;
}

interface AudioCue {
  type: string;                   // "attack_hit", "spell_cast", etc.
  volume: number;                 // 0.0 - 1.0
  position?: Position;            // For spatial audio
}
```

### SPELL_RESULT
```typescript
interface SpellResult {
  type: "SPELL_RESULT";
  payload: {
    spell_id: string;
    caster_id: string;
    slot_used: number;
    
    // Targeting
    targets: {
      entity_id: string;
      affected: boolean;
      save_roll?: DiceResult;
      save_success?: boolean;
    }[];
    
    // Damage
    damage?: {
      dice_result: DiceResult;
      total: number;
      type: string;
    };
    
    // Effects applied
    effects: {
      entity_id: string;
      effect_type: string;
      duration: string;
    }[];
    
    // Concentration started
    concentration?: {
      spell_id: string;
      duration: string;
    };
    
    // Presentation
    visual_effects: VisualEffect[];
  };
}
```

## 5.4 Turn Management

### TURN_CHANGE
```typescript
interface TurnChange {
  type: "TURN_CHANGE";
  payload: {
    previous_entity: string | null;
    current_entity: string;
    round: number;
    
    // Current entity's available resources
    actions_available: {
      action: boolean;
      bonus_action: boolean;
      reaction: boolean;
      movement: number;
    };
    
    // Timer
    turn_timer?: {
      duration_seconds: number;
      started_at: string;
    };
  };
}
```

### REACTION_PROMPT
```typescript
interface ReactionPrompt {
  type: "REACTION_PROMPT";
  payload: {
    prompt_id: string;
    entity_id: string;
    
    trigger_description: string;
    trigger_source: string;       // Entity or effect that triggered
    
    available_reactions: {
      reaction_type: string;
      name: string;
      description: string;
      valid: boolean;
      validation_reason?: string;
    }[];
    
    timeout_seconds: number;
    
    // Auto-decline if no response
    auto_decline_on_timeout: boolean;
  };
}
```

### INITIATIVE_ORDER
```typescript
interface InitiativeOrder {
  type: "INITIATIVE_ORDER";
  payload: {
    round: number;
    
    order: {
      entity_id: string;
      initiative_roll: number;
      initiative_modifier: number;
      is_current: boolean;
      has_acted: boolean;
    }[];
    
    // For delayed/readied actions
    pending_actions: {
      entity_id: string;
      trigger: string;
    }[];
  };
}
```

## 5.5 Session Events

### PLAYER_JOINED
```typescript
interface PlayerJoined {
  type: "PLAYER_JOINED";
  payload: {
    user_id: string;
    display_name: string;
    character_id: string;
    is_dm: boolean;
    
    // State of their character
    entity_state: Entity;
  };
}
```

### PLAYER_LEFT
```typescript
interface PlayerLeft {
  type: "PLAYER_LEFT";
  payload: {
    user_id: string;
    reason: "DISCONNECT" | "KICKED" | "LEFT_VOLUNTARILY";
    
    // What happens to their character
    character_handling: "AI_CONTROL" | "FROZEN" | "REMOVED";
  };
}
```

### PLAYER_RECONNECTED
```typescript
interface PlayerReconnected {
  type: "PLAYER_RECONNECTED";
  payload: {
    user_id: string;
    missed_sequences: number;
    resync_required: boolean;
  };
}
```

### COMBAT_STARTED
```typescript
interface CombatStarted {
  type: "COMBAT_STARTED";
  payload: {
    encounter_id?: string;
    
    combatants: {
      entity_id: string;
      initiative_roll: number;
      initiative_modifier: number;
      surprise_status: "NONE" | "SURPRISED" | "SURPRISING";
    }[];
    
    first_round: boolean;
  };
}
```

### COMBAT_ENDED
```typescript
interface CombatEnded {
  type: "COMBAT_ENDED";
  payload: {
    reason: "ALL_ENEMIES_DEFEATED" | "ALL_PLAYERS_DEFEATED" | "FLED" | "DM_ENDED" | "OBJECTIVE_COMPLETE";
    
    // Rewards (if victory)
    rewards?: {
      xp_per_player: number;
      loot: { item_id: string; quantity: number }[];
    };
    
    // Summary
    summary: {
      rounds: number;
      total_damage_dealt: number;
      total_healing: number;
      deaths: string[];
      knockouts: string[];
    };
  };
}
```

## 5.6 Error Messages

### ERROR
```typescript
interface ErrorMessage {
  type: "ERROR";
  payload: {
    error_code: string;
    message: string;
    
    // Related message (if any)
    correlation_id?: string;
    
    // Severity
    severity: "WARNING" | "ERROR" | "FATAL";
    
    // Recovery hints
    recoverable: boolean;
    recovery_action?: string;
  };
}
```

---

# 6. State Synchronization Protocol

## 6.1 Sequence Numbers

Every state-changing message has a sequence number:

```
Server maintains:
  - current_sequence: number (increments on each state change)
  - sequence_buffer: Map<number, StateDelta> (last 1000 deltas)

Client maintains:
  - last_received_sequence: number
  - pending_deltas: StateDelta[] (unprocessed deltas)
```

## 6.2 Delta Application Rules

```typescript
function applyDelta(currentState: GameState, delta: StateDelta): GameState {
  // 1. Validate sequence
  if (delta.sequence <= currentState.sequence) {
    // Already applied, ignore duplicate
    return currentState;
  }
  
  if (delta.sequence > currentState.sequence + 1) {
    // Gap detected, request sync
    requestSync(currentState.sequence);
    return currentState;
  }
  
  // 2. Apply entity changes
  for (const entityDelta of delta.entities) {
    currentState = applyEntityDelta(currentState, entityDelta);
  }
  
  // 3. Apply combat changes
  if (delta.combat) {
    currentState = applyCombatDelta(currentState, delta.combat);
  }
  
  // 4. Apply environment changes
  if (delta.environment) {
    currentState = applyEnvironmentDelta(currentState, delta.environment);
  }
  
  // 5. Update sequence
  currentState.sequence = delta.sequence;
  
  return currentState;
}
```

## 6.3 Sync Recovery

When client detects sequence gap:

```
Client                        Server
  │                             │
  │ 1. SYNC_REQUEST             │
  │   last_sequence: 45         │
  │ ───────────────────────────>│
  │                             │
  │                             │ 2. Calculate recovery
  │                             │    current: 50
  │                             │    gap: 5 messages
  │                             │
  │                             │ 3a. If gap <= 100
  │ <───────────────────────────│    Send missing deltas
  │   SYNC_DELTA (seq 46-50)    │
  │                             │
  │                             │ 3b. If gap > 100
  │ <───────────────────────────│    Send full snapshot
  │   STATE_SNAPSHOT (seq 50)   │
```

---

# 7. Reconnection Protocol

## 7.1 Reconnection Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    RECONNECTION FLOW                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Detect Disconnect                                            │
│     ├─ WebSocket close event                                     │
│     ├─ Heartbeat timeout (30s)                                   │
│     └─ Network change detected                                   │
│                                                                  │
│  2. Initial Retry (Immediate)                                    │
│     ├─ Attempt reconnect with same session                       │
│     └─ Include: last_sequence, client_state_hash                 │
│                                                                  │
│  3. Exponential Backoff                                          │
│     ├─ Retry 1: 1s                                               │
│     ├─ Retry 2: 2s                                               │
│     ├─ Retry 3: 4s                                               │
│     ├─ Retry 4: 8s                                               │
│     ├─ Retry 5: 16s                                              │
│     └─ Max retries: 10 (then show error)                         │
│                                                                  │
│  4. On Successful Reconnect                                      │
│     ├─ Server validates session still active                     │
│     ├─ Server determines sync strategy                           │
│     └─ Client receives STATE_SNAPSHOT or deltas                  │
│                                                                  │
│  5. Resume Normal Operation                                      │
│     └─ Process queued user actions (if any)                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## 7.2 Session Preservation

```typescript
// Server-side session state (persisted in Redis)
interface SessionState {
  session_id: string;
  created_at: string;
  
  // Participant tracking
  participants: {
    user_id: string;
    character_id: string;
    connected: boolean;
    last_seen: string;
    connection_id: string | null;
  }[];
  
  // Game state
  current_sequence: number;
  game_state_snapshot: GameState;
  
  // Turn state
  current_turn_entity: string | null;
  turn_started_at: string | null;
  
  // Pending actions
  pending_reactions: ReactionPrompt[];
  
  // TTL for disconnected session (30 minutes)
  expires_at: string;
}
```

## 7.3 Disconnection Handling

When a player disconnects:

```typescript
// Server-side handling
async function handlePlayerDisconnect(
  sessionId: string,
  userId: string
): Promise<void> {
  const session = await getSession(sessionId);
  
  // 1. Mark as disconnected
  session.updateParticipant(userId, { connected: false, last_seen: now() });
  
  // 2. Notify other players
  broadcast(session, {
    type: "PLAYER_LEFT",
    payload: {
      user_id: userId,
      reason: "DISCONNECT",
      character_handling: "FROZEN"  // Or AI_CONTROL based on settings
    }
  });
  
  // 3. If it's their turn, handle timeout
  if (session.current_turn_entity === getCharacterId(userId)) {
    if (session.settings.auto_end_turn_on_disconnect) {
      endTurn(session, session.current_turn_entity);
    } else {
      pauseTurnTimer(session);
    }
  }
  
  // 4. Set session expiry
  session.setExpiry(30 * 60 * 1000);  // 30 minutes
  
  await saveSession(session);
}
```

---

# 8. Conflict Resolution

## 8.1 Command Ordering

All commands are processed in order received by server:

```typescript
interface CommandQueue {
  // Commands awaiting processing
  queue: QueuedCommand[];
  
  // Currently processing
  processing: QueuedCommand | null;
  
  // Process next command
  async processNext(): Promise<void> {
    if (this.processing) return;  // Already processing
    
    const command = this.queue.shift();
    if (!command) return;
    
    this.processing = command;
    
    try {
      await this.execute(command);
    } finally {
      this.processing = null;
      this.processNext();  // Continue processing
    }
  }
}
```

## 8.2 Conflict Scenarios

### Same Target, Multiple Attackers

```typescript
// Both players attack same enemy simultaneously
// Resolution: First command received wins, second is queued

function handleSimultaneousAttacks(
  attack1: AttackCommand,
  attack2: AttackCommand
): void {
  // attack1 arrived first (by timestamp)
  processAttack(attack1);
  
  // attack2 processed after, may need revalidation
  // (e.g., target might be dead now)
  if (isTargetValid(attack2.payload.target_id)) {
    processAttack(attack2);
  } else {
    sendRejection(attack2, "TARGET_NO_LONGER_VALID");
  }
}
```

### Movement Collision

```typescript
// Two entities try to move to same tile
// Resolution: First wins, second is rejected

function handleMovementConflict(
  move1: MoveCommand,
  move2: MoveCommand
): void {
  const destination = move1.payload.path[move1.payload.path.length - 1];
  
  // Process first movement
  processMovement(move1);
  
  // Check if second movement's destination is still valid
  if (isTileOccupied(destination)) {
    sendRejection(move2, "DESTINATION_OCCUPIED");
  } else {
    processMovement(move2);
  }
}
```

### Resource Race Conditions

```typescript
// Two actions trying to use same resource
// e.g., Cast spell while another ability uses same slot

function validateResourceAvailable(
  entityId: string,
  resourceType: string,
  amount: number
): boolean {
  const entity = getEntity(entityId);
  const available = entity.resources[resourceType];
  
  // Account for pending commands
  const pendingUsage = getPendingResourceUsage(entityId, resourceType);
  
  return available - pendingUsage >= amount;
}
```

---

# 9. Optimistic Updates

## 9.1 Client-Side Prediction

Clients can show immediate feedback before server confirmation:

```typescript
interface OptimisticUpdate {
  command_id: string;
  predicted_state: Partial<GameState>;
  applied_at: number;
  
  // Rollback info
  original_state: Partial<GameState>;
}

class OptimisticUpdateManager {
  pending: Map<string, OptimisticUpdate> = new Map();
  
  // Apply optimistic update
  apply(command: Command, prediction: Partial<GameState>): void {
    const update: OptimisticUpdate = {
      command_id: command.message_id,
      predicted_state: prediction,
      applied_at: Date.now(),
      original_state: this.captureState(prediction)
    };
    
    this.pending.set(command.message_id, update);
    this.localState.merge(prediction);
  }
  
  // Handle server confirmation
  confirm(messageId: string, actualState: GameState): void {
    const update = this.pending.get(messageId);
    if (!update) return;
    
    // Replace optimistic with actual
    this.localState.replace(actualState);
    this.pending.delete(messageId);
  }
  
  // Handle server rejection
  reject(messageId: string, reason: string): void {
    const update = this.pending.get(messageId);
    if (!update) return;
    
    // Rollback to original
    this.localState.merge(update.original_state);
    this.pending.delete(messageId);
    
    // Notify UI
    this.showRejectionFeedback(reason);
  }
}
```

## 9.2 Safe Optimistic Actions

| Action Type | Optimistic? | Prediction Confidence |
|-------------|-------------|----------------------|
| Movement (own character) | Yes | High |
| Attack roll | Partial | Show animation, wait for result |
| Damage application | No | Wait for server |
| Spell cast | Partial | Show casting, wait for result |
| End turn | Yes | High |
| Pick up item | Yes | High |
| UI interactions | Yes | High |

## 9.3 Movement Prediction

```typescript
function predictMovement(
  entity: Entity,
  path: Position[]
): MovementPrediction {
  // Client-side validation
  const validPath = validatePath(entity, path);
  
  if (!validPath.valid) {
    return { success: false, reason: validPath.reason };
  }
  
  // Calculate movement cost
  const totalCost = calculatePathCost(path);
  
  // Check if within movement budget
  if (totalCost > entity.movement_remaining) {
    return { success: false, reason: "INSUFFICIENT_MOVEMENT" };
  }
  
  // Predict final state
  return {
    success: true,
    predicted_position: path[path.length - 1],
    predicted_movement_remaining: entity.movement_remaining - totalCost
  };
}
```

---

# 10. Latency Compensation

## 10.1 Round-Trip Time Tracking

```typescript
class LatencyTracker {
  private samples: number[] = [];
  private maxSamples = 100;
  
  recordSample(rtt: number): void {
    this.samples.push(rtt);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }
  
  getAverageRTT(): number {
    if (this.samples.length === 0) return 0;
    return this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
  }
  
  getP95RTT(): number {
    if (this.samples.length === 0) return 0;
    const sorted = [...this.samples].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index];
  }
}
```

## 10.2 Animation Timing

```typescript
// Synchronize animations across clients
interface AnimationSync {
  animation_id: string;
  start_time: string;        // Server timestamp
  duration_ms: number;
  
  // Client adjusts based on local clock offset
  getLocalStartTime(): number {
    const serverTime = parseTimestamp(this.start_time);
    const localTime = serverTime + this.clockOffset;
    return localTime;
  }
}
```

## 10.3 Turn Timer Compensation

```typescript
// Server-side turn timer
interface TurnTimer {
  entity_id: string;
  duration_seconds: number;
  started_at: string;
  
  // Clients receive this and calculate locally
  getRemainingTime(clientClockOffset: number): number {
    const serverNow = Date.now() + clientClockOffset;
    const startTime = parseTimestamp(this.started_at);
    const elapsed = (serverNow - startTime) / 1000;
    return Math.max(0, this.duration_seconds - elapsed);
  }
}
```

---

# 11. Heartbeat & Keep-Alive

## 11.1 Heartbeat Protocol

```
Client                        Server
  │                             │
  │ HEARTBEAT                   │
  │  client_ts: T1              │
  │  last_seq: 45               │
  │ ───────────────────────────>│
  │                             │
  │ HEARTBEAT_ACK               │
  │  client_ts: T1              │
  │  server_ts: T2              │
  │  current_seq: 45            │
  │ <───────────────────────────│
  │                             │
  │ Calculate RTT = now() - T1  │
  │ Calculate offset = T2 - T1  │
```

## 11.2 Heartbeat Configuration

```typescript
const HeartbeatConfig = {
  // Send heartbeat every 10 seconds
  interval_ms: 10_000,
  
  // Consider connection dead after 30s no response
  timeout_ms: 30_000,
  
  // Reconnect after 3 consecutive failures
  max_failures: 3
};
```

## 11.3 Connection Quality Indicators

```typescript
interface ConnectionQuality {
  // Based on RTT
  latency: "GOOD" | "MODERATE" | "POOR";
  
  // Based on packet loss
  stability: "STABLE" | "UNSTABLE";
  
  // Thresholds
  static fromMetrics(rtt: number, packetLoss: number): ConnectionQuality {
    return {
      latency: rtt < 50 ? "GOOD" : rtt < 150 ? "MODERATE" : "POOR",
      stability: packetLoss < 0.01 ? "STABLE" : "UNSTABLE"
    };
  }
}
```

---

# 12. Message Compression

## 12.1 Compression Strategy

```typescript
// Use compression for messages > 1KB
const COMPRESSION_THRESHOLD = 1024;

function prepareMessage(message: object): Buffer {
  const json = JSON.stringify(message);
  
  if (json.length > COMPRESSION_THRESHOLD) {
    const compressed = zlib.deflateSync(Buffer.from(json));
    return packCompressed(compressed);
  }
  
  return Buffer.from(json);
}

// Message prefix indicates compression
// 0x00 = uncompressed JSON
// 0x01 = deflate compressed
function packCompressed(data: Buffer): Buffer {
  const result = Buffer.alloc(data.length + 1);
  result[0] = 0x01;
  data.copy(result, 1);
  return result;
}
```

## 12.2 Delta Compression

For state updates, send only changed fields:

```typescript
interface CompressedDelta {
  // Changed fields only
  c: {
    [entityId: string]: {
      // Short keys to save bytes
      p?: [number, number];      // position
      h?: number;                // hp.current
      m?: number;                // movement_remaining
      cn?: string[];             // conditions (added)
      cr?: string[];             // conditions (removed)
    };
  };
  
  // Sequence
  s: number;
}

// Example: Entity moved and took damage
{
  "c": {
    "char_123": {
      "p": [5, 10],
      "h": 23
    }
  },
  "s": 47
}
```

---

# 13. Protocol Versioning

## 13.1 Version Negotiation

```typescript
// On connect, client sends version
interface ConnectRequest {
  protocol_version: string;   // "1.2"
  client_version: string;     // "1.5.3"
  supported_features: string[];
}

// Server responds with negotiated version
interface ConnectResponse {
  protocol_version: string;   // May differ if compatible
  server_version: string;
  enabled_features: string[];
  
  // If incompatible
  upgrade_required?: boolean;
  minimum_version?: string;
}
```

## 13.2 Backward Compatibility

```typescript
// Server handles multiple protocol versions
class MessageHandler {
  handleMessage(version: string, message: any): void {
    switch (version) {
      case "1.0":
        return this.handleV1_0(message);
      case "1.1":
        return this.handleV1_1(message);
      case "1.2":
        return this.handleV1_2(message);
      default:
        throw new Error(`Unsupported protocol version: ${version}`);
    }
  }
}
```

---

# 14. Security

## 14.1 Message Validation

```typescript
// All incoming messages are validated
function validateMessage(message: any): ValidationResult {
  // 1. Check envelope structure
  if (!message.type || !message.message_id) {
    return { valid: false, reason: "INVALID_ENVELOPE" };
  }
  
  // 2. Check message type is known
  if (!KNOWN_MESSAGE_TYPES.includes(message.type)) {
    return { valid: false, reason: "UNKNOWN_MESSAGE_TYPE" };
  }
  
  // 3. Validate payload against schema
  const schema = MESSAGE_SCHEMAS[message.type];
  const payloadValid = validateSchema(message.payload, schema);
  if (!payloadValid.valid) {
    return { valid: false, reason: payloadValid.errors };
  }
  
  // 4. Check for injection attempts
  if (containsSuspiciousContent(message)) {
    return { valid: false, reason: "SUSPICIOUS_CONTENT" };
  }
  
  return { valid: true };
}
```

## 14.2 Rate Limiting

```typescript
const RateLimits = {
  // Per-session limits
  commands_per_second: 10,
  chat_messages_per_minute: 30,
  
  // Per-user limits
  sessions_per_user: 5,
  reconnects_per_minute: 10
};

class RateLimiter {
  check(userId: string, action: string): boolean {
    const key = `${userId}:${action}`;
    const limit = RateLimits[action];
    const current = this.getCount(key);
    
    if (current >= limit) {
      return false;
    }
    
    this.increment(key);
    return true;
  }
}
```

## 14.3 Anti-Cheat Measures

```typescript
// Server validates all actions
function validateAction(
  session: Session,
  userId: string,
  action: Action
): ValidationResult {
  // 1. Is it this player's turn?
  if (!session.isPlayersTurn(userId)) {
    return { valid: false, reason: "NOT_YOUR_TURN" };
  }
  
  // 2. Is the action type allowed?
  if (!session.canPerformAction(userId, action.type)) {
    return { valid: false, reason: "ACTION_NOT_AVAILABLE" };
  }
  
  // 3. Are the targets valid?
  if (!validateTargets(session, action)) {
    return { valid: false, reason: "INVALID_TARGETS" };
  }
  
  // 4. Are resources available?
  if (!validateResources(session, userId, action)) {
    return { valid: false, reason: "INSUFFICIENT_RESOURCES" };
  }
  
  // 5. Server calculates all outcomes
  // Client-provided "results" are ignored
  
  return { valid: true };
}
```

---

# END OF NETWORK PROTOCOL DOCUMENT
