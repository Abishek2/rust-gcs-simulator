-- Add migration script here

-- Simulation Sessions
CREATE TABLE simulation_sessions (
    session_id TEXT PRIMARY KEY,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    status TEXT NOT NULL
);

-- System Events
CREATE TABLE system_events (
    event_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    source TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    payload TEXT,
    FOREIGN KEY (session_id) REFERENCES simulation_sessions(session_id)
);

CREATE INDEX idx_system_events_session ON system_events(session_id, timestamp);
