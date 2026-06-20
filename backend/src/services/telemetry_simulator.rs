//! Telemetry simulator — the main simulation engine.
//!
//! Spawns a background Tokio task that runs all subsystem simulations
//! (tracks, vehicle, launchbox, video, diagnostics) and broadcasts
//! the combined telemetry update every second.
//!
//! ## SAFETY BOUNDARY
//! All data is synthetic. No real radar, vehicle, camera, or hardware
//! input is used. This is a portfolio demonstration only.

use chrono::Utc;
use rand::rngs::StdRng;
use rand::Rng;
use rand::SeedableRng;
use std::f64::consts::PI;
use std::time::Instant;
use tokio::time::{interval, Duration};

use crate::models::telemetry::TelemetryUpdate;
use crate::models::track::{Track, TrackStatus};
use crate::models::vehicle::{ConnectionState, SystemMode, VehicleState};
use crate::services::diagnostics_service::DiagnosticsTracker;
use crate::services::launchbox_simulator::LaunchboxSimulator;
use crate::services::telemetry_router::{AppState, LatestTelemetry};
use crate::services::video_health_simulator::VideoHealthSimulator;

// ═══════════════════════════════════════════════════════════════════
//  Constants
// ═══════════════════════════════════════════════════════════════════

const METERS_PER_DEGREE_LAT: f64 = 111_320.0;
const CENTER_LAT: f64 = 48.14;
const CENTER_LNG: f64 = 11.58;

// ═══════════════════════════════════════════════════════════════════
//  Track simulation (carried over from Phase 2)
// ═══════════════════════════════════════════════════════════════════

fn create_initial_tracks() -> Vec<Track> {
    let now = Utc::now();
    vec![
        Track {
            track_id: "TRK-001".to_string(),
            latitude: CENTER_LAT + 0.01,
            longitude: CENTER_LNG + 0.02,
            speed: 42.5,
            altitude: 120.0,
            heading: 85.0,
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
            heading: 210.0,
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
            heading: 320.0,
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
            heading: 45.0,
            confidence: 0.88,
            status: TrackStatus::Tracking,
            last_update_timestamp: now,
        },
        Track {
            track_id: "TRK-005".to_string(),
            latitude: CENTER_LAT + 0.03,
            longitude: CENTER_LNG + 0.01,
            speed: 8.0,
            altitude: 60.0,
            heading: 170.0,
            confidence: 0.55,
            status: TrackStatus::New,
            last_update_timestamp: now,
        },
    ]
}

