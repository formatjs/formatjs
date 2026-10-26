# formatjs_intl_locale

Rust core for `Intl.Locale`. Shares ICU4X-backed canonicalization with
`formatjs_intl_getcanonicallocales` and generates static tables from the TS
package's CLDR inputs. Includes constructor overrides, Unicode keywords,
maximization/minimization, calendar/hour-cycle preferences, time zones,
script direction and week information.

`LocaleOptions` contains already-coerced values. The JS boundary owns coercion,
brands and option getter order. `validate_option` permits immediate validation
before reading the next option. Original tags are canonicalized before overrides.

Numbering-system and collation methods take actual formatter observations.
Query these at method-call time so on-demand locale loading does not leave
stale capabilities. Static metadata can be cached; public arrays must be fresh.

`locale.h` exposes an owned opaque handle. Create/destroy once per JS instance;
query results own UTF-8 JSON bytes, freed separately. Queries accept current
formatter observations. Scalar metadata omits formatter-dependent work. The JS
binding maps null optional scalar fields to undefined.

On Linux:

```sh
bazel test //crates/intl_locale:intl_locale_test
bazel test //packages/intl-locale:rust_conformance_test
bazel test //native/hermes/tests:locale_conformance_test
```

Conformance compares complete records over aliases, long language subtags,
variants, Unicode options, region/subdivision overrides and likely-subtag
entries. Rust tests port existing maximize/minimize and preference examples.

`native/hermes/locale.ts` owns observable coercion and brands; the C++ HostObject
owns the Rust record until GC. String options validate before the next getter.
Formatter observations are queried at method-call time. Integration tests load
Bengali NumberFormat data after construction and verify the same Rust instance
sees it. The standalone SDK consumer exercises the precompiled extension path.
