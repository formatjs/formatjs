# Rust locale canonicalization

[ECMA-402 step-by-step implementation map](./SPEC.md).

`canonicalize_locale` validates ECMA-402 locale-tag grammar and applies ICU4X
language, script, region, and variant aliases. Unicode/transformed extension
aliases and subdivision aliases come from the repository's pinned CLDR data.
`get_canonical_locales` removes duplicates after canonicalization, preserving order.
Valid 5–8-letter language subtags are preserved despite ICU4X's narrower language type.

JavaScript coercion and `Intl.Locale` branding belong in the JSI adapter. This
crate accepts strings and has no Hermes dependency.

`compiled_data` is enabled by default. Disable default features to construct a
reusable `Canonicalizer` with `Canonicalizer::try_new_with_provider(&provider)`.
The provider must implement `BufferProvider + Send + Sync` and supply the four
global ICU4X locale metadata markers: aliases plus language, script/region, and
extended likely subtags. Construction loads those payloads once and returns
missing-data errors. Create a new canonicalizer when replacing the base pack.
This is global metadata loading, not per-locale asynchronous loading.

Without `compiled_data`, this crate does not enable baked ICU4X data; its
convenience functions/C ABI are disabled. Other dependencies can still enable
ICU's compiled data through Cargo feature unification. Generated CLDR language,
territory, extension, and subdivision alias tables remain compiled into this
crate. Hermes currently uses the default compiled-data C ABI.

```rust
use formatjs_intl_getcanonicallocales::get_canonical_locales;

assert_eq!(get_canonical_locales(&["iw", "he", "EN-us"]).unwrap(), ["he", "en-US"]);
```

`canonicalize.h` exposes a single-tag C ABI. Input is borrowed UTF-8. Successful
output is an owned, non-NUL-terminated byte slice; release it once with
`formatjs_locale_result_free`. Status codes distinguish invalid tags, invalid
input, and caught Rust panics. Allocation failure can still abort the process.

```sh
bazel run //crates/intl_getcanonicallocales:aliases
bazel test //crates/intl_getcanonicallocales:intl_getcanonicallocales_test
bazel test //crates/intl_getcanonicallocales:provider_test
bazel build -c opt //crates/intl_getcanonicallocales:intl_getcanonicallocales_native
```

The alias target regenerates the checked-in Rust table, following the existing
Rust generated-data model. ICU4X and JavaScript CLDR versions may differ; shared
conformance cases must pass before upgrading either data source.

The provider test compiles this crate without `compiled_data`, loads a small
JSON provider, checks alias parity and missing markers, and verifies payload
reuse after dropping the provider. The shared Bazel dependency graph can still
enable ICU baked data for other consumers; this test alone is not binary-size
or standalone Cargo feature-graph proof.
