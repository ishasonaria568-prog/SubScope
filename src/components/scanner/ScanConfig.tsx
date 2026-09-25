import React, { useState, useRef } from 'react';
import { Shield, Play, Upload, AlertCircle, FileText, CheckCircle2, Sliders } from 'lucide-react';
import type { ScanProtocol, ScanConcurrency, WordlistPreset, ScanRequestConfig } from '../../types/scanner';
import { validateDomain } from '../../lib/validation/domain';
import { QUICK_WORDLIST, STANDARD_WORDLIST, FULL_WORDLIST, sanitizeWordlist } from '../../lib/scanner/wordlists';

interface ScanConfigProps {
  onStartScan: (config: ScanRequestConfig) => void;
  isScanning: boolean;
  initialDomain?: string;
}

export const ScanConfig: React.FC<ScanConfigProps> = ({
  onStartScan,
  isScanning,
  initialDomain = '',
}) => {
  const [domainInput, setDomainInput] = useState(initialDomain);
  const [protocol, setProtocol] = useState<ScanProtocol>('fallback');
  const [concurrency, setConcurrency] = useState<ScanConcurrency>(25);
  const [wordlistPreset, setWordlistPreset] = useState<WordlistPreset>('quick');
  const [customWordlistText, setCustomWordlistText] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [fileFeedback, setFileFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate domain on change or blur
  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDomainInput(val);
    if (domainError) {
      setDomainError(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setFileFeedback('File exceeds 1MB limit. Please upload a smaller wordlist.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const sanitized = sanitizeWordlist(content, 500);
      setCustomWordlistText(sanitized.join('\n'));
      setWordlistPreset('custom');
      setFileFeedback(`Loaded ${sanitized.length} valid subdomain candidates from "${file.name}"`);
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateDomain(domainInput);
    if (!validation.valid) {
      setDomainError(validation.error || 'Please enter a valid domain name.');
      return;
    }

    if (!authorized) {
      setDomainError('Please confirm that you have authorization to test this domain before proceeding.');
      return;
    }

    let customList: string[] | undefined = undefined;
    if (wordlistPreset === 'custom') {
      customList = sanitizeWordlist(customWordlistText, 500);
      if (customList.length === 0) {
        setDomainError('Please provide at least one valid subdomain candidate in your custom wordlist.');
        return;
      }
    }

    onStartScan({
      domain: validation.normalizedDomain,
      protocol,
      concurrency,
      wordlistPreset,
      customWordlist: customList,
    });
  };

  const getCandidateCount = () => {
    if (wordlistPreset === 'quick') return QUICK_WORDLIST.length;
    if (wordlistPreset === 'standard') return STANDARD_WORDLIST.length;
    if (wordlistPreset === 'full') return FULL_WORDLIST.length;
    if (wordlistPreset === 'custom') {
      return sanitizeWordlist(customWordlistText, 500).length;
    }
    return 0;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-gray-800 bg-[#162032] p-5 sm:p-7 shadow-xl space-y-6">
        {/* Section Heading */}
        <div className="border-b border-gray-800 pb-4">
          <div className="flex items-center gap-2 text-white font-sans text-lg font-bold">
            <Sliders className="h-5 w-5 text-cyan-400" />
            <span>Scan Configuration</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Define target domain, verification protocols, concurrency limits, and subdomain candidates.
          </p>
        </div>

        {/* 1. Target Domain Input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">
            Target Domain <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={domainInput}
              onChange={handleDomainChange}
              placeholder="e.g. example.com or target.org"
              disabled={isScanning}
              className={`w-full rounded-lg bg-gray-900 px-4 py-3 text-sm text-white font-mono placeholder-gray-500 border transition-colors focus:outline-none ${
                domainError
                  ? 'border-red-500 focus:border-red-400'
                  : 'border-gray-700 focus:border-cyan-400'
              }`}
            />
          </div>

          {domainError && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{domainError}</span>
            </div>
          )}
          <span className="block text-[11px] text-gray-500">
            Enter a root or parent domain (e.g. <span className="font-mono text-gray-400">example.com</span>). Protocols (http/https) and trailing slashes are automatically normalized.
          </span>
        </div>

        {/* 2. Protocol & Concurrency Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Protocol Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">
              Probing Protocol
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={isScanning}
                onClick={() => setProtocol('fallback')}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                  protocol === 'fallback'
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 font-semibold shadow-sm'
                    : 'border-gray-800 bg-gray-900/80 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                }`}
              >
                HTTPS → HTTP
              </button>
              <button
                type="button"
                disabled={isScanning}
                onClick={() => setProtocol('https')}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                  protocol === 'https'
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 font-semibold shadow-sm'
                    : 'border-gray-800 bg-gray-900/80 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                }`}
              >
                HTTPS Only
              </button>
              <button
                type="button"
                disabled={isScanning}
                onClick={() => setProtocol('http')}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                  protocol === 'http'
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 font-semibold shadow-sm'
                    : 'border-gray-800 bg-gray-900/80 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                }`}
              >
                HTTP Only
              </button>
            </div>
            <span className="block text-[11px] text-gray-500">
              HTTPS → HTTP fallback verifies encrypted service first, then attempts plain HTTP if unreachable.
            </span>
          </div>

          {/* Concurrency Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">
              Worker Concurrency
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 25, 50, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  disabled={isScanning}
                  onClick={() => setConcurrency(val as ScanConcurrency)}
                  className={`py-2 text-xs font-mono font-medium rounded-lg border transition-all text-center ${
                    concurrency === val
                      ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 font-bold shadow-sm'
                      : 'border-gray-800 bg-gray-900/80 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                  }`}
                >
                  {val} threads
                </button>
              ))}
            </div>
            <span className="block text-[11px] text-gray-500">
              Controlled concurrent request rate. Prevents network saturation while maintaining high throughput.
            </span>
          </div>
        </div>

        {/* 3. Wordlist Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">
              Subdomain Candidate Wordlist
            </label>
            <span className="text-xs font-mono text-cyan-400">
              {getCandidateCount()} candidates selected
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              disabled={isScanning}
              onClick={() => setWordlistPreset('quick')}
              className={`p-3 text-left rounded-lg border transition-all ${
                wordlistPreset === 'quick'
                  ? 'border-cyan-500 bg-cyan-500/10 text-white'
                  : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700 hover:text-gray-200'
              }`}
            >
              <div className="text-xs font-semibold">Quick Recon</div>
              <div className="text-[11px] font-mono text-gray-400 mt-0.5">30 Top Hosts</div>
            </button>

            <button
              type="button"
              disabled={isScanning}
              onClick={() => setWordlistPreset('standard')}
              className={`p-3 text-left rounded-lg border transition-all ${
                wordlistPreset === 'standard'
                  ? 'border-cyan-500 bg-cyan-500/10 text-white'
                  : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700 hover:text-gray-200'
              }`}
            >
              <div className="text-xs font-semibold">Standard</div>
              <div className="text-[11px] font-mono text-gray-400 mt-0.5">75 Enterprise</div>
            </button>

            <button
              type="button"
              disabled={isScanning}
              onClick={() => setWordlistPreset('full')}
              className={`p-3 text-left rounded-lg border transition-all ${
                wordlistPreset === 'full'
                  ? 'border-cyan-500 bg-cyan-500/10 text-white'
                  : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700 hover:text-gray-200'
              }`}
            >
              <div className="text-xs font-semibold">Full Recon</div>
              <div className="text-[11px] font-mono text-gray-400 mt-0.5">150 Deep Scope</div>
            </button>

            <button
              type="button"
              disabled={isScanning}
              onClick={() => setWordlistPreset('custom')}
              className={`p-3 text-left rounded-lg border transition-all ${
                wordlistPreset === 'custom'
                  ? 'border-cyan-500 bg-cyan-500/10 text-white'
                  : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700 hover:text-gray-200'
              }`}
            >
              <div className="text-xs font-semibold">Custom List</div>
              <div className="text-[11px] font-mono text-gray-400 mt-0.5">Upload or Paste</div>
            </button>
          </div>

          {/* Custom Wordlist Editor */}
          {wordlistPreset === 'custom' && (
            <div className="p-4 rounded-lg bg-gray-900/80 border border-gray-800 space-y-3 mt-3 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs text-gray-300 font-medium">
                  Enter candidate prefixes (separated by commas or new lines) or upload a .txt file:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-md bg-gray-800 hover:bg-gray-750 text-gray-200 border border-gray-700 transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Upload .txt File</span>
                  </button>
                </div>
              </div>

              <textarea
                value={customWordlistText}
                onChange={(e) => setCustomWordlistText(e.target.value)}
                rows={4}
                placeholder="admin&#10;api&#10;dev&#10;staging&#10;mail&#10;vpn&#10;portal&#10;test&#10;www"
                className="w-full rounded-md bg-gray-950 border border-gray-700 p-2.5 text-xs font-mono text-gray-200 focus:outline-none focus:border-cyan-400"
              />

              {fileFeedback && (
                <div className="text-xs text-cyan-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{fileFeedback}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Authorization Checkbox & Notice */}
        <div className="rounded-lg bg-gray-900/60 border border-gray-800/80 p-3.5 space-y-2">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={authorized}
              onChange={(e) => setAuthorized(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-gray-900"
            />
            <span className="text-xs text-gray-300 leading-relaxed">
              I affirm that I am the authorized owner or have explicit written authorization to perform reconnaissance against this target domain.
            </span>
          </label>
          <p className="text-[11px] text-gray-500 pl-6">
            Use this tool only against domains you own or have explicit permission to test.
          </p>
        </div>

        {/* Start Button */}
        <div>
          <button
            type="submit"
            disabled={isScanning || !authorized || !domainInput.trim()}
            className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-sm font-bold transition-all shadow-md ${
              isScanning || !authorized || !domainInput.trim()
                ? 'bg-gray-800 text-gray-500 border border-gray-700/60 cursor-not-allowed'
                : 'bg-cyan-500 text-gray-950 hover:bg-cyan-400 shadow-cyan-950 hover:shadow-cyan-900'
            }`}
          >
            {isScanning ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-gray-950 border-t-transparent animate-spin" />
                <span>Enumeration In Progress...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Start Subdomain Enumeration</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
