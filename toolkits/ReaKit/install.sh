#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "========================================================"
echo "  REA_Kit Installation & Environment Setup (Unix/Linux)"
echo "========================================================"
echo ""

PYTHON_BIN=""
if command -v python3 &>/dev/null; then
    PYTHON_BIN="python3"
elif command -v python &>/dev/null; then
    PYTHON_BIN="python"
else
    echo "[-] Python 3 not found in PATH. Please install Python 3.8+."
    exit 1
fi

"$PYTHON_BIN" "$SCRIPT_DIR/rea.py" install "$@"
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo ""
    echo "[-] Installation encountered an error (exit code $EXIT_CODE)."
    exit $EXIT_CODE
fi

echo ""
echo "========================================================"
echo "[+] REA_Kit installed successfully!"
echo "[+] Verify your setup with: $PYTHON_BIN rea.py check"
echo "========================================================"
echo ""
