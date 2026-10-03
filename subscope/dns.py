"""
DNS Resolution engine for SubScope.
Resolves subdomains to IPv4 and IPv6 addresses using Python's native socket interfaces.
Handles timeouts, NXDOMAIN, and network errors gracefully.
"""

from __future__ import annotations

import socket
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class DNSResult:
    """Represents DNS query outcomes for a hostname."""
    subdomain: str
    resolved: bool = False
    ipv4: List[str] = field(default_factory=list)
    ipv6: List[str] = field(default_factory=list)
    cname: Optional[str] = None
    status: str = "NXDOMAIN"  # "RESOLVED", "NXDOMAIN", "TIMEOUT", "ERROR"
    error_message: Optional[str] = None

    @property
    def primary_ip(self) -> Optional[str]:
        """Return primary IPv4 or IPv6 address."""
        if self.ipv4:
            return self.ipv4[0]
        if self.ipv6:
            return self.ipv6[0]
        return None


class DNSResolver:
    """Thread-safe DNS resolution handler using standard socket library."""

    def __init__(self, timeout: float = 3.0):
        self.timeout = timeout

    def resolve(self, hostname: str) -> DNSResult:
        """
        Attempt to resolve hostname to IPv4 and IPv6 addresses.
        Gracefully handles gaierror (NXDOMAIN, unresolvable), timeout, and other OS errors.
        """
        result = DNSResult(subdomain=hostname)

        # Set default timeout for socket operations
        prev_timeout = socket.getdefaulttimeout()
        try:
            socket.setdefaulttimeout(self.timeout)

            # Query address info for all families (AF_UNSPEC handles both IPv4 and IPv6)
            addr_info = socket.getaddrinfo(
                hostname,
                None,
                socket.AF_UNSPEC,
                socket.SOCK_STREAM,
                0,
                socket.AI_CANONNAME,
            )

            ipv4_set = set()
            ipv6_set = set()
            cname_candidate = None

            for entry in addr_info:
                family, socktype, proto, canonname, sockaddr = entry
                if canonname and not cname_candidate and canonname.lower() != hostname.lower():
                    cname_candidate = canonname

                ip_str = sockaddr[0]
                if family == socket.AF_INET:
                    ipv4_set.add(ip_str)
                elif family == socket.AF_INET6:
                    ipv6_set.add(ip_str)

            result.ipv4 = sorted(list(ipv4_set))
            result.ipv6 = sorted(list(ipv6_set))
            result.cname = cname_candidate

            if result.ipv4 or result.ipv6:
                result.resolved = True
                result.status = "RESOLVED"
            else:
                result.resolved = False
                result.status = "NO_RECORDS"

        except socket.gaierror as e:
            result.resolved = False
            result.status = "NXDOMAIN"
            result.error_message = str(e)

        except (socket.timeout, TimeoutError) as e:
            result.resolved = False
            result.status = "TIMEOUT"
            result.error_message = f"DNS resolution timed out ({self.timeout}s)"

        except Exception as e:
            result.resolved = False
            result.status = "ERROR"
            result.error_message = str(e)

        finally:
            socket.setdefaulttimeout(prev_timeout)

        return result
