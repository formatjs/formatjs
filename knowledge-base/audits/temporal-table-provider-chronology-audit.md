# Table provider chronology and checkpoint proof

2026-11-22. AST/source audit with focused production controls below. Runtime arithmetic is unchanged. Scope: TS bundled Chinese/Dangi tables and Rust borrowed validated tables; raw conversion/month movement dependencies used by CalendarDateUntil. Host-calendar mode already has separate audit. No new shipped-data defect witnessed.

Existing DateUntil/non-ISO add/count-window audits leave complete table/provider consistency open. This note closes bounded structural implications under explicit data premises; it does not repeat an ISO prefix proof or infer astronomical/calendar accuracy from inverse arithmetic.

## Data origin versus validation

TS calendar-table.ts:37/47/63/109/125/150 trusts fallbackLunisolar generated object. Rust table_calendar.rs:67 validates borrowed LunisolarData before constructing engine. Neither implies semantic calendar accuracy just from metadata.

Generator packages/intl-datetimeformat/scripts/calendar-data/lunisolar.rs:25–75:

- Starts at epoch-110000000, retreats to first calendar year's first day; ends only after finishing a year whose end reaches/exceeds epoch110000001. Thus generated interval covers every integer raw epoch in inclusive±110000000, with whole-year padding.
- Checks sequential calendar years, ordinal month1/day1 year starts; each month ordinal/day1, each month length29 or30; visits all months and advances exact whole days.
- Packs one bit per month, leap month number in bits13+, dictionary entries first-seen order; base64url index encoded as exactly two ASCII units. index<4096 asserted before encoding. HashMap random hashing does not reorder dictionary: generator never iterates map.
- Checkpoints and monthCheckpoints emitted at **same index divisible64**, before that year's months; first month checkpoint0; final endDay after all encoded years.
- Legal Chinese/Dangi leap number1..12 remains ICU provider/data premise; generator does not separately assert <=12. Current Rust constructor validates this for consumed shipped packs. Do not describe generator assertions alone as proving every calendar month identity.

Each encoded year length348..390, month count12/13. Covering220000001days plus at most two whole-year paddings requires <633000years and <8.23million months. All generated epoch-day/prefix counts, dictionary indices and month serial differences fit exact Number integers and u32 elapsedMonths. This is a numeric bound, not physical calendar correctness.

Rust constructor additionally requires nonempty even-length ASCII encoded years, nonempty dictionary<=4096, exact checkpoint count ceil(yearCount/64), matching month-checkpoint count; valid base64url units/dictionary index for every year; leap<=12 and no13th length bit without leap. It checks first+sentinel years within±400000; recomputes every checkpoint and endDay using checked i64 day additions. All dictionary entries validated, including unused ones. Hence starts and month checkpoints strictly increase; n<=800000, months<=10400000, both well below i64 limits. Absolute start day is not required to represent the claimed physical calendar label; validation is structural.

## Conversion and serial proof

Let S[j] be prefix sum of year lengths from firstYear, C[j] prefix sum of month counts. Every validated/generated block64k has checkpoints[k]=S[64k], monthCheckpoints[k]=C[64k], including common epoch origin in S.

- Year start: TS calendar-table.ts:63 and Rust:183 select block floor(j/64), add at most63 preceding year lengths. Result exactlyS[j]. One-past-last **year start only** returns endDay; fetching a year pattern at that sentinel rejects.
- Month serial: TS:109 and Rust:307 add at most63 year month counts, then ordinal-1 (TS) or caller's ordinal-1 (Rust NumericCalendar). ResultC[j]+m-1. Difference cancels shared origin exactly, including when retained years remap a leap code.
- Serial inverse: TS:125 and Rust:428 choose greatest block checkpoint<=serial, then consume complete year month counts. At exact block/year/month boundary, <= and remaining<count select following year/month correctly. Negative serial rejects; excessive serial reaches checked out-of-table year instead of wrapping. Accepted serial terminates in at most63 complete years in chosen block. Exactly totalMonths is outside, not a fabricated sentinel month.
- Epoch inverse: TS:150 and Rust:359 guard epoch against first start and exclusive endDay before checkpoint lookup. Greatest checkpoint<=epoch selects exact block; at most63 complete years consumed, then at most12 preceding months. `remaining>=length` advances at exact boundary. Last accepted epoch=endDay-1 produces final month/day; endDay rejects. Rust partition_point subtraction cannot underflow: first checkpoint<=epoch guard supplies at least one match. Month inverse similarly has checkpoint0=0 and serial>=0.
- Day conversion sums own year start + preceding month lengths +day-1 (Rust:402, TS calendarToEpochDayRaw). With regulated/rejected valid day, this is inverse to epoch decoding and stays inside that whole table year. Source endpoints for DateUntil are already integer and within±110million (TS calendar.ts:372; Rust raw conversion:359).

