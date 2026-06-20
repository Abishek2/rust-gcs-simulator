import React from 'react';
import type { Launchbox, LaunchCell } from '../types/launchbox';

interface LaunchboxPanelProps {
  launchbox: Launchbox | null;
  onToggleSafety: () => void;
  onToggleKey: () => void;
  onFireCell: (cellId: number) => void;
}

export const LaunchboxPanel: React.FC<LaunchboxPanelProps> = ({
  launchbox,
  onToggleSafety,
  onToggleKey,
  onFireCell,
}) => {
  if (!launchbox) {
    return (
      <div className="gcs-panel" style={{ height: '100%' }}>
        <div className="gcs-panel-header">Simulated Launcher Status</div>
        <div 
          className="gcs-panel-body"
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            color: 'var(--color-text-dim)',
            height: '100%',
            fontFamily: 'var(--font-display)',
            fontSize: '0.85rem'
          }}
        >
          <span className="blink">LAUNCH PANEL LINK LOST</span>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: Launchbox['status']) => {
    switch (status) {
      case 'READY':
        return <span className="badge badge-success">READY</span>;
      case 'STANDBY':
        return <span className="badge badge-info">STANDBY</span>;
      case 'LAUNCHED':
        return <span className="badge badge-success blink">LAUNCHED</span>;
      case 'ERROR':
        return <span className="badge badge-danger blink">ERROR</span>;
      case 'NOT_READY':
      default:
        return <span className="badge badge-warning">NOT READY</span>;
    }
  };

  const getCellStatusColor = (status: LaunchCell['status']) => {
    switch (status) {
      case 'FIRED':
        return 'var(--color-text-dim)';
      case 'ARMED':
        return 'var(--color-danger)';
      case 'LOADED':
        return 'var(--color-success)';
      case 'EMPTY':
      default:
        return 'var(--color-text-secondary)';
    }
  };

  const isArmedAndReady = launchbox.key_inserted && !launchbox.safety_switch;

  return (
    <div className="gcs-panel" style={{ height: '100%' }}>
      <div className="gcs-panel-header">
        <span>Launcher Controls (Simulated)</span>
        {getStatusBadge(launchbox.status)}
      </div>
      <div className="gcs-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Key and Safety Switch Status */}
        <div className="grid-2" style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.02)' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>SIMULATION KEY</div>
            <button 
              className={`gcs-btn ${launchbox.key_inserted ? 'gcs-btn-success' : ''}`}
              style={{ width: '100%', fontSize: '0.75rem', padding: '4px' }}
              onClick={onToggleKey}
            >
              {launchbox.key_inserted ? 'KEY INSERTED' : 'INSERT KEY'}
            </button>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>SAFETY SWITCH</div>
            <button 
              className={`gcs-btn ${launchbox.safety_switch ? '' : 'gcs-btn-danger blink'}`}
              style={{ width: '100%', fontSize: '0.75rem', padding: '4px' }}
              onClick={onToggleSafety}
              disabled={!launchbox.key_inserted}
            >
              {launchbox.safety_switch ? 'SAFE MODE ACTIVE' : 'ARMS ENABLED'}
            </button>
          </div>
        </div>

        {/* Multi-Cell Status Grid */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
            CELL MONITOR (6-BAY PROBE LAUNCHER)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {launchbox.cells.map((cell) => (
              <div 
                key={cell.cell_id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--color-cyber-blue)', fontWeight: 'bold' }}>BAY {cell.cell_id}</span>
                  <span 
                    style={{ 
                      color: getCellStatusColor(cell.status),
                      fontWeight: 'bold',
                      fontSize: '0.7rem',
                      background: 'rgba(0,0,0,0.3)',
                      padding: '1px 6px',
                      borderRadius: '2px'
                    }}
                  >
                    {cell.status}
                  </span>
                  <span style={{ color: 'var(--color-text-dim)', fontSize: '0.7rem' }}>
                    ({cell.payload_type})
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: cell.temperature > 38 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
                    {cell.temperature.toFixed(1)}°C
                  </span>
                  <button
                    className="gcs-btn gcs-btn-danger"
                    style={{ padding: '2px 8px', fontSize: '0.65rem' }}
                    disabled={!isArmedAndReady || cell.status !== 'ARMED' && cell.status !== 'LOADED'}
                    onClick={() => onFireCell(cell.cell_id)}
                  >
                    FIRE SIM
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Warnings */}
        <div style={{ 
          fontSize: '0.65rem', 
          color: 'var(--color-text-dim)', 
          textAlign: 'center', 
          border: '1px dashed rgba(239, 68, 68, 0.2)',
          background: 'rgba(239, 68, 68, 0.02)',
          padding: '6px',
          borderRadius: '4px'
        }}>
          {!launchbox.key_inserted && "⚠️ INHIBIT: Insert simulation key to activate safety switch control."}
          {launchbox.key_inserted && launchbox.safety_switch && "⚠️ SAFE: Disengage Safe Mode to enable simulated cell triggers."}
          {isArmedAndReady && "⚡ WARNING: System is armed. Firing is simulated-only flare/probe deployments."}
        </div>
      </div>
    </div>
  );
};
