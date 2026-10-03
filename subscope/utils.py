"""
Utility functions for domain validation, wordlist loading, and text sanitization.
"""

from __future__ import annotations

import os
import re
from typing import List, Optional
from urllib.parse import urlparse

# RFC 1035 / RFC 1123 compliant domain regex
DOMAIN_REGEX = re.compile(
    r"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$"
)

# Subdomain prefix label regex (e.g., 'admin', 'api-v2', 'dev1')
SUBDOMAIN_LABEL_REGEX = re.compile(
    r"^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$"
)


def clean_domain(domain: str) -> str:
    """
    Clean and normalize user-supplied domain string.
    Removes protocols, trailing slashes, ports, and trailing paths.
    """
    if not domain:
        return ""

    cleaned = domain.strip().lower()

    # If scheme was included, parse via urlparse
    if cleaned.startswith(("http://", "https://", "//")):
        parsed = urlparse(cleaned)
        cleaned = parsed.netloc or parsed.path
    else:
        # Strip trailing slashes or path fragments
        if "/" in cleaned:
            cleaned = cleaned.split("/")[0]

    # Remove port if specified (e.g., example.com:8080)
    if ":" in cleaned:
        cleaned = cleaned.split(":")[0]

    # Strip trailing dot if present (FQDN root dot)
    if cleaned.endswith("."):
        cleaned = cleaned[:-1]

    return cleaned


def is_valid_domain(domain: str) -> bool:
    """
    Check if domain is a valid syntax hostname.
    """
    if not domain or len(domain) > 253:
        return False

    cleaned = clean_domain(domain)
    if not cleaned:
        return False

    return bool(DOMAIN_REGEX.match(cleaned))


def is_valid_subdomain_label(label: str) -> bool:
    """
    Validate an individual subdomain label extracted from a wordlist.
    """
    if not label or len(label) > 63:
        return False
    return bool(SUBDOMAIN_LABEL_REGEX.match(label))


def load_wordlist(file_path: str) -> List[str]:
    """
    Load and parse subdomain wordlist from disk.
    Filters out comments, empty lines, and duplicates while preserving order.

    Raises:
        FileNotFoundError: If wordlist file does not exist.
        ValueError: If file is empty or contains no valid entries.
        PermissionError: If file cannot be read.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Wordlist file not found: {file_path}")

    if not os.path.isfile(file_path):
        raise ValueError(f"Path is not a regular file: {file_path}")

    words: List[str] = []
    seen = set()

    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            entry = line.strip().lower()
            # Ignore empty lines and comment lines
            if not entry or entry.startswith("#") or entry.startswith("//"):
                continue

            # Support dotted prefixes (e.g. dev.api) or single labels
            if "." in entry:
                labels = entry.split(".")
                if all(is_valid_subdomain_label(l) for l in labels):
                    if entry not in seen:
                        seen.add(entry)
                        words.append(entry)
            else:
                if is_valid_subdomain_label(entry):
                    if entry not in seen:
                        seen.add(entry)
                        words.append(entry)

    if not words:
        raise ValueError(f"Wordlist '{file_path}' contains no valid subdomain entries.")

    return words


def sanitize_filename(name: str) -> str:
    """
    Sanitize a domain or string for safe use in file and folder paths.
    """
    return re.sub(r"[^\w\-.]", "_", name)
