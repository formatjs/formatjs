# `@formatjs/intl-collator`

Intl.Collator polyfill.

The TypeScript and Rust implementations use compiled CLDR/UCA data. Locale
collations inherit the root `emoji` and `eor` types; private LDML collations
remain internal.

```js
new Intl.Collator('en', {collation: 'emoji'}).compare('🤣', '😂') // -1
```

See [the collation data pipeline](../../knowledge-base/007l-polyfill-intl-collator.md).
