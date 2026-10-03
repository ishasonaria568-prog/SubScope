"""
Unit tests for domain validation and cleaning logic in SubScope.
"""

import unittest
from subscope.utils import clean_domain, is_valid_domain, is_valid_subdomain_label


class TestDomainValidation(unittest.TestCase):

    def test_valid_domains(self):
        valid = [
            "example.com",
            "sub.example.com",
            "corp-network.internal.net",
            "target.co.uk",
            "api.staging.v2.domain.org",
            "a.b.c.d.example.io",
        ]
        for d in valid:
            self.assertTrue(is_valid_domain(d), f"Expected valid domain: {d}")

    def test_invalid_domains(self):
        invalid = [
            "",
            "   ",
            "example",
            "-leading-dash.com",
            "trailing-dash-.com",
            "invalid..double-dot.com",
            ".leading-dot.com",
            "contains space.com",
            "example$invalid.com",
            "a" * 255 + ".com",
        ]
        for d in invalid:
            self.assertFalse(is_valid_domain(d), f"Expected invalid domain: {d}")

    def test_clean_domain(self):
        test_cases = [
            ("https://example.com/", "example.com"),
            ("http://sub.example.com/test/path", "sub.example.com"),
            ("EXAMPLE.COM", "example.com"),
            ("example.com:8443", "example.com"),
            ("https://target.org:8080/api?query=1", "target.org"),
            ("   example.com.   ", "example.com"),
        ]
        for input_val, expected in test_cases:
            self.assertEqual(clean_domain(input_val), expected)

    def test_subdomain_label_validation(self):
        self.assertTrue(is_valid_subdomain_label("admin"))
        self.assertTrue(is_valid_subdomain_label("api-v1"))
        self.assertTrue(is_valid_subdomain_label("123"))
        self.assertFalse(is_valid_subdomain_label("-admin"))
        self.assertFalse(is_valid_subdomain_label("admin-"))
        self.assertFalse(is_valid_subdomain_label("ad_min"))
        self.assertFalse(is_valid_subdomain_label("a" * 64))


if __name__ == "__main__":
    unittest.main()
