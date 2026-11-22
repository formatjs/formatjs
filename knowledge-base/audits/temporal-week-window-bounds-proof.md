# Finite week-window bounds

Source-only review; no tests/builds/checkout edits. Scope: week branch of chapter7 nudge operations. Existing calendar-add/date-until and timezone contracts are dependencies, not a new audit of engine or Intl internals.

## Successful week windows cannot collapse

Let D=86400000000000ns and k>=1 be validated week rounding increment. Both endpoints use same original clock and retained Y/M prefix, with week counts differing by signed k. CalendarDateAdd applies weeks as exactly seven ISO days after retained prefix. Their requested local scalars therefore differ by sign*7*k*D.

For each successful compatible resolution write E=L-o. For an ordinary/fold local time o is a valid selected offset. For a gap, compatible shifts by offsetAfter-offsetBefore and subtracts offsetAfter, algebraically o=offsetBefore. For origin-preserving zero-date endpoint o is receiver's actual offset. Thus every case uses an effective offset strictly inside (-D,D), under supplied Temporal timezone contract.

Consequently:

```
sign * (E2-E1) = 7*k*D - sign*(o2-o1) > (7*k-2)*D >= 5*D > 0
```

This proof does not need IANA transition enumeration, monotone day endpoints, or an assumption that only one transition occurs in a week. It applies to either sign, before/after retry, both TS/Rust shared engines, and Duration's Y/M-prefix special week path. Plain windows have exactly7*k*D span. Range rejection while resolving an endpoint remains required and is not evidence of a collapsed successful window.

This closes §7.5.34 step13 for actual week windows, conditional only on already-owned CalendarDateAdd and compatible-resolution contracts. It does not close day windows; Apia supplies an actual collapsed adjacent-day pair.

## Plain week initial bracketing

For a plain unrounded result let C be reconstructed full date anchor. CalendarDateUntil add-back supplies that ISO day exactly. Clock borrow makes signed destination minus C in [0,D). Fold days into weeks: count=weeks+trunc(days/7). After truncating to increment k, signed difference between C and lower week date lies in integer days[0,7*k-1]. Hence signed destination minus lower endpoint is in [0,7*k*D), while next endpoint is exactly7*k*D away. Initial window already brackets; no retry needed. This covers either sign and valid shipped calendar date-until add-back contract, including retained Y/M prefixes in source. Published retained-prefix r1=0 shortcut remains its separate documented inconsistency.

## Zoned retry remains reachable

New York literal witness in `temporal-week-retry-spec-issue.md` disproves week-retry unreachability. Published week branch ignoring additionalShift violates its positive retry assertion. Current source handles witness by shifting week count.

The offset bound alone does not prove arbitrary adjacent calendar-day anchors monotone: local separationD can be smaller than permitted offset difference<2D. Therefore it cannot by itself prove current single retry brackets every zoned year/month/week/day input. A complete such claim needs actual unrounded-anchor maximality and relevant shipped transition chronology/provider bounds. Existing Apia and NY controls do not supply a universal proof. No fresh global sweep or unsupported signoff added.

Row conclusions:

- 7.5.33 step3.f: replace retry-unreachable premise with concrete rendered-comparison inconsistency.
- 7.5.34 step5.a.ii: same concrete week witness violates published assertion; source handled witness.
- 7.5.34 step13: locally proved noncollapsed/positive for week; day/all-unit aggregate still retains owning contracts.
- 7.5.34 step17: follows exact distance/span only after bracketing; plain week proved, literal NY shifted week proved, general zoned bracket premise retained.
- 7.5.34 step6.a.ii: no new universal negative-zoned proof claimed.
