# Relative rounding private mode checks

Reviewed 2026-11-21. Scope: private rounding-mode selection in shared TS
roundRelativeDifference, selected skipped-date behavior, and native Duration
field-bag controls. Complete algorithms remain open. Requested ECMA-262 source
has no Temporal API chapters; this adds no numbered Temporal section signoff
or historical line credit.

## Observable hook and correction

[roundRelativeDifference:952](../../packages/temporal/date-core.ts#L952) formerly
called mode.startsWith('half'). Even though mode is a validated primitive enum,
that property lookup consulted mutable String.prototype.startsWith. Two public
regressions failed with the replaced method's exact exception through
PlainDateTime.until and ZonedDateTime.until. Descriptors restore before assertions.

The branch now compares all five half modes directly: halfCeil, halfFloor,
halfExpand, halfTrunc and halfEven. Valid non-half modes skip the distance/tie
branch as before. No coercion, property lookup or user callback is needed to
compare primitive enum strings. Option Get/ToString/validation happens before
this branch and retains its separate contract. Distance comparisons, signed
selection and half-even parity are unchanged. Rust already matches its enum
directly and needs no correction.

Public controls use 2000-01-01 to 2000-01-20 with largest/smallest month. The
19-day span lies above the 15.5-day midpoint of January's 31-day window, selecting
+1 month for until and -1 for since. These results are literal expectations,
independent of the implementation's rounding helper. Complete callers remain open.

## Native field-bag controls

The shared Duration oracle adds inherited Get/ToNumber interleaving, negative-zero
normalization, abrupt exception identity and no later inherited Get. Native
Hermes invokes this checker after restoring the actual Rust query backend, so
these controls cover its public frontend rather than inferring behavior from
typed Rust inputs. Existing scalar/calendar fixture counts and golden values
remain unchanged. The [field-bag audit](temporal-duration-from-caller-audit.md)
retains type/range/realm and complete caller obligations.

## Precision and remaining windows

The [date-largest precision scan](temporal-date-largest-precision-audit.md)
proves small clock fields and bounded day quotients survive Number/f64 conversion.
Irregular calendar counts require stated provider bounds; endpoint-window
correctness remains distinct. No second premature-conversion defect was found
in those bounded paths. Skipped civil dates can collapse adjacent calendar
endpoints; strict monotonicity must not be assumed.

The [calendar count/window audit](temporal-calendar-count-window-audit.md)
records independent Apia UTC endpoints: subtracting one or two days from
2012-01-01 noon reaches the same instant. The existing one-window retry
selects a distinct bracket. Shared controls cover all nine rounding modes,
until/since and reversed anchors without assuming calendar antisymmetry.

All seven focused gates pass (five executed, two cached), including native
Hermes source/bytecode for Duration and ZonedDateTime. Expanded validation
passes all 27 tests, including 25 affected class/backend gates, relative Duration
and public API/helper controls. Temporal and DurationFormat assemblies pass.
No baselines, exclusions or timeouts changed.

The separately documented
[Apia retry inconsistency](temporal-spec-issues.md#day-window-retry-ignores-shift-after-apias-skipped-date)
affects the historical/published proposal comparison. FormatJS's existing
all-date-unit retry handles this case; it is not a complete derivation from
that proposal branch or an adopted ECMA-262 finding.
