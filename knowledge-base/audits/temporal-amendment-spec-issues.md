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

## Duplicate digital Duration group

[§15.9.8 steps4.e.i–iii](https://tc39.es/proposal-temporal/#sec-partitiondurationformatpattern)
first appends a numeric group directly, then obtains the same group again and
appends it when nonempty. Both appends are active in the pinned rendered HTML.
A nonempty digital hours group would appear twice literally.

Implementation formats each group once. Keep that behavior; this text defect
does not justify duplicate output or a new formatter implementation.
