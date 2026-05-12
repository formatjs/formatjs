# Intl.Collator

`Intl.Collator` is part of the current ECMA-402 surface, but FormatJS does not
currently ship a data-backed collator polyfill.

This package directory tracks that gap explicitly. A complete implementation
needs locale-sensitive collation data and comparison semantics for:

- `Intl.Collator`
- `Intl.Collator.supportedLocalesOf`
- `Intl.Collator.prototype.compare`
- `Intl.Collator.prototype.resolvedOptions`
- `String.prototype.localeCompare`

