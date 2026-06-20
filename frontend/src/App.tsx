import { useState, useEffect, useRef } from 'react';
import { ConnectionStatus } from './components/ConnectionStatus';
import type { WSConnectionState } from './components/ConnectionStatus';
import { Dashboard } from './pages/Dashboard';
import { DiagnosticsPage } from './pages/Diagnostics';
import { ReplayPage } from './pages/Replay';
import { AboutPage } from './pages/About';
import type { TelemetryUpdate } from './types/telemetry';

function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'diagnostics' | 'replay' | 'about'>('dashboard');
  
  // Real Connection states (Phase 2)
  const [connectionState, setConnectionState] = useState<WSConnectionState>('DISCONNECTED');
  const [liveTelemetry, setLiveTelemetry] = useState<TelemetryUpdate | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [stale, setStale] = useState<boolean>(false);
  const [backendHealth, setBackendHealth] = useState<'ok' | 'error' | 'loading'>('loading');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const lastMessageTimeRef = useRef<number>(0);

  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws/telemetry';
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  // 1. WebSocket Client Connection
  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    console.log(`[WS] Attempting connection to: ${wsUrl}`);
    setConnectionState((prev) => (prev === 'DISCONNECTED' ? 'CONNECTING' : 'RECONNECTING'));

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`[WS] Connection successfully opened to: ${wsUrl}`);
      setConnectionState('CONNECTED');
      setBackendHealth('ok');
      setStale(false);
      lastMessageTimeRef.current = Date.now();
      setLastUpdate(new Date());
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`[WS] Message received from backend. Type: ${data.type || 'unknown'}, Timestamp: ${data.timestamp}`);
        
        if (data.type === 'telemetry_update') {
          setLiveTelemetry(data as TelemetryUpdate);
          lastMessageTimeRef.current = Date.now();
          setLastUpdate(new Date());
          setStale(false);
        }
      } catch (err) {
        console.error('[WS] Failed to parse message JSON payload:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('[WS] WebSocket error observed:', error);
      setBackendHealth('error');
    };

    ws.onclose = (event) => {
      console.log(`[WS] Socket closed. Clean: ${event.wasClean}, Code: ${event.code}, Reason: ${event.reason || 'None'}`);
      setConnectionState('DISCONNECTED');
      setLiveTelemetry(null);

      // Trigger automatic reconnection loop
      console.log('[WS] Scheduling reconnection in 3 seconds...');
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connectWebSocket();
      }, 3000);
    };
  };

  // 2. Poll Backend /health REST API
  const checkBackendHealth = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/health`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok') {
          setBackendHealth('ok');
        } else {
          setBackendHealth('error');
        }
      } else {
        setBackendHealth('error');
      }
    } catch (err) {
      console.warn('[REST API] Health check failed:', err);
      setBackendHealth('error');
    }
  };

  // Lifecycle configuration
  useEffect(() => {
    connectWebSocket();
    checkBackendHealth();

    // Health check REST API polling loop (every 10 seconds)
    const healthInterval = setInterval(checkBackendHealth, 10000);

    // Stale message monitoring (every 1 second)
    const staleInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN && lastMessageTimeRef.current > 0) {
        const secondsSinceLastMsg = (Date.now() - lastMessageTimeRef.current) / 1000;
        if (secondsSinceLastMsg > 3.0) {
          if (!stale) {
            console.warn(`[WS] Stale warning activated. No message received for ${secondsSinceLastMsg.toFixed(1)}s`);
            setStale(true);
          }
        }
      }
    }, 1000);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      clearInterval(healthInterval);
      clearInterval(staleInterval);
    };
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'diagnostics':
        return <DiagnosticsPage />;
      case 'replay':
        return <ReplayPage />;
      case 'about':
        return <AboutPage />;
      case 'dashboard':
      default:
        return (
          <Dashboard 
            externalTelemetry={liveTelemetry}
          />
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      {/* GCS HEADER BAR */}
      <header style={{
        height: 'var(--header-height)',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
      }}>
        {/* Left: Station Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.15rem',
            color: '#fff',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ color: 'var(--color-cyber-blue)' }}>⚡ GCS</span> TERMINAL
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '8px' }}>
          {(['dashboard', 'diagnostics', 'replay', 'about'] as const).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              style={{
                background: currentPage === page ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                border: '1px solid',
                borderColor: currentPage === page ? 'var(--color-cyber-blue)' : 'transparent',
                color: currentPage === page ? 'var(--color-cyber-blue)' : 'var(--color-text-secondary)',
                fontFamily: 'var(--font-display)',
                fontSize: '0.8rem',
                padding: '6px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                transition: 'all 0.2s ease',
              }}
              className="nav-tab-btn"
            >
              {page === 'about' ? 'Briefing' : page}
            </button>
          ))}
        </nav>

        {/* Right: Connection status panel */}
        <ConnectionStatus
          connectionState={connectionState}
          backendHealth={backendHealth}
          stale={stale}
          lastUpdate={lastUpdate}
        />
      </header>

      {/* VIEWPORT AREA */}
      <main style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-primary)' }}>
        {renderPage()}
      </main>

    </div>
  );
}

export default App;
