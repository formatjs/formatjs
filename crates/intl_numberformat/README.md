# formatjs_intl_numberformat

Rust NumberFormat core with on-demand CLDR data. Decimal, percent, currency,
units, compact/scientific/engineering notation, parts and ranges run in Rust.
Owned C ABI, Hermes source/bytecode installers and SDK packaging are included.
The native facade owns observable coercion, option getter order, receiver brands
and cached nonconstructor format functions.

`Registry` starts empty. Add selected JSON files from `:locale_data`, canonicalize
requested tags before `negotiate`, then obtain an owned `Arc<LocaleData>` with
`get`. Lookup and best-fit matching only consider loaded locales. Loading a new
payload does not change records already held by existing consumers. Explicit
regional packs take precedence over aliases and synthesized parents.

`Registry::create` negotiates the winning requested locale, Unicode `nu`, and
constructor options. `NumberFormat::format`, `format_to_parts`, `format_range`
and `format_range_to_parts` accept normalized mathematical strings from the host's
ToIntlMathematicalValue, including `NaN`, infinities and exact BigInt integers.
The host still owns observable JS coercion and getter order.

Rounding shares the PluralRules decimal engine with currency/percent fraction
defaults. A decimal-point record preserves enormous integer magnitude without
an ICU i16 limit; guard/sticky digits preserve rounding without moving tiny
values. Digit substitution groups complete Unicode code points.

Numbering-system aliases are resolved without copying the large data maps.
Malformed packs and cyclic or missing alias targets fail before registry state
changes. `add_unit_data` explicitly extends the units shared by existing records,
matching TS `__addUnitData` behavior.

The generator combines existing NumberFormat CLDR output with owned PluralRules
packs. Its matching index uses canonical tags, including `sh` / `sr-Latn`.
No host ICU locale fallback is needed when loading a pack.

```sh
bazel test -c opt //crates/intl_numberformat/...
```

Registry tests cover replacement ownership, explicit aliases, parent synthesis,
and atomic rejection. Core tests cover 40,002-digit integers, tiny fractions,
directed rounding and explicit unit updates. Output conformance compares every
generated locale and all advertised numbering systems with TS, including currency
digits, units, compound units, precision, signs, notation and range affixes.

The C ABI in `numberformat.h` separates locale resolution from formatting options.
`formatjs_number_resolve` captures the selected record and numbering system;
`formatjs_number_create` configures it without consulting the registry again.
This preserves resolution when later JS option getters register replacement packs.
Both handles own their data and survive registry destruction.

Queries accept primitive text plus a BigInt flag after the host performs
ToPrimitive. The shared mathematical parser handles exact radix/decimal strings,
Number overflow/underflow and negative zero. The host rejects Symbols and missing
range endpoints before calling Rust. Status 1 maps to RangeError, 4 to TypeError;
2 signals invalid ABI input and 3 a caught Rust panic. Destroy each handle and free
each successful byte result exactly once.

Hermes conformance runs both source and precompiled factories against TS for
over 7,600 numeric cases per mode, plus ranges, ordered option failures, input/receiver
errors, constructor prototypes, locale replacement and shared unit updates.
The SDK ships `38-IntlNumberFormat.js`, public adapters and per-locale packs;
the independent consumer embeds only selected English/French packs.
