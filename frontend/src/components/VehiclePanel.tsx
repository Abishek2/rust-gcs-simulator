import React from 'react';
import type { Vehicle } from '../types/vehicle';

interface VehiclePanelProps {
  vehicle: Vehicle | null;
}

export const VehiclePanel: React.FC<VehiclePanelProps> = ({ vehicle }) => {
  if (!vehicle) {
    return (
      <div className="gcs-panel" style={{ height: '100%' }}>
        <div className="gcs-panel-header">Vehicle Telemetry</div>
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
          <span className="blink">NO VEHICLE TELEMETRY LINKED</span>
        </div>
      </div>
    );
  }

  const getModeBadgeClass = (mode: Vehicle['mode']) => {
    switch (mode) {
      case 'READY':
        return 'badge-success';
      case 'TRACKING':
        return 'badge-info';
      case 'STANDBY':
        return 'badge-warning';
      case 'FAULT':
      case 'ABORTED':
      default:
        return 'badge-danger';
    }
  };

  const getConnStateBadge = (state: Vehicle['connection_state']) => {
    switch (state) {
      case 'HEALTHY':
        return <span className="badge badge-success">HEALTHY</span>;
      case 'DEGRADED':
        return <span className="badge badge-warning blink">DEGRADED</span>;
      case 'LOST':
      default:
        return <span className="badge badge-danger blink">LOST</span>;
    }
  };

  const getBatteryColor = (lvl: number) => {
    if (lvl > 50) return 'var(--color-success)';
    if (lvl > 20) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  return (
    <div className="gcs-panel" style={{ height: '100%' }}>
      <div className="gcs-panel-header">
        <span>Vehicle Telemetry</span>
        <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{vehicle.vehicle_id}</span>
      </div>
      <div className="gcs-panel-body font-mono" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* Core States */}
        <div className="flex-between" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>SYSTEM MODE</span>
            <span className={`badge ${getModeBadgeClass(vehicle.mode)}`} style={{ alignSelf: 'flex-start', marginTop: '2px' }}>
              {vehicle.mode}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>COMM LINK</span>
            <span style={{ marginTop: '2px' }}>{getConnStateBadge(vehicle.connection_state)}</span>
          </div>
        </div>

        {/* GPS status and link battery stats */}
        <div className="grid-2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>BATTERY POWER</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: getBatteryColor(vehicle.battery_percent) }}>
              {vehicle.battery_percent.toFixed(1)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>HEARTBEAT</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-cyber-blue)', marginTop: '4px' }}>
              {new Date(vehicle.last_heartbeat).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Spatial Coordinates */}
        <div className="grid-2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>LATITUDE</div>
            <div style={{ color: 'var(--color-cyber-blue)' }}>{vehicle.latitude.toFixed(6)}°</div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>LONGITUDE</div>
            <div style={{ color: 'var(--color-cyber-blue)' }}>{vehicle.longitude.toFixed(6)}°</div>
          </div>
        </div>

        {/* Altitude, Heading, Speed */}
        <div className="grid-3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>ALTITUDE</div>
            <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 'bold' }}>{vehicle.altitude.toFixed(1)} m</div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>AIRSPEED</div>
            <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 'bold' }}>{vehicle.speed.toFixed(1)} m/s</div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>HEADING</div>
            <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 'bold' }}>{Math.round(vehicle.heading)}°</div>
          </div>
        </div>

        {/* Yaw Compass Band */}
        <div style={{ marginTop: '4px' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginBottom: '4px', textAlign: 'center' }}>COMPASS HEADING</div>
          <div style={{
            height: '24px',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{
              position: 'absolute',
              top: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '6px solid var(--color-cyber-blue)',
              zIndex: 2
            }} />
            
            <div style={{
              display: 'flex',
              whiteSpace: 'nowrap',
              position: 'absolute',
              transition: 'transform 0.2s ease-out',
              transform: `translateX(calc(-${(vehicle.heading % 360) / 360 * 100}% + 130px))`,
              width: '400px',
              fontFamily: 'var(--font-display)',
              fontSize: '10px',
              color: 'rgba(0, 240, 255, 0.4)'
            }}>
              <span style={{ margin: '0 15px' }}>N</span>
              <span style={{ margin: '0 15px' }}>45</span>
              <span style={{ margin: '0 15px' }}>E</span>
              <span style={{ margin: '0 15px' }}>135</span>
              <span style={{ margin: '0 15px' }}>S</span>
              <span style={{ margin: '0 15px' }}>225</span>
              <span style={{ margin: '0 15px' }}>W</span>
              <span style={{ margin: '0 15px' }}>315</span>
              <span style={{ margin: '0 15px' }}>N</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
