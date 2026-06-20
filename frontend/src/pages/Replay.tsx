import React, { useState, useEffect } from 'react';
import type { SimulationSession, SystemEvent } from '../types/event';
import { fetchReplaySessions, fetchReplaySession } from '../utils/api';

export const ReplayPage: React.FC = () => {
  // Session list states
  const [sessions, setSessions] = useState<SimulationSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  // Selected session timeline states
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<SystemEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState<boolean>(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  // Expanded payloads
  const [expandedPayloadIds, setExpandedPayloadIds] = useState<Record<string, boolean>>({});

  const loadSessions = async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const data = await fetchReplaySessions();
      // Sort with newest sessions first
      const sorted = [...data].sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
      setSessions(sorted);
    } catch (err: any) {
      console.error('[Replay] Failed to load replay sessions:', err);
      setSessionsError(err.message || 'Failed to fetch sessions from server.');
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadTimeline = async (sessionId: string) => {
    setTimelineLoading(true);
    setTimelineError(null);
    setExpandedPayloadIds({});
    try {
      const data = await fetchReplaySession(sessionId);
      // Sort chronologically (oldest first) so the timeline reads from start to finish
      const sorted = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setTimeline(sorted);
    } catch (err: any) {
      console.error(`[Replay] Failed to fetch timeline for session ${sessionId}:`, err);
      setTimelineError(err.message || 'Failed to load timeline events.');
    } finally {
      setTimelineLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      loadTimeline(selectedSessionId);
    } else {
      setTimeline([]);
    }
  }, [selectedSessionId]);

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const togglePayload = (eventId: string) => {
    setExpandedPayloadIds((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const formatTimeOnly = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
    } catch {
      return isoString;
    }
  };

  const getRelativeTime = (eventTime: string, startTime: string) => {
    try {
      const diffMs = new Date(eventTime).getTime() - new Date(startTime).getTime();
      const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
      const mins = Math.floor(diffSecs / 60);
      const secs = diffSecs % 60;
      return `+${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } catch {
      return '+00:00';
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev.toUpperCase()) {
      case 'CRITICAL':
        return 'var(--color-danger)';
      case 'ERROR':
        return 'var(--color-danger)';
      case 'WARNING':
        return 'var(--color-warning)';
      case 'INFO':
      default:
        return 'var(--color-cyber-blue)';
    }
  };

  const selectedSession = sessions.find(s => s.session_id === selectedSessionId) || null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr', gap: '16px', padding: '16px', minHeight: 'calc(100vh - var(--header-height))', boxSizing: 'border-box' }}>
      
      {/* Session Select List Left Column */}
      <div className="gcs-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="gcs-panel-header" style={{ flexShrink: 0 }}>
          <span>Simulation Sessions</span>
          <button 
            className="gcs-btn" 
            style={{ padding: '2px 8px', fontSize: '0.7rem', textTransform: 'uppercase' }}
            onClick={loadSessions}
            disabled={sessionsLoading}
          >
            {sessionsLoading ? 'Reloading...' : 'Refresh Sessions'}
          </button>
        </div>
        
        <div className="gcs-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {sessionsLoading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-cyber-blue)' }} className="blink font-mono">
              QUERYING SESSION LOGS...
            </div>
          ) : sessionsError ? (
            <div style={{ padding: '16px', border: '1px solid var(--color-danger-dim)', borderRadius: '4px', background: 'var(--color-danger-bg)' }}>
              <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px' }}>⚠️ ERROR LOADING SESSIONS</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>{sessionsError}</div>
              <button className="gcs-btn" style={{ fontSize: '0.7rem' }} onClick={loadSessions}>RETRY</button>
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ color: 'var(--color-text-dim)', textAlign: 'center', padding: '30px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
              NO SIMULATION SESSIONS RECORDED
            </div>
          ) : (
            sessions.map((session) => {
              const isSelected = selectedSessionId === session.session_id;
              return (
                <div
                  key={session.session_id}
                  onClick={() => handleSelectSession(session.session_id)}
                  style={{
                    background: isSelected ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255,255,255,0.01)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--color-cyber-blue)' : 'rgba(255,255,255,0.05)',
                    borderRadius: '4px',
                    padding: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  className="session-list-item"
                >
                  <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: isSelected ? 'var(--color-cyber-blue)' : '#fff', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
                    SESSION ID: {session.session_id.substring(0, 18)}...
                  </div>
                  
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div>📅 Started: {formatDateTime(session.start_time)}</div>
                    {session.end_time && <div>⏱️ Ended: {formatDateTime(session.end_time)}</div>}
                    <div style={{ marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>STATUS: <span style={{ color: session.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-dim)', fontWeight: 'bold' }}>{session.status}</span></span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Selected Session Timeline Right Column */}
      <div className="gcs-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="gcs-panel-header" style={{ flexShrink: 0 }}>
          <span>Chronological Replay Timeline</span>
          {selectedSessionId && (
            <button 
              className="gcs-btn" 
              style={{ padding: '2px 8px', fontSize: '0.7rem', textTransform: 'uppercase' }}
              onClick={() => loadTimeline(selectedSessionId)}
              disabled={timelineLoading}
            >
              Refresh Timeline
            </button>
          )}
        </div>

        <div className="gcs-panel-body" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '12px' }}>
          {!selectedSessionId ? (
            <div 
              style={{ 
                flex: 1, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                color: 'var(--color-text-dim)',
                fontFamily: 'var(--font-display)',
                fontSize: '0.8rem',
                textAlign: 'center',
                padding: '40px'
              }}
            >
              SELECT A SIMULATION SESSION ON THE LEFT TO REPLAY EVENT TIMELINE
            </div>
          ) : timelineLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifySelf: 'center', alignSelf: 'center', textAlign: 'center', padding: '40px', color: 'var(--color-cyber-blue)' }} className="blink font-mono">
              LOADING REPLAY TIMELINE EVENTS...
            </div>
          ) : timelineError ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifySelf: 'center', alignSelf: 'center', textAlign: 'center', padding: '30px', border: '1px solid var(--color-danger-dim)', borderRadius: '4px', background: 'var(--color-danger-bg)', maxWidth: '450px' }}>
              <div style={{ color: 'var(--color-danger)', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px' }}>⚠️ FAILED TO LOAD TIMELINE</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', marginBottom: '12px' }}>{timelineError}</div>
              <button className="gcs-btn" style={{ alignSelf: 'center' }} onClick={() => loadTimeline(selectedSessionId)}>RELOAD TIMELINE</button>
            </div>
          ) : timeline.length === 0 ? (
            <div style={{ color: 'var(--color-text-dim)', textAlign: 'center', padding: '40px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
              NO SYSTEM EVENTS RECORDED FOR THIS SESSION
            </div>
          ) : (
            <>
              {/* Session Meta Stats */}
              <div style={{ 
                background: '#0c0f16', 
                border: '1px solid var(--border-color)', 
                borderRadius: '4px', 
                padding: '10px 14px', 
                marginBottom: '16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                flexShrink: 0
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div><span style={{ color: 'var(--color-text-secondary)' }}>Session ID:</span> <span style={{ color: 'var(--color-cyber-blue)' }}>{selectedSession?.session_id}</span></div>
                  <div><span style={{ color: 'var(--color-text-secondary)' }}>State:</span> <span style={{ color: selectedSession?.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-dim)', fontWeight: 'bold' }}>{selectedSession?.status}</span></div>
                  <div><span style={{ color: 'var(--color-text-secondary)' }}>Started:</span> <span style={{ color: '#fff' }}>{selectedSession ? formatDateTime(selectedSession.start_time) : ''}</span></div>
                  <div><span style={{ color: 'var(--color-text-secondary)' }}>Timeline Events:</span> <span style={{ color: '#fff' }}>{timeline.length} logs</span></div>
                </div>
              </div>

              {/* Vertical Timeline Feed */}
              <div style={{ 
                position: 'relative', 
                paddingLeft: '24px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '16px',
                borderLeft: '2px solid rgba(0, 240, 255, 0.1)',
                marginLeft: '8px',
                marginRight: '8px'
              }}>
                {timeline.map((evt, idx) => {
                  const isExpanded = !!expandedPayloadIds[evt.event_id || evt.id || ''];
                  const relativeTime = selectedSession ? getRelativeTime(evt.timestamp, selectedSession.start_time) : '+00:00';
                  const sevColor = getSeverityColor(evt.severity);
                  const itemKey = evt.event_id || evt.id || `timeline-${idx}`;

                  return (
                    <div 
                      key={itemKey} 
                      style={{ 
                        position: 'relative', 
                        fontFamily: 'var(--font-mono)', 
                        fontSize: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(255, 255, 255, 0.03)',
                        borderRadius: '4px',
                        padding: '10px'
                      }}
                    >
                      {/* Timeline node bullet */}
                      <span 
                        style={{ 
                          position: 'absolute', 
                          left: '-31px', 
                          top: '12px', 
                          width: '12px', 
                          height: '12px', 
                          borderRadius: '50%', 
                          background: sevColor, 
                          border: '2px solid var(--bg-primary)',
                          boxShadow: `0 0 6px ${sevColor}`
                        }} 
                      />

                      {/* Header bar */}
                      <div className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ color: 'var(--color-cyber-blue)', fontWeight: 'bold' }}>{relativeTime}</span>
                          <span style={{ color: 'var(--color-text-dim)', fontSize: '0.65rem' }}>({formatTimeOnly(evt.timestamp)})</span>
                          <span style={{ color: sevColor, fontWeight: 600 }}>{evt.severity.toUpperCase()}</span>
                        </div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.7rem' }}>
                          SOURCE: <span style={{ color: '#fff', fontWeight: 600 }}>{evt.source}</span>
                        </div>
                      </div>

                      {/* Message Content */}
                      <div style={{ color: 'var(--color-text-primary)', marginBottom: '6px', lineHeight: '1.4' }}>
                        {evt.message}
                      </div>

                      {/* Sub-tag row */}
                      <div className="flex-between" style={{ fontSize: '0.65rem' }}>
                        <span style={{ color: 'var(--color-text-dim)' }}>EVENT TYPE: {evt.event_type || 'SYSTEM'}</span>
                        {evt.payload && (
                          <button
                            className="gcs-btn"
                            style={{ padding: '0px 6px', fontSize: '0.65rem', textTransform: 'uppercase' }}
                            onClick={() => togglePayload(evt.event_id || evt.id || '')}
                          >
                            {isExpanded ? 'Hide Payload' : 'View Payload'}
                          </button>
                        )}
                      </div>

                      {/* Expanded Payload view */}
                      {isExpanded && evt.payload && (
                        <div style={{ marginTop: '8px', borderTop: '1px dashed rgba(0, 240, 255, 0.1)', paddingTop: '6px' }}>
                          <pre style={{ 
                            margin: 0, 
                            background: '#0c0f16', 
                            border: '1px solid rgba(0, 240, 255, 0.1)', 
                            padding: '6px', 
                            borderRadius: '4px',
                            overflowX: 'auto',
                            fontSize: '0.7rem',
                            color: 'var(--color-success)',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all'
                          }}>
                            {(() => {
                              try {
                                return JSON.stringify(JSON.parse(evt.payload), null, 2);
                              } catch {
                                return evt.payload;
                              }
                            })()}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
};
export default ReplayPage;
