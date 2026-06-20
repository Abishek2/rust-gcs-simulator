//! Video health simulator — generates realistic video stream metrics.
//!
//! Simulates a video feed with state transitions between CONNECTED,
//! RECONNECTING, and LOST, along with FPS, latency, and dropped frame metrics.
//!
//! ## SAFETY BOUNDARY
//! No real video stream or camera hardware is connected.

use chrono::Utc;
use rand::Rng;

use crate::models::video::{StreamState, VideoHealthState};

/// Simulates video stream health over time.
///
/// Uses a state machine with duration tracking: each state lasts for
/// a certain number of ticks before transitioning. This creates
/// realistic-looking periods of stability and instability.
pub struct VideoHealthSimulator {
    state: VideoHealthState,
    /// How many ticks the current stream_state has been active
    state_duration: u32,
    /// How long the current state should last before transitioning
    state_target_duration: u32,
}

impl VideoHealthSimulator {
    /// Create a new simulator starting in CONNECTED state.
    pub fn new() -> Self {
        Self {
            state: VideoHealthState {
                stream_id: "STREAM-01".to_string(),
                stream_state: StreamState::Connected,
                fps: 30.0,
                latency_ms: 65.0,
                dropped_frames: 0,
                resolution: "1920x1080".to_string(),
                last_frame_timestamp: Utc::now(),
            },
            state_duration: 0,
            state_target_duration: 60, // Stay connected for ~60 ticks initially
        }
    }

    /// Get a reference to the current video health state.
    pub fn state(&self) -> &VideoHealthState {
        &self.state
    }

    /// Advance the simulation by one tick (1 second).
    ///
    /// # State machine
    /// ```text
    /// CONNECTED ──(2% per tick)──▶ RECONNECTING
    ///     ▲                            │
    ///     │                      ┌─────┴─────┐
    ///     │                  (90%)         (10%)
    ///  (after              back to         drops
    ///  3-10s)            CONNECTED        to LOST
    ///     │                                  │
    ///     └──────── LOST ◀───────────────────┘
    ///              (recovers after 5-15s)
    /// ```
    pub fn tick(&mut self, rng: &mut impl Rng) {
        self.state_duration += 1;

        match self.state.stream_state {
            StreamState::Connected => {
                // Good stream metrics with slight jitter
                self.state.fps = 30.0 + rng.random_range(-1.5_f64..1.5);
                self.state.fps = self.state.fps.clamp(0.0, 60.0);

                self.state.latency_ms = 65.0 + rng.random_range(-15.0_f64..30.0);
                self.state.latency_ms = self.state.latency_ms.clamp(20.0, 200.0);

                // Occasional frame drops (0-1 per tick)
                if rng.random_range(0_u32..3) == 0 {
                    self.state.dropped_frames += 1;
                }

                self.state.last_frame_timestamp = Utc::now();

                // Transition: 2% chance per tick to start reconnecting
                if self.state_duration > 10 && rng.random_range(0_u32..50) == 0 {
                    self.transition_to(StreamState::Reconnecting, rng.random_range(3..10));
                    tracing::warn!(
                        stream = %self.state.stream_id,
                        "video stream degraded — reconnecting"
                    );
                }
            }

            StreamState::Reconnecting => {
                // Degraded metrics during reconnection
                self.state.fps = 15.0 + rng.random_range(-5.0_f64..8.0);
                self.state.fps = self.state.fps.clamp(0.0, 30.0);

                self.state.latency_ms = 300.0 + rng.random_range(-50.0_f64..200.0);
                self.state.latency_ms = self.state.latency_ms.clamp(100.0, 800.0);

                // More frame drops during reconnection
                self.state.dropped_frames += rng.random_range(2_u64..8);

                // After target duration, transition
                if self.state_duration >= self.state_target_duration {
                    if rng.random_range(0_u32..10) == 0 {
                        // 10% chance: drop to LOST
                        self.transition_to(StreamState::Lost, rng.random_range(5..15));
                        tracing::error!(
                            stream = %self.state.stream_id,
                            "video stream lost"
                        );
                    } else {
                        // 90% chance: recover to CONNECTED
                        self.transition_to(StreamState::Connected, rng.random_range(30..90));
                        tracing::info!(
                            stream = %self.state.stream_id,
                            "video stream recovered"
                        );
                    }
                }
            }

            StreamState::Lost => {
                // No signal
                self.state.fps = 0.0;
                self.state.latency_ms = 0.0;
                // No new frame drops when fully lost

                // After target duration, attempt reconnection
                if self.state_duration >= self.state_target_duration {
                    self.transition_to(StreamState::Reconnecting, rng.random_range(3..10));
                    tracing::info!(
                        stream = %self.state.stream_id,
                        "video stream attempting reconnection"
                    );
                }
            }
        }
    }

    /// Transition to a new stream state with a target duration.
    fn transition_to(&mut self, new_state: StreamState, duration: u32) {
        self.state.stream_state = new_state;
        self.state_duration = 0;
        self.state_target_duration = duration;
    }
}
