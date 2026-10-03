"""
Unit tests for DNS resolution handling with mocked socket queries.
"""

import socket
import unittest
from unittest.mock import patch

from subscope.dns import DNSResolver, DNSResult


class TestDNSResolver(unittest.TestCase):

    def setUp(self):
        self.resolver = DNSResolver(timeout=1.0)

    @patch("socket.getaddrinfo")
    def test_successful_resolution_ipv4_and_ipv6(self, mock_getaddrinfo):
        # Mock getaddrinfo return structure
        mock_getaddrinfo.return_value = [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "canonical.example.com", ("93.184.216.34", 0)),
            (socket.AF_INET6, socket.SOCK_STREAM, 6, "canonical.example.com", ("2606:2800:220:1:248:1893:25c8:1946", 0, 0, 0)),
        ]

        result = self.resolver.resolve("test.example.com")
        self.assertTrue(result.resolved)
        self.assertEqual(result.status, "RESOLVED")
        self.assertIn("93.184.216.34", result.ipv4)
        self.assertIn("2606:2800:220:1:248:1893:25c8:1946", result.ipv6)
        self.assertEqual(result.primary_ip, "93.184.216.34")
        self.assertEqual(result.cname, "canonical.example.com")

    @patch("socket.getaddrinfo")
    def test_nxdomain_handling(self, mock_getaddrinfo):
        mock_getaddrinfo.side_effect = socket.gaierror(-2, "Name or service not known")

        result = self.resolver.resolve("nonexistent.example.com")
        self.assertFalse(result.resolved)
        self.assertEqual(result.status, "NXDOMAIN")
        self.assertIsNone(result.primary_ip)
        self.assertIsNotNone(result.error_message)

    @patch("socket.getaddrinfo")
    def test_dns_timeout_handling(self, mock_getaddrinfo):
        mock_getaddrinfo.side_effect = socket.timeout("timed out")

        result = self.resolver.resolve("timeout.example.com")
        self.assertFalse(result.resolved)
        self.assertEqual(result.status, "TIMEOUT")
        self.assertIn("timed out", result.error_message.lower())


if __name__ == "__main__":
    unittest.main()
