# Six-day offset spread on Node 26.5.1 ICU 78.3

This is a supplemental certificate for the existing source proof of
nonexact calendar-relative windows. It uses the same Linux x64 Node
binary, loaded ICU 78.3 timezone-data 2026b and unchanged resource
configuration as the endpoint scan. It inherits that proof's exact
DateTimeFormat-to-ICU timezone binding.

The binary SHA256 is
`fb48e77df2f8e92fedfec39afa60a5f41563441f6b61316ada5fb295a431c2c6`.
The separate scan reads the loaded Olson rule objects. The private
Linux Itanium ABI is confined to read-only analysis. It introduces no
production dependency.

## Finite time partition

The scan enumerates all 638 loaded ICU system zones. Each ID is opened
with its exact name and checked as an OlsonTimeZone. ICU's
countTransitionRules and getTimeZoneRules supply an initial state and
the complete transition rule set. Each transition rule's raw plus DST
offset contributes one value. The scan verifies all finite rules are
TimeArrayTimeZoneRule with UTC times and all other rules are
AnnualTimeZoneRule. These are the actual rule objects from the loaded
resource, with 30,947 finite UTC starts across the enumerated names.
[ICU rule API](https://unicode-org.github.io/icu-docs/apidoc/released/icu4c/classicu_1_1BasicTimeZone.html).

For 622 identifiers, the spread of this complete set of possible
offsets is already at most one day. Their six-day windows inherit that
bound regardless of transition spacing.

For the 16 remaining identifiers, let F be the last absolute start
time among their finite rules. After F, only the offset at F and
offsets of annual rules can appear because no finite rule can start.
The spread of that tail set is at most one hour. To cover every
crossing window, the scan enumerates all actual ICU transitions up to
F+6 days, beginning at the minimum relevant Instant scalar minus
four days. The valid UTC/compatible local offsets are strictly
subday. A destination's local coordinate therefore lies within one
day of the Instant range and the six-day comparison interval extends
at most three more days toward prehistory.

The inclusive then exclusive nearest-transition queries enumerate all
actual changes over that finite range. For each returned transition,
the scan reads active offsets immediately before and at its epoch and
checks their rolling spread over every closed six-day interval ending
at a change. A constant interval has zero spread. An interval with
changes can only include the states immediately before its earliest
change and the states each included change establishes. A window ending
after F+6 days is wholly in the bounded tail. The 16 exceptional names
supply 500 checked historical transitions. Maximum spread across all
638 names is exactly 86400000 milliseconds.

## Source application

FormatJS's host offset adapter returns a checked subday offset.
Normal/fold resolution only retains a candidate whose offset at the
candidate instant maps back to the requested local time. The
successful gap path uses the offset from clamp(local − one day) or
clamp(local + one day). For any successful candidate, its local scalar
is less than one day outside the Instant range. Clamping does not move
either probe farther than one day from that scalar. Hence each success
uses an effective offset active within one day of the candidate's
local scalar, as required by the signed civil comparison lemma.
[Host adapter](../../../../packages/temporal/host-timezone.ts#L151).

This certifies the six-day premise for this bound built-in Intl profile.
The calendar date-add/date-until and successful endpoint premises stay
explicit. The retained-prefix week shortcut, exact Apia assertion
failure and other host versions keep their separately documented scope.

## Reproduce

```sh
/usr/local/bin/node --experimental-ffi temporal-node-icu-rule-spread.mjs \
  > temporal-node-icu-rule-spread.json
```

[Summary](six-day-spread-summary.json) binds the exact scan, script and
[per-zone records](temporal-node-icu-six-day-zone-spread.tsv) by SHA-256.
Times and offsets use milliseconds. A dash marks fields that apply only to
zones whose global spread exceeds one day.
