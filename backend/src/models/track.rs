use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// The status of a radar track.
///
/// # Rust Concept: Enums with `#[serde(rename)]`
/// In Rust, enum variants are PascalCase by convention (e.g., `Tracking`).
/// But our JSON API contract requires SCREAMING_CASE strings like `"TRACKING"`.
/// `#[serde(rename = "TRACKING")]` tells Serde: "when serializing to JSON,
/// use `"TRACKING"` instead of `"Tracking"`." This way we get type safety
/// in Rust code while matching the exact JSON the frontend expects.
///
/// # Rust Concept: Deriving multiple traits
/// Each trait in `#[derive(...)]` adds a capability:
/// - `Serialize` / `Deserialize`: JSON conversion (Serde)
/// - `Clone`: allows `.clone()` to copy the value
/// - `Debug`: allows `{:?}` formatting for logs
/// - `PartialEq`: allows `==` comparison between values
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TrackStatus {
    /// Track is actively being followed by the radar
    #[serde(rename = "TRACKING")]
    Tracking,

    /// Track was detected but not yet confirmed
    #[serde(rename = "NEW")]
    New,

    /// Track signal has gone stale (no recent updates)
    #[serde(rename = "STALE")]
    Stale,

    /// Track has been lost (no signal for extended period)
    #[serde(rename = "LOST")]
    Lost,
}

/// A single radar track — represents one detected object on the map.
///
/// All values are simulated. No real radar or hardware is connected.
///
/// # Rust Concept: `pub` fields
/// Fields marked `pub` are accessible from outside this module. In Rust,
/// everything is private by default — you must opt in to visibility.
/// We make these public because the simulator and API handlers both
/// need to read/write track data.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Track {
    /// Unique identifier (e.g., "TRK-001")
    pub track_id: String,

    /// Latitude in decimal degrees (e.g., 48.107)
    pub latitude: f64,

    /// Longitude in decimal degrees (e.g., 11.613)
    pub longitude: f64,

    /// Ground speed in meters per second
    pub speed: f64,

    /// Altitude above ground level in meters
    pub altitude: f64,

    /// Heading in degrees (0 = North, 90 = East, 180 = South, 270 = West)
    pub heading: f64,

    /// Radar confidence score from 0.0 (no confidence) to 1.0 (certain)
    pub confidence: f64,

    /// Current track status
    pub status: TrackStatus,

    /// When this track was last updated
    pub last_update_timestamp: DateTime<Utc>,
}
