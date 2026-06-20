export type CommandType =
  | 'SET_MODE_STANDBY'
  | 'SET_MODE_TRACKING'
  | 'SET_MODE_READY'
  | 'ABORT_SIMULATION'
  | 'RESET_FAULT'
  | 'RUN_SYSTEM_CHECK';

export type CommandStatus =
  | 'SENDING'
  | 'ACK_RECEIVED'
  | 'ACK_TIMEOUT'
  | 'REJECTED_INVALID_TRANSITION'
  | 'EXECUTED';

export interface CommandPayload {
  command_type: CommandType;
  requested_by: string;
  reason: string;
}

export interface CommandAcknowledgement {
  command_id: string;
  command_type: CommandType;
  status: CommandStatus;
  timestamp: string;
  previous_mode?: string;
  new_mode?: string;
  message?: string;
}
