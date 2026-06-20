//! State machine service for handling vehicle mode transitions.
//!
//! Replaces Phase 3 heuristics with an explicit, command-driven state machine.
//! Simulates command execution delays, ACKs, and timeouts.

use chrono::Utc;
use uuid::Uuid;

use crate::models::command::{CommandRecord, CommandRequest, CommandStatus, CommandType};
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

    /// Process a new command request, returning the generated command ID.
    pub fn accept_command(&mut self, request: CommandRequest) -> String {
        let command_id = Uuid::new_v4().to_string();
        
        let mut status = CommandStatus::Pending;
        
        // Immediate validation / rejection
        if let Some(active) = &self.active_command {
            if active.status == CommandStatus::Pending || active.status == CommandStatus::Accepted {
                // Ignore new commands if one is already processing (except ABORT)
                if request.command_type != CommandType::Abort {
                    status = CommandStatus::Rejected;
                    tracing::warn!("Command rejected: another command is already processing");
                }
            }
        }

        let record = CommandRecord {
            command_id: command_id.clone(),
            command_type: request.command_type,
            status,
            target_id: request.target_id,
            timestamp: Utc::now(),
            updated_at: Utc::now(),
        };

        if record.status != CommandStatus::Rejected {
            self.active_command = Some(record);
            self.command_ticks = 0;
        }

        command_id
    }

    /// Advance the state machine by one tick.
    pub fn tick(&mut self) {
        let mut transition_to = None;

        if let Some(cmd) = &mut self.active_command {
            self.command_ticks += 1;

            match cmd.status {
                CommandStatus::Pending => {
                    // Simulate processing delay
                    if self.command_ticks >= 1 {
                        cmd.status = CommandStatus::Accepted;
                        cmd.updated_at = Utc::now();
                        tracing::info!(command_id = %cmd.command_id, "Command accepted");
                    }
                }
                CommandStatus::Accepted => {
                    // Simulate execution delay (e.g. waiting for vehicle ACK)
                    // Abort is fast, others take longer
                    let target_ticks = if cmd.command_type == CommandType::Abort { 1 } else { 3 };

                    if self.command_ticks >= target_ticks {
                        cmd.status = CommandStatus::Executed;
                        cmd.updated_at = Utc::now();
                        tracing::info!(command_id = %cmd.command_id, "Command executed");

                        // Trigger state transition
                        transition_to = Some(match cmd.command_type {
                            CommandType::Standby => SystemMode::Standby,
                            CommandType::TrackTarget => SystemMode::Tracking,
                            CommandType::Ready => SystemMode::Ready,
                            CommandType::Abort => SystemMode::Aborted,
                        });
                    }
                }
                _ => {}
            }

            // Simulate command timeout (e.g. 10 ticks)
            if self.command_ticks >= 10 && cmd.status != CommandStatus::Executed {
                cmd.status = CommandStatus::Timeout;
                cmd.updated_at = Utc::now();
                tracing::error!(command_id = %cmd.command_id, "Command timed out");
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
        }
    }
}
