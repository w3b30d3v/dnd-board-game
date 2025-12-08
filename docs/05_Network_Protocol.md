# D&D Digital Board Game Platform
# Document 5: Network Protocol Design

---

# 1. Overview

This document defines the network protocols, message formats, synchronization strategies, and reliability mechanisms for real-time multiplayer gameplay.

---

# 2. Protocol Stack

## 2.1 Layer Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│         Game Commands, State Updates, Chat, Voice           │
├─────────────────────────────────────────────────────────────┤
│                    MESSAGE LAYER                            │
│         Envelope, Sequencing, Compression, Encryption       │
├─────────────────────────────────────────────────────────────┤
│                    TRANSPORT LAYER                          │
│              WebSocket (TCP) / WebRTC (UDP)                 │
├─────────────────────────────────────────────────────────────┤
│                    NETWORK LAYER                            │
│                 HTTPS/WSS, TLS 1.3                          │
└─────────────────────────────────────────────────────────────┘
```

## 2.2 Transport Selection

| Use Case | Transport | Reason |
|----------|-----------|--------|
| Game Commands | WebSocket | Reliable, ordered delivery |
| State Updates | WebSocket | Consistency critical |
| Chat | WebSocket | Reliability needed |
| Voice | WebRTC | Low latency, tolerates loss |
| Asset Loading | HTTPS | Cacheable, resumable |

---

# 3. Message Format

## 3.1 Envelope Structure

Every message follows this envelope:

```typescript
interface MessageEnvelope {
  // Header (always present)
  version: number;        // Protocol version (1)
  type: MessageType;      // Enum of message types
  messageId: string;      // UUID for tracking/dedup
  timestamp: number;      // Unix ms
  
  // Routing (optional)
  sessionId?: string;     // Target session
  entityId?: string;      // Target entity
  
  // Reliability (optional)
  sequence?: number;      // For ordered delivery
  ack?: number;           // Acknowledge received sequence
  
  // Payload
  payload: any;           // Message-specific data
  
  // Integrity (optional)
  checksum?: string;      // CRC32 for critical messages
}
```

## 3.2 Binary Format (Optimized)

For high-frequency messages, use binary encoding:

```
┌────────────────────────────────────────────────────────────┐
│ Byte 0-1: Version (uint16)                                 │
│ Byte 2-3: Type (uint16)                                    │
│ Byte 4-7: Sequence (uint32)                                │
│ Byte 8-15: Timestamp (uint64)                              │
│ Byte 16-19: Payload Length (uint32)                        │
│ Byte 20-23: Checksum (uint32, optional)                    │
│ Byte 24+: Payload (MessagePack encoded)                    │
└────────────────────────────────────────────────────────────┘
```

## 3.3 Message Types

```typescript
enum MessageType {
  // Connection
  CONNECT = 0x01,
  CONNECT_ACK = 0x02,
  DISCONNECT = 0x03,
  HEARTBEAT = 0x04,
  HEARTBEAT_ACK = 0x05,
  
  // Commands (Client → Server)
  COMMAND = 0x10,
  COMMAND_BATCH = 0x11,
  
  // Responses (Server → Client)
  COMMAND_ACK = 0x20,
  COMMAND_RESULT = 0x21,
  COMMAND_REJECTED = 0x22,
  
  // State (Server → Client)
  STATE_SNAPSHOT = 0x30,
  STATE_DELTA = 0x31,
  STATE_SYNC = 0x32,
  
  // Combat (Server → Client)
  COMBAT_START = 0x40,
  COMBAT_END = 0x41,
  TURN_START = 0x42,
  TURN_END = 0x43,
  REACTION_PROMPT = 0x44,
  
  // Chat
  CHAT_MESSAGE = 0x50,
  CHAT_TYPING = 0x51,
  
