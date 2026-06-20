import React, { useRef, useEffect } from 'react';
import type { VideoHealth } from '../types/videoHealth';

interface VideoHealthPanelProps {
  videoHealth: VideoHealth | null;
}

export const VideoHealthPanel: React.FC<VideoHealthPanelProps> = ({ videoHealth }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    const render = () => {
      frameCount++;
      const w = canvas.width;
      const h = canvas.height;

      // Check current status
      const status = videoHealth?.status || 'LOST';

      if (status === 'LOST') {
        // Draw TV Static (Snow)
        const imgData = ctx.createImageData(w, h);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const val = Math.floor(Math.random() * 255);
          data[i] = val;     // R
          data[i + 1] = val; // G
          data[i + 2] = val; // B
          data[i + 3] = 255; // A
        }
        ctx.putImageData(imgData, 0, 0);

        // Draw overlay text
        ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.fillRect(w / 2 - 80, h / 2 - 15, 160, 30);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(w / 2 - 80, h / 2 - 15, 160, 30);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('VIDEO LINK LOST', w / 2, h / 2);
      } else {
        // Active simulation HUD
        ctx.fillStyle = '#05070a';
        ctx.fillRect(0, 0, w, h);

        // Draw scanlines in DEGRADED status
        if (status === 'DEGRADED') {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.06)';
          ctx.lineWidth = 1;
          for (let y = 0; y < h; y += 4) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
          }
        }

        // Draw green tactical color palette (dimmed if degraded)
        const hudColor = status === 'DEGRADED' ? 'rgba(245, 158, 11, 0.6)' : 'rgba(0, 240, 255, 0.7)';
        ctx.strokeStyle = hudColor;
        ctx.fillStyle = hudColor;
        ctx.lineWidth = 1;

        // Draw pitch ladder (moving up/down slowly based on frameCount)
        const pitchOffset = Math.sin(frameCount * 0.02) * 20;
        ctx.save();
        ctx.translate(w / 2, h / 2 + pitchOffset);

        // Draw pitch lines
        ctx.beginPath();
        // Central reticle brackets
        ctx.moveTo(-15, 0); ctx.lineTo(-5, 0);
        ctx.moveTo(5, 0); ctx.lineTo(15, 0);
        
        // 10 Degrees line
        ctx.moveTo(-30, -30); ctx.lineTo(30, -30);
        ctx.moveTo(-30, -30); ctx.lineTo(-30, -25);
        ctx.moveTo(30, -30); ctx.lineTo(30, -25);
        
        // -10 Degrees line (dashed)
        ctx.moveTo(-30, 30); ctx.lineTo(-20, 30);
        ctx.moveTo(-10, 30); ctx.lineTo(10, 30);
        ctx.moveTo(20, 30); ctx.lineTo(30, 30);
        ctx.moveTo(-30, 30); ctx.lineTo(-30, 25);
        ctx.moveTo(30, 30); ctx.lineTo(30, 25);
        ctx.stroke();

        ctx.font = '8px Roboto Mono';
        ctx.fillText('10', -42, -28);
        ctx.fillText('10', 36, -28);
        ctx.fillText('-10', -46, 32);
        ctx.fillText('-10', 36, 32);
        ctx.restore();

        // Draw side scales (Alt & Speed tape)
        // Speed left
        const speedVal = 10 + Math.sin(frameCount * 0.01) * 3;
        ctx.beginPath();
        ctx.rect(10, 20, 25, h - 40);
        ctx.stroke();
        ctx.font = '8px Roboto Mono';
        ctx.fillText('SPD', 14, 15);
        ctx.fillText(`${speedVal.toFixed(1)}`, 14, h / 2);

        // Alt right
        const altVal = 140 + Math.cos(frameCount * 0.01) * 15;
        ctx.beginPath();
        ctx.rect(w - 35, 20, 25, h - 40);
        ctx.stroke();
        ctx.fillText('ALT', w - 32, 15);
        ctx.fillText(`${Math.round(altVal)}`, w - 32, h / 2);

        // Target reticle lock simulation (tracking a mock coordinate)
        const rot = frameCount * 0.01;
        const targetX = w / 2 + Math.sin(frameCount * 0.015) * 50;
        const targetY = h / 2 + Math.cos(frameCount * 0.012) * 30;

        ctx.save();
        ctx.translate(targetX, targetY);
        ctx.rotate(rot);
        ctx.strokeStyle = status === 'DEGRADED' ? 'rgba(245, 158, 11, 0.8)' : 'rgba(239, 68, 68, 0.7)';
        ctx.strokeRect(-10, -10, 20, 20);
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();

        ctx.font = '8px Orbitron';
        ctx.fillStyle = status === 'DEGRADED' ? 'var(--color-warning)' : 'var(--color-danger)';
        ctx.fillText('SIM TRK LOCK', targetX + 16, targetY + 3);

        // Add scan line running down screen
        const scanY = (frameCount * 1.5) % h;
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(w, scanY);
        ctx.stroke();

        // Feed stamp
        ctx.fillStyle = hudColor;
        ctx.font = '9px Orbitron';
        ctx.textAlign = 'left';
        ctx.fillText('CAM: SIM-FEED-01', 45, 30);
        
        ctx.textAlign = 'right';
        ctx.fillText('REC🔴', w - 45, 30);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [videoHealth]);

  const getStatusColor = (status: VideoHealth['status']) => {
    switch (status) {
      case 'NOMINAL':
        return 'var(--color-success)';
      case 'DEGRADED':
        return 'var(--color-warning)';
      case 'LOST':
      default:
        return 'var(--color-danger)';
    }
  };

  return (
    <div className="gcs-panel" style={{ height: '100%' }}>
      <div className="gcs-panel-header">
        <span>Video Health Monitor</span>
        <span 
          className="badge" 
          style={{ 
            borderColor: getStatusColor(videoHealth?.status || 'LOST'),
            color: getStatusColor(videoHealth?.status || 'LOST'),
            background: 'rgba(0,0,0,0.3)'
          }}
        >
          {videoHealth?.status || 'LOST'}
        </span>
      </div>
      <div className="gcs-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px' }}>
        
        {/* Canvas Display */}
        <div style={{
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          overflow: 'hidden',
          background: '#000',
          aspectRatio: '16/9',
          position: 'relative'
        }}>
          <canvas 
            ref={canvasRef} 
            width={320} 
            height={180} 
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>

        {/* Info Grid */}
        <div className="grid-3 font-mono" style={{ textAlign: 'center', fontSize: '0.75rem', background: 'rgba(0,0,0,0.15)', padding: '6px', borderRadius: '4px' }}>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.65rem' }}>FRAMERATE</div>
            <div style={{ fontWeight: 'bold', color: '#fff' }}>
              {videoHealth?.status === 'LOST' ? 0.0 : videoHealth?.fps.toFixed(1)} FPS
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.65rem' }}>BITRATE</div>
            <div style={{ fontWeight: 'bold', color: '#fff' }}>
              {videoHealth?.status === 'LOST' ? 0 : videoHealth?.bitrate_kbps} Kbps
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.65rem' }}>LATENCY</div>
            <div style={{ fontWeight: 'bold', color: videoHealth && videoHealth.latency_ms > 200 ? 'var(--color-warning)' : 'var(--color-success)' }}>
              {videoHealth?.status === 'LOST' ? '∞' : `${videoHealth?.latency_ms} ms`}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
