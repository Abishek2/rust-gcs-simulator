export interface Diagnostics {
  cpu_usage_percent: number;
  memory_usage_mb: number;
  disk_usage_percent: number;
  network_rx_kbps: number;
  network_tx_kbps: number;
  uptime_seconds: number;
  packet_loss_percent: number;
  last_updated: string;
}
