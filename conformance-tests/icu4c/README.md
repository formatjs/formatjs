# ICU formatting conformance

```sh
bazel test -c opt //conformance-tests/icu4c:intl_locale_formatting_conformance_test
```

This Linux x86_64 test links the official ICU4C 78.1 Ubuntu binary. MODULE.bazel
pins its SHA256; the archive was verified against the release's SHA512 manifest.
Other platforms retain the portable ICU4J checks.

The test checks the same 42 regional formatting outputs as ICU4J and generates
2,871 ListFormat comparisons through the pinned ICU4J 78.1 oracle. Cases cover
11 locales, every type/style, empty elements, lone surrogates, and Spanish/Hebrew
context rules. Hermes consumes the same cases in source and bytecode modes,
checking formatted output, reconstructed parts, and original element boundaries.

ICU4C and ICU4J agree on 2,853 list cases. The 18 differences are explicit in
[the difference fixture](../icu4j/list-format-icu-differences.tsv). ICU4J uses
Hebrew block membership and a whole-string regex; ICU4C uses Script membership
and the first code point. ICU4C also changes Spanish `o` to `u` before `11 horas`;
ICU4J only handles bare `11`. We use ICU4C for these implementation-dependent
choices, retaining both exact expected outputs. A changed ICU4J output or ICU4C
output fails; unused or duplicate differences fail too.

Pinned implementations:

- [ICU4C context rules](https://github.com/unicode-org/icu/blob/release-78.1/icu4c/source/i18n/listformatter.cpp#L124-L211)
- [ICU4J context rules](https://github.com/unicode-org/icu/blob/release-78.1/icu4j/main/core/src/main/java/com/ibm/icu/text/ListFormatter.java#L501-L558)

ECMA-402 iterator, coercion, branding and descriptor semantics stay covered by
Hermes conformance and test262; ICU formatting checks do not cover JS semantics.

## ICU4X

```sh
bazel test -c opt //conformance-tests/icu4x:intl_listformat_conformance_test
```

The independent ICU4X ListFormatter (2.3.0, pinned through Cargo.lock) checks
2,772 scalar-string cases. Its API cannot represent lone surrogates; the other
99 cases remain strict UTF-16 checks in ICU4C, ICU4J and Hermes.

ICU4X differs from ICU4C on 66 inputs: Hebrew nonbreaking hyphens and Spanish
`11` followed by a newline. [Exact outputs](../icu4x/list-format-icu-differences.tsv)
preserve those differences. The test checks each ICU4X result and the preferred
ICU4C result without normalization; unused or duplicate entries fail.

## PluralRules

```sh
bazel test -c opt //conformance-tests/icu4x:intl_pluralrules_conformance_test
```

ICU4J generates 720 cardinal/ordinal selections over 12 locales, checked by
ICU4C, ICU4X and Hermes source/bytecode. Inputs fit Intl's default three fraction
digits. C/J select from formatted-number operands with matching precision and
rounding; X uses exact decimals. No output differences are allowed in this
matrix. Custom digit options, ranges and JS semantics retain separate gates.

## Collator

```sh
bazel test -c opt //conformance-tests/icu4c:intl_collator_conformance_test \
  //conformance-tests/icu4j:intl_collator_conformance_test \
  //conformance-tests/icu4x:intl_collator_conformance_test \
  //crates/intl_collator/tests:conformance_test
```

All three ICU implementations check the same 69 ordering fixtures as the
FormatJS Rust/TS differential suite. They cover sensitivity, case level,
case-first preferences, numeric ordering, punctuation and language tailorings.
ICU4C/J use 78.1; ICU4X Collator uses 2.3.1 with its pinned compiled data.
The adapters map Intl options onto each API and preserve locale keyword defaults
when options are omitted. These comparisons allow no output differences; they
do not establish coverage of every collation type or JS observable behavior.

The 42 root cases cover inherited `emoji` and `eor` sorting for English,
Turkish, German, Arabic, Japanese and Hong Kong Chinese. They include emoji
whose CLDR order differs from code-point order and EOR secondary distinctions
that disappear at base sensitivity. Rust and TS retain one compiled rule set
for inherited collations; the Hermes source/bytecode differential includes
those options and inputs.
