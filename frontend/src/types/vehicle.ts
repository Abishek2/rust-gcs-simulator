export interface Vehicle {
  vehicle_id: string;
  connection_state: 'HEALTHY' | 'DEGRADED' | 'LOST';
  mode: 'STANDBY' | 'TRACKING' | 'READY' | 'FAULT' | 'ABORTED';
  battery_percent: number;
  latitude: number;
  longitude: number;
  altitude: number; // meters
  speed: number;    // meters per second
  heading: number;  // degrees
  last_heartbeat: string; // ISO Timestamp

  // Optional Frontend-only parameters for local mock simulation logic
  state?: 'ARMED' | 'DISARMED' | 'TAKEOFF' | 'FLYING' | 'LANDING';
  flight_mode?: 'MANUAL' | 'GUIDED' | 'AUTO' | 'RTL' | 'LAND';
}
