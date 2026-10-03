#!/usr/bin/env bash
# ==============================================================================
# SubScope - Kali Linux / Unix Automated Installer
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║             SUBSCOPE - Kali Linux Installer               ║"
echo "║          Subdomain Enumeration & Recon Tool               ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 1. Verify Python 3 existence
echo -e "${CYAN}[*] Step 1: Checking Python 3 environment...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}[!] Error: Python 3 is not installed.${NC}"
    echo -e "${YELLOW}    Please install Python 3 using: sudo apt update && sudo apt install -y python3${NC}"
    exit 1
fi

PY_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo -e "${GREEN}[+] Detected Python version: ${PY_VERSION}${NC}"

# Check minimum Python version (>= 3.8)
PYTHON_OK=$(python3 -c 'import sys; print(int(sys.version_info >= (3, 8)))')
if [ "$PYTHON_OK" -ne 1 ]; then
    echo -e "${RED}[!] Error: SubScope requires Python 3.8 or higher.${NC}"
    exit 1
fi

# 2. Verify Python Standard Library modules
echo -e "\n${CYAN}[*] Step 2: Verifying required Python modules...${NC}"
MODULES_CHECK=$(python3 -c '
try:
    import socket, urllib.request, concurrent.futures, ssl, json, csv, argparse, dataclasses
    print("OK")
except Exception as e:
    print(f"FAIL: {e}")
')

if [ "$MODULES_CHECK" = "OK" ]; then
    echo -e "${GREEN}[+] Python standard library modules verified.${NC}"
    echo -e "${GREEN}[+] No external pip packages required (100% standard library native).${NC}"
else
    echo -e "${RED}[!] Module verification failed: ${MODULES_CHECK}${NC}"
    exit 1
fi

# 3. Make CLI scripts executable
echo -e "\n${CYAN}[*] Step 3: Setting executable permissions...${NC}"
chmod +x subscope.py
chmod +x install.sh
if [ -f "setup.sh" ]; then
    chmod +x setup.sh
fi
echo -e "${GREEN}[+] Permissions granted: subscope.py is executable.${NC}"

# 4. Perform self-test installation check
echo -e "\n${CYAN}[*] Step 4: Running verification self-test...${NC}"
if ./subscope.py --version &> /dev/null; then
    VERSION_OUTPUT=$(./subscope.py --version)
    echo -e "${GREEN}[+] Self-test PASSED! ${VERSION_OUTPUT}${NC}"
else
    echo -e "${RED}[!] Self-test failed when running ./subscope.py --version${NC}"
    exit 1
fi

# 5. Success Banner & Instructions
echo -e "\n${GREEN}${BOLD}============================================================${NC}"
echo -e "${GREEN}${BOLD} Installation completed successfully!${NC}"
echo -e "${GREEN}${BOLD}============================================================${NC}"
echo -e "You can now run SubScope directly from your terminal:"
echo -e "\n  ${BOLD}./subscope.py --help${NC}                        (View help & all options)"
echo -e "  ${BOLD}./subscope.py -d example.com${NC}            (Enumerate example.com)"
echo -e "  ${BOLD}./subscope.py -d example.com -t 50${NC}      (Fast 50-thread scan)"
echo -e "  ${BOLD}./subscope.py -d example.com --json --csv${NC} (Export to JSON & CSV)"
echo ""
