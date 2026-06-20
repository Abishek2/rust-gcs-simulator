use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Type of command sent by the operator.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum CommandType {
    SetModeStandby,
    SetModeTracking,
    SetModeReady,
    AbortSimulation,
    ResetFault,
    RunSystemCheck,
}

/// A command request sent to `POST /commands`.
#[derive(Debug, Clone, Deserialize)]
pub struct CommandRequest {
    pub command_type: CommandType,
    pub requested_by: String,
    pub reason: String,
}

/// Status of a submitted command.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum CommandStatus {
    AckReceived,
    AckTimeout,
    RejectedInvalidTransition,
    Executed, // Internal use
}

/// HTTP response for `POST /commands`.
#[derive(Debug, Clone, Serialize)]
pub struct CommandResponse {
    pub command_id: String,
    pub command_type: CommandType,
    pub status: CommandStatus,
    pub previous_mode: String,
    pub new_mode: String,
    pub timestamp: DateTime<Utc>,
    pub message: String,
}

/// A command's tracking state within the simulator.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandRecord {
    pub command_id: String,
    pub command_type: CommandType,
    pub requested_by: String,
    pub status: CommandStatus,
    pub timestamp: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
