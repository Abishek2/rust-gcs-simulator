# GCS Backend — API Contract

> **Version:** 0.5.0 (Phase 5)
> **Base URL:** `http://localhost:3001`
> **WebSocket URL:** `ws://localhost:3001`
>
> **SAFETY BOUNDARY:** This is a simulation-only system. All telemetry,
> tracks, states, and commands are synthetic. No real hardware is connected.

---

## REST Endpoints

### `GET /health`

Health check — confirms the server is running.

**Response:** `200 OK`
```json
{
  "status": "ok",
  "version": "0.1.0",
  "uptime_seconds": 42
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | `string` | Always `"ok"` when server is healthy |
| `version` | `string` | Cargo package version |
| `uptime_seconds` | `number` | Seconds since server started |

---

### `GET /tracks`

Returns the latest radar track snapshot.

**Response:** `200 OK`
```json
{
  "tracks": [
    {
      "track_id": "TRK-001",
      "latitude": 48.151,
      "longitude": 11.616,
      "speed": 37.0,
      "altitude": 106.3,
      "heading": 82.1,
      "confidence": 1.0,
      "status": "TRACKING",
      "last_update_timestamp": "2026-06-20T16:52:20Z"
    }
  ],
  "count": 5,
  "timestamp": "2026-06-20T16:52:20Z"
}
```

#### Track fields

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `track_id` | `string` | `"TRK-001"` – `"TRK-005"` | Stable identifier |
| `latitude` | `number` | ~48.0 – 48.3 | Decimal degrees |
| `longitude` | `number` | ~11.4 – 11.8 | Decimal degrees |
| `speed` | `number` | 5.0 – 120.0 | Ground speed (m/s) |
| `altitude` | `number` | 30.0 – 500.0 | Altitude AGL (meters) |
| `heading` | `number` | 0.0 – 360.0 | Degrees (0=N, 90=E) |
| `confidence` | `number` | 0.3 – 1.0 | Radar confidence |
| `status` | `string` | enum | Track status |
| `last_update_timestamp` | `string` | ISO 8601 | Last update time |

#### TrackStatus values

| Value | Meaning | Confidence |
|-------|---------|------------|
| `"NEW"` | Recently detected | Initial |
| `"TRACKING"` | Active, good signal | ≥ 0.7 |
| `"STALE"` | Signal degraded | 0.5 – 0.7 |
| `"LOST"` | No signal | < 0.5 |

---

### `GET /vehicle`

Returns the current simulated vehicle state.

**Response:** `200 OK`
```json
{
  "vehicle_id": "VH-001",
  "connection_state": "HEALTHY",
  "mode": "TRACKING",
  "battery_percent": 92.3,
  "latitude": 48.14,
  "longitude": 11.58,
  "altitude": 0.0,
  "speed": 0.0,
  "heading": 0.0,
  "last_heartbeat": "2026-06-20T16:52:20Z"
}
```

#### Vehicle fields

| Field | Type | Description |
|-------|------|-------------|
| `vehicle_id` | `string` | Vehicle identifier |
| `connection_state` | `string` | Communication link quality |
| `mode` | `string` | Current operational mode |
| `battery_percent` | `number` | Battery charge (0–100) |
| `latitude` | `number` | GPS latitude |
| `longitude` | `number` | GPS longitude |
| `altitude` | `number` | Altitude (meters) |
| `speed` | `number` | Ground speed (m/s) |
| `heading` | `number` | Heading (degrees) |
| `last_heartbeat` | `string` | Last heartbeat timestamp |

#### ConnectionState values

| Value | Meaning |
|-------|---------|
| `"HEALTHY"` | Strong, reliable connection |
| `"DEGRADED"` | Connection experiencing issues |
| `"LOST"` | No communication |

#### SystemMode values

| Value | Meaning |
|-------|---------|
| `"STANDBY"` | Idle, no active tracking |
| `"TRACKING"` | At least one high-confidence track |
| `"READY"` | Multiple strong tracks, fully operational |
| `"FAULT"` | System fault (lost connection, low battery) |
| `"ABORTED"` | Operator-initiated abort (Phase 4) |

---

### `GET /launchbox`

Returns the current simulated launchbox state.

**Response:** `200 OK`
```json
{
  "launchbox_id": "LB-001",
  "door_state": "CLOSED",
  "vehicle_present": true,
  "charging": true,
  "health": "OK",
  "temperature_celsius": 22.0,
  "last_update": "2026-06-20T16:52:20Z"
}
```

#### Launchbox fields

| Field | Type | Description |
|-------|------|-------------|
| `launchbox_id` | `string` | Launchbox identifier |
| `door_state` | `string` | Door position |
| `vehicle_present` | `boolean` | Vehicle detected in bay |
| `charging` | `boolean` | Charging active |
| `health` | `string` | Overall health status |
| `temperature_celsius` | `number` | Internal temperature (18–45°C) |
| `last_update` | `string` | Last update timestamp |

#### DoorState values: `"OPEN"`, `"CLOSED"`

#### LaunchboxHealth values

| Value | Meaning | Temperature |
|-------|---------|-------------|
| `"OK"` | Normal operation | < 35°C |
| `"WARNING"` | Elevated temperature | 35–40°C |
| `"FAULT"` | Critical temperature | > 40°C |

---

### `GET /video-health`

Returns the current simulated video stream health.

**Response:** `200 OK`
```json
{
  "stream_id": "STREAM-01",
  "stream_state": "CONNECTED",
  "fps": 30.1,
  "latency_ms": 63.6,
  "dropped_frames": 19,
  "resolution": "1920x1080",
  "last_frame_timestamp": "2026-06-20T16:52:20Z"
}
```

#### VideoHealth fields

| Field | Type | Description |
|-------|------|-------------|
| `stream_id` | `string` | Stream identifier |
| `stream_state` | `string` | Connection state |
| `fps` | `number` | Current frames per second |
| `latency_ms` | `number` | Video latency (ms) |
| `dropped_frames` | `number` | Cumulative dropped frames |
| `resolution` | `string` | Video resolution |
| `last_frame_timestamp` | `string` | Last frame timestamp |

#### StreamState values

| Value | Meaning | FPS | Latency |
|-------|---------|-----|---------|
| `"CONNECTED"` | Active stream | ~28–32 | ~50–120ms |
| `"RECONNECTING"` | Attempting reconnect | ~10–23 | ~250–500ms |
| `"LOST"` | Fully disconnected | 0 | 0 |

---

### `GET /diagnostics`

Returns backend diagnostics and performance metrics.

**Response:** `200 OK`
```json
{
  "websocket_clients": 1,
  "messages_sent": 27,
  "avg_latency_ms": 0.08,
  "max_latency_ms": 0.21,
  "dropped_message_count": 3,
  "event_count": 0,
  "uptime_seconds": 27,
  "timestamp": "2026-06-20T16:52:20Z"
}
```

#### Diagnostics fields

| Field | Type | Description |
|-------|------|-------------|
| `websocket_clients` | `number` | Connected WS clients (real) |
| `messages_sent` | `number` | Total broadcasts (real) |
| `avg_latency_ms` | `number` | Avg tick processing time (measured) |
| `max_latency_ms` | `number` | Max tick processing time (measured) |
| `dropped_message_count` | `number` | Broadcasts with no subscribers (real) |
| `event_count` | `number` | Total events (Phase 5) |
| `uptime_seconds` | `number` | Server uptime (real) |
| `timestamp` | `string` | Snapshot timestamp |

---

### `POST /commands`

Submits a command to the state machine to change the vehicle's operational mode.
Returns immediately with an `ACCEPTED` status and a generated `command_id`. The state machine executes the command asynchronously (taking ~3 seconds to simulate a vehicle response).

**Request:**
```json
{
  "command_type": "SET_MODE_TRACKING",
  "requested_by": "operator-demo",
  "reason": "portfolio simulation workflow"
}
```

#### CommandType values
| Value | Description |
|-------|-------------|
| `"SET_MODE_STANDBY"` | Put the system into Standby mode |
| `"SET_MODE_TRACKING"` | Put the system into Tracking mode |
| `"SET_MODE_READY"` | Put the system into Ready mode |
| `"ABORT_SIMULATION"` | Abort operations and enter Aborted mode |
| `"RESET_FAULT"` | Reset system fault state back to Standby |
| `"RUN_SYSTEM_CHECK"` | Run a diagnostic system check |

**Response:** `202 ACCEPTED`
```json
{
  "command_id": "73e4d8d2-614f-4cf8-a515-43c1582fa27f",
  "command_type": "SET_MODE_TRACKING",
  "status": "ACK_RECEIVED",
  "previous_mode": "STANDBY",
  "new_mode": "TRACKING",
  "timestamp": "2026-06-20T17:20:07Z",
  "message": "Simulated command accepted and applied."
}
```

#### CommandStatus values
| Value | Description |
|-------|-------------|
| `"ACK_RECEIVED"` | Command accepted by simulator |
| `"ACK_TIMEOUT"` | Command execution timed out |
| `"REJECTED_INVALID_TRANSITION"` | Cannot perform transition from current state |

---

## Replay and Event API (Phase 5)

### `GET /events`

Returns a list of recent system events from the database (descending order by timestamp).

**Response:** `200 OK`
```json
[
  {
    "event_id": "e9b28a7e-1234-...",
    "session_id": "session-xyz",
    "event_type": "COMMAND",
    "source": "operator-demo",
    "severity": "INFO",
    "message": "Command accepted: SET_MODE_TRACKING",
    "timestamp": "2026-06-20T17:20:00Z",
    "payload": "{\"command_type\": \"SET_MODE_TRACKING\", \"requested_by\": \"operator-demo\", \"reason\": \"portfolio simulation workflow\"}"
  }
]
```

### `GET /replay/sessions`

Returns a list of all recorded simulation sessions (descending order by start time).

**Response:** `200 OK`
```json
[
  {
    "session_id": "session-xyz",
    "start_time": "2026-06-20T17:15:00Z",
    "end_time": null,
    "status": "active"
  }
]
```

### `GET /replay/{session_id}`

Returns all system events recorded during a specific simulation session (ascending order by timestamp).

**Response:** `200 OK`
```json
[
  {
    "event_id": "...",
    "session_id": "session-xyz",
    "event_type": "STATE_TRANSITION",
    "source": "System",
    "severity": "INFO",
    "message": "Command SET_MODE_TRACKING finished with status Executed",
    "timestamp": "2026-06-20T17:20:04Z",
    "payload": "{...}"
  }
]
```

---

## WebSocket Endpoints

### `WS /ws/telemetry`

Real-time telemetry stream. Sends one JSON message per second containing
all subsystem states.

**Connection:** `ws://localhost:3001/ws/telemetry`

