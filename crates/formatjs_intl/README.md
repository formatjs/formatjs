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
# use formatjs_icu_messageformat::Values;
# use formatjs_intl::{Intl, format_message};
# fn render(intl: &Intl, values: &Values<String>) {
let title = format_message!(
    intl,
    default_message: "Approve to continue",
    description: "Approval card title",
);
let detail = format_message!(
    intl,
    default_message: "Allow access to {path}?",
    description: "Directory approval explanation",
    values: values,
);
# }
```

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
