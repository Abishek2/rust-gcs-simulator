import React, { useRef, useEffect, useState } from 'react';
import type { Track } from '../types/track';
import type { Vehicle } from '../types/vehicle';

interface RadarViewProps {
  tracks: Track[];
  vehicle: Vehicle | null;
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string | null) => void;
}

export const RadarView: React.FC<RadarViewProps> = ({
  tracks,
  vehicle,
  selectedTrackId,
  onSelectTrack,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rangeKm, setRangeKm] = useState<number>(2); // Radar range in kilometers
  const sweepAngleRef = useRef<number>(0);

  // Conversion: lat/lon offset to relative meters (simplified local flat earth projection)
  const getRelativePosition = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const latMid = (lat1 + lat2) / 2;
    const dy = (lat2 - lat1) * 111139; // meters per lat degree
    const dx = (lon2 - lon1) * 111139 * Math.cos((latMid * Math.PI) / 180); // meters per lon degree
    return { dx, dy };
  };

  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleCanvasClick = (e: MouseEvent) => {
      if (!vehicle) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 20;

      // Check click proximity to each track
      let clickedTrackId: string | null = null;
      let minDistance = 15; // Click radius in pixels

      tracks.forEach((track) => {
        const { dx, dy } = getRelativePosition(
          vehicle.latitude,
          vehicle.longitude,
          track.latitude,
          track.longitude
        );

        // Convert meters to canvas coords
        const rangeMeters = rangeKm * 1000;
        const canvasX = centerX + (dx / rangeMeters) * radius;
        const canvasY = centerY - (dy / rangeMeters) * radius; // Invert Y for screen coordinates

        const dist = Math.hypot(x - canvasX, y - canvasY);
        if (dist < minDistance) {
          minDistance = dist;
          clickedTrackId = track.track_id;
        }
      });

      onSelectTrack(clickedTrackId);
    };

    canvas.addEventListener('mousedown', handleCanvasClick);

    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#080b10';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(centerX, centerY) - 20;

      // Draw grid ring backgrounds
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.lineWidth = 1;

      // Rotate radar sweep angle
      sweepAngleRef.current = (sweepAngleRef.current + 1.2) % 360;
      const sweepRad = (sweepAngleRef.current * Math.PI) / 180;

      // Draw Sweep Gradient
      const sweepGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        maxRadius
      );
      sweepGradient.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
      sweepGradient.addColorStop(1, 'rgba(0, 240, 255, 0.01)');

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(
        centerX,
        centerY,
        maxRadius,
        sweepRad - 0.2,
        sweepRad,
        false
      );
      ctx.closePath();
      ctx.fillStyle = sweepGradient;
      ctx.fill();

      // Draw sweep line itself
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(sweepRad) * maxRadius,
        centerY + Math.sin(sweepRad) * maxRadius
      );
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw Range Circles
      const ringsCount = 4;
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      for (let i = 1; i <= ringsCount; i++) {
        const r = (maxRadius / ringsCount) * i;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw ring labels (Km)
        ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.font = '10px Roboto Mono';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${((rangeKm / ringsCount) * i).toFixed(1)} km`,
          centerX,
          centerY - r + 12
        );
      }

      // Draw Crosshairs
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(centerX - maxRadius, centerY);
      ctx.lineTo(centerX + maxRadius, centerY);
      ctx.moveTo(centerX, centerY - maxRadius);
      ctx.lineTo(centerX, centerY + maxRadius);
      ctx.stroke();

      // Draw Cardinal Directions
      ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
      ctx.font = '11px Orbitron';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', centerX, centerY - maxRadius - 10);
      ctx.fillText('S', centerX, centerY + maxRadius + 10);
      ctx.fillText('E', centerX + maxRadius + 10, centerY);
      ctx.fillText('W', centerX - maxRadius - 10, centerY);

      // Draw Main Vehicle at Center
      if (vehicle) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((vehicle.heading * Math.PI) / 180);

        // Vehicle icon (Triangle pointing up)
        ctx.fillStyle = 'var(--color-success)';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-7, 8);
        ctx.lineTo(0, 4);
        ctx.lineTo(7, 8);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Outer glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'var(--color-success)';
        ctx.restore();
      }

      // Draw Tracks
      if (vehicle) {
        tracks.forEach((track) => {
          const { dx, dy } = getRelativePosition(
            vehicle.latitude,
            vehicle.longitude,
            track.latitude,
            track.longitude
          );

          const rangeMeters = rangeKm * 1000;
          const canvasX = centerX + (dx / rangeMeters) * maxRadius;
          const canvasY = centerY - (dy / rangeMeters) * maxRadius;

          // Skip drawing if track is out of bounds
          const distance = Math.hypot(dx, dy);
          const isOut = distance > rangeMeters;

          // Category color
          let color = '#fff';
          if (track.category === 'friendly') color = 'var(--color-success)';
          else if (track.category === 'hostile') color = 'var(--color-danger)';
          else if (track.category === 'unknown') color = 'var(--color-warning)';
          else color = '#9ca3af';

          // Set transparency for stale tracks
          ctx.save();
          if (track.status === 'LOST') ctx.globalAlpha = 0.2;
          else if (track.status === 'STALE') ctx.globalAlpha = 0.5;

          if (isOut) {
            // Draw out of range indicators on the border
            const angle = Math.atan2(-dy, dx);
            const borderX = centerX + Math.cos(angle) * maxRadius;
            const borderY = centerY + Math.sin(angle) * maxRadius;

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(borderX, borderY, 4, 0, 2 * Math.PI);
            ctx.fill();

            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.moveTo(borderX, borderY);
            ctx.lineTo(borderX - Math.cos(angle) * 8, borderY - Math.sin(angle) * 8);
            ctx.stroke();
          } else {
            // Draw track symbol (diamond for hostile, circle for friendly/neutral, square for unknown)
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';

            ctx.shadowBlur = 6;
            ctx.shadowColor = color;

            if (track.category === 'hostile') {
              // Diamond
              ctx.beginPath();
              ctx.moveTo(canvasX, canvasY - 6);
              ctx.lineTo(canvasX + 6, canvasY);
              ctx.lineTo(canvasX, canvasY + 6);
              ctx.lineTo(canvasX - 6, canvasY);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            } else if (track.category === 'friendly') {
              // Circle with dot
              ctx.beginPath();
              ctx.arc(canvasX, canvasY, 6, 0, 2 * Math.PI);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(canvasX, canvasY, 1.5, 0, 2 * Math.PI);
              ctx.fill();
            } else {
              // Square
              ctx.beginPath();
              ctx.rect(canvasX - 5, canvasY - 5, 10, 10);
              ctx.fill();
              ctx.stroke();
            }

            // Draw Heading Vector line (representing speed & heading)
            // Draw speed vector proportional to speed (e.g. 1 pixel per m/s)
            const headingRad = ((90 - track.heading) * Math.PI) / 180; // convert standard aviation heading to unit circle
            const vectorLen = Math.max(5, track.speed * 0.5);
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(canvasX, canvasY);
            ctx.lineTo(
              canvasX + Math.cos(headingRad) * vectorLen,
              canvasY - Math.sin(headingRad) * vectorLen // Canvas Y is inverted
            );
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Label text
            ctx.fillStyle = '#fff';
            ctx.font = '9px Roboto Mono';
            ctx.textAlign = 'left';
            ctx.fillText(` ${track.track_id}`, canvasX + 8, canvasY - 4);
            ctx.fillStyle = 'var(--color-text-secondary)';
            ctx.fillText(` ${Math.round(track.altitude)}m`, canvasX + 8, canvasY + 6);

            // Draw selection reticle
            if (selectedTrackId === track.track_id) {
              ctx.strokeStyle = 'var(--color-cyber-blue)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(canvasX, canvasY, 12, 0, 2 * Math.PI);
              ctx.stroke();

              // Draw crosshair brackets
              ctx.beginPath();
              ctx.moveTo(canvasX - 16, canvasY);
              ctx.lineTo(canvasX - 10, canvasY);
              ctx.moveTo(canvasX + 10, canvasY);
              ctx.lineTo(canvasX + 16, canvasY);
              ctx.moveTo(canvasX, canvasY - 16);
              ctx.lineTo(canvasX, canvasY - 10);
              ctx.moveTo(canvasX, canvasY + 10);
              ctx.lineTo(canvasX, canvasY + 16);
              ctx.stroke();
            }
          }
          ctx.restore();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousedown', handleCanvasClick);
    };
  }, [tracks, vehicle, selectedTrackId, rangeKm, onSelectTrack]);

  return (
    <div className="gcs-panel" style={{ height: '100%' }}>
      <div className="gcs-panel-header">
        <span>Tactical Radar View</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className="gcs-btn"
            style={{ padding: '2px 6px', fontSize: '0.7rem' }}
            onClick={() => setRangeKm(Math.max(1, rangeKm - 1))}
          >
            Zoom +
          </button>
          <button
            className="gcs-btn"
            style={{ padding: '2px 6px', fontSize: '0.7rem' }}
            onClick={() => setRangeKm(Math.min(10, rangeKm + 1))}
          >
            Zoom -
          </button>
        </div>
      </div>
      <div
        className="gcs-panel-body"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0',
          position: 'relative',
          background: '#040608',
        }}
      >
        <canvas
          ref={canvasRef}
          width={450}
          height={420}
          style={{ width: '100%', height: '100%', display: 'block', maxHeight: '450px' }}
        />
        {/* Top-left Overlay Info */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'rgba(0, 240, 255, 0.7)',
            pointerEvents: 'none',
            lineHeight: '1.4',
            background: 'rgba(8, 11, 16, 0.8)',
            padding: '6px',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            borderRadius: '4px',
          }}
        >
          <div>SWEEP: ACTIVE</div>
          <div>RANGE: {rangeKm} KM</div>
          <div>TRACKS COUNT: {tracks.filter(t => t.status !== 'LOST').length}</div>
        </div>
      </div>
    </div>
  );
};
