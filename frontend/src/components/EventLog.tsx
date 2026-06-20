import React, { useState } from 'react';
import type { SystemEvent } from '../types/event';

interface EventLogProps {
  events: SystemEvent[];
}

export const EventLog: React.FC<EventLogProps> = ({ events }) => {
  const [filter, setFilter] = useState<SystemEvent['severity'] | 'ALL'>('ALL');

  const filteredEvents = events.filter((e) => {
    if (filter === 'ALL') return true;
    return e.severity === filter;
  });

  const getSeverityStyle = (sev: SystemEvent['severity']) => {
    switch (sev) {
      case 'CRITICAL':
        return { color: 'var(--color-danger)', fontWeight: 'bold', animation: 'blink 1s infinite' };
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
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="gcs-panel" style={{ height: '100%' }}>
      <div className="gcs-panel-header" style={{ borderBottom: 'none' }}>
        <span>Event Log</span>
        <div style={{ display: 'flex', gap: '3px' }}>
          {(['ALL', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'] as const).map((sev) => (
            <button
              key={sev}
              className="gcs-btn"
              style={{
                padding: '1px 6px',
                fontSize: '0.65rem',
                background: filter === sev ? 'rgba(0, 240, 255, 0.2)' : 'rgba(0,0,0,0.1)',
                borderColor: filter === sev ? 'var(--color-cyber-blue)' : 'rgba(0, 240, 255, 0.1)',
              }}
              onClick={() => setFilter(sev)}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>
      
      {/* Scrollable logs */}
      <div 
        className="gcs-panel-body font-mono" 
        style={{ 
          padding: '0 12px 12px 12px',
          background: '#040608',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column-reverse', // Most recent at the bottom or top? Let's display reverse so it scrolls naturally
          overflowY: 'auto',
          minHeight: '120px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '6px' }}>
          {filteredEvents.length === 0 ? (
            <div style={{ color: 'var(--color-text-dim)', textAlign: 'center', padding: '12px 0', fontSize: '0.75rem' }}>
              NO EVENTS RECORDED FOR FILTER [{filter}]
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div 
                key={event.id} 
                style={{ 
                  fontSize: '0.75rem', 
                  lineHeight: '1.4', 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  gap: '6px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.01)',
                  paddingBottom: '2px'
                }}
              >
                <span style={{ color: 'var(--color-text-dim)', flexShrink: 0 }}>[{formatTimestamp(event.timestamp)}]</span>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600, flexShrink: 0 }}>{event.source}:</span>
                <span style={{ ...getSeverityStyle(event.severity), wordBreak: 'break-word' }}>{event.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
