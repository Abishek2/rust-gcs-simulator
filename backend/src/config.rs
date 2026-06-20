/// Application configuration.
///
/// # Rust Concept: Structs
/// A `struct` in Rust is like a class without methods (by default).
/// We add methods using `impl` blocks below. Fields are private by default,
/// so other modules use the public methods to access them.
///
/// # Rust Concept: `#[derive(...)]`
/// The `#[derive(Debug, Clone)]` attribute auto-generates implementations:
/// - `Debug`: lets us print the struct with `{:?}` for logging
/// - `Clone`: lets us create copies of the struct
#[derive(Debug, Clone)]
pub struct Config {
    /// The host address to bind the server to (e.g., "0.0.0.0")
    pub host: String,
    /// The port to listen on (e.g., 3001)
    pub port: u16,
    /// Log level filter (e.g., "info", "debug", "trace")
    pub log_level: String,
    /// CORS allowed origins
    pub cors_allowed_origins: String,
}

impl Config {
    /// Load configuration from environment variables with sensible defaults.
    ///
    /// # Rust Concept: `impl` blocks
    /// This is where we define methods on the `Config` struct.
    /// Methods that don't take `&self` (like this one) are called
    /// "associated functions" — similar to static methods in other languages.
    /// You call them with `Config::from_env()` instead of `config.from_env()`.
    ///
    /// # Rust Concept: `unwrap_or_else`
    /// `std::env::var()` returns a `Result<String, VarError>`.
    /// `unwrap_or_else(|_| ...)` says: "if it's an error, run this closure instead."
    /// This is safer than `.unwrap()` which would crash on error.
    pub fn from_env() -> Self {
        let host = std::env::var("GCS_HOST")
            .unwrap_or_else(|_| "0.0.0.0".to_string());

        let port = std::env::var("GCS_PORT")
            .unwrap_or_else(|_| "3001".to_string())
            .parse::<u16>()
            .expect("GCS_PORT must be a valid port number");

        let log_level = std::env::var("GCS_LOG_LEVEL")
            .unwrap_or_else(|_| "info".to_string());

        let cors_allowed_origins = std::env::var("CORS_ALLOWED_ORIGINS")
            .unwrap_or_else(|_| "http://localhost:5173,http://localhost:4173".to_string());

        Self { host, port, log_level, cors_allowed_origins }
    }

    /// Returns the full socket address string (e.g., "0.0.0.0:3001").
    pub fn addr(&self) -> String {
        format!("{}:{}", self.host, self.port)
    }
}
