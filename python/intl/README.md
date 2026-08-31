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
