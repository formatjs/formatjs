# Calendar condition reconciliation

28 numbered rows reconciled in the core checklist:26 finite source proofs plus2 field-projection steps after the public YearMonth red/green correction. Validation: temporal-zone-intl-yearmonth-validation-targets.txt (12 targets pass).

Authority remains requested ECMA-262. Numbered Temporal sections below refer only to previously pinned rendered proposal comparison.

## Closed now

- §12.3.3 step9.c.vii, .1, .2: monthCode branch already has complete §12.2.1 grammar/string-hint conversion proof. Earlier review accidentally matched `vi` prefix against `vii`; timezone/offset dependency never applied here.
- §12.3.3 step9.d, .i, .ii: finite required-field/default caller table below.
- §12.3.4 all6 numbered steps: own-data keys-present representation, undefined-as-unset, finite caller shapes.
- §12.3.5 all13 numbered steps: same shapes plus precise month/code/year/era invalidation; private clock transport and separate Zoned offset selection.
- §12.3.13 step1: literal day1 in yearMonthFields; private assignment placement has no observable effect. Step2 resolution stays separate.

## Required fields/default caller table

| Caller                                                                         | Required list / missing-field behavior                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PlainDate.from / PlainDateTime.from / PlainYearMonth.from / PlainMonthDay.from | Empty required list. Date resolution follows options. Missing clock fields default0 through clockNanoseconds.                                                                                                                            |
| Their with variants                                                            | Partial list; empty update rejected by prepared reader. No required individual field.                                                                                                                                                    |
| PlainMonthDay.toPlainDate                                                      | Empty required list; later year resolution.                                                                                                                                                                                              |
| PlainYearMonth.toPlainDate                                                     | Required day Get/conversion performed directly once; missing immediately TypeError.                                                                                                                                                      |
| ZonedDateTime.from bag                                                         | Required timezone conversion performed at sorted timezone position, including undefined; throws before subsequent year Get. Private prepared record then copied without further public bag effects.                                      |
| ZonedDateTime.with                                                             | Empty required list; offset handled separately from merged date/clock.                                                                                                                                                                   |
| relativeTo bag                                                                 | Empty required list; undefined timezone allowed. Plain anchor discards clock after immediate numeric conversions. Under constrain every finite prepared clock integer clamps, so discarded clock regulation cannot throw or affect date. |

## Private-record producer/consumer table

| Producer                                  | Consumer / preserved invariant                                                                                                                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| readDateFields/readISODateFields          | Private frozen null-root records. Only known converted values stored; absent and own undefined mean unset.                                                                                     |
| PlainDate dateFieldsView                  | Four date fields, only date resolution reads result. NonISO merge supplies own undefined era placeholders.                                                                                     |
| PlainDateTime current                     | Four date fields + all six own clock fields. Merge changes only requested known fields; clockNanoseconds reads own values.                                                                     |
| ZonedDateTime current                     | Same own date/clock fields. offset selected from updates or validated slot separately; timezone remains slot. No missing inherited offset read from merge.                                     |
| mergeShortFields                          | Own date fields; own undefined year for MonthDay or day for YearMonth. Then standard merge invalidation.                                                                                       |
| Native snapshot / arithmetic/table result | Extra old ordinal month gets cleared when original monthCode retained. Updated month clears old monthCode. Direct YearMonth forward consumer sees consistent month/code from same source year. |

Keys-present allocation need not materialize List: every reachable consumer has same known-field membership/undefined behavior. This proof does not waive calendar provider or ResolveFields contracts.

## Projection candidate remains separate

§13.42 steps1/6 close the ordinary-object inherited-era condition after YearMonth.toPlainDate red/green. That path spreads dateFields directly and bypasses mergeDateFields; therefore it does not block19 local keys/merge rows above. Patches supplied separately:

- `packages/temporal/tests/date-output-oracle.ts`: existing shared public oracle, gregory literal2020-02-03, inherited era/eraYear throws; restore descriptors in finally. Public inherited day still read once and yields literal2020-02-04.
- `packages/temporal/plain-year-month.ts`: null-prototype private record, numbered comparison comment preserved/added.

Source-only ERA-INDEXOF remains at calendarYearFromEra: Array.prototype.indexOf and Japanese metadata iterator. Concrete public witness previously sent; parent must reproduce before classifying confirmed defect. It keeps §12.3.31 step2.a and dependent resolution rows conditional. Private merge correctness does not imply era leaf correctness.

## Actual provider limits

Bundled/native chronology already supplied by arithmetic/table audits: positive partition, exact forward/inverse, full table extents/checkpoints/month identities; shipped Umm civil joins independently proved. Trust conforming runtime/Intl field contract and pinned ICU/CLDR data policy. §12.3.6/.8/.21/.25 implementation-defined processing does not demand independent astronomical truth or every external implementation's policy. No further oracle sweep or ICU engine required.

Remaining §13.42 step2 condition should name only supported-host structural stitching, not repeat established arithmetic/table or require unrelated full402 audit:

1. Host Umm1300..1600 uses different handoffs from shipped1299..1602 pack. Existing shipped join literals do not prove host start1300 and sentinel1601 match chosen civil fallback. Smallest evidence: two public forced-host boundary sequences through previous/next day, literal epoch mapping, plus source contract that captured Intl year reconstruction yields complete chronological12-month years. No broad calendar sweep.
2. Host Chinese/Dangi compact1900..2102 uses approximation outside. Current `host-calendar-boundary.test.mjs` tests1899 and Chinese2102 / Dangi2052. Dangi2052 does not reach current2102 compact upper handoff. Smallest new regression: Dangi2102/2103 handoff through public roundtrip/add/subtract. Existing source proof still explicitly lacks all-year approximation partition/adjacent continuity; finite arithmetic proof of chosen approximation can close structural premise without external astronomical oracle. A few boundary examples alone do not prove every reachable approximation year.

§12.1.2 AvailableCalendars (two non-numbered rows outside259-step register) retains exact installed host/partial-data capability premise. Full owned registry set already matches chosen16 canonical IDs. Additional CLDR calendars optional. Resolved-calendar fallback must not be mistaken for actual requested calendar support; current host-calendar.ts:53–67 explicitly checks resolved identity. Do not require every installation to support every optional calendar.

Foreign-copy private slots and calendar string grammar remain separate named boundaries at §12.3.10/.11, not provider-data defects.
