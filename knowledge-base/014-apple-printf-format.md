# Apple printf format research

Scope: Foundation `NSString` / CoreFoundation formatting, used by iOS and macOS. This is distinct from Java Formatter, Swift interpolation, libc `printf`, and logging-specific syntax. Apple describes Foundation formatting as ANSI/IEEE printf plus object formatting. [Apple formatting overview](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/Strings/Articles/FormatStrings.html)

## Foundation conversions

Apple documents `%@` for objects, `%%` for a literal percent, `%d`/`%D` for signed 32-bit integers, `%u`/`%U` for unsigned 32-bit integers, `%o`/`%O`, `%x`/`%X`, floating conversions `f F e E g G a A`, `%c` for an 8-bit character, `%C` for a UTF-16 code unit, `%s` for a byte-string pointer, `%S` for a UTF-16 string pointer, and `%p` for a pointer. Integer lengths include `hh h l ll q z t j`; `L` selects long double. `%@`, `%s`, and `%S` describe different argument types. Apple recommends `%ld`/`%lu`, with casts, for `NSInteger`/`NSUInteger`. [Apple specifier reference](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/Strings/Articles/formatSpecifiers.html)

## Printf grammar

Grammar is `%[position$][flags][width][.precision][length]conversion`. Positional arguments start at one. Width and precision can be supplied by `*` or `*position$`, consuming `int` arguments; an empty precision means zero. Negative dynamic width means left alignment; negative dynamic precision means unspecified precision. Mixed positional and ordinary arguments produce undefined or indeterminate behavior. Integer modifiers additionally include `j` and `t`; floating `l` means ordinary double, while `L` means long double. Libc also defines `# 0 - space + '` flags and wide-character `lc`/`ls`. Its deprecated `D O U` mean long integers, differing from Foundation's documented aliases. [Apple printf manual](https://developer.apple.com/library/archive/documentation/System/Conceptual/ManPages_iPhoneOS/man3/printf.3.html)

## CoreFoundation implementation differences

The first-party parser recognizes `i`, `j`, and `t`. Width/precision literals are bounded by `INT32_MAX`; explicit argument numbers by `INT8_MAX` (127). Dynamic width, precision, then value consume ordinary arguments in that order. The parser handles flags `#`, space, `-`, `+`, and `0`; repeated flags work, minus overrides zero, plus overrides space. Apostrophe has no matching parser case. Integer length is reset for `%c`; `%s` always selects byte strings, so `%lc`/`%ls` cannot be treated as UTF-16 aliases. `%n` consumes a dummy pointer rather than writing to the caller's pointer. Unknown conversions fall back to literals; malformed-format acceptance is therefore unsuitable as a validation oracle. [CoreFoundation parser and argument collection, pinned revision](https://github.com/swiftlang/swift-corelibs-foundation/blob/6384052c2281ad51362170df378c025400e74956/Sources/CoreFoundation/CFString.c#L5970)

## Stringsdict is separate

`NSStringLocalizedFormatKey` uses named substitutions such as `%#@files@`. The corresponding dictionary supplies `NSStringFormatValueTypeKey` and plural variants; the named token alone does not identify its argument type. `other` is required, and variants may omit the numeric placeholder entirely. A plain printf structural-equality rule must not be presented as full stringsdict validation. [Apple stringsdict format](https://help.apple.com/xcode/mac/current/en.lproj/devaf8b4090a.html)

## Recommended supported subset

Implementation policy, inferred from the references above:

- Name dialect `apple-printf`, covering Foundation on iOS and macOS.
- Parse borrowed tokens with UTF-8 byte spans. Resolve dynamic width, precision, and value arguments separately.
- Reject mixed indexing, positional gaps, zero indices, overflow, incomplete conversions, and unknown conversions. Do not emulate permissive runtime fallback.
- Support documented integer/floating lengths. Reject length modifiers on object, pointer, character, and string conversions; especially avoid equating `lc`/`ls` with `C`/`S`.
- Reject `%n` and named stringsdict substitutions explicitly. Keep plist/XML decoding outside this parser.
- Compare resolved argument types and integer lengths. Permit positional reordering, repeated references, and presentation changes. Preserve distinctions among object, byte string, UTF-16 string, pointer, integer signedness/length, double, and long double. Dynamic width/precision arguments participate in compatibility checks.
- Use spec-derived cases on Linux. Darwin Foundation execution can verify platform behavior separately; Linux libc output cannot establish Foundation conformance.
