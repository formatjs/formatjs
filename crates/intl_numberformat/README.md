# formatjs_intl_numberformat

Rust NumberFormat port in progress. The current crate loads versioned CLDR
number/plural records on demand; formatting and Hermes installation are not yet
implemented.

`Registry` starts empty. Add selected JSON files from `:locale_data`, canonicalize
requested tags before `negotiate`, then obtain an owned `Arc<LocaleData>` with
`get`. Lookup and best-fit matching only consider loaded locales. Loading a new
payload does not change records already held by existing consumers. Explicit
regional packs take precedence over aliases and synthesized parents.

Numbering-system aliases are resolved without copying the large data maps.
Malformed packs and cyclic or missing alias targets fail before registry state
changes. `add_unit_data` explicitly extends the units shared by existing records,
matching TS `__addUnitData` behavior.

The generator combines existing NumberFormat CLDR output with owned PluralRules
packs. Its matching index uses canonical tags, including `sh` / `sr-Latn`.
No host ICU locale fallback is needed when loading a pack.

```sh
bazel test -c opt //crates/intl_numberformat:intl_numberformat_test \
  //crates/intl_numberformat/tests:packs_test
```

Registry tests cover replacement ownership, explicit aliases, parent synthesis,
and atomic rejection. Pack conformance loads every generated locale through the
real Rust parser and checks canonical locale/numbering-system metadata.
