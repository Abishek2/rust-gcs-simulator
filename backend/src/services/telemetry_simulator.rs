//! Telemetry simulator — generates realistic-looking simulated radar tracks.
//!
//! This module spawns a background Tokio task that:
//! 1. Creates a set of initial tracks around a central point
//! 2. Every second, moves them based on heading/speed with random perturbations
//! 3. Broadcasts the updated telemetry to all connected WebSocket clients
//!
//! ## SAFETY BOUNDARY
//! All data is synthetic. No real radar, sensor, or hardware input is used.

use chrono::Utc;
use rand::Rng;
use rand::rngs::StdRng;
use rand::SeedableRng;
use std::f64::consts::PI;
use tokio::sync::broadcast;
use tokio::time::{interval, Duration};

use crate::models::track::{Track, TrackStatus};
use crate::models::telemetry::TelemetryUpdate;

/// Earth constants for coordinate math
const METERS_PER_DEGREE_LAT: f64 = 111_320.0;

/// Central point for the simulation (Munich area)
const CENTER_LAT: f64 = 48.14;
const CENTER_LNG: f64 = 11.58;

/// Create the initial set of simulated tracks.
///
/// # Rust Concept: `Vec<Track>`
/// `Vec` is Rust's growable array (like `ArrayList` in Java or `[]` in JS).
/// Unlike arrays (`[Track; 5]`) which have a fixed size known at compile time,
/// `Vec` can grow and shrink at runtime.
fn create_initial_tracks() -> Vec<Track> {
    let now = Utc::now();

    vec![
        Track {
            track_id: "TRK-001".to_string(),
            latitude: CENTER_LAT + 0.01,
            longitude: CENTER_LNG + 0.02,
            speed: 42.5,    // m/s — about 150 km/h
            altitude: 120.0,
            heading: 85.0,  // heading east
            confidence: 0.92,
            status: TrackStatus::Tracking,
            last_update_timestamp: now,
        },
        Track {
            track_id: "TRK-002".to_string(),
            latitude: CENTER_LAT - 0.015,
            longitude: CENTER_LNG - 0.01,
            speed: 28.0,
            altitude: 250.0,
            heading: 210.0, // heading south-southwest
            confidence: 0.78,
            status: TrackStatus::Tracking,
            last_update_timestamp: now,
        },
        Track {
            track_id: "TRK-003".to_string(),
            latitude: CENTER_LAT + 0.025,
            longitude: CENTER_LNG - 0.03,
            speed: 15.0,
            altitude: 80.0,
            heading: 320.0, // heading northwest
            confidence: 0.65,
            status: TrackStatus::New,
            last_update_timestamp: now,
        },
        Track {
            track_id: "TRK-004".to_string(),
            latitude: CENTER_LAT - 0.008,
            longitude: CENTER_LNG + 0.035,
            speed: 55.0,
            altitude: 180.0,
            heading: 45.0,  // heading northeast
            confidence: 0.88,
            status: TrackStatus::Tracking,
            last_update_timestamp: now,
        },
        Track {
            track_id: "TRK-005".to_string(),
            latitude: CENTER_LAT + 0.03,
            longitude: CENTER_LNG + 0.01,
            speed: 8.0,     // slow — loitering
            altitude: 60.0,
            heading: 170.0,
            confidence: 0.55,
            status: TrackStatus::New,
            last_update_timestamp: now,
        },
    ]
}

