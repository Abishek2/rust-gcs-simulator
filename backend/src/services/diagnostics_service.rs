//! Diagnostics service — tracks backend performance metrics.
//!
//! Captures real metrics like message counts and tick processing times,
//! and provides snapshots for the diagnostics endpoint and WebSocket payload.

use std::collections::VecDeque;
use std::time::{Duration, Instant};

use chrono::Utc;

use crate::models::diagnostics::DiagnosticsState;

/// Rolling window size for latency averaging.
/// Keeps the last 60 measurements (1 minute at 1 tick/sec).
const LATENCY_WINDOW: usize = 60;

/// Tracks backend diagnostics over time.
///
/// # Rust Concept: `VecDeque` (double-ended queue)
/// `VecDeque` is like a `Vec` but efficient for push/pop from both ends.
/// We use it as a fixed-size rolling window: push new values to the back,
/// pop old values from the front when the window is full. This gives us
/// a clean "last N measurements" average without storing everything.
pub struct DiagnosticsTracker {
    /// Total messages successfully broadcast
    messages_sent: u64,
    /// Total messages dropped (no subscribers)
    dropped_message_count: u64,
    /// Total events recorded (for Phase 5 replay)
    event_count: u64,
    /// Rolling window of tick processing times
    tick_latencies: VecDeque<Duration>,
    /// Maximum latency ever observed
    max_latency: Duration,
    /// When the tracker was created (for uptime calculation)
    start_time: Instant,
}

impl DiagnosticsTracker {
    /// Create a new diagnostics tracker.
    pub fn new() -> Self {
        Self {
            messages_sent: 0,
            dropped_message_count: 0,
            event_count: 0,
            tick_latencies: VecDeque::with_capacity(LATENCY_WINDOW),
            max_latency: Duration::ZERO,
            start_time: Instant::now(),
        }
    }

    /// Record the processing time for one simulation tick.
    ///
    /// This is called after all subsystems have been updated but before
    /// the broadcast, so it measures pure simulation processing time.
    pub fn record_tick_latency(&mut self, duration: Duration) {
        // Maintain rolling window
        if self.tick_latencies.len() >= LATENCY_WINDOW {
            self.tick_latencies.pop_front();
        }
        self.tick_latencies.push_back(duration);

        // Track all-time max
        if duration > self.max_latency {
            self.max_latency = duration;
        }
    }

    /// Record a successful broadcast (message reached N subscribers).
    pub fn record_broadcast(&mut self, _receiver_count: usize) {
        self.messages_sent += 1;
    }

    /// Record a dropped message (no subscribers were listening).
    pub fn record_drop(&mut self) {
        self.messages_sent += 1; // Still count it as "sent" (attempted)
        self.dropped_message_count += 1;
    }

    /// Increment the event counter (used by Phase 5 replay system).
    #[allow(dead_code)]
    pub fn record_event(&mut self) {
        self.event_count += 1;
    }

    /// Create a snapshot of current diagnostics for the API.
    ///
    /// # Parameters
    /// - `websocket_clients`: current connected client count (from AppState)
    pub fn snapshot(&self, websocket_clients: u32) -> DiagnosticsState {
        // Calculate average latency from rolling window
        let avg_latency_ms = if self.tick_latencies.is_empty() {
            0.0
        } else {
            let total: Duration = self.tick_latencies.iter().sum();
            total.as_secs_f64() * 1000.0 / self.tick_latencies.len() as f64
        };

        DiagnosticsState {
            websocket_clients,
            messages_sent: self.messages_sent,
            avg_latency_ms: (avg_latency_ms * 100.0).round() / 100.0, // 2 decimal places
            max_latency_ms: (self.max_latency.as_secs_f64() * 1000.0 * 100.0).round() / 100.0,
            dropped_message_count: self.dropped_message_count,
            event_count: self.event_count,
            uptime_seconds: self.start_time.elapsed().as_secs(),
            timestamp: Utc::now(),
        }
    }
}
