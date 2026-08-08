from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[3]
sys.path.append(str(ROOT / "scripts" / "crawler"))

from refresh import validate_static_snapshot_and_replace  # noqa: E402


class AtomicRefreshTests(unittest.TestCase):
    def test_validation_failure_preserves_formal_database_bytes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            formal = root / "formal.db"
            candidate = root / "candidate.db"
            formal.write_bytes(b"old database")
            candidate.write_bytes(b"new database")

            with patch("refresh.subprocess.run", side_effect=subprocess.CalledProcessError(1, "audit")):
                with self.assertRaises(subprocess.CalledProcessError):
                    validate_static_snapshot_and_replace(root, candidate, formal)

            self.assertEqual(formal.read_bytes(), b"old database")
            self.assertEqual(candidate.read_bytes(), b"new database")

    def test_successful_validation_replaces_database_after_all_gates(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            formal = root / "formal.db"
            candidate = root / "candidate.db"
            formal.write_bytes(b"old database")
            candidate.write_bytes(b"new database")

            with patch("refresh.subprocess.run") as run:
                validate_static_snapshot_and_replace(root, candidate, formal)

            self.assertEqual(formal.read_bytes(), b"new database")
            self.assertEqual(run.call_count, 3)
            self.assertEqual(run.call_args_list[0].args[0][-2:], ["scripts/db/audit.ts", str(candidate)])
            self.assertEqual(run.call_args_list[1].args[0], ["npm", "run", "generate"])
            self.assertEqual(run.call_args_list[2].args[0], ["npm", "run", "verify:static"])


if __name__ == "__main__":
    unittest.main()
