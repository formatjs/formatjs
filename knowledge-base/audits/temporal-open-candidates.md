# Temporal review queue

Source candidates below await public reproduction. They are not confirmed
implementation defects or missing code. Existing implementation/tests remain the
baseline. Numbers refer to the pinned Temporal comparison, with the requested
ECMA-262 authority distinction retained in the execution plan.

- **ZonedDateTime private conversion/formatting**, §6.3.32 step7.a,
  §6.3.49 step4 and toString/toJSON formatting dependencies:
  withPlainTime/toPlainTime may dispatch public PlainTime.from; private ISO
  output may call replaced String.slice. Precreated UTC0n and PlainTime12
  should give00:00 and replacement epoch43200000000000n without hooks.
- **Calendar era lookup**, §12.3.30:
  forced-TS Gregorian era bag `{era:'ce',eraYear:2020,month:1,day:2}` may consult
  replaced Array.indexOf. Year2020 counterpart supplies a branch control.
- **Timezone possible-instant collections**, §11.1.13 step3.a:
  forced-TS New York fold `2024-11-03T01:30[America/New_York]` may consult
  replaced Array.sort/private Set iteration. Compatible/later expected epochs
  `1730611800000000000n`/`1730615400000000000n`.
- **Full timezone offset formatting**, §11.1.6 steps8–9:
  precreated `new ZonedDateTime(0n,'UTC').offset` may consult replaced padStart.
  Expected `+00:00`; historical Monrovia exercises second precision.
- **Host timezone cache collections**, host profile:
  precreated Instant epoch0 formatted in Asia/Kathmandu may consult replaced
  Map.get; transition lookup may consult replaced Array.find. Expected epoch0
  text `1970-01-01T05:30:00+05:30`. Scope only actual Temporal host calls.
- **ZonedDateTime constructor timezone validation**, §11.1.16 step1 caller:
  `new ZonedDateTime(0n,'UTC')` may consult replaced RegExp.prototype.test.
  Fixed-offset construction supplies a branch control.

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

Additional owned Intl source families awaiting public reproduction: captured
Temporal serialization scalar/string hooks; legacy locale style/calendar error
order and private style-probe hooks; private Duration record creation and final
DurationFormat parts collection/data-property appends. Corresponding test-first
patches are prepared; no runtime failure claim until root executes them.
