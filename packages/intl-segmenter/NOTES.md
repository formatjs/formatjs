# Notes and links

## Unicode Text Segmentation (UAX29)

The official document describing the unicode segmentation
<http://unicode.org/reports/tr29/>

## CLDR locale segmentation rules

Unicode Common Locale Data Repository where locale (and root) segmentation rules are specified

CLDR segmentation rules: <https://github.com/unicode-org/cldr/tree/main/common/segments>

information about the rules: <https://unicode.org/reports/tr35/tr35-general.html#Segmentations>

JSON CLDR: <https://github.com/unicode-org/cldr-json/tree/main/cldr-json/cldr-segments-full> (`und` is the root ruleset)

### CLDR Rules notes

CLDR Rules use unicode flavuored regex (<https://unicode.org/reports/tr18/>) which is not directly compatible with js regex.

Modern JS (es6) implements `/u` flag that allows some unicode regex features: [property escapes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Unicode_Property_Escapes) `\p{..}`, handling of 4 bytes characters. (`regexpu` can transpile them to es5)
There is also the `/v` flag proposal (<https://github.com/tc39/proposal-regexp-v-flag>) that adds set operations (`--` and `&&`) and nested character groups (both used by the CLDR rules), `regexpu` can transpile those too

CLDR rules use some character classes that are not implemented by `regexpu`, but the code lists are avalible in the UCD files (see [UCD](#UCD) Notes)

More details about syntax incompatiblities in [CLDR Rules RegExes](#CLDRRulesRegex)

## <a name="UCD"></a>UCD

unicode character database: <https://unicode.org/ucd/>

UCD Files: <https://www.unicode.org/Public/15.0.0/ucd/>

Segmentation properties and tests: <https://www.unicode.org/Public/15.0.0/ucd/auxiliary/>

Character sets used by the CLDRs, that are missing from es5 regex and regexpu-core:

- `Grapheme_Cluster_Break` : <https://www.unicode.org/Public/UCD/latest/ucd/auxiliary/GraphemeBreakProperty.txt> (more information @ <https://unicode.org/reports/tr29/#Grapheme_Cluster_Break_Property_Values>)
- `Sentence_Break`: <https://www.unicode.org/Public/UCD/latest/ucd/auxiliary/SentenceBreakProperty>
- `Word_Break`: <https://www.unicode.org/Public/UCD/latest/ucd/auxiliary/WordBreakProperty.txt>
- `Indic_Syllabic_Category`: <https://unicode.org/Public/UCD/latest/ucd/IndicSyllabicCategory.txt>
- `ea=` => East_Asian_Width => : <https://unicode.org/Public/UCD/latest/ucd/extracted/DerivedEastAsianWidth.txt>
- `ccc` => Canonical_Combining_Class => <https://unicode.org/Public/UCD/latest/ucd/extracted/DerivedCombiningClass.txt>

Properties can use aliases: [PropertyAliases.txt](https://unicode.org/Public/UCD/latest/ucd/PropertyAliases.txt)

Property values can use aliases: [PropertyValueAliases.txt](https://unicode.org/Public/UCD/latest/ucd/PropertyValueAliases.txt)

### Segmentation Tests

<https://unicode.org/reports/tr41/tr41-26.html#Tests29>

About test files: <https://www.unicode.org/reports/tr44/#Segmentation_Test_Files>

Grapheme segmentation tests: <https://www.unicode.org/Public/UCD/latest/ucd/auxiliary/GraphemeBreakTest.txt>  
Sentence segmentation tests: <https://www.unicode.org/Public/UCD/latest/ucd/auxiliary/SentenceBreakTest.txt>  
Word break segmentation tests: <https://www.unicode.org/Public/UCD/latest/ucd/auxiliary/WordBreakTest.txt>

## Other segmentation implementations found

- JS: <https://github.com/orling/grapheme-splitter>
- JS Polyfill: <https://www.npmjs.com/package/intl-segmenter-polyfill> (using icu C compiled in wasm+)
- GO: <https://github.com/clipperhouse/uax29>
- Rust: <https://github.com/unicode-rs/unicode-segmentation>

- Java <https://github.com/unicode-org/unicodetools/blob/70dce2c89f185c65b436c28404ae5b7bdb32c2d1/unicodetools/src/main/java/org/unicode/tools/Segmenter.java#L485>
  <https://github.com/unicode-org/unicodetools/blob/70dce2c89f185c65b436c28404ae5b7bdb32c2d1/unicodetools/src/test/java/org/unicode/test/CompareBoundaries.java#L473>

## <a name="CLDRRulesRegex"></a>CLDR Rules RegExes

CLDR Rules use unicode regex (unsupported by JS).

There is a set of utils in the unicode repo that allows transformation of unicode regex to java compatible regex:

<https://github.com/unicode-org/unicodetools>

and UnicodeJsps hosted on the unicode.org: <https://util.unicode.org/UnicodeJsps>

### JS Regex utils for unicode

<https://github.com/mathiasbynens/regenerate> can generate es5 regex given a list of unicode symbols
<https://github.com/mathiasbynens/regexpu-core> Can transpile es2015 (`/u`) regex to es5 and `/v` to unicode regex (with [some limitations](https://github.com/mathiasbynens/regexpu-core#caveats))

The unicode regexs have other syntax incompatiblities:

- set operands are single character `-` instead of `--`
- there are spaces in the regex that need to be ignored `[[$Extend-\\\\p{ccc=0}] $ZWJ]`
- Some properties in CLDR do not seem to follow the spec strictly: `\p{Gujr}` should be `\{sc=Gujr}`
- it seems muliple character classes in a row are treated as signle class when performing set operations: `\p{..}\p{...}&[..]` in unicode is treated as `[...]&[...]` but regexpu `\v` treates it as `[...][...]&[...]`
- The way rules are constructed, have issues with negated and normal transpiled character classes `[^(?:...)]` `[(?:..)]`.

Even after accounting for all of those, there are issues left:

`cldr-segments-full/segments/el/suppressions.json` has a rule `"$STerm": "[[$STerm] [\\u003B \\u037E]]"` which I currently do not know how to correctly process.

## isWordLike

<https://github.com/tc39/proposal-intl-segmenter/issues/100>
