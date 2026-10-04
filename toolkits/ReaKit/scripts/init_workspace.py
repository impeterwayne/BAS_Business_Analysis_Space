#!/usr/bin/env python3
"""Workspace initialization script (backward-compatible wrapper around reakit)."""
import os
import sys
import argparse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from reakit.config import ConfigManager
from reakit.workspace import WorkspaceManager

def init_workspace(config_file=None, input_txt=None):
    config_mgr = ConfigManager(config_file)
    mgr = WorkspaceManager(config_mgr)
    mgr.init_all(input_file=input_txt)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize workspace for App Analytics / RE")
    parser.add_argument("--config", "-c", default=None, help="Path to config JSON")
    parser.add_argument("--input", "-i", default=None, help="Path to generic txt file containing app URLs")
    
    args = parser.parse_args()
    init_workspace(args.config, args.input)
