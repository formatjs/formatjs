"""Replay the pinned Debian SpiderMonkey shell against its embedded ICU."""

import argparse
from hashlib import sha256
import json
import os
from pathlib import Path
from runpy import run_path
from subprocess import run

PROOF = Path(__file__).resolve().parent
LIB_DIRECTORY = "usr/lib/x86_64-linux-gnu"
SHELL = f"{LIB_DIRECTORY}/mozjs-128/js128"
LIBRARY = f"{LIB_DIRECTORY}/libmozjs-128.so.128.14.0"
DEBUG = "usr/lib/debug/.build-id/3e/fb9353c166a4f342d57cb5a94d9d892b9cbea4.debug"
SHELL_HASH = "74db3480550b34b2ecdcf21671c5efe33f32adcab6e6ea6ed8b63831e073a5f1"
LIBRARY_HASH = "02da7f2896c39b11877638edf4054ac7811fcd3d3a86540fef15494b4a2466e4"
DEBUG_HASH = "273caaa9dc08fda9c39dfbc33a9ddc085199ec645a120fc8d4a642f6e2395dc5"


def check_digest(path, expected):
    assert sha256(path.read_bytes()).hexdigest() == expected, path


def replay(root, debug, scratch, node, package):
    shell = root / SHELL
    library = root / LIBRARY
    debug_file = debug / DEBUG
    check_digest(shell, SHELL_HASH)
    check_digest(library, LIBRARY_HASH)
    check_digest(debug_file, DEBUG_HASH)
    libs = root / LIB_DIRECTORY
    assert (libs / "libmozjs-128.so.0").resolve() == library
    scratch.mkdir(parents=True, exist_ok=True)
    env = {"PATH": os.defpath, "LD_LIBRARY_PATH": str(libs)}

    def invoke(command):
        return run(command, cwd=scratch, env=env, check=True,
                   capture_output=True, text=True).stdout

    symbols = {}
    for line in invoke(["nm", debug_file]).splitlines():
        fields = line.split(maxsplit=2)
        if len(fields) != 3:
            continue
        address, _, name = fields
        if "icu_73" in name or name.startswith(("ucal_", "uenum_", "udat_")) or name == "_Z13JS_NewContextjP9JSRuntime":
            symbols[name] = f"0x{address}"
    (scratch / "spidermonkey-input.json").write_text(json.dumps({
        "library": str(library), "shellHash": SHELL_HASH, "symbols": symbols,
    }))
    (scratch / "temporal-pinned-icu-runtime.mjs").write_bytes(
        (PROOF / "spidermonkey-icu-runtime.mjs").read_bytes()
    )

    shared = run_path(str(PROOF / "chromium-reader-replay.py"))
    replace = shared["replace_once"]
    zones = invoke([shell, "-e", 'print(JSON.stringify(Intl.supportedValuesOf("timeZone")))'])
    assert len(json.loads(zones)) == 468
    (scratch / "advertised-zones.json").write_text(zones)
    for name, args, output in [
        ("endpoint-scan", [], "endpoints.json"),
        ("transition-separation", ["--direct-annual"], "spacing.json"),
        ("rule-spread", [], "spread.json"),
    ]:
        scanner = (PROOF / "node-icu" / f"temporal-node-icu-{name}.mjs").read_text()
        scanner = "import {readFileSync, writeFileSync} from 'node:fs'\n" + scanner
        scanner = replace(scanner, "assert.equal(version, process.versions.tz)",
                          "assert.equal(version, '2025a')")
        scanner = replace(scanner, "Intl.supportedValuesOf('timeZone')",
                          "JSON.parse(readFileSync('advertised-zones.json'))")
        scanner = replace(scanner, "icu: process.versions.icu", "icu: 'bundled-73'")
        if args:
            scanner = shared["reader_fixture"](scanner)
            scanner += "\nwriteFileSync('boundaries.json', JSON.stringify(runtimeComparisons))\n"
        script = scratch / "scan.mjs"
        script.write_text(scanner)
        (scratch / output).write_text(invoke([node, "--experimental-ffi", script, *args]))

    html = (PROOF / "chromium-reader-probe.html").read_text()
    script = scratch / "public.js"
    script.write_text("""\
const navigator = {userAgent: 'Debian SpiderMonkey 128.14.0'}
const document = {querySelector: () => ({set textContent(value) { print(value) }})}
globalThis.fixtures = JSON.parse(read('boundaries.json'))
""" + html.split("<script>", 1)[1].split("</script>", 1)[0])
    public = invoke([shell, script])
    (scratch / "public.json").write_text(public)
    result = json.loads(public)
    assert result["zones"]["bound"] == 597 and len(result["zones"]["unsupported"]) == 40
    assert set(result["zones"]["unsupported"]).isdisjoint(json.loads(zones))
    assert result["checks"]["nativeTransitions"] == 0
    assert result["errors"] == {"intl": 0, "temporal": 0}, result["mismatches"]
    endpoints = json.loads((scratch / "endpoints.json").read_text())
    assert endpoints["zones"] == 637
    assert all(not row[side]["nearby"] for row in endpoints["rows"] for side in ("lower", "upper"))
    spacing = json.loads((scratch / "spacing.json").read_text())
    assert not spacing["short"] and not spacing["supplementalEffective"]
    assert spacing["minGap"] == 597_600_000
    spread = json.loads((scratch / "spread.json").read_text())
    assert spread["maximumCertifiedSpread"] == 86_400_000
    boundaries = json.loads((scratch / "boundaries.json").read_text())
    assert max(
        after - before for row in boundaries
        for _, before, after in row["expectedBoundaries"]
    ) == 86_400_000
    assert all(
        instant % 1000 == before % 1000 == after % 1000 == 0
        for row in boundaries for instant, before, after in row["expectedBoundaries"]
    )
    print(json.dumps(result["checks"], sort_keys=True))
    if package is not None:
        args = [str(scratch / "boundaries.json"), str(package), str(scratch / "public.json")]
        results = invoke([
            shell, "-e", f"globalThis.scriptArgs = {json.dumps(args)}",
            "-m", PROOF / "jsc-temporal-package-probe.mjs",
        ])
        (scratch / "package.json").write_text(results)
        assert json.loads(results)["failures"] == 0, results
        print(results, end="")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path, help="Debian shell and library extraction root")
    parser.add_argument("debug", type=Path, help="matching Debian debug package extraction root")
    parser.add_argument("scratch", type=Path)
    parser.add_argument("--node", type=Path, required=True, help="absolute Node 26 executable")
    parser.add_argument("--temporal", type=Path, help="Bazel-built Temporal package index.js")
    args = parser.parse_args()
    replay(args.root.resolve(), args.debug.resolve(), args.scratch.resolve(), args.node.resolve(),
           args.temporal.resolve() if args.temporal else None)
