#!/usr/bin/env python3
"""Runtime data extraction script (backward-compatible wrapper around reakit)."""
import os
import sys
import argparse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from reakit.config import ConfigManager
from reakit.runtime import RuntimeExtractor

def main():
    parser = argparse.ArgumentParser(description="Extract sandbox runtime data via ADB (using package name)")
    parser.add_argument("package_name", nargs="?", help="Target Android package name (e.g. com.example.app)")
    parser.add_argument("--package", "-p", "--target", "-t", dest="target", help="Target Android package name")
    parser.add_argument("--config", default=None, help="Path to workspace_config.json")
    args = parser.parse_args()

    config_mgr = ConfigManager(args.config)
    extractor = RuntimeExtractor(config_mgr)

    target = args.package_name or args.target
    if not target:
        if config_mgr.targets:
            target = config_mgr.targets[0].get("packageName")
        else:
            targets = config_mgr.read_targets_file()
            if targets:
                target = targets[0]

    if not target:
        print("[!] Error: No target Android package specified. Example: python scripts/pull_runtime_data.py com.example.app")
        sys.exit(1)

    extractor.extract_package(target)

if __name__ == "__main__":
    main()
