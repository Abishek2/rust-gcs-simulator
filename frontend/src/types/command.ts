export type CommandType =
  | 'ARM'
  | 'DISARM'
  | 'TAKEOFF'
  | 'LAND'
  | 'RTL'
  | 'SET_MODE'
  | 'FIRE_SIMULATED_CELL'
  | 'TOGGLE_SAFETY';

export interface CommandPayload {
  command_type: CommandType;
  parameters: Record<string, any>;
}

export interface CommandAcknowledgement {
  command_id: string;
  command_type: CommandType;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXECUTED' | 'FAILED' | 'TIMEOUT';
  timestamp: string;
  error_message?: string;
}
