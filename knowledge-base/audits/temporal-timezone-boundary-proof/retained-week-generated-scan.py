"""Scan offset transitions near the two Instant limits in pinned packed data."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

DAY = 86_400
LIMIT = 100_000_000 * DAY
WINDOW = 11 * DAY


def prove(boundary_summary, source):
    proof = Path(__file__).with_name("proof.py")
    spec = importlib.util.spec_from_file_location("temporal_boundary_proof", proof)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    summary = json.loads(boundary_summary.read_text())
    recorded_path = next(
        name
        for name in summary["source_hashes"]
        if Path(name).name == "all-tz.ts"
    )
    packed_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    assert packed_hash == summary["source_hashes"][recorded_path]
    data = mod.literal(source, "} = ")
    nearby = []
    for zone in data["zones"]:
        name, _, *finite = zone.split("|")
        future = data.get("future", {}).get(name)
        latest = None
        for row in finite:
            t, _, _, _ = row.split(",")
            t = int(t, 36)
            assert latest is None or latest < t, name
            assert abs(t + LIMIT) > WINDOW and abs(t - LIMIT) > WINDOW, name
            latest = t
        if not future:
            continue
        standard = future["standardOffset"]
        daylight = future.get("daylightOffset", standard)
        if standard == daylight:
            continue
        # Every dynamic rule in this actual bundle takes over at a historical
        # finite cutoff, so there are no recurring events near the lower bound.
        assert latest is not None
        assert -LIMIT + WINDOW < latest < LIMIT - WINDOW
        events = (("start", standard, daylight), ("end", daylight, standard))
        for year in range(275759, 275762):
            for kind, before, after in events:
                epoch = mod.rule(year, future[kind]) - before
                if abs(epoch - LIMIT) <= WINDOW:
                    nearby.append({
                        "zone": name,
                        "t": epoch,
                        "signedDistance": epoch - LIMIT,
                        "before": before,
                        "after": after,
                    })
    assert not any(r["after"] < r["before"] for r in nearby)
    return {
        "packed_sha256": packed_hash,
        "zones": len(data["zones"]),
        "window_seconds": WINDOW,
        "no_changes_near_lower": True,
        "no_negative_changes_near_upper": True,
        "upper_positive_changes": nearby,
    }


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("packed", type=Path)
    p.add_argument(
        "--summary", type=Path, default=Path(__file__).with_name("generated-summary.json")
    )
    args = p.parse_args()
    print(json.dumps(prove(args.summary, args.packed), indent=2))
