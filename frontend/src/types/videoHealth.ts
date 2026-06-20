export interface VideoHealth {
  stream_id: string;
  stream_state: 'CONNECTED' | 'RECONNECTING' | 'LOST';
  fps: number;
  latency_ms: number;
  dropped_frames: number;
  resolution: string;
  last_frame_timestamp: string;

  // Optional Frontend-only variables for fallback representation
  bitrate_kbps?: number;
  status?: 'NOMINAL' | 'DEGRADED' | 'LOST';
}
