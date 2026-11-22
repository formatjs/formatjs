"""Verify the packed-data offset-spread premise without executing Temporal."""
import argparse
import hashlib
import json
from pathlib import Path

DAY = 86_400
# Native whole-second lookup can retain the final explicit row for one more second.
WINDOW = 6 * DAY + 1


def scan(packed_path: Path, expected_sha256: str) -> dict:
    raw = packed_path.read_bytes()
    sha256 = hashlib.sha256(raw).hexdigest()
    if sha256 != expected_sha256:
        raise ValueError(f"Packed data SHA256 {sha256} != {expected_sha256}")
    tail = raw.decode().split("} = ", 1)[1]
    table, _ = json.JSONDecoder().raw_decode(tail.lstrip())
    offsets = [int(n, 36) for n in table["offsets"].split("|")]
    maximum = 0
    witness = None
    failures = []
    explicit_rows = 0
    seams = 0
    future_profiles = 0
    for zone in table["zones"]:
        name, initial, *rows = zone.split("|")
        initial_fields = initial.split(",")
        assert initial_fields[0] == ""
        active = offsets[int(initial_fields[2])]
        assert abs(active) < DAY
        events = []
        for row in rows:
            packed_time, _, offset_index, _ = row.split(",")
            transition = int(packed_time, 36)
            assert not events or events[-1][0] < transition
            next_offset = offsets[int(offset_index)]
            assert abs(next_offset) < DAY
            events.append((transition, (active, next_offset)))
            active = next_offset
        explicit_rows += len(events)
        future = table.get("future", {}).get(name)
        if future:
            future_profiles += 1
            footer_offsets = {
                future["standardOffset"],
                future.get("daylightOffset", future["standardOffset"]),
            }
            assert all(abs(offset) < DAY for offset in footer_offsets)
            assert max(footer_offsets) - min(footer_offsets) <= DAY
            if events:
                # A footer takes over immediately after this final explicit
                # instant. Allow BOTH footer offsets at the cutoff. This also
                # covers switches within the same or neighboring seconds.
                seams += 1
                cutoff, endpoint_offsets = events[-1]
                events[-1] = (cutoff, tuple(sorted(set(endpoint_offsets) | footer_offsets)))
            else:
                # Packed future lookup may start at negative infinity. Even
                # the union with the initial value satisfies the bound.
                possible_offsets = footer_offsets | {active}
                assert max(possible_offsets) - min(possible_offsets) <= DAY
        left = 0
        for right, (end, _) in enumerate(events):
            while end - events[left][0] > WINDOW:
                left += 1
            covered = events[left:right + 1]
            possible_offsets = [offset for _, values in covered for offset in values]
            low, high = min(possible_offsets), max(possible_offsets)
            spread = high - low
            if spread > maximum:
                maximum = spread
                witness = {
                    "zone": name,
                    "first_epoch": covered[0][0],
                    "last_epoch": end,
                    "low_offset": low,
                    "high_offset": high,
                }
            if spread > DAY:
                failures.append({"zone": name, "end_epoch": end, "spread": spread})
    return {
        "packed_sha256": sha256,
        "zones": len(table["zones"]),
        "explicit_rows": explicit_rows,
        "future_profiles": future_profiles,
        "explicit_footer_seams": seams,
        "window_seconds": WINDOW,
        "maximum_offset_spread_seconds": maximum,
        "maximum_witness": witness,
        "failures": failures,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("packed", type=Path, help="Exact packed Bazel artifact")
    parser.add_argument("expected_sha256", help="Published audit artifact hash")
    args = parser.parse_args()
    result = scan(args.packed, args.expected_sha256)
    print(json.dumps(result, indent=2))
    if result["failures"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
