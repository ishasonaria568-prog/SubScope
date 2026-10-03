# SubScope

A Python-based CLI subdomain enumeration and reconnaissance tool designed for authorized security testing and Kali Linux.

```text
╔═══════════════════════════════════════════════════════════╗
║                      SUBSCOPE v1.0.0                      ║
║     Fast Multithreaded Subdomain Reconnaissance Tool      ║
╚═══════════════════════════════════════════════════════════╝
  Developed for Kali Linux | Authorized Security Testing Only
```

[![Language: Python 3](https://img.shields.io/badge/Language-Python%203-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Target OS: Kali Linux](https://img.shields.io/badge/Platform-Kali%20Linux%20%7C%20Debian-557C94?logo=kali-linux&logoColor=white)](https://www.kali.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero External Dependencies](https://img.shields.io/badge/Dependencies-Standard%20Library%20Only-brightgreen)](#dependencies)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Dependencies](#dependencies)
- [Installation](#installation)
  - [Kali Linux Clone & Run](#kali-linux-clone--run)
  - [Manual Setup](#manual-setup)
- [CLI Options & Arguments](#cli-options--arguments)
- [Usage Examples](#usage-examples)
- [Technical Architecture](#technical-architecture)
  - [Multithreading & Concurrency Model](#multithreading--concurrency-model)
  - [Socket-Based Hostname & IP Resolution](#socket-based-hostname--ip-resolution)
  - [Active HTTP/HTTPS Probing](#active-httphttps-probing)
  - [Thread-Safe Progress & Output Management](#thread-safe-progress--output-management)
- [Output Formats](#output-formats)
- [Unit Testing](#unit-testing)
- [Troubleshooting](#troubleshooting)
- [Security & Ethical Disclaimer](#security--ethical-disclaimer)

---

## Overview

**SubScope** is a lightweight, terminal-based reconnaissance tool built for penetration testers, security auditors, and cybersecurity analysts operating on **Kali Linux**. 

Given a target root domain and a wordlist of candidates, SubScope iterates through potential subdomains using concurrent worker threads to:
1. Validate candidate domain syntax.
2. Perform socket-based hostname and dual-stack IP resolution (IPv4 & IPv6).
3. Actively probe discovered hosts for HTTP/HTTPS web services.
4. Capture HTTP response status codes, redirect destinations, response timings, server headers, and webpage titles.
5. Export structured reports to plain text (`TXT`), structured `JSON`, and spreadsheet-ready `CSV` formats.

SubScope relies entirely on the **Python 3 standard library**. It requires no Node.js, no Docker, no external database, and no third-party package managers.

---

## Key Features

- **Concurrent Multi-Threading**: Uses Python's bounded `ThreadPoolExecutor` (configurable from 1 to 200 workers) for fast and scalable discovery.
- **Socket Hostname & IP Resolution**: Native socket resolution identifying dual-stack IPv4 (`AF_INET`) and IPv6 (`AF_INET6`) addresses, handling `NXDOMAIN`, timeouts, and transient network errors gracefully.
- **Active HTTP/HTTPS Probing**: Safely tests service responsiveness on ports 80/443, capturing status codes (`200`, `301`, `403`, `500`), server headers, and redirect chains.
- **Smart Page Title Extraction**: Streams up to 64 KB of HTML to extract webpage `<title>` tags with HTML entity unescaping, character set detection, and whitespace normalization.
- **Tolerant SSL Inspection**: Uses permissive SSL contexts to inspect development and staging hosts with self-signed or invalid certificates without crashing.
- **Terminal Progress & Clean Formatting**: Dynamic in-place progress bar that cleanly erases before printing discovered findings, preventing terminal line collision.
- **Multiple Output Formats**: Automatically writes plain text lists (`discovered_subdomains.txt`), detailed JSON records (`results.json`), and structured CSV files (`results.csv`).
- **Clean Interruption Handling**: Traps `Ctrl+C` (`SIGINT`) to abort worker threads cleanly and flush discovered records to disk before exiting.

---

## Dependencies

SubScope is built exclusively using modules from the **Python 3 Standard Library**:

- `socket` (Hostname and IP resolution)
- `urllib.request` & `urllib.error` (HTTP/HTTPS active probing)
- `concurrent.futures` & `threading` (Multithreaded task execution and thread synchronization)
- `ssl` (TLS context management)
- `json` & `csv` (Structured report generation)
- `argparse` (CLI parsing and argument handling)
- `re`, `html`, `time`, `dataclasses` (Parsing and data modeling)

**No external packages or pip installations are required.**

---

## Installation

### Kali Linux Clone & Run

Clone the repository and run the automated installation script:

```bash
git clone <repository>
cd SubScope
chmod +x install.sh
./install.sh
./subscope.py -d example.com
```

The `install.sh` script:
- Verifies Python 3 (3.8+) is available.
- Validates standard library modules.
- Grants executable permissions to `subscope.py`.
- Executes a verification check (`./subscope.py --version`).

### Manual Setup

You can also run SubScope directly without any installer script:

```bash
# Set executable bit
chmod +x subscope.py

# Verify help output
./subscope.py --help
```

---

## CLI Options & Arguments

```text
usage: ./subscope.py [-h] [-d DOMAIN] [-w WORDLIST] [-t THREADS]
                     [--timeout TIMEOUT] [--dns] [--http] [--status] [--title]
                     [--ip] [-o OUTPUT] [--json] [--csv] [--silent]
                     [--verbose] [--no-color] [-v]
```

### Argument Reference

| Flag | Long Argument | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `-d` | `--domain` | `STRING` | *Required* | Target root domain to enumerate (e.g., `example.com`). |
| `-w` | `--wordlist` | `PATH` | `wordlists/subdomains.txt` | Path to custom subdomain prefix wordlist. |
| `-t` | `--threads` | `INT` | `20` | Concurrent worker threads (1 to 200). |
| | `--timeout` | `FLOAT` | `4.0` | Network socket and HTTP connection timeout in seconds. |
| | `--dns` | `FLAG` | `Enabled`* | Perform socket-based hostname and IP resolution. |
| | `--http` | `FLAG` | `Enabled`* | Actively probe HTTP/HTTPS availability on ports 80/443. |
| | `--status` | `FLAG` | `Enabled`* | Display HTTP response status codes. |
| | `--title` | `FLAG` | `Enabled`* | Extract and display HTML webpage titles. |
| | `--ip` | `FLAG` | `Enabled`* | Resolve and display IPv4 / IPv6 addresses. |
| `-o` | `--output` | `PATH` | `results/<domain>/` | Custom destination directory for report files. |
| | `--json` | `FLAG` | `Auto` | Save scan results to structured JSON. |
| | `--csv` | `FLAG` | `Auto` | Save scan results to CSV spreadsheet. |
| | `--silent` | `FLAG` | `Disabled` | Output only discovered subdomains (for piping). |
| | `--verbose` | `FLAG` | `Disabled` | Display verbose network diagnostics. |
| | `--no-color`| `FLAG` | `Disabled` | Disable ANSI color sequences in console. |
| `-v` | `--version` | `FLAG` | - | Display version and exit. |
| `-h` | `--help` | `FLAG` | - | Display help menu and exit. |

*\* Note: By default, when no specific reconnaissance flags are supplied, SubScope performs complete discovery (DNS resolution, IP lookup, active HTTP/HTTPS probing, status codes, and title extraction).*

---

## Usage Examples

### 1. Default Reconnaissance Scan
```bash
./subscope.py -d example.com
```

### 2. High-Concurrency Scan with Custom Wordlist
```bash
./subscope.py -d example.com -w wordlists/subdomains.txt -t 50
```

### 3. Hostname and IP Resolution Only (No HTTP Probing)
```bash
./subscope.py -d example.com --dns --ip
```

### 4. Custom Output Directory with JSON & CSV Reports
```bash
./subscope.py -d example.com -o results/engagement_01 --json --csv
```

### 5. Silent Unix Pipe Workflow (Piping into other CLI tools)
```bash
./subscope.py -d example.com --silent > discovered.txt
```

---

## Technical Architecture

### Multithreading & Concurrency Model

SubScope uses Python's `concurrent.futures.ThreadPoolExecutor` to manage a pool of concurrent workers:
- **Task Dispatch**: Subdomain candidates are loaded from the wordlist, sanitized, and scheduled across worker threads.
- **Thread Synchronization**: Internal metrics (`tested_count`, `results` list) and terminal rendering are guarded with a reentrant `threading.Lock` to prevent race conditions or interleaved console output.
- **Cancellation**: A `threading.Event` acts as a cooperative cancellation signal. If `Ctrl+C` is received, pending futures are cancelled, active sockets finish their timeout cycle, and already discovered items are saved.

### Socket-Based Hostname & IP Resolution

DNS resolution in SubScope is handled in `subscope/dns.py` via Python's standard `socket.getaddrinfo`:
- Queries `socket.AF_UNSPEC` with `socket.SOCK_STREAM` to discover IPv4 (`AF_INET`) and IPv6 (`AF_INET6`) addresses in a unified query.
- Detects canonical name (`CNAME`) records when returned by the operating system resolver.
- Gracefully handles `socket.gaierror` (`NXDOMAIN` or unresolvable hostnames), `socket.timeout`, and OS-level socket exhaustion without terminating the scan.

### Active HTTP/HTTPS Probing

Service probing is handled in `subscope/http.py`:
- **Active Probing**: Sends standard `GET` requests to discover whether port 80 (HTTP) or port 443 (HTTPS) is listening.
- **HTTPS First**: Attempts HTTPS initially; if the handshake fails or times out, falls back to plain HTTP.
- **Status & Headers**: Captures the HTTP response code (`200`, `301`, `302`, `401`, `403`, `500`), the `Location` header for redirects, and the `Server` header.
- **Safe Title Extraction**: Reads the first 64 KB of the HTTP response stream to locate and parse `<title>` tags, unescaping HTML entities and normalizing whitespace without downloading large files.
- **Tolerant SSL**: Configured with `ssl.CERT_NONE` and `check_hostname=False` to allow reconnaissance of internal assets utilizing self-signed or expired TLS certificates.

### Thread-Safe Progress & Output Management

Output is controlled through `subscope/output.py`:
- Detects interactive TTYs via `sys.stdout.isatty()`.
- Updates an in-place progress bar using carriage returns (`\r`).
- When a subdomain is discovered, clears the progress line (`\r\033[K`), outputs the formatted finding, and redraws the progress bar below it.
- In `--silent` mode or when piped to another command, all formatting and progress bars are suppressed.

---

## Output Formats

Scans generate reports in `results/<target_domain>/`:

### 1. Plain Text (`discovered_subdomains.txt`)
```text
admin.example.com
api.example.com
mail.example.com
```

### 2. Structured JSON (`results.json`)
```json
{
    "target": "example.com",
    "scan_time": "2026-10-03T07:00:00.000000+00:00",
    "total_tested": 220,
    "discovered_count": 3,
    "duration_seconds": 3.42,
    "results": [
        {
            "subdomain": "admin.example.com",
            "discovered": true,
            "dns_resolved": true,
            "dns_status": "RESOLVED",
            "ipv4": ["198.51.100.14"],
            "ipv6": [],
            "ip": "198.51.100.14",
            "cname": null,
            "http_alive": true,
            "http_status": 200,
            "http_url": "https://admin.example.com/",
            "title": "Admin Management Portal",
            "server": "nginx/1.24.0",
            "redirect_url": null,
            "response_time": 0.28
        }
    ]
}
```

### 3. CSV Spreadsheet (`results.csv`)
```csv
subdomain,dns_resolved,ipv4,ipv6,http_alive,http_status,http_url,title,server,redirect_url,response_time_sec
admin.example.com,True,198.51.100.14,,True,200,https://admin.example.com/,Admin Management Portal,nginx/1.24.0,,0.28
```

---

## Unit Testing

The repository contains an automated test suite covering domain validation, wordlist parsing, socket resolution mocks, HTTP probing, and report generation:

```bash
# Run the complete test suite
python3 -m unittest discover tests -v
```

All 19 tests run with mocked network calls and do not generate traffic to real external hosts.

---

## Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `Permission denied: ./subscope.py` | Executable bit not set. | Run `chmod +x subscope.py`. |
| `Wordlist file not found` | Invalid wordlist path. | Verify file path or omit `-w` to use default `wordlists/subdomains.txt`. |
| `Invalid domain format` | Domain input includes spaces or illegal characters. | Supply clean domain like `example.com` or `target.co.uk`. |
| `DNS resolution timeout` | Upstream DNS server is throttled or offline. | Increase `--timeout 6.0` or decrease threads `-t 10`. |

---

## Security & Ethical Disclaimer

```text
DISCLAIMER: SubScope is developed exclusively for authorized security research,
penetration testing, defense engineering, and educational reconnaissance.
Users are strictly required to obtain explicit authorization from the asset owner
prior to executing reconnaissance scans. The authors accept no liability for misuse,
unauthorized operations, or collateral disruption caused by this software.
```
