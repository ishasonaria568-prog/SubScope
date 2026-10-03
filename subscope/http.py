"""
HTTP and HTTPS inspection engine for SubScope.
Tests service availability, extracts HTTP status, page title, server header,
and redirect location with strict timeouts and safe SSL handling.
"""

from __future__ import annotations

import html
import re
import socket
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Optional, Tuple

TITLE_REGEX = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)
WHITESPACE_REGEX = re.compile(r"\s+")


@dataclass
class HTTPResult:
    """Outcome of probing HTTP/HTTPS services on a subdomain."""
    subdomain: str
    is_alive: bool = False
    url: Optional[str] = None
    status_code: Optional[int] = None
    title: Optional[str] = None
    server: Optional[str] = None
    redirect_url: Optional[str] = None
    response_time: Optional[float] = None
    content_type: Optional[str] = None
    error_message: Optional[str] = None


class HTTPProber:
    """Thread-safe HTTP/HTTPS probing engine using Python standard library."""

    DEFAULT_USER_AGENT = "Mozilla/5.0 (compatible; SubScope/1.0; +https://github.com/subscope/recon)"

    def __init__(
        self,
        timeout: float = 4.0,
        verify_ssl: bool = False,
        user_agent: str = DEFAULT_USER_AGENT,
        max_read_bytes: int = 65536,  # Read up to 64KB for title extraction
    ):
        self.timeout = timeout
        self.user_agent = user_agent
        self.max_read_bytes = max_read_bytes

        # Permissive SSL context for pentest/recon environments (self-signed certs)
        self.ssl_context = ssl.create_default_context()
        if not verify_ssl:
            self.ssl_context.check_hostname = False
            self.ssl_context.verify_mode = ssl.CERT_NONE

    def _extract_title(self, raw_html: bytes, content_type: Optional[str] = None) -> Optional[str]:
        """Extract and sanitize webpage title from initial HTML bytes."""
        if not raw_html:
            return None

        # Decode content with fallback
        encoding = "utf-8"
        if content_type and "charset=" in content_type.lower():
            try:
                encoding = content_type.lower().split("charset=")[-1].split(";")[0].strip()
            except Exception:
                encoding = "utf-8"

        try:
            text = raw_html.decode(encoding, errors="replace")
        except Exception:
            text = raw_html.decode("latin-1", errors="replace")

        match = TITLE_REGEX.search(text)
        if match:
            raw_title = match.group(1)
            # Unescape HTML entities (e.g., &amp; -> &)
            clean_title = html.unescape(raw_title)
            # Collapse whitespace and tabs/newlines
            clean_title = WHITESPACE_REGEX.sub(" ", clean_title).strip()
            # Truncate overly long titles
            if len(clean_title) > 80:
                clean_title = clean_title[:77] + "..."
            return clean_title if clean_title else None
        return None

    def _probe_single_scheme(self, scheme: str, hostname: str) -> Tuple[bool, Optional[HTTPResult]]:
        """
        Probe a single scheme (http or https).
        Returns (success_or_live, HTTPResult).
        """
        target_url = f"{scheme}://{hostname}/"
        headers = {
            "User-Agent": self.user_agent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Connection": "close",
        }

        req = urllib.request.Request(target_url, headers=headers, method="GET")
        start_time = time.perf_counter()

        try:
            opener = urllib.request.build_opener(
                urllib.request.HTTPSHandler(context=self.ssl_context) if scheme == "https" else urllib.request.HTTPHandler()
            )

            # Perform request
            with opener.open(req, timeout=self.timeout) as resp:
                elapsed = round(time.perf_counter() - start_time, 2)
                status_code = resp.status
                resp_headers = resp.headers
                server_hdr = resp_headers.get("Server")
                content_type = resp_headers.get("Content-Type")
                redirect_loc = resp_headers.get("Location")

                # Read preview bytes for title
                body_chunk = resp.read(self.max_read_bytes)
                title = self._extract_title(body_chunk, content_type)

                return True, HTTPResult(
                    subdomain=hostname,
                    is_alive=True,
                    url=target_url,
                    status_code=status_code,
                    title=title,
                    server=server_hdr,
                    redirect_url=redirect_loc,
                    response_time=elapsed,
                    content_type=content_type,
                )

        except urllib.error.HTTPError as e:
            # HTTP error response like 401 Unauthorized, 403 Forbidden, 404, 500 Server Error
            # The host is STILL alive and running a web service!
            elapsed = round(time.perf_counter() - start_time, 2)
            server_hdr = e.headers.get("Server") if hasattr(e, "headers") else None
            content_type = e.headers.get("Content-Type") if hasattr(e, "headers") else None
            redirect_loc = e.headers.get("Location") if hasattr(e, "headers") else None

            title = None
            try:
                chunk = e.read(self.max_read_bytes)
                title = self._extract_title(chunk, content_type)
            except Exception:
                pass

            return True, HTTPResult(
                subdomain=hostname,
                is_alive=True,
                url=target_url,
                status_code=e.code,
                title=title,
                server=server_hdr,
                redirect_url=redirect_loc,
                response_time=elapsed,
                content_type=content_type,
            )

        except (urllib.error.URLError, socket.timeout, ConnectionRefusedError, ssl.SSLError, OSError) as e:
            # Service not running or connection refused
            return False, HTTPResult(
                subdomain=hostname,
                is_alive=False,
                url=target_url,
                error_message=str(e),
            )

    def probe(self, hostname: str) -> HTTPResult:
        """
        Probe HTTP and HTTPS endpoints for a subdomain.
        Tests HTTPS first, falling back to HTTP if HTTPS fails or is unresponsive.
        """
        # Try HTTPS first
        success_https, res_https = self._probe_single_scheme("https", hostname)
        if success_https and res_https and res_https.is_alive:
            return res_https

        # Fallback to HTTP
        success_http, res_http = self._probe_single_scheme("http", hostname)
        if success_http and res_http and res_http.is_alive:
            return res_http

        # Neither answered
        return HTTPResult(
            subdomain=hostname,
            is_alive=False,
            url=f"http://{hostname}/",
            error_message="Host unreachable on port 80/443",
        )
