import React from 'react';
import { BookOpen, ShieldAlert, ArrowDown, Check, Terminal, AlertTriangle, Layers } from 'lucide-react';

export const DocumentationView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-8">
      {/* Header */}
      <div className="border-b border-gray-800 pb-5 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Technical Documentation & Reference</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          SubScope Reconnaissance Architecture
        </h1>
        <p className="text-sm text-gray-400 leading-relaxed">
          Comprehensive guide to DNS resolution, multi-threaded HTTP probing, metadata extraction, and defensive security posture.
        </p>
      </div>

      {/* 1. What is subdomain enumeration? */}
      <section className="space-y-3 rounded-xl border border-gray-800 bg-[#162032] p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
          <span>01. What is Subdomain Enumeration?</span>
        </h2>
        <div className="text-xs sm:text-sm text-gray-300 space-y-3 leading-relaxed">
          <p>
            Subdomain enumeration is a foundational reconnaissance technique used by security engineers, penetration testers, and defenders to discover all valid hostnames configured under a parent domain (e.g. discovering <code className="text-cyan-400 font-mono">api.example.com</code> or <code className="text-cyan-400 font-mono">vpn.example.com</code> from <code className="text-cyan-400 font-mono">example.com</code>).
          </p>
          <p>
            Organizations routinely deploy microservices, developer testing environments, administrative consoles, and remote access portals on subdomains. Unmonitored or forgotten subdomains often represent shadow IT, outdated software versions, or unauthorized entry points. Mapping these assets is the first step toward comprehensive attack surface management (ASM).
          </p>
        </div>
      </section>

      {/* 2. How the scanner works (Workflow) */}
      <section className="space-y-4 rounded-xl border border-gray-800 bg-[#162032] p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
          <span>02. Technical Workflow & Execution Engine</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
          SubScope employs an active dictionary probing methodology optimized for low latency and high concurrency:
        </p>

        {/* Workflow Diagram */}
        <div className="bg-[#111827] rounded-lg p-5 border border-gray-800 font-mono text-xs space-y-3">
          <div className="flex flex-col items-center gap-2 text-center text-gray-300">
            <div className="w-full max-w-sm py-2 px-3 rounded bg-cyan-950/60 border border-cyan-700/60 text-cyan-300 font-semibold">
              Target Domain (e.g. example.com)
            </div>
            <ArrowDown className="h-4 w-4 text-gray-600" />

            <div className="w-full max-w-sm py-2 px-3 rounded bg-gray-900 border border-gray-800 text-gray-300">
              RFC Normalization & SSRF Defense Filter
            </div>
            <ArrowDown className="h-4 w-4 text-gray-600" />

            <div className="w-full max-w-sm py-2 px-3 rounded bg-gray-900 border border-gray-800 text-gray-300">
              Candidate Generation (Quick / Standard / Full / Custom)
            </div>
            <ArrowDown className="h-4 w-4 text-gray-600" />

            <div className="w-full max-w-sm py-2 px-3 rounded bg-gray-900 border border-gray-800 text-gray-300">
              Worker Pool & Controlled Concurrency (10–100 Threads)
            </div>
            <ArrowDown className="h-4 w-4 text-gray-600" />

            <div className="w-full max-w-sm py-2 px-3 rounded bg-gray-900 border border-gray-800 text-gray-300">
              DNS Resolution & Private IP Range Validation
            </div>
            <ArrowDown className="h-4 w-4 text-gray-600" />

            <div className="w-full max-w-sm py-2 px-3 rounded bg-gray-900 border border-gray-800 text-gray-300">
              HTTP / HTTPS Probe & Latency Benchmark
            </div>
            <ArrowDown className="h-4 w-4 text-gray-600" />

            <div className="w-full max-w-sm py-2 px-3 rounded bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 font-semibold">
              Metadata Extraction (Status, Server, Title, IP) & Export
            </div>
          </div>
        </div>
      </section>

      {/* 3. Field Definitions */}
      <section className="space-y-4 rounded-xl border border-gray-800 bg-[#162032] p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
          <span>03. Result Field Definitions</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-lg bg-gray-900/60 border border-gray-800">
            <span className="font-mono text-cyan-300 font-bold block mb-1">Subdomain & URL</span>
            <p className="text-gray-400 leading-relaxed">
              The fully qualified domain name (FQDN) formed by prepending the candidate prefix to the base domain, alongside the reachable HTTP/S web URI.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-gray-900/60 border border-gray-800">
            <span className="font-mono text-cyan-300 font-bold block mb-1">Status Code</span>
            <p className="text-gray-400 leading-relaxed">
              Standard HTTP response code (200 OK, 301/302 Redirect, 401/403 Unauthorized, 500 Internal Error) or DNS Resolved if HTTP probing timed out.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-gray-900/60 border border-gray-800">
            <span className="font-mono text-cyan-300 font-bold block mb-1">Response Time (ms)</span>
            <p className="text-gray-400 leading-relaxed">
              Round-trip time measured in milliseconds from socket initiation to receipt of initial HTTP headers.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-gray-900/60 border border-gray-800">
            <span className="font-mono text-cyan-300 font-bold block mb-1">Resolved IP Address</span>
            <p className="text-gray-400 leading-relaxed">
              The publicly accessible A/AAAA DNS address pointing to the host. Verified against SSRF private ranges prior to any HTTP request.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-gray-900/60 border border-gray-800">
            <span className="font-mono text-cyan-300 font-bold block mb-1">Web Server Header</span>
            <p className="text-gray-400 leading-relaxed">
              The value returned in the HTTP <code className="text-gray-200">Server</code> response header (e.g. nginx, cloudflare, Apache), if broadcast by the remote service.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-gray-900/60 border border-gray-800">
            <span className="font-mono text-cyan-300 font-bold block mb-1">HTML Page Title</span>
            <p className="text-gray-400 leading-relaxed">
              The contents of the remote document's <code className="text-gray-200">&lt;title&gt;</code> tag, assisting rapid identification of login portals and internal dashboards.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Legal & Authorization Notice */}
      <section className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-6 text-xs sm:text-sm">
        <h2 className="text-base font-bold text-amber-300 flex items-center gap-2 font-mono">
          <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
          <span>04. Legal Notice & Authorization Requirement</span>
        </h2>
        <div className="text-gray-300 space-y-2 leading-relaxed text-xs">
          <p>
            SubScope sends active network probes (DNS queries and HTTP GET requests) across the internet. Sending unauthorized requests against third-party systems without prior explicit written permission may violate computer crime legislation (such as the Computer Fraud and Abuse Act or regional cybersecurity statutes) and Acceptable Use Policies.
          </p>
          <p className="font-medium text-amber-200/90">
            Always obtain authorization from the target domain owner before conducting reconnaissance or enumeration.
          </p>
        </div>
      </section>

      {/* 5. Limitations */}
      <section className="space-y-3 rounded-xl border border-gray-800 bg-[#162032] p-6 text-xs sm:text-sm">
        <h2 className="text-base font-bold text-white flex items-center gap-2 font-mono">
          <AlertTriangle className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>05. Scope & Reconnaissance Limitations</span>
        </h2>
        <div className="text-gray-400 space-y-2 leading-relaxed text-xs">
          <p>
            • <strong>Not a Vulnerability Scanner:</strong> SubScope identifies accessible endpoints and basic service headers; it does not exploit services, test for SQL injections, or fuzz parameters.
          </p>
          <p>
            • <strong>Dictionary Bound:</strong> Active enumeration is constrained to candidate strings in the selected or uploaded wordlist. Obscure or non-standard subdomains not in the wordlist will not be discovered.
          </p>
          <p>
            • <strong>Wildcard DNS Caveat:</strong> Targets with wildcard DNS records (*.target.com pointing to an IP) may report all candidates as active. Users should independently verify root wildcard records.
          </p>
        </div>
      </section>
    </div>
  );
};
