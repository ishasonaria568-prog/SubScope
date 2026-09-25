import React, { useState, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ArrowUpDown,
  Download,
  Info,
  Filter,
} from 'lucide-react';
import type { ScanResultItem, ScanSummary } from '../../types/scanner';
import { exportToCsv, exportToJson, exportToTxt } from '../../lib/export/exportResults';

interface ResultsTableProps {
  results: ScanResultItem[];
  summary: ScanSummary | null;
  onSelectItem: (item: ScanResultItem) => void;
  onStartNewScan?: () => void;
}

type SortField = 'subdomain' | 'status' | 'responseTime';
type SortOrder = 'asc' | 'desc';

export const ResultsTable: React.FC<ResultsTableProps> = ({
  results,
  summary,
  onSelectItem,
  onStartNewScan,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [protocolFilter, setProtocolFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('responseTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopyUrl = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1800);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      // Search term
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchSubdomain = item.subdomain.toLowerCase().includes(query);
        const matchIp = item.ip.toLowerCase().includes(query);
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchServer = item.server.toLowerCase().includes(query);
        if (!matchSubdomain && !matchIp && !matchTitle && !matchServer) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === '2xx' && (!item.status || item.status < 200 || item.status >= 300)) return false;
        if (statusFilter === '3xx' && (!item.status || item.status < 300 || item.status >= 400)) return false;
        if (statusFilter === '4xx' && (!item.status || item.status < 400 || item.status >= 500)) return false;
        if (statusFilter === '5xx' && (!item.status || item.status < 500)) return false;
        if (statusFilter === 'dns' && item.status !== null) return false;
      }

      // Protocol filter
      if (protocolFilter !== 'all') {
        if (protocolFilter === 'https' && item.protocol !== 'HTTPS') return false;
        if (protocolFilter === 'http' && item.protocol !== 'HTTP') return false;
        if (protocolFilter === 'dns' && item.protocol !== 'DNS') return false;
      }

      return true;
    });
  }, [results, search, statusFilter, protocolFilter]);

  const sortedResults = useMemo(() => {
    return [...filteredResults].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'subdomain') {
        comparison = a.subdomain.localeCompare(b.subdomain);
      } else if (sortField === 'status') {
        const statusA = a.status ?? 999;
        const statusB = b.status ?? 999;
        comparison = statusA - statusB;
      } else if (sortField === 'responseTime') {
        const timeA = a.responseTime ?? 99999;
        const timeB = b.responseTime ?? 99999;
        comparison = timeA - timeB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredResults, sortField, sortOrder]);

  const targetName = summary?.target || 'target';

  // Empty state if no scan results at all
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-gray-800 bg-[#162032] my-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-800 text-gray-400 mb-4 border border-gray-700">
          <Search className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">No Scan Results</h3>
        <p className="mt-1 text-sm text-gray-400 max-w-md">
          Enter an authorized domain and start an enumeration scan to discover accessible subdomains.
        </p>
        {onStartNewScan && (
          <button
            onClick={onStartNewScan}
            className="mt-5 px-4 py-2 text-sm font-semibold rounded-lg bg-cyan-500 text-gray-950 hover:bg-cyan-400 transition-colors shadow-sm shadow-cyan-950"
          >
            Start Scanner
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search, Filters, Exports */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-lg bg-[#162032] border border-gray-800">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subdomains, IPs, titles, servers..."
            className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter dropdowns & Export actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Filter className="h-3.5 w-3.5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-gray-200 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Statuses</option>
              <option value="2xx">2xx Success</option>
              <option value="3xx">3xx Redirect</option>
              <option value="4xx">4xx Client Error</option>
              <option value="5xx">5xx Server Error</option>
              <option value="dns">DNS Only</option>
            </select>
          </div>

          {/* Protocol filter */}
          <select
            value={protocolFilter}
            onChange={(e) => setProtocolFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-gray-200 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Protocols</option>
            <option value="https">HTTPS</option>
            <option value="http">HTTP</option>
            <option value="dns">DNS</option>
          </select>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center gap-1 border-l border-gray-700 pl-2">
            <button
              onClick={() => exportToCsv(targetName, sortedResults)}
              title="Export as CSV"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 transition-colors"
            >
              <Download className="h-3 w-3 text-cyan-400" />
              <span>CSV</span>
            </button>
            {summary && (
              <button
                onClick={() => exportToJson(summary)}
                title="Export as JSON"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 transition-colors"
              >
                <Download className="h-3 w-3 text-cyan-400" />
                <span>JSON</span>
              </button>
            )}
            <button
              onClick={() => exportToTxt(targetName, sortedResults)}
              title="Export Plaintext Subdomains"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 transition-colors"
            >
              <Download className="h-3 w-3 text-cyan-400" />
              <span>TXT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Count bar */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <span>
          Showing <strong className="text-white font-mono">{sortedResults.length}</strong> of{' '}
          <strong className="text-white font-mono">{results.length}</strong> subdomains discovered
        </span>
        <span className="font-mono text-gray-500">Click any row for detailed inspection</span>
      </div>

      {/* Table Container with Horizontal Scroll Safety */}
      <div className="overflow-x-auto rounded-xl border border-gray-800 bg-[#162032] shadow-sm">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-gray-800 bg-[#111827] text-gray-400 font-mono text-[11px] uppercase tracking-wider select-none">
            <tr>
              <th
                onClick={() => handleSort('subdomain')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Subdomain</span>
                  <ArrowUpDown className="h-3 w-3 text-gray-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  <ArrowUpDown className="h-3 w-3 text-gray-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('responseTime')}
                className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Response</span>
                  <ArrowUpDown className="h-3 w-3 text-gray-500" />
                </div>
              </th>
              <th className="py-3 px-3">Protocol</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-3">IP Address</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/80 font-sans">
            {sortedResults.map((item) => {
              const is2xx = item.status && item.status >= 200 && item.status < 300;
              const is3xx = item.status && item.status >= 300 && item.status < 400;
              const is4xx = item.status && item.status >= 400 && item.status < 500;
              const is5xx = item.status && item.status >= 500;

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="cursor-pointer hover:bg-gray-800/60 transition-colors group"
                >
                  {/* Subdomain */}
                  <td className="py-3 px-4 font-mono font-medium text-cyan-300 group-hover:text-cyan-200">
                    <span className="truncate block max-w-[200px] sm:max-w-xs">{item.subdomain}</span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-xs">
                    {item.status ? (
                      <span
                        className={`font-semibold ${
                          is2xx
                            ? 'text-emerald-400'
                            : is3xx
                            ? 'text-cyan-400'
                            : is4xx
                            ? 'text-amber-400'
                            : is5xx
                            ? 'text-red-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-[11px]">DNS only</span>
                    )}
                  </td>

                  {/* Response time */}
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-xs tabular-nums text-gray-300">
                    {item.responseTime !== null ? `${item.responseTime}ms` : <span className="text-gray-600">—</span>}
                  </td>

                  {/* Protocol */}
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-xs">
                    <span
                      className={`font-medium ${
                        item.protocol === 'HTTPS'
                          ? 'text-emerald-400'
                          : item.protocol === 'HTTP'
                          ? 'text-amber-400'
                          : 'text-gray-500'
                      }`}
                    >
                      {item.protocol}
                    </span>
                  </td>

                  {/* Title */}
                  <td className="py-3 px-4 text-gray-300 max-w-[160px] sm:max-w-[240px] truncate text-xs">
                    {item.title && item.title !== 'N/A' ? (
                      <span title={item.title}>{item.title}</span>
                    ) : (
                      <span className="text-gray-600 italic">N/A</span>
                    )}
                  </td>

                  {/* IP Address */}
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-xs text-gray-400 tabular-nums">
                    {item.ip}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => handleCopyUrl(e, item.url)}
                        title="Copy URL"
                        className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                      >
                        {copiedUrl === item.url ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Open in new tab"
                        className="p-1 rounded text-gray-400 hover:text-cyan-300 hover:bg-gray-700 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectItem(item);
                        }}
                        title="Inspect metadata"
                        className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
