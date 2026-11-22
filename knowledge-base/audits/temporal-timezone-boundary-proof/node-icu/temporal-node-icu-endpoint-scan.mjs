import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {DynamicLibrary, toString} from 'node:ffi'
import {endianness} from 'node:os'

assert.equal(endianness(), 'LE', 'UChar buffers require little endian')
assert.equal(process.platform, 'linux')
assert.equal(process.arch, 'x64')
assert.deepEqual(process.execArgv, ['--experimental-ffi'])
for (const variable of [
  'NODE_ICU_DATA',
  'ICU_DATA',
  'ICU_TIMEZONE_FILES_DIR',
  'NODE_OPTIONS',
  'LD_PRELOAD',
  'LD_LIBRARY_PATH',
]) {
  assert.equal(process.env[variable], undefined, variable)
}
assert.equal(process.config.variables.icu_system, false)
assert.equal(process.config.variables.icu_small, false)
const icuMajor = process.versions.icu.split('.')[0]
const lib = new DynamicLibrary(null)
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
const basicZoneRtti = lib.getSymbol(`_ZTIN6icu_${icuMajor}13BasicTimeZoneE`)
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
const LIMIT = 8_640_000_000_000_000
const WINDOW = 2 * DAY
assert.ok(Number.isSafeInteger(LIMIT + WINDOW))
const locale = Buffer.from('en_US@calendar=gregorian\0')
const UCAL_GREGORIAN = 1
const UCAL_TZ_TRANSITION_NEXT = 0
const UCAL_TZ_TRANSITION_NEXT_INCLUSIVE = 1
const UCAL_ZONE_OFFSET = 15
const UCAL_DST_OFFSET = 16
const date = Buffer.alloc(8)
function scan(cal, lo, hi) {
  checked(setMillis, cal, lo)
  assert.equal(checked(getMillis, cal), lo, 'ICU changed the requested instant')
  const nearby = []
  let type = UCAL_TZ_TRANSITION_NEXT_INCLUSIVE
  let previous = lo - 1
  for (;;) {
    const found = checked(transition, cal, type, date)
    assert.ok(found === 0 || found === 1)
    if (!found) return {firstOutside: null, nearby}
    const at = date.readDoubleLE()
    assert.ok(
      Number.isSafeInteger(at) && at > previous,
      `Bad transition: ${at}`
    )
    if (at > hi) return {firstOutside: at, nearby}
    const offset = epoch => {
      checked(setMillis, cal, epoch)
      return (
        checked(get, cal, UCAL_ZONE_OFFSET) + checked(get, cal, UCAL_DST_OFFSET)
      )
    }
    nearby.push({at, before: offset(at - 1), after: offset(at)})
    previous = at
    type = UCAL_TZ_TRANSITION_NEXT
  }
}

const rows = []
const openedName = Buffer.alloc(256)
for (const id of zones) {
  const cal = checked(
    open,
    Buffer.from(id, 'utf16le'),
    id.length,
    locale,
    UCAL_GREGORIAN
  )
  assert.notEqual(cal, 0n, id)
  const idLength = checked(getID, cal, openedName, openedName.length / 2)
  assert.ok(idLength <= openedName.length / 2)
  assert.equal(openedName.subarray(0, 2 * idLength).toString('utf16le'), id)
  const zone = calendarZone(cal)
  assert.notEqual(dynamicCast(zone, timeZoneRtti, basicZoneRtti, -1n), 0n, id)
  assert.notEqual(dynamicCast(zone, timeZoneRtti, olsonZoneRtti, -1n), 0n, id)
  const result = {id}
  for (const limit of [-LIMIT, LIMIT]) {
    const key = limit < 0 ? 'lower' : 'upper'
    result[key] = scan(cal, limit - WINDOW, limit + WINDOW)
  }
  rows.push(result)
  if (id === 'America/New_York') {
    const knownFold = Date.UTC(2024, 10, 3, 6)
    assert.deepEqual(scan(cal, knownFold - 1, knownFold + 1).nearby, [
      {at: knownFold, before: -14_400_000, after: -18_000_000},
    ])
    assert.deepEqual(scan(cal, knownFold, knownFold).nearby, [
      {at: knownFold, before: -14_400_000, after: -18_000_000},
    ])
  }
  close(cal)
}
lib.close()
const failures = rows.flatMap(row =>
  ['lower', 'upper'].flatMap(key =>
    row[key].nearby
      .filter(event => event.after < event.before)
      .map(event => ({id: row.id, key, ...event}))
  )
)
console.log(
  JSON.stringify(
    {
      runtime: {node: process.version, icu: process.versions.icu, tz: version},
      binarySha256: createHash('sha256')
        .update(readFileSync(process.execPath))
        .digest('hex'),
      zones: n,
      openedIdentifierAndOlsonTimeZoneControls: n,
      windowMilliseconds: WINDOW,
      failures,
      rows,
    },
    null,
    2
  )
)
if (failures.length) process.exitCode = 1
