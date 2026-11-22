# Host-calendar private execution audit

Reviewed 2026-11-22. Requested authority remains [ECMA-262](https://tc39.es/ecma262/).
It has no Temporal API chapter in the fetched snapshot. Separately rendered
[NonISODateAdd §12.3.6](https://tc39.es/proposal-temporal/#sec-temporal-nonisodateadd)
is comparison/navigation only. This entry repairs the exercised host-provider
closure; it does not establish whole-calendar correctness or API signoff.

## Source route

Host-profile calendar addition reaches compact Chinese/Dangi year data,
out-of-compact approximation, or host Intl Umm al-Qura year reconstruction.
[hostCalendarYear](../../packages/temporal/host-calendar.ts#L83) selects those
routes. Public conversion/addition, not a production cache-reset API, exercises
all three in the integration controls.

## Captured ECMA-262 delegation

All calls below use original methods captured during trusted module initialization,
original private receivers and dense own argument arrays through captured
[§28.1.1 Reflect.apply](https://tc39.es/ecma262/#sec-reflect.apply).
String keys and primitive numbers introduce no user coercion callbacks.

| Section and complete delegated operation                                                                    | Source and premises                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [§24.1.3.6 Map.prototype.get](https://tc39.es/ecma262/#sec-map.prototype.get), steps 1–5                    | Formatter/year lookup at host-calendar.ts:53,90; compact range cache at host-calendar-data.ts:20. Original Map receiver has native MapData; exact original calendar/key passed unchanged. Native operation owns slot validation, key normalization, lookup and missing undefined. |
| [§24.1.3.11 Map.prototype.set](https://tc39.es/ecma262/#sec-map.prototype.set), steps 1–7                   | Original private map, key and value passed unchanged at host-calendar.ts:42,67 and host-calendar-data.ts:43. Native insertion/update ordering retained.                                                                                                                           |
| [§24.1.3.12 get Map.prototype.size](https://tc39.es/ecma262/#sec-get-map.prototype.size), steps 1–5         | Captured getter called on actual year map at host-calendar.ts:37; no mutable accessor lookup.                                                                                                                                                                                     |
| [§24.1.3.10 Map.prototype.keys](https://tc39.es/ecma262/#sec-map.prototype.keys), steps 1–2                 | Captured original creates fresh live key iterator at host-calendar.ts:38, after provider calculation, immediately before eviction.                                                                                                                                                |
| [§24.1.5.2.1 %MapIteratorPrototype%.next](https://tc39.es/ecma262/#sec-%mapiteratorprototype%.next), step 1 | Captured original advances that actual iterator once at host-calendar.ts:39; native GeneratorResume owns iteration semantics. Capturing keys alone would leave mutable next exposed.                                                                                              |
| [§24.1.3.3 Map.prototype.delete](https://tc39.es/ecma262/#sec-map.prototype.delete), steps 1–5              | Captured original removes the first live key at host-calendar.ts:40, then set runs. No shadow queue or changed insertion policy.                                                                                                                                                  |

At size ≥128, one current oldest key is deleted before set. Lookup does not
refresh insertion order. Eviction remains after potentially reentrant provider
work: even an existing-key update at capacity retains the original delete-first
policy. No eager eviction or extra has lookup was introduced. Reentrant provider
behavior is a source-order preservation argument, not a new executable reentry
proof for arbitrary third-party Intl implementations.

## Private lists and records

[Compact range expansion](../../packages/temporal/host-calendar-data.ts#L19)
uses indexed generated ranges and packed years. Its exact bit counts, cumulative
starts and range order stay unchanged. [Year expansion](../../packages/temporal/host-calendar-data.ts#L48)
keeps the same 12/13-month bit decoding. Neither path invokes mutable map,
iteration or push, nor ArraySpeciesCreate.

New entries use existing [setDataProperty](../../packages/ecma262-abstract/intrinsics.ts#L62):
captured defineProperty plus own null-prototype descriptor, creating own writable,
enumerable, configurable indices. Inherited numeric setters/getters and descriptor
getters cannot intercept these writes. This directly delegates
[§20.1.2.4 Object.defineProperty](https://tc39.es/ecma262/#sec-object.defineproperty)
on valid private ordinary arrays; it is not assignment through their prototypes.

[Umm al-Qura starts](../../packages/temporal/host-calendar.ts#L110) append own
indices. Reversal swaps only existing own writable indices; it cannot consult
inherited indexed properties or a replaced reverse method.

[Approximation](../../packages/temporal/lunisolar.ts#L73) defines own month lengths.
For old cumulative starts S0..Scount, new loop invariant before iteration i is
end=Si. It stores Si when i>0 and adds length[i], leaving starts S0..S(count−1)
and end=Scount. Thus it exactly preserves old push-then-slice output without
species or mutable slice. Existing BigInt astronomical constants, floor arithmetic,
leap choice and Number conversions are unchanged. Calendar-data/astronomical
accuracy is a separate obligation, not proved by this representation argument.

## Host Intl boundary

[fields](../../packages/temporal/host-calendar.ts#L46) retains day-range and
provider-availability checks, formatter lookup, construction, resolved-calendar
check, cache insertion, formatToParts and field validation in that order.
Captured provider methods use captured Reflect.apply, avoiding mutable Function.call.
Private formatter options now have null prototype and identical own requested
fields; inherited weekday and other absent options cannot become extra callbacks.

Native formatToParts returns an ordinary dense list. Indexed scanning preserves
part order, type Get before conditional value Get, and year/day numeric conversion
order. Original constructor/resolvedOptions/formatToParts remain explicit provider
boundaries: this is not proof of arbitrary JS Intl implementation internals,
host CLDR data, realm installation, or complete provider failure/reentry contracts.

## Public regression evidence

[Host integration](../../packages/temporal/tests/host-calendar.test.mjs#L70)
launches a fresh Node process per hook after importing the bundle normally.
It preconstructs operands, mutates only during synchronous public addition,
restores descriptors before formatting/assertions, and requires literal ISO
outcomes plus exactly one public overflow Get.

Fifteen profiles cover array map/species/iterator/push/reverse/slice, Map
get/set/size/delete/keys/iterator-next, Function.call, inherited private Intl
options and numeric Array prototype accessors. All fifteen profiles failed
before correction. Cold Chinese/Dangi compact years, cold Umm formatter/year,
and 1898 out-of-compact approximation establish real provider routes. Repeated
Chinese/Umm cases cover warm state; 2024 after 2023 covers warm decoder/new year.
Four eviction profiles first use 140 distinct compact years, then add a day in
2050 with independent July 2 expectation. Call poisoning discriminates original
Intl methods, forwarding unrelated calls through original Reflect.apply.
Other broad poisons run in idle synchronous native-Intl children; no arbitrary
provider ownership claim follows from them.

Five focused gates pass (four executed, one cached): public host integration,
Hermes source/bytecode, host boundary, complete compact calendar range and
TypeScript. Expanded validation passes all 80 tests (68 executed, 12 cached)
plus Temporal and DurationFormat package builds.
[Manifest](temporal-host-calendar-validation-targets.txt) records all 82 targets. No new specification inconsistency
identified. Remaining obligations: host/generated data completeness and accuracy,
full non-ISO arithmetic policies, all caller bounds, realms, installation, native
transport and broader provider error/reentry contracts. Historical line/section
completion counts receive no automatic credit.
