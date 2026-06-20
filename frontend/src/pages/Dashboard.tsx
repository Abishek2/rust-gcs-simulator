import React, { useState, useEffect } from 'react';
import { getMockTelemetry } from '../utils/mockData';
import type { TelemetryUpdate, FrontendStateData } from '../types/telemetry';
import type { Track } from '../types/track';
import type { CommandType, CommandAcknowledgement } from '../types/command';
import { RadarView } from '../components/RadarView';
import { TrackPanel } from '../components/TrackPanel';
import { VehiclePanel } from '../components/VehiclePanel';
import { LaunchboxPanel } from '../components/LaunchboxPanel';
import { VideoHealthPanel } from '../components/VideoHealthPanel';
import { ModeControl } from '../components/ModeControl';
import { EventLog } from '../components/EventLog';
import { DiagnosticsPanel } from '../components/DiagnosticsPanel';

interface DashboardProps {
  externalTelemetry?: TelemetryUpdate | null;
  connected?: boolean;
  reconnecting?: boolean;
  backendHealth?: 'ok' | 'error' | 'loading';
  onSendCommand?: (type: CommandType, params?: Record<string, any>) => Promise<void>;
  lastAck?: CommandAcknowledgement | null;
}

export const Dashboard: React.FC<DashboardProps> = ({
  externalTelemetry = null,
  onSendCommand,
  lastAck: externalLastAck = null,
}) => {
  // Use mock telemetry if no external telemetry (e.g. WebSocket) is connected yet
  const [telemetry, setTelemetry] = useState<FrontendStateData>(getMockTelemetry());
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [localLastAck, setLocalLastAck] = useState<CommandAcknowledgement | null>(null);

  // Sync with external telemetry if provided (Phase 2+)
  useEffect(() => {
    if (externalTelemetry) {
      // Map external tracks to display models
      const mappedTracks = externalTelemetry.tracks.map((extTrack) => {
        // Find existing track in previous state to preserve manual overrides (category/name)
        const existingTrack = telemetry.tracks.find(t => t.track_id === extTrack.track_id);
        
        // Default classifications based on ID if not already overridden
        let defaultCategory: Track['category'] = 'unknown';
        let defaultName = `Simulated Object ${extTrack.track_id}`;
        
        if (extTrack.track_id === 'TRK-001') {
          defaultCategory = 'friendly';
          defaultName = 'Simulated UAV Alpha';
        } else if (extTrack.track_id === 'TRK-002') {
          defaultCategory = 'hostile';
          defaultName = 'Simulated Target Bravo';
        } else if (extTrack.track_id === 'TRK-003') {
          defaultCategory = 'neutral';
          defaultName = 'Simulated Cargo Liner';
        } else if (extTrack.track_id === 'TRK-004') {
          defaultCategory = 'unknown';
          defaultName = 'Simulated Unknown Phantom';
        } else if (extTrack.track_id === 'TRK-005') {
          defaultCategory = 'friendly';
          defaultName = 'Simulated Explorer';
        }

        return {
          ...extTrack,
          category: existingTrack?.category || defaultCategory,
          name: existingTrack?.name || defaultName,
        };
      });

      setTelemetry((prev) => {
        // Map backend events (timestamp, message, source) to frontend SystemEvent shape
        const backendEvents = (externalTelemetry.events || []).map((e, index) => {
          let severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'INFO';
          const msgLower = e.message.toLowerCase();
          if (msgLower.includes('reject') || msgLower.includes('failed to') || msgLower.includes('error')) {
            severity = 'ERROR';
          } else if (msgLower.includes('timeout') || msgLower.includes('warn')) {
            severity = 'WARNING';
          } else if (msgLower.includes('abort') || msgLower.includes('critical')) {
            severity = 'CRITICAL';
          }
          
          return {
            id: `backend-event-${e.timestamp}-${index}-${e.message.slice(0, 15)}`,
            timestamp: e.timestamp,
            severity,
            message: e.message,
            source: e.source,
          };
        });

        // Merge backend events with existing local events, checking for duplicates
        const combinedEvents = [...backendEvents];
        prev.events.forEach((localEvt) => {
          const isDuplicate = combinedEvents.some(
            (be) => be.message === localEvt.message && be.timestamp === localEvt.timestamp
          );
          if (!isDuplicate) {
            combinedEvents.push(localEvt);
          }
        });

        // Sort descending by timestamp
        combinedEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return {
          ...prev,
          tracks: mappedTracks,
          timestamp: externalTelemetry.timestamp,
          vehicle: externalTelemetry.vehicle,
          launchbox: {
            ...prev.launchbox,
            ...externalTelemetry.launchbox,
          },
          video_health: {
            ...prev.video_health,
            ...externalTelemetry.video_health,
          },
          diagnostics: {
            ...prev.diagnostics,
            ...externalTelemetry.diagnostics,
          },
          events: combinedEvents.slice(0, 100),
        };
      });
    }
  }, [externalTelemetry]);

  // Synchronize incoming command acknowledgements into the Event Log
  useEffect(() => {
    const ack = externalTelemetry ? externalLastAck : localLastAck;
    if (ack) {
      setTelemetry((prev) => {
        // Prevent duplicate logs for the same status update
        const eventId = `evt-ack-${ack.command_id || ack.timestamp}-${ack.status}`;
        const logExists = prev.events.some(e => e.id === eventId);
        if (logExists) return prev;

        let severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'INFO';
        if (ack.status === 'REJECTED_INVALID_TRANSITION' || ack.status === 'ACK_TIMEOUT') {
          severity = 'ERROR';
        } else if (ack.status === 'SENDING') {
          severity = 'INFO';
        } else if (ack.status === 'ACK_RECEIVED') {
          severity = 'WARNING';
        }

        const newEvent = {
          id: eventId,
          timestamp: new Date().toISOString(),
          severity,
          message: `Uplink Command [${ack.command_type}]: status shifted to ${ack.status.replace(/_/g, ' ')} (${ack.message || 'Transmission acknowledged'})`,
          source: 'COMMAND_UPLINK',
        };

        return {
          ...prev,
          events: [newEvent, ...prev.events].slice(0, 100),
        };
      });
    }
  }, [externalLastAck, localLastAck, externalTelemetry]);

  // Frontend simulation engine for Phase 1
  useEffect(() => {
    if (externalTelemetry) return; // Disable simulation if real backend data is active

    const simInterval = setInterval(() => {
      setTelemetry((prev) => {
        const nextTelemetry = { ...prev };
        
        // 1. Move tracks slightly based on heading and speed
        nextTelemetry.tracks = prev.tracks.map((track) => {
          if (track.status === 'LOST') return track;

          const speedMs = track.speed;
          // Approximate distance moved in degrees lat/lon (1 deg ~= 111000m)
          const angleRad = ((90 - track.heading) * Math.PI) / 180;
          const deltaLat = (Math.sin(angleRad) * speedMs * 1) / 111139; // 1 second update
          const deltaLon = (Math.cos(angleRad) * speedMs * 1) / (111139 * Math.cos((track.latitude * Math.PI) / 180));

          // Boundary bounce or loop
          let newLat = track.latitude + deltaLat;
          let newLon = track.longitude + deltaLon;

          // If track gets too far from vehicle, wrap it or loop it
          const latDiff = newLat - prev.vehicle.latitude;
          const lonDiff = newLon - prev.vehicle.longitude;
          if (Math.hypot(latDiff, lonDiff) > 0.025) {
            // Reset to opposite direction
            newLat = prev.vehicle.latitude - latDiff * 0.9;
            newLon = prev.vehicle.longitude - lonDiff * 0.9;
          }

          return {
            ...track,
            latitude: newLat,
            longitude: newLon,
            last_update_timestamp: new Date().toISOString(),
          };
        });

        // 2. Telemetry adjustments (bob altitude & speed slightly)
        if (prev.vehicle.state === 'FLYING') {
          const altitudeBob = (Math.random() - 0.5) * 0.5;
          const speedBob = (Math.random() - 0.5) * 0.3;
          nextTelemetry.vehicle = {
            ...prev.vehicle,
            altitude: Math.max(10, prev.vehicle.altitude + altitudeBob),
            speed: Math.max(5, prev.vehicle.speed + speedBob),
            battery_percent: Math.max(1, prev.vehicle.battery_percent - 0.01), // discharge battery
            last_heartbeat: new Date().toISOString(),
          };
        } else if (prev.vehicle.state === 'TAKEOFF') {
          // Climb to target 150m
          const newAlt = prev.vehicle.altitude + 5;
          const isTargetReached = newAlt >= 150;
          nextTelemetry.vehicle = {
            ...prev.vehicle,
            altitude: isTargetReached ? 150 : newAlt,
            speed: isTargetReached ? 12.8 : 8.5,
            state: isTargetReached ? 'FLYING' : 'TAKEOFF',
            last_heartbeat: new Date().toISOString(),
          };
        } else if (prev.vehicle.state === 'LANDING') {
          // Descent to 0m
          const newAlt = Math.max(0, prev.vehicle.altitude - 6);
          const isLanded = newAlt <= 0;
          nextTelemetry.vehicle = {
            ...prev.vehicle,
            altitude: newAlt,
            speed: isLanded ? 0 : 3.2,
            state: isLanded ? 'DISARMED' : 'LANDING',
            last_heartbeat: new Date().toISOString(),
          };
        }

        // 3. Diagnostics fluctuation
        nextTelemetry.diagnostics = {
          ...prev.diagnostics,
          cpu_usage_percent: Math.max(5, Math.min(95, prev.diagnostics.cpu_usage_percent! + (Math.random() - 0.5) * 4)),
          network_rx_kbps: Math.max(50, prev.diagnostics.network_rx_kbps! + (Math.random() - 0.5) * 20),
          network_tx_kbps: Math.max(5, prev.diagnostics.network_tx_kbps! + (Math.random() - 0.5) * 5),
          uptime_seconds: prev.diagnostics.uptime_seconds + 1,
        };

        // 4. Video Health jitter
        if (prev.video_health.status !== 'LOST') {
          const fpsJitter = (Math.random() - 0.5) * 1.5;
          const bitrateJitter = (Math.random() - 0.5) * 150;
          nextTelemetry.video_health = {
            ...prev.video_health,
            fps: Math.max(15, Math.min(30, prev.video_health.fps + fpsJitter)),
            bitrate_kbps: Math.max(500, Math.min(4000, prev.video_health.bitrate_kbps! + bitrateJitter)),
          };
        }

        nextTelemetry.timestamp = new Date().toISOString();
        return nextTelemetry;
      });
    }, 1000);

    return () => clearInterval(simInterval);
  }, [externalTelemetry]);

  // Handle local simulation command dispatch
  const handleLocalCommand = async (type: CommandType, _params?: Record<string, any>) => {
    const cmdId = `cmd-${Math.floor(Math.random() * 10000)}`;
    const timestamp = new Date().toISOString();

    setLocalLastAck({
      command_id: cmdId,
      command_type: type,
      status: 'SENDING',
      timestamp,
      message: 'Local loopback uplink in progress',
    });

    // Simulate link latency
    setTimeout(() => {
      setTelemetry((prev) => {
        const nextTelemetry = { ...prev };
        let message = 'Simulated command accepted and applied.';
        let error_message = undefined;

        // Command logic execution
        if (type === 'SET_MODE_STANDBY') {
          nextTelemetry.vehicle.mode = 'STANDBY';
        } else if (type === 'SET_MODE_TRACKING') {
          if (prev.vehicle.mode === 'FAULT' || prev.vehicle.mode === 'ABORTED') {
            error_message = 'Cannot enter TRACKING from FAULT or ABORTED state.';
          } else {
            nextTelemetry.vehicle.mode = 'TRACKING';
          }
        } else if (type === 'SET_MODE_READY') {
          if (prev.vehicle.mode !== 'TRACKING') {
            error_message = 'Must be in TRACKING mode to enter READY.';
          } else {
            nextTelemetry.vehicle.mode = 'READY';
          }
        } else if (type === 'ABORT_SIMULATION') {
          nextTelemetry.vehicle.mode = 'ABORTED';
        } else if (type === 'RESET_FAULT') {
          if (prev.vehicle.mode !== 'FAULT') {
            error_message = 'System is not in FAULT state.';
          } else {
            nextTelemetry.vehicle.mode = 'STANDBY';
          }
        }

        // Add to event logs
        const newEvent = {
          id: `evt-${Date.now()}`,
          timestamp: new Date().toISOString(),
          severity: (error_message ? 'ERROR' : 'INFO') as any,
          message: error_message 
            ? `Command reject: ${error_message}`
            : `Simulated local command [${type}] executed successfully.`,
          source: 'COMMAND_UPLINK',
        };
        nextTelemetry.events = [newEvent, ...prev.events].slice(0, 100);

        setLocalLastAck({
          command_id: cmdId,
          command_type: type,
          status: error_message ? 'REJECTED_INVALID_TRANSITION' : 'EXECUTED',
          timestamp: new Date().toISOString(),
          message: error_message || message,
        });

        return nextTelemetry;
      });
    }, 400);
  };

  // Safe launcher events
  const handleToggleKey = () => {
    setTelemetry((prev) => {
      const inserted = !prev.launchbox.key_inserted;
      const newEvent = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        severity: 'INFO' as const,
        message: inserted ? 'Simulation physical safety key: INSERTED.' : 'Simulation physical safety key: REMOVED.',
        source: 'LAUNCHBOX',
      };
      
      return {
        ...prev,
        events: [newEvent, ...prev.events],
        launchbox: {
          ...prev.launchbox,
          key_inserted: inserted,
          safety_switch: inserted ? prev.launchbox.safety_switch : true, // Auto safe if key removed
          status: inserted ? 'STANDBY' : 'NOT_READY',
        },
      };
    });
  };

  const handleToggleSafety = () => {
    setTelemetry((prev) => {
      const active = !prev.launchbox.safety_switch;
      const newEvent = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        severity: (active ? 'INFO' : 'WARNING') as 'INFO' | 'WARNING',
        message: active ? 'Simulated safety switch: ENGAGED (Safe Mode).' : 'Simulated safety switch: DISENGAGED (ARMS ENABLED).',
        source: 'LAUNCHBOX',
      };

      return {
        ...prev,
        events: [newEvent, ...prev.events],
        launchbox: {
          ...prev.launchbox,
          safety_switch: active,
          status: active ? 'STANDBY' : 'READY',
        },
      };
    });
  };

  const handleFireCell = (cellId: number) => {
    setTelemetry((prev) => {
      const cells = prev.launchbox.cells!.map((c) => {
        if (c.cell_id === cellId) {
          return { ...c, status: 'FIRED' as const, temperature: 48.2 };
        }
        return c;
      });

      const firedCell = prev.launchbox.cells!.find(c => c.cell_id === cellId);
      const newEvent = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        severity: 'WARNING' as const,
        message: `Simulated trigger activated. Cell ${cellId} successfully deployed payload: ${firedCell?.payload_type}.`,
        source: 'LAUNCHBOX',
      };

      return {
        ...prev,
        events: [newEvent, ...prev.events],
        launchbox: {
          ...prev.launchbox,
          cells,
          status: 'LAUNCHED',
        },
      };
    });
  };

  // Reclassify tracks locally
  const handleUpdateTrackCategory = (trackId: string, category: 'friendly' | 'hostile' | 'neutral' | 'unknown') => {
    setTelemetry((prev) => {
      const tracks = prev.tracks.map((t) => {
        if (t.track_id === trackId) {
          return { ...t, category, last_update_timestamp: new Date().toISOString() };
        }
        return t;
      });

      const newEvent = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        severity: 'INFO' as const,
        message: `Manual classification update: Track ${trackId} set to [${category.toUpperCase()}].`,
        source: 'TACTICAL_NET',
      };

      return {
        ...prev,
        tracks,
        events: [newEvent, ...prev.events],
      };
    });
  };

  const selectedTrack = telemetry.tracks.find((t) => t.track_id === selectedTrackId) || null;

  return (
    <div className="gcs-dashboard">
      {/* LEFT COLUMN: Radar Scope */}
      <div style={{ gridRow: 'span 2' }}>
        <RadarView
          tracks={telemetry.tracks}
          vehicle={telemetry.vehicle}
          selectedTrackId={selectedTrackId}
          onSelectTrack={setSelectedTrackId}
        />
      </div>

      {/* CENTER COLUMN */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <TrackPanel
          selectedTrack={selectedTrack}
          onClearSelection={() => setSelectedTrackId(null)}
          onUpdateCategory={handleUpdateTrackCategory}
        />
        <VehiclePanel vehicle={telemetry.vehicle} />
      </div>

      {/* RIGHT COLUMN */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <ModeControl
          vehicle={telemetry.vehicle}
          onSendCommand={externalTelemetry && onSendCommand ? onSendCommand : handleLocalCommand}
          lastAck={externalTelemetry ? externalLastAck : localLastAck}
        />
        <LaunchboxPanel
          launchbox={telemetry.launchbox}
          onToggleSafety={handleToggleSafety}
          onToggleKey={handleToggleKey}
          onFireCell={handleFireCell}
        />
      </div>

      {/* BOTTOM SPAN: Video Feed, Event Logs, Diagnostics */}
      <div 
        style={{ 
          gridColumn: 'span 3', 
          display: 'grid', 
          gridTemplateColumns: '1fr 1.5fr 1fr', 
          gap: '12px',
          height: '240px'
        }}
      >
        <VideoHealthPanel videoHealth={telemetry.video_health} />
        <EventLog events={telemetry.events} />
        <DiagnosticsPanel diagnostics={telemetry.diagnostics} />
      </div>
    </div>
  );
};
