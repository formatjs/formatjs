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
ENDPOINT_REFERENCE_SHA256 = "89c844ed15b71034e54a284769113a7e0c1604eb8dca94793ea5b061a90a1485"
ENDPOINT_FIXTURE_SHA256 = "aead4c9869d43e85ebc525f37315e305cc7f7f9791fd8933036f4cb1c92c89e9"
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


def reader_fixture(text):
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
    return text


def endpoint_fixture(text):
    text = replace_once(
        text,
        "const rows = []",
        """const rows = []
const projections = []
const cycle = 146_097 * DAY
assert.equal(windowDays, 11)
const offset = (cal, epoch) => {
  checked(setMillis, cal, epoch)
  assert.equal(checked(getMillis, cal), epoch)
  return checked(get, cal, UCAL_ZONE_OFFSET) + checked(get, cal, UCAL_DST_OFFSET)
}""",
    )
    return replace_once(
        text,
        "  rows.push(result)",
        """  rows.push(result)
  assert.deepEqual(result.lower.nearby, [], id)
  const lo = LIMIT - WINDOW - cycle
  const hi = LIMIT + WINDOW - cycle
  const projected = scan(cal, lo, hi).nearby
  const expected = result.upper.nearby.map(({at, before, after}) => ({
    at: at - cycle, before, after,
  }))
  assert.deepEqual(projected, expected, id)
  const lower = [-LIMIT, -LIMIT + 2 * DAY, -LIMIT + WINDOW].map(epoch => {
    const actual = offset(cal, epoch)
    assert.equal(actual, offset(cal, -LIMIT - WINDOW), id)
    return [epoch, actual]
  })
  const endpoints = [
    LIMIT - WINDOW, LIMIT - 2 * DAY, LIMIT - 1, LIMIT,
    LIMIT + 1, LIMIT + 2 * DAY, LIMIT + WINDOW,
  ]
  for (const {at} of result.upper.nearby) endpoints.push(at - 1, at)
  const upper = [...new Set(endpoints)].map(epoch => {
    const actual = offset(cal, epoch)
    assert.equal(actual, offset(cal, epoch - cycle), id)
    return [epoch - cycle, actual]
  })
  projections.push({id, lower, upper, lo, hi, expected: expected.map(({at}) => at)})""",
    )


def prepare(scratch, project_endpoints):
    scratch.mkdir(parents=True, exist_ok=True)
    proof = Path(__file__).resolve().parent
    scanner = proof / "node-icu" / (
        "temporal-node-icu-endpoint-scan.mjs"
        if project_endpoints
        else "temporal-node-icu-transition-separation.mjs"
    )
    runtime = scanner.parent / "temporal-pinned-icu-runtime.mjs"
    text = replace_once(
        scanner.read_text(),
        "import {loadPinnedIcu} from './temporal-pinned-icu-runtime.mjs'",
        "import {writeFileSync} from 'node:fs'\nimport {loadPinnedIcu} from "
        + repr(runtime.as_uri()),
    )
    if project_endpoints:
        text = endpoint_fixture(text)
        name, value = "projections", "projections"
    else:
        text = reader_fixture(text)
        name, value = "fixtures", "runtimeComparisons"
    text += (
        "\nwriteFileSync(" + repr(str(scratch / "fixtures.js")) + ", "
        f"'globalThis.{name} = ' + JSON.stringify({value}) + '\\n')\n"
    )
    (scratch / "collect.mjs").write_text(text)
    (scratch / "probe.html").write_bytes(
        (proof / "chromium-reader-probe.html").read_bytes()
    )


def read_browser_result(scratch, label, binary):
    assert sha256(binary) == BROWSER_SHA256[label]
    assert sha256(binary.parent / "icudtl.dat") == DATA_SHA256
    dom = (scratch / f"{label}.html").read_text()
    payload = re.search(r'<pre id="result">(.*?)</pre>', dom, re.S)
    assert payload is not None, f"No proof result in {label}.html"
    return json.loads(html.unescape(payload[1]))


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
        recorded = read_browser_result(scratch, label, binary)
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


def verify_endpoints(scratch, browsers):
    assert sha256(scratch / "fixtures.js") == ENDPOINT_FIXTURE_SHA256
    reference = scratch / "reference.json"
    assert sha256(reference) == ENDPOINT_REFERENCE_SHA256
    rows = json.loads(reference.read_text())["rows"]
    assert len(rows) == 638 and all(not row["lower"]["nearby"] for row in rows)
    changes = [event for row in rows for event in row["upper"]["nearby"]]
    assert len(changes) == 4
    assert all(
        event["at"] == 8_640_000_000_000_000 - 504_000_000
        and event["after"] - event["before"] == 3_600_000
        for event in changes
    )
    for label, binary in browsers.items():
        recorded = read_browser_result(scratch, label, binary)
        assert recorded == {
            "zones": 638,
            "nativeZones": 597,
            "offsets": 6_388,
            "next": 1_198,
            "previous": 1_198,
            "mismatches": [],
        }
        (scratch / f"{label}.json").write_text(json.dumps(recorded, indent=2) + "\n")
        print(f"{label}: 638 Intl IDs, 597 Temporal IDs, 8784 checks, zero mismatches")


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("operation", choices=("prepare", "verify"))
parser.add_argument("scratch", type=Path)
parser.add_argument("--pplx", type=Path, default=Path("/opt/pplx-chromium/chrome"))
parser.add_argument("--debian", type=Path, default=Path("/usr/lib/chromium/chromium"))
parser.add_argument("--endpoint-projection", action="store_true")
if __name__ == "__main__":
    args = parser.parse_args()
    if args.operation == "prepare":
        prepare(args.scratch.resolve(), args.endpoint_projection)
    else:
        verifier = verify_endpoints if args.endpoint_projection else verify
        verifier(args.scratch, {"pplx": args.pplx, "debian": args.debian})
