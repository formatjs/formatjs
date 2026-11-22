# Temporal reader, precision and calendar contracts

Numbered references identify the frozen rendered Temporal comparison, except
explicit ECMA-262/402 operation references. Requested authority remains ECMA-262.

- §§15.6.3,15.6.11–12,15.7.1–3: captured Date/brand readers use captured
  Reflect.apply and indexed private reader Lists. Direct six-brand records cover
  ISO/calendar identity, reference dates, noon, nanoseconds and negative Instant.
- §§15.10.1–2 step3: branded Duration fields and ordinary bag conversion reuse
  captured helpers. Alphabetical Gets preserve inherited receiver, immediate
  coercion and abrupt completion. Sign/validity Lists use indices; existing
  numberIsFinite/mathAbs/bigIntFrom preserve exact normalization and limits.
- §15.9.7 dependency: three witnessed BigDecimal normalization tuples use
  indices. Existing arithmetic stays unchanged. Fraction divisors are exact
  powers of ten taking existing mantissa-one shortcut; no general decimal-engine
  audit credit. Public iterator/next profiles cover1:02:03.004005006, its negative,
  negative leading zero and9007199254740991.001000001 seconds.
- ECMA-402 §13.5.15: owned Duration part Lists use indices. Private strings expose
  own iterator/next wrappers calling captured runtime methods at the real
  ListFormat boundary. NumberFormat/ListFormat engines remain supplied providers.
- §§12.3.1,12.3.25,12.3.30–31: Gregorian/Japanese era input and Japanese era output
  use private indexed metadata. Public exact2020-02-03/reiwa2 and Gregorian
  controls fail before corrections; TS/native Hermes controls pass afterward.
- §15.4.1 steps45/46: legacy native-Intl option projection uses indexed private
  required/allowed/options/default Lists. Array iterator/next controls cover style,
  narrowed Gregorian YearMonth style, explicit components and defaults. Existing
  component/style semantics and native formatter engines remain supplied.

[Finite Chinese/Dangi proof](temporal-lunisolar-chronology-proof/proof.md)
checks800003 years and9894659 month identities per calendar, exact compact joins
and Number bounds. Root Bazel cquery binds actual generated artifacts in three
configurations per calendar. [Host Umm proof](temporal-host-umm-joins-proof.md)
and six public literal boundary/crossing controls supply both chosen host/civil
handoffs. Existing arithmetic/table proofs and conforming captured Intl data
contracts are reused. Independent astronomy and full third-party402 auditing are
outside these delegated contracts.

[Validation manifest](temporal-reader-calendar-validation-targets.txt):10targets
pass, four executed/six cached on final run. Earlier targeted runs reproduced
reader/call, validator, iterator, era and legacy private-list failures before
correction. Shared BigDecimal, NumberFormat and DurationFormat suites pass;
Temporal typecheck, host calendar and native Hermes date-output controls pass.

These changes close17 previously conditional numbered steps and accompanying
helper gates. They do not promote callers retaining separate producer/state/range
premises. Duration format/formatToParts gates remain conditional on cold supplied
NumberFormat/ListFormat constructor capture. [Constructor realm witnesses](temporal-constructor-realm-proof.md)
remain confirmed failures across eight constructors;16 rows stay conditional.
