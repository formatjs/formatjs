import assert from 'node:assert/strict'
import {loadPinnedIcu} from './temporal-pinned-icu-runtime.mjs'

const direct = process.argv[2] === '--direct-annual'
const week = direct && process.argv[3] === '--week'
assert.deepEqual(
  process.argv.slice(2),
  week ? ['--direct-annual', '--week'] : direct ? ['--direct-annual'] : []
)
const {binarySha256, icuMajor, lib, toString} = await loadPinnedIcu()
function bind(name, result, args) {
  return lib.getFunction(`${name}_${icuMajor}`, {
    return: result,
    arguments: args,
  })
}
const PTR = 'pointer'
const i32 = 'i32'
const f64 = 'f64'
const getVersion = bind('ucal_getTZDataVersion', PTR, [PTR])
const openZones = bind('ucal_openTimeZones', PTR, [PTR])
const enumCount = bind('uenum_count', i32, [PTR, PTR])
const enumNext = bind('uenum_next', PTR, [PTR, PTR, PTR])
const enumClose = bind('uenum_close', 'void', [PTR])
const open = bind('ucal_open', PTR, [PTR, i32, PTR, i32, PTR])
const close = bind('ucal_close', 'void', [PTR])
const setMillis = bind('ucal_setMillis', 'void', [PTR, f64, PTR])
const getMillis = bind('ucal_getMillis', f64, [PTR, PTR])
const transition = bind('ucal_getTimeZoneTransitionDate', 'i8', [
  PTR,
  i32,
  PTR,
  PTR,
])
const get = bind('ucal_get', i32, [PTR, i32, PTR])
const getID = bind('ucal_getTimeZoneID', i32, [PTR, PTR, i32, PTR])
// Linux Itanium C++ ABI control for the same dynamic cast the C API performs.
// A false transition result can't be explained by an unsupported zone type.
const calendarZone = lib.getFunction(
  `_ZNK6icu_${icuMajor}8Calendar11getTimeZoneEv`,
  {return: PTR, arguments: [PTR]}
)
const dynamicCast = lib.getFunction('__dynamic_cast', {
  return: PTR,
  arguments: [PTR, PTR, PTR, 'i64'],
})
const timeZoneRtti = lib.getSymbol(`_ZTIN6icu_${icuMajor}8TimeZoneE`)
const olsonZoneRtti = lib.getSymbol(`_ZTIN6icu_${icuMajor}13OlsonTimeZoneE`)
const status = Buffer.alloc(4)
function checked(fn, ...args) {
  status.writeInt32LE(0)
  const result = fn(...args, status)
  assert.ok(
    status.readInt32LE() <= 0,
    `ICU operation failed: ${status.readInt32LE()}`
  )
  return result
}
const version = toString(checked(getVersion))
assert.equal(version, process.versions.tz)
const list = checked(openZones)
assert.notEqual(list, 0n)
const n = checked(enumCount, list)
const zones = []
for (;;) {
  const ptr = checked(enumNext, list, 0n)
  if (ptr === 0n) break
  zones.push(toString(ptr))
}
enumClose(list)
assert.equal(zones.length, n)
assert.equal(new Set(zones).size, n)
for (const requested of Intl.supportedValuesOf('timeZone'))
  assert.ok(zones.includes(requested), requested)

