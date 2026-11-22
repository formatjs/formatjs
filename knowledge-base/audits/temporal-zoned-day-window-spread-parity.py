"""Bind the packed offset data to the compact and native generated profiles."""
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys


def compare(summary_path: Path) -> dict:
    proof_path = summary_path.with_name("proof.py")
    spec = importlib.util.spec_from_file_location("boundaryproof", proof_path)
    p = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(p)
    summary = json.loads(summary_path.read_text())
    inputs = {}
    for name, sha in summary["source_hashes"].items():
        path = Path(name)
        assert hashlib.sha256(path.read_bytes()).hexdigest() == sha, name
        inputs[path.name] = path
    packed = p.literal(inputs["all-tz.ts"], "} = ")
    compact = p.literal(inputs["temporal-compact.ts"], " = ")
    offsets = [int(v, 36) for v in packed["offsets"].split("|")]
    rows = {}
    futures = packed.get("future", {})
    for zone in packed["zones"]:
        name, initial, *events = zone.split("|")
        offset = offsets[int(initial.split(",")[2])]
        values = []
        for event in events:
            t, _, offset_id, _ = event.split(",")
            values.append((int(t, 36), offsets[int(offset_id)]))
        rows[name] = (offset, values)
    assert compact["zones"].keys() == rows.keys()
    for name, (initial_id, future_id, fixed, spans) in compact["zones"].items():
        events = [
            (fixed[i], compact["offsets"][fixed[i + 1]])
            for i in range(0, len(fixed), 2)
        ]
        for i in range(0, len(spans), 4):
            first, last, rule_id, offset_id = spans[i : i + 4]
            events.extend(
                (p.rule(year, compact["rules"][rule_id]), compact["offsets"][offset_id])
                for year in range(first, last + 1)
            )
        initial, original = rows[name]
        assert compact["offsets"][initial_id] == initial, name
        footer = compact["futures"][future_id] if future_id >= 0 else None
        assert footer == futures.get(name), name
        expected = []
        previous = initial
        for index, (transition, offset) in enumerate(original):
            if previous != offset or index == len(original) - 1:
                expected.append((transition, offset))
            previous = offset
        assert sorted(events) == expected, name

    def rule(r):
        kind = r["kind"]
        if kind == "month":
            return (
                "TransitionRule::Month { month: %d, week: %d, weekday: %d, seconds: %d }"
                % (r["month"], r["week"], r["weekday"], r["seconds"])
            )
        style = "Day" if kind == "day" else "Julian"
        return f"TransitionRule::{style} {{ day: {r['day']}, seconds: {r['seconds']} }}"

    def future(f):
        if f is None:
            return "None"
        if "daylightOffset" not in f:
            pair = "None"
        else:
            pair = f"Some(({f['daylightOffset']}, {rule(f['start'])}, {rule(f['end'])}))"
        return f"Some(checked_future({f['standardOffset']}, {pair}))"

    native = set()
    for line in inputs["timezones_data.rs"].read_text().splitlines():
        record = re.fullmatch(
            r'TimeZoneRecord \{ identifier: "([^"]+)", provider: checked_zone\((-?\d+), &\[(.*)\], (.*)\) \},',
            line,
        )
        if not record:
            continue
        name, initial, events, footer = record.groups()
        got = [
            (int(t), int(offset))
            for t, offset in re.findall(
                r"OffsetTransition \{ epoch_seconds: (-?\d+), offset_seconds: (-?\d+) \}",
                events,
            )
        ]
        assert rows[name] == (int(initial), got), name
        assert future(futures.get(name)) == footer, name
        assert name not in native, name
        native.add(name)
    assert len(native) == summary["native_zones"]
    return {
        "source_hashes": summary["source_hashes"],
        "compact_zones": len(compact["zones"]),
        "native_zones": len(native),
        "initial_offsets_match": True,
        "explicit_offset_events_match": True,
        "recurrence_data_matches": True,
    }


if __name__ == "__main__":
    print(json.dumps(compare(Path(sys.argv[1])), indent=2))
