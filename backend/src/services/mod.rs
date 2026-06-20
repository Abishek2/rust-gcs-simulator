//! Services module — business logic and simulation engines.
//!
//! Each service either runs as a background task (simulators) or provides
//! shared state and utilities for the API handlers.

pub mod telemetry_simulator;
pub mod telemetry_router;
pub mod launchbox_simulator;
pub mod video_health_simulator;
pub mod diagnostics_service;

// Phase 4+: Uncomment as we add services
pub mod state_machine;
// pub mod replay_service;
