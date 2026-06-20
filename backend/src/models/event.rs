use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemEvent {
    pub timestamp: DateTime<Utc>,
    pub message: String,
    pub source: String,
}

impl SystemEvent {
    pub fn new(message: String, source: String) -> Self {
        Self {
            timestamp: Utc::now(),
            message,
            source,
        }
    }
}
