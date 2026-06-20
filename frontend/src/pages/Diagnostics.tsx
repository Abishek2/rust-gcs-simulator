import React, { useEffect, useState } from 'react';
import { getMockTelemetry } from '../utils/mockData';
import type { Diagnostics } from '../types/diagnostics';
import type { SystemEvent } from '../types/event';
import { fetchEvents } from '../utils/api';

export const DiagnosticsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<Diagnostics>(getMockTelemetry().diagnostics);
  
  // Persistent Event states
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Expanded payload track
  const [expandedPayloadIds, setExpandedPayloadIds] = useState<Record<string, boolean>>({});

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEvents();
      // Sort with newest events first
      const sorted = [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setEvents(sorted);
    } catch (err: any) {
      console.error('[Diagnostics] Failed to fetch persistent event history:', err);
      setError(err.message || 'Failed to fetch events from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();

    const interval = setInterval(() => {
      // Fluctuate resource metrics locally for diagnostics monitoring
      setMetrics((prev) => ({
        ...prev,
        cpu_usage_percent: Math.max(5, Math.min(95, prev.cpu_usage_percent! + (Math.random() - 0.5) * 6)),
        memory_usage_mb: Math.max(100, Math.min(1024, prev.memory_usage_mb! + (Math.random() - 0.5) * 8)),
        network_rx_kbps: Math.max(50, prev.network_rx_kbps! + (Math.random() - 0.5) * 30),
        network_tx_kbps: Math.max(5, prev.network_tx_kbps! + (Math.random() - 0.5) * 10),
        uptime_seconds: prev.uptime_seconds + 2,
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const togglePayload = (eventId: string) => {
    setExpandedPayloadIds((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  // Filter logic
  const filteredEvents = events.filter((evt) => {
    const matchesSeverity = severityFilter === 'ALL' || evt.severity === severityFilter;
    const matchesSearch = 
      evt.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.event_type && evt.event_type.toLowerCase().includes(searchQuery.toLowerCase())) ||
      evt.session_id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const getSeverityStyle = (sev: string) => {
    switch (sev.toUpperCase()) {
      case 'CRITICAL':
        return { color: 'var(--color-danger)', fontWeight: 'bold', textShadow: '0 0 5px rgba(239, 68, 68, 0.5)' };
      case 'ERROR':
        return { color: 'var(--color-danger)', fontWeight: 'bold' };
      case 'WARNING':
        return { color: 'var(--color-warning)' };
      case 'INFO':
      default:
        return { color: 'var(--color-cyber-blue)' };
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
    } catch {
      return isoString;
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '16px', padding: '16px', minHeight: 'calc(100vh - var(--header-height))', boxSizing: 'border-box' }}>
      
      {/* System Resources Left Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="gcs-panel">
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
                <span className="badge badge-success" style={{ alignSelf: 'flex-start' }}>WebSockets (Port 3001)</span>
                <span className="badge badge-success" style={{ alignSelf: 'flex-start' }}>HTTP REST (Port 3001)</span>
                <span className="badge badge-success" style={{ alignSelf: 'flex-start' }}>SQLite DB Persistence</span>
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

      {/* Persistent Event History Right Column */}
      <div className="gcs-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="gcs-panel-header" style={{ flexShrink: 0 }}>
          <span>Database Event History (GET /events)</span>
          <button 
            className="gcs-btn" 
            style={{ padding: '2px 10px', fontSize: '0.75rem', textTransform: 'uppercase' }}
            onClick={loadEvents}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Event History'}
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          padding: '10px 12px', 
          background: 'var(--bg-tertiary)', 
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Severity Filters */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginRight: '4px' }}>SEVERITY:</span>
            {(['ALL', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'] as const).map((sev) => (
              <button
                key={sev}
                className="gcs-btn"
                style={{
                  padding: '2px 8px',
                  fontSize: '0.7rem',
                  background: severityFilter === sev ? 'rgba(0, 240, 255, 0.15)' : 'rgba(0,0,0,0.2)',
                  borderColor: severityFilter === sev ? 'var(--color-cyber-blue)' : 'rgba(255, 255, 255, 0.05)',
                }}
                onClick={() => setSeverityFilter(sev)}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div style={{ display: 'flex', gap: '4px', flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="Search by source, message, session ID, or event type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '4px 8px',
                color: '#fff',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>
        </div>

        {/* Scrollable Events Body */}
        <div 
          className="gcs-panel-body" 
          style={{ 
            background: '#040608', 
            padding: '12px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifySelf: 'center', alignSelf: 'center', textAlign: 'center', padding: '40px', color: 'var(--color-cyber-blue)' }} className="blink font-mono">
              📥 RETRIEVING PERSISTENT DATABASE LOGS...
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifySelf: 'center', alignSelf: 'center', textAlign: 'center', padding: '30px', border: '1px solid var(--color-danger-dim)', borderRadius: '4px', background: 'var(--color-danger-bg)', maxWidth: '400px' }}>
              <div style={{ color: 'var(--color-danger)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px' }}>⚠️ DATABASE QUERY FAILED</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', wordBreak: 'break-word', marginBottom: '12px' }}>{error}</div>
              <button className="gcs-btn" style={{ alignSelf: 'center' }} onClick={loadEvents}>RETRY QUERY</button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div style={{ color: 'var(--color-text-dim)', textAlign: 'center', padding: '40px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
              NO EVENTS FOUND MATCHING SEARCH FILTERS
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>TIMESTAMP</th>
                  <th style={{ padding: '6px 8px' }}>SEVERITY</th>
                  <th style={{ padding: '6px 8px' }}>SOURCE</th>
                  <th style={{ padding: '6px 8px' }}>EVENT TYPE</th>
                  <th style={{ padding: '6px 8px' }}>MESSAGE</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>METADATA</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((evt) => {
                  const hasPayload = !!evt.payload;
                  const isExpanded = !!expandedPayloadIds[evt.id || evt.event_id || ''];
                  const eventIdKey = evt.id || evt.event_id || Math.random().toString();
                  return (
                    <React.Fragment key={eventIdKey}>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', verticalAlign: 'top' }} className="table-row-hover">
                        <td style={{ padding: '8px', color: 'var(--color-text-dim)', whiteSpace: 'nowrap' }}>{formatTimestamp(evt.timestamp)}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={getSeverityStyle(evt.severity)}>{evt.severity.toUpperCase()}</span>
                        </td>
                        <td style={{ padding: '8px', color: '#fff', fontWeight: 600 }}>{evt.source}</td>
                        <td style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>{evt.event_type || 'SYSTEM'}</td>
                        <td style={{ padding: '8px', color: 'var(--color-text-primary)' }}>{evt.message}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          {hasPayload ? (
                            <button
                              className="gcs-btn"
                              style={{ padding: '1px 6px', fontSize: '0.65rem' }}
                              onClick={() => togglePayload(evt.id || evt.event_id || '')}
                            >
                              {isExpanded ? 'Hide' : 'View'}
                            </button>
                          ) : (
                            <span style={{ color: 'var(--color-text-dim)' }}>-</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && hasPayload && (
                        <tr style={{ background: 'rgba(0,0,0,0.4)' }}>
                          <td colSpan={6} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ color: 'var(--color-cyber-blue)', fontSize: '0.65rem', marginBottom: '4px', textTransform: 'uppercase' }}>Associated Event Payload Metadata</div>
                            <pre style={{ 
                              margin: 0, 
                              background: '#0c0f16', 
                              border: '1px solid rgba(0, 240, 255, 0.1)', 
                              padding: '8px', 
                              borderRadius: '4px',
                              overflowX: 'auto',
                              fontSize: '0.7rem',
                              color: 'var(--color-success)',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all'
                            }}>
                              {(() => {
                                try {
                                  return JSON.stringify(JSON.parse(evt.payload!), null, 2);
                                } catch {
                                  return evt.payload;
                                }
                              })()}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};
export default DiagnosticsPage;