const DAY = 86_400_000
const spacing = (week ? 7 : 2) * DAY
const locale = Buffer.from('en_US@calendar=gregorian\0')
function bindCpp(sig, result, args) {
  const name = sig.replaceAll('@', icuMajor)
  return lib.getFunction(name, {return: result, arguments: args})
}
const countRules = bindCpp(
  '_ZNK6icu_@13OlsonTimeZone20countTransitionRulesER10UErrorCode',
  i32,
  [PTR, PTR]
)
const getRules = bindCpp(
  '_ZNK6icu_@13OlsonTimeZone16getTimeZoneRulesERPKNS_19InitialTimeZoneRuleEPPKNS_12TimeZoneRuleERiR10UErrorCode',
  'void',
  [PTR, PTR, PTR, PTR, PTR]
)
const raw = bindCpp('_ZNK6icu_@12TimeZoneRule12getRawOffsetEv', i32, [PTR])
const dst = bindCpp('_ZNK6icu_@12TimeZoneRule13getDSTSavingsEv', i32, [PTR])
const countTimes = bindCpp(
  '_ZNK6icu_@21TimeArrayTimeZoneRule15countStartTimesEv',
  i32,
  [PTR]
)
const getTime = bindCpp(
  '_ZNK6icu_@21TimeArrayTimeZoneRule14getStartTimeAtEiRd',
  'i8',
  [PTR, i32, PTR]
)
const timeType = bindCpp(
  '_ZNK6icu_@21TimeArrayTimeZoneRule11getTimeTypeEv',
  i32,
  [PTR]
)
const startYear = bindCpp(
  '_ZNK6icu_@18AnnualTimeZoneRule12getStartYearEv',
  i32,
  [PTR]
)
const endYear = bindCpp('_ZNK6icu_@18AnnualTimeZoneRule10getEndYearEv', i32, [
  PTR,
])
const annualStart = direct
  ? bindCpp('_ZNK6icu_@18AnnualTimeZoneRule14getStartInYearEiiiRd', 'i8', [
      PTR,
      i32,
      i32,
      i32,
      PTR,
    ])
  : undefined
const ruleRtti = lib.getSymbol(`_ZTIN6icu_${icuMajor}12TimeZoneRuleE`)
const arrayRtti = lib.getSymbol(`_ZTIN6icu_${icuMajor}21TimeArrayTimeZoneRuleE`)
const annualRtti = lib.getSymbol(`_ZTIN6icu_${icuMajor}18AnnualTimeZoneRuleE`)
const dest = Buffer.alloc(8)
const openedName = Buffer.alloc(256)
const actual = (cal, epoch) => {
  checked(setMillis, cal, epoch)
  assert.equal(checked(getMillis, cal), epoch)
  return checked(get, cal, 15) + checked(get, cal, 16)
}
function representativeThrough(firstYear) {
  const signature = year => {
    const first = Date.UTC(year, 0, 1)
    const next = Date.UTC(year + 1, 0, 1)
    const last = Date.UTC(year + 2, 0, 1)
    return [new Date(first).getUTCDay(), next - first, last - next].join(',')
  }
  const remaining = new Set(
    Array.from({length: 400}, (_, index) => signature(firstYear + index))
  )
  for (let year = firstYear; year < firstYear + 400; year++) {
    remaining.delete(signature(year))
    if (remaining.size === 0) return year
  }
  assert.fail('Gregorian signatures must repeat in 400 years')
}

