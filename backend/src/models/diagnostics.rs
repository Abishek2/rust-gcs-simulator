//! Diagnostics state model — backend health and performance metrics.
//!
//! Some metrics are real (websocket_clients, uptime, messages_sent),
//! others are simulated (latency averages). This gives the frontend
//! a realistic diagnostics panel to display.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Backend diagnostics snapshot.
///
/// Captures system health metrics at a point in time. Sent as part
/// of each WebSocket telemetry update and available via GET /diagnostics.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticsState {
    /// Number of currently connected WebSocket clients (real metric)
    pub websocket_clients: u32,

    /// Total telemetry messages broadcast since startup (real metric)
    pub messages_sent: u64,

    /// Average processing latency per tick in milliseconds (measured)
    pub avg_latency_ms: f64,

    /// Maximum processing latency observed in milliseconds (measured)
    pub max_latency_ms: f64,

    /// Number of messages dropped (no subscribers) (real metric)
    pub dropped_message_count: u64,

    /// Total events recorded (for replay system, Phase 5)
    pub event_count: u64,

    /// Server uptime in seconds (real metric)
    pub uptime_seconds: u64,

    /// When this snapshot was captured
    pub timestamp: DateTime<Utc>,
}
