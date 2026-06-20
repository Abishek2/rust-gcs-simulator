import React from 'react';
import type { Diagnostics } from '../types/diagnostics';

interface DiagnosticsPanelProps {
  diagnostics: Diagnostics | null;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ diagnostics }) => {
  if (!diagnostics) {
    return (
      <div className="gcs-panel" style={{ height: '100%' }}>
        <div className="gcs-panel-header">Diagnostics Console</div>
        <div className="gcs-panel-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-text-dim)' }}>
          DIAGNOSTIC UNLINKED
        </div>
      </div>
    );
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hrs = Math.floor((seconds % (3600 * 24)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      days > 0 ? `${days}d` : '',
      String(hrs).padStart(2, '0') + 'h',
      String(mins).padStart(2, '0') + 'm',
      String(secs).padStart(2, '0') + 's'
    ].filter(Boolean).join(' ');
  };

  const getUsageBar = (percent: number) => {
    let barColor = 'var(--color-cyber-blue)';
    if (percent > 85) barColor = 'var(--color-danger)';
    else if (percent > 65) barColor = 'var(--color-warning)';

    return (
      <div style={{
        height: '6px',
        width: '100%',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '3px',
        overflow: 'hidden',
        marginTop: '3px'
      }}>
        <div style={{
          height: '100%',
          width: `${percent}%`,
          background: barColor,
          boxShadow: `0 0 4px ${barColor}`,
          borderRadius: '3px',
          transition: 'width 0.3s ease-out'
        }} />
      </div>
    );
  };

  return (
    <div className="gcs-panel" style={{ height: '100%' }}>
      <div className="gcs-panel-header">
        <span>GCS Diagnostics</span>
        <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>ONLINE</span>
      </div>
      <div className="gcs-panel-body font-mono" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px' }}>
        
        {/* Host Resources */}
        <div>
          <div className="flex-between" style={{ fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>CPU UTILITY</span>
            <span style={{ color: '#fff' }}>{diagnostics.cpu_usage_percent.toFixed(1)}%</span>
          </div>
          {getUsageBar(diagnostics.cpu_usage_percent)}
        </div>

        <div>
          <div className="flex-between" style={{ fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>MEM UTILITY</span>
            <span style={{ color: '#fff' }}>{diagnostics.memory_usage_mb.toFixed(1)} MB</span>
          </div>
          {getUsageBar((diagnostics.memory_usage_mb / 1024) * 100)} {/* Assuming 1GB limit for simulation representation */}
        </div>

        <div>
          <div className="flex-between" style={{ fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>STORAGE LOAD</span>
            <span style={{ color: '#fff' }}>{diagnostics.disk_usage_percent.toFixed(1)}%</span>
          </div>
          {getUsageBar(diagnostics.disk_usage_percent)}
        </div>

        {/* Network Metrics */}
        <div style={{ 
          marginTop: '6px',
          background: 'rgba(0,0,0,0.15)',
          padding: '6px 8px',
          borderRadius: '4px',
          border: '1px solid rgba(255,255,255,0.02)',
          fontSize: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div className="flex-between">
            <span style={{ color: 'var(--color-text-secondary)' }}>NET DNL:</span>
            <span style={{ color: 'var(--color-cyber-blue)' }}>{diagnostics.network_rx_kbps.toFixed(1)} KB/s</span>
          </div>
          <div className="flex-between">
            <span style={{ color: 'var(--color-text-secondary)' }}>NET UPL:</span>
            <span style={{ color: 'var(--color-cyber-blue)' }}>{diagnostics.network_tx_kbps.toFixed(1)} KB/s</span>
          </div>
          <div className="flex-between">
            <span style={{ color: 'var(--color-text-secondary)' }}>PACKET LOSS:</span>
            <span style={{ color: diagnostics.packet_loss_percent > 1.0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
              {diagnostics.packet_loss_percent.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* System Uptime */}
        <div className="flex-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', fontSize: '0.75rem', marginTop: 'auto' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>HOST UPTIME:</span>
          <span style={{ color: 'var(--color-cyber-blue)' }}>{formatUptime(diagnostics.uptime_seconds)}</span>
        </div>

      </div>
    </div>
  );
};
