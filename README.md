# SubScope — Subdomain Enumeration & Reconnaissance

> A high-performance, cybersecurity reconnaissance web application designed to map and verify accessible subdomains with real-time streaming, multi-threaded DNS resolution, and HTTP(S) inspection.

[![Built By](https://img.shields.io/badge/Author-Isha%20Sonaria-cyan.svg)](https://github.com/ishasonaria568-prog)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Deployment-Vercel%20%7C%20Node.js-emerald.svg)](#vercel-deployment)

---

## Overview

**SubScope** is built for security analysts, penetration testers, defenders, and researchers conducting authorized attack surface management (ASM). Given a target root domain (e.g. `example.com`), SubScope generates candidate hostnames, verifies DNS records, probes web endpoints concurrently, extracts HTTP headers and HTML page titles, and streams results in real time without fabricating data.

### Key Capabilities

- **Real-Time Streaming Engine**: Emits live progress and verified discoveries via Server-Sent Events (SSE) and Web Streams.
- **Controlled Concurrency**: Multi-threaded worker pool configurable across 10, 25, 50, and 100 threads to prevent network saturation.
- **Protocol Flexibility**: HTTPS, HTTP, and HTTPS → HTTP fallback probing with high-precision latency measurement.
- **Zero-Trust SSRF Defense**: Hardened validation blocks loopback (`127.0.0.1`), link-local (`169.254.169.254`), and RFC 1918 private subnets prior to any HTTP probe.
- **Curated & Custom Wordlists**: Built-in Quick (30), Standard (75), and Full (150) reconnaissance wordlists, plus custom `.txt` file uploads.
- **Actionable Exports**: One-click exports to CSV, structured JSON, and plaintext target lists.
- **Persistent Local History**: Stores completed scans in browser localStorage with zero external database dependencies.

---

## Reconnaissance Pipeline

```
Target Domain (e.g., example.com)
       ↓
Input Normalization & RFC Validation
       ↓
SSRF Security Verification Filter
       ↓
Candidate Wordlist Generation
       ↓
Controlled Multi-Threaded Workers (10–100)
       ↓
DNS Resolution & Reverse IP Verification
       ↓
HTTP / HTTPS Probing & Latency Measurement
       ↓
Metadata Extraction (Status Code, Server, Title, IP)
       ↓
Interactive Data Grid & Export (CSV, JSON, TXT)
```

---

## Local Development & Setup

### Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm** or **bun** / **yarn** / **pnpm**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ishasonaria568-prog/subscope.git
   cd subscope
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

4. **Verify TypeScript & linting:**
   ```bash
   npm run lint
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

6. **Start production server:**
   ```bash
   npm run start
   ```

---

## Vercel Deployment

SubScope is architected out of the box for zero-configuration deployment to **Vercel**:

### Option 1: Deploy via Vercel Web Dashboard (Recommended)

1. **Push your repository to GitHub**:
   ```bash
   git add .
   git commit -m "Initial SubScope release"
   git push origin main
   ```
2. Navigate to [vercel.com/new](https://vercel.com/new) and log in.
3. Import your GitHub repository.
4. Vercel automatically detects the project configuration (`vercel.json`).
5. Click **Deploy**. The site will build and publish within seconds.

### Option 2: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel
```

---

## Project Structure

```
├── api/
│   ├── scan/
│   │   ├── stream.ts         # Vercel serverless SSE streaming endpoint (/api/scan/stream)
│   │   └── index.ts          # Vercel serverless scan endpoint (/api/scan)
│   └── health.ts             # Vercel serverless health probe (/api/health)
├── server.ts                 # Full-stack Node.js Express server (port 3000)
├── vercel.json               # Vercel routing & serverless configuration
├── src/
│   ├── types/
│   │   └── scanner.ts        # TypeScript interfaces & domain types
│   ├── lib/
│   │   ├── api/
│   │   │   └── client.ts     # Client SSE streaming engine
│   │   ├── export/
│   │   │   └── exportResults.ts # CSV, JSON, and TXT exporter
│   │   ├── scanner/
│   │   │   ├── core.ts       # DNS & HTTP concurrent probing pipeline
│   │   │   └── wordlists.ts  # Curated reconnaissance dictionaries
│   │   ├── security/
│   │   │   └── rateLimiter.ts # In-memory IP rate limiter & DoS mitigation
│   │   ├── storage/
│   │   │   └── history.ts    # LocalStorage history persistence
│   │   └── validation/
│   │       └── domain.ts     # Domain validation & SSRF defense
│   ├── components/
│   │   ├── layout/           # Header, Footer, Navigation
│   │   ├── dashboard/        # Dashboard hero & workflow overview
│   │   ├── scanner/          # Scan config & live terminal progress
│   │   ├── results/          # Summary cards, tabular grid, inspector
│   │   ├── history/          # Scan history management
│   │   ├── docs/             # Technical documentation & guide
│   │   └── about/            # Project scope & author credentials
│   ├── App.tsx               # Main state controller
│   ├── index.css             # Tailwind v4 styles & fonts
│   └── main.tsx              # React DOM mounting
├── package.json
└── tsconfig.json
```

---

## Legal & Authorization Notice

> **Important**: This tool is designed and intended strictly for authorized security testing, defensive auditing, and educational reconnaissance. Users are solely responsible for ensuring they possess explicit authorization before evaluating any domain or network endpoint. Scanning target systems without permission may violate applicable local and international computer crime statutes.

---

## Author & Contact

- **Author**: Isha Sonaria
- **Specialty**: Cybersecurity & Defensive Security Research
- **GitHub**: [github.com/ishasonaria568-prog](https://github.com/ishasonaria568-prog)
- **LinkedIn**: [linkedin.com/in/isha-sonaria](https://www.linkedin.com/in/isha-sonaria)

© 2026 Isha Sonaria. All Rights Reserved.
