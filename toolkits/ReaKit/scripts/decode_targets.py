#!/usr/bin/env python3
"""Bytecode decompilation script (backward-compatible wrapper around reakit)."""
import os
import sys
import argparse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from reakit.config import ConfigManager
from reakit.decompiler import Decompiler

def main():
    parser = argparse.ArgumentParser(description="Decode targets using jadx")
    parser.add_argument("--config", default=None, help="Path to workspace_config.json")
    parser.add_argument("--targets", default=None, help="Path to targets.txt")
    parser.add_argument("--link", help="Direct link or package name to decode instead of reading targets.txt")
    parser.add_argument("--threads", "-j", type=int, help="Number of worker threads for JADX")
    args = parser.parse_args()

    config_mgr = ConfigManager(args.config)
    dec = Decompiler(config_mgr)
    dec.decompile_targets(targets_file=args.targets, link=args.link, threads=args.threads)

if __name__ == "__main__":
    main()
