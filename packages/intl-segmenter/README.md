## Basic Information

[UAX29](https://unicode.org/reports/tr41/tr41-30.html#UAX29) defines the general rules for grapheme, sentence and word splitting. Those rules (together with locale specific overrides) are defined in "machine readable" code in [CLDR](https://github.com/unicode-org/cldr/tree/main/common/segments). Following the UAX29 recommendation of making use of the CLDR, this implementation attempts to convert those rules (they are in unicode regex with added variables and break notation) into es5 compatible regex.

## Implemementation details

[scripts/generate-cldr-segmentation-rules](scripts/generate-cldr-segmentation-rules.ts#L347) generates a es5 regex compatible ruleset from `cldr-segments-full` files. It uses [UCD](https://unicode.org/ucd/) [files](https://unicode.org/Public/UCD/latest/ucd/) to parse the needed codepoints for the rules. It heavily relies on [regexpu-core](https://github.com/mathiasbynens/regexpu-core) for the regex transformations.

[The segmenter iterator](src/segmenter.ts) than loops through each character of a string and checks each CLDR rule (executed in numerical order) if before regex and after regex match. If a rule matches return the break (true or false depending on the rule).

Additionally there are 4 hardcoded rules, 3 from spec:

- Returns true at index 0 `[0.2] SOT ÷`
- Returns true at index==input.length `[0.3] EOT ÷`
- Returns true if no other rule matches `[999] Any ÷ Any`

And this implementation specific artificial rules:

- ES5 regex is not unicode aware, return false if previous character is part of a surrogate pair `[0.1]`
- artificial rule `[0.4]` for locale based suppressions

## Potential alternative solutionos

- ~~using Java implementation of unicode CLDR rule transformation to java compatible~~ not feasible as there would still be need to transform the java regex to es5 compatible.
- Hardcode the rules as javascript logic (still making use of UCD files to gather all the relevant codepoints). Not ideal, due to higher maintenance if any update to cldrs.
- Instead of regex transformation, implement a custom interpreter of the CLDR rules. Might be a better approach, however would be more complex, as it would essentially require to create a new custom regex like parser in javascript.

## Various Notes and information regarding unicode segmentation

Throughout the work on this I have made various notes collected in: [NOTES.md](NOTES.md)

They are mostly for my own reference, but I left them in for now because I believe it's a good source of information regarding this topic

## TODOs

- [ ] ~~Make UCD tests pass~~ 1 test remaining, see bellow
- [ ] ~~Make test262 tests pass.~~ Remaining failing tests need clarification
- [ ] additional tests if needed
- [ ] add docs to website/docs

## Failing test262 tests

- [segment/containing/zero-index.js](https://github.com/tc39/test262/blob/main/test/intl402/Segmenter/prototype/segment/containing/zero-index.js#L10) Spec says return undefined, but test expects value
- Supported locales related tests (currently I added supported locales found in CLDR but tests expect other locales to be avilible):

  - [constructor/supportedLocalesOf/locales-specific.js](`https://github.com/tc39/test262/blob/main/test/intl402/Segmenter/constructor/supportedLocalesOf/locales-specific.js`) `sr` locale not in segmenter availible locales, not sure about the correct approach.
  - [constructor/constructor/locales-valid.js](https://github.com/tc39/test262/blob/main/test/intl402/Segmenter/constructor/constructor/locales-valid.js)
  - [prototype/resolvedOptions/type-without-lbs.js](https://github.com/tc39/test262/blob/main/test/intl402/Segmenter/prototype/resolvedOptions/type-without-lbs.js)
  - [constructor/supportedLocalesOf/basic.js](https://github.com/tc39/test262/blob/main/test/intl402/Segmenter/constructor/supportedLocalesOf/basic.js)

- [constructor/constructor/options-undefined.js](https://github.com/tc39/test262/blob/main/test/intl402/Segmenter/constructor/constructor/options-undefined.js) set to excluded, similarly to other packages

## Failing UCD tests

- word break test #1700 `÷ [0.2] LATIN SMALL LETTER A (ALetter) ÷ [999.0] REGIONAL INDICATOR SYMBOL LETTER A (RI) × [4.0] ZERO WIDTH JOINER (ZWJ_FE) × [16.0] REGIONAL INDICATOR SYMBOL LETTER B (RI) ÷ [999.0] REGIONAL INDICATOR SYMBOL LETTER C (RI) ÷ [999.0] LATIN SMALL LETTER B (ALetter) ÷ [0.3]` expects `[ 'a', '🇦‍🇧', '🇨', 'b' ]` but receives: `[ 'a', '🇦‍', '🇧🇨', 'b' ]` The compiled regex does not work, word RI regex contains format and extend extensions and the resulting regex is problematic.
- locale for `el` currently omitted due to unclear regex.

## Benchmark

Ran on Node v18.12.1

### Built in v8 Intl.Segmenter

```
Locale: en
Input string size: 8 KB
segment_cached_grapheme_collect_all x 22.42 ops/sec ±9.16% (40 runs sampled)
segment_cached_word_collect_all x 64.16 ops/sec ±7.71% (57 runs sampled)
segment_cached_sentence_collect_all x 2,899 ops/sec ±1.35% (90 runs sampled)
segment_cached_grapheme_containing x 186,612 ops/sec ±2.20% (88 runs sampled)
segment_cached_word_containing x 174,066 ops/sec ±1.18% (91 runs sampled)
segment_cached_sentence_containing x 128,220 ops/sec ±0.70% (94 runs sampled)
new_segmenter_grapheme x 207,883 ops/sec ±8.65% (79 runs sampled)
new_segmenter_word x 163,141 ops/sec ±17.94% (78 runs sampled)
new_segmenter_sentence x 213,711 ops/sec ±8.45% (80 runs sampled)
```

### Polyfilled segmenter

```
Polyfill on Node 18:
Locale: en
Input string size: 8 KB
segment_cached_grapheme_collect_all x 331 ops/sec ±0.41% (92 runs sampled)
segment_cached_word_collect_all x 256 ops/sec ±1.63% (89 runs sampled)
segment_cached_sentence_collect_all x 45.88 ops/sec ±1.36% (61 runs sampled)
segment_cached_grapheme_containing x 1,320,075 ops/sec ±0.65% (97 runs sampled)
segment_cached_word_containing x 5,082 ops/sec ±0.77% (83 runs sampled)
segment_cached_sentence_containing x 934 ops/sec ±2.47% (74 runs sampled)
new_segmenter_grapheme x 6,384 ops/sec ±1.07% (93 runs sampled)
new_segmenter_word x 1,404 ops/sec ±1.72% (93 runs sampled)
new_segmenter_sentence x 431 ops/sec ±18.60% (21 runs sampled)
```

When using the iterator the polyfilled version performs better than the built in Intl.Segmenter except on sentence. Larger the text, larger the difference.
Random access through `containing()` is significantly slower compared to the built in v8 `Intl.Segmenter` except for grapheme due. This is because the need to looping backward and forward to find the boundaries.

Instantiation on the polyfill is slow, due to the need of preparing the rule set for selected locale and granularity.
