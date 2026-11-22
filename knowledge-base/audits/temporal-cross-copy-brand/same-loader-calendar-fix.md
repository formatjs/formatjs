# Same-loader Plain calendar slots

Each Plain factory records validated calendar scalars in the private
`native.js` module shared by the ordinary `index.js` and `standalone.js`
entry points. The existing per-entry records still own local caches and
native snapshots. Cross-entry reads create a local cache record from
the immutable shared data. Allocation registers a fresh object with
a distinct kind. Proxy receivers follow the existing property-bag
path.

This supplies the PlainDate, PlainDateTime, PlainYearMonth and
PlainMonthDay inputs to the existing calendar readers. ZonedDateTime
uses the already shared epoch path.
[§12.3.10 step 1](https://tc39.es/proposal-temporal/#sec-temporal-totemporalcalendaridentifier).
[§12.3.11 steps 1 and 1.a](https://tc39.es/proposal-temporal/#sec-temporal-gettemporalcalendarslotvaluewithisodefault).

The package regression exercises both entry directions, each calendar-bearing
kind, factory-created values and Proxy controls. Mismatched TypeScript
declaration exports were corrected and the final package tests check the
emitted entry points.
[Validation](same-loader-calendar-validation.json).
[Shared allocation](../../../packages/temporal/epoch-slots.ts).
[Local reads and caches](../../../packages/temporal/plain-slots.ts).
