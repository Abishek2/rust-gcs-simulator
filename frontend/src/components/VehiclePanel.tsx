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

  const getFlightModeClass = (mode: Vehicle['flight_mode']) => {
    switch (mode) {
      case 'AUTO':
        return 'badge-success';
      case 'GUIDED':
        return 'badge-info';
      case 'RTL':
      case 'LAND':
        return 'badge-warning';
      case 'MANUAL':
      default:
        return 'badge-danger';
    }
  };

  const getStateBadge = (state: Vehicle['state']) => {
    switch (state) {
      case 'FLYING':
        return <span className="badge badge-success blink">FLYING</span>;
      case 'ARMED':
        return <span className="badge badge-warning">ARMED</span>;
      case 'TAKEOFF':
      case 'LANDING':
        return <span className="badge badge-info blink">{state}</span>;
      case 'DISARMED':
      default:
        return <span className="badge badge-info" style={{ borderColor: 'var(--color-text-dim)', color: 'var(--color-text-secondary)' }}>DISARMED</span>;
    }
  };

  // Color battery based on level
  const getBatteryColor = (lvl: number) => {
    if (lvl > 50) return 'var(--color-success)';
    if (lvl > 20) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  return (
    <div className="gcs-panel" style={{ height: '100%' }}>
      <div className="gcs-panel-header">
        <span>Vehicle Telemetry</span>
        <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{vehicle.id}</span>
      </div>
      <div className="gcs-panel-body font-mono" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* Core States */}
        <div className="flex-between" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>FLIGHT MODE</span>
            <span className={`badge ${getFlightModeClass(vehicle.flight_mode)}`} style={{ alignSelf: 'flex-start', marginTop: '2px' }}>
              {vehicle.flight_mode}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>SYSTEM STATE</span>
            <span style={{ marginTop: '2px' }}>{getStateBadge(vehicle.state)}</span>
          </div>
        </div>

        {/* GPS, Comm Link & Power */}
        <div className="grid-3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>BATTERY</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: getBatteryColor(vehicle.battery_percent) }}>
              {vehicle.battery_percent}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>GPS SATS</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: vehicle.gps_satellites >= 10 ? 'var(--color-success)' : 'var(--color-warning)' }}>
              {vehicle.gps_satellites}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>LINK STR.</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: vehicle.connection_strength > 75 ? 'var(--color-cyber-blue)' : 'var(--color-warning)' }}>
              {vehicle.connection_strength}%
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
            <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>{vehicle.altitude.toFixed(1)} m</div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>AIRSPEED</div>
            <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>{vehicle.speed.toFixed(1)} m/s</div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>HEADING</div>
            <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>{Math.round(vehicle.heading)}°</div>
          </div>
        </div>

        {/* Basic Visual Orientation Indicator (Yaw compass band) */}
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
            {/* Center indicator arrow */}
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
            
            {/* Moving dial inside */}
            <div style={{
              display: 'flex',
              whiteSpace: 'nowrap',
              position: 'absolute',
              transition: 'transform 0.2s ease-out',
              // Shift dial based on heading
              transform: `translateX(calc(-${vehicle.heading / 360 * 100}% + 130px))`,
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
