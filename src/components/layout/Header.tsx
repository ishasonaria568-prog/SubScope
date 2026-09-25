import React from 'react';
import { Shield, Radar, Github, Play, ExternalLink } from 'lucide-react';

interface HeaderProps {
  currentView: 'dashboard' | 'scanner' | 'results' | 'history' | 'docs' | 'about';
  onNavigate: (view: 'dashboard' | 'scanner' | 'results' | 'history' | 'docs' | 'about') => void;
  hasResults: boolean;
  isScanning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  hasResults,
  isScanning,
}) => {
  const navItems: { id: HeaderProps['currentView']; label: string; badge?: number | string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'scanner', label: 'Scanner', badge: isScanning ? 'Active' : undefined },
    { id: 'results', label: 'Results' },
    { id: 'history', label: 'History' },
    { id: 'docs', label: 'Documentation' },
    { id: 'about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-[#111827]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-90 focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-sm shadow-cyan-950">
              <Radar className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white font-sans">
                Sub<span className="text-cyan-400">Scope</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-gray-400 font-mono tracking-wider uppercase">
                Recon
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative px-3.5 py-1.5 text-sm font-medium transition-colors rounded-md ${
                  isActive
                    ? 'text-cyan-300 bg-gray-800/80 shadow-inner'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/40'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {item.label}
                  {item.badge && (
                    <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  )}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5">
          <a
            href="https://github.com/ishasonaria568-prog"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-700 bg-gray-800/60 text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
          >
            <Github className="h-4 w-4" />
          </a>

          <button
            onClick={() => onNavigate('scanner')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              isScanning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-cyan-500 text-gray-950 font-semibold hover:bg-cyan-400 shadow-sm shadow-cyan-900/40'
            }`}
          >
            {isScanning ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>New Scan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation row */}
      <div className="flex md:hidden overflow-x-auto border-t border-gray-800 bg-[#162032] px-3 py-1.5 gap-1 text-xs">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`whitespace-nowrap px-3 py-1 rounded font-medium transition-colors ${
              currentView === item.id ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
