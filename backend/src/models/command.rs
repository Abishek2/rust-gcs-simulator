use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Type of command sent by the operator.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum CommandType {
    /// Put the system into Standby mode
    Standby,
    /// Put the system into Tracking mode
    TrackTarget,
    /// Put the system into Ready mode
    Ready,
    /// Abort all operations and return to Standby/Aborted mode
    Abort,
}

/// A command request sent to `POST /commands`.
#[derive(Debug, Clone, Deserialize)]
pub struct CommandRequest {
    pub command_type: CommandType,
    pub target_id: Option<String>,
}

/// Status of a submitted command.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum CommandStatus {
    Pending,
    Accepted,
    Rejected,
    Executed,
    Timeout,
}

/// A command's tracking state within the simulator.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandRecord {
    pub command_id: String,
    pub command_type: CommandType,
    pub status: CommandStatus,
    pub target_id: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// HTTP response for `POST /commands`.
#[derive(Debug, Clone, Serialize)]
pub struct CommandResponse {
    pub command_id: String,
    pub status: CommandStatus,
    pub message: String,
}
