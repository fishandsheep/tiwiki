from __future__ import annotations

import sqlite3
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DB_PATH = ROOT / "data" / "ti.db"


def year_to_refresh(now: datetime) -> int | None:
    conn = sqlite3.connect(DB_PATH)
    try:
        ongoing = conn.execute(
            "SELECT year FROM tournaments WHERE status = 'ongoing' ORDER BY year DESC LIMIT 1"
        ).fetchone()
        if ongoing:
            return int(ongoing[0])
        if now.day != 1:
            return None
        latest = conn.execute(
            "SELECT year FROM tournaments WHERE status = 'completed' ORDER BY year DESC LIMIT 1"
        ).fetchone()
        return int(latest[0]) if latest else None
    finally:
        conn.close()


def main() -> int:
    year = year_to_refresh(datetime.now(timezone.utc))
    if year is None:
        print("off-season refresh is not due today")
        return 0
    print(f"refresh due from active/latest tournament year {year}; validating full archive snapshot")
    subprocess.run(
        [sys.executable, "-u", str(ROOT / "scripts/crawler/refresh.py")],
        cwd=ROOT,
        check=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