  // System
  ERROR = 0xF0,
  KICK = 0xF1,
  RECONNECT = 0xF2,
}
```

---

# 4. Connection Lifecycle

## 4.1 Connection Handshake

```
Client                                Server
   │                                     │
   │──── CONNECT ────────────────────────▶
   │     {token, clientVersion,          │
   │      sessionId, lastSequence}       │
   │                                     │
   │     ┌─────────────────────┐         │
   │     │ Validate token      │         │
   │     │ Check session       │         │
   │     │ Assign connection   │         │
   │     └─────────────────────┘         │
   │                                     │
   │◀─── CONNECT_ACK ────────────────────│
   │     {connectionId, serverTime,      │
   │      heartbeatInterval, features}   │
   │                                     │
   │◀─── STATE_SNAPSHOT ─────────────────│
   │     {sequence, fullState}           │
   │     (or STATE_DELTA if reconnect)   │
   │                                     │
   │──── HEARTBEAT ──────────────────────▶
   │     (every 30s)                     │
   │                                     │
```

## 4.2 Connection Parameters

```json
{
  "heartbeat_interval_ms": 30000,
  "heartbeat_timeout_ms": 90000,
  "reconnect_window_ms": 300000,
  "max_message_size_bytes": 65536,
  "compression_threshold_bytes": 1024,
  "batch_window_ms": 50
}
```

## 4.3 Heartbeat Protocol

```typescript
// Client sends heartbeat
{
  type: "HEARTBEAT",
  messageId: "hb_001",
  timestamp: 1710936000000,
  payload: {
    clientTime: 1710936000000,
    lastReceivedSequence: 142
  }
}

// Server responds
{
  type: "HEARTBEAT_ACK",
  messageId: "hb_001",
  timestamp: 1710936000015,
  payload: {
    serverTime: 1710936000015,
    roundTripMs: 15,
    currentSequence: 145
  }
}
```

---

# 5. State Synchronization

## 5.1 Sequence Numbers

Every state-changing message has a sequence number:

```
Server Sequence: 100 → 101 → 102 → 103 → ...
                  │      │      │      │
                  ▼      ▼      ▼      ▼
Client receives: 100    101   [gap]   103
                              ↓
                        Request resync
```

## 5.2 Delta Encoding

Only send changed data:

```typescript
// Full entity state
interface EntityState {
  entityId: string;
  position: Position;
  currentHp: number;
  maxHp: number;
  tempHp: number;
  armorClass: number;
  conditions: Condition[];
  resources: Resources;
}

// Delta (only changed fields)
interface EntityDelta {
  entityId: string;
  position?: Position;      // Only if moved
  currentHp?: number;       // Only if HP changed
  conditions?: {            // Only if conditions changed
    added?: Condition[];
    removed?: string[];
  };
  resources?: Partial<Resources>;
}
```

## 5.3 Sync Protocol

```
Client                                Server
   │                                     │
   │ (detects gap: has 140, receives 145)│
   │                                     │
   │──── SYNC_REQUEST ───────────────────▶
   │     {lastSequence: 140}             │
   │                                     │
   │     ┌─────────────────────┐         │
   │     │ Check if deltas     │         │
   │     │ 141-144 available   │         │
   │     └─────────────────────┘         │
   │                                     │
   │◀─── STATE_DELTA (batch) ────────────│
   │     {deltas: [141, 142, 143, 144]}  │
   │                                     │
   │     OR (if too many missing)        │
   │                                     │
   │◀─── STATE_SNAPSHOT ─────────────────│
   │     {sequence: 145, fullState}      │
   │                                     │
```

## 5.4 Conflict Resolution

**Last-Write-Wins with Server Authority:**

```
Time T1: Client A sends MOVE to (10, 15)
Time T2: Client B sends MOVE to (10, 15) [same destination]

