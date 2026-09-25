import type { ScanResultItem, ScanSummary } from '../../types/scanner';

/**
 * Escapes CSV values conforming to RFC 4180.
 */
function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports scan results as a standard CSV file.
 */
export function exportToCsv(target: string, results: ScanResultItem[]): void {
  const headers = [
    'subdomain',
    'url',
    'status',
    'response_time',
    'protocol',
    'title',
    'ip',
    'server',
    'content_type',
    'timestamp',
  ];

  const rows = results.map((item) => [
    escapeCsvValue(item.subdomain),
    escapeCsvValue(item.url),
    escapeCsvValue(item.status ?? 'N/A'),
    escapeCsvValue(item.responseTime ?? 'N/A'),
    escapeCsvValue(item.protocol),
    escapeCsvValue(item.title),
    escapeCsvValue(item.ip),
    escapeCsvValue(item.server),
    escapeCsvValue(item.contentType),
    escapeCsvValue(item.timestamp),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  triggerDownload(csvContent, `subscope-${target}-results.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Exports scan summary and results as structured JSON.
 */
export function exportToJson(summary: ScanSummary): void {
  const jsonContent = JSON.stringify(summary, null, 2);
  triggerDownload(jsonContent, `subscope-${summary.target}-results.json`, 'application/json;charset=utf-8;');
}

/**
 * Exports just the list of discovered subdomains / URLs as a plaintext list.
 */
export function exportToTxt(target: string, results: ScanResultItem[], urlsOnly = false): void {
  const lines = results.map((r) => (urlsOnly ? r.url : r.subdomain));
  const txtContent = lines.join('\n');
  triggerDownload(txtContent, `subscope-${target}-${urlsOnly ? 'urls' : 'subdomains'}.txt`, 'text/plain;charset=utf-8;');
}

/**
 * Helper to trigger browser file download.
 */
function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
