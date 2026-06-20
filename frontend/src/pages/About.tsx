import React from 'react';

export const AboutPage: React.FC = () => {
  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: 'calc(100vh - var(--header-height) - 20px)', boxSizing: 'border-box' }}>
      <div 
        className="gcs-panel" 
        style={{ 
          maxWidth: '800px', 
          margin: '0 auto', 
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div className="gcs-panel-header" style={{ fontSize: '1rem' }}>
          GCS PROJECT OVERVIEW & SECURITY BRIEFING
        </div>
        <div className="gcs-panel-body" style={{ lineHeight: '1.6', fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
          
          {/* Important safety banner */}
          <div 
            style={{ 
              background: 'rgba(239, 68, 68, 0.12)', 
              border: '1px solid var(--color-danger)', 
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '20px',
              color: 'var(--color-text-primary)'
            }}
          >
            <h3 style={{ margin: '0 0 6px 0', fontFamily: 'var(--font-display)', color: 'var(--color-danger)', fontSize: '0.95rem' }}>
              ⚠️ SAFETY BOUNDARY NOTICE
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              This software is a <strong>simulation-only portfolio project</strong>. It does not integrate with physical UAVs, hardware actuators, weapons systems, or live aircraft controllers. All commands (such as arming, takeoff, and cell launches) are fully simulated in local system memory. No weapon telemetry or autopilot controls are contained herein.
            </p>
          </div>

          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-cyber-blue)', fontSize: '1rem', marginTop: '0' }}>
            PROJECT OBJECTIVES
          </h3>
          <p>
            The <strong>Rust Ground Control Station (GCS) Simulator</strong> is designed to showcase modern full-stack development skills required for operator-facing telemetric dashboards. It exercises concurrent state management, real-time message handling over WebSockets, low-latency rendering, and reactive command pipelines.
          </p>

          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-cyber-blue)', fontSize: '1rem', marginTop: '20px' }}>
            SYSTEM ARCHITECTURE
          </h3>
          <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
            <li style={{ marginBottom: '6px' }}>
              <strong>Rust Backend (Emulated):</strong> Implements a concurrent telemetry broadcast engine, handles command requests with verification logic, serves static REST APIs for configuration logs, and keeps track of simulated vehicle coordinates.
            </li>
            <li style={{ marginBottom: '6px' }}>
              <strong>React / TypeScript Frontend:</strong> Vite-powered UI rendering. Uses custom HTML5 Canvas overlays for tactical radar viewports, handles responsive layout widgets, checks key safety switches, and manages live network reconnection loops.
            </li>
          </ul>

          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-cyber-blue)', fontSize: '1rem', marginTop: '20px' }}>
            KEY DEVELOPMENT PHASES
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderLeft: '3px solid var(--color-cyber-blue)', borderRadius: '0 4px 4px 0' }}>
              <strong>Phase 1: Component Mock Design:</strong> Scaffold Vite project structure, build layout components (Radar, Video HUD, Telemetry dials), and design interactive state engines entirely on the client.
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderLeft: '3px solid var(--color-success)', borderRadius: '0 4px 4px 0' }}>
              <strong>Phase 2: WebSocket Integration:</strong> Connect real-time JSON stream updates mapping remote coordinates, host indicators, and event diagnostics into standard interfaces.
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderLeft: '3px solid var(--color-warning)', borderRadius: '0 4px 4px 0' }}>
              <strong>Phase 3: Command & Replay Sync:</strong> Add interactive command actions sending payload requests to REST endpoints, and implement log replay controls.
            </div>
          </div>

          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-cyber-blue)', fontSize: '1rem', marginTop: '20px' }}>
            DEVELOPMENT TEAM DISCLOSURE
          </h3>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
            Built as an advanced engineering demonstration illustrating software robustness, input validation safety, clean interfaces, and concurrent performance metrics.
          </p>

        </div>
      </div>
    </div>
  );
};
export default AboutPage;
