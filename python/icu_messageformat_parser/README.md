# icu_messageformat_parser

Python bindings for FormatJS's Rust ICU MessageFormat parser.

```sh
python -m pip install icu_messageformat_parser
```

```python
from icu_messageformat_parser import parse, print_ast

ast = parse("Hello, {name}!")
assert print_ast(ast) == "Hello, {name}!"
```
