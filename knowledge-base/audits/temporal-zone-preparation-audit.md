# Timezone name and compact-data preparation

Reviewed 2026-11-21. Scope: timezone name preparation in zones.ts and default
compact-data unpacking. Requested ECMA-262 document still has no Temporal API
chapters. This review records demonstrated implementation dependencies, not
complete Temporal methods or additional historical line credit.

## Native delegation

- [zones.ts:29](../../packages/temporal/zones.ts#L29) captures Object.keys and
  bound original String case methods before public calls. Identifier lookup and
  spelling-table construction use primitive strings. Native
  [§22.1.3.28 toLowerCase](https://tc39.es/ecma262/#sec-string.prototype.tolowercase)
  and [§22.1.3.30 toUpperCase](https://tc39.es/ecma262/#sec-string.prototype.touppercase)
  perform their original conversions and Unicode mapping; there is no new case
  algorithm, locale selection or user-object coercion.
- [compact-timezone.ts:19](../../packages/temporal/compact-timezone.ts#L19)
  and the two zone alias-table enumerations retain native
  [§20.1.2.19 Object.keys](https://tc39.es/ecma262/#sec-object.keys), all three
  steps: ToObject, EnumerableOwnProperties(key), CreateArrayFromList. Inputs are
  private generated records or private copies, not user Proxies. Enumeration
  order and own-key selection stay delegated to the engine.
- [compact-timezone.ts:50](../../packages/temporal/compact-timezone.ts#L50)
  retains bound native
  [§23.1.3.30 Array.prototype.sort](https://tc39.es/ecma262/#sec-array.prototype.sort).
  Input is a dense private Array of own writable rows, comparator unchanged.
  Every numeric index below length exists as an own property before sorting;
  native reads/writes cannot fall through to inherited index setters. Sort order
  remains ascending transition epoch seconds, including native stable handling
  of equal keys. Rows and comparator operands contain primitive numeric data.

Captures assume original builtins at module initialization. Binding also removes
later Function.prototype.call/bind lookups. No global builtin is replaced.

## Private transition rows

[Tuple reads:28](../../packages/temporal/compact-timezone.ts#L28) use known own
indices instead of iterator destructuring. Fixed transitions and expanded rule
spans retain their original loop bounds, TimeZoneRuleTransition calls, offsets
and row contents. [Appends:36](../../packages/temporal/compact-timezone.ts#L36)
define own data properties through existing setDataProperty; capturing push alone
would still invoke inherited numeric setters. Initial Array literals already
create own data properties. Thus the rows remain dense for captured native sort.

[Future metadata:51](../../packages/temporal/compact-timezone.ts#L51) also defines
an own property, preserving the original condition future >= 0. No future
property is added when metadata is absent. Generated America/New_York entry has
future index 15, verified from the Bazel cquery-resolved tz_temporal_compact
artifact. Its setter regression therefore exercises the conditional write.

## Public evidence and limits

Eight isolated public regressions fail against the original runtime. Cold
Instant.toString({timeZone: 'uTc'}) observes replaced lower-case, upper-case or
Object.keys methods; corrected output is 1970-01-01T00:00:00+00:00. Cold
ZonedDateTime.offsetNanoseconds observes Array iterator/push/sort, index 1 setter
or future setter during compact unpacking. Literal expected offsets are
-2,670,000,000,000 ns for Monrovia and -18,000,000,000,000 ns for New York at
epoch zero. Fresh module namespaces establish cold caches; descriptors restore
before assertions. These witnesses test the TS compact path.

Packed fallback unpacking, host-provider preparation, calendar normalization and
complete timezone parsing/identifier contracts remain open. In particular,
date-core constructorCalendar/calendarId still call mutable toLowerCase;
constructor-level isolation does not follow from these timezone-only witnesses.
This is an implementation defect review, not a new specification issue.

## Validation

All four focused gates pass: zoned public regressions, their typecheck, Temporal
typecheck and kernel tests (one executed, three cached). All 53 expanded tests
pass, all executed, including all Temporal class/backend and selected Now gates.
Temporal and DurationFormat assemblies pass. All six owning timezone
oracle/typecheck gates pass, all executed, including compact Hermes ICU and
native Hermes timezone oracles. No baselines, exclusions or timeout changes.
