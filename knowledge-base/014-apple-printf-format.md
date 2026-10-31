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

## Xcode String Catalog input

Apple describes `.xcstrings` as JSON containing an entire string table, all languages, and metadata. Xcode compiles catalogs into `.strings` and `.stringsdict`; keys are unique within a table, not across tables. Keep file identity in diagnostics and do not merge equal keys across catalogs. [Apple WWDC23 catalog introduction](https://developer.apple.com/videos/play/wwdc2023/10155/)

Apple's Backyard Birds catalog provides concrete version `1.0` data: top-level `sourceLanguage`, `strings`, and `version`; each entry has optional `localizations`, and ordinary values live at `localizations[locale].stringUnit.value`. Source-language localization is sometimes absent, in which case the key itself supplies the source text. Other entries include explicit source values with positional specifiers different from the key. Prefer explicit source text before falling back to the key. [Apple's original catalog](https://github.com/apple/sample-backyard-birds/blob/1843d5655bf884b501e2889ad9862ec58978fdbe/Multiplatform/Localizable.xcstrings)

Apple documents language-specific plural categories and device variants. English `one` can contain a literal number, while `other` contains the numeric placeholder. Target plural categories need not match source categories; source plural changes propagate differently from changes made only to a target language. [Apple catalog editing guide](https://developer.apple.com/documentation/xcode/localizing-and-varying-text-with-a-string-catalog)

No complete normative Apple JSON schema was found. The following evidence comes from original catalogs and implementer-owned source, rather than an Apple schema:

- Hidden Spectrum's original plural fixture combines a host `stringUnit` containing named `%#@...@` references with `substitutions[name]` objects. Each object supplies one-based `argNum`, a `formatSpecifier` such as `lld`, and `variations.plural[category].stringUnit`. Substitution branch `%arg` denotes the owning substitution's argument: the second substitution still uses `%arg`, with `argNum: 2`. [Original plural fixture](https://github.com/hidden-spectrum/swift-translate/blob/d1e2bec164ce75c3d9a2ac18e0a8e4ee6dca62bd/ExampleCatalogs/PluralTest.xcstrings)
- Its reader passes both substitution argument number and format specifier into the variation-construction context. [Substitution reader](https://github.com/hidden-spectrum/swift-translate/blob/d1e2bec164ce75c3d9a2ac18e0a8e4ee6dca62bd/Sources/SwiftStringCatalog/Models/_Substitution.swift)
- xckit's recursive fixture nests `variations.device[device].variations.plural[category].stringUnit`. Do not stop traversal at the first variation level. [Original nested fixture](https://github.com/corrupt952/xckit/blob/15573c0c95e5ffbf2bdfc7882d9e4ac1fd79fe3d/fixtures/nested_variations.xcstrings)
- xckit's model makes `shouldTranslate` optional and excludes explicit `false`; omission leaves strings eligible. It recursively collects top-level and substitution leaves. [Catalog reader](https://github.com/corrupt952/xckit/blob/15573c0c95e5ffbf2bdfc7882d9e4ac1fd79fe3d/xcstrings/xcstrings.go)
- xckit's tokenizer distinguishes named references and `%arg` before matching ordinary printf conversions; otherwise `%arg` can be misread as `%a` followed by text. [Tokenization implementation](https://github.com/corrupt952/xckit/blob/15573c0c95e5ffbf2bdfc7882d9e4ac1fd79fe3d/command/lint.go#L540)
- AltStore's actual catalog uses version `1.1` with the same ordinary localization shape. This proves version existence, not complete equivalence with version `1.0`. [Original version 1.1 catalog](https://github.com/altstoreio/AltStore/blob/56854e66fef2eac32dad88dcbad1dc131d430e60/AltStore/Resources/Localizable.xcstrings)

Adapter policy: accept tested `1.0`/`1.1` shapes, reject unsupported versions or structures clearly, recurse through plural/device variants, skip `shouldTranslate: false`, preserve file/key/variant diagnostic context, and resolve `%arg` using substitution metadata before invoking plain printf validation. Require explicit metadata for named substitutions. Plural branches may omit their selector argument; do not require every source placeholder in every plural form. Root plural selector inference with multiple numeric arguments remains undocumented by these references; reject ambiguous inference instead of assuming the first number controls selection.

### Literal percent ambiguity

ControlRoom's original catalog includes the key `100%`, translated to `100%` in Arabic, with only a normal `stringUnit` and no formatting metadata. A strict printf parse of every catalog leaf would reject this ordinary text. [Original literal-percent catalog](https://github.com/twostraws/ControlRoom/blob/1764564f7923f0afc0d216ede573e20bd3c19f6e/ControlRoom/Localizable.xcstrings)

No general per-entry formatting marker was found in the inspected Apple catalogs or reader model. Plain strings and externally formatted `NSLocalizedString` values share storage. Inference therefore has limits: `50% off` can mean ordinary prose or contain syntactically valid `% o` formatting. Recommended policy: determine formatting from source metadata when available; otherwise apply a documented source-based heuristic and preserve plain percent text. Do not claim catalog-only analysis can perfectly identify runtime formatting calls.
