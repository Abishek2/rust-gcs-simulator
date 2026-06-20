import React from 'react';
import type { Track } from '../types/track';

interface TrackPanelProps {
  selectedTrack: Track | null;
  onClearSelection: () => void;
  onUpdateCategory?: (trackId: string, category: 'friendly' | 'hostile' | 'neutral' | 'unknown') => void;
}

export const TrackPanel: React.FC<TrackPanelProps> = ({
  selectedTrack,
  onClearSelection,
  onUpdateCategory,
}) => {
  if (!selectedTrack) {
    return (
      <div className="gcs-panel" style={{ height: '100%' }}>
        <div className="gcs-panel-header">Selected Track Details</div>
        <div 
          className="gcs-panel-body" 
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            color: 'var(--color-text-dim)',
            textAlign: 'center',
            height: '100%',
            fontFamily: 'var(--font-display)',
            fontSize: '0.85rem'
          }}
        >
          <div>
            <div className="blink" style={{ marginBottom: '8px', color: 'var(--color-cyber-blue-dim)' }}>SYSTEM READY</div>
            SELECT A TRACK ON THE RADAR VIEW TO INSPECT
          </div>
        </div>
      </div>
    );
  }

  const getCategoryBadge = (category: Track['category']) => {
    switch (category) {
      case 'friendly':
        return <span className="badge badge-success">FRIENDLY</span>;
      case 'hostile':
        return <span className="badge badge-danger">HOSTILE</span>;
      case 'neutral':
        return <span className="badge badge-info">NEUTRAL</span>;
      case 'unknown':
      default:
        return <span className="badge badge-warning">UNKNOWN</span>;
    }
  };

  const getStatusBadge = (status: Track['status']) => {
    switch (status) {
      case 'TRACKING':
        return <span className="badge badge-success" style={{ padding: '1px 4px', fontSize: '0.65rem' }}>TRACKING</span>;
      case 'NEW':
        return <span className="badge badge-info blink" style={{ padding: '1px 4px', fontSize: '0.65rem' }}>NEW</span>;
      case 'STALE':
        return <span className="badge badge-warning blink" style={{ padding: '1px 4px', fontSize: '0.65rem' }}>STALE</span>;
      case 'LOST':
        return <span className="badge badge-danger" style={{ padding: '1px 4px', fontSize: '0.65rem' }}>LOST</span>;
    }
  };

  return (
    <div className="gcs-panel" style={{ height: '100%' }}>
      <div className="gcs-panel-header">
        <span>TRACK ID: {selectedTrack.track_id}</span>
        <button 
          className="gcs-btn" 
          style={{ padding: '2px 6px', fontSize: '0.7rem' }}
          onClick={onClearSelection}
        >
          Deselect
        </button>
      </div>
      <div className="gcs-panel-body font-mono" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="flex-between" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '4px' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Designation:</span>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>{selectedTrack.name}</span>
        </div>
        
        <div className="flex-between" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '4px' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Classification:</span>
          {getCategoryBadge(selectedTrack.category)}
        </div>

        <div className="flex-between" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '4px' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Link Status:</span>
          {getStatusBadge(selectedTrack.status)}
        </div>

        <div className="grid-2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '4px' }}>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>LATITUDE</div>
            <div style={{ color: 'var(--color-cyber-blue)' }}>{selectedTrack.latitude.toFixed(6)}°</div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>LONGITUDE</div>
            <div style={{ color: 'var(--color-cyber-blue)' }}>{selectedTrack.longitude.toFixed(6)}°</div>
          </div>
        </div>

        <div className="grid-3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '4px' }}>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>ALTITUDE</div>
            <div style={{ color: '#fff' }}>{Math.round(selectedTrack.altitude)} m</div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>SPEED</div>
            <div style={{ color: '#fff' }}>{selectedTrack.speed.toFixed(1)} m/s</div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>HEADING</div>
            <div style={{ color: '#fff' }}>{Math.round(selectedTrack.heading)}°</div>
          </div>
        </div>

        <div style={{ marginTop: '12px' }}>
          <div style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '0.75rem', 
            color: 'var(--color-cyber-blue)',
            marginBottom: '6px',
            textTransform: 'uppercase'
          }}>
            Simulated Controls (Safety Mode)
          </div>
          <div className="flex-row">
            {onUpdateCategory && (
              <>
                <button 
                  className="gcs-btn gcs-btn-success" 
                  style={{ flex: 1, padding: '4px', fontSize: '0.7rem' }}
                  onClick={() => onUpdateCategory(selectedTrack.track_id, 'friendly')}
                  disabled={selectedTrack.category === 'friendly'}
                >
                  Friendly
                </button>
                <button 
                  className="gcs-btn gcs-btn-danger" 
                  style={{ flex: 1, padding: '4px', fontSize: '0.7rem' }}
                  onClick={() => onUpdateCategory(selectedTrack.track_id, 'hostile')}
                  disabled={selectedTrack.category === 'hostile'}
                >
                  Hostile
                </button>
                <button 
                  className="gcs-btn" 
                  style={{ flex: 1, padding: '4px', fontSize: '0.7rem', color: 'var(--color-text-secondary)', borderColor: 'var(--color-text-dim)' }}
                  onClick={() => onUpdateCategory(selectedTrack.track_id, 'neutral')}
                  disabled={selectedTrack.category === 'neutral'}
                >
                  Neutral
                </button>
              </>
            )}
          </div>
          
          <div style={{ 
            marginTop: '8px', 
            fontSize: '0.65rem', 
            color: 'var(--color-text-dim)', 
            textAlign: 'center',
            border: '1px dashed rgba(255,255,255,0.05)',
            padding: '4px',
            borderRadius: '4px'
          }}>
            Classification changes are local software overrides.
          </div>
        </div>
      </div>
    </div>
  );
};
