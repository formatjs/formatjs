# Compact and native timezone data binding

The read-only parity scan compares exact configured inputs whose hashes are in
`temporal-timezone-boundary-proof/generated-summary.json`. It expands all fixed
and recurring compact rows, compares every initial offset and offset event to
packed, and checks each future rule. Compact intentionally drops interior
explicit rows that leave offsets unchanged. It preserves the final explicit
cutoff row even when that row also leaves the offset unchanged. All 457
compact zones match. All 448 native records match the packed initial offsets,
full explicit rows and footer rule data.

Run from the workspace with the configured generated outputs available.

```sh
PYTHONDONTWRITEBYTECODE=1 python3 knowledge-base/audits/temporal-zoned-day-window-spread-parity.py \
  knowledge-base/audits/temporal-timezone-boundary-proof/generated-summary.json
```

Packed and compact share `TimeZoneOffset` and the core zoned kernel.
`TransitionZone::offset_nanoseconds` floors to integer seconds in Rust, so
the last explicit offset can remain in effect up to one second longer than
the TypeScript cutoff. The spread scan uses six days plus one second and
includes both footer offsets at each cutoff. This bounds all native six-day
windows even with that cutoff difference. Intervals wholly in the footer
can see at most its two certified offsets. Native compatible gap resolution
subtracts the active old offset at an event whose local before/after
boundaries contain the fixed-clock candidate. Its ordinary and fold paths
match active offsets at the candidate epoch. That supplies the effective
offset premise used by the ordered comparison, for successfully resolved
candidates. No transition enumeration completeness claim follows.
[Compact reconstruction](../../packages/temporal/compact-timezone.ts#L43)
[Native offset lookup](../../crates/temporal/timezone.rs#L280)
[Native candidate resolution](../../crates/temporal/zoned.rs#L407).

This data binding inherits the calendar round-trip and fixed-prefix
composition premises in the accompanying day-window proof. It covers
generated data only. Host profiles need independent offset-spread evidence.
