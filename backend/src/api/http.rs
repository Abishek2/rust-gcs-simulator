use axum::{
    extract::State,
    response::IntoResponse,
    Json,
};
use serde::Serialize;

use crate::services::telemetry_router::AppState;

// ═══════════════════════════════════════════════════════════════════
//  GET /health  (Phase 1)
// ═══════════════════════════════════════════════════════════════════

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    version: String,
    uptime_seconds: u64,
}

static START_TIME: std::sync::OnceLock<std::time::Instant> = std::sync::OnceLock::new();

pub fn init_start_time() {
    START_TIME.get_or_init(std::time::Instant::now);
}

/// GET /health — server health check.
pub async fn health_check() -> impl IntoResponse {
    let uptime = START_TIME
        .get()
        .map(|t| t.elapsed().as_secs())
        .unwrap_or(0);

    tracing::info!(uptime_seconds = uptime, "health check requested");

    Json(HealthResponse {
        status: "ok".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        uptime_seconds: uptime,
    })
}

// ═══════════════════════════════════════════════════════════════════
//  GET /tracks  (Phase 3)
// ═══════════════════════════════════════════════════════════════════

/// GET /tracks — returns the latest radar track snapshot.
///
/// # Rust Concept: `State` extractor
/// `State(state)` extracts the shared `AppState` from the Axum router.
/// We then acquire a read lock on `latest` to get the current tracks.
/// Multiple HTTP requests can read simultaneously without blocking.
pub async fn get_tracks(State(state): State<AppState>) -> impl IntoResponse {
    let latest = state.latest.read().expect("latest telemetry lock poisoned");
    Json(serde_json::json!({
        "tracks": latest.tracks,
        "count": latest.tracks.len(),
        "timestamp": chrono::Utc::now(),
    }))
}

// ═══════════════════════════════════════════════════════════════════
//  GET /vehicle  (Phase 3)
// ═══════════════════════════════════════════════════════════════════

/// GET /vehicle — returns the current simulated vehicle state.
pub async fn get_vehicle(State(state): State<AppState>) -> impl IntoResponse {
    let latest = state.latest.read().expect("latest telemetry lock poisoned");
    Json(latest.vehicle.clone())
}

// ═══════════════════════════════════════════════════════════════════
//  GET /launchbox  (Phase 3)
// ═══════════════════════════════════════════════════════════════════

/// GET /launchbox — returns the current simulated launchbox state.
pub async fn get_launchbox(State(state): State<AppState>) -> impl IntoResponse {
    let latest = state.latest.read().expect("latest telemetry lock poisoned");
    Json(latest.launchbox.clone())
}

// ═══════════════════════════════════════════════════════════════════
//  GET /video-health  (Phase 3)
// ═══════════════════════════════════════════════════════════════════

/// GET /video-health — returns the current simulated video stream health.
pub async fn get_video_health(State(state): State<AppState>) -> impl IntoResponse {
    let latest = state.latest.read().expect("latest telemetry lock poisoned");
    Json(latest.video_health.clone())
}

// ═══════════════════════════════════════════════════════════════════
//  GET /diagnostics  (Phase 3)
// ═══════════════════════════════════════════════════════════════════

/// GET /diagnostics — returns backend diagnostics and performance metrics.
pub async fn get_diagnostics(State(state): State<AppState>) -> impl IntoResponse {
    let latest = state.latest.read().expect("latest telemetry lock poisoned");
    Json(latest.diagnostics.clone())
}

// ═══════════════════════════════════════════════════════════════════
//  POST /commands  (Phase 4)
// ═══════════════════════════════════════════════════════════════════

/// POST /commands — submits a command to the state machine.
pub async fn post_command(
    State(state): State<AppState>,
    Json(payload): Json<crate::models::command::CommandRequest>,
) -> impl IntoResponse {
    let (tx, rx) = tokio::sync::oneshot::channel();
    
    // Send to simulator loop
    if state.command_tx.send((payload, tx)).await.is_err() {
        return (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::models::command::CommandResponse {
                command_id: "".to_string(),
                status: crate::models::command::CommandStatus::Rejected,
                message: "Failed to send command to simulator".to_string(),
            }),
        ).into_response();
    }

    // Wait for initial simulator response
    match rx.await {
        Ok(response) => (axum::http::StatusCode::ACCEPTED, Json(response)).into_response(),
        Err(_) => (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::models::command::CommandResponse {
                command_id: "".to_string(),
                status: crate::models::command::CommandStatus::Rejected,
                message: "Simulator failed to process command".to_string(),
            }),
        ).into_response(),
    }
}
