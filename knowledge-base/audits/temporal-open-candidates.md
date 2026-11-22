# Temporal review queue

Source candidates below await public reproduction. They are not confirmed
implementation defects or missing code. Existing implementation/tests remain the
baseline. Numbers refer to the pinned Temporal comparison, with the requested
ECMA-262 authority distinction retained in the execution plan.

- **Calendar era lookup**, §12.3.30/31: Gregorian era conversion may consult
  replaced Array.indexOf; Japanese era metadata may consult Array iteration.
  Separate public regression patches prepared; runtime reproduction pending.
- **Temporal/Intl private reader lists**, §15.6.11 and §15.10.1/2 step3:
  scalar/string snapshots now use captured operations, but reader-list iteration
  still needs its own contract regression. Duration formatting also retains
  named owned private-list iteration; supplied Intl engines are separate.

Shared foreign-realm constructor fallback is a named conditional contract in the
core register. Default/local construction and explicitly supplied object
prototypes do not establish foreign intrinsic fallback. No engine replacement
is proposed.

Closed in current correction: plain relative lower destination total/round,
PlainDateTime source formatting and withPlainTime public dispatch. Public
regressions failed before correction. Adjacent1ns, equal zero and normal bag
behavior preserved; 16 focused targets pass.

Duration comparison boundary candidate is corrected and validated: required
calendar/zoned additions remain observable as errors; fixed plain days/time
avoid unnecessary destination guards. Nine focused targets pass.

Closed in the timezone/Intl/YearMonth batch: ZonedDateTime private clock
conversion, named-zone constructor grammar, ISO/offset text, cold generated
candidate collection, host offset/transition cache hooks (including array
constructor/species), required locale style error ordering, scalar/string
serialization hooks, private Duration record allocation and own final part units.
YearMonth.toPlainDate now uses private null-prototype fields. Public regressions
failed before corrections;12 focused/backend targets pass plus final host
species/typecheck controls. Remaining reader iteration is explicitly separate.
