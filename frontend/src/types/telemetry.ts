import type { Track } from './track';
import type { Vehicle } from './vehicle';
import type { Launchbox } from './launchbox';
import type { VideoHealth } from './videoHealth';
import type { Diagnostics } from './diagnostics';
import type { SystemEvent } from './event';

// Aligned with Phase 3 Backend WebSocket payload
export interface TelemetryUpdate {
  type: 'telemetry_update';
  timestamp: string;
  tracks: Track[];
  vehicle: Vehicle;
  launchbox: Launchbox;
  video_health: VideoHealth;
  diagnostics: Diagnostics;
}

// Aligned with Frontend representation
export interface FrontendStateData {
  timestamp: string;
  tracks: Track[];
  vehicle: Vehicle;
  launchbox: Launchbox;
  video_health: VideoHealth;
  diagnostics: Diagnostics;
  events: SystemEvent[];
}
