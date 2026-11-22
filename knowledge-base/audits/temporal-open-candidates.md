# Temporal review queue

Source candidates below await public reproduction. They are not confirmed
implementation defects or missing code. Existing implementation/tests remain the
baseline. Numbers refer to the pinned Temporal comparison, with the requested
ECMA-262 authority distinction retained in the execution plan.

- **Plain relative destination limit**, §5.5.13 step2 and §5.5.14 step2:
  `Duration.from('-P1D').total({unit:'hour', relativeTo:'-271821-04-20'})`
  and the corresponding `round({smallestUnit:'hour', ...})` may accept the
  excluded PlainDateTime lower midnight. TS relativeTotal/relativeRound and Rust
  plain_relative.rs need reproduction with a destination one nanosecond above
  the boundary and the existing zero shortcut preserved.
- **PlainDateTime source formatting**, §5.3.34/§5.3.36 formatting dependency:
  precreated `new PlainDateTime(2020,1,2,3,4).toJSON()` may call replaced
  `String.prototype.slice` while removing the private UTC suffix. Expected
  `2020-01-02T03:04:00`; native formatting bypasses this source branch.
- **Duration compare common date prefix**, §7.2.3 step12.c–d:
  comparing `{days:1,hours:1}` with `{days:1,hours:2}`, relative to
  `+275760-09-13T00:00Z[UTC]`, may skip required out-of-range additions.
  Plain calendar counterpart uses common `years:1` relative to
  `+275760-09-13`. Reconcile existing compare evidence before correction.
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
