# formatjs_intl_segmenter

ICU4X grapheme, word and sentence segmentation over original UTF-16 units.
Complex-script words use ICU dictionary/LSTM models. Locale metadata mirrors
the TS implementation; segmentation data is static, as in the existing package.

Segments share an immutable boundary index. Each cursor advances independently;
`containing` searches UTF-16 boundaries without splitting surrogate pairs.
Original input remains valid after the segmenter or other cursors are dropped.

On Linux:

```sh
bazel test -c opt //crates/intl_segmenter:intl_segmenter_test \
  //crates/intl_segmenter/tests:conformance_test
```

Conformance ports the Unicode 17 grapheme corpus and compares TS records and
`containing` results. Word/sentence comparisons assert both implementations against explicit ICU/TS
profiles: dictionary words, abbreviation suppressions, Format/Close/Sp rules,
and mark-only word flags. No cases are skipped. Unicode letters/numbers supplement
ICU word status for Indic text; isolated marks remain non-word-like.

The owned C ABI exposes immutable segment handles and independent cursors. Handles
retain original UTF-16 units after parents are destroyed. Hermes source/bytecode tests cover iteration, coercion, brands and complex-script
models. SDK packaging is in progress.
