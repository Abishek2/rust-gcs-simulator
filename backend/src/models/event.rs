use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemEvent {
    pub event_id: String,
    pub session_id: String,
    pub event_type: String,
    pub source: String,
    pub severity: String,
    pub message: String,
    pub timestamp: DateTime<Utc>,
    /// JSON string of associated metadata (e.g., command payload)
    pub payload: Option<String>,
}

impl SystemEvent {
    pub fn new(
        session_id: String,
        event_type: &str,
        source: &str,
        severity: &str,
        message: String,
        payload: Option<serde_json::Value>,
    ) -> Self {
        Self {
            event_id: uuid::Uuid::new_v4().to_string(),
            session_id,
            event_type: event_type.to_string(),
            source: source.to_string(),
            severity: severity.to_string(),
            message,
            timestamp: Utc::now(),
            payload: payload.map(|p| p.to_string()),
        }
    }
}

/// Represents a simulation session.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationSession {
    pub session_id: String,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub status: String,
}
