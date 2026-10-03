#!/usr/bin/env python3
"""
SubScope - Fast Multithreaded Subdomain Reconnaissance Tool.

This executable entry point launches the SubScope CLI engine.
Compatible with Kali Linux, Debian, Ubuntu, and standard Unix environments.
"""

import os
import sys

# Ensure repository root is in Python module search path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from subscope.cli import main

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n[!] Scan interrupted by user.")
        sys.exit(130)
