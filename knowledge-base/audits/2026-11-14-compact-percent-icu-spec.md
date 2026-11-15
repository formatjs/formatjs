# Compact percent: ICU architecture and ECMA-402

Research date: 2026-11-14. ICU4C/ICU4J 79.1, CLDR 49. Pinned ICU tag
`release-79.1` resolves to `ddc6b66926bfac6036144ca9902992a0d6d50af9`.
ECMA-402 `main` resolves to `af194df3c8633510a6c5982e8dbdb00cb3b6105f`
(2026-11-13); `spec/numberformat.html` blob is
`5bb28cd69bc2ddd76a64f2a758e110b16c28b042`. Connector retrieval checked the
live source independently of the rendered specification's cached line numbers.
Source findings, implementation boundary, and validation evidence follow.

## ICU's model

ICU separates number digits, inner scientific notation, middle pattern modifiers,
and outer units/currency names. Compact notation replaces the middle modifier.
Consequently compact percent explicitly switches from the ordinary percent
pattern to CLDR's percent **unit** data. This applies even below compact
thresholds, and to nonfinite values: routing depends on formatter options.
The source explains that ordinary percent would otherwise disappear when compact
replaces its modifier. Currency symbols use compact currency patterns; currency
names use decimal compact patterns plus an outer name modifier.
[ICU4C formatter construction, lines 150–161, 196–228, 330–455](https://github.com/unicode-org/icu/blob/release-79.1/icu4c/source/i18n/number_formatimpl.cpp#L150-L161).

Digits render first, then inner, middle, outer modifiers. Each modifier preserves
its prefix/suffix relationship. Grouping is configured independently: compact
defaults to minimum two grouping digits, rather than disabling grouping.
[ICU4C rendering and grouping](https://github.com/unicode-org/icu/blob/release-79.1/icu4c/source/i18n/number_formatimpl.cpp#L277-L286).

Java independently confirms this pipeline. `NumberFormatterImpl.isCldrUnit`
includes compact notation. Nested `CompactNotation.CompactHandler` replaces
`modMiddle`; `LongNameHandler.forMeasureUnit` tags its modifier as `MEASURE_UNIT`,
then `processQuantity` assigns it to `modOuter`. Thus Java oracle `unit` parts
originate upstream, rather than in an incorrect adapter mapping.
[Java formatter, lines 205–216](https://github.com/unicode-org/icu/blob/ddc6b66926bfac6036144ca9902992a0d6d50af9/icu4j/main/core/src/main/java/com/ibm/icu/number/NumberFormatterImpl.java#L205-L216),
[nested CompactHandler, lines 127–170](https://github.com/unicode-org/icu/blob/ddc6b66926bfac6036144ca9902992a0d6d50af9/icu4j/main/core/src/main/java/com/ibm/icu/number/CompactNotation.java#L127-L170),
[unit modifier, lines 841–850](https://github.com/unicode-org/icu/blob/ddc6b66926bfac6036144ca9902992a0d6d50af9/icu4j/main/core/src/main/java/com/ibm/icu/impl/number/LongNameHandler.java#L841-L850).

```mermaid
flowchart LR
  Quantity[Exact quantity] --> Scale[Explicit percent scale]
  Scale --> Round[Compact scale plus rounding]
  Round --> Digits[Localized digits and grouping]
  Digits --> Middle[Compact middle modifier]
  Middle --> Outer[Optional outer unit or currency name]
```

ICU compact lookup retains explicit `0`/`1` overrides, plural forms, numeric
multiplier, and a special marker for raw pattern `0`. That marker blocks parent
fallback and requests ordinary formatting. Missing numbering-system data falls
back to Latin; missing long data can fall back to short. Rounded quantity selects
explicit count before plural category. Zero, NaN, infinity use magnitude zero.
[ICU4C CompactData and CompactHandler](https://github.com/unicode-org/icu/blob/release-79.1/icu4c/source/i18n/number_compact.cpp#L54-L128).

Threshold selection and rounding cooperate: select multiplier, round, detect
carry, retry with next magnitude's multiplier when needed. Ordinary formatter
defaults must not replace ECMA digit options in an oracle adapter.
[ICU rounding](https://github.com/unicode-org/icu/blob/release-79.1/icu4c/source/i18n/number_rounding.cpp#L334-L365).

## Specification boundary

Percent scaling precedes exponent selection. Sign selection uses rounded value.
Percent parts must be `percentSign`; `unit` emission requires unit style.
Percent sign is ILND, meaning implementation/locale/numbering-system dependent.
[PartitionNumberPattern](https://tc39.es/ecma402/#sec-partitionnumberpattern),
[ILD/ILND definitions](https://tc39.es/ecma402/#implementation-dependencies).

Style patterns are selected independently of notation. Compact subpatterns are
shared across styles and selected by exponent, not value. They may omit the
number placeholder. Grouping positions/conditions are implementation-defined;
`useGrouping:false` disables grouping.
[LocaleData constraints](https://tc39.es/ecma402/#sec-intl.numberformat-internal-slots),
[GetNumberFormatPattern](https://tc39.es/ecma402/#sec-getnumberformatpattern),
[GetNotationSubPattern](https://tc39.es/ecma402/#sec-getnotationsubpattern).

Pinned source still declares `GetNotationSubPattern(numberFormat, exponent)`;
no numeric value argument was added. See
[lines 1478–1505](https://github.com/tc39/ecma402/blob/af194df3c8633510a6c5982e8dbdb00cb3b6105f/spec/numberformat.html#L1478-L1505).

Inference: reproducing ICU's notation-dependent percent layout/symbol cannot
generally satisfy this model. Retagging its unit parts fixes only part types.
Similarly, style-specific compact currency composition is not generally
expressible. Conditional exact-count numeric elision also needs value-dependent
template selection; allowing numberless templates alone does not provide that.
These are specification-model gaps to report, rather than unqualified permission
to copy ICU behavior.

The sign/currency gap is already tracked in
[tc39/ecma402#439](https://github.com/tc39/ecma402/issues/439), open since 2020.
Its Swahili example is explicitly referenced by the repository's former tests.
Percent field provenance and notation-dependent symbols are additional concrete
consequences; no new issue or comment was posted.

## Recommended implementation

Keep one style/sign envelope around unsigned notation. Compile these separately;
interpolate notation at the numeric slot. Percent keeps its selected numbering
system's ordinary percent symbol and pattern across notations. Currency keeps
currency/accounting envelope; decimal notation supplies compact magnitude text.
Choose numeric rounding once, retain exact rendered plural operands, then render
the selected plan. Do not derive signs by removing a leading minus from strings.

Separate locale freedom from semantic requirements in tests. ICU differences
need classifications, not blanket acceptance or unconditional oracle equality.
Changing percent style into unit style to match ICU would change semantics.

The word `asilimia` could itself serve as an implementation-selected percent
sign if used consistently. The conflict is changing symbol and envelope with
notation; a word is not categorically forbidden by the ILND string definition.

CLDR's data model retains explicit-count precedence and visible fractional
digits. Its compact `0` sentinel differs from a numberless lexical template.
Preserve both in extraction even if exact-count elision awaits specification
clarification. Avoid converting rounded decimal strings through binary Number
before plural selection.
[CLDR compact formats](https://unicode.org/reports/tr35/tr35-numbers.html#Compact_Number_Formats),
[CLDR plural operands and explicit counts](https://unicode.org/reports/tr35/tr35-numbers.html#Language_Plural_Rules).

## Local oracle limitations

The checked-in Java adapter maps ICU `MEASURE_UNIT` directly to `unit`; this is
ICU field provenance, not proof that percent-style parts satisfy ECMA-402.
Its initial profiles cover ordinary percent and compact decimal/currency,
but omit compact percent. C consumes Java fixtures, independently checks text,
and has no independent parts check. Both therefore need new compact-percent
profiles before they can expose this interaction.
Sources: `conformance-tests/icu4j/IntlNumberFormatOracle.java:19`,
`:64`, `conformance-tests/icu4c/numberformat.cc:23`.

The [earlier audit](2026-10-31-numberformat.md) already records lost exact-count
overrides, compact grouping suppression, and plural operand loss. These findings
support a shared data/composition repair; percent-only concatenation cannot fix
them. Direct shell HTTP lacked DNS and web fetches missed Java source; GitHub
connector subsequently retrieved all four Java internals. `CompactHandler` is
nested in `CompactNotation.java`, not a standalone `impl/number` source file.

## Concrete percent conflicts

Reproduction, Node 26.5.1 / ICU 78.3 / CLDR 48.0 (secondary behavioral evidence,
not version-aligned ICU 79 golden output):

```js
for (const locale of ['tr', 'sw', 'ar-u-nu-latn', 'en']) {
  for (const notation of ['standard', 'compact']) {
    const nf = new Intl.NumberFormat(locale, {style: 'percent', notation})
    console.log(locale, notation, nf.format(-10), nf.formatToParts(-10))
  }
}
```

- Turkish standard: `-%1.000`; compact: `%-1\u00a0B`. Percent moves outside
  sign; compact percent part is `unit`.
- Swahili standard: `-1,000%`; compact: `asilimia elfu\u00a0-1`. Percent changes
  symbol, side, and part type. Compact lexical prefix also precedes sign.
- Arabic Latin digits: standard percent symbol U+0025; compact percent unit
  U+066A. Bidi literals also differ.
- English standard: `-1,000%`; compact: `-1K%`. Text composition looks compatible,
  but compact `%` part is `unit` rather than required `percentSign`.

These comparisons expose independent issues: field type, style envelope,
number/sign order, notation-dependent symbol selection. Each needs a separate
expectation in regression coverage; matching English text alone hides three.

## Range collapse: preserve endpoint signs

Baseline TS `canCollapse` and Rust `same` explicitly permit sharing an identical
single sign prefix when a currency/unit/percent suffix collapses. Their longer
affix branch also permits sign sharing whenever bidi literals or currency labels
make the candidate exceed one code point. Neither length proves safety.
Sources: `packages/ecma402-abstract/NumberFormat/CollapseNumberRange.ts`,
`crates/intl_numberformat/range.rs` (read with ast-grep, 2026-11-14).

Baseline trace of English long-meter path:

```text
[-3, -2]: -3 meters | -2 meters => -3–2 meters
[-3,  2]: -3 meters |  2 meters => -3–2 meters
```

Distinct uncollapsed endpoint pairs become identical text. This violates the
normative ambiguity restriction; it is not merely undesirable typography.
The [pinned CollapseNumberRange clause](https://github.com/tc39/ecma402/blob/af194df3c8633510a6c5982e8dbdb00cb3b6105f/spec/numberformat.html#L1853-L1870)
compares collapsed outputs against unmodified outputs. It explicitly says:
“Returning _result_ unmodified is guaranteed to be a correct implementation of CollapseNumberRange.”

Implemented range policy:

- Reject prefix/suffix collapse candidates containing `minusSign`, including bidi
  literals around the sign. Retain safe positive-sign sharing, as exercised by
  Test262; negative and mixed-sign ranges must remain distinct.
- Keep accounting parentheses together by leaving ranges with literal parentheses
  uncollapsed. Positive accounting amounts can still share safe affixes.
- Continue collapsing identical sign-free unit/percent/currency affixes where
  safe. Retain each negative endpoint sign and source annotation. A shared suffix remains
  compatible with `-3 – -2 meters`, while mixed signs produce distinct output.
- Keep compact/scientific markers local to each endpoint. Retain current
  approximate-identity handling before collapse.

Apply the same rules to suffix signs and sign-plus-bidi candidates; checking only
the first part or ASCII `-` misses those cases. A future paired modifier
representation can support stronger accounting collapse without losing structure.
CLDR's [range heuristics](https://unicode.org/reports/tr35/tr35-numbers.html#Collapsing_Number_Ranges)
are recommendations, not exemptions from ECMA's ambiguity restriction.

Regression properties should compare `[-3,-2]` against `[-3,2]` for long units,
currency names, compact percent, and bidi locales; assert distinct text whenever
the uncollapsed strings differ. Verify signed parts retain endpoint sources,
and accounting parentheses remain paired. Existing ICU snapshots can legitimately
retain differences when ICU collapses signs more aggressively.

## Focused validation matrix

- Percent: standard/scientific/engineering/compact short/long; `en`, `tr`, `sw`,
  `ar`, `ar-u-nu-latn`, `fa`, `fr`, `de`; compare text and semantic parts.
- Values: signed zero, negative/positive tiny values, threshold neighbors,
  carry across 1000 and 1,000,000 after percent scaling, NaN, signed infinities.
- All signDisplay modes; explicit fraction/significant digits; rounding modes;
  trailing-zero stripping; exact decimal strings beyond binary precision.
- Currency: symbol/code/name/accounting with compact decimal notation; signs,
  localized spacing, and numberless patterns remain paired correctly.
- Grouping: compact values exceeding highest supported suffix, grouping false,
  min2, always; retain ordinary grouping sizes independent of compact template.
- Data: raw `0` sentinel, exact `1` versus plural `one`, literal-only templates,
  missing numbering system, long-to-short fallback, locale re-registration.
- Ranges: equal formatted endpoints, negative endpoints, mixed signs, percent
  prefix/suffix, and accounting pairs; preserve endpoint identity.

Benchmark warm format/parts separately for standard percent, compact percent,
compact currency, decimal, nonfinite values. Also measure construction, locale
registration, generated payload size. Use identical checksums and optimized
Bazel targets; report medians over repeated runs alongside correctness results.

## Implemented repair

TS and Rust select the style/sign plan first, then interpolate an unsigned decimal
notation plan. Percent is never reinterpreted as unit style. Currency uses the
same compact notation tables as decimal, including long display; its ordinary
currency/accounting envelope stays intact. Grouping follows the style plan and
`useGrouping`. Numberless notation templates retain surrounding style and signs.

Generation no longer emits compact currency tables or their compiled plans.
Legacy payloads still load; their currency-specific compact tables are ignored.
Wire schema version 1 remains supported. TS caches composed plan pairs. Rust
streams their tokens and binds the six generated style-plan IDs at construction,
keeping raw-template fallback for legacy packs.

This intentionally changes ICU-compatible behavior where the abstract model
cannot express it. It does not resolve the specification gaps above. Exact-count
conditional elision and the earlier audit's exact plural-operand work remain
separate follow-ups; this is not a claim of complete NumberFormat conformance.

## Measurements and oracle review

Baseline: `b05a036be` (full revision in the
[raw results](numberformat-composition-results.json)). Intel Xeon Platinum 8488C,
optimized Bazel builds; TS Node 24.14.0 / ICU 78.2. Seven rounds of 12,000 format
calls each. Intermediate Rust prototypes preserve identical output checksums.
Standard-profile before/after checksums also match. Corrected compact profiles
intentionally add percent symbols/grouping, so their before/after workload is
not byte-identical.

| Workload              | Before µs | Final µs |
| --------------------- | --------: | -------: |
| TS compact percent    |     5.809 |    5.854 |
| TS compact currency   |     7.112 |    7.152 |
| Rust compact percent  |     1.193 |    1.261 |
| Rust compact currency |     1.079 |    1.118 |

TS formatting medians stay within about 2% of baseline. Corrected Rust compact
profiles take roughly 4–6% longer, including additional output work. Streaming
and bound style IDs recover 2–5% versus the first correct cached-composition
prototype. English native locale input shrinks from 52,520 to 50,688 bytes (3.5%).
These are local warm measurements, not mobile/Hermes latency claims.

The independent matrix grows from 35,629 to **38,136 cases**, adding compact
percent short/long/always-sign, compact long accounting, and Turkish coverage.
C/J still disagree on 121 text rows. Raw oracle fields are preserved; no percent
unit retagging or option-specific normalization hides the specification conflicts.
Both implementations produce identical text/parts over the matrix.

Reviewed J delta: 324 old discrepancies removed, 144 changed, 1,670 added. C text
delta: 330 removed, 42 changed, 1,261 added. Added/changed cases are confined to
compact notation, negative ranges, or newly covered Turkish data. Existing oracle
expectations remain identical. Most new J discrepancies are newly tested compact
percent: 918 singles and 432 ranges. The raw mismatch count is not a conformance
score. Prior unrelated differences remain recorded.

The 22 locale snapshot files retain their keys; all 528 changed snapshots are
compact-percent cases. An additional semantic check inspects 352 parts snapshots
for `percentSign` and absence of `unit`. New behavior tests cover all sign modes,
signed zero, nonfinite values, percent-scaled rollover, accounting, numberless
notation, grouping, range identities, and negative-endpoint sources.

Final validation: **18 focused Bazel targets pass**, including both ICU snapshot
gates, generated locale suites, TS typechecks, Rust/TS parity, and Hermes
source/bytecode parity. Test262 reports 494 passes and eight unchanged tracked
failures across 502 executions. Gazelle, ast-grep, oxlint, formatting, and
`git diff --check` also pass.

Publication revalidation (2026-11-15): rebased onto main
`9870106e6ded6d40b0ff2a80101501cd3cdb0d6a`. All 18 targets pass. Main's newer
string-precision behavior requires `1.0K%` / `1.0M%` in two rollover tests;
runtime changes merged without conflicts. Test262 now reports 500 passes and
two tracked failures across 502 executions. Measurements above retain their
explicit original baseline. The associated specification change is
[tc39/ecma402#1117](https://github.com/tc39/ecma402/pull/1117).

## Reproduction

Use `bazel test -c opt` for the focused targets:

- `//packages/intl-numberformat:{misc_tests,intl-numberformat_test}`
- `//packages/intl-numberformat:{currency_tests,decimal_tests,percent_tests,unit_tests}`
- `//packages/intl-numberformat:test262` (existing tracked failures remain)
- `//crates/intl_numberformat:{intl_numberformat_test}`
- `//crates/intl_numberformat/tests:{conformance_test,packs_test,icu4j_conformance_snapshot_test,icu4c_conformance_snapshot_test}`
- `//native/hermes/tests:numberformat_conformance_test`

The braces above abbreviate separate Bazel labels. Also run the owning TS
`typecheck_typecheck_test` targets. Optimized benchmark commands:

```sh
bazel run -c opt //packages/intl-numberformat/benchmark:audit -- --iterations=12000
bazel run -c opt //crates/intl_numberformat:benchmark -- --iterations=12000
```

Hermes validation initially exhausted the host disk while copying test inputs.
Removing temporary sandbox copies and rerunning with `--jobs=2`,
`--noreuse_sandbox_directories`, and `--test_strategy=standalone` avoided duplicate
inputs. No Bazel clean or build-output deletion was used.
