import React, { useRef, useEffect, useState } from 'react';
import { Square, CheckCircle, XCircle, Activity, Clock, ShieldCheck, Zap } from 'lucide-react';
import type { ScanProgress, ActivityFeedItem } from '../../types/scanner';

interface LiveScanProgressProps {
  target: string;
  progress: ScanProgress;
  activityFeed: ActivityFeedItem[];
  onAbort: () => void;
}

export const LiveScanProgress: React.FC<LiveScanProgressProps> = ({
  target,
  progress,
  activityFeed,
  onAbort,
}) => {
  const [showOnlyDiscovered, setShowOnlyDiscovered] = useState(false);
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll activity feed to latest entry
  useEffect(() => {
    if (feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activityFeed.length]);

  const percentage = progress.total > 0 ? Math.min(100, Math.round((progress.checked / progress.total) * 100)) : 0;

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSec.toString().padStart(2, '0')}`;
  };

  const filteredFeed = showOnlyDiscovered
    ? activityFeed.filter((item) => item.active)
    : activityFeed;

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-[#162032] p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header with Target and Abort button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h3 className="text-base font-bold text-white font-sans">
              Enumeration in progress...
            </h3>
          </div>
          <div className="text-xs text-gray-400">
            Target Host: <span className="font-mono text-cyan-300 font-semibold">{target}</span>
          </div>
        </div>

        <button
          onClick={onAbort}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
          <span>Stop Enumeration</span>
        </button>
      </div>

      {/* Progress Bar & Percentage */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-gray-400">
            Progress:{' '}
            <strong className="text-white tabular-nums">
              {progress.checked} / {progress.total}
            </strong>{' '}
            candidates checked
          </span>
          <span className="text-cyan-400 font-bold text-sm tabular-nums">{percentage}%</span>
        </div>

        <div className="h-3 w-full bg-gray-950 rounded-full overflow-hidden border border-gray-800 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-200 ease-out shadow-sm shadow-cyan-500/50"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Real-time Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800">
          <div className="text-gray-400 mb-1 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>Discovered</span>
          </div>
          <div className="text-lg font-bold font-mono text-cyan-300 tabular-nums">
            {progress.discovered}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800">
          <div className="text-gray-400 mb-1 flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>Responsive</span>
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
            {progress.responsive}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800">
          <div className="text-gray-400 mb-1 flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5 text-gray-500" />
            <span>Inactive/Failed</span>
          </div>
          <div className="text-lg font-bold font-mono text-gray-400 tabular-nums">
            {progress.failed}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800">
          <div className="text-gray-400 mb-1 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span>Elapsed</span>
          </div>
          <div className="text-lg font-bold font-mono text-white tabular-nums">
            {formatElapsed(progress.elapsedSeconds)}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800 col-span-2 sm:col-span-1">
          <div className="text-gray-400 mb-1 flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Throughput</span>
          </div>
          <div className="text-lg font-bold font-mono text-amber-300 tabular-nums">
            {progress.currentRate} <span className="text-xs font-normal text-gray-500">req/s</span>
          </div>
        </div>
      </div>

      {/* Live Activity Terminal Feed */}
      <div className="rounded-lg border border-gray-800 bg-[#0c121d] overflow-hidden">
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-gray-800 bg-[#090e17] text-xs">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-mono text-gray-300 font-medium">Live Activity Feed</span>
            <span className="text-[10px] font-mono text-gray-500">({activityFeed.length} events)</span>
          </div>

          <button
            onClick={() => setShowOnlyDiscovered(!showOnlyDiscovered)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
              showOnlyDiscovered
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {showOnlyDiscovered ? 'Discovered Only' : 'Show All'}
          </button>
        </div>

        <div className="h-44 sm:h-52 overflow-y-auto p-3 font-mono text-xs space-y-1.5 scrollbar-thin">
          {filteredFeed.length === 0 ? (
            <div className="text-gray-500 italic py-6 text-center">
              Scanning candidate subdomains... Activity events will appear in real time.
            </div>
          ) : (
            filteredFeed.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-2 px-2 py-1 rounded text-xs transition-colors ${
                  item.active
                    ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/40'
                    : 'text-gray-500 hover:text-gray-400'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {item.active ? (
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  ) : (
                    <span className="text-gray-600 shrink-0">✗</span>
                  )}
                  <span className="truncate">{item.subdomain}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-[11px]">
                  {item.status && (
                    <span
                      className={`font-semibold ${
                        item.status >= 200 && item.status < 300
                          ? 'text-emerald-400'
                          : item.status >= 300 && item.status < 400
                          ? 'text-cyan-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  )}
                  {item.responseTime !== null && (
                    <span className="text-gray-400 tabular-nums">{item.responseTime}ms</span>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={feedEndRef} />
        </div>
      </div>
    </div>
  );
};
