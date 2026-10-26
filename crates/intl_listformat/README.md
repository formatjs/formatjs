# formatjs_intl_listformat

ListFormat patterns and parts in Rust. Caller-loaded JSON packs contain CLDR
conjunction/disjunction/unit patterns for all three styles. Loading is atomic;
existing instances retain their data after replacement.

UTF-16 units preserve lone surrogates and empty elements. Patterns compile once.
Iterative expansion takes linear time without recursive stack growth. Inline
comments link pinned ECMA-402 algorithms.

On Linux:

```sh
bazel test -c opt //crates/intl_listformat:intl_listformat_test \
  //crates/intl_listformat/tests:conformance_test
```

TS conformance covers every generated locale/type/style, list lengths, Unicode
and malformed UTF-16. Rust tests cover invalid packs, 20,000-element lists,
matching, lazy loading and retained instances.

Hermes observable behavior and SDK packaging are in progress. The typed engine
does not perform JS coercion or iteration.
