import React, { useState, useEffect } from 'react';

interface ReplaySession {
  id: string;
  name: string;
  date: string;
  duration_seconds: number;
  records_count: number;
  description: string;
}

const mockSessions: ReplaySession[] = [
  {
    id: 'session-20260620-01',
    name: 'SIM-FLIGHT-ALPHA: Standard Local Grid Loop',
    date: '2026-06-20 14:32:10',
    duration_seconds: 180,
    records_count: 1800,
    description: 'Routine local holding pattern simulation checking GPS acquisition speed bounds.'
  },
  {
    id: 'session-20260620-02',
    name: 'SIM-FLIGHT-BRAVO: High Altitude Velocity Test',
    date: '2026-06-20 15:45:00',
    duration_seconds: 300,
    records_count: 3000,
    description: 'Autonomous climb behavior checking flight boundaries at 1500m simulated alt limit.'
  },
  {
    id: 'session-20260620-03',
    name: 'SIM-FLIGHT-CHARLIE: Safe Cell Launch Deploy',
    date: '2026-06-20 16:10:45',
    duration_seconds: 120,
    records_count: 1200,
    description: 'Launcher sequence simulation discharging Cell 5 weather probe under safe modes.'
  }
];

export const ReplayPage: React.FC = () => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentSeconds, setCurrentSeconds] = useState<number>(0);
  
  // Simulated telemetry data for replay playback
  const [replayAltitude, setReplayAltitude] = useState<number>(0);
  const [replaySpeed, setReplaySpeed] = useState<number>(0);
  const [replayBattery, setReplayBattery] = useState<number>(100);

  const selectedSession = mockSessions.find(s => s.id === selectedSessionId) || null;

  useEffect(() => {
    let timer: number;
    if (isPlaying && selectedSession) {
      timer = setInterval(() => {
        setCurrentSeconds((prev) => {
          if (prev >= selectedSession.duration_seconds) {
            setIsPlaying(false);
            return selectedSession.duration_seconds;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, selectedSession]);

  // Generate dynamic telemetry numbers based on timeline scrubs
  useEffect(() => {
    if (!selectedSession) return;
    const progress = currentSeconds / selectedSession.duration_seconds;
    
    if (selectedSession.id === 'session-20260620-01') {
      // Nominal loop: Alt rises to 150m, speed hovers around 12m/s
      setReplayAltitude(Math.min(150, progress * 400));
      setReplaySpeed(10 + Math.sin(currentSeconds * 0.1) * 2);
      setReplayBattery(Math.max(80, 100 - progress * 10));
    } else if (selectedSession.id === 'session-20260620-02') {
      // High altitude climb: Alt rises to 1500m
      setReplayAltitude(progress * 1500);
      setReplaySpeed(25 + Math.sin(currentSeconds * 0.05) * 5);
      setReplayBattery(Math.max(65, 100 - progress * 25));
    } else {
      // Cell launch: alt remains at 200m, fires mid flight
      setReplayAltitude(200);
      setReplaySpeed(15 + Math.cos(currentSeconds * 0.1) * 3);
      setReplayBattery(Math.max(85, 95 - progress * 8));
    }
  }, [currentSeconds, selectedSession]);

  const handleSelectSession = (id: string) => {
    setSelectedSessionId(id);
    setIsPlaying(false);
    setCurrentSeconds(0);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentSeconds(Number(e.target.value));
  };

  const formatSeconds = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', padding: '16px', height: 'calc(100vh - var(--header-height) - 40px)', boxSizing: 'border-box' }}>
      
      {/* Session Select List Left Column */}
      <div className="gcs-panel" style={{ height: '100%' }}>
        <div className="gcs-panel-header">Past Replay Sessions</div>
        <div className="gcs-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {mockSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleSelectSession(session.id)}
              style={{
                background: selectedSessionId === session.id ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255,255,255,0.01)',
                border: '1px solid',
                borderColor: selectedSessionId === session.id ? 'var(--color-cyber-blue)' : 'rgba(255,255,255,0.05)',
                borderRadius: '4px',
                padding: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: selectedSessionId === session.id ? 'var(--color-cyber-blue)' : '#fff' }}>
                {session.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>📅 {session.date}</span>
                <span>⏱️ {formatSeconds(session.duration_seconds)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Playback Controls Right Column */}
      <div className="gcs-panel" style={{ height: '100%' }}>
        <div className="gcs-panel-header">Replay Control Panel</div>
        <div className="gcs-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {selectedSession ? (
            <>
              {/* Playback HUD */}
              <div 
                style={{ 
                  flex: 1, 
                  background: '#040608', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '4px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  padding: '20px',
                  fontFamily: 'var(--font-mono)',
                  position: 'relative'
                }}
              >
                <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '0.75rem', color: 'var(--color-warning)' }} className="blink">
                  ⏺️ REPLAY PLAYBACK MODE
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                  SESSION ID: {selectedSession.id}
                </div>

                {/* Primary metrics display */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', width: '100%', maxWidth: '400px', textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>RECORDED ALT</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-cyber-blue)' }}>{replayAltitude.toFixed(1)} m</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>RECORDED SPD</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{replaySpeed.toFixed(1)} m/s</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>RECORDED BAT</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: replayBattery > 50 ? 'var(--color-success)' : 'var(--color-danger)' }}>{Math.round(replayBattery)}%</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', maxWidth: '450px', textAlign: 'center', lineHeight: '1.4' }}>
                  {selectedSession.description}
                </div>
              </div>

              {/* Progress Slider */}
              <div>
                <div className="flex-between font-mono" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span>TIME: {formatSeconds(currentSeconds)}</span>
                  <span>DURATION: {formatSeconds(selectedSession.duration_seconds)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={selectedSession.duration_seconds}
                  value={currentSeconds}
                  onChange={handleScrub}
                  style={{
                    width: '100%',
                    accentColor: 'var(--color-cyber-blue)',
                    background: 'var(--bg-tertiary)',
                    height: '6px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                />
              </div>

              {/* Playback Controls */}
              <div className="flex-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="gcs-btn" 
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? '⏸️ PAUSE' : '▶️ PLAY'}
                  </button>
                  <button 
                    className="gcs-btn gcs-btn-danger" 
                    onClick={() => { setIsPlaying(false); setCurrentSeconds(0); }}
                  >
                    ⏹️ RESET
                  </button>
                </div>
                
                {/* Speed Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>SPEED:</span>
                  {([1, 2, 5] as const).map((spd) => (
                    <button
                      key={spd}
                      className="gcs-btn"
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        background: playbackSpeed === spd ? 'rgba(0,240,255,0.15)' : 'rgba(0,0,0,0.1)',
                        borderColor: playbackSpeed === spd ? 'var(--color-cyber-blue)' : 'rgba(0,240,255,0.05)'
                      }}
                      onClick={() => setPlaybackSpeed(spd)}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div 
              style={{ 
                flex: 1, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                color: 'var(--color-text-dim)',
                fontFamily: 'var(--font-display)',
                fontSize: '0.85rem'
              }}
            >
              SELECT A RECORDED LOG SESSION ON THE LEFT TO PLAYBACK TELEMETRY
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
export default ReplayPage;
