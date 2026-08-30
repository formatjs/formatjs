# icu_skeleton_parser

Python bindings for FormatJS's Rust ICU number and date skeleton parser.

```sh
python -m pip install icu_skeleton_parser
```

```python
from icu_skeleton_parser import parse_number_skeleton

options = parse_number_skeleton("currency/USD compact-short")
```
