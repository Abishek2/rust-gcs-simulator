//! Models module — all data structures live here.
//!
//! Each sub-module defines the typed structs and enums for one domain concept.
//! These types are used throughout the codebase and serialized to JSON for
//! the frontend via Serde.

pub mod track;
pub mod telemetry;
pub mod vehicle;
pub mod launchbox;
pub mod video;
pub mod diagnostics;

// Phase 4+: Uncomment as we add models
pub mod command;
pub mod event;
