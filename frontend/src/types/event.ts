export interface SystemEvent {
  id: string; // frontend unique id / key
  event_id?: string; // backend database key
  session_id?: string;
  event_type?: string;
  source: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | string;
  message: string;
  timestamp: string; // ISO DateTime
  payload?: string | null; // associated JSON metadata string
}

export interface SimulationSession {
  session_id: string;
  start_time: string;
  end_time?: string | null;
  status: string;
}
