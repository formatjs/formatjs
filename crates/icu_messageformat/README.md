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
