export interface VideoHealth {
  fps: number;
  bitrate_kbps: number;
  latency_ms: number;
  status: 'NOMINAL' | 'DEGRADED' | 'LOST';
  stream_url?: string;
  last_updated: string;
}