const LIMIT = 8_640_000_000_000_000
const firstRelevant = -LIMIT - 4 * DAY
const rows = []
for (const id of zones) {
  const c = checked(open, Buffer.from(id, 'utf16le'), id.length, locale, 1)
  assert.notEqual(c, 0n, id)
  const idLength = checked(getID, c, openedName, openedName.length / 2)
  assert.equal(openedName.subarray(0, 2 * idLength).toString('utf16le'), id)
  const z = dynamicCast(calendarZone(c), timeZoneRtti, olsonZoneRtti, -1n)
  assert.notEqual(z, 0n, id)
  const n = checked(countRules, z)
  const size = Buffer.alloc(4)
  size.writeInt32LE(n)
  const init = Buffer.alloc(8)
  const ruleBuf = Buffer.alloc(n * 8)
  checked(getRules, z, init, ruleBuf, size)
  assert.equal(size.readInt32LE(), n)
  const initial = init.readBigUInt64LE()
  assert.notEqual(initial, 0n, id)
  const base = raw(initial) + dst(initial)
  const all = [base]
  const events = []
  const annual = []
  for (let i = 0; i < n; i++) {
    const r = ruleBuf.readBigUInt64LE(i * 8)
    assert.notEqual(r, 0n, id)
    const o = raw(r) + dst(r)
    all.push(o)
    const a = dynamicCast(r, ruleRtti, arrayRtti, -1n)
    if (a !== 0n) {
      assert.equal(timeType(a), 2, 'finite rules must use UTC time')
      for (let j = 0; j < countTimes(a); j++) {
        assert.equal(getTime(a, j, dest), 1)
        const t = dest.readDoubleLE()
        assert.ok(Number.isSafeInteger(t))
        events.push([t, o])
      }
    } else {
      const ar = dynamicCast(r, ruleRtti, annualRtti, -1n)
      assert.notEqual(ar, 0n, id)
      annual.push({
        rule: ar,
        startYear: startYear(ar),
        endYear: endYear(ar),
        rawOffset: raw(ar),
        dstSavings: dst(ar),
      })
    }
  }
  assert.ok(
    all.every(o => Math.abs(o) < DAY),
    id
  )
  const extrema = [Math.min(...all), Math.max(...all)]
  const spread = extrema[1] - extrema[0]
  const row = {
    id,
    globalSpread: spread,
    extrema,
    finiteRuleStarts: events.length,
    annualRuleCount: annual.length,
  }
  const lastFinite = Math.max(0, ...events.map(([t]) => t))
  const maxAnnualYear = Math.max(1970, ...annual.map(rule => rule.startYear))
  const recurringYear =
    Math.max(maxAnnualYear, new Date(lastFinite).getUTCFullYear()) + 1
  const coveredThrough =
    direct && annual.length ? representativeThrough(recurringYear + 1) : null
  // Compare a complete 400-year recurrence or all adjacent-year signatures.
  const cut = annual.length
    ? coveredThrough === null
      ? Date.UTC(recurringYear + 401, 0, 1)
      : Date.UTC(coveredThrough + 2, 0, 1) + 9 * DAY
    : lastFinite + 3 * DAY
  assert.ok(Number.isSafeInteger(cut))
  assert.ok(annual.length === 0 || annual.length === 2, id)
  assert.ok(
    annual.every(rule => rule.endYear === 0x7fff_ffff),
    id
  )
  // The raw Olson history and finalStartMillis are potential changes even
  // where its transition API suppresses neutral historical/final joins.
  const tailStarts = [...new Set(annual.map(rule => rule.startYear))]
  assert.ok(tailStarts.length <= 1 && tailStarts.every(year => year >= 100))
  const candidateTimes = new Set([
    ...events.map(([t]) => t),
    ...tailStarts.map(year => Date.UTC(year, 0, 1)),
  ])
  const supplementalTimes = new Set()
  let minimumAnnualYearMargin = Infinity
  if (annualStart) {
    for (const [index, rule] of annual.entries()) {
      const previous = annual[1 - index]
      assert.equal(previous.rawOffset, rule.rawOffset, id)
      assert.ok(Math.abs(previous.rawOffset) < DAY, id)
      assert.ok(Math.abs(previous.dstSavings) < DAY, id)
      for (let year = rule.startYear; year <= coveredThrough + 1; year++) {
        assert.equal(
          annualStart(
            rule.rule,
            year,
            previous.rawOffset,
            previous.dstSavings,
            dest
          ),
          1,
          id
        )
        const time = dest.readDoubleLE()
        assert.ok(Number.isSafeInteger(time), id)
        const margin = Math.min(
          time - Date.UTC(year, 0, 1),
          Date.UTC(year + 1, 0, 1) - time
        )
        minimumAnnualYearMargin = Math.min(minimumAnnualYearMargin, margin)
        assert.ok(margin > 16 * DAY, id)
        candidateTimes.add(time)
        // SimpleTimeZone compares the same rule clock as AnnualTimeZoneRule.
        // An unshifted month length can alter its day computation near a
        // shifted month edge. Include the complete day and edge envelope.
        for (let day = -16; day <= 16; day++)
          supplementalTimes.add(time + day * DAY)
        for (let month = 0; month <= 12; month++) {
          const edge = Date.UTC(year, month, 1)
          supplementalTimes.add(edge)
          supplementalTimes.add(edge - previous.rawOffset)
          supplementalTimes.add(edge - previous.rawOffset - previous.dstSavings)
        }
      }
    }
  } else {
    const nextInstant = Buffer.alloc(8)
    checked(setMillis, c, firstRelevant)
    let t1 = firstRelevant - 1
    let direction = 1
    while (checked(transition, c, direction, nextInstant)) {
      const t = nextInstant.readDoubleLE()
      assert.ok(Number.isSafeInteger(t) && t > t1)
      if (t > cut) break
      direction = 0
      t1 = t
      candidateTimes.add(t)
      checked(setMillis, c, t)
    }
  }
  const short = []
  const wholeDayGaps = []
  const recurringStart =
    week && annual.length ? Date.UTC(recurringYear + 1, 0, 1) : Infinity
  const recurringEnd =
    week && annual.length ? Date.UTC(coveredThrough + 2, 0, 1) : Infinity
  const activeYears = new Set()
  let t0 = firstRelevant - 1
  let transitions = 0
  let minimum = Infinity
  const supplementalEffective = []
  const times = [...new Set([...candidateTimes, ...supplementalTimes])].sort(
    (a, b) => a - b
  )
  for (const [index, t] of times.entries()) {
    if (week) assert.ok(Number.isSafeInteger(t) && t % 1000 === 0, id)
    const supplemental = !candidateTimes.has(t)
    const recurring = t >= recurringStart && t < recurringEnd
    const check =
      supplemental ||
      !direct ||
      recurring ||
      spread >= DAY ||
      t - times[index - 1] <= spacing ||
      times[index + 1] - t <= spacing
    const before = check ? actual(c, t - 1) : undefined
    const after = check ? actual(c, t) : undefined
    if (check && before === after) continue
    if (recurring) activeYears.add(new Date(t).getUTCFullYear())
    if (supplemental) supplementalEffective.push({t, before, after})
    if (transitions) minimum = Math.min(minimum, t - t0)
    if (transitions && t - t0 <= spacing) short.push({t0, t, before, after})
    if (before !== undefined && after - before === DAY)
      wholeDayGaps.push({t, before, after})
    transitions++
    t0 = t
  }
  Object.assign(row, {
    lastFinite,
    ...(week
      ? {
          earliestFinite: events.length
            ? Math.min(...events.map(([time]) => time))
            : null,
          recurringYearsChecked: annual.length
            ? coveredThrough - recurringYear + 1
            : 0,
          recurringYearsWithTransitions: activeYears.size,
        }
      : {}),
    cut,
    recurringYear,
    ...(direct
      ? {coveredThrough, minimumAnnualYearMargin, supplementalEffective}
      : {}),
    transitions,
    minimum,
    short,
    wholeDayGaps,
    tailStarts,
    annualEnds: [...new Set(annual.map(rule => rule.endYear))],
  })
  rows.push(row)
  close(c)
}
lib.close()
console.log(
  JSON.stringify(
    {
      runtime: {node: process.version, icu: process.versions.icu, tz: version},
      binarySha256,
      ...(direct
        ? {
            annualEnumeration: 'direct signatures',
            eventCountsAreUpperBounds: true,
            minimumGapsAreLowerBounds: true,
            supplementalEffective: rows.flatMap(row =>
              row.supplementalEffective.map(event => ({zone: row.id, ...event}))
            ),
          }
        : {}),
      checkedSpacingMilliseconds: spacing,
      firstCoveredMilliseconds: firstRelevant,
      evaluatedEvents: rows.reduce((sum, row) => sum + row.transitions, 0),
      minGap: Math.min(
        ...rows.filter(row => row.minimum !== Infinity).map(row => row.minimum)
      ),
      minGapNames: rows
        .filter(
          row => row.minimum === Math.min(...rows.map(row => row.minimum))
        )
        .map(row => row.id),
      short: rows
        .filter(row => row.short.length)
        .map(row => [row.id, row.short]),
      annualEnds: [...new Set(rows.flatMap(row => row.annualEnds))],
      positiveWholeDayJumps: rows.flatMap(row =>
        row.wholeDayGaps.map(event => ({zone: row.id, ...event}))
      ),
      rows,
    },
    null,
    2
  )
)
