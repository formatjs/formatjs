# Timezone cache isolation and relativeTo routing

Reviewed 2026-11-21. Scope: private Maps in Temporal zones.ts and lexical
relativeTo string routing. Requested ECMA-262 snapshot has no Temporal API
chapters; complete Temporal callers and chapter mapping remain open. No
historical line credit. These are implementation hook defects, not new spec issues.

## Five private Maps

[Captured bindings:36](../../packages/temporal/zones.ts#L36) retain the original
Map constructor, get and set at module initialization. Bound native invocation
also avoids later Function.prototype.call/bind lookups. No Map implementation
is added. Relevant native dependencies are
[ECMA-262 §24.1.3.6 get](https://tc39.es/ecma262/#sec-map.prototype.get) and
[§24.1.3.11 set](https://tc39.es/ecma262/#sec-map.prototype.set).

All eight reads and nine writes now delegate through those captured methods.
All five stores use the captured constructor: [kernel cache:51](../../packages/temporal/zones.ts#L51),
[identifier table:62](../../packages/temporal/zones.ts#L62),
[named kernels:135](../../packages/temporal/zones.ts#L137),
[spelling table:191](../../packages/temporal/zones.ts#L193), and
[fixed kernels:206](../../packages/temporal/zones.ts#L208). Identifier and spelling
tables initialize lazily, so capturing only methods would leave a constructor
hook after import. Constructor calls supply no iterable.

Native get/set use the actual private Map as receiver, preserving slot checks,
key identity, stored values and undefined misses. Keys are primitive strings;
operations require no user coercion. Existing callers ignore set's return value.
Map allocation/entry operations are delegated to captured builtins; all other
Map properties/methods and language-wide collections remain outside this review.

Three isolated public regressions failed before correction: UTC offset reading
observed replaced Map.prototype.get; first +13:47 fixed-kernel creation observed
replaced Map.prototype.set; first UTC spelling-table construction observed a
replacement global Map constructor. Expected offsets are literal zero and
49,620,000,000,000 ns. Fresh module namespaces guarantee cold caches and keep
objects/slots in the same namespace. Mutations restore before assertions.

This capture contract assumes original intrinsics at initialization. Identifier
String methods, Object helpers and default compact preparation are
covered by the [follow-up audit](temporal-zone-preparation-audit.md). Packed
fallback/host data pipelines and complete provider contracts remain open.
Native profiles share wrappers,
but these mutation witnesses specifically execute the TS frontend path.

## Relative string routing

[hasTimeZoneAnnotation:53](../../packages/temporal/relative-duration.ts#L53)
replaces an extra private RegExp test. It scans UTF-16 indices, remembering the
earliest opening bracket since an equals sign or closing bracket. A closing
bracket completes a match only when at least one content code unit intervenes.
All string reads stay within own indices. This is routing, not grammar validation.

The prior optional exclamation mark was redundant because its following class
also allowed that character. Retaining the earliest opening matters for malformed
'[[]'; an inner opening bracket is allowed by the prior lexical class. Equals
clears prior candidates; empty '[]' does not match. Code-unit traversal preserves
non-u regex handling of newlines and surrogate code units. No input coercion is
removed: this branch already requires a primitive string. Existing plain/zoned
parsers and their rejection order remain unchanged.

Two public malformed-relativeTo controls failed before correction: replaced
RegExp.prototype.test was read, and a successful routing match overwrote legacy
RegExp state. '[[]' isolates the routing match because the downstream annotation
parser immediately rejects without a successful regex match. Both controls retain
RangeError before the unit getter. Valid strings still undergo the existing
parsers, whose regex/String methods and statics remain open; no complete parser
isolation claim follows from this narrow fix.

## Validation

All six focused gates pass (four executed, two cached), including isolated
public cache controls, routing hook/statics controls, kernel checks and typechecks.
All 53 expanded tests pass (52 executed, one cached), including all 40 Temporal
class/backend gates, five Now backend gates and host/native consumers. Temporal
and DurationFormat assemblies pass. Runtime files remain unchanged after that
run. An additional shared malformed-routing control checks zero RegExp hooks,
zero unit reads and RangeError through TS/native Hermes without assuming legacy
RegExp statics support. All three final owning-oracle gates pass (two executed, one cached), including
native Hermes source/bytecode.

No baselines, exclusions or timeout changes.
