# Duration formatter memoizer

Frozen Temporal comparison §§15.10.1–2 step4. Current ECMA-262 authority and
comparison distinction remain unchanged.

Two public cold-provider controls fail before correction: replacement of
JSON.stringify and inherited Object.prototype.toJSON. Both run through actual
DurationFormat.format/formatToParts, with literal fullwidth minute/second output
and complete expected parts. Existing22 controls pass before correction.

Shared fast-memoize now captures runtime operations. Default serialization clears
prototypes only on its private argument wrappers. Existing serializer, cache,
strategy selection and bound-context algorithms remain in use. Public argument
objects/arrays retain own or inherited toJSON; custom serializers retain ordinary
argument Arrays with methods and iteration. Constructor-specific formatter
factories capture their existing variadic strategy once.

Six owning compatibility tests check these public contracts and preserve original
arguments, explicit undefined and argument count. No serializer or formatter
engine replacement. Existing exact BigDecimal formatting remains covered.

[Ten targets](temporal-duration-memoizer-validation-targets.txt) pass, including
owning helper semantics, NumberFormat/DateTimeFormat/DurationFormat, precision and
TS/native Hermes registrations/source/bytecode. [Source and validation
record](temporal-duration-memoizer-source-evidence.json) binds this batch.

Three Duration parent gates remain conditional on an exact next source premise:
owned getInternalSlots still reads live WeakMap.get/set and Object.create.
Constructor-only numbering-system cache has the same live operations. Slot
regression is prepared, not executed here. This does not reopen supplied Intl
formatting algorithms or expand into an unrelated intrinsic sweep.
