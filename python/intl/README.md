# intl

Python bindings for FormatJS's high-level Rust internationalization runtime.

```sh
python -m pip install intl
```

```python
from intl import Intl

intl = Intl(["fr-CA", "fr"], "en", {"fr": {"hello": "Bonjour"}, "en": {}})
assert intl.format_message("hello", default_message="Hello") == "Bonjour"
```
