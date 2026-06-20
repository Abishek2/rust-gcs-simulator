use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

/// Application-level error type.
///
/// # Rust Concept: Enums with data
/// Rust enums are much more powerful than in most languages. Each variant
/// can carry different data. This is called a "tagged union" or "sum type."
///
/// # Rust Concept: `#[derive(thiserror::Error)]`
/// The `thiserror` crate auto-generates the `std::error::Error` implementation.
/// The `#[error("...")]` attribute defines the Display message for each variant.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Internal server error: {0}")]
    Internal(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Not found: {0}")]
    NotFound(String),
}

/// Convert our `AppError` into an HTTP response that Axum can send back.
///
/// # Rust Concept: Trait implementation
/// `IntoResponse` is an Axum trait. By implementing it for `AppError`,
/// we tell Axum how to convert our errors into HTTP responses automatically.
/// This means our handler functions can return `Result<..., AppError>` and
/// Axum will handle the error case for us.
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
        };

        // Log the error with tracing so it appears in server logs
        tracing::error!(%status, %message, "request error");

        let body = Json(json!({
            "error": message,
            "status": status.as_u16(),
        }));

        (status, body).into_response()
    }
}
