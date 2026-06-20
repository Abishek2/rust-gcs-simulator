export interface Vehicle {
  id: string;
  latitude: number;
  longitude: number;
  altitude: number; // meters
  speed: number;    // meters per second
  heading: number;  // degrees (0-359)
  battery_percent: number;
  gps_satellites: number;
  connection_strength: number; // 0-100%
  flight_mode: 'MANUAL' | 'GUIDED' | 'AUTO' | 'RTL' | 'LAND';
  state: 'ARMED' | 'DISARMED' | 'TAKEOFF' | 'FLYING' | 'LANDING';
  last_updated: string; // ISO Timestamp
}
