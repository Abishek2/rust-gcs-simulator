//! Video health state model — represents the status of a video feed.
//!
//! ## SAFETY BOUNDARY
//! Simulated video stream metrics only. No real camera, video feed,
//! or streaming hardware is connected.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Video stream connection state.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum StreamState {
    /// Stream is active and delivering frames
    #[serde(rename = "CONNECTED")]
    Connected,

    /// Stream lost connection and is attempting to reconnect
    #[serde(rename = "RECONNECTING")]
    Reconnecting,

    /// Stream is fully disconnected
    #[serde(rename = "LOST")]
    Lost,
}

/// Current health metrics for a video stream.
///
/// Tracks FPS, latency, dropped frames, and connection state.
/// These metrics help the frontend display a video health indicator.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoHealthState {
    /// Unique stream identifier (e.g., "STREAM-01")
    pub stream_id: String,

    /// Current connection state
    pub stream_state: StreamState,

    /// Current frames per second (0 when disconnected)
    pub fps: f64,

    /// End-to-end video latency in milliseconds
    pub latency_ms: f64,

    /// Cumulative count of dropped frames since stream started
    pub dropped_frames: u64,

    /// Video resolution (e.g., "1920x1080")
    pub resolution: String,

    /// Timestamp of the last successfully received frame
    pub last_frame_timestamp: DateTime<Utc>,
}
