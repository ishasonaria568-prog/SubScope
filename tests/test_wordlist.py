"""
Unit tests for wordlist parsing and loading logic.
"""

import os
import tempfile
import unittest
from subscope.utils import load_wordlist


class TestWordlistLoader(unittest.TestCase):

    def setUp(self):
        self.temp_file = tempfile.NamedTemporaryFile("w+", delete=False, encoding="utf-8")

    def tearDown(self):
        if os.path.exists(self.temp_file.name):
            os.remove(self.temp_file.name)

    def test_load_valid_wordlist(self):
        content = """# Comment line
admin
api
# Another comment
dev
mail
// C-style comment
portal
"""
        self.temp_file.write(content)
        self.temp_file.flush()

        words = load_wordlist(self.temp_file.name)
        self.assertEqual(words, ["admin", "api", "dev", "mail", "portal"])

    def test_wordlist_deduplication(self):
        content = """admin
api
Admin
API
admin
"""
        self.temp_file.write(content)
        self.temp_file.flush()

        words = load_wordlist(self.temp_file.name)
        self.assertEqual(words, ["admin", "api"])

    def test_missing_wordlist_raises(self):
        with self.assertRaises(FileNotFoundError):
            load_wordlist("/non/existent/path/subdomains.txt")

    def test_empty_wordlist_raises(self):
        content = """# Only comments
# Nothing else
"""
        self.temp_file.write(content)
        self.temp_file.flush()

        with self.assertRaises(ValueError):
            load_wordlist(self.temp_file.name)


if __name__ == "__main__":
    unittest.main()
