# Actual host Umm/civil joins

Comparison §13.42 step2 / §12.3.25 provider premise only. Requested ECMA-262 authority unchanged. No source correction proposed.

Six public forced-host regressions: `packages/temporal/tests/host-calendar-boundary.test.mjs`, touching only existing `host-calendar-boundary.test.mjs`. Includes inverse fields, forward reject-overflow conversion and day crossing both directions at AH1300 and1601. Root Bazel host_calendar_boundary_test passes all six rows and crossings; final nine-target validation also passes.

Independent expected literals come from existing pinned shipped ICU artifact and civil formula already reviewed in `temporal-umm-shipped-joins-audit.md`, not production conversion helpers:

|  Epoch | ISO        | Calendar fields |
| -----: | ---------- | --------------- |
| −31827 | 1882-11-11 | 1299/M12/29     |
| −31826 | 1882-11-12 | 1300/M01/1      |
| −31825 | 1882-11-13 | 1300/M01/2      |
|  74838 | 2174-11-25 | 1600/M12/30     |
|  74839 | 2174-11-26 | 1601/M01/1      |
|  74840 | 2174-11-27 | 1601/M01/2      |

Pinned `umm-al-qura.ts` SHA256 `073bdb8641d224a74bdb21a92ee917d679f5e249e7efbe78d45d3bd9c5f2af45`: firstYear1299; start1300=−31826; start1601=74839; year1600 packed2964 has final-month bit1, hence30days. Year1299 packed1365 has final-month bit0, hence29days. Civil formula `−492148+354*(y−1)+floor((3+11*y)/30)` yields same starts1300/1601. Year1600 start74485 intentionally differs from civil74484, so matching only interior arithmetic would not establish correct join.

Actual captured-Intl data probe records exact same six coordinates: `temporal-host-umm-joins-intl-evidence.json`, Node26.5.1/ICU78.3, resolved calendar `islamic-umalqura`, UTC/latn. This is bounded supplied-data evidence, not assumption that all conforming Intl engines must use these historical coordinates.

## Adapter source

- calendar-table.ts:67–70 supplies host starts for AH1300..1601; outside uses civil fallback. :94–98 supplies actual host month lengths only AH1300..1600; following year uses civil. Thus sentinel1601 must equal civil1601 and host1600.end.
- host-calendar.ts:83–130 reconstructs actual host years. Its probe passes epoch day as exact milliseconds within this modest range. Captured Intl day identifies containing month start by `probe-day+1`; stepping one preceding day visits previous actual month. Chronological12-month Umm contract guarantees returned starts/end describe target year. At reviewed years1300/1600/1601, initial probe is actual year start+400/+399/+400 respectively. Twelve29/30-day months put it in following year's first two months, so first forward probe search exits immediately and backward walk uses at most14 target/following months, below40 cap. Successful public regression exercises actual finite adapter route at these joins. No host calendar engine reimplementation required.
- At lower join, previous civil1299 has final day29, next host1300 begins−31826. At upper join, actual host1600 last month ends74839 and sentinel/civil1601 both begin74839. Positive source-year partitions plus these equalities leave neither gap nor duplicate at handoffs.

## Scope of closure

After parent public regression passes, actual tested supported-runtime data contract satisfies remaining host Umm stitching premise. Existing arithmetic/table/Chinese/Dangi structural proofs then cover chosen provider routes; §13.42 step2 may close to that explicitly supported runtime/data scope. Keep actual supplied-Intl-data assumption visible. Optional calendar availability across installations remains separate; so do calendar grammar and foreign-copy slots. Do not infer these literal boundary dates from ECMA-402 alone or claim arbitrary unrelated third-party Intl data automatically aligns with chosen civil fallback.
