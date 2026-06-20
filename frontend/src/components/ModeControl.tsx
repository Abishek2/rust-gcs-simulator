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
      // Keep loading spinner briefly to simulate command link latency
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

  const isArmed = vehicle.state !== 'DISARMED';
  const isFlying = vehicle.state === 'FLYING' || vehicle.state === 'TAKEOFF';

  return (
    <div className="gcs-panel" style={{ height: '100%' }}>
      <div className="gcs-panel-header">Command & Control (Simulated)</div>
      <div className="gcs-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Arming Controls */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
            POWER / PROPULSION SYSTEM
          </div>
          <div className="flex-row">
            <button
              className={`gcs-btn gcs-btn-danger ${isArmed ? 'gcs-btn-success' : ''}`}
              style={{ flex: 1, fontWeight: 'bold' }}
              onClick={() => handleCommand(isArmed ? 'DISARM' : 'ARM')}
              disabled={pendingCmd !== null || isFlying}
            >
              {pendingCmd === 'ARM' || pendingCmd === 'DISARM' ? 'TRANSMITTING...' : isArmed ? 'ARMED' : 'DISARM VEHICLE'}
            </button>
            <button
              className="gcs-btn"
              style={{ flex: 1 }}
              onClick={() => handleCommand('RTL')}
              disabled={!isArmed || !isFlying || pendingCmd !== null}
            >
              RETURN TO LAUNCH (RTL)
            </button>
          </div>
        </div>

        {/* Flight Modes Selection */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
            FLIGHT MODE SELECT
          </div>
          <div className="grid-2">
            {(['MANUAL', 'GUIDED', 'AUTO', 'LAND'] as const).map((mode) => (
              <button
                key={mode}
                className={`gcs-btn ${vehicle.flight_mode === mode ? 'gcs-btn-success' : ''}`}
                style={{ fontSize: '0.75rem', padding: '4px' }}
                onClick={() => handleCommand('SET_MODE', { mode })}
                disabled={!isArmed || pendingCmd !== null}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Action Commands */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
            FLIGHT OPERATIONS
          </div>
          <div className="flex-row">
            <button
              className="gcs-btn"
              style={{ flex: 1 }}
              onClick={() => handleCommand('TAKEOFF', { altitude: 100 })}
              disabled={!isArmed || isFlying || pendingCmd !== null}
            >
              TAKEOFF (100m)
            </button>
            <button
              className="gcs-btn"
              style={{ flex: 1 }}
              onClick={() => handleCommand('LAND')}
              disabled={!isArmed || !isFlying || pendingCmd !== null}
            >
              LAND IMMEDIATELY
            </button>
          </div>
        </div>

        {/* Command Acknowledgement Feed */}
        <div style={{
          marginTop: 'auto',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '6px 8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem'
        }}>
          <div style={{ color: 'var(--color-cyber-blue)', fontSize: '0.65rem', marginBottom: '2px', textTransform: 'uppercase' }}>
            UPLINK TELEMETRY CONSOLE
          </div>
          {pendingCmd ? (
            <div style={{ color: 'var(--color-warning)' }} className="blink">
              &gt;&gt; UPLINK: SENDING {pendingCmd}...
            </div>
          ) : lastAck ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>CMD: {lastAck.command_type}</span>
                <span 
                  className="badge" 
                  style={{ 
                    fontSize: '0.6rem',
                    padding: '0px 4px',
                    marginLeft: 'auto',
                    borderColor: lastAck.status === 'EXECUTED' || lastAck.status === 'ACCEPTED' ? 'var(--color-success)' : 'var(--color-danger)',
                    color: lastAck.status === 'EXECUTED' || lastAck.status === 'ACCEPTED' ? 'var(--color-success)' : 'var(--color-danger)'
                  }}
                >
                  {lastAck.status}
                </span>
              </div>
              {lastAck.error_message && (
                <div style={{ color: 'var(--color-danger)', fontSize: '0.65rem', marginTop: '2px' }}>
                  ERR: {lastAck.error_message}
                </div>
              )}
              <div style={{ fontSize: '0.6rem', color: 'var(--color-text-dim)', textAlign: 'right', marginTop: '2px' }}>
                ACK AT: {new Date(lastAck.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--color-text-dim)' }}>
              &gt;&gt; NO ACTIVE UPLINK COMMANDS
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
