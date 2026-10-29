# formatjs_intl_listformat

ListFormat patterns and parts in Rust. Caller-loaded JSON packs contain CLDR
conjunction/disjunction/unit patterns for all three styles. Loading is atomic;
existing instances retain their data after replacement.

UTF-16 units preserve lone surrogates and empty elements. Patterns compile once.
Iterative expansion takes linear time without recursive stack growth. Inline
comments link pinned ECMA-402 algorithms.

On Linux:

```sh
bazel test -c opt //crates/intl_listformat:intl_listformat_test \
  //crates/intl_listformat/tests:conformance_test
```

TS conformance covers every generated locale/type/style, list lengths, Unicode
and malformed UTF-16. Rust tests cover invalid packs, 20,000-element lists,
matching, lazy loading and retained instances.

The owned C ABI exposes per-runtime registries and immutable instances. JSON
requests carry UTF-16 arrays, keeping lone surrogates outside scalar-text parsing.
`formatjs_list_create_default` accepts a JSON array of canonical requested tags
and negotiates/creates an owned default instance in one call. An empty array
uses the registry default. The existing constructor still accepts a negotiated
locale and explicit type/style options.
The Hermes facade performs observable coercion, iteration and brand checks.
`//native/hermes/tests:listformat_conformance_test` compares source and optimized
bytecode installers with TS. The SDK includes adapters, selected JSON packs and
an independent consumer smoke test. Native validation runs on Linux; macOS only
executes cross-built artifacts.

## Compiled provider

`:with_compiled_data` embeds build-selected binary locale records.
`Registry::with_compiled_data()` makes those locales available without JSON
registration. DateTimeFormat also exposes `Runtime::with_compiled_data()`.
Select locales with `--//crates/intl_data:locales=en,fr`; the default follows Chromium desktop's full-data UI language filter, including regional
and script variants available in this checkout. Use `--//crates/intl_data:locales=\*`
to include every CLDR locale.
Rust validates packs and compiles plural rules during the build. Records decode
lazily into per-registry caches; mutable data never crosses registry boundaries.
The original target and `Registry::default()` retain explicit registration for
custom providers. See [Hermes data setup](../../native/hermes/README.md#compiled-locale-data).
