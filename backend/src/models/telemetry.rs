use chrono::{DateTime, Utc};
use serde::Serialize;

use super::track::Track;

/// A telemetry update message sent to all connected WebSocket clients.
///
/// This is the top-level JSON envelope that wraps all telemetry data.
/// The frontend should match on the `type` field to determine how to
/// process the message.
///
/// # Rust Concept: `#[serde(rename = "type")]`
/// The word `type` is a reserved keyword in Rust — you can't name a field
/// `type`. So we name it `msg_type` in Rust but use `#[serde(rename)]`
/// to output `"type"` in the JSON. The frontend sees the clean name.
///
/// # JSON Output Example
/// ```json
/// {
///   "type": "telemetry_update",
///   "timestamp": "2026-06-20T13:00:00Z",
///   "tracks": [ ... ]
/// }
/// ```
#[derive(Debug, Clone, Serialize)]
pub struct TelemetryUpdate {
    /// Message type discriminator — always `"telemetry_update"` for now.
    /// Phase 3 will add more message types.
    #[serde(rename = "type")]
    pub msg_type: String,

    /// Server timestamp when this update was generated
    pub timestamp: DateTime<Utc>,

    /// All currently tracked objects
    pub tracks: Vec<Track>,
}

impl TelemetryUpdate {
    /// Create a new telemetry update with the given tracks.
    ///
    /// # Rust Concept: Constructor pattern
    /// Rust doesn't have constructors like `new()` in other languages,
    /// but by convention we create an associated function called `new`
    /// that builds the struct. This encapsulates the default `msg_type`
    /// so callers don't have to remember to set it.
    pub fn new(tracks: Vec<Track>) -> Self {
        Self {
            msg_type: "telemetry_update".to_string(),
            timestamp: Utc::now(),
            tracks,
        }
    }
}
