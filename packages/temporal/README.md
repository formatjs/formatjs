# @formatjs/temporal

Temporal dates, times, durations, calendars, and time zones for JavaScript.
Use the TypeScript implementation on Node.js, in browsers, or on Hermes.

## Installation

```sh
npm install @formatjs/temporal
```

Import the namespace without changing globals:

```ts
import {Temporal} from '@formatjs/temporal'

const meeting = Temporal.ZonedDateTime.from(
  '2020-03-07T12:00-05:00[America/New_York]'
)

meeting.add({days: 1}).toString()
// '2020-03-08T12:00:00-04:00[America/New_York]'
meeting.add({hours: 24}).toString()
// '2020-03-08T13:00:00-04:00[America/New_York]'
```

A calendar day can differ from 24 hours when the offset changes.

To install Temporal globally when the host API is missing or incomplete, import
`@formatjs/temporal/polyfill.js`. It also supplies
`Date.prototype.toTemporalInstant` when needed. Import
`@formatjs/temporal/polyfill-force.js` to replace both unconditionally.

## Calendars and time zones

Load any Intl polyfills and their data **before importing Temporal**. The
default entry captures installed `Intl.DateTimeFormat` for named time zones
and Umm al-Qura data. UTC and numeric offsets work without Intl.

Use `@formatjs/temporal/standalone.js` for calendar and named-zone operations
with bundled data. Its IANA records include historical transitions and
recurring future rules. With native Intl, the default entry searches sampled
offsets and can miss closely spaced transitions when the offsets at both
ends of a sample interval match.

The package supports 16 calendars. Chinese and Dangi use compact ICU4X data
for 1900–2102 and an arithmetic approximation outside that range. The default
entry uses host Umm al-Qura data for AH 1300–1600 and civil arithmetic outside
that range. Calendar checks cover specific authority ranges.

`Temporal.Now` uses the system zone. Without DateTimeFormat it uses the
current offset from `Date`. A failed lookup or unusable identifier falls back to UTC.
If a configured clock throws, Now uses the runtime wall clock. Explicit invalid
zone arguments still throw.

## Locale formatting

Date and time values use DateTimeFormat. Duration uses DurationFormat. Without
the corresponding formatter, `toLocaleString()` returns an ISO representation.
Create formatters after global Temporal installation. To use an isolated
namespace with FormatJS formatters, call
`DateTimeFormat.__addTemporalNamespace(Temporal)` or
`DurationFormat.__addTemporalNamespace(Temporal)` on the FormatJS class in use.

## Other runtimes and verification

For Rust-backed Temporal on Hermes, use the
[native Hermes SDK](https://formatjs.github.io/docs/guides/hermes-intl/#temporal).
Native Rust applications can use
[`formatjs_temporal`](https://formatjs.github.io/docs/rust/temporal/).

Run the shared regression fixtures and package tests from the repository:

```sh
bazel test -c opt //packages/temporal:polyfill_regressions_test //packages/temporal:package_test
```

See the [implementation guide](../../knowledge-base/015-temporal.md) for test
profiles, data limits, and benchmarks.
