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
comments link pinned ECMA-402 source lines. Hermes observable coercion, owned
ABI and SDK packaging remain in progress.
