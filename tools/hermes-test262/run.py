"""Run every pinned getCanonicalLocales case in fresh Hermes processes."""

import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile


def main():
    runner = str(Path(sys.argv[1]).resolve())
    locale_prelude = str(Path(sys.argv[2]).resolve())
    cases = sorted(
        Path(path) for argument in sys.argv[3:] for path in argument.split()
    )
    if len(cases) != 38 or len(set(cases)) != len(cases):
        raise RuntimeError(f"Expected all 38 pinned Test262 cases, got {len(cases)}")
    failures = []
    count = 0
    with tempfile.TemporaryDirectory() as directory:
        script = Path(directory) / "case.js"
        for case in cases:
            source = case.read_text()
            metadata = source.split("/*---", 1)[1].split("---*/", 1)[0]
            # This suite currently uses only inline include lists and default
            # strict/sloppy scenarios. Fail on new execution modes, never skip.
            if re.search(r"^(flags|negative):", metadata, re.MULTILINE):
                raise RuntimeError(f"Unsupported Test262 execution mode: {case}")
            match = re.search(r"^includes: \[([^\]]*)\]", metadata, re.MULTILINE)
            includes = ["sta.js", "assert.js"]
            if match:
                includes.extend(name.strip() for name in match[1].split(","))
            root = next(parent for parent in case.parents if parent.name == "test")
            harness = root.parent / "harness"
            if not harness.exists():
                # copy_to_bin materializes harness files in Bazel's output tree.
                harness = Path(os.environ["TEST_SRCDIR"]) / root.parent.name / "harness"
            prelude = "\n".join((harness / name).read_text() for name in includes)
            for strict in (False, True):
                count += 1
                script.write_text(
                    ('"use strict";\n' if strict else "") + prelude + "\n" + source
                )
                command = [runner]
                if "Intl.Locale" in metadata:
                    command.append("--prelude=" + locale_prelude)
                command.append(str(script))
                result = subprocess.run(
                    command, capture_output=True, text=True, timeout=30
                )
                if result.returncode:
                    failures.append(
                        {
                            "case": case.name,
                            "scenario": "strict" if strict else "default",
                            "error": (result.stderr or result.stdout).strip(),
                        }
                    )
    report = {
        "cases": len(cases),
        "executions": count,
        "passed": count - len(failures),
        "failures": failures,
    }
    output = os.environ.get("TEST_UNDECLARED_OUTPUTS_DIR")
    if output:
        Path(output, "results.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    return bool(failures)


if __name__ == "__main__":
    sys.exit(main())
