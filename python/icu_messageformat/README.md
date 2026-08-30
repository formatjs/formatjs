# icu_messageformat

Python bindings for FormatJS's Rust ICU MessageFormat runtime.

```sh
python -m pip install icu_messageformat
```

```python
from icu_messageformat import IcuMessageFormat

message = IcuMessageFormat("{count, plural, one {# item} other {# items}}")
assert message.format({"count": 2}) == "2 items"
```
