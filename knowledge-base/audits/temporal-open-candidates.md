# Temporal review queue

Source candidates below await public reproduction. They are not confirmed
implementation defects or missing code. Existing implementation/tests remain the
baseline. Numbers refer to the pinned Temporal comparison, with the requested
ECMA-262 authority distinction retained in the execution plan.

- **Owned Duration slot access**, §§15.10.1–2: memoizer JSON.stringify and
  inherited toJSON failures are corrected. Actual getInternalSlots still reads
  live WeakMap.get/set and Object.create; constructor numbering-system cache has
  the same live operations. Public slot witness prepared; execution pending.
  Three parent gates remain conditional. Reuse captured runtime operations.
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

Closed Duration provider/private field-name batch: constructor accessor and
parts-method accessor failures reproduced before correction. Existing/fresh
formatters retain supplied providers; late data-valued replacements work for new
instances. Calendar field-name append uses own data properties, preserving public
PlainDate.with getter receiver and conversion order. [Twelve targets](temporal-duration-provider-validation-targets.txt)
pass. [Evidence and memoizer caveat](temporal-duration-provider-private-operations-audit.md).

Closed memoizer batch: two public cold Duration serialization regressions failed
before correction. Captured runtime operations and private wrapper isolation
preserve custom serializers and public argument toJSON. [Ten targets](temporal-duration-memoizer-validation-targets.txt)
pass. [Exact evidence and remaining slot premise](temporal-duration-memoizer-private-operations-audit.md).
