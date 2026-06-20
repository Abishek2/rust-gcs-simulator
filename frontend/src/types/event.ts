export interface SystemEvent {
  id: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  source: string;
}
