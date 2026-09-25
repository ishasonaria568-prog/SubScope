export type ScanProtocol = 'https' | 'http' | 'fallback';

export type ScanConcurrency = 10 | 25 | 50 | 100;

export type WordlistPreset = 'quick' | 'standard' | 'full' | 'custom';

export interface ScanResultItem {
  id: string;
  subdomain: string;
  url: string;
  status: number | null;
  statusText: string;
  responseTime: number | null; // in ms
  protocol: 'HTTPS' | 'HTTP' | 'DNS';
  title: string;
  ip: string;
  server: string;
  contentType: string;
  timestamp: string;
  isResponsive: boolean;
  dnsResolved: boolean;
  error?: string;
}

export interface ActivityFeedItem {
  id: string;
  candidate: string;
  subdomain: string;
  active: boolean;
  status: number | null;
  responseTime: number | null;
  timestamp: number;
}

export interface ScanProgress {
  candidate: string;
  checked: number;
  total: number;
  discovered: number;
  responsive: number;
  failed: number;
  elapsedSeconds: number;
  currentRate: number; // req/s
}

export interface ScanSummary {
  target: string;
  protocol: ScanProtocol;
  concurrency: ScanConcurrency;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  totalChecked: number;
  subdomainsFound: number;
  responsiveCount: number;
  httpsCount: number;
  httpCount: number;
  successfulCount: number; // 2xx
  results: ScanResultItem[];
}

export interface ScanHistoryEntry {
  id: string;
  target: string;
  date: string;
  subdomainsFound: number;
  responsiveCount: number;
  duration: string;
  status: 'Completed' | 'Aborted' | 'Failed';
  summary: ScanSummary;
}

export interface ScanRequestConfig {
  domain: string;
  protocol: ScanProtocol;
  concurrency: ScanConcurrency;
  wordlistPreset: WordlistPreset;
  customWordlist?: string[];
}
