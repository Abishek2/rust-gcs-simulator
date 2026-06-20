import React, { useState } from 'react';
import type { Vehicle } from '../types/vehicle';
import type { CommandType, CommandAcknowledgement } from '../types/command';

interface ModeControlProps {
  vehicle: Vehicle | null;
  onSendCommand: (type: CommandType, params?: Record<string, any>) => Promise<void>;
  lastAck: CommandAcknowledgement | null;
}

export const ModeControl: React.FC<ModeControlProps> = ({
  vehicle,
  onSendCommand,
  lastAck,
}) => {
  const [pendingCmd, setPendingCmd] = useState<string | null>(null);

  const handleCommand = async (type: CommandType, params: Record<string, any> = {}) => {
    setPendingCmd(type);
    try {
      await onSendCommand(type, params);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => {
        setPendingCmd(null);
      }, 500);
    }
  };

  if (!vehicle) {
    return (
      <div className="gcs-panel" style={{ height: '100%' }}>
        <div className="gcs-panel-header">Simulated Command Link</div>
        <div className="gcs-panel-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-text-dim)' }}>
          LINK DISCONNECTED
        </div>
      </div>
    );
  }

  const getModeBadgeClass = (mode: Vehicle['mode']) => {
    switch (mode) {
      case 'READY':
        return 'badge-success';
      case 'TRACKING':
        return 'badge-info';
      case 'STANDBY':
        return 'badge-warning';
      case 'FAULT':
      case 'ABORTED':
      default:
        return 'badge-danger';
    }
  };

  return (
    <div className="gcs-panel" style={{ height: '100%' }}>
      <div className="gcs-panel-header">Command & Control (Simulated)</div>
      <div className="gcs-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* Core Mode Display */}
        <div className="flex-between" style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.02)' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>VEHICLE LINK</div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: vehicle.connection_state === 'HEALTHY' ? 'var(--color-success)' : 'var(--color-warning)' }}>
              {vehicle.connection_state}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>ACTIVE MODE</div>
            <span className={`badge ${getModeBadgeClass(vehicle.mode)}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
              {vehicle.mode}
            </span>
          </div>
        </div>

        {/* Tactical Flight Modes (Commands list) */}
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginBottom: '3px', fontFamily: 'var(--font-mono)' }}>
            REQUEST STATE CHANGES
          </div>
          <div className="grid-2">
            <button
              className="gcs-btn"
              style={{ fontSize: '0.7rem', padding: '3px' }}
              onClick={() => handleCommand('SET_MODE', { mode: 'STANDBY' })}
              disabled={pendingCmd !== null || vehicle.mode === 'STANDBY'}
            >
              STANDBY
            </button>
            <button
              className="gcs-btn"
              style={{ fontSize: '0.7rem', padding: '3px' }}
              onClick={() => handleCommand('SET_MODE', { mode: 'TRACKING' })}
              disabled={pendingCmd !== null || vehicle.mode === 'TRACKING'}
            >
              TRACKING
            </button>
            <button
              className="gcs-btn gcs-btn-success"
              style={{ fontSize: '0.7rem', padding: '3px', gridColumn: 'span 2' }}
              onClick={() => handleCommand('SET_MODE', { mode: 'READY' })}
              disabled={pendingCmd !== null || vehicle.mode === 'READY'}
            >
              ENGAGE READY MODE
            </button>
          </div>
        </div>

        {/* Emergency Abort Trigger */}
        <div>
          <button
            className="gcs-btn gcs-btn-danger blink"
            style={{ width: '100%', fontWeight: 'bold', fontSize: '0.75rem', padding: '4px' }}
            onClick={() => handleCommand('RTL')} // Mapped as Abort/RTL command
            disabled={pendingCmd !== null || vehicle.mode === 'ABORTED'}
          >
            ABORT SIMULATED WORKFLOW
          </button>
        </div>

        {/* Command Uplink Console */}
        <div style={{
          marginTop: 'auto',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '4px 6px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem'
        }}>
          <div style={{ color: 'var(--color-cyber-blue)', fontSize: '0.6rem', marginBottom: '1px', textTransform: 'uppercase' }}>
            COMMAND CONSOLE LINK
          </div>
          {pendingCmd ? (
            <div style={{ color: 'var(--color-warning)' }} className="blink">
              &gt;&gt; TX: TRANSMITTING MODE REQ...
            </div>
          ) : lastAck ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'between' }}>
                <span>ACK CODE: {lastAck.status}</span>
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--color-text-dim)', textAlign: 'right' }}>
                TIME: {new Date(lastAck.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--color-text-dim)' }}>
              &gt;&gt; UPLINK READY (SIMULATION STANDBY)
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
