"""
Terminal formatting, progress bar rendering, and report file writers (TXT, JSON, CSV).
"""

from __future__ import annotations

import csv
import json
import os
import sys
import threading
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

# ANSI Color Codes
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
MAGENTA = "\033[35m"
CYAN = "\033[36m"
WHITE = "\033[37m"


class TerminalWriter:
    """Thread-safe terminal printer with ANSI color support and clean progress updating."""

    def __init__(self, silent: bool = False, verbose: bool = False, no_color: bool = False):
        self.silent = silent
        self.verbose = verbose
        # Disable color if stdout is piped or explicitly turned off
        self.use_color = (sys.stdout.isatty() and not no_color) and not silent
        self._lock = threading.Lock()
        self._last_progress_len = 0

    def color(self, code: str, text: str) -> str:
        """Wrap text in ANSI color if coloring is enabled."""
        if not self.use_color:
            return text
        return f"{code}{text}{RESET}"

    def print_banner(self, version: str = "1.0.0") -> None:
        """Display tool banner."""
        if self.silent:
            return

        cyan = CYAN if self.use_color else ""
        bold = BOLD if self.use_color else ""
        reset = RESET if self.use_color else ""
        dim = DIM if self.use_color else ""

        banner = f"""{cyan}{bold}
╔═══════════════════════════════════════════════════════════╗
║                      SUBSCOPE v{version:<5}                      ║
║     Fast Multithreaded Subdomain Reconnaissance Tool      ║
╚═══════════════════════════════════════════════════════════╝{reset}
{dim}  Developed for Kali Linux | Authorized Security Testing Only{reset}
"""
        sys.stdout.write(banner)
        sys.stdout.flush()

    def print_scan_meta(self, target: str, wordlist: str, threads: int, word_count: int) -> None:
        """Display active scan configuration parameters."""
        if self.silent:
            return

        b = BOLD if self.use_color else ""
        r = RESET if self.use_color else ""
        c = CYAN if self.use_color else ""

        print(f"{b}Target Domain{r} : {c}{target}{r}")
        print(f"{b}Wordlist     {r} : {wordlist} ({word_count:,} words)")
        print(f"{b}Concurrency  {r} : {threads} worker threads")
        print()
        print(self.color(GREEN + BOLD, "[+] Starting subdomain enumeration..."))
        print()
        sys.stdout.flush()

    def clear_progress(self) -> None:
        """Erase any currently drawn progress line."""
        if self._last_progress_len > 0 and sys.stdout.isatty():
            sys.stdout.write("\r" + " " * (self._last_progress_len + 5) + "\r")
            sys.stdout.flush()
            self._last_progress_len = 0

    def print_progress(self, current: int, total: int, found_count: int) -> None:
        """Render in-place terminal progress bar."""
        if self.silent or not sys.stdout.isatty():
            return

        with self._lock:
            percent = (current / total) * 100 if total > 0 else 0
            bar_width = 24
            filled = int(bar_width * current // total) if total > 0 else 0
            empty = bar_width - filled

            filled_char = "█"
            empty_char = "░"
            bar = f"{filled_char * filled}{empty_char * empty}"

            colored_bar = self.color(CYAN, f"[{bar}]")
            text = (
                f"\r{colored_bar} {percent:5.1f}% | "
                f"Tested: {current}/{total} | "
                f"Found: {self.color(GREEN + BOLD, str(found_count))}"
            )

            clean_len = len(f"[{bar}] {percent:5.1f}% | Tested: {current}/{total} | Found: {found_count}")
            self._last_progress_len = clean_len
            sys.stdout.write(text)
            sys.stdout.flush()

    def print_result(self, record: Dict[str, Any], show_ip: bool = True, show_http: bool = True,
                     show_status: bool = True, show_title: bool = True) -> None:
        """
        Print discovered subdomain item safely clearing progress line.
        """
        with self._lock:
            self.clear_progress()

            subdomain = record.get("subdomain", "")
            if self.silent:
                print(subdomain)
                sys.stdout.flush()
                return

            prefix = self.color(GREEN + BOLD, "[+]")
            sub_str = self.color(WHITE + BOLD, subdomain)
            print(f"{prefix} {sub_str}")

            indent = "    "
            primary_ip = record.get("ip") or (record.get("ipv4", [None])[0] if record.get("ipv4") else None)
            all_ips = record.get("ipv4", []) + record.get("ipv6", [])

            if show_ip and (primary_ip or all_ips):
                ip_label = self.color(DIM, "IP      :")
                ip_val = self.color(CYAN, primary_ip or ", ".join(all_ips))
                print(f"{indent}{ip_label} {ip_val}")

            http_status = record.get("http_status")
            if show_status and http_status is not None:
                st_code = int(http_status)
                if 200 <= st_code < 300:
                    st_colored = self.color(GREEN, str(st_code))
                elif 300 <= st_code < 400:
                    st_colored = self.color(BLUE, str(st_code))
                elif 400 <= st_code < 500:
                    st_colored = self.color(YELLOW, str(st_code))
                else:
                    st_colored = self.color(RED, str(st_code))

                http_label = self.color(DIM, "HTTP    :")
                url_snippet = f" ({record.get('http_url')})" if self.verbose and record.get('http_url') else ""
                print(f"{indent}{http_label} {st_colored}{url_snippet}")

            title = record.get("title")
            if show_title and title:
                title_label = self.color(DIM, "Title   :")
                print(f"{indent}{title_label} {title}")

            server = record.get("server")
            if self.verbose and server:
                server_label = self.color(DIM, "Server  :")
                print(f"{indent}{server_label} {server}")

            redirect = record.get("redirect_url")
            if redirect:
                redir_label = self.color(DIM, "Redirect:")
                print(f"{indent}{redir_label} -> {redirect}")

            print()
            sys.stdout.flush()

    def print_verbose(self, message: str) -> None:
        """Print verbose/debug message."""
        if not self.verbose or self.silent:
            return
        with self._lock:
            self.clear_progress()
            print(self.color(DIM, f"[*] {message}"))
            sys.stdout.flush()

    def print_error(self, message: str) -> None:
        """Print error message to stderr."""
        with self._lock:
            self.clear_progress()
            prefix = self.color(RED + BOLD, "[!]")
            sys.stderr.write(f"{prefix} {message}\n")
            sys.stderr.flush()

    def print_warning(self, message: str) -> None:
        """Print warning message."""
        if self.silent:
            return
        with self._lock:
            self.clear_progress()
            prefix = self.color(YELLOW + BOLD, "[!]")
            sys.stdout.write(f"{prefix} {message}\n")
            sys.stdout.flush()

    def print_info(self, message: str) -> None:
        """Print general info message."""
        if self.silent:
            return
        with self._lock:
            self.clear_progress()
            prefix = self.color(CYAN, "[*]")
            sys.stdout.write(f"{prefix} {message}\n")
            sys.stdout.flush()

    def print_summary(
        self,
        tested: int,
        discovered: int,
        http_alive: int,
        duration: float,
        output_dir: Optional[str] = None,
    ) -> None:
        """Print final scan summary table."""
        if self.silent:
            return

        with self._lock:
            self.clear_progress()

            bold = BOLD if self.use_color else ""
            reset = RESET if self.use_color else ""
            dim = DIM if self.use_color else ""
            green = GREEN if self.use_color else ""

            divider = "-" * 48
            print(f"{dim}{divider}{reset}")
            print(f"{bold}Enumeration Complete{reset}")
            print(f"{dim}{divider}{reset}")
            print(f"Words Tested : {tested:,}")
            print(f"Discovered   : {green}{bold}{discovered:,}{reset}")
            print(f"HTTP Alive   : {http_alive:,}")
            print(f"Duration     : {duration:.2f}s")

            if output_dir:
                print(f"Results Saved: {output_dir}")

            print(f"{dim}{divider}{reset}")
            print()
            sys.stdout.flush()


class ReportWriter:
    """Handles saving scan outcomes into TXT, JSON, and CSV files."""

    @staticmethod
    def save_all(
        target: str,
        results: List[Dict[str, Any]],
        output_dir: str,
        total_tested: int,
        duration: float,
        write_txt: bool = True,
        write_json: bool = True,
        write_csv: bool = True,
    ) -> Dict[str, str]:
        """
        Write results into output_dir. Returns dict of generated file paths.
        """
        os.makedirs(output_dir, exist_ok=True)
        created_files = {}

        # 1. Plain text list of subdomains
        if write_txt:
            txt_path = os.path.join(output_dir, "discovered_subdomains.txt")
            with open(txt_path, "w", encoding="utf-8") as f:
                for r in results:
                    f.write(f"{r['subdomain']}\n")
            created_files["txt"] = txt_path

        # 2. Structured JSON
        if write_json:
            json_path = os.path.join(output_dir, "results.json")
            now_iso = datetime.now(timezone.utc).isoformat()
            payload = {
                "target": target,
                "scan_time": now_iso,
                "total_tested": total_tested,
                "discovered_count": len(results),
                "duration_seconds": round(duration, 2),
                "results": results,
            }
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=4)
            created_files["json"] = json_path

        # 3. CSV file
        if write_csv:
            csv_path = os.path.join(output_dir, "results.csv")
            fieldnames = [
                "subdomain",
                "dns_resolved",
                "ipv4",
                "ipv6",
                "http_alive",
                "http_status",
                "http_url",
                "title",
                "server",
                "redirect_url",
                "response_time_sec",
            ]
            with open(csv_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                for r in results:
                    ipv4_str = ";".join(r.get("ipv4", []))
                    ipv6_str = ";".join(r.get("ipv6", []))
                    writer.writerow({
                        "subdomain": r.get("subdomain", ""),
                        "dns_resolved": r.get("dns_resolved", False),
                        "ipv4": ipv4_str,
                        "ipv6": ipv6_str,
                        "http_alive": r.get("http_alive", False),
                        "http_status": r.get("http_status") or "",
                        "http_url": r.get("http_url") or "",
                        "title": r.get("title") or "",
                        "server": r.get("server") or "",
                        "redirect_url": r.get("redirect_url") or "",
                        "response_time_sec": r.get("response_time") or "",
                    })
            created_files["csv"] = csv_path

        return created_files
