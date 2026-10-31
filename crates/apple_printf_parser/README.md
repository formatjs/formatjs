# formatjs_apple_printf_parser

Borrowing, dependency-free Rust parser for Apple Foundation format strings used
by `NSString`, `CFString`, and Swift `String(format:)` on iOS and macOS.

```rust
use formatjs_apple_printf_parser::parse;
let tokens = parse("%2$@ has %1$ld items (%%)").unwrap();
```

`parse(&str)` returns literals and specifiers with UTF-8 byte spans, raw syntax,
flags, length modifiers, conversion kinds, and resolved one-based arguments.
Width and precision are fixed numbers or separate argument references. Ordinary
`%*.*f` consumes width, precision, then value. Positional reordering and reuse
are supported; mixed indexing, gaps, zero indices, and overflows are errors.
Explicit indices are limited to 127, matching CoreFoundation's parser.

Foundation meanings apply: `%@` objects, `%C` UTF-16 code units, `%S` UTF-16
strings, `%s` byte strings, and `%D/%U/%O` 32-bit aliases. Integer lengths
`hh h l ll q j z t` and floating `l L` are supported. Duplicate flags work;
`-` overrides `0`, `+` overrides space. Bare precision means zero.

This is a strict supported subset, not an emulator of Foundation's permissive
fallback for malformed formats. `%n`, `.stringsdict` named references
`%#@name@`, logging privacy annotations, apostrophe grouping, and lengths on
object/pointer/string/character conversions are rejected. `%lc/%ls` are not
UTF-16 aliases in Foundation. Plist decoding and plural expansion belong to
callers. This crate neither formats values nor validates runtime arguments.

References: [Apple specifiers](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/Strings/Articles/formatSpecifiers.html),
[Apple printf grammar](https://developer.apple.com/library/archive/documentation/System/Conceptual/ManPages_iPhoneOS/man3/printf.3.html),
[research and implementation differences](../../knowledge-base/014-apple-printf-format.md).
