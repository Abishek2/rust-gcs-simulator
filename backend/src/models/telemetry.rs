use chrono::{DateTime, Utc};
use serde::Serialize;

use super::diagnostics::DiagnosticsState;
use super::event::SystemEvent;
use super::launchbox::LaunchboxState;
use super::command::CommandResponse;
use super::track::Track;
use super::vehicle::VehicleState;
use super::video::VideoHealthState;

/// A telemetry update message sent to all connected WebSocket clients.
///
/// This is the top-level JSON envelope that wraps all telemetry data.
/// The frontend should match on the `type` field to determine how to
/// process the message.
///
/// # Backwards Compatibility
/// Phase 2 clients that only read `tracks` will continue to work —
/// the new fields (`vehicle`, `launchbox`, `video_health`, `diagnostics`)
/// are simply additional JSON properties that older clients ignore.
///
/// # JSON Output Example
/// ```json
/// {
///   "type": "telemetry_update",
///   "timestamp": "2026-06-20T16:30:00Z",
///   "tracks": [ ... ],
///   "vehicle": { ... },
///   "launchbox": { ... },
///   "video_health": { ... },
///   "diagnostics": { ... }
/// }
/// ```
#[derive(Debug, Clone, Serialize)]
pub struct TelemetryUpdate {
    /// Message type discriminator — always `"telemetry_update"`.
    #[serde(rename = "type")]
    pub msg_type: String,

    /// Server timestamp when this update was generated
    pub timestamp: DateTime<Utc>,

    /// All currently tracked objects
    pub tracks: Vec<Track>,

    /// Current vehicle state (Phase 3)
    pub vehicle: VehicleState,

    /// Current launchbox state (Phase 3)
    pub launchbox: LaunchboxState,

    /// Current video stream health (Phase 3)
    pub video_health: VideoHealthState,

    /// Backend diagnostics snapshot (Phase 3)
    pub diagnostics: DiagnosticsState,

    /// Latest command status (Phase 4)
    pub latest_command: Option<CommandResponse>,

    /// Recent events (Phase 4)
    pub events: Vec<SystemEvent>,
}

impl TelemetryUpdate {
    /// Create a full telemetry update with all subsystem states.
    pub fn new(
        tracks: Vec<Track>,
        vehicle: VehicleState,
        launchbox: LaunchboxState,
        video_health: VideoHealthState,
        diagnostics: DiagnosticsState,
        latest_command: Option<CommandResponse>,
        events: Vec<SystemEvent>,
    ) -> Self {
        Self {
            msg_type: "telemetry_update".to_string(),
            timestamp: Utc::now(),
            tracks,
            vehicle,
            launchbox,
            video_health,
            diagnostics,
            latest_command,
            events,
        }
    }
}
