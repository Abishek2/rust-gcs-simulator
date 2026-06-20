//! State machine service for handling vehicle mode transitions.
//!
//! Replaces Phase 3 heuristics with an explicit, command-driven state machine.
//! Simulates command execution delays, ACKs, and timeouts.

use chrono::Utc;
use uuid::Uuid;

use crate::models::command::{CommandRecord, CommandRequest, CommandResponse, CommandStatus, CommandType};
use crate::models::vehicle::SystemMode;

/// Command-driven State Machine.
pub struct StateMachine {
    pub current_mode: SystemMode,
    /// Currently processing command, if any.
    pub active_command: Option<CommandRecord>,
    /// How many ticks the current command has been executing.
    command_ticks: u32,
}

impl StateMachine {
    pub fn new() -> Self {
        Self {
            current_mode: SystemMode::Standby,
            active_command: None,
            command_ticks: 0,
        }
    }

    /// Process a new command request.
    pub fn accept_command(&mut self, request: CommandRequest) -> CommandResponse {
        let command_id = Uuid::new_v4().to_string();
        
        let mut status = CommandStatus::AckReceived;
        let previous_mode = format!("{:?}", self.current_mode).to_uppercase();
        let mut new_mode = previous_mode.clone();
        let mut message = "Simulated command accepted and applied.".to_string();

        // Safe transition logic
        match request.command_type {
            CommandType::SetModeStandby => {
                new_mode = "STANDBY".to_string();
            }
            CommandType::SetModeTracking => {
                if self.current_mode == SystemMode::Fault || self.current_mode == SystemMode::Aborted {
                    status = CommandStatus::RejectedInvalidTransition;
                    message = "Cannot enter TRACKING from FAULT or ABORTED state.".to_string();
                } else {
                    new_mode = "TRACKING".to_string();
                }
            }
            CommandType::SetModeReady => {
                if self.current_mode != SystemMode::Tracking {
                    status = CommandStatus::RejectedInvalidTransition;
                    message = "Must be in TRACKING mode to enter READY.".to_string();
                } else {
                    new_mode = "READY".to_string();
                }
            }
            CommandType::AbortSimulation => {
                new_mode = "ABORTED".to_string();
            }
            CommandType::ResetFault => {
                if self.current_mode == SystemMode::Fault {
                    new_mode = "STANDBY".to_string();
                } else {
                    status = CommandStatus::RejectedInvalidTransition;
                    message = "System is not in FAULT state.".to_string();
                }
            }
            CommandType::RunSystemCheck => {
                // Doesn't change mode
            }
        }

        // Check if there is an active command executing
        if let Some(active) = &self.active_command {
            if active.status == CommandStatus::AckReceived && request.command_type != CommandType::AbortSimulation {
                status = CommandStatus::RejectedInvalidTransition;
                message = "Another command is currently processing.".to_string();
                new_mode = previous_mode.clone();
            }
        }

        let record = CommandRecord {
            command_id: command_id.clone(),
            command_type: request.command_type.clone(),
            requested_by: request.requested_by.clone(),
            status: status.clone(),
            timestamp: Utc::now(),
            updated_at: Utc::now(),
        };

        if status == CommandStatus::AckReceived {
            self.active_command = Some(record);
            self.command_ticks = 0;
        }

        CommandResponse {
            command_id,
            command_type: request.command_type,
            status,
            previous_mode,
            new_mode,
            timestamp: Utc::now(),
            message,
        }
    }

    /// Advance the state machine by one tick.
    pub fn tick(&mut self) -> Option<CommandRecord> {
        let mut transition_to = None;
        let mut completed_command = None;

        if let Some(cmd) = &mut self.active_command {
            self.command_ticks += 1;

            match cmd.status {
                CommandStatus::AckReceived => {
                    // Simulate execution delay (e.g. waiting for vehicle ACK)
                    // Abort is fast, others take longer
                    let target_ticks = if cmd.command_type == CommandType::AbortSimulation { 1 } else { 3 };

                    if self.command_ticks >= target_ticks {
                        cmd.status = CommandStatus::Executed;
                        cmd.updated_at = Utc::now();
                        tracing::info!(command_id = %cmd.command_id, "Command executed");

                        // Trigger state transition
                        transition_to = Some(match cmd.command_type {
                            CommandType::SetModeStandby => SystemMode::Standby,
                            CommandType::SetModeTracking => SystemMode::Tracking,
                            CommandType::SetModeReady => SystemMode::Ready,
                            CommandType::AbortSimulation => SystemMode::Aborted,
                            CommandType::ResetFault => SystemMode::Standby,
                            CommandType::RunSystemCheck => self.current_mode.clone(),
                        });
                        
                        completed_command = Some(cmd.clone());
                    }
                }
                _ => {}
            }

            // Simulate command timeout
            if self.command_ticks >= 10 && cmd.status != CommandStatus::Executed {
                cmd.status = CommandStatus::AckTimeout;
                cmd.updated_at = Utc::now();
                tracing::error!(command_id = %cmd.command_id, "Command timed out");
                completed_command = Some(cmd.clone());
            }
        }

        if let Some(new_mode) = transition_to {
            tracing::info!(
                from = ?self.current_mode,
                to = ?new_mode,
                "Vehicle mode transitioning"
            );
            self.current_mode = new_mode;
            // Clear active command once executed
            self.active_command = None;
        } else if let Some(CommandRecord { status: CommandStatus::AckTimeout, .. }) = completed_command {
            // Also clear if timeout
            self.active_command = None;
        }

        completed_command
    }
}
