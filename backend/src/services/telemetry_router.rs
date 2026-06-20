//! Telemetry router — shared application state and broadcast infrastructure.
//!
//! This module defines the `AppState` that is shared across all Axum handlers.
//! It holds the broadcast channel sender so any handler can subscribe to
//! real-time telemetry updates.

use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Arc;
use tokio::sync::broadcast;

use crate::models::telemetry::TelemetryUpdate;

/// The broadcast channel buffer size.
///
/// If a WebSocket client falls more than 64 messages behind,
/// it will receive a `Lagged` error and skip to the latest message.
/// This prevents slow clients from blocking the whole system.
const BROADCAST_CAPACITY: usize = 64;

/// Shared application state, passed to all Axum handlers.
///
/// # Rust Concept: `Arc` (Atomic Reference Counting)
/// `Arc` lets multiple owners share the same data safely across threads.
/// When you clone an `Arc`, it increments a counter — the data is freed
/// when the last `Arc` is dropped. Think of it like a shared smart pointer.
///
/// # Rust Concept: `AtomicU32`
/// An atomic integer that can be safely incremented/decremented from
/// multiple threads without a mutex. We use it to track connected clients.
///
/// # Rust Concept: `#[derive(Clone)]`
/// Axum requires `State` types to implement `Clone`. Since `Arc` and
/// `broadcast::Sender` are both cheap to clone (they just increment
/// a reference count), cloning `AppState` is very fast.
#[derive(Clone)]
pub struct AppState {
    /// Sender side of the telemetry broadcast channel.
    /// Handlers call `.subscribe()` to get a `Receiver`.
    pub telemetry_tx: broadcast::Sender<TelemetryUpdate>,

    /// Number of currently connected WebSocket clients.
    /// Wrapped in `Arc` so all clones of AppState share the same counter.
    pub connected_clients: Arc<AtomicU32>,
}

impl AppState {
    /// Create a new AppState with a fresh broadcast channel.
    pub fn new() -> Self {
        let (telemetry_tx, _) = broadcast::channel(BROADCAST_CAPACITY);

        Self {
            telemetry_tx,
            connected_clients: Arc::new(AtomicU32::new(0)),
        }
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
