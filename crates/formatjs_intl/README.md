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

Requested locales must already be ordered by preference. HTTP
`Accept-Language` parsing stays in the application or web-framework adapter.
