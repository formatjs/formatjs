import assert from 'node:assert/strict'
import {loadPinnedIcu} from './temporal-pinned-icu-runtime.mjs'

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
const WINDOW = 6 * DAY
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
      annual.push({startYear: startYear(ar), endYear: endYear(ar), offset: o})
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
  if (spread > DAY) {
    // The possibly large offset spread involves only historical rule
    // offsets. After the last absolute finite rule start, only the current
    // offset and recurring-rule offsets can occur.
    assert.ok(events.length > 0)
    const lastFinite = Math.max(...events.map(([t]) => t))
    assert.ok(firstRelevant < lastFinite)
    const future = [actual(c, lastFinite), ...annual.map(r => r.offset)]
    const tailSpread = Math.max(...future) - Math.min(...future)
    assert.ok(tailSpread <= DAY, id + ': tail spread')
    const cut = lastFinite + WINDOW
    const end = Buffer.alloc(8)
    const transitions = []
    checked(setMillis, c, firstRelevant)
    assert.equal(checked(getMillis, c), firstRelevant)
    let previous = firstRelevant - 1
    let direction = 1 // inclusive next at initial point
    while (checked(transition, c, direction, end)) {
      const t = end.readDoubleLE()
      assert.ok(Number.isSafeInteger(t) && t > previous)
      if (t > cut) break
      transitions.push({t, before: actual(c, t - 1), after: actual(c, t)})
      direction = 0 // exclusive next at this transition
      previous = t
    }
    let maxSpread = 0
    let left = 0
    for (let right = 0; right < transitions.length; right++) {
      const rightTime = transitions[right].t
      while (rightTime - transitions[left].t > WINDOW) left++
      const offsets = transitions
        .slice(left, right + 1)
        .flatMap(e => [e.before, e.after])
      const spread = Math.max(...offsets) - Math.min(...offsets)
      maxSpread = Math.max(spread, maxSpread)
    }
    assert.ok(maxSpread <= DAY, id + ': historical spread')
    Object.assign(row, {
      lastFinite,
      tailSpread,
      historicalWindowsThrough: cut,
      historicalTransitions: transitions.length,
      historicalMaxSpread: maxSpread,
    })
  }
  rows.push(row)
  close(c)
}
lib.close()
console.log(
  JSON.stringify(
    {
      runtime: {node: process.version, icu: process.versions.icu, tz: version},
      binarySha256,
      windowMilliseconds: WINDOW,
      firstCoveredMilliseconds: firstRelevant,
      historicalZones: rows.filter(v => v.globalSpread > DAY).length,
      maximumCertifiedSpread: Math.max(
        ...rows.map(v =>
          v.historicalMaxSpread === undefined
            ? v.globalSpread
            : Math.max(v.historicalMaxSpread, v.tailSpread)
        )
      ),
      rows,
    },
    null,
    2
  )
)
