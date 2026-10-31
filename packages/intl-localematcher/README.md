# Intl LocaleMatcher

[Documentation](https://formatjs.github.io/docs/polyfills/intl-localematcher).

Best fit uses CLDR language distances, requested-locale ordering and supported
locale preferences. Lookup uses RFC 4647 prefix matching.

## Performance

Canonical tags, maximized locales and supported-list indexes are cached for
repeated matches. Mutable best-fit arrays remain checked before cache reuse.
`ResolveLocale` checks Set contents and order before reusing its private snapshot;
matching that snapshot avoids a second validation scan. Later mutations retain
first-match ordering and locale-data selection.

[Constructor measurements](../../knowledge-base/audits/2026-10-31-numberformat-constructor-snapshots.md)
compare warm construction with the same supported locales. Keep cold preparation,
matching, construction and formatting measurements separate.
