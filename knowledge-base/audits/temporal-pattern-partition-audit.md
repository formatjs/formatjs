# Shared pattern partition audit

Reviewed 2026-11-21 against published
[ECMA-402 §9.2.15 PartitionPattern](https://tc39.es/ecma402/#sec-partitionpattern).
This dependency feeds Temporal's owned DateTimeFormat bridge through
PartitionDateTimePattern and FormatDateTimePattern. It also serves date ranges,
RelativeTimeFormat and ListFormat. Their full operations remain open.

## Input and representation

[§6.10 Pattern String Types](https://tc39.es/ecma402/#sec-pattern-string-types)
provides the input precondition: private pattern text with nonempty ASCII word
placeholder names. This helper does not accept arbitrary public values or
perform public input coercion. Locale-data validation remains the caller's job.
Malformed braces reach an implementation assertion; their error shape is outside
PartitionPattern's specified input domain.

A fresh dense array represents the specification List. Object literals represent
its Records, with own type/value fields, including an own undefined value for
placeholders. Captured setDataProperty appends by defining the next own numeric
property. Mutable Array.prototype methods and inherited numeric setters cannot
intercept List appends. See [data-property evidence](temporal-parts-result-audit.md#data-property-creation).

## Numbered steps to code

All source links refer to
[PartitionPattern.ts](../../packages/ecma402-abstract/PartitionPattern.ts).

| Published step                     | Source                                                        | Evidence                                                                                |
| ---------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1: empty result List               | [12](../../packages/ecma402-abstract/PartitionPattern.ts#L12) | Array literal allocates a fresh empty private array.                                    |
| 2: placeholderEnd = -1             | [13](../../packages/ecma402-abstract/PartitionPattern.ts#L13) | Initial sentinel makes the first literal start at zero.                                 |
| 3: initial StringIndexOf           | [14](../../packages/ecma402-abstract/PartitionPattern.ts#L14) | Captured string indexOf searches for the first opening brace at zero.                   |
| 4: repeat while found              | [15](../../packages/ecma402-abstract/PartitionPattern.ts#L15) | -1 represents not-found; no public iterator runs.                                       |
| 4.a: leading/intervening substring | [16](../../packages/ecma402-abstract/PartitionPattern.ts#L16) | Start is previous closing brace + 1; end excludes the next opening brace.               |
| 4.b.i: append nonempty literal     | [20](../../packages/ecma402-abstract/PartitionPattern.ts#L20) | Empty literals are omitted. Record fields remain type then value.                       |
| 4.c: closing-brace search          | [26](../../packages/ecma402-abstract/PartitionPattern.ts#L26) | Search starts at placeholderStart.                                                      |
| 4.d: assertion                     | [30](../../packages/ecma402-abstract/PartitionPattern.ts#L30) | End greater than start also excludes the -1 sentinel. Valid Pattern Strings satisfy it. |
| 4.e: placeholder name              | [31](../../packages/ecma402-abstract/PartitionPattern.ts#L31) | Extracts between the braces without conversion or normalization.                        |
| 4.f: append placeholder Record     | [35](../../packages/ecma402-abstract/PartitionPattern.ts#L35) | Own type is the name; own value is undefined. Repeated names produce separate Records.  |
| 4.g: next opening brace            | [39](../../packages/ecma402-abstract/PartitionPattern.ts#L39) | Search starts at placeholderEnd, exactly as specified.                                  |
| 5: trailing substring              | [44](../../packages/ecma402-abstract/PartitionPattern.ts#L44) | Omitting end means the complete remaining suffix.                                       |
| 6.a: append nonempty tail          | [45](../../packages/ecma402-abstract/PartitionPattern.ts#L45) | Same literal Record construction; no empty trailing part.                               |
| 7: return                          | [51](../../packages/ecma402-abstract/PartitionPattern.ts#L51) | Returns the ordered private List representation.                                        |

## String operations

[Lines 4–6](../../packages/ecma402-abstract/PartitionPattern.ts#L4) capture
Reflect.apply, String.prototype.indexOf and String.prototype.substring at module
initialization. Subsequent mutation of those public properties does not affect
private parsing.

For primitive String operands, captured
[ECMA-262 §22.1.3.9 indexOf](https://tc39.es/ecma262/#sec-string.prototype.indexof)
performs the same [§6.1.4.1 StringIndexOf](https://tc39.es/ecma262/#sec-stringindexof)
search after identity String conversion and exact nonnegative integer position
conversion. Its -1 result models not-found. Captured
[§22.1.3.25 substring](https://tc39.es/ecma262/#sec-string.prototype.substring)
receives ordered in-range integer indices, so its clamping/swap rules do not
change the required substring. Omitted end selects string length. Both operations
use UTF-16 code units: supplementary characters and unpaired surrogates in
literals survive unchanged. Neither operation consults user conversion hooks
for the specified primitive inputs.

## Evidence and limits

[PartitionPattern.test.ts](../../packages/ecma402-abstract/tests/PartitionPattern.test.ts)
covers empty input, a literal-only pattern, a placeholder-only pattern, adjacent
repeated placeholders, the literal-name prose witness `{literal}`,
leading/intervening/trailing literals, and Unicode
boundaries. Eight mutation controls cover string search, substring, push,
inherited index/type/value setters, a descriptor getter, and replacement
Reflect.apply. Four controls failed on the previous implementation: indexOf,
substring, push and the numeric setter. No producer is mocked.

All 15 parser cases pass; the core helper suite passes 234 tests across 23
files. Twenty focused gates passed (10 executed, 10 cached). The expanded 165-target
consumer run finished with 164 passing targets and one raw strict diagnostic
failing as detailed below (42 executed, 123 cached). All eight package assemblies
built: Temporal, DateTimeFormat, Collator, DurationFormat, NumberFormat, Locale,
RelativeTimeFormat and ListFormat. The `{literal}` description conflict is recorded as a
[separate specification issue](temporal-spec-issues.md#partitionpattern-literal-placeholder-versus-result-description). This review does not close mutable
hooks in FormatDateTimePattern's dependencies, PartitionDateTimeRangePattern, MakePartsList or
ListFormat's deconstructPattern. It adds no Temporal chapter/line credit.

The expanded inventory includes `//packages/intl-listformat:test262-strict`
as a raw diagnostic. It executes 162 scenarios and fails the same two
`constructor/constructor/proto-from-ctor-realm.js` scenarios (default and strict)
recorded in [the existing baseline](../../packages/intl-listformat/test262-baseline.json).
Both report `TypeError: Intl.ListFormat must be called with 'new'`.
The observed failure keys and messages exactly equal that baseline; no baseline
or exclusion changed. The corresponding baseline target remains a distinct
regression gate. These constructor failures are still open and are not parser
or Temporal compliance credit.

## Legacy corrected range collapse

Confirmed against the Bazel Temporal package on Node. Install
`polyfill-force.js`, create `Intl.DateTimeFormat('en', {calendar: 'buddhist',
year: 'numeric', era: 'short', timeZone: 'UTC'})`, then call
`formatRangeToParts(-79302585600000, -79271049600000)`. The two local calendar
years are 0 and 1. Both display as 1 BE. The patched formatter produces a single
shared year part. Constructing matching Buddhist `Temporal.PlainDate` endpoints
reproduces the same failure. The numeric host range has separate start and end
year parts.

The compatibility fallback in
[`joinCalendarRangeParts`](../../packages/temporal/legacy-lunisolar-date.ts)
compares display text. ECMA-402 §11.5.8 steps 15.d.v–vi compare local fields
before step 16 can collapse the range. §11.5.4 step 15.f.iv converts a
nonpositive year for display. The fallback needs the original year comparison.
[Published range algorithm](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).
[Published display conversion](https://tc39.es/ecma402/#sec-formatdatetimepattern).
