# ISO calendar and zoned caller preparation

Reviewed 2026-11-21. Closes demonstrated mutable-method calls outside the
[indexed ISO parser](temporal-iso-parser-audit.md). Requested ECMA-262 still lacks
Temporal API chapters; no API section completion or historical trace credit.

## Calendar conversion

Published proposal [§12.3.10 ToTemporalCalendarIdentifier](https://tc39.es/proposal-temporal/#sec-temporal-totemporalcalendaridentifier)
is comparison only. Source retains these distinct contracts:

- [calendarFromObject:133](../../packages/temporal/date-core.ts#L133) uses five
  calendar-bearing slots before reading public calendar once. Undefined defaults
  to ISO through calendarId.
- [calendarId:160](../../packages/temporal/date-core.ts#L160) checks branded slots,
  rejects nonstrings without coercion, selects bare identifier or calendar-bearing
  string parsing, lowercases, applies aliases and checks supported calendars.
- [Bare recognition:138](../../packages/temporal/date-core.ts#L138) uses bounded
  indexed ASCII reads. First character must be a letter; later characters may
  include digits/hyphens. Initial T/t followed by a digit routes to the parser.
  This preserves clock-shaped calendar strings, including invalid-clock rejection.
- [constructorCalendar:173](../../packages/temporal/date-core.ts#L173) accepts
  identifier strings only. Positional constructors still reject date strings;
  already-parsed calendar fields use this narrower helper. Defaults remain ISO.
- [Captured lowercase:81](../../packages/temporal/date-core.ts#L81) retains original
  full Unicode lowercase behavior. No new coercion, aliases or accepted spelling.
  The two old private RegExp calls and replaceable lowercase method lookup disappear.

[Public controls:370](../../packages/temporal/tests/plain-date-time.test.ts#L370)
poison RegExp.exec, RegExp.test and String.toLowerCase separately. Each verifies
six valid and four invalid calls: bare mixed case, T-clock fallback, date-string
alias, positional alias/default, inherited calendar read once, invalid clock,
positional date-string rejection, unsupported name and nonstring rejection without
Symbol.toPrimitive. Native absence asserted; mutations restored before assertions.
Tests-only baseline: three fail, twelve pass. Corrected focused calendar gate and
both compiler gates pass (one executed, two cached).

## Zoned string classification

Published proposal [§6.5.2 ToTemporalZonedDateTime](https://tc39.es/proposal-temporal/#sec-temporal-totemporalzoneddatetime)
is comparison only. Shared offset grammar remains ECMA-262
[§21.4.1.33](https://tc39.es/ecma262/#sec-time-zone-offset-strings).

[Date-only classification:397](../../packages/temporal/zoned-date-time.ts#L397)
scans until the first annotation bracket. T/t/space in the body means clock input;
annotation contents cannot affect classification. Parsing has already succeeded,
so required zone annotation and bounded string indices are established.

[Minute classification:412](../../packages/temporal/zoned-date-time.ts#L412)
uses the validated offset domain: +HH, +HHMM and +HH:MM have lengths 3, 5 and 6.
Second-bearing forms have length 7 or 9 before any fraction; fractions require
seconds. Absent/Z offsets cannot match. This is not a general offset recognizer.
Native adaptation retains the same domain: minute offsets use +HH:MM, exact
offsets include seconds/fraction, UTC is Z, wall input has no offset. Complete
native/provider transport remains separately owned.

[Shared resolution:292](../../packages/temporal/zoned-date-time.ts#L292) compares
Z/z directly, after the existing kernel/local-field preparation and before
ignore/use handling. Provider queries, numeric parsing and resolution stay in
place. No epoch Number conversion or fractional arithmetic changes.

[Public controls:691](../../packages/temporal/tests/zoned.test.ts#L691) poison
String.slice/indexOf and RegExp.test/exec separately. Each converts date-only,
minute-offset, exact-offset and Z forms, asserts epoch zero and ordered
Get(disambiguation), Get(offset), Get(overflow). Native runtime absence asserted.
Tests-only baseline: four fail, forty-four pass.
[Monrovia:753](../../packages/temporal/tests/zoned.test.ts#L753) independently
asserts minute -00:45 accepts historical -44m30s at epoch 2670000000000 ns,
while exact -00:45:00 rejects.
[Malformed offset:763](../../packages/temporal/tests/zoned.test.ts#L763) rejects
before option getters. Combined corrected caller/compiler gates: four pass,
two executed and two cached.

## Remaining obligations

Complete public conversion remains open: object/slot branches, calendar/zone
preparation order, coercion/abrupt completion, date-only start-of-day, local/Instant
bounds, provider contracts and realms. In particular the comparison algorithm
prepares timezone before calendar; source retains its existing calendar-first
sequence. This patch does not certify that ordering. Unknown-calendar/zone and
observable provider behavior need their own evidence.

Captures protect changes after module initialization; bootstrap/realm conditions
remain separate. Calendar arithmetic and installed zone membership are not grammar
properties. Neither these controls nor backend value parity supplies missing
ECMA-262 Temporal API clauses.

## Expanded validation

All 60 expanded tests pass (59 executed, one cached), including all 40 Temporal
class/backend gates, five Now backends, string/timezone oracles and native
consumers. Both Temporal and DurationFormat package assemblies pass. No baseline,
exclusion, timeout or backend configuration changes.
