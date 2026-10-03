"""
Command-line interface argument parsing, validation, and execution controller for SubScope.
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from typing import Optional

from subscope import __version__
from subscope.enumerator import SubdomainEnumerator
from subscope.output import ReportWriter, TerminalWriter
from subscope.recon import ReconConfig
from subscope.utils import clean_domain, is_valid_domain, load_wordlist, sanitize_filename


def get_default_wordlist_path() -> str:
    """Resolve default bundled wordlist relative to project root."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    candidate = os.path.join(base_dir, "wordlists", "subdomains.txt")
    if os.path.exists(candidate):
        return candidate
    return "wordlists/subdomains.txt"


def build_parser() -> argparse.ArgumentParser:
    """Construct CLI argument parser with organized help groups."""
    parser = argparse.ArgumentParser(
        prog="./subscope.py",
        description="SubScope - Fast Multithreaded Subdomain Enumeration & Reconnaissance Tool for Kali Linux.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  ./subscope.py -d example.com
  ./subscope.py -d example.com -w wordlists/subdomains.txt -t 50
  ./subscope.py -d example.com --dns --http --status --title --ip
  ./subscope.py -d example.com -o results/example --json --csv
  ./subscope.py -d example.com --silent > subdomains.txt

Ethical Notice:
  Authorized security testing only. Only scan assets you own or have explicit authorization to assess.
        """,
    )

    # Target & Wordlist
    target_group = parser.add_argument_group("Target Options")
    target_group.add_argument(
        "-d", "--domain",
        type=str,
        help="Target root domain to enumerate (e.g., example.com)",
    )
    target_group.add_argument(
        "-w", "--wordlist",
        type=str,
        default=get_default_wordlist_path(),
        help="Path to custom subdomain wordlist (default: wordlists/subdomains.txt)",
    )

    # Performance
    perf_group = parser.add_argument_group("Performance Options")
    perf_group.add_argument(
        "-t", "--threads",
        type=int,
        default=20,
        help="Number of concurrent worker threads (1-200, default: 20)",
    )
    perf_group.add_argument(
        "--timeout",
        type=float,
        default=4.0,
        help="Network request timeout in seconds (default: 4.0)",
    )

    # Reconnaissance Probes
    recon_group = parser.add_argument_group("Reconnaissance Modules")
    recon_group.add_argument(
        "--dns",
        action="store_true",
        default=False,
        help="Perform DNS resolution (IPv4 and IPv6)",
    )
    recon_group.add_argument(
        "--http",
        action="store_true",
        default=False,
        help="Check HTTP/HTTPS service availability",
    )
    recon_group.add_argument(
        "--status",
        action="store_true",
        default=False,
        help="Display HTTP response status codes",
    )
    recon_group.add_argument(
        "--title",
        action="store_true",
        default=False,
        help="Extract and display webpage HTML titles",
    )
    recon_group.add_argument(
        "--ip",
        action="store_true",
        default=False,
        help="Resolve and display IP addresses",
    )

    # Output Options
    out_group = parser.add_argument_group("Output & Formatting")
    out_group.add_argument(
        "-o", "--output",
        type=str,
        help="Output directory (default: results/<target_domain>/)",
    )
    out_group.add_argument(
        "--json",
        action="store_true",
        default=False,
        help="Save results in JSON format",
    )
    out_group.add_argument(
        "--csv",
        action="store_true",
        default=False,
        help="Save results in CSV format",
    )
    out_group.add_argument(
        "--silent",
        action="store_true",
        default=False,
        help="Show only discovered subdomains (ideal for piping into other tools)",
    )
    out_group.add_argument(
        "--verbose",
        action="store_true",
        default=False,
        help="Show verbose details during scan",
    )
    out_group.add_argument(
        "--no-color",
        action="store_true",
        default=False,
        help="Disable ANSI colored output",
    )

    # Tool Info
    parser.add_argument(
        "-v", "--version",
        action="version",
        version=f"SubScope v{__version__}",
        help="Show tool version and exit",
    )

    return parser


def main(args: Optional[list] = None) -> int:
    """Main CLI execution flow."""
    parser = build_parser()
    opts = parser.parse_args(args)

    terminal = TerminalWriter(
        silent=opts.silent,
        verbose=opts.verbose,
        no_color=opts.no_color,
    )

    # Handle missing domain argument
    if not opts.domain:
        terminal.print_banner(__version__)
        terminal.print_error("Missing target domain. Please specify -d or --domain (e.g., -d example.com)")
        terminal.print_info("Use --help for full usage guidelines.")
        return 1

    # Validate target domain
    domain = clean_domain(opts.domain)
    if not is_valid_domain(domain):
        terminal.print_banner(__version__)
        terminal.print_error(f"Invalid domain format: '{opts.domain}'. Please provide a valid domain (e.g., example.com).")
        return 1

    # Validate thread count
    if opts.threads < SubdomainEnumerator.MIN_THREADS or opts.threads > SubdomainEnumerator.MAX_THREADS:
        terminal.print_banner(__version__)
        terminal.print_error(
            f"Invalid thread count '{opts.threads}'. Must be between {SubdomainEnumerator.MIN_THREADS} and {SubdomainEnumerator.MAX_THREADS}."
        )
        return 1

    # Validate wordlist
    try:
        words = load_wordlist(opts.wordlist)
    except FileNotFoundError:
        terminal.print_banner(__version__)
        terminal.print_error(f"Wordlist file not found: '{opts.wordlist}'")
        return 1
    except PermissionError:
        terminal.print_banner(__version__)
        terminal.print_error(f"Permission denied reading wordlist: '{opts.wordlist}'")
        return 1
    except ValueError as e:
        terminal.print_banner(__version__)
        terminal.print_error(str(e))
        return 1

    # Determine probe flags
    explicit_flags = any([opts.dns, opts.http, opts.status, opts.title, opts.ip])
    if not explicit_flags:
        check_dns = True
        check_http = True
        show_status = True
        show_title = True
        show_ip = True
    else:
        check_dns = opts.dns or opts.ip
        check_http = opts.http or opts.status or opts.title
        show_status = opts.status or not explicit_flags
        show_title = opts.title or not explicit_flags
        show_ip = opts.ip or not explicit_flags

    recon_config = ReconConfig(
        check_dns=check_dns,
        check_http=check_http,
        show_status=show_status,
        show_title=show_title,
        show_ip=show_ip,
        dns_timeout=opts.timeout,
        http_timeout=opts.timeout,
        verify_ssl=False,
    )

    # Determine output directory
    if opts.output:
        output_dir = opts.output
    else:
        output_dir = os.path.join("results", sanitize_filename(domain))

    # Print banner & metadata
    terminal.print_banner(__version__)
    terminal.print_scan_meta(
        target=domain,
        wordlist=opts.wordlist,
        threads=opts.threads,
        word_count=len(words),
    )

    # Initialize Enumerator
    enumerator = SubdomainEnumerator(
        target_domain=domain,
        wordlist=words,
        recon_config=recon_config,
        threads=opts.threads,
        terminal=terminal,
    )

    results = []
    try:
        results = enumerator.run()
    except KeyboardInterrupt:
        terminal.print_warning("Scan interrupted by user.")
        terminal.print_info("Saving collected results...")
    except Exception as e:
        terminal.print_error(f"Fatal scan error: {e}")
        return 1

    # Determine format flags
    save_json = opts.json or (not opts.json and not opts.csv)
    save_csv = opts.csv or (not opts.json and not opts.csv)
    save_txt = True

    try:
        ReportWriter.save_all(
            target=domain,
            results=results,
            output_dir=output_dir,
            total_tested=enumerator.tested_count,
            duration=enumerator.duration,
            write_txt=save_txt,
            write_json=save_json,
            write_csv=save_csv,
        )
    except Exception as e:
        terminal.print_error(f"Failed to write results to '{output_dir}': {e}")
        return 1

    terminal.print_summary(
        tested=enumerator.tested_count,
        discovered=len(results),
        http_alive=enumerator.http_alive_count,
        duration=enumerator.duration,
        output_dir=output_dir if not opts.silent else None,
    )

    return 130 if enumerator.was_interrupted else 0


if __name__ == "__main__":
    sys.exit(main())
