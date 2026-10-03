"""
Unit tests for report generation (TXT, JSON, CSV).
"""

import csv
import json
import os
import shutil
import tempfile
import unittest

from subscope.output import ReportWriter


class TestReportWriter(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.sample_results = [
            {
                "subdomain": "admin.example.com",
                "dns_resolved": True,
                "ipv4": ["192.0.2.10"],
                "ipv6": [],
                "http_alive": True,
                "http_status": 200,
                "http_url": "https://admin.example.com/",
                "title": "Admin Console",
                "server": "nginx",
                "redirect_url": None,
                "response_time": 0.35,
            },
            {
                "subdomain": "api.example.com",
                "dns_resolved": True,
                "ipv4": ["192.0.2.20"],
                "ipv6": ["2001:db8::1"],
                "http_alive": True,
                "http_status": 403,
                "http_url": "https://api.example.com/",
                "title": "Forbidden",
                "server": "cloudflare",
                "redirect_url": None,
                "response_time": 0.12,
            },
        ]

    def tearDown(self):
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

    def test_save_all_formats(self):
        saved = ReportWriter.save_all(
            target="example.com",
            results=self.sample_results,
            output_dir=self.temp_dir,
            total_tested=10,
            duration=1.5,
            write_txt=True,
            write_json=True,
            write_csv=True,
        )

        self.assertIn("txt", saved)
        self.assertIn("json", saved)
        self.assertIn("csv", saved)

        # 1. Verify TXT
        with open(saved["txt"], "r", encoding="utf-8") as f:
            lines = [l.strip() for l in f if l.strip()]
        self.assertEqual(lines, ["admin.example.com", "api.example.com"])

        # 2. Verify JSON
        with open(saved["json"], "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertEqual(data["target"], "example.com")
        self.assertEqual(data["discovered_count"], 2)
        self.assertEqual(data["total_tested"], 10)
        self.assertEqual(len(data["results"]), 2)
        self.assertEqual(data["results"][0]["subdomain"], "admin.example.com")

        # 3. Verify CSV
        with open(saved["csv"], "r", encoding="utf-8") as f:
            reader = list(csv.DictReader(f))
        self.assertEqual(len(reader), 2)
        self.assertEqual(reader[0]["subdomain"], "admin.example.com")
        self.assertEqual(reader[0]["http_status"], "200")
        self.assertEqual(reader[0]["ipv4"], "192.0.2.10")


if __name__ == "__main__":
    unittest.main()
