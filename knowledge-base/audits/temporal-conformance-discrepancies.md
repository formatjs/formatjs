# Temporal conformance discrepancies

Reviewed: 2026-11-21.

Implementation findings stay in [the spec audit ledger](temporal-spec-audit.md).
This file records external test/data conflicts. No specification defect is
confirmed by the issue below.

## Test262 legacy US timezone aliases versus IANA 2026f

Pinned inputs: IANA `2026f` and Test262
`2a1ade303f72d3de80565c921d685222405c32ce` from `MODULE.bazel`.

Test262's [`intl402/Temporal/ZonedDateTime/links.js`](https://github.com/tc39/test262/blob/2a1ade303f72d3de80565c921d685222405c32ce/test/intl402/Temporal/ZonedDateTime/links.js)
expects `CST6CDT` and `America/Chicago` to compare equal. It also treats the
other legacy US POSIX names as aliases of geographic zones.

[IANA 2026f](https://data.iana.org/time-zones/releases/tzdata2026f.tar.gz)
contains separate `Zone` definitions for `CST6CDT`, `EST5EDT`, `MST7MDT` and
`PST8PDT` in `backward`, lines 372–375. The 2026d release notes explain that
these names again use POSIX-compatible offsets and US federal rules, including
historical differences from geographic zones. The comment preceding the Zone
records explicitly distinguishes Zones from Links.

[ECMA-402 §6.5](https://tc39.es/ecma402/#sec-use-of-iana-time-zone-database)
requires IANA Zones to retain primary identities, subject to its listed
exceptions. These four names have no applicable exception. Distinct primary
identities therefore follow the specification for the pinned data.

Repository evidence: `primaryZones` preserves IANA Zone identities;
`primary-zones.test.ts` already covers `CST6CDT` as a separate Zone.
`crates/temporal/identifiers_generated.rs` also preserves its primary identity.
The installed CLDR timezone aliases give `CST6CDT` its own
entry rather than including it in the Chicago alias group.

Observed failure: both default and strict scenarios stop at the first legacy
US alias comparison, `CST6CDT` versus `America/Chicago`. Preserve the conforming
Zone identities. No test exclusions, count reductions or baseline changes were
made. Upstream fixture reconciliation remains open; no external issue filed.

## Test262 zero-offset label versus CLDR49

The same pinned Test262 revision's
[`offset-time-zones.js`](https://github.com/tc39/test262/blob/2a1ade303f72d3de80565c921d685222405c32ce/test/intl402/Temporal/ZonedDateTime/prototype/toLocaleString/offset-time-zones.js)
requires `+00:00` locale output to contain GMT without a sign. Pinned CLDR49
removed the special zero-offset format. Its
[localized GMT formatting rules](https://www.unicode.org/reports/tr35/49/tr35-dates.html#Using_Time_Zone_Names)
apply the numeric hour pattern through `gmtFormat`; English short output is
`GMT+0`.

The existing `temporal-owned.test.ts` regression explicitly covers this result,
plus positive, negative and half-hour offsets. Existing ICU79 controls and
`conformance-results.json` already record the same four unfiltered Intl failures:
two scenarios for `links.js` and two for `offset-time-zones.js`.

These are data-version conflicts, not evidence that Temporal should discard
current IANA/CLDR semantics. Keep the raw diagnostic failures visible. This audit
has not added exclusions or changed accepted-failure counts.
