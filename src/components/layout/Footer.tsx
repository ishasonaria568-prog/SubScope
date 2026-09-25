import React from 'react';
import { Github, Linkedin, ShieldCheck } from 'lucide-react';

export const LINKEDIN_PROFILE_URL = 'https://www.linkedin.com/in/isha-sonaria';
export const GITHUB_PROFILE_URL = 'https://github.com/ishasonaria568-prog';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-gray-800 bg-[#0d131f] text-gray-400 py-10 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-gray-800/80">
          {/* Identity & Scope */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white font-sans">
                Sub<span className="text-cyan-400">Scope</span>
              </span>
              <span className="text-xs text-gray-500 font-mono">v1.0</span>
            </div>
            <p className="mt-2 text-xs text-gray-400 leading-relaxed max-w-sm">
              High-performance defensive subdomain enumeration & reconnaissance engine.
              Discover reachable endpoints, inspect live protocols, and assess web attack surfaces.
            </p>
            <div className="mt-3 text-xs text-gray-300 font-medium">
              Created by <span className="text-white font-semibold">Isha Sonaria</span>
              <span className="text-gray-500 mx-2">·</span>
              <span className="text-cyan-400/90 font-mono text-[11px]">Cybersecurity | Security Research</span>
            </div>
          </div>

          {/* Legal & Authorization Notice */}
          <div className="md:col-span-1 bg-gray-900/60 rounded-lg p-3.5 border border-gray-800 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1.5">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Authorization & Legal Notice</span>
            </div>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              This tool is intended for authorized security testing and defensive reconnaissance only. Users are strictly responsible for ensuring they have written permission to assess target domains.
            </p>
          </div>

          {/* Social Links & Connections */}
          <div className="flex flex-col md:items-end justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-500 font-mono block md:text-right mb-2">
                Connect & Source
              </span>
              <div className="flex items-center gap-2.5">
                <a
                  href={GITHUB_PROFILE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-800 bg-gray-900/80 text-xs text-gray-300 hover:text-white hover:border-gray-700 hover:bg-gray-850 transition-colors"
                >
                  <Github className="h-3.5 w-3.5 text-gray-400" />
                  <span>GitHub</span>
                </a>
                <a
                  href={LINKEDIN_PROFILE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-800 bg-gray-900/80 text-xs text-gray-300 hover:text-white hover:border-gray-700 hover:bg-gray-850 transition-colors"
                >
                  <Linkedin className="h-3.5 w-3.5 text-cyan-400" />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>

            <div className="mt-4 md:mt-0 text-[11px] text-gray-500 font-mono md:text-right">
              Verified SSRF Guards · RFC Validation
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-3">
          <div>
            © 2026 Isha Sonaria. All Rights Reserved.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Defensive Reconnaissance</span>
            <span>·</span>
            <span>Serverless & Edge Compatible</span>
            <span>·</span>
            <span>Clean Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
