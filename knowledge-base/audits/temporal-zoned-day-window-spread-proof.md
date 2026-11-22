# Nonexact zoned day windows on packed timezone data

This proof concerns the existing FormatJS zoned rounding window for
`smallestUnit: 'day'`, positive integral increment and both signs. It uses
the calendar's existing dateUntil/add round trip and its fixed-prefix day
addition law. It is scoped to the packed timezone profile certified below.
Successful endpoint computation and its signed date-field contract are
premises. Native, compact and host profiles require their own binding to the
same offset property. Month, year and week rounding windows are outside this
proof.

## Data premise

Each active offset has absolute magnitude strictly less than a day. The
bundle's offset spread in any six-day UTC interval is at most one day.
`temporal-zoned-day-window-spread.py` validates the input hash, scans each
closed window ending at an explicit event and includes both adjacent offsets.
In an interval with an offset change, the first and last enclosed changes
bound all possible offsets. In an interval without a change, the spread is
zero. The script conservatively includes both possible footer offsets at each
explicit-to-footer cutoff. A wholly recurring interval has only those two
possible offsets, so no calendar-year expansion is needed.

The exact configured packed artifact and hash are recorded in
`temporal-timezone-boundary-proof/generated-summary.json`. Invoke the script
with that artifact path and its recorded SHA256. The scan covers 457 zones,
20,111 explicit rows and 431 footer seams. No interval exceeds the bound.
America/Adak attains equality at −3225223727 epoch seconds, with offsets
44002s and −42398s. This is a data certificate, independent of a runtime test.

## Local-to-epoch comparison

Let D be one day, y the destination's local epoch representation, x a
fixed-clock civil candidate, and s the sign of the epoch difference. Write
E(x) = x − ox for the actual chosen candidate epoch, and T = y − oy for the
destination. For a normal time or a fold, ox is active at E(x). For a
compatible gap, ox is the old offset at the transition, which is within D
of x because x lies between the two local transition boundaries. Offset oy
is active within D of y.

If |x−y| ≤ 2D, both effective offsets therefore occur within [y−3D,y+3D].
Use the six-day certificate to obtain |ox−oy| ≤ D. If |x−y| > 2D, the
absolute offset bounds alone give |ox−oy| < 2D. Consequently candidates at
a signed civil distance of at least D from y lie on the corresponding
physical side of T. At exactly D, equality is possible. Beyond D the
physical comparison is strict. Apply this in either direction without
assuming monotonicity at civil separations shorter than a day.

## Bracket after at most one retry

The unrounded zoned difference begins with the fixed-clock civil floor or
ceiling x0 in the direction of travel. Before clamping to the origin,
−D < s(x0−y) ≤ 0. Clamping towards the permitted signed date range can
only increase s(x0−y). If x0 physically overshoots, the unrounded loop
corrects the date one step toward the origin. A clamped origin cannot
overshoot. For a nonclamped x0, s((x0−sD)−y) ≤ −D, so the preceding
candidate lies at or before T in the direction of travel. That preceding
candidate is within the signed origin-to-target range: its fixed-clock
date lies on the origin's side of x0 and at least D from the origin's
local clock, or is the origin itself. The same offset comparison orders
it with respect to the origin, whose stored offset is active whether it
is the earlier or later fold occurrence. Therefore an Instant range
failure cannot force more corrections under successful calendar add and
provider contracts. This conclusion covers the existing origin clamp,
which uses the epoch of the actual origin for zero fields.

Let x be the selected unrounded fixed-clock candidate. Its stored prefix
and day count reconstruct its civil date. Truncation toward zero at
increment k retreats by h signed days, where 0 ≤ h ≤ k−1. The first
candidate A at x−s*h*D lies at or before T in the direction of travel.
For h=0, use the unrounded decomposition's physical check. For h≥1,
use the signed civil comparison above, or the original origin when all
fields are zero. If unrounded clamping yielded the origin, h=0.

The second candidate B at x+s*(k−h)_D is the initial upper endpoint.
Only B strictly before T triggers retry, because A cannot overshoot.
After retry the new lower endpoint is B, and the new upper endpoint at
x+s_(2k−h)*D is at least k+1 civil days beyond x. If unrounded selection
did not correct, s(x−y) > −D, so this upper endpoint is more than D
beyond y in the direction of travel. If unrounded corrected by one day,
s(x−y) > −2D and the same conclusion holds for k≥2. For k=1 after
unrounded correction, B is already the overshooting x0, so no retry is
required. If this x0 failed resolution, computing B also fails and the
case has no successful rounding window. Calendar limits on any candidate
stay separate throwing cases.

Both the initial and repaired successful windows therefore bracket T.
A bracket with A different from T has strictly positive signed span,
giving progress in [0,1] by exact arithmetic. When A = T, FormatJS can
choose the exact first endpoint without division. Apia demonstrates that
both ends can equal T, which violates the unconditional published
distinctness assertion in §7.5.34 step 13. Step 14 then supplies no
progress for step 17. The nonexact proof leaves that standard-text
conflict open.

Relevant code: TS `zoned-date-time.ts:490–572` and
`date-core.ts:962–1030`. Rust `calendar_difference.rs:107–166` and
`:190–253` have corresponding unrounded/truncation/retry steps. The
packed kernel's gap/fold provider is `kernel.ts:320–351`, with explicit
and recurring offsets supplied by `TimeZoneOffset.ts:42–85`. The data
scan alone does not bind these contracts to native or host data or
discharge the distinct calendar-unit and prefix issues in §7.5.33.