No claim internal TS helpers accept arbitrary bad fractional months/epochs: public/internal owning calendar callers validate integer epoch and valid month. TS generated pack mutation or arbitrary hand-assembled metadata is outside that trusted bundled-data premise; Rust rejects malformed structural input directly.

## Month-code identity and ordering

For legal leap position l and ordinal m, code number is m-[l>0 &&m>l], leap flag iff m=l+1. Non-leap year m1..12 maps to ordinary codeM01..M12. Leap year maps ordinaryMl immediately before MlL, then ordinary M(l+1)..M12.

TS calendar.ts:205/222 and Rust table_calendar.rs:238/251 implement exact inverses for codes present in target year. Fixed-width M01..M12 lexical order plus ordinary-before-L matches Rust's number-then-bool comparison and ordinal order **within each year**. A missing leap code with reject fails; with constrain maps to ordinary same-number code. Retained-year addition therefore preserves identity or documented fallback before applying serial months, matching NumericCalendar::add_year_month.

Do not infer ordinal numbers identify same month across years: leap insertion shifts later ordinals. The new Chinese/Dangi public policy controls correctly distinguish P12M from constrained+1Y for2023M02L→2024M02.

## Difference boundary availability

For valid ordered source/target inside a whole-table interval, retained year estimate is targetYear or adjacent year toward source after one signed correction. It remains between source and target calendar years. Thus year remapping itself cannot need a missing dataset year. Month estimate reaches target ordinal; raw original-day comparison can move at most one ordinal toward source. At the dataset's very first/last month, moving outside table would contradict origin/target travel direction: no earlier/later valid source exists there with the required raw day ordering. Anchor conversion therefore stays in existing table years for supported validated lunar endpoints.

This establishes lookup availability and finite exact serial arithmetic, **not** full non-ISO maximal-prefix equivalence or all year-remapping policy semantics. Published NonISODateUntil remains implementation-defined; existing ISO comparison defect remains separate.

## Umm al-Qura: structural validation is weaker than fallback consistency

Rust constructor:117 checks nonempty lengths, one extra start sentinel, year bounds,12-bit lengths and every internal year sum. TS trusts separately generated startDays/monthLengths. Both use IslamicCivil outside supplied year range; input conversion starts from civil year estimate, then adjusts through start_of_year.

Accepted custom-pack counterexample (source-derived; not executed):

```rust
let calendar = TableCalendar::umm_al_qura(UmmAlQuraData {
    first_year: 1,
    start_days: &[0, 348],
    month_lengths: &[0],
}).unwrap();
// Structurally valid12 months of29 days; all constructor conditions pass.
assert_eq!(calendar.to_epoch_day(1, 1, 1, Overflow::Reject).unwrap(), 0);
assert_eq!(calendar.from_epoch_day(0).unwrap().year, 1389);
```

Civil epoch0 estimate1389 lies outside custom table year1, so conversion uses civil boundaries and never discovers year1's contradictory location. Thus accepted structural packs do **not** universally establish conversion inverse or joins. This is not a witnessed defect in shipped ICU data, nor evidence arbitrary invalid calendar data should be a supported pack. It blocks unqualified “validated provider implies globally consistent conversion” statements.

Shipped umm_al_qura.rs:20–44 deliberately includes complete adjacent years around official AH1300..1600 and checks sequential years/month ordinals. Generator does not explicitly compare first/last supplied sentinel with IslamicCivil fallback starts. Close that dependency by independent boundary/join literals or exhaustive generated constructor validation against civil starts at both joins; do not merely assert internal table sums prove fallback continuity. Host mode uses separate year1300..1600 branch and has its own boundary obligation.

## Production boundary controls

Six literal Umm al-Qura rows and checkpoint movement controls now complement
this structural review. [Shipped join proof](temporal-umm-shipped-joins-audit.md)
records the exact supplied bytes and civil alignment. Shared public controls run
TS, source/bytecode Hermes, host-calendar and native profiles. Typed Rust uses
its existing shipped-data loader. The [synthetic 65-year pack](../../crates/intl_datetimeformat_calendars/table_calendar.test.rs#L10) checks last-month
movement across block64 in both directions, and rejects movement outside first
and final table months. These expected coordinates are literal, not obtained by
calling production conversion helpers.

All nine focused targets pass (two executed, seven cached in the final run);
[manifest](temporal-provider-closure-validation-targets.txt).
Host approximation, external calendar-data accuracy and full public callers remain
separate. Constructor structural validation alone does not prove arbitrary
borrowed Umm packs align with civil fallback. No shipped defect or runtime fix
is claimed by this pass.
