#!/usr/bin/env python3
"""REA_Kit Unified CLI Entrypoint."""
import sys

# Never write __pycache__ next to the sources: they may sit in a signed, read-only app bundle.
sys.dont_write_bytecode = True

from reakit.cli import main  # noqa: E402

if __name__ == "__main__":
    main()
