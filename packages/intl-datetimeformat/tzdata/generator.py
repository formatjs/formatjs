"""Compile pinned tzdata and decode TZif with pinned CPython's zoneinfo parser."""

import json
from pathlib import Path
import shutil
import subprocess
import sys
from zoneinfo._common import load_data
from zoneinfo._zoneinfo import _parse_tz_str


def transition_rule(rule):
    result = {"seconds": rule.hour * 3600 + rule.minute * 60 + rule.second}
    if hasattr(rule, "m"):
        result.update(kind="month", month=rule.m, week=rule.w, weekday=rule.d)
    else:
        result.update(kind="julian" if rule.julian else "day", day=rule.d)
    return result


def read_zone(path, name):
    with path.open("rb") as source:
        indices, times, offsets, daylight, names, footer = load_data(source)
    if not offsets:
        raise ValueError(f"No local time types: {name}")
    initial = [None, names[0], offsets[0], daylight[0]]
    transitions = []
    for timestamp, index in zip(times, indices):
        entry = [timestamp, names[index], offsets[index], daylight[index]]
        if timestamp < -8_640_000_086_400:
            initial = [None, *entry[1:]]
        elif timestamp <= 8_640_000_086_400:
            transitions.append(entry)
    result = {"name": name, "transitions": [initial, *transitions]}
    if footer:
        parsed = _parse_tz_str(footer.decode("ascii"))
        if hasattr(parsed, "start"):
            result["future"] = {
                "standardOffset": int(parsed.std.utcoff.total_seconds()),
                "daylightOffset": int(parsed.dst.utcoff.total_seconds()),
                "start": transition_rule(parsed.start),
                "end": transition_rule(parsed.end),
            }
        else:
            result["future"] = {
                "standardOffset": int(parsed.utcoff.total_seconds())
            }
    return result


def main():
    manifest_path, zic_path, work_path = map(Path, sys.argv[1:])
    manifest = json.loads(manifest_path.read_text())
    zic_dir = work_path.resolve() / "zic"
    shutil.rmtree(work_path, ignore_errors=True)
    zic_dir.mkdir(parents=True)
    try:
        subprocess.run(
            [str(zic_path.resolve()), "-d", str(zic_dir), *manifest["sources"]],
            check=True,
        )
        backward = Path(manifest["backward"]["output"])
        backward.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(manifest["backward"]["source"], backward)
        for zone in manifest["zones"]:
            output = Path(zone["output"])
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(json.dumps(read_zone(zic_dir / zone["name"], zone["name"])) + "\n")
    finally:
        shutil.rmtree(work_path, ignore_errors=True)
        work_path.mkdir(parents=True)


if __name__ == "__main__":
    main()