/// Update all tracks by one simulation tick (1 second).
///
/// Each track moves forward based on its heading and speed, with random
/// perturbations to heading, speed, altitude, and confidence to simulate
/// realistic radar behavior.
///
/// # Rust Concept: `&mut Vec<Track>`
/// The `&mut` means "mutable borrow" — we're borrowing the vector and
/// are allowed to modify it. Rust's borrow checker ensures no one else
/// is reading the vector while we're modifying it. This prevents data
/// races at compile time.
///
/// # Rust Concept: `impl Rng`
/// `impl Rng` means "any type that implements the Rng trait." This is
/// called an "impl trait" parameter — it's like generics but simpler
/// to write. The compiler figures out the concrete type.
fn update_tracks(tracks: &mut Vec<Track>, rng: &mut impl Rng) {
    let now = Utc::now();

    for track in tracks.iter_mut() {
        // --- Movement: advance position based on heading and speed ---
        let heading_rad = track.heading * PI / 180.0;

        // How far the track moves in 1 second at its current speed
        let delta_lat = track.speed * heading_rad.cos() / METERS_PER_DEGREE_LAT;
        let delta_lng = track.speed * heading_rad.sin()
            / (METERS_PER_DEGREE_LAT * (track.latitude * PI / 180.0).cos());

        track.latitude += delta_lat;
        track.longitude += delta_lng;

        // --- Random perturbations to simulate real radar jitter ---
        // Heading: slight drift ±5°
        track.heading += rng.random_range(-5.0..5.0_f64);
        // Keep heading in 0..360 using modular arithmetic
        track.heading = ((track.heading % 360.0) + 360.0) % 360.0;

        // Speed: slight variation ±2 m/s
        track.speed += rng.random_range(-2.0..2.0_f64);
        track.speed = track.speed.clamp(5.0, 120.0);

        // Altitude: ±5m drift
        track.altitude += rng.random_range(-5.0..5.0_f64);
        track.altitude = track.altitude.clamp(30.0, 500.0);

        // Confidence: fluctuates slightly
        track.confidence += rng.random_range(-0.03..0.03_f64);
        track.confidence = track.confidence.clamp(0.3, 1.0);

        // --- Status transitions based on confidence ---
        // Low confidence → might go STALE or LOST
        track.status = match track.confidence {
            c if c >= 0.7 => TrackStatus::Tracking,
            c if c >= 0.5 => TrackStatus::Stale,
            _ => TrackStatus::Lost,
        };

        track.last_update_timestamp = now;
    }

    // Keep tracks from drifting too far — wrap them back toward the center
    for track in tracks.iter_mut() {
        let dist_lat = (track.latitude - CENTER_LAT).abs();
        let dist_lng = (track.longitude - CENTER_LNG).abs();

        if dist_lat > 0.1 || dist_lng > 0.1 {
            // Turn the track back toward center
            let to_center_lat = CENTER_LAT - track.latitude;
            let to_center_lng = CENTER_LNG - track.longitude;
            track.heading = (to_center_lng.atan2(to_center_lat) * 180.0 / PI + 360.0) % 360.0;
            tracing::debug!(
                track_id = %track.track_id,
                heading = %track.heading,
                "track drifted far — turning back toward center"
            );
        }
    }
}

/// Start the telemetry simulation loop.
///
/// This function spawns a Tokio task that runs forever, generating
/// telemetry updates every second and broadcasting them to all
/// connected WebSocket clients.
///
/// # Rust Concept: `tokio::spawn`
/// `tokio::spawn` creates a new async task — like launching a goroutine
/// in Go or a thread in other languages, but lighter weight. Tokio tasks
/// are cooperatively scheduled on a thread pool. They're ideal for I/O
/// work like timers and network calls.
///
/// # Rust Concept: `broadcast::Sender`
/// The broadcast channel is a multi-producer, multi-consumer channel.
/// The simulator sends updates, and each WebSocket client subscribes
/// to receive them. If no clients are connected, the send is a no-op.
pub fn start_simulator(tx: broadcast::Sender<TelemetryUpdate>) {
    tokio::spawn(async move {
        let mut tracks = create_initial_tracks();
        // # Rust Concept: `Send` trait and async tasks
        // `tokio::spawn` requires the future to be `Send` (safe to move
        // between threads). `rand::rng()` returns `ThreadRng` which uses
        // `Rc` internally — `Rc` is NOT `Send`. So we use `StdRng` instead,
        // which is an owned, thread-safe RNG. This is a very common gotcha
        // in async Rust: anything held across an `.await` must be `Send`.
        let mut rng = StdRng::from_os_rng();
        let mut tick_interval = interval(Duration::from_secs(1));
        let mut tick_count: u64 = 0;

        tracing::info!(
            track_count = tracks.len(),
            "telemetry simulator started — generating updates every 1s"
        );

        loop {
            tick_interval.tick().await;
            tick_count += 1;

            // Evolve the simulation by one step
            update_tracks(&mut tracks, &mut rng);

            // Build the telemetry message
            let update = TelemetryUpdate::new(tracks.clone());

            // Broadcast to all subscribers (connected WebSocket clients)
            // If no one is listening, `send` returns Err — that's fine.
            match tx.send(update) {
                Ok(receivers) => {
                    if tick_count % 10 == 0 {
                        // Log every 10th tick to avoid log spam
                        tracing::info!(
                            tick = tick_count,
                            receivers = receivers,
                            track_count = tracks.len(),
                            "telemetry broadcast"
                        );
                    }
                }
                Err(_) => {
                    // No subscribers — normal when no clients are connected
                    if tick_count % 30 == 0 {
                        tracing::debug!(tick = tick_count, "no WebSocket subscribers");
                    }
                }
            }
        }
    });
}
