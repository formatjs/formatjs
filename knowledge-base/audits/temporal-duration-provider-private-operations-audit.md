# Duration provider and private field Lists

Frozen rendered Temporal comparison §§15.10.1–2 step4 and §12.3.3 step8.
Requested authority remains ECMA-262; comparison numbers do not substitute for
missing Temporal API chapters there.

Cold locale profiles exposed late `Intl.NumberFormat`/`Intl.ListFormat` accessor
Gets. DurationFormat now retains selected constructors and their parts methods.
New instances follow callable own data assignments on the supplied Intl object;
existing instances retain their providers through first rendering. Captured
descriptor operations skip accessor replacements. Real NumberFormat/ListFormat
and existing constructor-keyed memoizers still perform formatting. BigDecimal
string conversion and signed-zero handling stay intact.

Public regressions cover cold mathsans/mathdbl profiles, arab/latn provider
selection, precreated/fresh formatting, parts and Duration.toLocaleString under
parts-method accessor replacement. Constructor regressions failed twice before
correction; method regressions failed twice before correction.

Private calendar field-name append also reached an inherited numeric setter.
Own data-property creation fixes it. Shared public Gregorian PlainDate.with
control checks result, zero hooks, getter receiver and exact public field/getter
conversion order. It failed before correction, then passed in TS and native
Hermes calendar oracles.

[Twelve validation targets](temporal-duration-provider-validation-targets.txt)
pass: six executed, six cached. A lint-compatible receiver assertion then passed
all three affected TS/native calendar targets again. Coverage includes precision, owning formatter
tests, registration and Hermes source/bytecode. [Source bindings and validation
record](temporal-duration-provider-source-evidence.json) identify this batch.

Three Duration parent gates remain conditional. Actual shared fast-memoize code
still reads mutable slice/call/apply/bind, JSON.stringify and Object.create;
default serialization of private arguments may consult inherited toJSON.
This is a source-backed candidate awaiting public reproduction, not a confirmed
runtime failure. Supplied ordinary Intl constructors/subclasses are covered;
arbitrary Proxy/bound-constructor providers are not inferred equivalent.
Separate constructor realm and DateTime producer conditions remain open.