Server Processing:
1. T1 arrives first → Entity moves to (10, 15)
2. T2 arrives → REJECTED (tile occupied)
3. Client B receives rejection + current state
```

**Optimistic UI with Rollback:**

```typescript
// Client-side optimistic update
function handleMoveCommand(entity: Entity, path: Position[]) {
  // 1. Store original state for rollback
  const originalPosition = entity.position;
  
  // 2. Optimistically update UI
  entity.position = path[path.length - 1];
  renderEntity(entity);
  
  // 3. Send command to server
  sendCommand({
    type: 'MOVE',
    entityId: entity.id,
    path: path
  });
  
  // 4. Wait for confirmation or rejection
  // On rejection: rollback to originalPosition
}
```

---

# 6. Message Reliability

## 6.1 Acknowledgment System

```typescript
// Command with ack request
{
  type: "COMMAND",
  messageId: "cmd_001",
  sequence: 143,
  requiresAck: true,
  payload: { /* command data */ }
}

// Immediate acknowledgment
{
  type: "COMMAND_ACK",
  ackMessageId: "cmd_001",
  status: "RECEIVED",
  serverSequence: 144
}

// Later: result
{
  type: "COMMAND_RESULT",
  resultFor: "cmd_001",
  sequence: 144,
  payload: { /* result data */ }
}
```

## 6.2 Retry Strategy

```typescript
const retryConfig = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
  retryableErrors: ['TIMEOUT', 'NETWORK_ERROR']
};

async function sendWithRetry(message: Message): Promise<Response> {
  let delay = retryConfig.initialDelayMs;
  
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const response = await send(message);
      return response;
    } catch (error) {
      if (!retryConfig.retryableErrors.includes(error.code)) {
        throw error;
      }
      if (attempt === retryConfig.maxRetries) {
        throw error;
      }
      await sleep(delay);
      delay = Math.min(delay * retryConfig.backoffMultiplier, retryConfig.maxDelayMs);
    }
  }
}
```

## 6.3 Deduplication

Server maintains sliding window of processed message IDs:

```typescript
class MessageDeduplicator {
  private processedIds = new Map<string, number>(); // messageId -> timestamp
  private windowMs = 60000; // 1 minute window
  
  isDuplicate(messageId: string): boolean {
    this.cleanup();
    return this.processedIds.has(messageId);
  }
  
  markProcessed(messageId: string): void {
    this.processedIds.set(messageId, Date.now());
  }
  
  private cleanup(): void {
    const cutoff = Date.now() - this.windowMs;
    for (const [id, timestamp] of this.processedIds) {
      if (timestamp < cutoff) {
        this.processedIds.delete(id);
      }
    }
  }
}
```

---

# 7. Latency Compensation

## 7.1 Client-Side Prediction

For movement and non-destructive actions:

```typescript
class MovementPredictor {
  private pendingMoves = new Map<string, PendingMove>();
  
  // Optimistically show movement
  predictMove(entityId: string, path: Position[]): void {
    const entity = this.getEntity(entityId);
    const originalPos = entity.position;
    
    // Animate movement immediately
    this.animateMovement(entity, path);
    
    // Store for reconciliation
    this.pendingMoves.set(entityId, {
      originalPosition: originalPos,
      predictedPosition: path[path.length - 1],
      timestamp: Date.now()
    });
  }
  
  // Reconcile with server state
  reconcile(entityId: string, serverPosition: Position): void {
    const pending = this.pendingMoves.get(entityId);
    if (!pending) return;
    
    if (!positionsEqual(pending.predictedPosition, serverPosition)) {
      // Prediction was wrong, snap to server position
      this.snapToPosition(entityId, serverPosition);
    }
    
    this.pendingMoves.delete(entityId);
  }
}
```

## 7.2 Server Timestamp Sync

```typescript
class TimeSynchronizer {
  private offset = 0;
  private samples: number[] = [];
  private maxSamples = 10;
  
  // Called on each heartbeat
  recordSample(clientSendTime: number, serverTime: number, clientReceiveTime: number): void {
    const roundTrip = clientReceiveTime - clientSendTime;
    const oneWayLatency = roundTrip / 2;
    const calculatedOffset = serverTime - clientSendTime - oneWayLatency;
    
    this.samples.push(calculatedOffset);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
    
    // Use median to filter outliers
    this.offset = median(this.samples);
  }
  
  // Convert server time to client time
  toClientTime(serverTime: number): number {
    return serverTime - this.offset;
  }
  
