"""
Reconnaissance probe worker logic combining DNS resolution and HTTP/HTTPS inspection.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional

from subscope.dns import DNSResolver, DNSResult
from subscope.http import HTTPProber, HTTPResult


@dataclass
class ReconConfig:
    """Configuration options for a reconnaissance run."""
    check_dns: bool = True
    check_http: bool = True
    show_status: bool = True
    show_title: bool = True
    show_ip: bool = True
    dns_timeout: float = 3.0
    http_timeout: float = 4.0
    verify_ssl: bool = False
    user_agent: Optional[str] = None


@dataclass
class ReconRecord:
    """Consolidated reconnaissance finding for a single hostname."""
    subdomain: str
    discovered: bool = False
    dns_resolved: bool = False
    dns_status: str = "NXDOMAIN"
    ipv4: List[str] = field(default_factory=list)
    ipv6: List[str] = field(default_factory=list)
    ip: Optional[str] = None
    cname: Optional[str] = None
    http_alive: bool = False
    http_status: Optional[int] = None
    http_url: Optional[str] = None
    title: Optional[str] = None
    server: Optional[str] = None
    redirect_url: Optional[str] = None
    response_time: Optional[float] = None
    error_message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ReconWorker:
    """Performs individual host discovery through DNS and HTTP probing."""

    def __init__(self, config: ReconConfig):
        self.config = config
        self.dns_resolver = DNSResolver(timeout=config.dns_timeout)
        self.http_prober = HTTPProber(
            timeout=config.http_timeout,
            verify_ssl=config.verify_ssl,
            user_agent=config.user_agent or HTTPProber.DEFAULT_USER_AGENT,
        )

    def probe_host(self, hostname: str) -> ReconRecord:
        """
        Execute configured reconnaissance phases for a given hostname.
        Phase 1: DNS Resolution.
        Phase 2: HTTP/HTTPS inspection (if DNS succeeded or HTTP-only mode enabled).
        """
        record = ReconRecord(subdomain=hostname)

        # 1. DNS Resolution Phase
        if self.config.check_dns:
            dns_res = self.dns_resolver.resolve(hostname)
            record.dns_resolved = dns_res.resolved
            record.dns_status = dns_res.status
            record.ipv4 = dns_res.ipv4
            record.ipv6 = dns_res.ipv6
            record.ip = dns_res.primary_ip
            record.cname = dns_res.cname
            if dns_res.error_message:
                record.error_message = dns_res.error_message

        # If DNS check was active and DNS failed, host is unresolvable
        if self.config.check_dns and not record.dns_resolved:
            record.discovered = False
            return record

        # If DNS succeeded, mark as discovered
        if record.dns_resolved:
            record.discovered = True

        # 2. HTTP/HTTPS Inspection Phase
        if self.config.check_http:
            http_res = self.http_prober.probe(hostname)
            record.http_alive = http_res.is_alive
            record.http_status = http_res.status_code
            record.http_url = http_res.url
            record.title = http_res.title
            record.server = http_res.server
            record.redirect_url = http_res.redirect_url
            record.response_time = http_res.response_time

            if http_res.is_alive:
                record.discovered = True

        return record
