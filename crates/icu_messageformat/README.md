# formatjs_icu_messageformat

Rust runtime for ICU MessageFormat. Mirrors `intl-messageformat` around the
existing `formatjs_icu_messageformat_parser` AST and uses ICU4X for locale-aware
number, date/time, and plural formatting.

```rust
use formatjs_icu_messageformat::{IcuMessageFormat, Value};
use std::collections::HashMap;

let message = IcuMessageFormat::try_new(
    "Hello, {name}. You have {count, plural, one {# task} other {# tasks}}.",
)?;
let values = HashMap::from([
    ("name".to_owned(), Value::from("Ada")),
    ("count".to_owned(), Value::from(2_i64)),
]);
assert_eq!(
    message.format_to_string("en-US", &values)?,
    "Hello, Ada. You have 2 tasks."
);
# Ok::<(), formatjs_icu_messageformat::Error>(())
```

Messages are parsed once without a locale. Pass each request's locale to
`format`, `format_to_parts`, or `format_to_string`; one compiled message can be
shared across requests with different locales.

Unix epoch millisecond values are formatted in UTC. ICU4X currently lacks full
ECMA-402 currency, unit, and time-zone formatting parity; custom implementations
can be supplied through the `Formatters` trait.

## External ICU data

The default `compiled_data` feature preserves the existing constructors. Disable
it to supply ICU4X data yourself:

```toml
[dependencies]
formatjs_icu_messageformat = { version = "0.1", default-features = false }
icu_provider_blob = "2.1"
```

```rust,ignore
use formatjs_icu_messageformat::{IcuMessageFormat, Options, ProviderFormatters};
use icu_provider_blob::BlobDataProvider;
use std::sync::Arc;

let provider = BlobDataProvider::try_new_from_blob(bytes.into_boxed_slice())?;
let options = Options::with_formatters(Arc::new(ProviderFormatters::new(provider)));
let message = IcuMessageFormat::try_new_with_options("{count, number}", options)?;
```

Use the same options with `from_ast_with_options` for precompiled messages.
Generate a compatible blob with ICU4X `icu4x-datagen`, including the locales and
markers needed for numbers, cardinal/ordinal plurals, calendars, dates, and times.
The provider must support the requested locales or implement locale fallback
(for example, through ICU4X's `LocaleFallbackProvider`). Missing data returns a
formatter error; it does not silently use compiled data. Deserialization support
must match the buffer format; `icu_provider_blob` enables Postcard support.

Data errors name the formatter and locale and keep the ICU4X error as
`source()`. Call `Formatters::check_locale` at startup for each locale you
format with; it builds every formatter and returns the first such error. Behind
`LocaleFallbackProvider`, a locale missing from the provider resolves to root
(`und`) data and passes this check; `formatjs_intl`'s
`IntlContext::check_catalog` also rejects that case.

Without `compiled_data`, `DefaultFormatters`, `Options::default()`, and the
constructors that use default options are unavailable. Explicit-options APIs
remain available. Other dependencies can re-enable ICU compiled data through
Cargo feature unification; check the final application's dependency graph.
