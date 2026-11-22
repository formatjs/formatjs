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

[Endpoint restoration](../../packages/temporal/legacy-calendar-date.ts#L469)
retains the raw year when the endpoint renders a year part. The
[range caller](../../packages/temporal/legacy-calendar-date.ts#L1073) prevents
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
[Width restoration](../../packages/temporal/legacy-calendar-date.ts#L626).
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
[Weekday source check](../../packages/temporal/legacy-calendar-date.ts#L654).

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
[Numeric month probe](../../packages/temporal/legacy-lunisolar-date.ts#L82).
[Range label check](../../packages/temporal/legacy-calendar-date.ts#L664).
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
[Month identity check](../../packages/temporal/legacy-calendar-date.ts#L944).
[Shared year check](../../packages/temporal/legacy-calendar-date.ts#L709).
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
[Projected range](../../packages/temporal/legacy-calendar-date.ts#L836).
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
[Full-year selection](../../packages/temporal/legacy-calendar-date.ts#L987).
[ECMA-402 §11.5.8 steps 15.d.v–vi and 19.e](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).
[ECMA-402 §11.5.4 steps 15.f.iv and 15.f.ix](https://tc39.es/ecma402/#sec-formatdatetimepattern).

- Two-digit before-fix log SHA-256 `f98f9709c3c314552e13d6450bd2c3bee0bd96e71f9c8b0d3b04c8795d22edf3`
- Two-digit after-fix log SHA-256 `af067546dd2ea1153f92236b349075a97aacf98bb5e59c03ef52b3ba21b73395`
- Node 26 replay log SHA-256 `844d575c8c2dca1a23c7f7ef6fed7b69b5b5d82daa89b081b6478731d06ac6b6`

### Verified Chinese and Dangi Day and Month intervals

UTC Chinese February 4–5, 1954 and Dangi February 27–28, 2017 have the same
month at both endpoints. The host reports days 1 and 2, while the owned
calendar reports days 2 and 3. The legacy bridge used complete endpoint
patterns and repeated the shared month. The corrected interval keeps the
shared month and replaces both tagged days.

The day-only controls cross into a distinct verified month with two
corrected day labels of `2`. The host Month interval contributes the
month parts even though the single-date pattern has none. The bridge
keeps them, preventing false collapse. The raw and owned related year and
month code must agree for each actual endpoint. The selected interval
must expose one verifiable day width per endpoint. Regular and leap month pairs and cross-year layouts are audited separately below.

The public checks compare full strings and tagged parts for Number and
PlainDate on both pinned Nodes. Seven focused Bazel targets pass. The
Node 26.8.1 replay passed 17,886 formatting checks, with 8,708 independent
fixture rows and 34 existing native data differences.
[Calendar comparison](../../packages/temporal/legacy-lunisolar-date.ts#L198).
[Range day restoration](../../packages/temporal/legacy-calendar-date.ts#L788).
[ECMA-402 §11.5.8 steps 15.d.v–vi and 19.e–f](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).

- Lunisolar interval before-fix log SHA-256 `283964d3fe82fab3249897d315b09dc67917be1aa5f2fb4421b02260072ad9f8`
- Lunisolar interval after-fix log SHA-256 `b7589393498eaddd48694f3e512e5241e082a81496735e6b4016f2fcec9ca5b5`
- Node 26 replay log SHA-256 `d121f935bdf85a1bbd0809e74c7b904f3406af7dfec4ffa332f22e80de54006c`

### Lunisolar year boundaries and leap month identity

The Chinese 1954 and Dangi 2017 year-boundary regressions have matching
native and owned related years and month codes at their corresponding
endpoints. The legacy fallback duplicated punctuation around the
sexagenary year. The bridge keeps the native punctuation and year labels
when the tagged related year and year name match the corrected endpoints.
It restores the corrected days at the selected interval widths.

On both pinned ICU builds, a same-numbered regular/leap pair can collapse
to a single month or share the regular month across two days. The bridge
checks month-code identity before accepting either output. It keeps an
unchanged native interval that supplies both endpoint months and otherwise
uses the corrected uncollapsed endpoints. Year-only ranges still collapse.
The exact locale layout of every leap-month fallback remains conditional.

The owned TS and Rust formatters compare month ordinals separately from the
number used for rendering. The generated TS probe reports ordinals 1 and 2
for regular Month 2 and leap Month 2 in both calendars.
[TS range comparison](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L207).
[Rust range comparison](../../crates/intl_datetimeformat/render.rs#L638).

Number and PlainDate controls cover full cross-year and leap-month parts.
Seven focused Bazel targets pass. Pinned Node 26.8.1 passes the 17,900
formatting checks.
[Native year labels](../../packages/temporal/legacy-calendar-date.ts#L769).
[Leap month comparison](../../packages/temporal/legacy-calendar-date.ts#L913).
[ECMA-402 §11.5.8 steps 15.d.v–vi, 16 and 19.e](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).

- Boundary before-fix log SHA-256 `ca53a63939f45909dae2ac7d3c76f9fb2a5b12f14d4bdeadda0496034760802e`
- Boundary after-fix log SHA-256 `daba90319a572472661d7416adf1a515ddbe158e4be221761c943a639fea5018`
- Node 26 replay log SHA-256 `e2137cb12d9e9a22a81de5533c9b82f50943aed6971276e260fc2c3011a991cc`

### Day-only leap-month intervals

For UTC Chinese and Dangi, the regular Month 4 and leap Month 4 of 2020
showed only the two days in the corrected fallback. Month is the first
differing ordinal field. Its interval pattern can introduce both month labels
even when the formatter itself displays only day.

Two same-year controls each retain one actual endpoint. They must
agree on the Day values, part types, sources and literals. Their Month values
must be tagged to both endpoints. The bridge takes each endpoint from its
original control, keeping locale-specific placement and widths. English uses
`4/1 – 4bis/1`; German retains leading zeroes. If the controls cannot supply exactly the requested days or their patterns disagree, the
existing fallback applies. Explicit-year and full-date layouts are verified below.

Number and PlainDate regressions cover both calendars, equal and differing day
fields, four locales and two pinned Node versions. Seven focused Bazel targets
pass. Node 26.8.1 passes 17,932 formatting checks.
[Month selection](../../packages/temporal/legacy-lunisolar-date.ts#L270).
[Range part sources](../../packages/temporal/legacy-lunisolar-date.ts#L278).
[ECMA-402 §11.5.8 steps 15.d.v–vi and 19.e–f](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).

- Before-fix log SHA-256 `380b322870e13b0504f30d727201b1d6547d6db29777fbe96488c62dc9397f5f`
- After-fix log SHA-256 `2539cda1937ed4b6e13e639c900b53c786eeb83cada82a23066593e81f6e61fb`
- Node 26 replay log SHA-256 `5950ba4e8d658981f13aceb2695c567a72b15448c4257f3302c3083cddfc9d7e`

### Leap-month year and weekday parts

English explicit long Month/year/day and full-date styles duplicated a closing
parenthesis before the separator in both calendars. Full-date controls also
distinguish the actual Thursday and Saturday from the representative weekdays.

The bridge first verifies that both single-date outputs agree with the
corrected endpoints. The two Month-pattern controls must agree on related year,
year name, Day values, part types, sources and punctuation. The bridge takes
each tagged weekday from its actual endpoint; a shared weekday must agree
across both controls. This preserves the host's placement of parentheses
without duplicating a closing parenthesis in the start endpoint.

Number and PlainDate regressions cover both calendars and equal and differing
day fields on pinned Node 24 and 26. Seven focused Bazel targets pass.
Node 26.8.1 passes 17,948 formatting checks. Layouts without two verified controls retain their fallback.
[Endpoint sources](../../packages/temporal/legacy-lunisolar-date.ts#L278).
[ECMA-402 §11.5.8 steps 15.d.v–vi and 19.c–f](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).

- Before-fix log SHA-256 `41f5ff591565108593b7f63c4c0af85312871acacaf89852723bd9fb8a92424a`
- After-fix log SHA-256 `58f0bc938a1061e4f64384a62507b6e52977bba7b34bcc1db6aadcb91aba3fc7`
- Node 26 replay log SHA-256 `677adb6c0cb5c5659f9e0331403f670157e306094fb15a5ac69c6ccc1698ec29`

### Same-year Month controls beyond neighboring months

For both calendars, 1933 regular Month 5 day 30 to leap Month 5 day 30
has no day 30 in either adjacent month. The bridge finds matching days in
Months 3 and 7 and preserves both Month labels. In 1909, regular Month 2
day 30 has no earlier matching day in that year. The bridge uses a later
month for the first argument of the second control. Native sources follow
argument position, so the actual leap endpoint keeps its end tag.

An independent month-length fixture sweep on both pinned Node hosts covers
61,570 Chinese pairs from 1900–2100 and 48,520 Dangi pairs from 1900–2050
whose host fields match the fixture. The sweep excludes 2,552 Chinese pairs
with differing host fields.
It finds same-year controls for 2,964 pairs lacking at least one adjacent
control and opposite-direction controls for the remaining 290 pairs.
No leap Month 1 or 12 appears in that fixture. Public package replay verifies
9,280 Number and PlainDate range-parts results per host for the 290 pairs,
covering eight locales and two styles. The packaged regression also checks
the 1933 and 1909 fixtures, with 17,996 formatting checks on Node 26.8.1.
Eight focused Bazel targets pass. If the host cannot supply both controls or
the outputs disagree about shared parts, the existing fallback applies.

[Same-year search](../../packages/temporal/legacy-lunisolar-date.ts#L270).
[Argument order](../../packages/temporal/legacy-lunisolar-date.ts#L272).
[ECMA-402 §11.5.8 steps 15.d.v–vi and 19.c–f](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).

- Day-30 before-fix log SHA-256 `4b93a68c85a682364e6667b58856d402c43019eadfd0a324aeb7a57f3c814be0`
- Reverse before-fix log SHA-256 `f91e371293b50096df18dc158ce6e43269ee9b15579e02147307e0f4f19689ac`
- After-fix log SHA-256 `fba386617202f791151b9578bf5c43e4ba26d922208c9c565d6ae2b2e77a8c3e`
- Node 26 packaged test SHA-256 `a30ee3119fd8d0dfdec6e6ca5fc8fed1ecc681501bff23e7dcce6c2fe5f5e4f6`
- Public replay hashes `fa7225c1cac7c6bd591207f2f32861b8dfed1a3c68ea366e754f5e32cbf1221e` and `92f48054bc8317cc787fc67bf9ed2ea7e4a0ffa60bbc821a2184a7be5c592e3a`

### UTC leap-month clock ranges

English day/hour/minute ranges lost both month labels. Chinese full date
plus short time used the base date's day glyph instead of the selected
interval's numeric day. French fractional ranges used an unpadded start
hour. The French Month pattern can omit month tokens when the base displays
only day and time. The bridge accepts that verified layout with both
endpoint sources. It requires two month labels when the base displays Month.

Same-year controls carry the endpoint clock after TimeClip, including the
nonnegative UTC time-within-day for pre-epoch dates. The selected layouts
must agree on the clock, day, other shared fields and literals. Source tags
and contextual widths come from the native controls.

Numeric Date and PlainDateTime public regressions check both calendars,
2020 and pre-epoch 1933, three locales, fractional numeric inputs and distinct
endpoint times including .123 and .456 seconds. The package declaration
gate and eight runtime targets pass. Pinned Node 26.8.1 passes 18,028
formatting checks. Other projection profiles and layouts lacking verified
controls remain conditional.

[Clock projection](../../packages/temporal/legacy-lunisolar-date.ts#L235).
[Range part sources and widths](../../packages/temporal/legacy-lunisolar-date.ts#L278).
[ECMA-262 §21.4.1.31 step 3](https://tc39.es/ecma262/#sec-timeclip).
[ECMA-262 §21.4.1.4 step 1](https://tc39.es/ecma262/#sec-timewithinday).
[ECMA-402 §11.5.8 steps 15.d.v–vi and 19.c–f](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).

The PlainDateTime full-date and short-time fixture retains the related year
and cyclical year. The rendered comparison allows Year for this kind and
retains the base style when no field conflicts. The pinned Node 26 native
PlainDateTime projection drops both ICU skeleton symbols; V8 main includes
them. The fixture uses paired native Numeric Date controls for the retained
style. [Temporal comparison §15.4.1 step 45.j](https://tc39.es/proposal-temporal/#sec-createdatetimeformat).
[Temporal comparison §15.6.2 steps 1–3](https://tc39.es/proposal-temporal/#sec-adjustdatetimestyleformat).
[Bridge style selection](../../packages/temporal/locale.ts#L267).
[Pinned V8 whitelist](https://github.com/nodejs/node/blob/v26.8.1/deps/v8/src/objects/js-date-time-format.cc#L1445-L1457).
[V8 main whitelist](https://github.com/v8/v8/blob/main/src/objects/js-date-time-format.cc#L1469-L1481).

- Before-fix clock log SHA-256 `7e15002d25cd0311e3de4bce4930c95477e74e92f21e10bfebac08711a49f85b`
- Before-fix French log SHA-256 `3ac6b7cda215b3bde84dd1bf4c5f98a9948985e0e465ff56b6f984a640e0c7c9`
- After-fix Bazel log SHA-256 `40c7ceb6dc655f6a9d1cc4b34bb1e200c57db8efd34870ca612cc2048d04dd4e`
- Node 26 packaged test SHA-256 `43a5781551d322c36c731eface3f7c541f8dcd65a9de00eabc8b91d95b595330`

### Owned private range records

An inherited `source` setter intercepted the collapsed and endpoint records
returned by partitioning. An inherited `localTime` setter intercepted the
private selected endpoint input before formatting. Owned `formatRange` and
`formatRangeToParts` both exposed these callbacks for PlainDate.

The formatter defines those fields as own data properties using the shared
intrinsic helper. Six public regressions cover collapsed and distinct sources
and the distinct local-time input. They require zero calls and the same parts
or string. Five focused Bazel targets pass, including the owned formatter,
shared formatter, Temporal integration, timezone range and declaration gates.

[Collapsed record](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L237).
[Selected local time](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L323).
[Endpoint record](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L338).
[Public controls](../../packages/intl-datetimeformat/tests/temporal-owned.test.ts#L94).
[ECMA-402 §11.5.8 steps 16.c.i, 19.e and 19.f.i](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).
[Temporal comparison §15.6.8 steps 24.c.i, 27.e and 27.f.i](https://tc39.es/proposal-temporal/#sec-partitiondatetimerangepattern).

The configured-zone comparison issue remains open when `[[IsPlain]]` is true.
The private record checks apply once a layout has been selected.

- Source before-fix log SHA-256 `828283b26e886615b9ba322972e2c15e0382fa8d423dfd969a5c50c6e9b7ec0a`
- Local-time before-fix log SHA-256 `c62c1e018714233136e23970ea314a3a34d6d90d3235a3dd317004f53525361d`
- After-fix Bazel log SHA-256 `05fe611ca96fc719ac4855afbd7ea4bb241465578220a240a1dbb6775c48ecb5`

### Owned private range traversal

Eight public PlainDateTime controls installed replacement array, string or
math methods after warming the formatter. Each replacement intercepted range
formatting. The owned path now uses indexed traversal, captured operations and
own array elements. Both fallback contexts concatenate the same private
pattern parts in order.

Collapsed and distinct ranges also construct null-prototype formatter options.
Inherited getter and setter controls on the number-formatter cache now see
zero calls. Both ranges keep their original output. The fractional range
control retains the `.123` and `.456` endpoint values with the correct sources.

Five lower-level rows in Temporal comparison §15.6.8 are verified locally.
Steps 23.d.iv.2.a and 23.d.iv.3 default the selected width to 3 and subtract 3.
Steps 24.c, 24.c.i and 24.d traverse the prepared collapsed parts, attach
own shared sources and return the private list. Step 24.b and the selection
and collapse predicates still depend on the configured-zone comparison and
the Plain rendering inputs. The whole algorithm remains open.

[Fractional arithmetic](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L201).
[Private collapse traversal](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L237).
[Collapsed input record](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L221).
[Distinct input record](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L296).
[Private pattern expansion](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L65).
[Public mutation controls](../../packages/intl-datetimeformat/tests/temporal-owned.test.ts#L50).
[ECMA-402 §11.5.8 steps 15.d.iv, 16, 18 and 19](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).
[Temporal comparison §15.6.8](https://tc39.es/proposal-temporal/#sec-partitiondatetimerangepattern).

Seven focused Bazel targets pass, including the shared formatter, Temporal
integration and declaration tests. The owned formatter suite passes 94 cases.

- Array and arithmetic before-fix log SHA-256 `3de14a0b8f7fd15f769d800ec74597cbffc1080f16e85fa3f9fe00be943dd9d8`
- Cache before-fix repro SHA-256 `648870461d56fe9cc3ab16fabfa3a959fd0d2d07f277f2100b59b41c999d2245`
- After-fix Bazel log SHA-256 `fc35c73300cc66d0dc04d24e9a7b77bdb3fc15ef31d116c8dfdb3c555b5b1021`

### Range field and fresh-list leaves

The private field table encodes ECMA-402 Table 6 in row order. The Default row
supplies a fallback and has no field value to compare. Given valid prepared
endpoint hours, a Boolean test at hour 12 is a one-to-one encoding of am and
pm. The other ordinary fields come directly from each endpoint's own
local-time fields. The branch and field-coverage rules still have open
obligations.

The fractional calculations use the chosen width and an integer millisecond
from 0 through 999. All 3,000 inputs match exact integer division on Node
24.14.0, Node 26.8.1, Hermes and Chromium 156. Each runtime
supplies the same reciprocal values for widths 1–3. The local arithmetic
proof uses that runtime contract. The source of the slot and the local-time
projection stay separately tracked.

FormatDateTimePattern creates a fresh empty List and fills it with own
records. The List and its records have no other references when collapse
adds the shared source fields. The public parts wrapper allocates its own
result and records, and the string wrapper consumes values. Reusing the
fresh private List satisfies the allocation step with no change in
observable identity or order.

Eight additional local rows are verified under those inputs and callee
contracts. Configured-zone comparison, branch coverage and the full
formatter selection remain conditional. Nine focused Bazel targets pass.
[Table order](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L33).
[Period values](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L178).
[Fractional values](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L200).
[Ordinary fields](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L206).
[Collapsed allocation](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L225).
[Fresh formatter list](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L378).
[Public projection](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimeRangeToParts.ts#L16).
[ECMA-402 Table 6](https://tc39.es/ecma402/#sec-datetimeformat-records).
[Temporal comparison §15.6.8 steps 23.a, 23.d and 24.a](https://tc39.es/proposal-temporal/#sec-partitiondatetimerangepattern).

- Node replay SHA-256 `05c0fb9406768e2a6d3507722fdbfeb11d5697c4b61eeb071a4699e371ea604d`
- Hermes replay SHA-256 `ee5570afaf171c96222590758ab0d1c6c8bc109855979b9253314fa33914191b`
- Chromium replay SHA-256 `18a063de75b220e1c11875e39ea716760ed16a73fcb5b4ae2770f8b32a66f27c`
- Bazel log SHA-256 `e9d13dfa2269b503cd71d24d8949520f6ddcdf15e32fbec74ae4bb5a4d73daa2`

### Range dispatch and rendering

For an encountered field, the private table keys select the am/pm,
day-period, fractional-second and ordinary branches. The fractional
guard uses the prepared slot domain of undefined or integer widths 1–3.
Within the unequal branch, selecting an interval or the guaranteed
fallback and stopping encodes the false equality flag. Table traversal,
selected-range coverage, the precision-slot source and the collapse
predicate remain conditional.

On the collapsed path, the first local-time record already has the epoch,
calendar and timezone used by the renderer. Both paths use +00:00 for Plain
endpoints. This verifies the rendering call independently of the published
comparison's configured-zone rule for deciding whether to collapse.
[Range dispatch](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L174).
[Default-width guard](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L200).
[Unequal branch](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L212).
[Collapsed rendering](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L222).
[Private local-time reuse](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L368).
[Temporal comparison §15.6.8 steps 23.d and 24.b](https://tc39.es/proposal-temporal/#sec-partitiondatetimerangepattern).

An inherited `fractionalSecondDigits` getter previously intercepted a missing
optional field on the selected distinct range format. The renderer now reads
the interval override and its fallback from own fields. The new distinct
`formatRange` regression failed before the fix. The collapsed
`formatRangeToParts` control passed before and after. All eight focused Bazel
targets pass.
[Own precision lookup](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L348).
[Public regression](../../packages/intl-datetimeformat/tests/temporal-owned.test.ts#L103).
[ECMA-402 §11.5.4](https://tc39.es/ecma402/#sec-formatdatetimepattern).

- Failing replay SHA-256 `6110d66b8501f96b965bbe86ec5deb0540696eda52c4b4a466d4b2e7d1c0051e`
- Passing Bazel log SHA-256 `04d784222cbf6698678c988d02bbac6ef8ab2d834f4e3586aa81c539dafee10b`

### Day-period values and private interval metadata

The two endpoints independently supply the local-time input to the same
locale resolver. It looks for an exact CLDR day-period rule, then an
interval, then falls back to localized AM/PM. This verifies the two
value-producing steps under the supplied projection and width. The
implementation-dependent clock precision policy stays explicit. Standalone
English noon plus one millisecond can produce a different label in native
Intl. This difference also occurs in single formatting. The two labels do
not determine compliance with the comparison's implementation-dependent
value rule.
[First endpoint value](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L183).
[Second endpoint value](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L189).
[Locale resolver](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L75).
[Temporal comparison §15.6.8 steps 23.d.iii.1–2](https://tc39.es/proposal-temporal/#sec-partitiondatetimerangepattern).
[ECMA-402 §11.5.8 steps 15.d.iii.1–2](https://tc39.es/ecma402/#sec-partitiondatetimerangepattern).

The fractional comparison reads the requested width carried unchanged from
the outer formatter. Supported locale registration parses the shipped
patterns without a fractional width field. The validated option is the
source of that field. Numeric endpoints keep the original slot. Instant,
PlainTime and PlainDateTime retain the explicit width through kind
selection, and date-only kinds lack the field. Constructor and matcher
records keep optional metadata private across basic and combined style paths.
[Set original slot](../../packages/ecma402-abstract/DateTimeFormat/InitializeDateTimeFormat.ts#L616).
[Set selected slot](../../packages/ecma402-abstract/DateTimeFormat/InitializeDateTimeFormat.ts#L774).
[Read selected representation](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L197).
[Temporal comparison §15.6.8 step 23.d.iv.1](https://tc39.es/proposal-temporal/#sec-partitiondatetimerangepattern).

The basic matcher, combined style record and style hour-cycle options once
read an inherited fractional precision getter when the caller supplied an
own undefined option. Their private records now keep a null prototype.
The public option still allows one inherited getter read when the caller
provides it. Three constructor regressions failed before the correction.
[Basic matcher record](../../packages/ecma402-abstract/DateTimeFormat/BasicFormatMatcher.ts#L119).
[Combined style record](../../packages/ecma402-abstract/DateTimeFormat/DateTimeStyleFormat.ts#L129).
[Constructor controls](../../packages/intl-datetimeformat/tests/index.test.ts#L425).
[ECMA-402 CreateDateTimeFormat §11.1.2](https://tc39.es/ecma402/#sec-createdatetimeformat).

- Failing constructor replay SHA-256 `e73e696ced17f4ccb3541dfef60b80162a697722bdbc62278c5530a9a380f0d3`
- Passing combined Bazel log SHA-256 `827d2a44177f2eb53f37e22c69cd756c5ca152dde5974ea1e2176139576a55bb`

English UTC h23 PlainTime 01:02:03 to 01:02:04 exposes a separate
range-table premise. Its private interval map has era, year, month, day
and default entries. Using that map directly with the comparison's
missing-field cutoff stops at absent AmPm after Day. It would collapse
before checking Second. FormatJS and native Intl on both pinned Node
versions show both endpoints. Whole-loop equivalence needs a justified
abstract range-record representation or resolution of the cutoff rule.
[Temporal comparison §15.6.8 steps 23.b–d and 24](https://tc39.es/proposal-temporal/#sec-partitiondatetimerangepattern).

A throwing inherited getter reached optional interval metadata on cold
width matching and cached rendering paths. Cold date ranges cover
`timeZoneName` and `weekdayStandalone`. Cached date and time ranges
cover `weekdayStandalone` and `monthStandalone`. Parsed, combined,
width-adjusted and expanded intervals now keep a null prototype. Primary
grammar fallback reads own flags. Four regressions failed before the
fix. Eight focused Bazel targets pass after it.
[Parsed interval records](../../packages/ecma402-abstract/DateTimeFormat/skeleton.ts#L487).
[Combined style intervals](../../packages/ecma402-abstract/DateTimeFormat/DateTimeStyleFormat.ts#L59).
[Adjusted interval records](../../packages/ecma402-abstract/DateTimeFormat/InitializeDateTimeFormat.ts#L99).
[Expanded interval record](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L288).
[Own grammar lookup](../../packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.ts#L396).
[Public range regressions](../../packages/intl-datetimeformat/tests/temporal-owned.test.ts#L104).

- Failing range replay SHA-256 `f66b68e0c3c60ec1292ba10b35e64a9adc98976fdbd7774c170138cb5df6d8cb`
- Passing Bazel log SHA-256 `323aff994febee2ce4c2ed1f185931a2624569f3fc642b37b03dc78ac4049705`

### Range equality and collapse

A registered calendar may supply January's zero month ordinal as either
JavaScript zero representation. The two endpoints both rendered January
but SameValue split the range. Strict equality matches the calendar
integers and the locale's String fields. It still distinguishes consecutive
month ordinals. The public control checks shared output for January, and
distinct endpoint parts for January and February.

Once the comparison path processes an unequal pair, it assigns a truthy
private interval or fallback and immediately breaks. The private interval
therefore remains undefined exactly when every processed comparison was
equal. The collapse test implements the Boolean flag under that input
contract. The source still has the separate field traversal and raw
interval cutoff question.
[Ordinary comparison](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L207).
[Collapse predicate](../../packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.ts#L220).
[Temporal comparison §15.6.8 steps 23.d.vi and 24](https://tc39.es/proposal-temporal/#sec-partitiondatetimerangepattern).

- Failing signed-zero Bazel log SHA-256 `ed5ae434a94cd34d167a0c56d791b85c0df9c7640899adebfb6f8dbcec342876`
- Passing DateTimeFormat Bazel log SHA-256 `4a14a4a617280065ee6431bbc4930bcc378ed73d355e7ef957763f194e50d51e`
