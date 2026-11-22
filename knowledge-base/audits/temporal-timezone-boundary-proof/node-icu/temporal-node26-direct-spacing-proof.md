# Pinned ICU recurring offset spacing

Scope is the two hash-bound Linux x64 Node 26 executables in
[the existing runtime binding](temporal-pinned-icu-runtime.mjs).
Node 24 still requires a direct replay with the diagnostic ABI.
The generated registry and separate endpoint and six-day certificates
keep their existing scope.

The forward transition API alone leaves a completeness premise. Its annual
rule reader starts at the UTC year of its search base, so it can miss a
previous nominal year's rule that spills forward after another change has
moved the search base past January 1. It also returns the two nominal rule
starts, while the offset calculator compares actual date fields and can
clamp a day or use an unshifted month length after adjusting the clock.
[Annual start reader](https://github.com/unicode-org/icu/blob/release-78.3/icu4c/source/i18n/tzrule.cpp#L280).
[Actual offset comparator](https://github.com/unicode-org/icu/blob/release-78.3/icu4c/source/i18n/simpletz.cpp#L411).

## Complete candidate set

- Olson reads the finite transition arrays, then transfers to its final zone
  at UTC January 1 of the final year. Include the UTC finite starts exposed
  by its rule extraction and the January 1 join. Unexposed leading finite
  records match the initial offset, and unexposed trailing records lie past
  the join. A final zone with a constant offset supplies its join as a
  finite UTC rule start.
  [Olson resource and offset routing](https://github.com/unicode-org/icu/blob/release-78.3/icu4c/source/i18n/olsontz.cpp#L190).
  [Olson rule extraction](https://github.com/unicode-org/icu/blob/release-78.3/icu4c/source/i18n/olsontz.cpp#L635).
- A recurring Olson final zone supplies two permanent SimpleTimeZone rules.
  Read each nominal start directly with `AnnualTimeZoneRule::getStartInYear`.
  Use the other rule's raw and DST offsets exactly as
  `SimpleTimeZone::getNextTransition` does. The offsets agree in raw
  component, and all raw, DST and total magnitudes are below one day.
  UTC rules use UTC clock, standard rules use UTC plus raw offset, and
  wall rules use UTC plus the outgoing total offset.
  [Rule construction and previous-state arguments](https://github.com/unicode-org/icu/blob/release-78.3/icu4c/source/i18n/simpletz.cpp#L917).
- Each SimpleTimeZone comparison starts with local standard fields. Its
  adjustment uses UTC clock or adds the DST amount when required. Between
  boundaries of the original and adjusted months, the comparison's date
  threshold is fixed. The month lengths stay fixed and the difference
  between weekday and day-of-month is constant modulo seven. Include each
  month boundary in UTC, standard and daylight coordinates, and the rule's
  clock crossing on every day within 16 days of the nominal annual start.
  Rule clock and coordinate agree with the direct nominal start. The
  maximum date displacement is 15 days. A month length changes the anchor
  by at most three days, and each weekday calculation adjusts its anchor
  by at most six days. This also covers the exact day-of-month leap clamp
  and a 24:00 rule clock. Candidate clocks remain in the nominal year,
  verified by each direct start's margin exceeding 16 days. Actual UTC
  offset calculations use local standard fields in a single pass.
  [UTC-to-standard offset calculation](https://github.com/unicode-org/icu/blob/release-78.3/icu4c/source/i18n/timezone.cpp#L665).
  [Rule date adjustment and comparison](https://github.com/unicode-org/icu/blob/release-78.3/icu4c/source/i18n/simpletz.cpp#L532).
- After the joins, weekday of January 1 and that year's Gregorian length
  determine the year's rule clocks and all monthly boundaries. A pair
  within two days lies in one UTC year or two adjacent years. The
  adjacent-year signature adds the next year's length. December and
  January lengths stay fixed, so the UTC/standard/daylight shifts across
  the outer edges need no extra leap bit. Start representative signatures
  two calendar years after the latest final join or finite rule year and
  include their entire two-year intervals. A 400-year Gregorian cycle
  contains every possible signature.
- Probe actual calendar offset at candidate millisecond minus one and
  candidate millisecond for every supplemental candidate, every candidate
  adjacent to another within two days, and every candidate in a zone whose
  decoded total spread permits a whole-day jump. An actual close pair
  cannot have a point absent from this conservative candidate geometry.
  Unprobed events contribute an upper count and a lower bound on spacing.

## Reproduce

From the proof directory and with the clean environment required by the
existing runtime binding, run the scanner once for each exact Node ELF.

```sh
"$node26_bin" --experimental-ffi temporal-node-icu-transition-separation.mjs \
  --direct-annual > node26-direct-spacing.json
```

The [compact result](node26-direct-spacing-summary.json) lists executable and
complete output hashes. Each Node
26 run has zero effective pairs within two days and 13 positive whole-day
jumps, counting aliases. The lower bound on spacing is 597,600,000 ms.
The minimum nominal-start distance to a UTC year edge is 4,712,400,000 ms.

Pass both complete outputs to this reduction to reproduce the compact JSON.

```sh
python3 - node2651-direct-spacing.json node2681-direct-spacing.json <<'PY'
import hashlib
import json
import sys
from pathlib import Path

results = []
for name in sys.argv[1:]:
    raw = Path(name).read_bytes()
    row = json.loads(raw)
    zones = row.pop('rows')
    row['zoneCount'] = len(zones)
    row['annualZoneCount'] = sum(zone['annualRuleCount'] > 0 for zone in zones)
    row['minimumAnnualYearMarginMilliseconds'] = min(
        zone['minimumAnnualYearMargin']
        for zone in zones
        if zone['minimumAnnualYearMargin'] is not None
    )
    row['lastRepresentativeCutMilliseconds'] = max(zone['cut'] for zone in zones)
    row['fullResultSha256'] = hashlib.sha256(raw).hexdigest()
    results.append(row)
print(json.dumps(results, indent=2))
PY
```
