import type { Track } from './track';
import type { Vehicle } from './vehicle';
import type { Launchbox } from './launchbox';
import type { VideoHealth } from './videoHealth';
import type { Diagnostics } from './diagnostics';
import type { SystemEvent } from './event';

// Exact WebSocket package from backend (Phase 2)
export interface TelemetryUpdate {
  type: 'telemetry_update';
  timestamp: string;
  tracks: Track[];
}

// Full dashboard state structure containing mock/fallback components
export interface FrontendStateData {
  timestamp: string;
  tracks: Track[];
  vehicle: Vehicle;
  launchbox: Launchbox;
  video_health: VideoHealth;
  diagnostics: Diagnostics;
  events: SystemEvent[];
}
