use axum::{Json, response::IntoResponse};
use serde::Serialize;

/// Health check response payload.
///
/// # Rust Concept: Derive macros
/// `#[derive(Serialize)]` auto-generates code to convert this struct to JSON.
/// Axum's `Json(...)` wrapper uses Serde under the hood.
///
/// # What is a health endpoint?
/// In production systems, load balancers and monitoring tools ping `/health`
/// to confirm the service is running. It's the simplest possible endpoint
/// but it proves the server is alive and responding.
#[derive(Serialize)]
struct HealthResponse {
    status: String,
    version: String,
    uptime_seconds: u64,
}

/// The start time of the server — set once at startup.
///
/// # Rust Concept: `std::sync::OnceLock`
/// `OnceLock` is a thread-safe cell that can be written to exactly once.
/// We use it to store the server start time so we can compute uptime.
/// It's safe to read from multiple threads simultaneously.
static START_TIME: std::sync::OnceLock<std::time::Instant> = std::sync::OnceLock::new();

/// Initialize the start time. Call this once from main.rs at startup.
pub fn init_start_time() {
    START_TIME.get_or_init(std::time::Instant::now);
}

/// GET /health
///
/// Returns a JSON object with the server status, version, and uptime.
///
/// # Rust Concept: `async fn` handlers
/// Axum handlers are async functions. The return type must implement
/// `IntoResponse`. `impl IntoResponse` means "any type that can become
/// an HTTP response" — Axum figures out the concrete type at compile time.
///
/// # Rust Concept: No `return` keyword needed
/// In Rust, the last expression in a function (without a semicolon) is
/// the return value. This is called "expression-oriented" syntax.
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