  // Convert client time to server time
  toServerTime(clientTime: number): number {
    return clientTime + this.offset;
  }
}
```

## 7.3 Input Buffering

Server buffers commands for fair ordering:

```typescript
class CommandBuffer {
  private buffer: Map<string, Command[]> = new Map();
  private tickInterval = 50; // 50ms tick
  
  addCommand(sessionId: string, command: Command): void {
    const commands = this.buffer.get(sessionId) || [];
    commands.push({
      ...command,
      receivedAt: Date.now()
    });
    this.buffer.set(sessionId, commands);
  }
  
  // Process all commands received in current tick
  processTick(sessionId: string): CommandResult[] {
    const commands = this.buffer.get(sessionId) || [];
    this.buffer.set(sessionId, []);
    
    // Sort by received time for deterministic ordering
    commands.sort((a, b) => a.receivedAt - b.receivedAt);
    
    return commands.map(cmd => this.processCommand(cmd));
  }
}
```

---

# 8. Bandwidth Optimization

## 8.1 Compression

```typescript
const compressionConfig = {
  algorithm: 'gzip',
  threshold: 1024, // Only compress if > 1KB
  level: 6        // Balance speed vs size
};

function maybeCompress(data: Buffer): { compressed: boolean; data: Buffer } {
  if (data.length < compressionConfig.threshold) {
    return { compressed: false, data };
  }
  
  const compressed = gzip(data, { level: compressionConfig.level });
  
  // Only use if actually smaller
  if (compressed.length < data.length * 0.9) {
    return { compressed: true, data: compressed };
  }
  
  return { compressed: false, data };
}
```

## 8.2 Batching

Combine multiple small updates:

```typescript
class UpdateBatcher {
  private pending: StateUpdate[] = [];
  private batchWindowMs = 50;
  private maxBatchSize = 20;
  private timer: NodeJS.Timeout | null = null;
  
  queue(update: StateUpdate): void {
    this.pending.push(update);
    
    if (this.pending.length >= this.maxBatchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.batchWindowMs);
    }
  }
  
  private flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    if (this.pending.length === 0) return;
    
    const batch = this.pending;
    this.pending = [];
    
    // Merge updates for same entity
    const merged = this.mergeUpdates(batch);
    
    this.send({ type: 'STATE_DELTA_BATCH', updates: merged });
  }
  
  private mergeUpdates(updates: StateUpdate[]): StateUpdate[] {
    const byEntity = new Map<string, StateUpdate>();
    
    for (const update of updates) {
      const existing = byEntity.get(update.entityId);
      if (existing) {
        // Merge: later updates override earlier
        byEntity.set(update.entityId, { ...existing, ...update });
      } else {
        byEntity.set(update.entityId, update);
      }
    }
    
    return Array.from(byEntity.values());
  }
}
```

## 8.3 Interest Management

Only send updates relevant to each client:

```typescript
class InterestManager {
  // Determine which entities client cares about
  getRelevantEntities(
    clientId: string,
    session: GameSession
  ): Set<string> {
    const client = session.getClient(clientId);
    const controlled = client.controlledEntities;
    const relevant = new Set<string>();
    
    // Always include controlled entities
    controlled.forEach(id => relevant.add(id));
    
    // Include visible entities
    for (const entity of session.entities) {
      if (this.isVisible(entity, controlled, session)) {
        relevant.add(entity.id);
      }
    }
    
    return relevant;
  }
  
