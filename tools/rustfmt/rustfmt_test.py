import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from python.runfiles import runfiles

FORMATTER = runfiles.Create().Rlocation(sys.argv.pop(1))


class RustfmtTest(unittest.TestCase):
    def run_formatter(self, directory, *arguments):
        return subprocess.run(
            [FORMATTER, *arguments],
            cwd=directory,
            env={**os.environ, "BUILD_WORKSPACE_DIRECTORY": str(directory)},
            capture_output=True,
            text=True,
        )

    def test_formats_requested_file_without_following_modules(self):
        with tempfile.TemporaryDirectory(prefix="rustfmt space ") as temporary:
            directory = Path(temporary)
            source = directory / "lib.rs"
            source.write_text("mod child;\nasync fn run(){let value=1;}\n")
            child = directory / "child.rs"
            child.write_text("fn child(){let value=2;}\n")
            generated = directory / "data_generated.rs"
            generated.write_text("fn generated(){let value=3;}\n")
            result = self.run_formatter(directory, "lib.rs")
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("async fn run() {", source.read_text())
            self.assertEqual(child.read_text(), "fn child(){let value=2;}\n")
            self.assertEqual(generated.read_text(), "fn generated(){let value=3;}\n")

    def test_check_reports_unformatted_file(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            source = directory / "fixture.rs"
            source.write_text("fn run(){let value=1;}\n")
            result = self.run_formatter(directory, "--check", "fixture.rs")
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(source.read_text(), "fn run(){let value=1;}\n")


if __name__ == "__main__":
    unittest.main()
