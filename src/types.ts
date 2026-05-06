export interface MetricPoint {
  time: string;
  timestamp: number;
  cpu: number;
  memory: number;
  requests: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  service: string;
  message: string;
}

export type TimeRange = '5m' | '15m' | '1h' | '6h' | '24h';
