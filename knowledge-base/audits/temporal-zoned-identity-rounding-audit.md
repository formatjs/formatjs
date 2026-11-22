# ZonedDateTime identity rounding

Reviewed 2026-11-21. Scope: rounding to one nanosecond, preserving exact epoch,
time zone and calendar in a fresh object. This corrects a public boundary defect;
it does not sign off complete ZonedDateTime.round or its dependencies.

The requested ECMA-262 snapshot has no Temporal API chapters. Historical
zoneddatetime.html lines 645–646 locate the shortcut. The separately published
[proposal §6.3.39 step 14](https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.round)
has the same identity return; this comparison does not change citation authority
or add chapter completion credit.

## Source contract

- [Receiver/options:928](../../packages/temporal/zoned-date-time.ts#L928) retains
  the brand check, required argument, string shorthand and options-object path.
- [Ordered conversion:939](../../packages/temporal/zoned-date-time.ts#L939)
  gets and validates increment, rounding mode and smallest unit before returning.
  Unit-specific increment validation now precedes the identity return. Nanosecond
  increment 1 is below the exclusive maximum and divides it.
- [Identity return:946](../../packages/temporal/zoned-date-time.ts#L946) passes
  already validated private epoch/time-zone/calendar fields to
  [createZonedDateTime:216](../../packages/temporal/zoned-date-time.ts#L216).
  The factory checks inclusive epoch bounds, creates an intrinsic-prototype
  object and installs private slots. It does not reconstruct local clock fields.
- Other increments/units continue through their existing backend and rounding
  paths. This is not a general removal of local-date range checks.

## Boundary witness and tests

At minimum epoch `-8_640_000_000_000_000_000_000n` with zone `-01:00`, the
displayed local nanoseconds equal minimum epoch minus one hour. The old TS path
reconstructed that local time and called resolve with offset preference; its
local-date guard threw `RangeError: Local date out of range`. The represented
Instant itself is valid, and identity rounding needs no local conversion.

Two new public tests failed before correction. Tests check minimum/negative-zone
and maximum/positive-zone inputs, shorthand and explicit increment, fresh
identity and unchanged epoch/calendar/zone. Option getters run in increment,
mode, unit order; invalid increment/mode still throw. Increment 2 rounds epoch
1 ns to 2 ns, guarding against a unit-only shortcut. Minute rounding retains the
existing lower-local-bound rejection. All twelve expanded gates pass (ten
executed, two cached): direct regressions/typechecks, five ZonedDateTime backend
gates, transition/difference/relative-duration consumers and native Hermes.
Temporal package assembly passes. No baseline, exclusions or timeout changes.

## Open work

Complete option helpers, realms, other increments, day rounding, candidate
generation and offset resolution retain separate obligations. The repeated-date
day-rounding assertion inconsistency is recorded in
[spec issues](temporal-spec-issues.md#day-rounding-upper-bound-assertion-on-repeated-civil-dates),
separately from this identity fix.
