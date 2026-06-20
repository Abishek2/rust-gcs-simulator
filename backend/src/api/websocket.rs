//! WebSocket handler for real-time telemetry streaming.
//!
//! Clients connect to `WS /ws/telemetry` and receive a JSON telemetry
//! update every second. The handler subscribes to the broadcast channel
//! and forwards each update to the connected client.
//!
//! ## SAFETY BOUNDARY
//! WebSocket is read-only for now — clients cannot send commands through
//! this channel. Command handling will be added via POST /commands in Phase 4.

use axum::{
    extract::{
        State,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    response::IntoResponse,
};

use crate::services::telemetry_router::AppState;

/// HTTP upgrade handler for WebSocket connections.
///
/// # Rust Concept: Axum Extractors
/// `WebSocketUpgrade` and `State(state)` are "extractors" — Axum
/// automatically parses them from the incoming request. `WebSocketUpgrade`
/// handles the HTTP 101 Switching Protocols handshake. `State` extracts
/// the shared `AppState` we registered with `.with_state(...)`.
///
/// # Rust Concept: `move` closures
/// The `move` keyword before the closure tells Rust to take ownership
/// of `state` instead of borrowing it. This is necessary because the
/// closure will outlive this function (it runs after the HTTP response).
pub async fn ws_telemetry_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    tracing::info!("WebSocket upgrade requested for /ws/telemetry");
    ws.on_upgrade(move |socket| handle_telemetry_socket(socket, state))
}

/// Handle an established WebSocket connection.
///
/// This function runs for the entire lifetime of one client connection.
/// It subscribes to the telemetry broadcast channel and forwards every
/// update as a JSON text message.
///
/// # Rust Concept: `tokio::select!`
/// `select!` waits on multiple async operations simultaneously and
/// runs the branch that completes first. Here we wait for either:
/// 1. A new telemetry update from the broadcast channel → send to client
/// 2. A message from the client → handle or ignore it
///
/// This is like Go's `select` statement but for async Rust.
async fn handle_telemetry_socket(mut socket: WebSocket, state: AppState) {
    // Subscribe to the broadcast channel — each subscriber gets its own queue
    let mut rx = state.telemetry_tx.subscribe();

    // Track this connection
    let client_count = state.client_connected();
    tracing::info!(
        clients = client_count,
        "WebSocket client connected to /ws/telemetry"
    );

    // Main event loop — runs until the client disconnects
    loop {
        tokio::select! {
            // Branch 1: New telemetry update available
            result = rx.recv() => {
                match result {
                    Ok(update) => {
                        // Serialize to JSON
                        let json = match serde_json::to_string(&update) {
                            Ok(json) => json,
                            Err(e) => {
                                tracing::error!(error = %e, "failed to serialize telemetry update");
                                continue;
                            }
                        };

                        // Send to client — if this fails, the client disconnected
                        if socket.send(Message::Text(json.into())).await.is_err() {
                            tracing::info!("WebSocket send failed — client disconnected");
                            break;
                        }
                    }
                    Err(tokio::sync::broadcast::error::RecvError::Lagged(skipped)) => {
                        // Client fell behind — the broadcast buffer overflowed.
                        // This is normal under heavy load. The client skips
                        // to the latest message automatically.
                        tracing::warn!(
                            skipped = skipped,
                            "WebSocket client lagged — skipped messages"
                        );
                    }
                    Err(tokio::sync::broadcast::error::RecvError::Closed) => {
                        // The broadcast channel was closed — server is shutting down
                        tracing::info!("broadcast channel closed — disconnecting client");
                        break;
                    }
                }
            }

            // Branch 2: Client sent us a message
            msg = socket.recv() => {
                match msg {
                    Some(Ok(Message::Close(_))) => {
                        tracing::info!("WebSocket client sent close frame");
                        break;
                    }
                    Some(Ok(Message::Ping(data))) => {
                        // Respond to pings to keep the connection alive
                        if socket.send(Message::Pong(data)).await.is_err() {
                            break;
                        }
                    }
                    Some(Ok(Message::Text(_))) => {
                        // Phase 2: We ignore text messages from clients.
                        // Phase 4 will add command handling via POST /commands.
                        tracing::debug!("ignoring text message from WebSocket client");
                    }
                    Some(Ok(_)) => {
                        // Binary, Pong, etc. — ignore
                    }
                    Some(Err(e)) => {
                        tracing::warn!(error = %e, "WebSocket receive error");
                        break;
                    }
                    None => {
                        // Stream ended — client disconnected
                        break;
                    }
                }
            }
        }
    }

    // Cleanup: decrement client count
    let client_count = state.client_disconnected();
    tracing::info!(
        clients = client_count,
        "WebSocket client disconnected from /ws/telemetry"
    );
}
