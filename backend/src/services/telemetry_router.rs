//! Telemetry router — shared application state and broadcast infrastructure.
//!
//! This module defines the `AppState` that is shared across all Axum handlers,
//! and `LatestTelemetry` which holds the most recent snapshot of all subsystem
//! states for the HTTP GET endpoints.

use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::{Arc, RwLock};
use tokio::sync::broadcast;

use crate::models::diagnostics::DiagnosticsState;
use crate::models::launchbox::{DoorState, LaunchboxHealth, LaunchboxState};
use crate::models::telemetry::TelemetryUpdate;
use crate::models::track::Track;
use crate::models::vehicle::{ConnectionState, SystemMode, VehicleState};
use crate::models::command::{CommandRequest, CommandResponse};
use crate::models::event::SystemEvent;
use crate::models::video::{StreamState, VideoHealthState};

/// The broadcast channel buffer size.
///
/// If a WebSocket client falls more than 64 messages behind,
/// it will receive a `Lagged` error and skip to the latest message.
const BROADCAST_CAPACITY: usize = 64;

/// The latest snapshot of all telemetry subsystems.
///
/// Updated by the simulator every tick. Read by HTTP handlers to serve
/// `GET /tracks`, `GET /vehicle`, etc.
///
/// # Rust Concept: `RwLock` (Read-Write Lock)
/// `RwLock` allows multiple concurrent readers OR one exclusive writer.
/// The simulator acquires a write lock once per second (very fast — just
/// cloning structs). HTTP handlers acquire read locks (concurrent, non-blocking).
/// This is ideal for our read-heavy, write-infrequent pattern.
#[derive(Debug, Clone)]
pub struct LatestTelemetry {
    pub tracks: Vec<Track>,
    pub vehicle: VehicleState,
    pub launchbox: LaunchboxState,
    pub video_health: VideoHealthState,
    pub diagnostics: DiagnosticsState,
    pub latest_command: Option<CommandResponse>,
    pub events: Vec<SystemEvent>,
}

impl LatestTelemetry {
    /// Create initial state with sensible defaults.
    fn default_state() -> Self {
        let now = chrono::Utc::now();
        Self {
            tracks: Vec::new(),
            vehicle: VehicleState {
                vehicle_id: "VH-001".to_string(),
                connection_state: ConnectionState::Healthy,
                mode: SystemMode::Standby,
                battery_percent: 85.0,
                latitude: 48.14,
                longitude: 11.58,
                altitude: 0.0,
                speed: 0.0,
                heading: 0.0,
                last_heartbeat: now,
            },
            launchbox: LaunchboxState {
                launchbox_id: "LB-001".to_string(),
                door_state: DoorState::Closed,
                vehicle_present: true,
                charging: true,
                health: LaunchboxHealth::Ok,
                temperature_celsius: 22.0,
                last_update: now,
            },
            video_health: VideoHealthState {
                stream_id: "STREAM-01".to_string(),
                stream_state: StreamState::Connected,
                fps: 30.0,
                latency_ms: 65.0,
                dropped_frames: 0,
                resolution: "1920x1080".to_string(),
                last_frame_timestamp: now,
            },
            diagnostics: DiagnosticsState {
                websocket_clients: 0,
                messages_sent: 0,
                avg_latency_ms: 0.0,
                max_latency_ms: 0.0,
                dropped_message_count: 0,
                event_count: 0,
                uptime_seconds: 0,
                timestamp: now,
            },
            latest_command: None,
            events: Vec::new(),
        }
    }
}

/// Shared application state, passed to all Axum handlers.
///
/// # Rust Concept: `Arc` (Atomic Reference Counting)
/// `Arc` lets multiple owners share the same data safely across threads.
/// When you clone an `Arc`, it increments a counter — the data is freed
/// when the last `Arc` is dropped. Think of it like a shared smart pointer.
#[derive(Clone)]
pub struct AppState {
    /// Sender side of the telemetry broadcast channel.
    pub telemetry_tx: broadcast::Sender<TelemetryUpdate>,

    /// Number of currently connected WebSocket clients.
    pub connected_clients: Arc<AtomicU32>,

    /// Latest telemetry snapshot for HTTP GET endpoints.
    /// Protected by an RwLock for concurrent read access.
    pub latest: Arc<RwLock<LatestTelemetry>>,

    /// Channel for sending commands from the HTTP API to the simulator loop.
    pub command_tx: tokio::sync::mpsc::Sender<(CommandRequest, tokio::sync::oneshot::Sender<CommandResponse>)>,
}

impl AppState {
    /// Create a new AppState with a fresh broadcast channel and default state.
    pub fn new() -> (Self, tokio::sync::mpsc::Receiver<(CommandRequest, tokio::sync::oneshot::Sender<CommandResponse>)>) {
        let (telemetry_tx, _) = broadcast::channel(BROADCAST_CAPACITY);
        let (command_tx, command_rx) = tokio::sync::mpsc::channel(32);

        (Self {
            telemetry_tx,
            connected_clients: Arc::new(AtomicU32::new(0)),
            latest: Arc::new(RwLock::new(LatestTelemetry::default_state())),
            command_tx,
        }, command_rx)
    }

    /// Increment connected client count. Returns the new count.
    pub fn client_connected(&self) -> u32 {
        self.connected_clients.fetch_add(1, Ordering::Relaxed) + 1
    }

    /// Decrement connected client count. Returns the new count.
    pub fn client_disconnected(&self) -> u32 {
        self.connected_clients.fetch_sub(1, Ordering::Relaxed) - 1
    }

    /// Get the current connected client count.
    pub fn client_count(&self) -> u32 {
        self.connected_clients.load(Ordering::Relaxed)
    }
}
