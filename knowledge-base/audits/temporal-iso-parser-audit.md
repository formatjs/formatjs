# Indexed ISO and annotation parsing

Reviewed 2026-11-21. Scope: complete TS `instant-string.ts` parser, its shared
UTC-offset dependency and focused public caller evidence. This audit adds no
completed Temporal API sections or historical algorithm-line credit.

## Requested specification boundary

Requested authority remains [ECMA-262](https://tc39.es/ecma262/). Its
[§21.4.1.32 Date Time String Format](https://tc39.es/ecma262/#sec-date-time-string-format)
and [§21.4.1.32.1 Expanded Years](https://tc39.es/ecma262/#sec-expanded-years)
define Date interchange syntax, not Temporal's general ISO/annotation grammar.
The checked document has no Temporal API chapters. Named-zone annotations,
critical flags, duplicate annotations, short-form ambiguity and Temporal
entrypoint policies therefore remain without corresponding clauses here.

Applicable shared dependency:
[§21.4.1.33 Time Zone Offset String Format](https://tc39.es/ecma262/#sec-time-zone-offset-strings),
[§21.4.1.33.1 IsTimeZoneOffsetString](https://tc39.es/ecma262/#sec-istimezoneoffsetstring)
and [§21.4.1.33.2 ParseTimeZoneOffsetString](https://tc39.es/ecma262/#sec-parsetimezoneoffsetstring).
[Offset wrappers:25](../../packages/temporal/instant-string.ts#L25) retain the
existing [bounded integer scanner:4](../../packages/ecma262-abstract/UTCOffsetNanoseconds.ts#L4).
The new prefix reader locates captures; it does not replace complete recognition
or claim independent completion of those abstract operations.

The parser deliberately differs from Date §21.4.1.32: basic forms, lowercase t
or space, hour-only clocks, comma or 1–9 fraction digits, richer offsets and
annotations. It rejects hour 24 and normalizes leap second 60. These are separate
parser contracts; this work makes no Date.parse conformance claim.

## Code correspondence

- [Date prefix:77](../../packages/temporal/instant-string.ts#L77),
  [short year-month:216](../../packages/temporal/instant-string.ts#L216) and
  [month-day:227](../../packages/temporal/instant-string.ts#L227) retain digit
  widths, signed six-digit years and distinct short-form policies.
  [Date validity:457](../../packages/temporal/instant-string.ts#L457) retains
  Gregorian bounds and leap-year divisibility checks.
- [Time prefix:117](../../packages/temporal/instant-string.ts#L117),
  [offset prefix:151](../../packages/temporal/instant-string.ts#L151) and
  [ISO recognition:178](../../packages/temporal/instant-string.ts#L178) retain
  basic/extended separator modes. Exported validators still own semantic clock
  and complete-offset bounds. Prefixless PlainTime date ambiguity remains in
  [time recognition:269](../../packages/temporal/instant-string.ts#L269).
- [Zone syntax:294](../../packages/temporal/instant-string.ts#L294) and
  [annotation scan:346](../../packages/temporal/instant-string.ts#L346) validate
  full bracket structure, critical flags, key/value components and ordering.
  First calendar is retained; critical duplicate calendars and unknown critical
  keys reject. Zone annotations remain distinct from key/value annotations.
- Separate exported policies remain at
  [Instant:433](../../packages/temporal/instant-string.ts#L433),
  [ISO fields:470](../../packages/temporal/instant-string.ts#L470),
  [short dates:495](../../packages/temporal/instant-string.ts#L495),
  [calendar:518](../../packages/temporal/instant-string.ts#L518),
  [PlainTime:539](../../packages/temporal/instant-string.ts#L539),
  [timezone:584](../../packages/temporal/instant-string.ts#L584) and
  [zoned fields:649](../../packages/temporal/instant-string.ts#L649).
  Public signatures, result fields and native delegation stay unchanged.

## Removed observable private operations

Bounded code-unit reads and indexed copying replace every RegExp execution and
mutable String method in this module. Private captures are dense arrays with own
undefined entries. Parsing no longer calls poisoned RegExp.exec/test or
String.slice/indexOf/includes/replace/toLowerCase, or alters legacy RegExp match
state. Intended public input coercions occur in callers, outside this module.

[Fraction padding:18](../../packages/temporal/instant-string.ts#L18) stays indexed.
Number conversion handles bounded ASCII fields; offset intermediates remain
integers below 86400000000000. Epoch assembly remains BigInt. No Decimal
conversion or lossy epoch Number conversion is introduced.

Reviewed recognition, validation order and values against the replaced parser.
No acceptance/value mismatch established. Malformed mixed offset separators can
change RangeError message from `Invalid UTC offset` to `Invalid annotation`;
message text is not a normative parser contract. Strict end-of-input checks
preserve original non-multiline JavaScript regex behavior.

## Public and semantic evidence

Existing Instant and PlainTime corpora retain 81 direct vectors (25 valid,
56 invalid), including mixed clock separators, tenth fraction digits and critical
duplicates. Existing timezone extraction covers nine valid and five invalid
cases. Calendar-string and zoned date-only transition controls remain relevant;
no baseline or exclusion changes.

[Mutation matrix:951](../../packages/temporal/tests/instant.test.ts#L951) covers
eight valid/invalid operation pairs against seven independently poisoned methods:
56 valid and 56 invalid calls. It covers public Instant/PlainTime plus direct
ISO, short-date, calendar, timezone and zoned-field parser boundaries. TS runtime
is forced; mutations restore before assertions.
[Legacy RegExp state:1081](../../packages/temporal/tests/instant.test.ts#L1081)
checks all eight pairs separately on supported JS runtime.

Meaningful semantic controls retain exact basic-form fractional cancellation:
[positive/negative 1 ns:1110](../../packages/temporal/tests/instant.test.ts#L1110).
[First calendar:1116](../../packages/temporal/tests/instant.test.ts#L1116),
[body-offset validation before timezone precedence:1125](../../packages/temporal/tests/instant.test.ts#L1125),
[unknown annotation component bounds:1130](../../packages/temporal/tests/instant.test.ts#L1130)
and [fraction widths one/eight:1140](../../packages/temporal/tests/instant.test.ts#L1140)
distinguish semantic preservation from hook suppression alone.

## Comparison only; no adopted Temporal authority

Published proposal [§13.31 grammar](https://tc39.es/proposal-temporal/#sec-temporal-iso8601grammar),
[§13.31.3 early errors](https://tc39.es/proposal-temporal/#sec-temporal-iso8601grammar-static-semantics-early-errors),
[§13.35 ParseISODateTime](https://tc39.es/proposal-temporal/#sec-temporal-parseisodatetime)
and [§13.36 ParseTemporalCalendarString](https://tc39.es/proposal-temporal/#sec-temporal-parsetemporalcalendarstring)
provide comparison/navigation only. No silent switch from requested ECMA-262.
Compared expanded years, prefixless time ambiguity, first-calendar consumption,
critical annotation handling and short ISO-calendar policies. No concrete
contradiction established. Dot and double-dot timezone components are not a
proved grammar defect; syntax and installed-zone membership are separate.

## Remaining caller obligations

- Calendar canonicalization and zoned date-only/offset classification now have
  separate [caller controls](temporal-iso-caller-audit.md). Those bounded fixes
  supersede the earlier mutable-method gaps; complete caller contracts remain open.
- Complete public object coercion, option/getter order, abrupt completion and
  allowed-goal/error precedence require caller-specific evidence. Bare calendar
  identifiers are partly recognized by calendarId, outside this module.
- Calendar/zone availability, canonicalization, provider candidates, supported
  ranges and realm/bootstrap behavior remain separate. Unknown syntactically
  valid zone annotations may be ignored by Instant; consuming APIs must resolve
  their zones independently.
- Native delegation is retained, not proved by forced-TS parser controls. Native
  public transport and installed-backend evidence must remain separately owned;
  Rust value parity cannot establish JS observable property-access behavior.
- Requested ECMA-262 lacks Temporal API/annotation clauses. Grammar parity and
  green tests cannot supply absent authoritative algorithm-to-line coverage.

## Validation

Tests-only baseline: eight regressions fail, 279 pass. After correction, all four
focused parser/compiler gates pass (two executed, two cached). Expanded validation
passes all 60 tests (58 executed, two cached) and both Temporal/DurationFormat
package assemblies, including all 40 Temporal class/backend gates, five Now
backends, string/timezone oracles and native consumers. No baseline, exclusions
or timeout settings change. These results do not establish whole-Temporal spec
completion.
