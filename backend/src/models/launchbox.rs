//! Launchbox state model — represents a vehicle housing/charging station.
//!
//! ## SAFETY BOUNDARY
//! Simulated launchbox state only. No real hardware, doors, or
//! charging systems are connected.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Physical door state of the launchbox enclosure.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DoorState {
    #[serde(rename = "OPEN")]
    Open,
    #[serde(rename = "CLOSED")]
    Closed,
}

/// Overall health status of the launchbox hardware.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum LaunchboxHealth {
    #[serde(rename = "OK")]
    Ok,
    #[serde(rename = "WARNING")]
    Warning,
    #[serde(rename = "FAULT")]
    Fault,
}

/// Current state of a launchbox unit.
///
/// A launchbox is a housing/charging station for the vehicle.
/// It has a door (open/closed), can detect whether the vehicle
/// is present, and monitors temperature and charging status.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LaunchboxState {
    /// Unique launchbox identifier (e.g., "LB-001")
    pub launchbox_id: String,

    /// Current door position
    pub door_state: DoorState,

    /// Whether the vehicle is physically present in the launchbox
    pub vehicle_present: bool,

    /// Whether the vehicle is currently being charged
    pub charging: bool,

    /// Overall launchbox health
    pub health: LaunchboxHealth,

    /// Internal temperature in degrees Celsius
    pub temperature_celsius: f64,

    /// When this state was last updated
    pub last_update: DateTime<Utc>,
}
