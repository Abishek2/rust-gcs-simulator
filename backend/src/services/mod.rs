//! Services module — business logic and simulation engines.
//!
//! Each service runs as a background task or provides shared state
//! for the API handlers.

pub mod telemetry_simulator;
pub mod telemetry_router;

// Phase 3+: Uncomment as we add services
// pub mod state_machine;
// pub mod launchbox_simulator;
// pub mod video_health_simulator;
// pub mod diagnostics_service;
// pub mod replay_service;
