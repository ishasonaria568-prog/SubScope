import React, { useState } from 'react';
import { Clock, Trash2, ExternalLink, Download, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { ScanHistoryEntry, ScanSummary } from '../../types/scanner';
import { exportToCsv, exportToJson } from '../../lib/export/exportResults';

interface ScanHistoryProps {
  history: ScanHistoryEntry[];
  onSelectScan: (summary: ScanSummary) => void;
  onDeleteScan: (id: string) => void;
  onClearAll: () => void;
  onNavigateToScanner: () => void;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({
  history,
  onSelectScan,
  onDeleteScan,
  onClearAll,
  onNavigateToScanner,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-gray-800 bg-[#162032] my-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-800 text-gray-400 mb-4 border border-gray-700">
          <Clock className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">No Scan History Recorded</h3>
        <p className="mt-1 text-sm text-gray-400 max-w-md">
          Completed reconnaissance scans will be automatically saved here for quick review and export.
        </p>
        <button
          onClick={onNavigateToScanner}
          className="mt-5 px-4 py-2 text-sm font-semibold rounded-lg bg-cyan-500 text-gray-950 hover:bg-cyan-400 transition-colors shadow-sm shadow-cyan-950"
        >
          Start First Scan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Clear action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white font-sans">
            Enumeration History
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Locally stored record of executed reconnaissance scans.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {confirmClear ? (
            <div className="flex items-center gap-2 bg-red-950/60 border border-red-800 p-1.5 rounded-lg text-xs">
              <span className="text-red-300">Delete all history?</span>
              <button
                onClick={() => {
                  onClearAll();
                  setConfirmClear(false);
                }}
                className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded font-medium"
              >
                Yes, Clear
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-2 py-0.5 bg-gray-800 text-gray-300 hover:text-white rounded"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-700 bg-gray-800/80 text-xs text-gray-300 hover:text-red-400 hover:border-red-900/60 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* History Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="rounded-xl border border-gray-800 bg-[#162032] p-5 space-y-4 hover:border-gray-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Target & Status */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold font-mono text-cyan-300 truncate">
                  {entry.target}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                  <CheckCircle2 className="h-3 w-3" />
                  {entry.status}
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-gray-800/80 font-mono">
                <div>
                  <span className="text-gray-500 block text-[11px]">Subdomains</span>
                  <span className="text-white font-bold text-base tabular-nums">
                    {entry.subdomainsFound}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Duration</span>
                  <span className="text-white font-bold text-base tabular-nums">
                    {entry.duration}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-gray-400">
                <span>Executed: {entry.date}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-800/80 text-xs">
              <button
                onClick={() => onSelectScan(entry.summary)}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
              >
                <span>View Results</span>
                <ExternalLink className="h-3 w-3" />
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => exportToCsv(entry.target, entry.summary.results)}
                  title="Export CSV"
                  className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDeleteScan(entry.id)}
                  title="Delete scan"
                  className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-gray-800"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
