export interface Diagnostics {
  websocket_clients: number;
  messages_sent: number;
  avg_latency_ms: number;
  max_latency_ms: number;
  dropped_message_count: number;
  event_count: number;
  uptime_seconds: number;
  timestamp: string;

  // Optional Frontend-only metrics for fallback representation
  cpu_usage_percent?: number;
  memory_usage_mb?: number;
  disk_usage_percent?: number;
  network_rx_kbps?: number;
  network_tx_kbps?: number;
  packet_loss_percent?: number;
}
