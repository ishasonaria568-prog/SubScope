import React from 'react';
import { Shield, Github, Linkedin, ExternalLink, Award, Cpu, Lock, CheckCircle2 } from 'lucide-react';
import { GITHUB_PROFILE_URL, LINKEDIN_PROFILE_URL } from '../layout/Footer';

export const AboutView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-8">
      {/* Title & Description */}
      <div className="border-b border-gray-800 pb-6 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <Shield className="h-3.5 w-3.5" />
          <span>About SubScope</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          SubScope Reconnaissance
        </h1>
        <p className="text-base text-gray-300 leading-relaxed max-w-2xl">
          SubScope is a cybersecurity reconnaissance tool designed to help security learners, defenders, and authorized security professionals identify accessible subdomains and understand their exposed web surface.
        </p>
      </div>

      {/* Engineer Profile Card */}
      <div className="rounded-xl border border-gray-800 bg-[#162032] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-gray-800">
          <div className="space-y-1">
            <span className="text-xs uppercase font-mono tracking-wider text-cyan-400 font-semibold">
              Principal Architect & Security Researcher
            </span>
            <h2 className="text-2xl font-bold text-white">
              Isha Sonaria
            </h2>
            <div className="text-xs text-gray-400 font-mono">
              Cybersecurity | Security Research
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={GITHUB_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 hover:border-gray-600 text-gray-200 hover:text-white text-xs font-semibold transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>GitHub Profile</span>
              <ExternalLink className="h-3 w-3 text-gray-500" />
            </a>

            <a
              href={LINKEDIN_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold transition-colors"
            >
              <Linkedin className="h-4 w-4 text-cyan-400" />
              <span>LinkedIn Profile</span>
              <ExternalLink className="h-3 w-3 text-cyan-400/70" />
            </a>
          </div>
        </div>

        {/* Structured Spec Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-gray-900/60 border border-gray-800 space-y-1.5">
            <span className="text-gray-500 font-mono uppercase text-[11px] block">Built By</span>
            <div className="text-sm font-semibold text-white">Isha Sonaria</div>
            <p className="text-gray-400 text-[11px]">Security tool author and defensive systems engineer.</p>
          </div>

          <div className="p-4 rounded-lg bg-gray-900/60 border border-gray-800 space-y-1.5">
            <span className="text-gray-500 font-mono uppercase text-[11px] block">Domain Focus</span>
            <div className="text-sm font-semibold text-cyan-300">Cybersecurity & Defensive Security</div>
            <p className="text-gray-400 text-[11px]">Attack surface discovery, boundary mapping, and risk reduction.</p>
          </div>

          <div className="p-4 rounded-lg bg-gray-900/60 border border-gray-800 space-y-1.5">
            <span className="text-gray-500 font-mono uppercase text-[11px] block">System Purpose</span>
            <div className="text-sm font-semibold text-emerald-400">Authorized Reconnaissance</div>
            <p className="text-gray-400 text-[11px]">Empowering security teams with non-invasive automated auditing.</p>
          </div>
        </div>
      </div>

      {/* Engineering Principles */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white font-sans">
          Engineering & Design Principles
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-gray-800 bg-[#162032] space-y-2">
            <div className="flex items-center gap-2 font-mono text-cyan-300 font-semibold">
              <Cpu className="h-4 w-4" />
              <span>Real-Time Streaming Engine</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              SubScope utilizes Server-Sent Events (SSE) and native Web Streams to feed DNS discoveries and HTTP latencies to the user interface in real time without polling delay.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-gray-800 bg-[#162032] space-y-2">
            <div className="flex items-center gap-2 font-mono text-cyan-300 font-semibold">
              <Lock className="h-4 w-4" />
              <span>Zero-Trust SSRF Defense</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Before probing candidate hostnames, every resolved IP address is verified against private, loopback, and cloud metadata ranges (such as 169.254.169.254) to eliminate SSRF attack vectors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
