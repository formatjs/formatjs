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

On Linux:

```sh
bazel test //crates/intl_locale:intl_locale_test
bazel test //packages/intl-locale:rust_conformance_test
```

Conformance compares complete records over aliases, long language subtags,
variants, Unicode options, region/subdivision overrides and likely-subtag
entries. Rust tests port existing maximize/minimize and preference examples.

Hermes binding and SDK coverage remain in progress. The binding must own the
Rust record for the JS instance's lifetime, validate options in spec order,
and query formatter-dependent methods at call time rather than freezing their
capabilities in constructor metadata.
