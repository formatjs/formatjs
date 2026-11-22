# Rendered amendment inconsistencies

Pinned Temporal comparison retrieved 2026-11-21; SHA-256
`fc35bf6d3ae565bd8984f44b1f5740ec8024743215f82af818f0f48ad57ef22e`.
These are comparison-text inconsistencies, separate from implementation gaps.
Requested ECMA-262 authority remains unchanged. No new runtime failure claimed.

## Plain range comparison timezone

[§15.6.8 steps12–13](https://tc39.es/proposal-temporal/#sec-partitiondatetimerangepattern)
uses the formatter timezone to compare both records. Its steps24.b/27.e forward
IsPlain to formatting, whose §15.6.4 step12 uses UTC for Plain fields.

Two PlainDateTime values on 2024-11-03 at05:30 and06:30 therefore compare as
01:30/01:30 with America/New_York under the literal range comparison, but their
required Plain output fields remain05:30/06:30. A collapsed single-value result
cannot display both. Implementation consistently uses UTC for Plain comparison
and display. Preserve that coherent behavior; do not adopt the mismatched zone.

## Sparse range interval records

English UTC h23 PlainTime 01:02:03 to 01:02:04 also exposes a separate
range-table question. The raw interval map supplies date and default fields.
With that map, the literal cutoff stops at missing AmPm before comparing
Second and collapses the range. FormatJS and pinned native Intl show both
endpoints. Whole-loop correspondence still needs a justified abstract record
representation or resolution of the cutoff rule.
[Temporal comparison §15.6.8 steps 23.b–d and 24](https://tc39.es/proposal-temporal/#sec-partitiondatetimerangepattern).
[Source and endpoint evidence](temporal-pattern-partition-audit.md#day-period-values-and-private-interval-metadata).

The prepared lookup itself returns the own interval or undefined. Source
uses that lookup when it reaches an unequal field, then supplies the fallback
if needed. The comparison also uses the presence value on earlier equal
fields to control the cutoff. That scheduling and selection stay open.

### Hidden AmPm prevents a record-only reconciliation

The current published
[ECMA-402 §11.5.8 steps15.c–d](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern)
retains the same cutoff and mandatory AmPm comparison as
[Temporal comparison §15.6.8 steps23.c–d](https://tc39.es/proposal-temporal/#sec-partitiondatetimerangepattern).
Both were checked on 2026-11-22. This issue also reaches numeric Date inputs;
it does not depend on Plain timezone projection.

Use one `new DateTimeFormat('ja', {timeZone: 'UTC', dayPeriod: 'long'})`.
The selected owned pattern is `{dayPeriod}`; its raw interval map has only
`default`, with `{0}～{1}` endpoint parts. On 2024-01-01:

- `00:00:00Z` to `23:00:00Z`: both singles are `夜中`. Owned and pinned
  Node 24.14.0 native Intl return one shared `夜中` part.
- `00:00:00Z` to `04:00:00Z`: singles are `夜中` and `朝`. Owned returns
  `夜中～朝`, with distinct endpoint sources. Native returns shared `夜中`.

No fixed presence layout can make the literal comparison reproduce both
owned decisions. For the first pair to collapse, the cutoff must disable
comparison before AmPm: its hours necessarily give different am/pm values.
Both pairs have identical date fields and the same fixed interval map, so
the cutoff state through AmPm is identical. That cutoff would also skip
DayPeriod for the second pair and collapse it. Keeping comparison enabled
instead forces the first pair to remain distinct. Changing interval strings
cannot change this flag contradiction.

Filling sparse records with fallback entries therefore cannot, by itself,
justify the existing loop. A comparison-policy change is needed to preserve
both owned outputs. This proof does not choose a normative replacement
output or promote native Intl to the specification. Remaining row statuses
stay unchanged. Hindi and Russian give the same cross-AmPm/same-AmPm
counterexample shape.
[Public replay](temporal-range-dayperiod-replay.mjs) records both providers;
the raw selected-record diagnostic was read-only, with one scratch export
of the existing slot accessor.

## Duplicate digital Duration group

[§15.9.8 steps4.e.i–iii](https://tc39.es/proposal-temporal/#sec-partitiondurationformatpattern)
first appends a numeric group directly, then obtains the same group again and
appends it when nonempty. Both appends are active in the pinned rendered HTML.
A nonempty digital hours group would appear twice literally.

Implementation formats each group once. Keep that behavior; this text defect
does not justify duplicate output or a new formatter implementation.
