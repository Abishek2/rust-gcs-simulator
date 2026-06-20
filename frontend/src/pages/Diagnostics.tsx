import React, { useEffect, useState } from 'react';
import { getMockTelemetry } from '../utils/mockData';
import type { Diagnostics } from '../types/diagnostics';

export const DiagnosticsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<Diagnostics>(getMockTelemetry().diagnostics);
  const [hostLogs, setHostLogs] = useState<string[]>([
    'Initializing GCS server processes...',
    'Loading simulated track databases...',
    'Spawning flight controller thread loops...',
    'WebSocket server binding to port 8080...',
    'Telemetry broadcast: ACTIVE at 10Hz rate.',
  ]);

  useEffect(() => {
    const logPool = [
      'Telemetry update packet dispatched: 428 bytes.',
      'Active websocket connections: 1 link.',
      'Flushing simulated radar query buffers.',
      'Diagnostics metrics refresh cycle complete.',
      'Checking hardware subsystem emulation layer: NOMINAL.',
      'Garbage collector sweep: 1.4MB reclaimed.',
      'Syncing clock offset with simulation time: +0.02ms.',
    ];

    const interval = setInterval(() => {
      // Fluctuate metrics
      setMetrics((prev) => ({
        ...prev,
        cpu_usage_percent: Math.max(5, Math.min(95, prev.cpu_usage_percent! + (Math.random() - 0.5) * 6)),
        memory_usage_mb: Math.max(100, Math.min(1024, prev.memory_usage_mb! + (Math.random() - 0.5) * 8)),
        network_rx_kbps: Math.max(50, prev.network_rx_kbps! + (Math.random() - 0.5) * 30),
        network_tx_kbps: Math.max(5, prev.network_tx_kbps! + (Math.random() - 0.5) * 10),
        uptime_seconds: prev.uptime_seconds + 2,
      }));

      // Add logs
      if (Math.random() > 0.4) {
        const newLog = logPool[Math.floor(Math.random() * logPool.length)];
        const time = new Date().toLocaleTimeString();
        setHostLogs((prev) => [...prev.slice(-30), `[${time}] ${newLog}`]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', padding: '16px', height: 'calc(100vh - var(--header-height) - 40px)', boxSizing: 'border-box' }}>
      
      {/* System Resources Left Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="gcs-panel" style={{ flex: 1 }}>
          <div className="gcs-panel-header">GCS Virtual Host Specs</div>
          <div className="gcs-panel-body font-mono" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>SIMULATION ENGINE</div>
              <div style={{ color: 'var(--color-cyber-blue)', fontWeight: 'bold' }}>RUST GCS CORE v1.0</div>
            </div>
            
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>SIMULATION FREQUENCY</div>
              <div style={{ color: '#fff' }}>10.0 Hz (100ms cycles)</div>
            </div>

            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>ACTIVE SERVICES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                <span className="badge badge-success" style={{ alignSelf: 'flex-start' }}>WebSockets (Port 8080)</span>
                <span className="badge badge-success" style={{ alignSelf: 'flex-start' }}>HTTP REST (Port 8080)</span>
                <span className="badge badge-success" style={{ alignSelf: 'flex-start' }}>Radar Tracker (Emulated)</span>
              </div>
            </div>

            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>HOST MEMORY ALLOCATION</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>
                {metrics.memory_usage_mb!.toFixed(1)} / 1024 MB
              </div>
            </div>

            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>HOST CPU LOAD</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-cyber-blue)' }}>
                {metrics.cpu_usage_percent!.toFixed(1)}%
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>NET SPEED SUMMARY</div>
              <div style={{ marginTop: '4px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>📥 RX Rate: {metrics.network_rx_kbps!.toFixed(1)} KB/s</div>
                <div>📤 TX Rate: {metrics.network_tx_kbps!.toFixed(1)} KB/s</div>
                <div>❌ Packets Lost: {metrics.packet_loss_percent!.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Host Console Logs Right Column */}
      <div className="gcs-panel" style={{ height: '100%' }}>
        <div className="gcs-panel-header">GCS Virtual Host Console Log</div>
        <div 
          className="gcs-panel-body font-mono" 
          style={{ 
            background: '#040608', 
            color: 'var(--color-success)', 
            padding: '12px',
            fontSize: '0.8rem',
            lineHeight: '1.5',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          {hostLogs.map((log, index) => (
            <div key={index} style={{ wordBreak: 'break-all' }}>
              &gt; {log}
            </div>
          ))}
          <div className="blink" style={{ color: 'var(--color-cyber-blue)', marginTop: '6px' }}>
            &gt; SYSTEM CORE STANDBY: AWAITING TELEMETRY QUERIES...
          </div>
        </div>
      </div>

    </div>
  );
};
export default DiagnosticsPage;
