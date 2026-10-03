#!/usr/bin/env bash
# SubScope environment setup script for Kali Linux / Unix
set -e

echo "[*] Setting up SubScope environment..."

# Make CLI scripts executable
chmod +x subscope.py
chmod +x install.sh
chmod +x setup.sh

echo "[*] Verifying Python runtime..."
python3 -c '
import sys
if sys.version_info < (3, 8):
    sys.exit("Python 3.8+ is required")
import socket, urllib.request, concurrent.futures, ssl, json, csv, argparse
print(f"[+] Python {sys.version_info.major}.{sys.version_info.minor} verified.")
'

echo "[+] Setup complete! Test with: ./subscope.py --version"
