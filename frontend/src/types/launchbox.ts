export interface LaunchCell {
  cell_id: number;
  status: 'EMPTY' | 'LOADED' | 'ARMED' | 'FIRED';
  temperature: number; // Celsius
  payload_type: string; // e.g. "Simulated Flare", "Simulated Asset"
}

export interface Launchbox {
  launchbox_id: string;
  door_state: 'OPEN' | 'CLOSED';
  vehicle_present: boolean;
  charging: boolean;
  health: 'OK' | 'WARNING' | 'FAULT';
  temperature_celsius: number;
  last_update: string;

  // Optional Frontend-only local simulation parameters
  cells?: LaunchCell[];
  safety_switch?: boolean;
  key_inserted?: boolean;
}
