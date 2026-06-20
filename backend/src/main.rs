//! # GCS Backend — Ground Control Station Simulator
//!
//! This is the main entry point for the Rust backend server.
//! It sets up logging, configures the Axum router, and starts
//! listening for HTTP connections.
//!
//! ## SAFETY BOUNDARY
//! This is a **simulation-only** system for portfolio demonstration.
//! No real drone control, no real vehicle control, no real hardware.
//! All telemetry, states, and commands are simulated.

// Declare our modules so the compiler knows about them.
// Each `mod` statement corresponds to a file or directory.
mod api;
mod config;
mod error;
mod models;
mod services;
mod storage;

use axum::Router;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

use services::telemetry_router::AppState;

/// The main function — where everything starts.
///
/// # Rust Concept: `#[tokio::main]`
/// Rust doesn't have a built-in async runtime. This attribute macro
/// transforms `async fn main()` into a regular `fn main()` that creates
/// a Tokio runtime and blocks on the async code. Without it, you can't
/// use `.await` in main.
///
/// # Rust Concept: `anyhow::Result<()>`
/// `anyhow::Result` is a convenient error type that can hold any error.
/// The `?` operator will automatically convert and propagate errors.
/// `()` is the "unit type" — like void — meaning we return nothing on success.
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // --- Step 1: Load configuration ---
    let config = config::Config::from_env();

    // --- Step 2: Initialize tracing (structured logging) ---
    //
    // Tracing is like a supercharged version of println! for servers.
    // It adds timestamps, log levels (INFO, WARN, ERROR), and can filter
    // output by module. The EnvFilter reads from the RUST_LOG env var
    // or falls back to our config.
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new(&config.log_level)),
        )
        .with_target(true)       // Show which module logged the message
        .with_thread_ids(false)  // Keep output clean
        .with_ansi(true)         // Colored output in terminal
        .init();

    tracing::info!("=== GCS Backend Starting ===");
    tracing::info!("Simulation-only mode — no real hardware control");
    tracing::info!(
        host = %config.host,
        port = %config.port,
        log_level = %config.log_level,
        "configuration loaded"
    );

    // --- Step 3: Initialize the server start time for uptime tracking ---
    api::http::init_start_time();

    // --- Step 4: Create shared application state ---
    //
    // # Rust Concept: Shared state with Axum
    // AppState holds the broadcast channel that connects the simulator
    // to WebSocket clients. `.with_state(state)` passes it to all handlers
    // so they can call `State(state)` to access it.
    let (state, command_rx) = AppState::new();
    tracing::info!("application state initialized");

    // --- Step 5: Start the telemetry simulator ---
    //
    // This spawns a background Tokio task that runs all subsystem
    // simulations (tracks, vehicle, launchbox, video, diagnostics)
    // and broadcasts combined telemetry updates every second.
    // We pass the full AppState so the simulator can update the
    // shared snapshot for HTTP endpoints.
    services::telemetry_simulator::start_simulator(state.clone(), command_rx);
    tracing::info!("telemetry simulator spawned (all subsystems active)");

    // --- Step 6: Build the Axum router ---
    //
    // # Rust Concept: Method chaining (Builder pattern)
    // Axum uses the builder pattern where each `.route()` call adds an
    // endpoint and returns the router, so we can chain calls together.
    //
    // # What is CORS?
    // CORS (Cross-Origin Resource Sharing) tells browsers which origins
    // are allowed to call our API. Since the frontend will run on a
    // different port (e.g., 5173), we need to allow cross-origin requests.
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        // Phase 1: Health check
        .route("/health", axum::routing::get(api::http::health_check))
        // Phase 2: WebSocket telemetry stream
        .route("/ws/telemetry", axum::routing::get(api::websocket::ws_telemetry_handler))
        // Phase 3: Subsystem snapshot endpoints
        .route("/tracks", axum::routing::get(api::http::get_tracks))
        .route("/vehicle", axum::routing::get(api::http::get_vehicle))
        .route("/launchbox", axum::routing::get(api::http::get_launchbox))
        .route("/video-health", axum::routing::get(api::http::get_video_health))
        .route("/diagnostics", axum::routing::get(api::http::get_diagnostics))
        // Phase 4: Command API
        .route("/commands", axum::routing::post(api::http::post_command))
        // Shared state — available to all handlers via State extractor
        .with_state(state)
        // Middleware: CORS and request tracing
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    // --- Step 7: Start the server ---
    let addr = config.addr();
    tracing::info!(address = %addr, "server listening");

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