  // Filter update to only relevant changes
  filterUpdate(
    update: StateUpdate,
    relevantEntities: Set<string>
  ): StateUpdate | null {
    const filteredChanges = update.entityChanges.filter(
      change => relevantEntities.has(change.entityId)
    );
    
    if (filteredChanges.length === 0) return null;
    
    return { ...update, entityChanges: filteredChanges };
  }
}
```

---

# 9. Reconnection Protocol

## 9.1 Reconnection Flow

```
Client                                Server
   │                                     │
   │ (Connection lost)                   │
   │                                     │
   │ (Wait 1s, then attempt reconnect)   │
   │                                     │
   │──── CONNECT ────────────────────────▶
   │     {token, sessionId,              │
   │      lastSequence: 142,             │
   │      reconnect: true}               │
   │                                     │
   │     ┌─────────────────────┐         │
   │     │ Check reconnect     │         │
   │     │ window (5 min)      │         │
   │     │ Validate session    │         │
   │     │ Check sequence gap  │         │
   │     └─────────────────────┘         │
   │                                     │
   │     If gap < 100:                   │
   │◀─── CONNECT_ACK + STATE_DELTA ──────│
   │     {deltas: [143...150]}           │
   │                                     │
   │     If gap >= 100:                  │
   │◀─── CONNECT_ACK + STATE_SNAPSHOT ───│
   │     {sequence: 150, fullState}      │
   │                                     │
   │     If window expired:              │
   │◀─── RECONNECT_DENIED ───────────────│
   │     {reason: "SESSION_EXPIRED"}     │
   │                                     │
```

## 9.2 Reconnection Backoff

```typescript
const reconnectConfig = {
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  multiplier: 1.5,
  maxAttempts: 10,
  jitterFactor: 0.2
};

class ReconnectionManager {
  private attempts = 0;
  private delay = reconnectConfig.initialDelayMs;
  
  async attemptReconnect(): Promise<boolean> {
    while (this.attempts < reconnectConfig.maxAttempts) {
      this.attempts++;
      
      // Add jitter to prevent thundering herd
      const jitter = this.delay * reconnectConfig.jitterFactor * (Math.random() - 0.5);
      await sleep(this.delay + jitter);
      
      try {
        await this.connect();
        this.reset();
        return true;
      } catch (error) {
        this.delay = Math.min(
          this.delay * reconnectConfig.multiplier,
          reconnectConfig.maxDelayMs
        );
      }
    }
    
    return false;
  }
  
  private reset(): void {
    this.attempts = 0;
    this.delay = reconnectConfig.initialDelayMs;
  }
}
```

## 9.3 Session Recovery States

```typescript
enum SessionRecoveryState {
  CONNECTED,           // Normal operation
  DISCONNECTED,        // Lost connection, not yet attempting
  RECONNECTING,        // Actively trying to reconnect
  RECOVERING,          // Connected, syncing state
  RECOVERED,           // Fully recovered
  FAILED               // Could not recover
}

interface RecoveryStatus {
  state: SessionRecoveryState;
  lastConnected: number;
  reconnectAttempts: number;
  sequenceGap: number;
  estimatedRecoveryMs: number;
}
```

---

# 10. Error Handling

## 10.1 Error Classification

```typescript
enum ErrorSeverity {
  INFO,       // Non-blocking, informational
  WARNING,    // Action failed but can retry
  ERROR,      // Serious issue, may need intervention
  CRITICAL    // Session integrity at risk
}

enum ErrorCategory {
  NETWORK,      // Connection issues
  VALIDATION,   // Invalid command/state
  AUTHORIZATION,// Permission denied
  GAME_LOGIC,   // Rules violation
  RATE_LIMIT,   // Too many requests
  SERVER,       // Internal server error
  CLIENT        // Client-side error
}

