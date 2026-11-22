"""Prepare and verify the pinned Chromium timezone reader replay."""

import argparse
import hashlib
import html
import json
from pathlib import Path
import re

DATA_SHA256 = "02a01b3188b6a41a756f7322fdb5e6b5ca6573b327b01dfc8ed662d571a6f769"
REFERENCE_SHA256 = "bc581c942b1b23dd486d612124255e5a6efdfd3397c81ffbc1f4058f2078006f"
FIXTURE_SHA256 = "43aa148a769be6f1a07228da4c9d754e9c48087333c78898dae166b123b12a92"
BROWSER_SHA256 = {
    "pplx": "7ccca93a192f7fc808244ff68a04f0cb3a548d1c2cf3facd11199ba39643d50f",
    "debian": "240a189df25934b7191e35bda7a62e76ffb3decac4a454b0a0bf67f8462c8c92",
}


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def replace_once(text, before, after):
    if text.count(before) != 1:
        raise ValueError(f"Expected one scanner marker {before!r}")
    return text.replace(before, after)


def prepare(scratch):
    scratch.mkdir(parents=True, exist_ok=True)
    proof = Path(__file__).resolve().parent
    scanner = proof / "node-icu/temporal-node-icu-transition-separation.mjs"
    runtime = scanner.parent / "temporal-pinned-icu-runtime.mjs"
    text = replace_once(
        scanner.read_text(),
        "import {loadPinnedIcu} from './temporal-pinned-icu-runtime.mjs'",
        "import {writeFileSync} from 'node:fs'\nimport {loadPinnedIcu} from "
        + repr(runtime.as_uri()),
    )
    text = replace_once(
        text, "const rows = []", "const rows = []\nconst runtimeComparisons = []"
    )
    marker = "  const short = []"
    text = replace_once(
        text,
        marker,
        """  const expectedBoundaries = []
  for (const t of [...candidateTimes].sort((a,b)=>a-b)) {
    if (t > -LIMIT && t <= LIMIT)
      expectedBoundaries.push([t,actual(c,t-1),actual(c,t)])
  }
  const endpoints = [
    -LIMIT,-LIMIT+1,-LIMIT+2*DAY,-LIMIT+11*DAY,
    LIMIT-11*DAY,LIMIT-2*DAY,LIMIT-1,LIMIT
  ].map(t => [t,actual(c,t)])
  runtimeComparisons.push({id,cut,expectedBoundaries,endpoints})
"""
        + marker,
    )
    text += (
        "\nwriteFileSync(" + repr(str(scratch / "fixtures.js")) + ", "
        "'globalThis.fixtures = ' + JSON.stringify(runtimeComparisons) + '\\n')\n"
    )
    (scratch / "collect.mjs").write_text(text)
    (scratch / "probe.html").write_bytes(
        (proof / "chromium-reader-probe.html").read_bytes()
    )


def verify(scratch, browsers):
    fixture_file = scratch / "fixtures.js"
    assert sha256(fixture_file) == FIXTURE_SHA256
    assert sha256(scratch / "reference.json") == REFERENCE_SHA256
    fixtures = json.loads(
        fixture_file.read_text().removeprefix("globalThis.fixtures = ")
    )
    assert len(fixtures) == 638
    assert sum(len(row["expectedBoundaries"]) for row in fixtures) == 43_198
    assert sum(
        before != after
        for row in fixtures
        for _, before, after in row["expectedBoundaries"]
    ) == 42_744
    assert all(
        time < row["cut"]
        for row in fixtures
        for time, _, _ in row["expectedBoundaries"]
    )

    for label, binary in browsers.items():
        assert sha256(binary) == BROWSER_SHA256[label]
        assert sha256(binary.parent / "icudtl.dat") == DATA_SHA256
        dom = (scratch / f"{label}.html").read_text()
        payload = re.search(r'<pre id="result">(.*?)</pre>', dom, re.S)
        assert payload is not None, f"No proof result in {label}.html"
        recorded = json.loads(html.unescape(payload[1]))
        assert recorded["zones"]["bound"] == 638
        assert not recorded["zones"]["unsupported"]
        excluded = set(recorded["zones"]["nativeUnsupported"])
        assert len(excluded) == 41
        active = sum(
            before != after
            for row in fixtures
            if row["id"] not in excluded
            for _, before, after in row["expectedBoundaries"]
        )
        assert active == 39_374
        assert recorded["checks"] == {
            "finiteOrRepresentative": 86_396,
            "endpoints": 5_104,
            "nativeTransitions": active + 597,
        }
        assert recorded["errors"] == {"intl": 0, "temporal": 0}
        assert not recorded["mismatches"]
        (scratch / f"{label}.json").write_text(json.dumps(recorded, indent=2) + "\n")
        print(f"{label}: 638 Intl IDs, 597 Temporal IDs, 131471 checks, zero mismatches")


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("operation", choices=("prepare", "verify"))
parser.add_argument("scratch", type=Path)
parser.add_argument("--pplx", type=Path, default=Path("/opt/pplx-chromium/chrome"))
parser.add_argument("--debian", type=Path, default=Path("/usr/lib/chromium/chromium"))
args = parser.parse_args()
if args.operation == "prepare":
    prepare(args.scratch.resolve())
else:
    verify(args.scratch, {"pplx": args.pplx, "debian": args.debian})
