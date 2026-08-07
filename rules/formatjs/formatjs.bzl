"""Public API for rules_formatjs

Load this file to access FormatJS Bazel rules:

```starlark
load("@rules_formatjs//formatjs:defs.bzl", "formatjs_extract", "formatjs_compile")
```
"""

load("//formatjs:defs.bzl", _formatjs_compile = "formatjs_compile", _formatjs_extract = "formatjs_extract")

formatjs_extract = _formatjs_extract
formatjs_compile = _formatjs_compile
