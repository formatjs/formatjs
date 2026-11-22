"""Exhaustive fixed-transition and Gregorian final-rule spacing for exact packed bytes."""
import hashlib
import json
import runpy
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

proof = runpy.run_path(str(Path(sys.argv[1]).resolve()))
rule = proof["rule"]
packed = Path(sys.argv[2])
raw = packed.read_bytes()
sha = hashlib.sha256(raw).hexdigest()
assert sha == "c62e83781c612170917463fac92be16e174510edfc6a84c66bcec67dc10beb0d"
data, _ = json.JSONDecoder().raw_decode(raw.decode().split("} = ", 1)[1])
offsets = [int(x, 36) for x in data["offsets"].split("|")]
day = 86400
min_gap = 1 << 100
min_names = []
short = []
whole_day_gaps = []
seam_count = 0
seam_failures = []
counts = Counter()
rows = []
for record in data["zones"]:
    name, initial, *historical = record.split("|")
    active = offsets[int(initial.split(",")[2])]
    entries = []
    for row in historical:
        stamp, _, index, _ = row.split(",")
        at, offset = int(stamp, 36), offsets[int(index)]
        if active != offset:
            entries.append((at, active, offset))
        active = offset
    counts["effectiveHistorical"] += len(entries)

    future = data.get("future", {}).get(name)
    if future:
        cutoff = int(historical[-1].split(",")[0], 36) if historical else None
        std = future["standardOffset"]
        dst = future.get("daylightOffset", std)
        final = std
        if std != dst:
            assert cutoff is not None
            year = datetime.fromtimestamp(cutoff, timezone.utc).year
            next_events = {}
            for y in range(year - 2, year + 403):
                start = rule(y, future["start"]) - std
                end = rule(y, future["end"]) - dst
                next_events.setdefault(end, std)
                next_events[start] = dst  # Start wins coincident all-year-DST rules.
            final_at = max(t for t in next_events if t <= cutoff)
            final = next_events[final_at]
        if cutoff is not None:
            seam_count += 1
            # TS millisecond and native whole-second cutoffs differ slightly.
            # Footer state is checked at both sides of that short seam.
            locations = [cutoff, cutoff + 1]
            if std == dst:
                values = [std for _ in locations]
            else:
                values = [next_events[max(t for t in next_events if t <= at)] for at in locations]
            if any(x != active for x in values):
                seam_failures.append(dict(name=name, cutoff=cutoff, active=active, values=values))

        if std != dst:
            assert cutoff is not None
            footer_active = final
            for stamp in sorted(t for t in next_events if t > cutoff):
                value = next_events[stamp]
                if value != footer_active:
                    entries.append((stamp, footer_active, value))
                    counts["effectiveRecurring"] += 1
                footer_active = value
    for at, before, after in entries:
        if after - before == day:
            whole_day_gaps.append(dict(zone=name, at=at, before=before, after=after))
    this_min = min((right[0]-left[0] for left,right in zip(entries, entries[1:])), default=None)
    if this_min is not None:
        if this_min < min_gap:
            min_gap = this_min
            min_names = [name]
        elif this_min == min_gap:
            min_names.append(name)
        if this_min <= day * 2:
            short.append(dict(name=name, spacingSeconds=this_min))
    rows.append(dict(zone=name, minGapSeconds=this_min))
print(json.dumps(dict(packedSha256=sha, zones=len(data["zones"]), seams=seam_count, seamFailures=seam_failures,
                      counts=dict(counts), minimumGapSeconds=min_gap, minimumGapNames=min_names,
                      short=short, positiveWholeDayJumps=whole_day_gaps, rows=rows), indent=2))
