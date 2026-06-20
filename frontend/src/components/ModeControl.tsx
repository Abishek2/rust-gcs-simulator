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
  const [localPending, setLocalPending] = useState<boolean>(false);

  const handleCommand = async (type: CommandType) => {
    setLocalPending(true);
    try {
      await onSendCommand(type);
    } catch (e) {
      console.error('[Command Control] Command submission failed:', e);
    } finally {
      setLocalPending(false);
    }
  };

  if (!vehicle) {
    return (
      <div className="gcs-panel" style={{ height: '100%' }}>
        <div className="gcs-panel-header">Simulated Command Link</div>
        <div className="gcs-panel-body" style={{ display: 'flex', justifySelf: 'center', alignSelf: 'center', color: 'var(--color-text-dim)' }}>
          LINK DISCONNECTED
        </div>
      </div>
    );
  }

  // Determine if a command is currently pending/executing (SENDING or ACK_RECEIVED)
  const isCommandExecuting = localPending || (lastAck !== null && (lastAck.status === 'SENDING' || lastAck.status === 'ACK_RECEIVED'));

  // Define transition permission flags based on backend rules
  const currentMode = vehicle.mode; // STANDBY | TRACKING | READY | FAULT | ABORTED
  
  const isStandbyAllowed = currentMode !== 'FAULT' && currentMode !== 'ABORTED';
  const isTrackingAllowed = currentMode !== 'FAULT' && currentMode !== 'ABORTED';
  const isResetFaultAllowed = currentMode === 'FAULT';

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

  const getStatusColor = (status: CommandAcknowledgement['status']) => {
    switch (status) {
      case 'EXECUTED':
      case 'ACK_RECEIVED':
        return 'var(--color-success)';
      case 'SENDING':
        return 'var(--color-warning)';
      case 'ACK_TIMEOUT':
      case 'REJECTED_INVALID_TRANSITION':
      default:
        return 'var(--color-danger)';
    }
  };

  const getStatusLabel = (status: CommandAcknowledgement['status']) => {
    switch (status) {
      case 'SENDING':
        return 'SENDING...';
      case 'ACK_RECEIVED':
        return 'ACK RECEIVED';
      case 'ACK_TIMEOUT':
        return 'TIMEOUT';
      case 'REJECTED_INVALID_TRANSITION':
        return 'REJECTED';
      case 'EXECUTED':
        return 'EXECUTED';
      default:
        return status;
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

        {/* Command Grid */}
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginBottom: '3px', fontFamily: 'var(--font-mono)' }}>
            OPERATOR STATE ACTIONS
          </div>
          <div className="grid-2">
            <button
              className={`gcs-btn ${currentMode === 'STANDBY' ? 'gcs-btn-success' : ''}`}
              style={{ fontSize: '0.7rem', padding: '4px' }}
              onClick={() => handleCommand('SET_MODE_STANDBY')}
              disabled={isCommandExecuting || !isStandbyAllowed || currentMode === 'STANDBY'}
            >
              Set Standby
            </button>
            
            <button
              className={`gcs-btn ${currentMode === 'TRACKING' ? 'gcs-btn-success' : ''}`}
              style={{ fontSize: '0.7rem', padding: '4px' }}
              onClick={() => handleCommand('SET_MODE_TRACKING')}
              disabled={isCommandExecuting || !isTrackingAllowed || currentMode === 'TRACKING'}
            >
              Set Tracking
            </button>

            <button
              className={`gcs-btn gcs-btn-success ${currentMode === 'READY' ? 'gcs-btn-success' : ''}`}
              style={{ fontSize: '0.7rem', padding: '4px', gridColumn: 'span 2' }}
              onClick={() => handleCommand('SET_MODE_READY')}
              disabled={isCommandExecuting || currentMode !== 'TRACKING'}
            >
              Set Ready
            </button>
          </div>
        </div>

        {/* System Operations */}
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginBottom: '3px', fontFamily: 'var(--font-mono)' }}>
            SYSTEM DIAGNOSTICS & FAULTS
          </div>
          <div className="grid-2">
            <button
              className="gcs-btn"
              style={{ fontSize: '0.7rem', padding: '4px' }}
              onClick={() => handleCommand('RUN_SYSTEM_CHECK')}
              disabled={isCommandExecuting}
            >
              Run System Check
            </button>

            <button
              className={`gcs-btn ${isResetFaultAllowed ? 'gcs-btn-success blink' : ''}`}
              style={{ fontSize: '0.7rem', padding: '4px' }}
              onClick={() => handleCommand('RESET_FAULT')}
              disabled={isCommandExecuting || !isResetFaultAllowed}
            >
              Reset Fault
            </button>
          </div>
        </div>

        {/* Emergency Abort (Always enabled as a critical fail-safe override) */}
        <div>
          <button
            className="gcs-btn gcs-btn-danger blink"
            style={{ width: '100%', fontWeight: 'bold', fontSize: '0.75rem', padding: '4px' }}
            onClick={() => handleCommand('ABORT_SIMULATION')}
            disabled={currentMode === 'ABORTED'}
          >
            Abort Simulation
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
          {lastAck ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>CMD: {lastAck.command_type}</span>
                <span 
                  className="badge" 
                  style={{ 
                    fontSize: '0.55rem',
                    padding: '0px 4px',
                    marginLeft: 'auto',
                    borderColor: getStatusColor(lastAck.status),
                    color: getStatusColor(lastAck.status)
                  }}
                >
                  {getStatusLabel(lastAck.status)}
                </span>
              </div>
              {lastAck.message && (
                <div style={{ color: lastAck.status === 'REJECTED_INVALID_TRANSITION' || lastAck.status === 'ACK_TIMEOUT' ? 'var(--color-danger)' : 'var(--color-text-secondary)', fontSize: '0.6rem', marginTop: '2px', wordBreak: 'break-all' }}>
                  MSG: {lastAck.message}
                </div>
              )}
              <div style={{ fontSize: '0.55rem', color: 'var(--color-text-dim)', textAlign: 'right', marginTop: '1px' }}>
                UTC: {new Date(lastAck.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--color-text-dim)' }}>
              &gt;&gt; UPLINK READY (AWAITING INPUT)
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
