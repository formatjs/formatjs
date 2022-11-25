## Basic Information

[UAX29](https://unicode.org/reports/tr41/tr41-30.html#UAX29) defines the general rules for grapheme, sentence and word splitting. Those rules (together with locale specific overrides) are defined in "machine readable" code in [CLDR](https://github.com/unicode-org/cldr/tree/main/common/segments). Following the UAX29 recomandation of making use of the CLDR, this implementation attempts to convert those rules (they are in unicode regex with added variables and break notation) into es5 compatible regex.

## Implemementation details

[scripts/generate-cldr-segmentation-rules](scripts/generate-cldr-segmentation-rules.ts#L347) generates a es5 regex compatible ruleset from `cldr-segments-full` files. It uses [UCD](https://unicode.org/ucd/) [files](https://unicode.org/Public/UCD/latest/ucd/) to parse the needed codepoints for the rules. It heavily relies on [regexpu-core](https://github.com/mathiasbynens/regexpu-core) for the regex transformations.

[The segmenter iterator](src/segmenter.ts) than loops through each character of a string and checks each CLDR rule (executed in numerical order) if before regex and after regex match. If a rule matches return the break (true or false depending on the rule).

Additionally there are 4 hardcoded rules, 3 from spec:

- Returns true at index 0 `[0.2] SOT ÷`
- Returns true at index==input.length `[0.3] EOT ÷`
- Returns true if no other rule matches `[999] Any ÷ Any`

And this implementation specific artigicial rules:

- ES5 regex is not unicode aware, return false if previous character is part of a surrogate pair `[0.1]`
- artificial rule `[0.4]` for locale based surpressions

## Potential alternative solutionos

- ~~using Java implementation of unicode CLDR rule transformation to java compatible~~ not feasable as there would still be need to transform the java regex to es5 compatible.
- Hardcode the rules as javascript logic (still making use of UCD files to gather all the relevant codepoints). Not ideal, due to higher maintenence if any update to cldrs.
- Instead of regex transformation, implement a custom interpeter of the CLDR rules. Might be a better approach, however would be more complex, as it would essentially require to create a new custom regex like parser in javascript.

## Various Notes and information regarding unicode segmentation

Throught the work on this I have made various notes collected in: [NOTES.md](NOTES.md)

They are mostly for my own reference, but I left them in for now because I believe it's a good source of information regarding this topic

## TODOs

- [ ] Implement the correct segmenter interface
- [x] add locale handling
- [x] breaksAt should return also return what rule matched
- [x] By using the rule information from breaksAt implement isWordLike (basically any rule except 3.1 and 3.2 and 0.2)
- [x] Using breaksAt rule information implement a debuging script to make it easier to investigate what rule is not **working**
- [ ] code cleanup
- [ ] Fix typescript types
- [ ] build file cleanup
- [x] add Test262
- [ ] ~~Make UCD tests pass~~ 1 test remaining, see bellow
- [ ] Make test262 tests pass Remaining failing tests need clarification
- [ ] additional tests if needed
- [x] add polyfills
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

- word break test #1700 `÷ [0.2] LATIN SMALL LETTER A (ALetter) ÷ [999.0] REGIONAL INDICATOR SYMBOL LETTER A (RI) × [4.0] ZERO WIDTH JOINER (ZWJ_FE) × [16.0] REGIONAL INDICATOR SYMBOL LETTER B (RI) ÷ [999.0] REGIONAL INDICATOR SYMBOL LETTER C (RI) ÷ [999.0] LATIN SMALL LETTER B (ALetter) ÷ [0.3]` expects `[ 'a', '🇦‍🇧', '🇨', 'b' ]` but recieves: `[ 'a', '🇦‍', '🇧🇨', 'b' ]` The compiled regex does not work, word RI regex contains format and extend extensions and the resulting regex is problematic.
