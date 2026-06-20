export interface Track {
  track_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  altitude: number;
  heading: number;
  confidence: number;
  status: 'NEW' | 'TRACKING' | 'STALE' | 'LOST';
  last_update_timestamp: string;

  // Optional Frontend-only decorations for visual representation
  category?: 'friendly' | 'hostile' | 'neutral' | 'unknown';
  name?: string;
}
