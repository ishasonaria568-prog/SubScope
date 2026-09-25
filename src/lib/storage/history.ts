import type { ScanHistoryEntry, ScanSummary } from '../../types/scanner';

const STORAGE_KEY = 'subscope_scan_history_v1';

export function getScanHistory(): ScanHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load scan history:', e);
    return [];
  }
}

export function saveScanToHistory(summary: ScanSummary, status: 'Completed' | 'Aborted' | 'Failed' = 'Completed'): ScanHistoryEntry {
  const durationSec = Math.max(1, Math.round(summary.durationMs / 1000));
  const entry: ScanHistoryEntry = {
    id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    target: summary.target,
    date: new Date(summary.startedAt).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    subdomainsFound: summary.subdomainsFound,
    responsiveCount: summary.responsiveCount,
    duration: `${durationSec}s`,
    status,
    summary,
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = getScanHistory();
      // Keep most recent 50 scans to prevent quota limits
      const updated = [entry, ...existing.filter((item) => item.target !== entry.target || item.id !== entry.id)].slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to persist scan history:', e);
    }
  }

  return entry;
}

export function deleteScanFromHistory(id: string): ScanHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getScanHistory();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete history item:', e);
    return [];
  }
}

export function clearAllScanHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear scan history:', e);
  }
}
