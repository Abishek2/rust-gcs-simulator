//! Vehicle state model — represents the ground station vehicle's status.
//!
//! ## SAFETY BOUNDARY
//! All vehicle telemetry is simulated. No real vehicle, drone, or
//! aircraft is connected or controlled.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Vehicle communication link status.
///
/// Indicates the quality of the connection between the GCS and the vehicle.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ConnectionState {
    #[serde(rename = "HEALTHY")]
    Healthy,
    #[serde(rename = "DEGRADED")]
    Degraded,
    #[serde(rename = "LOST")]
    Lost,
}

/// System operational mode.
///
/// In Phase 3, mode transitions are driven by heuristics (track confidence,
/// connection state). Phase 4 will add a full command-driven state machine.
///
/// # Mode meanings (simulation context)
/// - **STANDBY**: System is idle, no active tracking
/// - **TRACKING**: At least one high-confidence track detected
/// - **READY**: All tracks are strong, system is fully operational
/// - **FAULT**: A system fault (e.g., lost connection)
/// - **ABORTED**: Operator-initiated abort (Phase 4)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SystemMode {
    #[serde(rename = "STANDBY")]
    Standby,
    #[serde(rename = "TRACKING")]
    Tracking,
    #[serde(rename = "READY")]
    Ready,
    #[serde(rename = "FAULT")]
    Fault,
    #[serde(rename = "ABORTED")]
    Aborted,
}

/// Current state of the ground station vehicle.
///
/// Includes position (GPS), power status, communication link quality,
/// and the current operational mode.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VehicleState {
    /// Unique vehicle identifier (e.g., "VH-001")
    pub vehicle_id: String,

    /// Communication link quality
    pub connection_state: ConnectionState,

    /// Current operational mode
    pub mode: SystemMode,

    /// Battery charge level (0.0 – 100.0 percent)
    pub battery_percent: f64,

    /// Vehicle latitude (decimal degrees)
    pub latitude: f64,

    /// Vehicle longitude (decimal degrees)
    pub longitude: f64,

    /// Vehicle altitude in meters (0 for ground stations)
    pub altitude: f64,

    /// Vehicle ground speed in m/s (0 for stationary)
    pub speed: f64,

    /// Vehicle heading in degrees
    pub heading: f64,

    /// Timestamp of last heartbeat received from vehicle
    pub last_heartbeat: DateTime<Utc>,
}