interface GameError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  retryable: boolean;
  retryAfterMs?: number;
  context?: Record<string, any>;
}
```

## 10.2 Error Codes

| Code | Category | Retryable | Description |
|------|----------|-----------|-------------|
| `NET_001` | NETWORK | Yes | Connection timeout |
| `NET_002` | NETWORK | Yes | Connection refused |
| `NET_003` | NETWORK | No | Invalid session |
| `VAL_001` | VALIDATION | No | Invalid command format |
| `VAL_002` | VALIDATION | No | Missing required field |
| `AUTH_001` | AUTHORIZATION | No | Token expired |
| `AUTH_002` | AUTHORIZATION | No | Not authorized for entity |
| `GAME_001` | GAME_LOGIC | No | Not your turn |
| `GAME_002` | GAME_LOGIC | No | Invalid target |
| `GAME_003` | GAME_LOGIC | No | Insufficient resources |
| `RATE_001` | RATE_LIMIT | Yes | Too many commands |
| `SRV_001` | SERVER | Yes | Internal error |
| `SRV_002` | SERVER | No | Service unavailable |

## 10.3 Error Recovery Strategies

```typescript
const errorRecoveryStrategies: Record<string, RecoveryStrategy> = {
  'NET_001': {
    action: 'RETRY',
    maxRetries: 3,
    backoffMs: [100, 500, 2000]
  },
  'NET_003': {
    action: 'RECONNECT',
    clearState: true
  },
  'AUTH_001': {
    action: 'REFRESH_TOKEN',
    thenRetry: true
  },
  'GAME_001': {
    action: 'SYNC_STATE',
    notifyUser: true,
    message: "It's not your turn"
  },
  'RATE_001': {
    action: 'WAIT',
    waitMs: 1000,
    notifyUser: true
  },
  'SRV_001': {
    action: 'RETRY',
    maxRetries: 2,
    backoffMs: [1000, 5000]
  }
};
```

---

# 11. Security Considerations

## 11.1 Message Authentication

Every message includes HMAC signature:

```typescript
function signMessage(message: Message, secret: string): SignedMessage {
  const payload = JSON.stringify(message);
  const signature = hmacSha256(payload, secret);
  
  return {
    ...message,
    signature: signature
  };
}

function verifyMessage(message: SignedMessage, secret: string): boolean {
  const { signature, ...payload } = message;
  const expectedSignature = hmacSha256(JSON.stringify(payload), secret);
  
  return timingSafeEqual(signature, expectedSignature);
}
```

## 11.2 Rate Limiting

```typescript
const rateLimits = {
  commands: {
    windowMs: 1000,
    maxRequests: 5
  },
  chat: {
    windowMs: 60000,
    maxRequests: 30
  },
  reconnect: {
    windowMs: 60000,
    maxRequests: 5
  }
};

class RateLimiter {
  private buckets = new Map<string, TokenBucket>();
  
  checkLimit(clientId: string, category: string): boolean {
    const key = `${clientId}:${category}`;
    const config = rateLimits[category];
    
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = new TokenBucket(config.maxRequests, config.windowMs);
      this.buckets.set(key, bucket);
    }
    
    return bucket.tryConsume();
  }
}
```

## 11.3 Anti-Cheat Measures

```typescript
// Server-side validation
function validateCommand(command: Command, session: GameSession): ValidationResult {
  // 1. Check command is from correct player
  if (command.userId !== session.getCurrentTurnPlayer()) {
    return { valid: false, reason: 'NOT_YOUR_TURN' };
  }
  
  // 2. Check entity belongs to player
  const entity = session.getEntity(command.entityId);
  if (entity.controllerId !== command.userId) {
    return { valid: false, reason: 'NOT_YOUR_ENTITY' };
  }
  
  // 3. Check action is valid for entity state
  if (command.type === 'ATTACK' && !entity.resources.action) {
    return { valid: false, reason: 'NO_ACTION_AVAILABLE' };
  }
  
  // 4. Check target validity
  if (command.targetId) {
    const target = session.getEntity(command.targetId);
    if (!target || !isValidTarget(entity, target, command.type)) {
      return { valid: false, reason: 'INVALID_TARGET' };
    }
  }
  
  // 5. Check movement is legal
  if (command.type === 'MOVE') {
    if (!isPathValid(entity, command.path, session)) {
      return { valid: false, reason: 'INVALID_PATH' };
    }
  }
  
  return { valid: true };
}
```

---

# 12. Protocol Versioning

## 12.1 Version Negotiation

```typescript
// Client sends supported versions
{
  type: "CONNECT",
  payload: {
    supportedVersions: ["1.0", "1.1", "1.2"],
    preferredVersion: "1.2"
  }
}

