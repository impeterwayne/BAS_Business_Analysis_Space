#!/usr/bin/env python3
"""Target download script (backward-compatible wrapper around reakit)."""
import os
import sys
import argparse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from reakit.config import ConfigManager
from reakit.downloader import Downloader

def main():
    parser = argparse.ArgumentParser(description="Download targets using apkd")
    parser.add_argument("--config", default=None, help="Path to workspace_config.json")
    parser.add_argument("--targets", default=None, help="Path to targets.txt")
    parser.add_argument("--link", help="Direct link or package name to download instead of reading targets.txt")
    parser.add_argument("--apkd", help="Path to apkd executable")
    args = parser.parse_args()

    config_mgr = ConfigManager(args.config)
    dl = Downloader(config_mgr, apkd_path=args.apkd)
    dl.download_targets(targets_file=args.targets, link=args.link)

if __name__ == "__main__":
    main()
