import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { DashboardHero } from './components/dashboard/DashboardHero';
import { ScanConfig } from './components/scanner/ScanConfig';
import { LiveScanProgress } from './components/scanner/LiveScanProgress';
import { SummaryCards } from './components/results/SummaryCards';
import { ResultsTable } from './components/results/ResultsTable';
import { ResultDetailModal } from './components/results/ResultDetailModal';
import { ScanHistory } from './components/history/ScanHistory';
import { DocumentationView } from './components/docs/DocumentationView';
import { AboutView } from './components/about/AboutView';

import type {
  ScanRequestConfig,
  ScanResultItem,
  ScanSummary,
  ScanProgress,
  ActivityFeedItem,
  ScanHistoryEntry,
} from './types/scanner';

import { startSubdomainScan } from './lib/api/client';
import {
  getScanHistory,
  saveScanToHistory,
  deleteScanFromHistory,
  clearAllScanHistory,
} from './lib/storage/history';
import { AlertCircle, ArrowLeft, RotateCcw } from 'lucide-react';

type ViewMode = 'dashboard' | 'scanner' | 'results' | 'history' | 'docs' | 'about';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [targetDomain, setTargetDomain] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    candidate: '',
    checked: 0,
    total: 0,
    discovered: 0,
    responsive: 0,
    failed: 0,
    elapsedSeconds: 0,
    currentRate: 0,
  });

  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [scanResults, setScanResults] = useState<ScanResultItem[]>([]);
  const [scanSummary, setScanSummary] = useState<ScanSummary | null>(null);
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [selectedItem, setSelectedItem] = useState<ScanResultItem | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load scan history from localStorage on initial mount
  useEffect(() => {
    setHistory(getScanHistory());
  }, []);

  const handleStartScan = async (config: ScanRequestConfig) => {
    if (isScanning) return;

    setScanError(null);
    setIsScanning(true);
    setTargetDomain(config.domain);
    setScanResults([]);
    setScanSummary(null);
    setActivityFeed([]);
    setScanProgress({
      candidate: '',
      checked: 0,
      total: 0,
      discovered: 0,
      responsive: 0,
      failed: 0,
      elapsedSeconds: 0,
      currentRate: 0,
    });

    // Navigate to scanner view so user sees the live progress
    setCurrentView('scanner');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const collectedResults: ScanResultItem[] = [];

    await startSubdomainScan(config, {
      signal: controller.signal,
      onInit: (initData) => {
        setScanProgress((prev) => ({
          ...prev,
          total: initData.totalCandidates,
        }));
      },
      onProgress: (progress) => {
        setScanProgress(progress);
        setActivityFeed((prev) => [
          ...prev.slice(-100), // Keep recent 100 for memory sanity
          {
            id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            candidate: progress.candidate,
            subdomain: `${progress.candidate}.${config.domain}`,
            active: progress.active,
            status: progress.status,
            responseTime: progress.responseTime,
            timestamp: Date.now(),
          },
        ]);
      },
      onResult: (result) => {
        collectedResults.push(result);
        setScanResults((prev) => [...prev, result]);
      },
      onComplete: (summary) => {
        setIsScanning(false);
        setScanSummary(summary);
        // Persist completed scan
        const savedEntry = saveScanToHistory(summary, 'Completed');
        setHistory((prev) => [savedEntry, ...prev.filter((h) => h.id !== savedEntry.id)]);
        // Switch to Results view
        setCurrentView('results');
      },
      onError: (errorMsg) => {
        setIsScanning(false);
        setScanError(errorMsg);
      },
    });

    setIsScanning(false);
  };

  const handleAbortScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsScanning(false);

    if (scanResults.length > 0) {
      // Save partial results if any were discovered
      const partialSummary: ScanSummary = {
        target: targetDomain,
        protocol: 'fallback',
        concurrency: 25,
        startedAt: new Date(Date.now() - scanProgress.elapsedSeconds * 1000).toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: scanProgress.elapsedSeconds * 1000,
        totalChecked: scanProgress.checked,
        subdomainsFound: scanResults.length,
        responsiveCount: scanResults.filter((r) => r.isResponsive).length,
        httpsCount: scanResults.filter((r) => r.protocol === 'HTTPS').length,
        httpCount: scanResults.filter((r) => r.protocol === 'HTTP').length,
        successfulCount: scanResults.filter((r) => r.status && r.status >= 200 && r.status < 300).length,
        results: scanResults,
      };
      setScanSummary(partialSummary);
      const savedEntry = saveScanToHistory(partialSummary, 'Aborted');
      setHistory((prev) => [savedEntry, ...prev.filter((h) => h.id !== savedEntry.id)]);
      setCurrentView('results');
    }
  };

  const handleSelectHistoricalScan = (summary: ScanSummary) => {
    setScanSummary(summary);
    setScanResults(summary.results);
    setTargetDomain(summary.target);
    setCurrentView('results');
  };

  const handleDeleteScan = (id: string) => {
    const updated = deleteScanFromHistory(id);
    setHistory(updated);
  };

  const handleClearAllHistory = () => {
    clearAllScanHistory();
    setHistory([]);
  };

  const handleQuickStartFromHero = (domain: string) => {
    setTargetDomain(domain);
    setCurrentView('scanner');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#111827] text-[#F9FAFB] font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Header */}
      <Header
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        hasResults={scanResults.length > 0}
        isScanning={isScanning}
      />

      {/* Main View Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Error Notification Banner */}
        {scanError && (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-950/40 p-4 text-xs sm:text-sm text-red-200 flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-red-300">Scan Warning / Error:</strong>
                <span>{scanError}</span>
              </div>
            </div>
            <button
              onClick={() => setScanError(null)}
              className="text-xs text-red-400 hover:text-red-200 font-mono underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. Dashboard View */}
        {currentView === 'dashboard' && (
          <DashboardHero
            onQuickStart={handleQuickStartFromHero}
            onNavigateToScanner={() => setCurrentView('scanner')}
            hasPreviousResults={scanResults.length > 0}
            totalHistoricalScans={history.length}
          />
        )}

        {/* 2. Scanner View */}
        {currentView === 'scanner' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            {isScanning ? (
              <LiveScanProgress
                target={targetDomain}
                progress={scanProgress}
                activityFeed={activityFeed}
                onAbort={handleAbortScan}
              />
            ) : (
              <ScanConfig
                onStartScan={handleStartScan}
                isScanning={isScanning}
                initialDomain={targetDomain}
              />
            )}
          </div>
        )}

        {/* 3. Results View */}
        {currentView === 'results' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                    Reconnaissance Findings
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white font-mono mt-0.5">
                  {scanSummary?.target || targetDomain || 'Discovered Subdomains'}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('scanner')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-800 text-gray-300 hover:text-white border border-gray-700 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Configure New Scan</span>
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            {scanSummary && <SummaryCards summary={scanSummary} />}

            {/* Results Table */}
            <ResultsTable
              results={scanResults}
              summary={scanSummary}
              onSelectItem={(item) => setSelectedItem(item)}
              onStartNewScan={() => setCurrentView('scanner')}
            />
          </div>
        )}

        {/* 4. History View */}
        {currentView === 'history' && (
          <ScanHistory
            history={history}
            onSelectScan={handleSelectHistoricalScan}
            onDeleteScan={handleDeleteScan}
            onClearAll={handleClearAllHistory}
            onNavigateToScanner={() => setCurrentView('scanner')}
          />
        )}

        {/* 5. Documentation View */}
        {currentView === 'docs' && <DocumentationView />}

        {/* 6. About View */}
        {currentView === 'about' && <AboutView />}
      </main>

      {/* Inspect Metadata Slide-Over Modal */}
      <ResultDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
