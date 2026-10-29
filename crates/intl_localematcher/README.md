# formatjs_intl_localematcher

Standalone CLDR best-fit matching with ICU4C/J 78 defaults. ICU4X supplies locale
parsing, canonicalization, and likely-subtag expansion. Distance tables share the
TypeScript matcher's CLDR generator. This unpublished crate is independent of
`intl_locale`'s existing native matcher and `formatjs_intl` catalog fallback.

```rust
use formatjs_intl_localematcher::LocaleMatcher;

let matcher = LocaleMatcher::new(&["en", "es", "es-419"], "en")?;
let result = matcher.best_match(&["es-CO"])?;
assert_eq!(result.locale, "es-419");
assert_eq!(result.desired_index, Some(0));
# Ok::<(), formatjs_intl_localematcher::InvalidLocale>(())
```

Construct once, reuse across threads. Results preserve original supported tags.
`desired_index` and `supported_index` are `None` when matching falls back to the
default. Invalid tags return `InvalidLocale`; the full requested list is validated.
Variants and extensions do not affect LSR distance except ICU pseudolocales.
The bounded closest-match cache holds at most 256 desired LSRs. For repeated
requests, build `DesiredLocale::new(tag)` once and call
`matcher.best_match_prepared(&requests)` to avoid parsing and allocation.
The cross-runtime benchmark lives in `benchmarks/locale-matching/`.

This crate does not change `formatjs_intl` catalog fallback and is not published.

```sh
bazel test //crates/intl_localematcher:all
bazel run //crates/intl_localematcher:distance
bazel run -c opt //crates/intl_localematcher:matcher_bench
```

The algorithm follows Unicode ICU `LocaleMatcher`/`LocaleDistance`; generated
CLDR data is covered by the [Unicode data license](https://www.unicode.org/license.txt).
