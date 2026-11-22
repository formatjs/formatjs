"""Replay Debian JavaScriptCoreGTK Intl against its exact loaded ICU rules."""

import argparse
from hashlib import sha256
import json
import os
from pathlib import Path
from runpy import run_path
from subprocess import run

PROOF = Path(__file__).resolve().parent
ICU_SCANNERS = PROOF / "node-icu"
LIB_DIRECTORY = "usr/lib/x86_64-linux-gnu"
SHELL = "usr/bin/jsc"
HASHES = {
    SHELL: "a641388e2017651d1627859af071ed3cc2f27452faf620cc15e386db6d337b2d",
    f"{LIB_DIRECTORY}/libjavascriptcoregtk-4.1.so.0.11.10": (
        "27d94722fd285c9ca6ead741b7ec7bc66a059bc84f17267731afc9169dd748d1"
    ),
    f"{LIB_DIRECTORY}/libicudata.so.76.1": (
        "a04b2b906193fa1e40f968a3d16d7d6c844a1fafbdd5bce6e9f67b01c124ff24"
    ),
    f"{LIB_DIRECTORY}/libicui18n.so.76.1": (
        "596132c352dc25d1e8a1f91e2c5790262ed02376d27afc14b545a1952341b3fc"
    ),
    f"{LIB_DIRECTORY}/libicuuc.so.76.1": (
        "a8e433e81075732faf255b17d4a25ce28632e41fef1a75e727ee7f4ed73ab151"
    ),
}


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def replay(root, scratch, node, package):
    shared = run_path(str(PROOF / "chromium-reader-replay.py"))
    replace = shared["replace_once"]
    for name, expected in HASHES.items():
        assert digest(root / name) == expected, name
    libs = root / LIB_DIRECTORY
    for soname, version in [
        ("libjavascriptcoregtk-4.1.so.0", "libjavascriptcoregtk-4.1.so.0.11.10"),
        ("libicudata.so.76", "libicudata.so.76.1"),
        ("libicui18n.so.76", "libicui18n.so.76.1"),
        ("libicuuc.so.76", "libicuuc.so.76.1"),
    ]:
        assert (libs / soname).resolve() == libs / version, soname
    jsc = root / SHELL
    scratch.mkdir(parents=True, exist_ok=True)
    env = {"PATH": os.defpath, "LD_LIBRARY_PATH": str(libs)}

    def invoke(command, **overrides):
        return run(
            command, cwd=scratch, env=env | overrides,
            check=True, capture_output=True, text=True,
        )

    jsc_intl = invoke([
        jsc, "-e",
        'new Intl.DateTimeFormat("en", {timeZone:"America/New_York"}).formatToParts(0); '
        'print(JSON.stringify(Intl.supportedValuesOf("timeZone")))',
    ], LD_DEBUG="bindings")
    for origin, target, symbol in [
        ("libicuuc.so.76", "libicudata.so.76", "icudt76_dat"),
        ("libjavascriptcoregtk-4.1.so.0", "libicui18n.so.76", "udat_open_76"),
        ("libjavascriptcoregtk-4.1.so.0", "libicui18n.so.76", "udat_formatForFields_76"),
    ]:
        assert any(
            f"binding file {libs / origin} " in line
            and f"to {libs / target} " in line
            and f"`{symbol}'" in line
            for line in jsc_intl.stderr.splitlines()
        ), symbol
    (scratch / "bindings.log").write_text(jsc_intl.stderr)
    (scratch / "jsc-zones.json").write_text(jsc_intl.stdout)
    (scratch / "temporal-pinned-icu-runtime.mjs").write_text(f"""\
import {{DynamicLibrary, toString}} from 'node:ffi'
export async function loadPinnedIcu() {{
  const lib = new DynamicLibrary({json.dumps(str(libs / "libicui18n.so.76.1"))})
  return {{binarySha256: '{HASHES[SHELL]}', icuMajor: '76', lib, toString}}
}}
""")

    for name, args, output in [
        ("endpoint-scan", [], "endpoints.json"),
        ("transition-separation", ["--direct-annual"], "spacing.json"),
        ("rule-spread", [], "spread.json"),
    ]:
        scanner = (ICU_SCANNERS / f"temporal-node-icu-{name}.mjs").read_text()
        scanner = "import {readFileSync, writeFileSync} from 'node:fs'\n" + scanner
        scanner = replace(scanner, "assert.equal(version, process.versions.tz)",
                          "assert.equal(version, '2024b')")
        scanner = replace(scanner, "Intl.supportedValuesOf('timeZone')",
                          "JSON.parse(readFileSync('jsc-zones.json'))")
        scanner = replace(scanner, "icu: process.versions.icu", "icu: '76.1 (Debian)'")
        if args:
            scanner = shared["reader_fixture"](scanner)
            scanner += "\nwriteFileSync('boundaries.json', JSON.stringify(runtimeComparisons))\n"
        script = scratch / "scan.mjs"
        script.write_text(scanner)
        (scratch / output).write_text(invoke([node, "--experimental-ffi", script, *args]).stdout)

    html = (PROOF / "chromium-reader-probe.html").read_text()
    public_replay = html.split("<script>", 1)[1].split("</script>", 1)[0]
    script = scratch / "public.js"
    script.write_text("""\
const navigator = {userAgent: 'Debian JavaScriptCoreGTK 2.54.3'}
const document = {querySelector: () => ({set textContent(value) { print(value) }})}
globalThis.fixtures = JSON.parse(readFile('boundaries.json'))
""" + public_replay)
    public = invoke([jsc, script]).stdout
    (scratch / "public.json").write_text(public)
    result = json.loads(public)
    assert len(json.loads(jsc_intl.stdout)) == 444
    assert result["zones"]["bound"] == 598 and len(result["zones"]["unsupported"]) == 39
    assert not result["zones"]["nativeUnsupported"]
    assert set(result["zones"]["unsupported"]).isdisjoint(json.loads(jsc_intl.stdout))
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
        after - before
        for row in boundaries
        for _, before, after in row["expectedBoundaries"]
    ) == 86_400_000
    assert all(
        instant % 1000 == before % 1000 == after % 1000 == 0
        for row in boundaries
        for instant, before, after in row["expectedBoundaries"]
    )
    print(json.dumps(result["checks"], sort_keys=True))
    if package is not None:
        results = invoke([
            jsc, "-m", PROOF / "jsc-temporal-package-probe.mjs", "--",
            scratch / "boundaries.json", package, scratch / "public.json",
        ]).stdout
        (scratch / "package.json").write_text(results)
        assert json.loads(results)["failures"] == 0, results
        print(results, end="")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path, help="dpkg-deb extraction root")
    parser.add_argument("scratch", type=Path)
    parser.add_argument("--node", type=Path, required=True, help="absolute Node 26 executable")
    parser.add_argument("--temporal", type=Path, help="Bazel-built Temporal package index.js")
    args = parser.parse_args()
    replay(args.root.resolve(), args.scratch.resolve(), args.node.resolve(),
           args.temporal.resolve() if args.temporal else None)