fn update_tracks(tracks: &mut Vec<Track>, rng: &mut impl Rng) {
    let now = Utc::now();

    for track in tracks.iter_mut() {
        let heading_rad = track.heading * PI / 180.0;
        let delta_lat = track.speed * heading_rad.cos() / METERS_PER_DEGREE_LAT;
        let delta_lng = track.speed * heading_rad.sin()
            / (METERS_PER_DEGREE_LAT * (track.latitude * PI / 180.0).cos());

        track.latitude += delta_lat;
        track.longitude += delta_lng;

        track.heading += rng.random_range(-5.0..5.0_f64);
        track.heading = ((track.heading % 360.0) + 360.0) % 360.0;

        track.speed += rng.random_range(-2.0..2.0_f64);
        track.speed = track.speed.clamp(5.0, 120.0);

        track.altitude += rng.random_range(-5.0..5.0_f64);
        track.altitude = track.altitude.clamp(30.0, 500.0);

        track.confidence += rng.random_range(-0.03..0.03_f64);
        track.confidence = track.confidence.clamp(0.3, 1.0);

        track.status = match track.confidence {
            c if c >= 0.7 => TrackStatus::Tracking,
            c if c >= 0.5 => TrackStatus::Stale,
            _ => TrackStatus::Lost,
        };

        track.last_update_timestamp = now;
    }

    // Geo-fence: turn back toward center when drifting too far
    for track in tracks.iter_mut() {
        let dist_lat = (track.latitude - CENTER_LAT).abs();
        let dist_lng = (track.longitude - CENTER_LNG).abs();

        if dist_lat > 0.1 || dist_lng > 0.1 {
            let to_center_lat = CENTER_LAT - track.latitude;
            let to_center_lng = CENTER_LNG - track.longitude;
            track.heading = (to_center_lng.atan2(to_center_lat) * 180.0 / PI + 360.0) % 360.0;
            tracing::debug!(
                track_id = %track.track_id,
                "track drifted far — turning back toward center"
            );
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
//  Vehicle simulation (Phase 3)
// ═══════════════════════════════════════════════════════════════════

fn create_initial_vehicle() -> VehicleState {
    VehicleState {
        vehicle_id: "VH-001".to_string(),
        connection_state: ConnectionState::Healthy,
        mode: SystemMode::Standby,
        battery_percent: 85.0,
        latitude: CENTER_LAT,
        longitude: CENTER_LNG,
        altitude: 0.0,
        speed: 0.0,
        heading: 0.0,
        last_heartbeat: Utc::now(),
    }
}

/// Update vehicle state for one tick.
///
/// # Simulation behavior
/// - **Battery**: slowly drains ~0.01–0.03% per second; occasional charge boost (1%)
/// - **Connection**: probabilistic transitions between HEALTHY/DEGRADED/LOST
/// - **Mode**: heuristic-based on track confidence and connection state
///   (Phase 4 replaces this with a command-driven state machine)
/// - **Position**: stationary with slight GPS jitter for realism
fn update_vehicle(vehicle: &mut VehicleState, _tracks: &[Track], rng: &mut impl Rng) {
    // --- Battery drain ---
    vehicle.battery_percent -= rng.random_range(0.01_f64..0.03);
    // Rare charge boost (simulates charging cycle — 1% chance per tick)
    if rng.random_range(0_u32..100) == 0 {
        vehicle.battery_percent = (vehicle.battery_percent + 8.0).min(100.0);
        tracing::debug!(
            battery = %vehicle.battery_percent,
            "vehicle battery charge boost"
        );
    }
    vehicle.battery_percent = vehicle.battery_percent.clamp(0.0, 100.0);

    // --- Connection state transitions ---
    let roll: f64 = rng.random_range(0.0_f64..1.0);
    vehicle.connection_state = match &vehicle.connection_state {
        ConnectionState::Healthy => {
            if roll < 0.03 {
                tracing::warn!("vehicle connection degraded");
                ConnectionState::Degraded
            } else {
                ConnectionState::Healthy
            }
        }
        ConnectionState::Degraded => {
            if roll < 0.40 {
                tracing::info!("vehicle connection recovered");
                ConnectionState::Healthy
            } else if roll > 0.97 {
                tracing::error!("vehicle connection lost");
                ConnectionState::Lost
            } else {
                ConnectionState::Degraded
            }
        }
        ConnectionState::Lost => {
            if roll < 0.15 {
                tracing::info!("vehicle connection recovering (degraded)");
                ConnectionState::Degraded
            } else {
                ConnectionState::Lost
            }
        }
    };

    // --- Mode is now fully managed by the State Machine ---

    // --- Position: stationary with GPS jitter ---
    vehicle.latitude = CENTER_LAT + rng.random_range(-0.0001_f64..0.0001);
    vehicle.longitude = CENTER_LNG + rng.random_range(-0.0001_f64..0.0001);

    vehicle.last_heartbeat = Utc::now();
}

// ═══════════════════════════════════════════════════════════════════
//  Main simulation loop
// ═══════════════════════════════════════════════════════════════════

/// Start the telemetry simulation loop.
///
/// Spawns a Tokio task that runs all subsystem simulations and broadcasts
/// the combined telemetry update every second. Also updates the shared
/// snapshot for HTTP GET endpoints.
pub fn start_simulator(
    state: AppState,
    mut command_rx: tokio::sync::mpsc::Receiver<(
        crate::models::command::CommandRequest,
        tokio::sync::oneshot::Sender<crate::models::command::CommandResponse>,
    )>,
) {
    tokio::spawn(async move {
        // --- Initialize all subsystems ---
        let mut tracks = create_initial_tracks();
        let mut vehicle = create_initial_vehicle();
        let mut launchbox_sim = LaunchboxSimulator::new();
        let mut video_sim = VideoHealthSimulator::new();
        let mut diagnostics = DiagnosticsTracker::new();
        let mut state_machine = crate::services::state_machine::StateMachine::new();
        let mut events_buffer = std::collections::VecDeque::new();
        let mut latest_command = None;

        // Initialize event count from DB
        if let Ok(count) = crate::db::get_event_count(&state.pool).await {
            diagnostics.event_count = count;
        }

        let mut rng = StdRng::from_os_rng();
        let mut tick_interval = interval(Duration::from_secs(1));
        let mut tick_count: u64 = 0;

        tracing::info!(
            track_count = tracks.len(),
            "telemetry simulator started — all subsystems active"
        );

        loop {
            tick_interval.tick().await;
            tick_count += 1;
            let tick_start = Instant::now();

            // --- Update all subsystems ---
            update_tracks(&mut tracks, &mut rng);
            update_vehicle(&mut vehicle, &tracks, &mut rng);
            launchbox_sim.tick(&mut rng);
            video_sim.tick(&mut rng);

            // --- Process pending commands ---
            while let Ok((request, reply)) = command_rx.try_recv() {
                let response = state_machine.accept_command(request.clone());
                
                // Add event
                let msg = if response.status == crate::models::command::CommandStatus::AckReceived {
                    format!("Command accepted: {:?}", request.command_type)
                } else {
                    format!("Command rejected: {}", response.message)
                };
                let event = crate::models::event::SystemEvent::new(
                    state.session_id.clone(),
                    "COMMAND",
                    &request.requested_by,
                    "INFO",
                    msg,
                    Some(serde_json::to_value(&request).unwrap_or(serde_json::Value::Null)),
                );
                events_buffer.push_back(event.clone());
                let pool_clone = state.pool.clone();
                tokio::spawn(async move {
                    let _ = crate::db::persist_event(&pool_clone, &event).await;
                });
                if events_buffer.len() > 50 { events_buffer.pop_front(); }
                diagnostics.record_event();

                latest_command = Some(response.clone());
                let _ = reply.send(response);
            }

            // --- Advance state machine ---
            if let Some(executed) = state_machine.tick() {
                let msg = format!("Command {:?} finished with status {:?}", executed.command_type, executed.status);
                let event = crate::models::event::SystemEvent::new(
                    state.session_id.clone(),
                    "STATE_TRANSITION",
                    "System",
                    "INFO",
                    msg,
                    Some(serde_json::to_value(&executed).unwrap_or(serde_json::Value::Null)),
                );
                events_buffer.push_back(event.clone());
                let pool_clone = state.pool.clone();
                tokio::spawn(async move {
                    let _ = crate::db::persist_event(&pool_clone, &event).await;
                });
                if events_buffer.len() > 50 { events_buffer.pop_front(); }
                diagnostics.record_event();
                
                // Update latest command response if it matches
                if let Some(latest) = &mut latest_command {
                    if latest.command_id == executed.command_id {
                        latest.status = executed.status.clone();
                        latest.new_mode = format!("{:?}", state_machine.current_mode).to_uppercase();
                        if executed.status == crate::models::command::CommandStatus::Executed {
                            latest.message = "Command executed successfully.".to_string();
                        } else {
                            latest.message = "Command timed out.".to_string();
                        }
                    }
                }
            }
            vehicle.mode = state_machine.current_mode.clone();

            // --- Measure tick processing time ---
            let tick_duration = tick_start.elapsed();
            diagnostics.record_tick_latency(tick_duration);

            // --- Build diagnostics snapshot ---
            let diag = diagnostics.snapshot(state.client_count());

            // --- Build full telemetry update ---
            let events_vec: Vec<_> = events_buffer.iter().cloned().collect();
            let update = TelemetryUpdate::new(
                tracks.clone(),
                vehicle.clone(),
                launchbox_sim.state().clone(),
                video_sim.state().clone(),
                diag.clone(),
                latest_command.clone(),
                events_vec.clone(),
            );

            // --- Update shared state for HTTP endpoints ---
            if let Ok(mut latest) = state.latest.write() {
                *latest = LatestTelemetry {
                    tracks: tracks.clone(),
                    vehicle: vehicle.clone(),
                    launchbox: launchbox_sim.state().clone(),
                    video_health: video_sim.state().clone(),
                    diagnostics: diag,
                    latest_command: latest_command.clone(),
                    events: events_vec,
                };
            }

            // --- Broadcast to WebSocket clients ---
            match state.telemetry_tx.send(update) {
                Ok(receivers) => {
                    diagnostics.record_broadcast(receivers);
                    if tick_count % 10 == 0 {
                        tracing::info!(
                            tick = tick_count,
                            receivers = receivers,
                            mode = ?vehicle.mode,
                            battery = format!("{:.1}%", vehicle.battery_percent),
                            "telemetry broadcast"
                        );
                    }
                }
                Err(_) => {
                    diagnostics.record_drop();
                    if tick_count % 30 == 0 {
                        tracing::debug!(tick = tick_count, "no WebSocket subscribers");
                    }
                }
            }
        }
    });
}