**Frontend example:**
```javascript
const ws = new WebSocket('ws://localhost:3001/ws/telemetry');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  // Phase 2 fields (unchanged)
  console.log(data.type);       // "telemetry_update"
  console.log(data.timestamp);  // ISO 8601
  console.log(data.tracks);     // Track[]

  // Phase 3 fields (new)
  console.log(data.vehicle);      // VehicleState
  console.log(data.launchbox);    // LaunchboxState
  console.log(data.video_health); // VideoHealthState
  console.log(data.diagnostics);  // DiagnosticsState
};
```

**Full message shape:**
```json
{
  "type": "telemetry_update",
  "timestamp": "2026-06-20T16:52:37Z",
  "tracks": [
    {
      "track_id": "TRK-001",
      "latitude": 48.152,
      "longitude": 11.624,
      "speed": 41.1,
      "altitude": 124.3,
      "heading": 76.9,
      "confidence": 0.95,
      "status": "TRACKING",
      "last_update_timestamp": "2026-06-20T16:52:37Z"
    }
  ],
  "vehicle": {
    "vehicle_id": "VH-001",
    "connection_state": "HEALTHY",
    "mode": "TRACKING",
    "battery_percent": 91.7,
    "latitude": 48.14,
    "longitude": 11.58,
    "altitude": 0.0,
    "speed": 0.0,
    "heading": 0.0,
    "last_heartbeat": "2026-06-20T16:52:37Z"
  },
  "launchbox": {
    "launchbox_id": "LB-001",
    "door_state": "OPEN",
    "vehicle_present": false,
    "charging": false,
    "health": "WARNING",
    "temperature_celsius": 38.7,
    "last_update": "2026-06-20T16:52:37Z"
  },
  "video_health": {
    "stream_id": "STREAM-01",
    "stream_state": "CONNECTED",
    "fps": 30.8,
    "latency_ms": 95.0,
    "dropped_frames": 53,
    "resolution": "1920x1080",
    "last_frame_timestamp": "2026-06-20T16:52:37Z"
  },
  "diagnostics": {
    "websocket_clients": 2,
    "messages_sent": 63,
    "avg_latency_ms": 0.08,
    "max_latency_ms": 0.21,
    "dropped_message_count": 3,
    "event_count": 0,
    "uptime_seconds": 63,
    "timestamp": "2026-06-20T16:52:37Z"
  }
}
```

### WebSocket behavior

| Behavior | Detail |
|----------|--------|
| Update interval | 1 message per second |
| Track count | 5 simulated tracks |
| Subsystems | tracks, vehicle, launchbox, video_health, diagnostics |
| Lag handling | Drops old messages if client falls behind (64 msg buffer) |
| Ping/Pong | Server responds to client pings |
| Direction | Server → Client only. Client messages are ignored. |

---

## Endpoints coming in future phases

(All backend phases complete)
