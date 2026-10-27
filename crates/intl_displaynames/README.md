# formatjs_intl_displaynames

DisplayNames code validation, canonicalization and CLDR name lookup in Rust.
Per-locale JSON packs load independently. Registry replacement leaves existing
instances unchanged. Language names support dialect/standard data and localized
region composition; unknown names use canonical-code or undefined fallback.

On Linux:

```sh
bazel test -c opt //crates/intl_displaynames:intl_displaynames_test \
  //crates/intl_displaynames/tests:conformance_test
```

Conformance compares all locales/types/styles/fallbacks with public TS. Inline
comments link pinned ECMA-402 source lines. The owned C ABI validates UTF-16
codes, preserves error classes and returns owned buffers. Hermes observable
coercion is handled by the TS facade in `native/hermes/displaynames.ts`.
`//native/hermes/tests:displaynames_conformance_test` compares source and optimized
bytecode installers with TS. The SDK includes headers, adapters, independent
locale JSON packs and consumer smoke tests for English, French and Afar.
Native builds/cross-builds run on Linux; macOS runs downloaded artifacts.

## Compiled provider

`:with_compiled_data` embeds build-selected binary locale records.
`Registry::with_compiled_data()` makes those locales available without JSON
registration. Select locales with `--//crates/intl_data:locales=en,fr`; the default follows Chromium desktop's ICU language filter, including regional
and script variants available in this checkout. Use `--//crates/intl_data:locales=\*`
to include every CLDR locale.
Rust validates packs and compiles plural rules during the build. Records decode
lazily into per-registry caches; mutable data never crosses registry boundaries.
The original target and `Registry::default()` retain explicit registration for
custom providers. See [Hermes data setup](../../native/hermes/README.md#compiled-locale-data).
