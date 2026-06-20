# GCS Backend — API Contract

> **Version:** 0.2.0 (Phase 2)
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
| `version` | `string` | Cargo package version (semver) |
| `uptime_seconds` | `number` | Seconds since server started |

---

## WebSocket Endpoints

### `WS /ws/telemetry`

Real-time telemetry stream. Connect with a standard WebSocket client.
The server sends one JSON message per second containing all current track data.

**Connection:**
```
ws://localhost:3001/ws/telemetry
```

**Frontend example:**
```javascript
const ws = new WebSocket('ws://localhost:3001/ws/telemetry');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.type);   // "telemetry_update"
  console.log(data.tracks); // array of Track objects
};

ws.onopen = () => console.log('Connected to telemetry stream');
ws.onclose = () => console.log('Disconnected from telemetry stream');
```

**Message shape:** `TelemetryUpdate`

```json
{
  "type": "telemetry_update",
  "timestamp": "2026-06-20T13:00:00.000000000Z",
  "tracks": [
    {
      "track_id": "TRK-001",
      "latitude": 48.107,
      "longitude": 11.613,
      "speed": 42.5,
      "altitude": 120.0,
      "heading": 85.0,
      "confidence": 0.87,
      "status": "TRACKING",
      "last_update_timestamp": "2026-06-20T13:00:00.000000000Z"
    }
  ]
}
```

### TelemetryUpdate fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | Message discriminator. Always `"telemetry_update"` in Phase 2. |
| `timestamp` | `string` | ISO 8601 UTC timestamp when the server generated this update |
| `tracks` | `Track[]` | Array of all currently tracked objects (simulated) |

### Track fields

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `track_id` | `string` | `"TRK-001"` through `"TRK-005"` | Stable identifier for this track |
| `latitude` | `number` | ~48.0 – 48.3 | Decimal degrees latitude |
| `longitude` | `number` | ~11.4 – 11.8 | Decimal degrees longitude |
| `speed` | `number` | 5.0 – 120.0 | Ground speed in meters/second |
| `altitude` | `number` | 30.0 – 500.0 | Altitude AGL in meters |
| `heading` | `number` | 0.0 – 360.0 | Heading in degrees (0=N, 90=E, 180=S, 270=W) |
| `confidence` | `number` | 0.3 – 1.0 | Radar confidence score |
| `status` | `string` | `"NEW"`, `"TRACKING"`, `"STALE"`, `"LOST"` | Current track status |
| `last_update_timestamp` | `string` | ISO 8601 UTC | When this track was last updated |

### Track status values

| Status | Meaning | Confidence range |
|--------|---------|-----------------|
| `TRACKING` | Actively tracked with good signal | ≥ 0.7 |
| `NEW` | Recently detected, not yet confirmed | Initial state |
| `STALE` | Signal degraded, may be lost soon | 0.5 – 0.7 |
| `LOST` | No signal, track will be removed | < 0.5 |

### WebSocket behavior

| Behavior | Detail |
|----------|--------|
| Update interval | 1 message per second |
| Track count | 5 simulated tracks |
| Track persistence | Tracks persist and evolve continuously |
| Movement model | Speed + heading with random perturbations |
| Geo-fencing | Tracks turn back toward center when drifting > 0.1° |
| Lag handling | Server drops old messages if client falls behind (64 msg buffer) |
| Ping/Pong | Server responds to client pings for keepalive |
| Direction | Server → Client only. Client messages are ignored. |

---

## Endpoints coming in future phases

| Method | Path | Phase | Description |
|--------|------|-------|-------------|
| `GET` | `/tracks` | 3 | Current track snapshot |
| `GET` | `/vehicle` | 3 | Vehicle telemetry |
| `GET` | `/launchbox` | 3 | Launchbox state |
| `GET` | `/video-health` | 3 | Video stream health |
| `GET` | `/events` | 5 | Event log query |
| `POST` | `/commands` | 4 | Send simulated commands |
| `GET` | `/replay/sessions` | 5 | List replay sessions |
| `GET` | `/replay/{session_id}` | 5 | Replay a session |
