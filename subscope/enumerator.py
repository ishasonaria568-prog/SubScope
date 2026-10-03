"""
Multithreaded subdomain enumeration engine with thread synchronization and progress reporting.
"""

from __future__ import annotations

import concurrent.futures
import threading
import time
from typing import Any, Callable, Dict, List, Optional

from subscope.output import TerminalWriter
from subscope.recon import ReconConfig, ReconRecord, ReconWorker


class SubdomainEnumerator:
    """
    Coordinates multithreaded subdomain enumeration across a wordlist.
    Guarantees thread-safe state synchronization and graceful interruption handling.
    """

    MIN_THREADS = 1
    MAX_THREADS = 200
    DEFAULT_THREADS = 20

    def __init__(
        self,
        target_domain: str,
        wordlist: List[str],
        recon_config: ReconConfig,
        threads: int = DEFAULT_THREADS,
        terminal: Optional[TerminalWriter] = None,
        on_result: Optional[Callable[[Dict[str, Any]], None]] = None,
    ):
        self.target_domain = target_domain.lower()
        self.wordlist = wordlist
        self.recon_config = recon_config
        self.threads = max(self.MIN_THREADS, min(threads, self.MAX_THREADS))
        self.terminal = terminal or TerminalWriter()
        self.on_result = on_result

        # Thread synchronization primitives
        self._lock = threading.Lock()
        self._stop_event = threading.Event()

        # Metrics
        self.tested_count = 0
        self.results: List[Dict[str, Any]] = []
        self.start_time: float = 0.0
        self.end_time: float = 0.0
        self.was_interrupted: bool = False

    def stop(self) -> None:
        """Signal all worker threads to abort remaining tasks."""
        self._stop_event.set()
        self.was_interrupted = True

    def _worker_task(self, prefix: str) -> Optional[ReconRecord]:
        """Task executed by thread pool worker for a single subdomain candidate."""
        if self._stop_event.is_set():
            return None

        # Build fully qualified hostname
        hostname = f"{prefix}.{self.target_domain}"
        worker = ReconWorker(self.recon_config)
        record = worker.probe_host(hostname)

        # Thread-safe update of progress and collected results
        with self._lock:
            self.tested_count += 1
            current_tested = self.tested_count

            if record.discovered:
                rec_dict = record.to_dict()
                self.results.append(rec_dict)

                # Output discovered record to console
                self.terminal.print_result(
                    rec_dict,
                    show_ip=self.recon_config.show_ip,
                    show_http=self.recon_config.check_http,
                    show_status=self.recon_config.show_status,
                    show_title=self.recon_config.show_title,
                )

                if self.on_result:
                    self.on_result(rec_dict)

            # Update progress bar
            self.terminal.print_progress(
                current=current_tested,
                total=len(self.wordlist),
                found_count=len(self.results),
            )

        return record

    def run(self) -> List[Dict[str, Any]]:
        """
        Execute concurrent enumeration using ThreadPoolExecutor.
        Supports clean Ctrl+C cancellation without leaving zombie threads.
        """
        self.start_time = time.perf_counter()
        self.tested_count = 0
        self.results = []
        self._stop_event.clear()
        self.was_interrupted = False

        total_words = len(self.wordlist)
        if total_words == 0:
            return []

        # Initial progress display
        self.terminal.print_progress(0, total_words, 0)

        try:
            with concurrent.futures.ThreadPoolExecutor(
                max_workers=self.threads,
                thread_name_prefix="subscope-worker",
            ) as executor:
                # Submit tasks
                futures = {
                    executor.submit(self._worker_task, word): word
                    for word in self.wordlist
                }

                for future in concurrent.futures.as_completed(futures):
                    if self._stop_event.is_set():
                        for f in futures:
                            f.cancel()
                        break

                    try:
                        future.result()
                    except Exception as e:
                        self.terminal.print_verbose(f"Worker task error: {e}")

        except KeyboardInterrupt:
            self.stop()
            raise

        finally:
            self.end_time = time.perf_counter()
            self.terminal.clear_progress()

        return self.results

    @property
    def duration(self) -> float:
        """Total execution duration in seconds."""
        if self.end_time > 0:
            return self.end_time - self.start_time
        if self.start_time > 0:
            return time.perf_counter() - self.start_time
        return 0.0

    @property
    def http_alive_count(self) -> int:
        """Count discovered subdomains that responded to HTTP/HTTPS."""
        return sum(1 for r in self.results if r.get("http_alive"))
