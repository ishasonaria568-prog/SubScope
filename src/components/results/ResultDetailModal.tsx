import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, Shield, Server, Clock, Globe, ArrowRight } from 'lucide-react';
import type { ScanResultItem } from '../../types/scanner';

interface ResultDetailModalProps {
  item: ScanResultItem | null;
  onClose: () => void;
}

export const ResultDetailModal: React.FC<ResultDetailModalProps> = ({ item, onClose }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!item) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const getStatusColor = (status: number | null) => {
    if (!status) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    if (status >= 200 && status < 300) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (status >= 300 && status < 400) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    if (status >= 400 && status < 500) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-red-400 bg-red-500/10 border-red-500/30';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl rounded-xl border border-gray-700 bg-[#162032] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4 bg-[#111827]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white font-mono">
                {item.subdomain}
              </h2>
              <span className="text-xs text-gray-400">Subdomain Reconnaissance Inspector</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Main Target Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-gray-900/80 border border-gray-800">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider font-mono">Target URL</div>
              <div className="text-sm font-mono text-cyan-300 font-medium break-all mt-0.5">
                {item.url}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => copyToClipboard(item.url, 'url')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors border border-gray-700"
              >
                {copiedField === 'url' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedField === 'url' ? 'Copied' : 'Copy URL'}</span>
              </button>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors border border-cyan-500/30"
              >
                <span>Visit</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-3.5 rounded-lg bg-gray-900/50 border border-gray-800 space-y-1">
              <span className="text-gray-500 font-mono">HTTP Status</span>
              <div className="flex items-center gap-2 pt-0.5">
                <span className={`px-2 py-0.5 rounded font-mono font-medium border text-xs ${getStatusColor(item.status)}`}>
                  {item.status ? `${item.status} ${item.statusText}` : 'DNS Only (No HTTP)'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-gray-900/50 border border-gray-800 space-y-1">
              <span className="text-gray-500 font-mono">Response Time</span>
              <div className="text-sm font-semibold font-mono text-white tabular-nums pt-0.5">
                {item.responseTime !== null ? `${item.responseTime} ms` : 'N/A'}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-gray-900/50 border border-gray-800 space-y-1">
              <span className="text-gray-500 font-mono">Resolved IP Address</span>
              <div className="flex items-center justify-between pt-0.5">
                <span className="font-mono text-white text-xs tabular-nums">{item.ip}</span>
                <button
                  onClick={() => copyToClipboard(item.ip, 'ip')}
                  className="text-gray-400 hover:text-white"
                  title="Copy IP"
                >
                  {copiedField === 'ip' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-gray-900/50 border border-gray-800 space-y-1">
              <span className="text-gray-500 font-mono">Active Protocol</span>
              <div className="text-sm font-mono text-cyan-400 font-semibold pt-0.5">
                {item.protocol}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-gray-900/50 border border-gray-800 space-y-1">
              <span className="text-gray-500 font-mono">Web Server</span>
              <div className="text-sm font-mono text-gray-200 truncate pt-0.5">
                {item.server || 'N/A'}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-gray-900/50 border border-gray-800 space-y-1">
              <span className="text-gray-500 font-mono">Content-Type</span>
              <div className="text-xs font-mono text-gray-200 truncate pt-0.5">
                {item.contentType || 'N/A'}
              </div>
            </div>
          </div>

          {/* Page Title */}
          <div className="p-3.5 rounded-lg bg-gray-900/50 border border-gray-800 space-y-1">
            <span className="text-xs text-gray-500 font-mono">HTML Page Title</span>
            <div className="text-sm text-gray-200 pt-0.5 font-medium leading-relaxed">
              {item.title && item.title !== 'N/A' ? item.title : <span className="text-gray-500 italic">No HTML title tag detected</span>}
            </div>
          </div>

          {/* Verification Timestamp */}
          <div className="flex items-center justify-between text-xs text-gray-500 font-mono pt-1 border-t border-gray-800/80">
            <span>Verified At: {new Date(item.timestamp).toLocaleString()}</span>
            <button
              onClick={() => copyToClipboard(JSON.stringify(item, null, 2), 'json')}
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {copiedField === 'json' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copiedField === 'json' ? 'Copied JSON' : 'Copy JSON'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
