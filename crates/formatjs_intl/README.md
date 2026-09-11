# formatjs_intl

High-level Rust internationalization runtime. Owns message descriptors,
translation catalogs, ICU4X locale negotiation, and shared compiled-message
caching. Formatting delegates to `formatjs_icu_messageformat`.

`message_descriptor!` generates missing IDs with
`[sha512:contenthash:base64:10]`. Pass `id:` to keep a semantic ID.

```rust
use formatjs_icu_messageformat::{Value, Values};
use formatjs_intl::{Intl, IntlCache, MessageCatalog, message_descriptor};
use std::{collections::HashMap, sync::Arc};

const TASKS: formatjs_intl::MessageDescriptor = message_descriptor!(
    id: "tasks.count",
    default_message: "{count, plural, one {# task} other {# tasks}}",
    description: "Task count"
);

let mut catalog = MessageCatalog::new();
catalog.insert(
    "fr",
    HashMap::from([(
        "tasks.count".to_owned(),
        "{count, plural, one {# tâche} other {# tâches}}".to_owned(),
    )]),
)?;
catalog.insert("en", HashMap::new())?;

let intl = Intl::try_new(
    ["fr-CA", "fr"],
    "en",
    Arc::new(catalog),
    Arc::new(IntlCache::new()),
)?;
let values: Values = HashMap::from([("count".to_owned(), Value::from(2_i64))]);
assert_eq!(intl.format_message_to_string(TASKS, &values)?, "2 tâches");
# Ok::<(), formatjs_intl::Error>(())
```

Use `format_message!` for inline application copy. It creates the same
descriptor, is recognized by `formatjs extract`, and returns a `String`:

```rust
# use formatjs_intl::{Intl, format_message};
# fn render(intl: &Intl, path: &str) {
let title = format_message!(
    intl,
    default_message: "Approve to continue",
    description: "Approval card title",
);
let detail = format_message!(
    intl,
    default_message: "Allow access to {path}?",
    description: "Directory approval explanation",
    values: { path: path },
);
# }
```

Inline values are converted to `Value` automatically. Their names are checked
against `default_message` at compile time, including nested select and plural
arguments. Use `values: &values` to pass a dynamically assembled or reused map.

If cache infrastructure fails, this macro reports the error through
`with_on_error` and returns `default_message` verbatim. Fallible formatting
methods remain available when callers need explicit error handling.

Message formatting falls back from the selected locale catalog to the default
locale catalog, then the descriptor's `default_message`. Invalid translations
also use this chain. Attach `with_on_error` to observe recovered formatting and
infrastructure errors:

```rust
# use formatjs_intl::{FormatMessageError, Intl};
# fn configure(intl: Intl) -> Intl {
let intl = intl.with_on_error(|error: &FormatMessageError| {
    eprintln!("{error}");
});
# intl
# }
```

## Typed presentation text

Use `formatted_message!` when an interface should accept formatted text rather
than arbitrary strings. It returns `formatjs_intl::FormattedMessage` and uses
the same extraction, IDs, locale negotiation, fallback, and `with_on_error`
reporting as `format_message!`. There is no raw-string constructor.

Untranslated content must come from an application-owned type implementing
`VerbatimSource`. Implement that trait beside the domain type's controlled
constructors, not on a generic string wrapper or diagnostic error.

```rust
use formatjs_intl::{Intl, FormattedMessage, Verbatim, VerbatimSource, formatted_message};

struct SelectedFile {
    name: String,
}

impl VerbatimSource for SelectedFile {
    fn as_verbatim(&self) -> &str {
        &self.name
    }
}

fn render(intl: &Intl, file: &SelectedFile) -> FormattedMessage {
    formatted_message!(
        intl,
        default_message: "Open {path}?",
        description: "Confirmation before opening a selected file",
        values: { path: Verbatim::new(file) },
    )
}
```

`Verbatim` is interpolation-only: it cannot convert directly to
`FormattedMessage`. Strings, paths, and arbitrary `Display` values do not
implement `VerbatimSource`, so `Verbatim::new(&error.to_string())` does not
compile. Applications remain responsible for reviewing their domain types and
trait implementations; this is a type-level guard, not a security sandbox.

Other replacements accept nested `FormattedMessage` values (including borrowed
messages), numbers, booleans, and `formatjs_icu_messageformat::DateTimeValue`.
For reusable replacement maps, use `MessageValues` and pass `values: &values`.
For static descriptors, `Intl::format_message_typed` returns
`Result<FormattedMessage>` and `format_message_typed_or_default` also recovers
infrastructure failures with the descriptor default. Read the result with
`as_str()` or consume it with `into_string()` at the final presentation step.

Migration: `FormattedMessage::verbatim(...)` has been removed. Move permitted
untranslated sources behind domain-owned `VerbatimSource` implementations and
interpolate them with `Verbatim::new(&source)` in an authored message. Do not
replace the old constructor with a catch-all string wrapper or a `"{detail}"`
message that forwards diagnostics.

The type records a formatting path; it does not guarantee translation coverage,
successful interpolation, HTML escaping, or sanitized content. It is separate
from the existing low-level `formatjs_icu_messageformat::FormattedMessage<T>`
rich-text result. Existing string and rich-text formatting interfaces remain
unchanged.

Precompile catalogs with the FormatJS CLI to skip runtime message parsing:

```sh
formatjs compile translations/fr.json --out-file translations/fr.compiled.json --ast
```

Add `serde_json` to load the compiled catalog:

```toml
[dependencies]
serde_json = "1"
```

```rust
# use formatjs_intl::{MessageCatalog, PrecompiledMessages};
let messages: PrecompiledMessages =
    serde_json::from_str(include_str!("../translations/fr.compiled.json"))?;
let mut catalog = MessageCatalog::new();
catalog.insert_precompiled("fr", messages)?;
# Ok::<(), Box<dyn std::error::Error>>(())
```

Precompiled messages are ready to format when inserted and do not use
`IntlCache`.

Requested locales must already be ordered by preference. HTTP
`Accept-Language` parsing stays in the application or web-framework adapter.
