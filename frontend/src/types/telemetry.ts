import type { Track } from './track';
import type { Vehicle } from './vehicle';
import type { Launchbox } from './launchbox';
import type { VideoHealth } from './videoHealth';
import type { Diagnostics } from './diagnostics';
import type { SystemEvent } from './event';
import type { CommandAcknowledgement } from './command';

// Aligned with Phase 4 Backend WebSocket payload
export interface TelemetryUpdate {
  type: 'telemetry_update';
  timestamp: string;
  tracks: Track[];
  vehicle: Vehicle;
  launchbox: Launchbox;
  video_health: VideoHealth;
  diagnostics: Diagnostics;
  latest_command?: CommandAcknowledgement | null;
  events?: { timestamp: string; message: string; source: string }[];
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
