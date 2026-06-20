export interface LaunchCell {
  cell_id: number;
  status: 'EMPTY' | 'LOADED' | 'ARMED' | 'FIRED';
  temperature: number; // Celsius
  payload_type: string; // e.g. "Simulated Flare", "Sensor Probe"
}

export interface Launchbox {
  status: 'READY' | 'NOT_READY' | 'LAUNCHED' | 'ERROR' | 'STANDBY';
  cells: LaunchCell[];
  safety_switch: boolean; // true if safety engaged (safe), false if off (ready to fire)
  key_inserted: boolean;  // simulation key inserted
  last_updated: string;
}
