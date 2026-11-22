# Temporal review queue

Source candidates below await public reproduction. They are not confirmed
implementation defects or missing code. Existing implementation/tests remain the
baseline. Numbers refer to the pinned Temporal comparison, with the requested
ECMA-262 authority distinction retained in the execution plan.

- **Cold Duration formatter constructors**, §§15.10.1–2: privately owned
  formatting still obtains NumberFormat/ListFormat from live globals on cache
  miss. Cold-key public regressions and provider-snapshot proposal prepared;
  runtime reproduction and compatibility checks pending.
- **Intl producer/state/facade operations**, §§15.6.4–10: exact owned private
  options, lexical hooks, selected-kind records and range projection remain in
  the numbered-step queue. Reuse supplied formatter engines.

**Confirmed constructor realm gap:** eight public revoked-newTarget/primitive
prototype witnesses fail required TypeError. Sixteen rows stay conditional;
foreign intrinsic fallback also remains unresolved. [Reproducer and rejected
partial bridges](temporal-constructor-realm-proof.md). This is an implementation
gap, not an applicability exclusion or published-text inconsistency.

Closed reader/calendar batch: direct native-brand reader iteration/call hooks,
Duration ordinary-bag/sign/validation hooks, private formatting Lists and three
witnessed BigDecimal normalization tuples. Gregorian/Japanese era input,
Japanese era output and native-Intl private option Lists also corrected. Exact
precision and ordinary public bag ordering remain covered. Ten focused targets
pass; finite chronology/host joins reuse actual chosen runtime/Intl contracts.

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
species/typecheck controls. Reader iteration is closed by the subsequent reader/calendar batch.

Closed timezone identity batch: sparse primary-zone inherited lookup and private
kernel offset/candidate index setters. Four public pre-fix failures reproduced;
eight targets pass. Owning TimeZoneEquals evidence and13 caller/local conditions
reconciled. Lower-local range/editorial issue remains separately tracked.
