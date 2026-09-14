# py_intl

Python bindings for FormatJS's high-level Rust internationalization runtime.

```sh
python -m pip install py_intl
```

```python
from datetime import date

from intl import Intl, IntlError, define_message

errors: list[IntlError] = []
intl = Intl(
    ["fr-CA", "fr"],
    "en",
    {"fr": {"hello": "Bonjour"}, "en": {}},
    on_error=errors.append,
)
assert intl.format_message("hello", default_message="Hello") == "Bonjour"

# IDs are optional and generated from the descriptor.
assert intl.format_message(default_message="Welcome") == "Welcome"

greeting = define_message(default_message="Hello, {name}!")
assert intl.format_message(greeting, values={"name": "Ada"}) == "Hello, Ada!"

created = define_message(default_message="Created {value, date, medium}")
assert intl.format_message(created, values={"value": date(2024, 1, 2)}) == "Created Jan 2, 2024"
```

Use the `Intl` instance negotiated for the current request. Generated IDs are
locale-independent. `on_error` receives recovered missing-translation and
formatting errors while `format_message` continues through FormatJS fallback.
Datetime fields are formatted as supplied; convert timezone-aware values before
formatting when another presentation timezone is required.

## Generated message contracts

Generate typed Python wrappers from a FormatJS source catalog:

```json
{
  "cart.total": {"defaultMessage": "{count, plural, other {# items}}"},
  "cart.empty": {"defaultMessage": "Your cart is empty"}
}
```

```sh
python -m intl.codegen en.json --out messages.py
```

Keep both generated files: `messages.py` supplies runtime wrappers;
`messages.pyi` supplies message-specific `TypedDict` contracts. The stub uses
`typing_extensions.ReadOnly` for Python 3.12 compatibility. The wrappers add
no runtime dependency on typing_extensions.

```python
from messages import cart_total, cart_empty

cart_total(intl, values={"count": 2})
cart_empty(intl)

# Type errors:
cart_total(intl)
cart_total(intl, values={"count": "two"})
```

Names derive from catalog IDs by replacing punctuation with underscores;
leading digits and Python keywords receive a `message_` prefix. Collisions
are rejected. String catalogs and descriptors with `defaultMessage` and an
optional string `description` are supported.

Contracts come from the Rust ICU parser, including apostrophe escapes and every
nested branch. Numbers/plurals require `int | float`; dates/times accept
`date | datetime | int | float`. Repeated arguments must satisfy every role.
All contract fields are required and readonly to the type checker. Empty messages
allow omitted values. Runtime dictionaries are not frozen.

Python's type system treats `bool` as an `int`, so static numeric checks cannot
exclude booleans. Runtime formatting still checks values and translated messages.
Rich tags are rejected during generation because Python Intl has no rich callback
API. Raw `Intl.format_message` calls keep their existing dynamic interface;
use the generated wrappers for per-message checks. Generate from source catalogs,
not independently from each translation.
