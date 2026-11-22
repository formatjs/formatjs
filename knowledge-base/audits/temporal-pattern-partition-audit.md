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
years are 0 and 1. Both display as 1 BE. Before the fix, the patched formatter produced a single shared year part. Constructing matching Buddhist `Temporal.PlainDate` endpoints
reproduced the same failure. The numeric host range has separate start and end
year parts.

The compatibility fallback in
[`joinCalendarRangeParts`](../../packages/temporal/legacy-lunisolar-date.ts)
compared display text alone. ECMA-402 §11.5.8 steps 15.d.v–vi compare local fields
before step 16 can collapse the range. §11.5.4 step 15.f.iv converts a
nonpositive year for display.

[Endpoint restoration](../../packages/temporal/legacy-calendar-date.ts#L449)
retains the raw year when the endpoint renders a year part. The
[range caller](../../packages/temporal/legacy-calendar-date.ts#L914) prevents
collapse for distinct raw years. The generic fallback still supplies the layout when the host layout cannot be verified.
[Published range algorithm](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).
[Published display conversion](https://tc39.es/ecma402/#sec-formatdatetimepattern).

The Bazel `//packages/temporal:legacy_display_year_test` regression failed before
the fix with one shared year. Afterward, all eight new controls passed across
Number and PlainDate endpoints, two year widths, and two numbering systems.
Equal-endpoint controls still pass. All seven focused Bazel targets passed.

- Before-fix log SHA-256 `7410a4c9ed0be713a89ff46d4d76ce5a0012a12e7cc97b04137445544074739a`
- After-fix log SHA-256 `aee459ae57dfdbea159d3a9b2c0d96112b45cde2d527687871325c570d3b4a49`

### Reuse the selected host range

The Buddhist numeric-year witness also showed a layout difference. The host
selects two year tokens with one shared era. The generic fallback rendered the
era twice. The native range comparison carries the locale-specific layout.

For unclipped numeric-year and era partitions, the bridge checks a common
calendar era, distinct raw year labels, and complete endpoint partitions that
differ only in the normalized year. It reuses the evaluated host pattern when
native range parts contain identifiable start and end year tokens. It changes
their text in place and preserves literals, order, era placement and source.
The two-digit ambiguity check prevents rewriting a token using the wrong
year width. Other patterns and unverifiable host profiles still rely on the
generic fallback. [ECMA-402 §11.5.8](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).

The Bazel regression failed on the duplicated era before the change. It passed
afterward for numeric and PlainDate inputs with Latin and mathematical digits.
All seven focused Bazel targets passed.

- Before-fix log SHA-256 `8fbf1aaa7aad5b04e1e0a847e48bb9e035b288538df5f3b1330c07794a060d80`
- After-fix log SHA-256 `d66ed1c98879697a5a6cbefb6dd18bce3270ecfa285579f1b13b0d45de424740`

### Numeric months in the selected range

The year-zero and year-one Buddhist endpoints also reproduced duplicated era
labels with an explicit numeric month. Both months are January. The host
selects a native Year range pattern with one shared era. The bridge now keeps
that layout when the raw and corrected endpoint months agree with the owned
localized ordinal. Each range month must match its source endpoint. A shared
month must match both endpoints.

The regression compares full range parts and string output for Number and
PlainDate inputs in Latin and mathematical digits. The control with a stale
native day verifies that the fallback still supplies the corrected day.
The full range-part assertion failed before the fix. All seven final Bazel
targets passed.
[ECMA-402 §11.5.8 steps 15.d and 19](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).

- Numeric-month before-fix log SHA-256 `4a17efe6e24309168402c1ca59232a7dd0fce7e6d9ee96536cf657a77b4ce29a`
- Numeric-month after-fix log SHA-256 `281532f210f656c27c3eb227b9d080b67264e5ae80949e18fa1182638de2c297`

### Numeric days in the selected range

For Buddhist year zero through year one, the host selected a Year range with a
shared era and supplied days from its calendar approximation. Compare range
day parts with the original native endpoints before substituting the corrected
numeric days. A shared part requires both raw and corrected days to agree.
Ambiguous widths fall back to complete endpoints.

Number and PlainDate controls cover Latin and mathematical digits. The full
range-part regression failed before the fix. All seven focused Bazel targets
passed after it.
[ECMA-402 §11.5.8 steps 15.d and 19](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).

- Numeric-day before-fix log SHA-256 `61cd4dc6e86ebae853eb18b57aabea5ccc258c24f47dbb1632c41e92e5f84bb5`
- Numeric-day after-fix log SHA-256 `5bf4ad81c58769725c7568fcb1ab4c1162db9a0bd7a563699ad6db601936fd21`

### Numeric width in the selected range

Pinned Node 24 and 26 reproduce padded Buddhist month and day in the
English single-value pattern and unpadded month and day in the range.
The bridge used complete endpoint patterns and repeated the common era.
The selected interval now keeps its own width. The original endpoint
labels establish the source day. The native range label identifies its
width before the corrected day is rendered. Month labels must match the
corrected ordinal. Shared parts must pass both endpoint checks.

German padded intervals and English mathematical digits exercise both
widths. Raw day 11 with corrected day 5 keeps the full endpoint fallback
because the native label has the same text at either width. Seven focused
Bazel targets pass.
[Width restoration](../../packages/temporal/legacy-calendar-date.ts#L606).
[ECMA-402 §11.5.8 step 19.e](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).
[ECMA-402 §11.5.4 steps 15.f.v and 15.f.viii–ix](https://tc39.es/ecma402/#sec-formatdatetimepattern).

- Width before-fix log SHA-256 `0589dc3806aaa0a58d2439d09e2a2a4c26ea569ee7731035ec2b8d58bfcde019`
- Width after-fix log SHA-256 `a5ff8d542bbfdfd08ffe899390e2945aa4b1ddebb7c5c3936774e3ce71327231`

### Verified weekday labels in the selected range

English Buddhist ranges with short weekday and numeric year, month and day
printed the common era twice. The original endpoints and corrected parts
agree on their Thursday and Saturday labels. The bridge retains the selected
Year pattern when each weekday matches its tagged endpoint. A shared weekday
must match both endpoints. Weekday is a renderable field in the selected
pattern, while Year still determines the range pattern.
[ECMA-402 §11.2.3.2 Table 6](https://tc39.es/ecma402/#table-datetime-range-pattern-record).
[ECMA-402 §11.5.8 steps 15.d and 19.e–f](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).
[Weekday source check](../../packages/temporal/legacy-calendar-date.ts#L634).

Number and PlainDate tests check full strings and tagged range parts.
The original path fails the regression. Seven focused Bazel targets and
the Node 26.8.1 replay pass.

- Weekday before-fix log SHA-256 `9e9243ec53ba046475085ea887ff4d6bbe4ce9ec2cd4c0573f172952e1533e0a`
- Weekday after-fix log SHA-256 `8168999da92cc8d785fdd21a10fa0401caca5e46db63eceb6f6d6d712f973a25`
- Node 26 replay log SHA-256 `49e341188e2698974422f833efca36c462b53914949679dfadc507a29cf5d0c9`

### Textual month labels in a Year range

An English Buddhist January interval with distinct raw years duplicated
its common era. The bridge now keeps the native textual month after checking
the original endpoint's numeric month against the owned calendar value.
The selected layout supplies its own width and day context. A shared month
requires matching ordinals at both endpoints.

Russian controls distinguish `январь` without a day field from `января`
with one. June and July both abbreviate to English narrow `J`. The
ordinal check keeps the existing fallback when native July and owned June
produce the same text. Number and PlainDate controls exercise both paths.
Seven focused Bazel targets and all 161 controls on pinned Node 26.8.1 pass.
[Numeric month probe](../../packages/temporal/legacy-lunisolar-date.ts#L65).
[Range label check](../../packages/temporal/legacy-calendar-date.ts#L644).
[ECMA-402 §11.5.4 step 15.f.x](https://tc39.es/ecma402/#sec-formatdatetimepattern).
[ECMA-402 §11.5.8 step 19.e](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).

- Textual-month before-fix log SHA-256 `e7544ef6f182e29e211008f1a040b7b03aa7b9384e38df0406a66ec423f222d0`
- Textual-month after-fix log SHA-256 `2e9b5a43fbc27b397a3420d0268cef7c463f2ddd8c60032164e7515069fb6fd0`
- Node 26 replay log SHA-256 `f038fb3d74fba677757ec96bc162b8af93d097c83c2d447d3b3af730fef450cd`

### Distinct narrow months and a shared year

In a Buddhist month-only range, native ICU gives both ISO June 26 and
July 1 the July ordinal. The owned calendar gives June and July, but both
narrow labels are `J`. A native or fallback collapse loses the endpoint
distinction. The bridge now checks original month ordinals before reusing
the native range and uses owned ordinals when deciding whether corrected
endpoints can collapse. June 1 through June 26 tests the reverse, where
the owned month is the same at both endpoints.

For June 1 through July 1 with the numeric Buddhist year displayed, the
verified native Month range shares the year. Reuse preserves its layout
and corrects the shared year once both endpoints agree on its source and
display values. Number and PlainDate tests check complete parts and
strings. Seven focused Bazel targets and all 167 pinned Node 26.8.1
controls pass.
[Month identity check](../../packages/temporal/legacy-calendar-date.ts#L833).
[Shared year check](../../packages/temporal/legacy-calendar-date.ts#L689).
[ECMA-402 §11.5.8 steps 15.d.v–vi, 16 and 19.e](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).

- Narrow collapse before-fix log SHA-256 `bdae1e6d2186361116a9ab6ec85e70b378e8dc054422ca04ee5e7078e37be3fc`
- Narrow collapse after-fix log SHA-256 `365c6eea0f4a3433c6d291c77d41c94087d4a3adeaacd73d10e7616758ed2c90`
- Node 26 replay log SHA-256 `960e984acd820415ba033b0ef1efd0c8fd16e24e018142f19e6b08e20231db4b`

### Day-only Buddhist intervals with added calendar fields

For ISO June 1 and July 1 of year −543, the corrected day labels are both
`1`. The range still differs by Month. Its selected interval adds month
parts, giving `6/1 – 7/1` in English. The legacy fallback had collapsed
the range to a shared `1`.

For corrected UTC day-only ranges, shift both endpoints together by whole
Gregorian cycles and verify the host's year, month and day at both projected
instants. The shift preserves Year, Month and Day comparisons. Reuse the
selected pattern and restore any added year using the actual endpoint and
the interval's numeric width. The common shift also preserves endpoint
order across the Gregorian cycle seam.

Number and PlainDate controls check full strings and tagged parts in
English, German and mathematical digits. The cases cover Month and Year
intervals, same-day collapse and a cycle seam. Seven focused Bazel targets
and all 191 pinned Node 26.8.1 controls pass.
[Projected range](../../packages/temporal/legacy-calendar-date.ts#L750).
[ECMA-402 §11.5.8 steps 7–8, 15.d and 19.e](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).

- Day-only before-fix log SHA-256 `1cf05bfb34873415ba27d901033b8ed005168d8da558d8f947d2f547e6830e68`
- Day-only after-fix log SHA-256 `a71148a862d5a7053d07af78341cab9dc02ab580de4af312527f16671e689630`
- Node 26 replay log SHA-256 `0dc65ea3d19bc5e6b946b7235fe04b02da5058c5d4cb594fa896abe0c88b024d`

### Two-digit Buddhist year intervals

The legacy bridge emitted `01 BE – 01 BE` for Buddhist years zero and one
with a two-digit year and short era. The native interval places the era
once. The bridge now reuses the verified common-cycle projection for
UTC two-digit year ranges with only year and era date parts. The original
calendar year is normalized and rendered at the selected pattern's width.

Distinct centuries can have identical raw or corrected two-digit labels.
Projecting and verifying full years keeps the Year pattern and its tagged
endpoints in those cases. Number and PlainDate controls cover centuries,
negative zero and mathematical digits. Seven focused Bazel targets and
all 203 controls on pinned Node 26.8.1 pass.
[Full-year selection](../../packages/temporal/legacy-calendar-date.ts#L855).
[ECMA-402 §11.5.8 steps 15.d.v–vi and 19.e](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).
[ECMA-402 §11.5.4 steps 15.f.iv and 15.f.ix](https://tc39.es/ecma402/#sec-formatdatetimepattern).

- Two-digit before-fix log SHA-256 `f98f9709c3c314552e13d6450bd2c3bee0bd96e71f9c8b0d3b04c8795d22edf3`
- Two-digit after-fix log SHA-256 `af067546dd2ea1153f92236b349075a97aacf98bb5e59c03ef52b3ba21b73395`
- Node 26 replay log SHA-256 `844d575c8c2dca1a23c7f7ef6fed7b69b5b5d82daa89b081b6478731d06ac6b6`
