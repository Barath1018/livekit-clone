#!/usr/bin/env python3
"""Start the LiveKit Agents Dashboard backend server."""

import sys
from pathlib import Path

# Add parent directory to path so 'backend' package is importable
parent_dir = str(Path(__file__).parent.parent)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print("  LiveKit Agents Dashboard - Backend")
    print("  http://localhost:8080")
    print("=" * 60)
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8080,
        reload=True,
        log_level="info",
    )
