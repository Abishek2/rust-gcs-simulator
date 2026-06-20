//! Launchbox simulator — generates realistic launchbox state changes.
//!
//! Simulates door open/close cycles, vehicle presence detection,
//! charging logic, temperature drift, and health status.
//!
//! ## SAFETY BOUNDARY
//! No real launchbox hardware is controlled. All states are synthetic.

use chrono::Utc;
use rand::Rng;

use crate::models::launchbox::{DoorState, LaunchboxHealth, LaunchboxState};

/// Simulates a launchbox unit's behavior over time.
///
/// # Rust Concept: Encapsulation with `pub` methods
/// The `state` field is private — external code can only read it via
/// the `state()` getter. This ensures only the simulator modifies the
/// launchbox state, preventing accidental corruption from other modules.
pub struct LaunchboxSimulator {
    state: LaunchboxState,
    /// Counts ticks since last door toggle (used for timing transitions)
    ticks_since_door_change: u32,
}

impl LaunchboxSimulator {
    /// Create a new simulator with default initial state.
    pub fn new() -> Self {
        Self {
            state: LaunchboxState {
                launchbox_id: "LB-001".to_string(),
                door_state: DoorState::Closed,
                vehicle_present: true,
                charging: true,
                health: LaunchboxHealth::Ok,
                temperature_celsius: 22.0,
                last_update: Utc::now(),
            },
            ticks_since_door_change: 0,
        }
    }

    /// Get a reference to the current launchbox state.
    pub fn state(&self) -> &LaunchboxState {
        &self.state
    }

    /// Advance the simulation by one tick (1 second).
    ///
    /// # Simulation behavior
    /// - **Door**: toggles every 30–90 seconds (random interval)
    /// - **Vehicle present**: true when door is CLOSED, false briefly after door opens
    /// - **Charging**: only when vehicle is present AND door is CLOSED
    /// - **Temperature**: drifts ±0.3°C per tick, clamped 18–45°C
    /// - **Health**: derived from temperature (>40°C = FAULT, >35°C = WARNING)
    pub fn tick(&mut self, rng: &mut impl Rng) {
        self.ticks_since_door_change += 1;

        // --- Door toggle: every 30–90 seconds ---
        let toggle_interval = rng.random_range(30_u32..90);
        if self.ticks_since_door_change >= toggle_interval {
            self.state.door_state = match self.state.door_state {
                DoorState::Closed => {
                    tracing::debug!(launchbox = %self.state.launchbox_id, "door opening");
                    DoorState::Open
                }
                DoorState::Open => {
                    tracing::debug!(launchbox = %self.state.launchbox_id, "door closing");
                    DoorState::Closed
                }
            };
            self.ticks_since_door_change = 0;
        }

        // --- Vehicle presence: linked to door state ---
        // Vehicle is present when door is closed; leaves shortly after door opens
        self.state.vehicle_present = match self.state.door_state {
            DoorState::Closed => true,
            DoorState::Open => {
                // Vehicle departs 5 seconds after door opens
                self.ticks_since_door_change < 5
            }
        };

        // --- Charging: only when vehicle is docked with door closed ---
        self.state.charging = self.state.vehicle_present
            && self.state.door_state == DoorState::Closed;

        // --- Temperature: slow drift with occasional spikes ---
        let temp_delta = rng.random_range(-0.3_f64..0.3);
        self.state.temperature_celsius += temp_delta;
        // Rare temperature spike (0.5% chance per tick)
        if rng.random_range(0_u32..200) == 0 {
            self.state.temperature_celsius += rng.random_range(5.0_f64..12.0);
            tracing::warn!(
                launchbox = %self.state.launchbox_id,
                temp = %self.state.temperature_celsius,
                "temperature spike detected"
            );
        }
        self.state.temperature_celsius = self.state.temperature_celsius.clamp(18.0, 45.0);

        // --- Health: derived from temperature ---
        self.state.health = if self.state.temperature_celsius > 40.0 {
            LaunchboxHealth::Fault
        } else if self.state.temperature_celsius > 35.0 {
            LaunchboxHealth::Warning
        } else {
            LaunchboxHealth::Ok
        };

        self.state.last_update = Utc::now();
    }
}
