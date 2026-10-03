"""
Unit tests for CLI argument parsing and flags.
"""

import unittest
from subscope.cli import build_parser


class TestCLIParser(unittest.TestCase):

    def setUp(self):
        self.parser = build_parser()

    def test_default_arguments(self):
        args = self.parser.parse_args(["-d", "example.com"])
        self.assertEqual(args.domain, "example.com")
        self.assertEqual(args.threads, 20)
        self.assertEqual(args.timeout, 4.0)
        self.assertFalse(args.silent)
        self.assertFalse(args.verbose)
        self.assertFalse(args.json)
        self.assertFalse(args.csv)

    def test_custom_flags(self):
        args = self.parser.parse_args([
            "-d", "target.org",
            "-t", "50",
            "-w", "custom.txt",
            "-o", "custom_out",
            "--dns",
            "--http",
            "--status",
            "--title",
            "--ip",
            "--json",
            "--csv",
            "--silent",
            "--verbose",
        ])
        self.assertEqual(args.domain, "target.org")
        self.assertEqual(args.threads, 50)
        self.assertEqual(args.wordlist, "custom.txt")
        self.assertEqual(args.output, "custom_out")
        self.assertTrue(args.dns)
        self.assertTrue(args.http)
        self.assertTrue(args.status)
        self.assertTrue(args.title)
        self.assertTrue(args.ip)
        self.assertTrue(args.json)
        self.assertTrue(args.csv)
        self.assertTrue(args.silent)
        self.assertTrue(args.verbose)


if __name__ == "__main__":
    unittest.main()