// Server selects compatible version
{
  type: "CONNECT_ACK",
  payload: {
    selectedVersion: "1.1",  // Highest mutually supported
    deprecationWarning: "Version 1.0 deprecated, will be removed 2024-06-01"
  }
}
```

## 12.2 Backwards Compatibility

```typescript
// Version adapter
class ProtocolAdapter {
  adapt(message: Message, fromVersion: string, toVersion: string): Message {
    if (fromVersion === toVersion) return message;
    
    // Apply transformations
    let adapted = message;
    
    // 1.0 → 1.1: Added conditions array
    if (this.needsUpgrade(fromVersion, '1.0', toVersion, '1.1')) {
      if (adapted.type === 'STATE_DELTA') {
        adapted = this.addConditionsArray(adapted);
      }
    }
    
    // 1.1 → 1.2: Changed position format
    if (this.needsUpgrade(fromVersion, '1.1', toVersion, '1.2')) {
      adapted = this.upgradePositionFormat(adapted);
    }
    
    return adapted;
  }
}
```

---

# 13. Performance Metrics

## 13.1 Latency Tracking

```typescript
interface LatencyMetrics {
  // Network
  roundTripMs: number;
  serverProcessingMs: number;
  
  // Breakdown
  gatewayToGameStateMs: number;
  rulesEngineMs: number;
  gridSolverMs: number;
  broadcastMs: number;
  
  // Aggregates
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

// Instrument every command
function trackLatency(command: Command, result: Result): void {
  metrics.record('command.latency', {
    type: command.type,
    duration: result.completedAt - command.sentAt,
    success: result.success
  });
}
```

## 13.2 Bandwidth Metrics

```typescript
interface BandwidthMetrics {
  // Per session
  bytesIn: number;
  bytesOut: number;
  messagesIn: number;
  messagesOut: number;
  
  // Compression stats
  compressionRatio: number;
  bytesSaved: number;
  
  // Per message type
  byMessageType: Map<string, { count: number; bytes: number }>;
}
```

---

# 14. Testing Protocol

## 14.1 Protocol Conformance Tests

```typescript
describe('Protocol Conformance', () => {
  it('handles connection handshake', async () => {
    const client = new TestClient();
    await client.connect();
    
    expect(client.receivedMessages[0].type).toBe('CONNECT_ACK');
    expect(client.receivedMessages[1].type).toBe('STATE_SNAPSHOT');
  });
  
  it('maintains sequence ordering', async () => {
    const client = new TestClient();
    await client.connect();
    
    // Send multiple commands
    await client.sendCommand({ type: 'MOVE', path: [...] });
    await client.sendCommand({ type: 'ATTACK', target: '...' });
    
    // Verify sequences are monotonically increasing
    const sequences = client.receivedMessages
      .filter(m => m.sequence)
      .map(m => m.sequence);
    
    for (let i = 1; i < sequences.length; i++) {
      expect(sequences[i]).toBeGreaterThan(sequences[i - 1]);
    }
  });
  
  it('recovers from disconnection', async () => {
    const client = new TestClient();
    await client.connect();
    const lastSequence = client.lastSequence;
    
    // Simulate disconnect
    await client.disconnect();
    await client.reconnect();
    
    // Should receive missed updates
    expect(client.lastSequence).toBeGreaterThan(lastSequence);
    expect(client.state).toMatchSnapshot('recovered_state');
  });
});
```

## 14.2 Load Testing

```typescript
describe('Protocol Load Test', () => {
  it('handles 100 concurrent sessions', async () => {
    const sessions = await Promise.all(
      Array(100).fill(null).map(() => createTestSession(4))
    );
    
    // Each session has 4 clients
    const allClients = sessions.flatMap(s => s.clients);
    
    // All clients send commands simultaneously
    const results = await Promise.all(
      allClients.map(c => c.sendCommand({ type: 'PING' }))
    );
    
    const p95Latency = percentile(results.map(r => r.latency), 95);
    expect(p95Latency).toBeLessThan(200);
  });
});
```

---

# END OF NETWORK PROTOCOL DESIGN
