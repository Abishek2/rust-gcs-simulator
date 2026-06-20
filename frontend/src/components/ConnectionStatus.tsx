import React from 'react';

export type WSConnectionState = 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';

interface ConnectionStatusProps {
  connectionState: WSConnectionState;
  backendHealth: 'ok' | 'error' | 'loading';
  stale: boolean;
  lastUpdate: Date | null;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connectionState,
  backendHealth,
  stale,
  lastUpdate,
}) => {
  const getStatusBadge = () => {
    switch (connectionState) {
      case 'CONNECTED':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span className="indicator-dot" style={{ color: 'var(--color-success)' }} />
            CONNECTED
          </span>
        );
      case 'CONNECTING':
        return (
          <span className="badge badge-info blink" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span className="indicator-dot" style={{ color: 'var(--color-cyber-blue)' }} />
            CONNECTING
          </span>
        );
      case 'RECONNECTING':
        return (
          <span className="badge badge-warning blink" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span className="indicator-dot" style={{ color: 'var(--color-warning)' }} />
            RECONNECTING
          </span>
        );
      case 'DISCONNECTED':
      default:
        return (
          <span className="badge badge-danger blink" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span className="indicator-dot" style={{ color: 'var(--color-danger)' }} />
            DISCONNECTED
          </span>
        );
    }
  };

  const getHealthBadge = () => {
    switch (backendHealth) {
      case 'ok':
        return <span className="badge badge-success">API: OK</span>;
      case 'error':
        return <span className="badge badge-danger">API: FAIL</span>;
      case 'loading':
      default:
        return <span className="badge badge-info blink">API: CHECKING</span>;
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'NEVER';
    const hours = String(lastUpdate.getHours()).padStart(2, '0');
    const minutes = String(lastUpdate.getMinutes()).padStart(2, '0');
    const seconds = String(lastUpdate.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '0 12px',
      height: '100%',
      fontFamily: 'var(--font-display)',
    }}>
      {/* Simulation Badge */}
      <div 
        className="badge badge-danger" 
        style={{ 
          fontSize: '0.75rem', 
          border: '1px dashed var(--color-danger)',
          background: 'rgba(239, 68, 68, 0.15)',
          padding: '4px 8px' 
        }}
      >
        SIMULATION ONLY - PORTFOLIO DEMO
      </div>

      {/* Network Connection */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>LINK:</span>
        {getStatusBadge()}
      </div>

      {/* API Health */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>HEALTH:</span>
        {getHealthBadge()}
      </div>

      {/* Stale Warning */}
      {stale && (
        <div 
          className="badge badge-warning blink" 
          style={{ 
            fontSize: '0.7rem', 
            padding: '2px 6px',
            border: '1px solid var(--color-warning)'
          }}
        >
          STALE TELEMETRY DATA
        </div>
      )}

      {/* Last Update */}
      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
        SYS TIME: <span className="font-mono" style={{ color: 'var(--color-cyber-blue)' }}>{formatLastUpdate()}</span>
      </div>
    </div>
  );
};
