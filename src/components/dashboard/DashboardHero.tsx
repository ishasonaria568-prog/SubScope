import React, { useState } from 'react';
import {
  Radar,
  ArrowRight,
  ShieldAlert,
  Server,
  Network,
  Activity,
  CheckCircle2,
  FileCheck,
  Search,
} from 'lucide-react';
import { validateDomain } from '../../lib/validation/domain';

interface DashboardHeroProps {
  onQuickStart: (domain: string) => void;
  onNavigateToScanner: () => void;
  hasPreviousResults: boolean;
  totalHistoricalScans: number;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  onQuickStart,
  onNavigateToScanner,
  hasPreviousResults,
  totalHistoricalScans,
}) => {
  const [domain, setDomain] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateDomain(domain);
    if (!validation.valid) {
      setError(validation.error || 'Please enter a valid domain such as: example.com');
      return;
    }
    setError(null);
    onQuickStart(validation.normalizedDomain);
  };

  const workflowSteps = [
    { title: 'Input Validation', desc: 'Strict RFC normalization, regex parsing & SSRF perimeter defense' },
    { title: 'Candidate Generation', desc: 'Curated reconnaissance dictionaries and custom wordlist parsing' },
    { title: 'DNS Resolution', desc: 'Native resolution & private IP range filtering' },
    { title: 'HTTP/S Probing', desc: 'Encrypted fallback checks with controlled concurrency' },
    { title: 'Metadata Analysis', desc: 'Extraction of status codes, server headers, and titles' },
    { title: 'Verified Export', desc: 'Instant CSV, JSON, and plaintext pipeline outputs' },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Header & Quick Input */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-[#162032] p-6 sm:p-10 lg:p-12 shadow-2xl">
        {/* Subtle grid background effect */}
        <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <Radar className="h-3.5 w-3.5 animate-pulse" />
            <span>Subdomain Enumeration & Reconnaissance</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Discover and verify accessible subdomains of authorized domains.
          </h1>

          <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-2xl">
            SubScope delivers fast, multi-threaded DNS and HTTP(S) reconnaissance to map exposed digital attack surfaces, identify live web applications, and extract actionable endpoint metadata.
          </p>

          {/* Quick Target Input */}
          <form onSubmit={handleLaunch} className="pt-2">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
                Enter Target Domain
              </label>
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5 max-w-xl">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => {
                      setDomain(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="example.com"
                    className="w-full h-12 rounded-lg bg-gray-900 px-4 text-sm font-mono text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="h-12 px-6 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-950 transition-all shrink-0"
                >
                  <span>Start Enumeration</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {error && (
                <div className="text-xs text-red-400 font-mono mt-1.5 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Small Authorization Notice */}
              <p className="text-xs text-gray-500 pt-1">
                Use this tool only against domains you own or have explicit permission to test.
              </p>
            </div>
          </form>

          {/* Quick Navigation suggestions */}
          <div className="flex flex-wrap items-center gap-3 pt-3 text-xs text-gray-400">
            <span>Or configure advanced options:</span>
            <button
              onClick={onNavigateToScanner}
              className="text-cyan-400 hover:text-cyan-300 underline font-medium"
            >
              Open Custom Wordlist & Protocol Scanner →
            </button>
          </div>
        </div>
      </div>

      {/* Reconnaissance Architecture Workflow */}
      <div className="space-y-4">
        <div className="border-b border-gray-800 pb-2">
          <h2 className="text-lg font-bold text-white font-sans">
            Automated Reconnaissance Pipeline
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            How SubScope securely maps, verifies, and analyzes candidate subdomains.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {workflowSteps.map((step, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-gray-800 bg-[#162032] p-4.5 space-y-2 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-mono font-bold border border-cyan-500/30">
                  {idx + 1}
                </span>
                <h3 className="text-sm font-semibold text-white font-mono">
                  {step.title}
                </h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed pl-7">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Security Principles & Defensive Posture */}
      <div className="rounded-xl border border-gray-800 bg-[#162032] p-6 space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Security & Reliability Safeguards Built-in</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-400">
          <div className="p-3.5 rounded-lg bg-gray-900/60 border border-gray-800/80 space-y-1">
            <span className="font-mono text-cyan-300 font-semibold block">SSRF Protection</span>
            <p>
              Rejects loopback, link-local, AWS IMDS metadata (169.254.169.254), and RFC 1918 private subnets.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-gray-900/60 border border-gray-800/80 space-y-1">
            <span className="font-mono text-cyan-300 font-semibold block">Vercel Serverless Ready</span>
            <p>
              Non-blocking fetch streaming architecture compatible with serverless cloud edge runtimes.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-gray-900/60 border border-gray-800/80 space-y-1">
            <span className="font-mono text-cyan-300 font-semibold block">No Fabricated Telemetry</span>
            <p>
              Every response code, latency metric, and web title originates from authenticated live network probing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
