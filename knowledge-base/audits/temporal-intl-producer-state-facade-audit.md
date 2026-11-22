# Temporal Intl producer, selected profiles and facades

Frozen rendered Temporal comparison §§15.6.4–15.6.10. Requested ECMA-262 authority
boundary remains unchanged. This is21 named local-step closures, narrowing of
six conditional selected-kind rows and correction of four previously verified
numeric rows; no whole constructor or Intl signoff.

Final root validation: 18 tests pass; 15 executed. Log SHA256 `61c87065c7aeac4007445211e25555c61051acb185396046dfd486056964b648`. Cold dependency source review bound to final source hashes.
[Validation targets](temporal-intl-producer-state-facade-validation-targets.txt).

## Owned corrections

Private numeric options reuse captured allocation. Cold profiles select the
current supplied NumberFormat through own data descriptors and existing
constructor-keyed memoizers. Existing profiles retain their choices. Real
arab/latn late-provider controls check first rendering and profile reuse.

Day-period selection reuses captured find; GMT rendering reuses captured String
and RegExp operations; leap-month substitution uses the same replacement engine.
Literal noon/evening, both GMT signs and Chinese leap-month controls preserve
supplied CLDR rules, names and first-two hourFormat fields.

Selected-kind state captures Map operations and indexes private field Lists.
Original option Gets, overlap rejection, hour-cycle pattern choice and profile
identity remain intact. Cold/warm public controls distinguish profile creation
from cache hits. Cold applyExplicitTimePatternOptions corrections and two
matchRangeWidths allocations pass final validation. The latter helper still
owns Object.keys, private field/key Array iteration, patternParts.map and String
startsWith/endsWith. Those named operations keep all six selected-kind caller
rows conditional. Allocator controls and warmed producer tests do not close that
helper contract; it is locally owned, not an external Intl algorithm.

Single/range string facades concatenate indexed private values. Range parts
create fresh ordinary type/value/source objects and own result indices with
existing setDataProperty. Public iterator, push and inherited-index controls
retain literal text, source metadata, field order and ordinary descriptors.

Two numeric getter regressions exposed overbroad existing FormatNumeric evidence.
Four rows retain their local status only after correction and validation:
§15.6.4 steps16.c.iv,16.f.viii.1,16.f.ix.1,16.h.ii. Existing profile caches now
retain bound numeric functions. Native/FormatJS intrinsic getters are invoked
with their actual provider instances; ordinary late subclasses and established
late-provider lifecycle controls remain supported. Own-instance format overrides,
Proxy/bound constructors and arbitrary hostile pre-import state receive no
inferred coverage.

Legacy native formatters may lack formatToParts before polyfill installation.
Initial method discovery now primes available methods without requiring them;
actual parts consumers remain strict. Two packaged NumberFormat installation
controls fail before correction and pass with literal string/parts output.

## Evidence limits

The [source evidence](temporal-intl-producer-state-facade-source-evidence.json)
binds exact rows, final AST ranges, source hashes and final validation log.
Existing calendar, partition and numeric arithmetic proofs remain in force.
Supplied formatter engines/data are reused; no replacement engine or cache is
introduced. Thirty-one range-zone dependency rows and separate constructor,
realm and Duration gates remain unchanged.

This batch removes21 conditional steps. Six selected-kind rows retain narrowed
helper premises. Four numeric rows were already locally verified and needed
corrected evidence after public failures.
