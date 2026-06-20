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
        <div className="gcs-panel-header">Simulated Launchbox Status</div>
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

  const getHealthBadge = (health: Launchbox['health']) => {
    switch (health) {
      case 'OK':
        return <span className="badge badge-success">HEALTH: OK</span>;
      case 'WARNING':
        return <span className="badge badge-warning">HEALTH: WARN</span>;
      case 'FAULT':
      default:
        return <span className="badge badge-danger blink">HEALTH: FAULT</span>;
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

  const getCellStatusLabel = (status: LaunchCell['status']) => {
    switch (status) {
      case 'ARMED':
        return 'SIM READY';
      case 'FIRED':
        return 'TESTED';
      case 'LOADED':
        return 'LOADED';
      case 'EMPTY':
      default:
        return 'EMPTY';
    }
  };

  // Safe defaults if fields are not defined in raw backend packets yet
  const safetySwitch = launchbox.safety_switch !== undefined ? launchbox.safety_switch : true;
  const keyInserted = launchbox.key_inserted !== undefined ? launchbox.key_inserted : false;
  const cells = launchbox.cells || [
    { cell_id: 1, status: 'LOADED', temperature: launchbox.temperature_celsius, payload_type: 'Simulated Flare' },
    { cell_id: 2, status: 'LOADED', temperature: launchbox.temperature_celsius, payload_type: 'Simulated Flare' },
    { cell_id: 3, status: 'EMPTY', temperature: launchbox.temperature_celsius - 1, payload_type: 'None' },
  ];

  const isArmedAndReady = keyInserted && !safetySwitch;

  return (
    <div className="gcs-panel" style={{ height: '100%' }}>
      <div className="gcs-panel-header">
        <span>Launchbox: {launchbox.launchbox_id}</span>
        {getHealthBadge(launchbox.health)}
      </div>
      <div className="gcs-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px' }}>
        
        {/* Real Backend Status Grid */}
        <div className="grid-2 font-mono" style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.02)', fontSize: '0.75rem' }}>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.65rem' }}>BAY DOOR STATE</div>
            <div style={{ fontWeight: 'bold', color: launchbox.door_state === 'OPEN' ? 'var(--color-warning)' : '#fff' }}>
              {launchbox.door_state}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.65rem' }}>VEHICLE PRESENCE</div>
            <div style={{ fontWeight: 'bold', color: launchbox.vehicle_present ? 'var(--color-success)' : 'var(--color-text-dim)' }}>
              {launchbox.vehicle_present ? 'DETECTED' : 'ABSENT'}
            </div>
          </div>
          <div style={{ marginTop: '4px' }}>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.65rem' }}>TEMPERATURE</div>
            <div style={{ fontWeight: 'bold', color: launchbox.temperature_celsius > 35 ? 'var(--color-warning)' : '#fff' }}>
              {launchbox.temperature_celsius.toFixed(1)}°C
            </div>
          </div>
          <div style={{ marginTop: '4px' }}>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.65rem' }}>CHARGING DOCK</div>
            <div style={{ fontWeight: 'bold', color: launchbox.charging ? 'var(--color-success)' : 'var(--color-text-dim)' }}>
              {launchbox.charging ? 'ACTIVE' : 'STANDBY'}
            </div>
          </div>
        </div>

        {/* Key and Safety Switch Status (Mock Interlocks overlay) */}
        <div className="grid-2" style={{ background: 'rgba(0,0,0,0.15)', padding: '6px', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.05)' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginBottom: '3px' }}>SIMULATION KEY</div>
            <button 
              className={`gcs-btn ${keyInserted ? 'gcs-btn-success' : ''}`}
              style={{ width: '100%', fontSize: '0.7rem', padding: '3px 6px' }}
              onClick={onToggleKey}
            >
              {keyInserted ? 'INSERTED' : 'INSERT KEY'}
            </button>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginBottom: '3px' }}>SAFETY LOCK</div>
            <button 
              className={`gcs-btn ${safetySwitch ? '' : 'gcs-btn-danger blink'}`}
              style={{ width: '100%', fontSize: '0.7rem', padding: '3px 6px' }}
              onClick={onToggleSafety}
              disabled={!keyInserted}
            >
              {safetySwitch ? 'LOCKED' : 'UNLOCKED'}
            </button>
          </div>
        </div>

        {/* Multi-Cell Status Grid */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
            CELL BAY MONITOR
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {cells.map((cell) => (
              <div 
                key={cell.cell_id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '4px 6px',
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: '3px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--color-cyber-blue)', fontWeight: 'bold' }}>BAY {cell.cell_id}</span>
                  <span 
                    style={{ 
                      color: getCellStatusColor(cell.status),
                      fontWeight: 'bold',
                      fontSize: '0.65rem',
                      background: 'rgba(0,0,0,0.2)',
                      padding: '0px 4px',
                      borderRadius: '2px'
                    }}
                  >
                    {getCellStatusLabel(cell.status)}
                  </span>
                  <span style={{ color: 'var(--color-text-dim)', fontSize: '0.65rem' }}>
                    ({cell.payload_type})
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.65rem' }}>
                    {cell.temperature.toFixed(1)}°C
                  </span>
                  <button
                    className="gcs-btn gcs-btn-danger"
                    style={{ padding: '1px 6px', fontSize: '0.6rem' }}
                    disabled={!isArmedAndReady || cell.status !== 'ARMED' && cell.status !== 'LOADED'}
                    onClick={() => onFireCell(cell.cell_id)}
                  >
                    TEST
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
          {!keyInserted && "⚠️ INHIBIT: Insert simulation key to activate safety switch control."}
          {keyInserted && safetySwitch && "⚠️ SAFE: Disengage Safe Mode to enable simulated cell triggers."}
          {isArmedAndReady && "⚡ STATUS: Simulation mode ready. Actions are simulated-only flare/asset checks."}
        </div>

      </div>
    </div>
  );
};
