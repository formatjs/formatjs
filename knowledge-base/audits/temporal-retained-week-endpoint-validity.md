# Retained-prefix week retry endpoint bounds

Scope is the intended rebased upper endpoint C when Duration.round retains a
year/month prefix, rounds weeks at increment 1, and its successful first
upper endpoint B lies strictly before target T in the direction of travel.
The [published retry conflict](temporal-week-retry-spec-issue.md) stays open.
This proof establishes civil and Instant bounds for generated timezone data,
fixed offsets, and the identified Node ICU provider under the existing
calendar and local-resolution contracts.

- Retained-prefix branch [TypeScript](../../packages/temporal/relative-duration.ts#L257-L290) and [Rust](../../crates/temporal/relative_duration.rs#L133-L162).
- Unrounded fixed-clock anchors [TypeScript](../../packages/temporal/zoned-date-time.ts#L535-L581) and [Rust](../../crates/temporal/calendar_difference.rs#L111-L205).
- Fixed year/month prefix and integral day tail [TypeScript](../../packages/temporal/calendar.ts#L452-L480) and [Rust](../../crates/intl_datetimeformat_calendars/date_math.rs#L37-L59).
- [NudgeToCalendarUnit §7.5.34 step 5.a](https://tc39.es/proposal-temporal/#sec-temporal-nudgetocalendarunit)
  and [ComputeNudgeWindow §7.5.33 steps 3.f–g](https://tc39.es/proposal-temporal/#sec-temporal-computenudgewindow).

Let L and U be the inclusive Instant limits, D a day, and s the sign of
travel. A lower-case letter denotes a nominal civil scalar at the origin
clock for endpoints, or the actual target local scalar y. Endpoint and target
epochs are upper-case. Each effective offset has magnitude strictly below D.
The six-day bound and DateUntil reconstruction yield the following.

1. Unrounded fixed-clock selection starts at x0 and retreats at most one day
   toward origin. Before retreat, s(y−x0) < D, including origin clamping.
   If x is the selected anchor, first upper b is at least one signed civil
   day beyond x: the discarded whole-day residual after truncating weeks
   is 0 through 6. If there was a retreat, b lies at or beyond x0. Equality
   would reuse exactly the rejected or overshooting x0 and cannot give a
   successful B strictly before T. Otherwise b is at least another D beyond
   x0. In every successful undershoot, s(b−y) > 0. A plain anchor has no such
   undershoot because civil and physical order agree.
2. For forward travel, B<T and b>y imply the effective offset at b exceeds
   T's active offset. For an ordinary or fold endpoint it is active at B.
   For a generated compatible gap it is active just before transition τ,
   with τ≤B and τ>b−D>y−D>T−2D. For the host compatible gap it is read at
   clamp(b−D), also no later than B and after T−2D near U. Since ordinary
   B also exceeds T−2D, the provider must have a negative jump in [T−2D,T].
   A positive jump alone cannot cause this forward undershoot.
3. For reverse travel, B>T and b<y imply b is within D of T. B's effective
   offset occurs within D of b under the local-resolution contract, so
   occurs within 2D of T. The measured bounds cover both sides of L, including
   effective offsets from outside the Instant range. A constant offset on this
   neighborhood forces B−T=b−y<0, contradiction. A compatible forward gap
   can place a reverse candidate physically after T despite b<y, so use
   lower-edge constancy rather than just absence of negative jumps.
4. Sufficient provider facts are no negative jump on [U−11D,U] and no
   change on [L−11D,L+11D]. Steps 2–3 therefore force sT≤U−9D whenever B
   undershoots, using L=−U. The next nominal endpoint c=b+7sD then satisfies
   −U+6D<sc<U−D because −U≤sB<sT and |b−B|<D. Thus the civil check,
   epoch-day check, c±D host probes and every possible c−offset candidate
   are all safely inside their respective domains. No assumption about
   which compatible offset C chooses is needed for the range proof.

The provider transition checks include every supported named zone in the
bound profiles. Packed rule hash c62e83781c612170917463fac92be16e174510edfc6a84c66bcec67dc10beb0d
must match the checked-in generated parity summary. The scan reads historical
transitions and future Gregorian recurrences, using the existing compact/native
equivalence. Generated results report 457 primary zones, zero lower changes,
zero upper negative changes, and exactly two upper +1h transitions
(America/Santiago and Pacific/Easter, U−504000 seconds).

```sh
bazel build //packages/intl-datetimeformat:tz_all_tz
packed="$(bazel cquery --output=files //packages/intl-datetimeformat:tz_all_tz)"
proof=knowledge-base/audits/temporal-timezone-boundary-proof
PYTHONDONTWRITEBYTECODE=1 python3 "$proof/retained-week-generated-scan.py" "$packed"
node --experimental-ffi "$proof/node-icu/temporal-node-icu-endpoint-scan.mjs" 11
```

The ICU scan binds the actual DateTimeFormat runtime and calendar C transition
API to the same ICU zoneinfo resource under the existing provider proof.
It reports 638 zones, zero lower changes, zero upper negative changes,
and four upper +1h transitions (the same two zones and aliases
Chile/Continental and Chile/EasterIsland). Exact Node 26.5.1, ICU 78.3, tz2026b
binary SHA-256 fb48e77df2f8e92fedfec39afa60a5f41563441f6b61316ada5fb295a431c2c6.
The [pinned-toolchain proof](temporal-timezone-boundary-proof/node-icu/temporal-pinned-node-icu-proof.md)
extends these bounds to the configured Linux x64 Node 24 and 26 profiles
and the tested compiled Hermes formatter. Unexamined host builds need
their own endpoint and six-day certificates.
Fixed offsets satisfy both conditions directly.
[Scan summary](temporal-timezone-boundary-proof/retained-week-window-summary.json).

The exact-endpoint replay checks 756 combinations of sign, timezone,
retained prefix, largest unit and rounding mode. Each origin adds back to
the selected Instant limit. Both the Bazel package and pinned Node 26.8.1
reject every boundary case and accept its control 14 days inside the
limit. The [TypeScript path](../../packages/temporal/relative-duration.ts#L284)
constructs the adjacent endpoint before returning an exact rounded result.
[Replay source](temporal-timezone-boundary-proof/retained-week-exact-endpoint-probe.mjs).

Build `//packages/temporal:pkg` and use the directory returned by
`bazel cquery --output=files //packages/temporal:pkg` for that build.

```sh
"$node_bin" "$proof/retained-week-exact-endpoint-probe.mjs" "$package_dir/index.js"
```

The added week preserves retained calendar prefix, duration sign and integral
day arithmetic. This closes the extra range-check premise where the existing
calendar and compatible-resolution contracts hold. It does not establish
those other contracts for arbitrary host calendars or timezones, restore a
literal published retry, or validate the independent exact-target zero-span case.
