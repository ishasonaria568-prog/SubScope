"""
Unit tests for HTTP probing and webpage title extraction.
"""

import unittest
from unittest.mock import MagicMock, patch
import urllib.error

from subscope.http import HTTPProber, HTTPResult


class TestHTTPProber(unittest.TestCase):

    def setUp(self):
        self.prober = HTTPProber(timeout=1.0)

    def test_extract_title_html(self):
        html_bytes = b"<html><head><title>  Admin Dashboard &amp; Control  </title></head><body>Hello</body></html>"
        title = self.prober._extract_title(html_bytes, "text/html; charset=utf-8")
        self.assertEqual(title, "Admin Dashboard & Control")

    def test_extract_title_multiline(self):
        html_bytes = b"""<html><head><title>
            Internal API
            Gateway
        </title></head></html>"""
        title = self.prober._extract_title(html_bytes)
        self.assertEqual(title, "Internal API Gateway")

    def test_extract_title_none(self):
        html_bytes = b"<html><body>No title here</body></html>"
        title = self.prober._extract_title(html_bytes)
        self.assertIsNone(title)

    @patch("urllib.request.OpenerDirector.open")
    def test_probe_http_success_200(self, mock_open):
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.headers = {
            "Server": "nginx/1.24.0",
            "Content-Type": "text/html; charset=utf-8",
            "Location": None,
        }
        mock_response.read.return_value = b"<html><head><title>Customer Portal</title></head></html>"
        mock_response.__enter__.return_value = mock_response

        mock_open.return_value = mock_response

        result = self.prober.probe("portal.example.com")
        self.assertTrue(result.is_alive)
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.title, "Customer Portal")
        self.assertEqual(result.server, "nginx/1.24.0")

    @patch("urllib.request.OpenerDirector.open")
    def test_probe_http_error_403(self, mock_open):
        http_error = urllib.error.HTTPError(
            url="https://api.example.com/",
            code=403,
            msg="Forbidden",
            hdrs={"Server": "cloudflare", "Content-Type": "text/html"},
            fp=None,
        )
        http_error.read = MagicMock(return_value=b"<title>Access Denied</title>")
        mock_open.side_effect = http_error

        result = self.prober.probe("api.example.com")
        self.assertTrue(result.is_alive)
        self.assertEqual(result.status_code, 403)
        self.assertEqual(result.title, "Access Denied")


if __name__ == "__main__":
    unittest.main()
