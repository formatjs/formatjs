# Timezone sampling for relative windows

This proof supplies a local-resolution premise for the frozen Temporal
comparison's [§7.5.34 steps 13 and 17](https://tc39.es/proposal-temporal/#sec-temporal-nudgetocalendarunit).
Generated data have a complete spacing proof. Node/ICU results below
cover observed events and retain a recurring-transition premise. The
assertions remain conditional across the default package's provider scope.

## Transition separation

The [host candidate search](../../../packages/temporal/host-timezone.ts#L181)
samples at the local nanosecond scalar and one day on either side, clipping
the probes to Instant limits. All certified offsets have magnitude less than
one day. Every valid candidate lies between the two extremal probes. A
closed two-day probe interval contains at most one effective offset change
under the spacing certificate. Its endpoints therefore observe every active
offset in the interval. Round-trip checks recover valid fold candidates.
For a gap, the same offsets bound its compatible image. The separate
[Instant endpoint proof](README.md) excludes mixed valid and invalid candidates
for the certified profiles.

The generated scan covers 457 zones, 19,738 effective historical changes,
107,861 recurring changes and 431 explicit/footer joins. The TypeScript
millisecond and Rust whole-second handoffs add no offset changes. Minimum
adjacent spacing is 601,200 seconds. Existing packed, compact and native
parity binds these results to consumed timezone data.
[Generated endpoint and parity evidence](README.md#consumed-generated-profiles).

The ICU scan uses finite UTC rule starts, the historical/final January 1
join, and the transitions reported by ICU over a full Gregorian recurrence
cycle with outer joins. Node 26.5.1 and 26.8.1 each report a minimum spacing
of 601,200 seconds across 638 IDs. The recurrence proof still needs direct
annual-rule enumeration. ICU’s next-start search begins with the query’s UTC
year and then checks the next nominal year. A rule from the previous nominal
year can spill forward. The observed stream alone leaves that case unverified.
[ICU annual rule search](https://raw.githubusercontent.com/unicode-org/icu/release-78.2/icu4c/source/i18n/tzrule.cpp).
[Pinned provider and ICU resource binding](node-icu/temporal-pinned-node-icu-proof.md).
[ICU historical and final-rule dispatch](https://raw.githubusercontent.com/unicode-org/icu/release-78.2/icu4c/source/i18n/olsontz.cpp).

All three bound Node builds also passed the host Umm al-Qura chronology check.
It scans 107,748 consecutive days and verifies both civil joins, each 29- or
30-day month and the reverse month-walk bound. The maximum is 14 visits.
This supplies a chronological provider premise for the window proof.

## Exact scope

The established signed-span proof applies to successful nonexact windows
on the certified profiles. The retained-prefix week path still needs its
separate one-sided 11-day endpoint bound. Its New York shortcut evaluates
337/336 before the comparison's shifted retry.
[Signed windows](../temporal-year-month-week-nonexact-window.md).
[Retained-week endpoint bound](../temporal-retained-week-endpoint-validity.md).

For distinct local endpoints to map to the same instant, at least one
endpoint must be in a gap. With only one nearby effective change, a
compatible gap image overlaps an ordinary endpoint exactly one day away
only when the forward jump is 24 hours. Week, month and year endpoints
remain farther apart. The Apia exact-target assertion therefore stays a
published comparison conflict. Host and standalone replays reproduced
the existing result across the scanned +24-hour jumps.
[Exact-target proof](../temporal-apia-exact-target-spec-issue.md).

Six-day offset spread alone does not establish sample completeness.
For day length D, a provider with offset D/2 on [0,D/4) and zero elsewhere
meets the spread bound. For local L in [D/2,3D/4), the three probes all see
zero, missing candidate L−D/2. Other runtime data and installed formatter
overrides need their own spacing certificate or exact candidate lookup.
Node 24's chronology evidence here does not extend the offset-spacing scan.

## Reproduce

Use the artifact returned by Bazel cquery for `//packages/intl-datetimeformat:tz_all_tz`.
Pass it after `proof.py` to [transition-separation.py](transition-separation.py).
Run [the ICU probe](node-icu/temporal-node-icu-transition-separation.mjs)
with the bound Node executable and `--experimental-ffi` for Node 26.
The [calendar probe](node-icu/temporal-host-umm-finite-profile.mjs) uses
the same executable without FFI. [Summary and artifact hashes](transition-separation-summary.json).
