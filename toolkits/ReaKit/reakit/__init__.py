"""REA_Kit - Reverse Engineering Android Kit.

A unified framework and CLI for Android reverse engineering, decompilation,
APK downloading, runtime extraction, and device control.
"""

__version__ = "2.0.0"
__author__ = "REA_Kit Contributors"

from reakit.env import inject_runtime_path

# Auto-inject bundled core binaries into runtime PATH upon import
inject_runtime_path()
